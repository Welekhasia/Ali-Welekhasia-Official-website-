/**
 * Ali Welekhasia Official Music Platform
 * Database Migration & Safe Rollback Management Engine
 *
 * Implements:
 * 1. Migration Versioning & Sequential Execution
 * 2. Idempotency Safeguards (repeated runs are no-ops)
 * 3. Automated Pre-Migration Backup Verification
 * 4. Special Invariant Protection for Historical Paid Orders
 * 5. Reversible Rollback Execution & Validation
 */

import { migration as m001 } from './migrations/001_initial_schema.js';
import { migration as m002 } from './migrations/002_store_products.js';
import { migration as m003 } from './migrations/003_download_entitlements.js';
import { migration as m004 } from './migrations/004_payment_telemetry.js';
import { migration as m005 } from './migrations/005_abuse_and_ratelimits.js';

export const MIGRATIONS_REGISTRY = [m001, m002, m003, m004, m005];

/**
 * Extract snapshot of all historical paid orders to verify the Paid Orders Invariant
 */
export function extractPaidOrdersSnapshot(state = {}) {
    const orders = state.orders || {};
    const snapshot = {};
    for (const [id, ord] of Object.entries(orders)) {
        if (ord && ord.paymentStatus === 'PAID') {
            snapshot[id] = {
                id: ord.id || id,
                orderNumber: ord.orderNumber,
                amount: ord.amount,
                currency: ord.currency,
                paymentStatus: ord.paymentStatus,
                paymentReference: ord.paymentReference,
                paidAt: ord.paidAt,
                customerEmail: ord.customerEmail,
                downloadToken: ord.downloadToken
            };
        }
    }
    return snapshot;
}

/**
 * Assert that all historical paid orders are preserved exactly.
 * Throws if any financial fact was altered or deleted.
 */
export function assertPaidOrdersPreserved(beforeSnapshot, afterState) {
    const afterOrders = afterState.orders || {};
    for (const [id, before] of Object.entries(beforeSnapshot)) {
        const after = afterOrders[id];
        if (!after) {
            throw new Error(`CRITICAL INVARIANT VIOLATION: Paid order ${id} was deleted during migration/rollback!`);
        }
        if (after.paymentStatus !== 'PAID') {
            throw new Error(`CRITICAL INVARIANT VIOLATION: Paid order ${id} status changed from PAID to ${after.paymentStatus}!`);
        }
        if (after.amount !== before.amount) {
            throw new Error(`CRITICAL INVARIANT VIOLATION: Paid order ${id} amount changed from ${before.amount} to ${after.amount}!`);
        }
        if (after.currency !== before.currency) {
            throw new Error(`CRITICAL INVARIANT VIOLATION: Paid order ${id} currency changed from ${before.currency} to ${after.currency}!`);
        }
        if (after.paymentReference !== before.paymentReference) {
            throw new Error(`CRITICAL INVARIANT VIOLATION: Paid order ${id} paymentReference changed!`);
        }
    }
    return true;
}

/**
 * Run a specific migration against a database state object
 */
export async function runMigration(migration, state, options = {}) {
    const { skipBackup = false } = options;
    const appliedMigrations = state._migrations || {};

    // 1. Check Idempotency: Has this migration already been successfully applied?
    if (appliedMigrations[migration.id] && appliedMigrations[migration.id].status === 'APPLIED') {
        return {
            migrationId: migration.id,
            status: 'ALREADY_APPLIED',
            skipped: true,
            state
        };
    }

    // 2. Verify Preconditions
    const precond = migration.preconditions(state);
    if (!precond.satisfied) {
        throw new Error(`Preconditions failed for migration ${migration.id}: ${precond.error || 'Precondition not satisfied'}`);
    }

    // 3. Create Pre-Migration Backup Snapshot
    let backupKey = null;
    let nextState = { ...state };
    if (!skipBackup) {
        const timestamp = Date.now();
        backupKey = `backup_${timestamp}_${migration.id}`;
        nextState._backups = nextState._backups || {};
        nextState._backups[backupKey] = {
            migrationId: migration.id,
            timestamp: new Date().toISOString(),
            snapshot: {
                songs: state.songs ? JSON.parse(JSON.stringify(state.songs)) : {},
                orders: state.orders ? JSON.parse(JSON.stringify(state.orders)) : {},
                download_entitlements: state.download_entitlements ? JSON.parse(JSON.stringify(state.download_entitlements)) : {},
                audit_logs: state.audit_logs ? JSON.parse(JSON.stringify(state.audit_logs)) : {}
            }
        };
    }

    // 4. Capture Paid Orders Invariant Baseline
    const paidSnapshotBefore = extractPaidOrdersSnapshot(state);

    // 5. Apply Migration
    nextState = migration.apply(nextState);

    // 6. Assert Paid Orders Invariant
    assertPaidOrdersPreserved(paidSnapshotBefore, nextState);

    // 7. Validate Result
    const validation = migration.validate(nextState);
    if (!validation.valid) {
        throw new Error(`Migration ${migration.id} validation failed: ${validation.errors.join(', ')}`);
    }

    // 8. Record Applied Migration
    nextState._migrations = nextState._migrations || {};
    nextState._migrations[migration.id] = {
        id: migration.id,
        version: migration.version,
        description: migration.description,
        status: 'APPLIED',
        appliedAt: new Date().toISOString(),
        backupKey
    };

    return {
        migrationId: migration.id,
        status: 'APPLIED',
        backupKey,
        state: nextState
    };
}

/**
 * Roll back a specific migration against a database state object
 */
export async function rollbackMigration(migration, state) {
    const appliedMigrations = state._migrations || {};

    if (!appliedMigrations[migration.id] || appliedMigrations[migration.id].status !== 'APPLIED') {
        return {
            migrationId: migration.id,
            status: 'NOT_APPLIED',
            skipped: true,
            state
        };
    }

    // 1. Capture Paid Orders Invariant Baseline
    const paidSnapshotBefore = extractPaidOrdersSnapshot(state);

    // 2. Execute Rollback
    let nextState = migration.rollback(state);

    // 3. Assert Paid Orders Invariant during Rollback
    assertPaidOrdersPreserved(paidSnapshotBefore, nextState);

    // 4. Update Migration Registry Status
    nextState._migrations = nextState._migrations || {};
    nextState._migrations[migration.id] = {
        ...nextState._migrations[migration.id],
        status: 'ROLLED_BACK',
        rolledBackAt: new Date().toISOString()
    };

    return {
        migrationId: migration.id,
        status: 'ROLLED_BACK',
        state: nextState
    };
}

/**
 * Run all pending migrations in sequential order
 */
export async function runAllPendingMigrations(state, options = {}) {
    let currentState = { ...state };
    const results = [];

    for (const mig of MIGRATIONS_REGISTRY) {
        const res = await runMigration(mig, currentState, options);
        results.push(res);
        currentState = res.state;
    }

    return {
        results,
        finalState: currentState
    };
}
