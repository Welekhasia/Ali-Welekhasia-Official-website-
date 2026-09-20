/**
 * Ali Welekhasia Official Music Platform
 * Server-Side Environment Policy & Guardrail Enforcement
 *
 * Environments:
 * - DEVELOPMENT: Local debugging, developer sandboxes, test storage, mock payment if configured.
 * - TEST / STAGING: Isolated staging database, test R2 bucket, Paystack test credentials (pk_test_*, sk_test_*).
 * - PRODUCTION: Authoritative production database, production R2 bucket, Paystack live credentials (pk_live_*, sk_live_*).
 *
 * Strict Guardrails:
 * - Production must NEVER use Paystack test keys (sk_test_*, pk_test_*).
 * - Staging must NEVER use Paystack live keys (sk_live_*, pk_live_*).
 * - Staging must NEVER touch production customer data or issue production master audio files.
 */

export const ENVIRONMENTS = {
    DEVELOPMENT: 'development',
    TEST: 'test',
    STAGING: 'staging',
    PRODUCTION: 'production'
};

/**
 * Resolve current environment name from Cloudflare Pages env bindings.
 */
export function getEnvironment(env = {}) {
    const raw = (env.APP_ENV || env.ENVIRONMENT || env.NODE_ENV || 'development').toLowerCase().trim();
    if (raw === 'production' || raw === 'prod') return ENVIRONMENTS.PRODUCTION;
    if (raw === 'staging' || raw === 'stage') return ENVIRONMENTS.STAGING;
    if (raw === 'test' || raw === 'testing') return ENVIRONMENTS.TEST;
    return ENVIRONMENTS.DEVELOPMENT;
}

export function isProduction(env = {}) {
    return getEnvironment(env) === ENVIRONMENTS.PRODUCTION;
}

export function isTestOrStaging(env = {}) {
    const current = getEnvironment(env);
    return current === ENVIRONMENTS.STAGING || current === ENVIRONMENTS.TEST;
}

export function isDevelopment(env = {}) {
    return getEnvironment(env) === ENVIRONMENTS.DEVELOPMENT;
}

/**
 * Validate environment configuration against strict security guardrails.
 * Fails safely by returning { valid: false, error: string } rather than silently
 * operating with mismatched credentials.
 */
export function validateEnvironmentConfig(env = {}) {
    const currentEnv = getEnvironment(env);
    const paystackSecret = (env.PAYSTACK_SECRET_KEY || '').trim();
    const paystackPublic = (env.PAYSTACK_PUBLIC_KEY || '').trim();
    const r2Bucket = env.R2_BUCKET || env.MUSIC_BUCKET;
    const errors = [];
    const warnings = [];

    if (currentEnv === ENVIRONMENTS.PRODUCTION) {
        // Guardrail: Production must NEVER use Paystack test keys
        if (paystackSecret.startsWith('sk_test_')) {
            errors.push("CRITICAL PRODUCTION GUARDRAIL: Paystack test secret key (sk_test_*) is forbidden in PRODUCTION.");
        }
        if (paystackPublic.startsWith('pk_test_')) {
            errors.push("CRITICAL PRODUCTION GUARDRAIL: Paystack test public key (pk_test_*) is forbidden in PRODUCTION.");
        }
        // Guardrail: Production must not have placeholder credentials
        if (paystackSecret.includes('your_paystack') || paystackPublic.includes('your_paystack')) {
            errors.push("CRITICAL PRODUCTION GUARDRAIL: Placeholder Paystack credentials detected in PRODUCTION.");
        }
        // Guardrail: In production, secret key should be present when store operations occur
        if (!paystackSecret && env.REQUIRE_PAYMENTS === 'true') {
            errors.push("CRITICAL PRODUCTION GUARDRAIL: Missing PAYSTACK_SECRET_KEY in PRODUCTION.");
        }
    } else if (currentEnv === ENVIRONMENTS.STAGING || currentEnv === ENVIRONMENTS.TEST) {
        // Guardrail: Staging must NEVER use Paystack live keys to prevent real charges
        if (paystackSecret.startsWith('sk_live_')) {
            errors.push("CRITICAL STAGING GUARDRAIL: Paystack LIVE secret key (sk_live_*) detected in TEST/STAGING. Live credentials are strictly forbidden in pre-production.");
        }
        if (paystackPublic.startsWith('pk_live_')) {
            errors.push("CRITICAL STAGING GUARDRAIL: Paystack LIVE public key (pk_live_*) detected in TEST/STAGING. Live credentials are strictly forbidden in pre-production.");
        }
    }

    return {
        valid: errors.length === 0,
        environment: currentEnv,
        errors,
        warnings,
        isProduction: currentEnv === ENVIRONMENTS.PRODUCTION,
        isStaging: currentEnv === ENVIRONMENTS.STAGING,
        isTest: currentEnv === ENVIRONMENTS.TEST,
        isDevelopment: currentEnv === ENVIRONMENTS.DEVELOPMENT
    };
}

/**
 * Return safe, non-sensitive diagnostic information about the environment.
 * NEVER exposes tokens, keys, secrets, or internal bucket connection strings.
 */
export function getSafeEnvironmentSummary(env = {}) {
    const currentEnv = getEnvironment(env);
    const paystackSecret = (env.PAYSTACK_SECRET_KEY || '').trim();
    const paystackPublic = (env.PAYSTACK_PUBLIC_KEY || '').trim();
    const hasR2 = !!(env.R2_BUCKET || env.MUSIC_BUCKET);
    const hasWebhookSecret = !!env.PAYSTACK_WEBHOOK_SECRET;

    let paystackMode = 'unconfigured';
    if (paystackSecret.startsWith('sk_live_')) paystackMode = 'live';
    else if (paystackSecret.startsWith('sk_test_')) paystackMode = 'test';
    else if (paystackSecret) paystackMode = 'custom';

    return {
        environment: currentEnv,
        paystackMode,
        hasPublicKey: !!paystackPublic,
        hasSecretKey: !!paystackSecret,
        hasWebhookSecret,
        hasR2Storage: hasR2,
        currency: env.DEFAULT_CURRENCY || 'KES'
    };
}
