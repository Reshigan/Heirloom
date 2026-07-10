/**
 * Dead-man's-switch RELEASE_ALL sweep tests.
 *
 * When a switch fires with trigger_action = 'RELEASE_ALL', the departed author's
 * unresolved AUTHOR_DEATH entry-locks must be resolved — this is the only path
 * that opens after-death entries (the time-locks cron skips AUTHOR_DEATH). The
 * sweep is scoped by BOTH lock_type and author: DATE/AGE/GENERATION locks and
 * other authors' locks must be left sealed.
 *
 * Runs in the real Workers runtime so the SQL executes against D1.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applyMigrations, seedUser } from './helpers/migrate';
import { releaseAuthorDeathEntries, checkMissedCheckIns } from '../index';

const PAST = '2020-01-01T00:00:00.000Z';
const FUTURE = '2099-01-01T00:00:00.000Z';
const API = 'https://api.heirloom.blue';

beforeEach(async () => {
  await applyMigrations(env.DB);
});

/** member -> entry -> unlock chain for one author. Returns the unlock id. */
async function seedLock(
  userId: string,
  memberId: string,
  entryId: string,
  lockType: string,
  unlockId: string,
  resolved = false,
) {
  const threadId = `th-${userId}`;
  await env.DB.prepare(
    `INSERT OR IGNORE INTO threads (id, name, founder_user_id, default_visibility, plan, status)
     VALUES (?, 'Test thread', ?, 'FAMILY', 'FREE', 'ACTIVE')`,
  )
    .bind(threadId, userId)
    .run();
  await env.DB.prepare(
    `INSERT OR IGNORE INTO thread_members (id, thread_id, user_id, display_name, role)
     VALUES (?, ?, ?, 'Author', 'FOUNDER')`,
  )
    .bind(memberId, threadId, userId)
    .run();
  await env.DB.prepare(
    `INSERT INTO thread_entries (id, thread_id, author_member_id, mutable_until) VALUES (?, ?, ?, ?)`,
  )
    .bind(entryId, threadId, memberId, PAST)
    .run();
  await env.DB.prepare(
    `INSERT INTO entry_unlocks (id, entry_id, lock_type, encrypted_key, resolved_at) VALUES (?, ?, ?, '', ?)`,
  )
    .bind(unlockId, entryId, lockType, resolved ? PAST : null)
    .run();
  return unlockId;
}

function unlockResolved(id: string) {
  return env.DB.prepare(`SELECT resolved_at, resolution_note FROM entry_unlocks WHERE id = ?`)
    .bind(id)
    .first<{ resolved_at: string | null; resolution_note: string | null }>();
}

describe('releaseAuthorDeathEntries — scoping', () => {
  it('resolves only the author\'s unresolved AUTHOR_DEATH locks', async () => {
    const dead = await seedUser(env.DB, { id: 'u-dead', email: 'dead@heirloom.blue' });
    const other = await seedUser(env.DB, { id: 'u-other', email: 'other@heirloom.blue' });

    const target = await seedLock(dead, 'tm-dead', 'e-death', 'AUTHOR_DEATH', 'ul-death');
    const dateLock = await seedLock(dead, 'tm-dead', 'e-date', 'DATE', 'ul-date');
    const otherAuthor = await seedLock(other, 'tm-other', 'e-other', 'AUTHOR_DEATH', 'ul-other');
    const already = await seedLock(dead, 'tm-dead', 'e-done', 'AUTHOR_DEATH', 'ul-done', true);

    const count = await releaseAuthorDeathEntries(env, dead);
    expect(count).toBe(1); // only the one unresolved AUTHOR_DEATH lock by the dead author

    expect((await unlockResolved(target))?.resolved_at).not.toBeNull();
    expect((await unlockResolved(target))?.resolution_note).toContain('passing');
    expect((await unlockResolved(dateLock))?.resolved_at).toBeNull();     // wrong lock_type
    expect((await unlockResolved(otherAuthor))?.resolved_at).toBeNull();  // wrong author
    expect((await unlockResolved(already))?.resolved_at).toBe(PAST);      // untouched (already resolved)
  });
});

