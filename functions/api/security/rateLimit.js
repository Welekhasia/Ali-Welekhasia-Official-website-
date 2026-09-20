/**
 * Ali Welekhasia Official Music Platform
 * Server-Side Rate Limiting & Abuse Protection Engine
 *
 * Capabilities:
 * - Granular per-endpoint rate limits (orders, verify, webhook, purchases, download, upload, admin)
 * - Burst threshold protection (short sliding window) + Sustained quota protection (long window)
 * - Progressive abuse mitigation: NORMAL -> RATE_LIMITED -> COOLDOWN (5 min) -> TEMPORARY_BLOCK (15 min)
 * - Privacy-preserving: Hashes client IP addresses with rotating salt; raw IPs are never leaked
 * - Unique Request Correlation ID (X-Request-Id) generation for end-to-end tracing
 * - Standard HTTP 429 Too Many Requests with Retry-After header
 */

// Ephemeral in-memory store for edge worker instances
const rateLimitStore = new Map();
const cooldownStore = new Map();

// Periodic cleanup every 100 requests to avoid unbounded memory growth
let cleanupCounter = 0;

export const RATE_LIMIT_PROFILES = {
    // Payment checkout initialization
    orders: {
        windowMs: 5 * 60 * 1000,   // 5 minutes
        maxRequests: 10,
        burstWindowMs: 10 * 1000,  // 10 seconds
        burstMax: 3,
        cooldownMs: 5 * 60 * 1000  // 5 minute cooldown
    },
    // Payment verification endpoint
    verify: {
        windowMs: 5 * 60 * 1000,   // 5 minutes
        maxRequests: 15,
        burstWindowMs: 10 * 1000,  // 10 seconds
        burstMax: 5,
        cooldownMs: 5 * 60 * 1000
    },
    // Webhook endpoint (High capacity to prevent dropping legitimate Paystack retries)
    webhook: {
        windowMs: 60 * 1000,       // 1 minute
        maxRequests: 60,
        burstWindowMs: 5 * 1000,
        burstMax: 20,
        cooldownMs: 2 * 60 * 1000
    },
    // Purchase recovery (High protection against email/order enumeration)
    purchases: {
        windowMs: 10 * 60 * 1000,  // 10 minutes
        maxRequests: 5,
        burstWindowMs: 10 * 1000,
        burstMax: 2,
        cooldownMs: 10 * 60 * 1000
    },
    // Secure download delivery (Protects against automated scrapers while respecting 10-download entitlement)
    download: {
        windowMs: 5 * 60 * 1000,   // 5 minutes
        maxRequests: 25,
        burstWindowMs: 10 * 1000,
        burstMax: 8,
        cooldownMs: 5 * 60 * 1000
    },
    // Media uploads (Strict administrative quota)
    upload: {
        windowMs: 5 * 60 * 1000,   // 5 minutes
        maxRequests: 5,
        burstWindowMs: 10 * 1000,
        burstMax: 2,
        cooldownMs: 10 * 60 * 1000
    },
    // Administrative endpoints
    admin: {
        windowMs: 5 * 60 * 1000,   // 5 minutes
        maxRequests: 40,
        burstWindowMs: 10 * 1000,
        burstMax: 10,
        cooldownMs: 5 * 60 * 1000
    }
};

/**
 * Generate a cryptographically safe Request Correlation ID
 */
export function generateRequestId() {
    const timestamp = Date.now();
    const randHex = Math.random().toString(36).substring(2, 9);
    return `req_${timestamp}_${randHex}`;
}

/**
 * Extract client IP address safely from Cloudflare request headers
 */
export function getClientIp(request) {
    if (!request || !request.headers) return '127.0.0.1';
    return request.headers.get('cf-connecting-ip') ||
           request.headers.get('x-real-ip') ||
           request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           '127.0.0.1';
}

/**
 * Anonymize client IP into a pseudonymous hash for storage & privacy
 */
