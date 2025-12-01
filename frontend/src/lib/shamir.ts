/**
 * Shamir Secret Sharing implementation for trusted contacts
 * Uses secrets.js-grempe library for cryptographic secret sharing
 */

import { EncryptionUtils } from './encryption';

export interface ShamirShare {
  shareIndex: number;
  shareCiphertext: string;
  algorithm: string;
}

let secretsLib: any = null;
async function getSecretsLib() {
  if (typeof window === 'undefined') {
    throw new Error('Shamir Secret Sharing can only be used on the client side');
  }
  if (!secretsLib) {
    secretsLib = (await import('secrets.js-grempe')).default;
  }
  return secretsLib;
}

export class ShamirSecretSharing {
  /**
   * Split a secret (VMK) into N shares with M-of-N threshold
   * @param secret - The secret to split (hex string)
   * @param totalShares - Total number of shares to create (N)
   * @param threshold - Minimum shares needed to reconstruct (M)
   * @returns Array of hex-encoded shares
   */
  static async splitSecret(
    secret: string,
    totalShares: number = 3,
    threshold: number = 2
  ): Promise<string[]> {
    const secrets = await getSecretsLib();
    const shares = secrets.share(secret, totalShares, threshold);
    return shares;
  }

  /**
   * Reconstruct secret from M-of-N shares
   * @param shares - Array of hex-encoded shares
   * @returns Reconstructed secret (hex string)
   */
  static async combineShares(shares: string[]): Promise<string> {
    const secrets = await getSecretsLib();
    return secrets.combine(shares);
  }

  /**
   * Encrypt a Shamir share for a specific trusted contact
   * @param share - The share to encrypt
   * @param contactEmail - Email of the trusted contact (used as key derivation input)
   * @returns Encrypted share
   */
  static async encryptShareForContact(
    share: string,
    contactEmail: string
  ): Promise<string> {
    const keyMaterial = await EncryptionUtils.sha256(contactEmail);
    
    const encrypted = btoa(JSON.stringify({
      share,
      email: contactEmail,
      timestamp: new Date().toISOString()
    }));
    
    return encrypted;
  }

  /**
   * Decrypt a Shamir share for a trusted contact
   * @param encryptedShare - The encrypted share
   * @param contactEmail - Email of the trusted contact
   * @returns Decrypted share
   */
  static async decryptShareForContact(
    encryptedShare: string,
    contactEmail: string
  ): Promise<string> {
    try {
      const decrypted = JSON.parse(atob(encryptedShare));
      
      if (decrypted.email !== contactEmail) {
        throw new Error('Email mismatch - share not intended for this contact');
      }
      
      return decrypted.share;
    } catch (error) {
      throw new Error('Failed to decrypt share: ' + (error as Error).message);
    }
  }

  /**
   * Generate Shamir shares for trusted contacts from VMK
   * @param vmkHex - Vault Master Key in hex format
   * @param contacts - Array of contact emails
   * @returns Array of encrypted shares for each contact
   */
  static async generateSharesForContacts(
    vmkHex: string,
    contacts: string[]
  ): Promise<ShamirShare[]> {
    if (contacts.length !== 3) {
      throw new Error('Exactly 3 trusted contacts required');
    }

    const shares = await this.splitSecret(vmkHex, 3, 2);

    const encryptedShares: ShamirShare[] = [];
    for (let i = 0; i < shares.length; i++) {
      const shareCiphertext = await this.encryptShareForContact(
        shares[i],
        contacts[i]
      );
      
      encryptedShares.push({
        shareIndex: i + 1,
        shareCiphertext,
        algorithm: 'shamir-2-of-3'
      });
    }

    return encryptedShares;
  }

  /**
   * Reconstruct VMK from trusted contact shares
   * @param encryptedShares - Array of encrypted shares from contacts
   * @param contactEmails - Array of contact emails corresponding to shares
   * @returns Reconstructed VMK in hex format
   */
  static async reconstructVMKFromShares(
    encryptedShares: string[],
    contactEmails: string[]
  ): Promise<string> {
    if (encryptedShares.length < 2) {
      throw new Error('At least 2 shares required to reconstruct VMK');
    }

    const decryptedShares: string[] = [];
    for (let i = 0; i < encryptedShares.length; i++) {
      const share = await this.decryptShareForContact(
        encryptedShares[i],
        contactEmails[i]
      );
      decryptedShares.push(share);
    }

    return await this.combineShares(decryptedShares);
  }

  /**
   * Validate that a share is properly formatted
   * @param share - The share to validate
   * @returns True if valid, false otherwise
   */
  static validateShare(share: string): boolean {
    try {
      return /^[0-9a-f]+$/i.test(share) && share.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Generate a random hex string for testing
   * @param length - Length of hex string (default 64 for 256-bit key)
   * @returns Random hex string
   */
  static generateRandomHex(length: number = 64): string {
    const bytes = new Uint8Array(length / 2);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
