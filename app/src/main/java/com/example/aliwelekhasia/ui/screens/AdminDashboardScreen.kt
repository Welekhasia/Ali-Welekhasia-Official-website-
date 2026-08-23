package com.example.aliwelekhasia.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aliwelekhasia.model.ContactMessageItem
import com.example.aliwelekhasia.model.Event
import com.example.aliwelekhasia.model.PrayerRequestItem
import com.example.aliwelekhasia.ui.MainViewModel
import com.example.aliwelekhasia.ui.theme.AmberAccent
import com.example.aliwelekhasia.ui.theme.GoldSecondary
import com.example.aliwelekhasia.ui.theme.NavyPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    viewModel: MainViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var selectedAdminTab by remember { mutableStateOf(0) }
    // 0: Overview, 1: Prayer Requests, 2: Newsletter, 3: Inquiries, 4: Crusades/Events, 5: Content

    val prayerRequests by viewModel.prayerRequests.collectAsState()
    val subscribers by viewModel.subscribedEmails.collectAsState()
    val contactMessages by viewModel.contactMessages.collectAsState()
    val events by viewModel.events.collectAsState()
    val songs by viewModel.songs.collectAsState()

    var showAddEventDialog by remember { mutableStateOf(false) }
    var showAddPrayerDialog by remember { mutableStateOf(false) }
    var newSubscriberEmail by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "ADMIN DASHBOARD",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                color = AmberAccent,
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    text = "OFFICIAL",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = NavyPrimary,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Text(
                            text = "Ali Welekhasia Ministry Operations",
                            fontSize = 12.sp,
                            color = AmberAccent.copy(alpha = 0.85f)
                        )
                    }
                },
                navigationIcon = {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.testTag("admin_back_btn")
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            Toast.makeText(context, "Admin Session Active", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.testTag("admin_shield_icon")
                    ) {
                        Icon(
                            Icons.Default.VerifiedUser,
                            contentDescription = "Security",
                            tint = AmberAccent
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = NavyPrimary
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
        modifier = modifier
            .fillMaxSize()
            .testTag("admin_dashboard_screen")
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Horizontal Admin Navigation Tabs
            ScrollableTabRow(
                selectedTabIndex = selectedAdminTab,
                containerColor = NavyPrimary,
                contentColor = AmberAccent,
                edgePadding = 12.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Tab(
                    selected = selectedAdminTab == 0,
                    onClick = { selectedAdminTab = 0 },
                    text = { Text("Overview") },
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = null, modifier = Modifier.size(18.dp)) },
                    modifier = Modifier.testTag("admin_tab_overview")
                )
                Tab(
                    selected = selectedAdminTab == 1,
                    onClick = { selectedAdminTab = 1 },
                    text = { Text("Prayers (${prayerRequests.size})") },
                    icon = { Icon(Icons.Default.VolunteerActivism, contentDescription = null, modifier = Modifier.size(18.dp)) },
                    modifier = Modifier.testTag("admin_tab_prayers")
                )
                Tab(
                    selected = selectedAdminTab == 2,
                    onClick = { selectedAdminTab = 2 },
                    text = { Text("Subscribers (${subscribers.size})") },
                    icon = { Icon(Icons.Default.MarkEmailRead, contentDescription = null, modifier = Modifier.size(18.dp)) },
                    modifier = Modifier.testTag("admin_tab_subscribers")
                )
                Tab(
                    selected = selectedAdminTab == 3,
                    onClick = { selectedAdminTab = 3 },
                    text = { Text("Inquiries (${contactMessages.size})") },
                    icon = { Icon(Icons.Default.MailOutline, contentDescription = null, modifier = Modifier.size(18.dp)) },
                    modifier = Modifier.testTag("admin_tab_inquiries")
                )
                Tab(
                    selected = selectedAdminTab == 4,
                    onClick = { selectedAdminTab = 4 },
                    text = { Text("Crusades & Events") },
                    icon = { Icon(Icons.Default.Event, contentDescription = null, modifier = Modifier.size(18.dp)) },
                    modifier = Modifier.testTag("admin_tab_events")
                )
                Tab(
                    selected = selectedAdminTab == 5,
                    onClick = { selectedAdminTab = 5 },
                    text = { Text("Media Catalog") },
                    icon = { Icon(Icons.Default.LibraryMusic, contentDescription = null, modifier = Modifier.size(18.dp)) },
                    modifier = Modifier.testTag("admin_tab_catalog")
                )
            }

            // Tab Content
            when (selectedAdminTab) {
                0 -> AdminOverviewTab(
                    prayerCount = prayerRequests.size,
                    pendingPrayerCount = prayerRequests.count { !it.isPrayedFor },
                    subscriberCount = subscribers.size,
                    messageCount = contactMessages.size,
                    newInquiryCount = contactMessages.count { !it.isReplied },
                    eventsCount = events.size,
                    songsCount = songs.size,
                    onNavigateTab = { selectedAdminTab = it }
                )
                1 -> AdminPrayersTab(
                    prayerRequests = prayerRequests,
                    onTogglePrayed = { viewModel.togglePrayerRequestPrayed(it) },
                    onDelete = { viewModel.deletePrayerRequest(it) },
                    onAddNewClick = { showAddPrayerDialog = true }
                )
                2 -> AdminSubscribersTab(
                    subscribers = subscribers,
                    newEmail = newSubscriberEmail,
                    onEmailChange = { newSubscriberEmail = it },
                    onAddSubscriber = {
                        if (newSubscriberEmail.isNotBlank()) {
                            viewModel.addSubscriber(newSubscriberEmail)
                            newSubscriberEmail = ""
                            Toast.makeText(context, "Subscriber added!", Toast.LENGTH_SHORT).show()
                        }
                    },
                    onRemoveSubscriber = { viewModel.removeSubscriber(it) }
                )
                3 -> AdminInquiriesTab(
                    messages = contactMessages,
                    onToggleReplied = { viewModel.toggleContactMessageReplied(it) },
                    onDelete = { viewModel.deleteContactMessage(it) }
                )
                4 -> AdminEventsTab(
                    events = events,
                    onDeleteEvent = { viewModel.deleteEvent(it) },
                    onAddEventClick = { showAddEventDialog = true }
                )
                5 -> AdminMediaCatalogTab(
                    songs = songs,
                    videos = viewModel.videos,
                    devotions = viewModel.devotions
                )
            }
        }
    }

    // Add Event Dialog
    if (showAddEventDialog) {
        AddEventDialog(
            onDismiss = { showAddEventDialog = false },
            onAdd = { title, desc, loc, date, action ->
                viewModel.addEvent(title, desc, loc, date, action)
                showAddEventDialog = false
                Toast.makeText(context, "Event scheduled successfully!", Toast.LENGTH_SHORT).show()
            }
        )
    }

    // Add Prayer Request Dialog
    if (showAddPrayerDialog) {
        AddPrayerRequestDialog(
            onDismiss = { showAddPrayerDialog = false },
            onAdd = { name, email, req, cat ->
                viewModel.submitPrayerRequest(name, email, req, cat)
                showAddPrayerDialog = false
                Toast.makeText(context, "Prayer request recorded!", Toast.LENGTH_SHORT).show()
            }
        )
    }
}

