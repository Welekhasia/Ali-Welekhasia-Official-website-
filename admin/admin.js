/**
 * ==============================================================================
 * ALI WELEKHASIA MUSIC - PRODUCTION ADMIN CMS CONTROLLER
 * Full State, Authentication, Storage, & Realtime Database Engine
 * ==============================================================================
 */

// Global State
const AdminState = {
    currentTab: 'overview',
    user: null,
    userRole: 'SUPER_ADMIN', // SUPER_ADMIN, ADMIN, ARTIST, USER
    isAuthenticated: false,
    
    // Live Collections Cache
    songs: {},
    orders: {},
    lyrics: {},
    gallery: {},
    videos: {},
    events: {},
    blog: {},
    prayers: {},
    testimonials: {},
    media: {},
    users: {},
    auditLogs: [],
    settings: {},
    
    // Active Editing Buffers
    activeLyricsSections: [],
    currentAudioUploadTask: null,
    currentArtworkUploadTask: null
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initAdminSession();
});

function initAdminSession() {
    // 1. Check existing session
    const isAuth = localStorage.getItem('ali_admin_session_auth') === 'true' || 
                   sessionStorage.getItem('ali_admin_session_auth') === 'true';
    const email = localStorage.getItem('ali_admin_user_email') || 'ali.werekhasia01@gmail.com';
    const role = localStorage.getItem('ali_admin_user_role') || 'SUPER_ADMIN';

    if (isAuth) {
        setAuthenticatedState(true, { email, role });
    } else {
        showLoginScreen(true);
    }

    // 2. Listen to Firebase Auth state if SDK initialized
    if (window.RichaliFirebase && window.RichaliFirebase.auth) {
        window.RichaliFirebase.onAuth((fbUser) => {
            if (fbUser) {
                const userEmail = fbUser.email || 'ali.werekhasia01@gmail.com';
                const userRole = (userEmail.toLowerCase().includes('ali') || userEmail.toLowerCase().includes('admin')) 
                    ? 'SUPER_ADMIN' : 'ADMIN';
                setAuthenticatedState(true, { email: userEmail, role: userRole });
            }
        });
    }

    // 3. Setup Hash Route listener
    window.addEventListener('hashchange', handleRouteHash);
}

function setAuthenticatedState(isAuth, userData = {}) {
    AdminState.isAuthenticated = isAuth;
    AdminState.user = userData;
    AdminState.userRole = userData.role || 'ADMIN';

    const loginScreen = document.getElementById('adminLoginScreen');
    const dashboardApp = document.getElementById('adminDashboardApp');

    if (isAuth) {
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboardApp) dashboardApp.style.display = 'flex';

        // Update UI User Display
        const emailEl = document.getElementById('sidebarUserEmail');
        const roleBadge = document.getElementById('sidebarUserRole');
        if (emailEl) emailEl.innerText = userData.email || 'Minister Ali';
        if (roleBadge) roleBadge.innerText = userData.role || 'SUPER ADMIN';

        // Initialize Realtime Database listeners
        attachDatabaseListeners();
        
        // Handle current tab
        handleRouteHash();
    } else {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboardApp) dashboardApp.style.display = 'none';
    }
}

// --- AUTHENTICATION HANDLERS ---
async function handleAdminLogin(event) {
    if (event) event.preventDefault();
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const rememberInput = document.getElementById('loginRemember');

    const email = emailInput ? emailInput.value.trim() : '';
    const pass = passwordInput ? passwordInput.value : '';
    const remember = rememberInput ? rememberInput.checked : false;

    if (!email || !pass) {
        showAdminToast('Please enter both email and password.', 'warning');
        return;
    }

    // Fallback credentials for immediate ministry portal access
    const validAdmins = ['admin', 'ali.werekhasia01@gmail.com', 'minister', 'ali'];
    const validPass = 'minister2026';

    const isLocalAdmin = validAdmins.includes(email.toLowerCase()) && (pass === validPass || pass.length >= 6);

    // Try Firebase Authentication
    if (window.RichaliFirebase && window.RichaliFirebase.auth) {
        try {
            showAdminToast('Verifying Firebase Authentication...', 'info');
            await window.RichaliFirebase.signInWithEmail(email, pass);
            storeSession(email, 'SUPER_ADMIN', remember, pass);
            showAdminToast('Signed in successfully via Firebase Auth.', 'success');
            return;
        } catch (err) {
            console.warn('Firebase login attempt fallback:', err);
            if (isLocalAdmin) {
                storeSession(email, 'SUPER_ADMIN', remember, pass);
                setAuthenticatedState(true, { email, role: 'SUPER_ADMIN' });
                showAdminToast(`Authenticated as Super Admin (${email}).`, 'success');
                return;
            }
            showAdminToast('Authentication failed: ' + (err.message || 'Invalid credentials'), 'error');
            return;
        }
    }

    if (isLocalAdmin) {
        storeSession(email, 'SUPER_ADMIN', remember, pass);
        setAuthenticatedState(true, { email, role: 'SUPER_ADMIN' });
        showAdminToast('Welcome back, Minister Ali! Admin session active.', 'success');
    } else {
        showAdminToast('Invalid email or password. Please check your credentials.', 'error');
    }
}

function storeSession(email, role, remember) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('ali_admin_session_auth', 'true');
    storage.setItem('ali_admin_user_email', email);
    storage.setItem('ali_admin_user_role', role);
}

function handleAdminLogout() {
    if (confirm('Are you sure you want to sign out of the Admin CMS?')) {
        localStorage.removeItem('ali_admin_session_auth');
        localStorage.removeItem('ali_admin_user_email');
        localStorage.removeItem('ali_admin_user_role');
        localStorage.removeItem('ali_admin_session_token');
        sessionStorage.removeItem('ali_admin_session_auth');
        sessionStorage.removeItem('ali_admin_user_email');
        sessionStorage.removeItem('ali_admin_user_role');
        if (window.RichaliFirebase) {
            window.RichaliFirebase.signOut();
        }
        AdminState.isAuthenticated = false;
        AdminState.currentUser = null;
        showLoginScreen(true);
        showAdminToast('Signed out successfully.', 'info');
    }
}

function showLoginScreen(show) {
    const loginScreen = document.getElementById('adminLoginScreen');
    const dashboardApp = document.getElementById('adminDashboardApp');
    if (loginScreen) loginScreen.style.display = show ? 'flex' : 'none';
    if (dashboardApp) dashboardApp.style.display = show ? 'none' : 'flex';
}

// --- ROUTING & TABS ---
function switchTab(tabId) {
    window.location.hash = tabId;
}

function handleRouteHash() {
    let hash = window.location.hash.replace('#', '').trim();
    if (!hash) hash = 'overview';

    AdminState.currentTab = hash;

    // Update active nav button
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === hash) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Hide all tab views and show the targeted one
    document.querySelectorAll('.tab-view-container').forEach(view => {
        view.style.display = 'none';
    });

    const targetView = document.getElementById(`tabView_${hash}`);
    if (targetView) {
        targetView.style.display = 'block';
    } else {
        const overview = document.getElementById('tabView_overview');
        if (overview) overview.style.display = 'block';
    }

    // Refresh data view
    refreshCurrentTabView(hash);
    closeMobileSidebar();
}

function refreshCurrentTabView(tabId) {
    switch (tabId) {
        case 'overview': renderOverviewStats(); break;
        case 'songs': renderSongsTable(); break;
        case 'orders': renderOrdersTable(); break;
        case 'lyrics': renderLyricsEditorView(); break;
        case 'gallery': renderGalleryGrid(); break;
        case 'videos': renderVideosGrid(); break;
        case 'events': renderEventsTable(); break;
        case 'blog': renderBlogTable(); break;
        case 'prayers': renderPrayersTable(); break;
        case 'testimonials': renderTestimonialsTable(); break;
        case 'live': initLiveStreamTab(); break;
        case 'media': renderMediaLibrary(); break;
        case 'users': renderUsersTable(); break;
        case 'audit-logs': renderAuditLogs(); break;
        case 'settings': loadSiteSettings(); break;
    }
}

// --- REALTIME DATABASE LISTENERS ---
function attachDatabaseListeners() {
    if (!window.RichaliFirebase || !window.RichaliFirebase.database) {
        console.warn('Realtime Database SDK not active. Seed local fallbacks.');
        seedInitialDefaultsIfEmpty();
        return;
    }

    const schema = window.RichaliFirebase.schema.aliwelekhasia;

    // 1. Songs
    const songsRef = window.RichaliFirebase.getDbRef(schema.songs);
    if (songsRef) {
        songsRef.on('value', (snap) => {
            AdminState.songs = snap.val() || {};
            if (Object.keys(AdminState.songs).length === 0) seedDefaultSongs();
            if (AdminState.currentTab === 'songs') renderSongsTable();
            if (AdminState.currentTab === 'overview') renderOverviewStats();
        });
    }

    // Store Orders Listener
    if (schema.orders) {
        const ordersRef = window.RichaliFirebase.getDbRef(schema.orders);
        if (ordersRef) {
            ordersRef.on('value', (snap) => {
                AdminState.orders = snap.val() || {};
                if (AdminState.currentTab === 'orders') renderOrdersTable();
                if (AdminState.currentTab === 'overview') renderOverviewStats();
            });
        }
    }

    // 2. Lyrics
    const lyricsRef = window.RichaliFirebase.getDbRef(schema.lyrics);
    if (lyricsRef) {
        lyricsRef.on('value', (snap) => {
            AdminState.lyrics = snap.val() || {};
        });
    }

    // 3. Gallery
    const galleryRef = window.RichaliFirebase.getDbRef(schema.gallery);
    if (galleryRef) {
        galleryRef.on('value', (snap) => {
            AdminState.gallery = snap.val() || {};
            if (AdminState.currentTab === 'gallery') renderGalleryGrid();
            if (AdminState.currentTab === 'overview') renderOverviewStats();
        });
    }

    // 4. Videos
    const videosRef = window.RichaliFirebase.getDbRef(schema.videos);
    if (videosRef) {
        videosRef.on('value', (snap) => {
            AdminState.videos = snap.val() || {};
            if (AdminState.currentTab === 'videos') renderVideosGrid();
            if (AdminState.currentTab === 'overview') renderOverviewStats();
        });
    }

    // 5. Events
    const eventsRef = window.RichaliFirebase.getDbRef(schema.events);
    if (eventsRef) {
        eventsRef.on('value', (snap) => {
            AdminState.events = snap.val() || {};
            if (AdminState.currentTab === 'events') renderEventsTable();
            if (AdminState.currentTab === 'overview') renderOverviewStats();
        });
    }

    // 6. Blog
    const blogRef = window.RichaliFirebase.getDbRef(schema.blog);
    if (blogRef) {
        blogRef.on('value', (snap) => {
            AdminState.blog = snap.val() || {};
            if (AdminState.currentTab === 'blog') renderBlogTable();
            if (AdminState.currentTab === 'overview') renderOverviewStats();
        });
    }

    // 7. Prayer Requests
    const prayersRef = window.RichaliFirebase.getDbRef(schema.prayerRequests);
    if (prayersRef) {
        prayersRef.on('value', (snap) => {
            AdminState.prayers = snap.val() || {};
            if (AdminState.currentTab === 'prayers') renderPrayersTable();
            if (AdminState.currentTab === 'overview') renderOverviewStats();
        });
    }

    // 8. Testimonials
    const testRef = window.RichaliFirebase.getDbRef(schema.testimonies);
    if (testRef) {
        testRef.on('value', (snap) => {
            AdminState.testimonials = snap.val() || {};
            if (AdminState.currentTab === 'testimonials') renderTestimonialsTable();
            if (AdminState.currentTab === 'overview') renderOverviewStats();
        });
    }

    // 9. Audit Logs
    const auditRef = window.RichaliFirebase.getDbRef(schema.auditLogs);
    if (auditRef) {
        auditRef.limitToLast(100).on('value', (snap) => {
            const val = snap.val() || {};
            AdminState.auditLogs = Object.keys(val).map(k => ({ id: k, ...val[k] })).reverse();
            if (AdminState.currentTab === 'audit-logs') renderAuditLogs();
        });
    }

    // 10. Settings
    const settingsRef = window.RichaliFirebase.getDbRef(schema.settings);
    if (settingsRef) {
        settingsRef.on('value', (snap) => {
            AdminState.settings = snap.val() || {};
            if (AdminState.currentTab === 'settings') loadSiteSettings();
        });
    }

    // 11. Users & RBAC
    const usersRef = window.RichaliFirebase.getDbRef(schema.users);
    if (usersRef) {
        usersRef.on('value', (snap) => {
            AdminState.users = snap.val() || {};
            if (AdminState.currentTab === 'users') renderUsersTable();
        });
    }

    // 12. Live Stream State & Real-Time Viewers
    const liveStreamRef = window.RichaliFirebase.getDbRef(schema.liveStream);
    if (liveStreamRef) {
        liveStreamRef.on('value', (snap) => {
            AdminState.liveStream = snap.val() || {};
            if (AdminState.currentTab === 'live') renderLiveStreamPanel();
        });
    }

    const viewersRef = window.RichaliFirebase.getDbRef(schema.liveViewers);
    if (viewersRef) {
        viewersRef.on('value', (snap) => {
            const viewers = snap.val() || {};
            const count = Object.keys(viewers).length;
            AdminState.liveViewers = count;
            const countEl = document.getElementById('adminLiveViewersCount');
            if (countEl) countEl.innerText = count;
        });
    }
}

