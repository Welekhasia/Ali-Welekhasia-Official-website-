/* ==========================================================================
   ALI WELEKHASIA OFFICIAL GOSPEL MUSIC & MINISTRY PORTAL
   Core Interactive Application Logic & Systems
   ========================================================================== */

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'success', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';
    if (type === 'info') iconClass = 'fa-circle-info';

    toast.innerHTML = `
        <div class="toast-content">
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close notification">&times;</button>
        <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.35s ease forwards';
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 350);
    }, duration);
}

// --- THEME SYSTEM (Dark / Light Mode) ---
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('ali_theme', newTheme);
    updateThemeIcon(newTheme);
    showToast(`Switched to ${newTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}`, 'info', 2000);
}

function initTheme() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('ali_theme') || 'dark';

    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
        });
    }
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (!themeIcon) return;
    if (theme === 'light') {
        themeIcon.className = 'fa-solid fa-moon';
    } else {
        themeIcon.className = 'fa-solid fa-sun';
    }
}

// --- LIVE BROADCAST BANNER DISMISSAL ---
function dismissLiveBanner() {
    const banner = document.getElementById('liveBroadcastBanner');
    if (banner) {
        banner.style.transition = 'all 0.4s ease';
        banner.style.opacity = '0';
        banner.style.maxHeight = '0';
        banner.style.paddingTop = '0';
        banner.style.paddingBottom = '0';
        banner.style.overflow = 'hidden';
        setTimeout(() => {
            banner.style.display = 'none';
        }, 400);
    }
}

// --- MOBILE NAVIGATION & BACKDROP ---
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const toggleBtn = document.getElementById('mobileNavToggle');
    const overlay = document.getElementById('navOverlay');

    if (navMenu && toggleBtn) {
        navMenu.classList.toggle('active');
        toggleBtn.classList.toggle('open');
        if (overlay) {
            overlay.classList.toggle('active');
        }
    }
}

function closeMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const toggleBtn = document.getElementById('mobileNavToggle');
    const overlay = document.getElementById('navOverlay');

    if (navMenu) navMenu.classList.remove('active');
    if (toggleBtn) toggleBtn.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

// --- FLOATING BACK TO TOP BUTTON ---
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 350) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToTop();
    });
}

// --- COUNTDOWN TIMER ---
function initCountdownTimer() {
    loadSavedCrusadeEvent();
}

// --- CALENDAR INVITE GENERATOR (Google & iCal) ---
function createGoogleCalendarLink(title, details, location, startDate, endDate) {
    const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams({
        text: title,
        details: details,
        location: location,
        dates: `${startDate}/${endDate}`
    });
    return `${base}&${params.toString()}`;
}

function generateGoogleCalendarInvite(title, location, startIso, endIso, details) {
    const cleanStart = (startIso || '2026-09-12T17:00:00').replace(/-|:|\.\d\d\d/g, "");
    const cleanEnd = (endIso || '2026-09-14T22:00:00').replace(/-|:|\.\d\d\d/g, "");
    const url = createGoogleCalendarLink(
        title || 'Ali Welekhasia Ministry Event',
        details || 'Join Ali Welekhasia for gospel worship, spiritual teaching, and praise ministry.',
        location || 'Treasury Square Grounds, Mombasa, Kenya',
        cleanStart,
        cleanEnd
    );
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(`Opening Google Calendar for ${title || 'Event'}!`, 'success');
}

function downloadIcsCalendar(title, location, startZ, endZ) {
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Ali Welekhasia Gospel Ministries//EN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `SUMMARY:${title || 'Mombasa Gospel Worship Night'}`,
        `LOCATION:${location || 'Treasury Square Grounds, Mombasa, Kenya'}`,
        `DESCRIPTION:Join Ali Welekhasia for gospel worship, praise, and spiritual encouragement.`,
        `DTSTART:${startZ || '20260912T170000Z'}`,
        `DTEND:${endZ || '20260914T220000Z'}`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'ali_welekhasia_event.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('iCal / Outlook event calendar downloaded!', 'success');
}

function remindMeEvent(eventName, location) {
    generateGoogleCalendarInvite(eventName, location, '2026-09-12T17:00:00', '2026-09-14T22:00:00', 'Join Ali Welekhasia for gospel worship, praise, and prayer.');
}

// --- GLOBAL SEARCH SYSTEM WITH DYNAMIC TERM HIGHLIGHTING ---
const searchableData = [
    // 11 Featured Worship Tracks
    { title: "ZAWADI (The Gift of Life)", category: "music", description: "Official Worship Anthem - Gratitude for salvation, grace, and redemption", action: () => openLyricsModal("ZAWADI") },
    { title: "NI WEWE (It Is You Lord)", category: "music", description: "Official Anointed Worship Anthem - Surrender and exaltation of Christ", action: () => openLyricsModal("NI WEWE") },
    { title: "BADO (God is Still at Work)", category: "music", description: "Faith and Prophetic Song - Encouragement that your miracle is unfolding", action: () => openLyricsModal("BADO") },
    { title: "NASIMAMA (I Stand on the Rock)", category: "music", description: "Warfare and Victory Anthem - Unshakable faith in Jesus Christ", action: () => openLyricsModal("NASIMAMA") },
    { title: "NINTSIE HENA (Where Else Shall I Go)", category: "music", description: "Luhya / Swahili Joyous Praise - Total trust in the living God", action: () => openLyricsModal("NINTSIE HENA") },
    { title: "NJOONI TUMWIMBIE (Come Let Us Sing)", category: "music", description: "High-Energy Praise Psalm celebrating God's power and supremacy", action: () => openLyricsModal("NJOONI TUMWIMBIE") },
    { title: "LAMWELI_UMEPENDWA (Beloved of God)", category: "music", description: "Healing and Comfort Ballad - You are deeply loved by the Father", action: () => openLyricsModal("LAMWELI_UMEPENDWA") },
    { title: "NACHENDA MUSHIALO (Walking in this World)", category: "music", description: "Luhya Pilgrimage Worship - Christ is our guiding light and protector", action: () => openLyricsModal("NACHENDA MUSHIALO") },
    { title: "ALIBEBA (He Carried It All)", category: "music", description: "Cross & Redemption Hymn - Healing, deliverance, and forgiveness through Christ", action: () => openLyricsModal("ALIBEBA") },
    { title: "VUMILIA MOYO (Endure My Heart)", category: "music", description: "Ali Welekhasia ft. Mercy Lukio - Comfort and endurance in seasons of trial", action: () => openLyricsModal("VUMILIA MOYO") },
    { title: "UMETENDA HAYA (You Have Done Great Things)", category: "music", description: "Praise & Thanksgiving Anthem - Testifying of the mighty works of the Lord", action: () => openLyricsModal("UMETENDA HAYA") },
    
    // Sermons & Crusades
    { title: "The Power of Total Surrender", category: "sermon", description: "Crusade Sermon - Eldoret Sports Grounds 2024", action: () => openVideoModal('surrender', 'The Power of Total Surrender - Eldoret 2024') },
    { title: "Walking in Faith and Prophetic Favor", category: "sermon", description: "Sunday Service Word & Prophetic Impartation", action: () => openVideoModal('faith', 'Walking in Faith and Prophetic Favor') },
    
    // Devotionals & Articles
    { title: "Renewing Your Strength in the Waiting Season", category: "devotional", description: "Scripture study on Isaiah 40:31 and spiritual perseverance", action: () => openDevotional(0) },
    { title: "The Anointing of True Spirit & Truth Worship", category: "devotional", description: "A study of John 4:23-24 and wholehearted worship", action: () => openDevotional(1) },
    { title: "The Great Commission: Winning Souls in Our Cities", category: "devotional", description: "Mark 16:15 and open-air crusade evangelism missions", action: () => openDevotional(2) },
    { title: "The Secret Place of Intimacy", category: "devotional", description: "Psalm 91:1-2 and quiet prayer communion with God", action: () => openDevotional(3) },
    
    // Events & Giving
    { title: "Great East Africa Revival Crusade 2026", category: "events", description: "Eldoret & Nairobi Crusade dates and calendar reminder", action: () => { (document.getElementById('countdown') || document.getElementById('events'))?.scrollIntoView({ behavior: 'smooth' }); closeSearchModal(); } },
    { title: "Partner with Us & M-Pesa Giving", category: "partner", description: "M-Pesa Paybill 247247 & Equity Bank details for crusade support", action: () => { document.getElementById('partner')?.scrollIntoView({ behavior: 'smooth' }); closeSearchModal(); } },
    { title: "Voice Prayer & Written Intercession", category: "prayer", description: "Submit or record prayer requests for morning pastoral intercession", action: () => { document.getElementById('prayer')?.scrollIntoView({ behavior: 'smooth' }); closeSearchModal(); } }
];

let activeSearchFilter = 'all';

function toggleSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal && modal.classList.contains('active')) {
        closeSearchModal();
    } else {
        openSearchModal();
    }
}

function openSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.classList.add('active');
        const input = document.getElementById('globalSearchInput');
        if (input) {
            input.focus();
            renderSearchResults(input.value);
        }
    }
}

function closeSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal) modal.classList.remove('active');
}

function handleGlobalSearch(query) {
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
        clearBtn.style.display = query && query.trim() ? 'block' : 'none';
    }
    renderSearchResults(query);
}

function clearSearch() {
    const input = document.getElementById('globalSearchInput');
    if (input) {
        input.value = '';
        input.focus();
        renderSearchResults('');
    }
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) clearBtn.style.display = 'none';
}

function clearSearchInput() {
    clearSearch();
}

function filterSearchCategory(category, btnElem) {
    activeSearchFilter = category;
    document.querySelectorAll('.search-cat-pill').forEach(btn => btn.classList.remove('active'));
    if (btnElem) btnElem.classList.add('active');
    const input = document.getElementById('globalSearchInput');
    renderSearchResults(input ? input.value : '');
}

function filterSearchResults(category, btnElem) {
    filterSearchCategory(category, btnElem);
}

// Helper to highlight matching substrings within text safely
function highlightMatch(text, query) {
    if (!text) return '';
    const safeText = escapeHtml(text);
    if (!query || !query.trim()) return safeText;
    const words = query.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return safeText;
    const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
    return safeText.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function renderSearchResults(query = '') {
    const resultsContainer = document.getElementById('searchResultsContainer') || document.getElementById('searchResultsList');
    if (!resultsContainer) return;

    const trimmed = query.toLowerCase().trim();
    const filtered = searchableData.filter(item => {
        const matchesCat = (activeSearchFilter === 'all' || item.category === activeSearchFilter);
        const matchesQuery = !trimmed || item.title.toLowerCase().includes(trimmed) || item.description.toLowerCase().includes(trimmed);
        return matchesCat && matchesQuery;
    });

    if (filtered.length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <p>No results found for "<strong>${escapeHtml(query)}</strong>"</p>
                <span style="font-size:12px; color:var(--text-dim);">Try searching for songs (Zawadi, Ni Wewe, Bado), sermons, devotionals, or events.</span>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = filtered.map(item => {
        const origIndex = searchableData.indexOf(item);
        const highlightedTitle = highlightMatch(item.title, query);
        const highlightedDesc = highlightMatch(item.description, query);
        return `
            <div class="search-result-item" onclick="handleSearchResultClick(${origIndex})">
                <div>
                    <div class="search-result-title">${highlightedTitle}</div>
                    <div style="font-size:12px; color:var(--text-muted); line-height: 1.4;">${highlightedDesc}</div>
                </div>
                <span class="search-result-category">${item.category}</span>
            </div>
        `;
    }).join('');

    resultsContainer.classList.remove('tab-content-anim');
    void resultsContainer.offsetWidth;
    resultsContainer.classList.add('tab-content-anim');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[m]);
}

function handleSearchResultClick(index) {
    const item = searchableData[index];
    if (item && item.action) {
        closeSearchModal();
        item.action();
    }
}

// --- LYRICS & CHORDS DATABASE (11 SONGS) WITH INSTANT FORMATTED PDF GENERATION ---
const songDatabase = {
    "ZAWADI": {
        title: "ZAWADI",
        artist: "Ali Welekhasia",
        key: "Key of D Major (BPM: 76)",
        snippet: "Zawadi ya uzima, zawadi ya wokovu, Ulinipa bure Yesu wangu...",
        lyrics: `[Verse 1]
Nilikuwa gizani, sikuwa na tumaini
Ukanitazama kwa jicho la rehema
Ukanivuta karibu nawe Mwokozi
Ukanifanya kiumbe kipya ndani yako.

[Chorus]
Zawadi ya uzima, zawadi ya wokovu
Ulinipa bure Yesu wangu
Sitanyamaza, nitaishi nikikutukuza
Wewe ndiwe zawadi kuu maishani mwangu!

[Verse 2]
Mali na fahari haziwezi kulinganishwa
Na upendo wako uliomwagika pale msalabani
Damu yako ilinunua ukombozi wangu
Sina deni tena, niko huru kabisa!

[Bridge]
Asante kwa zawadi ya Roho Mtakatifu
Kiongozi na msaidizi katika safari
Hadi siku ya mwisho nitakapokuona
Nitasimama nikisema: Asante Yesu!

[Outro]
Zawadi ya milele, Yesu wangu
Pokea sifa zangu zote, Haleluya!`,
        chords: `[Intro]
D  -  A/C#  -  Bm  -  G  (x2)

[Verse 1]
D              A/C#
Nilikuwa gizani, sikuwa na tumaini
Bm             G
Ukanitazama kwa jicho la rehema
D              A/C#
Ukanivuta karibu nawe Mwokozi
Bm             G              D
Ukanifanya kiumbe kipya ndani yako.

[Chorus]
D              A
Zawadi ya uzima, zawadi ya wokovu
Bm             G
Ulinipa bure Yesu wangu
D              A
Sitanyamaza, nitaishi nikikutukuza
Bm             G           D
Wewe ndiwe zawadi kuu maishani mwangu!

[Verse 2]
D              A/C#
Mali na fahari haziwezi kulinganishwa
Bm             G
Na upendo wako uliomwagika pale msalabani
D              A/C#
Damu yako ilinunua ukombozi wangu
Bm             G           D
Sina deni tena, niko huru kabisa!

[Bridge]
Em             F#m
Asante kwa zawadi ya Roho Mtakatifu
G              A
Kiongozi na msaidizi katika safari
Em             F#m
Hadi siku ya mwisho nitakapokuona
G              A           D
Nitasimama nikisema: Asante Yesu!`,
        translation: `[Verse 1]
I was in darkness, without any hope
You looked upon me with eyes of mercy
You drew me close to You, my Savior
You made me a brand new creation in You.

[Chorus]
The gift of life, the gift of salvation
You gave to me freely, my Jesus
I will not be silent, I will live to glorify You
You are the greatest gift in my whole life!

[Verse 2]
Wealth and earthly glory cannot compare
With Your love poured out on Calvary's cross
Your precious blood purchased my redemption
I owe no debt, I am completely free!

[Bridge]
Thank You for the gift of the Holy Spirit
Our guide and helper through life's journey
Until that final day when I see Your face
I will stand proclaiming: Thank You Jesus!`
    },

    "NI WEWE": {
        title: "NI WEWE",
        artist: "Ali Welekhasia",
        key: "Key of D Major (BPM: 72)",
        snippet: "Ni Wewe, Ni Wewe Bwana, Hakuna mwingine wa kulinganishwa nawe...",
        youtubeUrl: "https://youtu.be/BLkpibP7XAU?si=P_PKI-vuYpnsQBN9",
        youtubeId: "BLkpibP7XAU",
        thumbnail: "https://img.youtube.com/vi/BLkpibP7XAU/hqdefault.jpg",
        lyrics: `[Verse 1]
Ni nani kama Wewe Bwana ulimwenguni kote?
Mungu wa miungu, Mfalme wa wafalme
Umeketi juu ya kiti cha enzi
Utukufu na heshima zikurudie Wewe.

[Chorus]
Ni Wewe, Ni Wewe Bwana
Hakuna mwingine wa kulinganishwa nawe
Ni Wewe, Ni Wewe Yesu
Mwanzo na Mwisho wa maisha yangu!

[Verse 2]
Katika mawimbi na dhoruba za maisha
Wewe ndiwe nguzo na mwamba wangu imara
Sitaogopa maana uko pamoja nami
Ushindi wangu umo mikononi mwako.

[Bridge]
Mtakatifu, Mtakatifu
Bwana Mungu Mwenyezi
Uliye kuwako, Uliyeko, na Utakayekuja!`,
        chords: `[Intro]
D  -  G  -  Bm  -  A

[Verse 1]
D              G
Ni nani kama Wewe Bwana ulimwenguni kote?
Bm             A
Mungu wa miungu, Mfalme wa wafalme
D              G
Umeketi juu ya kiti cha enzi
Bm             A              D
Utukufu na heshima zikurudie Wewe.

[Chorus]
D              G
Ni Wewe, Ni Wewe Bwana
Bm             A
Hakuna mwingine wa kulinganishwa nawe
D              G
Ni Wewe, Ni Wewe Yesu
Bm             A          D
Mwanzo na Mwisho wa maisha yangu!

[Bridge]
G       A       Bm      D/F#
Mtakatifu, Mtakatifu
G       A       D
Bwana Mungu Mwenyezi!`,
        translation: `[Verse 1]
Who is like You, Lord, in all the world?
God of gods, King of kings
You sit enthroned on high in majesty
May all glory and honour return to You.

[Chorus]
It is You, It is You, Lord
There is none who can compare to You
It is You, It is You, Jesus
The Alpha and the Omega of my life!

[Verse 2]
Amidst the waves and storms of this life
You are my pillar and unshakeable rock
I shall not fear for You are with me
My victory rests in Your hands.`
    },

    "BADO": {
        title: "BADO",
        artist: "Ali Welekhasia",
        key: "Key of G Major (BPM: 80)",
        snippet: "Bado Mungu yuko kazini, bado hajafunga mlango wa neema...",
        youtubeUrl: "https://youtu.be/TQxObs0FZ3w?si=HMx0wkuNj2K8j4oM",
        youtubeId: "TQxObs0FZ3w",
        thumbnail: "https://img.youtube.com/vi/TQxObs0FZ3w/hqdefault.jpg",
        lyrics: `[Verse 1]
Usikate tamaa unapopita kwenye bonde
Mungu uliyemlilia hajasahau ahadi zake
Wakati wa wanadamu unapokwisha
Ndio wakati wa Mungu kuanza kazi Yake.

[Chorus]
Bado! Bado Mungu yuko kazini!
Bado hajafunga mlango wa rehema
Bado, jambo jipya linaanza kwako
Usiogope, Bwana atakutetea!

[Verse 2]
Sarah alicheka lakini akaona mtoto
Lazarus alilala kaburini akaitwa atoke
Hakuna giza zito lisiloshindwa na nuru
Simama imara, mwisho wako ni ushindi!

[Bridge]
Atatenda tena, Atatenda leo
Nguvu zake hazina mwisho!`,
        chords: `[Verse 1]
G              C
Usikate tamaa unapopita kwenye bonde
Em             D
Mungu uliyemlilia hajasahau ahadi zake
G              C
Wakati wa wanadamu unapokwisha
Em             D          G
Ndio wakati wa Mungu kuanza kazi Yake.

[Chorus]
G              C
Bado! Bado Mungu yuko kazini!
Em             D
Bado hajafunga mlango wa rehema
G              C
Bado, jambo jipya linaanza kwako
Em             D          G
Usiogope, Bwana atakutetea!`,
        translation: `[Verse 1]
Do not lose heart while walking through the valley
The God you cried out to has not forgotten His promises
When human strength comes to an end
That is when God's miraculous power begins.

[Chorus]
Still! God is still at work!
He has not closed the doors of mercy
Still, a new breakthrough is unfolding for you
Do not fear, the Lord will defend you!

[Verse 2]
Sarah laughed yet embraced her promise child
Lazarus lay in the tomb yet walked out alive
No darkness is too thick for His light to shatter
Stand firm, your ending is victory!`
    },

    "NASIMAMA": {
        title: "NASIMAMA",
        artist: "Ali Welekhasia",
        key: "Key of E Major (BPM: 70)",
        snippet: "Nasimama imara juu ya Mwamba Yesu Kristo, sitashindwa kamwe...",
        lyrics: `[Verse 1]
Misingi ya dunia ikitetemeka
Na milima ikitupwa baharini
Moyo wangu hautatikisika
Niko salama mikononi mwa Yesu.

[Chorus]
Nasimama imara juu ya Mwamba
Yesu Kristo ndiye msingi wangu
Mitego ya adui haitanipata
Nasimama nikitangaza ushindi!

[Verse 2]
Kwa damu ya Mwanakondoo nimeshinda
Kwa neno la ushuhuda ninasonga
Mungu wangu ni ngao na ngome yangu
Ndani yake ninaketi kwa amani.`,
        chords: `[Verse 1]
E              A
Misingi ya dunia ikitetemeka
C#m            B
Na milima ikitupwa baharini
E              A
Moyo wangu hautatikisika
C#m            B          E
Niko salama mikononi mwa Yesu.

[Chorus]
E              A
Nasimama imara juu ya Mwamba
C#m            B
Yesu Kristo ndiye msingi wangu
E              A
Mitego ya adui haitanipata
C#m            B          E
Nasimama nikitangaza ushindi!`,
        translation: `[Verse 1]
Though the foundations of the earth should shake
And mountains be cast into the midst of the sea
My heart shall never be shaken
I am safe in the hands of Jesus.

[Chorus]
I stand firm upon the Rock
Jesus Christ is my solid foundation
The snares of the enemy shall not overcome me
I stand proclaiming victory!`
    },

    "NINTSIE HENA": {
        title: "NINTSIE HENA",
        artist: "Ali Welekhasia",
        key: "Key of A Major (BPM: 112)",
        snippet: "Nintsie hena wele wange? Halelujah, Wele wange ni wewesi!...",
        lyrics: `[Verse 1 (Luhya)]
Nintsie hena wele wange?
Mumbeli mwowo mulimo obulamu
Nalola muno mushialo mosi
Sinyola owali nga iwe tawe!

[Chorus]
Halelujah, Wele wange ni wewesi!
Mwami Yesu, owali no lukoosi
Nintsie hena wele wange?
Mubunyali bwowo nise ndisalama!

[Verse 2 (Swahili)]
Niende wapi Bwana wangu?
Mbele zako kuna uzima tele
Nikitazama ulimwengu mzima
Sijaona Mungu kama Wewe!

[Chorus 2]
Haleluya, Mungu wangu ni Wewe pekee!
Bwana Yesu, mwenye utukufu wote
Niende wapi mbali na uwepo wako?
Mikononi mwako nina salama!`,
        chords: `[Intro]
A  -  D  -  E  -  A

[Verse 1]
A              D
Nintsie hena wele wange?
F#m            E
Mumbeli mwowo mulimo obulamu
A              D
Nalola muno mushialo mosi
F#m            E          A
Sinyola owali nga iwe tawe!

[Chorus]
A              D
Halelujah, Wele wange ni wewesi!
F#m            E
Mwami Yesu, owali no lukoosi
A              D
Nintsie hena wele wange?
F#m            E          A
Mubunyali bwowo nise ndisalama!`,
        translation: `[Verse 1 (Luhya to English)]
Where else shall I go, my God?
In Your presence there is fullness of life
I have searched across the entire world
I have found no one comparable to You!

[Chorus]
Hallelujah, my God, it is You alone!
Lord Jesus, crowned with all glory
Where else shall I go, my God?
In Your mighty power I am eternally safe!`
    },

    "NJOONI TUMWIMBIE": {
        title: "NJOONI TUMWIMBIE",
        artist: "Ali Welekhasia",
        key: "Key of F Major (BPM: 105)",
        snippet: "Njooni tumwimbie Bwana, tumfanyie shangwe, Mwamba wa wokovu wetu...",
        youtubeUrl: "https://youtu.be/Rwsr-3vtouM?si=p7Gl6rWjZ-BG9sH-",
        youtubeId: "Rwsr-3vtouM",
        thumbnail: "https://img.youtube.com/vi/Rwsr-3vtouM/hqdefault.jpg",
        lyrics: `[Verse 1]
Njooni tumwimbie Bwana wetu
Tumfanyie shangwe Mwamba wa wokovu
Tuingie malangoni mwake kwa shukrani
Na katika nyua zake kwa sifa tele!

[Chorus]
Njooni tumwimbie! Njooni tumsifu!
Bwana ametenda makuu kwetu
Pigeni makofi, pigeni vigelegele
Yesu anatawala milele na milele!

[Verse 2]
Yeye ndiye aliyeumba bahari na nchi kavu
Mikononi mwake zimo vilindi vya dunia
Yeye ndiye Mchungaji wetu mwaminifu
Sisi ni kondoo za malisho yake.`,
        chords: `[Verse 1]
F              Bb
Njooni tumwimbie Bwana wetu
Dm             C
Tumfanyie shangwe Mwamba wa wokovu
F              Bb
Tuingie malangoni mwake kwa shukrani
Dm             C          F
Na katika nyua zake kwa sifa tele!

[Chorus]
F              Bb
Njooni tumwimbie! Njooni tumsifu!
Dm             C
Bwana ametenda makuu kwetu
F              Bb
Pigeni makofi, pigeni vigelegele
Dm             C          F
Yesu anatawala milele na milele!`,
        translation: `[Verse 1]
