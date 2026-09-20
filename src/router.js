/**
 * Ali Welekhasia Cloudflare Music Backend - Central Request Router
 * Routes HTTP requests to modular handlers across Workers & Pages Functions
 */

import { getCorsHeaders, errorResponse } from './utils/response.js';
import { handleHealth } from './routes/health.js';
import { handleTracks } from './routes/tracks.js';
import { handleUploads } from './routes/uploads.js';
import { handleArtists } from './routes/artists.js';
import { handleAlbums } from './routes/albums.js';
import { handlePlaylists } from './routes/playlists.js';

export async function handleRequest(request, env, ctx) {
    const corsHeaders = getCorsHeaders(request, env);

    // 1. Handle CORS preflight OPTIONS
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    try {
        const url = new URL(request.url);
        let pathname = url.pathname;

        // Strip trailing slash if present (except root)
        if (pathname.length > 1 && pathname.endsWith('/')) {
            pathname = pathname.slice(0, -1);
        }

        // Normalize path segments: /api/... or direct /...
        let segments = pathname.split('/').filter(Boolean);
        if (segments[0] === 'api') {
            segments = segments.slice(1);
        }

        const rootResource = segments[0] || '';
        const subPathParts = segments.slice(1);

        switch (rootResource) {
            case 'health':
                return await handleHealth(request, env);

            case 'tracks':
                return await handleTracks(request, env, subPathParts);

            case 'uploads':
                return await handleUploads(request, env, subPathParts);

            case 'artists':
                return await handleArtists(request, env, subPathParts);

            case 'albums':
                return await handleAlbums(request, env, subPathParts);

            case 'playlists':
                return await handlePlaylists(request, env, subPathParts);

            default:
                return errorResponse('ENDPOINT_NOT_FOUND', `API endpoint '/api/${rootResource}' not recognized.`, 404, null, corsHeaders);
        }
    } catch (err) {
        console.error('[Router] Unhandled Exception:', err);
        return errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred while processing the request.', 500, null, corsHeaders);
    }
}