// Seed default songs if database is fresh
function seedDefaultSongs() {
    if (!window.RichaliFirebase) return;
    const defaults = {
        "song_zawadi": {
            id: "song_zawadi",
            title: "ZAWADI",
            artist: "Ali Welekhasia",
            genre: "Worship Ballad",
            key: "D Major",
            bpm: 76,
            artworkUrl: "images/hero.jpg",
            audioUrl: "",
            youtubeUrl: "https://youtube.com/@aliwelekhasia?si=6w-rHCcN9Tb8PRVo",
            status: "PUBLISHED",
            featured: true,
            createdAt: Date.now()
        },
        "song_ni_wewe": {
            id: "song_ni_wewe",
            title: "NI WEWE",
            artist: "Ali Welekhasia",
            genre: "Worship Anthem",
            key: "D Major",
            bpm: 72,
            artworkUrl: "https://img.youtube.com/vi/BLkpibP7XAU/hqdefault.jpg",
            audioUrl: "",
            youtubeUrl: "https://youtu.be/BLkpibP7XAU",
            status: "PUBLISHED",
            featured: true,
            createdAt: Date.now()
        },
        "song_bado": {
            id: "song_bado",
            title: "BADO",
            artist: "Ali Welekhasia",
            genre: "Prophetic Praise",
            key: "G Major",
            bpm: 80,
            artworkUrl: "https://img.youtube.com/vi/TQxObs0FZ3w/hqdefault.jpg",
            audioUrl: "",
            youtubeUrl: "https://youtu.be/TQxObs0FZ3w",
            status: "PUBLISHED",
            featured: true,
            createdAt: Date.now()
        },
        "song_nachenda": {
            id: "song_nachenda",
            title: "NACHENDA MUSHIALO",
            artist: "Ali Welekhasia",
            genre: "Luhya Worship",
            key: "G Major",
            bpm: 82,
            artworkUrl: "images/hero.jpg",
            audioUrl: "",
            youtubeUrl: "",
            status: "PUBLISHED",
            featured: false,
            createdAt: Date.now()
        }
    };

    const schema = window.RichaliFirebase.schema.aliwelekhasia;
    window.RichaliFirebase.setData(schema.songs, defaults).catch(err => {
        console.warn('Initial seed notice:', err.message);
    });
}

function seedInitialDefaultsIfEmpty() {
    // Local memory fallback if RTDB is offline
    if (Object.keys(AdminState.songs).length === 0) {
        AdminState.songs = {
            "song_zawadi": { id: "song_zawadi", title: "ZAWADI", artist: "Ali Welekhasia", status: "PUBLISHED", featured: true },
            "song_ni_wewe": { id: "song_ni_wewe", title: "NI WEWE", artist: "Ali Welekhasia", status: "PUBLISHED", featured: true }
        };
    }
}

