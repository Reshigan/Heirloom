import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { sendEmail } from '../utils/email';

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

// Send invite email for memory room
recipientExperienceRoutes.post('/memory-room/invite', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { email, name } = body;

  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  const room = await c.env.DB.prepare(
    'SELECT * FROM family_memory_rooms WHERE user_id = ?'
  ).bind(userId).first();

  if (!room) {
    return c.json({ error: 'Memory room not found' }, 404);
  }

  if (room.is_active !== 1) {
    return c.json({ error: 'Memory room is not active' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT first_name, last_name FROM users WHERE id = ?'
  ).bind(userId).first();

  const senderName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Someone special';
  const recipientName = name || 'Friend';
  const roomUrl = `${c.env.APP_URL || 'https://heirloom.blue'}/memory-room/${room.access_token}`;

  try {
    await sendEmail(c.env, {
      from: 'Heirloom <admin@heirloom.blue>',
      to: email,
      subject: `${senderName} invites you to share memories`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(135deg, #0a0c10 0%, #12151c 100%); color: #f5f0e8;">
          <h1 style="color: #c9a959; text-align: center; font-weight: normal; margin-bottom: 30px;">You're Invited to Share Memories</h1>
          <p style="text-align: center; color: #f5f0e8cc; font-size: 18px;">Dear ${recipientName},</p>
          <p style="text-align: center; color: #f5f0e8cc; line-height: 1.8;">
            ${senderName} has created a special space to collect memories and stories from the people who matter most. 
            Your memories, photos, and stories would mean the world.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${roomUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #c9a959 0%, #a08335 100%); color: #0a0c10; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Share Your Memories</a>
          </div>
          <p style="text-align: center; color: #f5f0e899; font-size: 14px;">
            Every story you share becomes part of a lasting legacy.
          </p>
          <hr style="border: none; border-top: 1px solid #f5f0e820; margin: 30px 0;" />
          <p style="text-align: center; color: #f5f0e860; font-size: 12px;">
            Sent with love through <a href="https://heirloom.blue" style="color: #c9a959;">Heirloom</a>
          </p>
        </div>
      `,
    }, 'MEMORY_ROOM_INVITE');

    return c.json({ success: true, message: 'Invitation sent' });
  } catch (error) {
    console.error('Failed to send invite email:', error);
    return c.json({ error: 'Failed to send invitation' }, 500);
  }
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

// ============================================
// TEST EMAIL TO SELF
// ============================================

// Send a test email to the user showing what recipients will receive
recipientExperienceRoutes.post('/test-email', async (c) => {
  const userId = c.get('userId');

  // Get user's email
  const user = await c.env.DB.prepare(
    'SELECT email, name FROM users WHERE id = ?'
  ).bind(userId).first<{ email: string; name: string }>();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Get content stats for the email
  const memoriesCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM memories WHERE user_id = ?'
  ).bind(userId).first<{ count: number }>();

  const lettersCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM letters WHERE user_id = ?'
  ).bind(userId).first<{ count: number }>();

  const voiceCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM voice_recordings WHERE user_id = ?'
  ).bind(userId).first<{ count: number }>();

  const totalContent = (memoriesCount?.count || 0) + (lettersCount?.count || 0) + (voiceCount?.count || 0);

  // Send test email
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>A Message From Someone Who Loves You</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #08080c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #08080c; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(180deg, rgba(235, 230, 220, 0.08) 0%, rgba(235, 230, 220, 0.04) 100%); border-radius: 16px; border: 1px solid rgba(235, 230, 220, 0.1);">
              <tr>
                <td style="padding: 40px;">
                  <!-- Logo -->
                  <div style="text-align: center; margin-bottom: 32px;">
                    <div style="width: 64px; height: 64px; margin: 0 auto; background: linear-gradient(135deg, #d4a853 0%, #9c7a3c 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #08080c; font-size: 28px; font-weight: 600;">H</span>
                    </div>
                  </div>
                  
                  <!-- Header -->
                  <h1 style="color: #ebe6dc; font-size: 24px; font-weight: 400; text-align: center; margin: 0 0 16px 0;">
                    A Message From Someone Who Loves You
                  </h1>
                  
                  <!-- Subheader -->
                  <p style="color: rgba(235, 230, 220, 0.6); font-size: 16px; text-align: center; margin: 0 0 32px 0;">
                    From Heirloom
                  </p>
                  
                  <!-- Content -->
                  <div style="color: rgba(235, 230, 220, 0.8); font-size: 16px; line-height: 1.6;">
                    <p style="margin: 0 0 16px 0;">Dear loved one,</p>
                    <p style="margin: 0 0 16px 0;">Someone who cares deeply about you has left you messages, memories, and stories they wanted you to have.</p>
                    <p style="margin: 0 0 24px 0;">When you're ready, click below to access your personal legacy portal.</p>
                  </div>
                  
                  <!-- Stats -->
                  <div style="background: rgba(212, 168, 83, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="color: #d4a853; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">What's waiting for you:</p>
                    <p style="color: #ebe6dc; font-size: 18px; margin: 0;">${totalContent} memories, letters, and voice messages</p>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin-bottom: 32px;">
                    <a href="https://heirloom.blue/inherit/preview" style="display: inline-block; background: linear-gradient(135deg, #d4a853 0%, #9c7a3c 100%); color: #08080c; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 8px;">
                      Access Your Legacy
                    </a>
                  </div>
                  
                  <!-- Footer Note -->
                  <p style="color: rgba(235, 230, 220, 0.4); font-size: 12px; text-align: center; margin: 0;">
                    This is a preview of what your recipients will receive. The actual email will be personalized for each recipient.
                  </p>
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <p style="color: rgba(235, 230, 220, 0.3); font-size: 12px; text-align: center; margin-top: 24px;">
              Heirloom - Preserve what matters most
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await sendEmail(c.env, {
      to: user.email,
      subject: '[TEST] A Message From Someone Who Loves You - Preview',
      html: emailHtml,
    });

    return c.json({ success: true, message: 'Test email sent to ' + user.email });
  } catch (error) {
    console.error('Failed to send test email:', error);
    return c.json({ error: 'Failed to send test email' }, 500);
  }
});

export default recipientExperienceRoutes;
