/**
 * Cloudflare Pages Function: /api/store/download
 * Secure Digital Download Delivery endpoint.
 *
 * CRITICAL SECURITY:
 * - Validates download entitlement token server-side.
 * - Enforces download limits and expiration checks.
 * - Does NOT expose internal storage bucket paths or private credentials.
 * - Proxies/streams full audio binary with Content-Disposition: attachment
 *   so browser triggers automatic file download seamlessly on mobile & desktop.
 */

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

const FIREBASE_DB_URL = "https://gospelsphere-default-rtdb.europe-west1.firebasedatabase.app";

export async function onRequestGet(context) {
    return handleDownloadRequest(context);
}

export async function onRequestPost(context) {
    return handleDownloadRequest(context);
}

async function handleDownloadRequest(context) {
    const { request, env = {} } = context;
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
        return jsonResponse({ success: false, error: "Download authorization token is missing or invalid." }, 400);
    }

    try {
        // 1. Retrieve entitlement record from Firebase Realtime Database
        const entitlementRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/download_entitlements/${token}.json`);
        const entitlement = await entitlementRes.json();

        if (!entitlement) {
            return jsonResponse({
                success: false,
                error: "Invalid download link. The authorization token could not be found."
            }, 404);
        }

        // 2. Expiration Check
        if (entitlement.expiresAt && new Date() > new Date(entitlement.expiresAt)) {
            return jsonResponse({
                success: false,
                error: "Your download authorization link has expired. Please look up your purchase history to generate a new link."
            }, 403);
        }

        // 3. Download Count / Rate-limit Check
        const currentDownloads = entitlement.downloadCount || 0;
        const maxDownloads = entitlement.maxDownloads || 10;

        if (currentDownloads >= maxDownloads) {
            return jsonResponse({
                success: false,
                error: `Download limit (${maxDownloads} downloads) reached for this purchase link.`
            }, 403);
        }

        // 4. Retrieve Song Product details
        const productId = entitlement.productId;
        const songRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/songs/${productId}.json`);
        const songData = await songRes.json();

        if (!songData) {
            return jsonResponse({ success: false, error: "Purchased song asset not found in database." }, 404);
        }

        // Master downloadable file URL (masterStorageKey takes priority over downloadUrl and audioUrl)
        const targetAudioUrl = songData.masterStorageKey || songData.downloadUrl || songData.audioUrl;

        if (!targetAudioUrl) {
            return jsonResponse({
                success: false,
                error: "Master audio file asset is not currently attached to this song record."
            }, 404);
        }

        // 5. Increment Download Count on entitlement & order
        const newCount = currentDownloads + 1;
        await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/download_entitlements/${token}/downloadCount.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCount)
        });

        if (entitlement.orderId) {
            await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders/${entitlement.orderId}/downloadCount.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCount)
            });
        }

        // 6. Handle Private Cloudflare R2 Storage or Private Proxy Streaming
        const mode = url.searchParams.get('mode'); // 'json' or default binary stream
        if (mode === 'json') {
            return jsonResponse({
                success: true,
                title: songData.title,
                artist: songData.artist || 'Ali Welekhasia',
                downloadsRemaining: maxDownloads - newCount
            });
        }

        const safeTitle = (songData.title || 'Gospel_Track').replace(/[^a-zA-Z0-9_\-]/g, '_');
        const filename = `Ali_Welekhasia_${safeTitle}.mp3`;
        const r2Bucket = env.R2_BUCKET || env.MUSIC_BUCKET || env.R2_MUSIC_BUCKET;

        let streamBody = null;
        let streamHeaders = new Headers();
        streamHeaders.set('Content-Type', 'audio/mpeg');
        streamHeaders.set('Content-Disposition', `attachment; filename="${filename}"`);
        streamHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        streamHeaders.set('Pragma', 'no-cache');
        streamHeaders.set('Access-Control-Allow-Origin', '*');

        if (r2Bucket && (targetAudioUrl.startsWith('r2://') || !targetAudioUrl.startsWith('http'))) {
            const objectKey = targetAudioUrl.replace(/^r2:\/\//, '').replace(/^\//, '');
            const r2Object = await r2Bucket.get(objectKey);
            if (!r2Object) {
                return jsonResponse({ success: false, error: "Private master file object not found in R2 bucket." }, 404);
            }
            streamBody = r2Object.body;
            if (r2Object.httpMetadata && r2Object.httpMetadata.contentType) {
                streamHeaders.set('Content-Type', r2Object.httpMetadata.contentType);
            }
        } else {
            const fileFetchRes = await fetch(targetAudioUrl);
            if (!fileFetchRes.ok) {
                return Response.redirect(targetAudioUrl, 302);
            }
            streamBody = fileFetchRes.body;
            if (fileFetchRes.headers.get('content-type')) {
                streamHeaders.set('Content-Type', fileFetchRes.headers.get('content-type'));
            }
        }

        return new Response(streamBody, {
            status: 200,
            headers: streamHeaders
        });

    } catch (err) {
        console.error("Secure Digital Download Error:", err);
        return jsonResponse({
            success: false,
            error: "An error occurred while preparing your digital download."
        }, 500);
    }
}