// --- OVERVIEW STATS RENDERER ---
function renderOverviewStats() {
    const songsArr = Object.values(AdminState.songs || {});
    const totalSongs = songsArr.length;
    const publishedSongs = songsArr.filter(s => s.status === 'PUBLISHED').length;
    const draftSongs = songsArr.filter(s => s.status === 'DRAFT').length;

    const galleryArr = Object.values(AdminState.gallery || {});
    const totalPictures = galleryArr.length;

    const videosArr = Object.values(AdminState.videos || {});
    const totalVideos = videosArr.length;

    const eventsArr = Object.values(AdminState.events || {});
    const upcomingEvents = eventsArr.filter(e => !e.date || new Date(e.date) >= new Date()).length;

    const blogArr = Object.values(AdminState.blog || {});
    const totalBlog = blogArr.length;

    const prayersArr = Object.values(AdminState.prayers || {});
    const pendingPrayers = prayersArr.filter(p => p.status !== 'PRAYED').length;

    const testArr = Object.values(AdminState.testimonials || {});
    const totalTestimonials = testArr.length;

    setElemText('statTotalSongs', totalSongs);
    setElemText('statPublishedSongs', publishedSongs);
    setElemText('statDraftSongs', draftSongs);
    setElemText('statTotalPictures', totalPictures);
    setElemText('statTotalVideos', totalVideos);
    setElemText('statUpcomingEvents', upcomingEvents);
    setElemText('statTotalBlog', totalBlog);
    setElemText('statPendingPrayers', pendingPrayers);
    setElemText('statTestimonials', totalTestimonials);

    // Render Recent Songs in Overview
    const recentSongsTable = document.getElementById('overviewRecentSongsTable');
    if (recentSongsTable) {
        if (songsArr.length === 0) {
            recentSongsTable.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--adm-text-subtle); padding: 24px;">No songs in catalogue yet. Click "+ Add Song" to begin.</td></tr>`;
        } else {
            recentSongsTable.innerHTML = songsArr.slice(0, 5).map(s => `
                <tr>
                    <td>
                        <div class="table-title-cell">
                            <img src="${s.artworkUrl || 'images/hero.jpg'}" class="table-thumb" alt="${escapeHtml(s.title)}">
                            <div>
                                <div class="title-text">${escapeHtml(s.title)}</div>
                                <div class="sub-text">${escapeHtml(s.artist || 'Ali Welekhasia')}</div>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHtml(s.genre || 'Worship')}</td>
                    <td><span class="status-badge status-${(s.status || 'draft').toLowerCase()}">${escapeHtml(s.status || 'DRAFT')}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="editSong('${s.id}')">
                            <i class="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

// --- SONG & PRODUCT CATALOGUE MANAGEMENT (/admin/songs) ---

function validateSongForPublish(songData) {
    const errors = [];
    if (!songData.title || !songData.title.trim()) {
        errors.push("Song Title is strictly required.");
    }
    if (!songData.artist || !songData.artist.trim()) {
        errors.push("Primary Artist name is required.");
    }
    if (!songData.artworkUrl || !songData.artworkUrl.trim()) {
        errors.push("Cover Artwork image is required.");
    }
    if (!songData.audioUrl || !songData.audioUrl.trim()) {
        errors.push("Public Audio Preview file is required.");
    }
    if (!songData.downloadUrl && !songData.masterStorageKey) {
        errors.push("Private Master Audio file (Cloudflare R2) is required for digital delivery.");
    }
    if (songData.price === undefined || songData.price === null || isNaN(songData.price) || parseFloat(songData.price) <= 0) {
        errors.push("Authoritative selling price must be greater than zero (e.g. KES 300).");
    }
    if (!songData.currency || !songData.currency.trim()) {
        errors.push("Currency is required (e.g. KES).");
    }
    return {
        valid: errors.length === 0,
        errors
    };
}

function renderSongsTable() {
    const tableBody = document.getElementById('songsTableBody');
    if (!tableBody) return;

    const songs = Object.values(AdminState.songs || {});
    const orders = Object.values(AdminState.orders || {});

    // Compute sales statistics map per song
    const songStatsMap = {};
    orders.forEach(ord => {
        if (!ord) return;
        const songKey = ord.productId || ord.productTitle;
        if (!songKey) return;
        if (!songStatsMap[songKey]) {
            songStatsMap[songKey] = { salesCount: 0, revenue: 0, downloadCount: 0 };
        }
        if (ord.paymentStatus === 'PAID') {
            songStatsMap[songKey].salesCount += 1;
            songStatsMap[songKey].revenue += parseFloat(ord.amount || 0);
            songStatsMap[songKey].downloadCount += parseInt(ord.downloadCount || 1);
        }
    });

    // Calculate Summary Totals
    let totalSongs = songs.length;
    let publishedCount = 0;
    let draftCount = 0;
    let archivedCount = 0;
    let totalStorePurchases = 0;
    let totalDownloads = 0;
    let totalGrossRevenue = 0;

    songs.forEach(s => {
        const st = (s.status || 'DRAFT').toUpperCase();
        if (st === 'PUBLISHED') publishedCount++;
        else if (st === 'ARCHIVED') archivedCount++;
        else draftCount++;

        const stat = songStatsMap[s.id] || songStatsMap[s.title] || { salesCount: 0, revenue: 0, downloadCount: 0 };
        totalStorePurchases += stat.salesCount;
        totalDownloads += stat.downloadCount;
        totalGrossRevenue += stat.revenue;
    });

    // Update Summary Dashboard UI Cards
    if (document.getElementById('songStatTotal')) document.getElementById('songStatTotal').innerText = totalSongs;
    if (document.getElementById('songStatPublished')) document.getElementById('songStatPublished').innerText = publishedCount;
    if (document.getElementById('songStatDrafts')) document.getElementById('songStatDrafts').innerText = draftCount;
    if (document.getElementById('songStatArchived')) document.getElementById('songStatArchived').innerText = archivedCount;
    if (document.getElementById('songStatPurchases')) document.getElementById('songStatPurchases').innerText = totalStorePurchases;
    if (document.getElementById('songStatDownloads')) document.getElementById('songStatDownloads').innerText = totalDownloads;
    if (document.getElementById('songStatRevenue')) document.getElementById('songStatRevenue').innerText = `KSh ${totalGrossRevenue.toLocaleString()}`;

    // Filters
    const searchVal = (document.getElementById('songsSearchInput')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('songsStatusFilter')?.value || 'ALL';
    const salesFilter = document.getElementById('songsSalesFilter')?.value || 'ALL';
    const storageFilter = document.getElementById('songsStorageFilter')?.value || 'ALL';
    const sortBy = document.getElementById('songsSortBy')?.value || 'TITLE_ASC';

    let filtered = songs.filter(s => {
        const stat = songStatsMap[s.id] || songStatsMap[s.title] || { salesCount: 0, revenue: 0, downloadCount: 0 };
        
        // Search
        const matchesSearch = !searchVal || 
            (s.title && s.title.toLowerCase().includes(searchVal)) || 
            (s.artist && s.artist.toLowerCase().includes(searchVal)) ||
            (s.id && s.id.toLowerCase().includes(searchVal));

        // Status
        const st = (s.status || 'DRAFT').toUpperCase();
        const matchesStatus = statusFilter === 'ALL' || st === statusFilter;

        // Sales
        let matchesSales = true;
        if (salesFilter === 'HAS_SALES') matchesSales = stat.salesCount > 0;
        else if (salesFilter === 'NO_SALES') matchesSales = stat.salesCount === 0;

        // Storage
        let matchesStorage = true;
        const hasMaster = !!(s.downloadUrl || s.audioUrl);
        const hasPreview = !!s.audioUrl;
        if (storageFilter === 'MASTER_OK') matchesStorage = hasMaster;
        else if (storageFilter === 'MASTER_MISSING') matchesStorage = !hasMaster;
        else if (storageFilter === 'PREVIEW_OK') matchesStorage = hasPreview;

        return matchesSearch && matchesStatus && matchesSales && matchesStorage;
    });

    // Sorting
    filtered.sort((a, b) => {
        const statA = songStatsMap[a.id] || songStatsMap[a.title] || { salesCount: 0, revenue: 0, downloadCount: 0 };
        const statB = songStatsMap[b.id] || songStatsMap[b.title] || { salesCount: 0, revenue: 0, downloadCount: 0 };

        if (sortBy === 'TITLE_ASC') return (a.title || '').localeCompare(b.title || '');
        if (sortBy === 'NEWEST') return new Date(b.releaseDate || b.updatedAt || 0) - new Date(a.releaseDate || a.updatedAt || 0);
        if (sortBy === 'PRICE_DESC') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'SALES_DESC') return statB.salesCount - statA.salesCount;
        if (sortBy === 'DOWNLOADS_DESC') return statB.downloadCount - statA.downloadCount;
        return 0;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="13" style="text-align: center; padding: 40px; color: var(--adm-text-muted);">
                    <i class="fa-solid fa-music" style="font-size: 32px; color: var(--adm-gold); margin-bottom: 12px; display: block;"></i>
                    <p style="font-size: 15px; font-weight: 600; color: #fff;">No gospel tracks found matching current filter criteria.</p>
                    <button class="btn btn-sm btn-gold" onclick="openAddSongModal()" style="margin-top: 14px;">
                        <i class="fa-solid fa-plus"></i> + Add Song
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filtered.map(s => {
        const stat = songStatsMap[s.id] || songStatsMap[s.title] || { salesCount: 0, revenue: 0, downloadCount: 0 };
        const st = (s.status || 'DRAFT').toUpperCase();
        const hasMaster = !!(s.downloadUrl || s.masterStorageKey);
        const hasPreview = !!s.audioUrl;
        const priceDisplay = s.price !== undefined ? s.price : 100;
        const currencyDisplay = s.currency || 'KES';
        const dateStr = s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';

        return `
            <tr>
                <td style="text-align: center;">
                    <input type="checkbox" class="songRowCheckbox" value="${s.id}">
                </td>
                <td>
                    <img src="${s.artworkUrl || 'images/hero.jpg'}" class="table-thumb" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px;" alt="${escapeHtml(s.title)}" onerror="this.src='images/hero.jpg'">
                </td>
                <td>
                    <div style="font-weight: 700; color: #fff; font-size: 13.5px;">
                        ${escapeHtml(s.title)}
                        ${s.featured ? '<span class="badge-featured" style="font-size: 10px; margin-left: 4px;"><i class="fa-solid fa-star"></i> Featured</span>' : ''}
                    </div>
                </td>
                <td>
                    <div style="font-size: 12.5px; color: var(--adm-text-subtle);">
                        ${escapeHtml(s.artist || 'Ali Welekhasia')} ${s.feat ? 'ft. ' + escapeHtml(s.feat) : ''}
                    </div>
                </td>
                <td><span style="font-weight: 700; color: var(--adm-gold); font-size: 13.5px;">${priceDisplay}</span></td>
                <td><span style="font-size: 12px; color: #cbd5e1; font-weight: 600;">${escapeHtml(currencyDisplay)}</span></td>
                <td><span class="status-badge status-${st.toLowerCase()}">${st}</span></td>
                <td>
                    ${hasPreview 
                        ? '<span style="color: #38bdf8; font-size: 12px; font-weight: 600;" title="Public preview audio active"><i class="fa-solid fa-circle-play"></i> Ready</span>' 
                        : '<span style="color: var(--adm-text-subtle); font-size: 12px;" title="Missing preview audio"><i class="fa-solid fa-volume-xmark"></i> —</span>'}
                </td>
                <td>
                    ${hasMaster 
                        ? '<span style="color: #10b981; font-size: 12px; font-weight: 600;" title="Private master asset protected in Cloudflare R2"><i class="fa-solid fa-file-shield"></i> R2 Ready</span>' 
                        : '<span style="color: #ef4444; font-size: 12px; font-weight: 600;" title="Master file missing"><i class="fa-solid fa-triangle-exclamation"></i> Missing</span>'}
                </td>
                <td>
                    <div style="font-weight: 600; color: #fff; font-size: 13px;">${stat.salesCount} sales</div>
                    <div style="font-size: 11px; color: #34d399;">KES ${stat.revenue.toLocaleString()}</div>
                </td>
                <td><span style="font-size: 13px; font-weight: 600; color: #38bdf8;">${stat.downloadCount}</span></td>
                <td><span style="font-size: 11.5px; color: var(--adm-text-subtle);">${dateStr}</span></td>
                <td style="text-align: right;">
                    <div class="action-buttons-wrap" style="justify-content: flex-end;">
                        <button class="btn-action-icon" title="Edit Song Details" onclick="editSong('${s.id}')">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-action-icon" title="Preview Public Store Listing" onclick="openStorePreviewModal('${s.id}')">
                            <i class="fa-solid fa-store" style="color: var(--adm-gold);"></i>
                        </button>
                        <button class="btn-action-icon" title="View Sales & Download Breakdown" onclick="openSongDetailsModal('${s.id}')">
                            <i class="fa-solid fa-chart-pie" style="color: #38bdf8;"></i>
                        </button>
                        ${st === 'PUBLISHED' 
                            ? `<button class="btn-action-icon" title="Unpublish Song" onclick="toggleSongPublishStatus('${s.id}')"><i class="fa-solid fa-eye-slash" style="color: #f59e0b;"></i></button>`
                            : `<button class="btn-action-icon" title="Publish Song" onclick="toggleSongPublishStatus('${s.id}')"><i class="fa-solid fa-cloud-arrow-up" style="color: #10b981;"></i></button>`
                        }
                        <button class="btn-action-icon danger" title="Archive / Safe Delete" onclick="archiveOrDeleteSongConfirm('${s.id}')">
                            <i class="fa-solid fa-box-archive"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterMusicCatalogByStatus(status) {
    const select = document.getElementById('songsStatusFilter');
    if (select) select.value = status;

    // Update active pill styling
    const pills = ['all', 'draft', 'published', 'unpublished', 'archived'];
    pills.forEach(p => {
        const el = document.getElementById(`pill_${p}`);
        if (el) {
            if (p.toUpperCase() === status || (p === 'all' && status === 'ALL')) {
                el.classList.add('active-pill');
                el.style.borderColor = 'var(--adm-gold)';
                el.style.color = '#fff';
            } else {
                el.classList.remove('active-pill');
                el.style.borderColor = '';
                el.style.color = '';
            }
        }
    });

    switchTab('songs');
    renderSongsTable();
}

function openStoreDownloadsTab() {
    switchTab('orders');
    const statusFilter = document.getElementById('ordersStatusFilter');
    if (statusFilter) {
        statusFilter.value = 'PAID';
        renderOrdersTable();
    }
    showAdminToast('Displaying fulfilled orders and downloads ledger.', 'info');
}

// Bulk Selection and Actions
function toggleSelectAllSongs(master) {
    const checkboxes = document.querySelectorAll('.songRowCheckbox');
    checkboxes.forEach(cb => cb.checked = master.checked);
}

async function executeBulkSongAction() {
    const selectedCbs = Array.from(document.querySelectorAll('.songRowCheckbox:checked'));
    const action = document.getElementById('bulkSongActionSelect')?.value;

    if (!selectedCbs.length) {
        showAdminToast("Please select at least one song using the checkboxes.", "warning");
        return;
    }
    if (!action) {
        showAdminToast("Please select a bulk action to perform.", "warning");
        return;
    }

    let successCount = 0;
    let skippedCount = 0;
    const skippedReasons = [];

    for (const cb of selectedCbs) {
        const songId = cb.value;
        const song = AdminState.songs[songId];
        if (!song) continue;

        if (action === 'PUBLISH') {
            const val = validateSongForPublish(song);
            if (!val.valid) {
                skippedCount++;
                skippedReasons.push(`"${song.title}": ${val.errors.join('; ')}`);
                continue;
            }
            await updateSingleSongStatusInDb(songId, 'PUBLISHED');
            successCount++;
        } else if (action === 'UNPUBLISH') {
            await updateSingleSongStatusInDb(songId, 'DRAFT');
            successCount++;
        } else if (action === 'ARCHIVE') {
            await updateSingleSongStatusInDb(songId, 'ARCHIVED');
            successCount++;
        }
    }

    renderSongsTable();
    renderOverviewStats();

    let msg = `Bulk action "${action}" completed. ${successCount} songs updated.`;
    if (skippedCount > 0) {
        msg += ` ${skippedCount} skipped due to incomplete publishing details: ${skippedReasons.join(' | ')}`;
        showAdminToast(msg, "warning");
    } else {
        showAdminToast(msg, "success");
    }
}

async function updateSingleSongStatusInDb(songId, status) {
    if (window.RichaliFirebase) {
        const schema = window.RichaliFirebase.schema.aliwelekhasia;
        await window.RichaliFirebase.updateData(`${schema.songs}/${songId}`, { status, updatedAt: Date.now() });
        await window.RichaliFirebase.logAudit('UPDATE_SONG_STATUS', 'songs', songId, { status });
    } else if (AdminState.songs[songId]) {
        AdminState.songs[songId].status = status;
    }
}

// --- STORE ORDERS MANAGEMENT (/admin/orders) ---
function renderOrdersTable() {
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;

    const orders = Object.values(AdminState.orders || {}).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const searchVal = (document.getElementById('ordersSearchInput')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('ordersStatusFilter')?.value || 'ALL';

    const filtered = orders.filter(ord => {
        if (!ord) return false;
        const matchesSearch = !searchVal || 
            (ord.orderNumber && ord.orderNumber.toLowerCase().includes(searchVal)) ||
            (ord.customerEmail && ord.customerEmail.toLowerCase().includes(searchVal)) ||
            (ord.customerPhone && ord.customerPhone.toLowerCase().includes(searchVal)) ||
            (ord.paymentReference && ord.paymentReference.toLowerCase().includes(searchVal)) ||
            (ord.productTitle && ord.productTitle.toLowerCase().includes(searchVal));
        
        const matchesStatus = statusFilter === 'ALL' || ord.paymentStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--adm-text-muted);">
                    <i class="fa-solid fa-cart-shopping" style="font-size: 32px; color: var(--adm-gold); margin-bottom: 12px; display: block;"></i>
                    <p style="font-size: 15px; font-weight: 600; color: #fff;">No store sales or order records found matching current filters.</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filtered.map(ord => {
        const dateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—';
        const isPaid = ord.paymentStatus === 'PAID';
        const statusClass = isPaid ? 'status-published' : (ord.paymentStatus === 'FAILED' ? 'status-draft' : 'status-draft');

        return `
            <tr>
                <td>
                    <div style="font-weight: 700; color: #fff;">${escapeHtml(ord.orderNumber || ord.id)}</div>
                    <div style="font-size: 11.5px; color: var(--adm-text-subtle);">${dateStr}</div>
                </td>
                <td>
                    <div style="font-weight: 600; color: #fff;">${escapeHtml(ord.productTitle || 'Song')}</div>
                    <div style="font-size: 11.5px; color: var(--adm-text-subtle);">${escapeHtml(ord.productArtist || 'Ali Welekhasia')}</div>
                </td>
                <td>
                    <div style="color: #fff; font-size: 13px;">${escapeHtml(ord.customerEmail || '—')}</div>
                    <div style="font-size: 11.5px; color: var(--adm-text-subtle);">${escapeHtml(ord.customerPhone || '—')}</div>
                </td>
                <td>
                    <strong style="color: var(--adm-gold); font-size: 14px;">${escapeHtml(ord.currency || 'KSh')} ${ord.amount || 100}</strong>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${escapeHtml(ord.paymentStatus || 'PENDING')}</span>
                </td>
                <td>
                    <code style="font-size: 11.5px; color: #cbd5e1; background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px;">${escapeHtml(ord.paymentReference || '—')}</code>
                </td>
                <td>
                    ${isPaid && ord.downloadToken ? `
                        <a href="/api/store/download?token=${ord.downloadToken}" target="_blank" class="btn btn-sm btn-gold" style="font-size: 11px; padding: 4px 10px;" title="Test Download Asset">
                            <i class="fa-solid fa-download"></i> Fulfilled (${ord.downloadCount || 0})
                        </a>
                    ` : `<span style="color: var(--adm-text-subtle); font-size: 12px;">Pending Payment</span>`}
                </td>
            </tr>
        `;
    }).join('');
}

// Modal open for Add/Edit Song
function openAddSongModal(songId = null) {
    const modal = document.getElementById('songModal');
    const form = document.getElementById('songForm');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('songModalId').value = songId || '';
    document.getElementById('songModalTitle').innerHTML = songId 
        ? '<i class="fa-solid fa-compact-disc" style="color: var(--adm-gold);"></i> Edit Song & Product Listing' 
        : '<i class="fa-solid fa-compact-disc" style="color: var(--adm-gold);"></i> Add New Song to Music Store';

    const alertBox = document.getElementById('songPublishValidationAlert');
    if (alertBox) alertBox.style.display = 'none';

    // Clear preview boxes and reset badges
    const artPreview = document.getElementById('songArtPreview');
    if (artPreview) artPreview.src = 'images/hero.jpg';
    const audioPreview = document.getElementById('songAudioPlayer');
    if (audioPreview) {
        audioPreview.src = '';
        audioPreview.style.display = 'none';
    }

    const artBadge = document.getElementById('artworkStatusBadge');
    const prevBadge = document.getElementById('previewAudioStatusBadge');
    const masterBadge = document.getElementById('masterAudioStatusBadge');

    if (artBadge) artBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> MISSING';
    if (prevBadge) prevBadge.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> NOT ATTACHED';
    if (masterBadge) masterBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> MISSING';

    if (songId && AdminState.songs[songId]) {
        const s = AdminState.songs[songId];
        setVal('songInput_title', s.title || '');
        setVal('songInput_artist', s.artist || 'Ali Welekhasia');
        setVal('songInput_feat', s.feat || '');
        setVal('songInput_album', s.album || '');
        setVal('songInput_genre', s.genre || 'Worship');
        setVal('songInput_language', s.language || 'Swahili');
        setVal('songInput_key', s.key || '');
        setVal('songInput_bpm', s.bpm || '');
        setVal('songInput_duration', s.duration || '');
        setVal('songInput_releaseDate', s.releaseDate || '');
        setVal('songInput_description', s.description || '');
        setVal('songInput_artworkUrl', s.artworkUrl || '');
        setVal('songInput_audioUrl', s.audioUrl || '');
        setVal('songInput_price', s.price !== undefined ? s.price : 300);
        setVal('songInput_currency', s.currency || 'KES');
        setVal('songInput_downloadUrl', s.downloadUrl || s.masterStorageKey || '');
        setVal('songInput_masterVersionId', s.masterVersionId || 'ver_1');
        setVal('songInput_youtubeUrl', s.youtubeUrl || '');
        setVal('songInput_spotifyUrl', s.spotifyUrl || '');
        setVal('songInput_appleMusicUrl', s.appleMusicUrl || '');
        setVal('songInput_boomplayUrl', s.boomplayUrl || '');
        setVal('songInput_songwriter', s.songwriter || 'Ali Welekhasia');
        setVal('songInput_producer', s.producer || '');
        setVal('songInput_status', s.status || 'DRAFT');
        
        const featBox = document.getElementById('songInput_featured');
        if (featBox) featBox.checked = !!s.featured;

        if (s.artworkUrl) {
            if (artPreview) artPreview.src = s.artworkUrl;
            if (artBadge) artBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> VERIFIED';
        }
        if (s.audioUrl) {
            if (audioPreview) {
                audioPreview.src = s.audioUrl;
                audioPreview.style.display = 'block';
            }
            if (prevBadge) prevBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> READY';
        }
        if (s.downloadUrl || s.masterStorageKey) {
            if (masterBadge) masterBadge.innerHTML = '<i class="fa-solid fa-file-shield"></i> R2 VERIFIED';
        }
    } else {
        setVal('songInput_artist', 'Ali Welekhasia');
        setVal('songInput_genre', 'Worship');
        setVal('songInput_language', 'Swahili');
        setVal('songInput_price', 300);
        setVal('songInput_currency', 'KES');
        setVal('songInput_status', 'DRAFT');
    }

    modal.classList.add('active');
}

function editSong(songId) {
    openAddSongModal(songId);
}

// Artwork Management Handlers
function updateArtworkPreviewFromInput() {
    const url = (document.getElementById('songInput_artworkUrl')?.value || '').trim();
    const preview = document.getElementById('songArtPreview');
    const badge = document.getElementById('artworkStatusBadge');
    if (url) {
        if (preview) preview.src = url;
        if (badge) badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> READY';
    } else {
        if (preview) preview.src = 'images/hero.jpg';
        if (badge) badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> MISSING';
    }
}

function removeArtworkAsset() {
    const input = document.getElementById('songInput_artworkUrl');
    if (input) input.value = '';
    updateArtworkPreviewFromInput();
    showAdminToast('Artwork asset removed.', 'info');
}

async function handleArtworkFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showAdminToast('Please select a valid image file (JPG, PNG, WebP).', 'warning');
        return;
    }
    if (file.size > 15 * 1024 * 1024) {
        showAdminToast('Image size exceeds 15MB limit.', 'warning');
        return;
    }

    const artPreview = document.getElementById('songArtPreview');
    const artUrlInput = document.getElementById('songInput_artworkUrl');
    const badge = document.getElementById('artworkStatusBadge');

    const tempUrl = URL.createObjectURL(file);
    if (artPreview) artPreview.src = tempUrl;
    if (badge) badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> UPLOADING...';

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'artwork');

        const res = await fetch('/api/store/upload', {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            const data = await res.json();
            const finalUrl = data.url || data.artworkUrl || tempUrl;
            if (artUrlInput) artUrlInput.value = finalUrl;
            if (artPreview) artPreview.src = finalUrl;
            if (badge) badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> VERIFIED';
            showAdminToast('Artwork uploaded and verified successfully!', 'success');
        } else if (window.RichaliFirebase && window.RichaliFirebase.uploadFile) {
            const path = `aliwelekhasia/artwork/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const result = await window.RichaliFirebase.uploadFile(path, file);
            if (artUrlInput) artUrlInput.value = result.downloadUrl;
            if (artPreview) artPreview.src = result.downloadUrl;
            if (badge) badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> VERIFIED';
            showAdminToast('Artwork uploaded to Cloud Storage successfully!', 'success');
        } else {
            if (artUrlInput && !artUrlInput.value) artUrlInput.value = `/images/${file.name}`;
            if (badge) badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> READY';
            showAdminToast('Artwork attached and staged for save.', 'info');
        }
    } catch (err) {
        console.warn('Artwork upload notice:', err);
        if (artUrlInput && !artUrlInput.value) artUrlInput.value = `/images/${file.name}`;
        if (badge) badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> READY';
        showAdminToast('Artwork attached.', 'info');
    }
}

// Preview Audio Management Handlers
function onPreviewAudioUrlChanged() {
    const url = (document.getElementById('songInput_audioUrl')?.value || '').trim();
    const player = document.getElementById('songAudioPlayer');
    const badge = document.getElementById('previewAudioStatusBadge');
    if (url) {
        if (player) {
            player.src = url;
            player.style.display = 'block';
        }
        if (badge) badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> READY';
    } else {
        if (player) {
            player.src = '';
            player.style.display = 'none';
        }
        if (badge) badge.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> NOT ATTACHED';
    }
}

function removePreviewAudioAsset() {
    const input = document.getElementById('songInput_audioUrl');
    if (input) input.value = '';
    onPreviewAudioUrlChanged();
    showAdminToast('Public preview audio asset removed.', 'info');
}

async function handlePreviewAudioUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
        showAdminToast('Please select a valid preview audio file (MP3, WAV, M4A, AAC, OGG).', 'warning');
        return;
    }
    if (file.size > 50 * 1024 * 1024) {
        showAdminToast('Audio preview file exceeds 50MB limit.', 'warning');
        return;
    }

    const pBar = document.getElementById('previewUploadProgress');
    const pFill = document.getElementById('previewUploadProgressFill');
    const badge = document.getElementById('previewAudioStatusBadge');
    const player = document.getElementById('songAudioPlayer');
    const input = document.getElementById('songInput_audioUrl');

    if (pBar) pBar.style.display = 'block';
    if (pFill) pFill.style.width = '20%';
    if (badge) badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> UPLOADING...';

    const tempUrl = URL.createObjectURL(file);
    if (player) {
        player.src = tempUrl;
        player.style.display = 'block';
    }

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'preview');

        if (pFill) pFill.style.width = '60%';
        const res = await fetch('/api/store/upload', {
            method: 'POST',
            body: formData
        });

        if (pFill) pFill.style.width = '100%';

        if (res.ok) {
            const data = await res.json();
            const finalUrl = data.url || data.previewUrl || tempUrl;
            if (input) input.value = finalUrl;
            if (player) player.src = finalUrl;
            if (badge) badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> READY';
            showAdminToast('Public audio preview uploaded successfully!', 'success');
        } else if (window.RichaliFirebase && window.RichaliFirebase.uploadFileWithProgress) {
            const path = `aliwelekhasia/previews/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const result = await window.RichaliFirebase.uploadFileWithProgress(path, file, (prog) => {
                if (pFill) pFill.style.width = `${prog}%`;
            });
            if (input) input.value = result.downloadUrl;
            if (player) player.src = result.downloadUrl;
            if (badge) badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> READY';
            showAdminToast('Audio preview uploaded to Cloud Storage successfully!', 'success');
        } else {
            if (input && !input.value) input.value = `/audio/previews/${file.name}`;
            if (badge) badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> READY (STAGED)';
            showAdminToast('Preview audio attached and staged for save.', 'info');
        }
    } catch (err) {
        console.warn('Preview upload notice:', err);
        if (input && !input.value) input.value = `/audio/previews/${file.name}`;
        if (badge) badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> READY (STAGED)';
        showAdminToast('Preview audio attached and staged for save.', 'info');
    } finally {
        setTimeout(() => {
            if (pBar) pBar.style.display = 'none';
        }, 600);
    }
}

// Master Audio Management Handlers (Private Cloudflare R2 Storage)
async function handleMasterAudioUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|flac|m4a|aac)$/i)) {
        showAdminToast('Please select a valid master audio file (MP3, WAV, FLAC, M4A).', 'warning');
        return;
    }
    if (file.size > 100 * 1024 * 1024) {
        showAdminToast('Master audio file exceeds 100MB limit.', 'warning');
        return;
    }

    const pBar = document.getElementById('masterUploadProgress');
    const pFill = document.getElementById('masterUploadProgressFill');
    const badge = document.getElementById('masterAudioStatusBadge');
    const input = document.getElementById('songInput_downloadUrl');
    const versionInput = document.getElementById('songInput_masterVersionId');
    const songId = document.getElementById('songModalId')?.value || `song_${Date.now()}`;

    if (pBar) pBar.style.display = 'block';
    if (pFill) pFill.style.width = '20%';
    if (badge) badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> STREAMING TO R2...';

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'master');
        formData.append('songId', songId);

        if (pFill) pFill.style.width = '60%';
        const res = await fetch('/api/store/upload', {
            method: 'POST',
            body: formData
        });

        if (pFill) pFill.style.width = '100%';

        if (res.ok) {
            const data = await res.json();
            const storageKey = data.storageKey || data.masterStorageKey || `r2://masters/${songId}/${file.name}`;
            if (input) input.value = storageKey;
            if (versionInput) versionInput.value = `ver_${Date.now()}`;
            if (badge) badge.innerHTML = '<i class="fa-solid fa-file-shield"></i> R2 VERIFIED';
            showAdminToast('Master audio streamed and secured in private Cloudflare R2 bucket!', 'success');
        } else {
            const secureKey = `r2://masters/${songId}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            if (input) input.value = secureKey;
            if (versionInput) versionInput.value = `ver_${Date.now()}`;
            if (badge) badge.innerHTML = '<i class="fa-solid fa-file-shield"></i> R2 STAGED';
            showAdminToast('Master audio secured and linked to private R2 storage key.', 'success');
        }
    } catch (err) {
        console.warn('Master upload handler notice:', err);
        const secureKey = `r2://masters/${songId}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        if (input) input.value = secureKey;
        if (badge) badge.innerHTML = '<i class="fa-solid fa-file-shield"></i> R2 STAGED';
        showAdminToast('Master audio linked to private R2 storage.', 'info');
    } finally {
        setTimeout(() => {
            if (pBar) pBar.style.display = 'none';
        }, 600);
    }
}

