/**
 * Cloudflare Pages Function: /api/live/status
 * Public, ultra-fast endpoint for live status polling on /live and homepage.
 * NEVER returns stream keys or private credentials.
 */

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=5, s-maxage=5',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

export async function onRequestGet(context) {
    const { env } = context;
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CLOUDFLARE_STREAM_API_TOKEN;

    if (!accountId || !apiToken) {
        return jsonResponse({
            live: false,
            status: 'offline',
            configured: false,
            message: 'Ali Welekhasia is currently offline.'
        });
    }

    try {
        // Query live inputs
        const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs?limit=1`, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        if (data.success && data.result && data.result.length > 0) {
            const input = data.result[0];
            const isLive = input.status === 'connected' || input.meta?.isLive === true;

            return jsonResponse({
                live: isLive,
                status: isLive ? 'live' : 'offline',
                title: input.meta?.name || 'Ali Welekhasia Live Worship & Word',
                description: input.meta?.description || 'Live gospel ministry broadcast with Minister Ali Welekhasia.',
                thumbnail: input.meta?.thumbnail || null,
                playbackUrl: isLive ? (input.webRTCPlayback?.url || null) : null,
                streamUid: input.uid,
                scheduledStart: input.meta?.scheduledStart || null
            });
        }

        return jsonResponse({
            live: false,
            status: 'offline',
            message: 'No live inputs active.'
        });

    } catch (e) {
        return jsonResponse({
            live: false,
            status: 'offline',
            error: 'Status service temporarily unavailable'
        }, 500);
    }
}
