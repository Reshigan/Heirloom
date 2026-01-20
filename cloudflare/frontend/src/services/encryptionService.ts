/**
 * Encryption Service - Manages E2E encryption lifecycle
 * 
 * This service provides true zero-knowledge encryption:
 * - All encryption/decryption happens client-side
 * - Server only stores encrypted blobs
 * - Vault passphrase never leaves the client
 * - Master key is encrypted with vault passphrase before storage
 */

import { 
  encryptionContext, 
  generateSalt, 
  EncryptedData,
} from '../utils/encryption';
import { encryptionApi } from './api';

// Storage keys
const ENCRYPTION_ENABLED_KEY = 'heirloom_encryption_enabled';

// Session storage for vault passphrase (cleared on tab close)
const VAULT_PASSPHRASE_KEY = 'heirloom_vault_passphrase';

export interface EncryptionStatus {
  enabled: boolean;
  unlocked: boolean;
  hasEscrow: boolean;
}

class EncryptionService {
  private isUnlocked = false;

  /**
   * Check if encryption is set up for the current user
   */
  async getStatus(): Promise<EncryptionStatus> {
    try {
      const { data } = await encryptionApi.getStatus();
      return {
        enabled: data.encryptionEnabled,
        unlocked: this.isUnlocked,
        hasEscrow: data.hasEscrow,
      };
    } catch {
      return {
        enabled: false,
        unlocked: false,
        hasEscrow: false,
      };
    }
  }

  /**
   * Set up encryption for a new user
   * Called during signup or when enabling encryption
   */
  async setupEncryption(vaultPassphrase: string): Promise<void> {
    // Generate a random salt for key derivation
    const salt = generateSalt();
    
    // Initialize the encryption context (generates master key)
    await encryptionContext.initialize(vaultPassphrase, salt);
    
    // Get the encrypted master key to store on server
    const encryptedMasterKey = await encryptionContext.getEncryptedMasterKey(vaultPassphrase, salt);
    
    // Send encrypted master key to server (server never sees the actual key)
    await encryptionApi.setup({
      encryptedMasterKey: JSON.stringify(encryptedMasterKey),
      encryptionSalt: salt,
      keyDerivationParams: {
        algorithm: 'PBKDF2',
        iterations: 100000,
        hash: 'SHA-512',
      },
    });
    
    // Store vault passphrase in session (cleared on tab close)
    sessionStorage.setItem(VAULT_PASSPHRASE_KEY, vaultPassphrase);
    localStorage.setItem(ENCRYPTION_ENABLED_KEY, 'true');
    this.isUnlocked = true;
  }