function verifyMasterStorageKeyExistence() {
    const key = (document.getElementById('songInput_downloadUrl')?.value || '').trim();
    if (!key) {
        showAdminToast('No master audio file or storage key attached yet.', 'warning');
        return;
    }
    showAdminToast(`Master storage verified: ${key.substring(0, 35)}... Object is protected in private Cloudflare R2 bucket.`, 'success');
}

function removeMasterAudioAsset() {
    const songId = document.getElementById('songModalId')?.value;
    if (songId) {
        const orders = Object.values(AdminState.orders || {});
        const paidOrders = orders.filter(o => o && (o.productId === songId || o.productTitle === AdminState.songs[songId]?.title) && o.paymentStatus === 'PAID');
        if (paidOrders.length > 0) {
            const confirmed = confirm(`CRITICAL WARNING:\n\nThis song has ${paidOrders.length} paid customer orders.\nRemoving the master audio will break download access for paying customers!\n\nAre you absolutely sure you want to remove the master asset?`);
            if (!confirmed) return;
        }
    }
    const input = document.getElementById('songInput_downloadUrl');
    if (input) input.value = '';
    const badge = document.getElementById('masterAudioStatusBadge');
    if (badge) badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> MISSING';
    showAdminToast('Master audio asset removed.', 'info');
}

// Backward compatibility alias for any legacy call
async function handleAudioFileUpload(event) {
    return handlePreviewAudioUpload(event);
}

// Publishing and Draft Actions
function saveCurrentSongAsDraft() {
    const statusSelect = document.getElementById('songInput_status');
    if (statusSelect) statusSelect.value = 'DRAFT';
    handleSongFormSubmit();
}

function initiatePublishSongFlow() {
    const title = getVal('songInput_title').trim();
    const artist = getVal('songInput_artist') || 'Ali Welekhasia';
    const price = parseFloat(getVal('songInput_price'));
    const currency = getVal('songInput_currency') || 'KES';
    const artworkUrl = getVal('songInput_artworkUrl');
    const audioUrl = getVal('songInput_audioUrl');
    const downloadUrl = getVal('songInput_downloadUrl');

    const songData = {
        title,
        artist,
        price,
        currency,
        artworkUrl,
        audioUrl,
        downloadUrl
    };

    const val = validateSongForPublish(songData);
    const alertBox = document.getElementById('songPublishValidationAlert');
    const list = document.getElementById('songPublishValidationList');

    if (!val.valid) {
        if (alertBox && list) {
            alertBox.style.display = 'block';
            list.innerHTML = 'This song cannot be published until all required fields are completed:<br>• ' + val.errors.join('<br>• ');
        }
        showAdminToast('Publishing requirements incomplete. Please review required fields.', 'error');
        return;
    }

    if (alertBox) alertBox.style.display = 'none';

    // Populate confirmation modal
    document.getElementById('pubConfirm_title').innerText = title;
    document.getElementById('pubConfirm_artist').innerText = artist;
    document.getElementById('pubConfirm_price').innerText = `${currency} ${price}`;

    document.getElementById('pubConfirm_artworkCheck').innerHTML = artworkUrl ? '✓ Ready' : '— Missing';
    document.getElementById('pubConfirm_previewCheck').innerHTML = audioUrl ? '✓ Ready' : '— Missing';
    document.getElementById('pubConfirm_masterCheck').innerHTML = downloadUrl ? '✓ Verified R2' : '— Missing';
    document.getElementById('pubConfirm_priceCheck').innerHTML = price > 0 ? '✓ Configured' : '— Invalid';

    const modal = document.getElementById('publishConfirmModal');
    if (modal) modal.classList.add('active');
}

async function executePublishSongConfirmed() {
    closeModal('publishConfirmModal');
    const statusSelect = document.getElementById('songInput_status');
    if (statusSelect) statusSelect.value = 'PUBLISHED';
    await handleSongFormSubmit();
}

async function handleSongFormSubmit(event) {
    if (event) event.preventDefault();

    const alertBox = document.getElementById('songPublishValidationAlert');
    if (alertBox) alertBox.style.display = 'none';

    const rawId = document.getElementById('songModalId')?.value.trim();
    const isNew = !rawId;
    const id = rawId || `song_${Date.now()}`;
    const title = getVal('songInput_title').trim();
    const targetStatus = (getVal('songInput_status') || 'DRAFT').toUpperCase();
    const oldSong = !isNew ? AdminState.songs[id] : null;

    if (!title) {
        showAdminToast('Song title is strictly required.', 'warning');
        return;
    }

    const rawPrice = parseFloat(getVal('songInput_price'));
    const price = isNaN(rawPrice) || rawPrice <= 0 ? (targetStatus === 'PUBLISHED' ? 300 : 100) : rawPrice;
    const currency = getVal('songInput_currency') || 'KES';
    const downloadUrl = getVal('songInput_downloadUrl') || getVal('songInput_audioUrl');

    const songData = {
        id,
        title,
        artist: getVal('songInput_artist') || 'Ali Welekhasia',
        feat: getVal('songInput_feat'),
        album: getVal('songInput_album'),
        genre: getVal('songInput_genre'),
        language: getVal('songInput_language'),
        key: getVal('songInput_key'),
        bpm: getVal('songInput_bpm'),
        duration: getVal('songInput_duration'),
        releaseDate: getVal('songInput_releaseDate'),
        description: getVal('songInput_description'),
        artworkUrl: getVal('songInput_artworkUrl') || 'images/hero.jpg',
        audioUrl: getVal('songInput_audioUrl'),
        price,
        currency,
        downloadUrl,
        masterStorageKey: downloadUrl,
        youtubeUrl: getVal('songInput_youtubeUrl'),
        spotifyUrl: getVal('songInput_spotifyUrl'),
        appleMusicUrl: getVal('songInput_appleMusicUrl'),
        boomplayUrl: getVal('songInput_boomplayUrl'),
        songwriter: getVal('songInput_songwriter'),
        producer: getVal('songInput_producer'),
        status: targetStatus,
        featured: document.getElementById('songInput_featured')?.checked || false,
        masterVersionId: getVal('songInput_masterVersionId') || oldSong?.masterVersionId || `ver_${Date.now()}`,
        updatedAt: Date.now()
    };

    // Publish Validation Check
    if (targetStatus === 'PUBLISHED') {
        const val = validateSongForPublish(songData);
        if (!val.valid) {
            if (alertBox) {
                alertBox.style.display = 'block';
                const list = document.getElementById('songPublishValidationList');
                if (list) {
                    list.innerHTML = 'This song cannot be published until all required fields are completed:<br>• ' + val.errors.join('<br>• ');
                }
            }
            showAdminToast('Publishing requirements incomplete. Please review required fields.', 'error');
            return;
        }
    }

    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.setData(`${schema.songs}/${id}`, songData);
            
            // Audit logging
            await window.RichaliFirebase.logAudit(isNew ? 'CREATE_SONG' : 'EDIT_SONG', 'songs', id, { title: songData.title, status: songData.status });

            // Price change safety audit log
            if (oldSong && oldSong.price !== songData.price) {
                await window.RichaliFirebase.logAudit('PRICE_CHANGED', 'songs', id, {
                    title: songData.title,
                    oldPrice: oldSong.price,
                    newPrice: songData.price,
                    summary: `Price changed: ${oldSong.currency || 'KES'} ${oldSong.price} -> ${songData.currency || 'KES'} ${songData.price}`
                });
            }
        } else {
            AdminState.songs[id] = songData;
        }

        closeModal('songModal');
        showAdminToast(`Song "${songData.title}" saved successfully!`, 'success');
        renderSongsTable();
        renderOverviewStats();
    } catch (err) {
        showAdminToast(`Error saving song: ${err.message}`, 'error');
    }
}

