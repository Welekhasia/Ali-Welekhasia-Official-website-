/**
 * Security & Authorization Utilities
 * Cloudflare D1 + Workers Security Layer
 */

export async function hashIp(request) {
    const rawIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const encoder = new TextEncoder();
    const data = encoder.encode(rawIp + '_ali_music_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return 'anon_' + Array.from(new Uint8Array(hashBuffer)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function verifyAdmin(request, env) {
    const authHeader = request.headers.get('Authorization') || '';
    const secretHeader = request.headers.get('X-Admin-Secret') || '';
    const expectedSecret = env.ADMIN_API_SECRET || env.ADMIN_SECRET;

    if (!expectedSecret) {
        // In local development or testing with no secret configured, check admin role token if provided
        return false;
    }

    if (secretHeader === expectedSecret) {
        return true;
    }

    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        return token === expectedSecret;
    }

    return false;
}

export function sanitizeId(id) {
    if (!id || typeof id !== 'string') return null;
    const clean = id.trim();
    if (!/^[a-zA-Z0-9_\-]+$/.test(clean)) {
        return null;
    }
    return clean;
}

export function slugify(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export async function logAudit(db, { userId = 'system', action, entityType, entityId, details = null, ipHash = null }) {
    if (!db || typeof db.prepare !== 'function') return;
    try {
        const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const detailsStr = details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null;
        await db.prepare(
            `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_hash, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(id, userId, action, entityType, entityId || null, detailsStr, ipHash || null).run();
    } catch (err) {
        console.error('[logAudit] Notice: failed to write audit log to D1:', err.message);
    }
}
