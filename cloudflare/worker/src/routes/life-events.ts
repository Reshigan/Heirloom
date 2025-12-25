import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { sendEmail } from '../utils/email';

export const lifeEventsRoutes = new Hono<AppEnv>();

// ============================================
// LIST LIFE EVENT TRIGGERS
// ============================================
lifeEventsRoutes.get('/', async (c) => {
  const userId = c.get('userId');

  const triggers = await c.env.DB.prepare(`
      SELECT let.*, fm.name as family_member_name, fm.relationship as family_member_relationship
      FROM life_event_triggers let
      LEFT JOIN family_members fm ON let.family_member_id = fm.id
      WHERE let.user_id = ?
      ORDER BY let.created_at DESC
    `).bind(userId).all();

    return c.json({ triggers: triggers.results || [] });
});

// ============================================
// GET SINGLE TRIGGER
// ============================================
lifeEventsRoutes.get('/:triggerId', async (c) => {
  const userId = c.get('userId');
  const triggerId = c.req.param('triggerId');

    const trigger = await c.env.DB.prepare(`
      SELECT let.*, fm.name as family_member_name, fm.relationship as family_member_relationship, fm.email as family_member_email
      FROM life_event_triggers let
      LEFT JOIN family_members fm ON let.family_member_id = fm.id
      WHERE let.id = ? AND let.user_id = ?
    `).bind(triggerId, userId).first();

    if (!trigger) {
      return c.json({ error: 'Trigger not found' }, 404);
    }

    // Parse content items and get details
    const contentItems = JSON.parse((trigger.content_items as string) || '[]');
    const contentDetails: unknown[] = [];

    for (const item of contentItems) {
      if (item.type === 'MEMORY') {
        const memory = await c.env.DB.prepare(
          'SELECT id, title, type, file_url FROM memories WHERE id = ? AND user_id = ?'
        ).bind(item.id, userId).first();
        if (memory) contentDetails.push({ ...memory, contentType: 'MEMORY' });
      } else if (item.type === 'LETTER') {
        const letter = await c.env.DB.prepare(
          'SELECT id, title FROM letters WHERE id = ? AND user_id = ?'
        ).bind(item.id, userId).first();
        if (letter) contentDetails.push({ ...letter, contentType: 'LETTER' });
      } else if (item.type === 'VOICE') {
        const voice = await c.env.DB.prepare(
          'SELECT id, title, duration FROM voice_recordings WHERE id = ? AND user_id = ?'
        ).bind(item.id, userId).first();
        if (voice) contentDetails.push({ ...voice, contentType: 'VOICE' });
      }
    }

  return c.json({ 
    trigger,
    contentDetails,
  });
});

// ============================================
// CREATE LIFE EVENT TRIGGER
// ============================================
lifeEventsRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

    const { 
      eventType, 
      eventName, 
      eventDescription, 
      familyMemberId, 
      recipientName, 
      recipientEmail,
      triggerMethod,
      scheduledDate,
      contentItems,
      notifyCreator
    } = body;

    if (!eventType || !eventName) {
      return c.json({ error: 'Event type and name are required' }, 400);
    }

    // Validate family member if provided
    if (familyMemberId) {
      const familyMember = await c.env.DB.prepare(
        'SELECT id FROM family_members WHERE id = ? AND user_id = ?'
      ).bind(familyMemberId, userId).first();
      
      if (!familyMember) {
        return c.json({ error: 'Family member not found' }, 404);
      }
    }

    const triggerId = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO life_event_triggers (
        id, user_id, event_type, event_name, event_description, 
        family_member_id, recipient_name, recipient_email,
        trigger_method, scheduled_date, content_items, notify_creator,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      triggerId,
      userId,
      eventType,
      eventName,
      eventDescription || null,
      familyMemberId || null,
      recipientName || null,
      recipientEmail || null,
      triggerMethod || 'MANUAL',
      scheduledDate || null,
      JSON.stringify(contentItems || []),
      notifyCreator !== false ? 1 : 0
    ).run();

    const trigger = await c.env.DB.prepare(
      'SELECT * FROM life_event_triggers WHERE id = ?'
    ).bind(triggerId).first();

  return c.json({ trigger }, 201);
});