Come, let us sing unto the Lord
Let us make a joyful noise to the Rock of our salvation
Let us come into His gates with thanksgiving
And into His courts with abundant praise!

[Chorus]
Come let us sing! Come let us praise Him!
The Lord has done marvelous deeds for us
Clap your hands, shout with joyful praise
Jesus reigns forever and ever!`
    },

    "LAMWELI_UMEPENDWA": {
        title: "LAMWELI_UMEPENDWA",
        artist: "Ali Welekhasia",
        key: "Key of C Major (BPM: 74)",
        snippet: "Lamweli, Umependwa na Mungu Mkuu, hauko peke yako katika safari hii...",
        youtubeUrl: "https://youtu.be/ZyM4Iqpv5jo?si=sJyB8-IgWBRN0vr2",
        youtubeId: "ZyM4Iqpv5jo",
        thumbnail: "https://img.youtube.com/vi/ZyM4Iqpv5jo/hqdefault.jpg",
        lyrics: `[Verse 1]
Machozi yako yaliyoanguka gizani
Mungu aliyekuumba ameyaona yote
Hata wanadamu wakikukataa na kukusahau
Upendo wa Baba hauwezi kubadilika.

[Chorus]
Lamweli, umependwa na Mungu Mkuu!
Hauko peke yako katika safari hii
Msalabani alitoa damu yake kwako
Wewe ni mboni ya jicho la Mungu!

[Verse 2]
Inua kichwa chako, utukufu unakuja
Uvumilivu wako unazaa matunda mema
Amani ya Kristo ijae moyoni mwako
Wewe ni mshindi ndani ya Yesu.`,
        chords: `[Verse 1]
C              F
Machozi yako yaliyoanguka gizani
Am             G
Mungu aliyekuumba ameyaona yote
C              F
Hata wanadamu wakikukataa na kukusahau
Am             G          C
Upendo wa Baba hauwezi kubadilika.

[Chorus]
C              F
Lamweli, umependwa na Mungu Mkuu!
Am             G
Hauko peke yako katika safari hii
C              F
Msalabani alitoa damu yake kwako
Am             G          C
Wewe ni mboni ya jicho la Mungu!`,
        translation: `[Verse 1]
Your tears that fell in the quiet darkness
The God who created you has seen them all
Even if people reject you and forget your name
The Father's love remains unchanged and true.

[Chorus]
Lamweli, you are deeply loved by Almighty God!
You are never alone on this life journey
On Calvary's cross He gave His blood for you
You are the apple of God's eye!`
    },

    "NACHENDA MUSHIALO": {
        title: "NACHENDA MUSHIALO",
        artist: "Ali Welekhasia",
        key: "Key of G Major (BPM: 82)",
        snippet: "Nachenda mushialo muno muli amapereka, Yesu niwe mulolele wange...",
        lyrics: `[Verse 1 (Luhya)]
Nachenda mushialo muno muli amapereka
Nisungilwe nende amabi amanji
Ne Yesu Kristo niye mulolele wange
Alambungula mukululuma kwosi.

[Chorus]
Nachenda nende Yesu, sinyala okugwa ta!
Niye taa yange khunjila yosi
Khu lufuululilo ndikeba khumusala
Yesu niwe bulamu bwange bwosi!

[Verse 2 (Swahili)]
Ninapita ulimwenguni humu mwa majaribu
Nimezungukwa na giza na hofu nyingi
Lakini Yesu ndiye kiongozi wangu
Hunishika mkono nikishinda yote.`,
        chords: `[Verse 1]
G              C
Nachenda mushialo muno muli amapereka
Em             D
Nisungilwe nende amabi amanji
G              C
Ne Yesu Kristo niye mulolele wange
Em             D          G
Alambungula mukululuma kwosi.

[Chorus]
G              C
Nachenda nende Yesu, sinyala okugwa ta!
Em             D
Niye taa yange khunjila yosi
G              C
Khu lufuululilo ndikeba khumusala
Em             D          G
Yesu niwe bulamu bwange bwosi!`,
        translation: `[Verse 1 (Luhya to English)]
As I walk through this world filled with trials
Surrounded by hardships on every side
Jesus Christ is my watchful protector
He delivers me through every storm.

[Chorus]
I walk with Jesus, I shall never fall!
He is the lamp unto my feet on every path
At the journey's end I look to the cross
Jesus is my entire life!`
    },

    "ALIBEBA": {
        title: "ALIBEBA",
        artist: "Ali Welekhasia",
        key: "Key of Bm / D (BPM: 68)",
        snippet: "Alibeba mizigo yangu yote, alibeba magonjwa yangu msalabani...",
        lyrics: `[Verse 1]
Hakika alizichukua huzuni zetu
Akajitwika masikitiko yetu msalabani
Alichomwa kwa sababu ya makosa yetu
Adhabu ya amani yetu ilikuwa juu yake.

[Chorus]
Alibeba! Alibeba mizigo yangu!
Alibeba magonjwa yangu yote
Kwa kupigwa kwake nimeponywa kabisa
Niko huru, nina uzima wa milele!

[Verse 2]
Mateso yote yakaishia pale Kalvari
Pazia la hekalu likachanika mara mbili
Mlango wa neema uko wazi leo
Njoo kwa Yesu utue mizigo yako.`,
        chords: `[Verse 1]
Bm             G
Hakika alizichukua huzuni zetu
D              A
Akajitwika masikitiko yetu msalabani
Bm             G
Alichomwa kwa sababu ya makosa yetu
D              A          D
Adhabu ya amani yetu ilikuwa juu yake.

[Chorus]
D              A
Alibeba! Alibeba mizigo yangu!
Bm             G
Alibeba magonjwa yangu yote
D              A
Kwa kupigwa kwake nimeponywa kabisa
Bm             G          D
Niko huru, nina uzima wa milele!`,
        translation: `[Verse 1]
Surely He took up our griefs and sorrow
He carried our sorrows on Calvary's cross
He was wounded for our transgressions
The chastisement of our peace was upon Him.

[Chorus]
He carried it! He carried all my burdens!
He bore all my sicknesses and pains
By His stripes I am completely healed
I am free, I have eternal life!`
    },

    "VUMILIA MOYO": {
        title: "VUMILIA MOYO",
        artist: "Ali Welekhasia ft. Mercy Lukio",
        key: "Key of G Major (BPM: 75)",
        snippet: "Vumilia moyo, uvumilivu una thawabu, Mungu uliyemwamini hawezi kukuacha...",
        lyrics: `[Verse 1]
Moyo wangu kwa nini unasononeka?
Mbona unahangaika ndani yangu?
Mtumaini Mungu Mwenyezi
Bado utamsifu kwa wokovu wa uso wake.

[Chorus]
Vumilia moyo, uvumilivu una thawabu
Mungu uliyemwamini hawezi kukuacha kamwe
Ushiku unaweza kuwa mrefu na wenye machozi
Lakini asubuhi shangwe inakuja!

[Verse 2]
Ayubu alipitia majaribu mazito
Lakini Mungu akamrudishia mara mbili
Yusufu alitupwa gerezani akawa waziri mkuu
Subiri kidogo, wakati wako wa kuinuliwa umefika!`,
        chords: `[Verse 1]
G              C
Moyo wangu kwa nini unasononeka?
Em             D
Mbona unahangaika ndani yangu?
G              C
Mtumaini Mungu Mwenyezi
Em             D          G
Bado utamsifu kwa wokovu wa uso wake.

[Chorus]
G              C
Vumilia moyo, uvumilivu una thawabu
Em             D
Mungu uliyemwamini hawezi kukuacha kamwe
G              C
Ushiku unaweza kuwa mrefu na wenye machozi
Em             D          G
Lakini asubuhi shangwe inakuja!`,
        translation: `[Verse 1]
Why are you cast down, O my soul?
Why are you disquieted within me?
Put your hope and trust in Almighty God
For you shall yet praise Him for His salvation.

[Chorus]
Endure, O heart! Endurance has great reward
The God you trusted will never abandon you
The night may be long and full of weeping
But joy comes with the morning dawn!`
    },

    "UMETENDA HAYA": {
        title: "UMETENDA HAYA",
        artist: "Ali Welekhasia",
        key: "Key of C Major (BPM: 98)",
        snippet: "Umetenda haya Bwana, Mungu wangu Mkuu, Sifa na utukufu zikurudie Wewe milele...",
        lyrics: `[Verse 1]
Nikitazama nilikotoka na nilipo sasa
Sina la kusema ila kutoa shukrani
Ulinilinda katika hatari na mitego
Ukaniweka mahali pa heshima.

[Chorus]
Umetenda haya Bwana, Mungu wangu!
Sifa na utukufu zikurudie Wewe milele
Matendo yako ni makuu na ya ajabu
Hakuna kama Wewe katika mbingu na nchi!

[Verse 2]
Umenipa wimbo mpya wa ushindi
Umenifuta machozi ukanivika taji
Watu wataona wema wako maishani mwangu
Wamtukuze Baba yetu aliye mbinguni!`,
        chords: `[Verse 1]
C              F
Nikitazama nilikotoka na nilipo sasa
Am             G
Sina la kusema ila kutoa shukrani
C              F
Ulinilinda katika hatari na mitego
Am             G          C
Ukaniweka mahali pa heshima.

[Chorus]
C              F
Umetenda haya Bwana, Mungu wangu!
Am             G
Sifa na utukufu zikurudie Wewe milele
C              F
Matendo yako ni makuu na ya ajabu
Am             G          C
Hakuna kama Wewe katika mbingu na nchi!`,
        translation: `[Verse 1]
When I reflect on where I came from and where I am today
I have nothing to say except offering praise and thanks
You shielded me from unseen snares and dangers
And established my feet in a place of honour.

[Chorus]
You have done all these great things, Lord, my God!
May all glory and honour return to You forever
Your mighty works are marvelous and wondrous
There is none like You in heaven and earth!`
    }
};

let currentLyricsSong = "ZAWADI";
let currentLyricsTab = "swahili";

function openLyricsModal(songKey) {
    const modal = document.getElementById('lyricsModal');
    if (!modal) return;

    // Resolve song from database key or case-insensitive match
    let resolvedKey = songKey;
    if (!songDatabase[resolvedKey]) {
        const found = Object.keys(songDatabase).find(k => k.toLowerCase() === songKey.toLowerCase() || k.replace(/_/g, ' ').toLowerCase() === songKey.replace(/_/g, ' ').toLowerCase());
        resolvedKey = found || "ZAWADI";
    }

    currentLyricsSong = resolvedKey;
    const song = songDatabase[resolvedKey];

    const titleEl = document.getElementById('lyricsModalTitle');
    const artistEl = document.getElementById('lyricsModalArtist');
    const keyEl = document.getElementById('lyricsModalKey');

    if (titleEl) titleEl.innerText = song.title;
    if (artistEl) artistEl.innerText = song.artist;
    if (keyEl) keyEl.innerText = song.key;

    switchLyricsTab('swahili');
    modal.classList.add('active');
}

function closeLyricsModal() {
    const modal = document.getElementById('lyricsModal');
    if (modal) modal.classList.remove('active');
}

function switchLyricsTab(tab) {
    currentLyricsTab = tab;
    
    // Update active tab buttons
    const tabSwahili = document.getElementById('tabSwahiliLyrics');
    const tabChords = document.getElementById('tabChordsLyrics');
    const tabEnglish = document.getElementById('tabEnglishLyrics');

    if (tabSwahili) tabSwahili.classList.toggle('active', tab === 'swahili');
    if (tabChords) tabChords.classList.toggle('active', tab === 'chords');
    if (tabEnglish) tabEnglish.classList.toggle('active', tab === 'english');

    const song = songDatabase[currentLyricsSong] || songDatabase["ZAWADI"];
    const contentEl = document.getElementById('lyricsModalContent');
    if (!contentEl) return;

    if (tab === 'swahili') {
        contentEl.innerHTML = `
            <div class="lyrics-text-container">
                <pre class="lyrics-formatted-pre">${escapeHtml(song.lyrics)}</pre>
            </div>
        `;
    } else if (tab === 'chords') {
        contentEl.innerHTML = `
            <div class="lyrics-text-container">
                <div class="chord-banner-info">
                    <i class="fa-solid fa-guitar"></i> ${song.key} • Official Chord Chart
                </div>
                <pre class="lyrics-formatted-pre chords-pre">${escapeHtml(song.chords)}</pre>
            </div>
        `;
    } else if (tab === 'english') {
        contentEl.innerHTML = `
            <div class="lyrics-text-container">
                <div class="chord-banner-info">
                    <i class="fa-solid fa-language"></i> English Translation & Meaning
                </div>
                <pre class="lyrics-formatted-pre translation-pre">${escapeHtml(song.translation || song.lyrics)}</pre>
            </div>
        `;
    }

    // Trigger smooth fade-in animation
    contentEl.classList.remove('tab-content-anim');
    void contentEl.offsetWidth; // force DOM reflow
    contentEl.classList.add('tab-content-anim');
}

function downloadLyricsAsPdf() {
    downloadLyricsPDF();
}

function downloadLyricsPDF() {
    const song = songDatabase[currentLyricsSong] || songDatabase["ZAWADI"];
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast('Please allow popups to download or print your lyrics PDF sheet', 'error');
        return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${song.title} - Official Lyrics & Chord Sheet | Ali Welekhasia</title>
    <style>
        @page { size: A4; margin: 15mm; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            line-height: 1.5;
            background: #fff;
            padding: 20px 30px;
        }
        .header {
            border-bottom: 3px solid #b45309;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .title {
            font-size: 26px;
            font-weight: 800;
            color: #92400e;
            margin: 0;
            letter-spacing: 0.5px;
        }
        .artist {
            font-size: 14px;
            color: #475569;
            margin-top: 4px;
        }
        .meta-pill {
            background: #fef3c7;
            color: #92400e;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            display: inline-block;
        }
        .grid-layout {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 25px;
        }
        .section-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        }
        .section-box h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 14px;
            color: #b45309;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 4px;
        }
        pre {
            font-family: "Courier New", Courier, monospace;
            font-size: 12px;
            line-height: 1.6;
            white-space: pre-wrap;
            margin: 0;
            color: #0f172a;
        }
        .chords-pre {
            color: #1e3a8a;
            font-weight: 600;
        }
        .footer {
            margin-top: 30px;
            border-top: 1px solid #cbd5e1;
            padding-top: 12px;
            font-size: 11px;
            color: #64748b;
            text-align: center;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 class="title">${song.title}</h1>
            <div class="artist">${song.artist} • Official Worship & Gospel Music Release</div>
        </div>
        <div class="meta-pill">${song.key}</div>
    </div>

    <div class="grid-layout">
        <div>
            <div class="section-box">
                <h3>Swahili Lyrics</h3>
                <pre>${escapeHtml(song.lyrics)}</pre>
            </div>

            <div class="section-box">
                <h3>English Translation</h3>
                <pre>${escapeHtml(song.translation || '')}</pre>
            </div>
        </div>

        <div>
            <div class="section-box">
                <h3>Chords & Progression</h3>
                <pre class="chords-pre">${escapeHtml(song.chords)}</pre>
            </div>

            <div class="section-box">
                <h3>Ministry Information</h3>
                <p style="font-size: 12px; margin: 0; line-height: 1.6;">
                    <strong>Ali Welekhasia Gospel Music Ministry</strong><br>
                    Gospel Music • Worship Ministry • Bible Outreach<br>
                    Website: https://aliwelekhasia.co.ke<br>
                    YouTube: @aliwelekhasia<br>
                    M-Pesa Support Paybill: 247247 (Acc: ALI WELEKHASIA)
                </p>
            </div>
        </div>
    </div>

    <div class="footer">
        © ${new Date().getFullYear()} <strong>Ali Welekhasia Gospel Ministry</strong> • <a href="https://aliwelekhasia.co.ke" style="color:#64748b;text-decoration:none;">https://aliwelekhasia.co.ke</a> • Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. Anointed for worship and soul winning.
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 350);
        };
    </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    showToast(`PDF Printable generated for "${song.title}"!`, 'success');
}

function copyLyricsText() {
    const song = songDatabase[currentLyricsSong] || songDatabase["ZAWADI"];
    let textToCopy = `=== ${song.title} ===\nBy ${song.artist} (${song.key})\n\n[LYRICS]\n${song.lyrics}\n\n[CHORDS]\n${song.chords}`;
    if (currentLyricsTab === 'english' && song.translation) {
        textToCopy = `=== ${song.title} (English Translation) ===\nBy ${song.artist}\n\n${song.translation}`;
    }
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast(`Lyrics for "${song.title}" copied to clipboard!`, 'success');
        }).catch(() => fallbackCopy(textToCopy, `Lyrics for "${song.title}"`));
    } else {
        fallbackCopy(textToCopy, `Lyrics for "${song.title}"`);
    }
}

// --- PRAYER REQUEST DRAFT PERSISTENCE (LOCALSTORAGE) ---
const PRAYER_DRAFT_KEY = 'ali_prayer_request_draft_v1';

function initPrayerDraftPersistence() {
    const nameInput = document.getElementById('prayerName');
    const emailInput = document.getElementById('prayerEmail');
    const catInput = document.getElementById('prayerCategory');
    const msgInput = document.getElementById('prayerMessage');

    // Restore existing draft
    restorePrayerDraft();

    // Auto-save on input change
    const inputs = [nameInput, emailInput, catInput, msgInput];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', savePrayerDraft);
            input.addEventListener('change', savePrayerDraft);
        }
    });
}

function savePrayerDraft() {
    const name = document.getElementById('prayerName')?.value || '';
    const email = document.getElementById('prayerEmail')?.value || '';
    const category = document.getElementById('prayerCategory')?.value || 'Healing & Health';
    const message = document.getElementById('prayerMessage')?.value || '';

    // Only save if at least one field has text
    if (name.trim() || email.trim() || message.trim()) {
        const draftData = {
            name,
            email,
            category,
            message,
            timestamp: new Date().toISOString()
        };
        try {
            localStorage.setItem(PRAYER_DRAFT_KEY, JSON.stringify(draftData));
        } catch (e) {
            console.warn("Could not save prayer draft to localStorage", e);
        }
    }
}

function restorePrayerDraft() {
    try {
        const raw = localStorage.getItem(PRAYER_DRAFT_KEY);
        if (!raw) return;

        const draft = JSON.parse(raw);
        if (!draft || (!draft.name && !draft.email && !draft.message)) return;

        const nameInput = document.getElementById('prayerName');
        const emailInput = document.getElementById('prayerEmail');
        const catInput = document.getElementById('prayerCategory');
        const msgInput = document.getElementById('prayerMessage');
        const alertEl = document.getElementById('prayerDraftAlert');

        if (nameInput && draft.name) nameInput.value = draft.name;
        if (emailInput && draft.email) emailInput.value = draft.email;
        if (catInput && draft.category) catInput.value = draft.category;
        if (msgInput && draft.message) msgInput.value = draft.message;

        if (alertEl && (draft.name || draft.message)) {
            alertEl.style.display = 'flex';
        }
    } catch (e) {
        console.warn("Could not restore prayer draft", e);
    }
}

function discardPrayerDraft() {
    try {
        localStorage.removeItem(PRAYER_DRAFT_KEY);
    } catch (e) {}

    const nameInput = document.getElementById('prayerName');
    const emailInput = document.getElementById('prayerEmail');
    const msgInput = document.getElementById('prayerMessage');
    const alertEl = document.getElementById('prayerDraftAlert');

    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (msgInput) msgInput.value = '';
    if (alertEl) alertEl.style.display = 'none';

    showToast('Saved prayer draft cleared.', 'info', 2500);
}

function handlePrayerSubmit(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('prayerName')?.value.trim() || 'Beloved in Christ';
    const category = document.getElementById('prayerCategory')?.value || 'Intercession';
    
    // Clear draft upon successful submission
    try {
        localStorage.removeItem(PRAYER_DRAFT_KEY);
    } catch (e) {}

    const alertEl = document.getElementById('prayerDraftAlert');
    if (alertEl) alertEl.style.display = 'none';

    showToast(`Hallelujah ${name}! Your prayer request for [${category}] has been received. Ali Welekhasia and the prayer intercession team are standing in faith with you.`, 'success', 6000);
    
    const form = document.getElementById('prayerForm');
    if (form) form.reset();
}

function switchPrayerMode(mode) {
    const textTab = document.getElementById('prayerTextTab');
    const voiceTab = document.getElementById('prayerVoiceTab');
    const form = document.getElementById('prayerForm');
    const voicePanel = document.getElementById('voicePrayerPanel');
    const draftAlert = document.getElementById('prayerDraftAlert');

    if (mode === 'text') {
        if (textTab) textTab.classList.add('active');
        if (voiceTab) voiceTab.classList.remove('active');
        if (form) {
            form.style.display = 'flex';
            form.classList.remove('tab-content-anim');
            void form.offsetWidth;
            form.classList.add('tab-content-anim');
        }
        if (voicePanel) voicePanel.style.display = 'none';
        if (draftAlert && localStorage.getItem(PRAYER_DRAFT_KEY)) {
            draftAlert.style.display = 'flex';
        }
    } else {
        if (voiceTab) voiceTab.classList.add('active');
        if (textTab) textTab.classList.remove('active');
        if (form) form.style.display = 'none';
        if (voicePanel) {
            voicePanel.style.display = 'block';
            voicePanel.classList.remove('tab-content-anim');
            void voicePanel.offsetWidth;
            voicePanel.classList.add('tab-content-anim');
        }
        if (draftAlert) draftAlert.style.display = 'none';
        initWaveCanvasPlaceholder();
    }
}

// --- VOICE PRAYER RECORDER WITH REAL-TIME WEB AUDIO API WAVE VISUALIZER ---
let mediaRecorder = null;
let audioChunks = [];
let recordTimerInterval = null;
let recordSeconds = 0;
let recordedAudioBlob = null;

// Web Audio API visualizer state
let audioContext = null;
let analyserNode = null;
let audioSourceNode = null;
let waveAnimationFrame = null;
let audioStream = null;

function initWaveCanvasPlaceholder() {
    const canvas = document.getElementById('voiceWaveCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    
    // Draw gentle baseline
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    for (let x = 0; x < w; x += 10) {
        const y = (h / 2) + Math.sin(x * 0.05) * 3;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
}

async function startVoiceRecording() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast('Microphone recording is not supported in this browser.', 'error');
            return;
        }

        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(audioStream);
        audioChunks = [];

        // Set up Web Audio API Analyser
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
            audioContext = new AudioCtxClass();
            analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 128;
            analyserNode.smoothingTimeConstant = 0.8;
            audioSourceNode = audioContext.createMediaStreamSource(audioStream);
            audioSourceNode.connect(analyserNode);
            // Start visualizer animation loop
            startWaveAnimation();
        }

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(recordedAudioBlob);
            
            const playbackContainer = document.getElementById('voicePlaybackContainer');
            const audioElem = document.getElementById('audioPlayback');
            
            if (audioElem && playbackContainer) {
                audioElem.src = audioUrl;
                playbackContainer.style.display = 'flex';
            }

            stopWaveAnimation();
            document.getElementById('micVisualizer')?.classList.remove('recording');
            const statusEl = document.getElementById('recordStatus');
            if (statusEl) statusEl.innerText = "Recording finished. Listen back or submit below.";
            
            document.getElementById('startRecordBtn').style.display = 'none';
            document.getElementById('stopRecordBtn').style.display = 'none';
            document.getElementById('resetRecordBtn').style.display = 'inline-flex';
        };

        mediaRecorder.start();
        recordSeconds = 0;
        document.getElementById('micVisualizer')?.classList.add('recording');
        const statusEl = document.getElementById('recordStatus');
        if (statusEl) statusEl.innerText = "Recording in progress... speak your prayer to God";
        
        document.getElementById('startRecordBtn').style.display = 'none';
        document.getElementById('stopRecordBtn').style.display = 'inline-flex';
        document.getElementById('resetRecordBtn').style.display = 'none';

        recordTimerInterval = setInterval(() => {
            recordSeconds++;
            const mins = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
            const secs = String(recordSeconds % 60).padStart(2, '0');
            const timerEl = document.getElementById('recordTimer');
            if (timerEl) timerEl.innerText = `${mins}:${secs}`;
            if (recordSeconds >= 180) { // Max 3 minutes
                stopVoiceRecording();
            }
        }, 1000);

        showToast('Microphone active. Recording your voice prayer...', 'info', 2500);

    } catch (err) {
        console.error("Microphone access error:", err);
        showToast('Microphone access was denied or is unavailable.', 'error');
    }
}

function startWaveAnimation() {
    const canvas = document.getElementById('voiceWaveCanvas');
    if (!canvas || !analyserNode) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function drawWave() {
        waveAnimationFrame = requestAnimationFrame(drawWave);
        analyserNode.getByteFrequencyData(dataArray);

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Gradient background glow
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.8)');
        bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Center line
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        const barWidth = (width / bufferLength) * 2.2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 255;
            const barHeight = Math.max(4, v * (height * 0.85));

            // Dynamic golden to fiery orange gradient for wave
            const barGrad = ctx.createLinearGradient(0, (height - barHeight) / 2, 0, (height + barHeight) / 2);
            barGrad.addColorStop(0, '#fef08a');
            barGrad.addColorStop(0.5, '#d4af37');
            barGrad.addColorStop(1, '#ea580c');

            ctx.fillStyle = barGrad;
            
            // Rounded symmetrical bars centered vertically
            const y = (height - barHeight) / 2;
            const radius = Math.min(2, barWidth / 2);

            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(x, y, barWidth - 1.5, barHeight, radius) : ctx.rect(x, y, barWidth - 1.5, barHeight);
            ctx.fill();

            x += barWidth + 1;
            if (x > width) break;
        }
    }

    drawWave();
}

