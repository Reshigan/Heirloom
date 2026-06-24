import { describe, it, expect } from 'vitest';
import { redactSealedEntry } from '../routes/threads';

// A sealed (pending_lock set) entry must withhold its body from everyone but
// the author; an unlocked entry, or the author themselves, reads it in full.
describe('redactSealedEntry', () => {
  const sealed = {
    id: 'e1', author_member_id: 'alice', pending_lock: 'AFTER_DEATH',
    title: 'For my daughter', body_ciphertext: 'secret', body_iv: 'iv',
    body_auth_tag: 'tag', voice_recording_id: 'v1', memory_id: 'm1',
  };

  it('withholds body + media from a non-author member of a sealed entry', () => {
    const r = redactSealedEntry(sealed, 'bob');
    expect(r.body_ciphertext).toBeNull();
    expect(r.body_iv).toBeNull();
    expect(r.body_auth_tag).toBeNull();
    expect(r.voice_recording_id).toBeNull();
    expect(r.memory_id).toBeNull();
    expect(r.title).toBe('For my daughter'); // title stays for the "sealed note" card
  });

  it('lets the author read their own sealed words (append-only)', () => {
    expect(redactSealedEntry(sealed, 'alice').body_ciphertext).toBe('secret');
  });

  it('passes an unlocked entry through untouched', () => {
    const open = { ...sealed, pending_lock: null };
    expect(redactSealedEntry(open, 'bob').body_ciphertext).toBe('secret');
  });
});
