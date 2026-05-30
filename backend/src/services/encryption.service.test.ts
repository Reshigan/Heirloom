import { describe, it, expect } from 'vitest';
import { encryptionService, type EncryptedData } from './encryption.service';

// The encryption service is the heart of Heirloom's zero-knowledge promise
// (STITCH_BRIEF.md §1.5 invariant, §6.12 Encryption). These tests pin the
// crypto contract: round-trips succeed, tampering is detected, derivation is
// deterministic. No DB — pure crypto.

describe('encryptionService — key + salt generation', () => {
  it('generates 32-byte (256-bit) keys', () => {
    expect(encryptionService.generateKey()).toHaveLength(32);
  });

  it('generates 32-byte salts', () => {
    expect(encryptionService.generateSalt()).toHaveLength(32);
  });

  it('produces different key material on each call', () => {
    const a = encryptionService.generateKey().toString('hex');
    const b = encryptionService.generateKey().toString('hex');
    expect(a).not.toBe(b);
  });
});

describe('encryptionService — password key derivation', () => {
  it('is deterministic for the same password + salt', () => {
    const salt = encryptionService.generateSalt();
    const k1 = encryptionService.deriveKeyFromPassword('correct horse', salt);
    const k2 = encryptionService.deriveKeyFromPassword('correct horse', salt);
    expect(k1.toString('hex')).toBe(k2.toString('hex'));
    expect(k1).toHaveLength(32);
  });

  it('produces different keys for different salts', () => {
    const k1 = encryptionService.deriveKeyFromPassword('pw', encryptionService.generateSalt());
    const k2 = encryptionService.deriveKeyFromPassword('pw', encryptionService.generateSalt());
    expect(k1.toString('hex')).not.toBe(k2.toString('hex'));
  });

  it('produces different keys for different passwords', () => {
    const salt = encryptionService.generateSalt();
    const k1 = encryptionService.deriveKeyFromPassword('password-a', salt);
    const k2 = encryptionService.deriveKeyFromPassword('password-b', salt);
    expect(k1.toString('hex')).not.toBe(k2.toString('hex'));
  });
});

describe('encryptionService — encrypt / decrypt', () => {
  it('round-trips a UTF-8 string', () => {
    const key = encryptionService.generateKey();
    const plaintext = 'A letter to Maya, sealed until her 18th birthday.';
    const enc = encryptionService.encrypt(plaintext, key);
    expect(encryptionService.decrypt(enc, key).toString('utf8')).toBe(plaintext);
  });

  it('round-trips raw bytes', () => {
    const key = encryptionService.generateKey();
    const data = encryptionService.generateKey(); // arbitrary 32 bytes
    const enc = encryptionService.encrypt(data, key);
    expect(encryptionService.decrypt(enc, key).equals(data)).toBe(true);
  });

  it('emits base64 iv / authTag / ciphertext', () => {
    const key = encryptionService.generateKey();
    const enc = encryptionService.encrypt('hello', key);
    const b64 = /^[A-Za-z0-9+/]+={0,2}$/;
    expect(enc.iv).toMatch(b64);
    expect(enc.authTag).toMatch(b64);
    expect(enc.ciphertext).toMatch(b64);
  });

  it('uses a fresh IV per call (same plaintext → different ciphertext)', () => {
    const key = encryptionService.generateKey();
    const a = encryptionService.encrypt('same', key);
    const b = encryptionService.encrypt('same', key);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('fails to decrypt with the wrong key', () => {
    const enc = encryptionService.encrypt('secret', encryptionService.generateKey());
    expect(() => encryptionService.decrypt(enc, encryptionService.generateKey())).toThrow();
  });

  it('detects tampered ciphertext via the GCM auth tag', () => {
    const key = encryptionService.generateKey();
    const enc = encryptionService.encrypt('immutable entry', key);
    const tampered: EncryptedData = {
      ...enc,
      ciphertext: Buffer.from('tampered-bytes').toString('base64'),
    };
    expect(() => encryptionService.decrypt(tampered, key)).toThrow();
  });
});

describe('encryptionService — integrity, hashing, recovery codes', () => {
  it('verifyIntegrity is true for good data, false for tampered', () => {
    const key = encryptionService.generateKey();
    const enc = encryptionService.encrypt('ok', key);
    expect(encryptionService.verifyIntegrity(enc, key)).toBe(true);
    expect(encryptionService.verifyIntegrity({ ...enc, authTag: enc.iv }, key)).toBe(false);
  });

  it('hashData is deterministic and a 64-char hex (HMAC-SHA256)', () => {
    const a = encryptionService.hashData('user@example.com');
    const b = encryptionService.hashData('user@example.com');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(encryptionService.hashData('other@example.com')).not.toBe(a);
  });

  it('generateRecoveryCode is 8 groups of 4 uppercase hex', () => {
    const code = encryptionService.generateRecoveryCode();
    expect(code).toMatch(/^([0-9A-F]{4}-){7}[0-9A-F]{4}$/);
  });
});

describe('encryptionService — user key set', () => {
  it('derives a password key that can recover the master key', async () => {
    const password = 'a-strong-passphrase';
    const set = await encryptionService.generateUserKeySet('user-1', password);
    expect(set.keyDerivationParams.iterations).toBeGreaterThanOrEqual(100000);

    // Re-derive the password key from the returned salt and decrypt the master key.
    const passwordKey = encryptionService.deriveKeyFromPassword(
      password,
      Buffer.from(set.salt, 'base64'),
    );
    const recovered = encryptionService.decrypt(set.encryptedMasterKey, passwordKey);
    expect(recovered).toHaveLength(32);

    // The wrong password must not recover the master key.
    const wrongKey = encryptionService.deriveKeyFromPassword('wrong', Buffer.from(set.salt, 'base64'));
    expect(() => encryptionService.decrypt(set.encryptedMasterKey, wrongKey)).toThrow();
  });
});
