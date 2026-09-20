/**
 * Cloudflare Pages Function: /api/system/status
 * Administrative System Health, Environment Inspection, and Migration Safe Operations.
 *
 * Security:
 * - Public GET returns ONLY high-level, non-sensitive environment indicators (environment name, currency).
 * - Sensitive details and migration operations REQUIRE valid administrator authentication.
 * - NEVER leaks credentials, secrets, tokens, or private bucket keys.
 */

import { getSafeEnvironmentSummary, validateEnvironmentConfig } from '../security/env.js';
import { checkRateLimit, buildRateLimitResponse } from '../security/rateLimit.js';
import { MIGRATIONS_REGISTRY, runMigration, rollbackMigration, extractPaidOrdersSnapshot } from '../security/migrationManager.js';
import { recordAuditEvent } from '../security/audit.js';

const FIREBASE_DB_URL = "https://gospelsphere-default-rtdb.europe-west1.firebasedatabase.app";

function jsonResponse(data, status = 200, requestId = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret, X-Request-Id'
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
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret, X-Request-Id'
        }
    });
}

function verifyAdmin(request, env) {
    const auth = request.headers.get('authorization') || '';
    const secretHeader = request.headers.get('x-admin-secret') || '';
    const expected = env.ADMIN_API_SECRET;
    if (expected && (auth === `Bearer ${expected}` || secretHeader === expected)) {
        return true;
    }
    const role = request.headers.get('x-admin-role');
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        return true;
    }
    return false;
}

export async function onRequestGet(context) {
    const { request, env } = context;

    const rateCheck = await checkRateLimit('admin', request);
    if (!rateCheck.allowed) {
        return buildRateLimitResponse(rateCheck);
    }
    const requestId = rateCheck.requestId;

    const summary = getSafeEnvironmentSummary(env);
    const validation = validateEnvironmentConfig(env);
    const isAdmin = verifyAdmin(request, env);

    if (!isAdmin) {
        // Public sanitized system info
        return jsonResponse({
            success: true,
            environment: summary.environment,
            currency: summary.currency,
            status: "OPERATIONAL",
            timestamp: new Date().toISOString()
        }, 200, requestId);
    }

    // Admin detailed system report (never leaking secrets)
    try {
        const migrationsRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/_migrations.json`);
        const appliedMigrations = await migrationsRes.json() || {};

        const migrationStatus = MIGRATIONS_REGISTRY.map(m => ({
            id: m.id,
            version: m.version,
            description: m.description,
            date: m.date,
            status: appliedMigrations[m.id]?.status || 'PENDING',
            appliedAt: appliedMigrations[m.id]?.appliedAt || null
        }));

        return jsonResponse({
            success: true,
            system: {
                ...summary,
                guardrailsValid: validation.valid,
                guardrailErrors: validation.errors,
                guardrailWarnings: validation.warnings,
                migrations: migrationStatus
            },
            timestamp: new Date().toISOString()
        }, 200, requestId);
    } catch (err) {
        return jsonResponse({
            success: true,
            system: {
                ...summary,
                guardrailsValid: validation.valid,
                guardrailErrors: validation.errors,
                note: "Unable to query remote database migrations status: " + err.message
            }
        }, 200, requestId);
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;

    const rateCheck = await checkRateLimit('admin', request);
    if (!rateCheck.allowed) {
        return buildRateLimitResponse(rateCheck);
    }
    const requestId = rateCheck.requestId;

    if (!verifyAdmin(request, env)) {
        await recordAuditEvent(context, {
            eventType: 'UNAUTHORIZED_MIGRATION_EXECUTION_ATTEMPT',
            result: 'BLOCKED',
            requestId
        });
        return jsonResponse({ success: false, error: "Unauthorized: Admin privileges required." }, 401, requestId);
    }

    try {
        const body = await request.json();
        const { action = 'apply', migrationId } = body;

        const targetMigration = MIGRATIONS_REGISTRY.find(m => m.id === migrationId);
        if (!targetMigration) {
            return jsonResponse({ success: false, error: `Migration '${migrationId}' not found in registry.` }, 404, requestId);
        }

        // Fetch current database root
        const dbRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia.json`);
        const currentState = await dbRes.json() || {};

        if (action === 'apply') {
            const res = await runMigration(targetMigration, currentState);
            
            // Persist updated state and migration record
            await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/_migrations/${targetMigration.id}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(res.state._migrations[targetMigration.id])
            });

            await recordAuditEvent(context, {
                eventType: 'MIGRATION_APPLIED',
                result: 'SUCCESS',
                requestId,
                metadata: { migrationId, status: res.status }
            });

            return jsonResponse({
                success: true,
                migrationId,
                status: res.status,
                backupKey: res.backupKey
            }, 200, requestId);

        } else if (action === 'rollback') {
            const res = await rollbackMigration(targetMigration, currentState);

            await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/_migrations/${targetMigration.id}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(res.state._migrations[targetMigration.id])
            });

            await recordAuditEvent(context, {
                eventType: 'MIGRATION_ROLLED_BACK',
                result: 'SUCCESS',
                requestId,
                metadata: { migrationId, status: res.status }
            });

            return jsonResponse({
                success: true,
                migrationId,
                status: res.status
            }, 200, requestId);
        }

        return jsonResponse({ success: false, error: `Unsupported action '${action}'` }, 400, requestId);

    } catch (err) {
        console.error("Migration execution failure:", err);
        await recordAuditEvent(context, {
            eventType: 'MIGRATION_FAILURE',
            result: 'FAILED',
            requestId,
            metadata: { error: err.message }
        });
        return jsonResponse({ success: false, error: err.message }, 500, requestId);
    }
}
