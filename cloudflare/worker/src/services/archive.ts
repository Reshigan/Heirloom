/**
 * Archive pinning service — the continuity guarantee made operational.
 *
 * Per /THREAD.md Pillar 5: "the archive must outlive the company." We pin
 * thread snapshots to IPFS via Pinata + Web3.Storage so the content is
 * addressable and retrievable independent of Cloudflare or Heirloom-the-
 * company. Every pin is recorded in the archive_pins table for the public
 * audit dashboard.
 *
 * Free-tier capacity:
 *   - Pinata Free: 1GB total, 100 pins/month
 *   - Web3.Storage: ~1TB free with regular use
 * We use Web3.Storage as the primary (volume) and Pinata as a redundancy
 * tier for the most recent N snapshots when capacity allows.
 *
 * Snapshot format (versioned, see bundle_format_version in archive_pins):
 *   {
 *     "version": 1,
 *     "thread_id": "...",
 *     "snapshot_at": "ISO-8601",
 *     "thread": { ...threads row... },
 *     "members": [ ... ],
 *     "entries": [
 *       {
 *         ...entry row including encrypted body...,
 *         "tags": [ ... ],
 *         "comments": [ ... ],
 *         "amendments": [ ... ],
 *         "unlocks": [ ... ]
 *       }
 *     ]
 *   }
 *
 * Bodies remain encrypted in the snapshot — IPFS storage is public; the
 * family key is what gates the actual content. The structural metadata
 * (who, when, era, lock conditions) is intentionally readable for
 * historical-archive purposes.
 */

import type { AppEnv } from '../index';

interface ThreadRow {
  id: string;
  name: string;
  dedication: string | null;
  founder_user_id: string;
  default_visibility: string;
  plan: string;
  founder_pledged_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ArchiveBundle {
  version: number;
  thread_id: string;
  snapshot_at: string;
  thread: ThreadRow;
  members: unknown[];
  entries: unknown[];
}

interface PinResult {
  provider: string;
  ok: boolean;
  cid?: string;
  pinId?: string;
  error?: string;
}

export async function buildThreadBundle(
  env: AppEnv['Bindings'],
  threadId: string,
): Promise<ArchiveBundle | null> {
  const thread = await env.DB.prepare(`SELECT * FROM threads WHERE id = ?`).bind(threadId).first<ThreadRow>();
  if (!thread) return null;

  const [members, entries, comments, amendments, tags, unlocks] = await Promise.all([
    env.DB.prepare(`SELECT * FROM thread_members WHERE thread_id = ?`).bind(threadId).all(),
    env.DB.prepare(`SELECT * FROM thread_entries WHERE thread_id = ?`).bind(threadId).all(),
    env.DB.prepare(
      `SELECT c.* FROM entry_comments c
       INNER JOIN thread_entries e ON e.id = c.entry_id
       WHERE e.thread_id = ?`,
    ).bind(threadId).all(),
    env.DB.prepare(
      `SELECT a.* FROM entry_amendments a
       INNER JOIN thread_entries e ON e.id = a.entry_id
       WHERE e.thread_id = ?`,
    ).bind(threadId).all(),
    env.DB.prepare(
      `SELECT t.* FROM entry_tags t
       INNER JOIN thread_entries e ON e.id = t.entry_id
       WHERE e.thread_id = ?`,
    ).bind(threadId).all(),
    env.DB.prepare(
      `SELECT u.* FROM entry_unlocks u
       INNER JOIN thread_entries e ON e.id = u.entry_id
       WHERE e.thread_id = ?`,
    ).bind(threadId).all(),
  ]);

  // Index helper rows by entry_id for the snapshot shape.
  const byEntry = <T extends { entry_id: string }>(rows: T[]) => {
    const map = new Map<string, T[]>();
    for (const r of rows) {
      if (!map.has(r.entry_id)) map.set(r.entry_id, []);
      map.get(r.entry_id)!.push(r);
    }
    return map;
  };

  const commentsByEntry = byEntry(comments.results as { entry_id: string }[]);
  const amendmentsByEntry = byEntry(amendments.results as { entry_id: string }[]);
  const tagsByEntry = byEntry(tags.results as { entry_id: string }[]);
  const unlocksByEntry = byEntry(unlocks.results as { entry_id: string }[]);

  const enrichedEntries = (entries.results as { id: string }[]).map((e) => ({
    ...e,
    comments: commentsByEntry.get(e.id) ?? [],
    amendments: amendmentsByEntry.get(e.id) ?? [],
    tags: tagsByEntry.get(e.id) ?? [],
    unlocks: unlocksByEntry.get(e.id) ?? [],
  }));

  return {
    version: 1,
    thread_id: threadId,
    snapshot_at: new Date().toISOString(),
    thread,
    members: members.results,
    entries: enrichedEntries,
  };
}

// =============================================================================
// PROVIDERS
// =============================================================================

async function pinToWeb3Storage(env: AppEnv['Bindings'], bundle: ArchiveBundle): Promise<PinResult> {
  const token = (env as AppEnv['Bindings'] & { WEB3_STORAGE_TOKEN?: string }).WEB3_STORAGE_TOKEN;
  if (!token) return { provider: 'web3storage', ok: false, error: 'WEB3_STORAGE_TOKEN not set' };

  const json = JSON.stringify(bundle);
  const blob = new Blob([json], { type: 'application/json' });
  const formData = new FormData();
  formData.append('file', blob, `${bundle.thread_id}.json`);

  // Web3.Storage's classic "upload" endpoint. For production-scale we'd
  // migrate to the w3up client; the legacy endpoint is fine for low volume.
  const res = await fetch('https://api.web3.storage/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    return { provider: 'web3storage', ok: false, error: `HTTP ${res.status}` };
  }
  const data = (await res.json()) as { cid?: string };
  if (!data.cid) return { provider: 'web3storage', ok: false, error: 'no cid in response' };
  return { provider: 'web3storage', ok: true, cid: data.cid };
}

async function pinToPinata(env: AppEnv['Bindings'], bundle: ArchiveBundle): Promise<PinResult> {
  const jwt = (env as AppEnv['Bindings'] & { PINATA_JWT?: string }).PINATA_JWT;
  if (!jwt) return { provider: 'pinata', ok: false, error: 'PINATA_JWT not set' };

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      pinataContent: bundle,
      pinataMetadata: {
        name: `heirloom-${bundle.thread_id}-${bundle.snapshot_at.slice(0, 10)}`,
        keyvalues: {
          thread_id: bundle.thread_id,
          version: String(bundle.version),
        },
      },
    }),
  });
  if (!res.ok) {
    return { provider: 'pinata', ok: false, error: `HTTP ${res.status}` };
  }
  const data = (await res.json()) as { IpfsHash?: string; PinSize?: number };
  if (!data.IpfsHash) return { provider: 'pinata', ok: false, error: 'no IpfsHash in response' };
  return { provider: 'pinata', ok: true, cid: data.IpfsHash };
}

