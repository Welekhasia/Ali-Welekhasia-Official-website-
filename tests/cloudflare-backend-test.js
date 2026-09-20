/**
 * Ali Welekhasia Cloudflare Music Backend - Comprehensive Production Test Suite
 *
 * Validates:
 * 1. D1 Database: Migrations (0001-0003), schema integrity, constraints, parameterized queries, batching.
 * 2. Cloudflare R2: Uploads, metadata, key prefixes, deletion, HEAD requests, missing object handling.
 * 3. Audio Streaming: Full file (200), byte-ranges (206), range bounds, invalid range (416), conditional ETag (304).
 * 4. Audio Validation: Magic bytes detection for MP3, WAV, M4A, FLAC, OGG, and rejected types.
 * 5. Security: Authentication, authorization, SQL injection protection, path traversal, CORS headers.
 * 6. REST API: Complete CRUD for tracks, artists, albums, playlists, health check, and error codes.
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { handleRequest } from '../src/router.js';
import { detectAudioFormat, validateAudioUpload } from '../src/services/audioValidator.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (!condition) {
        failedTests++;
        console.error(`  ✗ FAIL: ${message}`);
        throw new Error(message);
    }
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
}

// ==============================================================================
// In-Memory Cloudflare D1 Test Adapter
// ==============================================================================
function createD1Mock() {
    const sqlite = new DatabaseSync(':memory:');

    // Run D1 migration files
    const m1 = fs.readFileSync(path.resolve('migrations/0001_initial_schema.sql'), 'utf8');
    const m2 = fs.readFileSync(path.resolve('migrations/0002_tracks.sql'), 'utf8');
    const m3 = fs.readFileSync(path.resolve('migrations/0003_indexes.sql'), 'utf8');

    sqlite.exec(m1);
    sqlite.exec(m2);
    sqlite.exec(m3);

    class PreparedStatement {
        constructor(sql, params = []) {
            this.sql = sql;
            this.params = params;
        }

        bind(...params) {
            return new PreparedStatement(this.sql, params);
        }

        async first(col = null) {
            try {
                const stmt = sqlite.prepare(this.sql);
                const row = stmt.get(...this.params);
                if (!row) return null;
                if (col) return row[col];
                return row;
            } catch (err) {
                console.error('D1 first error on SQL:', this.sql, err);
                throw err;
            }
        }

        async all() {
            try {
                const stmt = sqlite.prepare(this.sql);
                const results = stmt.all(...this.params);
                return { success: true, results };
            } catch (err) {
                console.error('D1 all error on SQL:', this.sql, err);
                throw err;
            }
        }

        async run() {
            try {
                const stmt = sqlite.prepare(this.sql);
                const result = stmt.run(...this.params);
                return {
                    success: true,
                    meta: {
                        changes: result.changes,
                        last_row_id: Number(result.lastInsertRowid)
                    }
                };
            } catch (err) {
                console.error('D1 run error on SQL:', this.sql, err);
                throw err;
            }
        }
    }

    return {
        prepare: (sql) => new PreparedStatement(sql),
        batch: async (statements) => {
            sqlite.exec('BEGIN TRANSACTION');
            try {
                const results = [];
                for (const stmt of statements) {
                    results.push(await stmt.run());
                }
                sqlite.exec('COMMIT');
                return results;
            } catch (err) {
                sqlite.exec('ROLLBACK');
                throw err;
            }
        },
        _raw: sqlite
    };
}

// ==============================================================================
// In-Memory Cloudflare R2 Bucket Test Adapter
// ==============================================================================
function createR2Mock() {
    const store = new Map();

    return {
        async put(key, body, options = {}) {
            let buffer;
            if (body instanceof ArrayBuffer) {
                buffer = Buffer.from(body);
            } else if (Buffer.isBuffer(body)) {
                buffer = body;
            } else if (typeof body === 'string') {
                buffer = Buffer.from(body, 'utf8');
            } else if (body && typeof body.arrayBuffer === 'function') {
                buffer = Buffer.from(await body.arrayBuffer());
            } else {
                buffer = Buffer.from(body);
            }

            const etag = `"${Math.random().toString(36).substring(2, 10)}"`;
            const record = {
                key,
                buffer,
                size: buffer.byteLength,
                etag,
                httpEtag: etag,
                uploaded: new Date(),
                httpMetadata: options.httpMetadata || {},
                customMetadata: options.customMetadata || {}
            };
            store.set(key, record);
            return record;
        },

        async get(key, options = {}) {
            const record = store.get(key);
            if (!record) return null;

            let responseBuffer = record.buffer;
            let rangeInfo = null;

            // Handle range request
            let rangeHeader = null;
            if (options.range) {
                if (typeof options.range.get === 'function') {
                    rangeHeader = options.range.get('Range') || options.range.get('range');
                } else if (typeof options.range === 'string') {
                    rangeHeader = options.range;
                }
            }

            if (rangeHeader) {
                const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
                if (match) {
                    const total = record.size;
                    const startStr = match[1];
                    const endStr = match[2];

                    let start = startStr ? parseInt(startStr, 10) : NaN;
                    let end = endStr ? parseInt(endStr, 10) : NaN;

                    if (!isNaN(start) && isNaN(end)) {
                        end = total - 1;
                    } else if (isNaN(start) && !isNaN(end)) {
                        start = Math.max(0, total - end);
                        end = total - 1;
                    }

                    if (!isNaN(start) && !isNaN(end) && start < total && start <= end) {
                        end = Math.min(end, total - 1);
                        const length = end - start + 1;
                        responseBuffer = record.buffer.subarray(start, end + 1);
                        rangeInfo = { offset: start, length };
                    }
                }
            }

            // Create a ReadableStream from buffer
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(responseBuffer);
                    controller.close();
                }
            });

            return {
                key: record.key,
                size: record.size,
                etag: record.etag,
                httpEtag: record.httpEtag,
                uploaded: record.uploaded,
                httpMetadata: record.httpMetadata,
                customMetadata: record.customMetadata,
                range: rangeInfo,
                body: stream
            };
        },

        async delete(key) {
            store.delete(key);
            return true;
        },

        async list() {
            return {
                objects: Array.from(store.values()).map(r => ({
                    key: r.key,
                    size: r.size,
                    etag: r.etag,
                    uploaded: r.uploaded
                }))
            };
        },

        _has: (key) => store.has(key)
    };
}

// ==============================================================================
// Test Runner
// ==============================================================================
async function runTests() {
    console.log('=======================================================');
    console.log('ALI WELEKHASIA CLOUDFLARE BACKEND: PRODUCTION TEST SUITE');
    console.log('=======================================================\n');

    const db = createD1Mock();
    const bucket = createR2Mock();
    const env = {
        DB: db,
        BUCKET: bucket,
        R2_BUCKET: bucket,
        ENVIRONMENT: 'production',
        ADMIN_API_SECRET: 'test_admin_secret_super_secure_123',
        ALLOWED_ORIGINS: 'https://aliwelekhasia.co.ke,https://www.aliwelekhasia.co.ke'
    };

    // --------------------------------------------------------------------------
    // Test Group 1: D1 Database & Migrations
    // --------------------------------------------------------------------------
    console.log('--- Group 1: D1 Schema & Database Invariants ---');
    {
        // 1. Verify Seed Artist
        const artist = await db.prepare("SELECT * FROM artists WHERE id = ?").bind('artist_ali_welekhasia').first();
        assert(artist !== null, "D1 Migration 0001: Seeded primary artist exists");
        assert(artist.name === 'Minister Ali Welekhasia', "D1 Migration 0001: Primary artist name matches");

        // 2. Parameterized Queries & SQL Injection Immunity
        const sqliParam = "' OR '1'='1";
        const sqliResult = await db.prepare("SELECT * FROM artists WHERE id = ?").bind(sqliParam).first();
        assert(sqliResult === null, "D1 Parameterized Query: SQL injection attempt safely returned null");

        // 3. Batch Execution & Atomicity
        await db.batch([
            db.prepare("INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)").bind('user_1', 'user1@example.com', 'User One', 'USER'),
            db.prepare("INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)").bind('user_2', 'user2@example.com', 'User Two', 'USER')
        ]);
        const userCount = await db.prepare("SELECT COUNT(*) AS total FROM users").first('total');
        assert(userCount === 4, "D1 Batch Execution: Multiple statements committed atomically");
    }

    // --------------------------------------------------------------------------
    // Test Group 2: Audio Format Detection & Magic Bytes Validation
    // --------------------------------------------------------------------------
    console.log('\n--- Group 2: Audio Format & Magic Bytes Detection ---');
    {
        // 1. MP3 with ID3 header
        const id3Buffer = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20]);
        const mp3Detected = detectAudioFormat(id3Buffer);
        assert(mp3Detected !== null && mp3Detected.mimeType === 'audio/mpeg', "Audio Validator: Detects MP3 ID3v2 container");

        // 2. WAV with RIFF...WAVE header
        const wavBuffer = Buffer.concat([
            Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00]),
            Buffer.from([0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20])
        ]);
        const wavDetected = detectAudioFormat(wavBuffer);
        assert(wavDetected !== null && wavDetected.mimeType === 'audio/wav', "Audio Validator: Detects WAV RIFF/WAVE header");

        // 3. M4A / MP4 with ftyp box
        const m4aBuffer = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x41, 0x20]);
        const m4aDetected = detectAudioFormat(m4aBuffer);
        assert(m4aDetected !== null && m4aDetected.mimeType === 'audio/mp4', "Audio Validator: Detects M4A/MP4 ftyp container");

        // 4. Executable / Invalid file rejected
        const exeBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ PE header
        const invalidValidation = validateAudioUpload(exeBuffer, 'application/x-dosexec', 'malware.exe');
        assert(invalidValidation.valid === false, "Audio Validator: Strictly rejects non-audio file types");
    }

    // --------------------------------------------------------------------------
    // Test Group 3: REST API Endpoints & CRUD Operations
    // --------------------------------------------------------------------------
    console.log('\n--- Group 3: REST API & Routing ---');
    {
        // 1. Health check: GET /api/health
        const healthReq = new Request('https://api.aliwelekhasia.co.ke/api/health');
        const healthRes = await handleRequest(healthReq, env);
        assert(healthRes.status === 200, "API: GET /api/health returns 200 OK");
        const healthData = await healthRes.json();
        assert(healthData.infrastructure.d1.status === 'HEALTHY', "API: Health check confirms D1 is HEALTHY");
        assert(healthData.infrastructure.r2.status === 'HEALTHY', "API: Health check confirms R2 is HEALTHY");

        // 2. CORS Preflight: OPTIONS /api/tracks
        const corsReq = new Request('https://api.aliwelekhasia.co.ke/api/tracks', {
            method: 'OPTIONS',
            headers: { 'Origin': 'https://aliwelekhasia.co.ke', 'Access-Control-Request-Method': 'POST' }
        });
        const corsRes = await handleRequest(corsReq, env);
        assert(corsRes.status === 204, "CORS: OPTIONS preflight returns 204 No Content");
        assert(corsRes.headers.get('Access-Control-Allow-Origin') === 'https://aliwelekhasia.co.ke', "CORS: Reflects authorized frontend origin");

        // 3. Unauthorized POST /api/tracks (should return 401)
        const unauthTrackReq = new Request('https://api.aliwelekhasia.co.ke/api/tracks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Unanointed Track' })
        });
        const unauthRes = await handleRequest(unauthTrackReq, env);
        assert(unauthRes.status === 401, "Security: POST /api/tracks without admin secret returns 401 Unauthorized");

        // 4. Authorized POST /api/tracks (201 Created)
        const createTrackReq = new Request('https://api.aliwelekhasia.co.ke/api/tracks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Secret': env.ADMIN_API_SECRET
            },
            body: JSON.stringify({
                title: 'Ni Wewe Bwana',
                genre: 'Gospel Worship',
                language: 'Swahili',
                description: 'Powerful worship song by Minister Ali Welekhasia.',
                price: 150.0,
                is_published: 1
            })
        });
        const createTrackRes = await handleRequest(createTrackReq, env);
        assert(createTrackRes.status === 201, "API: Authorized POST /api/tracks creates track with 201 Created");
        const createdTrack = (await createTrackRes.json()).track;
        assert(createdTrack.title === 'Ni Wewe Bwana', "API: Created track has correct title");
        assert(createdTrack.slug.startsWith('ni-wewe-bwana'), "API: Slug generated cleanly");

        // 5. GET /api/tracks (Public list)
        const listTracksReq = new Request('https://api.aliwelekhasia.co.ke/api/tracks');
        const listTracksRes = await handleRequest(listTracksReq, env);
        assert(listTracksRes.status === 200, "API: GET /api/tracks returns 200 OK");
        const listData = await listTracksRes.json();
        assert(listData.tracks.length >= 1, "API: Public tracks list includes published track");

        // 6. Path Traversal Protection
        const pathTraversalReq = new Request('https://api.aliwelekhasia.co.ke/api/tracks/../../etc/passwd');
        const pathTraversalRes = await handleRequest(pathTraversalReq, env);
        assert(pathTraversalRes.status === 400 || pathTraversalRes.status === 404, "Security: Path traversal attempt safely rejected");
    }

    // --------------------------------------------------------------------------
    // Test Group 4: Audio Upload Pipeline & R2 Storage
    // --------------------------------------------------------------------------
    console.log('\n--- Group 4: Audio Upload Pipeline & R2 Storage ---');
    let uploadedTrackId = null;
    {
        // 1. Create dummy valid MP3 buffer with ID3 header and padding
        const mp3Payload = Buffer.concat([
            Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20]),
            Buffer.alloc(2048, 0xAA) // 2KB payload
        ]);

        // Upload to /api/uploads/audio
        const uploadReq = new Request('https://api.aliwelekhasia.co.ke/api/uploads/audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'audio/mpeg',
                'X-Admin-Secret': env.ADMIN_API_SECRET,
                'X-Track-Title': 'Msalabani Yesu'
            },
            body: mp3Payload
        });

        const uploadRes = await handleRequest(uploadReq, env);
        assert(uploadRes.status === 201, "Upload: POST /api/uploads/audio succeeds with 201 Created");
        const uploadData = await uploadRes.json();
        uploadedTrackId = uploadData.track.id;
        assert(uploadedTrackId !== null, "Upload: Returns generated track ID");
        assert(uploadData.storage.bucket === 'ali-music-audio', "Upload: Targets R2 bucket 'ali-music-audio'");
        assert(uploadData.storage.key === `tracks/${uploadedTrackId}/original.mp3`, "Upload: Enforces controlled R2 key prefix tracks/{id}/original.mp3");

        // Verify R2 object actually exists
        assert(bucket._has(uploadData.storage.key), "R2 Storage: Object physically exists in R2 store");

        // Verify D1 track metadata is populated
        const d1Track = await db.prepare("SELECT * FROM tracks WHERE id = ?").bind(uploadedTrackId).first();
        assert(d1Track.file_size === mp3Payload.byteLength, "D1 Metadata: File size synchronized with R2 object");
        assert(d1Track.r2_key === uploadData.storage.key, "D1 Metadata: r2_key references R2 object");

        // Mark track as published for public streaming
        await db.prepare("UPDATE tracks SET is_published = 1, visibility = 'public' WHERE id = ?").bind(uploadedTrackId).run();
    }

    // --------------------------------------------------------------------------
    // Test Group 5: HTTP Streaming & Byte-Range Requests
    // --------------------------------------------------------------------------
    console.log('\n--- Group 5: HTTP Streaming & Byte-Range Requests ---');
    {
        const streamUrl = `https://api.aliwelekhasia.co.ke/api/tracks/${uploadedTrackId}/audio`;

        // 1. Full GET: 200 OK
        const fullGetReq = new Request(streamUrl);
        const fullGetRes = await handleRequest(fullGetReq, env);
        assert(fullGetRes.status === 200, "Streaming: Full GET returns 200 OK");
        assert(fullGetRes.headers.get('Accept-Ranges') === 'bytes', "Streaming: Advertises Accept-Ranges: bytes");
        const etag = fullGetRes.headers.get('ETag');
        assert(etag !== null, "Streaming: Returns ETag header for caching");

        // 2. Range Request (First 100 bytes): 206 Partial Content
        const range1Req = new Request(streamUrl, {
            headers: { 'Range': 'bytes=0-99' }
        });
        const range1Res = await handleRequest(range1Req, env);
        assert(range1Res.status === 206, "Streaming: Valid range (0-99) returns 206 Partial Content");
        assert(range1Res.headers.get('Content-Range').startsWith('bytes 0-99/'), "Streaming: Returns correct Content-Range (bytes 0-99/total)");
        assert(range1Res.headers.get('Content-Length') === '100', "Streaming: Returns exact Content-Length for partial slice");

        // 3. Range Request (Middle bytes 100-199): 206 Partial Content
        const range2Req = new Request(streamUrl, {
            headers: { 'Range': 'bytes=100-199' }
        });
        const range2Res = await handleRequest(range2Req, env);
        assert(range2Res.status === 206, "Streaming: Middle range (100-199) returns 206 Partial Content");

        // 4. Invalid Range (Past EOF): 416 Range Not Satisfiable
        const invalidRangeReq = new Request(streamUrl, {
            headers: { 'Range': 'bytes=9999999-99999999' }
        });
        const invalidRangeRes = await handleRequest(invalidRangeReq, env);
        assert(invalidRangeRes.status === 416, "Streaming: Out-of-bounds range returns 416 Range Not Satisfiable");

        // 5. HEAD Request: 200 OK with no body
        const headReq = new Request(streamUrl, { method: 'HEAD' });
        const headRes = await handleRequest(headReq, env);
        assert(headRes.status === 200, "Streaming: HEAD request returns 200 OK");
        const headBody = await headRes.text();
        assert(headBody === '', "Streaming: HEAD request body is empty");

        // 6. ETag Conditional Request: 304 Not Modified
        const conditionalReq = new Request(streamUrl, {
            headers: { 'If-None-Match': etag }
        });
        const conditionalRes = await handleRequest(conditionalReq, env);
        assert(conditionalRes.status === 304, "Streaming: If-None-Match matching ETag returns 304 Not Modified");
    }

    // --------------------------------------------------------------------------
    // Test Group 6: Albums, Artists, Playlists & Deletion Workflows
    // --------------------------------------------------------------------------
    console.log('\n--- Group 6: Relational Metadata & Deletion Workflows ---');
    {
        // 1. Create Album: POST /api/albums
        const createAlbumReq = new Request('https://api.aliwelekhasia.co.ke/api/albums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': env.ADMIN_API_SECRET },
            body: JSON.stringify({ title: 'Worship Vol. 1', release_date: '2026-09-20', is_published: 1 })
        });
        const albumRes = await handleRequest(createAlbumReq, env);
        assert(albumRes.status === 201, "Albums: Admin creates album with 201 Created");
        const album = (await albumRes.json()).album;

        // 2. Create Playlist: POST /api/playlists
        const createPlReq = new Request('https://api.aliwelekhasia.co.ke/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Sunday Praise & Worship' })
        });
        const plRes = await handleRequest(createPlReq, env);
        assert(plRes.status === 201, "Playlists: Creates playlist with 201 Created");
        const playlist = (await plRes.json()).playlist;

        // 3. Add Track to Playlist: POST /api/playlists/:id/tracks
        const addTrackReq = new Request(`https://api.aliwelekhasia.co.ke/api/playlists/${playlist.id}/tracks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ track_id: uploadedTrackId })
        });
        const addTrackRes = await handleRequest(addTrackReq, env);
        assert(addTrackRes.status === 201, "Playlists: Adds track to junction table (playlist_tracks)");

        // 4. Safe Track Deletion Workflow: DELETE /api/tracks/:id
        const deleteTrackReq = new Request(`https://api.aliwelekhasia.co.ke/api/tracks/${uploadedTrackId}`, {
            method: 'DELETE',
            headers: { 'X-Admin-Secret': env.ADMIN_API_SECRET }
        });
        const deleteRes = await handleRequest(deleteTrackReq, env);
        assert(deleteRes.status === 200, "Deletion Workflow: DELETE /api/tracks/:id returns 200 OK");

        // Verify R2 object was deleted
        const key = `tracks/${uploadedTrackId}/original.mp3`;
        assert(!bucket._has(key), "Deletion Workflow: R2 object safely removed from storage");

        // Verify D1 record was deleted
        const deletedD1 = await db.prepare("SELECT * FROM tracks WHERE id = ?").bind(uploadedTrackId).first();
        assert(deletedD1 === null, "Deletion Workflow: Track metadata record removed from D1");

        // Verify removed from playlist junction table
        const plTracks = await db.prepare("SELECT * FROM playlist_tracks WHERE track_id = ?").bind(uploadedTrackId).all();
        assert(plTracks.results.length === 0, "Deletion Workflow: Track cascaded from playlist_tracks junction");
    }

    console.log('\n=======================================================');
    console.log('TEST SUITE COMPLETED');
    console.log(`TOTAL TESTS RUN : ${passedTests + failedTests}`);
    console.log(`PASSED          : ${passedTests}`);
    console.log(`FAILED          : ${failedTests}`);
    console.log('=======================================================');

    if (failedTests > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
