/**
 * Client-side encryption utilities using Web Crypto API
 * Implements pragmatic E2EE for Constellation Vault Platform
 */

export class EncryptionUtils {
  /**
   * Derive Vault Master Key (VMK) from user password
   * Uses PBKDF2 with 310k iterations as specified in RFC
   */
  static async deriveVMK(password: string, salt: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = this.hexToBuffer(salt);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 310000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate Data Encryption Key (DEK) for a single vault item
   */
  static async generateDEK(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data with DEK
   */
  static async encryptWithDEK(
    data: string,
    dek: CryptoKey
  ): Promise<{ encrypted: string; iv: string }> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      dek,
      dataBuffer
    );

    return {
      encrypted: this.bufferToHex(new Uint8Array(encryptedBuffer)),
      iv: this.bufferToHex(iv)
    };
  }

  /**
   * Decrypt data with DEK
   */
  static async decryptWithDEK(
    encrypted: string,
    iv: string,
    dek: CryptoKey
  ): Promise<string> {
    const encryptedBuffer = this.hexToBuffer(encrypted);
    const ivBuffer = this.hexToBuffer(iv);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      dek,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Wrap DEK with VMK (encrypt DEK using VMK)
   */
  static async wrapDEK(dek: CryptoKey, vmk: CryptoKey): Promise<{ wrapped: string; iv: string }> {
    const dekBuffer = await crypto.subtle.exportKey('raw', dek);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const wrappedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      vmk,
      dekBuffer
    );

    return {
      wrapped: this.bufferToHex(new Uint8Array(wrappedBuffer)),
      iv: this.bufferToHex(iv)
    };
  }

  /**
   * Unwrap DEK with VMK (decrypt DEK using VMK)
   */
  static async unwrapDEK(
    wrapped: string,
    iv: string,
    vmk: CryptoKey
  ): Promise<CryptoKey> {
    const wrappedBuffer = this.hexToBuffer(wrapped);
    const ivBuffer = this.hexToBuffer(iv);

    const dekBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      vmk,
      wrappedBuffer
    );

    return crypto.subtle.importKey(
      'raw',
      dekBuffer,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt file (for photos, videos, etc.)
   */
  static async encryptFile(file: File, dek: CryptoKey): Promise<{ encrypted: Blob; iv: string }> {
    const fileBuffer = await file.arrayBuffer();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      dek,
      fileBuffer
    );

    return {
      encrypted: new Blob([encryptedBuffer]),
      iv: this.bufferToHex(iv)
    };
  }

  /**
   * Decrypt file
   */
  static async decryptFile(
    encrypted: Blob,
    iv: string,
    dek: CryptoKey
  ): Promise<Blob> {
    const encryptedBuffer = await encrypted.arrayBuffer();
    const ivBuffer = this.hexToBuffer(iv);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      dek,
      encryptedBuffer
    );

    return new Blob([decryptedBuffer]);
  }

  /**
   * Generate salt for PBKDF2
   */
  static generateSalt(): string {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return this.bufferToHex(salt);
  }

  /**
   * Convert buffer to hex string
   */
  private static bufferToHex(buffer: Uint8Array): string {
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex string to buffer
   */
  private static hexToBuffer(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Hash data with SHA-256 (for checksums)
   */
  static async sha256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.bufferToHex(new Uint8Array(hashBuffer));
  }
}

/**
 * Vault encryption workflow helper
 */
export class VaultEncryption {
  private vmk: CryptoKey | null = null;
  private vmkSalt: string | null = null;

  /**
   * Initialize vault encryption with user password
   */
  async initialize(password: string, salt: string): Promise<void> {
    this.vmk = await EncryptionUtils.deriveVMK(password, salt);
    this.vmkSalt = salt;
  }

  /**
   * Encrypt vault item (text, letter, wisdom)
   */
  async encryptItem(data: string): Promise<{
    encryptedData: string;
    encryptedDek: string;
    iv: string;
    dekIv: string;
  }> {
    if (!this.vmk) throw new Error('Vault not initialized');

    const dek = await EncryptionUtils.generateDEK();
    const { encrypted, iv } = await EncryptionUtils.encryptWithDEK(data, dek);
    const { wrapped, iv: dekIv } = await EncryptionUtils.wrapDEK(dek, this.vmk);

    return {
      encryptedData: `${encrypted}:${iv}`,
      encryptedDek: `${wrapped}:${dekIv}`,
      iv,
      dekIv
    };
  }

  /**
   * Encrypt vault file (photo, video, document)
   */
  async encryptFile(file: File): Promise<{
    encryptedFile: Blob;
    encryptedDek: string;
    iv: string;
    dekIv: string;
  }> {
    if (!this.vmk) throw new Error('Vault not initialized');

    const dek = await EncryptionUtils.generateDEK();
    const { encrypted, iv } = await EncryptionUtils.encryptFile(file, dek);
    const { wrapped, iv: dekIv } = await EncryptionUtils.wrapDEK(dek, this.vmk);

    return {
      encryptedFile: encrypted,
      encryptedDek: `${wrapped}:${dekIv}`,
      iv,
      dekIv
    };
  }

  /**
   * Decrypt vault item
   */
  async decryptItem(encryptedData: string, encryptedDek: string): Promise<string> {
    if (!this.vmk) throw new Error('Vault not initialized');

    const [encrypted, iv] = encryptedData.split(':');
    const [wrapped, dekIv] = encryptedDek.split(':');

    const dek = await EncryptionUtils.unwrapDEK(wrapped, dekIv, this.vmk);
    return EncryptionUtils.decryptWithDEK(encrypted, iv, dek);
  }

  /**
   * Decrypt vault file
   */
  async decryptFile(encryptedFile: Blob, encryptedDek: string, iv: string): Promise<Blob> {
    if (!this.vmk) throw new Error('Vault not initialized');

    const [wrapped, dekIv] = encryptedDek.split(':');
    const dek = await EncryptionUtils.unwrapDEK(wrapped, dekIv, this.vmk);
    return EncryptionUtils.decryptFile(encryptedFile, iv, dek);
  }

  /**
   * Encrypt data (alias for encryptItem for compatibility)
   */
  async encryptData(data: string): Promise<{
    encryptedData: string;
    encryptedDek: string;
    iv: string;
    dekIv: string;
  }> {
    return this.encryptItem(data);
  }

  /**
   * Decrypt data (alias for decryptItem for compatibility)
   */
  async decryptData(encryptedData: string, encryptedDek: string): Promise<string> {
    return this.decryptItem(encryptedData, encryptedDek);
  }

  /**
   * Clear vault encryption keys from memory
   */
  clear(): void {
    this.vmk = null;
    this.vmkSalt = null;
  }
}