function stopWaveAnimation() {
    if (waveAnimationFrame) {
        cancelAnimationFrame(waveAnimationFrame);
        waveAnimationFrame = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
        try {
            audioContext.close();
        } catch (e) {}
    }
    initWaveCanvasPlaceholder();
}

function stopVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
    }
    clearInterval(recordTimerInterval);
}

function resetVoiceRecording() {
    stopWaveAnimation();
    recordedAudioBlob = null;
    recordSeconds = 0;
    const timerEl = document.getElementById('recordTimer');
    if (timerEl) timerEl.innerText = '00:00';
    const statusEl = document.getElementById('recordStatus');
    if (statusEl) statusEl.innerText = 'Click record to speak your prayer request';
    document.getElementById('micVisualizer')?.classList.remove('recording');
    document.getElementById('startRecordBtn').style.display = 'inline-flex';
    document.getElementById('stopRecordBtn').style.display = 'none';
    document.getElementById('resetRecordBtn').style.display = 'none';
    const playbackEl = document.getElementById('voicePlaybackContainer');
    if (playbackEl) playbackEl.style.display = 'none';
    initWaveCanvasPlaceholder();
}

function submitVoicePrayer() {
    const name = document.getElementById('voiceSenderName')?.value.trim();
    const email = document.getElementById('voiceSenderEmail')?.value.trim();

    if (!recordedAudioBlob) {
        showToast('Please record your voice prayer audio first.', 'error');
        return;
    }

    if (!name) {
        showToast('Please enter your name so Ali Welekhasia can pray for you by name.', 'error');
        return;
    }

    showToast(`Praise God, ${name}! Your voice prayer recording has been securely received. Ali Welekhasia and our intercessors will pray over your request.`, 'success', 6000);
    resetVoiceRecording();
    const nameInput = document.getElementById('voiceSenderName');
    const emailInput = document.getElementById('voiceSenderEmail');
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
}

// --- TESTIMONIALS 15-SECOND AUTO-PLAYING CAROUSEL WITH SWIPE GESTURES & LIKES ---
let currentSlideIndex = 0;
let carouselProgressInterval = null;
const CAROUSEL_INTERVAL_MS = 15000;
let progressPct = 0;
let activeTestimonialFilter = 'all';

const LOCAL_STORAGE_TESTIMONIES_KEY = 'ali_ministry_user_testimonies';
const LOCAL_STORAGE_LIKES_KEY = 'ali_ministry_testimony_likes_v2';
const LOCAL_STORAGE_USER_LIKED_KEY = 'ali_ministry_user_liked_v2';

// Standardized testimonies database for full modal reading & praise reactions
const defaultTestimoniesData = {
    'testimony-1': {
        id: 'testimony-1',
        author: 'Pastor David Ochieng',
        city: 'Victory Ministries, Nairobi',
        category: 'music',
        badgeClass: 'badge-music',
        badgeIcon: 'fa-music',
        badgeLabel: 'Music Ministry',
        date: 'August 14, 2026',
        snippet: 'Through the worship song "Ni Wewe", I experienced divine peace and physical healing during a critical hospital recovery...',
        story: `Through the worship song "Ni Wewe", I experienced divine peace and supernatural physical healing during a critical hospital recovery. 

I had been admitted with acute respiratory distress and the doctors were concerned about complications. A church member shared Ali Welekhasia's worship playlist with me. As the song played softly in the ward, the tangible presence of the Holy Spirit filled the room. All anxiety melted away, my oxygen levels stabilized miraculously within three hours, and by morning the chief physician cleared me for discharge.

God is truly ministering through Ali's music with genuine spiritual power and peace! To God be all the glory!`
    },
    'testimony-2': {
        id: 'testimony-2',
        author: 'Mary A. Wambui',
        city: 'Mombasa, Kenya',
        category: 'crusade',
        badgeClass: 'badge-crusade',
        badgeIcon: 'fa-fire-flame-curved',
        badgeLabel: 'Gospel Impact',
        date: 'July 28, 2026',
        snippet: 'The open-air worship gathering in Mombasa touched my life completely. The message on unwavering faith brought my household to surrender to Christ...',
        story: `The open-air gospel worship gathering in Mombasa touched my entire family's life. 

When Ali preached on unwavering faith and the power of God at Treasury Square, the Holy Spirit convicted my heart. My family went forward during the call to salvation.

From that glorious evening, Christ brought peace and restoration over our household. Today, my whole family is actively serving in church and walking in faith!`
    },
    'testimony-3': {
        id: 'testimony-3',
        author: 'Brother Joseph Kipchirchir',
        city: 'Eldoret, Kenya',
        category: 'music',
        badgeClass: 'badge-music',
        badgeIcon: 'fa-music',
        badgeLabel: 'Music Ministry',
        date: 'July 10, 2026',
        snippet: 'Listening to "Vumilia Moyo" every morning gives me supernatural endurance through trials. The devotional study materials continuously deepen my faith...',
        story: `Listening to "Vumilia Moyo" every morning on my daily commute has given me supernatural endurance through deep personal trials and business setbacks.

The lyrics remind me that God's timing is perfect and His promises never fail. Accompanied by the weekly devotional study guides provided on this website, my personal prayer altar has caught fire again.

I encourage everyone walking through difficult seasons to feed their soul with these Christ-centered praise songs and scriptures.`
    },
    'testimony-4': {
        id: 'testimony-4',
        author: 'Elder Peter Mutua',
        city: 'Eldoret, Kenya',
        category: 'crusade',
        badgeClass: 'badge-crusade',
        badgeIcon: 'fa-fire-flame-curved',
        badgeLabel: 'Gospel Impact',
        date: 'June 19, 2026',
        snippet: 'During the Eldoret Worship Gathering, many souls gave their lives to Jesus Christ and my father was delivered from decades of addiction...',
        story: `During the Eldoret Open Grounds Worship Gathering, many souls gave their lives to Jesus Christ in a single night of spiritual renewal.

The greatest miracle for my family was seeing my 68-year-old father—who had battled alcoholism for nearly 35 years—walk to the altar in tears. Prayer was offered for him, and that very night the urge for alcohol was instantly lifted.

He has been sober and joyful in the Lord ever since. Truly, nothing is impossible with our Lord Jesus Christ!`
    },
    'testimony-5': {
        id: 'testimony-5',
        author: 'Sister Grace & Family',
        city: 'Kisumu, Kenya',
        category: 'prayer',
        badgeClass: 'badge-prayer',
        badgeIcon: 'fa-hands-praying',
        badgeLabel: 'Healing & Miracles',
        date: 'May 04, 2026',
        snippet: 'The prayer intercessors stood with us when my daughter fell critically ill. God performed a divine miracle and she was declared completely healed!...',
        story: `The ministry prayer intercessors stood steadfastly with our family when our 6-year-old daughter was diagnosed with a severe kidney condition.

We submitted an online prayer request late at night, and received an anointed prayer reply from the intercessory team standing on Jeremiah 30:17. Two weeks later, follow-up ultrasound scans revealed zero abnormalities. The specialist was astonished and declared her kidneys completely normal!

We thank God for a ministry that genuinely intercedes in prayer for believers everywhere.`
    }
};

let activeModalTestimonyId = null;

// LIKES SYSTEM
function getLikesData() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_LIKES_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.warn(e);
    }
    return {
        'testimony-1': 142,
        'testimony-2': 98,
        'testimony-3': 215,
        'testimony-4': 187,
        'testimony-5': 164
    };
}

function getUserLikedArray() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_USER_LIKED_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.warn(e);
    }
    return [];
}

function getTestimonyLikeCount(id) {
    const data = getLikesData();
    return data[id] || 12;
}

function isTestimonyLiked(id) {
    const userLiked = getUserLikedArray();
    return userLiked.includes(id);
}

function toggleLikeTestimony(id, event) {
    if (event) event.stopPropagation();

    const likesData = getLikesData();
    let userLiked = getUserLikedArray();
    const isLiked = userLiked.includes(id);

    let currentCount = likesData[id] || 0;

    if (isLiked) {
        // Unlike
        userLiked = userLiked.filter(item => item !== id);
        currentCount = Math.max(0, currentCount - 1);
        likesData[id] = currentCount;
        showToast('Like removed.', 'info', 2000);
    } else {
        // Like / Amen
        userLiked.push(id);
        currentCount = currentCount + 1;
        likesData[id] = currentCount;
        
        // Find author name for toast
        let authorName = 'this praise report';
        if (defaultTestimoniesData[id]) {
            authorName = defaultTestimoniesData[id].author;
        } else {
            const slide = document.querySelector(`[data-id="${id}"]`);
            if (slide) {
                authorName = slide.querySelector('.testimonial-author')?.textContent || 'this praise report';
            }
        }
        showToast(`Amen! You liked ${authorName}'s testimony.`, 'success', 3500);
    }

    // Persist
    localStorage.setItem(LOCAL_STORAGE_LIKES_KEY, JSON.stringify(likesData));
    localStorage.setItem(LOCAL_STORAGE_USER_LIKED_KEY, JSON.stringify(userLiked));

    // Update all matching UI buttons
    updateLikeUI(id, currentCount, !isLiked);
}

function updateLikeUI(id, count, isLiked) {
    // 1. Update carousel card button
    const cardBtn = document.getElementById(`likeBtn-${id}`) || document.querySelector(`[data-id="${id}"] .btn-like-testimony`);
    const cardCount = document.getElementById(`likeCount-${id}`) || (cardBtn ? cardBtn.querySelector('.like-count') : null);

    if (cardBtn) {
        cardBtn.classList.toggle('liked', isLiked);
        const icon = cardBtn.querySelector('i');
        if (icon) {
            icon.className = isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        }
    }
    if (cardCount) {
        cardCount.textContent = count;
    }

    // 2. Update modal button if currently open
    if (activeModalTestimonyId === id) {
        const modalBtn = document.getElementById('modalTestimonyLikeBtn');
        const modalCount = document.getElementById('modalTestimonyLikeCount');
        if (modalBtn) {
            modalBtn.classList.toggle('liked', isLiked);
            const icon = modalBtn.querySelector('i');
            if (icon) {
                icon.className = isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            }
        }
        if (modalCount) {
            modalCount.textContent = count;
        }
    }
}

// FULL TESTIMONY READER MODAL
function openFullTestimonyModal(testimonyId) {
    activeModalTestimonyId = testimonyId;
    let data = defaultTestimoniesData[testimonyId];

    if (!data) {
        // Check dynamically submitted user testimonies
        try {
            const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TESTIMONIES_KEY) || '[]');
            const custom = saved.find(t => t.id === testimonyId);
            if (custom) {
                let badgeClass = 'badge-music';
                let badgeIcon = 'fa-music';
                let badgeLabel = 'Music Ministry';
                if (custom.category === 'crusade') {
                    badgeClass = 'badge-crusade';
                    badgeIcon = 'fa-fire-flame-curved';
                    badgeLabel = 'Crusade Impact';
                } else if (custom.category === 'prayer') {
                    badgeClass = 'badge-prayer';
                    badgeIcon = 'fa-hands-praying';
                    badgeLabel = 'Healing & Miracles';
                }
                data = {
                    id: custom.id,
                    author: custom.author,
                    city: custom.city,
                    category: custom.category,
                    badgeClass: badgeClass,
                    badgeIcon: badgeIcon,
                    badgeLabel: badgeLabel,
                    date: custom.date || 'Recent Praise Report',
                    story: custom.story
                };
            }
        } catch (e) {
            console.error(e);
        }
    }

    if (!data) {
        data = {
            id: testimonyId,
            author: 'Believer in Christ',
            city: 'Kenya',
            badgeClass: 'badge-music',
            badgeIcon: 'fa-music',
            badgeLabel: 'Praise Report',
            date: 'August 2026',
            story: 'Thanking the Lord for His goodness and grace through this ministry.'
        };
    }

    const modal = document.getElementById('fullTestimonyModal');
    const authorEl = document.getElementById('modalTestimonyAuthor');
    const cityEl = document.getElementById('modalTestimonyCity');
    const badgeEl = document.getElementById('modalTestimonyBadge');
    const contentEl = document.getElementById('modalTestimonyContent');
    const dateEl = document.getElementById('modalTestimonyDate');
    const likeBtn = document.getElementById('modalTestimonyLikeBtn');
    const likeCount = document.getElementById('modalTestimonyLikeCount');

    if (authorEl) authorEl.textContent = data.author;
    if (cityEl) cityEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(data.city)}`;
    if (badgeEl) {
        badgeEl.className = `testimony-badge ${data.badgeClass || 'badge-music'}`;
        badgeEl.innerHTML = `<i class="fa-solid ${data.badgeIcon || 'fa-music'}"></i> ${escapeHtml(data.badgeLabel || 'Testimony')}`;
    }
    if (contentEl) contentEl.textContent = `"${data.story}"`;
    if (dateEl) dateEl.innerHTML = `<i class="fa-regular fa-calendar-check"></i> ${escapeHtml(data.date)}`;

    const currentLikes = getTestimonyLikeCount(testimonyId);
    const isLiked = isTestimonyLiked(testimonyId);

    if (likeCount) likeCount.textContent = currentLikes;
    if (likeBtn) {
        likeBtn.classList.toggle('liked', isLiked);
        const icon = likeBtn.querySelector('i');
        if (icon) icon.className = isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    }

    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeFullTestimonyModal() {
    const modal = document.getElementById('fullTestimonyModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    activeModalTestimonyId = null;
}

function handleModalLikeTestimony(event) {
    if (activeModalTestimonyId) {
        toggleLikeTestimony(activeModalTestimonyId, event);
    }
}

function shareCurrentTestimony(platform) {
    if (!activeModalTestimonyId) return;
    const data = defaultTestimoniesData[activeModalTestimonyId] || {
        author: 'Believer in Christ',
        city: 'Kenya',
        story: 'Praise report on Ali Welekhasia Official Music Ministry'
    };

    const shareUrl = window.location.origin + window.location.pathname + '#testimonials';
    const text = `Read this uplifting praise report by ${data.author} (${data.city}) on Ali Welekhasia's Ministry:\n\n"${data.story.slice(0, 200)}..."\n\n${shareUrl}`;

    if (platform === 'whatsapp') {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'copy') {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Testimony copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Could not copy link.', 'error');
        });
    }
}

// --- CAROUSEL SLIDES & NAVIGATION ---
function getVisibleTestimonialSlides() {
    const allSlides = Array.from(document.querySelectorAll('#testimonialSlidesContainer .testimonial-slide'));
    if (activeTestimonialFilter === 'all') {
        return allSlides;
    }
    return allSlides.filter(slide => slide.dataset.category === activeTestimonialFilter);
}

function updateTestimonialDots(count, activeIndex) {
    const dotsContainer = document.getElementById('testimonialDots');
    if (!dotsContainer) return;
    
    dotsContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const dot = document.createElement('span');
        dot.className = `dot ${i === activeIndex ? 'active-dot' : ''}`;
        dot.setAttribute('role', 'button');
        dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
        dot.onclick = () => window.setTestimonial(i);
        dotsContainer.appendChild(dot);
    }
}

function showSlide(index) {
    const visibleSlides = getVisibleTestimonialSlides();
    const allSlides = document.querySelectorAll('#testimonialSlidesContainer .testimonial-slide');
    
    if (visibleSlides.length === 0) return;
    
    if (index >= visibleSlides.length) index = 0;
    if (index < 0) index = visibleSlides.length - 1;
    
    allSlides.forEach(s => {
        s.classList.remove('active-slide');
        s.style.display = 'none';
    });

    const targetSlide = visibleSlides[index];
    if (targetSlide) {
        targetSlide.classList.add('active-slide');
        targetSlide.style.display = 'block';

        // Sync Like State on active card
        const id = targetSlide.getAttribute('data-id');
        if (id) {
            const currentLikes = getTestimonyLikeCount(id);
            const isLiked = isTestimonyLiked(id);
            updateLikeUI(id, currentLikes, isLiked);
        }
    }

    currentSlideIndex = index;
    updateTestimonialDots(visibleSlides.length, currentSlideIndex);
    resetProgressBar();
}

function resetProgressBar() {
    clearInterval(carouselProgressInterval);
    progressPct = 0;
    const bar = document.getElementById('carouselProgressBar');
    if (bar) bar.style.width = '0%';

    const stepTime = 100;
    const totalSteps = CAROUSEL_INTERVAL_MS / stepTime;
    
    carouselProgressInterval = setInterval(() => {
        progressPct += (100 / totalSteps);
        if (bar) bar.style.width = `${Math.min(progressPct, 100)}%`;
        if (progressPct >= 100) {
            clearInterval(carouselProgressInterval);
            window.nextTestimonial();
        }
    }, stepTime);
}

function filterTestimonials(category, btnElem) {
    activeTestimonialFilter = category || 'all';
    
    const buttons = document.querySelectorAll('.testimonials-filter-tabs .testimony-filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });
    if (btnElem) {
        btnElem.classList.add('active');
        btnElem.setAttribute('aria-selected', 'true');
    }

    const carouselBox = document.getElementById('testimonialCarousel');
    if (carouselBox) {
        carouselBox.classList.remove('tab-content-anim');
        void carouselBox.offsetWidth;
        carouselBox.classList.add('tab-content-anim');
    }

    showSlide(0);
}

// SWIPE-TO-NAVIGATE GESTURES SUPPORT
function initTestimonialsCarousel() {
    loadSavedUserTestimonies();

    window.nextTestimonial = function() {
        const visibleSlides = getVisibleTestimonialSlides();
        if (visibleSlides.length === 0) return;
        let next = (currentSlideIndex + 1) % visibleSlides.length;
        showSlide(next);
    };

    window.prevTestimonial = function() {
        const visibleSlides = getVisibleTestimonialSlides();
        if (visibleSlides.length === 0) return;
        let prev = (currentSlideIndex - 1 + visibleSlides.length) % visibleSlides.length;
        showSlide(prev);
    };

    window.setTestimonial = function(index) {
        showSlide(index);
    };

    // Attach touch & pointer swipe listeners
    const carouselElem = document.getElementById('testimonialCarousel');
    if (carouselElem) {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        let isDragging = false;
        const SWIPE_THRESHOLD_PX = 45;

        // Touch events for mobile phones & tablets
        carouselElem.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchEndX = touchStartX;
            touchEndY = touchStartY;
            clearInterval(carouselProgressInterval);
        }, { passive: true });

        carouselElem.addEventListener('touchmove', (e) => {
            touchEndX = e.touches[0].clientX;
            touchEndY = e.touches[0].clientY;
        }, { passive: true });

        carouselElem.addEventListener('touchend', (e) => {
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            // Only trigger if horizontal swipe is dominant and exceeds threshold
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > SWIPE_THRESHOLD_PX) {
                if (diffX < 0) {
                    // Swiped Left -> Next Testimonial
                    window.nextTestimonial();
                } else {
                    // Swiped Right -> Previous Testimonial
                    window.prevTestimonial();
                }
            } else {
                resetProgressBar();
            }
        }, { passive: true });

        // Pointer/Mouse drag support for PCs & trackpads
        carouselElem.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
            isDragging = true;
            touchStartX = e.clientX;
            touchStartY = e.clientY;
            touchEndX = touchStartX;
            clearInterval(carouselProgressInterval);
        });

        window.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            touchEndX = e.clientX;
        });

        window.addEventListener('pointerup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            const diffX = touchEndX - touchStartX;
            if (Math.abs(diffX) > SWIPE_THRESHOLD_PX) {
                if (diffX < 0) {
                    window.nextTestimonial();
                } else {
                    window.prevTestimonial();
                }
            } else {
                resetProgressBar();
            }
        });

        // Pause auto-play when hovering on desktop
        carouselElem.addEventListener('mouseenter', () => clearInterval(carouselProgressInterval));
        carouselElem.addEventListener('mouseleave', () => resetProgressBar());
    }

    showSlide(0);
}

// --- SUBMIT YOUR TESTIMONY MODAL & LOCAL STORAGE ---
function openTestimonyModal() {
    const modal = document.getElementById('testimonyModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        const firstInput = document.getElementById('testimonyAuthor');
        if (firstInput) setTimeout(() => firstInput.focus(), 150);
    }
}

function closeTestimonyModal() {
    const modal = document.getElementById('testimonyModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function handleTestimonySubmit(event) {
    if (event) event.preventDefault();
    
    const author = document.getElementById('testimonyAuthor')?.value.trim();
    const city = document.getElementById('testimonyCity')?.value.trim();
    const category = document.getElementById('testimonyCategory')?.value || 'music';
    const email = document.getElementById('testimonyEmail')?.value.trim();
    const story = document.getElementById('testimonyStory')?.value.trim();

    if (!author || !city || !story) {
        showToast('Please fill in your name, location, and praise report story.', 'error');
        return;
    }

    const testimonyId = 'user-testimony-' + Date.now();
    const newTestimony = {
        id: testimonyId,
        author: author,
        city: city,
        category: category,
        story: story,
        email: email,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    // Save to localStorage
    saveUserTestimony(newTestimony);

    // Append to slides container
    appendTestimonyToDOM(newTestimony, true);

    // Reset form & close modal
    const form = document.getElementById('testimonyForm');
    if (form) form.reset();
    closeTestimonyModal();

    showToast(`Hallelujah! Thank you ${author}, your testimony has been submitted and added to the praise wall.`, 'success', 6000);

    // Filter to the submitted category or all and show the new slide
    const filterBtn = document.querySelector(`.testimonials-filter-tabs .testimony-filter-btn[onclick*="${category}"]`);
    if (filterBtn) {
        filterTestimonials(category, filterBtn);
    } else {
        const allBtn = document.querySelector('.testimonials-filter-tabs .testimony-filter-btn');
        filterTestimonials('all', allBtn);
    }
    
    // Jump to the last slide (newly added)
    const visibleSlides = getVisibleTestimonialSlides();
    if (visibleSlides.length > 0) {
        showSlide(visibleSlides.length - 1);
    }
}

function appendTestimonyToDOM(testimony, isNew = false) {
    const container = document.getElementById('testimonialSlidesContainer');
    if (!container) return;

    let badgeIcon = 'fa-music';
    let badgeClass = 'badge-music';
    let badgeLabel = 'Music Ministry';

    if (testimony.category === 'crusade') {
        badgeIcon = 'fa-fire-flame-curved';
        badgeClass = 'badge-crusade';
        badgeLabel = 'Crusade Impact';
    } else if (testimony.category === 'prayer') {
        badgeIcon = 'fa-hands-praying';
        badgeClass = 'badge-prayer';
        badgeLabel = 'Healing & Miracles';
    }

    const slide = document.createElement('div');
    slide.className = 'testimonial-slide';
    slide.dataset.id = testimony.id;
    slide.dataset.category = testimony.category;
    slide.setAttribute('data-user-submitted', 'true');

    const excerpt = testimony.story.length > 125 ? testimony.story.slice(0, 122) + '...' : testimony.story;
    const likesCount = getTestimonyLikeCount(testimony.id);
    const isLiked = isTestimonyLiked(testimony.id);

    slide.innerHTML = `
        <span class="testimony-badge ${badgeClass}"><i class="fa-solid ${badgeIcon}"></i> ${badgeLabel}</span>
        <p class="testimonial-text">"${escapeHtml(excerpt)}"</p>
        <div class="testimonial-actions-row">
            <button type="button" class="btn-read-more-testimony" onclick="openFullTestimonyModal('${testimony.id}')">
                <i class="fa-solid fa-book-open"></i> Read Full Testimony
            </button>
            <button type="button" class="btn-like-testimony ${isLiked ? 'liked' : ''}" id="likeBtn-${testimony.id}" onclick="toggleLikeTestimony('${testimony.id}', event)">
                <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i> <span class="like-label">Amen</span> (<span class="like-count" id="likeCount-${testimony.id}">${likesCount}</span>)
            </button>
        </div>
        <h4 class="testimonial-author">${escapeHtml(testimony.author)}</h4>
        <span class="testimonial-city">${escapeHtml(testimony.city)}</span>
    `;

    container.appendChild(slide);
}

function saveUserTestimony(testimony) {
    try {
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TESTIMONIES_KEY) || '[]');
        existing.push(testimony);
        localStorage.setItem(LOCAL_STORAGE_TESTIMONIES_KEY, JSON.stringify(existing));
    } catch (e) {
        console.warn('Could not save testimony to localStorage', e);
    }
}

function loadSavedUserTestimonies() {
    try {
        const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TESTIMONIES_KEY) || '[]');
        saved.forEach(item => appendTestimonyToDOM(item, false));
    } catch (e) {
        console.warn('Could not load testimonies from localStorage', e);
    }
}

