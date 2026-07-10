/**
 * claimThreadInvitesByEmail — the seat an emailed invitation leaves behind.
 *
 * POST /api/threads/:id/members writes a thread_members row keyed only by
 * email; getMembership() resolves membership by user_id. This function is the
 * bridge, which makes it an authorization grant, which makes its four negative
 * cases the part worth testing:
 *
 *   unverified email   -> no claim (registration hands out a session first)
 *   no invited_at      -> no claim (a family-tree mirror row is not an invite)
 *   revoked seat       -> no claim (revocation is permanent)
 *   already a member   -> no second seat (getMembership LIMIT 1 would pick a
 *                         role at random between the two rows)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applyMigrations } from './helpers/migrate';
import { claimThreadInvitesByEmail } from '../services/threadMesh';

const EMAIL = 'invitee@heirloom.test';
const THREAD = 'thread-1';

async function seedUser(id: string, email: string, verified: boolean) {
  await env.DB!.prepare(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, email_verified)
     VALUES (?, ?, 'x', 'Test', 'User', ?)`,
  ).bind(id, email, verified ? 1 : 0).run();
}

async function seedThread(id: string) {
  await env.DB!.prepare(
    `INSERT INTO threads (id, name, founder_user_id, default_visibility, plan, status)
     VALUES (?, 'Test thread', 'founder', 'FAMILY', 'FREE', 'ACTIVE')`,
  ).bind(id).run();
}

async function seedSeat(id: string, opts: {
  email?: string | null;
  invited?: boolean;
  revoked?: boolean;
  userId?: string | null;
  threadId?: string;
}) {
  await env.DB!.prepare(
    `INSERT INTO thread_members (id, thread_id, user_id, display_name, email, role, invited_at, revoked_at)
     VALUES (?, ?, ?, 'Invitee', ?, 'AUTHOR', ?, ?)`,
  ).bind(
    id,
    opts.threadId ?? THREAD,
    opts.userId ?? null,
    opts.email === undefined ? EMAIL : opts.email,
    opts.invited === false ? null : '2026-01-01T00:00:00Z',
    opts.revoked ? '2026-02-01T00:00:00Z' : null,
  ).run();
}

async function seatOwner(id: string): Promise<string | null> {
  const row = await env.DB!.prepare(`SELECT user_id FROM thread_members WHERE id = ?`)
    .bind(id).first<{ user_id: string | null }>();
  return row?.user_id ?? null;
}

describe('claimThreadInvitesByEmail', () => {
  beforeEach(async () => {
    await applyMigrations(env.DB!);
    await env.DB!.prepare(`DELETE FROM thread_members`).run();
    await env.DB!.prepare(`DELETE FROM threads`).run();
    await env.DB!.prepare(`DELETE FROM users`).run();
    // threads.founder_user_id is a real FK; every seeded thread points here.
    await seedUser('founder', 'founder@heirloom.test', true);
    for (const t of [THREAD, 'thread-a', 'thread-b']) await seedThread(t);
  });

  it('claims an invited seat for a verified matching address', async () => {
    await seedUser('u1', EMAIL, true);
    await seedSeat('seat-1', {});
    expect(await claimThreadInvitesByEmail(env as any, 'u1')).toBe(1);
    expect(await seatOwner('seat-1')).toBe('u1');
  });

  it('matches the address case-insensitively', async () => {
    await seedUser('u1', EMAIL, true);
    await seedSeat('seat-1', { email: 'Invitee@Heirloom.Test' });
    expect(await claimThreadInvitesByEmail(env as any, 'u1')).toBe(1);
  });

  it('refuses an unverified address', async () => {
    await seedUser('u1', EMAIL, false);
    await seedSeat('seat-1', {});
    expect(await claimThreadInvitesByEmail(env as any, 'u1')).toBe(0);
    expect(await seatOwner('seat-1')).toBeNull();
  });

  it('refuses a seat that was never invited (family-tree mirror row)', async () => {
    await seedUser('u1', EMAIL, true);
    await seedSeat('seat-1', { invited: false });
    expect(await claimThreadInvitesByEmail(env as any, 'u1')).toBe(0);
    expect(await seatOwner('seat-1')).toBeNull();
  });

  it('refuses a revoked seat', async () => {
    await seedUser('u1', EMAIL, true);
    await seedSeat('seat-1', { revoked: true });
    expect(await claimThreadInvitesByEmail(env as any, 'u1')).toBe(0);
  });

  it('refuses a seat already claimed by someone else', async () => {
    await seedUser('u1', EMAIL, true);
    await seedUser('someone-else', 'other@heirloom.test', true);
    await seedSeat('seat-1', { userId: 'someone-else' });
    expect(await claimThreadInvitesByEmail(env as any, 'u1')).toBe(0);
    expect(await seatOwner('seat-1')).toBe('someone-else');
  });

  it('never grants a second seat in a thread the user already belongs to', async () => {
    await seedUser('u1', EMAIL, true);
    await seedSeat('existing', { userId: 'u1', invited: false });
    await seedSeat('duplicate', {});
    expect(await claimThreadInvitesByEmail(env as any, 'u1')).toBe(0);
    expect(await seatOwner('duplicate')).toBeNull();
  });

  it('claims across every thread that invited the address', async () => {
    await seedUser('u1', EMAIL, true);
    await seedSeat('seat-a', { threadId: 'thread-a' });
    await seedSeat('seat-b', { threadId: 'thread-b' });
    expect(await claimThreadInvitesByEmail(env as any, 'u1')).toBe(2);
  });
});