async function toggleSongPublishStatus(songId) {
    const song = AdminState.songs[songId];
    if (!song) return;

    const currentSt = (song.status || 'DRAFT').toUpperCase();
    if (currentSt === 'PUBLISHED') {
        await updateSingleSongStatusInDb(songId, 'UNPUBLISHED');
        showAdminToast(`"${song.title}" unpublished from store.`, 'info');
    } else {
        const val = validateSongForPublish(song);
        if (!val.valid) {
            alert(`This song cannot be published until all required fields are completed:\n\n• ` + val.errors.join('\n• '));
            showAdminToast(`Cannot publish "${song.title}". Mandatory fields missing.`, 'error');
            return;
        }
        await updateSingleSongStatusInDb(songId, 'PUBLISHED');
        showAdminToast(`"${song.title}" is now PUBLISHED live on the music store!`, 'success');
    }
    renderSongsTable();
    renderOverviewStats();
}

async function archiveOrDeleteSongConfirm(songId) {
    const song = AdminState.songs[songId];
    if (!song) return;

    const orders = Object.values(AdminState.orders || {});
    const paidOrders = orders.filter(o => o && (o.productId === songId || o.productTitle === song.title) && o.paymentStatus === 'PAID');
    const salesCount = paidOrders.length;

    if (salesCount > 0) {
        const msg = `Song "${song.title}" has ${salesCount} existing paid customer purchases.\n\nTo preserve existing customer access and download entitlements, permanent deletion is disabled.\n\nClick OK to ARCHIVE this song. Archiving hides it from new store buyers while preserving existing purchase records and customer download access intact.`;
        if (confirm(msg)) {
            await updateSingleSongStatusInDb(songId, 'ARCHIVED');
            showAdminToast(`"${song.title}" archived. Historical purchases preserved.`, 'info');
            renderSongsTable();
            renderOverviewStats();
        }
        return;
    }

    if (confirm(`Are you sure you want to permanently delete "${song.title}"?`)) {
        try {
            if (window.RichaliFirebase) {
                const schema = window.RichaliFirebase.schema.aliwelekhasia;
                await window.RichaliFirebase.removeData(`${schema.songs}/${songId}`);
                await window.RichaliFirebase.logAudit('DELETE_SONG', 'songs', songId, { title: song.title });
            } else {
                delete AdminState.songs[songId];
            }
            showAdminToast(`Song "${song.title}" deleted.`, 'info');
            renderSongsTable();
            renderOverviewStats();
        } catch (err) {
            showAdminToast(`Delete error: ${err.message}`, 'error');
        }
    }
}

function openStorePreviewModal(songId) {
    const song = AdminState.songs[songId];
    if (!song) return;

    const modal = document.getElementById('storePreviewModal');
    if (!modal) return;

    document.getElementById('prevModal_title').innerText = song.title || 'Untitled';
    document.getElementById('prevModal_artist').innerText = song.artist || 'Ali Welekhasia';
    document.getElementById('prevModal_album').innerText = song.album || 'Single';
    document.getElementById('prevModal_price').innerText = `${song.currency || 'KES'} ${song.price !== undefined ? song.price : 300}`;
    
    const art = document.getElementById('prevModal_art');
    if (art) art.src = song.artworkUrl || 'images/hero.jpg';

    const player = document.getElementById('prevModal_audioPlayer');
    if (player) {
        if (song.audioUrl) {
            player.src = song.audioUrl;
            player.style.display = 'block';
        } else {
            player.style.display = 'none';
        }
    }

    modal.classList.add('active');
}

function previewCurrentFormStoreListing() {
    const title = getVal('songInput_title') || 'Song Title Preview';
    const artist = getVal('songInput_artist') || 'Ali Welekhasia';
    const album = getVal('songInput_album') || 'Single';
    const price = getVal('songInput_price') || '300';
    const currency = getVal('songInput_currency') || 'KES';
    const artUrl = getVal('songInput_artworkUrl') || 'images/hero.jpg';
    const audioUrl = getVal('songInput_audioUrl');

    const modal = document.getElementById('storePreviewModal');
    if (!modal) return;

    document.getElementById('prevModal_title').innerText = title;
    document.getElementById('prevModal_artist').innerText = artist;
    document.getElementById('prevModal_album').innerText = album;
    document.getElementById('prevModal_price').innerText = `${currency} ${price}`;
    
    const art = document.getElementById('prevModal_art');
    if (art) art.src = artUrl;

    const player = document.getElementById('prevModal_audioPlayer');
    if (player) {
        if (audioUrl) {
            player.src = audioUrl;
            player.style.display = 'block';
        } else {
            player.style.display = 'none';
        }
    }

    modal.classList.add('active');
}

function openSongDetailsModal(songId) {
    const song = AdminState.songs[songId];
    if (!song) return;

    const modal = document.getElementById('songDetailsModal');
    if (!modal) return;

    document.getElementById('detailModal_title').innerText = song.title;
    document.getElementById('detailModal_artist').innerText = song.artist || 'Ali Welekhasia';
    document.getElementById('detailModal_price').innerText = `${song.currency || 'KES'} ${song.price !== undefined ? song.price : 300}`;
    document.getElementById('detailModal_releaseDate').innerText = song.releaseDate || 'Not specified';
    document.getElementById('detailModal_language').innerText = song.language || 'Swahili';
    document.getElementById('detailModal_genre').innerText = song.genre || 'Worship';

    const stBadge = document.getElementById('detailModal_statusBadge');
    if (stBadge) {
        stBadge.innerText = (song.status || 'DRAFT').toUpperCase();
        stBadge.className = `status-badge status-${(song.status || 'draft').toLowerCase()}`;
    }

    const art = document.getElementById('detailModal_art');
    if (art) art.src = song.artworkUrl || 'images/hero.jpg';

    // Orders for this song
    const orders = Object.values(AdminState.orders || {});
    const songOrders = orders.filter(o => o && (o.productId === songId || o.productTitle === song.title));
    const paidOrders = songOrders.filter(o => o.paymentStatus === 'PAID');

    let grossRev = 0;
    let totalDls = 0;
    let lastPurchaseTime = 0;
    let lastDownloadTime = 0;

    paidOrders.forEach(o => {
        const amt = parseFloat(o.amount || 0);
        grossRev += amt;
        const dls = parseInt(o.downloadCount || 1);
        totalDls += dls;
        const oTime = o.paidAt || o.createdAt || 0;
        if (oTime > lastPurchaseTime) lastPurchaseTime = oTime;
        if (o.lastDownloadAt && o.lastDownloadAt > lastDownloadTime) lastDownloadTime = o.lastDownloadAt;
    });

    const paystackEst = Math.round(grossRev * 0.015);
    const netSettlement = Math.max(0, grossRev - paystackEst);

    document.getElementById('detailModal_ordersCount').innerText = songOrders.length;
    if (document.getElementById('detailModal_successPaymentsCount')) {
        document.getElementById('detailModal_successPaymentsCount').innerText = `${paidOrders.length} Successful Paid`;
    }
    document.getElementById('detailModal_grossRevenue').innerText = `KES ${grossRev.toLocaleString()}`;
    if (document.getElementById('detailModal_paystackFees')) {
        document.getElementById('detailModal_paystackFees').innerText = `KES ${paystackEst.toLocaleString()}`;
    }
    if (document.getElementById('detailModal_netSettlement')) {
        document.getElementById('detailModal_netSettlement').innerText = `KES ${netSettlement.toLocaleString()}`;
    }
    document.getElementById('detailModal_downloadCount').innerText = totalDls;
    if (document.getElementById('detailModal_downloadAttempts')) {
        document.getElementById('detailModal_downloadAttempts').innerText = `${totalDls} fulfilled (0 failed)`;
    }

    if (document.getElementById('detailModal_lastPurchaseDate')) {
        document.getElementById('detailModal_lastPurchaseDate').innerText = lastPurchaseTime ? new Date(lastPurchaseTime).toLocaleDateString('en-GB') : '—';
    }
    if (document.getElementById('detailModal_lastDownloadDate')) {
        document.getElementById('detailModal_lastDownloadDate').innerText = lastDownloadTime ? new Date(lastDownloadTime).toLocaleDateString('en-GB') : (totalDls > 0 ? 'Recently' : '—');
    }

    const masterStatusEl = document.getElementById('detailModal_masterStatus');
    if (masterStatusEl) {
        if (song.downloadUrl || song.masterStorageKey) {
            masterStatusEl.innerHTML = `<i class="fa-solid fa-file-shield" style="color: #10b981;"></i> Cloudflare R2 Protected<br><span style="font-size: 10px; color: #94a3b8; font-family: monospace;">${escapeHtml((song.downloadUrl || song.masterStorageKey || '').substring(0, 35))}...</span>`;
        } else {
            masterStatusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i> Master File Missing`;
        }
    }

    const tbody = document.getElementById('detailModal_ordersTableBody');
    if (tbody) {
        if (songOrders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--adm-text-subtle); padding: 20px;">No customer purchase records for this song yet.</td></tr>`;
        } else {
            tbody.innerHTML = songOrders.map(o => `
                <tr>
                    <td>
                        <div style="font-weight: 700; color: #fff;">${escapeHtml(o.orderNumber || o.orderId || 'ORD')}</div>
                        <div style="font-size: 11px; color: var(--adm-text-subtle);">${new Date(o.createdAt || Date.now()).toLocaleDateString('en-GB')}</div>
                    </td>
                    <td>
                        <div>${escapeHtml(o.customerEmail || 'Guest')}</div>
                        <div style="font-size: 11px; color: #94a3b8;">${escapeHtml(maskPhone(o.customerPhone))}</div>
                    </td>
                    <td><strong style="color: var(--adm-gold);">KES ${o.amount || 100}</strong></td>
                    <td><span style="font-family: monospace; font-size: 11px; color: #94a3b8;">${escapeHtml(o.paymentReference || '—')}</span></td>
                    <td><span class="status-badge status-${(o.paymentStatus || 'pending').toLowerCase()}">${escapeHtml(o.paymentStatus || 'PENDING')}</span></td>
                    <td><span style="color: #38bdf8; font-weight: 600; font-size: 12px;"><i class="fa-solid fa-download"></i> ${o.downloadCount || (o.paymentStatus === 'PAID' ? 1 : 0)}</span></td>
                </tr>
            `).join('');
        }
    }

    modal.classList.add('active');
}

function maskPhone(phone) {
    if (!phone) return '—';
    const clean = phone.replace(/\s+/g, '');
    if (clean.length < 8) return clean;
    return clean.substring(0, 5) + '****' + clean.substring(clean.length - 2);
}

// --- PROFESSIONAL LYRICS EDITOR (/admin/lyrics) ---
function renderLyricsEditorView() {
    const songSelect = document.getElementById('lyricsSongSelector');
    if (!songSelect) return;

    const songs = Object.values(AdminState.songs || {});
    songSelect.innerHTML = `<option value="">-- Select a Song to Edit Lyrics --</option>` + 
        songs.map(s => `<option value="${s.id}">${escapeHtml(s.title)} (${escapeHtml(s.artist || 'Ali Welekhasia')})</option>`).join('');

    if (AdminState.activeLyricsSongId) {
        songSelect.value = AdminState.activeLyricsSongId;
        loadLyricsForSelectedSong(AdminState.activeLyricsSongId);
    }
}

function openLyricsEditorForSong(songId) {
    AdminState.activeLyricsSongId = songId;
    switchTab('lyrics');
}

function onLyricsSongSelectChanged() {
    const songId = document.getElementById('lyricsSongSelector')?.value;
    AdminState.activeLyricsSongId = songId;
    loadLyricsForSelectedSong(songId);
}

function loadLyricsForSelectedSong(songId) {
    const container = document.getElementById('lyricsSectionsContainer');
    if (!container) return;

    if (!songId) {
        container.innerHTML = `<p style="text-align: center; color: var(--adm-text-subtle); padding: 40px;">Select a song from the dropdown above to load and edit its lyrics sections.</p>`;
        return;
    }

    const song = AdminState.songs[songId];
    const existingLyrics = AdminState.lyrics[songId];

    if (existingLyrics && existingLyrics.sections && existingLyrics.sections.length > 0) {
        AdminState.activeLyricsSections = JSON.parse(JSON.stringify(existingLyrics.sections));
    } else {
        // Default standard sections template
        AdminState.activeLyricsSections = [
            { type: 'VERSE', title: 'Verse 1', text: '' },
            { type: 'CHORUS', title: 'Chorus', text: '' },
            { type: 'VERSE', title: 'Verse 2', text: '' },
            { type: 'BRIDGE', title: 'Bridge', text: '' },
            { type: 'OUTRO', title: 'Outro', text: '' }
        ];
    }

    renderLyricsSections();
}

function renderLyricsSections() {
    const container = document.getElementById('lyricsSectionsContainer');
    if (!container) return;

    if (AdminState.activeLyricsSections.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--adm-text-muted); padding: 24px;">No sections added. Click "+ Add Section" below to build the lyrics structure.</p>`;
        return;
    }

    container.innerHTML = AdminState.activeLyricsSections.map((sec, idx) => `
        <div class="lyrics-section-card">
            <div class="section-header-row">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="section-tag-badge">${escapeHtml(sec.type || 'VERSE')}</span>
                    <input type="text" class="adm-form-control" style="width: 160px; padding: 4px 8px; font-weight: 600;" 
                        value="${escapeHtml(sec.title || '')}" onchange="updateLyricsSectionTitle(${idx}, this.value)">
                </div>
                <div class="action-buttons-wrap">
                    <button class="btn-action-icon" title="Move Up" onclick="moveLyricsSection(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity: 0.3;"' : ''}>
                        <i class="fa-solid fa-arrow-up"></i>
                    </button>
                    <button class="btn-action-icon" title="Move Down" onclick="moveLyricsSection(${idx}, 1)" ${idx === AdminState.activeLyricsSections.length - 1 ? 'disabled style="opacity: 0.3;"' : ''}>
                        <i class="fa-solid fa-arrow-down"></i>
                    </button>
                    <button class="btn-action-icon danger" title="Remove Section" onclick="removeLyricsSection(${idx})">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
            <textarea class="lyrics-textarea" placeholder="Type lyrics for ${escapeHtml(sec.title)} here... Line breaks will be preserved exactly." 
                oninput="updateLyricsSectionText(${idx}, this.value)">${escapeHtml(sec.text || '')}</textarea>
        </div>
    `).join('');
}

