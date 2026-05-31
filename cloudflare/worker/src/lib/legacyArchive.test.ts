import { describe, it, expect } from 'vitest';
import {
  encryptionConfigured,
  encryptText,
  decryptText,
  descriptionColumnsForWrite,
  readDescription,
  mutableUntilFrom,
  withinGrace,
} from './legacyArchive';

// A minimal Env stand-in: only ENCRYPTION_MASTER_KEY is read by these helpers.
const withKey = { ENCRYPTION_MASTER_KEY: 'test-master-key-do-not-ship' } as any;
const noKey = { ENCRYPTION_MASTER_KEY: '' } as any;

describe('legacyArchive — at-rest encryption', () => {
  it('reports configuration state from the master key presence', () => {
    expect(encryptionConfigured(withKey)).toBe(true);
    expect(encryptionConfigured(noKey)).toBe(false);
  });

  it('round-trips prose through AES-256-GCM (encrypt → decrypt)', async () => {
    const plain = 'The summer we drove to the coast and Nana sang the whole way home.';
    const enc = await encryptText(withKey, plain);
    expect(enc).not.toBeNull();
    expect(enc!.ciphertext).toBeTruthy();
    expect(enc!.iv).toBeTruthy();
    // Ciphertext must not leak the plaintext.
    expect(enc!.ciphertext).not.toContain('Nana');
    const back = await decryptText(withKey, enc!.ciphertext, enc!.iv);
    expect(back).toBe(plain);
  });

  it('uses a fresh IV per encryption (no deterministic ciphertext reuse)', async () => {
    const a = await encryptText(withKey, 'same input');
    const b = await encryptText(withKey, 'same input');
    expect(a!.iv).not.toBe(b!.iv);
    expect(a!.ciphertext).not.toBe(b!.ciphertext);
  });

  it('fails closed: tampered ciphertext or wrong key yields null, never garbage', async () => {
    const enc = await encryptText(withKey, 'secret prose');
    expect(enc).not.toBeNull();
    // Tamper the ciphertext (flip the leading bytes) — GCM auth must reject it.
    const tampered = await decryptText(withKey, 'AAAA' + enc!.ciphertext.slice(4), enc!.iv);
    expect(tampered).toBeNull();
    // Wrong key derives a different AES key — must reject.
    const wrongKey = await decryptText({ ENCRYPTION_MASTER_KEY: 'a-different-key' } as any, enc!.ciphertext, enc!.iv);
    expect(wrongKey).toBeNull();
  });

  it('descriptionColumnsForWrite encrypts when keyed, NULLing the base column', async () => {
    const cols = await descriptionColumnsForWrite(withKey, 'a memory');
    expect(cols.description).toBeNull(); // base stays NULL so FTS never indexes ciphertext
    expect(cols.description_enc).toBeTruthy();
    expect(cols.description_iv).toBeTruthy();
    // And readDescription reverses it.
    expect(await readDescription(withKey, cols)).toBe('a memory');
  });

  it('descriptionColumnsForWrite falls back to plaintext with no key (writes never break)', async () => {
    const cols = await descriptionColumnsForWrite(noKey, 'a memory');
    expect(cols.description).toBe('a memory');
    expect(cols.description_enc).toBeNull();
    expect(cols.description_iv).toBeNull();
    expect(await readDescription(noKey, cols)).toBe('a memory');
  });

  it('empty/absent descriptions store all-NULL', async () => {
    for (const v of ['', null, undefined]) {
      const cols = await descriptionColumnsForWrite(withKey, v as any);
      expect(cols).toEqual({ description: null, description_enc: null, description_iv: null });
    }
  });

  it('readDescription handles plaintext rows, encrypted rows, and empties', async () => {
    expect(await readDescription(withKey, { description: 'plain' })).toBe('plain');
    expect(await readDescription(withKey, {})).toBeNull();
    expect(await readDescription(withKey, { description: null })).toBeNull();
  });
});

describe('legacyArchive — grace window', () => {
  it('mutableUntilFrom is created_at + 30 days', () => {
    const created = '2026-01-01T00:00:00.000Z';
    expect(mutableUntilFrom(created)).toBe('2026-01-31T00:00:00.000Z');
  });

  it('mutableUntilFrom tolerates a malformed created_at (window from now)', () => {
    expect(() => mutableUntilFrom('not-a-date')).not.toThrow();
    expect(typeof mutableUntilFrom('not-a-date')).toBe('string');
  });

  it('withinGrace: future window open, past window closed, unknown lenient', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(withinGrace(future)).toBe(true);
    expect(withinGrace(past)).toBe(false);
    expect(withinGrace(null)).toBe(true);
    expect(withinGrace('garbage')).toBe(true);
  });
});
