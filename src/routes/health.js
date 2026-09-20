/**
 * Health & Diagnostics Endpoint
 * GET /api/health
 */

import { jsonResponse, getCorsHeaders } from '../utils/response.js';

export async function handleHealth(request, env) {
    const cors = getCorsHeaders(request, env);

    let d1Status = 'UNKNOWN';
    let r2Status = 'UNKNOWN';
    let d1Error = null;
    let r2Error = null;

    // 1. Check D1 Database connectivity
    if (env.DB && typeof env.DB.prepare === 'function') {
        try {
            const row = await env.DB.prepare("SELECT 1 AS alive").first();
            if (row && row.alive === 1) {
                d1Status = 'HEALTHY';
            } else {
                d1Status = 'DEGRADED';
            }
        } catch (err) {
            d1Status = 'UNHEALTHY';
            d1Error = err.message;
        }
    } else {
        d1Status = 'NOT_BOUND';
    }

    // 2. Check R2 Object Storage binding
    const bucket = env.BUCKET || env.R2_BUCKET;
    if (bucket && typeof bucket.list === 'function') {
        try {
            // Non-destructive check with limit 1
            await bucket.list({ limit: 1 });
            r2Status = 'HEALTHY';
        } catch (err) {
            r2Status = 'DEGRADED';
            r2Error = err.message;
        }
    } else {
        r2Status = 'NOT_BOUND';
    }

    const overallHealthy = (d1Status === 'HEALTHY' || d1Status === 'UNKNOWN') && (r2Status === 'HEALTHY' || r2Status === 'UNKNOWN');

    return jsonResponse({
        success: true,
        status: overallHealthy ? 'OPERATIONAL' : 'DEGRADED',
        service: 'Ali Welekhasia Music Backend',
        environment: env.ENVIRONMENT || 'production',
        timestamp: new Date().toISOString(),
        infrastructure: {
            d1: {
                status: d1Status,
                database: 'ali-welekhasia-production-db',
                binding: 'env.DB',
                ...(d1Error ? { notice: d1Error } : {})
            },
            r2: {
                status: r2Status,
                bucket: 'ali-music-audio',
                binding: 'env.BUCKET',
                ...(r2Error ? { notice: r2Error } : {})
            },
            apiHost: env.API_HOSTNAME || 'api.aliwelekhasia.co.ke'
        }
    }, overallHealthy ? 200 : 503, cors);
}
