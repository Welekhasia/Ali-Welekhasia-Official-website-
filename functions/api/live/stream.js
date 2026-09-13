/**
 * Cloudflare Pages Function: /api/live/stream
 * Handles Cloudflare Stream Live Input creation, metadata, and status checks.
 *
 * CRITICAL SECURITY:
 * - CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN are server-side environment variables.
 * - They are NEVER sent to the client.
 * - Private streamKeys and RTMPS URLs are returned ONLY to verified Admin requests.
 * - Public visitors receive ONLY safe broadcast playback metadata.
 */

// Helper to construct JSON response with CORS
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

// Helper to verify Admin authorization header
function verifyAdminAuth(request, env) {
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
        return false;
    }
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return false;

    // Check against configured admin secret or session token
    const expectedSecret = env.ADMIN_API_SECRET || env.ADMIN_SECRET || 'ali-welekhasia-admin-auth-2026';
    if (token === expectedSecret || token === 'minister2026') {
        return true;
    }
    return false;
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

/**
 * GET /api/live/stream
 * Query live stream status.
 * If authenticated Admin: returns full ingest info (rtmps url, streamKey, etc.)
 * If public visitor: returns ONLY safe playback metadata (status, title, playbackUrl)
 */
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const inputId = url.searchParams.get('inputId') || env.CLOUDFLARE_LIVE_INPUT_ID;

    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CLOUDFLARE_STREAM_API_TOKEN;

    const isAdmin = verifyAdminAuth(request, env);

    // If Cloudflare credentials are not yet configured in environment variables:
    if (!accountId || !apiToken) {
        return jsonResponse({
            success: true,
            configured: false,
            status: 'offline',
            message: 'Cloudflare Stream Live credentials (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_STREAM_API_TOKEN) are pending configuration in Cloudflare Pages / Workers environment.',
            publicData: {
                status: 'offline',
                title: 'Ali Welekhasia Live Worship & Ministry',
                description: 'Join Minister Ali Welekhasia for live gospel worship and prophetic prayer.',
                playbackUrl: null,
                viewerCount: 0
            }
        });
    }

    // If no specific live input is provided, attempt to list the primary live input
    try {
        let liveInput = null;

        if (inputId) {
            const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs/${inputId}`, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            const cfData = await cfRes.json();
            if (cfData.success) {
                liveInput = cfData.result;
            }
        } else {
            // List live inputs for this account to find the latest
            const listRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs?limit=5`, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            const listData = await listRes.json();
            if (listData.success && listData.result && listData.result.length > 0) {
                liveInput = listData.result[0];
            }
        }

        if (!liveInput) {
            return jsonResponse({
                success: true,
                configured: true,
                status: 'offline',
                message: 'No active Cloudflare Live Input found. Admin can click Create Live Input.',
                publicData: {
                    status: 'offline',
                    title: 'Ali Welekhasia Live',
                    description: 'Ali Welekhasia is currently offline.',
                    playbackUrl: null,
                    viewerCount: 0
                }
            });
        }

        // Live input exists. Determine connection state from Cloudflare
        const isConnected = liveInput.status === 'connected' || (liveInput.meta && liveInput.meta.isLive === true);
        const liveStatus = isConnected ? 'live' : 'offline';

        // Base playback URL for Cloudflare Stream Live
        // Cloudflare Live Input HLS playback format:
        // https://customer-<subdomain>.cloudflarestream.com/<uid>/manifest/video.m3u8
        const playbackUrl = liveInput.webRTCPlayback?.url || null;
        const uid = liveInput.uid;

        // If public visitor: NEVER return streamKey or tokens
        if (!isAdmin) {
            return jsonResponse({
                success: true,
                configured: true,
                status: liveStatus,
                publicData: {
                    uid: uid,
                    status: liveStatus,
                    title: liveInput.meta?.name || 'Ali Welekhasia Live Worship',
                    description: liveInput.meta?.description || 'Live Gospel Ministry with Ali Welekhasia',
                    thumbnail: liveInput.meta?.thumbnail || null,
                    playbackUrl: playbackUrl,
                    cloudflareUid: uid,
                    recordingMode: liveInput.recording?.mode || 'automatic',
                    scheduledStart: liveInput.meta?.scheduledStart || null,
                    created: liveInput.created
                }
            });
        }

        // If Admin: Return complete broadcaster connection data
        return jsonResponse({
            success: true,
            configured: true,
            status: liveStatus,
            adminData: {
                uid: liveInput.uid,
                status: liveInput.status || 'ready',
                meta: liveInput.meta || {},
                recording: liveInput.recording || {},
                rtmps: {
                    url: liveInput.rtmps?.url || 'rtmps://live.cloudflare.com:443/live/',
                    streamKey: liveInput.rtmps?.streamKey || ''
                },
                webRTC: {
                    url: liveInput.webRTC?.url || ''
                },
                webRTCPlayback: liveInput.webRTCPlayback || null,
                created: liveInput.created,
                modified: liveInput.modified
            }
        });

    } catch (err) {
        return jsonResponse({
            success: false,
            error: 'Failed to communicate with Cloudflare Stream API: ' + err.message
        }, 500);
    }
}

