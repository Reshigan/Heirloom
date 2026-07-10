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

// Every dump is a copy of every user row we hold. Keeping them forever means an
// erased account survives in R2 indefinitely, and no self-serve delete can
// reach it. GDPR Art.17 is satisfied by a documented retention window the
// backups actually age out of — not by rewriting historical dumps. 35 days
// outlives D1's 30-day Time Travel window, so a dump still covers the failure
// it exists for.
export const BACKUP_RETENTION_DAYS = 35;

/** Which `backups/<day>/` prefixes have aged out. Pure — the tested part. */
export function staleDays(days: string[], today: string, retentionDays: number): string[] {
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - retentionDays);
  const oldest = cutoff.toISOString().slice(0, 10);
  // ISO dates sort lexicographically, so the string compare IS the date compare.
  // Anything not shaped YYYY-MM-DD isn't ours and is never deleted.
  return days.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d < oldest);
}

async function pruneOldBackups(env: Env, today: string): Promise<string[]> {
  // delimiter:'/' returns one entry per day-folder instead of every object.
  const listed = await env.STORAGE.list({ prefix: 'backups/', delimiter: '/' });
  const days = listed.delimitedPrefixes.map((p) => p.slice('backups/'.length).replace(/\/$/, ''));

  const pruned: string[] = [];
  for (const day of staleDays(days, today, BACKUP_RETENTION_DAYS)) {
    const objects = await env.STORAGE.list({ prefix: `backups/${day}/` });
    await Promise.allSettled(objects.objects.map((o) => env.STORAGE.delete(o.key)));
    pruned.push(day);
  }
  return pruned;
}

export async function runBackup(env: Env): Promise<{ ok: string[]; failed: string[]; pruned: string[] }> {
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

  // Prune before the manifest so the manifest records what this run left behind.
  // A prune failure must never lose the fresh dump we just wrote.
  const pruned = await pruneOldBackups(env, day).catch(() => [] as string[]);

  // A manifest ties the day's dump together and records what failed.
  await env.STORAGE.put(`backups/${day}/_manifest.json`, JSON.stringify({
    day, ok, failed, pruned, retentionDays: BACKUP_RETENTION_DAYS, tables: TABLES,
  }), { httpMetadata: { contentType: 'application/json' } }).catch(() => undefined);

  return { ok, failed, pruned };
}
