import { 
    getAuth, 
    signInWithEmailAndPassword as fbSignInWithEmailAndPassword, 
    signOut as fbSignOut, 
    onAuthStateChanged as fbOnAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { app } from "./config.js";

// Initialize Firebase Auth instance using the initialized app instance
export const auth = app ? getAuth(app) : (typeof window !== 'undefined' && window.firebase && window.firebase.auth ? window.firebase.auth() : null);

export { getAuth };

/**
 * Sign in with email and password
 * Supports both signatures:
 *   signInWithEmailAndPassword(email, password)
 *   signInWithEmailAndPassword(auth, email, password)
 */
export async function signInWithEmailAndPassword(authOrEmail, emailOrPassword, password) {
    if (typeof authOrEmail === 'string') {
        const email = authOrEmail;
        const pass = emailOrPassword;
        if (auth && typeof fbSignInWithEmailAndPassword === 'function') {
            try {
                return await fbSignInWithEmailAndPassword(auth, email, pass);
            } catch (err) {
                if (typeof window !== 'undefined' && window.firebase && typeof window.firebase.auth === 'function') {
                    return await window.firebase.auth().signInWithEmailAndPassword(email, pass);
                }
                throw err;
            }
        } else if (typeof window !== 'undefined' && window.firebase && typeof window.firebase.auth === 'function') {
            return await window.firebase.auth().signInWithEmailAndPassword(email, pass);
        } else if (typeof window !== 'undefined' && window.RichaliFirebase) {
            return await window.RichaliFirebase.signInWithEmail(email, pass);
        }
        throw new Error('Firebase Auth is not available.');
    } else {
        const authInst = authOrEmail || auth;
        return await fbSignInWithEmailAndPassword(authInst, emailOrPassword, password);
    }
}

/**
 * Sign out current user
 * Supports both signatures:
 *   signOut()
 *   signOut(auth)
 */
export async function signOut(authInstance) {
    const targetAuth = authInstance || auth;
    if (targetAuth && typeof fbSignOut === 'function') {
        try {
            await fbSignOut(targetAuth);
        } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.firebase && typeof window.firebase.auth === 'function') {
        try {
            await window.firebase.auth().signOut();
        } catch (e) {}
    } else if (typeof window !== 'undefined' && window.RichaliFirebase) {
        try {
            await window.RichaliFirebase.signOut();
        } catch (e) {}
    }
}

/**
 * Listen for authentication state changes
 * Supports both signatures:
 *   onAuthStateChanged(callback)
 *   onAuthStateChanged(auth, callback)
 */
export function onAuthStateChanged(authOrCb, callback) {
    let targetAuth = auth;
    let cb = callback;

    if (typeof authOrCb === 'function') {
        cb = authOrCb;
        targetAuth = auth;
    } else {
        targetAuth = authOrCb || auth;
    }

    const unsubscribers = [];

    if (targetAuth && typeof fbOnAuthStateChanged === 'function') {
        try {
            const unsub = fbOnAuthStateChanged(targetAuth, cb);
            if (typeof unsub === 'function') unsubscribers.push(unsub);
        } catch (e) {
            console.warn('[Firebase Auth] Modular listener notice:', e);
        }
    }

    if (typeof window !== 'undefined' && window.firebase && typeof window.firebase.auth === 'function') {
        try {
            const unsubCompat = window.firebase.auth().onAuthStateChanged(cb);
            if (typeof unsubCompat === 'function') unsubscribers.push(unsubCompat);
        } catch (e) {}
    } else if (typeof window !== 'undefined' && window.RichaliFirebase && typeof window.RichaliFirebase.onAuth === 'function') {
        try {
            window.RichaliFirebase.onAuth(cb);
        } catch (e) {}
    }

    return () => {
        unsubscribers.forEach(unsub => {
            try { unsub(); } catch (e) {}
        });
    };
}
