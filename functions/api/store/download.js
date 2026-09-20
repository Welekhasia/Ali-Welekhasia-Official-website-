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

import { validateEnvironmentConfig } from '../security/env.js';
import { checkRateLimit, buildRateLimitResponse } from '../security/rateLimit.js';
import { recordAuditEvent } from '../security/audit.js';

function jsonResponse(data, status = 200, requestId = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id'
    };
    if (requestId) headers['X-Request-Id'] = requestId;

    return new Response(JSON.stringify(data), {
        status,
        headers
    });
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id'
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

    // 1. Request-level Rate Limiting (25 req / 5 min, burst 8 / 10s - protects against byte flooding/scraping while respecting legitimate downloads)
    const rateCheck = await checkRateLimit('download', request);
    if (!rateCheck.allowed) {
        await recordAuditEvent(context, {
            eventType: 'DOWNLOAD_RATE_LIMIT_TRIGGERED',
            result: rateCheck.status,
            requestId: rateCheck.requestId,
            hashedIdentifier: rateCheck.hashedIdentifier
        });
        return buildRateLimitResponse(rateCheck);
    }

    const requestId = rateCheck.requestId;

    // 2. Server-Side Environment Guardrails
    const envValidation = validateEnvironmentConfig(env);
    if (!envValidation.valid) {
        await recordAuditEvent(context, {
            eventType: 'ENVIRONMENT_GUARDRAIL_VIOLATION',
            result: 'BLOCKED',
            requestId,
            metadata: { errors: envValidation.errors }
        });
        return jsonResponse({
            success: false,
            error: "Delivery service configuration error: " + envValidation.errors[0]
        }, 500, requestId);
    }

    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
        return jsonResponse({ success: false, error: "Download authorization token is missing or invalid." }, 400, requestId);
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

        // 4. Inspection / Metadata Mode (Does NOT consume a download count)
        const mode = url.searchParams.get('mode'); // 'json' or 'info'
        if (mode === 'json' || mode === 'info') {
            return jsonResponse({
                success: true,
                title: songData.title,
                artist: songData.artist || 'Ali Welekhasia',
                downloadsRemaining: Math.max(0, maxDownloads - currentDownloads),
                downloadCount: currentDownloads,
                maxDownloads,
                expiresAt: entitlement.expiresAt,
                policy: "Ali Welekhasia Ministry standard digital license allows up to 10 downloads within 7 days of purchase."
            });
        }

        // 5. Handle Range Requests (Avoid burning download counts on byte-range probes)
        const rangeHeader = request.headers.get('range');
        const isInitialRequest = !rangeHeader || rangeHeader.startsWith('bytes=0-');

        // Only increment the download count on the primary initial request, not subsequent byte chunks
        let newCount = currentDownloads;
        if (isInitialRequest) {
            newCount = currentDownloads + 1;
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
                await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders/${entitlement.orderId}/lastDownloadAt.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Date.now())
                });
            }
        }

        // 6. Handle Private Cloudflare R2 Storage or Private Proxy Streaming
        const safeTitle = (songData.title || 'Gospel_Track').replace(/[^a-zA-Z0-9_\-]/g, '_');
        const filename = `Ali_Welekhasia_${safeTitle}.mp3`;
        const r2Bucket = env.R2_BUCKET || env.MUSIC_BUCKET || env.R2_MUSIC_BUCKET;

        let streamBody = null;
        let streamHeaders = new Headers();
        streamHeaders.set('Content-Type', 'audio/mpeg');
        streamHeaders.set('Content-Disposition', `attachment; filename="${filename}"`);
        streamHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        streamHeaders.set('Pragma', 'no-cache');
        streamHeaders.set('Accept-Ranges', 'bytes');
        streamHeaders.set('Access-Control-Allow-Origin', '*');
        streamHeaders.set('X-Downloads-Remaining', String(Math.max(0, maxDownloads - newCount)));

        let responseStatus = 200;

        if (r2Bucket && (targetAudioUrl.startsWith('r2://') || !targetAudioUrl.startsWith('http'))) {
            const objectKey = targetAudioUrl.replace(/^r2:\/\//, '').replace(/^\//, '');
            const r2Options = {};
            if (rangeHeader) {
                r2Options.range = request.headers;
            }
            const r2Object = await r2Bucket.get(objectKey, r2Options);
            if (!r2Object) {
                return jsonResponse({ success: false, error: "Private master file object not found in R2 bucket." }, 404);
            }
            streamBody = r2Object.body;
            if (r2Object.httpMetadata && r2Object.httpMetadata.contentType) {
                streamHeaders.set('Content-Type', r2Object.httpMetadata.contentType);
            }
            if (r2Object.range) {
                responseStatus = 206;
                streamHeaders.set('Content-Range', `bytes ${r2Object.range.offset}-${r2Object.range.offset + r2Object.range.length - 1}/${r2Object.size}`);
                streamHeaders.set('Content-Length', String(r2Object.range.length));
            } else {
                streamHeaders.set('Content-Length', String(r2Object.size));
            }
        } else {
            const fileFetchRes = await fetch(targetAudioUrl, {
                headers: rangeHeader ? { 'Range': rangeHeader } : {}
            });
            if (!fileFetchRes.ok) {
                return jsonResponse({ success: false, error: "The requested audio master file could not be retrieved." }, 502);
            }
            responseStatus = fileFetchRes.status;
            streamBody = fileFetchRes.body;
            if (fileFetchRes.headers.get('content-type')) {
                streamHeaders.set('Content-Type', fileFetchRes.headers.get('content-type'));
            }
            if (fileFetchRes.headers.get('content-length')) {
                streamHeaders.set('Content-Length', fileFetchRes.headers.get('content-length'));
            }
            if (fileFetchRes.headers.get('content-range')) {
                streamHeaders.set('Content-Range', fileFetchRes.headers.get('content-range'));
            }
        }

        return new Response(streamBody, {
            status: responseStatus,
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
