/**
 * Family Routes - Cloudflare Workers
 * Handles family member CRUD operations
 */

import { Hono } from 'hono';
import type { Env, AppEnv } from '../index';
import { mirrorFamilyMemberIntoDefaultThread } from '../services/threadMesh';
import { readDescription } from '../lib/legacyArchive';
import { sendEmail, notifyAuthorDeliveryFailed } from '../utils/email';
import { letterDeliveryEmail } from '../email-templates';

export const familyRoutes = new Hono<AppEnv>();

/**
 * Deliver letters that were meant to reach this recipient *now* but couldn't at
 * seal time because the recipient had no email address. Called when a member
 * gains (or changes) an email — that is the data-flow that "resends" a letter
 * written before the address existed.
 *
 * Scope is deliberately narrow: only IMMEDIATE, non-milestone, sealed,
 * not-yet-delivered letters that name this member as a recipient. SCHEDULED,
 * POSTHUMOUS and milestone letters stay sealed — they wait for their trigger or
 * an explicit release and must NOT fire merely because an address was added.
 *
 * Idempotent: a letter already DELIVERED to this address is skipped, so editing
 * the same email twice never double-sends. Per-recipient truth lives in
 * letter_deliveries; the letter-level delivered_at flag is intentionally left
 * untouched so other recipients' "awaiting" views are not disturbed.
 *
 * Best-effort: callers swallow errors — a delivery hiccup must never fail the
 * underlying family-member update.
 */