// =============================================================================
// PUBLIC ENTRYPOINTS
// =============================================================================

export async function pinThreadSnapshot(
  env: AppEnv['Bindings'],
  threadId: string,
): Promise<{ pinned: PinResult[]; entry_count: number; bundle_bytes: number }> {
  const bundle = await buildThreadBundle(env, threadId);
  if (!bundle) {
    return { pinned: [], entry_count: 0, bundle_bytes: 0 };
  }
  const json = JSON.stringify(bundle);
  const bundleBytes = new TextEncoder().encode(json).byteLength;
  const entryCount = bundle.entries.length;

  // Pin to all configured providers in parallel; record each pin separately.
  const results = await Promise.all([pinToWeb3Storage(env, bundle), pinToPinata(env, bundle)]);
  const nowISO = new Date().toISOString();

  for (const r of results) {
    if (!r.ok || !r.cid) continue;
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO archive_pins (
         id, thread_id, snapshot_cid, provider, provider_pin_id,
         entry_count, bundle_bytes, bundle_format_version,
         pinned_at, last_verified_at, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'PINNED')`,
    ).bind(id, threadId, r.cid, r.provider, r.pinId ?? null, entryCount, bundleBytes, nowISO, nowISO).run();
  }

  return { pinned: results, entry_count: entryCount, bundle_bytes: bundleBytes };
}

/**
 * Verify previously-pinned snapshots are still retrievable. Marks any
 * unreachable pin as EXPIRED in archive_pins. Runs less frequently than
 * pinning (every ~24 hours) to stay inside free-tier API quotas.
 */
export async function verifyPins(env: AppEnv['Bindings']): Promise<{ ok: number; failed: number }> {
  const due = await env.DB.prepare(
    `SELECT id, snapshot_cid, provider FROM archive_pins
     WHERE status = 'PINNED'
       AND (last_verified_at IS NULL OR last_verified_at < datetime('now', '-7 days'))
     ORDER BY last_verified_at ASC NULLS FIRST
     LIMIT 25`,
  ).all<{ id: string; snapshot_cid: string; provider: string }>();

  let ok = 0;
  let failed = 0;

  for (const p of due.results ?? []) {
    try {
      // Use a public IPFS gateway to fetch HEAD. cloudflare-ipfs.com is
      // free and reliable.
      const res = await fetch(`https://cloudflare-ipfs.com/ipfs/${p.snapshot_cid}`, { method: 'HEAD' });
      if (res.ok) {
        await env.DB.prepare(
          `UPDATE archive_pins SET last_verified_at = datetime('now'), status = 'PINNED' WHERE id = ?`,
        ).bind(p.id).run();
        ok++;
      } else {
        await env.DB.prepare(
          `UPDATE archive_pins SET last_verified_at = datetime('now'), status = 'FAILED' WHERE id = ?`,
        ).bind(p.id).run();
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { ok, failed };
}