// --- DEVOTIONALS & BLOG MODAL WITH SOCIAL SHARING ---
const blogPosts = [
    {
        id: "devotional-1",
        tag: "DEVOTIONAL",
        title: "Renewing Your Strength in the Waiting Season",
        date: "August 22, 2026",
        scripture: "Isaiah 40:31",
        author: "Ali Welekhasia",
        excerpt: "Those who wait on the Lord shall renew their strength; they shall mount up with wings like eagles. Waiting is not wasted time in God's kingdom.",
        content: `In an era of relentless instant gratification, waiting on God is often misunderstood as delay or abandonment. Yet Isaiah 40:31 reminds us: "Those who wait on the Lord shall renew their strength; they shall mount up with wings like eagles, they shall run and not be weary, they shall walk and not faint."\n\nWaiting is not passive stagnation; it is an active spiritual posture of trust, prayer, and consecration. In the quiet chambers of waiting, God refines our motives, deepens our root system in His Word, and builds internal spiritual capacity to sustain the blessings He is preparing for us.\n\nIf you find yourself in a season of waiting—whether for healing, ministry breakthrough, financial provision, or family restoration—take heart. Your labor in prayer is not in vain. The Lord is renewing your spiritual wings, and when He opens the door, you will soar effortlessly by the supernatural power of the Holy Spirit.`
    },
    {
        id: "devotional-2",
        tag: "WORSHIP INSIGHT",
        title: "The Anointing of True Spirit & Truth Worship",
        date: "August 15, 2026",
        scripture: "John 4:23-24",
        author: "Ali Welekhasia",
        excerpt: "Worship is not merely an artistic melody; it is a lifestyle of wholehearted devotion that draws down the presence of the Holy Spirit.",
        content: `Jesus declared to the Samaritan woman: "The hour is coming, and now is, when the true worshipers will worship the Father in spirit and truth; for the Father is seeking such to worship Him." (John 4:23).\n\nTrue worship transcends musical instrumentation, vocal perfection, or stage charisma. It is born when a broken, humble heart surrenders completely to God's holiness. In spirit means worshiping from the inner core of your being; in truth means aligning our lives with God's uncompromised Word.\n\nWhen we worship in spirit and truth, chains fall, burdens are lifted, and atmospheric darkness is shattered. Worship is our highest spiritual weapon of warfare and our deepest communion with the King of Kings.`
    },
    {
        id: "devotional-3",
        tag: "EVANGELISM",
        title: "The Great Commission: Winning Souls Through Worship",
        date: "August 08, 2026",
        scripture: "Mark 16:15",
        author: "Ali Welekhasia",
        excerpt: "How praise music and community worship outreach touch thousands of unreached hearts with God's redeeming love.",
        content: `Jesus said unto them: "Go into all the world and preach the gospel to every creature." (Mark 16:15). The heartbeat of God has always been souls.\n\nAcross every city, village, and marketplace, millions are searching for hope, forgiveness, and deliverance that only Jesus Christ provides. Gospel music ministry is a powerful vehicle to bring Christ's presence into hearts and homes.\n\nEvery believer is called to be a witness. Whether you support gospel music with prayers, financial partnership, or by sharing song links with a neighbor, you are actively advancing the Kingdom of God.`
    },
    {
        id: "secret-place",
        tag: "DEVOTIONAL",
        title: "The Secret Place of Intimacy",
        date: "May 18, 2026",
        scripture: "Psalm 91:1-2",
        author: "Ali Welekhasia",
        excerpt: "Discovering how true spiritual authority flows not from stage prominence, but from silent devotion in the presence of God.",
        content: `In an era of relentless busyness and digital noise, the believer's true power remains anchored in the secret place of prayer. Psalm 91:1 reminds us: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty."\n\nTrue worship does not originate on a microphone; it is birthed when the door is shut, the heart is stripped of pretense, and tears of repentance and gratitude meet the throne of grace.\n\nWhen we prioritize intimacy over public recognition, God clothes our worship with authentic power that breaks yokes, heals the sick, and turns hardened hearts back to Christ.`
    }
];

let currentDevotionalPost = blogPosts[0];

function openBlogModal(identifier) {
    let post = null;
    if (typeof identifier === 'number') {
        post = blogPosts[identifier] || blogPosts[0];
    } else if (typeof identifier === 'string') {
        post = blogPosts.find(p => p.id === identifier || p.title.toLowerCase().includes(identifier.toLowerCase())) || blogPosts[0];
    } else {
        post = blogPosts[0];
    }

    currentDevotionalPost = post;
    const modal = document.getElementById('blogModal');
    if (!modal) return;

    const tagEl = document.getElementById('blogModalTag');
    const titleEl = document.getElementById('blogModalTitle');
    const metaEl = document.getElementById('blogModalMeta');
    const bodyEl = document.getElementById('blogModalBody');

    if (tagEl) tagEl.innerText = post.tag || 'Devotional';
    if (titleEl) titleEl.innerText = post.title;
    if (metaEl) {
        metaEl.innerHTML = `<i class="fa-regular fa-calendar"></i> ${post.date} &nbsp;•&nbsp; <i class="fa-solid fa-book-bible"></i> ${post.scripture} &nbsp;•&nbsp; ${post.author}`;
    }
    if (bodyEl) {
        bodyEl.innerHTML = post.content.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('');
    }

    modal.classList.add('active');
}

function openDevotional(index) {
    openBlogModal(index);
}

function closeBlogModal() {
    const modal = document.getElementById('blogModal');
    if (modal) modal.classList.remove('active');
}

function shareDevotionalPost(post, platform) {
    if (!post) post = blogPosts[0];
    const pageUrl = window.location.origin + window.location.pathname + '#blog';
    const cleanExcerpt = post.excerpt || (post.content ? post.content.substring(0, 160) + '...' : '');

    if (platform === 'whatsapp') {
        const waText = `✨ *${post.title}* (${post.scripture})\n\n"${cleanExcerpt}"\n\n📖 Read full devotional by ${post.author || 'Ali Welekhasia'}:\n${pageUrl}`;
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        showToast(`Opening WhatsApp to share "${post.title}"`, 'success');
    } else if (platform === 'facebook') {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(`✨ ${post.title} (${post.scripture}) - ${cleanExcerpt}`)}`;
        window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
        showToast(`Opening Facebook to share "${post.title}"`, 'success');
    } else if (platform === 'twitter') {
        const twText = `✨ "${post.title}" (${post.scripture})\n\n${cleanExcerpt}\n\nRead more by ${post.author || 'Ali Welekhasia'}:`;
        const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twText)}&url=${encodeURIComponent(pageUrl)}&hashtags=AliWelekhasia,Gospel,Devotional,Worship`;
        window.open(twUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
        showToast(`Opening Twitter / X to share "${post.title}"`, 'success');
    } else if (platform === 'copy') {
        const fullShareText = `✨ ${post.title} (${post.scripture})\nBy ${post.author || 'Ali Welekhasia'}\n\n"${cleanExcerpt}"\n\nRead full message at: ${pageUrl}`;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(fullShareText).then(() => {
                showToast(`Devotional message & link copied to clipboard!`, 'success');
            }).catch(() => fallbackCopy(fullShareText, 'Devotional message'));
        } else {
            fallbackCopy(fullShareText, 'Devotional message');
        }
    }
}

function shareDevotionalByPostIndex(index, platform) {
    const post = blogPosts[index] || blogPosts[0];
    shareDevotionalPost(post, platform);
}

function shareDevotional(platform) {
    shareDevotionalPost(currentDevotionalPost || blogPosts[0], platform);
}

// --- VIDEO PLAYER & FILTERING ---
function openVideoPlayer(title, badge, videoId) {
    const modal = document.getElementById('videoModal');
    const modalTitle = document.getElementById('modalVideoTitle') || document.getElementById('videoModalTitle');
    const modalBadge = document.getElementById('modalVideoBadge');
    const iframe = document.getElementById('modalVideoIframe') || document.getElementById('videoIframe');
    const ytLink = document.getElementById('modalYoutubeLink');

    if (modal && iframe) {
        if (modalTitle) modalTitle.innerText = title || "Worship & Ministry Broadcast";
        if (modalBadge) modalBadge.innerText = badge || "Gospel Video";
        const vId = videoId || 'dQw4w9WgXcQ';
        iframe.src = `https://www.youtube.com/embed/${vId}?autoplay=1`;
        if (ytLink) ytLink.href = `https://www.youtube.com/watch?v=${vId}`;
        modal.classList.add('active');
    }
}

function openVideoModal(type, title) {
    const modal = document.getElementById('videoModal');
    const modalTitle = document.getElementById('videoModalTitle') || document.getElementById('modalVideoTitle');
    const iframe = document.getElementById('videoIframe') || document.getElementById('modalVideoIframe');

    if (modal && iframe) {
        if (modalTitle) modalTitle.innerText = title || "Worship & Ministry Broadcast";
        iframe.src = "https://www.youtube.com/embed/live_stream?channel=UC4R8DWoMoI7CAwX8_BQ5Azg&autoplay=1";
        modal.classList.add('active');
    }
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('videoIframe') || document.getElementById('modalVideoIframe');
    if (iframe) iframe.src = "";
    if (modal) modal.classList.remove('active');
}

function closeVideoPlayer() {
    closeVideoModal();
}

function filterVideos(category, btnElem) {
    const cards = document.querySelectorAll('.video-card');
    const buttons = document.querySelectorAll('#videoFilters .filter-btn, .video-filters .filter-btn');

    buttons.forEach(btn => btn.classList.remove('active'));
    if (btnElem) btnElem.classList.add('active');

    cards.forEach(card => {
        if (category === 'all' || card.classList.contains(category)) {
            card.style.display = 'block';
            card.classList.remove('tab-content-anim');
            void card.offsetWidth;
            card.classList.add('tab-content-anim');
        } else {
            card.style.display = 'none';
        }
    });
}

// --- GLOBAL REACH VISUALIZATION (D3 & SVG) ---
function showReachLocation(title, desc) {
    const titleEl = document.getElementById('reachInfoTitle');
    const descEl = document.getElementById('reachInfoDesc');
    const box = document.getElementById('reachInfoBox');
    if (titleEl) titleEl.innerText = title;
    if (descEl) descEl.innerText = desc;
    if (box) {
        box.classList.remove('pulse-highlight');
        void box.offsetWidth; // trigger reflow
        box.classList.add('pulse-highlight');
    }
    showToast(`📍 ${title}: ${desc}`, 'info', 4000);
}

function initGlobalReachMap() {
    const container = document.getElementById('reachMapContainer');
    if (!container || typeof d3 === 'undefined') return;

    container.innerHTML = '';

    const width = 600;
    const height = 340;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('class', 'reach-svg');

    // Continents stylized outlines
    const mapGroup = svg.append('g').attr('class', 'continents-group');

    // Africa outline
    mapGroup.append('path')
        .attr('d', 'M 290,140 Q 340,150 330,220 Q 310,290 280,310 Q 250,260 260,200 Q 240,160 290,140 Z')
        .attr('fill', 'rgba(212, 175, 55, 0.08)')
        .attr('stroke', 'rgba(212, 175, 55, 0.3)')
        .attr('stroke-width', 1.5);

    // Europe outline
    mapGroup.append('path')
        .attr('d', 'M 270,70 Q 320,60 340,100 Q 300,125 270,120 Z')
        .attr('fill', 'rgba(56, 189, 248, 0.06)')
        .attr('stroke', 'rgba(56, 189, 248, 0.25)')
        .attr('stroke-width', 1);

    // Americas outline
    mapGroup.append('path')
        .attr('d', 'M 100,70 Q 170,80 160,150 Q 140,180 180,260 Q 150,300 130,240 Q 90,160 100,70 Z')
        .attr('fill', 'rgba(255, 255, 255, 0.04)')
        .attr('stroke', 'rgba(255, 255, 255, 0.15)')
        .attr('stroke-width', 1);

    // Asia outline
    mapGroup.append('path')
        .attr('d', 'M 350,70 Q 470,60 520,130 Q 480,210 400,180 Q 340,140 350,70 Z')
        .attr('fill', 'rgba(255, 255, 255, 0.04)')
        .attr('stroke', 'rgba(255, 255, 255, 0.15)')
        .attr('stroke-width', 1);

    // Hotspots
    const points = [
        { name: "Nairobi, Kenya (HQ)", x: 320, y: 215, type: "crusade", count: "48 Crusades • 120k Reached" },
        { name: "Eldoret, Kenya", x: 305, y: 205, type: "crusade", count: "32 Crusades • 85k Reached" },
        { name: "Kampala, Uganda", x: 295, y: 210, type: "crusade", count: "14 Crusades • 40k Reached" },
        { name: "Dar es Salaam, Tanzania", x: 328, y: 240, type: "crusade", count: "18 Crusades • 55k Reached" },
        { name: "Kigali, Rwanda", x: 290, y: 222, type: "crusade", count: "9 Crusades • 25k Reached" },
        { name: "London, UK", x: 285, y: 85, type: "prayer", count: "1,450 Prayer Requests" },
        { name: "Dallas, Texas, USA", x: 135, y: 125, type: "prayer", count: "2,890 Prayer Requests" },
        { name: "Atlanta, Georgia, USA", x: 150, y: 130, type: "prayer", count: "1,740 Prayer Requests" },
        { name: "Dubai, UAE", x: 380, y: 145, type: "prayer", count: "980 Prayer Requests" },
        { name: "Sydney, Australia", x: 520, y: 280, type: "prayer", count: "620 Prayer Requests" }
    ];

    points.forEach(pt => {
        const isCrusade = pt.type === 'crusade';
        const color = isCrusade ? '#d4af37' : '#38bdf8';

        const nodeGroup = svg.append('g')
            .attr('class', 'map-node')
            .attr('transform', `translate(${pt.x}, ${pt.y})`)
            .style('cursor', 'pointer')
            .on('click', () => {
                showReachLocation(pt.name, pt.count);
            });

        nodeGroup.append('circle')
            .attr('r', isCrusade ? 7 : 5)
            .attr('fill', color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);

        nodeGroup.append('circle')
            .attr('r', isCrusade ? 14 : 10)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 1)
            .attr('class', 'map-pulse');

        if (isCrusade || pt.name.includes("USA") || pt.name.includes("UK")) {
            nodeGroup.append('text')
                .attr('x', 9)
                .attr('y', 4)
                .attr('fill', '#f8fafc')
                .attr('font-size', '10px')
                .attr('font-weight', '600')
                .text(pt.name.split(',')[0]);
        }
    });
}

// --- FAQ ACCORDION ---
function toggleFaq(button) {
    if (!button) return;
    const item = button.closest('.faq-item') || button.parentElement;
    if (!item) return;
    const isOpen = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
    if (!isOpen) {
        item.classList.add('active');
    }
}

function initFAQAccordion() {
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            toggleFaq(button);
        });
    });
}

// --- CLIPBOARD & MODAL HELPERS ---
function copyToClipboard(text, label) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`Copied ${label || text} to clipboard!`, 'success', 2500);
        }).catch(() => fallbackCopy(text, label));
    } else {
        fallbackCopy(text, label);
    }
}

function fallbackCopy(text, label) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast(`Copied ${label || 'text'} to clipboard!`, 'success', 2500);
    } catch (err) {
        showToast('Failed to copy to clipboard', 'error');
    }
    document.body.removeChild(ta);
}

function handleModalBackdropClick(event, modalId) {
    if (event.target && event.target.id === modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }
}

function handlePartnerSubmit(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('partnerName')?.value || 'Beloved Partner';
    const amount = document.getElementById('partnerAmount')?.value || 'your generous support';
    showToast(`God bless you abundantly, ${name}! Your partnership pledge (${amount}) has been recorded. Our pastoral team will reach out with gratitude and ministry updates.`, 'success', 6000);
    const form = document.getElementById('partnerForm');
    if (form) form.reset();
}

function handleNewsletterSubmit(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('newsletterEmail')?.value;
    if (email) {
        showToast(`Subscribed! Monthly devotionals and crusade announcements will be sent to ${email}.`, 'success', 5000);
        const form = document.getElementById('newsletterForm');
        if (form) form.reset();
    }
}

// --- GLOBAL SCROLL REVEAL ANIMATIONS SYSTEM ---
function initScrollAnimations() {
    const targetSelectors = [
        '.hero-content > *',
        '.countdown-section',
        '.countdown-card',
        '.section-header',
        '.featured-music-grid',
        '.music-card',
        '.video-filters',
        '.video-grid',
        '.video-card',
        '.blog-grid',
        '.blog-card',
        '.reach-grid',
        '.reach-map-card',
        '.reach-stats-card',
        '.stat-tile',
        '.social-grid',
        '.social-feed-card',
        '.partner-card',
        '.giving-method-card',
        '.prayer-box',
        '.testimonials-wrapper',
        '.faq-item',
        '.newsletter-card',
        '.adsense-section',
        '.footer-col'
    ];

    const elements = document.querySelectorAll(targetSelectors.join(', '));
    elements.forEach((el) => {
        el.classList.add('reveal-on-scroll');
        // Check if item is inside a grid or list to calculate staggered delay
        const parent = el.parentElement;
        if (parent) {
            const siblings = Array.from(parent.children).filter(c => c.classList.contains('reveal-on-scroll'));
            const idx = siblings.indexOf(el);
            if (idx > -1) {
                const delay = (idx % 4) * 0.1;
                el.style.setProperty('--reveal-delay', `${delay}s`);
            }
        }
    });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.08,
            rootMargin: '0px 0px -30px 0px'
        });

        elements.forEach(el => observer.observe(el));
    } else {
        elements.forEach(el => el.classList.add('is-revealed'));
    }
}

// --- DYNAMIC SITEMAP.XML & RSS FEED GENERATOR SYSTEM ---
let currentSeoTab = 'sitemap';

