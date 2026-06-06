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

/**
 * Upload an image to R2 via the memories signed-URL flow.
 *
 * The server returns an absolute uploadUrl on the API origin whose PUT route is
 * authenticated (it reads userId from the bearer token), so the raw PUT MUST carry
 * the Authorization header. XHR is used so callers can render real upload progress
 * (the design forbids spinners — a hairline progress bar is the sanctioned affordance).
 */
export function uploadMemoryImage(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadedImage> {
  return memoriesApi
    .getUploadUrl({ filename: file.name, contentType: file.type })
    .then(({ data }) => {
      const uploadUrl: string = data.uploadUrl ?? data.url;
      const fileKey: string = data.key ?? data.fileKey;
      return new Promise<UploadedImage>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
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
            resolve({ fileKey, fileUrl, fileSize: file.size, mimeType: file.type });
          } else {
            reject(new Error(`Upload failed (${xhr.status}).`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed. Check your connection.'));
        xhr.send(file);
      });
    });
}
