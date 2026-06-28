/**
 * Storage-quota enforcement for the freemium model.
 *
 * Free is gated on storage (and threads — see threads.ts), not on features:
 * a Free family can try every entry type, they're just capped at 500 MB and
 * one thread. Paid tiers (and an active 30-day Family trial) get the larger
 * caps below. An expired trial reads as Free, so it tightens to 500 MB rather
 * than locking anyone out of reading what they already wrote — writes simply
 * stop once the cap is exceeded.
 *
 * Usage is the sum of file_size across memories (excluding soft-deleted rows)
 * and voice recordings — mirroring settings.ts /exit-quote.
 */
import type { Env } from '../index';

const MB = 1024 * 1024;
const GB = 1024 * MB;

/**
 * The Free (FREE/STARTER) storage cap, in bytes. The single source of truth so
 * enforcement (here) and display (billing.ts TIER_LIMITS.STARTER) never desync.
 */
export const FREE_STORAGE_BYTES = 500 * MB;

/** Bytes a user is allowed, resolved from tier + active-trial state. */
export function storageCapBytes(tier: string | null | undefined, trialActive: boolean): number {
  if (trialActive) return 50 * GB; // Family trial gets the Family cap
  const t = (tier ?? 'STARTER').toUpperCase();
  if (t === 'LEGACY' || t === 'FOREVER') return 500 * GB; // Founder / lifetime
  if (t === 'DEEP') return 250 * GB; // Deep — the multi-generational bloodline tier
  if (t === 'FAMILY' || t === 'ESSENTIAL') return 50 * GB; // Family
  return FREE_STORAGE_BYTES; // FREE / STARTER
}

/** Current storage used by a user, in bytes (memories + voice). */
export async function currentStorageBytes(env: Env, userId: string): Promise<number> {
  const [mem, voice] = await Promise.all([
    env.DB.prepare(
      `SELECT COALESCE(SUM(file_size), 0) AS total FROM memories WHERE user_id = ? AND deleted_at IS NULL`,
    ).bind(userId).first<{ total: number }>(),
    env.DB.prepare(
      `SELECT COALESCE(SUM(file_size), 0) AS total FROM voice_recordings WHERE user_id = ? AND deleted_at IS NULL`,
    ).bind(userId).first<{ total: number }>(),
  ]);
  return (mem?.total ?? 0) + (voice?.total ?? 0);
}

export interface QuotaCheck {
  ok: boolean;
  used: number;
  cap: number;
  incoming: number;
}

/**
 * Returns whether writing `incomingBytes` would keep the user within their
 * plan's storage cap. A zero/negative incoming (text-only entry) always passes.
 */
export async function checkStorageQuota(env: Env, userId: string, incomingBytes: number): Promise<QuotaCheck> {
  const incoming = Math.max(0, Number(incomingBytes) || 0);
  const sub = await env.DB.prepare(
    'SELECT tier, status, trial_ends_at FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
  ).bind(userId).first<{ tier: string; status: string; trial_ends_at: string | null }>();
  const trialActive = sub?.status === 'TRIALING'
    && !!sub?.trial_ends_at
    && new Date(sub.trial_ends_at).getTime() > Date.now();
  const cap = storageCapBytes(sub?.tier, trialActive);
  const used = incoming > 0 ? await currentStorageBytes(env, userId) : 0;
  return { ok: used + incoming <= cap, used, cap, incoming };
}