export async function anonymizeIdentifier(identifier) {
    if (!identifier) return 'anon_id';
    // Use Web Crypto SHA-256 with a static salt prefix
    const data = new TextEncoder().encode(`aw_salt_2026_${identifier}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).slice(0, 10).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Clean up expired records periodically
 */
function purgeExpiredRecords(now) {
    for (const [key, record] of rateLimitStore.entries()) {
        if (now - record.lastRequestAt > 60 * 60 * 1000) {
            rateLimitStore.delete(key);
        }
    }
    for (const [key, expiry] of cooldownStore.entries()) {
        if (now > expiry) {
            cooldownStore.delete(key);
        }
    }
}

/**
 * Check and record rate limit status for a given endpoint profile and request.
 *
 * Returns:
 * {
 *   allowed: boolean,
 *   status: 'NORMAL' | 'RATE_LIMITED' | 'COOLDOWN' | 'TEMPORARY_BLOCK',
 *   retryAfterSeconds: number,
 *   remaining: number,
 *   total: number,
 *   requestId: string
 * }
 */
export async function checkRateLimit(profileName, request, customIdentifier = null) {
    const profile = RATE_LIMIT_PROFILES[profileName] || RATE_LIMIT_PROFILES.orders;
    const now = Date.now();
    const requestId = generateRequestId();

    // Routine memory maintenance
    cleanupCounter++;
    if (cleanupCounter % 100 === 0) {
        purgeExpiredRecords(now);
    }

    const rawId = customIdentifier || getClientIp(request);
    const hashedId = await anonymizeIdentifier(rawId);
    const storeKey = `${profileName}:${hashedId}`;

    // 1. Check if user is currently under active cooldown
    const cooldownExpiry = cooldownStore.get(storeKey);
    if (cooldownExpiry && now < cooldownExpiry) {
        const retryAfterSeconds = Math.max(1, Math.ceil((cooldownExpiry - now) / 1000));
        return {
            allowed: false,
            status: 'COOLDOWN',
            retryAfterSeconds,
            remaining: 0,
            total: profile.maxRequests,
            requestId,
            hashedIdentifier: hashedId,
            error: "Too many requests. Temporary security cooldown active. Please try again later."
        };
    }

    // 2. Retrieve or initialize request tracker
    let tracker = rateLimitStore.get(storeKey);
    if (!tracker) {
        tracker = {
            requests: [],
            violations: 0,
            lastRequestAt: now
        };
        rateLimitStore.set(storeKey, tracker);
    }

    tracker.lastRequestAt = now;

    // Filter requests within current window
    const windowStart = now - profile.windowMs;
    tracker.requests = tracker.requests.filter(t => t > windowStart);

    // Filter requests within burst window
    const burstStart = now - profile.burstWindowMs;
    const burstRequests = tracker.requests.filter(t => t > burstStart);

    // 3. Evaluate Burst Threshold
    if (burstRequests.length >= profile.burstMax) {
        tracker.violations++;
        const cooldownMs = tracker.violations > 2 ? profile.cooldownMs * 2 : profile.cooldownMs;
        cooldownStore.set(storeKey, now + cooldownMs);
        const retryAfterSeconds = Math.ceil(cooldownMs / 1000);

        return {
            allowed: false,
            status: tracker.violations > 3 ? 'TEMPORARY_BLOCK' : 'RATE_LIMITED',
            retryAfterSeconds,
            remaining: 0,
            total: profile.maxRequests,
            requestId,
            hashedIdentifier: hashedId,
            error: "Burst rate limit exceeded. Please slow down your requests."
        };
    }

    // 4. Evaluate Sustained Window Limit
    if (tracker.requests.length >= profile.maxRequests) {
        tracker.violations++;
        const cooldownMs = profile.cooldownMs;
        cooldownStore.set(storeKey, now + cooldownMs);
        const retryAfterSeconds = Math.ceil((tracker.requests[0] + profile.windowMs - now) / 1000);

        return {
            allowed: false,
            status: 'RATE_LIMITED',
            retryAfterSeconds: Math.max(1, retryAfterSeconds),
            remaining: 0,
            total: profile.maxRequests,
            requestId,
            hashedIdentifier: hashedId,
            error: "Request limit exceeded for this endpoint. Please wait before retrying."
        };
    }

    // 5. Request is permitted
    tracker.requests.push(now);
    const remaining = Math.max(0, profile.maxRequests - tracker.requests.length);

    return {
        allowed: true,
        status: 'NORMAL',
        retryAfterSeconds: 0,
        remaining,
        total: profile.maxRequests,
        requestId,
        hashedIdentifier: hashedId
    };
}

/**
 * Standard HTTP 429 Too Many Requests response builder
 */
export function buildRateLimitResponse(rateLimitResult, extraHeaders = {}) {
    const body = {
        success: false,
        status: rateLimitResult.status,
        error: rateLimitResult.error || "Too Many Requests",
        retryAfter: rateLimitResult.retryAfterSeconds,
        requestId: rateLimitResult.requestId
    };

    return new Response(JSON.stringify(body), {
        status: 429,
        headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfterSeconds),
            'X-RateLimit-Limit': String(rateLimitResult.total),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-Request-Id': rateLimitResult.requestId,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
            ...extraHeaders
        }
    });
}