describe('checkMissedCheckIns — RELEASE_ALL gate', () => {
  async function seedSwitch(userId: string, triggerAction: string) {
    await env.DB.prepare(
      `INSERT INTO dead_man_switches (id, user_id, enabled, status, grace_period_days, missed_check_ins, next_check_in_due, trigger_action)
       VALUES (?, ?, 1, 'WARNING', 7, 2, ?, ?)`,
    )
      .bind(`dms-${userId}`, userId, PAST, triggerAction)
      .run();
  }

  /** Force the next check-in due back into the past so the next sweep re-picks the row. */
  async function reopenWindow(userId: string) {
    await env.DB.prepare(`UPDATE dead_man_switches SET next_check_in_due = ? WHERE user_id = ?`)
      .bind(PAST, userId)
      .run();
  }

  it('TRIGGERS but does NOT release on the timer alone — release needs human attestation', async () => {
    // The kill-shot the board flagged: a living author's sealed entries must NOT
    // open just because a clock ran out. The timer flips to TRIGGERED and notifies
    // contacts, but the AUTHOR_DEATH locks stay sealed until someone attests.
    const userId = await seedUser(env.DB, { id: 'u-rel', email: 'rel@heirloom.blue' });
    const lock = await seedLock(userId, 'tm-rel', 'e-rel', 'AUTHOR_DEATH', 'ul-rel');
    await seedSwitch(userId, 'RELEASE_ALL');

    await checkMissedCheckIns(env); // third miss → TRIGGERED, but NO release

    const sw = await env.DB.prepare(`SELECT status FROM dead_man_switches WHERE user_id = ?`).bind(userId).first<any>();
    expect(sw.status).toBe('TRIGGERED');
    expect((await unlockResolved(lock))?.resolved_at).toBeNull(); // sealed — timer must not open it
  });

  it('opens locks via the HARD_FLOOR backstop after prolonged unbroken silence', async () => {
    // Last-resort safety net: if nobody ever attests, RELEASE_ALL still eventually
    // opens after ~12 missed windows of total silence (missed starts at 2 here).
    const userId = await seedUser(env.DB, { id: 'u-floor', email: 'floor@heirloom.blue' });
    const lock = await seedLock(userId, 'tm-floor', 'e-floor', 'AUTHOR_DEATH', 'ul-floor');
    await seedSwitch(userId, 'RELEASE_ALL');

    // Each sweep advances next_check_in_due into the future; reopen the window
    // before each one to simulate windows elapsing with no check-in.
    for (let i = 0; i < 10; i++) {
      await checkMissedCheckIns(env); // misses climb 3,4,…,12
      await reopenWindow(userId);
    }

    const sw = await env.DB.prepare(`SELECT status FROM dead_man_switches WHERE user_id = ?`).bind(userId).first<any>();
    expect(sw.status).toBe('RELEASED');
    expect((await unlockResolved(lock))?.resolved_at).not.toBeNull();
  });

  it('leaves AUTHOR_DEATH locks sealed for a non-RELEASE_ALL action even past the floor', async () => {
    const userId = await seedUser(env.DB, { id: 'u-notify', email: 'notify@heirloom.blue' });
    const lock = await seedLock(userId, 'tm-notify', 'e-notify', 'AUTHOR_DEATH', 'ul-notify');
    await seedSwitch(userId, 'NOTIFY_ONLY');

    for (let i = 0; i < 10; i++) {
      await checkMissedCheckIns(env);
      await reopenWindow(userId);
    }

    const sw = await env.DB.prepare(`SELECT status FROM dead_man_switches WHERE user_id = ?`).bind(userId).first<any>();
    expect(sw.status).toBe('TRIGGERED'); // never RELEASED — action wasn't RELEASE_ALL
    expect((await unlockResolved(lock))?.resolved_at).toBeNull();
  });
});

