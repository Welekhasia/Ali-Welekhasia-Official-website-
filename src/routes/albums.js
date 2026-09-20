/**
 * Albums REST API Endpoints
 * Cloudflare D1 Parameterized Database Operations
 */

import { jsonResponse, errorResponse, getCorsHeaders } from '../utils/response.js';
import { verifyAdmin, sanitizeId, slugify, logAudit, hashIp } from '../utils/security.js';

export async function handleAlbums(request, env, pathParts) {
    const method = request.method;
    const cors = getCorsHeaders(request, env);
    const db = env.DB;

    if (!db) {
        return errorResponse('DATABASE_UNAVAILABLE', 'D1 Database binding is missing.', 500, null, cors);
    }

    // 1. GET /api/albums
    if (pathParts.length === 0 && method === 'GET') {
        const isAdmin = verifyAdmin(request, env);
        const query = isAdmin
            ? "SELECT a.*, art.name AS artist_name FROM albums a LEFT JOIN artists art ON a.artist_id = art.id ORDER BY a.created_at DESC"
            : "SELECT a.*, art.name AS artist_name FROM albums a LEFT JOIN artists art ON a.artist_id = art.id WHERE a.is_published = 1 ORDER BY a.created_at DESC";

        const rows = await db.prepare(query).all();
        return jsonResponse({
            success: true,
            albums: (rows.results || []).map(alb => ({ ...alb, is_published: Boolean(alb.is_published) }))
        }, 200, cors);
    }

    // 2. POST /api/albums
    if (pathParts.length === 0 && method === 'POST') {
        if (!verifyAdmin(request, env)) {
            return errorResponse('UNAUTHORIZED', 'Admin privileges required.', 401, null, cors);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return errorResponse('INVALID_JSON', 'Malformed JSON body.', 400, null, cors);
        }

        const { title, artist_id = 'artist_ali_welekhasia', description = '', release_date = null, genre = 'Gospel', is_published = 0 } = body;
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return errorResponse('VALIDATION_ERROR', 'Album title is required.', 400, null, cors);
        }

        const id = `album_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let baseSlug = slugify(title) || id;

        const existing = await db.prepare("SELECT id FROM albums WHERE slug = ?").bind(baseSlug).first();
        if (existing) {
            baseSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        await db.prepare(`
            INSERT INTO albums (id, artist_id, title, slug, description, release_date, genre, is_published, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(id, artist_id, title.trim(), baseSlug, description, release_date, genre, is_published ? 1 : 0).run();

        const ipHash = await hashIp(request);
        await logAudit(db, {
            action: 'ALBUM_CREATED',
            entityType: 'album',
            entityId: id,
            details: { title, slug: baseSlug },
            ipHash
        });

        const created = await db.prepare("SELECT * FROM albums WHERE id = ?").bind(id).first();
        return jsonResponse({ success: true, album: created }, 201, cors);
    }

    // 3. Routes with :id
    const albumIdOrSlug = sanitizeId(pathParts[0]);
    if (!albumIdOrSlug) {
        return errorResponse('INVALID_IDENTIFIER', 'Invalid album ID or slug.', 400, null, cors);
    }

    const album = await db.prepare("SELECT a.*, art.name AS artist_name FROM albums a LEFT JOIN artists art ON a.artist_id = art.id WHERE a.id = ? OR a.slug = ?").bind(albumIdOrSlug, albumIdOrSlug).first();
    if (!album) {
        return errorResponse('ALBUM_NOT_FOUND', `Album '${albumIdOrSlug}' not found.`, 404, null, cors);
    }

    // GET /api/albums/:id
    if (pathParts.length === 1 && method === 'GET') {
        const isAdmin = verifyAdmin(request, env);
        if (!album.is_published && !isAdmin) {
            return errorResponse('FORBIDDEN', 'This album is not yet published.', 403, null, cors);
        }

        const tracks = await db.prepare(`
            SELECT id, title, slug, duration, play_count, is_published
            FROM tracks
            WHERE album_id = ? AND (is_published = 1 OR ?)
            ORDER BY created_at ASC
        `).bind(album.id, isAdmin ? 1 : 0).all();

        return jsonResponse({
            success: true,
            album: { ...album, is_published: Boolean(album.is_published) },
            tracks: tracks.results || []
        }, 200, cors);
    }

    // PUT /api/albums/:id
    if (pathParts.length === 1 && method === 'PUT') {
        if (!verifyAdmin(request, env)) {
            return errorResponse('UNAUTHORIZED', 'Admin privileges required.', 401, null, cors);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return errorResponse('INVALID_JSON', 'Malformed JSON.', 400, null, cors);
        }

        const updates = [];
        const bindings = [];

        if (body.title) {
            updates.push("title = ?");
            bindings.push(body.title.trim());
        }
        if (body.description !== undefined) {
            updates.push("description = ?");
            bindings.push(body.description);
        }
        if (body.release_date !== undefined) {
            updates.push("release_date = ?");
            bindings.push(body.release_date);
        }
        if (body.genre !== undefined) {
            updates.push("genre = ?");
            bindings.push(body.genre);
        }
        if (body.is_published !== undefined) {
            updates.push("is_published = ?");
            bindings.push(body.is_published ? 1 : 0);
        }

        if (updates.length === 0) {
            return errorResponse('NO_UPDATES', 'No valid updates provided.', 400, null, cors);
        }

        updates.push("updated_at = datetime('now')");
        bindings.push(album.id);

        await db.prepare(`UPDATE albums SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
        const updated = await db.prepare("SELECT * FROM albums WHERE id = ?").bind(album.id).first();
        return jsonResponse({ success: true, album: updated }, 200, cors);
    }

    // DELETE /api/albums/:id
    if (pathParts.length === 1 && method === 'DELETE') {
        if (!verifyAdmin(request, env)) {
            return errorResponse('UNAUTHORIZED', 'Admin privileges required.', 401, null, cors);
        }

        await db.prepare("DELETE FROM albums WHERE id = ?").bind(album.id).run();
        return jsonResponse({ success: true, message: `Album '${album.title}' deleted.` }, 200, cors);
    }

    return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed on album route.', 405, null, cors);
}
