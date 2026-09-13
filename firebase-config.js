/**
 * ==============================================================================
 * RICHALI ECOSYSTEM & ALI WELEKHASIA FIREBASE PLATFORM INTEGRATION
 * ==============================================================================
 * Shared Firebase Project: "gospelsphere"
 * Architecture targets:
 *  - aliwelekhasia.co.ke  (Official Gospel Music & Ministry Portal)
 *  - richali.co.ke        (Main RICHALI Brand & Ministry Hub)
 *  - tv.richali.co.ke     (Live Broadcasts, Crusades & Media)
 *  - aimusic.richali.co.ke (AI Gospel & Sound Engineering Platform)
 * 
 * Clean Resource Partitions:
 *  - /music/       (Shared music tracks, audio master files, and stems)
 *  - /videos/      (Shared sermon recordings, music videos, broadcast feeds)
 *  - /artwork/     (Shared high-res album covers, banners, logos, typography)
 *  - /documents/   (Shared bulletins, press kits, agreements, chord charts)
 *  - /aliwelekhasia/ (Dedicated website profile, crusades, devotionals, local site assets)
 *  - /users/       (Shared user accounts, admin roles, subscriber profiles)
 * ==============================================================================
 */

// 1. OFFICIAL FIREBASE CLIENT CONFIGURATION
const RICHALI_FIREBASE_CONFIG = {
    apiKey: "AIzaSyAAS2IX32IIo1ZfLxItVVFQTNlNwdLPUE4",
    authDomain: "gospelsphere.firebaseapp.com",
    databaseURL: "https://gospelsphere-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "gospelsphere",
    storageBucket: "gospelsphere.firebasestorage.app",
    messagingSenderId: "559287679702",
    appId: "1:559287679702:web:46c4c7f11579a1b04ca777",
    measurementId: "G-71TTN91D8R"
};

// 2. UNIFIED LOGICAL SCHEMA & DIRECTORY ARCHITECTURE
const RICHALI_SCHEMA = {
    // Shared Central Resources across all RICHALI properties
    shared: {
        music: "music",
        videos: "videos",
        artwork: "artwork",
        documents: "documents",
        users: "users"
    },
    // Ali Welekhasia website-specific partitioned subtree
    aliwelekhasia: {
        root: "aliwelekhasia",
        profile: "aliwelekhasia/profile",
        crusades: "aliwelekhasia/crusades",
        devotionals: "aliwelekhasia/devotionals",
        songs: "aliwelekhasia/songs",
        lyrics: "aliwelekhasia/lyrics",
        albums: "aliwelekhasia/albums",
        videos: "aliwelekhasia/videos",
        gallery: "aliwelekhasia/gallery",
        events: "aliwelekhasia/events",
        blog: "aliwelekhasia/blog",
        testimonies: "aliwelekhasia/testimonies",
        donations: "aliwelekhasia/donations",
        prayerRequests: "aliwelekhasia/prayer_requests",
        media: "aliwelekhasia/media",
        users: "aliwelekhasia/users",
        auditLogs: "aliwelekhasia/audit_logs",
        siteImages: "aliwelekhasia/site_images",
        settings: "aliwelekhasia/settings",
        liveStream: "aliwelekhasia/live_stream",
        liveRecordings: "aliwelekhasia/live_recordings",
        liveSchedule: "aliwelekhasia/live_schedule",
        liveChat: "aliwelekhasia/live_chat",
        liveViewers: "aliwelekhasia/live_stream/active_viewers"
    },
    // Firebase Cloud Storage Buckets / Folders
    storage: {
        sharedMusic: "music/",
        sharedVideos: "videos/",
        sharedArtwork: "artwork/",
        sharedDocuments: "documents/",
        aliwelekhasiaRoot: "aliwelekhasia/",
        aliwelekhasiaImages: "aliwelekhasia/images/",
        aliwelekhasiaMedia: "aliwelekhasia/media/",
        users: "users/"
    }
};