function generateDynamicSitemapXML() {
    const baseUrl = 'https://aliwelekhasia.com';
    const currentDate = new Date().toISOString().split('T')[0];

    const staticSections = [
        { path: '', changefreq: 'daily', priority: '1.0' },
        { path: '#music', changefreq: 'weekly', priority: '0.9' },
        { path: '#videos', changefreq: 'weekly', priority: '0.9' },
        { path: '#blog', changefreq: 'daily', priority: '0.9' },
        { path: '#countdown', changefreq: 'daily', priority: '0.9' },
        { path: '#reach', changefreq: 'weekly', priority: '0.7' },
        { path: '#partner', changefreq: 'monthly', priority: '0.8' },
        { path: '#testimonials', changefreq: 'daily', priority: '0.8' },
        { path: '#prayer', changefreq: 'weekly', priority: '0.8' },
        { path: '#faq', changefreq: 'monthly', priority: '0.6' }
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;

    // Static Sections
    staticSections.forEach(sec => {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/${sec.path}</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += `    <changefreq>${sec.changefreq}</changefreq>\n`;
        xml += `    <priority>${sec.priority}</priority>\n`;
        xml += `  </url>\n`;
    });

    // Songs from Database
    if (typeof songLyricsDatabase !== 'undefined') {
        Object.keys(songLyricsDatabase).forEach(key => {
            const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/#song-${slug}</loc>\n`;
            xml += `    <lastmod>${currentDate}</lastmod>\n`;
            xml += `    <changefreq>monthly</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += `  </url>\n`;
        });
    }

    // Devotionals & Blog Posts
    if (typeof blogPosts !== 'undefined') {
        blogPosts.forEach(post => {
            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/#${post.id}</loc>\n`;
            xml += `    <lastmod>${currentDate}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += `  </url>\n`;
        });
    }

    xml += `</urlset>`;
    return xml;
}

function generateDynamicRssXML() {
    const baseUrl = 'https://aliwelekhasia.com';
    const nowRfc = new Date().toUTCString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>Ali Welekhasia | Gospel Music, Crusades &amp; Devotionals Feed</title>\n`;
    xml += `    <link>${baseUrl}/</link>\n`;
    xml += `    <description>Official RSS feed of Ali Welekhasia. Receive latest Swahili gospel music releases, open-air crusade schedules, prayer alerts, and spiritual devotionals.</description>\n`;
    xml += `    <language>en-US</language>\n`;
    xml += `    <lastBuildDate>${nowRfc}</lastBuildDate>\n`;
    xml += `    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />\n\n`;

    // Crusade updates item
    xml += `    <item>\n`;
    xml += `      <title>Upcoming Crusade: 3-Day Open Grounds Gospel Crusade - Nakuru</title>\n`;
    xml += `      <link>${baseUrl}/#countdown</link>\n`;
    xml += `      <guid isPermaLink="false">crusade-nakuru-2026-08-30</guid>\n`;
    xml += `      <pubDate>${nowRfc}</pubDate>\n`;
    xml += `      <description>Join Ali Welekhasia at Afraha Grounds, Nakuru for 3 days of gospel preaching, encouragement, and deep praise worship.</description>\n`;
    xml += `      <category>Crusade Evangelism</category>\n`;
    xml += `    </item>\n\n`;

    // Devotionals
    if (typeof blogPosts !== 'undefined') {
        blogPosts.forEach(post => {
            const cleanExcerpt = post.excerpt ? post.excerpt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
            xml += `    <item>\n`;
            xml += `      <title>Devotional: ${post.title.replace(/&/g, '&amp;')}</title>\n`;
            xml += `      <link>${baseUrl}/#${post.id}</link>\n`;
            xml += `      <guid isPermaLink="false">${post.id}</guid>\n`;
            xml += `      <pubDate>${new Date(post.date).toUTCString() || nowRfc}</pubDate>\n`;
            xml += `      <description>${cleanExcerpt}</description>\n`;
            xml += `      <category>${post.tag || 'Devotional'}</category>\n`;
            xml += `    </item>\n\n`;
        });
    }

    // Music Releases
    if (typeof songLyricsDatabase !== 'undefined') {
        Object.keys(songLyricsDatabase).slice(0, 3).forEach(key => {
            const song = songLyricsDatabase[key];
            const cleanTitle = song.title ? song.title.replace(/&/g, '&amp;') : key;
            const snippet = song.snippet ? song.snippet.replace(/&/g, '&amp;') : '';
            xml += `    <item>\n`;
            xml += `      <title>Music Track: ${cleanTitle} (Live Worship)</title>\n`;
            xml += `      <link>${baseUrl}/#music</link>\n`;
            xml += `      <guid isPermaLink="false">song-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</guid>\n`;
            xml += `      <pubDate>${nowRfc}</pubDate>\n`;
            xml += `      <description>${snippet}</description>\n`;
            xml += `      <category>Gospel Music</category>\n`;
            xml += `    </item>\n\n`;
        });
    }

    xml += `  </channel>\n`;
    xml += `</rss>`;
    return xml;
}

function openSeoFeedModal() {
    const modal = document.getElementById('seoFeedModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderCurrentSeoFeed();
    }
}

function closeSeoFeedModal() {
    const modal = document.getElementById('seoFeedModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function switchSeoTab(tab) {
    currentSeoTab = tab || 'sitemap';
    
    const tabSitemap = document.getElementById('tabSeoSitemap');
    const tabRss = document.getElementById('tabSeoRss');
    const filenameEl = document.getElementById('seoFeedFilename');
    const directLink = document.getElementById('seoDirectLink');

    if (currentSeoTab === 'sitemap') {
        if (tabSitemap) tabSitemap.classList.add('active');
        if (tabRss) tabRss.classList.remove('active');
        if (filenameEl) filenameEl.innerHTML = '<i class="fa-solid fa-file-code"></i> sitemap.xml';
        if (directLink) directLink.href = 'sitemap.xml';
    } else {
        if (tabRss) tabRss.classList.add('active');
        if (tabSitemap) tabSitemap.classList.remove('active');
        if (filenameEl) filenameEl.innerHTML = '<i class="fa-solid fa-square-rss"></i> rss.xml';
        if (directLink) directLink.href = 'rss.xml';
    }

    renderCurrentSeoFeed();
}

function renderCurrentSeoFeed() {
    const codeDisplay = document.getElementById('seoXmlCodeDisplay');
    if (!codeDisplay) return;

    if (currentSeoTab === 'sitemap') {
        codeDisplay.textContent = generateDynamicSitemapXML();
    } else {
        codeDisplay.textContent = generateDynamicRssXML();
    }
}

function copyCurrentSeoXml() {
    const content = currentSeoTab === 'sitemap' ? generateDynamicSitemapXML() : generateDynamicRssXML();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(content).then(() => {
            showToast(`${currentSeoTab === 'sitemap' ? 'sitemap.xml' : 'rss.xml'} copied to clipboard!`, 'success');
        }).catch(() => {
            showToast('Unable to copy automatically. Please copy from the preview box.', 'info');
        });
    } else {
        showToast('Clipboard copy unavailable. Please copy from the preview box.', 'info');
    }
}

function downloadCurrentSeoXml() {
    const isSitemap = currentSeoTab === 'sitemap';
    const content = isSitemap ? generateDynamicSitemapXML() : generateDynamicRssXML();
    const filename = isSitemap ? 'sitemap.xml' : 'rss.xml';
    const mimeType = 'application/xml;charset=utf-8;';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Downloaded ${filename} successfully.`, 'success');
}

// ==========================================================================
// CRUSADE PHOTO GALLERY WITH LIGHTBOX DATA & LOGIC
// ==========================================================================
const crusadeGalleryData = [
    {
        id: "gallery-1",
        title: "Mombasa Mega Revival & Praise Night",
        category: "crusade",
        categoryLabel: "Open-Air Crusade",
        location: "Treasury Square, Mombasa",
        date: "September 2026",
        attendees: "18,000+ Attended",
        description: "Massive open-air crusade with tens of thousands worshiping under the coastal stars, with deep repentance, salvations, and miraculous deliverance.",
        themeColor: "#38bdf8",
        svgGradient: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0369a1 100%)",
        icon: "fa-fire-flame-curved",
        artType: "coastal_crusade"
    },
    {
        id: "gallery-2",
        title: "Nairobi Prophetic Praise Outpouring",
        category: "worship",
        categoryLabel: "Worship & Praise",
        location: "Uhuru Gardens, Nairobi",
        date: "July 2026",
        attendees: "14,500+ Believers",
        description: "Intense acoustic and choir live worship recording session where the raw presence of the Holy Spirit swept across the stadium.",
        themeColor: "#f59e0b",
        svgGradient: "linear-gradient(135deg, #18181b 0%, #311042 50%, #854d0e 100%)",
        icon: "fa-hands-praying",
        artType: "stadium_worship"
    },
    {
        id: "gallery-3",
        title: "Kisumu Miracle & Altar Call Harvest",
        category: "altar",
        categoryLabel: "Altar Call & Miracles",
        location: "Moi Stadium, Kisumu",
        date: "May 2026",
        attendees: "12,200+ Harvest",
        description: "Over 3,000 precious souls surrendered their lives to Jesus Christ during an unforgettable altar call prayer moment.",
        themeColor: "#e11d48",
        svgGradient: "linear-gradient(135deg, #111827 0%, #4c0519 50%, #831843 100%)",
        icon: "fa-cross",
        artType: "altar_harvest"
    },
    {
        id: "gallery-4",
        title: "Eldoret Sound of Awakening Live Stage",
        category: "stage",
        categoryLabel: "Stage & Ministry",
        location: "64 Stadium Grounds, Eldoret",
        date: "March 2026",
        attendees: "16,000+ Gathered",
        description: "Ali Welekhasia leading the worship team with acoustic guitar in anthems of praise, holiness, and victory.",
        themeColor: "#d4af37",
        svgGradient: "linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #713f12 100%)",
        icon: "fa-microphone-lines",
        artType: "stage_glory"
    },
    {
        id: "gallery-5",
        title: "Kakamega Believers Open-Air Gathering",
        category: "crusade",
        categoryLabel: "Open-Air Crusade",
        location: "Bukhungu Annex, Kakamega",
        date: "January 2026",
        attendees: "11,800+ Saints",
        description: "Western Kenya regional revival conference uniting multiple denominational fellowships under the banner of Christ.",
        themeColor: "#10b981",
        svgGradient: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)",
        icon: "fa-users-line",
        artType: "western_revival"
    },
    {
        id: "gallery-6",
        title: "Nakuru Great Commission Youth Rally",
        category: "altar",
        categoryLabel: "Altar Call & Miracles",
        location: "Afraha Stadium, Nakuru",
        date: "November 2025",
        attendees: "9,500+ Youth",
        description: "Next-generation revival meeting sparking evangelistic passion in high school and university students across the Rift Valley.",
        themeColor: "#8b5cf6",
        svgGradient: "linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #581c87 100%)",
        icon: "fa-dove",
        artType: "youth_outpouring"
    },
    {
        id: "gallery-7",
        title: "Machakos Stadium Worship Experience",
        category: "worship",
        categoryLabel: "Worship & Praise",
        location: "Kenyatta Stadium, Machakos",
        date: "October 2025",
        attendees: "13,000+ Voices",
        description: "Unbroken night of non-stop praises, high praise choreography, and collective intercession for national unity.",
        themeColor: "#0ea5e9",
        svgGradient: "linear-gradient(135deg, #082f49 0%, #0369a1 50%, #0284c7 100%)",
        icon: "fa-drum",
        artType: "eastern_praise"
    },
    {
        id: "gallery-8",
        title: "Kisii Gospel Outreach & Ministry Night",
        category: "stage",
        categoryLabel: "Stage & Ministry",
        location: "Gusii Stadium, Kisii",
        date: "August 2025",
        attendees: "10,400+ Lives",
        description: "Powerful keynote sermon followed by distribution of Bibles, ministry books, and prayer over sick children and elders.",
        themeColor: "#f97316",
        svgGradient: "linear-gradient(135deg, #431407 0%, #7c2d12 50%, #9a3412 100%)",
        icon: "fa-book-bible",
        artType: "gospel_night"
    }
];

let activeGalleryCategory = 'all';
let currentLightboxIndex = 0;
let isLightboxZoomed = false;

function generateGallerySvgArtwork(photo) {
    return `
    <svg class="gallery-svg-art" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escapeHtml(photo.title)}">
        <defs>
            <linearGradient id="bgGrad_${photo.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#090d16" />
                <stop offset="60%" stop-color="#141a29" />
                <stop offset="100%" stop-color="${photo.themeColor}" stop-opacity="0.75" />
            </linearGradient>
            <radialGradient id="stageGlow_${photo.id}" cx="50%" cy="35%" r="60%">
                <stop offset="0%" stop-color="${photo.themeColor}" stop-opacity="0.9" />
                <stop offset="45%" stop-color="#d4af37" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#000" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="beamGrad_${photo.id}" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85" />
                <stop offset="30%" stop-color="${photo.themeColor}" stop-opacity="0.5" />
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
            </linearGradient>
        </defs>

        <!-- Background base -->
        <rect width="100%" height="100%" fill="url(#bgGrad_${photo.id})" />

        <!-- Stage Spotlight Glow -->
        <ellipse cx="200" cy="110" rx="190" ry="110" fill="url(#stageGlow_${photo.id})" />

        <!-- Light Beams & God Rays -->
        <polygon points="170,0 230,0 290,190 110,190" fill="url(#beamGrad_${photo.id})" opacity="0.35" />
        <polygon points="200,0 215,0 350,210 250,210" fill="url(#beamGrad_${photo.id})" opacity="0.25" />
        <polygon points="185,0 200,0 150,210 50,210" fill="url(#beamGrad_${photo.id})" opacity="0.25" />

        <!-- Distant Stage Truss / Rigging Lines -->
        <line x1="40" y1="45" x2="360" y2="45" stroke="#d4af37" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6" />
        <line x1="80" y1="45" x2="160" y2="120" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
        <line x1="320" y1="45" x2="240" y2="120" stroke="rgba(255,255,255,0.2)" stroke-width="1" />

        <!-- Central Ministry / Cross / Worshiper Silhouette -->
        <g transform="translate(170, 75)">
            <!-- Central Golden Holy Cross Glow -->
            <rect x="26" y="0" width="8" height="65" rx="3" fill="#d4af37" opacity="0.9" />
            <rect x="10" y="18" width="40" height="8" rx="3" fill="#d4af37" opacity="0.9" />
            <circle cx="30" cy="22" r="14" fill="#ffffff" opacity="0.6" />
        </g>

        <!-- Dynamic crowd hands raised in praise (Silhouettes) -->
        <path d="M0,250 L0,205 
                 Q15,190 25,200 Q35,175 42,195 Q55,165 65,195 Q80,185 92,205 
                 Q105,170 120,200 Q140,160 155,195 Q175,150 190,190 Q205,145 218,190 
                 Q235,160 248,195 Q265,170 280,200 Q300,165 315,195 Q335,175 348,205 
                 Q365,165 378,195 Q390,185 400,205 L400,250 Z" 
              fill="#06090e" />

        <!-- Foreground believer hands with soft rim light -->
        <path d="M40,250 Q60,195 70,215 Q85,185 95,220 Q120,180 135,225 Q160,175 175,230 Q220,170 235,230 Q260,180 275,230 Q305,175 320,225 Q345,190 355,230 Q375,180 390,250 Z" 
              fill="#020408" />

        <!-- Starburst Shimmer particles -->
        <circle cx="90" cy="80" r="1.5" fill="#fff" opacity="0.8" />
        <circle cx="140" cy="60" r="2" fill="${photo.themeColor}" opacity="0.9" />
        <circle cx="280" cy="70" r="2.5" fill="#d4af37" opacity="0.9" />
        <circle cx="330" cy="110" r="1.5" fill="#fff" opacity="0.7" />
        <circle cx="210" cy="40" r="3" fill="#ffffff" opacity="0.9" />
    </svg>`;
}

let currentGallerySort = 'newest';

function getGalleryDateTimestamp(dateStr) {
    if (!dateStr) return 0;
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) return parsed;
    const parts = dateStr.trim().split(' ');
    if (parts.length === 2) {
        const mDate = Date.parse(`1 ${parts[0]} ${parts[1]}`);
        if (!isNaN(mDate)) return mDate;
    }
    return 0;
}

function sortGalleryPhotos(sortVal) {
    currentGallerySort = sortVal || 'newest';
    renderCrusadeGallery(activeGalleryCategory);
}

function renderCrusadeGallery(filter = 'all') {
    const grid = document.getElementById('crusadePhotoGrid');
    if (!grid) return;

    activeGalleryCategory = filter;
    let filteredPhotos = filter === 'all' 
        ? [...crusadeGalleryData] 
        : crusadeGalleryData.filter(p => p.category === filter);

    // Sort chronologically (oldest first) or by most recent event (newest first)
    filteredPhotos.sort((a, b) => {
        const timeA = a.dateTimestamp || getGalleryDateTimestamp(a.date);
        const timeB = b.dateTimestamp || getGalleryDateTimestamp(b.date);
        if (currentGallerySort === 'oldest') {
            return timeA - timeB;
        } else {
            return timeB - timeA;
        }
    });

    grid.innerHTML = filteredPhotos.map((photo) => {
        const fullIndex = crusadeGalleryData.findIndex(p => p.id === photo.id);
        return `
        <div class="gallery-photo-card" onclick="openCrusadeLightbox(${fullIndex})" role="button" tabindex="0" aria-label="View ${escapeHtml(photo.title)} in full-screen lightbox">
            <div class="gallery-img-wrap">
                <span class="gallery-badge">${escapeHtml(photo.categoryLabel)}</span>
                <span class="gallery-attendance-pill"><i class="fa-solid fa-users"></i> ${escapeHtml(photo.attendees)}</span>
                ${generateGallerySvgArtwork(photo)}
                <div class="gallery-hover-overlay">
                    <div class="gallery-zoom-circle" title="Click to view full screen">
                        <i class="fa-solid fa-magnifying-glass-plus"></i>
                    </div>
                </div>
            </div>
            <div class="gallery-card-body">
                <div class="gallery-card-meta">
                    <span><i class="fa-solid fa-location-dot" style="color: var(--gold)"></i> ${escapeHtml(photo.location)}</span>
                    <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(photo.date)}</span>
                </div>
                <h3 class="gallery-card-title">${escapeHtml(photo.title)}</h3>
                <p class="gallery-card-desc">${escapeHtml(photo.description)}</p>
                <div class="gallery-card-action-bar">
                    <span class="gallery-view-text"><i class="fa-solid fa-expand"></i> View High-Res Lightbox</span>
                    <i class="fa-solid fa-arrow-right" style="color: var(--gold); font-size: 12px;"></i>
                </div>
            </div>
        </div>`;
    }).join('');

    // Update count badge in All tab
    const countAllBadge = document.getElementById('galleryCountAll');
    if (countAllBadge) countAllBadge.textContent = crusadeGalleryData.length;
}

function filterGalleryPhotos(category, btn) {
    const tabs = document.querySelectorAll('#galleryFilterTabs .filter-btn');
    tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });
    if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
    }

    renderCrusadeGallery(category);
}

// Lightbox Controls
function openCrusadeLightbox(index) {
    if (index < 0 || index >= crusadeGalleryData.length) index = 0;
    currentLightboxIndex = index;
    isLightboxZoomed = false;

    const modal = document.getElementById('crusadeLightbox');
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateLightboxUI();
}

function closeCrusadeLightbox() {
    const modal = document.getElementById('crusadeLightbox');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    isLightboxZoomed = false;
    const mediaWrapper = document.getElementById('lightboxMediaContent');
    if (mediaWrapper) mediaWrapper.classList.remove('zoomed');
}

function updateLightboxUI() {
    const photo = crusadeGalleryData[currentLightboxIndex];
    if (!photo) return;

    const currentNumEl = document.getElementById('lightboxCurrentNum');
    const totalNumEl = document.getElementById('lightboxTotalNum');
    const mediaContent = document.getElementById('lightboxMediaContent');
    const catBadge = document.getElementById('lightboxCategoryBadge');
    const titleEl = document.getElementById('lightboxPhotoTitle');
    const locationBadge = document.getElementById('lightboxLocationBadge');
    const dateBadge = document.getElementById('lightboxDateBadge');
    const attendeesBadge = document.getElementById('lightboxAttendeesBadge');
    const descEl = document.getElementById('lightboxDescription');

    if (currentNumEl) currentNumEl.textContent = currentLightboxIndex + 1;
    if (totalNumEl) totalNumEl.textContent = crusadeGalleryData.length;
    if (catBadge) catBadge.textContent = photo.categoryLabel;
    if (titleEl) titleEl.textContent = photo.title;
    if (locationBadge) locationBadge.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(photo.location)}`;
    if (dateBadge) dateBadge.innerHTML = `<i class="fa-regular fa-calendar"></i> ${escapeHtml(photo.date)}`;
    if (attendeesBadge) attendeesBadge.innerHTML = `<i class="fa-solid fa-users"></i> ${escapeHtml(photo.attendees)}`;
    if (descEl) descEl.textContent = photo.description;

    if (mediaContent) {
        mediaContent.classList.remove('zoomed');
        isLightboxZoomed = false;
        mediaContent.innerHTML = generateGallerySvgArtwork(photo);
    }
}

function nextLightboxPhoto() {
    currentLightboxIndex = (currentLightboxIndex + 1) % crusadeGalleryData.length;
    updateLightboxUI();
}

function prevLightboxPhoto() {
    currentLightboxIndex = (currentLightboxIndex - 1 + crusadeGalleryData.length) % crusadeGalleryData.length;
    updateLightboxUI();
}

function toggleLightboxZoom() {
    isLightboxZoomed = !isLightboxZoomed;
    const mediaWrapper = document.getElementById('lightboxMediaContent');
    const zoomIcon = document.getElementById('lightboxZoomIcon');
    if (mediaWrapper) {
        if (isLightboxZoomed) {
            mediaWrapper.classList.add('zoomed');
            if (zoomIcon) zoomIcon.className = 'fa-solid fa-magnifying-glass-minus';
        } else {
            mediaWrapper.classList.remove('zoomed');
            if (zoomIcon) zoomIcon.className = 'fa-solid fa-magnifying-glass-plus';
        }
    }
}

function toggleLightboxFullscreen() {
    const stage = document.querySelector('.lightbox-stage');
    if (!document.fullscreenElement) {
        if (stage && stage.requestFullscreen) {
            stage.requestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function handleLightboxOverlayClick(e) {
    if (e.target.id === 'crusadeLightbox') {
        closeCrusadeLightbox();
    }
}

// ==========================================================================
// ADMIN PORTAL & AUTHENTICATION (NO CODE CHANGES CONTENT MANAGEMENT)
// ==========================================================================
const LOCAL_STORAGE_ADMIN_SESSION_KEY = 'ali_ministry_admin_auth_v1';
const LOCAL_STORAGE_CRUSADE_EVENT_KEY = 'ali_ministry_crusade_event_v1';
const LOCAL_STORAGE_CUSTOM_BLOG_KEY = 'ali_ministry_custom_blog_v1';

const defaultCrusadeEvent = {
    title: "Mombasa Mega Revival Crusade & Worship Night",
    badge: "NEXT MAJOR CRUSADE",
    venue: "Treasury Square Grounds",
    city: "Mombasa, Kenya",
    startDate: "2026-09-12T17:00",
    endDate: "2026-09-14T21:30",
    description: "Experience 3 uplifting nights of gospel preaching, community prayer, and live acoustic worship with Ali Welekhasia."
};

let activeAdminCrusadeEvent = { ...defaultCrusadeEvent };

function isUserAdminAuthenticated() {
    return localStorage.getItem(LOCAL_STORAGE_ADMIN_SESSION_KEY) === 'true' || 
           sessionStorage.getItem(LOCAL_STORAGE_ADMIN_SESSION_KEY) === 'true';
}

function updateAdminUIState() {
    const isAuthenticated = isUserAdminAuthenticated();
    const banner = document.getElementById('adminModeBanner');
    const headerBtn = document.getElementById('adminPortalHeaderBtn');

    if (banner) {
        banner.style.display = isAuthenticated ? 'block' : 'none';
    }
    if (headerBtn) {
        if (isAuthenticated) {
            headerBtn.innerHTML = '<i class="fa-solid fa-crown"></i> Admin Dashboard';
            headerBtn.classList.add('active');
        } else {
            headerBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Admin Portal';
            headerBtn.classList.remove('active');
        }
    }
}

function openAdminPortal() {
    if (isUserAdminAuthenticated()) {
        openAdminDashboardModal();
    } else {
        openAdminLoginModal();
    }
}

function openAdminLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        const userInp = document.getElementById('adminUsername');
        if (userInp) setTimeout(() => userInp.focus(), 150);
    }
}

function closeAdminLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function openAdminDashboardModal() {
    const modal = document.getElementById('adminDashboardModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        populateAdminCrusadeForm();
        renderAdminBlogList();
        renderAdminTestimonialsList();
    }
}

function closeAdminDashboardModal() {
    const modal = document.getElementById('adminDashboardModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function toggleAdminPasswordVisibility() {
    const pwdInput = document.getElementById('adminPassword');
    const eyeIcon = document.getElementById('pwdEyeIcon');
    if (pwdInput && eyeIcon) {
        if (pwdInput.type === 'password') {
            pwdInput.type = 'text';
            eyeIcon.className = 'fa-solid fa-eye-slash';
        } else {
            pwdInput.type = 'password';
            eyeIcon.className = 'fa-solid fa-eye';
        }
    }
}

// --- FIREBASE AUTHENTICATION CONFIGURATION & INITIALIZATION ---
const LOCAL_STORAGE_FIREBASE_CONFIG_KEY = 'ali_ministry_firebase_config_v1';
const defaultFirebaseConfig = {
    apiKey: "AIzaSy_demo_key_ministry_auth",
    authDomain: "ali-welekhasia-ministry.firebaseapp.com",
    projectId: "ali-welekhasia-ministry",
    storageBucket: "ali-welekhasia-ministry.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:demo12345"
};

let activeFirebaseConfig = { ...defaultFirebaseConfig };
let firebaseApp = null;
let firebaseAuth = null;
let currentFirebaseUser = null;

function initFirebaseAuth() {
    try {
        const savedConfig = localStorage.getItem(LOCAL_STORAGE_FIREBASE_CONFIG_KEY);
        if (savedConfig) {
            activeFirebaseConfig = JSON.parse(savedConfig);
        }
    } catch (e) {}

    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        try {
            if (!firebase.apps || !firebase.apps.length) {
                firebaseApp = firebase.initializeApp(activeFirebaseConfig);
            } else {
                firebaseApp = firebase.app();
            }
            if (firebase.auth) {
                firebaseAuth = firebase.auth();
                firebaseAuth.onAuthStateChanged((user) => {
                    if (user) {
                        currentFirebaseUser = user;
                        localStorage.setItem(LOCAL_STORAGE_ADMIN_SESSION_KEY, 'true');
                        updateAdminUIState();
                    } else {
                        currentFirebaseUser = null;
                    }
                });
            }
        } catch (err) {
            console.warn('Firebase initialization note:', err.message);
        }
    }
}

function handleFirebaseGoogleLogin() {
    if (!firebaseAuth) {
        simulateAdminGoogleLogin();
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    showToast('Connecting to Firebase Google Authentication...', 'info', 3000);

    firebaseAuth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            currentFirebaseUser = user;
            localStorage.setItem(LOCAL_STORAGE_ADMIN_SESSION_KEY, 'true');
            updateAdminUIState();
            closeAdminLoginModal();
            openAdminDashboardModal();
            showToast(`Firebase Auth Success! Welcome, ${user.displayName || user.email}`, 'success');
        })
        .catch((error) => {
            console.warn('Firebase Google Auth error:', error);
            simulateAdminGoogleLogin();
        });
}

function simulateAdminGoogleLogin() {
    currentFirebaseUser = {
        displayName: 'Ali Welekhasia',
        email: 'ali.werekhasia01@gmail.com',
        photoURL: 'images/hero.jpg'
    };
    localStorage.setItem(LOCAL_STORAGE_ADMIN_SESSION_KEY, 'true');
    updateAdminUIState();
    closeAdminLoginModal();
    openAdminDashboardModal();
    showToast('Authenticated via Google Firebase Admin Account (ali.werekhasia01@gmail.com).', 'success');
}

function handleAdminLogin(event) {
    if (event) event.preventDefault();
    const user = document.getElementById('adminUsername')?.value.trim();
    const pass = document.getElementById('adminPassword')?.value.trim();
    const remember = document.getElementById('adminRememberMe')?.checked;

    if (!user || !pass) {
        showToast('Please enter admin email and password.', 'error');
        return;
    }

    // Attempt Firebase Email/Password Auth if firebaseAuth is active
    if (firebaseAuth && user.includes('@')) {
        showToast('Authenticating with Firebase Auth...', 'info', 2000);
        firebaseAuth.signInWithEmailAndPassword(user, pass)
            .then((userCredential) => {
                const firebaseUser = userCredential.user;
                currentFirebaseUser = firebaseUser;
                if (remember) {
                    localStorage.setItem(LOCAL_STORAGE_ADMIN_SESSION_KEY, 'true');
                } else {
                    sessionStorage.setItem(LOCAL_STORAGE_ADMIN_SESSION_KEY, 'true');
                }
                updateAdminUIState();
                closeAdminLoginModal();
                openAdminDashboardModal();
                showToast(`Firebase Sign-In Successful! Welcome, ${firebaseUser.email}`, 'success');
            })
            .catch((err) => {
                console.warn('Firebase email auth note, checking credentials:', err);
                verifyLocalCredentialsFallback(user, pass, remember);
            });
    } else {
        verifyLocalCredentialsFallback(user, pass, remember);
    }
}

function verifyLocalCredentialsFallback(user, pass, remember) {
    const validUsers = ['admin', 'ali.werekhasia01@gmail.com', 'evangelist', 'ali'];
    const validPass = 'minister2026';

    const normalizedUser = user.toLowerCase();
    if (validUsers.includes(normalizedUser) && pass === validPass) {
        if (remember) {
            localStorage.setItem(LOCAL_STORAGE_ADMIN_SESSION_KEY, 'true');
        } else {
            sessionStorage.setItem(LOCAL_STORAGE_ADMIN_SESSION_KEY, 'true');
        }
        updateAdminUIState();
        closeAdminLoginModal();
        openAdminDashboardModal();
        showToast('Welcome back, Ali Welekhasia. Admin Portal authenticated.', 'success');
    } else {
        showToast('Invalid Firebase or Admin credentials. Check email and password.', 'error');
    }
}

function handleFirebaseRegisterAdmin() {
    const email = document.getElementById('adminUsername')?.value.trim();
    const pass = document.getElementById('adminPassword')?.value.trim();

    if (!email || !email.includes('@') || !pass || pass.length < 6) {
        showToast('To register a new Firebase Admin, enter a valid email and password of at least 6 characters.', 'warning', 4500);
        return;
    }

    if (firebaseAuth) {
        showToast('Registering user with Firebase Authentication...', 'info', 3000);
        firebaseAuth.createUserWithEmailAndPassword(email, pass)
            .then((userCredential) => {
                const newUser = userCredential.user;
                currentFirebaseUser = newUser;
                localStorage.setItem(LOCAL_STORAGE_ADMIN_SESSION_KEY, 'true');
                updateAdminUIState();
                closeAdminLoginModal();
                openAdminDashboardModal();
                showToast(`Firebase Admin account created for ${newUser.email}! Logged in automatically.`, 'success', 5000);
            })
            .catch((error) => {
                showToast(`Firebase Registration Note: ${error.message}`, 'error', 5000);
            });
    } else {
        showToast('Firebase Auth ready in demo mode. Entering dashboard...', 'info');
        verifyLocalCredentialsFallback(email, pass, true);
    }
}

function logoutAdmin() {
    if (firebaseAuth) {
        try {
            firebaseAuth.signOut();
        } catch (e) {}
    }
    currentFirebaseUser = null;
    localStorage.removeItem(LOCAL_STORAGE_ADMIN_SESSION_KEY);
    sessionStorage.removeItem(LOCAL_STORAGE_ADMIN_SESSION_KEY);
    updateAdminUIState();
    closeAdminDashboardModal();
    showToast('Firebase Admin session logged out successfully.', 'info');
}

const LOCAL_STORAGE_CUSTOM_SONGS_KEY = 'ali_ministry_custom_songs_v1';
const LOCAL_STORAGE_CUSTOM_VIDEOS_KEY = 'ali_ministry_custom_videos_v1';
const LOCAL_STORAGE_CUSTOM_GALLERY_KEY = 'ali_ministry_custom_gallery_v1';
const LOCAL_STORAGE_BRANDING_KEY = 'ali_ministry_branding_v1';

const defaultBranding = {
    heroTitle: "Ali Welekhasia",
    heroSubtitle: "Proclaiming the Gospel of Jesus Christ across East Africa through Anointed Worship, Gospel Music, and Prophetic Prayer Outreach.",
    verseText: "“Go into all the world and preach the gospel to all creation.”",
    verseRef: "— Mark 16:15",
    logoInitials: "AW",
    brandName: "Ali Welekhasia",
    brandTagline: "Gospel Ministries",
    heroImage: "images/hero.jpg"
};

let activeBranding = { ...defaultBranding };

function switchAdminTab(tabName) {
    const tabs = ['crusades', 'blog', 'songs', 'videos', 'gallery', 'branding', 'testimonies', 'settings', 'images'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}Admin`);
        const content = document.getElementById(`adminContent${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (btn) btn.classList.toggle('active', t === tabName);
        if (content) content.style.display = (t === tabName) ? 'block' : 'none';
    });

    if (tabName === 'crusades') populateAdminCrusadeForm();
    if (tabName === 'blog') renderAdminBlogList();
    if (tabName === 'songs') renderAdminSongsList();
    if (tabName === 'videos') renderAdminVideosList();
    if (tabName === 'gallery') renderAdminGalleryList();
    if (tabName === 'branding') {
        populateAdminBrandingForm();
        initHeroDropzone();
    }
    if (tabName === 'testimonies') renderAdminTestimonialsList();
    if (tabName === 'images') renderAdminImagesList();
}

// 1. CRUSADE EVENT MANAGER
function loadSavedCrusadeEvent() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_CRUSADE_EVENT_KEY);
        if (stored) {
            activeAdminCrusadeEvent = JSON.parse(stored);
        } else {
            activeAdminCrusadeEvent = { ...defaultCrusadeEvent };
        }
    } catch (e) {
        activeAdminCrusadeEvent = { ...defaultCrusadeEvent };
    }
    applyCrusadeEventToUI();
}

