/**
 * Per-thread family-key encryption envelope.
 *
 * MVP (this file): random AES-256 key per thread, stored in localStorage
 * keyed by the thread id. All entries to that thread are encrypted with
 * AES-GCM under that key. On read, EntryCard decrypts using the same
 * localStorage key.
 *
 * Limitations of the MVP — in scope for the next phase:
 *   1. The key never leaves the device. A member opening the thread on a
 *      second device cannot decrypt without manual key copy. Production
 *      design: per-thread family key escrowed under each member's
 *      account-derived public key (PBKDF2 from password + server-side
 *      wrapped envelope per member).
 *   2. localStorage is not safe against XSS — same trust boundary as the
 *      rest of the app's session, but worth flagging.
 *   3. Time-locked entries currently encrypt under the same family key as
 *      everything else. Production design: per-entry symmetric key wrapped
 *      under the family key for normal entries, wrapped under a server-
 *      held escrow key for time-locked entries (released by the lock-
 *      resolution cron).
 *
 * The threadCrypto API is intentionally narrow so swapping the storage
 * mechanism later (localStorage → escrow service) is local to this file.
 */

const STORAGE_PREFIX = 'heirloom:thread:';
const KEY_ALGO = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_BYTES = 12;

function storageKey(threadId: string): string {
  return `${STORAGE_PREFIX}${threadId}:key`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function base64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return bytesToBase64(new Uint8Array(raw));
}

async function importKey(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', base64ToBytes(b64) as BufferSource, { name: KEY_ALGO }, true, ['encrypt', 'decrypt']);
}

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: KEY_ALGO, length: KEY_LENGTH }, true, ['encrypt', 'decrypt']);
}

/**
 * Get-or-create the family key for a thread. The first call creates a new
 * random key and stores it in localStorage; subsequent calls return the
 * stored key. Re-export of the stored key + share with new members is the
 * responsibility of the (not-yet-built) escrow service.
 */
export async function getThreadKey(threadId: string): Promise<CryptoKey> {
  const stored = localStorage.getItem(storageKey(threadId));
  if (stored) {
    return importKey(stored);
  }
  const key = await generateKey();
  localStorage.setItem(storageKey(threadId), await exportKey(key));
  return key;
}

/**
 * Returns true if the caller's localStorage already holds a key for the
 * thread. Used by the UI to surface a "decryption layer pending" hint when
 * the entry was authored on another device.
 */
export function hasThreadKey(threadId: string): boolean {
  return localStorage.getItem(storageKey(threadId)) !== null;
}

export interface EncryptedEnvelope {
  body_ciphertext: string;
  body_iv: string;
  body_auth_tag: string;
}

/**
 * AES-GCM encrypts the plaintext under the thread's family key. Returns
 * three base64 strings to fit the existing thread_entries schema. Note:
 * Web Crypto's AES-GCM appends the auth tag to the ciphertext; we split
 * it into the dedicated auth_tag column for schema clarity.
 */
export async function encryptEntryBody(threadId: string, plaintext: string): Promise<EncryptedEnvelope> {
  const key = await getThreadKey(threadId);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherWithTag = new Uint8Array(
    await crypto.subtle.encrypt({ name: KEY_ALGO, iv: iv as BufferSource }, key, encoded as BufferSource),
  );

  // Last 16 bytes are the auth tag.
  const tagBytes = cipherWithTag.slice(cipherWithTag.length - 16);
  const ctBytes = cipherWithTag.slice(0, cipherWithTag.length - 16);

  return {
    body_ciphertext: bytesToBase64(ctBytes),
    body_iv: bytesToBase64(iv),
    body_auth_tag: bytesToBase64(tagBytes),
  };
}

export async function decryptEntryBody(
  threadId: string,
  envelope: { body_ciphertext: string | null; body_iv: string | null; body_auth_tag: string | null },
): Promise<string | null> {
  if (!envelope.body_ciphertext || !envelope.body_iv || !envelope.body_auth_tag) return null;
  if (!hasThreadKey(threadId)) return null;
  // Skip the legacy 'pending' placeholder rows from before this layer existed.
  if (envelope.body_iv === 'pending' || envelope.body_auth_tag === 'pending') return null;

  try {
    const key = await getThreadKey(threadId);
    const iv = base64ToBytes(envelope.body_iv);
    const ct = base64ToBytes(envelope.body_ciphertext);
    const tag = base64ToBytes(envelope.body_auth_tag);

    const combined = new Uint8Array(ct.length + tag.length);
    combined.set(ct, 0);
    combined.set(tag, ct.length);

    const decrypted = await crypto.subtle.decrypt(
      { name: KEY_ALGO, iv: iv as BufferSource },
      key,
      combined as BufferSource,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    // Wrong key, corrupted envelope, or pre-encryption row — caller
    // surfaces a "decryption pending" hint in the UI.
    return null;
  }
}

/**
 * Export the thread's family key for backup or for sharing with another
 * member device. Returns a base64-encoded raw key. Caller should treat
 * this as sensitive and transmit it over a trusted channel.
 */
export async function exportThreadKey(threadId: string): Promise<string | null> {
  const stored = localStorage.getItem(storageKey(threadId));
  return stored;
}

/**
 * Import an existing family key for a thread. Used when a member adds a
 * second device or accepts a key share from another member.
 */
export function importThreadKey(threadId: string, base64Key: string): void {
  localStorage.setItem(storageKey(threadId), base64Key);
}