async function redeliverPendingLetters(
  env: Env,
  opts: { memberId: string; authorId: string; email: string },
): Promise<number> {
  const { memberId, authorId, email } = opts;

  const pending = await env.DB.prepare(`
    SELECT l.id, l.salutation, l.body, l.signature
    FROM letters l
    JOIN letter_recipients lr ON lr.letter_id = l.id
    WHERE lr.family_member_id = ?
      AND l.user_id = ?
      AND l.deleted_at IS NULL
      AND l.sealed_at IS NOT NULL
      AND l.delivery_trigger = 'IMMEDIATE'
      AND l.milestone_label IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM letter_deliveries d
        WHERE d.letter_id = l.id
          AND lower(d.recipient_email) = lower(?)
          AND d.status = 'DELIVERED'
      )
  `).bind(memberId, authorId, email).all();

  const rows = (pending.results as any[]) ?? [];
  if (rows.length === 0) return 0;

  const author = await env.DB.prepare(
    `SELECT first_name, last_name FROM users WHERE id = ?`,
  ).bind(authorId).first() as { first_name: string; last_name: string } | null;
  const senderName = `${author?.first_name ?? ''} ${author?.last_name ?? ''}`.trim() || 'your family';

  const member = await env.DB.prepare(
    `SELECT name FROM family_members WHERE id = ?`,
  ).bind(memberId).first() as { name: string } | null;
  const toName = member?.name || 'there';

  let sent = 0;
  let anyFailed = false;
  for (const letter of rows) {
    try {
      const { subject, html } = letterDeliveryEmail(toName, senderName, {
        salutation: letter.salutation || '',
        body: letter.body || '',
        signature: letter.signature || '',
      });
      const result = await sendEmail(
        env,
        { from: 'Heirloom <noreply@heirloom.blue>', to: email, subject, html },
        'letter_delivery',
      );
      // Only mark DELIVERED when the provider accepted the send. A failed send
      // leaves the row PENDING (or absent), so the next email change re-attempts
      // it rather than recording an unsent letter as delivered.
      if (!result.success) {
        anyFailed = true;
        continue;
      }

      const now = new Date().toISOString();
      // Mark this recipient's delivery DELIVERED. A PENDING row may already
      // exist (only if the address matched at seal); upsert either way.
      const upd: any = await env.DB.prepare(`
        UPDATE letter_deliveries SET status = 'DELIVERED', sent_at = ?, delivered_at = ?, updated_at = ?
        WHERE letter_id = ? AND lower(recipient_email) = lower(?)
      `).bind(now, now, now, letter.id, email).run();
      if (!upd?.meta?.changes) {
        await env.DB.prepare(`
          INSERT INTO letter_deliveries (id, letter_id, recipient_email, status, sent_at, delivered_at, created_at, updated_at)
          VALUES (?, ?, ?, 'DELIVERED', ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), letter.id, email, now, now, now, now).run();
      }
      sent++;
    } catch (err) {
      console.error('redeliverPendingLetters failed', letter.id, email, err);
      anyFailed = true;
    }
  }
  // One alert to the author if any of their letters couldn't be re-delivered.
  if (anyFailed) await notifyAuthorDeliveryFailed(env, authorId, [email]);
  return sent;
}

// Get all family members
familyRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  
  // Active members (with counts) and grace-window soft-deletes are independent
  // reads — fetch them in parallel (one round-trip instead of two sequential).
  const [members, pending] = await Promise.all([
    c.env.DB.prepare(`
      SELECT
        fm.*,
        (SELECT COUNT(*) FROM memory_recipients mr WHERE mr.family_member_id = fm.id) as memory_count,
        (SELECT COUNT(*) FROM letter_recipients lr WHERE lr.family_member_id = fm.id) as letter_count,
        (SELECT COUNT(*) FROM voice_recipients vr WHERE vr.family_member_id = fm.id) as voice_count
      FROM family_members fm
      WHERE fm.user_id = ? AND fm.deleted_at IS NULL
      ORDER BY fm.created_at ASC
      LIMIT 500
    `).bind(userId).all(),
    // Include soft-deleted members still within grace window so the UI can offer restore
    c.env.DB.prepare(`
      SELECT fm.*
      FROM family_members fm
      WHERE fm.user_id = ? AND fm.deleted_at IS NOT NULL
        AND fm.deleted_at > datetime('now', '-7 days')
      ORDER BY fm.deleted_at DESC
    `).bind(userId).all(),
  ]);

  return c.json([
    ...members.results.map((m: any) => ({
      id: m.id,
      name: m.name,
      relationship: m.relationship,
      email: m.email,
      phone: m.phone,
      avatarUrl: m.avatar_url,
      birthDate: m.birth_date,
      notes: m.notes,
      dye: m.dye,
      stats: {
        memories: m.memory_count || 0,
        letters: m.letter_count || 0,
        voiceRecordings: m.voice_count || 0,
      },
      createdAt: m.created_at,
    })),
    ...pending.results.map((m: any) => ({
      id: m.id,
      name: m.name,
      relationship: m.relationship,
      email: m.email,
      phone: m.phone,
      avatarUrl: m.avatar_url,
      birthDate: m.birth_date,
      notes: m.notes,
      dye: m.dye,
      createdAt: m.created_at,
      deletedAt: m.deleted_at,
      pendingDeletion: true,
    })),
  ]);
});

// Get a specific family member
// ---------------------------------------------------------------------------
// Member-to-member family-tree edges (migration 0071).
// Registered BEFORE `GET /:id` so the literal `/relationships` segment is not
// captured by the `/:id` param. type ∈ parent|child|spouse|sibling; label is an
// optional freeform ("mother", "step-father", "chosen sister"). Symmetric types
// (spouse/sibling) are canonicalized lower-id-first so a reversed edge cannot
// sneak past the UNIQUE(user_id, from_member_id, to_member_id, type). Both
// endpoints must belong to the caller and not be soft-deleted. Hard-delete —
// structural metadata, not legacy content.
// ---------------------------------------------------------------------------

const RELATION_TYPES = new Set(['parent', 'child', 'spouse', 'sibling']);
const SYMMETRIC = new Set(['spouse', 'sibling']);

familyRoutes.get('/relationships', async (c) => {
  const userId = c.get('userId');
  const rows = await c.env.DB.prepare(`
    SELECT fr.id, fr.from_member_id, fr.to_member_id, fr.type, fr.label,
           fm.name AS from_name, tm.name AS to_name
    FROM family_relationships fr
    JOIN family_members fm ON fm.id = fr.from_member_id
    JOIN family_members tm ON tm.id = fr.to_member_id
    WHERE fr.user_id = ?
      AND fm.deleted_at IS NULL AND tm.deleted_at IS NULL
    ORDER BY fr.created_at DESC
  `).bind(userId).all();
  return c.json({
    relationships: (rows.results as any[]).map((r) => ({
      id: r.id,
      fromMemberId: r.from_member_id,
      toMemberId: r.to_member_id,
      fromName: r.from_name,
      toName: r.to_name,
      type: r.type,
      label: r.label,
    })),
  });
});

familyRoutes.post('/relationships', async (c) => {
  const userId = c.get('userId');
  const body = await c.req
    .json<{ fromMemberId?: string; toMemberId?: string; type?: string; label?: string | null }>()
    .catch(() => ({} as { fromMemberId?: string; toMemberId?: string; type?: string; label?: string | null }));

  const fromId = body.fromMemberId?.trim();
  const toId = body.toMemberId?.trim();
  const type = body.type?.trim();
  const label = body.label?.trim() || null;

  if (!fromId || !toId) return c.json({ error: 'Two members are required' }, 400);
  if (fromId === toId) return c.json({ error: 'A member cannot be linked to themself' }, 400);
  if (!type || !RELATION_TYPES.has(type)) {
    return c.json({ error: 'Relationship type must be parent, child, spouse, or sibling' }, 400);
  }

  // Both endpoints must belong to the caller and not be soft-deleted.
  const endpoints = await c.env.DB.prepare(`
    SELECT id FROM family_members
    WHERE id IN (?, ?) AND user_id = ? AND deleted_at IS NULL
  `).bind(fromId, toId, userId).all();
  if ((endpoints.results as any[]).length !== 2) {
    return c.json({ error: 'Both members must be in your family' }, 404);
  }

  // Canonicalize symmetric edges lower-id-first so a reversed duplicate is
  // caught by the UNIQUE constraint instead of creating a phantom second edge.
  let from = fromId;
  let to = toId;
  if (SYMMETRIC.has(type) && from > to) {
    [from, to] = [to, from];
  }

  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(`
      INSERT INTO family_relationships (id, user_id, from_member_id, to_member_id, type, label)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, userId, from, to, type, label).run();
  } catch {
    return c.json({ error: 'These two are already linked that way' }, 409);
  }

  return c.json({ id, fromMemberId: from, toMemberId: to, type, label }, 201);
});

familyRoutes.delete('/relationships/:id', async (c) => {
  const userId = c.get('userId');
  const edgeId = c.req.param('id');
  const result = await c.env.DB.prepare(`
    DELETE FROM family_relationships WHERE id = ? AND user_id = ?
  `).bind(edgeId, userId).run();
  if ((result as any).meta.changes === 0) {
    return c.json({ error: 'Link not found' }, 404);
  }
  return c.body(null, 204);
});

familyRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const memberId = c.req.param('id');
  
  const member = await c.env.DB.prepare(`
    SELECT * FROM family_members WHERE id = ? AND user_id = ?
  `).bind(memberId, userId).first();
  
  if (!member) {
    return c.json({ error: 'Family member not found' }, 404);
  }
  
  // Run all three content queries in parallel to avoid N+1 latency
  const [recentMemories, recentLetters, recentVoice] = await Promise.all([
    c.env.DB.prepare(`
      SELECT m.* FROM memories m
      JOIN memory_recipients mr ON m.id = mr.memory_id
      WHERE mr.family_member_id = ? AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC
      LIMIT 10
    `).bind(memberId).all(),
    c.env.DB.prepare(`
      SELECT l.* FROM letters l
      JOIN letter_recipients lr ON l.id = lr.letter_id
      WHERE lr.family_member_id = ? AND l.deleted_at IS NULL
      ORDER BY l.created_at DESC
      LIMIT 10
    `).bind(memberId).all(),
    c.env.DB.prepare(`
      SELECT v.* FROM voice_recordings v
      JOIN voice_recipients vr ON v.id = vr.voice_recording_id
      WHERE vr.family_member_id = ? AND v.deleted_at IS NULL
      ORDER BY v.created_at DESC
      LIMIT 10
    `).bind(memberId).all(),
  ]);
  for (const m of recentMemories.results as any[]) {
    m.description = await readDescription(c.env, m);
  }
  
  return c.json({
    id: member.id,
    name: member.name,
    relationship: member.relationship,
    email: member.email,
    phone: member.phone,
    avatarUrl: member.avatar_url,
    birthDate: member.birth_date,
    notes: member.notes,
    dye: member.dye,
    recentMemories: (recentMemories.results as any[]).map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      type: m.type,
      fileUrl: m.file_url ?? null,
      createdAt: m.created_at,
    })),
    recentLetters: recentLetters.results,
    recentVoiceRecordings: (recentVoice.results as any[]).map((v) => {
      let fileUrl = v.file_url as string | null;
      if ((!fileUrl || fileUrl.includes('undefined')) && v.file_key) {
        fileUrl = `${c.env.API_URL}/api/voice/file/${encodeURIComponent(v.file_key)}`;
      }
      return {
        id: v.id,
        title: v.title,
        duration: v.duration,
        fileUrl,
        transcript: v.transcript,
        createdAt: v.created_at,
      };
    }),
    createdAt: member.created_at,
  });
});

