/**
 * legacyArchive — append-only + at-rest-encryption helpers for the pre-Thread
 * memories/letters/voice surface (migration 0040).
 *
 * The Family Thread (0036) is already append-only and encrypted; this brings the
 * legacy tables to the same bar:
 *   - soft-delete instead of hard-delete (the row + R2 file are preserved);
 *   - a 30-day mutability grace window, after which edits are amendments;
 *   - an append-only revision log so prior versions are never lost;
 *   - server-side AES-256-GCM encryption of memory descriptions, keyed off the
 *     worker's ENCRYPTION_MASTER_KEY. If that secret is absent we fall back to
 *     plaintext so writes never break — the feature self-activates once it's set.
 */
import type { Env } from '../index';

const GRACE_MS = 30 * 24 * 60 * 60 * 1000;

// ── base64 (standard) ───────────────────────────────────────────────────────
function bytesToB64(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}
function b64ToBytes(s: string): Uint8Array {
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// ── key derivation ──────────────────────────────────────────────────────────
let cachedKey: { secret: string; key: CryptoKey } | null = null;

async function deriveKey(env: Env): Promise<CryptoKey | null> {
  const secret = env.ENCRYPTION_MASTER_KEY;
  if (!secret) return null;
  if (cachedKey && cachedKey.secret === secret) return cachedKey.key;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  cachedKey = { secret, key };
  return key;
}

/** True when at-rest encryption is configured (the master key is present). */
export function encryptionConfigured(env: Env): boolean {
  return !!env.ENCRYPTION_MASTER_KEY;
}

// ── field encryption ────────────────────────────────────────────────────────
export async function encryptText(
  env: Env,
  plaintext: string,
): Promise<{ ciphertext: string; iv: string } | null> {
  const key = await deriveKey(env);
  if (!key) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  return { ciphertext: bytesToB64(new Uint8Array(ct)), iv: bytesToB64(iv) };
}

export async function decryptText(env: Env, ciphertextB64: string, ivB64: string): Promise<string | null> {
  const key = await deriveKey(env);
  if (!key) return null;
  try {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64ToBytes(ivB64) as BufferSource },
      key,
      b64ToBytes(ciphertextB64) as BufferSource,
    );
    return new TextDecoder().decode(pt);
  } catch (e) {
    console.error('[legacyArchive] decrypt failed', e);
    return null;
  }
}

/**
 * Compute the columns to persist for a memory `description` on write. When a key
 * is configured the prose is encrypted (ciphertext in description_enc/iv, base
 * `description` NULLed so the FTS index never holds ciphertext); otherwise it
 * falls back to plaintext so writes still succeed.
 */
export async function descriptionColumnsForWrite(
  env: Env,
  description: string | null | undefined,
): Promise<{ description: string | null; description_enc: string | null; description_iv: string | null }> {
  if (description == null || description === '') {
    return { description: null, description_enc: null, description_iv: null };
  }
  const enc = await encryptText(env, description);
  if (enc) return { description: null, description_enc: enc.ciphertext, description_iv: enc.iv };
  return { description, description_enc: null, description_iv: null };
}

/** Resolve the effective plaintext description from a DB row (encrypted or not). */
export async function readDescription(
  env: Env,
  row: { description?: unknown; description_enc?: unknown; description_iv?: unknown },
): Promise<string | null> {
  if (row?.description_enc && row?.description_iv) {
    return decryptText(env, row.description_enc as string, row.description_iv as string);
  }
  return (row?.description as string | null) ?? null;
}

// ── append-only history + grace window ──────────────────────────────────────
export type LegacyEntity = 'memory' | 'letter' | 'voice';

/** Append a snapshot of the prior values to the immutable revision log. */
export async function recordRevision(
  env: Env,
  entityType: LegacyEntity,
  entityId: string,
  userId: string | undefined,
  snapshot: Record<string, unknown>,
  reason: 'edit' | 'amendment' | 'revoke' = 'edit',
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO legacy_revisions (id, entity_type, entity_id, user_id, snapshot, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(crypto.randomUUID(), entityType, entityId, userId, JSON.stringify(snapshot), reason).run();
  } catch (e) {
    console.error('[legacyArchive] recordRevision failed', e);
  }
}

/** A single readable entry from the append-only revision log. */
export interface RevisionEntry {
  id: string;
  reason: string;
  createdAt: string;
  snapshot: Record<string, unknown>;
}

/**
 * Read the revision log for one entity, newest first. Snapshots are stored as
 * JSON with memory descriptions possibly at-rest encrypted; resolve those back
 * to plaintext here so callers always get readable history. Letter bodies that
 * were E2E-encrypted client-side stay as ciphertext (the server never had the
 * key) — the `encrypted` flag in the snapshot tells the client.
 */
export async function listRevisions(
  env: Env,
  entityType: LegacyEntity,
  entityId: string,
): Promise<RevisionEntry[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, snapshot, reason, created_at FROM legacy_revisions
     WHERE entity_type = ? AND entity_id = ?
     ORDER BY created_at DESC, id DESC`,
  ).bind(entityType, entityId).all();

  const out: RevisionEntry[] = [];
  for (const row of results ?? []) {
    let snapshot: Record<string, unknown> = {};
    try {
      snapshot = JSON.parse(row.snapshot as string) as Record<string, unknown>;
    } catch {
      // Corrupt snapshot rows still surface as dated entries.
    }
    if (snapshot.description_enc && snapshot.description_iv) {
      const plain = await decryptText(env, snapshot.description_enc as string, snapshot.description_iv as string);
      if (plain !== null) snapshot.description = plain;
      delete snapshot.description_enc;
      delete snapshot.description_iv;
    }
    out.push({
      id: row.id as string,
      reason: (row.reason as string) ?? 'edit',
      createdAt: row.created_at as string,
      snapshot,
    });
  }
  return out;
}

/** created_at + 30 days, ISO. */
export function mutableUntilFrom(createdAtIso: string): string {
  const base = new Date(createdAtIso).getTime();
  const t = Number.isFinite(base) ? base : Date.now();
  return new Date(t + GRACE_MS).toISOString();
}

/** Whether an entity is still within its in-place-edit grace window. */
export function withinGrace(mutableUntil: string | null | undefined): boolean {
  if (!mutableUntil) return true; // unknown window → be lenient
  const until = new Date(mutableUntil).getTime();
  if (!Number.isFinite(until)) return true;
  return Date.now() <= until;
}
