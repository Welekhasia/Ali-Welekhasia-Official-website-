package com.example.aliwelekhasia.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.aliwelekhasia.R
import com.example.aliwelekhasia.model.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MainViewModel : ViewModel() {

    private val coverImg = R.drawable.img_live_worship_1786620938622

    private val initialSongs = listOf(
        Song(
            id = "1",
            title = "NI WEWE",
            artist = "Ali Welekhasia",
            type = "Official Audio",
            durationSeconds = 275,
            coverRes = coverImg,
            lyrics = """
                Verse 1:
                Wewe ni Mungu usiyeshindwa
                Nguvu zote ziko mikononi mwako
                Nikipita katika bonde la kivuli cha mauti
                Sitakogopa maana uko pamoja nami.

                Chorus:
                Ni Wewe, Ni Wewe Bwana
                Ewe Mungu wangu wa huduma na maisha
                Ni Wewe wa kuabudiwa na kutukuzwa.

                Verse 2:
                Masaa yote matumaini yangu yako kwako
                Umetenda makuu ambayo binadamu hawezi
                Asante Yesu kwa neema yako isiyo na kifani.
            """.trimIndent(),
            isFavorite = true
        ),
        Song(
            id = "2",
            title = "VUMILIA MOYO",
            artist = "Ali Welekhasia",
            featuring = "Mercy Lukio",
            type = "ft. Mercy Lukio",
            durationSeconds = 310,
            coverRes = coverImg,
            lyrics = """
                Verse 1:
                Uso ukileta machozi na giza likitanda
                Usikate tamaa Bwana Yesu anaona
                Majaribu ya leo ni ushuhuda wa kesho.

                Chorus:
                Vumilia moyo, uvumilivu una baraka
                Mungu wetu Mwenyezi hawezi kukuacha
                Masaa ya Mungu ni bora kuliko yetu.

                Verse 2 (Mercy Lukio):
                Kimbilio letu ni Kristo msalabani
                Amesikia maombi yako Bwana ataipanguza huzuni yako.
            """.trimIndent()
        ),
        Song(
            id = "3",
            title = "UMETENDA HAYA",
            artist = "Ali Welekhasia",
            type = "Official Audio",
            durationSeconds = 245,
            coverRes = coverImg,
            lyrics = """
                Verse 1:
                Nilipokuwa sina matumaini wala msaada
                Ulininyooshea mkono wako wa rehema
                Ukaniinua kutoka mavumbini mpaka juu.

                Chorus:
                Umetenda haya Bwana, Mungu wangu
                Sifa na utukufu zikurudie Wewe
                Umetenda yale ambayo hakuna mwingine anaweza.
            """.trimIndent()
        ),
        Song(
            id = "4",
            title = "NJOONI TUMWIMBIE",
            artist = "Ali Welekhasia",
            type = "Official Audio",
            durationSeconds = 215,
            coverRes = coverImg,
            lyrics = """
                Chorus:
                Njooni tumwimbie Bwana wetu
                Tumshangilie Mwamba wa wokovu wetu
                Tuingie mbele zake kwa shukrani na nyimbo za sifa!

                Verse 1:
                Maana Bwana ni Mungu mkuu
                Mfalme mkuu juu ya miungu yote
                Mikononi mwake zimo dimbwi za dunia.
            """.trimIndent()
        ),
        Song(
            id = "5",
            title = "LAMWELI",
            artist = "Ali Welekhasia",
            type = "Official Audio",
            durationSeconds = 280,
            coverRes = coverImg,
            lyrics = """
                Verse 1:
                Nyimbo za sifa na kuabudu zinamstahili Kristo
                Lamweli, Bwana wa Mabwana, Mfalme wa Amani.

                Chorus:
                Mbariki Bwana ewe nafsi yangu
                Worship Him in Spirit and in Truth!
            """.trimIndent()
        )
    )

    private val _songs = MutableStateFlow(initialSongs)
    val songs: StateFlow<List<Song>> = _songs.asStateFlow()

    private val _currentSong = MutableStateFlow<Song?>(initialSongs.first())
    val currentSong: StateFlow<Song?> = _currentSong.asStateFlow()

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _playbackProgressSec = MutableStateFlow(0)
    val playbackProgressSec: StateFlow<Int> = _playbackProgressSec.asStateFlow()

    private val _showLyricsForSong = MutableStateFlow<Song?>(null)
    val showLyricsForSong: StateFlow<Song?> = _showLyricsForSong.asStateFlow()

    private val _selectedTab = MutableStateFlow(0) // 0: Home, 1: Music, 2: Media, 3: Ministry, 4: Connect
    val selectedTab: StateFlow<Int> = _selectedTab.asStateFlow()

    private var playbackJob: Job? = null

    // Video, Event, Devotion, Testimony, Product Lists
    val heroImg = R.drawable.img_crusade_crowd_1786620923326

    val videos = listOf(
        Video(
            id = "vid1",
            title = "NI WEWE - Official Gospel Music Video",
            description = "Official Music Video by Ali Welekhasia. A soulful worship anthem proclaiming God's sovereignty, majesty and eternal presence.",
            youtubeUrl = "https://youtu.be/BLkpibP7XAU?si=P_PKI-vuYpnsQBN9",
            embedId = "BLkpibP7XAU",
            category = "Music Video",
            duration = "4:35",
            thumbnailRes = heroImg
        ),
        Video(
            id = "vid2",
            title = "BADO - Faith & Prophetic Worship",
            description = "Official Video by Ali Welekhasia. Encouraging worship declaring that God is still at work and doors of mercy remain open.",
            youtubeUrl = "https://youtu.be/TQxObs0FZ3w?si=HMx0wkuNj2K8j4oM",
            embedId = "TQxObs0FZ3w",
            category = "Music Video",
            duration = "4:15",
            thumbnailRes = coverImg
        ),
        Video(
            id = "vid3",
            title = "NJOONI TUMWIMBIE - Joyful Praise & Worship",
            description = "Official Praise Video by Ali Welekhasia. Joyful song of thanksgiving celebrating God's great deeds.",
            youtubeUrl = "https://youtu.be/Rwsr-3vtouM?si=p7Gl6rWjZ-BG9sH-",
            embedId = "Rwsr-3vtouM",
            category = "Music Video",
            duration = "3:35",
            thumbnailRes = heroImg
        ),
        Video(
            id = "vid4",
            title = "LAMWELI (UMEPENDWA SANA) - Healing & Comfort Ballad",
            description = "Official Music Video by Ali Welekhasia. A tender ballad proclaiming God's unwavering love and comfort.",
            youtubeUrl = "https://youtu.be/ZyM4Iqpv5jo?si=sJyB8-IgWBRN0vr2",
            embedId = "ZyM4Iqpv5jo",
            category = "Music Video",
            duration = "4:40",
            thumbnailRes = coverImg
        ),
        Video(
            id = "vid5",
            title = "Walking by Faith in Seasons of Trial",
            description = "Sermon Highlight by Ali Welekhasia. Encouraging message on trusting God's unwavering promises during dark valleys.",
            youtubeUrl = "https://youtu.be/BLkpibP7XAU?si=P_PKI-vuYpnsQBN9",
            embedId = "BLkpibP7XAU",
            category = "Sermon Highlight",
            duration = "12:40",
            thumbnailRes = heroImg
        ),
        Video(
            id = "vid6",
            title = "The Power of Praise & Divine Thanksgiving",
            description = "Sermon Highlight. Teaching from Psalm 100 on how thanksgiving unlocks supernatural breakthrough and spiritual strength.",
            youtubeUrl = "https://youtu.be/TQxObs0FZ3w?si=HMx0wkuNj2K8j4oM",
            embedId = "TQxObs0FZ3w",
            category = "Sermon Highlight",
            duration = "18:15",
            thumbnailRes = coverImg
        )
    )

    val featuredVideo = videos.first()

    private val initialEvents = listOf(
        Event(
            id = "ev1",
            title = "Sunday Revival Worship Services",
            description = "Praise, spirit-filled worship and life-transforming gospel messages.",
            location = "Church Assemblies Across Kenya",
            date = "Every Sunday, 9:00 AM",
            actionText = "Book Ministry"
        ),
        Event(
            id = "ev2",
            title = "Mombasa Mega Crusade & Healing Service",
            description = "Open-air evangelistic gathering with mass altar call and prayer.",
            location = "Treasury Square Grounds, Mombasa",
            date = "Sept 12-14, 2026",
            actionText = "Invite Ali"
        ),
        Event(
            id = "ev3",
            title = "National Youth & Worship Leaders Conference",
            description = "Spiritual mentorship, choir workshops, and night of fervent worship.",
            location = "KICC Amphitheatre, Nairobi",
            date = "Oct 2-4, 2026",
            actionText = "View Calendar"
        )
    )

    private val _events = MutableStateFlow(initialEvents)
    val events: StateFlow<List<Event>> = _events.asStateFlow()

    val devotions = listOf(
        Devotion(
            id = "dev1",
            title = "Walking by Faith",
            summary = "A devotional encouraging believers to trust God in every season of life.",
            fullText = """
                "For we walk by faith, not by sight." - 2 Corinthians 5:7

                In times of uncertainty, it is easy to rely on what our eyes can see rather than what God has promised. Walking by faith means keeping our eyes fixed on Jesus, knowing that He goes before us in every trial.

                Key Takeaway: Trust God even when the path ahead seems silent. His timing is perfect and His promises never fail.
            """.trimIndent(),
            date = "Aug 2026"
        ),
        Devotion(
            id = "dev2",
            title = "Behind the Song: Ni Wewe",
            summary = "Discover the inspiration behind Ali Welekhasia's latest worship song.",
            fullText = """
                "Ni Wewe" was birthed during a period of deep reflection and intense prayer. Reflecting on Psalm 23, the melody came as an overflowing praise for God's constant presence and protection.

                When you listen to this song, may your spirit be renewed and reminded that God is your ultimate source of strength and comfort.
            """.trimIndent(),
            date = "Jul 2026"
        ),
        Devotion(
            id = "dev3",
            title = "Ministry Outreach Update",
            summary = "Stay informed about outreach programs, concerts and church events across the country.",
            fullText = """
                Our recent open-air crusade saw hundreds of lives touched, healed, and surrendered to Jesus Christ. We continue to distribute bibles, provide community support, and host worship nights to spread the Gospel everywhere.

                Thank you to all supporters, intercessors, and partners standing with Ali Welekhasia Music!
            """.trimIndent(),
            date = "Jun 2026"
        )
    )

    val testimonies = listOf(
        Testimony(
            id = "t1",
            author = "Ministry Supporter",
            role = "Nairobi, Kenya",
            message = "Listening to Ali Welekhasia's music strengthened my faith during one of the hardest seasons of my life."
        ),
        Testimony(
            id = "t2",
            author = "Worshipper",
            role = "Mombasa, Kenya",
            message = "The worship songs reminded me that God never abandons His people. I found hope again."
        ),
        Testimony(
            id = "t3",
            author = "Church Leader",
            role = "Kakamega, Kenya",
            message = "Our church was blessed through the worship ministry. Many people dedicated their lives to Christ."
        )
    )

    val products = listOf(
        Product("p1", "Digital Music", "Download official albums & high-quality audio tracks", "Music"),
        Product("p2", "Official T-Shirts", "Premium ministry merchandise with inspirational artwork", "Apparel"),
        Product("p3", "Caps & Accessories", "Represent the ministry everywhere with branded caps & wristbands", "Accessories")
    )

    // Form states & user lists
    private val initialSubscribers = listOf(
        "pastordavid@victoryministries.or.ke",
        "faith.wanjiku88@yahoo.com",
        "ebaraza@glorycathedral.org",
        "johnmutiso99@gmail.com",
        "mchebet@kenyacampus.ac.ke",
        "worshipleader@nairobigospel.org",
        "ali.werekhasia01@gmail.com"
    )

    private val _subscribedEmails = MutableStateFlow(initialSubscribers)
    val subscribedEmails: StateFlow<List<String>> = _subscribedEmails.asStateFlow()

    private val _newsletterMessage = MutableStateFlow<String?>(null)
    val newsletterMessage: StateFlow<String?> = _newsletterMessage.asStateFlow()

    private val initialPrayerRequests = listOf(
        PrayerRequestItem(
            id = "pr1",
            name = "Grace Mwangi",
            email = "gracemwangi@gmail.com",
            request = "Please stand in agreement for complete physical healing for my mother who is undergoing surgery this Friday. We trust God for total restoration.",
            date = "Aug 22, 2026",
            category = "Healing & Health",
            isPrayedFor = true,
            notes = "Interceded during morning prayer session"
        ),
        PrayerRequestItem(
            id = "pr2",
            name = "Pastor David Ochieng",
            email = "pastordavid@victoryministries.or.ke",
            request = "Praying for revival and financial provision to purchase bibles for our upcoming rural mission crusade in Western Kenya.",
            date = "Aug 21, 2026",
            category = "Ministry & Missions",
            isPrayedFor = false,
            notes = ""
        ),
        PrayerRequestItem(
            id = "pr3",
            name = "Faith Wanjiku",
            email = "faith.wanjiku88@yahoo.com",
            request = "Seeking God's divine favor and open doors for employment after 6 months of searching. I believe in God's perfect timing.",
            date = "Aug 20, 2026",
            category = "Career & Provision",
            isPrayedFor = true,
            notes = "Sent encouragement scriptures"
        ),
        PrayerRequestItem(
            id = "pr4",
            name = "Brother John Mutiso",
            email = "johnmutiso99@gmail.com",
            request = "Praying for family reconciliation, peace, and spiritual breakthrough in my home.",
            date = "Aug 19, 2026",
            category = "Family & Peace",
            isPrayedFor = false,
            notes = ""
        )
    )

    private val _prayerRequests = MutableStateFlow(initialPrayerRequests)
    val prayerRequests: StateFlow<List<PrayerRequestItem>> = _prayerRequests.asStateFlow()

    private val initialContactMessages = listOf(
        ContactMessageItem(
            id = "msg1",
            name = "Bishop Emmanuel Baraza",
            email = "ebaraza@glorycathedral.org",
            phone = "+254 722 112 233",
            subject = "Crusade Guest Minister Invitation",
            message = "Calvary greetings Ali. We would love to officially invite you to lead worship and minister at our 3-day Coastal Gospel Explosion in Mombasa from Oct 16th-18th.",
            date = "Aug 22, 2026",
            isReplied = true
        ),
        ContactMessageItem(
            id = "msg2",
            name = "Mary Chebet",
            email = "mchebet@kenyacampus.ac.ke",
            phone = "+254 711 445 566",
            subject = "Campus Worship Night Booking",
            message = "Hello Ali Welekhasia Ministry! The Christian Union at University of Nairobi invites your team for our Annual Worship Night on Sept 26th.",
            date = "Aug 21, 2026",
            isReplied = false
        ),
        ContactMessageItem(
            id = "msg3",
            name = "Elder Peter Karanja",
            email = "pkaranja@pceachurch.org",
            phone = "+254 733 778 899",
            subject = "Choir Workshop & Seminar",
            message = "We would be honored to host a 2-day music and worship seminar for our regional church choir leaders in Nakuru.",
            date = "Aug 18, 2026",
            isReplied = false
        )
    )

    private val _contactMessages = MutableStateFlow(initialContactMessages)
    val contactMessages: StateFlow<List<ContactMessageItem>> = _contactMessages.asStateFlow()

    private val _userMessage = MutableStateFlow<String?>(null)
    val userMessage: StateFlow<String?> = _userMessage.asStateFlow()

    fun subscribeToNewsletter(email: String) {
        if (email.contains("@") && email.contains(".")) {
            if (!_subscribedEmails.value.contains(email)) {
                _subscribedEmails.value = listOf(email) + _subscribedEmails.value
            }
            _newsletterMessage.value = "Thank you! You are now subscribed to Ali Welekhasia's newsletter."
        } else {
            _newsletterMessage.value = "Please enter a valid email address."
        }
    }

    fun clearNewsletterMessage() {
        _newsletterMessage.value = null
    }

    fun selectTab(index: Int) {
        _selectedTab.value = index
    }

    fun playSong(song: Song) {
        if (_currentSong.value?.id == song.id) {
            togglePlayPause()
        } else {
            _currentSong.value = song
            _playbackProgressSec.value = 0
            _isPlaying.value = true
            startPlaybackTimer()
        }
    }

    fun togglePlayPause() {
        _isPlaying.value = !_isPlaying.value
        if (_isPlaying.value) {
            startPlaybackTimer()
        } else {
            playbackJob?.cancel()
        }
    }

    fun seekTo(seconds: Int) {
        _playbackProgressSec.value = seconds.coerceIn(0, _currentSong.value?.durationSeconds ?: 300)
    }

    fun nextSong() {
        val list = _songs.value
        val currentIndex = list.indexOfFirst { it.id == _currentSong.value?.id }
        if (currentIndex != -1 && list.isNotEmpty()) {
            val nextIndex = (currentIndex + 1) % list.size
            playSong(list[nextIndex])
        }
    }

    fun previousSong() {
        val list = _songs.value
        val currentIndex = list.indexOfFirst { it.id == _currentSong.value?.id }
        if (currentIndex != -1 && list.isNotEmpty()) {
            val prevIndex = if (currentIndex - 1 < 0) list.size - 1 else currentIndex - 1
            playSong(list[prevIndex])
        }
    }

    fun toggleFavorite(songId: String) {
        _songs.value = _songs.value.map { song ->
            if (song.id == songId) song.copy(isFavorite = !song.isFavorite) else song
        }
        if (_currentSong.value?.id == songId) {
            _currentSong.value = _currentSong.value?.let { it.copy(isFavorite = !it.isFavorite) }
        }
    }

    fun showLyrics(song: Song?) {
        _showLyricsForSong.value = song
    }

    private fun startPlaybackTimer() {
        playbackJob?.cancel()
        playbackJob = viewModelScope.launch {
            while (_isPlaying.value) {
                delay(1000)
                val total = _currentSong.value?.durationSeconds ?: 240
                if (_playbackProgressSec.value < total) {
                    _playbackProgressSec.value += 1
                } else {
                    nextSong()
                }
            }
        }
    }

    fun submitPrayerRequest(name: String, email: String, request: String, category: String = "General") {
        val newItem = PrayerRequestItem(
            id = System.currentTimeMillis().toString(),
            name = name,
            email = email,
            request = request,
            category = category,
            date = "Today",
            isPrayedFor = false
        )
        _prayerRequests.value = listOf(newItem) + _prayerRequests.value
        _userMessage.value = "Thank you $name. Your prayer request has been received!"
    }

    fun submitContactMessage(name: String, email: String, phone: String, message: String, subject: String = "Ministry Inquiry") {
        val newItem = ContactMessageItem(
            id = System.currentTimeMillis().toString(),
            name = name,
            email = email,
            phone = phone,
            subject = subject,
            message = message,
            date = "Today",
            isReplied = false
        )
        _contactMessages.value = listOf(newItem) + _contactMessages.value
        _userMessage.value = "Thank you $name. We have received your message!"
    }

    fun clearUserMessage() {
        _userMessage.value = null
    }

    // --- Admin Dashboard Methods ---
    fun deletePrayerRequest(id: String) {
        _prayerRequests.value = _prayerRequests.value.filterNot { it.id == id }
    }

    fun togglePrayerRequestPrayed(id: String) {
        _prayerRequests.value = _prayerRequests.value.map { item ->
            if (item.id == id) item.copy(isPrayedFor = !item.isPrayedFor) else item
        }
    }

    fun deleteContactMessage(id: String) {
        _contactMessages.value = _contactMessages.value.filterNot { it.id == id }
    }

    fun toggleContactMessageReplied(id: String) {
        _contactMessages.value = _contactMessages.value.map { item ->
            if (item.id == id) item.copy(isReplied = !item.isReplied) else item
        }
    }

    fun addSubscriber(email: String) {
        val trimmed = email.trim()
        if (trimmed.contains("@") && trimmed.contains(".") && !_subscribedEmails.value.contains(trimmed)) {
            _subscribedEmails.value = listOf(trimmed) + _subscribedEmails.value
        }
    }

    fun removeSubscriber(email: String) {
        _subscribedEmails.value = _subscribedEmails.value.filterNot { it.equals(email, ignoreCase = true) }
    }

    fun addEvent(title: String, description: String, location: String, date: String, actionText: String = "Book Ministry") {
        val newEvent = Event(
            id = "ev_" + System.currentTimeMillis(),
            title = title,
            description = description,
            location = location,
            date = date,
            actionText = actionText
        )
        _events.value = listOf(newEvent) + _events.value
    }

    fun deleteEvent(id: String) {
        _events.value = _events.value.filterNot { it.id == id }
    }
}
