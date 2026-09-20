/**
 * Migration 005: Audit Trail & Security Telemetry Schema
 * Establishes structured audit logs, security events, and recovery token collections.
 */

export const migration = {
    id: "005_abuse_and_ratelimits",
    version: 5,
    description: "Establishes audit_logs, security_events, and recovery_tokens schemas for abuse protection and event tracing.",
    date: "2026-09-20",
    preconditions: (state) => {
        return { satisfied: typeof state === 'object' && state !== null };
    },
    apply: (state) => {
        const nextState = { ...state };
        nextState.audit_logs = nextState.audit_logs || {};
        nextState.security_events = nextState.security_events || {};
        nextState.recovery_tokens = nextState.recovery_tokens || {};
        return nextState;
    },
    validate: (state) => {
        const errors = [];
        if (!state.audit_logs) errors.push("Missing audit_logs collection");
        if (!state.security_events) errors.push("Missing security_events collection");
        if (!state.recovery_tokens) errors.push("Missing recovery_tokens collection");
        return { valid: errors.length === 0, errors };
    },
    rollback: (state) => {
        return { ...state };
    }
};
