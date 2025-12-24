import { Hono } from 'hono';
import type { AppEnv } from '../index';

export const recipientExperienceRoutes = new Hono<AppEnv>();

// ============================================
// RELEASE SCHEDULES
// ============================================

// Get release schedules
recipientExperienceRoutes.get('/schedules', async (c) => {
  const userId = c.get('userId');

  let schedules = await c.env.DB.prepare(
    'SELECT * FROM release_schedules WHERE user_id = ? ORDER BY sort_order'
  ).bind(userId).all();

  // Create default schedules if none exist
  if (!schedules.results || schedules.results.length === 0) {
    const defaultSchedules = [
      { stage: 'IMMEDIATE', stage_name: 'Immediate Comfort', delay_days: 0, description: 'Essential messages and comfort for the first moments', sort_order: 1 },
      { stage: 'WEEK_1', stage_name: 'First Week', delay_days: 7, description: 'Stories and memories to help through the first week', sort_order: 2 },
      { stage: 'MONTH_1', stage_name: 'One Month', delay_days: 30, description: 'Deeper reflections and personal letters', sort_order: 3 },
      { stage: 'ANNIVERSARY', stage_name: 'Anniversaries', delay_days: 365, description: 'Special messages for anniversaries and milestones', sort_order: 4 },
    ];

    for (const schedule of defaultSchedules) {
      const id = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO release_schedules (id, user_id, stage, stage_name, delay_days, stage_description, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(id, userId, schedule.stage, schedule.stage_name, schedule.delay_days, schedule.description, schedule.sort_order).run();
    }

    schedules = await c.env.DB.prepare(
      'SELECT * FROM release_schedules WHERE user_id = ? ORDER BY sort_order'
    ).bind(userId).all();
  }

  return c.json({ schedules: schedules.results || [] });
});

// Update release schedule
recipientExperienceRoutes.patch('/schedules/:scheduleId', async (c) => {
  const userId = c.get('userId');
  const scheduleId = c.req.param('scheduleId');
  const body = await c.req.json();

  const schedule = await c.env.DB.prepare(
    'SELECT * FROM release_schedules WHERE id = ? AND user_id = ?'
  ).bind(scheduleId, userId).first();

  if (!schedule) {
    return c.json({ error: 'Schedule not found' }, 404);
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.stage_name) {
    updates.push('stage_name = ?');
    values.push(body.stage_name);
  }
  if (typeof body.delay_days !== 'undefined') {
    updates.push('delay_days = ?');
    values.push(body.delay_days);
  }
  if (body.stage_description) {
    updates.push('stage_description = ?');
    values.push(body.stage_description);
  }
  if (typeof body.enabled !== 'undefined') {
    updates.push('enabled = ?');
    values.push(body.enabled ? 1 : 0);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(scheduleId, userId);
    
    await c.env.DB.prepare(`
      UPDATE release_schedules SET ${updates.join(', ')} WHERE id = ? AND user_id = ?
    `).bind(...values).run();
  }

  const updated = await c.env.DB.prepare(
    'SELECT * FROM release_schedules WHERE id = ?'
  ).bind(scheduleId).first();

  return c.json({ schedule: updated });
});

// ============================================
// FAMILY MEMORY ROOM
// ============================================

// Get or create family memory room
recipientExperienceRoutes.get('/memory-room', async (c) => {
  const userId = c.get('userId');

  let room = await c.env.DB.prepare(
    'SELECT * FROM family_memory_rooms WHERE user_id = ?'
  ).bind(userId).first();

  if (!room) {
    const roomId = crypto.randomUUID();
    const accessToken = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO family_memory_rooms (id, user_id, access_token, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).bind(roomId, userId, accessToken).run();

    room = await c.env.DB.prepare(
      'SELECT * FROM family_memory_rooms WHERE user_id = ?'
    ).bind(userId).first();
  }

  // Get contribution count
  const contributions = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM family_room_contributions WHERE room_id = ?'
  ).bind(room?.id).first();

  return c.json({ 
    room,
    contributionCount: contributions?.count || 0,
  });
});

// Update memory room settings
recipientExperienceRoutes.patch('/memory-room', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.name) {
    updates.push('name = ?');
    values.push(body.name);
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    values.push(body.description);
  }
  if (typeof body.is_active !== 'undefined') {
    updates.push('is_active = ?');
    values.push(body.is_active ? 1 : 0);
    if (body.is_active) {
      updates.push("activated_at = datetime('now')");
    }
  }
  if (typeof body.allow_photos !== 'undefined') {
    updates.push('allow_photos = ?');
    values.push(body.allow_photos ? 1 : 0);
  }
  if (typeof body.allow_voice !== 'undefined') {
    updates.push('allow_voice = ?');
    values.push(body.allow_voice ? 1 : 0);
  }
  if (typeof body.allow_text !== 'undefined') {
    updates.push('allow_text = ?');
    values.push(body.allow_text ? 1 : 0);
  }
  if (typeof body.moderation_required !== 'undefined') {
    updates.push('moderation_required = ?');
    values.push(body.moderation_required ? 1 : 0);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(userId);
    
    await c.env.DB.prepare(`
      UPDATE family_memory_rooms SET ${updates.join(', ')} WHERE user_id = ?
    `).bind(...values).run();
  }

  const room = await c.env.DB.prepare(
    'SELECT * FROM family_memory_rooms WHERE user_id = ?'
  ).bind(userId).first();

  return c.json({ room });
});

