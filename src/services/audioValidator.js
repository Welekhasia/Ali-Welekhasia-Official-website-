/**
 * Audio Validator Service
 * Validates audio file signatures, MIME types, and structural sizes
 */

export const APPROVED_AUDIO_MIMES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
    'audio/ogg',
    'audio/flac'
];

export const MAX_AUDIO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_ARTWORK_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Detect audio format from file buffer magic bytes
 */
export function detectAudioFormat(buffer) {
    if (!buffer || buffer.byteLength < 4) return null;
    const bytes = new Uint8Array(buffer.slice(0, 16));

    // 1. MP3 with ID3v2 container (ID3...)
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
        return { mimeType: 'audio/mpeg', extension: 'mp3', format: 'MP3 (ID3v2)' };
    }

    // 2. MP3 raw sync frame (11 bits set: 0xFF followed by 0xE0 mask)
    if (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) {
        return { mimeType: 'audio/mpeg', extension: 'mp3', format: 'MP3' };
    }

    // 3. WAV (RIFF....WAVE)
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        if (bytes.length >= 12 && bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45) {
            return { mimeType: 'audio/wav', extension: 'wav', format: 'WAV' };
        }
    }

    // 4. MP4 / M4A container (....ftyp)
    if (bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
        return { mimeType: 'audio/mp4', extension: 'm4a', format: 'M4A/MP4' };
    }

    // 5. OGG (OggS)
    if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
        return { mimeType: 'audio/ogg', extension: 'ogg', format: 'OGG Vorbis' };
    }

    // 6. FLAC (fLaC)
    if (bytes[0] === 0x66 && bytes[1] === 0x4C && bytes[2] === 0x61 && bytes[3] === 0x43) {
        return { mimeType: 'audio/flac', extension: 'flac', format: 'FLAC' };
    }

    return null;
}

/**
 * Validates an uploaded audio file buffer and declared MIME
 */
export function validateAudioUpload(buffer, declaredMime = '', originalFilename = '') {
    const size = buffer.byteLength;

    if (size === 0) {
        return { valid: false, error: 'Uploaded file is empty (0 bytes).' };
    }

    if (size > MAX_AUDIO_SIZE_BYTES) {
        return { valid: false, error: `File size (${(size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 100MB.` };
    }

    // Magic bytes signature verification
    const detected = detectAudioFormat(buffer);
    if (!detected) {
        // Fallback: If declared MIME is in approved list and file has an audio extension, permit gracefully
        const cleanMime = declaredMime.toLowerCase().split(';')[0].trim();
        const ext = (originalFilename.split('.').pop() || '').toLowerCase();
        const allowedExts = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'];

        if (APPROVED_AUDIO_MIMES.includes(cleanMime) && allowedExts.includes(ext)) {
            return {
                valid: true,
                mimeType: cleanMime,
                extension: ext,
                format: ext.toUpperCase(),
                fileSize: size
            };
        }

        return {
            valid: false,
            error: 'File signature verification failed: not a recognized valid audio format (expected MP3, WAV, M4A, OGG, or FLAC).'
        };
    }

    return {
        valid: true,
        mimeType: detected.mimeType,
        extension: detected.extension,
        format: detected.format,
        fileSize: size
    };
}