// -------------------------------------------------------------
// TAB 0: OVERVIEW
// -------------------------------------------------------------
@Composable
private fun AdminOverviewTab(
    prayerCount: Int,
    pendingPrayerCount: Int,
    subscriberCount: Int,
    messageCount: Int,
    newInquiryCount: Int,
    eventsCount: Int,
    songsCount: Int,
    onNavigateTab: (Int) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Welcome Banner
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = NavyPrimary)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "MINISTRY EXECUTIVE OVERVIEW",
                                style = MaterialTheme.typography.labelSmall,
                                color = AmberAccent,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Welcome, Administrator",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                        Surface(
                            shape = CircleShape,
                            color = AmberAccent.copy(alpha = 0.2f),
                            modifier = Modifier.size(44.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    Icons.Default.AdminPanelSettings,
                                    contentDescription = null,
                                    tint = AmberAccent
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Real-time management for prayer intercessions, subscriber communications, crusades booking, and gospel media distribution.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.85f)
                    )
                }
            }
        }

        // Metrics Grid (2x2)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Metric 1: Prayers
                MetricCard(
                    title = "Prayer Requests",
                    value = "$prayerCount Total",
                    badge = if (pendingPrayerCount > 0) "$pendingPrayerCount Pending" else "All Interceded",
                    badgeColor = if (pendingPrayerCount > 0) Color(0xFFEF4444) else Color(0xFF10B981),
                    icon = Icons.Default.VolunteerActivism,
                    iconTint = AmberAccent,
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onNavigateTab(1) }
                )

                // Metric 2: Newsletter Subscribers
                MetricCard(
                    title = "Newsletter List",
                    value = "$subscriberCount Members",
                    badge = "Active Subscribers",
                    badgeColor = Color(0xFF3B82F6),
                    icon = Icons.Default.MarkEmailRead,
                    iconTint = GoldSecondary,
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onNavigateTab(2) }
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Metric 3: Bookings & Inquiries
                MetricCard(
                    title = "Inquiries & Bookings",
                    value = "$messageCount Total",
                    badge = if (newInquiryCount > 0) "$newInquiryCount Unread" else "All Addressed",
                    badgeColor = if (newInquiryCount > 0) AmberAccent else Color(0xFF10B981),
                    icon = Icons.Default.MailOutline,
                    iconTint = AmberAccent,
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onNavigateTab(3) }
                )

                // Metric 4: Crusades & Media
                MetricCard(
                    title = "Crusades & Media",
                    value = "$eventsCount Crusades",
                    badge = "$songsCount Songs & Vids",
                    badgeColor = Color(0xFF8B5CF6),
                    icon = Icons.Default.Event,
                    iconTint = GoldSecondary,
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onNavigateTab(4) }
                )
            }
        }

        // Google AdSense & Monetization Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.MonetizationOn,
                                contentDescription = null,
                                tint = AmberAccent,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Google AdSense Integration",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleSmall
                            )
                        }
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFF10B981).copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = "ACTIVE & RUNNING",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF10B981),
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Publisher Client: ca-pub-3137123958548928",
                        style = MaterialTheme.typography.bodySmall,
                        fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                        color = AmberAccent
                    )
                    Text(
                        text = "Integrated across responsive website units for ministry outreach monetization and platform maintenance.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }

        // Quick Actions Row
        item {
            Text(
                text = "Administrative Quick Operations",
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleSmall
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { onNavigateTab(1) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("View Prayers", fontSize = 12.sp)
                }
                OutlinedButton(
                    onClick = { onNavigateTab(2) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Subscribers", fontSize = 12.sp)
                }
                OutlinedButton(
                    onClick = { onNavigateTab(4) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Add Crusade", fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
private fun MetricCard(
    title: String,
    value: String,
    badge: String,
    badgeColor: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconTint: Color,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                Icon(
                    icon,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = value,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(6.dp))
            Surface(
                shape = RoundedCornerShape(6.dp),
                color = badgeColor.copy(alpha = 0.15f)
            ) {
                Text(
                    text = badge,
                    color = badgeColor,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }
    }
}

// -------------------------------------------------------------
// TAB 1: PRAYER REQUESTS
// -------------------------------------------------------------
@Composable
private fun AdminPrayersTab(
    prayerRequests: List<PrayerRequestItem>,
    onTogglePrayed: (String) -> Unit,
    onDelete: (String) -> Unit,
    onAddNewClick: () -> Unit
) {
    val context = LocalContext.current
    var filterMode by remember { mutableStateOf(0) } // 0: All, 1: Pending, 2: Prayed For

    val filteredList = when (filterMode) {
        1 -> prayerRequests.filter { !it.isPrayedFor }
        2 -> prayerRequests.filter { it.isPrayedFor }
        else -> prayerRequests
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Header & Actions
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Prayer Intercession Requests",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "${prayerRequests.size} submitted requests",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }

            Button(
                onClick = onAddNewClick,
                colors = ButtonDefaults.buttonColors(containerColor = AmberAccent),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.testTag("admin_add_prayer_btn")
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = NavyPrimary)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Record Request", color = NavyPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Filter Chips
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            FilterChip(
                selected = filterMode == 0,
                onClick = { filterMode = 0 },
                label = { Text("All (${prayerRequests.size})") },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = AmberAccent,
                    selectedLabelColor = NavyPrimary
                )
            )
            FilterChip(
                selected = filterMode == 1,
                onClick = { filterMode = 1 },
                label = { Text("Pending (${prayerRequests.count { !it.isPrayedFor }})") },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = Color(0xFFEF4444),
                    selectedLabelColor = Color.White
                )
            )
            FilterChip(
                selected = filterMode == 2,
                onClick = { filterMode = 2 },
                label = { Text("Prayed (${prayerRequests.count { it.isPrayedFor }})") },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = Color(0xFF10B981),
                    selectedLabelColor = Color.White
                )
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (filteredList.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No prayer requests found in this filter.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(filteredList) { item ->
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Surface(
                                        shape = CircleShape,
                                        color = if (item.isPrayedFor) Color(0xFF10B981).copy(alpha = 0.2f) else AmberAccent.copy(alpha = 0.2f),
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(
                                                if (item.isPrayedFor) Icons.Default.CheckCircle else Icons.Default.VolunteerActivism,
                                                contentDescription = null,
                                                tint = if (item.isPrayedFor) Color(0xFF10B981) else AmberAccent,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(
                                            text = item.name,
                                            fontWeight = FontWeight.Bold,
                                            style = MaterialTheme.typography.titleSmall
                                        )
                                        Text(
                                            text = item.email,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                        )
                                    }
                                }

                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = if (item.isPrayedFor) Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFFEF4444).copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = if (item.isPrayedFor) "PRAYED FOR" else "NEEDS PRAYER",
                                        color = if (item.isPrayedFor) Color(0xFF10B981) else Color(0xFFEF4444),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = "\"${item.request}\"",
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                                    )
                                    if (item.notes.isNotBlank()) {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(
                                            text = "Admin Note: ${item.notes}",
                                            fontSize = 11.sp,
                                            color = AmberAccent
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Date: ${item.date} • ${item.category}",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedButton(
                                        onClick = { onTogglePrayed(item.id) },
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = if (item.isPrayedFor) "Mark Pending" else "Mark Prayed",
                                            fontSize = 11.sp
                                        )
                                    }

                                    IconButton(
                                        onClick = {
                                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                            val clip = ClipData.newPlainText("Prayer Request", "${item.name} (${item.email}): ${item.request}")
                                            clipboard.setPrimaryClip(clip)
                                            Toast.makeText(context, "Prayer copied to clipboard!", Toast.LENGTH_SHORT).show()
                                        },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.ContentCopy, contentDescription = "Copy", modifier = Modifier.size(16.dp))
                                    }

                                    IconButton(
                                        onClick = { onDelete(item.id) },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// TAB 2: SUBSCRIBERS
// -------------------------------------------------------------
@Composable
private fun AdminSubscribersTab(
    subscribers: List<String>,
    newEmail: String,
    onEmailChange: (String) -> Unit,
    onAddSubscriber: () -> Unit,
    onRemoveSubscriber: (String) -> Unit
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Newsletter Subscribers List",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "${subscribers.size} verified subscribers",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }

            Button(
                onClick = {
                    val csv = subscribers.joinToString(", ")
                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    clipboard.setPrimaryClip(ClipData.newPlainText("Subscribers", csv))
                    Toast.makeText(context, "All ${subscribers.size} emails copied to clipboard!", Toast.LENGTH_SHORT).show()
                },
                colors = ButtonDefaults.buttonColors(containerColor = GoldSecondary),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.CopyAll, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Export All", fontSize = 12.sp)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Add Subscriber Input Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = newEmail,
                onValueChange = onEmailChange,
                placeholder = { Text("Enter new subscriber email...") },
                singleLine = true,
                modifier = Modifier
                    .weight(1f)
                    .testTag("admin_new_subscriber_input"),
                shape = RoundedCornerShape(12.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = onAddSubscriber,
                colors = ButtonDefaults.buttonColors(containerColor = AmberAccent),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.height(56.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = NavyPrimary)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Add", color = NavyPrimary, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(subscribers) { email ->
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.Email,
                                contentDescription = null,
                                tint = AmberAccent,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = email,
                                fontWeight = FontWeight.Medium,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }

                        IconButton(
                            onClick = { onRemoveSubscriber(email) },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                Icons.Default.Close,
                                contentDescription = "Remove",
                                tint = Color(0xFFEF4444),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// TAB 3: INQUIRIES & BOOKINGS
// -------------------------------------------------------------
@Composable
private fun AdminInquiriesTab(
    messages: List<ContactMessageItem>,
    onToggleReplied: (String) -> Unit,
    onDelete: (String) -> Unit
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Ministry Bookings & Messages",
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.titleMedium
        )
        Text(
            text = "${messages.size} total messages from pastors, coordinators & partners",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (messages.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No contact messages received yet.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(messages) { msg ->
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = msg.name,
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.titleSmall
                                    )
                                    Text(
                                        text = "${msg.email} • ${msg.phone}",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                    )
                                }

                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = if (msg.isReplied) Color(0xFF10B981).copy(alpha = 0.15f) else AmberAccent.copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = if (msg.isReplied) "REPLIED" else "NEW INQUIRY",
                                        color = if (msg.isReplied) Color(0xFF10B981) else AmberAccent,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Subject: ${msg.subject}",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp,
                                color = AmberAccent
                            )

                            Spacer(modifier = Modifier.height(6.dp))
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = msg.message,
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.padding(10.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Received: ${msg.date}",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )

                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    // Call Intent
                                    IconButton(
                                        onClick = {
                                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${msg.phone}"))
                                            context.startActivity(intent)
                                        },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.Phone, contentDescription = "Call", tint = Color(0xFF10B981), modifier = Modifier.size(16.dp))
                                    }

                                    // Email Intent
                                    IconButton(
                                        onClick = {
                                            val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:${msg.email}"))
                                            context.startActivity(intent)
                                        },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.Email, contentDescription = "Email", tint = AmberAccent, modifier = Modifier.size(16.dp))
                                    }

                                    // Toggle Replied
                                    OutlinedButton(
                                        onClick = { onToggleReplied(msg.id) },
                                        shape = RoundedCornerShape(6.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                                    ) {
                                        Text(if (msg.isReplied) "Mark Unread" else "Mark Replied", fontSize = 10.sp)
                                    }

                                    // Delete
                                    IconButton(
                                        onClick = { onDelete(msg.id) },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// TAB 4: CRUSADES & EVENTS
// -------------------------------------------------------------
@Composable
private fun AdminEventsTab(
    events: List<Event>,
    onDeleteEvent: (String) -> Unit,
    onAddEventClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Crusades & Events Itinerary",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "${events.size} scheduled gatherings",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }

            Button(
                onClick = onAddEventClick,
                colors = ButtonDefaults.buttonColors(containerColor = AmberAccent),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.testTag("admin_add_event_btn")
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = NavyPrimary)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Schedule Event", color = NavyPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(events) { ev ->
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = ev.title,
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleSmall
                            )
                            IconButton(
                                onClick = { onDeleteEvent(ev.id) },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = Color(0xFFEF4444), modifier = Modifier.size(18.dp))
                            }
                        }

                        Text(
                            text = ev.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Place, contentDescription = null, tint = AmberAccent, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(ev.location, fontSize = 12.sp, color = AmberAccent)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Schedule, contentDescription = null, tint = GoldSecondary, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(ev.date, fontSize = 12.sp, color = GoldSecondary)
                            }
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// TAB 5: MEDIA & CONTENT CATALOG
// -------------------------------------------------------------
@Composable
private fun AdminMediaCatalogTab(
    songs: List<com.example.aliwelekhasia.model.Song>,
    videos: List<com.example.aliwelekhasia.model.Video>,
    devotions: List<com.example.aliwelekhasia.model.Devotion>
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Ministry Content & Catalog Management",
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = "Overview of recorded songs, YouTube videos, and devotional articles",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
        }

        item {
            Text(
                text = "Official Audio Tracks (${songs.size})",
                fontWeight = FontWeight.Bold,
                color = AmberAccent,
                style = MaterialTheme.typography.titleSmall
            )
        }

        items(songs) { song ->
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = NavyPrimary,
                            modifier = Modifier.size(40.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.MusicNote, contentDescription = null, tint = AmberAccent)
                            }
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(song.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                            Text("${song.artist} • ${song.type} (${song.durationSeconds}s)", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Color(0xFF10B981).copy(alpha = 0.15f)
                    ) {
                        Text(
                            text = "PUBLISHED",
                            color = Color(0xFF10B981),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Video Highlights & Sermons (${videos.size})",
                fontWeight = FontWeight.Bold,
                color = AmberAccent,
                style = MaterialTheme.typography.titleSmall
            )
        }

        items(videos) { vid ->
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(vid.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text("${vid.category} • Duration: ${vid.duration}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                    }
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Color(0xFFEF4444).copy(alpha = 0.15f)
                    ) {
                        Text(
                            text = "YOUTUBE",
                            color = Color(0xFFEF4444),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// DIALOGS
// -------------------------------------------------------------
@Composable
private fun AddEventDialog(
    onDismiss: () -> Unit,
    onAdd: (title: String, desc: String, loc: String, date: String, action: String) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Schedule Ministry Event / Crusade", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Event Title") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = location,
                    onValueChange = { location = it },
                    label = { Text("Venue / Location") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = date,
                    onValueChange = { date = it },
                    label = { Text("Date & Time (e.g. Sept 20-22, 2026)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = desc,
                    onValueChange = { desc = it },
                    label = { Text("Description / Purpose") },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (title.isNotBlank() && location.isNotBlank() && date.isNotBlank()) {
                        onAdd(title, desc.ifBlank { "Gospel revival gathering with worship and message." }, location, date, "Details")
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = AmberAccent)
            ) {
                Text("Schedule Event", color = NavyPrimary, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun AddPrayerRequestDialog(
    onDismiss: () -> Unit,
    onAdd: (name: String, email: String, request: String, category: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var request by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Healing & Health") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Record Prayer Request", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Believer's Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = category,
                    onValueChange = { category = it },
                    label = { Text("Category (e.g. Healing, Family, Career)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = request,
                    onValueChange = { request = it },
                    label = { Text("Prayer Details") },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank() && request.isNotBlank()) {
                        onAdd(name, email.ifBlank { "intercessor@aliwelekhasia.com" }, request, category)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = AmberAccent)
            ) {
                Text("Save Request", color = NavyPrimary, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
