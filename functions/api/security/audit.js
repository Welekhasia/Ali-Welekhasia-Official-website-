/**
 * Ali Welekhasia Official Music Platform
 * Security Event & Audit Trail Emitter
 *
 * Strict Privacy & Redaction Policy:
 * - Records safe metadata (event type, endpoint, timestamp, environment, request ID, status).
 * - NEVER logs: Paystack secrets, entitlement tokens, recovery tokens, R2 credentials, passwords, PINs, or raw PANs.
 */

import { getEnvironment } from './env.js';

const FIREBASE_DB_URL = "https://gospelsphere-default-rtdb.europe-west1.firebasedatabase.app";

/**
 * Record a safe audit event
 */
export async function recordAuditEvent(context, eventData = {}) {
    const { request, env = {} } = context;
    const environment = getEnvironment(env);
    const timestamp = new Date().toISOString();
    const eventId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Build sanitized log payload
    const auditRecord = {
        id: eventId,
        eventType: eventData.eventType || 'SECURITY_EVENT',
        endpoint: eventData.endpoint || (request ? new URL(request.url).pathname : 'unknown'),
        method: request ? request.method : 'UNKNOWN',
        environment,
        result: eventData.result || 'INFO', // 'SUCCESS', 'RATE_LIMITED', 'BLOCKED', 'GUARDRAIL_VIOLATION'
        requestId: eventData.requestId || 'req_system',
        hashedIdentifier: eventData.hashedIdentifier || null,
        metadata: eventData.metadata ? sanitizeMetadata(eventData.metadata) : {},
        timestamp
    };

    // Output to console for Edge runtime observability
    console.log(`[AUDIT] [${auditRecord.environment}] [${auditRecord.eventType}] ${auditRecord.endpoint} (${auditRecord.result}) req=${auditRecord.requestId}`);

    // Persist to Firebase audit_logs asynchronously (fire and forget to not block critical path)
    try {
        fetch(`${FIREBASE_DB_URL}/aliwelekhasia/audit_logs/${eventId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(auditRecord)
        }).catch(err => {
            console.warn("Async audit log persistence warning:", err.message);
        });
    } catch (e) {
        // Suppress network errors in edge context
    }

    return auditRecord;
}

/**
 * Sanitize metadata to strip any sensitive values
 */
function sanitizeMetadata(meta) {
    if (!meta || typeof meta !== 'object') return {};
    const sanitized = {};
    const sensitiveKeys = [
        'secret', 'key', 'token', 'password', 'pin', 'authorization', 'card', 'cvv', 'pan', 'r2_secret'
    ];

    for (const [k, v] of Object.entries(meta)) {
        const lowerKey = k.toLowerCase();
        const isSensitive = sensitiveKeys.some(s => lowerKey.includes(s));
        if (isSensitive) {
            sanitized[k] = '[REDACTED]';
        } else if (typeof v === 'object' && v !== null) {
            sanitized[k] = sanitizeMetadata(v);
        } else {
            sanitized[k] = v;
        }
    }
    return sanitized;
}