describe('verify-passing — the human attestation fast-path', () => {
  // Seed a TRIGGERED RELEASE_ALL switch plus the one-time token a VERIFIED legacy
  // contact is emailed, then hit the PUBLIC confirm endpoint with no auth header.
  async function seedTriggeredWithToken(userId: string, token: string, expires = FUTURE) {
    await env.DB.prepare(
      `INSERT INTO dead_man_switches (id, user_id, enabled, status, grace_period_days, missed_check_ins, next_check_in_due, trigger_action)
       VALUES (?, ?, 1, 'TRIGGERED', 7, 5, ?, 'RELEASE_ALL')`,
    ).bind(`dms-${userId}`, userId, PAST).run();
    await env.DB.prepare(
      `INSERT INTO legacy_contacts (id, user_id, name, email, relationship, verification_status)
       VALUES (?, ?, 'Griever', ?, 'sibling', 'VERIFIED')`,
    ).bind(`lc-${userId}`, userId, `lc-${userId}@heirloom.blue`).run();
    await env.DB.prepare(
      `INSERT INTO switch_verifications (id, dead_man_switch_id, legacy_contact_id, verification_token, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(`sv-${userId}`, `dms-${userId}`, `lc-${userId}`, token, expires).run();
  }

  it('releases on an unauthenticated confirm POST and is replay-safe', async () => {
    const userId = await seedUser(env.DB, { id: 'u-att', email: 'att@heirloom.blue', first_name: 'Mara' });
    const lock = await seedLock(userId, 'tm-att', 'e-att', 'AUTHOR_DEATH', 'ul-att');
    await seedTriggeredWithToken(userId, 'tok-good');

    // No Authorization header — the griever isn't a logged-in user. The allowlist
    // must let this through (regression guard for the auth-gate fix).
    const res = await SELF.fetch(`${API}/api/deadman/verify-passing/tok-good`, { method: 'POST' });
    expect(res.status).toBe(200);

    const sw = await env.DB.prepare(`SELECT status FROM dead_man_switches WHERE user_id = ?`).bind(userId).first<any>();
    expect(sw.status).toBe('RELEASED');
    expect((await unlockResolved(lock))?.resolved_at).not.toBeNull();

    // The token row SURVIVES — inherit.ts reads it by verification_token to grant
    // the legacy contact access. Deleting it locked them out. Replay-safety comes
    // from the RELEASED status guard instead, so a second POST must not re-release.
    const survived = await env.DB.prepare(
      `SELECT verified FROM switch_verifications WHERE verification_token = ?`,
    ).bind('tok-good').first<{ verified: number }>();
    expect(survived?.verified).toBe(1);

    const releasedAt = await env.DB.prepare(`SELECT released_at FROM dead_man_switches WHERE user_id = ?`)
      .bind(userId).first<{ released_at: string }>();
    const replay = await SELF.fetch(`${API}/api/deadman/verify-passing/tok-good`, { method: 'POST' });
    expect(replay.status).toBe(200);
    const after = await env.DB.prepare(`SELECT released_at FROM dead_man_switches WHERE user_id = ?`)
      .bind(userId).first<{ released_at: string }>();
    expect(after?.released_at).toBe(releasedAt?.released_at); // not re-released
  });

  it('refuses to release on an expired token', async () => {
    const userId = await seedUser(env.DB, { id: 'u-exp', email: 'exp@heirloom.blue', first_name: 'Joss' });
    const lock = await seedLock(userId, 'tm-exp', 'e-exp', 'AUTHOR_DEATH', 'ul-exp');
    await seedTriggeredWithToken(userId, 'tok-old', PAST); // already expired

    const res = await SELF.fetch(`${API}/api/deadman/verify-passing/tok-old`, { method: 'POST' });
    expect(res.status).toBe(200); // on-brand HTML, not a release
    expect((await res.text())).toContain('couldn');

    const sw = await env.DB.prepare(`SELECT status FROM dead_man_switches WHERE user_id = ?`).bind(userId).first<any>();
    expect(sw.status).toBe('TRIGGERED'); // unchanged
    expect((await unlockResolved(lock))?.resolved_at).toBeNull();
  });
});