// 3. FIREBASE SERVICES SINGLETON & LIFECYCLE CONTROLLER
class RichaliFirebaseManager {
    constructor() {
        this.config = RICHALI_FIREBASE_CONFIG;
        this.schema = RICHALI_SCHEMA;
        this.app = null;
        this.auth = null;
        this.database = null;
        this.storage = null;
        this.analytics = null;
        this.status = {
            initialized: false,
            auth: false,
            database: false,
            storage: false,
            analytics: false,
            errors: []
        };
        this.currentUser = null;
        this.authListeners = [];

        this.init();
    }

    /**
     * Initializes all available Firebase SDK services safely without breaking execution
     */
    init() {
        if (typeof firebase === 'undefined') {
            console.warn('[RichaliFirebase] Firebase Web SDK script not yet loaded in DOM.');
            this.status.errors.push('Firebase SDK scripts missing or delayed in DOM');
            return;
        }

        // 1. Initialize Firebase App
        try {
            if (!firebase.apps || !firebase.apps.length) {
                this.app = firebase.initializeApp(this.config);
            } else {
                this.app = firebase.app();
            }
            this.status.initialized = true;
            console.log('[RichaliFirebase] Initialized with project:', this.config.projectId);
        } catch (err) {
            console.error('[RichaliFirebase] App initialization error:', err);
            this.status.errors.push(`App Init: ${err.message}`);
            return;
        }

        // 2. Initialize Firebase Authentication
        if (typeof firebase.auth === 'function') {
            try {
                this.auth = firebase.auth();
                this.status.auth = true;

                this.auth.onAuthStateChanged((user) => {
                    this.currentUser = user;
                    this.notifyAuthListeners(user);
                });
                console.log('[RichaliFirebase] Authentication service active.');
            } catch (err) {
                console.warn('[RichaliFirebase] Auth service error:', err);
                this.status.errors.push(`Auth: ${err.message}`);
            }
        }

        // 3. Initialize Firebase Realtime Database
        if (typeof firebase.database === 'function') {
            try {
                this.database = firebase.database();
                this.status.database = true;
                console.log('[RichaliFirebase] Realtime Database active at:', this.config.databaseURL);
            } catch (err) {
                console.warn('[RichaliFirebase] Realtime Database error:', err);
                this.status.errors.push(`Database: ${err.message}`);
            }
        }

        // 4. Initialize Firebase Cloud Storage
        if (typeof firebase.storage === 'function') {
            try {
                this.storage = firebase.storage();
                this.status.storage = true;
                console.log('[RichaliFirebase] Cloud Storage active at bucket:', this.config.storageBucket);
            } catch (err) {
                console.warn('[RichaliFirebase] Cloud Storage error:', err);
                this.status.errors.push(`Storage: ${err.message}`);
            }
        }

        // 5. Initialize Firebase Analytics safely (guards against adblockers, file:// protocol, etc.)
        if (typeof firebase.analytics === 'function') {
            try {
                // Check if browser supports analytics
                if (window.location.protocol.startsWith('http')) {
                    this.analytics = firebase.analytics();
                    this.status.analytics = true;
                    console.log('[RichaliFirebase] Analytics initialized for:', this.config.measurementId);
                } else {
                    console.log('[RichaliFirebase] Analytics skipped on local file:// or sandbox environment.');
                }
            } catch (err) {
                console.warn('[RichaliFirebase] Analytics notice (non-fatal, tracking disabled):', err.message);
            }
        }
    }

    /**
     * Subscribe a callback to authentication state changes
     */
    onAuth(callback) {
        if (typeof callback === 'function') {
            this.authListeners.push(callback);
            if (this.currentUser !== null) {
                callback(this.currentUser);
            }
        }
    }

    notifyAuthListeners(user) {
        this.authListeners.forEach(cb => {
            try { cb(user); } catch (e) { console.error(e); }
        });
    }

    /**
     * Authenticate using email and password
     */
    async signInWithEmail(email, password) {
        if (!this.auth) throw new Error('Firebase Auth is not initialized.');
        return await this.auth.signInWithEmailAndPassword(email, password);
    }

    /**
     * Register a new user with email and password
     */
    async registerWithEmail(email, password) {
        if (!this.auth) throw new Error('Firebase Auth is not initialized.');
        return await this.auth.createUserWithEmailAndPassword(email, password);
    }

