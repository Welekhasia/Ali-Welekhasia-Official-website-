-- ==============================================================================
-- ALI WELEKHASIA OFFICIAL MUSIC PLATFORM
-- D1 Database Migration: 0002_tracks.sql
-- Database: ali-welekhasia-production-db (55bae613-dfba-4c87-ad76-48f4c5d0b6c7)
-- ==============================================================================

-- Tracks Table
-- Links relational metadata to private Cloudflare R2 object keys
CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    artist_id TEXT REFERENCES artists(id) ON DELETE SET NULL,
    album_id TEXT REFERENCES albums(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    genre TEXT NOT NULL DEFAULT 'Gospel',
    language TEXT NOT NULL DEFAULT 'Swahili',
    duration REAL NOT NULL DEFAULT 0,            -- in seconds
    file_size INTEGER NOT NULL DEFAULT 0,         -- in bytes
    mime_type TEXT NOT NULL,                      -- e.g. audio/mpeg, audio/wav, audio/mp4
    r2_key TEXT NOT NULL,                         -- e.g. tracks/{id}/original.mp3
    artwork_key TEXT,                             -- e.g. artwork/{id}/cover.jpg
    preview_key TEXT,                             -- e.g. previews/{id}/preview.mp3
    master_key TEXT,                              -- e.g. masters/{id}/master.wav
    is_published INTEGER NOT NULL DEFAULT 0,      -- 0 = draft, 1 = published
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
    price REAL NOT NULL DEFAULT 100.0,
    currency TEXT NOT NULL DEFAULT 'KES',
    play_count INTEGER NOT NULL DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    published_at TEXT
);