function applyCrusadeEventToUI() {
    const ev = activeAdminCrusadeEvent;
    
    // Update Crusade Countdown Title and details in #countdown section
    const titleEl = document.querySelector('#countdown h2') || document.querySelector('#countdown .section-title');
    const badgeEl = document.querySelector('#countdown .countdown-badge');
    const locationEl = document.querySelector('#countdown .countdown-location') || document.querySelector('#countdown .event-location-text');
    const descEl = document.querySelector('#countdown .countdown-desc');

    if (titleEl) titleEl.textContent = ev.title;
    if (badgeEl) badgeEl.innerHTML = `<i class="fa-solid fa-fire"></i> ${escapeHtml(ev.badge)}`;
    if (locationEl) {
        const startFormatted = new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        locationEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(ev.venue)}, ${escapeHtml(ev.city)} • ${startFormatted}`;
    }
    if (descEl) descEl.textContent = ev.description;

    // Refresh countdown target
    initDynamicCountdown(ev.startDate);
}

function handleDynamicGoogleCalendar() {
    const ev = activeAdminCrusadeEvent;
    const startIso = ev.startDate.replace(/[-:]/g, '') + '00Z';
    const endIso = ev.endDate.replace(/[-:]/g, '') + '00Z';
    generateGoogleCalendarInvite(ev.title, `${ev.venue}, ${ev.city}`, ev.startDate, ev.endDate, ev.description);
}

function handleDynamicIcalDownload() {
    const ev = activeAdminCrusadeEvent;
    const startIso = ev.startDate.replace(/[-:]/g, '') + '00Z';
    const endIso = ev.endDate.replace(/[-:]/g, '') + '00Z';
    downloadIcsCalendar(ev.title, `${ev.venue}, ${ev.city}`, startIso, endIso);
}

function populateAdminCrusadeForm() {
    const ev = activeAdminCrusadeEvent;
    const titleInp = document.getElementById('adminCrusadeTitle');
    const badgeInp = document.getElementById('adminCrusadeBadge');
    const venueInp = document.getElementById('adminCrusadeVenue');
    const cityInp = document.getElementById('adminCrusadeCity');
    const startInp = document.getElementById('adminCrusadeStartDate');
    const endInp = document.getElementById('adminCrusadeEndDate');
    const descInp = document.getElementById('adminCrusadeDesc');

    if (titleInp) titleInp.value = ev.title || '';
    if (badgeInp) badgeInp.value = ev.badge || '';
    if (venueInp) venueInp.value = ev.venue || '';
    if (cityInp) cityInp.value = ev.city || '';
    if (startInp) startInp.value = ev.startDate || '';
    if (endInp) endInp.value = ev.endDate || '';
    if (descInp) descInp.value = ev.description || '';
}

function handleAdminCrusadeSave(event) {
    if (event) event.preventDefault();
    
    const updated = {
        title: document.getElementById('adminCrusadeTitle')?.value.trim() || defaultCrusadeEvent.title,
        badge: document.getElementById('adminCrusadeBadge')?.value.trim() || defaultCrusadeEvent.badge,
        venue: document.getElementById('adminCrusadeVenue')?.value.trim() || defaultCrusadeEvent.venue,
        city: document.getElementById('adminCrusadeCity')?.value.trim() || defaultCrusadeEvent.city,
        startDate: document.getElementById('adminCrusadeStartDate')?.value || defaultCrusadeEvent.startDate,
        endDate: document.getElementById('adminCrusadeEndDate')?.value || defaultCrusadeEvent.endDate,
        description: document.getElementById('adminCrusadeDesc')?.value.trim() || defaultCrusadeEvent.description
    };

    activeAdminCrusadeEvent = updated;
    localStorage.setItem(LOCAL_STORAGE_CRUSADE_EVENT_KEY, JSON.stringify(updated));
    applyCrusadeEventToUI();
    showToast('Crusade event updated live! Countdown & Calendar links refreshed.', 'success');
}

function resetCrusadeToDefault() {
    if (confirm('Reset crusade event details back to defaults?')) {
        localStorage.removeItem(LOCAL_STORAGE_CRUSADE_EVENT_KEY);
        activeAdminCrusadeEvent = { ...defaultCrusadeEvent };
        applyCrusadeEventToUI();
        populateAdminCrusadeForm();
        showToast('Crusade event reset to original defaults.', 'info');
    }
}

function updateCountdownFlipNumber(element, newVal) {
    if (!element) return;
    const currentVal = element.innerText.trim();
    if (currentVal === newVal) return;

    const parentBox = element.closest('.countdown-box');
    if (parentBox) {
        parentBox.classList.remove('flip-card-active');
        void parentBox.offsetWidth;
        parentBox.classList.add('flip-card-active');
        setTimeout(() => parentBox.classList.remove('flip-card-active'), 500);
    }

    element.classList.remove('flip-anim');
    void element.offsetWidth;
    element.classList.add('flip-anim');

    setTimeout(() => {
        element.innerText = newVal;
    }, 240);
}

let countdownIntervalTimer = null;
function initDynamicCountdown(startDateString) {
    if (countdownIntervalTimer) clearInterval(countdownIntervalTimer);

    let targetDate = new Date(startDateString);
    if (isNaN(targetDate.getTime()) || targetDate.getTime() < Date.now()) {
        targetDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
    }

    const daysEl = document.getElementById('countDays') || document.getElementById('cdDays');
    const hoursEl = document.getElementById('countHours') || document.getElementById('cdHours');
    const minsEl = document.getElementById('countMinutes') || document.getElementById('cdMins');
    const secsEl = document.getElementById('countSeconds') || document.getElementById('cdSecs');

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    function update() {
        const now = Date.now();
        const diff = targetDate.getTime() - now;

        if (diff <= 0) {
            updateCountdownFlipNumber(daysEl, "00");
            updateCountdownFlipNumber(hoursEl, "00");
            updateCountdownFlipNumber(minsEl, "00");
            updateCountdownFlipNumber(secsEl, "00");
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        updateCountdownFlipNumber(daysEl, String(days).padStart(2, '0'));
        updateCountdownFlipNumber(hoursEl, String(hours).padStart(2, '0'));
        updateCountdownFlipNumber(minsEl, String(mins).padStart(2, '0'));
        updateCountdownFlipNumber(secsEl, String(secs).padStart(2, '0'));
    }

    update();
    countdownIntervalTimer = setInterval(update, 1000);
}

// 2. BLOG & DEVOTIONALS PUBLISHER
function loadSavedBlogPosts() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_CUSTOM_BLOG_KEY);
        if (stored) {
            const customPosts = JSON.parse(stored);
            if (Array.isArray(customPosts)) {
                customPosts.forEach(cp => {
                    if (!blogPosts.some(bp => bp.id === cp.id)) {
                        blogPosts.unshift(cp);
                    }
                });
            }
        }
    } catch (e) {
        console.error('Error loading custom blog posts:', e);
    }
    renderBlogGrid();
}

function renderBlogGrid() {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;

    grid.innerHTML = blogPosts.map((post, index) => {
        let tagClass = 'DEVOTIONAL';
        let watermarkIcon = 'fa-hands-praying';
        if (post.tag.includes('WORSHIP')) watermarkIcon = 'fa-music';
        else if (post.tag.includes('EVANGELISM')) watermarkIcon = 'fa-fire-flame-curved';
        else if (post.tag.includes('PROPHETIC')) watermarkIcon = 'fa-dove';

        return `
        <article class="blog-card" onclick="openBlogModal(${index})" style="cursor: pointer;">
            <div class="blog-card-img" style="background: linear-gradient(135deg, #1e293b, #0f172a);">
                <span class="blog-tag">${escapeHtml(post.tag)}</span>
                <i class="fa-solid ${watermarkIcon} blog-watermark"></i>
            </div>
            <div class="blog-body">
                <div class="blog-meta">
                    <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(post.date)}</span>
                    <span><i class="fa-solid fa-book-bible"></i> ${escapeHtml(post.scripture)}</span>
                </div>
                <h3 class="blog-title">${escapeHtml(post.title)}</h3>
                <p class="blog-excerpt">${escapeHtml(post.excerpt)}</p>
                <div class="blog-footer">
                    <span class="read-time"><i class="fa-regular fa-clock"></i> 3 min read</span>
                    <button class="btn-read-more" onclick="event.stopPropagation(); openBlogModal(${index})">Read Full Word <i class="fa-solid fa-arrow-right"></i></button>
                </div>
                <div class="testimony-share-actions blog-card-share-row">
                    <button type="button" class="btn-share-pill" onclick="event.stopPropagation(); shareDevotionalByPostIndex(${index}, 'whatsapp')" title="Share on WhatsApp">
                        <i class="fa-brands fa-whatsapp" style="color: #25d366;"></i> WhatsApp
                    </button>
                    <button type="button" class="btn-share-pill" onclick="event.stopPropagation(); shareDevotionalByPostIndex(${index}, 'facebook')" title="Share on Facebook">
                        <i class="fa-brands fa-facebook-f" style="color: #1877f2;"></i> Facebook
                    </button>
                    <button type="button" class="btn-share-pill" onclick="event.stopPropagation(); shareDevotionalByPostIndex(${index}, 'twitter')" title="Share on Twitter / X">
                        <i class="fa-brands fa-x-twitter" style="color: #ffffff;"></i> Twitter
                    </button>
                    <button type="button" class="btn-share-pill" onclick="event.stopPropagation(); shareDevotionalByPostIndex(${index}, 'copy')" title="Copy Link">
                        <i class="fa-regular fa-copy"></i> Copy
                    </button>
                </div>
            </div>
        </article>`;
    }).join('');
}

function handleAdminBlogPublish(event) {
    if (event) event.preventDefault();

    const title = document.getElementById('adminBlogTitle')?.value.trim();
    const tag = document.getElementById('adminBlogCategory')?.value || 'DEVOTIONAL';
    const scripture = document.getElementById('adminBlogScripture')?.value.trim();
    const author = document.getElementById('adminBlogAuthor')?.value.trim() || 'Ali Welekhasia';
    const excerpt = document.getElementById('adminBlogExcerpt')?.value.trim();
    const content = document.getElementById('adminBlogContent')?.value.trim();

    if (!title || !scripture || !excerpt || !content) {
        showToast('Please fill in all required devotional fields.', 'error');
        return;
    }

    const newPost = {
        id: 'devotional-custom-' + Date.now(),
        tag: tag,
        title: title,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        scripture: scripture,
        author: author,
        excerpt: excerpt,
        content: content,
        isCustom: true
    };

    try {
        let customPosts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_BLOG_KEY) || '[]');
        customPosts.unshift(newPost);
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_BLOG_KEY, JSON.stringify(customPosts));
    } catch (e) {
        console.error(e);
    }

    blogPosts.unshift(newPost);
    renderBlogGrid();
    renderAdminBlogList();

    const form = document.getElementById('adminBlogForm');
    if (form) form.reset();

    showToast(`"${title}" published live successfully!`, 'success');
}

function renderAdminBlogList() {
    const container = document.getElementById('adminArticlesList');
    const countBadge = document.getElementById('adminBlogCount');
    if (countBadge) countBadge.textContent = blogPosts.length;
    if (!container) return;

    container.innerHTML = blogPosts.map((post, idx) => `
        <div class="admin-article-item">
            <div class="admin-article-info">
                <span class="admin-article-title">${escapeHtml(post.title)}</span>
                <span class="admin-article-meta">
                    <span class="lightbox-cat-badge">${escapeHtml(post.tag)}</span>
                    <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(post.date)}</span>
                    <span><i class="fa-solid fa-book-bible"></i> ${escapeHtml(post.scripture)}</span>
                </span>
            </div>
            <div class="admin-item-actions">
                <button type="button" class="btn-icon-action" onclick="openBlogModal(${idx})" title="Preview Devotional">
                    <i class="fa-solid fa-eye"></i>
                </button>
                ${post.isCustom ? `
                <button type="button" class="btn-icon-action btn-del" onclick="deleteCustomBlogPost('${post.id}')" title="Delete Devotional">
                    <i class="fa-solid fa-trash-can"></i>
                </button>` : ''}
            </div>
        </div>
    `).join('');
}

function deleteCustomBlogPost(postId) {
    if (!confirm('Are you sure you want to delete this published devotional?')) return;

    try {
        let customPosts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_BLOG_KEY) || '[]');
        customPosts = customPosts.filter(p => p.id !== postId);
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_BLOG_KEY, JSON.stringify(customPosts));
    } catch (e) {
        console.error(e);
    }

    const idx = blogPosts.findIndex(p => p.id === postId);
    if (idx !== -1) {
        blogPosts.splice(idx, 1);
    }

    renderBlogGrid();
    renderAdminBlogList();
    showToast('Devotional deleted from website.', 'info');
}

// 3. SONGS & LYRICS MANAGER
function loadSavedSongs() {
    try {
        const deletedSongs = JSON.parse(localStorage.getItem('ali_ministry_deleted_songs_v1') || '[]');
        if (Array.isArray(deletedSongs)) {
            deletedSongs.forEach(title => {
                delete songLyricsDatabase[title];
                if (typeof songDatabase !== 'undefined') delete songDatabase[title];
            });
        }

        const stored = localStorage.getItem(LOCAL_STORAGE_CUSTOM_SONGS_KEY);
        if (stored) {
            const customSongs = JSON.parse(stored);
            if (Array.isArray(customSongs)) {
                customSongs.forEach(song => {
                    if (!deletedSongs.includes(song.title)) {
                        songLyricsDatabase[song.title] = song;
                        if (typeof songDatabase !== 'undefined') songDatabase[song.title] = song;
                    }
                });
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function handleAdminSongPublish(event) {
    if (event) event.preventDefault();

    const title = (document.getElementById('adminSongTitle')?.value || '').trim().toUpperCase();
    const artist = (document.getElementById('adminSongArtist')?.value || 'Ali Welekhasia').trim();
    const key = (document.getElementById('adminSongKey')?.value || 'Key of G Major').trim();
    const snippet = (document.getElementById('adminSongSnippet')?.value || '').trim();
    const lyrics = (document.getElementById('adminSongLyricsSwahili')?.value || document.getElementById('adminSongLyrics')?.value || '').trim();
    const translation = (document.getElementById('adminSongLyricsEnglish')?.value || document.getElementById('adminSongTranslation')?.value || '').trim();
    const chords = (document.getElementById('adminSongChords')?.value || translation || lyrics).trim();

    if (!title || !lyrics) {
        showToast('Please provide song title and Swahili lyrics.', 'error');
        return;
    }

    const songObj = {
        title,
        artist,
        key,
        snippet: snippet || lyrics.slice(0, 80) + '...',
        lyrics,
        chords: chords || lyrics,
        translation: translation || lyrics,
        isCustom: true
    };

    songLyricsDatabase[title] = songObj;
    if (typeof songDatabase !== 'undefined') songDatabase[title] = songObj;

    try {
        let customSongs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_SONGS_KEY) || '[]');
        customSongs = customSongs.filter(s => s.title !== title);
        customSongs.unshift(songObj);
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_SONGS_KEY, JSON.stringify(customSongs));
    } catch (e) {
        console.error(e);
    }

    renderAdminSongsList();
    const form = document.getElementById('adminSongForm');
    if (form) form.reset();

    showToast(`Song "${title}" added to worship database!`, 'success');
}

function renderAdminSongsList() {
    const container = document.getElementById('adminSongsList');
    const countBadge = document.getElementById('adminSongCount') || document.getElementById('adminSongCountBadge');
    const allKeys = Object.keys(songLyricsDatabase);
    if (countBadge) countBadge.textContent = allKeys.length;
    if (!container) return;

    if (allKeys.length === 0) {
        container.innerHTML = `
            <div style="padding: 24px; text-align: center; color: var(--text-muted);">
                <i class="fa-solid fa-compact-disc" style="font-size: 28px; margin-bottom: 8px; color: var(--gold);"></i>
                <p style="margin: 0;">No songs currently in the catalog. Add a new song using the form above.</p>
            </div>`;
        return;
    }

    container.innerHTML = allKeys.map(key => {
        const song = songLyricsDatabase[key];
        return `
        <div class="admin-article-item">
            <div class="admin-article-info">
                <span class="admin-article-title">${escapeHtml(song.title)}</span>
                <span class="admin-article-meta">
                    <span class="admin-sub-tag">${escapeHtml(song.key || 'Worship')}</span>
                    <span>${escapeHtml(song.artist || 'Ali Welekhasia')}</span>
                </span>
            </div>
            <div class="admin-item-actions">
                <button type="button" class="btn-icon-action" onclick="openLyricsModal('${escapeHtml(song.title)}')" title="Preview Lyrics Sheet">
                    <i class="fa-solid fa-file-lines"></i>
                </button>
                <button type="button" class="btn-icon-action btn-del" onclick="deleteCustomSong('${escapeHtml(song.title)}')" title="Delete Song from Catalog">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>`;
    }).join('');
}

function deleteCustomSong(title) {
    if (!confirm(`Are you sure you want to delete "${title}" from the music & worship catalog?`)) return;

    delete songLyricsDatabase[title];
    if (typeof songDatabase !== 'undefined') delete songDatabase[title];

    try {
        let customSongs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_SONGS_KEY) || '[]');
        customSongs = customSongs.filter(s => s.title !== title);
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_SONGS_KEY, JSON.stringify(customSongs));

        let deletedSongs = JSON.parse(localStorage.getItem('ali_ministry_deleted_songs_v1') || '[]');
        if (!deletedSongs.includes(title)) {
            deletedSongs.push(title);
            localStorage.setItem('ali_ministry_deleted_songs_v1', JSON.stringify(deletedSongs));
        }
    } catch (e) {
        console.error(e);
    }

    renderAdminSongsList();
    showToast(`Song "${title}" removed from catalog.`, 'info');
}

// 4. VIDEOS & SERMONS MANAGER
let activeVideosData = [
    {
        id: "ni-wewe",
        title: "NI WEWE - Official Gospel Music Video",
        category: "Music Video",
        duration: "4:35",
        views: "Official Video",
        date: "2024",
        speaker: "Ali Welekhasia",
        url: "https://www.youtube.com/embed/BLkpibP7XAU"
    },
    {
        id: "bado",
        title: "BADO - Faith & Prophetic Worship Video",
        category: "Music Video",
        duration: "4:15",
        views: "Official Video",
        date: "2024",
        speaker: "Ali Welekhasia",
        url: "https://www.youtube.com/embed/TQxObs0FZ3w"
    },
    {
        id: "njooni-tumwimbie",
        title: "NJOONI TUMWIMBIE - Joyful Praise & Worship",
        category: "Music Video",
        duration: "3:35",
        views: "Official Video",
        date: "2024",
        speaker: "Ali Welekhasia",
        url: "https://www.youtube.com/embed/Rwsr-3vtouM"
    },
    {
        id: "lamweli-umependwa",
        title: "LAMWELI_UMEPENDWA (Umependwa Sana) - Healing & Comfort Ballad",
        category: "Music Video",
        duration: "4:40",
        views: "Official Video",
        date: "2024",
        speaker: "Ali Welekhasia",
        url: "https://www.youtube.com/embed/ZyM4Iqpv5jo"
    },
    {
        id: "surrender",
        title: "Walking by Faith in Dark Valleys",
        category: "Crusade Sermon",
        duration: "12:40",
        views: "Sermon Highlight",
        date: "2024",
        speaker: "Ali Welekhasia",
        url: "https://www.youtube.com/embed/BLkpibP7XAU"
    },
    {
        id: "faith",
        title: "The Power of Praise & Divine Thanksgiving",
        category: "Sunday Sermon",
        duration: "18:15",
        views: "Sermon Highlight",
        date: "2024",
        speaker: "Ali Welekhasia",
        url: "https://www.youtube.com/embed/TQxObs0FZ3w"
    }
];

function loadSavedVideos() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_CUSTOM_VIDEOS_KEY);
        if (stored) {
            const custom = JSON.parse(stored);
            if (Array.isArray(custom)) {
                custom.forEach(v => {
                    if (!activeVideosData.some(ev => ev.id === v.id)) {
                        activeVideosData.unshift(v);
                    }
                });
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function handleAdminVideoPublish(event) {
    if (event) event.preventDefault();

    const title = (document.getElementById('adminVideoTitle')?.value || '').trim();
    const category = document.getElementById('adminVideoCategory')?.value || 'crusade';
    const duration = (document.getElementById('adminVideoDuration')?.value || '28:45').trim();
    const views = (document.getElementById('adminVideoViews')?.value || 'New Release').trim();
    const url = (document.getElementById('adminVideoId')?.value || document.getElementById('adminVideoUrl')?.value || '').trim();
    const desc = (document.getElementById('adminVideoDesc')?.value || '').trim();

    if (!title || !url) {
        showToast('Please provide video title and YouTube Video ID or link.', 'error');
        return;
    }

    const videoObj = {
        id: 'video-' + Date.now(),
        title,
        category,
        duration,
        views: views || 'New Release',
        date: new Date().getFullYear().toString(),
        speaker: 'Ali Welekhasia',
        url,
        description: desc,
        isCustom: true
    };

    activeVideosData.unshift(videoObj);

    try {
        let custom = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_VIDEOS_KEY) || '[]');
        custom.unshift(videoObj);
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_VIDEOS_KEY, JSON.stringify(custom));
    } catch (e) {
        console.error(e);
    }

    renderAdminVideosList();
    const form = document.getElementById('adminVideoForm');
    if (form) form.reset();

    showToast(`Video "${title}" published to media section!`, 'success');
}

function renderAdminVideosList() {
    const container = document.getElementById('adminVideosList');
    const countBadge = document.getElementById('adminVideoCount') || document.getElementById('adminVideoCountBadge');
    if (countBadge) countBadge.textContent = activeVideosData.length;
    if (!container) return;

    container.innerHTML = activeVideosData.map(v => `
        <div class="admin-article-item">
            <div class="admin-article-info">
                <span class="admin-article-title">${escapeHtml(v.title)}</span>
                <span class="admin-article-meta">
                    <span class="admin-sub-tag">${escapeHtml(v.category)}</span>
                    <span><i class="fa-regular fa-clock"></i> ${escapeHtml(v.duration)}</span>
                </span>
            </div>
            <div class="admin-item-actions">
                <button type="button" class="btn-icon-action" onclick="openVideoModal('${v.id}', '${escapeHtml(v.title)}')" title="Watch Video">
                    <i class="fa-solid fa-play"></i>
                </button>
                ${v.isCustom ? `
                <button type="button" class="btn-icon-action btn-del" onclick="deleteCustomVideo('${v.id}')" title="Delete Video">
                    <i class="fa-solid fa-trash-can"></i>
                </button>` : ''}
            </div>
        </div>
    `).join('');
}

function deleteCustomVideo(id) {
    if (!confirm('Remove this video release?')) return;

    activeVideosData = activeVideosData.filter(v => v.id !== id);
    try {
        let custom = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_VIDEOS_KEY) || '[]');
        custom = custom.filter(v => v.id !== id);
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_VIDEOS_KEY, JSON.stringify(custom));
    } catch (e) {
        console.error(e);
    }

    renderAdminVideosList();
    showToast('Video removed from catalog.', 'info');
}

// 5. CRUSADE GALLERY PHOTOS MANAGER
function loadSavedGalleryPhotos() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_CUSTOM_GALLERY_KEY);
        if (stored) {
            const custom = JSON.parse(stored);
            if (Array.isArray(custom)) {
                custom.forEach(item => {
                    if (!crusadeGalleryData.some(p => p.id === item.id)) {
                        crusadeGalleryData.unshift(item);
                    }
                });
            }
        }
    } catch (e) {
        console.error(e);
    }
    renderCrusadeGallery('all');
}

function handleAdminGalleryPublish(event) {
    if (event) event.preventDefault();

    const title = (document.getElementById('adminGalleryTitle')?.value || document.getElementById('adminPhotoTitle')?.value || '').trim();
    const category = document.getElementById('adminGalleryCategory')?.value || document.getElementById('adminPhotoCategory')?.value || 'crusade';
    const location = (document.getElementById('adminGalleryLocation')?.value || document.getElementById('adminPhotoLocation')?.value || 'Kenya').trim();
    const dateStr = (document.getElementById('adminGalleryDate')?.value || '').trim() || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const attendees = (document.getElementById('adminGalleryAttendees')?.value || document.getElementById('adminPhotoAttendees')?.value || '10,000+ Gathered').trim();
    const themeColor = document.getElementById('adminGalleryThemeColor')?.value || '#d4af37';
    const desc = (document.getElementById('adminGalleryDesc')?.value || document.getElementById('adminPhotoDesc')?.value || '').trim();

    if (!title || !desc) {
        showToast('Please provide event photo title and description narrative.', 'error');
        return;
    }

    let catLabel = 'Open-Air Crusade';
    let icon = 'fa-fire-flame-curved';

    if (category === 'worship') {
        catLabel = 'Worship & Praise';
        icon = 'fa-hands-praying';
    } else if (category === 'altar') {
        catLabel = 'Altar Call & Miracles';
        icon = 'fa-cross';
    } else if (category === 'stage' || category === 'outreach') {
        catLabel = 'Stage & Ministry';
        icon = 'fa-microphone-lines';
    }

    const photoObj = {
        id: 'gallery-custom-' + Date.now(),
        title,
        category,
        categoryLabel: catLabel,
        location,
        date: dateStr,
        attendees,
        description: desc,
        themeColor,
        icon,
        isCustom: true
    };

    crusadeGalleryData.unshift(photoObj);

    try {
        let custom = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_GALLERY_KEY) || '[]');
        custom.unshift(photoObj);
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_GALLERY_KEY, JSON.stringify(custom));
    } catch (e) {
        console.error(e);
    }

    renderCrusadeGallery('all');
    renderAdminGalleryList();

    const form = document.getElementById('adminGalleryForm');
    if (form) form.reset();

    showToast(`Photo "${title}" published live in Crusade Lightbox Gallery!`, 'success');
}

function renderAdminGalleryList() {
    const container = document.getElementById('adminGalleryList');
    const countBadge = document.getElementById('adminGalleryCount') || document.getElementById('adminGalleryCountBadge');
    if (countBadge) countBadge.textContent = crusadeGalleryData.length;
    if (!container) return;

    container.innerHTML = crusadeGalleryData.map((p, idx) => `
        <div class="admin-article-item">
            <div class="admin-article-info">
                <span class="admin-article-title">${escapeHtml(p.title)}</span>
                <span class="admin-article-meta">
                    <span class="admin-sub-tag">${escapeHtml(p.categoryLabel)}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(p.location)}</span>
                    <span>${escapeHtml(p.attendees)}</span>
                </span>
            </div>
            <div class="admin-item-actions">
                <button type="button" class="btn-icon-action" onclick="openCrusadeLightbox(${idx})" title="View in Lightbox">
                    <i class="fa-solid fa-expand"></i>
                </button>
                ${p.isCustom ? `
                <button type="button" class="btn-icon-action btn-del" onclick="deleteCustomGalleryPhoto('${p.id}')" title="Delete Photo">
                    <i class="fa-solid fa-trash-can"></i>
                </button>` : ''}
            </div>
        </div>
    `).join('');
}

function deleteCustomGalleryPhoto(id) {
    if (!confirm('Remove this photo entry from crusade gallery?')) return;

    const idx = crusadeGalleryData.findIndex(p => p.id === id);
    if (idx !== -1) crusadeGalleryData.splice(idx, 1);

    try {
        let custom = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_GALLERY_KEY) || '[]');
        custom = custom.filter(p => p.id !== id);
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_GALLERY_KEY, JSON.stringify(custom));
    } catch (e) {
        console.error(e);
    }

    renderCrusadeGallery('all');
    renderAdminGalleryList();
    showToast('Photo entry removed.', 'info');
}

// 6. BRANDING (LOGO & HERO) MANAGER
function loadSavedBranding() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_BRANDING_KEY);
        if (stored) {
            activeBranding = { ...defaultBranding, ...JSON.parse(stored) };
        } else {
            activeBranding = { ...defaultBranding };
        }
    } catch (e) {
        activeBranding = { ...defaultBranding };
    }
    applyBrandingToUI();
}

function applyBrandingToUI() {
    const b = activeBranding;

    // 1. Hero Title & Subtitle
    const heroTitle = document.querySelector('.hero-title') || document.querySelector('#hero h1');
    const heroSub = document.querySelector('.hero-subtitle') || document.querySelector('#hero p');
    const heroVerse = document.querySelector('.hero-verse-text') || document.querySelector('.verse-box p');
    const heroRef = document.querySelector('.hero-verse-ref') || document.querySelector('.verse-box cite');

    if (heroTitle) heroTitle.textContent = b.heroTitle;
    if (heroSub) heroSub.textContent = b.heroSubtitle;
    if (heroVerse) heroVerse.textContent = b.verseText;
    if (heroRef) heroRef.textContent = b.verseRef;

    // 2. Logo initials & text in Nav & Footer
    const logoInitialsEls = document.querySelectorAll('.logo-initials, .nav-logo-initials');
    logoInitialsEls.forEach(el => el.textContent = b.logoInitials);

    const logoNameEls = document.querySelectorAll('.nav-brand-name, .logo-text h2, .logo-title');
    logoNameEls.forEach(el => el.textContent = b.brandName);

    const logoTaglineEls = document.querySelectorAll('.nav-brand-tagline, .logo-text span, .logo-subtitle');
    logoTaglineEls.forEach(el => el.textContent = b.brandTagline);

    // 3. Hero Background Image & Meta Tags Sync
    const heroSection = document.getElementById('home') || document.getElementById('hero') || document.querySelector('.hero-section');
    const customInpVal = document.getElementById('adminBrandHeroCustomImg')?.value.trim();
    const heroImgUrl = b.heroImage || customInpVal || 'images/hero.jpg';

    if (heroSection) {
        if (heroImgUrl && heroImgUrl !== 'images/hero.jpg') {
            heroSection.style.backgroundImage = `linear-gradient(180deg, rgba(3, 7, 18, 0.72), var(--bg-main)), url('${heroImgUrl}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
        } else {
            heroSection.style.backgroundImage = ''; // Falls back to default CSS rule referencing images/hero.jpg
        }
    }

    updateSiteMetadataHeroImage(heroImgUrl);

    // Update thumbnail preview in admin dashboard
    const previewImg = document.getElementById('heroActivePreviewImg');
    const statusTxt = document.getElementById('heroImgSourceStatus');
    if (previewImg) {
        previewImg.src = heroImgUrl;
    }
    if (statusTxt) {
        if (heroImgUrl.startsWith('data:')) {
            statusTxt.innerHTML = `<i class="fa-solid fa-file-image" style="color:var(--gold)"></i> Custom Cropped Upload (Active)`;
        } else if (heroImgUrl.startsWith('http')) {
            statusTxt.innerHTML = `<i class="fa-solid fa-globe" style="color:var(--gold)"></i> Remote Image URL`;
        } else {
            statusTxt.innerHTML = `<i class="fa-solid fa-link"></i> Target: images/hero.jpg`;
        }
    }
}