    /**
     * Sign in via Google OAuth
     */
    async signInWithGoogle() {
        if (!this.auth) throw new Error('Firebase Auth is not initialized.');
        const provider = new firebase.auth.GoogleAuthProvider();
        return await this.auth.signInWithPopup(provider);
    }

    /**
     * Sign out current user
     */
    async signOut() {
        if (!this.auth) return;
        return await this.auth.signOut();
    }

    /**
     * Get a Realtime Database reference for a given schema path
     * Example: RichaliFirebase.getDbRef('aliwelekhasia/songs')
     */
    getDbRef(path) {
        if (!this.database) {
            console.warn('[RichaliFirebase] Realtime Database not available.');
            return null;
        }
        return this.database.ref(path);
    }

    /**
     * Read data once from a path in the database
     */
    async readData(path) {
        const ref = this.getDbRef(path);
        if (!ref) return null;
        const snapshot = await ref.once('value');
        return snapshot.val();
    }

    /**
     * Safely save or append data to a partitioned path without overwriting root
     */
    async pushData(path, data) {
        const ref = this.getDbRef(path);
        if (!ref) return null;
        return await ref.push({
            ...data,
            _syncedAt: new Date().toISOString(),
            _site: 'aliwelekhasia.co.ke'
        });
    }

    /**
     * Set data at a specific path
     */
    async setData(path, data) {
        const ref = this.getDbRef(path);
        if (!ref) return null;
        return await ref.set({
            ...data,
            _updatedAt: new Date().toISOString(),
            _site: 'aliwelekhasia.co.ke'
        });
    }

    /**
     * Update data at a specific path
     */
    async updateData(path, data) {
        const ref = this.getDbRef(path);
        if (!ref) return null;
        return await ref.update({
            ...data,
            _updatedAt: new Date().toISOString(),
            _site: 'aliwelekhasia.co.ke'
        });
    }

    /**
     * Remove data at a specific path
     */
    async removeData(path) {
        const ref = this.getDbRef(path);
        if (!ref) return null;
        return await ref.remove();
    }

    /**
     * Get a Cloud Storage reference
     * Example: RichaliFirebase.getStorageRef('artwork/album_art.jpg')
     */
    getStorageRef(path) {
        if (!this.storage) {
            console.warn('[RichaliFirebase] Cloud Storage not available.');
            return null;
        }
        return this.storage.ref(path);
    }

