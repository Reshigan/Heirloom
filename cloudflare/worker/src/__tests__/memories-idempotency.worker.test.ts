/**
 * Memory create idempotency contract — the ON CONFLICT guard behind the offline
 * holding queue (migrations 0067/0068).
 *
 * WHY: the offline queue replays the full create sequence on reconnect. If a
 * network error arrives AFTER the worker inserted the row but BEFORE the
 * response reaches the client, the entry stays queued and the drain replays the
 * POST. The create handler defends against the resulting duplicate with
 *   INSERT ... ON CONFLICT(user_id, client_key) DO NOTHING
 * which requires a UNIQUE index on exactly (user_id, client_key) — 0067 for
 * memories, 0068 for voice_recordings. Without that index the ON CONFLICT
 * INSERT throws at runtime instead of de-duping. This suite exercises that
 * contract directly against D1 so a regression in the test schema (a dropped
 * client_key column or a non-UNIQUE index) surfaces here rather than silently
 * letting duplicates through.
 *
 * Runs in the real Workers runtime so the SQL executes against D1.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applyMigrations, seedUser } from './helpers/migrate';

beforeEach(async () => {
  await applyMigrations(env.DB!);
});

async function countMemories(userId: string, clientKey: string): Promise<number> {
  const row = await env.DB!.prepare(
    `SELECT COUNT(*) AS n FROM memories WHERE user_id = ? AND client_key = ?`,
  )
    .bind(userId, clientKey)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

describe('memory create idempotency (ON CONFLICT user_id, client_key)', () => {
  it('a replayed create with the same client_key inserts exactly one row', async () => {
    const userId = await seedUser(env.DB!, { id: 'u-idem-1', email: 'idem1@heirloom.blue' });
    const clientKey = 'ck-replay-0001';

    const insert = (id: string) =>
      env.DB!.prepare(
        `INSERT INTO memories (id, user_id, type, title, client_key)
         VALUES (?, ?, 'NOTE', 'A held memory', ?)
         ON CONFLICT(user_id, client_key) DO NOTHING`,
      )
        .bind(id, userId, clientKey)
        .run();

    // First create — the live POST.
    await insert('mem-live-0001');
    // Replay from the offline drain after a lost response — same client_key.
    await insert('mem-replay-0001');

    expect(await countMemories(userId, clientKey)).toBe(1);
  });

  it('the surviving row is the first insert (DO NOTHING, not upsert)', async () => {
    const userId = await seedUser(env.DB!, { id: 'u-idem-2', email: 'idem2@heirloom.blue' });
    const clientKey = 'ck-replay-0002';

    await env.DB!.prepare(
      `INSERT INTO memories (id, user_id, type, title, client_key)
       VALUES ('mem-first-0002', ?, 'NOTE', 'Original title', ?)
       ON CONFLICT(user_id, client_key) DO NOTHING`,
    )
      .bind(userId, clientKey)
      .run();

    await env.DB!.prepare(
      `INSERT INTO memories (id, user_id, type, title, client_key)
       VALUES ('mem-second-0002', ?, 'NOTE', 'Replayed title', ?)
       ON CONFLICT(user_id, client_key) DO NOTHING`,
    )
      .bind(userId, clientKey)
      .run();

    const row = await env.DB!.prepare(
      `SELECT id, title FROM memories WHERE user_id = ? AND client_key = ?`,
    )
      .bind(userId, clientKey)
      .first<{ id: string; title: string }>();

    expect(row?.id).toBe('mem-first-0002');
    expect(row?.title).toBe('Original title');
  });

  it('distinct client_keys for the same user are NOT collapsed', async () => {
    const userId = await seedUser(env.DB!, { id: 'u-idem-3', email: 'idem3@heirloom.blue' });

    for (const [id, ck] of [
      ['mem-a', 'ck-distinct-a'],
      ['mem-b', 'ck-distinct-b'],
    ] as const) {
      await env.DB!.prepare(
        `INSERT INTO memories (id, user_id, type, title, client_key)
         VALUES (?, ?, 'NOTE', 'Distinct', ?)
         ON CONFLICT(user_id, client_key) DO NOTHING`,
      )
        .bind(id, userId, ck)
        .run();
    }

    const row = await env.DB!.prepare(
      `SELECT COUNT(*) AS n FROM memories WHERE user_id = ?`,
    )
      .bind(userId)
      .first<{ n: number }>();
    expect(row?.n).toBe(2);
  });

  it('NULL client_key rows stay distinct under SQLite unique-index rules', async () => {
    // Pre-key rows carry NULL client_key; the UNIQUE index must not collapse
    // them (NULLs are always distinct in SQLite), so two NULL-key inserts both
    // survive.
    const userId = await seedUser(env.DB!, { id: 'u-idem-4', email: 'idem4@heirloom.blue' });

    await env.DB!.prepare(
      `INSERT INTO memories (id, user_id, type, title) VALUES ('mem-null-1', ?, 'NOTE', 'No key 1')`,
    )
      .bind(userId)
      .run();
    await env.DB!.prepare(
      `INSERT INTO memories (id, user_id, type, title) VALUES ('mem-null-2', ?, 'NOTE', 'No key 2')`,
    )
      .bind(userId)
      .run();

    const row = await env.DB!.prepare(
      `SELECT COUNT(*) AS n FROM memories WHERE user_id = ? AND client_key IS NULL`,
    )
      .bind(userId)
      .first<{ n: number }>();
    expect(row?.n).toBe(2);
  });
});
