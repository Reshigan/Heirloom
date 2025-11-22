import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Encryption utilities for client-side encryption support
 * Note: Actual encryption happens client-side using Web Crypto API
 * These utilities are for server-side operations like password hashing
 */

export class CryptoUtils {
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    return { hash, salt };
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate random token for verification, magic links, etc.
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate UUID v4
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Generate salt for client-side encryption
   */
  static generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Hash data using SHA-256 (for checksums, etc.)
   */
  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
