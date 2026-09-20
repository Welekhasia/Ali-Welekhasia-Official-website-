/**
 * Tracks REST API Endpoints
 * Cloudflare D1 Parameterized Queries + R2 Streaming Integration
 */

import { jsonResponse, errorResponse, getCorsHeaders } from '../utils/response.js';
import { verifyAdmin, sanitizeId, slugify, logAudit, hashIp } from '../utils/security.js';
import { streamAudioObject } from '../services/streamingService.js';

export async function handleTracks(request, env, pathParts) {
    const method = request.method;
    const cors = getCorsHeaders(request, env);
    const db = env.DB;

    if (!db) {
        return errorResponse('DATABASE_UNAVAILABLE', 'D1 Database binding (env.DB) is not configured.', 500, null, cors);
    }

    const url = new URL(request.url);

    // 1. GET /api/tracks - List Tracks
    if (pathParts.length === 0 && method === 'GET') {
        const isAdmin = verifyAdmin(request, env);
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20));
        const offset = (page - 1) * limit;

        const q = url.searchParams.get('q') ? `%${url.searchParams.get('q').trim().toLowerCase()}%` : null;
        const genre = url.searchParams.get('genre') || null;
        const artistId = url.searchParams.get('artistId') || null;
        const albumId = url.searchParams.get('albumId') || null;
        const statusFilter = url.searchParams.get('status') || null;

        let whereClauses = [];
        let params = [];

        // Public visibility restriction
        if (!isAdmin || statusFilter === 'published') {
            whereClauses.push("t.is_published = 1 AND t.visibility = 'public'");
        } else if (statusFilter === 'draft') {
            whereClauses.push("t.is_published = 0");
        }

        if (q) {
            whereClauses.push("(LOWER(t.title) LIKE ? OR LOWER(t.description) LIKE ? OR LOWER(t.genre) LIKE ?)");
            params.push(q, q, q);
        }
        if (genre) {
            whereClauses.push("LOWER(t.genre) = LOWER(?)");
            params.push(genre);
        }
        if (artistId) {
            whereClauses.push("t.artist_id = ?");
            params.push(artistId);
        }
        if (albumId) {
            whereClauses.push("t.album_id = ?");
            params.push(albumId);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Query total count
        const countQuery = `SELECT COUNT(*) AS total FROM tracks t ${whereSql}`;
        const countStmt = db.prepare(countQuery);
        const totalRow = params.length > 0 ? await countStmt.bind(...params).first() : await countStmt.first();
        const total = totalRow ? totalRow.total : 0;

        // Query paginated items with artist name
        const selectQuery = `
            SELECT t.id, t.artist_id, t.album_id, t.title, t.slug, t.description,
                   t.genre, t.language, t.duration, t.file_size, t.mime_type,
                   t.r2_key, t.artwork_key, t.preview_key, t.is_published, t.visibility,
                   t.price, t.currency, t.play_count, t.download_count,
                   t.created_at, t.published_at,
                   a.name AS artist_name, alb.title AS album_title
            FROM tracks t
            LEFT JOIN artists a ON t.artist_id = a.id
            LEFT JOIN albums alb ON t.album_id = alb.id
            ${whereSql}
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const queryParams = [...params, limit, offset];
        const rows = await db.prepare(selectQuery).bind(...queryParams).all();

        const origin = url.origin;
        const tracks = (rows.results || []).map(t => ({
            ...t,
            stream_url: `${origin}/api/tracks/${t.id}/audio`,
            is_published: Boolean(t.is_published)
        }));

        return jsonResponse({
            success: true,
            tracks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 200, cors);
    }

    // 2. POST /api/tracks - Admin Create Track Metadata
    if (pathParts.length === 0 && method === 'POST') {
        if (!verifyAdmin(request, env)) {
            return errorResponse('UNAUTHORIZED', 'Administrator privileges required to create tracks.', 401, null, cors);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return errorResponse('INVALID_JSON', 'Malformed JSON payload in request body.', 400, null, cors);
        }

        const { title, artist_id = 'artist_ali_welekhasia', album_id = null, description = '', genre = 'Gospel', language = 'Swahili', price = 100.0, is_published = 0, visibility = 'public' } = body;

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return errorResponse('VALIDATION_ERROR', 'Field "title" is required.', 400, null, cors);
        }

        const id = `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let baseSlug = slugify(title);
        if (!baseSlug) baseSlug = id;

        // Check slug collision
        let finalSlug = baseSlug;
        const existing = await db.prepare("SELECT id FROM tracks WHERE slug = ?").bind(finalSlug).first();
        if (existing) {
            finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        const defaultR2Key = `tracks/${id}/original.mp3`;

        await db.prepare(`
            INSERT INTO tracks (
                id, artist_id, album_id, title, slug, description,
                genre, language, mime_type, r2_key, is_published, visibility,
                price, currency, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'KES', datetime('now'), datetime('now'))
        `).bind(
            id,
            artist_id,
            album_id,
            title.trim(),
            finalSlug,
            description,
            genre,
            language,
            'audio/mpeg',
            defaultR2Key,
            is_published ? 1 : 0,
            visibility,
            price
        ).run();

        const ipHash = await hashIp(request);
        await logAudit(db, {
            action: 'TRACK_CREATED',
            entityType: 'track',
            entityId: id,
            details: { title, slug: finalSlug },
            ipHash
        });

        const created = await db.prepare("SELECT * FROM tracks WHERE id = ?").bind(id).first();

        return jsonResponse({
            success: true,
            track: created,
            message: 'Track metadata initialized. Upload audio file to complete track setup.'
        }, 201, cors);
    }

    // 3. Routes with :id (e.g. /api/tracks/:id or /api/tracks/:id/audio)
    const trackIdOrSlug = sanitizeId(pathParts[0]);
    if (!trackIdOrSlug) {
        return errorResponse('INVALID_IDENTIFIER', 'Invalid track ID or slug specified.', 400, null, cors);
    }

    // Look up track in D1 (by id or slug)
    const track = await db.prepare(`
        SELECT t.*, a.name AS artist_name, alb.title AS album_title
        FROM tracks t
        LEFT JOIN artists a ON t.artist_id = a.id
        LEFT JOIN albums alb ON t.album_id = alb.id
        WHERE t.id = ? OR t.slug = ?
    `).bind(trackIdOrSlug, trackIdOrSlug).first();

    if (!track) {
        return errorResponse('TRACK_NOT_FOUND', `Track '${trackIdOrSlug}' was not found.`, 404, null, cors);
    }

    // 4. GET & HEAD /api/tracks/:id/audio - Audio Streaming
    if (pathParts.length === 2 && pathParts[1] === 'audio') {
        if (method !== 'GET' && method !== 'HEAD') {
            return errorResponse('METHOD_NOT_ALLOWED', `Method ${method} not allowed on audio stream.`, 405, null, cors);
        }

        // Authorization check: if track is unpublished or private, require admin
        if (!track.is_published || track.visibility === 'private') {
            if (!verifyAdmin(request, env)) {
                return errorResponse('FORBIDDEN', 'This track is private or unpublished.', 403, null, cors);
            }
        }

        // Increment play count on full GET request (non-range or initial byte range)
        if (method === 'GET') {
            const range = request.headers.get('Range');
            if (!range || range.startsWith('bytes=0-')) {
                // Non-blocking fire-and-forget play count increment
                env.DB.prepare("UPDATE tracks SET play_count = play_count + 1 WHERE id = ?").bind(track.id).run().catch(() => {});
            }
        }

        return await streamAudioObject(request, env, track.r2_key, track);
    }

    // 5. GET /api/tracks/:id - Get Single Track Details
    if (pathParts.length === 1 && method === 'GET') {
        const isAdmin = verifyAdmin(request, env);
        if (!track.is_published && !isAdmin) {
            return errorResponse('FORBIDDEN', 'This track is currently unpublished.', 403, null, cors);
        }

        return jsonResponse({
            success: true,
            track: {
                ...track,
                stream_url: `${url.origin}/api/tracks/${track.id}/audio`,
                is_published: Boolean(track.is_published)
            }
        }, 200, cors);
    }

    // 6. PUT /api/tracks/:id - Update Track Metadata
    if (pathParts.length === 1 && method === 'PUT') {
        if (!verifyAdmin(request, env)) {
            return errorResponse('UNAUTHORIZED', 'Administrator privileges required to update tracks.', 401, null, cors);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return errorResponse('INVALID_JSON', 'Malformed JSON payload in request body.', 400, null, cors);
        }

        const updates = [];
        const bindings = [];

        if (body.title !== undefined) {
            updates.push("title = ?");
            bindings.push(body.title.trim());
        }
        if (body.description !== undefined) {
            updates.push("description = ?");
            bindings.push(body.description);
        }
        if (body.genre !== undefined) {
            updates.push("genre = ?");
            bindings.push(body.genre);
        }
        if (body.language !== undefined) {
            updates.push("language = ?");
            bindings.push(body.language);
        }
        if (body.price !== undefined) {
            updates.push("price = ?");
            bindings.push(Number(body.price));
        }
        if (body.is_published !== undefined) {
            updates.push("is_published = ?");
            const isPub = body.is_published ? 1 : 0;
            bindings.push(isPub);
            if (isPub && !track.published_at) {
                updates.push("published_at = datetime('now')");
            }
        }
        if (body.visibility !== undefined) {
            updates.push("visibility = ?");
            bindings.push(body.visibility);
        }
        if (body.artwork_key !== undefined) {
            updates.push("artwork_key = ?");
            bindings.push(body.artwork_key);
        }

        if (updates.length === 0) {
            return errorResponse('NO_UPDATES', 'No valid track fields provided to update.', 400, null, cors);
        }

        updates.push("updated_at = datetime('now')");
        bindings.push(track.id);

        const updateSql = `UPDATE tracks SET ${updates.join(', ')} WHERE id = ?`;
        await db.prepare(updateSql).bind(...bindings).run();

        const ipHash = await hashIp(request);
        await logAudit(db, {
            action: 'TRACK_UPDATED',
            entityType: 'track',
            entityId: track.id,
            details: body,
            ipHash
        });

        const updated = await db.prepare("SELECT * FROM tracks WHERE id = ?").bind(track.id).first();

        return jsonResponse({
            success: true,
            track: updated,
            message: 'Track updated successfully.'
        }, 200, cors);
    }

    // 7. DELETE /api/tracks/:id - Safe Track & R2 Object Deletion Workflow
    if (pathParts.length === 1 && method === 'DELETE') {
        if (!verifyAdmin(request, env)) {
            return errorResponse('UNAUTHORIZED', 'Administrator privileges required to delete tracks.', 401, null, cors);
        }

        const bucket = env.BUCKET || env.R2_BUCKET;

        // 1. Remove R2 object if exists
        if (bucket && track.r2_key) {
            try {
                await bucket.delete(track.r2_key);
            } catch (err) {
                console.error(`[DELETE /api/tracks] Notice: R2 object deletion failed for ${track.r2_key}:`, err.message);
            }
        }

        // 2. Remove from playlists and tracks tables in D1 batch
        await db.batch([
            db.prepare("DELETE FROM playlist_tracks WHERE track_id = ?").bind(track.id),
            db.prepare("DELETE FROM tracks WHERE id = ?").bind(track.id)
        ]);

        const ipHash = await hashIp(request);
        await logAudit(db, {
            action: 'TRACK_DELETED',
            entityType: 'track',
            entityId: track.id,
            details: { title: track.title, r2_key: track.r2_key },
            ipHash
        });

        return jsonResponse({
            success: true,
            message: `Track '${track.title}' and associated storage assets deleted successfully.`
        }, 200, cors);
    }

    return errorResponse('METHOD_NOT_ALLOWED', `Method ${method} not allowed on this route.`, 405, null, cors);
}