// Create a new family member
familyRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { name, relationship, email, phone, birthDate, notes, avatarUrl, dye } = body;

  if (!name || !relationship) {
    return c.json({ error: 'Name and relationship are required' }, 400);
  }
  
  // Check tier limits
  const subscription = await c.env.DB.prepare(`
    SELECT tier FROM subscriptions WHERE user_id = ?
  `).bind(userId).first();
  
  const tier = subscription?.tier || 'STARTER';
  const limits: Record<string, number> = {
    STARTER: 2,
    FAMILY: 10,
    FOREVER: -1, // Unlimited
    // Legacy tier names for backwards compatibility
    FREE: 2,
    ESSENTIAL: 5,
    LEGACY: -1,
  };
  
  const maxRecipients = limits[tier as string] ?? 2;
  
  if (maxRecipients !== -1) {
    const count = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM family_members WHERE user_id = ? AND deleted_at IS NULL
    `).bind(userId).first();
    
    if ((count?.count as number) >= maxRecipients) {
      return c.json({ 
        error: `You've reached your limit of ${maxRecipients} family members. Upgrade your plan to add more.` 
      }, 403);
    }
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO family_members (id, user_id, name, relationship, email, phone, birth_date, notes, avatar_url, dye, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, name, relationship, email || null, phone || null, birthDate || null, notes || null, avatarUrl || null, dye || null, now, now).run();

  // Dual-write: also mirror as a thread member (READER role by default).
  await mirrorFamilyMemberIntoDefaultThread(c.env, userId, {
    displayName: name,
    email: email || null,
    relationLabel: relationship || null,
    birthDate: birthDate || null,
  });

  const member = await c.env.DB.prepare(`
    SELECT * FROM family_members WHERE id = ?
  `).bind(id).first();
  
  return c.json({
    id: member?.id,
    name: member?.name,
    relationship: member?.relationship,
    email: member?.email,
    phone: member?.phone,
    avatarUrl: member?.avatar_url,
    birthDate: member?.birth_date,
    notes: member?.notes,
    dye: member?.dye,
    createdAt: member?.created_at,
  }, 201);
});

