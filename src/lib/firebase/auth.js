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
        if (auth) {
            return await fbSignInWithEmailAndPassword(auth, email, pass);
        } else if (typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
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
        return await fbSignOut(targetAuth);
    } else if (typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
        return await window.firebase.auth().signOut();
    } else if (typeof window !== 'undefined' && window.RichaliFirebase) {
        return await window.RichaliFirebase.signOut();
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

    if (targetAuth && typeof fbOnAuthStateChanged === 'function') {
        return fbOnAuthStateChanged(targetAuth, cb);
    } else if (typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
        return window.firebase.auth().onAuthStateChanged(cb);
    } else if (typeof window !== 'undefined' && window.RichaliFirebase) {
        window.RichaliFirebase.onAuth(cb);
        return () => {};
    }
}