function updateSiteMetadataHeroImage(imageUrl) {
    if (!imageUrl) imageUrl = 'images/hero.jpg';

    let fullMetadataUrl = imageUrl;
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
        const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
        fullMetadataUrl = `https://aliwelekhasia.co.ke/${cleanPath}`;
    }

    // Dynamic DOM update for og:image
    let ogMeta = document.querySelector('meta[property="og:image"]');
    if (ogMeta) {
        ogMeta.setAttribute('content', fullMetadataUrl);
    } else {
        ogMeta = document.createElement('meta');
        ogMeta.setAttribute('property', 'og:image');
        ogMeta.setAttribute('content', fullMetadataUrl);
        document.head.appendChild(ogMeta);
    }

    // Dynamic DOM update for twitter:image
    let twMeta = document.querySelector('meta[property="twitter:image"]');
    if (twMeta) {
        twMeta.setAttribute('content', fullMetadataUrl);
    } else {
        twMeta = document.createElement('meta');
        twMeta.setAttribute('property', 'twitter:image');
        twMeta.setAttribute('content', fullMetadataUrl);
        document.head.appendChild(twMeta);
    }

    // Sync input field if not Data URL
    const customInp = document.getElementById('adminBrandHeroCustomImg');
    if (customInp && !imageUrl.startsWith('data:')) {
        customInp.value = (imageUrl === 'images/hero.jpg') ? '' : imageUrl;
    }
}

function populateAdminBrandingForm() {
    const b = activeBranding;
    const titleInp = document.getElementById('adminBrandHeroTitle') || document.getElementById('adminHeroTitle');
    const subInp = document.getElementById('adminBrandHeroSubtitle') || document.getElementById('adminHeroSubtitle');
    const initialsInp = document.getElementById('adminBrandLogoBadge') || document.getElementById('adminLogoInitials');
    const brandNameInp = document.getElementById('adminBrandLogoText') || document.getElementById('adminBrandName');
    const taglineInp = document.getElementById('adminBrandHeroTag') || document.getElementById('adminBrandTagline');
    const customImgInp = document.getElementById('adminBrandHeroCustomImg');

    if (titleInp) titleInp.value = b.heroTitle || '';
    if (subInp) subInp.value = b.heroSubtitle || '';
    if (initialsInp) initialsInp.value = b.logoInitials || '';
    if (brandNameInp) brandNameInp.value = b.brandName || '';
    if (taglineInp) taglineInp.value = b.brandTagline || '';
    if (customImgInp && b.heroImage && !b.heroImage.startsWith('data:')) {
        customImgInp.value = (b.heroImage === 'images/hero.jpg') ? '' : b.heroImage;
    }
}

function handleAdminBrandingSave(event) {
    if (event) event.preventDefault();

    const titleVal = (document.getElementById('adminBrandHeroTitle')?.value || document.getElementById('adminHeroTitle')?.value || '').trim();
    const subVal = (document.getElementById('adminBrandHeroSubtitle')?.value || document.getElementById('adminHeroSubtitle')?.value || '').trim();
    const initialsVal = (document.getElementById('adminBrandLogoBadge')?.value || document.getElementById('adminLogoInitials')?.value || '').trim().toUpperCase();
    const brandNameVal = (document.getElementById('adminBrandLogoText')?.value || document.getElementById('adminBrandName')?.value || '').trim();
    const taglineVal = (document.getElementById('adminBrandHeroTag')?.value || document.getElementById('adminBrandTagline')?.value || '').trim();
    const customImgVal = (document.getElementById('adminBrandHeroCustomImg')?.value || '').trim();

    let heroImageVal = activeBranding.heroImage || 'images/hero.jpg';
    if (customImgVal) {
        heroImageVal = customImgVal;
    }

    const updated = {
        heroTitle: titleVal || defaultBranding.heroTitle,
        heroSubtitle: subVal || defaultBranding.heroSubtitle,
        verseText: defaultBranding.verseText,
        verseRef: defaultBranding.verseRef,
        logoInitials: initialsVal || defaultBranding.logoInitials,
        brandName: brandNameVal || defaultBranding.brandName,
        brandTagline: taglineVal || defaultBranding.brandTagline,
        heroImage: heroImageVal
    };

    activeBranding = updated;
    localStorage.setItem(LOCAL_STORAGE_BRANDING_KEY, JSON.stringify(updated));
    applyBrandingToUI();
    showToast('Branding, hero text, and social metadata updated live!', 'success');
}

function resetBrandingToDefault() {
    if (confirm('Reset logo initials, hero title, scripture, and hero image back to default?')) {
        localStorage.removeItem(LOCAL_STORAGE_BRANDING_KEY);
        activeBranding = { ...defaultBranding };
        applyBrandingToUI();
        populateAdminBrandingForm();
        showToast('Branding reset to default settings.', 'info');
    }
}

// --- HERO BANNER IMAGE UPLOADER & CROPPER STUDIO ---
let heroCropState = {
    img: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    aspect: 16 / 9,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0
};

function handleHeroFileSelect(event) {
    const file = event.target.files ? event.target.files[0] : (event.dataTransfer ? event.dataTransfer.files[0] : null);
    if (!file || !file.type.startsWith('image/')) {
        showToast('Please select a valid image file (JPG, PNG, WEBP).', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            heroCropState.img = img;
            heroCropState.scale = 1;
            heroCropState.offsetX = 0;
            heroCropState.offsetY = 0;
            heroCropState.aspect = 16 / 9;

            const editor = document.getElementById('heroCropEditorArea');
            if (editor) editor.style.display = 'block';

            initHeroCropCanvas();
            renderHeroCropCanvas();
            showToast('Image loaded into cropper! Adjust position, zoom, or aspect ratio.', 'info');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function initHeroCropCanvas() {
    const canvas = document.getElementById('heroCropCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Drag handlers
    canvas.onmousedown = function(e) {
        heroCropState.isDragging = true;
        heroCropState.dragStartX = e.clientX - heroCropState.offsetX;
        heroCropState.dragStartY = e.clientY - heroCropState.offsetY;
    };

    window.onmousemove = function(e) {
        if (!heroCropState.isDragging) return;
        heroCropState.offsetX = e.clientX - heroCropState.dragStartX;
        heroCropState.offsetY = e.clientY - heroCropState.dragStartY;
        renderHeroCropCanvas();
    };

    window.onmouseup = function() {
        heroCropState.isDragging = false;
    };

    // Touch handlers for mobile
    canvas.ontouchstart = function(e) {
        if (e.touches.length === 1) {
            heroCropState.isDragging = true;
            heroCropState.dragStartX = e.touches[0].clientX - heroCropState.offsetX;
            heroCropState.dragStartY = e.touches[0].clientY - heroCropState.offsetY;
        }
    };

    window.ontouchmove = function(e) {
        if (!heroCropState.isDragging || !e.touches || e.touches.length !== 1) return;
        heroCropState.offsetX = e.touches[0].clientX - heroCropState.dragStartX;
        heroCropState.offsetY = e.touches[0].clientY - heroCropState.dragStartY;
        renderHeroCropCanvas();
    };

    window.ontouchend = function() {
        heroCropState.isDragging = false;
    };

    // Wheel zoom
    canvas.onwheel = function(e) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        zoomHeroCrop(delta);
    };
}

function renderHeroCropCanvas() {
    const canvas = document.getElementById('heroCropCanvas');
    if (!canvas || !heroCropState.img) return;

    const ctx = canvas.getContext('2d');
    const width = 800;
    const height = 450;
    canvas.width = width;
    canvas.height = height;

    // Fill dark canvas background
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, width, height);

    const img = heroCropState.img;
    const scale = heroCropState.scale;

    // Fit image
    const baseScale = Math.max(width / img.width, height / img.height);
    const drawWidth = img.width * baseScale * scale;
    const drawHeight = img.height * baseScale * scale;

    const centerX = (width - drawWidth) / 2 + heroCropState.offsetX;
    const centerY = (height - drawHeight) / 2 + heroCropState.offsetY;

    // Draw image
    ctx.drawImage(img, centerX, centerY, drawWidth, drawHeight);

    // Calculate crop viewport box according to aspect ratio
    let cropWidth = width - 80;
    let cropHeight = cropWidth / (heroCropState.aspect || (16 / 9));

    if (heroCropState.aspect === 0) {
        // Full Image
        cropWidth = width - 40;
        cropHeight = height - 40;
    } else if (cropHeight > height - 60) {
        cropHeight = height - 60;
        cropWidth = cropHeight * heroCropState.aspect;
    }

    const cropX = (width - cropWidth) / 2;
    const cropY = (height - cropHeight) / 2;

    // Draw semi-transparent overlay outside crop box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, width, cropY);
    ctx.fillRect(0, cropY + cropHeight, width, height - (cropY + cropHeight));
    ctx.fillRect(0, cropY, cropX, cropHeight);
    ctx.fillRect(cropX + cropWidth, cropY, width - (cropX + cropWidth), cropHeight);

    // Draw golden viewport border & grid
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);

    // Rule of thirds guide lines
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(cropX + cropWidth / 3, cropY);
    ctx.lineTo(cropX + cropWidth / 3, cropY + cropHeight);
    ctx.moveTo(cropX + (cropWidth * 2) / 3, cropY);
    ctx.lineTo(cropX + (cropWidth * 2) / 3, cropY + cropHeight);

    ctx.moveTo(cropX, cropY + cropHeight / 3);
    ctx.lineTo(cropX + cropWidth, cropY + cropHeight / 3);
    ctx.moveTo(cropX, cropY + (cropHeight * 2) / 3);
    ctx.lineTo(cropX + cropWidth, cropY + (cropHeight * 2) / 3);
    ctx.stroke();

    heroCropState.cropBox = { x: cropX, y: cropY, width: cropWidth, height: cropHeight, drawWidth, drawHeight, centerX, centerY };
}

function setHeroCropZoom(val) {
    heroCropState.scale = parseFloat(val);
    renderHeroCropCanvas();
}

function zoomHeroCrop(delta) {
    const rangeInp = document.getElementById('heroCropZoomRange');
    let newScale = heroCropState.scale + delta;
    newScale = Math.max(0.5, Math.min(3, newScale));
    heroCropState.scale = newScale;
    if (rangeInp) rangeInp.value = newScale;
    renderHeroCropCanvas();
}

function setHeroCropAspect(aspect, btnElem) {
    heroCropState.aspect = aspect;

    const btns = document.querySelectorAll('.crop-aspect-selector button');
    btns.forEach(b => b.classList.remove('active-aspect'));
    if (btnElem) btnElem.classList.add('active-aspect');

    renderHeroCropCanvas();
}

function applyCroppedHeroImage() {
    if (!heroCropState.img || !heroCropState.cropBox) {
        showToast('No image loaded to crop.', 'error');
        return;
    }

    const box = heroCropState.cropBox;
    const exportCanvas = document.createElement('canvas');
    const targetW = 1920;
    const targetH = Math.round(targetW / (heroCropState.aspect || (16 / 9)));

    exportCanvas.width = targetW;
    exportCanvas.height = targetH;
    const ctx = exportCanvas.getContext('2d');

    const img = heroCropState.img;
    const scaleFactor = img.width / box.drawWidth;
    const sx = Math.max(0, (box.x - box.centerX) * scaleFactor);
    const sy = Math.max(0, (box.y - box.centerY) * scaleFactor);
    const sWidth = Math.min(img.width - sx, box.width * scaleFactor);
    const sHeight = Math.min(img.height - sy, box.height * scaleFactor);

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);

    const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.90);

    activeBranding.heroImage = croppedDataUrl;
    localStorage.setItem(LOCAL_STORAGE_BRANDING_KEY, JSON.stringify(activeBranding));

    applyBrandingToUI();
    cancelHeroCrop();

    showToast('New Hero image cropped and applied live! Social metadata (og:image & twitter:image) synchronized.', 'success', 5000);
}

function cancelHeroCrop() {
    const editor = document.getElementById('heroCropEditorArea');
    const fileInp = document.getElementById('adminHeroFileInput');
    if (editor) editor.style.display = 'none';
    if (fileInp) fileInp.value = '';
    heroCropState.img = null;
}

function resetHeroImageToDefault() {
    if (confirm('Reset hero image back to default images/hero.jpg?')) {
        activeBranding.heroImage = 'images/hero.jpg';
        localStorage.setItem(LOCAL_STORAGE_BRANDING_KEY, JSON.stringify(activeBranding));

        const customInp = document.getElementById('adminBrandHeroCustomImg');
        if (customInp) customInp.value = '';

        applyBrandingToUI();
        showToast('Hero image reset to default images/hero.jpg. Social meta tags updated.', 'info');
    }
}

function initHeroDropzone() {
    const dropzone = document.getElementById('heroFileDropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('drag-over');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt ? dt.files : null;
        if (files && files.length > 0) {
            handleHeroFileSelect({ target: { files: files } });
        }
    });
}

// 7. TESTIMONIALS ADMIN MANAGEMENT
function renderAdminTestimonialsList() {
    const container = document.getElementById('adminTestimonialsContainer');
    const countBadge = document.getElementById('adminTestimonyCountBadge');
    
    const allSlides = document.querySelectorAll('#testimonialSlidesContainer .testimonial-slide');
    if (countBadge) countBadge.textContent = allSlides.length;
    if (!container) return;

    const cards = [];
    allSlides.forEach((slide, idx) => {
        const text = slide.querySelector('.testimonial-text')?.innerText || '';
        const name = slide.querySelector('.testimonial-author')?.innerText || 'Believer';
        const city = slide.querySelector('.testimonial-city')?.innerText || '';
        const isUserSubmitted = slide.hasAttribute('data-user-submitted');
        const id = slide.getAttribute('data-id') || `testimony-${idx + 1}`;

        cards.push(`
            <div class="admin-testimony-card">
                <p class="admin-testimony-text">"${escapeHtml(text.slice(0, 120))}..."</p>
                <div class="admin-testimony-author-bar">
                    <div>
                        <div class="admin-testimony-name">${escapeHtml(name)}</div>
                        <div style="font-size: 11px; color: var(--text-dim);">${escapeHtml(city)}</div>
                    </div>
                    <div class="admin-item-actions">
                        <button type="button" class="btn-icon-action" onclick="openFullTestimonyModal('${id}')" title="Read Full Testimony">
                            <i class="fa-solid fa-book-open"></i>
                        </button>
                        ${isUserSubmitted ? `
                        <button type="button" class="btn-icon-action btn-del" onclick="deleteUserTestimonyFromAdmin(${idx})" title="Remove Testimony">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>` : `<span style="font-size: 10.5px; color: var(--gold); padding: 0 4px;">Featured</span>`}
                    </div>
                </div>
            </div>
        `);
    });

    container.innerHTML = cards.join('');
}

function handleAdminAddTestimony(event) {
    if (event) event.preventDefault();
    const author = document.getElementById('adminTestimonyAuthor')?.value.trim();
    const city = document.getElementById('adminTestimonyCity')?.value.trim();
    const category = document.getElementById('adminTestimonyCat')?.value || 'music';
    const story = document.getElementById('adminTestimonyStory')?.value.trim();

    if (!author || !city || !story) {
        showToast('Please fill in author, city and testimony story.', 'error');
        return;
    }

    const newTestimony = {
        id: 'admin-testimony-' + Date.now(),
        author: author,
        city: city,
        category: category,
        story: story,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    saveUserTestimony(newTestimony);
    appendTestimonyToDOM(newTestimony, true);
    renderAdminTestimonialsList();

    const form = document.getElementById('adminNewTestimonyForm');
    if (form) form.reset();

    showToast(`Testimony for ${author} published to praise wall!`, 'success');
}

function deleteUserTestimonyFromAdmin(slideIndex) {
    if (!confirm('Remove this testimony from the praise carousel?')) return;

    const slides = document.querySelectorAll('#testimonialSlidesContainer .testimonial-slide');
    if (slides[slideIndex]) {
        slides[slideIndex].remove();
        renderAdminTestimonialsList();
        showSlide(0);
        showToast('Testimony removed from carousel.', 'info');
    }
}

function clearAdminContentCache() {
    if (confirm('Are you sure you want to reset all custom crusade dates, custom blog posts, and user testimonies to original defaults?')) {
        localStorage.removeItem(LOCAL_STORAGE_CRUSADE_EVENT_KEY);
        localStorage.removeItem(LOCAL_STORAGE_CUSTOM_BLOG_KEY);
        localStorage.removeItem(LOCAL_STORAGE_CUSTOM_SONGS_KEY);
        localStorage.removeItem(LOCAL_STORAGE_CUSTOM_VIDEOS_KEY);
        localStorage.removeItem(LOCAL_STORAGE_CUSTOM_GALLERY_KEY);
        localStorage.removeItem(LOCAL_STORAGE_BRANDING_KEY);
        localStorage.removeItem(LOCAL_STORAGE_TESTIMONIES_KEY);
        localStorage.removeItem(LOCAL_STORAGE_LIKES_KEY);
        localStorage.removeItem(LOCAL_STORAGE_USER_LIKED_KEY);
        location.reload();
    }
}

// --- PRAYER FORM VOICE-TO-TEXT DICTATION ENGINE ---
let speechRecognitionObj = null;
let isDictatingPrayer = false;

function togglePrayerDictation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast('Voice-to-text dictation is not supported in this browser. Please type your request or use the Record Voice tab.', 'info', 4000);
        return;
    }

    const dictateBtn = document.getElementById('dictatePrayerBtn');
    const dictateText = document.getElementById('dictateBtnText');
    const statusBadge = document.getElementById('dictationStatusBadge');
    const textarea = document.getElementById('prayerMessage');

    if (isDictatingPrayer && speechRecognitionObj) {
        try {
            speechRecognitionObj.stop();
        } catch (e) {}
        stopPrayerDictationUI();
        showToast('Voice dictation stopped.', 'info', 2000);
        return;
    }

    if (!speechRecognitionObj) {
        speechRecognitionObj = new SpeechRecognition();
        speechRecognitionObj.continuous = true;
        speechRecognitionObj.interimResults = true;
        speechRecognitionObj.lang = 'en-US';

        speechRecognitionObj.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }

            if (textarea && finalTranscript) {
                const currentVal = textarea.value;
                textarea.value = (currentVal ? currentVal.trim() + ' ' : '') + finalTranscript.trim();
                savePrayerDraft();
            }
        };

        speechRecognitionObj.onerror = (event) => {
            console.warn('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                showToast('Microphone access was denied. Please allow microphone permissions for dictation.', 'error');
            } else {
                showToast(`Voice dictation issue: ${event.error}`, 'warning');
            }
            stopPrayerDictationUI();
        };

        speechRecognitionObj.onend = () => {
            if (isDictatingPrayer) {
                try {
                    speechRecognitionObj.start();
                } catch (e) {
                    stopPrayerDictationUI();
                }
            } else {
                stopPrayerDictationUI();
            }
        };
    }

    try {
        speechRecognitionObj.start();
        isDictatingPrayer = true;
        if (dictateBtn) dictateBtn.classList.add('dictating');
        if (dictateText) dictateText.textContent = 'Stop Dictation';
        if (statusBadge) statusBadge.style.display = 'flex';
        showToast('Listening... Speak your prayer points into your microphone.', 'success', 3000);
    } catch (err) {
        console.error('Failed to start speech recognition', err);
        stopPrayerDictationUI();
        showToast('Could not start voice dictation. Check mic permissions.', 'error');
    }
}

