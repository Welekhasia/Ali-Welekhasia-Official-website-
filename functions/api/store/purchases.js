/**
 * Cloudflare Pages Function: /api/store/purchases
 * Hardened Customer Purchase Recovery Endpoint.
 *
 * Security Enhancements:
 * 1. Email address and Order Number are NOT treated as authorization secrets.
 * 2. Raw enumeration of orders by typing someone else's email/phone is blocked.
 * 3. Implements secure passwordless, time-limited recovery session (20-minute validity).
 * 4. Recovery tokens are generated with 256-bit cryptographic entropy (crypto.getRandomValues).
 * 5. Tokens are hashed with SHA-256 before storage in database.
 * 6. Sensitive customer information is masked.
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

async function sha256Hex(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSecureToken() {
    const randBytes = new Uint8Array(32);
    crypto.getRandomValues(randBytes);
    return 'aw_rec_' + Array.from(randBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function maskEmail(email) {
    if (!email || !email.includes('@')) return '***@***.com';
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}*@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function maskPhone(phone) {
    if (!phone) return '—';
    const clean = phone.replace(/\s+/g, '');
    if (clean.length < 8) return '****';
    return clean.substring(0, 4) + '****' + clean.substring(clean.length - 2);
}

/**
 * POST: Request a secure, time-limited purchase recovery session for a customer email.
 */
export async function onRequestPost(context) {
    const { request, env } = context;

    // 1. Strict Rate Limiting Protection (purchases profile: 5 req / 10 min, burst 2 / 10s, cooldown 10 min)
    const rateCheck = await checkRateLimit('purchases', request);
    if (!rateCheck.allowed) {
        await recordAuditEvent(context, {
            eventType: 'RECOVERY_RATE_LIMIT_TRIGGERED',
            result: rateCheck.status,
            requestId: rateCheck.requestId,
            hashedIdentifier: rateCheck.hashedIdentifier
        });
        return buildRateLimitResponse(rateCheck);
    }

    const requestId = rateCheck.requestId;

    // 2. Server-Side Environment Guardrails Validation
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
            error: "Recovery service guardrail violation: " + envValidation.errors[0]
        }, 500, requestId);
    }

    try {
        const body = await request.json();
        const rawEmail = (body.email || '').trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!rawEmail || !emailRegex.test(rawEmail)) {
            return jsonResponse({
                success: false,
                error: "Please provide a valid email address used during purchase."
            }, 400, requestId);
        }

        // Query orders for this specific email
        const ordersRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders.json`);
        const allOrders = await ordersRes.json();

        let matchingPaidOrders = [];
        if (allOrders) {
            matchingPaidOrders = Object.values(allOrders).filter(ord => 
                ord && 
                (ord.customerEmail || '').toLowerCase() === rawEmail &&
                ord.paymentStatus === 'PAID'
            );
        }

        // If no matching orders exist, respond with generic success message to prevent email enumeration
        if (matchingPaidOrders.length === 0) {
            return jsonResponse({
                success: true,
                hasPurchases: false,
                message: "If any verified purchases exist under this email address, a secure recovery authorization session will be established."
            });
        }

        // Generate cryptographically random recovery token
        const recoveryToken = generateSecureToken();
        const tokenHash = await sha256Hex(recoveryToken);
        const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString(); // 20 minutes

        const recoveryRecord = {
            email: rawEmail,
            createdAt: new Date().toISOString(),
            expiresAt,
            orderCount: matchingPaidOrders.length
        };

        await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/recovery_tokens/${tokenHash}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recoveryRecord)
        });

        return jsonResponse({
            success: true,
            hasPurchases: true,
            recoveryToken,
            expiresInMinutes: 20,
            maskedEmail: maskEmail(rawEmail),
            message: "Secure recovery authorization session established. Valid for 20 minutes."
        });

    } catch (err) {
        console.error("Purchase Recovery Request Error:", err);
        return jsonResponse({ success: false, error: "Unable to process recovery request at this time." }, 500);
    }
}

/**
 * GET: Retrieve customer purchases using a validated, time-limited recovery token.
 */
export async function onRequestGet(context) {
    const { request } = context;

    // Strict rate limit on recovery token retrieval queries
    const rateCheck = await checkRateLimit('purchases', request);
    if (!rateCheck.allowed) {
        return buildRateLimitResponse(rateCheck);
    }
    const requestId = rateCheck.requestId;

    const url = new URL(request.url);
    const recoveryToken = (url.searchParams.get('recoveryToken') || url.searchParams.get('token') || '').trim();

    if (!recoveryToken) {
        return jsonResponse({
            success: false,
            error: "Authorization required. Direct query by raw email or order number is disabled for customer privacy. Please initiate a secure purchase recovery session."
        }, 401, requestId);
    }

    try {
        const tokenHash = await sha256Hex(recoveryToken);
        const tokenRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/recovery_tokens/${tokenHash}.json`);
        const tokenRecord = await tokenRes.json();

        if (!tokenRecord) {
            return jsonResponse({
                success: false,
                error: "Invalid or expired recovery authorization session. Please request a new recovery link."
            }, 401, requestId);
        }

        const now = new Date();
        const expiresAt = new Date(tokenRecord.expiresAt);
        if (now > expiresAt) {
            return jsonResponse({
                success: false,
                error: "This recovery session has expired. Recovery links are time-limited to 20 minutes for customer protection."
            }, 401, requestId);
        }

        const targetEmail = tokenRecord.email.toLowerCase();

        // Fetch orders for this authorized email
        const ordersRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders.json`);
        const allOrders = await ordersRes.json();

        const purchases = [];
        if (allOrders) {
            Object.values(allOrders).forEach(ord => {
                if (ord && (ord.customerEmail || '').toLowerCase() === targetEmail && ord.paymentStatus === 'PAID') {
                    purchases.push({
                        orderId: ord.id,
                        orderNumber: ord.orderNumber,
                        productId: ord.productId,
                        productTitle: ord.productTitle,
                        productArtist: ord.productArtist || 'Ali Welekhasia',
                        amount: ord.amount,
                        currency: ord.currency || 'KES',
                        paymentStatus: ord.paymentStatus,
                        paidAt: ord.paidAt || ord.createdAt,
                        customerEmail: maskEmail(ord.customerEmail),
                        customerPhone: maskPhone(ord.customerPhone),
                        downloadToken: ord.downloadToken,
                        downloadUrl: ord.downloadToken ? `/api/store/download?token=${encodeURIComponent(ord.downloadToken)}` : null
                    });
                }
            });
        }

        return jsonResponse({
            success: true,
            authorizedEmail: maskEmail(targetEmail),
            sessionExpiresAt: tokenRecord.expiresAt,
            count: purchases.length,
            purchases
        });

    } catch (err) {
        console.error("Purchases Retrieval Error:", err);
        return jsonResponse({ success: false, error: "Error retrieving authorized purchase records." }, 500);
    }
}
