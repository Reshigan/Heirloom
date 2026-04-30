/**
 * Thread mesh — dual-write helpers to mirror legacy entities (memories,
 * voice, letters, capsules) into the Family Thread schema.
 *
 * Phase C of the mesh plan (see THREAD.md):
 *   - existing routes keep writing to their own tables
 *   - we ALSO insert a thread_entries row pointing back via memory_id /
 *     voice_recording_id so the new thread surfaces can read everything
 *   - failures here NEVER block the legacy write — log and swallow
 *
 * Once the dual-write has been live long enough to backfill, the legacy
 * tables can be deprecated for new writes and the mirror becomes the
 * canonical path.
 */
import type { AppEnv } from '../index';

type Env = AppEnv['Bindings'];

interface DefaultThread {
  threadId: string;
  memberId: string;
}

/**
 * Get the user's default thread, creating one on demand if they have none.
 *
 * The "default" thread is just the first thread (oldest) where the user
 * is FOUNDER and not revoked. If none, create one named after them. We
 * pick FOUNDER deliberately — only writes go through the mirror, and only
 * Founders/Successors/Authors can write entries.
 */
export async function getOrCreateDefaultThread(env: Env, userId: string | undefined): Promise<DefaultThread | null> {
  if (!userId) return null;
  // Existing FOUNDER membership wins.
  const existing = await env.DB.prepare(
    `SELECT tm.id AS member_id, tm.thread_id
     FROM thread_members tm
     INNER JOIN threads t ON t.id = tm.thread_id
     WHERE tm.user_id = ?
       AND tm.role = 'FOUNDER'
       AND tm.revoked_at IS NULL
       AND t.status = 'ACTIVE'
     ORDER BY t.created_at ASC
     LIMIT 1`,
  ).bind(userId).first<{ member_id: string; thread_id: string }>();

  if (existing) {
    return { threadId: existing.thread_id, memberId: existing.member_id };
  }

  // Lazy-create. Pull the user's display fields for the founder member row.
  const user = await env.DB.prepare(
    `SELECT first_name, last_name, email FROM users WHERE id = ?`,
  ).bind(userId).first<{ first_name: string; last_name: string; email: string }>();
  if (!user) return null;

  const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || (user.email ?? 'Family');
  const threadName = `${(user.first_name ?? name).trim()}'s family thread`.trim();

  const threadId = crypto.randomUUID();
  const memberId = crypto.randomUUID();

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO threads (id, name, dedication, founder_user_id, default_visibility, plan, status)
       VALUES (?, ?, NULL, ?, 'FAMILY', 'FREE', 'ACTIVE')`,
    ).bind(threadId, threadName, userId),
    env.DB.prepare(
      `INSERT INTO thread_members
        (id, thread_id, user_id, display_name, email, relation_label, role, generation_offset)
       VALUES (?, ?, ?, ?, ?, 'founder', 'FOUNDER', 0)`,
    ).bind(memberId, threadId, userId, name, user.email),
  ]);

  return { threadId, memberId };
}

interface MirrorOptions {
  /** thread_entries.memory_id — set when mirroring a memory */
  memoryId?: string;
  /** thread_entries.voice_recording_id — set when mirroring a voice clip */
  voiceRecordingId?: string;
  /** Plain title saved to thread_entries.title (not encrypted in the mirror phase). */
  title?: string | null;
  /** Optional ISO date for an entry-level lock (used by letters/capsules with scheduled delivery). */
  dateLock?: string | null;
  /** Provide era_year if the source carried a memory_date so timeline browse works. */
  eraYear?: number | null;
}

const MUTABLE_GRACE_DAYS = 30;
function mutableUntil(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + MUTABLE_GRACE_DAYS);
  return d.toISOString();
}

/**
 * Best-effort: mirror the just-created legacy row as a thread_entries row.
 * Never throws — logs and returns null on any failure.
 */
export async function mirrorIntoDefaultThread(
  env: Env,
  userId: string | undefined,
  opts: MirrorOptions,
): Promise<string | null> {
  try {
    if (!userId) return null;
    const thread = await getOrCreateDefaultThread(env, userId);
    if (!thread) return null;

    const entryId = crypto.randomUUID();
    const inserts = [
      env.DB.prepare(
        `INSERT INTO thread_entries
          (id, thread_id, author_member_id, title, body_ciphertext, body_iv, body_auth_tag,
           voice_recording_id, memory_id, visibility, era_year, mutable_until)
         VALUES (?, ?, ?, ?, NULL, NULL, NULL, ?, ?, 'FAMILY', ?, ?)`,
      ).bind(
        entryId,
        thread.threadId,
        thread.memberId,
        opts.title ?? null,
        opts.voiceRecordingId ?? null,
        opts.memoryId ?? null,
        opts.eraYear ?? null,
        mutableUntil(),
      ),
    ];

    if (opts.dateLock) {
      inserts.push(
        env.DB.prepare(
          `INSERT INTO entry_unlocks (id, entry_id, lock_type, unlock_date, encrypted_key)
           VALUES (?, ?, 'DATE', ?, '')`,
        ).bind(crypto.randomUUID(), entryId, opts.dateLock),
      );
    }

    await env.DB.batch(inserts);
    return entryId;
  } catch (err) {
    console.error('[threadMesh] mirror failed', err);
    return null;
  }
}

interface MirrorMemberOptions {
  displayName: string;
  email?: string | null;
  relationLabel?: string | null;
  birthDate?: string | null;
}

/**
 * Best-effort: mirror a newly-created legacy family_member as a thread_members
 * row in the user's default thread. Default role is READER (safe — they get
 * read access to FAMILY-visibility entries; they don't write). Promote later
 * via the thread members UI when ready.
 */
/**
 * Best-effort: when a legacy memory/voice/letter is updated, propagate
 * scalar fields (currently just title) onto the matching thread_entries
 * row found via the FK pointer. Letters use a deterministic id mapping
 * since thread_entries doesn't have a letter_id column — we encoded the
 * relationship as id = 'lt' || letter.id during dual-write and backfill.
 */
export async function mirrorMemoryUpdate(env: Env, memoryId: string, opts: { title?: string | null }): Promise<void> {
  try {
    if (opts.title === undefined) return;
    await env.DB.prepare(
      `UPDATE thread_entries SET title = ?, updated_at = datetime('now') WHERE memory_id = ?`,
    ).bind(opts.title, memoryId).run();
  } catch (err) {
    console.error('[threadMesh] mirrorMemoryUpdate failed', err);
  }
}

export async function mirrorVoiceUpdate(env: Env, voiceId: string, opts: { title?: string | null }): Promise<void> {
  try {
    if (opts.title === undefined) return;
    await env.DB.prepare(
      `UPDATE thread_entries SET title = ?, updated_at = datetime('now') WHERE voice_recording_id = ?`,
    ).bind(opts.title, voiceId).run();
  } catch (err) {
    console.error('[threadMesh] mirrorVoiceUpdate failed', err);
  }
}

export async function mirrorLetterUpdate(env: Env, letterId: string, opts: { title?: string | null; salutation?: string | null }): Promise<void> {
  try {
    const title = opts.title ?? opts.salutation;
    if (title === undefined) return;
    await env.DB.prepare(
      `UPDATE thread_entries SET title = ?, updated_at = datetime('now') WHERE id = ?`,
    ).bind(title, `lt${letterId}`).run();
  } catch (err) {
    console.error('[threadMesh] mirrorLetterUpdate failed', err);
  }
}

/**
 * Best-effort: when a legacy entity is deleted, mark the matching
 * thread_entries row as visibility-revoked. We don't hard-delete because
 * threads are append-only; revocation hides the row from reads.
 *
 * For memories/voice we use the FK; for letters/capsules we use the
 * deterministic id pattern from the dual-write/backfill.
 */
export async function mirrorMemoryDelete(env: Env, memoryId: string): Promise<void> {
  try {
    await env.DB.prepare(
      `UPDATE thread_entries SET visibility_revoked_at = datetime('now'), updated_at = datetime('now') WHERE memory_id = ?`,
    ).bind(memoryId).run();
  } catch (err) {
    console.error('[threadMesh] mirrorMemoryDelete failed', err);
  }
}

export async function mirrorVoiceDelete(env: Env, voiceId: string): Promise<void> {
  try {
    await env.DB.prepare(
      `UPDATE thread_entries SET visibility_revoked_at = datetime('now'), updated_at = datetime('now') WHERE voice_recording_id = ?`,
    ).bind(voiceId).run();
  } catch (err) {
    console.error('[threadMesh] mirrorVoiceDelete failed', err);
  }
}

export async function mirrorLetterDelete(env: Env, letterId: string): Promise<void> {
  try {
    await env.DB.prepare(
      `UPDATE thread_entries SET visibility_revoked_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    ).bind(`lt${letterId}`).run();
  } catch (err) {
    console.error('[threadMesh] mirrorLetterDelete failed', err);
  }
}

export async function mirrorFamilyMemberIntoDefaultThread(
  env: Env,
  userId: string | undefined,
  opts: MirrorMemberOptions,
): Promise<string | null> {
  try {
    if (!userId) return null;
    const thread = await getOrCreateDefaultThread(env, userId);
    if (!thread) return null;

    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO thread_members
        (id, thread_id, display_name, email, relation_label, role, generation_offset,
         birth_date, granted_by_member_id)
       VALUES (?, ?, ?, ?, ?, 'READER', 0, ?, ?)`,
    ).bind(
      id,
      thread.threadId,
      opts.displayName,
      opts.email ?? null,
      opts.relationLabel ?? null,
      opts.birthDate ?? null,
      thread.memberId,
    ).run();

    return id;
  } catch (err) {
    console.error('[threadMesh] member mirror failed', err);
    return null;
  }
}