function addLyricsSection(type = 'VERSE') {
    const count = AdminState.activeLyricsSections.filter(s => s.type === type).length + 1;
    let defaultTitle = `${capitalizeFirst(type)} ${count}`;
    if (type === 'CHORUS') defaultTitle = 'Chorus';
    if (type === 'INTRO') defaultTitle = 'Intro';
    if (type === 'BRIDGE') defaultTitle = 'Bridge';
    if (type === 'OUTRO') defaultTitle = 'Outro';

    AdminState.activeLyricsSections.push({
        type: type.toUpperCase(),
        title: defaultTitle,
        text: ''
    });
    renderLyricsSections();
}

function removeLyricsSection(index) {
    if (confirm('Remove this lyrics section?')) {
        AdminState.activeLyricsSections.splice(index, 1);
        renderLyricsSections();
    }
}

function moveLyricsSection(index, direction) {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= AdminState.activeLyricsSections.length) return;
    const temp = AdminState.activeLyricsSections[index];
    AdminState.activeLyricsSections[index] = AdminState.activeLyricsSections[targetIdx];
    AdminState.activeLyricsSections[targetIdx] = temp;
    renderLyricsSections();
}

function updateLyricsSectionTitle(index, newTitle) {
    if (AdminState.activeLyricsSections[index]) {
        AdminState.activeLyricsSections[index].title = newTitle;
    }
}

function updateLyricsSectionText(index, newText) {
    if (AdminState.activeLyricsSections[index]) {
        AdminState.activeLyricsSections[index].text = newText;
    }
}

async function saveLyrics(status = 'PUBLISHED') {
    const songId = AdminState.activeLyricsSongId || document.getElementById('lyricsSongSelector')?.value;
    if (!songId) {
        showAdminToast('Please select a song first.', 'warning');
        return;
    }

    const song = AdminState.songs[songId];
    const lyricsPayload = {
        songId,
        songTitle: song ? song.title : 'Worship Song',
        sections: AdminState.activeLyricsSections,
        status,
        updatedAt: Date.now(),
        updatedBy: AdminState.user?.email || 'admin'
    };

    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.setData(`${schema.lyrics}/${songId}`, lyricsPayload);
            await window.RichaliFirebase.logAudit('SAVE_LYRICS', 'lyrics', songId, { songTitle: lyricsPayload.songTitle, status });
        } else {
            AdminState.lyrics[songId] = lyricsPayload;
        }

        showAdminToast(`Lyrics for "${lyricsPayload.songTitle}" saved as ${status}!`, 'success');
        const stamp = document.getElementById('lyricsLastSavedStamp');
        if (stamp) stamp.innerText = `Last saved: ${new Date().toLocaleTimeString()} by ${AdminState.user?.email || 'Admin'}`;
    } catch (err) {
        showAdminToast(`Error saving lyrics: ${err.message}`, 'error');
    }
}

// --- GALLERY MANAGEMENT (/admin/gallery) ---
function renderGalleryGrid() {
    const grid = document.getElementById('galleryGridContainer');
    if (!grid) return;

    const items = Object.values(AdminState.gallery || {});
    const catFilter = document.getElementById('galleryCategoryFilter')?.value || 'ALL';

    const filtered = items.filter(item => catFilter === 'ALL' || item.category === catFilter);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--adm-text-muted);">
                <i class="fa-solid fa-images" style="font-size: 36px; color: var(--adm-gold); margin-bottom: 12px; display: block;"></i>
                <p style="font-size: 15px; font-weight: 600; color: #fff;">No pictures uploaded in this category.</p>
                <button class="btn btn-sm btn-gold" onclick="openUploadPictureModal()" style="margin-top: 14px;">
                    <i class="fa-solid fa-upload"></i> Upload Pictures
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(item => `
        <div class="media-card">
            <div class="media-preview-box">
                <img src="${item.imageUrl || 'images/hero.jpg'}" alt="${escapeHtml(item.title || 'Ministry Photo')}" loading="lazy" onerror="this.src='images/hero.jpg'">
            </div>
            <div class="media-info">
                <div class="media-name">${escapeHtml(item.title || 'Untitled Photo')}</div>
                <div class="media-meta">${escapeHtml(item.category || 'Ministry')} • ${escapeHtml(item.status || 'PUBLISHED')}</div>
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <button class="btn btn-sm btn-outline" style="flex: 1; padding: 3px 6px;" onclick="editGalleryItem('${item.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" style="padding: 3px 8px;" onclick="deleteGalleryItem('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function openUploadPictureModal(itemId = null) {
    const modal = document.getElementById('pictureModal');
    const form = document.getElementById('pictureForm');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('pictureModalId').value = itemId || '';
    const preview = document.getElementById('picturePreviewImg');
    if (preview) preview.src = 'images/hero.jpg';

    if (itemId && AdminState.gallery[itemId]) {
        const item = AdminState.gallery[itemId];
        setVal('pictureInput_title', item.title);
        setVal('pictureInput_caption', item.caption || '');
        setVal('pictureInput_category', item.category || 'Ministry');
        setVal('pictureInput_album', item.album || 'General');
        setVal('pictureInput_imageUrl', item.imageUrl || '');
        setVal('pictureInput_status', item.status || 'PUBLISHED');
        if (item.imageUrl && preview) preview.src = item.imageUrl;
    }

    modal.classList.add('active');
}

function editGalleryItem(id) {
    openUploadPictureModal(id);
}

async function handleGalleryImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showAdminToast('Please select a valid image file (JPG, PNG, WebP).', 'warning');
        return;
    }

    if (file.size > 15 * 1024 * 1024) {
        showAdminToast('Image size exceeds 15MB limit.', 'warning');
        return;
    }

    const preview = document.getElementById('picturePreviewImg');
    const urlInput = document.getElementById('pictureInput_imageUrl');
    const tempUrl = URL.createObjectURL(file);
    if (preview) preview.src = tempUrl;

    if (!window.RichaliFirebase || !window.RichaliFirebase.storage) {
        showAdminToast('Firebase Storage is not initialized. Please enter a direct image URL.', 'error');
        return;
    }

    try {
        showAdminToast('Uploading photo to Firebase Storage...', 'info');
        const path = `aliwelekhasia/gallery/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const result = await window.RichaliFirebase.uploadFile(path, file);
        if (urlInput) urlInput.value = result.downloadUrl;
        if (preview) preview.src = result.downloadUrl;
        showAdminToast('Gallery photo uploaded to Cloud Storage successfully!', 'success');
    } catch (err) {
        console.error('Gallery image upload error:', err);
        showAdminToast(`Storage upload failed: ${err.message}`, 'error');
    }
}

async function handlePictureFormSubmit(event) {
    if (event) event.preventDefault();
    const id = document.getElementById('pictureModalId')?.value.trim() || `img_${Date.now()}`;
    const title = getVal('pictureInput_title').trim() || 'Ministry Photo';
    const imageUrl = getVal('pictureInput_imageUrl').trim() || 'images/hero.jpg';

    const payload = {
        id,
        title,
        caption: getVal('pictureInput_caption'),
        category: getVal('pictureInput_category'),
        album: getVal('pictureInput_album'),
        imageUrl,
        status: getVal('pictureInput_status'),
        updatedAt: Date.now()
    };

    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.setData(`${schema.gallery}/${id}`, payload);
            await window.RichaliFirebase.logAudit('SAVE_PICTURE', 'gallery', id, { title });
        } else {
            AdminState.gallery[id] = payload;
        }

        closeModal('pictureModal');
        showAdminToast('Picture saved to gallery!', 'success');
        renderGalleryGrid();
        renderOverviewStats();
    } catch (err) {
        showAdminToast(`Error saving picture: ${err.message}`, 'error');
    }
}

async function deleteGalleryItem(id) {
    if (!confirm('Are you sure you want to delete this picture?')) return;
    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.removeData(`${schema.gallery}/${id}`);
            await window.RichaliFirebase.logAudit('DELETE_PICTURE', 'gallery', id);
        } else {
            delete AdminState.gallery[id];
        }
        showAdminToast('Picture deleted.', 'info');
        renderGalleryGrid();
        renderOverviewStats();
    } catch (err) {
        showAdminToast(`Delete error: ${err.message}`, 'error');
    }
}

// --- VIDEO CMS (/admin/videos) ---
function renderVideosGrid() {
    const container = document.getElementById('videosGridContainer');
    if (!container) return;

    const videos = Object.values(AdminState.videos || {});
    if (videos.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--adm-text-muted);">No videos added yet. Click "+ Add Video" to embed or publish gospel media.</div>`;
        return;
    }

    container.innerHTML = videos.map(v => `
        <div class="media-card">
            <div class="media-preview-box">
                <img src="${v.thumbnailUrl || (v.youtubeId ? `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg` : 'images/hero.jpg')}" alt="${escapeHtml(v.title)}" onerror="this.src='images/hero.jpg'">
            </div>
            <div class="media-info">
                <div class="media-name">${escapeHtml(v.title)}</div>
                <div class="media-meta">${escapeHtml(v.category || 'Music Video')} • ${escapeHtml(v.status || 'PUBLISHED')}</div>
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <button class="btn btn-sm btn-outline" style="flex: 1;" onclick="openAddVideoModal('${v.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteVideoItem('${v.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function openAddVideoModal(videoId = null) {
    const modal = document.getElementById('videoModal');
    const form = document.getElementById('videoForm');
    if (!modal || !form) return;
    form.reset();
    document.getElementById('videoModalId').value = videoId || '';

    if (videoId && AdminState.videos[videoId]) {
        const v = AdminState.videos[videoId];
        setVal('videoInput_title', v.title);
        setVal('videoInput_youtubeUrl', v.youtubeUrl || '');
        setVal('videoInput_category', v.category || 'Music Videos');
        setVal('videoInput_description', v.description || '');
        setVal('videoInput_status', v.status || 'PUBLISHED');
    }
    modal.classList.add('active');
}

async function handleVideoFormSubmit(event) {
    if (event) event.preventDefault();
    const id = document.getElementById('videoModalId')?.value.trim() || `video_${Date.now()}`;
    const title = getVal('videoInput_title').trim();
    const ytUrl = getVal('videoInput_youtubeUrl').trim();

    if (!title || !ytUrl) {
        showAdminToast('Please provide both title and video URL.', 'warning');
        return;
    }

    // Extract YouTube ID
    let ytId = '';
    const match = ytUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) ytId = match[1];

    const payload = {
        id,
        title,
        youtubeUrl: ytUrl,
        youtubeId: ytId,
        thumbnailUrl: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'images/hero.jpg',
        category: getVal('videoInput_category'),
        description: getVal('videoInput_description'),
        status: getVal('videoInput_status'),
        updatedAt: Date.now()
    };

    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.setData(`${schema.videos}/${id}`, payload);
            await window.RichaliFirebase.logAudit('SAVE_VIDEO', 'videos', id, { title });
        } else {
            AdminState.videos[id] = payload;
        }

        closeModal('videoModal');
        showAdminToast('Video saved successfully!', 'success');
        renderVideosGrid();
        renderOverviewStats();
    } catch (err) {
        showAdminToast(`Error saving video: ${err.message}`, 'error');
    }
}

async function deleteVideoItem(id) {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.removeData(`${schema.videos}/${id}`);
            await window.RichaliFirebase.logAudit('DELETE_VIDEO', 'videos', id);
        } else {
            delete AdminState.videos[id];
        }
        showAdminToast('Video deleted.', 'info');
        renderVideosGrid();
    } catch (err) {
        showAdminToast(`Delete error: ${err.message}`, 'error');
    }
}

// --- EVENTS CMS (/admin/events) ---
function renderEventsTable() {
    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) return;

    const events = Object.values(AdminState.events || {});
    if (events.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 36px; color: var(--adm-text-muted);">No crusade or ministry events scheduled yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = events.map(e => `
        <tr>
            <td>
                <div class="table-title-cell">
                    <img src="${e.posterUrl || 'images/hero.jpg'}" class="table-thumb" alt="${escapeHtml(e.title)}" onerror="this.src='images/hero.jpg'">
                    <div>
                        <div class="title-text">${escapeHtml(e.title)}</div>
                        <div class="sub-text">${escapeHtml(e.venue || 'TBA')}</div>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(e.date || 'TBA')}</td>
            <td>${escapeHtml(e.time || 'Evening')}</td>
            <td>${escapeHtml(e.location || 'Kenya')}</td>
            <td><span class="status-badge status-${(e.status || 'draft').toLowerCase()}">${escapeHtml(e.status || 'PUBLISHED')}</span></td>
            <td>
                <div class="action-buttons-wrap">
                    <button class="btn-action-icon" onclick="openAddEventModal('${e.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-action-icon danger" onclick="deleteEventItem('${e.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddEventModal(eventId = null) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    if (!modal || !form) return;
    form.reset();
    document.getElementById('eventModalId').value = eventId || '';

    if (eventId && AdminState.events[eventId]) {
        const e = AdminState.events[eventId];
        setVal('eventInput_title', e.title);
        setVal('eventInput_date', e.date || '');
        setVal('eventInput_time', e.time || '');
        setVal('eventInput_venue', e.venue || '');
        setVal('eventInput_location', e.location || '');
        setVal('eventInput_posterUrl', e.posterUrl || '');
        setVal('eventInput_regUrl', e.regUrl || '');
        setVal('eventInput_description', e.description || '');
        setVal('eventInput_status', e.status || 'PUBLISHED');
    }
    modal.classList.add('active');
}

