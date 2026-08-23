package com.example.aliwelekhasia

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import com.example.aliwelekhasia.ui.MainViewModel
import com.example.aliwelekhasia.ui.components.FullAudioPlayerBottomSheet
import com.example.aliwelekhasia.ui.components.LyricsDialog
import com.example.aliwelekhasia.ui.components.MiniAudioPlayer
import com.example.aliwelekhasia.ui.screens.*
import com.example.aliwelekhasia.ui.theme.AliWelekhasiaTheme
import com.example.aliwelekhasia.ui.theme.AmberAccent
import com.example.aliwelekhasia.ui.theme.NavyPrimary

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            AliWelekhasiaTheme {
                val selectedTab by viewModel.selectedTab.collectAsState()
                val currentSong by viewModel.currentSong.collectAsState()
                val lyricsSong by viewModel.showLyricsForSong.collectAsState()

                var showExpandedPlayer by remember { mutableStateOf(false) }
                var showAdminDashboard by remember { mutableStateOf(false) }

                if (showAdminDashboard) {
                    AdminDashboardScreen(
                        viewModel = viewModel,
                        onBack = { showAdminDashboard = false }
                    )
                } else {
                    Scaffold(
                        modifier = Modifier.fillMaxSize(),
                        topBar = {
                            CenterAlignedTopAppBar(
                                title = {
                                    Text(
                                        text = "ALI WELEKHASIA MUSIC",
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                },
                                actions = {
                                    IconButton(
                                        onClick = { showAdminDashboard = true },
                                        modifier = Modifier.testTag("topbar_admin_btn")
                                    ) {
                                        Icon(
                                            Icons.Default.AdminPanelSettings,
                                            contentDescription = "Admin Dashboard",
                                            tint = AmberAccent
                                        )
                                    }
                                },
                                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                                    containerColor = NavyPrimary
                                )
                            )
                        },
                    bottomBar = {
                        Column {
                            // Persistent Mini Audio Player
                            if (currentSong != null) {
                                MiniAudioPlayer(
                                    viewModel = viewModel,
                                    onExpandPlayer = { showExpandedPlayer = true }
                                )
                            }

                            NavigationBar(
                                containerColor = NavyPrimary,
                                contentColor = Color.White
                            ) {
                                NavigationBarItem(
                                    selected = selectedTab == 0,
                                    onClick = { viewModel.selectTab(0) },
                                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                                    label = { Text("Home") },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = NavyPrimary,
                                        selectedTextColor = AmberAccent,
                                        indicatorColor = AmberAccent,
                                        unselectedIconColor = Color.White.copy(alpha = 0.7f),
                                        unselectedTextColor = Color.White.copy(alpha = 0.7f)
                                    ),
                                    modifier = Modifier.testTag("nav_item_home")
                                )

                                NavigationBarItem(
                                    selected = selectedTab == 1,
                                    onClick = { viewModel.selectTab(1) },
                                    icon = { Icon(Icons.Default.MusicNote, contentDescription = "Music") },
                                    label = { Text("Music") },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = NavyPrimary,
                                        selectedTextColor = AmberAccent,
                                        indicatorColor = AmberAccent,
                                        unselectedIconColor = Color.White.copy(alpha = 0.7f),
                                        unselectedTextColor = Color.White.copy(alpha = 0.7f)
                                    ),
                                    modifier = Modifier.testTag("nav_item_music")
                                )

                                NavigationBarItem(
                                    selected = selectedTab == 2,
                                    onClick = { viewModel.selectTab(2) },
                                    icon = { Icon(Icons.Default.OndemandVideo, contentDescription = "Media") },
                                    label = { Text("Videos") },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = NavyPrimary,
                                        selectedTextColor = AmberAccent,
                                        indicatorColor = AmberAccent,
                                        unselectedIconColor = Color.White.copy(alpha = 0.7f),
                                        unselectedTextColor = Color.White.copy(alpha = 0.7f)
                                    ),
                                    modifier = Modifier.testTag("nav_item_media")
                                )

                                NavigationBarItem(
                                    selected = selectedTab == 3,
                                    onClick = { viewModel.selectTab(3) },
                                    icon = { Icon(Icons.Default.Church, contentDescription = "Ministry") },
                                    label = { Text("Ministry") },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = NavyPrimary,
                                        selectedTextColor = AmberAccent,
                                        indicatorColor = AmberAccent,
                                        unselectedIconColor = Color.White.copy(alpha = 0.7f),
                                        unselectedTextColor = Color.White.copy(alpha = 0.7f)
                                    ),
                                    modifier = Modifier.testTag("nav_item_ministry")
                                )

                                NavigationBarItem(
                                    selected = selectedTab == 4,
                                    onClick = { viewModel.selectTab(4) },
                                    icon = { Icon(Icons.Default.ContactSupport, contentDescription = "Connect") },
                                    label = { Text("Connect") },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = NavyPrimary,
                                        selectedTextColor = AmberAccent,
                                        indicatorColor = AmberAccent,
                                        unselectedIconColor = Color.White.copy(alpha = 0.7f),
                                        unselectedTextColor = Color.White.copy(alpha = 0.7f)
                                    ),
                                    modifier = Modifier.testTag("nav_item_connect")
                                )
                            }
                        }
                    }
                ) { paddingValues ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                    ) {
                        when (selectedTab) {
                            0 -> HomeScreen(viewModel = viewModel)
                            1 -> MusicScreen(viewModel = viewModel)
                            2 -> MediaGalleryScreen(viewModel = viewModel)
                            3 -> MinistryScreen(viewModel = viewModel)
                            4 -> ConnectScreen(
                                viewModel = viewModel,
                                onOpenAdmin = { showAdminDashboard = true }
                            )
                        }
                    }

                    // Audio Player Modal Bottom Sheet
                    if (showExpandedPlayer) {
                        FullAudioPlayerBottomSheet(
                            viewModel = viewModel,
                            onDismiss = { showExpandedPlayer = false }
                        )
                    }

                    // Lyrics Dialog
                    lyricsSong?.let { song ->
                        LyricsDialog(
                            song = song,
                            onDismiss = { viewModel.showLyrics(null) }
                        )
                    }
                }
            }
            }
        }
    }
}
