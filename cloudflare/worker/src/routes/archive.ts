/**
 * Archive routes — public continuity audit dashboard + admin pin trigger.
 *
 * The audit dashboard is intentionally PUBLIC: anyone can see Heirloom's
 * pin status. Per /THREAD.md Pillar 5, "operating in the open is the
 * proof." We surface aggregate stats only — no personal data, no thread
 * names, no member info.
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { pinThreadSnapshot } from '../services/archive';

export const archiveRoutes = new Hono<AppEnv>();

// Public continuity audit summary. No auth required.
archiveRoutes.get('/audit', async (c) => {
  const [pinAggregate, providerBreakdown, freshness] = await Promise.all([
    c.env.DB.prepare(
      `SELECT
         COUNT(*) AS total_pins,
         COUNT(DISTINCT thread_id) AS threads_pinned,
         SUM(bundle_bytes) AS total_bytes,
         SUM(entry_count) AS total_entries
       FROM archive_pins
       WHERE status = 'PINNED'`,
    ).first<{ total_pins: number; threads_pinned: number; total_bytes: number; total_entries: number }>(),
    c.env.DB.prepare(
      `SELECT provider, COUNT(*) AS pins, MAX(pinned_at) AS most_recent
       FROM archive_pins
       WHERE status = 'PINNED'
       GROUP BY provider`,
    ).all<{ provider: string; pins: number; most_recent: string }>(),
    c.env.DB.prepare(
      `SELECT
         COUNT(*) FILTER (WHERE last_verified_at > datetime('now', '-7 days')) AS verified_last_week,
         COUNT(*) FILTER (WHERE status = 'FAILED') AS verification_failed
       FROM archive_pins`,
    ).first<{ verified_last_week: number; verification_failed: number }>(),
  ]);

  return c.json({
    summary: {
      total_pins: pinAggregate?.total_pins ?? 0,
      threads_pinned: pinAggregate?.threads_pinned ?? 0,
      total_bytes_pinned: pinAggregate?.total_bytes ?? 0,
      total_entries_archived: pinAggregate?.total_entries ?? 0,
    },
    providers: providerBreakdown.results,
    freshness: {
      verified_last_week: freshness?.verified_last_week ?? 0,
      verification_failed: freshness?.verification_failed ?? 0,
    },
    commitment:
      'Every Thread is mirrored to IPFS via independent providers on a weekly schedule. CIDs are content-addressed; the snapshots survive even if Heirloom shuts down. See https://heirloom.blue/continuity for the full architectural commitment.',
    audit_generated_at: new Date().toISOString(),
  });
});

// Admin trigger: pin a specific thread now. Useful for ops + recovery.
archiveRoutes.post('/pin/:threadId', async (c) => {
  const threadId = c.req.param('threadId');
  const result = await pinThreadSnapshot(c.env, threadId);
  return c.json(result);
});
