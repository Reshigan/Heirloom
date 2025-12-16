/**
 * Client-side encryption utilities for end-to-end encryption
 * All encryption/decryption happens in the browser - server never sees plaintext
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100000;

export interface EncryptedData {
  ciphertext: string; // base64
  iv: string; // base64
  authTag?: string; // included in ciphertext for WebCrypto
}

export interface EncryptionKeySet {
  masterKey: CryptoKey;
  salt: string;
}

/**
 * Derive encryption key from password using PBKDF2
 */
export async function deriveKey(
  password: string,
  salt: string | Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const saltArray = typeof salt === 'string' 
    ? Uint8Array.from(atob(salt), c => c.charCodeAt(0))
    : salt;
  // Create a new Uint8Array to ensure proper ArrayBuffer type for WebCrypto API
  const saltBuffer = new Uint8Array(saltArray);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-512',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a new random encryption key
 */
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export key to base64 for storage
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const rawKey = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(rawKey)));
}

/**
 * Import key from base64
 */
export async function importKey(base64Key: string): Promise<CryptoKey> {
  const rawKey = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt text data
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * Decrypt text data
 */
export async function decrypt(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<string> {
  const ciphertext = Uint8Array.from(atob(encryptedData.ciphertext), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Encrypt a file
 */
export async function encryptFile(
  file: File,
  key: CryptoKey
): Promise<{ encryptedBlob: Blob; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const fileBuffer = await file.arrayBuffer();

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    fileBuffer
  );

  return {
    encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * Decrypt a file
 */
export async function decryptFile(
  encryptedBlob: Blob,
  iv: string,
  key: CryptoKey,
  mimeType: string
): Promise<Blob> {
  const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const encryptedBuffer = await encryptedBlob.arrayBuffer();

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBuffer },
    key,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer], { type: mimeType });
}

/**
 * Generate a random salt
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...salt));
}

/**
 * Hash data (for verification, not encryption)
 */
export async function hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

/**
 * Encryption context for the app
 */
export class EncryptionContext {
  private masterKey: CryptoKey | null = null;
  private initialized = false;

  async initialize(password: string, salt: string, encryptedMasterKey?: EncryptedData): Promise<void> {
    // Derive key from password
    const passwordKey = await deriveKey(password, salt);

    if (encryptedMasterKey) {
      // Decrypt stored master key
      const masterKeyBase64 = await decrypt(encryptedMasterKey, passwordKey);
      this.masterKey = await importKey(masterKeyBase64);
    } else {
      // Generate new master key and encrypt it
      this.masterKey = await generateKey();
    }

    this.initialized = true;
  }

  async getEncryptedMasterKey(password: string, salt: string): Promise<EncryptedData> {
    if (!this.masterKey) throw new Error('Not initialized');
    
    const passwordKey = await deriveKey(password, salt);
    const masterKeyBase64 = await exportKey(this.masterKey);
    return encrypt(masterKeyBase64, passwordKey);
  }

  async encryptText(plaintext: string): Promise<EncryptedData> {
    if (!this.masterKey) throw new Error('Not initialized');
    return encrypt(plaintext, this.masterKey);
  }

  async decryptText(encryptedData: EncryptedData): Promise<string> {
    if (!this.masterKey) throw new Error('Not initialized');
    return decrypt(encryptedData, this.masterKey);
  }

  async encryptFile(file: File): Promise<{ encryptedBlob: Blob; iv: string }> {
    if (!this.masterKey) throw new Error('Not initialized');
    return encryptFile(file, this.masterKey);
  }

  async decryptFile(blob: Blob, iv: string, mimeType: string): Promise<Blob> {
    if (!this.masterKey) throw new Error('Not initialized');
    return decryptFile(blob, iv, this.masterKey, mimeType);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  clear(): void {
    this.masterKey = null;
    this.initialized = false;
  }
}

export const encryptionContext = new EncryptionContext();
