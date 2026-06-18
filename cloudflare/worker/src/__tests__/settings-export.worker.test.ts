/**
 * GDPR data-export shape test — GET /api/settings/export.
 *
 * Guards the export contract ExportPage + offline readers depend on: the
 * archive is the user's COMPLETE data set, so every top-level section must be
 * present (even when empty for a fresh account) and the bequest block must
 * carry its three recipient junctions. A dropped section here means a silent
 * data-loss regression in the user's downloadable archive.
 *
 * Strategy: register a real user (writes the KV session + sessions row the auth
 * middleware checks), then call the protected export route with that token and
 * assert the response SHAPE. A fresh account exercises the empty-result path of
 * every gather query — the queries still run, so a missing table or renamed
 * column surfaces as a 500 here.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applyMigrations } from './helpers/migrate';

const API = 'http://localhost';

async function registerUser(): Promise<string> {
  const res = await SELF.fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `export-${Date.now()}-${Math.random().toString(36).slice(2)}@heirloom.test`,
      password: 'ValidPassword123!',
      firstName: 'Export',
      lastName: 'Test',
      acceptedTerms: true,
    }),
  });
  expect(res.status).toBeLessThan(300);
  const body = (await res.json()) as any;
  const token = body.token ?? body.accessToken;
  expect(token).toBeTruthy();
  return token;
}

describe('GET /api/settings/export', () => {
  beforeEach(async () => {
    await applyMigrations(env.DB!);
  });

  it('401 without a token', async () => {
    const res = await SELF.fetch(`${API}/api/settings/export`);
    expect(res.status).toBe(401);
  });

  it('returns the full GDPR archive shape for a fresh account', async () => {
    const token = await registerUser();

    const res = await SELF.fetch(`${API}/api/settings/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);

    const data = (await res.json()) as any;

    // Every top-level section the export contract promises.
    for (const key of [
      'schemaVersion',
      'user',
      'memories',
      'voiceRecordings',
      'letters',
      'familyMembers',
      'legacyContacts',
      'deadManSwitch',
      'subscription',
      'bequests',
      'revisions',
    ]) {
      expect(data).toHaveProperty(key);
    }

    // Bequest routing carries all three recipient junctions.
    expect(data.bequests).toHaveProperty('letters');
    expect(data.bequests).toHaveProperty('memories');
    expect(data.bequests).toHaveProperty('voiceRecordings');
    expect(Array.isArray(data.bequests.letters)).toBe(true);
    expect(Array.isArray(data.bequests.memories)).toBe(true);
    expect(Array.isArray(data.bequests.voiceRecordings)).toBe(true);

    // Forward-compat marker present for offline readers/importers.
    expect(data.schemaVersion).toBe('1');

    // Collection sections are arrays even when empty.
    expect(Array.isArray(data.memories)).toBe(true);
    expect(Array.isArray(data.voiceRecordings)).toBe(true);
    expect(Array.isArray(data.letters)).toBe(true);
    expect(Array.isArray(data.familyMembers)).toBe(true);
    expect(Array.isArray(data.legacyContacts)).toBe(true);
    expect(Array.isArray(data.revisions)).toBe(true);

    // The registering user is reflected in the archive.
    expect(data.user).toBeTruthy();
    expect(data.user.email).toContain('@heirloom.test');
  });
});
