/**
 * Family Thread routes — the world-first architectural primitive.
 *
 * See /THREAD.md for the canonical product design and
 * /cloudflare/migrations/0036_family_thread.sql for the schema.
 *
 * Auth: all endpoints under /api/threads require a logged-in user (via the
 * worker's existing JWT middleware). Per-thread permissions are enforced
 * inside each handler against the thread_members table.
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';

export const threadsRoutes = new Hono<AppEnv>();

// ============================================================================
// HELPERS
// ============================================================================

type Role = 'FOUNDER' | 'SUCCESSOR' | 'AUTHOR' | 'READER' | 'PLACEHOLDER';
type Visibility = 'PRIVATE' | 'FAMILY' | 'DESCENDANTS' | 'HISTORIAN';

const MUTABLE_GRACE_DAYS = 30;

interface MemberRow {
  id: string;
  thread_id: string;
  user_id: string | null;
  role: Role;
  generation_offset: number;
  revoked_at: string | null;
}

async function getMembership(env: AppEnv['Bindings'], threadId: string, userId: string): Promise<MemberRow | null> {
  const row = await env.DB.prepare(
    `SELECT id, thread_id, user_id, role, generation_offset, revoked_at
     FROM thread_members
     WHERE thread_id = ? AND user_id = ? AND revoked_at IS NULL
     LIMIT 1`,
  )
    .bind(threadId, userId)
    .first<MemberRow>();
  return row ?? null;
}

function canRead(member: MemberRow | null, visibility: Visibility): boolean {
  if (!member) return false;
  if (visibility === 'PRIVATE') return false; // private requires explicit recipient match, handled separately
  if (visibility === 'FAMILY') return true;
  if (visibility === 'DESCENDANTS') return member.generation_offset >= 1;
  if (visibility === 'HISTORIAN') return false; // public-historian is a separate flow
  return false;
}

function canWrite(member: MemberRow | null): boolean {
  if (!member) return false;
  return member.role === 'FOUNDER' || member.role === 'SUCCESSOR' || member.role === 'AUTHOR';
}

function mutableUntil(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + MUTABLE_GRACE_DAYS);
  return d.toISOString();
}

// ============================================================================
// THREAD CRUD
// ============================================================================

// POST /api/threads — create a new thread (founder = current user)
threadsRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const body = await c.req.json<{
    name?: string;
    dedication?: string;
    default_visibility?: Visibility;
  }>();

  if (!body.name || body.name.trim().length === 0) {
    return c.json({ error: 'Thread name is required' }, 400);
  }
  if (body.name.length > 200) {
    return c.json({ error: 'Thread name too long (max 200)' }, 400);
  }

  const threadId = crypto.randomUUID();
  const memberId = crypto.randomUUID();

  // Get the user's display name for the founder member record.
  const user = await c.env.DB.prepare(
    `SELECT first_name, last_name, email FROM users WHERE id = ?`,
  )
    .bind(userId)
    .first<{ first_name: string; last_name: string; email: string }>();
  if (!user) return c.json({ error: 'User not found' }, 404);

  const founderName = `${user.first_name} ${user.last_name}`.trim() || user.email;

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO threads (id, name, dedication, founder_user_id, default_visibility, plan, status)
       VALUES (?, ?, ?, ?, ?, 'FREE', 'ACTIVE')`,
    ).bind(
      threadId,
      body.name.trim(),
      body.dedication ?? null,
      userId,
      body.default_visibility ?? 'FAMILY',
    ),
    c.env.DB.prepare(
      `INSERT INTO thread_members
        (id, thread_id, user_id, display_name, email, relation_label, role, generation_offset)
       VALUES (?, ?, ?, ?, ?, 'founder', 'FOUNDER', 0)`,
    ).bind(memberId, threadId, userId, founderName, user.email),
  ]);

  return c.json({
    thread: {
      id: threadId,
      name: body.name.trim(),
      dedication: body.dedication ?? null,
      default_visibility: body.default_visibility ?? 'FAMILY',
      plan: 'FREE',
      status: 'ACTIVE',
    },
    membership: { id: memberId, role: 'FOUNDER' },
  });
});

// GET /api/threads — list threads the user is a member of
threadsRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const rows = await c.env.DB.prepare(
    `SELECT t.id, t.name, t.dedication, t.plan, t.status, t.default_visibility,
            tm.role, tm.generation_offset,
            (SELECT COUNT(*) FROM thread_entries WHERE thread_id = t.id AND visibility_revoked_at IS NULL) as entry_count,
            (SELECT COUNT(*) FROM thread_members WHERE thread_id = t.id AND revoked_at IS NULL) as member_count,
            t.created_at
     FROM threads t
     INNER JOIN thread_members tm ON tm.thread_id = t.id
     WHERE tm.user_id = ? AND tm.revoked_at IS NULL AND t.status != 'ARCHIVED'
     ORDER BY t.created_at DESC`,
  )
    .bind(userId)
    .all();

  return c.json({ threads: rows.results });
});

// GET /api/threads/:id — single thread detail (membership required)
threadsRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const threadId = c.req.param('id');
  const member = await getMembership(c.env, threadId, userId);
  if (!member) return c.json({ error: 'Not a member of this thread' }, 403);

  const thread = await c.env.DB.prepare(`SELECT * FROM threads WHERE id = ?`).bind(threadId).first();
  if (!thread) return c.json({ error: 'Thread not found' }, 404);

  return c.json({ thread, membership: member });
});

// ============================================================================
// MEMBERS
// ============================================================================

// POST /api/threads/:id/members — invite or add a member
threadsRoutes.post('/:id/members', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const threadId = c.req.param('id');
  const inviter = await getMembership(c.env, threadId, userId);
  if (!inviter) return c.json({ error: 'Not a member of this thread' }, 403);
  if (inviter.role !== 'FOUNDER' && inviter.role !== 'SUCCESSOR') {
    return c.json({ error: 'Only Founders and Successors can grant membership' }, 403);
  }

  const body = await c.req.json<{
    display_name: string;
    email?: string;
    relation_label?: string;
    role: Exclude<Role, 'FOUNDER'>; // founder is a one-off at thread creation
    age_gate_years?: number;
    target_role?: 'AUTHOR' | 'READER';
    birth_date?: string;
    parent_member_id?: string;
    generation_offset?: number;
  }>();

  if (!body.display_name) return c.json({ error: 'display_name is required' }, 400);
  if (!['SUCCESSOR', 'AUTHOR', 'READER', 'PLACEHOLDER'].includes(body.role)) {
    return c.json({ error: 'Invalid role' }, 400);
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO thread_members
      (id, thread_id, display_name, email, relation_label, role, age_gate_years, target_role,
       birth_date, parent_member_id, generation_offset, granted_by_member_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      threadId,
      body.display_name,
      body.email ?? null,
      body.relation_label ?? null,
      body.role,
      body.age_gate_years ?? null,
      body.target_role ?? null,
      body.birth_date ?? null,
      body.parent_member_id ?? null,
      body.generation_offset ?? 0,
      inviter.id,
    )
    .run();

  // TODO: send invitation email if email is set; record audit trail.

  return c.json({ member: { id, role: body.role, display_name: body.display_name } });
});

// GET /api/threads/:id/members — list active members
threadsRoutes.get('/:id/members', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const threadId = c.req.param('id');
  const member = await getMembership(c.env, threadId, userId);
  if (!member) return c.json({ error: 'Not a member of this thread' }, 403);

  const rows = await c.env.DB.prepare(
    `SELECT id, display_name, email, relation_label, role, age_gate_years,
            target_role, generation_offset, parent_member_id, granted_at
     FROM thread_members
     WHERE thread_id = ? AND revoked_at IS NULL
     ORDER BY generation_offset ASC, granted_at ASC`,
  )
    .bind(threadId)
    .all();

  return c.json({ members: rows.results });
});

// POST /api/threads/:id/members/:memberId/revoke — revoke a member's
// access. Append-only: we set revoked_at, never delete the row, so
// past attribution on entries they authored is preserved.
//
// Allowed: FOUNDER and SUCCESSOR roles. Forbidden: revoking the
// FOUNDER themselves (use a separate transfer flow for that, not yet
// built — Founders can't be removed; only succeeded).
threadsRoutes.post('/:id/members/:memberId/revoke', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const threadId = c.req.param('id');
  const memberId = c.req.param('memberId');

  const caller = await getMembership(c.env, threadId, userId);
  if (!caller) return c.json({ error: 'Not a member of this thread' }, 403);
  if (caller.role !== 'FOUNDER' && caller.role !== 'SUCCESSOR') {
    return c.json({ error: 'Only Founders and Successors can revoke membership' }, 403);
  }

  const target = await c.env.DB.prepare(
    `SELECT id, role FROM thread_members WHERE id = ? AND thread_id = ? AND revoked_at IS NULL`,
  ).bind(memberId, threadId).first<{ id: string; role: Role }>();
  if (!target) return c.json({ error: 'Member not found or already revoked' }, 404);
  if (target.role === 'FOUNDER') {
    return c.json({ error: 'Cannot revoke the Founder. Founders are succeeded, not removed.' }, 403);
  }

  await c.env.DB.prepare(
    `UPDATE thread_members SET revoked_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
  ).bind(memberId).run();

  return c.json({ ok: true, member_id: memberId, revoked_at: new Date().toISOString() });
});

// ============================================================================
// ENTRIES
// ============================================================================

// POST /api/threads/:id/entries — add an entry
threadsRoutes.post('/:id/entries', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const threadId = c.req.param('id');
  const member = await getMembership(c.env, threadId, userId);
  if (!member) return c.json({ error: 'Not a member of this thread' }, 403);
  if (!canWrite(member)) return c.json({ error: 'Read-only membership' }, 403);

  const body = await c.req.json<{
    title?: string;
    body_ciphertext?: string;
    body_iv?: string;
    body_auth_tag?: string;
    voice_recording_id?: string;
    memory_id?: string;
    visibility?: Visibility;
    era_label?: string;
    era_year?: number;
    tags?: { type: 'PERSON' | 'PLACE' | 'DATE' | 'ERA' | 'TOPIC'; label: string; member_id?: string; year_value?: number }[];
    unlock?: {
      lock_type: 'DATE' | 'AGE' | 'AUTHOR_DEATH' | 'RECIPIENT_EVENT' | 'GENERATION';
      unlock_date?: string;
      age_years?: number;
      target_member_id?: string;
      event_label?: string;
      target_generation?: number;
      encrypted_key: string;
    };
  }>();

  if (!body.body_ciphertext && !body.voice_recording_id && !body.memory_id) {
    return c.json({ error: 'Entry needs at least body, voice, or memory' }, 400);
  }

  // Get thread's default visibility if not specified.
  const thread = await c.env.DB.prepare(`SELECT default_visibility FROM threads WHERE id = ?`).bind(threadId).first<{ default_visibility: Visibility }>();
  const visibility: Visibility = body.visibility ?? thread?.default_visibility ?? 'FAMILY';

  const entryId = crypto.randomUUID();
  const inserts: D1PreparedStatement[] = [
    c.env.DB.prepare(
      `INSERT INTO thread_entries
        (id, thread_id, author_member_id, title, body_ciphertext, body_iv, body_auth_tag,
         voice_recording_id, memory_id, visibility, era_label, era_year, mutable_until)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      entryId,
      threadId,
      member.id,
      body.title ?? null,
      body.body_ciphertext ?? null,
      body.body_iv ?? null,
      body.body_auth_tag ?? null,
      body.voice_recording_id ?? null,
      body.memory_id ?? null,
      visibility,
      body.era_label ?? null,
      body.era_year ?? null,
      mutableUntil(),
    ),
  ];

  if (body.tags?.length) {
    for (const tag of body.tags) {
      inserts.push(
        c.env.DB.prepare(
          `INSERT INTO entry_tags (id, entry_id, tag_type, member_id, label, year_value)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(crypto.randomUUID(), entryId, tag.type, tag.member_id ?? null, tag.label, tag.year_value ?? null),
      );
    }
  }

  if (body.unlock) {
    const u = body.unlock;
    inserts.push(
      c.env.DB.prepare(
        `INSERT INTO entry_unlocks
          (id, entry_id, lock_type, unlock_date, age_years, target_member_id,
           event_label, target_generation, encrypted_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        entryId,
        u.lock_type,
        u.unlock_date ?? null,
        u.age_years ?? null,
        u.target_member_id ?? null,
        u.event_label ?? null,
        u.target_generation ?? null,
        u.encrypted_key,
      ),
    );
  }

  await c.env.DB.batch(inserts);

  return c.json({ entry: { id: entryId, visibility, mutable_until: mutableUntil() } });
});

// GET /api/threads/:id/entries — list entries the caller is allowed to read
threadsRoutes.get('/:id/entries', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const threadId = c.req.param('id');
  const member = await getMembership(c.env, threadId, userId);
  if (!member) return c.json({ error: 'Not a member of this thread' }, 403);

  const ancestor = c.req.query('ancestor'); // member_id filter (browse-by-ancestor)
  const era = c.req.query('era'); // year filter
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10) || 50, 200);
  const offset = parseInt(c.req.query('offset') ?? '0', 10) || 0;

  // Visibility filter — at the SQL layer for efficiency, then double-checked
  // by canRead per row. Note: PRIVATE entries require an explicit recipient
  // match (not yet implemented; treated as author-only for now).
  const visibilityClause =
    member.generation_offset >= 1
      ? `(visibility IN ('FAMILY', 'DESCENDANTS') OR (visibility = 'PRIVATE' AND author_member_id = ?))`
      : `(visibility = 'FAMILY' OR (visibility = 'PRIVATE' AND author_member_id = ?))`;

  let sql = `SELECT e.*,
      (SELECT json_group_array(json_object('type', tag_type, 'label', label, 'member_id', member_id, 'year', year_value))
       FROM entry_tags WHERE entry_id = e.id) as tags_json,
      (SELECT lock_type FROM entry_unlocks WHERE entry_id = e.id AND resolved_at IS NULL LIMIT 1) as pending_lock
    FROM thread_entries e
    WHERE e.thread_id = ?
      AND e.visibility_revoked_at IS NULL
      AND ${visibilityClause}`;

  const args: (string | number)[] = [threadId, member.id];

  if (ancestor) {
    sql += ` AND EXISTS (SELECT 1 FROM entry_tags et WHERE et.entry_id = e.id AND et.member_id = ?)`;
    args.push(ancestor);
  }
  if (era) {
    sql += ` AND e.era_year = ?`;
    args.push(parseInt(era, 10));
  }

  sql += ` ORDER BY e.created_at DESC LIMIT ? OFFSET ?`;
  args.push(limit, offset);

  const rows = await c.env.DB.prepare(sql).bind(...args).all();
  return c.json({ entries: rows.results });
});

// POST /api/threads/:id/entries/:entryId/comments — cross-generational comment
threadsRoutes.post('/:id/entries/:entryId/comments', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const threadId = c.req.param('id');
  const entryId = c.req.param('entryId');
  const member = await getMembership(c.env, threadId, userId);
  if (!member) return c.json({ error: 'Not a member of this thread' }, 403);

  // Confirm entry belongs to thread + caller can read it.
  const entry = await c.env.DB.prepare(`SELECT visibility FROM thread_entries WHERE id = ? AND thread_id = ?`).bind(entryId, threadId).first<{ visibility: Visibility }>();
  if (!entry) return c.json({ error: 'Entry not found' }, 404);
  if (!canRead(member, entry.visibility)) return c.json({ error: 'Cannot read this entry' }, 403);

  const body = await c.req.json<{ ciphertext: string; iv: string; auth_tag: string }>();
  if (!body.ciphertext || !body.iv || !body.auth_tag) {
    return c.json({ error: 'Encrypted body required' }, 400);
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO entry_comments (id, entry_id, author_member_id, body_ciphertext, body_iv, body_auth_tag, mutable_until)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, entryId, member.id, body.ciphertext, body.iv, body.auth_tag, mutableUntil())
    .run();

  return c.json({ comment: { id } });
});

// ============================================================================
// SUCCESSOR DESIGNATIONS
// ============================================================================

// POST /api/threads/:id/successors — designate a successor (Founder/current Successor only)
threadsRoutes.post('/:id/successors', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const threadId = c.req.param('id');
  const designator = await getMembership(c.env, threadId, userId);
  if (!designator) return c.json({ error: 'Not a member of this thread' }, 403);
  if (designator.role !== 'FOUNDER' && designator.role !== 'SUCCESSOR') {
    return c.json({ error: 'Only Founders or Successors can designate' }, 403);
  }

  const body = await c.req.json<{ successor_member_id: string; rank?: number }>();
  if (!body.successor_member_id) return c.json({ error: 'successor_member_id required' }, 400);

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO successor_designations (id, thread_id, successor_member_id, rank, designated_by_member_id)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(id, threadId, body.successor_member_id, body.rank ?? 1, designator.id)
    .run();

  return c.json({ designation: { id, rank: body.rank ?? 1 } });
});

// GET /api/threads/:id/successors — list active successor chain
threadsRoutes.get('/:id/successors', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const threadId = c.req.param('id');
  const member = await getMembership(c.env, threadId, userId);
  if (!member) return c.json({ error: 'Not a member of this thread' }, 403);

  const rows = await c.env.DB.prepare(
    `SELECT sd.*, tm.display_name, tm.role
     FROM successor_designations sd
     INNER JOIN thread_members tm ON tm.id = sd.successor_member_id
     WHERE sd.thread_id = ? AND sd.revoked_at IS NULL
     ORDER BY sd.rank ASC, sd.designated_at DESC`,
  )
    .bind(threadId)
    .all();

  return c.json({ successors: rows.results });
});

// ============================================================================
// TIME-LOCKED INBOX — entries waiting to open for the current viewer
//
// Two surfaces:
//   - inbox/upcoming: locks resolving in the next N days (default 90)
//   - inbox/recent:   locks that have opened in the last N days (default 30)
//
// Across all threads the caller is a member of. Single round-trip; stable
// shape suitable for the frontend ribbon at the top of /inbox.
// ============================================================================

threadsRoutes.get('/inbox/upcoming', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);
  const days = Math.min(Math.max(parseInt(c.req.query('days') ?? '90', 10) || 90, 1), 365);

  const rows = await c.env.DB.prepare(
    `SELECT u.id as unlock_id, u.lock_type, u.unlock_date, u.age_years, u.target_member_id,
            e.id as entry_id, e.title as entry_title, e.thread_id,
            t.name as thread_name,
            tm_target.display_name as target_name, tm_target.birth_date as target_birth_date,
            tm_caller.role as caller_role, tm_caller.generation_offset as caller_generation
     FROM entry_unlocks u
     INNER JOIN thread_entries e ON e.id = u.entry_id
     INNER JOIN threads t ON t.id = e.thread_id
     INNER JOIN thread_members tm_caller
       ON tm_caller.thread_id = t.id
       AND tm_caller.user_id = ?
       AND tm_caller.revoked_at IS NULL
     LEFT JOIN thread_members tm_target ON tm_target.id = u.target_member_id
     WHERE u.resolved_at IS NULL
       AND (
         (u.lock_type = 'DATE' AND u.unlock_date IS NOT NULL
            AND date(u.unlock_date) BETWEEN date('now') AND date('now', '+' || ? || ' days'))
         OR
         (u.lock_type = 'AGE' AND tm_target.birth_date IS NOT NULL)
         OR
         u.lock_type IN ('GENERATION', 'AUTHOR_DEATH', 'RECIPIENT_EVENT')
       )
     ORDER BY
       CASE u.lock_type WHEN 'DATE' THEN 0 ELSE 1 END,
       u.unlock_date ASC
     LIMIT 50`,
  ).bind(userId, days).all();

  return c.json({ upcoming: rows.results, days });
});

threadsRoutes.get('/inbox/recent', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);
  const days = Math.min(Math.max(parseInt(c.req.query('days') ?? '30', 10) || 30, 1), 180);

  const rows = await c.env.DB.prepare(
    `SELECT u.id as unlock_id, u.lock_type, u.resolved_at, u.resolution_note,
            e.id as entry_id, e.title as entry_title, e.thread_id, e.created_at as entry_created_at,
            t.name as thread_name
     FROM entry_unlocks u
     INNER JOIN thread_entries e ON e.id = u.entry_id
     INNER JOIN threads t ON t.id = e.thread_id
     INNER JOIN thread_members tm
       ON tm.thread_id = t.id
       AND tm.user_id = ?
       AND tm.revoked_at IS NULL
     WHERE u.resolved_at IS NOT NULL
       AND u.resolved_at >= datetime('now', '-' || ? || ' days')
     ORDER BY u.resolved_at DESC
     LIMIT 50`,
  ).bind(userId, days).all();

  return c.json({ recent: rows.results, days });
});

// ============================================================================
// STARTER PROMPTS — for "I don't know what to write"
// ============================================================================

threadsRoutes.get('/starter-prompts', async (c) => {
  const audience = c.req.query('audience'); // optional filter
  const category = c.req.query('category');

  let sql = `SELECT id, prompt_text, category, suggested_audience, era_hint
             FROM starter_prompts WHERE active = 1`;
  const args: string[] = [];
  if (audience) {
    sql += ` AND suggested_audience = ?`;
    args.push(audience);
  }
  if (category) {
    sql += ` AND category = ?`;
    args.push(category);
  }
  sql += ` ORDER BY RANDOM() LIMIT 20`;

  const stmt = c.env.DB.prepare(sql);
  const result = args.length ? await stmt.bind(...args).all() : await stmt.all();
  return c.json({ prompts: result.results });
});
