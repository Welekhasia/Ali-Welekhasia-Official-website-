package com.example.aliwelekhasia.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aliwelekhasia.R
import com.example.aliwelekhasia.ui.MainViewModel
import com.example.aliwelekhasia.ui.theme.AmberAccent
import com.example.aliwelekhasia.ui.theme.GoldSecondary
import com.example.aliwelekhasia.ui.theme.NavyPrimary

@Composable
fun WebsiteFooter(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var emailInput by remember { mutableStateOf("") }
    val newsletterMsg by viewModel.newsletterMessage.collectAsState()

    Surface(
        color = NavyPrimary,
        modifier = modifier
            .fillMaxWidth()
            .testTag("website_footer")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // ================= NEWSLETTER CARD =================
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("newsletter_card"),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Surface(
                        color = AmberAccent,
                        shape = CircleShape,
                        modifier = Modifier.size(48.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.MarkEmailRead,
                                contentDescription = null,
                                tint = NavyPrimary,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "SUBSCRIBE TO OUR NEWSLETTER",
                        style = MaterialTheme.typography.labelMedium,
                        color = AmberAccent,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "Stay Updated with Gospel News & Music",
                        style = MaterialTheme.typography.titleLarge,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Be the first to receive new music releases, concert tour announcements, devotionals, and ministry updates directly in your inbox.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.8f),
                        textAlign = TextAlign.Center,
                        lineHeight = 20.sp
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Input & Button Form
                    OutlinedTextField(
                        value = emailInput,
                        onValueChange = { emailInput = it },
                        placeholder = { Text("Enter your email address...", color = Color.Gray) },
                        leadingIcon = {
                            Icon(Icons.Default.Email, contentDescription = null, tint = AmberAccent)
                        },
                        trailingIcon = {
                            if (emailInput.isNotEmpty()) {
                                IconButton(onClick = { emailInput = "" }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Clear", tint = Color.Gray)
                                }
                            }
                        },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AmberAccent,
                            unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedContainerColor = NavyPrimary.copy(alpha = 0.5f),
                            unfocusedContainerColor = NavyPrimary.copy(alpha = 0.5f)
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("newsletter_email_input")
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            if (emailInput.isNotBlank()) {
                                viewModel.subscribeToNewsletter(emailInput)
                                emailInput = ""
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AmberAccent),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("newsletter_subscribe_btn")
                    ) {
                        Icon(Icons.Default.Send, contentDescription = null, tint = NavyPrimary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "SUBSCRIBE NOW",
                            color = NavyPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }

                    newsletterMsg?.let { msg ->
                        Spacer(modifier = Modifier.height(12.dp))
                        Surface(
                            color = GoldSecondary.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = msg,
                                    color = AmberAccent,
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.Medium,
                                    modifier = Modifier.weight(1f)
                                )
                                IconButton(
                                    onClick = { viewModel.clearNewsletterMessage() },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(Icons.Default.Close, contentDescription = "Dismiss", tint = Color.White)
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // ================= FOOTER LINKS & BRANDING =================
            Image(
                painter = painterResource(id = R.drawable.ic_launcher_foreground),
                contentDescription = "Logo",
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "ALI WELEKHASIA MUSIC",
                style = MaterialTheme.typography.titleLarge,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )

            Text(
                text = "Proclaiming Christ Through Worship, Music & Ministry",
                style = MaterialTheme.typography.bodySmall,
                color = AmberAccent,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(20.dp))

            HorizontalDivider(color = Color.White.copy(alpha = 0.15f))

            Spacer(modifier = Modifier.height(20.dp))

            // Quick Navigation Row
            Text(
                text = "WEBSITE NAVIGATION",
                style = MaterialTheme.typography.labelSmall,
                color = Color.White.copy(alpha = 0.6f),
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Text(
                    text = "Home",
                    color = Color.White,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier
                        .clickable { viewModel.selectTab(0) }
                        .padding(4.dp)
                )
                Text(
                    text = "Music",
                    color = Color.White,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier
                        .clickable { viewModel.selectTab(1) }
                        .padding(4.dp)
                )
                Text(
                    text = "Videos",
                    color = Color.White,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier
                        .clickable { viewModel.selectTab(2) }
                        .padding(4.dp)
                )
                Text(
                    text = "Ministry",
                    color = Color.White,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier
                        .clickable { viewModel.selectTab(3) }
                        .padding(4.dp)
                )
                Text(
                    text = "Connect",
                    color = Color.White,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier
                        .clickable { viewModel.selectTab(4) }
                        .padding(4.dp)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            HorizontalDivider(color = Color.White.copy(alpha = 0.15f))

            Spacer(modifier = Modifier.height(20.dp))

            // Contact Info
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.clickable {
                    val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:ali.werekhasia01@gmail.com"))
                    context.startActivity(intent)
                }
            ) {
                Icon(Icons.Default.Email, contentDescription = null, tint = AmberAccent, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("ali.werekhasia01@gmail.com", color = Color.White, style = MaterialTheme.typography.bodySmall)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.clickable {
                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:+254736024024"))
                    context.startActivity(intent)
                }
            ) {
                Icon(Icons.Default.Phone, contentDescription = null, tint = AmberAccent, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("+254 736 024 024", color = Color.White, style = MaterialTheme.typography.bodySmall)
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Social Media Buttons
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://youtube.com/@aliwelekhasia?si=6w-rHCcN9Tb8PRVo"))
                        context.startActivity(intent)
                    }
                ) {
                    Icon(Icons.Default.OndemandVideo, contentDescription = "YouTube", tint = AmberAccent)
                }

                IconButton(
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.facebook.com/aliwelekhasia"))
                        context.startActivity(intent)
                    }
                ) {
                    Icon(Icons.Default.Share, contentDescription = "Facebook", tint = AmberAccent)
                }

                IconButton(
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://youtube.com/@aliwelekhasia?si=6w-rHCcN9Tb8PRVo"))
                        context.startActivity(intent)
                    }
                ) {
                    Icon(Icons.Default.Language, contentDescription = "Website", tint = AmberAccent)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "© 2026 Ali Welekhasia Gospel Music & Ministry. All Rights Reserved.",
                style = MaterialTheme.typography.labelSmall,
                color = Color.White.copy(alpha = 0.5f),
                textAlign = TextAlign.Center
            )
        }
    }
}
