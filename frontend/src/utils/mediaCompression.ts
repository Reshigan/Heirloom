/**
 * Client-side media compression for uploads.
 *
 * Goal: minimize storage + bandwidth without giving up quality the family
 * will care about in 2120. Strategy is "compress the display copy, keep
 * the original" — but for an MVP that doesn't yet have a separate archival
 * tier, we ship a single quality-tuned compressed copy that's still
 * faithful enough for printed-book reproduction.
 *
 * Targets per format:
 *   - Photos: WebP, longest edge 2000px, ~85% quality. ~70% smaller than
 *     a typical iPhone-out HEIC at the same perceived quality.
 *   - Voice: Opus via MediaRecorder, 64kbps mono. Transparent for speech;
 *     ~75% smaller than uncompressed PCM and ~30% smaller than MP3 at the
 *     same intelligibility.
 *   - Video: out of scope for client-side compression in this phase. Even
 *     modern browsers handle re-encoding inconsistently. Server-side
 *     transcoding via Cloudflare Stream is the planned next step (see
 *     DEPLOY.md backlog).
 *
 * If compression fails or the input format isn't recognized, the helpers
 * fall back to the original blob — never block a user from preserving
 * something because we can't shrink it.
 */

const MAX_PHOTO_EDGE = 2000;
const PHOTO_QUALITY = 0.85;
const VOICE_BITRATE = 64_000;

export interface CompressionResult<T extends Blob = Blob> {
  blob: T;
  originalBytes: number;
  compressedBytes: number;
  ratio: number;
  format: string;
  fellBack: boolean;
}

// =============================================================================
// PHOTOS
// =============================================================================

/**
 * Compress a photo to WebP, downscaling if longest edge exceeds 2000px.
 * Keeps EXIF-style orientation by going through createImageBitmap which
 * respects the orientation flag in modern browsers.
 */
export async function compressPhoto(file: File | Blob): Promise<CompressionResult> {
  const originalBytes = file.size;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > MAX_PHOTO_EDGE ? MAX_PHOTO_EDGE / longest : 1;
    const targetW = Math.round(bitmap.width * scale);
    const targetH = Math.round(bitmap.height * scale);

    const canvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(targetW, targetH)
      : Object.assign(document.createElement('canvas'), { width: targetW, height: targetH });
    const ctx = (canvas as OffscreenCanvas | HTMLCanvasElement).getContext('2d');
    if (!ctx) throw new Error('no canvas context');
    (ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D).drawImage(
      bitmap,
      0,
      0,
      targetW,
      targetH,
    );

    let blob: Blob;
    if (canvas instanceof OffscreenCanvas) {
      blob = await canvas.convertToBlob({ type: 'image/webp', quality: PHOTO_QUALITY });
    } else {
      blob = await new Promise<Blob>((resolve, reject) =>
        (canvas as HTMLCanvasElement).toBlob(
          (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
          'image/webp',
          PHOTO_QUALITY,
        ),
      );
    }

    bitmap.close?.();

    // If WebP came out larger than the original (already-compressed input),
    // ship the original.
    if (blob.size >= originalBytes) {
      return {
        blob: file,
        originalBytes,
        compressedBytes: originalBytes,
        ratio: 1,
        format: file.type || 'application/octet-stream',
        fellBack: true,
      };
    }

    return {
      blob,
      originalBytes,
      compressedBytes: blob.size,
      ratio: blob.size / originalBytes,
      format: 'image/webp',
      fellBack: false,
    };
  } catch {
    return {
      blob: file,
      originalBytes,
      compressedBytes: originalBytes,
      ratio: 1,
      format: file.type || 'application/octet-stream',
      fellBack: true,
    };
  }
}

// =============================================================================
// VOICE
// =============================================================================

/**
 * Re-encode an existing voice recording to Opus at ~64kbps. Used when the
 * user uploads an audio file from disk; for live recordings, the Record
 * page should pass mediaRecorderMimeType: 'audio/webm;codecs=opus' +
 * audioBitsPerSecond: 64000 directly to MediaRecorder so this round-trip
 * isn't needed.
 */
export async function compressVoice(file: File | Blob): Promise<CompressionResult> {
  const originalBytes = file.size;
  try {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      throw new Error('opus not supported in this browser');
    }

    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);

    const recorder = new MediaRecorder(dest.stream, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: VOICE_BITRATE,
    });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };

    const finished = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'audio/webm;codecs=opus' }));
      recorder.onerror = (e) => reject(e);
    });

    recorder.start();
    source.start(0);
    setTimeout(() => recorder.stop(), audioBuffer.duration * 1000 + 50);

    const blob = await finished;
    await audioCtx.close();

    if (blob.size >= originalBytes) {
      return {
        blob: file,
        originalBytes,
        compressedBytes: originalBytes,
        ratio: 1,
        format: file.type || 'audio/octet-stream',
        fellBack: true,
      };
    }
    return {
      blob,
      originalBytes,
      compressedBytes: blob.size,
      ratio: blob.size / originalBytes,
      format: 'audio/webm;codecs=opus',
      fellBack: false,
    };
  } catch {
    return {
      blob: file,
      originalBytes,
      compressedBytes: originalBytes,
      ratio: 1,
      format: file.type || 'audio/octet-stream',
      fellBack: true,
    };
  }
}

// =============================================================================
// SHARED ENTRY POINT
// =============================================================================

/**
 * Auto-route a file to the right compressor based on its MIME type.
 * Unknown types are returned unchanged.
 */
export async function compressForUpload(file: File | Blob): Promise<CompressionResult> {
  const type = file.type || '';
  if (type.startsWith('image/')) return compressPhoto(file);
  if (type.startsWith('audio/')) return compressVoice(file);
  return {
    blob: file,
    originalBytes: file.size,
    compressedBytes: file.size,
    ratio: 1,
    format: type || 'application/octet-stream',
    fellBack: true,
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
