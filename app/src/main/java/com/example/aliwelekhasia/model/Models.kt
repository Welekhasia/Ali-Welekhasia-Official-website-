package com.example.aliwelekhasia.model

data class Song(
    val id: String,
    val title: String,
    val artist: String = "Ali Welekhasia",
    val featuring: String? = null,
    val type: String = "Official Audio",
    val durationSeconds: Int = 240,
    val coverRes: Int,
    val lyrics: String,
    val isFavorite: Boolean = false
)

data class Video(
    val id: String,
    val title: String,
    val description: String,
    val youtubeUrl: String,
    val embedId: String = "",
    val category: String = "Music Video",
    val duration: String = "4:30",
    val thumbnailRes: Int = 0
)

data class Event(
    val id: String,
    val title: String,
    val description: String,
    val location: String,
    val date: String,
    val actionText: String
)

data class Devotion(
    val id: String,
    val title: String,
    val summary: String,
    val fullText: String,
    val date: String,
    val author: String = "Ali Welekhasia"
)

data class Testimony(
    val id: String,
    val author: String,
    val role: String,
    val message: String
)

data class Product(
    val id: String,
    val name: String,
    val subtitle: String,
    val category: String,
    val status: String = "Coming Soon"
)

data class PrayerRequestItem(
    val id: String,
    val name: String,
    val email: String,
    val request: String,
    val date: String,
    val category: String = "General",
    val isPrayedFor: Boolean = false,
    val notes: String = ""
)

data class ContactMessageItem(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val message: String,
    val date: String,
    val subject: String = "Ministry Booking & Inquiry",
    val isReplied: Boolean = false
)