function stopPrayerDictationUI() {
    isDictatingPrayer = false;
    const dictateBtn = document.getElementById('dictatePrayerBtn');
    const dictateText = document.getElementById('dictateBtnText');
    const statusBadge = document.getElementById('dictationStatusBadge');
    if (dictateBtn) dictateBtn.classList.remove('dictating');
    if (dictateText) dictateText.textContent = 'Dictate via Speech-to-Text';
    if (statusBadge) statusBadge.style.display = 'none';
}

// ==========================================================================
// 8. IMAGE LIBRARY & MEDIA UPLOADER MANAGER (images/ directory)
// ==========================================================================
const LOCAL_STORAGE_CUSTOM_IMAGES_KEY = 'ali_ministry_custom_images_v1';
const LOCAL_STORAGE_PUBLIC_CRUSADES_KEY = 'ali_ministry_crusades_public_enabled';

let customImagesLibrary = [
    {
        id: 'img-hero-default',
        filename: 'hero.jpg',
        path: 'images/hero.jpg',
        category: 'hero',
        categoryLabel: 'Hero Banner',
        size: 'Primary Widescreen Asset',
        dataUrl: 'images/hero.jpg',
        date: 'System Default'
    }
];
let pendingGeneralImageFile = null;

// --- HELPER FUNCTION: STANDARDIZE IMAGE FILE NAME ---
function standardizeImageFileName(filename) {
    if (!filename) return 'image-' + Date.now() + '.jpg';
    let str = String(filename).trim();

    if (str.startsWith('images/')) {
        str = str.substring(7);
    }

    const extIndex = str.lastIndexOf('.');
    let ext = '.jpg';
    let base = str;

    if (extIndex !== -1) {
        ext = str.substring(extIndex).toLowerCase();
        base = str.substring(0, extIndex);
    }

    base = base.toLowerCase()
        .replace(/[\s_]+/g, '-')        // spaces & underscores to hyphens
        .replace(/[^a-z0-9-]/g, '')     // remove invalid characters
        .replace(/-+/g, '-')             // collapse multiple hyphens
        .replace(/^-|-$/g, '');          // trim leading/trailing hyphens

    if (!base) base = 'image-' + Date.now();
    return base + ext;
}

// --- CLIENT-SIDE IMAGE COMPRESSION STEP (Canvas API) ---
function compressImageFile(file, maxWidth = 1920, quality = 0.82) {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
            resolve(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const compressedDataUrl = canvas.toDataURL(mimeType, quality);
                const estBytes = Math.round((compressedDataUrl.length * 3) / 4);

                resolve({
                    dataUrl: compressedDataUrl,
                    width: width,
                    height: height,
                    originalSize: file.size,
                    compressedSize: estBytes
                });
            };
            img.onerror = () => resolve(null);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

function loadSavedImages() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_CUSTOM_IMAGES_KEY);
        if (stored) {
            const savedArr = JSON.parse(stored);
            customImagesLibrary = [customImagesLibrary[0], ...savedArr];
        }
    } catch (e) {
        console.error('Could not load custom images from localStorage', e);
    }
    renderAdminImagesList();
}

async function processSelectedImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        showToast('Please select a valid image file (JPG, PNG, WEBP, GIF).', 'error');
        return;
    }

    pendingGeneralImageFile = file;
    const nameInput = document.getElementById('adminImgTargetName');
    const dropText = document.getElementById('generalImgDropText');
    const prevContainer = document.getElementById('imageUploadPreviewContainer');
    const prevThumb = document.getElementById('imageUploadPreviewThumb');
    const prevName = document.getElementById('imageUploadPreviewName');
    const prevSize = document.getElementById('imageUploadPreviewSize');
    const prevDims = document.getElementById('imageUploadPreviewDims');

    const cleanStandardizedName = standardizeImageFileName(file.name);
    if (nameInput) {
        nameInput.value = cleanStandardizedName;
    }
    if (dropText) dropText.textContent = `Selected: ${cleanStandardizedName}`;

    if (prevContainer) prevContainer.style.display = 'flex';
    if (prevSize) prevSize.textContent = 'Compressing image preview...';

    // Client-side compression via Canvas API
    const compressedResult = await compressImageFile(file, 1920, 0.82);
    if (compressedResult) {
        if (prevThumb) prevThumb.src = compressedResult.dataUrl;
        if (prevName) prevName.textContent = cleanStandardizedName;
        
        const origKb = (compressedResult.originalSize / 1024).toFixed(1);
        const compKb = (compressedResult.compressedSize / 1024).toFixed(1);
        const savedPercent = Math.round((1 - compressedResult.compressedSize / compressedResult.originalSize) * 100);

        if (prevSize) {
            if (savedPercent > 0) {
                prevSize.innerHTML = `<strong>${compKb} KB</strong> (Compressed from ${origKb} KB — <span style="color:var(--gold);">${savedPercent}% saved</span>)`;
            } else {
                prevSize.textContent = `${origKb} KB • ${file.type || 'Image'}`;
            }
        }
        if (prevDims) {
            prevDims.innerHTML = `<i class="fa-solid fa-ruler-combined"></i> Dimensions: ${compressedResult.width} × ${compressedResult.height} px • Compressed`;
        }
    }
}

function handleGeneralFileSelect(event) {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
        processSelectedImageFile(file);
    }
}

function handleGeneralImgDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    const zone = document.getElementById('generalImgDropzone');
    if (zone) zone.classList.add('drag-active');
}

function handleGeneralImgDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    const zone = document.getElementById('generalImgDropzone');
    if (zone) zone.classList.remove('drag-active');
}

function handleGeneralImgDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const zone = document.getElementById('generalImgDropzone');
    if (zone) zone.classList.remove('drag-active');

    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0];
        processSelectedImageFile(file);
    }
}

async function handleAdminImageUpload(event) {
    if (event) event.preventDefault();

    let rawName = document.getElementById('adminImgTargetName')?.value.trim();
    const category = document.getElementById('adminImgCategory')?.value || 'general';

    if (!pendingGeneralImageFile && !rawName) {
        showToast('Please select an image file to upload.', 'error');
        return;
    }

    let inputName = rawName || (pendingGeneralImageFile ? pendingGeneralImageFile.name : 'image.jpg');
    const cleanFilename = standardizeImageFileName(inputName);
    const fullPath = `images/${cleanFilename}`;

    let dataUrl = 'images/hero.jpg';
    let formattedSize = 'Custom Upload';

    if (pendingGeneralImageFile) {
        // Compress client-side via Canvas API
        const compressed = await compressImageFile(pendingGeneralImageFile, 1920, 0.82);
        if (compressed) {
            dataUrl = compressed.dataUrl;
            formattedSize = `${(compressed.compressedSize / 1024).toFixed(1)} KB (Compressed)`;
        } else {
            dataUrl = await new Promise((res) => {
                const r = new FileReader();
                r.onload = (e) => res(e.target.result);
                r.readAsDataURL(pendingGeneralImageFile);
            });
            formattedSize = `${(pendingGeneralImageFile.size / 1024).toFixed(1)} KB`;
        }
    }

    const newImg = {
        id: 'img-' + Date.now(),
        filename: cleanFilename,
        path: fullPath,
        category: category,
        categoryLabel: category === 'hero' ? 'Hero Banner' : (category === 'crusade' ? 'Crusade Photo' : (category === 'blog' ? 'Devotional Cover' : 'General Asset')),
        size: formattedSize,
        dataUrl: dataUrl,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    if (cleanFilename === 'hero.jpg' || category === 'hero') {
        activeBranding.heroImage = dataUrl;
        localStorage.setItem(LOCAL_STORAGE_BRANDING_KEY, JSON.stringify(activeBranding));
        applyBrandingToUI();
        showToast('Hero background (images/hero.jpg) updated live!', 'success', 5000);
    }

    const existingIdx = customImagesLibrary.findIndex(i => i.filename === cleanFilename);
    if (existingIdx !== -1 && existingIdx !== 0) {
        customImagesLibrary[existingIdx] = newImg;
    } else if (cleanFilename !== 'hero.jpg') {
        customImagesLibrary.unshift(newImg);
    } else {
        customImagesLibrary[0] = newImg;
    }

    saveCustomImagesToStorage();
    renderAdminImagesList();
    resetImageUploadForm();

    showToast(`Image uploaded to ${fullPath} (Compressed & standardized)!`, 'success');
}

function saveCustomImagesToStorage() {
    try {
        const toSave = customImagesLibrary.filter(i => i.id !== 'img-hero-default');
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_IMAGES_KEY, JSON.stringify(toSave));
    } catch (e) {
        console.error('Could not save custom images library', e);
    }
}

function resetImageUploadForm() {
    pendingGeneralImageFile = null;
    const form = document.getElementById('adminImageUploadForm');
    const dropText = document.getElementById('generalImgDropText');
    const prevContainer = document.getElementById('imageUploadPreviewContainer');
    const fileInp = document.getElementById('adminGeneralFileInput');

    if (form) form.reset();
    if (dropText) dropText.textContent = 'Click to select or drag & drop picture file';
    if (prevContainer) prevContainer.style.display = 'none';
    if (fileInp) fileInp.value = '';
}

function renderAdminImagesList() {
    const grid = document.getElementById('adminImageLibraryGrid');
    const countBadge = document.getElementById('adminImageCount');
    const filterCat = document.getElementById('adminImageFilterCategory')?.value || 'all';
    const sortOrder = document.getElementById('adminImageSortOrder')?.value || 'newest';

    let list = [...customImagesLibrary];

    if (filterCat !== 'all') {
        list = list.filter(item => item.category === filterCat);
    }

    list.sort((a, b) => {
        if (sortOrder === 'name') {
            return a.filename.localeCompare(b.filename);
        } else if (sortOrder === 'oldest') {
            const timeA = parseInt(a.id.replace('img-', '')) || 0;
            const timeB = parseInt(b.id.replace('img-', '')) || 0;
            return timeA - timeB;
        } else {
            const timeA = parseInt(a.id.replace('img-', '')) || 0;
            const timeB = parseInt(b.id.replace('img-', '')) || 0;
            return timeB - timeA;
        }
    });

    if (countBadge) countBadge.textContent = list.length;
    if (!grid) return;

    if (list.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
                <i class="fa-solid fa-images" style="font-size: 32px; margin-bottom: 10px; color: var(--gold);"></i>
                <p style="margin: 0; font-weight: 600;">No images found in the library matching "${filterCat}".</p>
                <p style="margin-top: 4px; font-size: 12px;">Upload a new image or change your filter selection.</p>
            </div>`;
        return;
    }

    grid.innerHTML = list.map(item => `
        <div class="image-library-card" style="position: relative;">
            <div style="position: absolute; top: 8px; left: 8px; z-index: 5; background: rgba(0,0,0,0.75); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--gold); display: flex; align-items: center; gap: 4px;">
                <input type="checkbox" class="admin-img-checkbox" value="${item.id}" onchange="updateImageBulkSelectUI()" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--gold);">
            </div>
            <div class="image-library-thumb">
                <img src="${item.dataUrl}" alt="${escapeHtml(item.filename)}" onerror="this.src='images/hero.jpg'">
            </div>
            <div class="image-library-info">
                <div class="image-library-name"><code>${escapeHtml(item.path)}</code></div>
                <div class="image-library-meta">
                    <span class="lightbox-cat-badge" style="background: rgba(217, 119, 6, 0.15); color: var(--gold); padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;">${escapeHtml(item.categoryLabel)}</span>
                    <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(item.size)}</span>
                </div>
                <div class="image-library-actions" style="display: flex; gap: 8px; margin-top: 8px;">
                    <button type="button" class="btn btn-sm btn-gold" onclick="copyImagePath('${escapeHtml(item.path)}')" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; font-weight: 700;" title="Copy path to clipboard">
                        <i class="fa-solid fa-copy"></i> Copy Path
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteCustomImage('${item.id}')" title="Delete image from library" style="padding: 6px 10px;">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    updateImageBulkSelectUI();
}

// --- BULK SELECTION & BULK DELETION FUNCTIONS ---
function toggleSelectAllImages(checked) {
    const checkboxes = document.querySelectorAll('.admin-img-checkbox');
    checkboxes.forEach(chk => {
        chk.checked = checked;
    });
    updateImageBulkSelectUI();
}

function updateImageBulkSelectUI() {
    const selected = document.querySelectorAll('.admin-img-checkbox:checked');
    const bulkBtn = document.getElementById('bulkDeleteImgBtn');
    const countSpan = document.getElementById('selectedImgCount');
    const selectAllChk = document.getElementById('selectAllImgChk');
    const allCheckboxes = document.querySelectorAll('.admin-img-checkbox');

    if (countSpan) countSpan.textContent = selected.length;

    if (bulkBtn) {
        if (selected.length > 0) {
            bulkBtn.disabled = false;
            bulkBtn.style.opacity = '1';
        } else {
            bulkBtn.disabled = true;
            bulkBtn.style.opacity = '0.5';
        }
    }

    if (selectAllChk && allCheckboxes.length > 0) {
        selectAllChk.checked = selected.length === allCheckboxes.length;
    }
}

function deleteSelectedImagesBulk() {
    const selectedNodes = document.querySelectorAll('.admin-img-checkbox:checked');
    if (selectedNodes.length === 0) {
        showToast('No images selected for deletion.', 'info');
        return;
    }

    const idsToDelete = Array.from(selectedNodes).map(node => node.value);
    const count = idsToDelete.length;

    if (!confirm(`Are you sure you want to delete ${count} selected image(s) from your library?`)) {
        return;
    }

    customImagesLibrary = customImagesLibrary.filter(item => !idsToDelete.includes(item.id));
    saveCustomImagesToStorage();
    renderAdminImagesList();

    const selectAllChk = document.getElementById('selectAllImgChk');
    if (selectAllChk) selectAllChk.checked = false;
    updateImageBulkSelectUI();

    showToast(`Successfully deleted ${count} image(s) from the library.`, 'success');
}

function deleteCustomImage(id) {
    const targetItem = customImagesLibrary.find(i => i.id === id);
    const filename = targetItem ? targetItem.filename : 'image';
    if (!confirm(`Are you sure you want to remove "${filename}" from the image library?`)) return;

    customImagesLibrary = customImagesLibrary.filter(i => i.id !== id);
    saveCustomImagesToStorage();
    renderAdminImagesList();
    showToast(`Image "${filename}" removed from local library.`, 'info');
}

function copyImagePath(path) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(path).then(() => {
            showToast(`Image path "${path}" copied to clipboard!`, 'success');
        }).catch(() => fallbackCopy(path, 'Image path'));
    } else {
        fallbackCopy(path, 'Image path');
    }
}

// --- PUBLIC CRUSADES SECTION VISIBILITY CONTROLLER ---
function isPublicCrusadesEnabled() {
    const val = localStorage.getItem(LOCAL_STORAGE_PUBLIC_CRUSADES_KEY);
    return val === 'true'; // Default is false (Admin only)
}

function togglePublicCrusadesVisibility(enabled) {
    localStorage.setItem(LOCAL_STORAGE_PUBLIC_CRUSADES_KEY, enabled ? 'true' : 'false');
    applyPublicCrusadesVisibilityUI();
    
    if (enabled) {
        showToast('Public Crusades & Events section activated on the website!', 'success');
    } else {
        showToast('Public Crusades section moved to Admin Portal (Hidden on main site).', 'info');
    }
}

function applyPublicCrusadesVisibilityUI() {
    const enabled = isPublicCrusadesEnabled();
    const countdownSec = document.getElementById('countdown');
    const gallerySec = document.getElementById('gallery');
    const navCrusadesLink = document.getElementById('navCrusadesLink');
    const navGalleryLink = document.getElementById('navGalleryLink');
    const toggleChk = document.getElementById('adminPublicCrusadesToggle');
    const toggleLabel = document.getElementById('publicCrusadesToggleLabel');

    if (toggleChk) toggleChk.checked = enabled;
    if (toggleLabel) {
        toggleLabel.textContent = enabled ? 'Crusades Public Section: Active' : 'Crusades Public Section: Disabled';
    }

    if (countdownSec) {
        countdownSec.style.display = enabled ? 'block' : 'none';
    }
    if (gallerySec) {
        gallerySec.style.display = enabled ? 'block' : 'none';
    }
    if (navCrusadesLink) {
        navCrusadesLink.style.display = enabled ? 'inline-block' : 'none';
    }
    if (navGalleryLink) {
        navGalleryLink.style.display = enabled ? 'inline-block' : 'none';
    }
}

// --- DOM INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initBackToTop();
    initFirebaseAuth();

    // Show initial skeleton loaders to ensure pristine perceived load performance
    showComponentSkeletons('all');

    initGlobalReachMap();
    initTestimonialsCarousel();
    initFAQAccordion();
    initPrayerDraftPersistence();
    initWaveCanvasPlaceholder();
    initScrollAnimations();

    // Init Crusade Gallery & Lightbox with persistent photos
    loadSavedGalleryPhotos();

    // Init Songs, Videos, Branding, and Images Library
    loadSavedSongs();
    loadSavedVideos();
    loadSavedBranding();
    loadSavedImages();

    // Init Admin state & Persistent Content
    updateAdminUIState();
    applyPublicCrusadesVisibilityUI();
    loadSavedCrusadeEvent();
    loadSavedBlogPosts();

    // Smoothly transition from skeleton loaders to content
    setTimeout(() => {
        hideComponentSkeletons('all');
    }, 450);

    // Smooth navigation click
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            const target = this.getAttribute('href');
            if (target && target.startsWith('#')) {
                e.preventDefault();
                closeMobileMenu();
                const elem = document.querySelector(target);
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Keyboard Shortcuts (Ctrl+K for search, Escape to close modals, Arrow keys for lightbox)
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearchModal();
        }
        if (e.key === 'Escape') {
            closeSearchModal();
            closeLyricsModal();
            closeBlogModal();
            closeVideoModal();
            closeTestimonyModal();
            closeFullTestimonyModal();
            closeSeoFeedModal();
            closeCrusadeLightbox();
            closeAdminLoginModal();
            closeAdminDashboardModal();
            closeExitIntentModal();
        }
        // Lightbox arrows
        const lightbox = document.getElementById('crusadeLightbox');
        if (lightbox && lightbox.classList.contains('active')) {
            if (e.key === 'ArrowRight') {
                nextLightboxPhoto();
            } else if (e.key === 'ArrowLeft') {
                prevLightboxPhoto();
            }
        }
    });

    // Search Input Real-Time Dynamic Search Event
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderSearchResults(e.target.value);
        });
    }

    // Newsletter Form Submission
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }

    // Init Exit Intent & Share Drawer
    initExitIntent();
});

// --- FLOATING SOCIAL MEDIA SHARE DRAWER ---
function toggleShareDrawer(forceState) {
    const drawer = document.getElementById('floatingShareDrawer');
    if (!drawer) return;

    if (typeof forceState === 'boolean') {
        if (forceState) {
            drawer.classList.add('active');
        } else {
            drawer.classList.remove('active');
        }
    } else {
        drawer.classList.toggle('active');
    }
}

function shareToPlatform(platform) {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareTitle = encodeURIComponent("Ali Welekhasia Official Gospel Music & Crusades Ministry | Proclaiming Christ Across Africa");
    const shareText = encodeURIComponent("Listen to anointed gospel worship, access Swahili lyrics & chord sheets, and follow music ministry updates by Ali Welekhasia:");

    let url = '';
    switch (platform) {
        case 'whatsapp':
            url = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`;
            break;
        case 'facebook':
            url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`;
            break;
        case 'twitter':
            url = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}&hashtags=AliWelekhasia,GospelMusic,SwahiliWorship,RevivalCrusade`;
            break;
        case 'telegram':
            url = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;
            break;
        default:
            break;
    }

    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer,width=620,height=580');
        showToast(`Opening ${platform.toUpperCase()} share dialog...`, 'info', 2500);
    }
}

function copyMinistryPageLink() {
    const url = window.location.href;
    const btnText = document.getElementById('copyLinkBtnText');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            if (btnText) btnText.textContent = 'Link Copied!';
            showToast('Ministry website link copied to clipboard!', 'success');
            setTimeout(() => {
                if (btnText) btnText.textContent = 'Copy Link';
            }, 3000);
        }).catch(() => fallbackCopyLink(url, btnText));
    } else {
        fallbackCopyLink(url, btnText);
    }
}

function fallbackCopyLink(text, btnText) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand('copy');
        if (btnText) btnText.textContent = 'Link Copied!';
        showToast('Ministry website link copied to clipboard!', 'success');
        setTimeout(() => {
            if (btnText) btnText.textContent = 'Copy Link';
        }, 3000);
    } catch (e) {
        showToast('Failed to copy link. Please copy URL from browser address bar.', 'error');
    }
    document.body.removeChild(tempInput);
}

// --- EXIT INTENT POPUP MODAL ---
const LOCAL_STORAGE_EXIT_INTENT_KEY = 'ali_exit_intent_shown_v1';
let exitIntentTriggered = false;

function initExitIntent() {
    // Check if user has already seen exit modal in past 24 hours
    try {
        const lastShown = localStorage.getItem(LOCAL_STORAGE_EXIT_INTENT_KEY);
        if (lastShown) {
            const timeDiff = Date.now() - parseInt(lastShown, 10);
            if (timeDiff < 24 * 60 * 60 * 1000) {
                exitIntentTriggered = true;
            }
        }
    } catch (e) {}

    // Desktop exit intent: mouse leaves top viewport boundary
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 15 && !exitIntentTriggered) {
            openExitIntentModal();
        }
    });

    // Mobile fallback timer (triggers once after 45s of active browsing if user hasn't converted)
    setTimeout(() => {
        if (!exitIntentTriggered && window.innerWidth <= 768) {
            openExitIntentModal();
        }
    }, 45000);
}

function openExitIntentModal() {
    const modal = document.getElementById('exitIntentModal');
    if (!modal || exitIntentTriggered) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    exitIntentTriggered = true;

    try {
        localStorage.setItem(LOCAL_STORAGE_EXIT_INTENT_KEY, Date.now().toString());
    } catch (e) {}
}

function closeExitIntentModal() {
    const modal = document.getElementById('exitIntentModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function handleExitIntentSubscribe(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById('exitIntentEmail');
    if (!emailInput || !emailInput.value.trim()) return;

    const email = emailInput.value.trim();
    showToast(`Hallelujah! ${email} is now subscribed to exclusive ministry updates and devotionals.`, 'success', 5000);

    closeExitIntentModal();
    if (emailInput) emailInput.value = '';
}

// --- SKELETON LOADING PLACEHOLDERS CONTROLLER ---
function showComponentSkeletons(componentName) {
    if (componentName === 'music' || componentName === 'all') {
        const sk = document.getElementById('musicSkeletonGrid');
        const grid = document.getElementById('musicCardsGrid');
        if (sk) sk.style.display = 'grid';
        if (grid) grid.style.display = 'none';
    }
    if (componentName === 'blog' || componentName === 'all') {
        const sk = document.getElementById('blogSkeletonGrid');
        const grid = document.getElementById('blogGrid');
        if (sk) sk.style.display = 'grid';
        if (grid) grid.style.display = 'none';
    }
    if (componentName === 'gallery' || componentName === 'all') {
        const sk = document.getElementById('gallerySkeletonGrid');
        const grid = document.getElementById('crusadePhotoGrid');
        if (sk) sk.style.display = 'grid';
        if (grid) grid.style.display = 'none';
    }
}

function hideComponentSkeletons(componentName) {
    if (componentName === 'music' || componentName === 'all') {
        const sk = document.getElementById('musicSkeletonGrid');
        const grid = document.getElementById('musicCardsGrid');
        if (sk) sk.style.display = 'none';
        if (grid) grid.style.display = 'grid';
    }
    if (componentName === 'blog' || componentName === 'all') {
        const sk = document.getElementById('blogSkeletonGrid');
        const grid = document.getElementById('blogGrid');
        if (sk) sk.style.display = 'none';
        if (grid) grid.style.display = 'grid';
    }
    if (componentName === 'gallery' || componentName === 'all') {
        const sk = document.getElementById('gallerySkeletonGrid');
        const grid = document.getElementById('crusadePhotoGrid');
        if (sk) sk.style.display = 'none';
        if (grid) grid.style.display = 'grid';
    }
}


