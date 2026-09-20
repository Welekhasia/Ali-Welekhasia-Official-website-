/**
 * Artists REST API Endpoints
 * Cloudflare D1 Parameterized Database Operations
 */

import { jsonResponse, errorResponse, getCorsHeaders } from '../utils/response.js';
import { verifyAdmin, sanitizeId, slugify, logAudit, hashIp } from '../utils/security.js';

export async function handleArtists(request, env, pathParts) {
    const method = request.method;
    const cors = getCorsHeaders(request, env);
    const db = env.DB;

    if (!db) {
        return errorResponse('DATABASE_UNAVAILABLE', 'D1 Database binding is missing.', 500, null, cors);
    }

    // 1. GET /api/artists - List Artists
    if (pathParts.length === 0 && method === 'GET') {
        const rows = await db.prepare("SELECT * FROM artists ORDER BY name ASC").all();
        return jsonResponse({
            success: true,
            artists: rows.results || []
        }, 200, cors);
    }

    // 2. POST /api/artists - Admin Create Artist
    if (pathParts.length === 0 && method === 'POST') {
        if (!verifyAdmin(request, env)) {
            return errorResponse('UNAUTHORIZED', 'Admin privileges required.', 401, null, cors);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return errorResponse('INVALID_JSON', 'Malformed JSON payload.', 400, null, cors);
        }

        const { name, bio = '', avatar_url = null, website = null } = body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return errorResponse('VALIDATION_ERROR', 'Artist name is required.', 400, null, cors);
        }

        const id = `artist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let baseSlug = slugify(name) || id;

        const existing = await db.prepare("SELECT id FROM artists WHERE slug = ?").bind(baseSlug).first();
        if (existing) {
            baseSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        await db.prepare(`
            INSERT INTO artists (id, name, slug, bio, avatar_url, website, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(id, name.trim(), baseSlug, bio, avatar_url, website).run();

        const ipHash = await hashIp(request);
        await logAudit(db, {
            action: 'ARTIST_CREATED',
            entityType: 'artist',
            entityId: id,
            details: { name, slug: baseSlug },
            ipHash
        });

        const created = await db.prepare("SELECT * FROM artists WHERE id = ?").bind(id).first();
        return jsonResponse({ success: true, artist: created }, 201, cors);
    }

    // 3. Routes with :id
    const artistIdOrSlug = sanitizeId(pathParts[0]);
    if (!artistIdOrSlug) {
        return errorResponse('INVALID_IDENTIFIER', 'Invalid artist ID or slug.', 400, null, cors);
    }

    const artist = await db.prepare("SELECT * FROM artists WHERE id = ? OR slug = ?").bind(artistIdOrSlug, artistIdOrSlug).first();
    if (!artist) {
        return errorResponse('ARTIST_NOT_FOUND', `Artist '${artistIdOrSlug}' not found.`, 404, null, cors);
    }

    // GET /api/artists/:id
    if (pathParts.length === 1 && method === 'GET') {
        const tracks = await db.prepare(`
            SELECT id, title, slug, genre, duration, is_published, created_at
            FROM tracks
            WHERE artist_id = ? AND is_published = 1 AND visibility = 'public'
            ORDER BY created_at DESC
        `).bind(artist.id).all();

        return jsonResponse({
            success: true,
            artist,
            tracks: tracks.results || []
        }, 200, cors);
    }

    // PUT /api/artists/:id
    if (pathParts.length === 1 && method === 'PUT') {
        if (!verifyAdmin(request, env)) {
            return errorResponse('UNAUTHORIZED', 'Admin privileges required.', 401, null, cors);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return errorResponse('INVALID_JSON', 'Malformed JSON payload.', 400, null, cors);
        }

        const updates = [];
        const bindings = [];

        if (body.name) {
            updates.push("name = ?");
            bindings.push(body.name.trim());
        }
        if (body.bio !== undefined) {
            updates.push("bio = ?");
            bindings.push(body.bio);
        }
        if (body.avatar_url !== undefined) {
            updates.push("avatar_url = ?");
            bindings.push(body.avatar_url);
        }
        if (body.website !== undefined) {
            updates.push("website = ?");
            bindings.push(body.website);
        }

        if (updates.length === 0) {
            return errorResponse('NO_UPDATES', 'No valid updates provided.', 400, null, cors);
        }

        updates.push("updated_at = datetime('now')");
        bindings.push(artist.id);

        await db.prepare(`UPDATE artists SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();

        const updated = await db.prepare("SELECT * FROM artists WHERE id = ?").bind(artist.id).first();
        return jsonResponse({ success: true, artist: updated }, 200, cors);
    }

    // DELETE /api/artists/:id
    if (pathParts.length === 1 && method === 'DELETE') {
        if (!verifyAdmin(request, env)) {
            return errorResponse('UNAUTHORIZED', 'Admin privileges required.', 401, null, cors);
        }

        await db.prepare("DELETE FROM artists WHERE id = ?").bind(artist.id).run();
        return jsonResponse({ success: true, message: `Artist '${artist.name}' deleted.` }, 200, cors);
    }

    return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed on artist route.', 405, null, cors);
}
