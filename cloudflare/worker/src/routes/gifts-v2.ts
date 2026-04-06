/**
 * Gift-a-Memory Routes - Heirloom v2
 * Send individual memories as gifts to non-users (viral loop)
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { sendEmail } from '../utils/email';

export const giftsV2Routes = new Hono<AppEnv>();

// Send a memory as a gift
giftsV2Routes.post('/send', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const now = new Date().toISOString();

  if (!body.memory_type || !body.memory_id || !body.recipient_email || !body.recipient_name) {
    return c.json({ error: 'memory_type, memory_id, recipient_email, and recipient_name are required' }, 400);
  }

  // Verify the memory exists and belongs to user
  let memoryTitle = 'A memory';
  if (body.memory_type === 'memory') {
    const memory = await c.env.DB.prepare(`SELECT title FROM memories WHERE id = ? AND user_id = ?`).bind(body.memory_id, userId).first();
    if (!memory) return c.json({ error: 'Memory not found' }, 404);
    memoryTitle = (memory.title as string) || 'A memory';
  } else if (body.memory_type === 'letter') {
    const letter = await c.env.DB.prepare(`SELECT subject FROM letters WHERE id = ? AND user_id = ?`).bind(body.memory_id, userId).first();
    if (!letter) return c.json({ error: 'Letter not found' }, 404);
    memoryTitle = (letter.subject as string) || 'A letter';
  } else if (body.memory_type === 'voice') {
    const voice = await c.env.DB.prepare(`SELECT title FROM voice_recordings WHERE id = ? AND user_id = ?`).bind(body.memory_id, userId).first();
    if (!voice) return c.json({ error: 'Voice recording not found' }, 404);
    memoryTitle = (voice.title as string) || 'A voice recording';
  }

  const token = crypto.randomUUID();
  const id = crypto.randomUUID();

  // Get sender info
  const sender = await c.env.DB.prepare(`SELECT first_name, last_name FROM users WHERE id = ?`).bind(userId).first();
  const senderName = `${sender?.first_name || ''} ${sender?.last_name || ''}`.trim() || 'Someone';

  await c.env.DB.prepare(`
    INSERT INTO gifts (id, sender_id, memory_type, memory_id, recipient_email, recipient_name, personal_message, token, unlock_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, userId, body.memory_type, body.memory_id,
    body.recipient_email, body.recipient_name,
    body.personal_message || null,
    token, body.unlock_date || null, now
  ).run();

  // Send gift email
  const giftUrl = `${c.env.APP_URL || 'https://heirloom.blue'}/gift-memory/${token}`;

  try {
    await sendEmail(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: body.recipient_email,
      subject: `${senderName} sent you a gift on Heirloom`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0a0c10; color: #f5f3ee; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 48px; color: #c9a959;">&infin;</span>
            <h1 style="color: #c9a959; font-family: Georgia, serif; margin: 8px 0;">You've received a gift</h1>
          </div>
          <p style="font-size: 18px; line-height: 1.6;">
            <strong>${senderName}</strong> has shared something special with you: <em>"${memoryTitle}"</em>
          </p>
          ${body.personal_message ? `<div style="background: #1a1a2e; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 3px solid #c9a959;"><p style="font-style: italic; color: #f5f3ee;">"${body.personal_message}"</p></div>` : ''}
          <div style="text-align: center; margin: 32px 0;">
            <a href="${giftUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #c9a959, #b8963e); color: #0a0c10; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
              Unwrap Your Gift
            </a>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 40px;">
            Powered by Heirloom &mdash; preserving what matters most
          </p>
        </div>
      `,
    }, 'GIFT_MEMORY');
  } catch (err) {
    console.error('Failed to send gift email:', err);
  }

  return c.json({ id, token, success: true }, 201);
});

// Receive gift (public - no auth required)
giftsV2Routes.get('/receive/:token', async (c) => {
  const token = c.req.param('token');

  const gift = await c.env.DB.prepare(`
    SELECT g.*, u.first_name as sender_first_name, u.last_name as sender_last_name
    FROM gifts g
    LEFT JOIN users u ON g.sender_id = u.id
    WHERE g.token = ?
  `).bind(token).first();

  if (!gift) {
    return c.json({ error: 'Gift not found or has expired' }, 404);
  }

  // Check unlock date
  if (gift.unlock_date) {
    const unlockDate = new Date(gift.unlock_date as string);
    if (new Date() < unlockDate) {
      return c.json({
        id: gift.id,
        sender_name: `${gift.sender_first_name || ''} ${gift.sender_last_name || ''}`.trim(),
        memory_type: gift.memory_type,
        personal_message: gift.personal_message,
        unlock_date: gift.unlock_date,
        claimed: !!gift.claimed_at,
        locked: true,
      });
    }
  }

  // Get memory preview info
  let content: any = null;
  if (gift.memory_type === 'memory') {
    content = await c.env.DB.prepare(`SELECT title, description as preview FROM memories WHERE id = ?`).bind(gift.memory_id).first();
  } else if (gift.memory_type === 'letter') {
    content = await c.env.DB.prepare(`SELECT subject as title, body as preview FROM letters WHERE id = ?`).bind(gift.memory_id).first();
  } else if (gift.memory_type === 'voice') {
    content = await c.env.DB.prepare(`SELECT title, transcript as preview FROM voice_recordings WHERE id = ?`).bind(gift.memory_id).first();
  }

  return c.json({
    id: gift.id,
    sender_name: `${gift.sender_first_name || ''} ${gift.sender_last_name || ''}`.trim(),
    memory_type: gift.memory_type,
    personal_message: gift.personal_message,
    unlock_date: gift.unlock_date,
    claimed: !!gift.claimed_at,
    content,
  });
});

// Claim gift (public)
giftsV2Routes.post('/claim/:token', async (c) => {
  const token = c.req.param('token');
  const now = new Date().toISOString();

  const gift = await c.env.DB.prepare(`
    SELECT * FROM gifts WHERE token = ?
  `).bind(token).first();

  if (!gift) {
    return c.json({ error: 'Gift not found' }, 404);
  }

  if (gift.claimed_at) {
    return c.json({ error: 'Gift has already been claimed' }, 400);
  }

  await c.env.DB.prepare(`
    UPDATE gifts SET claimed_at = ? WHERE id = ?
  `).bind(now, gift.id).run();

  return c.json({ success: true, claimed_at: now });
});

export default giftsV2Routes;
