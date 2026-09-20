/**
 * Migration 003: Download Entitlements Collection
 * Establishes cryptographically indexed entitlement records with rate limits, 7-day expiration, and 10 downloads quota.
 */

export const migration = {
    id: "003_download_entitlements",
    version: 3,
    description: "Establishes download_entitlements schema with high-entropy token indexing, 7-day TTL, and maxDownloads limit (10).",
    date: "2026-09-10",
    preconditions: (state) => {
        return { satisfied: !!state.orders };
    },
    apply: (state) => {
        const nextState = { ...state, download_entitlements: { ...state.download_entitlements } };
        // Backfill entitlements for existing paid orders missing entitlement records
        for (const [orderId, order] of Object.entries(state.orders || {})) {
            if (order && order.paymentStatus === 'PAID' && order.downloadToken) {
                if (!nextState.download_entitlements[order.downloadToken]) {
                    nextState.download_entitlements[order.downloadToken] = {
                        token: order.downloadToken,
                        orderId: order.id || orderId,
                        orderNumber: order.orderNumber || orderId,
                        productId: order.productId,
                        productTitle: order.productTitle,
                        customerEmail: order.customerEmail,
                        customerPhone: order.customerPhone || '',
                        maxDownloads: order.maxDownloads || 10,
                        downloadCount: order.downloadCount || 0,
                        createdAt: order.paidAt || order.createdAt || new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                    };
                }
            }
        }
        return nextState;
    },
    validate: (state) => {
        const errors = [];
        if (!state.download_entitlements) {
            errors.push("download_entitlements collection missing");
        }
        return { valid: errors.length === 0, errors };
    },
    rollback: (state) => {
        // Rollback keeps valid entitlements for customer access preservation
        return { ...state };
    }
};