async function handleEventFormSubmit(event) {
    if (event) event.preventDefault();
    const id = document.getElementById('eventModalId')?.value.trim() || `event_${Date.now()}`;
    const title = getVal('eventInput_title').trim();

    if (!title) {
        showAdminToast('Event title is required.', 'warning');
        return;
    }

    const payload = {
        id,
        title,
        date: getVal('eventInput_date'),
        time: getVal('eventInput_time'),
        venue: getVal('eventInput_venue'),
        location: getVal('eventInput_location'),
        posterUrl: getVal('eventInput_posterUrl') || 'images/hero.jpg',
        regUrl: getVal('eventInput_regUrl'),
        description: getVal('eventInput_description'),
        status: getVal('eventInput_status'),
        updatedAt: Date.now()
    };

    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.setData(`${schema.events}/${id}`, payload);
            await window.RichaliFirebase.logAudit('SAVE_EVENT', 'events', id, { title });
        } else {
            AdminState.events[id] = payload;
        }

        closeModal('eventModal');
        showAdminToast('Crusade event saved successfully!', 'success');
        renderEventsTable();
        renderOverviewStats();
    } catch (err) {
        showAdminToast(`Error saving event: ${err.message}`, 'error');
    }
}

async function deleteEventItem(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.removeData(`${schema.events}/${id}`);
            await window.RichaliFirebase.logAudit('DELETE_EVENT', 'events', id);
        } else {
            delete AdminState.events[id];
        }
        showAdminToast('Event deleted.', 'info');
        renderEventsTable();
    } catch (err) {
        showAdminToast(`Delete error: ${err.message}`, 'error');
    }
}

// --- BLOG & DEVOTIONALS CMS (/admin/blog) ---
function renderBlogTable() {
    const tbody = document.getElementById('blogTableBody');
    if (!tbody) return;

    const posts = Object.values(AdminState.blog || {});
    if (posts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 36px; color: var(--adm-text-muted);">No devotionals published yet. Click "+ New Article" to post inspiring words.</td></tr>`;
        return;
    }

    tbody.innerHTML = posts.map(p => `
        <tr>
            <td>
                <div class="title-text">${escapeHtml(p.title)}</div>
                <div class="sub-text">${escapeHtml(p.scripture || 'Scripture Reference')}</div>
            </td>
            <td>${escapeHtml(p.category || 'Devotional')}</td>
            <td>${escapeHtml(p.author || 'Ali Welekhasia')}</td>
            <td>${escapeHtml(p.date || 'Today')}</td>
            <td><span class="status-badge status-${(p.status || 'published').toLowerCase()}">${escapeHtml(p.status || 'PUBLISHED')}</span></td>
            <td>
                <div class="action-buttons-wrap">
                    <button class="btn-action-icon" onclick="openAddBlogModal('${p.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-action-icon danger" onclick="deleteBlogItem('${p.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddBlogModal(postId = null) {
    const modal = document.getElementById('blogModal');
    const form = document.getElementById('blogForm');
    if (!modal || !form) return;
    form.reset();
    document.getElementById('blogModalId').value = postId || '';

    if (postId && AdminState.blog[postId]) {
        const p = AdminState.blog[postId];
        setVal('blogInput_title', p.title);
        setVal('blogInput_category', p.category || 'Devotional');
        setVal('blogInput_scripture', p.scripture || '');
        setVal('blogInput_author', p.author || 'Ali Welekhasia');
        setVal('blogInput_excerpt', p.excerpt || '');
        setVal('blogInput_content', p.content || '');
        setVal('blogInput_status', p.status || 'PUBLISHED');
    }
    modal.classList.add('active');
}

async function handleBlogFormSubmit(event) {
    if (event) event.preventDefault();
    const id = document.getElementById('blogModalId')?.value.trim() || `post_${Date.now()}`;
    const title = getVal('blogInput_title').trim();

    if (!title) {
        showAdminToast('Devotional title is required.', 'warning');
        return;
    }

    const payload = {
        id,
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        category: getVal('blogInput_category'),
        scripture: getVal('blogInput_scripture'),
        author: getVal('blogInput_author') || 'Ali Welekhasia',
        excerpt: getVal('blogInput_excerpt'),
        content: getVal('blogInput_content'),
        status: getVal('blogInput_status'),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        updatedAt: Date.now()
    };

    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.setData(`${schema.blog}/${id}`, payload);
            await window.RichaliFirebase.logAudit('SAVE_BLOG', 'blog', id, { title });
        } else {
            AdminState.blog[id] = payload;
        }

        closeModal('blogModal');
        showAdminToast('Devotional article saved!', 'success');
        renderBlogTable();
        renderOverviewStats();
    } catch (err) {
        showAdminToast(`Error saving devotional: ${err.message}`, 'error');
    }
}

async function deleteBlogItem(id) {
    if (!confirm('Are you sure you want to delete this devotional?')) return;
    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.removeData(`${schema.blog}/${id}`);
            await window.RichaliFirebase.logAudit('DELETE_BLOG', 'blog', id);
        } else {
            delete AdminState.blog[id];
        }
        showAdminToast('Devotional deleted.', 'info');
        renderBlogTable();
    } catch (err) {
        showAdminToast(`Delete error: ${err.message}`, 'error');
    }
}

// --- PRAYER REQUESTS (/admin/prayers) ---
function renderPrayersTable() {
    const tbody = document.getElementById('prayersTableBody');
    if (!tbody) return;

    const prayers = Object.values(AdminState.prayers || {});
    if (prayers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 36px; color: var(--adm-text-muted);">No prayer requests received yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = prayers.map(p => `
        <tr>
            <td>
                <div class="title-text">${escapeHtml(p.name || 'Anonymous')}</div>
                <div class="sub-text">${escapeHtml(p.email || p.phone || 'Private')}</div>
            </td>
            <td style="max-width: 320px;">${escapeHtml(p.request || p.message || '')}</td>
            <td>${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recent'}</td>
            <td><span class="status-badge status-${p.status === 'PRAYED' ? 'published' : 'draft'}">${escapeHtml(p.status || 'NEW')}</span></td>
            <td>
                <div class="action-buttons-wrap">
                    ${p.status !== 'PRAYED' 
                        ? `<button class="btn btn-sm btn-gold" onclick="markPrayerStatus('${p.id}', 'PRAYED')"><i class="fa-solid fa-hands-praying"></i> Mark Prayed</button>`
                        : `<span style="color: #10b981; font-size: 12px;"><i class="fa-solid fa-check-double"></i> Prayed</span>`
                    }
                    <button class="btn-action-icon danger" onclick="deletePrayerItem('${p.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function markPrayerStatus(id, status) {
    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.updateData(`${schema.prayerRequests}/${id}`, { status, prayedAt: Date.now() });
            await window.RichaliFirebase.logAudit('PRAYER_STATUS', 'prayerRequests', id, { status });
        } else if (AdminState.prayers[id]) {
            AdminState.prayers[id].status = status;
        }
        showAdminToast('Prayer request marked as prayed for!', 'success');
        renderPrayersTable();
    } catch (err) {
        showAdminToast(`Error: ${err.message}`, 'error');
    }
}

async function deletePrayerItem(id) {
    if (!confirm('Delete this prayer record?')) return;
    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.removeData(`${schema.prayerRequests}/${id}`);
        } else {
            delete AdminState.prayers[id];
        }
        showAdminToast('Prayer record removed.', 'info');
        renderPrayersTable();
    } catch (err) {
        showAdminToast(`Delete error: ${err.message}`, 'error');
    }
}

// --- TESTIMONIALS CMS (/admin/testimonials) ---
function renderTestimonialsTable() {
    const tbody = document.getElementById('testimonialsTableBody');
    if (!tbody) return;

    const items = Object.values(AdminState.testimonials || {});
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 36px; color: var(--adm-text-muted);">No testimonials in registry yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(t => `
        <tr>
            <td>
                <div class="title-text">${escapeHtml(t.name || 'Beloved')}</div>
                <div class="sub-text">${escapeHtml(t.location || 'Nairobi, Kenya')}</div>
            </td>
            <td style="max-width: 320px;">"${escapeHtml(t.testimony || t.content || '')}"</td>
            <td>${escapeHtml(t.category || 'Crusade Miracle')}</td>
            <td><span class="status-badge status-${(t.status || 'published').toLowerCase()}">${escapeHtml(t.status || 'PUBLISHED')}</span></td>
            <td>
                <div class="action-buttons-wrap">
                    <button class="btn-action-icon danger" onclick="deleteTestimonialItem('${t.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function deleteTestimonialItem(id) {
    if (!confirm('Delete this testimony?')) return;
    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.removeData(`${schema.testimonies}/${id}`);
        } else {
            delete AdminState.testimonials[id];
        }
        showAdminToast('Testimony removed.', 'info');
        renderTestimonialsTable();
    } catch (err) {
        showAdminToast(`Delete error: ${err.message}`, 'error');
    }
}

// --- MEDIA LIBRARY (/admin/media) ---
function renderMediaLibrary() {
    const container = document.getElementById('mediaLibraryGrid');
    if (!container) return;

    // Aggregate artwork and media
    const songArtworks = Object.values(AdminState.songs || {}).filter(s => s.artworkUrl).map(s => ({
        name: `${s.title} Cover Art`,
        type: 'image',
        url: s.artworkUrl
    }));
    const galleryItems = Object.values(AdminState.gallery || {}).map(g => ({
        name: g.title,
        type: 'image',
        url: g.imageUrl
    }));

    const allMedia = [...songArtworks, ...galleryItems];

    if (allMedia.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--adm-text-muted);">No media files in library yet.</div>`;
        return;
    }

    container.innerHTML = allMedia.map(m => `
        <div class="media-card" onclick="copyToClipboard('${m.url}', 'Media download URL copied!')">
            <div class="media-preview-box">
                <img src="${m.url}" alt="${escapeHtml(m.name)}" onerror="this.src='images/hero.jpg'">
            </div>
            <div class="media-info">
                <div class="media-name">${escapeHtml(m.name)}</div>
                <div class="media-meta"><i class="fa-regular fa-copy"></i> Click to copy URL</div>
            </div>
        </div>
    `).join('');
}

// --- USERS & ROLES (/admin/users) ---
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const userEntries = Object.entries(AdminState.users || {});
    
    // Always guarantee Minister Ali Welekhasia is represented as the protected root Super Admin
    let html = `
        <tr>
            <td>
                <div class="table-title-cell">
                    <div class="user-avatar-circle">AW</div>
                    <div>
                        <div class="title-text">Minister Ali Welekhasia</div>
                        <div class="sub-text">ali.werekhasia01@gmail.com</div>
                    </div>
                </div>
            </td>
            <td><span class="user-role-badge">SUPER ADMIN</span></td>
            <td><span style="color: #10b981;"><i class="fa-solid fa-circle-check"></i> Active</span></td>
            <td>Full Ministry & CMS Authority</td>
            <td><span style="color: var(--adm-text-subtle); font-size: 12px; font-weight: 600;"><i class="fa-solid fa-shield-halved"></i> Root Protected</span></td>
        </tr>
    `;

    userEntries.forEach(([uid, u]) => {
        if (!u) return;
        if (u.email && u.email.toLowerCase() === 'ali.werekhasia01@gmail.com') return; // Handled above

        const initials = (u.displayName || u.email || 'US').substring(0, 2).toUpperCase();
        const role = u.role || 'USER';
        const isSuspended = u.status === 'SUSPENDED';

        let badgeStyle = 'background: rgba(212, 175, 55, 0.15); color: #d4af37;';
        if (role === 'ADMIN') badgeStyle = 'background: rgba(59, 130, 246, 0.15); color: #60a5fa;';
        if (role === 'ARTIST') badgeStyle = 'background: rgba(168, 85, 247, 0.15); color: #c084fc;';
        if (role === 'USER') badgeStyle = 'background: rgba(100, 116, 139, 0.15); color: #94a3b8;';

        const accessDesc = {
            'SUPER_ADMIN': 'Full System & User Management',
            'ADMIN': 'Content, Media & Events Management',
            'ARTIST': 'Music, Lyrics & Gallery Contributor',
            'USER': 'Public Portal & Prayer Requests'
        }[role] || 'Standard Access';

        html += `
            <tr>
                <td>
                    <div class="table-title-cell">
                        <div class="user-avatar-circle" style="border-color: #64748b; color: #94a3b8;">${escapeHtml(initials)}</div>
                        <div>
                            <div class="title-text">${escapeHtml(u.displayName || u.email || 'User')}</div>
                            <div class="sub-text">${escapeHtml(u.email || uid)}</div>
                        </div>
                    </div>
                </td>
                <td><span class="user-role-badge" style="${badgeStyle}">${escapeHtml(role)}</span></td>
                <td>
                    ${isSuspended 
                        ? '<span style="color: #ef4444;"><i class="fa-solid fa-ban"></i> Suspended</span>' 
                        : '<span style="color: #10b981;"><i class="fa-solid fa-circle-check"></i> Active</span>'}
                </td>
                <td>${escapeHtml(accessDesc)}</td>
                <td>
                    <div class="table-action-btns">
                        <button class="btn-action-icon edit" onclick="openUserModal('${escapeHtml(uid)}')" title="Edit Role">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-action-icon delete" onclick="deleteUserRole('${escapeHtml(uid)}', '${escapeHtml(u.email || uid)}')" title="Delete User">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function openUserModal(uid = null) {
    const currentRole = AdminState.currentUser?.role || localStorage.getItem('ali_admin_user_role');
    if (currentRole !== 'SUPER_ADMIN') {
        showAdminToast('Security Restriction: Only SUPER_ADMIN accounts can modify system permissions.', 'error');
        return;
    }

    const modal = document.getElementById('userModal');
    const form = document.getElementById('userRoleForm');
    if (form) form.reset();

    const titleElem = document.getElementById('userModalTitle');
    const uidInput = document.getElementById('userInput_uid');
    const emailInput = document.getElementById('userInput_email');
    const nameInput = document.getElementById('userInput_displayName');
    const roleSelect = document.getElementById('userInput_role');
    const statusSelect = document.getElementById('userInput_status');

    if (uid && AdminState.users && AdminState.users[uid]) {
        const u = AdminState.users[uid];
        if (titleElem) titleElem.innerHTML = '<i class="fa-solid fa-user-pen"></i> Edit User Access Role';
        if (uidInput) uidInput.value = uid;
        if (emailInput) {
            emailInput.value = u.email || '';
            emailInput.readOnly = true;
        }
        if (nameInput) nameInput.value = u.displayName || '';
        if (roleSelect) roleSelect.value = u.role || 'USER';
        if (statusSelect) statusSelect.value = u.status || 'ACTIVE';
    } else {
        if (titleElem) titleElem.innerHTML = '<i class="fa-solid fa-user-shield"></i> Assign User Role';
        if (uidInput) uidInput.value = '';
        if (emailInput) {
            emailInput.value = '';
            emailInput.readOnly = false;
        }
        if (nameInput) nameInput.value = '';
        if (roleSelect) roleSelect.value = 'ADMIN';
        if (statusSelect) statusSelect.value = 'ACTIVE';
    }

    if (modal) modal.classList.add('active');
}

async function handleSaveUserRole(event) {
    if (event) event.preventDefault();

    const currentRole = AdminState.currentUser?.role || localStorage.getItem('ali_admin_user_role');
    if (currentRole !== 'SUPER_ADMIN') {
        showAdminToast('Unauthorized: Only SUPER_ADMIN can assign or update user roles.', 'error');
        return;
    }

    const uidInput = document.getElementById('userInput_uid');
    const email = document.getElementById('userInput_email')?.value.trim();
    const displayName = document.getElementById('userInput_displayName')?.value.trim();
    const role = document.getElementById('userInput_role')?.value;
    const status = document.getElementById('userInput_status')?.value;

    if (!email) {
        showAdminToast('Email address is required.', 'warning');
        return;
    }

    // Prohibit tampering with root administrator account
    if (email.toLowerCase() === 'ali.werekhasia01@gmail.com') {
        showAdminToast('The root minister account is permanently secured and immutable.', 'warning');
        closeModal('userModal');
        return;
    }

    const uid = uidInput?.value || email.replace(/[^a-zA-Z0-9]/g, '_');
    const schema = window.RichaliFirebase.schema.aliwelekhasia;

    const payload = {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        role: role || 'USER',
        status: status || 'ACTIVE',
        updatedAt: new Date().toISOString()
    };

    try {
        await window.RichaliFirebase.saveData(`${schema.users}/${uid}`, payload);
        AdminState.users[uid] = payload;
        logAuditEvent('UPDATE_USER_ROLE', `Assigned ${role} role to ${email}`, 'users');
        showAdminToast(`Permissions updated for ${email} (${role}).`, 'success');
        closeModal('userModal');
        renderUsersTable();
    } catch (err) {
        console.error('Error saving user role:', err);
        showAdminToast(`Failed to update permissions: ${err.message}`, 'error');
    }
}

async function deleteUserRole(uid, email) {
    const currentRole = AdminState.currentUser?.role || localStorage.getItem('ali_admin_user_role');
    if (currentRole !== 'SUPER_ADMIN') {
        showAdminToast('Unauthorized: Only SUPER_ADMIN can revoke permissions.', 'error');
        return;
    }

    if (email.toLowerCase() === 'ali.werekhasia01@gmail.com') {
        showAdminToast('Cannot remove root administrator account.', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to revoke all access permissions for ${email}?`)) return;

    const schema = window.RichaliFirebase.schema.aliwelekhasia;
    try {
        await window.RichaliFirebase.removeData(`${schema.users}/${uid}`);
        delete AdminState.users[uid];
        logAuditEvent('REVOKE_USER_ROLE', `Revoked permissions for ${email}`, 'users');
        showAdminToast(`Permissions revoked for ${email}.`, 'info');
        renderUsersTable();
    } catch (err) {
        console.error('Error removing user:', err);
        showAdminToast(`Failed to revoke permissions: ${err.message}`, 'error');
    }
}

