/**
 * Cloudflare R2 Audio Streaming Service
 * Production HTTP Byte-Range Audio Streaming with Caching & Validation
 */

import { getCorsHeaders, getSecurityHeaders } from '../utils/response.js';

export async function streamAudioObject(request, env, r2Key, trackMetadata = {}) {
    const bucket = env.BUCKET || env.R2_BUCKET;
    if (!bucket) {
        return new Response(JSON.stringify({
            success: false,
            error: { code: 'STORAGE_UNAVAILABLE', message: 'R2 Object Storage binding is not configured.' }
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const isHead = request.method === 'HEAD';
    const rangeHeader = request.headers.get('Range');
    const corsHeaders = getCorsHeaders(request, env);
    const securityHeaders = getSecurityHeaders();

    // 1. If-None-Match conditional request check for 304 Not Modified
    const ifNoneMatch = request.headers.get('If-None-Match');
    const ifModifiedSince = request.headers.get('If-Modified-Since');

    // 2. Fetch object from R2 with range support
    const r2Options = {};
    if (rangeHeader) {
        r2Options.range = request.headers;
    }
    if (ifNoneMatch || ifModifiedSince) {
        r2Options.onlyIf = request.headers;
    }

    let r2Object;
    try {
        r2Object = await bucket.get(r2Key, r2Options);
    } catch (err) {
        console.error('[streamAudioObject] R2 get error:', err);
        return new Response(JSON.stringify({
            success: false,
            error: { code: 'R2_RETRIEVAL_ERROR', message: 'Failed to access audio object in R2.' }
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // 3. Object Not Found
    if (!r2Object) {
        return new Response(JSON.stringify({
            success: false,
            error: { code: 'AUDIO_NOT_FOUND', message: 'Audio stream object not found in R2 storage.' }
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // 4. Handle 304 Not Modified from R2 onlyIf
    // In Workers, if onlyIf matches, r2Object may not have body or status might be 304
    if (ifNoneMatch && (r2Object.httpEtag === ifNoneMatch || ifNoneMatch.includes(r2Object.httpEtag))) {
        return new Response(null, {
            status: 304,
            headers: {
                'ETag': r2Object.httpEtag,
                'Last-Modified': r2Object.uploaded ? r2Object.uploaded.toUTCString() : new Date().toUTCString(),
                'Cache-Control': trackMetadata.is_published ? 'public, max-age=86400, s-maxage=604800' : 'private, no-cache, no-store',
                ...corsHeaders
            }
        });
    }

    // 5. Build Headers
    const headers = new Headers();
    Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));
    Object.entries(securityHeaders).forEach(([k, v]) => headers.set(k, v));

    headers.set('Accept-Ranges', 'bytes');
    headers.set('ETag', r2Object.httpEtag || `"${r2Object.etag}"`);
    if (r2Object.uploaded) {
        headers.set('Last-Modified', r2Object.uploaded.toUTCString());
    }

    // Determine Content-Type
    const contentType = r2Object.httpMetadata?.contentType || trackMetadata.mime_type || 'audio/mpeg';
    headers.set('Content-Type', contentType);

    // Cache policy
    if (trackMetadata.is_published && trackMetadata.visibility === 'public') {
        headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    } else {
        headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    }

    // Safe filename for downloads or media players
    const titleSlug = (trackMetadata.slug || trackMetadata.title || 'audio').replace(/[^a-zA-Z0-9_\-]/g, '_');
    headers.set('Content-Disposition', `inline; filename="Ali_Welekhasia_${titleSlug}.mp3"`);

    // 6. Handle Range Requests vs Full Responses
    let status = 200;

    if (rangeHeader) {
        if (r2Object.range) {
            // R2 successfully parsed and satisfied the range
            status = 206;
            const offset = r2Object.range.offset;
            const length = r2Object.range.length;
            const total = r2Object.size;
            const end = offset + length - 1;

            headers.set('Content-Range', `bytes ${offset}-${end}/${total}`);
            headers.set('Content-Length', String(length));
        } else {
            // Range header present but could not be satisfied
            // Check manual range parsing to verify if 416 should be returned
            const rangeMatch = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
            if (rangeMatch) {
                const total = r2Object.size;
                const startStr = rangeMatch[1];
                const endStr = rangeMatch[2];

                let start = startStr ? parseInt(startStr, 10) : NaN;
                let end = endStr ? parseInt(endStr, 10) : NaN;

                if ((!isNaN(start) && start >= total) || (!isNaN(start) && !isNaN(end) && start > end)) {
                    // Invalid range
                    return new Response(null, {
                        status: 416,
                        headers: {
                            'Content-Range': `bytes */${total}`,
                            'Accept-Ranges': 'bytes',
                            ...corsHeaders
                        }
                    });
                }
            }
            headers.set('Content-Length', String(r2Object.size));
        }
    } else {
        headers.set('Content-Length', String(r2Object.size));
    }

    // 7. For HEAD requests, return headers without streaming body
    if (isHead) {
        return new Response(null, { status, headers });
    }

    // 8. Stream the R2 body directly to the client without loading full file into memory
    return new Response(r2Object.body, { status, headers });
}