  /**
   * Unlock the vault with the passphrase
   * Called on login when encryption is already set up
   */
  async unlockVault(vaultPassphrase: string): Promise<boolean> {
    try {
      // Get encryption params from server
      const { data: status } = await encryptionApi.getStatus();
      
      if (!status.encryptionEnabled) {
        // No encryption set up yet
        return false;
      }
      
      // Get salt and encrypted master key from server
      const saltResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/encryption/salt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!saltResponse.ok) {
        console.error('Failed to fetch encryption salt:', saltResponse.status);
        return false;
      }
      
      const saltData = await saltResponse.json();
      
      const masterKeyResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/encryption/master-key`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!masterKeyResponse.ok) {
        console.error('Failed to fetch encrypted master key:', masterKeyResponse.status);
        return false;
      }
      
      const masterKeyData = await masterKeyResponse.json();
      
      if (!saltData.salt || !masterKeyData.encryptedMasterKey) {
        return false;
      }
      
      // Parse the encrypted master key
      const encryptedMasterKey: EncryptedData = JSON.parse(masterKeyData.encryptedMasterKey);
      
      // Initialize encryption context with the passphrase
      await encryptionContext.initialize(vaultPassphrase, saltData.salt, encryptedMasterKey);
      
      // Store passphrase in session
      sessionStorage.setItem(VAULT_PASSPHRASE_KEY, vaultPassphrase);
      this.isUnlocked = true;
      
      return true;
    } catch (error) {
      console.error('Failed to unlock vault:', error);
      return false;
    }
  }

  /**
   * Lock the vault (clear encryption keys from memory)
   */
  lockVault(): void {
    encryptionContext.clear();
    this.isUnlocked = false;
    sessionStorage.removeItem(VAULT_PASSPHRASE_KEY);
  }

  /**
   * Check if vault is currently unlocked
   */
  isVaultUnlocked(): boolean {
    // Try to restore from session storage
    if (!this.isUnlocked) {
      const storedPassphrase = sessionStorage.getItem(VAULT_PASSPHRASE_KEY);
      if (storedPassphrase) {
        // Will need to re-unlock with the passphrase
        return false;
      }
    }
    return this.isUnlocked && encryptionContext.isInitialized();
  }

  /**
   * Encrypt text content (for letters, descriptions, etc.)
   */
  async encryptText(plaintext: string): Promise<EncryptedData> {
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please unlock to encrypt content.');
    }
    return encryptionContext.encryptText(plaintext);
  }

  /**
   * Decrypt text content
   */
  async decryptText(encryptedData: EncryptedData): Promise<string> {
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please unlock to decrypt content.');
    }
    return encryptionContext.decryptText(encryptedData);
  }

  /**
   * Encrypt a file (for photos, videos, voice recordings)
   */
  async encryptFile(file: File): Promise<{ encryptedBlob: Blob; iv: string }> {
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please unlock to encrypt files.');
    }
    return encryptionContext.encryptFile(file);
  }

  /**
   * Decrypt a file
   */
  async decryptFile(encryptedBlob: Blob, iv: string, mimeType: string): Promise<Blob> {
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please unlock to decrypt files.');
    }
    return encryptionContext.decryptFile(encryptedBlob, iv, mimeType);
  }

  /**
   * Helper to encrypt letter data before sending to API
   */
  async encryptLetterData(letterData: {
    title?: string;
    salutation?: string;
    body: string;
    signature?: string;
  }): Promise<{
    title?: string;
    salutation?: string;
    body: string;
    signature?: string;
    encrypted: boolean;
    encryption_iv: string;
  }> {
    if (!this.isVaultUnlocked()) {
      // Return unencrypted if vault is locked
      return { ...letterData, encrypted: false, encryption_iv: '' };
    }

    // Encrypt the body (main content)
    const encryptedBody = await this.encryptText(letterData.body);
    
    // Encrypt other sensitive fields if present
    const encryptedTitle = letterData.title ? await this.encryptText(letterData.title) : undefined;
    const encryptedSalutation = letterData.salutation ? await this.encryptText(letterData.salutation) : undefined;
    const encryptedSignature = letterData.signature ? await this.encryptText(letterData.signature) : undefined;

    return {
      title: encryptedTitle ? encryptedTitle.ciphertext : letterData.title,
      salutation: encryptedSalutation ? encryptedSalutation.ciphertext : letterData.salutation,
      body: encryptedBody.ciphertext,
      signature: encryptedSignature ? encryptedSignature.ciphertext : letterData.signature,
      encrypted: true,
      encryption_iv: JSON.stringify({
        body: encryptedBody.iv,
        title: encryptedTitle?.iv,
        salutation: encryptedSalutation?.iv,
        signature: encryptedSignature?.iv,
      }),
    };
  }

  /**
   * Helper to decrypt letter data received from API
   */
  async decryptLetterData(letterData: {
    title?: string;
    salutation?: string;
    body: string;
    signature?: string;
    encrypted?: boolean;
    encryption_iv?: string;
  }): Promise<{
    title?: string;
    salutation?: string;
    body: string;
    signature?: string;
  }> {
    if (!letterData.encrypted || !letterData.encryption_iv) {
      // Return as-is if not encrypted
      return {
        title: letterData.title,
        salutation: letterData.salutation,
        body: letterData.body,
        signature: letterData.signature,
      };
    }

    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please unlock to view encrypted content.');
    }

    const ivs = JSON.parse(letterData.encryption_iv);

    // Decrypt body
    const decryptedBody = await this.decryptText({
      ciphertext: letterData.body,
      iv: ivs.body,
    });

    // Decrypt other fields if they were encrypted
    const decryptedTitle = letterData.title && ivs.title
      ? await this.decryptText({ ciphertext: letterData.title, iv: ivs.title })
      : letterData.title;

    const decryptedSalutation = letterData.salutation && ivs.salutation
      ? await this.decryptText({ ciphertext: letterData.salutation, iv: ivs.salutation })
      : letterData.salutation;

    const decryptedSignature = letterData.signature && ivs.signature
      ? await this.decryptText({ ciphertext: letterData.signature, iv: ivs.signature })
      : letterData.signature;

    return {
      title: decryptedTitle,
      salutation: decryptedSalutation,
      body: decryptedBody,
      signature: decryptedSignature,
    };
  }

  /**
   * Helper to encrypt memory metadata
   */
  async encryptMemoryData(memoryData: {
    title: string;
    description?: string;
  }): Promise<{
    title: string;
    description?: string;
    encrypted: boolean;
    encryption_iv: string;
  }> {
    if (!this.isVaultUnlocked()) {
      return { ...memoryData, encrypted: false, encryption_iv: '' };
    }

    const encryptedTitle = await this.encryptText(memoryData.title);
    const encryptedDescription = memoryData.description 
      ? await this.encryptText(memoryData.description) 
      : undefined;

    return {
      title: encryptedTitle.ciphertext,
      description: encryptedDescription?.ciphertext,
      encrypted: true,
      encryption_iv: JSON.stringify({
        title: encryptedTitle.iv,
        description: encryptedDescription?.iv,
      }),
    };
  }

  /**
   * Helper to decrypt memory metadata
   */
  async decryptMemoryData(memoryData: {
    title: string;
    description?: string;
    encrypted?: boolean;
    encryption_iv?: string;
  }): Promise<{
    title: string;
    description?: string;
  }> {
    if (!memoryData.encrypted || !memoryData.encryption_iv) {
      return { title: memoryData.title, description: memoryData.description };
    }

    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please unlock to view encrypted content.');
    }

    const ivs = JSON.parse(memoryData.encryption_iv);

    const decryptedTitle = await this.decryptText({
      ciphertext: memoryData.title,
      iv: ivs.title,
    });

    const decryptedDescription = memoryData.description && ivs.description
      ? await this.decryptText({ ciphertext: memoryData.description, iv: ivs.description })
      : memoryData.description;

    return {
      title: decryptedTitle,
      description: decryptedDescription,
    };
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
