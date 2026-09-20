/**
 * Playlists REST API Endpoints
 * Cloudflare D1 Relational Junction Operations
 */

import { jsonResponse, errorResponse, getCorsHeaders } from '../utils/response.js';
import { sanitizeId, slugify } from '../utils/security.js';

export async function handlePlaylists(request, env, pathParts) {
    const method = request.method;
    const cors = getCorsHeaders(request, env);
    const db = env.DB;

    if (!db) {
        return errorResponse('DATABASE_UNAVAILABLE', 'D1 Database binding is missing.', 500, null, cors);
    }

    // 1. GET /api/playlists
    if (pathParts.length === 0 && method === 'GET') {
        const rows = await db.prepare("SELECT * FROM playlists WHERE is_public = 1 ORDER BY created_at DESC").all();
        return jsonResponse({
            success: true,
            playlists: rows.results || []
        }, 200, cors);
    }

    // 2. POST /api/playlists
    if (pathParts.length === 0 && method === 'POST') {
        let body;
        try {
            body = await request.json();
        } catch {
            return errorResponse('INVALID_JSON', 'Malformed JSON.', 400, null, cors);
        }

        const { title, description = '', user_id = 'user_public', is_public = 1 } = body;
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return errorResponse('VALIDATION_ERROR', 'Playlist title is required.', 400, null, cors);
        }

        const id = `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const slug = slugify(title) || id;

        await db.prepare(`
            INSERT INTO playlists (id, user_id, title, slug, description, is_public, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(id, user_id, title.trim(), slug, description, is_public ? 1 : 0).run();

        const created = await db.prepare("SELECT * FROM playlists WHERE id = ?").bind(id).first();
        return jsonResponse({ success: true, playlist: created }, 201, cors);
    }

    // 3. Routes with :id
    const playlistId = sanitizeId(pathParts[0]);
    if (!playlistId) {
        return errorResponse('INVALID_IDENTIFIER', 'Invalid playlist ID.', 400, null, cors);
    }

    const playlist = await db.prepare("SELECT * FROM playlists WHERE id = ? OR slug = ?").bind(playlistId, playlistId).first();
    if (!playlist) {
        return errorResponse('PLAYLIST_NOT_FOUND', 'Playlist not found.', 404, null, cors);
    }

    // GET /api/playlists/:id
    if (pathParts.length === 1 && method === 'GET') {
        const tracks = await db.prepare(`
            SELECT t.id, t.title, t.slug, t.duration, t.genre, pt.position, pt.added_at
            FROM playlist_tracks pt
            JOIN tracks t ON pt.track_id = t.id
            WHERE pt.playlist_id = ?
            ORDER BY pt.position ASC
        `).bind(playlist.id).all();

        return jsonResponse({
            success: true,
            playlist,
            tracks: tracks.results || []
        }, 200, cors);
    }

    // POST /api/playlists/:id/tracks - Add track
    if (pathParts.length === 2 && pathParts[1] === 'tracks' && method === 'POST') {
        let body;
        try {
            body = await request.json();
        } catch {
            return errorResponse('INVALID_JSON', 'Malformed JSON.', 400, null, cors);
        }

        const { track_id } = body;
        const cleanTrackId = sanitizeId(track_id);
        if (!cleanTrackId) {
            return errorResponse('VALIDATION_ERROR', 'Valid track_id is required.', 400, null, cors);
        }

        // Verify track exists
        const track = await db.prepare("SELECT id FROM tracks WHERE id = ?").bind(cleanTrackId).first();
        if (!track) {
            return errorResponse('TRACK_NOT_FOUND', 'Track does not exist.', 404, null, cors);
        }

        // Determine next position
        const posRow = await db.prepare("SELECT MAX(position) AS max_pos FROM playlist_tracks WHERE playlist_id = ?").bind(playlist.id).first();
        const nextPos = (posRow && posRow.max_pos !== null) ? posRow.max_pos + 1 : 1;

        await db.prepare(`
            INSERT OR REPLACE INTO playlist_tracks (playlist_id, track_id, position, added_at)
            VALUES (?, ?, ?, datetime('now'))
        `).bind(playlist.id, track.id, nextPos).run();

        return jsonResponse({
            success: true,
            message: 'Track added to playlist successfully.',
            position: nextPos
        }, 201, cors);
    }

    // DELETE /api/playlists/:id/tracks/:trackId - Remove track
    if (pathParts.length === 3 && pathParts[1] === 'tracks' && method === 'DELETE') {
        const trackId = sanitizeId(pathParts[2]);
        if (!trackId) {
            return errorResponse('INVALID_IDENTIFIER', 'Invalid track ID.', 400, null, cors);
        }

        await db.prepare("DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?").bind(playlist.id, trackId).run();
        return jsonResponse({ success: true, message: 'Track removed from playlist.' }, 200, cors);
    }

    return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed on playlist route.', 405, null, cors);
}
