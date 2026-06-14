/**
 * legacy-encryption-backfill — one-time-converging migration of pre-existing
 * plaintext memory descriptions into the at-rest-encrypted columns (migration
 * 0040 + lib/legacyArchive).
 *
 * New writes already encrypt via descriptionColumnsForWrite once
 * ENCRYPTION_MASTER_KEY is set. This cron upgrades the rows that predate the
 * key. It is:
 *   - a no-op when the key is absent (encryption is dormant);
 *   - idempotent — it only touches rows whose prose is still plaintext
 *     (`description IS NOT NULL AND description_enc IS NULL`);
 *   - batch-bounded so a single invocation can never run unbounded;
 *   - inclusive of soft-deleted rows — their plaintext must be sealed too.
 *
 * It converges: each run encrypts up to BATCH×MAX_BATCHES rows, NULLing the
 * base `description` (which also evicts it from the FTS index via the existing
 * triggers). Once every row is sealed it permanently no-ops.
 */
import type { Env } from '../index';
import { encryptionConfigured, encryptText } from '../lib/legacyArchive';

const BATCH = 200;
const MAX_BATCHES = 10; // ≤2000 rows / invocation — keeps well inside CPU limits

export interface BackfillResult {
  encrypted: number;
  remaining: number;
  skipped?: string;
}

export async function backfillMemoryDescriptionEncryption(env: Env): Promise<BackfillResult> {
  if (!encryptionConfigured(env)) {
    return { encrypted: 0, remaining: 0, skipped: 'ENCRYPTION_MASTER_KEY not set' };
  }

  let encrypted = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const rows = await env.DB.prepare(
      `SELECT id, description FROM memories
       WHERE description IS NOT NULL AND description != '' AND description_enc IS NULL
       LIMIT ?`,
    ).bind(BATCH).all();

    const pending = rows.results as Array<{ id: string; description: string }>;
    if (pending.length === 0) break;

    // Encrypt each row (CPU-bound, sequential), collecting the writes; flush the
    // whole batch in ONE D1 round-trip instead of up to BATCH sequential UPDATEs.
    const updates = [];
    for (const row of pending) {
      const enc = await encryptText(env, row.description);
      if (!enc) continue; // key vanished mid-run — bail safely next read
      updates.push(
        env.DB.prepare(
          `UPDATE memories SET description = NULL, description_enc = ?, description_iv = ? WHERE id = ?`,
        ).bind(enc.ciphertext, enc.iv, row.id),
      );
    }
    if (updates.length > 0) {
      await env.DB.batch(updates);
      encrypted += updates.length;
    }

    if (pending.length < BATCH) break; // drained
  }

  const remainingRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM memories
     WHERE description IS NOT NULL AND description != '' AND description_enc IS NULL`,
  ).first();

  return { encrypted, remaining: (remainingRow?.count as number) || 0 };
}