// Update a family member
familyRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const memberId = c.req.param('id');
  const body = await c.req.json();
  
  // Verify ownership
  const existing = await c.env.DB.prepare(`
    SELECT * FROM family_members WHERE id = ? AND user_id = ?
  `).bind(memberId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Family member not found' }, 404);
  }
  
  const { name, relationship, email, phone, birthDate, notes, avatarUrl, dye } = body;
  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    UPDATE family_members
    SET name = COALESCE(?, name),
        relationship = COALESCE(?, relationship),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        birth_date = COALESCE(?, birth_date),
        notes = COALESCE(?, notes),
        avatar_url = COALESCE(?, avatar_url),
        dye = COALESCE(?, dye),
        updated_at = ?
    WHERE id = ?
  `).bind(name ?? null, relationship ?? null, email ?? null, phone ?? null, birthDate ?? null, notes ?? null, avatarUrl ?? null, dye ?? null, now, memberId).run();
  
  const member = await c.env.DB.prepare(`
    SELECT * FROM family_members WHERE id = ?
  `).bind(memberId).first();

  // Whenever a member with an email is saved, flush any letters that were
  // sealed to them before an address existed. Fires on every save (not just on
  // email change) so a member emailed *before* this feature shipped delivers on
  // their next edit — redeliverPendingLetters is idempotent (skips already-
  // DELIVERED) so re-running is a cheap no-op. Best-effort: a hiccup here must
  // never fail the member update.
  const newEmail = (member as any)?.email as string | null;
  if (newEmail && newEmail.trim()) {
    try {
      await redeliverPendingLetters(c.env, { memberId, authorId: userId as string, email: newEmail });
    } catch (err) {
      console.error('redeliverPendingLetters check failed', memberId, err);
    }
  }

  return c.json({
    id: member?.id,
    name: member?.name,
    relationship: member?.relationship,
    email: member?.email,
    phone: member?.phone,
    avatarUrl: member?.avatar_url,
    birthDate: member?.birth_date,
    notes: member?.notes,
    dye: member?.dye,
    createdAt: member?.created_at,
    updatedAt: member?.updated_at,
  });
});

// Soft-delete a family member — starts 7-day grace window before permanent removal.
// All content addressed to them is preserved during grace; purged after.
familyRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const memberId = c.req.param('id');

  const existing = await c.env.DB.prepare(`
    SELECT * FROM family_members WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).bind(memberId, userId).first();

  if (!existing) {
    return c.json({ error: 'Family member not found' }, 404);
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    UPDATE family_members SET deleted_at = ? WHERE id = ?
  `).bind(now, memberId).run();

  return c.json({ success: true, deletedAt: now, restoreBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });
});

// Restore a family member within the 7-day grace window
familyRoutes.patch('/:id/restore', async (c) => {
  const userId = c.get('userId');
  const memberId = c.req.param('id');

  const existing = await c.env.DB.prepare(`
    SELECT * FROM family_members
    WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL
      AND deleted_at > datetime('now', '-7 days')
  `).bind(memberId, userId).first();

  if (!existing) {
    return c.json({ error: 'Member not found or grace period expired' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE family_members SET deleted_at = NULL WHERE id = ?
  `).bind(memberId).run();

  return c.json({ success: true });
});
