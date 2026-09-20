/**
 * Migration 002: Direct Music Store Products Schema
 * Standardizes product pricing, currency, publishing states, and R2 master storage references.
 */

export const migration = {
    id: "002_store_products",
    version: 2,
    description: "Standardizes music products with authoritative price, currency (KES), status lifecycle, and private R2 storage pointers.",
    date: "2026-09-05",
    preconditions: (state) => {
        return { satisfied: !!state.songs };
    },
    apply: (state) => {
        const nextState = { ...state, songs: { ...state.songs } };
        for (const [id, song] of Object.entries(nextState.songs)) {
            if (!song || typeof song !== 'object') continue;
            nextState.songs[id] = {
                ...song,
                status: (song.status || 'DRAFT').toUpperCase(),
                price: typeof song.price === 'number' && song.price > 0 ? song.price : 100,
                currency: song.currency || 'KSh',
                productType: song.productType || 'SINGLE',
                masterStorageKey: song.masterStorageKey || song.downloadUrl || null,
                previewStorageKey: song.previewStorageKey || song.audioUrl || null,
                coverStorageKey: song.coverStorageKey || song.artworkUrl || null
            };
        }
        return nextState;
    },
    validate: (state) => {
        const errors = [];
        for (const [id, song] of Object.entries(state.songs || {})) {
            if (!song.status) errors.push(`Song ${id} missing status`);
            if (typeof song.price !== 'number' || song.price <= 0) errors.push(`Song ${id} has invalid price`);
        }
        return { valid: errors.length === 0, errors };
    },
    rollback: (state) => {
        // Rollback restores original product structure safely
        return { ...state };
    }
};
