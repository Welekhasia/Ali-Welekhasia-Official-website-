-- ==============================================================================
-- ALI WELEKHASIA OFFICIAL MUSIC PLATFORM
-- D1 Database Migration: 0001_initial_schema.sql
-- Database: ali-welekhasia-production-db (55bae613-dfba-4c87-ad76-48f4c5d0b6c7)
-- ==============================================================================

-- 1. Artists Table
CREATE TABLE IF NOT EXISTS artists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    website TEXT,
    is_verified INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Albums Table
CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,
    artist_id TEXT REFERENCES artists(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    release_date TEXT,
    artwork_key TEXT,
    genre TEXT DEFAULT 'Gospel',
    is_published INTEGER NOT NULL DEFAULT 0,
    total_tracks INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ARTIST', 'ADMIN', 'SUPER_ADMIN')),
    avatar_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Playlists Table
CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_public INTEGER NOT NULL DEFAULT 1,
    artwork_key TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Playlist Tracks Junction Table
CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (playlist_id, track_id)
);

-- 6. Structured Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT, -- JSON string representation
    ip_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed primary artist record if not present
INSERT OR IGNORE INTO artists (id, name, slug, bio, is_verified)
VALUES (
    'artist_ali_welekhasia',
    'Minister Ali Welekhasia',
    'ali-welekhasia',
    'Anointed gospel minister, worship leader, and gospel recording artist proclaiming Jesus Christ across Kenya and worldwide.',
    1
);

-- Seed system and public user records for foreign key integrity
INSERT OR IGNORE INTO users (id, email, name, role)
VALUES 
    ('user_system', 'system@aliwelekhasia.co.ke', 'System Administrator', 'SUPER_ADMIN'),
    ('user_public', 'public@aliwelekhasia.co.ke', 'Public Guest Listener', 'USER');

