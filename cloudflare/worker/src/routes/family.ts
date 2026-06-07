/**
 * Family Routes - Cloudflare Workers
 * Handles family member CRUD operations
 */

import { Hono } from 'hono';
import type { Env, AppEnv } from '../index';
import { mirrorFamilyMemberIntoDefaultThread } from '../services/threadMesh';
import { readDescription } from '../lib/legacyArchive';

export const familyRoutes = new Hono<AppEnv>();

// Get all family members
familyRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  
  // Get family members with counts
  const members = await c.env.DB.prepare(`
    SELECT
      fm.*,
      (SELECT COUNT(*) FROM memory_recipients mr WHERE mr.family_member_id = fm.id) as memory_count,
      (SELECT COUNT(*) FROM letter_recipients lr WHERE lr.family_member_id = fm.id) as letter_count,
      (SELECT COUNT(*) FROM voice_recipients vr WHERE vr.family_member_id = fm.id) as voice_count
    FROM family_members fm
    WHERE fm.user_id = ? AND fm.deleted_at IS NULL
    ORDER BY fm.created_at ASC
  `).bind(userId).all();

  // Include soft-deleted members still within grace window so the UI can offer restore
  const pending = await c.env.DB.prepare(`
    SELECT fm.*
    FROM family_members fm
    WHERE fm.user_id = ? AND fm.deleted_at IS NOT NULL
      AND fm.deleted_at > datetime('now', '-7 days')
    ORDER BY fm.deleted_at DESC
  `).bind(userId).all();

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
      createdAt: m.created_at,
      deletedAt: m.deleted_at,
      pendingDeletion: true,
    })),
  ]);
});

// Get a specific family member
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
  
  const { name, relationship, email, phone, birthDate, notes, avatarUrl } = body;
  
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
      SELECT COUNT(*) as count FROM family_members WHERE user_id = ?
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
    INSERT INTO family_members (id, user_id, name, relationship, email, phone, birth_date, notes, avatar_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, name, relationship, email || null, phone || null, birthDate || null, notes || null, avatarUrl || null, now, now).run();

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
  
  const { name, relationship, email, phone, birthDate, notes, avatarUrl } = body;
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
        updated_at = ?
    WHERE id = ?
  `).bind(name ?? null, relationship ?? null, email ?? null, phone ?? null, birthDate ?? null, notes ?? null, avatarUrl ?? null, now, memberId).run();
  
  const member = await c.env.DB.prepare(`
    SELECT * FROM family_members WHERE id = ?
  `).bind(memberId).first();
  
  return c.json({
    id: member?.id,
    name: member?.name,
    relationship: member?.relationship,
    email: member?.email,
    phone: member?.phone,
    avatarUrl: member?.avatar_url,
    birthDate: member?.birth_date,
    notes: member?.notes,
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
