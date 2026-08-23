package com.example.aliwelekhasia.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aliwelekhasia.ui.MainViewModel
import com.example.aliwelekhasia.ui.components.WebsiteFooter
import com.example.aliwelekhasia.ui.theme.AmberAccent
import com.example.aliwelekhasia.ui.theme.GoldSecondary
import com.example.aliwelekhasia.ui.theme.NavyPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConnectScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier,
    onOpenAdmin: () -> Unit = {}
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    var activeTab by remember { mutableStateOf(0) } // 0: Prayer, 1: Contact, 2: Donate, 3: Shop

    // Prayer form fields
    var prayerName by remember { mutableStateOf("") }
    var prayerEmail by remember { mutableStateOf("") }
    var prayerText by remember { mutableStateOf("") }

    // Contact form fields
    var contactName by remember { mutableStateOf("") }
    var contactEmail by remember { mutableStateOf("") }
    var contactPhone by remember { mutableStateOf("") }
    var contactMessage by remember { mutableStateOf("") }

    val prayerRequests by viewModel.prayerRequests.collectAsState()
    val userMsg by viewModel.userMessage.collectAsState()

    var showDonationDialog by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .testTag("connect_screen")
    ) {
        // Top Header
        Surface(
            color = NavyPrimary,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "CONNECT & SUPPORT",
                    style = MaterialTheme.typography.labelMedium,
                    color = AmberAccent,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Prayer, Booking, Shop & Giving",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(12.dp))

                ScrollableTabRow(
                    selectedTabIndex = activeTab,
                    containerColor = Color.Transparent,
                    contentColor = AmberAccent,
                    edgePadding = 0.dp
                ) {
                    Tab(
                        selected = activeTab == 0,
                        onClick = { activeTab = 0 },
                        text = { Text("Prayer Request") },
                        modifier = Modifier.testTag("tab_prayer")
                    )
                    Tab(
                        selected = activeTab == 1,
                        onClick = { activeTab = 1 },
                        text = { Text("Contact Us") },
                        modifier = Modifier.testTag("tab_contact")
                    )
                    Tab(
                        selected = activeTab == 2,
                        onClick = { activeTab = 2 },
                        text = { Text("Support & Giving") },
                        modifier = Modifier.testTag("tab_donate")
                    )
                    Tab(
                        selected = activeTab == 3,
                        onClick = { activeTab = 3 },
                        text = { Text("Official Store") },
                        modifier = Modifier.testTag("tab_shop")
                    )
                }
            }
        }

        userMsg?.let { msg ->
            Surface(
                color = AmberAccent,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(msg, color = NavyPrimary, fontWeight = FontWeight.Bold)
                    IconButton(onClick = { viewModel.clearUserMessage() }) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = NavyPrimary)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        when (activeTab) {
            0 -> {
                // PRAYER REQUEST FORM
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.VolunteerActivism, contentDescription = null, tint = GoldSecondary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Submit Prayer Request",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Text(
                            text = "We believe in the power of prayer. Share your prayer request and we'll stand with you in faith.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = prayerName,
                            onValueChange = { prayerName = it },
                            label = { Text("Your Name") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("prayer_input_name"),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = prayerEmail,
                            onValueChange = { prayerEmail = it },
                            label = { Text("Your Email") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("prayer_input_email"),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = prayerText,
                            onValueChange = { prayerText = it },
                            label = { Text("Type your prayer request here...") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .testTag("prayer_input_text")
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = {
                                if (prayerName.isNotBlank() && prayerText.isNotBlank()) {
                                    viewModel.submitPrayerRequest(prayerName, prayerEmail, prayerText)
                                    prayerName = ""
                                    prayerEmail = ""
                                    prayerText = ""
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("submit_prayer_btn")
                        ) {
                            Icon(Icons.Default.Send, contentDescription = null, tint = Color.White)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Send Prayer Request", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                if (prayerRequests.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(20.dp))
                    Text(
                        text = "Submitted Prayer Requests",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Column(
                        modifier = Modifier.padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        prayerRequests.forEach { req ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = NavyPrimary.copy(alpha = 0.05f))
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(req.name, fontWeight = FontWeight.Bold, color = GoldSecondary)
                                    Text(req.request, style = MaterialTheme.typography.bodyMedium)
                                }
                            }
                        }
                    }
                }
            }

            1 -> {
                // CONTACT US FORM
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.ContactSupport, contentDescription = null, tint = GoldSecondary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Contact & Booking Inquiry",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Text(
                            text = "We'd love to hear from you. Book Ali Welekhasia or send us a message.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = contactName,
                            onValueChange = { contactName = it },
                            label = { Text("Full Name") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("contact_input_name"),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = contactEmail,
                            onValueChange = { contactEmail = it },
                            label = { Text("Email Address") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("contact_input_email"),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = contactPhone,
                            onValueChange = { contactPhone = it },
                            label = { Text("Phone Number") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("contact_input_phone"),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = contactMessage,
                            onValueChange = { contactMessage = it },
                            label = { Text("Write your message...") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .testTag("contact_input_message")
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = {
                                if (contactName.isNotBlank() && contactMessage.isNotBlank()) {
                                    viewModel.submitContactMessage(contactName, contactEmail, contactPhone, contactMessage)
                                    contactName = ""
                                    contactEmail = ""
                                    contactPhone = ""
                                    contactMessage = ""
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("submit_contact_btn")
                        ) {
                            Icon(Icons.Default.Send, contentDescription = null, tint = Color.White)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Send Message", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Direct Contact Info Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = NavyPrimary)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text(
                            text = "DIRECT CONTACT DETAILS",
                            style = MaterialTheme.typography.labelSmall,
                            color = AmberAccent,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:ali.werekhasia01@gmail.com"))
                                    context.startActivity(intent)
                                },
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Email, contentDescription = null, tint = AmberAccent)
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("ali.werekhasia01@gmail.com", color = Color.White)
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:+254736024024"))
                                    context.startActivity(intent)
                                },
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Phone, contentDescription = null, tint = AmberAccent)
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("+254 736 024 024", color = Color.White)
                        }
                    }
                }
            }

            2 -> {
                // SUPPORT & GIVING
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = NavyPrimary)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text(
                            text = "SUPPORT THE MINISTRY",
                            style = MaterialTheme.typography.labelMedium,
                            color = AmberAccent,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = "Partner with Ali Welekhasia Music",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "Your generosity helps us spread the Gospel through worship music, crusades, community outreach, and digital media production across Kenya and beyond.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White.copy(alpha = 0.9f),
                            lineHeight = 20.sp
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = { showDonationDialog = "M-Pesa" },
                            colors = ButtonDefaults.buttonColors(containerColor = AmberAccent),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("give_mpesa_btn")
                        ) {
                            Icon(Icons.Default.AccountBalanceWallet, contentDescription = null, tint = NavyPrimary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("M-Pesa Giving (+254 736 024 024)", color = NavyPrimary, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Button(
                            onClick = { showDonationDialog = "PayPal" },
                            colors = ButtonDefaults.buttonColors(containerColor = GoldSecondary),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("give_paypal_btn")
                        ) {
                            Icon(Icons.Default.Payment, contentDescription = null, tint = Color.White)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("PayPal / International Giving", color = Color.White, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedButton(
                            onClick = { showDonationDialog = "Bank Transfer" },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("give_bank_btn")
                        ) {
                            Icon(Icons.Default.AccountBalance, contentDescription = null, tint = Color.White)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Direct Bank Transfer")
                        }
                    }
                }
            }

            3 -> {
                // OFFICIAL STORE
                Text(
                    text = "Official Store & Merchandise",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Column(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    viewModel.products.forEach { item ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = when (item.category) {
                                        "Music" -> Icons.Default.LibraryMusic
                                        "Apparel" -> Icons.Default.Checkroom
                                        else -> Icons.Default.ShoppingBag
                                    },
                                    contentDescription = null,
                                    tint = GoldSecondary,
                                    modifier = Modifier.size(40.dp)
                                )

                                Spacer(modifier = Modifier.width(16.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(item.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                    Text(item.subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                                }

                                Surface(
                                    color = AmberAccent.copy(alpha = 0.2f),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        item.status,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = GoldSecondary,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Admin & Ministry Dashboard Portal Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = NavyPrimary)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = AmberAccent.copy(alpha = 0.2f),
                        modifier = Modifier.size(44.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.AdminPanelSettings, contentDescription = null, tint = AmberAccent)
                        }
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "ADMIN DASHBOARD",
                            fontWeight = FontWeight.Bold,
                            color = AmberAccent,
                            style = MaterialTheme.typography.labelSmall
                        )
                        Text(
                            text = "Ministry Operations & Inquiries",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            style = MaterialTheme.typography.titleSmall
                        )
                    }
                }

                Button(
                    onClick = onOpenAdmin,
                    colors = ButtonDefaults.buttonColors(containerColor = AmberAccent),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.testTag("btn_open_admin_portal")
                ) {
                    Text("Open Portal", color = NavyPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Website Footer with Newsletter Form
        WebsiteFooter(viewModel = viewModel)
    }

    // Donation details modal
    showDonationDialog?.let { method ->
        AlertDialog(
            onDismissRequest = { showDonationDialog = null },
            confirmButton = {
                TextButton(onClick = { showDonationDialog = null }) {
                    Text("Close", color = AmberAccent)
                }
            },
            title = { Text("$method Support Details", color = Color.White) },
            text = {
                val details = when (method) {
                    "M-Pesa" -> "Send directly via M-Pesa to:\nPhone Number: +254 736 024 024\nAccount Name: Ali Welekhasia Music"
                    "PayPal" -> "PayPal Giving / Inquiries:\nali.werekhasia01@gmail.com"
                    else -> "Bank Name: Equity Bank Kenya\nAccount Name: Ali Welekhasia Ministry\nPhone Contact: +254 736 024 024"
                }
                Text(details, color = Color.White, lineHeight = 22.sp)
            },
            containerColor = NavyPrimary
        )
    }
}