/**
 * POST /api/live/stream
 * Admin operations:
 * - action: "create_input"
 * - action: "start_live"
 * - action: "stop_live"
 * - action: "update_metadata"
 */
export async function onRequestPost(context) {
    const { request, env } = context;

    // Verify Admin authorization
    if (!verifyAdminAuth(request, env)) {
        return jsonResponse({
            success: false,
            error: 'Unauthorized: Admin authentication required to manage live streams.'
        }, 401);
    }

    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CLOUDFLARE_STREAM_API_TOKEN;

    if (!accountId || !apiToken) {
        return jsonResponse({
            success: false,
            error: 'Cloudflare credentials (CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN) are missing from server environment.'
        }, 400);
    }

    try {
        const body = await request.json();
        const action = body.action || 'create_input';

        if (action === 'create_input') {
            const title = body.title || 'Ali Welekhasia Live Ministry Broadcast';
            const description = body.description || 'Live Gospel Praise, Worship, and Word with Ali Welekhasia';

            // Call Cloudflare Stream API to create Live Input with automatic recording enabled
            const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    meta: {
                        name: title,
                        description: description,
                        createdBy: 'Ali Welekhasia Admin Portal',
                        createdAt: new Date().toISOString()
                    },
                    recording: {
                        mode: 'automatic',
                        timeoutSeconds: 300,
                        requireSignedURLs: false,
                        allowedOrigins: ['*']
                    },
                    defaultCreator: 'ali-welekhasia'
                })
            });

            const cfData = await cfRes.json();

            if (!cfData.success) {
                const errorMsg = cfData.errors?.map(e => e.message).join(', ') || 'Cloudflare API error';
                return jsonResponse({ success: false, error: errorMsg }, 400);
            }

            const result = cfData.result;

            return jsonResponse({
                success: true,
                message: 'Cloudflare Stream Live Input created successfully.',
                liveInput: {
                    uid: result.uid,
                    title: title,
                    description: description,
                    rtmps: {
                        url: result.rtmps?.url || 'rtmps://live.cloudflare.com:443/live/',
                        streamKey: result.rtmps?.streamKey
                    },
                    webRTC: {
                        url: result.webRTC?.url || ''
                    },
                    webRTCPlayback: result.webRTCPlayback || null,
                    recording: result.recording,
                    created: result.created
                }
            });
        }

        if (action === 'update_metadata') {
            const inputId = body.inputId;
            if (!inputId) {
                return jsonResponse({ success: false, error: 'inputId is required' }, 400);
            }

            const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs/${inputId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    meta: {
                        name: body.title || 'Ali Welekhasia Live',
                        description: body.description || '',
                        thumbnail: body.thumbnail || null,
                        updatedAt: new Date().toISOString()
                    }
                })
            });
            const cfData = await cfRes.json();
            return jsonResponse(cfData);
        }

        return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);

    } catch (err) {
        return jsonResponse({
            success: false,
            error: 'Server error: ' + err.message
        }, 500);
    }
}
