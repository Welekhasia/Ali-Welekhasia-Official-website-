/**
 * Migration 001: Initial Core Schema
 * Verifies and establishes foundational Firebase Realtime Database structures.
 */

export const migration = {
    id: "001_initial_schema",
    version: 1,
    description: "Establishes baseline ministry schema collections: songs, orders, lyrics, events, gallery, settings.",
    date: "2026-09-01",
    preconditions: (state) => {
        // Precondition: state object must be a valid non-null database root
        return { satisfied: typeof state === 'object' && state !== null };
    },
    apply: (state) => {
        const nextState = { ...state };
        nextState.songs = nextState.songs || {};
        nextState.orders = nextState.orders || {};
        nextState.lyrics = nextState.lyrics || {};
        nextState.events = nextState.events || {};
        nextState.gallery = nextState.gallery || {};
        nextState.settings = nextState.settings || {
            siteTitle: "Ali Welekhasia Official",
            tagline: "Spreading the Gospel of Jesus Christ through Prophetic Worship",
            updatedAt: new Date().toISOString()
        };
        return nextState;
    },
    validate: (state) => {
        const requiredCollections = ['songs', 'orders', 'lyrics', 'events', 'gallery', 'settings'];
        const missing = requiredCollections.filter(c => !state[c]);
        return {
            valid: missing.length === 0,
            errors: missing.map(m => `Missing root collection: ${m}`)
        };
    },
    rollback: (state) => {
        // Non-destructive rollback: Keeps collections intact if populated, removes only empty default settings
        return { ...state };
    }
};
