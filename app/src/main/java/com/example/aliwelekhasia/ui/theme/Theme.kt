package com.example.aliwelekhasia.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView

val NavyPrimary = Color(0xFF0F172A)
val GoldSecondary = Color(0xFFD97706)
val AmberAccent = Color(0xFFF59E0B)
val LightBg = Color(0xFFF8FAFC)
val DarkBg = Color(0xFF090D16)
val CardLight = Color(0xFFFFFFFF)
val CardDark = Color(0xFF1E293B)

private val LightColorScheme = lightColorScheme(
    primary = NavyPrimary,
    onPrimary = Color.White,
    secondary = GoldSecondary,
    onSecondary = Color.White,
    tertiary = AmberAccent,
    background = LightBg,
    surface = CardLight,
    onBackground = Color(0xFF1E293B),
    onSurface = Color(0xFF0F172A),
    primaryContainer = Color(0xFFE2E8F0),
    onPrimaryContainer = Color(0xFF0F172A)
)

private val DarkColorScheme = darkColorScheme(
    primary = AmberAccent,
    onPrimary = Color.Black,
    secondary = GoldSecondary,
    onSecondary = Color.White,
    tertiary = AmberAccent,
    background = DarkBg,
    surface = CardDark,
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF8FAFC),
    primaryContainer = Color(0xFF1E293B),
    onPrimaryContainer = Color(0xFFF8FAFC)
)

@Composable
fun AliWelekhasiaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
