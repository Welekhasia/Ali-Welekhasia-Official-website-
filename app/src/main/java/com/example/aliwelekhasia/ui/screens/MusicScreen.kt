package com.example.aliwelekhasia.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.aliwelekhasia.model.Song
import com.example.aliwelekhasia.ui.MainViewModel
import com.example.aliwelekhasia.ui.components.WebsiteFooter
import com.example.aliwelekhasia.ui.theme.AmberAccent
import com.example.aliwelekhasia.ui.theme.GoldSecondary
import com.example.aliwelekhasia.ui.theme.NavyPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MusicScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val songs by viewModel.songs.collectAsState()
    val currentSong by viewModel.currentSong.collectAsState()
    val isPlaying by viewModel.isPlaying.collectAsState()

    var showOnlyFavorites by remember { mutableStateOf(false) }

    val filteredSongs = if (showOnlyFavorites) songs.filter { it.isFavorite } else songs

    Column(
        modifier = modifier
            .fillMaxSize()
            .testTag("music_screen")
    ) {
        // Top Filter Bar
        Surface(
            color = NavyPrimary,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "GOSPEL MUSIC CATALOGUE",
                    style = MaterialTheme.typography.labelMedium,
                    color = AmberAccent,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Latest Songs & Worship Audio",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = !showOnlyFavorites,
                        onClick = { showOnlyFavorites = false },
                        label = { Text("All Songs (${songs.size})") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = AmberAccent,
                            selectedLabelColor = NavyPrimary,
                            containerColor = Color.White.copy(alpha = 0.15f),
                            labelColor = Color.White
                        ),
                        modifier = Modifier.testTag("filter_all_songs")
                    )

                    FilterChip(
                        selected = showOnlyFavorites,
                        onClick = { showOnlyFavorites = true },
                        label = { Text("Favorites (${songs.count { it.isFavorite }})") },
                        leadingIcon = {
                            Icon(
                                Icons.Default.Favorite,
                                contentDescription = null,
                                tint = if (showOnlyFavorites) NavyPrimary else Color.Red,
                                modifier = Modifier.size(16.dp)
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = AmberAccent,
                            selectedLabelColor = NavyPrimary,
                            containerColor = Color.White.copy(alpha = 0.15f),
                            labelColor = Color.White
                        ),
                        modifier = Modifier.testTag("filter_favorite_songs")
                    )
                }
            }
        }

        if (filteredSongs.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.FavoriteBorder,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "No favorite songs yet.",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Tap the heart icon on any song to add it to your favorites list.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                }
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(filteredSongs) { song ->
                    val isThisPlaying = currentSong?.id == song.id && isPlaying

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.playSong(song) },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (currentSong?.id == song.id)
                                NavyPrimary.copy(alpha = 0.08f)
                            else
                                MaterialTheme.colorScheme.surface
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Image(
                                painter = painterResource(id = song.coverRes),
                                contentDescription = song.title,
                                modifier = Modifier
                                    .size(64.dp)
                                    .clip(RoundedCornerShape(12.dp)),
                                contentScale = ContentScale.Crop
                            )

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = song.title,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${song.artist} ${song.featuring ?: ""}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = GoldSecondary
                                )
                                Text(
                                    text = song.type,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }

                            IconButton(onClick = { viewModel.showLyrics(song) }) {
                                Icon(
                                    Icons.Default.Article,
                                    contentDescription = "Lyrics",
                                    tint = GoldSecondary
                                )
                            }

                            IconButton(onClick = { viewModel.toggleFavorite(song.id) }) {
                                Icon(
                                    imageVector = if (song.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                    contentDescription = "Favorite",
                                    tint = if (song.isFavorite) Color.Red else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                                )
                            }

                            IconButton(
                                onClick = { viewModel.playSong(song) },
                                modifier = Modifier.testTag("play_song_${song.id}")
                            ) {
                                Icon(
                                    imageVector = if (isThisPlaying) Icons.Default.PauseCircle else Icons.Default.PlayCircle,
                                    contentDescription = "Play/Pause",
                                    tint = NavyPrimary,
                                    modifier = Modifier.size(36.dp)
                                )
                            }
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(16.dp))
                    WebsiteFooter(viewModel = viewModel)
                }
            }
        }
    }
}
