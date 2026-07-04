// Nightly logical backup — dump the irreplaceable tables to R2 as JSON so a
// bad migration / accidental mass-delete is recoverable beyond D1's 30-day
// Time Travel window. Keyed backups/<YYYY-MM-DD>/<table>.json.
//
// ponytail: intra-R2 (same bucket as media) is a single-vendor backup — a
// real off-Cloudflare copy (B2/S3) and a tested restore drill are still the
// job (see OPS_LAUNCH_CRITICAL.md §3). This is the safe first rung: a
// restorable dump that survives a D1 wipe.
//
// ponytail: no pagination — dumps whole tables in one .all(). Fine at launch
// scale (< tens of thousands of rows). When a table crosses ~50k rows, add
// LIMIT/OFFSET chunking here.
import type { Env } from '../index';

// The append-only content + the money trail. Order irrelevant (independent files).
const TABLES = [
  'users',
  'subscriptions',
  'processed_webhook_events',
  'memories',
  'letters',
  'voice_recordings',
  'entry_unlocks',
  'threads',
  'thread_entries',
  'thread_members',
  'family_members',
  'legacy_contacts',
] as const;

export async function runBackup(env: Env): Promise<{ ok: string[]; failed: string[] }> {
  const day = new Date().toISOString().slice(0, 10);
  const ok: string[] = [];
  const failed: string[] = [];

  for (const table of TABLES) {
    try {
      // Identifier is from a fixed literal allowlist above — safe to interpolate.
      const { results } = await env.DB.prepare(`SELECT * FROM ${table}`).all();
      const body = JSON.stringify({ table, day, count: results.length, rows: results });
      await env.STORAGE.put(`backups/${day}/${table}.json`, body, {
        httpMetadata: { contentType: 'application/json' },
      });
      ok.push(`${table}:${results.length}`);
    } catch (err: any) {
      // A missing table (schema drift) or a read error must not abort the rest.
      failed.push(`${table}:${err?.message ?? String(err)}`);
    }
  }

  // A manifest ties the day's dump together and records what failed.
  await env.STORAGE.put(`backups/${day}/_manifest.json`, JSON.stringify({
    day, ok, failed, tables: TABLES,
  }), { httpMetadata: { contentType: 'application/json' } }).catch(() => undefined);

  return { ok, failed };
}
