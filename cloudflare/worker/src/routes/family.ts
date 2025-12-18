/**
 * Family Routes - Cloudflare Workers
 * Handles family member CRUD operations
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const familyRoutes = new Hono<{ Bindings: Env }>();

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
    WHERE fm.user_id = ?
    ORDER BY fm.created_at ASC
  `).bind(userId).all();
  
  return c.json(members.results.map((m: any) => ({
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
  })));
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
  
  // Get recent memories
  const recentMemories = await c.env.DB.prepare(`
    SELECT m.* FROM memories m
    JOIN memory_recipients mr ON m.id = mr.memory_id
    WHERE mr.family_member_id = ?
    ORDER BY m.created_at DESC
    LIMIT 10
  `).bind(memberId).all();
  
  // Get recent letters
  const recentLetters = await c.env.DB.prepare(`
    SELECT l.* FROM letters l
    JOIN letter_recipients lr ON l.id = lr.letter_id
    WHERE lr.family_member_id = ?
    ORDER BY l.created_at DESC
    LIMIT 10
  `).bind(memberId).all();
  
  // Get recent voice recordings
  const recentVoice = await c.env.DB.prepare(`
    SELECT v.* FROM voice_recordings v
    JOIN voice_recipients vr ON v.id = vr.voice_recording_id
    WHERE vr.family_member_id = ?
    ORDER BY v.created_at DESC
    LIMIT 10
  `).bind(memberId).all();
  
  return c.json({
    id: member.id,
    name: member.name,
    relationship: member.relationship,
    email: member.email,
    phone: member.phone,
    avatarUrl: member.avatar_url,
    birthDate: member.birth_date,
    notes: member.notes,
    recentMemories: recentMemories.results,
    recentLetters: recentLetters.results,
    recentVoiceRecordings: recentVoice.results,
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
  `).bind(name, relationship, email, phone, birthDate, notes, avatarUrl, now, memberId).run();
  
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

// Delete a family member
familyRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const memberId = c.req.param('id');
  
  // Verify ownership
  const existing = await c.env.DB.prepare(`
    SELECT * FROM family_members WHERE id = ? AND user_id = ?
  `).bind(memberId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Family member not found' }, 404);
  }
  
  await c.env.DB.prepare(`
    DELETE FROM family_members WHERE id = ?
  `).bind(memberId).run();
  
  return c.body(null, 204);
});