    /**
     * Upload a file or blob to Firebase Storage with explicit progress callback
     */
    async uploadFileWithProgress(path, fileOrBlob, onProgress = null, metadata = {}) {
        const ref = this.getStorageRef(path);
        if (!ref) throw new Error('Firebase Storage is not initialized or configured in this project.');
        
        const uploadTask = ref.put(fileOrBlob, {
            customMetadata: {
                uploadedFrom: 'aliwelekhasia.co.ke',
                uploadedAt: new Date().toISOString(),
                ...metadata
            }
        });

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = snapshot.totalBytes > 0 
                        ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 
                        : 0;
                    if (typeof onProgress === 'function') {
                        onProgress(Math.round(progress), snapshot);
                    }
                },
                (error) => {
                    console.error('[RichaliFirebase] Storage upload error:', error);
                    reject(error);
                },
                async () => {
                    const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
                    resolve({
                        downloadUrl,
                        path,
                        name: ref.name,
                        fullPath: ref.fullPath,
                        size: fileOrBlob.size || 0,
                        type: fileOrBlob.type || ''
                    });
                }
            );
        });
    }

    /**
     * Upload a file or blob to Firebase Storage in a partitioned folder
     */
    async uploadFile(path, fileOrBlob, metadata = {}) {
        return this.uploadFileWithProgress(path, fileOrBlob, null, metadata);
    }

    /**
     * Record an audit log entry in Realtime Database
     */
    async logAudit(action, resource, resourceId = null, details = {}) {
        try {
            const user = this.currentUser;
            const logEntry = {
                timestamp: firebase.database.ServerValue ? firebase.database.ServerValue.TIMESTAMP : Date.now(),
                isoDate: new Date().toISOString(),
                userId: user ? user.uid : 'admin_session',
                userEmail: user ? user.email : (localStorage.getItem('ali_admin_user_email') || 'ali.werekhasia01@gmail.com'),
                action,
                resource,
                resourceId: resourceId || null,
                details: details || {}
            };
            const ref = this.getDbRef(this.schema.aliwelekhasia.auditLogs);
            if (ref) {
                await ref.push(logEntry);
            }
        } catch (e) {
            console.warn('[RichaliFirebase] Audit log notice:', e);
        }
    }

    /**
     * Safely log an event to Firebase Analytics if active
     */
    logEvent(eventName, params = {}) {
        if (this.analytics) {
            try {
                this.analytics.logEvent(eventName, {
                    site: 'aliwelekhasia',
                    ...params
                });
            } catch (err) {
                console.debug('[RichaliFirebase Analytics Log]:', eventName, params);
            }
        }
    }

    /**
     * Subscribe to Live Stream state changes in Realtime Database
     */
    onLiveStreamState(callback) {
        if (!this.database) return;
        const ref = this.getDbRef(this.schema.aliwelekhasia.liveStream);
        if (ref) {
            ref.on('value', (snapshot) => {
                callback(snapshot.val());
            });
        }
    }

    /**
     * Update Live Stream state in Realtime Database
     */
    async updateLiveStreamState(data) {
        if (!this.database) return null;
        const ref = this.getDbRef(this.schema.aliwelekhasia.liveStream);
        if (!ref) return null;
        return await ref.update({
            ...data,
            _updatedAt: new Date().toISOString()
        });
    }

    /**
     * Register a live viewer with auto-removal on disconnect for true zero-mock viewer counts
     */
    registerLiveViewerPresence(onCountChange) {
        if (!this.database) return () => {};
        try {
            const viewersRef = this.getDbRef(this.schema.aliwelekhasia.liveViewers);
            const connectedRef = this.database.ref('.info/connected');

            let myViewerRef = null;

            connectedRef.on('value', (snap) => {
                if (snap.val() === true && viewersRef) {
                    myViewerRef = viewersRef.push();
                    myViewerRef.onDisconnect().remove();
                    myViewerRef.set({
                        joinedAt: firebase.database.ServerValue.TIMESTAMP,
                        client: navigator.userAgent.substring(0, 40)
                    });
                }
            });

            // Listen for active count
            if (viewersRef && typeof onCountChange === 'function') {
                viewersRef.on('value', (snap) => {
                    const count = snap.numChildren();
                    onCountChange(count);
                });
            }

            return () => {
                if (myViewerRef) myViewerRef.remove();
            };
        } catch (e) {
            console.warn('[RichaliFirebase] Viewer presence registration notice:', e);
            return () => {};
        }
    }

    /**
     * Subscribe to Live Chat / Prayer Wall messages
     */
    onLiveChat(callback) {
        if (!this.database) return;
        const ref = this.getDbRef(this.schema.aliwelekhasia.liveChat);
        if (ref) {
            ref.limitToLast(50).on('child_added', (snapshot) => {
                callback({ id: snapshot.key, ...snapshot.val() });
            });
        }
    }

    /**
     * Post a Live Chat / Prayer Wall message
     */
    async sendLiveChatMessage(author, message, isPrayer = false) {
        if (!this.database) return null;
        const ref = this.getDbRef(this.schema.aliwelekhasia.liveChat);
        if (!ref) return null;
        return await ref.push({
            author: author || 'Beloved in Christ',
            message: message.trim(),
            isPrayer: !!isPrayer,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            createdAt: new Date().toISOString()
        });
    }

    /**
     * Returns the live connection status of all services
     */
    getStatus() {
        return {
            ...this.status,
            config: {
                projectId: this.config.projectId,
                authDomain: this.config.authDomain,
                databaseURL: this.config.databaseURL,
                storageBucket: this.config.storageBucket,
                measurementId: this.config.measurementId
            },
            currentUser: this.currentUser ? {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName
            } : null
        };
    }
}

// 4. EXPORT SINGLETON INSTANCE TO GLOBAL SCOPE
window.RICHALI_FIREBASE_CONFIG = RICHALI_FIREBASE_CONFIG;
window.RICHALI_SCHEMA = RICHALI_SCHEMA;
window.RichaliFirebase = new RichaliFirebaseManager();