// Get contributions (for room owner)
recipientExperienceRoutes.get('/memory-room/contributions', async (c) => {
  const userId = c.get('userId');

  const room = await c.env.DB.prepare(
    'SELECT id FROM family_memory_rooms WHERE user_id = ?'
  ).bind(userId).first();

  if (!room) {
    return c.json({ contributions: [] });
  }

  const contributions = await c.env.DB.prepare(
    'SELECT * FROM family_room_contributions WHERE room_id = ? ORDER BY created_at DESC'
  ).bind(room.id).all();

  return c.json({ contributions: contributions.results || [] });
});

// Moderate contribution
recipientExperienceRoutes.patch('/memory-room/contributions/:contributionId', async (c) => {
  const userId = c.get('userId');
  const contributionId = c.req.param('contributionId');
  const body = await c.req.json();

  const room = await c.env.DB.prepare(
    'SELECT id FROM family_memory_rooms WHERE user_id = ?'
  ).bind(userId).first();

  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }

  const contribution = await c.env.DB.prepare(
    'SELECT * FROM family_room_contributions WHERE id = ? AND room_id = ?'
  ).bind(contributionId, room.id).first();

  if (!contribution) {
    return c.json({ error: 'Contribution not found' }, 404);
  }

  if (body.status && ['APPROVED', 'REJECTED'].includes(body.status)) {
    await c.env.DB.prepare(`
      UPDATE family_room_contributions SET status = ?, moderated_at = datetime('now') WHERE id = ?
    `).bind(body.status, contributionId).run();
  }

  const updated = await c.env.DB.prepare(
    'SELECT * FROM family_room_contributions WHERE id = ?'
  ).bind(contributionId).first();

  return c.json({ contribution: updated });
});

// ============================================
// PUBLIC: Access family memory room
// ============================================

recipientExperienceRoutes.get('/room/:token', async (c) => {
  const token = c.req.param('token');

  const room = await c.env.DB.prepare(`
    SELECT fmr.*, u.first_name, u.last_name 
    FROM family_memory_rooms fmr 
    JOIN users u ON fmr.user_id = u.id 
    WHERE fmr.access_token = ? AND fmr.is_active = 1
  `).bind(token).first();

  if (!room) {
    return c.json({ error: 'Room not found or not active' }, 404);
  }

  const contributions = await c.env.DB.prepare(
    'SELECT * FROM family_room_contributions WHERE room_id = ? AND status = ? ORDER BY created_at DESC'
  ).bind(room.id, 'APPROVED').all();

  return c.json({
    room: {
      name: room.name,
      description: room.description,
      ownerName: `${room.first_name} ${room.last_name}`,
      allowPhotos: room.allow_photos === 1,
      allowVoice: room.allow_voice === 1,
      allowText: room.allow_text === 1,
    },
    contributions: contributions.results || [],
  });
});

// Add contribution to room (public)
recipientExperienceRoutes.post('/room/:token/contribute', async (c) => {
  const token = c.req.param('token');
  const body = await c.req.json();

  const room = await c.env.DB.prepare(
    'SELECT * FROM family_memory_rooms WHERE access_token = ? AND is_active = 1'
  ).bind(token).first();

  if (!room) {
    return c.json({ error: 'Room not found or not active' }, 404);
  }

  const { contributorName, contributorEmail, contributorRelationship, contentType, title, content } = body;

  if (!contributorName || !contentType || !content) {
    return c.json({ error: 'Name, content type, and content are required' }, 400);
  }

  if (contentType === 'PHOTO' && room.allow_photos !== 1) {
    return c.json({ error: 'Photos are not allowed in this room' }, 400);
  }
  if (contentType === 'VOICE' && room.allow_voice !== 1) {
    return c.json({ error: 'Voice recordings are not allowed in this room' }, 400);
  }
  if (contentType === 'TEXT' && room.allow_text !== 1) {
    return c.json({ error: 'Text contributions are not allowed in this room' }, 400);
  }

  const contributionId = crypto.randomUUID();
  const status = room.moderation_required === 1 ? 'PENDING' : 'APPROVED';

  await c.env.DB.prepare(`
    INSERT INTO family_room_contributions (id, room_id, contributor_name, contributor_email, contributor_relationship, content_type, title, content, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(contributionId, room.id, contributorName, contributorEmail || null, contributorRelationship || null, contentType, title || null, content, status).run();

  return c.json({ 
    success: true, 
    message: room.moderation_required === 1 
      ? 'Your contribution has been submitted and is awaiting approval' 
      : 'Your contribution has been added to the memory room',
  }, 201);
});

export default recipientExperienceRoutes;