// ============================================
// UPDATE LIFE EVENT TRIGGER
// ============================================
lifeEventsRoutes.patch('/:triggerId', async (c) => {
  const userId = c.get('userId');
  const triggerId = c.req.param('triggerId');
  const body = await c.req.json();

    const trigger = await c.env.DB.prepare(
      'SELECT * FROM life_event_triggers WHERE id = ? AND user_id = ?'
    ).bind(triggerId, userId).first();

    if (!trigger) {
      return c.json({ error: 'Trigger not found' }, 404);
    }

    // Can't update triggered/delivered triggers
    if (trigger.status !== 'PENDING') {
      return c.json({ error: 'Cannot update a trigger that has already been activated' }, 400);
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.eventName) {
      updates.push('event_name = ?');
      values.push(body.eventName);
    }
    if (body.eventDescription !== undefined) {
      updates.push('event_description = ?');
      values.push(body.eventDescription);
    }
    if (body.familyMemberId !== undefined) {
      updates.push('family_member_id = ?');
      values.push(body.familyMemberId);
    }
    if (body.recipientName !== undefined) {
      updates.push('recipient_name = ?');
      values.push(body.recipientName);
    }
    if (body.recipientEmail !== undefined) {
      updates.push('recipient_email = ?');
      values.push(body.recipientEmail);
    }
    if (body.triggerMethod) {
      updates.push('trigger_method = ?');
      values.push(body.triggerMethod);
    }
    if (body.scheduledDate !== undefined) {
      updates.push('scheduled_date = ?');
      values.push(body.scheduledDate);
    }
    if (body.contentItems) {
      updates.push('content_items = ?');
      values.push(JSON.stringify(body.contentItems));
    }
    if (typeof body.notifyCreator !== 'undefined') {
      updates.push('notify_creator = ?');
      values.push(body.notifyCreator ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(triggerId, userId);
      
      await c.env.DB.prepare(`
        UPDATE life_event_triggers SET ${updates.join(', ')} WHERE id = ? AND user_id = ?
      `).bind(...values).run();
    }

    const updated = await c.env.DB.prepare(
      'SELECT * FROM life_event_triggers WHERE id = ?'
    ).bind(triggerId).first();

  return c.json({ trigger: updated });
});

// ============================================
// MANUALLY TRIGGER EVENT
// ============================================
lifeEventsRoutes.post('/:triggerId/trigger', async (c) => {
  const userId = c.get('userId');
  const triggerId = c.req.param('triggerId');

    const trigger = await c.env.DB.prepare(`
      SELECT let.*, fm.email as family_member_email, fm.name as family_member_name
      FROM life_event_triggers let
      LEFT JOIN family_members fm ON let.family_member_id = fm.id
      WHERE let.id = ? AND let.user_id = ?
    `).bind(triggerId, userId).first();

    if (!trigger) {
      return c.json({ error: 'Trigger not found' }, 404);
    }

    if (trigger.status !== 'PENDING') {
      return c.json({ error: 'This event has already been triggered' }, 400);
    }

    // Get recipient email
    const recipientEmail = trigger.recipient_email || trigger.family_member_email;
    if (!recipientEmail) {
      return c.json({ error: 'No recipient email configured for this event' }, 400);
    }

    // Update status to triggered
    await c.env.DB.prepare(`
      UPDATE life_event_triggers SET status = 'TRIGGERED', triggered_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
    `).bind(triggerId).run();

    // Send email notification
    const resendApiKey = c.env.RESEND_API_KEY;
    if (resendApiKey) {
      const user = await c.env.DB.prepare(
        'SELECT first_name, last_name FROM users WHERE id = ?'
      ).bind(userId).first();

      const recipientName = trigger.recipient_name || trigger.family_member_name || 'Friend';
      const senderName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Someone special';

      try {
        await sendEmail(c.env, {
          from: 'Heirloom <noreply@heirloom.blue>',
          to: recipientEmail as string,
          subject: `${senderName} has a special message for your ${trigger.event_name}`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(135deg, #0a0c10 0%, #12151c 100%); color: #f5f0e8;">
              <h1 style="color: #c9a959; text-align: center; font-weight: normal;">A Message for Your ${trigger.event_name}</h1>
              <p style="text-align: center; color: #f5f0e8cc;">Dear ${recipientName},</p>
              <p style="text-align: center; color: #f5f0e8cc;">${senderName} prepared something special for this moment in your life.</p>
              ${trigger.event_description ? `<p style="text-align: center; color: #f5f0e8cc; font-style: italic;">"${trigger.event_description}"</p>` : ''}
              <div style="text-align: center; margin: 30px 0;">
                <a href="${c.env.APP_URL || 'https://heirloom.blue'}/inherit" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #c9a959 0%, #a08335 100%); color: #0a0c10; text-decoration: none; border-radius: 8px; font-weight: bold;">View Your Message</a>
              </div>
              <p style="text-align: center; color: #f5f0e899; font-size: 14px;">This message was prepared with love through Heirloom.</p>
            </div>
          `,
        }, 'LIFE_EVENT_NOTIFICATION');

        // Update to delivered
        await c.env.DB.prepare(`
          UPDATE life_event_triggers SET status = 'DELIVERED', delivered_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
        `).bind(triggerId).run();
      } catch (err) {
        console.error('Failed to send life event email:', err);
      }
    }

    const updated = await c.env.DB.prepare(
      'SELECT * FROM life_event_triggers WHERE id = ?'
    ).bind(triggerId).first();

  return c.json({ 
    trigger: updated,
    message: 'Event triggered and notification sent',
  });
});

// ============================================
// CANCEL TRIGGER
// ============================================
lifeEventsRoutes.post('/:triggerId/cancel', async (c) => {
  const userId = c.get('userId');
  const triggerId = c.req.param('triggerId');

    const trigger = await c.env.DB.prepare(
      'SELECT * FROM life_event_triggers WHERE id = ? AND user_id = ?'
    ).bind(triggerId, userId).first();

    if (!trigger) {
      return c.json({ error: 'Trigger not found' }, 404);
    }

    if (trigger.status === 'DELIVERED') {
      return c.json({ error: 'Cannot cancel a delivered event' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE life_event_triggers SET status = 'CANCELLED', updated_at = datetime('now') WHERE id = ?
    `).bind(triggerId).run();

    const updated = await c.env.DB.prepare(
      'SELECT * FROM life_event_triggers WHERE id = ?'
    ).bind(triggerId).first();

  return c.json({ trigger: updated });
});

// ============================================
// DELETE TRIGGER
// ============================================
lifeEventsRoutes.delete('/:triggerId', async (c) => {
  const userId = c.get('userId');
  const triggerId = c.req.param('triggerId');

    const trigger = await c.env.DB.prepare(
      'SELECT * FROM life_event_triggers WHERE id = ? AND user_id = ?'
    ).bind(triggerId, userId).first();

    if (!trigger) {
      return c.json({ error: 'Trigger not found' }, 404);
    }

    await c.env.DB.prepare(
      'DELETE FROM life_event_triggers WHERE id = ? AND user_id = ?'
    ).bind(triggerId, userId).run();

  return c.json({ success: true });
});

// ============================================
// GET EVENT TYPE OPTIONS
// ============================================
lifeEventsRoutes.get('/types/options', async (c) => {
  return c.json({
    eventTypes: [
      { value: 'GRADUATION', label: 'Graduation', icon: 'graduation-cap', description: 'High school, college, or any educational milestone' },
      { value: 'WEDDING', label: 'Wedding', icon: 'heart', description: 'Marriage celebration' },
      { value: 'FIRST_CHILD', label: 'First Child', icon: 'baby', description: 'Becoming a parent' },
      { value: 'BIRTHDAY_MILESTONE', label: 'Milestone Birthday', icon: 'cake', description: '18th, 21st, 30th, 50th, etc.' },
      { value: 'RETIREMENT', label: 'Retirement', icon: 'sunset', description: 'End of career celebration' },
      { value: 'CUSTOM', label: 'Custom Event', icon: 'star', description: 'Any other special occasion' },
    ],
    triggerMethods: [
      { value: 'MANUAL', label: 'Manual', description: 'You trigger it when the time is right' },
      { value: 'DATE', label: 'Scheduled Date', description: 'Automatically trigger on a specific date' },
      { value: 'RECIPIENT_CONFIRMS', label: 'Recipient Confirms', description: 'Recipient confirms the event happened' },
    ],
  });
});

export default lifeEventsRoutes;