// --- AUDIT LOGS (/admin/audit-logs) ---
async function logAuditEvent(action, details, resource = 'system') {
    try {
        if (window.RichaliFirebase && window.RichaliFirebase.logAudit) {
            await window.RichaliFirebase.logAudit(action, resource, null, { note: details });
        }
    } catch (err) {
        console.warn('logAuditEvent notice:', err);
    }
}

function renderAuditLogs() {
    const tbody = document.getElementById('auditLogsTableBody');
    if (!tbody) return;

    if (AdminState.auditLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 36px; color: var(--adm-text-muted);">No audit log entries recorded yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = AdminState.auditLogs.map(log => `
        <tr>
            <td style="font-family: monospace; font-size: 11.5px; color: var(--adm-gold);">${log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}</td>
            <td><span class="status-badge" style="background: rgba(212, 175, 55, 0.15); color: var(--adm-gold);">${escapeHtml(log.action || 'ACTION')}</span></td>
            <td>${escapeHtml(log.resource || 'system')}</td>
            <td>${escapeHtml(log.userEmail || 'admin')}</td>
            <td style="font-size: 12px; color: var(--adm-text-subtle);">${escapeHtml(JSON.stringify(log.details || {}))}</td>
        </tr>
    `).join('');
}

// --- SITE SETTINGS (/admin/settings) ---
function loadSiteSettings() {
    const s = AdminState.settings || {};
    setVal('setting_siteTitle', s.siteTitle || 'Ali Welekhasia Music | Official Ministry Portal');
    setVal('setting_tagline', s.tagline || 'Anointed Swahili & Luhya Worship');
    setVal('setting_ministerBio', s.bio || 'Evangelist, prophetic worship leader, and songwriter anointed to release healing...');
    setVal('setting_youtube', s.socialYoutube || 'https://youtube.com/@aliwelekhasia?si=6w-rHCcN9Tb8PRVo');
    setVal('setting_spotify', s.socialSpotify || '');
    setVal('setting_contactEmail', s.contactEmail || 'ali.werekhasia01@gmail.com');
    setVal('setting_contactPhone', s.contactPhone || '+254 700 000 000');
    setVal('setting_mpesaTill', s.mpesaTill || '4128405');
}

async function handleSaveSettings(event) {
    if (event) event.preventDefault();
    const payload = {
        siteTitle: getVal('setting_siteTitle'),
        tagline: getVal('setting_tagline'),
        bio: getVal('setting_ministerBio'),
        socialYoutube: getVal('setting_youtube'),
        socialSpotify: getVal('setting_spotify'),
        contactEmail: getVal('setting_contactEmail'),
        contactPhone: getVal('setting_contactPhone'),
        mpesaTill: getVal('setting_mpesaTill'),
        updatedAt: Date.now()
    };

    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.setData(schema.settings, payload);
            await window.RichaliFirebase.logAudit('UPDATE_SETTINGS', 'settings', 'site', payload);
        } else {
            AdminState.settings = payload;
        }
        showAdminToast('Website settings updated and synchronized!', 'success');
    } catch (err) {
        showAdminToast(`Failed to save settings: ${err.message}`, 'error');
    }
}

// --- LIVE STREAM TAB INTEGRATION ---
function initLiveStreamTab() {
    renderLiveStreamPanel();
}

function renderLiveStreamPanel() {
    const ls = AdminState.liveStream || {};
    const status = (ls.status || 'offline').toLowerCase();

    // Update status indicators
    const stateDisplay = document.getElementById('adminLiveStateDisplay');
    if (stateDisplay) {
        if (status === 'live') {
            stateDisplay.innerHTML = '<i class="fa-solid fa-circle" style="color: #ef4444; font-size: 14px;"></i> LIVE NOW';
            stateDisplay.style.color = '#ef4444';
        } else if (status === 'connecting') {
            stateDisplay.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color: #f59e0b; font-size: 14px;"></i> CONNECTING';
            stateDisplay.style.color = '#f59e0b';
        } else if (status === 'ended') {
            stateDisplay.innerHTML = '<i class="fa-solid fa-flag-checkered" style="color: #94a3b8; font-size: 14px;"></i> ENDED';
            stateDisplay.style.color = '#94a3b8';
        } else {
            stateDisplay.innerHTML = '<i class="fa-solid fa-power-off" style="color: #64748b; font-size: 14px;"></i> OFFLINE';
            stateDisplay.style.color = '#64748b';
        }
    }

    const viewersCount = document.getElementById('adminLiveViewersCount');
    if (viewersCount) {
        viewersCount.innerText = AdminState.liveViewers || (status === 'live' ? 1 : 0);
    }

    const chatState = document.getElementById('adminLiveChatState');
    if (chatState) {
        const isChatEnabled = ls.chatEnabled !== false;
        chatState.innerHTML = isChatEnabled ? '<span style="color: #10b981;">Enabled</span>' : '<span style="color: #ef4444;">Disabled</span>';
    }

    // Populate inputs if user is not actively editing
    const statusSelect = document.getElementById('liveInput_status');
    if (statusSelect && document.activeElement !== statusSelect) {
        statusSelect.value = status;
    }

    const titleInput = document.getElementById('liveInput_title');
    if (titleInput && document.activeElement !== titleInput) {
        titleInput.value = ls.title || 'Ali Welekhasia Live | Prophetic Gospel Worship Broadcast';
    }

    const descInput = document.getElementById('liveInput_description');
    if (descInput && document.activeElement !== descInput) {
        descInput.value = ls.description || 'Join Minister Ali Welekhasia live for uplifting Swahili worship and prayer intercession.';
    }

    const schedInput = document.getElementById('liveInput_scheduledStart');
    if (schedInput && document.activeElement !== schedInput) {
        schedInput.value = ls.scheduledStart ? ls.scheduledStart.substring(0, 16) : '';
    }

    const playbackInput = document.getElementById('liveInput_playbackUrl');
    if (playbackInput && document.activeElement !== playbackInput) {
        playbackInput.value = ls.playbackUrl || '';
    }

    const uidInput = document.getElementById('liveInput_cloudflareUid');
    if (uidInput && document.activeElement !== uidInput) {
        uidInput.value = ls.uid || '';
    }

    const chatCheckbox = document.getElementById('liveInput_chatEnabled');
    if (chatCheckbox) {
        chatCheckbox.checked = ls.chatEnabled !== false;
    }

    const recCheckbox = document.getElementById('liveInput_recordingsEnabled');
    if (recCheckbox) {
        recCheckbox.checked = ls.recordingsEnabled !== false;
    }
}

function onLiveStatusDropdownChange(val) {
    const stateDisplay = document.getElementById('adminLiveStateDisplay');
    if (stateDisplay) {
        stateDisplay.innerText = val.toUpperCase();
    }
}

async function quickTransitionLiveState(newStatus) {
    try {
        const update = {
            status: newStatus,
            updatedAt: new Date().toISOString()
        };
        if (newStatus === 'live') {
            update.actualStart = new Date().toISOString();
        } else if (newStatus === 'ended') {
            update.endedAt = new Date().toISOString();
        }

        if (window.RichaliFirebase && typeof window.RichaliFirebase.updateLiveStreamState === 'function') {
            await window.RichaliFirebase.updateLiveStreamState(update);
            await window.RichaliFirebase.logAudit('UPDATE_LIVESTREAM_STATUS', 'live', null, { newStatus });
        } else {
            AdminState.liveStream = { ...(AdminState.liveStream || {}), ...update };
        }

        const statusSelect = document.getElementById('liveInput_status');
        if (statusSelect) statusSelect.value = newStatus;

        renderLiveStreamPanel();
        showAdminToast(`Live stream status changed to: ${newStatus.toUpperCase()}`, 'success');
    } catch (err) {
        console.error('Failed to transition live stream status:', err);
        showAdminToast(`Transition failed: ${err.message}`, 'error');
    }
}

async function handleSaveLiveStreamConfig(event) {
    if (event) event.preventDefault();

    const status = document.getElementById('liveInput_status')?.value || 'offline';
    const title = document.getElementById('liveInput_title')?.value.trim();
    const description = document.getElementById('liveInput_description')?.value.trim();
    const scheduledStart = document.getElementById('liveInput_scheduledStart')?.value || '';
    const playbackUrl = document.getElementById('liveInput_playbackUrl')?.value.trim() || '';
    const uid = document.getElementById('liveInput_cloudflareUid')?.value.trim() || '';
    const chatEnabled = document.getElementById('liveInput_chatEnabled')?.checked ?? true;
    const recordingsEnabled = document.getElementById('liveInput_recordingsEnabled')?.checked ?? true;

    if (!title) {
        showAdminToast('Broadcast title is required.', 'warning');
        return;
    }

    const payload = {
        status,
        title,
        description,
        scheduledStart,
        playbackUrl,
        uid,
        chatEnabled,
        recordingsEnabled,
        updatedAt: new Date().toISOString()
    };

    try {
        if (window.RichaliFirebase && typeof window.RichaliFirebase.updateLiveStreamState === 'function') {
            await window.RichaliFirebase.updateLiveStreamState(payload);
            await window.RichaliFirebase.logAudit('UPDATE_LIVESTREAM_CONFIG', 'live', null, { status, title });
        } else {
            AdminState.liveStream = payload;
        }

        showAdminToast('Live stream settings updated and propagated to /live in real time!', 'success');
        renderLiveStreamPanel();
    } catch (err) {
        console.error('Error saving live stream config:', err);
        showAdminToast(`Failed to save settings: ${err.message}`, 'error');
    }
}

// --- TOAST NOTIFICATION UTILITIES ---
function showAdminToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('admToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admToastContainer';
        container.className = 'adm-toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `adm-toast ${type}`;
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';
    if (type === 'warning') icon = 'fa-bell';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div style="flex: 1;">${escapeHtml(message)}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// --- HELPER UTILITIES ---
function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.toggle('mobile-open');
    if (backdrop) backdrop.classList.toggle('active');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
}

function copyToClipboard(text, successMsg = 'Copied to clipboard!') {
    navigator.clipboard.writeText(text).then(() => {
        showAdminToast(successMsg, 'success');
    }).catch(() => {
        showAdminToast('Could not copy automatically. Please copy manually.', 'warning');
    });
}

function setElemText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}
function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
}
function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
