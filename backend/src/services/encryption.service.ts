import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * End-to-End Encryption Service
 * 
 * Architecture:
 * - Each user has a unique encryption key derived from their password
 * - Content is encrypted client-side before upload using user's key
 * - Server stores only encrypted data (zero-knowledge)
 * - On user's passing, dead man's switch triggers key release to beneficiaries
 * 
 * This server-side service handles:
 * - Key derivation assistance
 * - Encrypted key storage for dead man's switch
 * - Key escrow for beneficiaries
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

export interface EncryptedData {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
  salt?: string; // base64, only for key derivation
}

export interface KeyEscrow {
  userId: string;
  encryptedUserKey: string; // User's key encrypted with master key
  beneficiaryId: string;
  releaseCondition: 'POSTHUMOUS' | 'MANUAL';
  released: boolean;
}

export const encryptionService = {
  /**
   * Generate a random encryption key
   */
  generateKey(): Buffer {
    return crypto.randomBytes(KEY_LENGTH);
  },

  /**
   * Generate a random salt
   */
  generateSalt(): Buffer {
    return crypto.randomBytes(SALT_LENGTH);
  },

  /**
   * Derive an encryption key from password
   */
  deriveKeyFromPassword(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      'sha512'
    );
  },

  /**
   * Encrypt data with a key
   */
  encrypt(plaintext: string | Buffer, key: Buffer): EncryptedData {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const data = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext;
    
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  },

  /**
   * Decrypt data with a key
   */
  decrypt(encryptedData: EncryptedData, key: Buffer): Buffer {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(encryptedData.iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.ciphertext, 'base64')),
      decipher.final(),
    ]);

    return decrypted;
  },

  /**
   * Generate user encryption key set
   * Returns keys for client-side encryption setup
   */
  async generateUserKeySet(userId: string, password: string): Promise<{
    salt: string;
    encryptedMasterKey: EncryptedData;
    keyDerivationParams: {
      iterations: number;
      algorithm: string;
    };
  }> {
    // Generate user's master encryption key
    const masterKey = this.generateKey();
    
    // Generate salt for password derivation
    const salt = this.generateSalt();
    
    // Derive key from password
    const passwordKey = this.deriveKeyFromPassword(password, salt);
    
    // Encrypt master key with password-derived key
    const encryptedMasterKey = this.encrypt(masterKey, passwordKey);

    logger.info(`Generated encryption key set for user ${userId}`);

    return {
      salt: salt.toString('base64'),
      encryptedMasterKey,
      keyDerivationParams: {
        iterations: PBKDF2_ITERATIONS,
        algorithm: 'sha512',
      },
    };
  },

  /**
   * Create escrow key for dead man's switch
   * The user's key is encrypted with a server master key
   * and stored for release to beneficiaries upon death
   */
  async createKeyEscrow(
    userId: string,
    userEncryptedKey: string, // User's master key, encrypted with their password
    beneficiaryIds: string[]
  ): Promise<void> {
    const prisma = (await import('../config/database')).default;
    
    // Re-encrypt with server's master key for escrow storage
    const serverKey = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'base64');
    const escrowEncrypted = this.encrypt(userEncryptedKey, serverKey);

    // Store escrow for each beneficiary
    for (const beneficiaryId of beneficiaryIds) {
      await prisma.keyEscrow.upsert({
        where: {
          userId_beneficiaryId: { userId, beneficiaryId },
        },
        update: {
          encryptedKey: JSON.stringify(escrowEncrypted),
        },
        create: {
          userId,
          beneficiaryId,
          encryptedKey: JSON.stringify(escrowEncrypted),
          releaseCondition: 'POSTHUMOUS',
          released: false,
        },
      });
    }

    logger.info(`Created key escrow for user ${userId} with ${beneficiaryIds.length} beneficiaries`);
  },

  /**
   * Release escrowed keys to beneficiaries (triggered by dead man's switch)
   */
  async releaseEscrowedKeys(userId: string): Promise<void> {
    const prisma = (await import('../config/database')).default;
    const { emailService } = await import('./email.service');

    const escrows = await prisma.keyEscrow.findMany({
      where: { userId, released: false },
      include: {
        beneficiary: true,
        user: true,
      },
    });

    const serverKey = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'base64');

    for (const escrow of escrows) {
      try {
        // Decrypt the escrowed key
        const encryptedData = JSON.parse(escrow.encryptedKey) as EncryptedData;
        const decryptedKey = this.decrypt(encryptedData, serverKey);

        // Mark as released
        await prisma.keyEscrow.update({
          where: { id: escrow.id },
          data: { 
            released: true,
            releasedAt: new Date(),
          },
        });

        // Send key to beneficiary via secure channel
        if (escrow.beneficiary.email) {
          await emailService.sendEscrowKeyRelease(
            escrow.beneficiary.email,
            escrow.beneficiary.name,
            escrow.user.firstName + ' ' + escrow.user.lastName,
            decryptedKey.toString('base64')
          );
        }

        logger.info(`Released escrow key for user ${userId} to beneficiary ${escrow.beneficiaryId}`);
      } catch (error) {
        logger.error(`Failed to release escrow key: ${error}`);
      }
    }
  },

  /**
   * Verify encrypted content integrity
   */
  verifyIntegrity(encryptedData: EncryptedData, key: Buffer): boolean {
    try {
      this.decrypt(encryptedData, key);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Hash sensitive data for storage (one-way)
   */
  hashData(data: string): string {
    return crypto
      .createHmac('sha256', env.ENCRYPTION_MASTER_KEY)
      .update(data)
      .digest('hex');
  },

  /**
   * Generate recovery code for key backup
   */
  generateRecoveryCode(): string {
    const bytes = crypto.randomBytes(16);
    // Format as human-readable groups
    const hex = bytes.toString('hex').toUpperCase();
    return hex.match(/.{1,4}/g)!.join('-');
  },

  /**
   * Encrypt file for storage (streaming for large files)
   */
  createEncryptStream(key: Buffer) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    return {
      stream: cipher,
      iv: iv.toString('base64'),
      getAuthTag: () => cipher.getAuthTag().toString('base64'),
    };
  },

  /**
   * Decrypt file stream
   */
  createDecryptStream(key: Buffer, iv: string, authTag: string) {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    return decipher;
  },
};
