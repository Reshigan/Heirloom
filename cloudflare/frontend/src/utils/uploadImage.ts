import { memoriesApi, getAuthHeaders } from '../services/api';

export interface UploadedImage {
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB — generous for phone photos, well under the 500MB server cap

/** Human-readable validation; returns an error string or null when the file is acceptable. */
export function validateImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'That file is not an image.';
  if (file.size > MAX_IMAGE_BYTES) return 'That image is over 25 MB. Try a smaller one.';
  return null;
}

const MAX_DIM = 1600;
const COMPRESS_QUALITY = 0.80;

/**
 * Resize and re-encode an image client-side before upload.
 * Caps the longest edge at 1920px; outputs WebP if the browser supports canvas→WebP,
 * otherwise JPEG. Falls back to the original file if compression would make it larger.
 */
export function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_DIM);
          width = MAX_DIM;
        } else {
          width = Math.round((width / height) * MAX_DIM);
          height = MAX_DIM;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);

      // Detect WebP canvas export support
      const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
      const outType = supportsWebP ? 'image/webp' : 'image/jpeg';
      const outExt = supportsWebP ? 'webp' : 'jpg';

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) { resolve(file); return; }
          const name = file.name.replace(/\.[^.]+$/, `.${outExt}`);
          resolve(new File([blob], name, { type: outType }));
        },
        outType,
        COMPRESS_QUALITY,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

/**
 * Upload an image to R2 via the memories signed-URL flow.
 *
 * Compresses the image client-side first (max 1920px, WebP/JPEG at 0.85).
 * The server returns an absolute uploadUrl on the API origin whose PUT route is
 * authenticated (it reads userId from the bearer token), so the raw PUT MUST carry
 * the Authorization header. XHR is used so callers can render real upload progress
 * (the design forbids spinners — a hairline progress bar is the sanctioned affordance).
 */
export function uploadMemoryImage(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadedImage> {
  return compressImage(file).then((compressed) =>
    memoriesApi
      .getUploadUrl({ filename: compressed.name, contentType: compressed.type })
      .then(({ data }) => {
        const uploadUrl: string = data.uploadUrl ?? data.url;
        const fileKey: string = data.key ?? data.fileKey;
        return new Promise<UploadedImage>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', compressed.type);
          const auth = getAuthHeaders();
          Object.entries(auth).forEach(([k, v]) => xhr.setRequestHeader(k, v));
          if (onProgress) {
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
            };
          }
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              let fileUrl = '';
              try {
                fileUrl = JSON.parse(xhr.responseText)?.fileUrl ?? '';
              } catch {
                fileUrl = '';
              }
              resolve({ fileKey, fileUrl, fileSize: compressed.size, mimeType: compressed.type });
            } else {
              reject(new Error(`Upload failed (${xhr.status}).`));
            }
          };
          xhr.onerror = () => reject(new Error('Upload failed. Check your connection.'));
          xhr.send(compressed);
        });
      }),
  );
}
