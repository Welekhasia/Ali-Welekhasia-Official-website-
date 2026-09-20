/**
 * Secure Audio Upload Pipeline
 * Cloudflare R2 + D1 Atomic Reconciliation Workflow
 */

import { jsonResponse, errorResponse, getCorsHeaders } from '../utils/response.js';
import { verifyAdmin, sanitizeId, slugify, logAudit, hashIp } from '../utils/security.js';
import { validateAudioUpload } from '../services/audioValidator.js';

export async function handleUploads(request, env, pathParts) {
    const cors = getCorsHeaders(request, env);
    const method = request.method;

    if (method !== 'POST') {
        return errorResponse('METHOD_NOT_ALLOWED', 'Only POST is supported for uploads.', 405, null, cors);
    }

    if (!verifyAdmin(request, env)) {
        return errorResponse('UNAUTHORIZED', 'Administrator privileges required to upload audio.', 401, null, cors);
    }

    const bucket = env.BUCKET || env.R2_BUCKET;
    if (!bucket) {
        return errorResponse('STORAGE_UNAVAILABLE', 'R2 Object Storage binding is missing.', 500, null, cors);
    }

    const db = env.DB;
    if (!db) {
        return errorResponse('DATABASE_UNAVAILABLE', 'D1 Database binding is missing.', 500, null, cors);
    }

    const contentTypeHeader = request.headers.get('content-type') || '';
    let fileBuffer = null;
    let declaredMime = '';
    let originalFilename = '';
    let trackId = request.headers.get('x-track-id') || null;
    let trackTitle = request.headers.get('x-track-title') || null;

    // 1. Parse Multipart or Binary Body
    if (contentTypeHeader.includes('multipart/form-data')) {
        let formData;
        try {
            formData = await request.formData();
        } catch (err) {
            return errorResponse('MALFORMED_FORM_DATA', 'Could not parse multipart form data: ' + err.message, 400, null, cors);
        }

        const file = formData.get('file') || formData.get('audio');
        if (!file || typeof file === 'string') {
            return errorResponse('FILE_MISSING', 'Form data missing file field (expected "file" or "audio").', 400, null, cors);
        }

        fileBuffer = await file.arrayBuffer();
        declaredMime = file.type || '';
        originalFilename = file.name || 'track.mp3';
        if (!trackId) trackId = formData.get('trackId') || formData.get('track_id');
        if (!trackTitle) trackTitle = formData.get('title');
    } else {
        // Direct stream or binary upload
        fileBuffer = await request.arrayBuffer();
        declaredMime = contentTypeHeader.split(';')[0].trim();
        originalFilename = request.headers.get('x-filename') || 'track.mp3';
    }

    if (!fileBuffer || fileBuffer.byteLength === 0) {
        return errorResponse('EMPTY_FILE', 'Uploaded audio buffer is empty.', 400, null, cors);
    }

    // 2. Validate Magic Bytes and Audio Signature
    const validation = validateAudioUpload(fileBuffer, declaredMime, originalFilename);
    if (!validation.valid) {
        return errorResponse('INVALID_AUDIO_FORMAT', validation.error, 415, null, cors);
    }

    // 3. Resolve or Create Track Record in D1
    let track = null;
    if (trackId) {
        const cleanId = sanitizeId(trackId);
        track = await db.prepare("SELECT * FROM tracks WHERE id = ?").bind(cleanId).first();
        if (!track) {
            return errorResponse('TRACK_NOT_FOUND', `Target track '${cleanId}' not found.`, 404, null, cors);
        }
    } else {
        // Automatically create track record if title is provided
        const title = (trackTitle || originalFilename.replace(/\.[^/.]+$/, "") || "Untitled Worship Track").trim();
        const newTrackId = `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let baseSlug = slugify(title) || newTrackId;

        const existingSlug = await db.prepare("SELECT id FROM tracks WHERE slug = ?").bind(baseSlug).first();
        if (existingSlug) {
            baseSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        const defaultKey = `tracks/${newTrackId}/original.${validation.extension}`;

        await db.prepare(`
            INSERT INTO tracks (
                id, artist_id, title, slug, mime_type, r2_key,
                file_size, is_published, visibility, created_at, updated_at
            ) VALUES (?, 'artist_ali_welekhasia', ?, ?, ?, ?, ?, 0, 'public', datetime('now'), datetime('now'))
        `).bind(
            newTrackId,
            title,
            baseSlug,
            validation.mimeType,
            defaultKey,
            validation.fileSize
        ).run();

        track = await db.prepare("SELECT * FROM tracks WHERE id = ?").bind(newTrackId).first();
    }

    // 4. Controlled R2 Object Key Generation
    // Folder prefix ensures logical organization in existing bucket: tracks/{trackId}/original.{ext}
    const r2Key = `tracks/${track.id}/original.${validation.extension}`;

    // 5. Upload to Cloudflare R2 with HTTP Metadata
    try {
        await bucket.put(r2Key, fileBuffer, {
            httpMetadata: {
                contentType: validation.mimeType,
                cacheControl: 'public, max-age=86400, s-maxage=604800'
            },
            customMetadata: {
                trackId: track.id,
                uploadedBy: 'ali_admin',
                format: validation.format,
                originalFilename
            }
        });
    } catch (err) {
        console.error('[Upload] R2 put failed:', err);
        return errorResponse('R2_UPLOAD_FAILED', 'Failed to write audio object to Cloudflare R2: ' + err.message, 500, null, cors);
    }

    // 6. Update D1 Metadata with Authoritative File Attributes
    try {
        await db.prepare(`
            UPDATE tracks
            SET r2_key = ?, mime_type = ?, file_size = ?, updated_at = datetime('now')
            WHERE id = ?
        `).bind(r2Key, validation.mimeType, validation.fileSize, track.id).run();
    } catch (err) {
        // Reconciliation: If D1 update fails, delete orphaned R2 object
        console.error('[Upload] D1 update failed, rolling back R2 object:', err);
        await bucket.delete(r2Key).catch(() => {});
        return errorResponse('METADATA_PERSISTENCE_FAILED', 'Failed to update track metadata in D1: ' + err.message, 500, null, cors);
    }

    // 7. Record Structured Audit Event
    const ipHash = await hashIp(request);
    await logAudit(db, {
        action: 'AUDIO_UPLOADED',
        entityType: 'track',
        entityId: track.id,
        details: {
            r2_key: r2Key,
            size_bytes: validation.fileSize,
            format: validation.format,
            mime_type: validation.mimeType
        },
        ipHash
    });

    const updatedTrack = await db.prepare("SELECT * FROM tracks WHERE id = ?").bind(track.id).first();
    const origin = new URL(request.url).origin;

    return jsonResponse({
        success: true,
        message: 'Audio master file uploaded and bound to track successfully.',
        track: {
            ...updatedTrack,
            stream_url: `${origin}/api/tracks/${track.id}/audio`
        },
        storage: {
            bucket: 'ali-music-audio',
            key: r2Key,
            size_bytes: validation.fileSize,
            format: validation.format,
            mime_type: validation.mimeType
        }
    }, 201, cors);
}
