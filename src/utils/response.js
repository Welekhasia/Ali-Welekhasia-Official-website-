/**
 * Response & CORS Utilities
 * Production HTTP response helpers for Ali Welekhasia Music Backend
 */

export function getCorsHeaders(request, env = {}) {
    const origin = request.headers.get('Origin') || '';
    const configuredOrigins = (env.ALLOWED_ORIGINS || 'https://aliwelekhasia.co.ke,https://www.aliwelekhasia.co.ke,https://api.aliwelekhasia.co.ke')
        .split(',')
        .map(o => o.trim().toLowerCase());

    const isAllowed = origin && (configuredOrigins.includes(origin.toLowerCase()) || origin.endsWith('.aliwelekhasia.co.ke'));
    const allowOrigin = isAllowed ? origin : (configuredOrigins[0] || 'https://aliwelekhasia.co.ke');

    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret, Range, If-None-Match, If-Modified-Since, X-Request-Id',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, ETag, Last-Modified, X-Request-Id',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin'
    };
}

export function getSecurityHeaders() {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    };
}

export function jsonResponse(data, status = 200, customHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...getSecurityHeaders(),
            ...customHeaders
        }
    });
}

export function errorResponse(code, message, status = 400, details = null, customHeaders = {}) {
    const body = {
        success: false,
        error: {
            code,
            message,
            ...(details ? { details } : {})
        },
        timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...getSecurityHeaders(),
            ...customHeaders
        }
    });
}
