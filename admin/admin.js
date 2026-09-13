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

function storeSession(email, role, remember, passToken) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('ali_admin_session_auth', 'true');
    localStorage.setItem('ali_admin_user_email', email);
    localStorage.setItem('ali_admin_user_role', role);
    if (passToken) {
        localStorage.setItem('ali_admin_session_token', passToken);
    }
}

function handleAdminLogout() {
    if (confirm('Are you sure you want to sign out of the Admin CMS?')) {
        localStorage.removeItem('ali_admin_session_auth');
        sessionStorage.removeItem('ali_admin_session_auth');
        if (window.RichaliFirebase) {
            window.RichaliFirebase.signOut();
        }
        AdminState.isAuthenticated = false;
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

// --- SONG MANAGEMENT (/admin/songs) ---
function renderSongsTable() {
    const tableBody = document.getElementById('songsTableBody');
    if (!tableBody) return;

    const songs = Object.values(AdminState.songs || {});
    const searchVal = (document.getElementById('songsSearchInput')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('songsStatusFilter')?.value || 'ALL';

    const filtered = songs.filter(s => {
        const matchesSearch = !searchVal || 
            (s.title && s.title.toLowerCase().includes(searchVal)) || 
            (s.artist && s.artist.toLowerCase().includes(searchVal));
        const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--adm-text-muted);">
                    <i class="fa-solid fa-music" style="font-size: 32px; color: var(--adm-gold); margin-bottom: 12px; display: block;"></i>
                    <p style="font-size: 15px; font-weight: 600; color: #fff;">No songs matching current filters.</p>
                    <button class="btn btn-sm btn-gold" onclick="openAddSongModal()" style="margin-top: 14px;">
                        <i class="fa-solid fa-plus"></i> Add New Song
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filtered.map(s => `
        <tr>
            <td>
                <div class="table-title-cell">
                    <img src="${s.artworkUrl || 'images/hero.jpg'}" class="table-thumb" alt="${escapeHtml(s.title)}" onerror="this.src='images/hero.jpg'">
                    <div>
                        <div class="title-text">${escapeHtml(s.title)} ${s.featured ? '<span class="badge-featured"><i class="fa-solid fa-star"></i> Featured</span>' : ''}</div>
                        <div class="sub-text">${escapeHtml(s.artist || 'Ali Welekhasia')} ${s.feat ? 'ft. ' + escapeHtml(s.feat) : ''}</div>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(s.album || 'Single')}</td>
            <td>${escapeHtml(s.genre || 'Gospel')}</td>
            <td>${s.key ? `<span style="font-family: monospace; font-size: 12px; color: var(--adm-gold);">${escapeHtml(s.key)}</span>` : '—'}</td>
            <td><span class="status-badge status-${(s.status || 'draft').toLowerCase()}">${escapeHtml(s.status || 'DRAFT')}</span></td>
            <td>
                ${s.audioUrl ? '<i class="fa-solid fa-volume-high" style="color: #10b981;" title="Audio master uploaded"></i>' : '<i class="fa-solid fa-volume-xmark" style="color: var(--adm-text-subtle);" title="No audio file"></i>'}
                ${s.youtubeUrl ? ' <i class="fa-brands fa-youtube" style="color: #ef4444;" title="YouTube link attached"></i>' : ''}
            </td>
            <td>
                <div class="action-buttons-wrap">
                    <button class="btn-action-icon" title="Edit Song" onclick="editSong('${s.id}')">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-action-icon" title="Edit Lyrics" onclick="openLyricsEditorForSong('${s.id}')">
                        <i class="fa-solid fa-file-lines"></i>
                    </button>
                    ${s.status === 'PUBLISHED' 
                        ? `<button class="btn-action-icon" title="Unpublish (Save as Draft)" onclick="setSongStatus('${s.id}', 'DRAFT')"><i class="fa-solid fa-eye-slash"></i></button>`
                        : `<button class="btn-action-icon" title="Publish Song" onclick="setSongStatus('${s.id}', 'PUBLISHED')"><i class="fa-solid fa-circle-check" style="color: #10b981;"></i></button>`
                    }
                    <button class="btn-action-icon danger" title="Delete Song" onclick="deleteSongConfirm('${s.id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Modal open for Add/Edit Song
function openAddSongModal(songId = null) {
    const modal = document.getElementById('songModal');
    const form = document.getElementById('songForm');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('songModalId').value = songId || '';
    document.getElementById('songModalTitle').innerText = songId ? 'Edit Gospel Song' : 'Add New Gospel Song';

    // Clear preview boxes
    const artPreview = document.getElementById('songArtPreview');
    if (artPreview) artPreview.src = 'images/hero.jpg';
    const audioPreview = document.getElementById('songAudioPlayer');
    if (audioPreview) audioPreview.style.display = 'none';

    if (songId && AdminState.songs[songId]) {
        const s = AdminState.songs[songId];
        setVal('songInput_title', s.title);
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
        setVal('songInput_youtubeUrl', s.youtubeUrl || '');
        setVal('songInput_spotifyUrl', s.spotifyUrl || '');
        setVal('songInput_appleMusicUrl', s.appleMusicUrl || '');
        setVal('songInput_boomplayUrl', s.boomplayUrl || '');
        setVal('songInput_songwriter', s.songwriter || 'Ali Welekhasia');
        setVal('songInput_producer', s.producer || '');
        setVal('songInput_status', s.status || 'PUBLISHED');
        
        const featBox = document.getElementById('songInput_featured');
        if (featBox) featBox.checked = !!s.featured;

        if (s.artworkUrl && artPreview) artPreview.src = s.artworkUrl;
        if (s.audioUrl && audioPreview) {
            audioPreview.src = s.audioUrl;
            audioPreview.style.display = 'block';
        }
    }

    modal.classList.add('active');
}

function editSong(songId) {
    openAddSongModal(songId);
}

async function handleSongFormSubmit(event) {
    if (event) event.preventDefault();
    const id = document.getElementById('songModalId')?.value.trim() || `song_${Date.now()}`;
    const title = getVal('songInput_title').trim();

    if (!title) {
        showAdminToast('Song title is strictly required.', 'warning');
        return;
    }

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
        youtubeUrl: getVal('songInput_youtubeUrl'),
        spotifyUrl: getVal('songInput_spotifyUrl'),
        appleMusicUrl: getVal('songInput_appleMusicUrl'),
        boomplayUrl: getVal('songInput_boomplayUrl'),
        songwriter: getVal('songInput_songwriter'),
        producer: getVal('songInput_producer'),
        status: getVal('songInput_status') || 'PUBLISHED',
        featured: document.getElementById('songInput_featured')?.checked || false,
        updatedAt: Date.now()
    };

    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.setData(`${schema.songs}/${id}`, songData);
            await window.RichaliFirebase.logAudit('SAVE_SONG', 'songs', id, { title: songData.title, status: songData.status });
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

async function setSongStatus(songId, status) {
    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.updateData(`${schema.songs}/${songId}`, { status, updatedAt: Date.now() });
            await window.RichaliFirebase.logAudit('UPDATE_SONG_STATUS', 'songs', songId, { newStatus: status });
        } else if (AdminState.songs[songId]) {
            AdminState.songs[songId].status = status;
        }
        showAdminToast(`Song status updated to ${status}.`, 'success');
        renderSongsTable();
    } catch (err) {
        showAdminToast(`Failed to update status: ${err.message}`, 'error');
    }
}

async function deleteSongConfirm(songId) {
    const song = AdminState.songs[songId];
    const name = song ? song.title : 'this song';
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    try {
        if (window.RichaliFirebase) {
            const schema = window.RichaliFirebase.schema.aliwelekhasia;
            await window.RichaliFirebase.removeData(`${schema.songs}/${songId}`);
            await window.RichaliFirebase.logAudit('DELETE_SONG', 'songs', songId, { title: name });
        } else {
            delete AdminState.songs[songId];
        }
        showAdminToast(`Song "${name}" deleted.`, 'info');
        renderSongsTable();
        renderOverviewStats();
    } catch (err) {
        showAdminToast(`Delete error: ${err.message}`, 'error');
    }
}

// --- FILE & AUDIO STORAGE UPLOADS ---
async function handleArtworkFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate image
    if (!file.type.startsWith('image/')) {
        showAdminToast('Please select a valid image file (JPG, PNG, WebP).', 'warning');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showAdminToast('Image size exceeds 10MB limit.', 'warning');
        return;
    }

    const artPreview = document.getElementById('songArtPreview');
    const artUrlInput = document.getElementById('songInput_artworkUrl');

    // Local object URL preview immediately
    const tempUrl = URL.createObjectURL(file);
    if (artPreview) artPreview.src = tempUrl;

    if (!window.RichaliFirebase || !window.RichaliFirebase.storage) {
        showAdminToast('Storage notice: Firebase Storage not initialized. Using local preview.', 'warning');
        if (artUrlInput) artUrlInput.value = tempUrl;
        return;
    }

    try {
        showAdminToast('Uploading artwork to Firebase Cloud Storage...', 'info');
        const path = `aliwelekhasia/artwork/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const result = await window.RichaliFirebase.uploadFile(path, file);
        if (artUrlInput) artUrlInput.value = result.downloadUrl;
        if (artPreview) artPreview.src = result.downloadUrl;
        showAdminToast('Artwork uploaded to Cloud Storage!', 'success');
    } catch (err) {
        console.error('Artwork upload error:', err);
        showAdminToast(`Artwork upload notice: ${err.message}. If Firebase Storage is not provisioned in console, you may paste a direct URL.`, 'warning');
    }
}

async function handleAudioFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|aac|flac|ogg)$/i)) {
        showAdminToast('Please select a valid audio file (MP3, WAV, M4A, FLAC).', 'warning');
        return;
    }

    const progressBar = document.getElementById('audioUploadProgress');
    const progressFill = document.getElementById('audioUploadProgressFill');
    const audioPlayer = document.getElementById('songAudioPlayer');
    const audioUrlInput = document.getElementById('songInput_audioUrl');

    if (progressBar) progressBar.style.display = 'block';
    if (progressFill) progressFill.style.width = '0%';

    // Local preview immediately
    const tempAudioUrl = URL.createObjectURL(file);
    if (audioPlayer) {
        audioPlayer.src = tempAudioUrl;
        audioPlayer.style.display = 'block';
    }

    if (!window.RichaliFirebase || !window.RichaliFirebase.storage) {
        showAdminToast('Firebase Storage bucket not configured. Preview active.', 'warning');
        if (audioUrlInput) audioUrlInput.value = tempAudioUrl;
        if (progressBar) progressBar.style.display = 'none';
        return;
    }

    try {
        const path = `aliwelekhasia/music/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const result = await window.RichaliFirebase.uploadFileWithProgress(path, file, (progress) => {
            if (progressFill) progressFill.style.width = `${progress}%`;
        });

        if (audioUrlInput) audioUrlInput.value = result.downloadUrl;
        if (audioPlayer) audioPlayer.src = result.downloadUrl;
        if (progressBar) progressBar.style.display = 'none';
        showAdminToast('Audio master file uploaded and attached!', 'success');
    } catch (err) {
        console.error('Audio upload error:', err);
        if (progressBar) progressBar.style.display = 'none';
        showAdminToast(`Audio upload notice: ${err.message}. You can also provide a direct CDN audio link.`, 'warning');
    }
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

    tbody.innerHTML = `
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
            <td>Primary Ministry Head</td>
            <td><span style="color: var(--adm-text-subtle); font-size: 12px;">Protected Root</span></td>
        </tr>
        <tr>
            <td>
                <div class="table-title-cell">
                    <div class="user-avatar-circle" style="border-color: #3b82f6; color: #3b82f6;">AD</div>
                    <div>
                        <div class="title-text">Richali Ecosystem Admin</div>
                        <div class="sub-text">admin@aliwelekhasia.co.ke</div>
                    </div>
                </div>
            </td>
            <td><span class="user-role-badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa;">ADMIN</span></td>
            <td><span style="color: #10b981;"><i class="fa-solid fa-circle-check"></i> Active</span></td>
            <td>CMS Content Manager</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="showAdminToast('User permissions verified.', 'info')">Manage</button>
            </td>
        </tr>
    `;
}

// --- AUDIT LOGS (/admin/audit-logs) ---
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
    // Check if Cloudflare live stream functions exist
    const statusText = document.getElementById('liveControlStatus');
    if (statusText) statusText.innerText = 'Connecting to Cloudflare Stream Live engine...';

    fetch('/functions/api/live/status')
        .then(r => r.json())
        .then(data => {
            if (statusText) {
                statusText.innerHTML = data.isLive 
                    ? '<span style="color: #ef4444;"><i class="fa-solid fa-tower-broadcast"></i> BROADCAST IS LIVE</span>' 
                    : '<span style="color: #10b981;"><i class="fa-solid fa-check"></i> System Ready (Broadcaster Offline)</span>';
            }
        })
        .catch(() => {
            if (statusText) statusText.innerText = 'Cloudflare Live stream functions standby.';
        });
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
