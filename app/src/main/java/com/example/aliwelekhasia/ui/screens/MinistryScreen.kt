package com.example.aliwelekhasia.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aliwelekhasia.model.Devotion
import com.example.aliwelekhasia.ui.MainViewModel
import com.example.aliwelekhasia.ui.components.WebsiteFooter
import com.example.aliwelekhasia.ui.theme.AmberAccent
import com.example.aliwelekhasia.ui.theme.GoldSecondary
import com.example.aliwelekhasia.ui.theme.NavyPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MinistryScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val events by viewModel.events.collectAsState()
    val devotions = viewModel.devotions
    val testimonies = viewModel.testimonies

    var selectedDevotion by remember { mutableStateOf<Devotion?>(null) }
    var selectedBookingEvent by remember { mutableStateOf<String?>(null) }

    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .testTag("ministry_screen")
    ) {
        // Header
        Surface(
            color = NavyPrimary,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "MINISTRY & DEVOTIONS",
                    style = MaterialTheme.typography.labelMedium,
                    color = AmberAccent,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Upcoming Events, Devotionals & Testimonies",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Upcoming Events Section
        Text(
            text = "Upcoming Ministry Events",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(8.dp))

        Column(
            modifier = Modifier.padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            events.forEach { event ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = event.title,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Surface(
                                color = GoldSecondary.copy(alpha = 0.15f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = event.date,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = GoldSecondary,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = event.description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Button(
                            onClick = { selectedBookingEvent = event.title },
                            colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                            modifier = Modifier.align(Alignment.End)
                        ) {
                            Icon(Icons.Default.EventAvailable, contentDescription = null, tint = Color.White)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(event.actionText, color = Color.White)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Latest Blog & Devotions
        Text(
            text = "Devotionals & Ministry Articles",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(8.dp))

        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(devotions) { devotion ->
                Card(
                    modifier = Modifier
                        .width(260.dp)
                        .clickable { selectedDevotion = devotion },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = NavyPrimary)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Surface(
                            color = AmberAccent,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = devotion.date,
                                style = MaterialTheme.typography.labelSmall,
                                color = NavyPrimary,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = devotion.title,
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = devotion.summary,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White.copy(alpha = 0.8f),
                            maxLines = 3
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "Read Devotional →",
                            style = MaterialTheme.typography.labelMedium,
                            color = AmberAccent,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Testimonies Section
        Text(
            text = "Life-Changing Testimonies",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(8.dp))

        Column(
            modifier = Modifier.padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            testimonies.forEach { item ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Icon(
                            Icons.Default.FormatQuote,
                            contentDescription = null,
                            tint = GoldSecondary,
                            modifier = Modifier.size(28.dp)
                        )
                        Text(
                            text = item.message,
                            style = MaterialTheme.typography.bodyMedium,
                            lineHeight = 20.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "— ${item.author} (${item.role})",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = GoldSecondary
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Website Footer with Newsletter Form
        WebsiteFooter(viewModel = viewModel)
    }

    // Devotion Reader Dialog
    selectedDevotion?.let { devotion ->
        AlertDialog(
            onDismissRequest = { selectedDevotion = null },
            confirmButton = {
                TextButton(onClick = { selectedDevotion = null }) {
                    Text("Close", color = AmberAccent)
                }
            },
            title = {
                Text(devotion.title, color = Color.White, fontWeight = FontWeight.Bold)
            },
            text = {
                Text(devotion.fullText, color = Color.White.copy(alpha = 0.9f), lineHeight = 22.sp)
            },
            containerColor = NavyPrimary
        )
    }

    // Booking Dialog
    selectedBookingEvent?.let { title ->
        AlertDialog(
            onDismissRequest = { selectedBookingEvent = null },
            confirmButton = {
                Button(
                    onClick = {
                        selectedBookingEvent = null
                        viewModel.selectTab(4) // Direct to contact form
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AmberAccent)
                ) {
                    Text("Go to Booking Form", color = NavyPrimary, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedBookingEvent = null }) {
                    Text("Cancel", color = Color.White)
                }
            },
            title = { Text("Book $title", color = Color.White) },
            text = {
                Text(
                    "Would you like to send a booking inquiry or invitation to host Ali Welekhasia for your $title?",
                    color = Color.White
                )
            },
            containerColor = NavyPrimary
        )
    }
}
