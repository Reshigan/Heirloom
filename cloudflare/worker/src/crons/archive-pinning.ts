/**
 * Weekly archive pinning cron.
 *
 * For every active thread that hasn't been pinned in the last 7 days, build
 * a snapshot and pin it to IPFS via every configured provider. Capped per
 * run so a single execution doesn't blow through free-tier API quotas.
 *
 * Intended cron: 0 3 * * SUN  (Sunday 03:00 UTC, off-peak).
 */

import type { AppEnv } from '../index';
import { pinThreadSnapshot, verifyPins } from '../services/archive';

const MAX_PINS_PER_RUN = 50;

export async function processArchivePinning(env: AppEnv['Bindings']): Promise<{
  pinned: number;
  failed: number;
  verified: number;
  verifyFailed: number;
}> {
  // Active threads that either have never been pinned or whose last pin is
  // older than the snapshot interval.
  const due = await env.DB.prepare(
    `SELECT t.id
     FROM threads t
     LEFT JOIN (
       SELECT thread_id, MAX(pinned_at) AS last_pin
       FROM archive_pins
       WHERE status = 'PINNED'
       GROUP BY thread_id
     ) ap ON ap.thread_id = t.id
     WHERE t.status = 'ACTIVE'
       AND (ap.last_pin IS NULL OR ap.last_pin < datetime('now', '-7 days'))
     ORDER BY (ap.last_pin IS NULL) DESC, ap.last_pin ASC
     LIMIT ?`,
  ).bind(MAX_PINS_PER_RUN).all<{ id: string }>();

  let pinned = 0;
  let failed = 0;

  for (const t of due.results ?? []) {
    try {
      const result = await pinThreadSnapshot(env, t.id);
      // Count a thread as "pinned" if at least one provider succeeded.
      if (result.pinned.some((p) => p.ok)) pinned++;
      else failed++;
    } catch (err) {
      console.error(`pin thread ${t.id}:`, err);
      failed++;
    }
  }

  // Re-verify a sample of older pins so we catch silent provider drops.
  const verifyResult = await verifyPins(env);

  return {
    pinned,
    failed,
    verified: verifyResult.ok,
    verifyFailed: verifyResult.failed,
  };
}
