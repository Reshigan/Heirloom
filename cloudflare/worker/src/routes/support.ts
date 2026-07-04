/**
 * Support Routes - Cloudflare Workers
 * Handles support ticket submission and admin notifications
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { AI_TEXT_MODEL } from '../lib/aiModels';

export const supportRoutes = new Hono<AppEnv>();

// Submit a support ticket
supportRoutes.post('/ticket', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  const ticketId = crypto.randomUUID();
  const ticketNumber = `HLM-${Date.now().toString(36).toUpperCase()}`;
  
  // Store ticket in database
  try {
    await c.env.DB.prepare(`
      INSERT INTO support_tickets (id, ticket_number, user_id, subject, category, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
    `).bind(ticketId, ticketNumber, userId, body.subject, body.category, body.description, now, now).run();
  } catch (dbError) {
    // If table doesn't exist, just log and continue (ticket will be sent via email only)
    console.error('Failed to store ticket in database (table may not exist):', dbError);
  }
  
  // Use dynamic import for sendEmail to ensure we get the correct module
  const { sendEmail: sendEmailUtil } = await import('../utils/email');
  
  // Send notification email to admin (no fallback - require proper configuration)
  const adminEmail = c.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.error('ADMIN_NOTIFICATION_EMAIL not configured');
  } else {
    const adminResult = await sendEmailUtil(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: adminEmail,
      subject: `[${ticketNumber}] New Support Ticket: ${body.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #cf8248;">New Support Ticket</h2>
          <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
          <p><strong>Category:</strong> ${body.category}</p>
          <p><strong>From:</strong> ${body.userName || 'Unknown'} (${body.userEmail || 'No email'})</p>
          <p><strong>Subject:</strong> ${body.subject}</p>
          <hr style="border: 1px solid #333;" />
          <h3>Description:</h3>
          <p style="white-space: pre-wrap;">${body.description}</p>
          <hr style="border: 1px solid #333;" />
          <p style="color: #666; font-size: 12px;">
            Reply to this email or log into the admin panel to respond.
          </p>
        </div>
      `,
    }, 'SUPPORT_TICKET_ADMIN_NOTIFICATION');
    if (!adminResult.success) {
      console.error('Failed to send admin notification email:', adminResult.error);
    }
  }
  
  // Send confirmation email to user
  if (body.userEmail) {
    const userResult = await sendEmailUtil(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: body.userEmail,
      subject: `[${ticketNumber}] We received your support request`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #070d14; color: #f5f5f0; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px; color: #cf8248;">&infin;</span>
            <h1 style="color: #cf8248; margin: 8px 0;">Heirloom</h1>
          </div>
          <h2>We've received your support request</h2>
          <p>Hi ${body.userName || 'there'},</p>
          <p>Thank you for contacting Heirloom support. We've received your ticket and will get back to you as soon as possible.</p>
          <div style="background: rgba(242,230,208,0.05); padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
            <p><strong>Subject:</strong> ${body.subject}</p>
            <p><strong>Category:</strong> ${body.category}</p>
          </div>
          <p>You can reply to this email if you need to add more information to your request.</p>
          <p style="color: #888; font-size: 12px; margin-top: 32px;">
            - The Heirloom Team
          </p>
        </div>
      `,
    }, 'SUPPORT_TICKET_USER_CONFIRMATION');
    if (!userResult.success) {
      console.error('Failed to send user confirmation email:', userResult.error);
    }
  }
  
  return c.json({
    success: true,
    ticketId,
    ticketNumber,
    message: 'Support ticket submitted successfully'
  }, 201);
});

// ─────────────────────────────────────────────────────────────────────────────
// Support assistant — an in-app AI chatbot grounded in Heirloom, with persisted
// per-user conversation history and one-tap escalation to a human.
// ─────────────────────────────────────────────────────────────────────────────

const SUPPORT_SYSTEM_PROMPT = `You are the Heirloom support assistant. Heirloom is a perpetual, append-only, multi-generational family archive — the Deep — owned by a bloodline, not a single user. The interface is deep water: entries settle into it and stay, the past held quietly below the present. Web app at heirloom.blue, also an installable PWA.

What you know about Heirloom:
- Entries are append-only — memories, letters, and voice recordings are never destroyed, only revised; the visible counter only climbs.
- Sealed letters can be written now and delivered later (on a date, a birthday, or after the writer is gone).
- Each family member owns a natural-dye colour that marks everything they add.
- Data is private and encrypted; the family owns the archive, never a platform.
- Tiers: Free, plus paid plans (billing is in Settings → billing).
- Family is invited from Settings → family; inheritance / stewardship is under /threads.
- Install the PWA from the browser's install prompt for offline access.

Your job:
- Answer questions about using Heirloom clearly and warmly, in 1–3 short sentences.
- Never invent features that don't exist. If unsure, say so and offer to escalate to a human.
- For account-specific issues (billing disputes, lost access, deletion, legal, a bug), tell the user you'll escalate to the Heirloom team and that they can tap "talk to a human".
- Be calm and plain. No emoji. No marketing fluff.`;

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

async function loadConversation(c: any, userId: string, conversationId?: string) {
  if (!conversationId) return null;
  const row = await c.env.DB.prepare(
    `SELECT id, user_id, ticket_number, status FROM support_conversations WHERE id = ? AND user_id = ?`
  ).bind(conversationId, userId).first();
  return row || null;
}

// POST /support/chat — send a message, get an AI reply; persists both.
supportRoutes.post('/chat', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json().catch(() => ({}));
  const message: string = (body.message || '').toString().trim();
  if (!message) return c.json({ error: 'message is required' }, 400);
  if (message.length > 4000) return c.json({ error: 'message too long' }, 400);

  const now = new Date().toISOString();

  // Resolve (or create) the conversation.
  let conv = await loadConversation(c, userId, body.conversationId);
  let conversationId: string;
  if (conv) {
    conversationId = conv.id as string;
  } else {
    conversationId = crypto.randomUUID();
    const title = message.slice(0, 60);
    try {
      await c.env.DB.prepare(
        `INSERT INTO support_conversations (id, user_id, title, status, created_at, updated_at)
         VALUES (?, ?, ?, 'OPEN', ?, ?)`
      ).bind(conversationId, userId, title, now, now).run();
    } catch (e) {
      console.error('support: failed to create conversation', e);
    }
  }

  // Persist the user message.
  try {
    await c.env.DB.prepare(
      `INSERT INTO support_chat_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, 'user', ?, ?)`
    ).bind(crypto.randomUUID(), conversationId, message, now).run();
  } catch (e) {
    console.error('support: failed to persist user message', e);
  }

  // Build the model context from recent history (cap to keep the prompt small).
  const history: ChatMessage[] = Array.isArray(body.history)
    ? body.history.filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-10)
    : [];

  let reply = '';
  try {
    const response = await c.env.AI.run(AI_TEXT_MODEL, {
      messages: [
        { role: 'system', content: SUPPORT_SYSTEM_PROMPT },
        ...history.map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })),
        { role: 'user', content: message },
      ],
      max_tokens: 300,
      temperature: 0.4,
    });
    reply = ((response as any).response || '').toString().trim();
  } catch (e) {
    console.error('support: AI.run failed', e);
  }
  if (!reply) {
    reply = "I'm having trouble answering just now. If this is urgent, tap \"talk to a human\" and the Heirloom team will pick it up.";
  }

  // Persist the assistant reply.
  try {
    await c.env.DB.prepare(
      `INSERT INTO support_chat_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, 'assistant', ?, ?)`
    ).bind(crypto.randomUUID(), conversationId, reply, new Date().toISOString()).run();
    await c.env.DB.prepare(`UPDATE support_conversations SET updated_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), conversationId).run();
  } catch (e) {
    console.error('support: failed to persist assistant message', e);
  }

  return c.json({ conversationId, reply });
});

// GET /support/conversations — the signed-in user's support history.
supportRoutes.get('/conversations', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const convs = await c.env.DB.prepare(
      `SELECT id, title, ticket_number, status, created_at, updated_at
       FROM support_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50`
    ).bind(userId).all();
    const rows = (convs.results || []) as any[];

    // Attach messages for each conversation (bounded set, kept simple).
    const withMessages = await Promise.all(rows.map(async (conv) => {
      const msgs = await c.env.DB.prepare(
        `SELECT role, content, created_at FROM support_chat_messages WHERE conversation_id = ? ORDER BY created_at ASC`
      ).bind(conv.id).all();
      return { ...conv, messages: msgs.results || [] };
    }));

    return c.json({ conversations: withMessages });
  } catch (e) {
    console.error('support: failed to list conversations', e);
    return c.json({ conversations: [] });
  }
});

// POST /support/escalate — hand a conversation to a human: open a ticket,
// email the support team + the user (with a reference number and transcript).
supportRoutes.post('/escalate', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const ticketNumber = `HLM-${Date.now().toString(36).toUpperCase()}`;
  const ticketId = crypto.randomUUID();

  // Resolve the conversation + its transcript.
  const conv = await loadConversation(c, userId, body.conversationId);
  let transcript = '';
  if (conv) {
    try {
      const msgs = await c.env.DB.prepare(
        `SELECT role, content FROM support_chat_messages WHERE conversation_id = ? ORDER BY created_at ASC`
      ).bind(conv.id).all();
      transcript = ((msgs.results || []) as any[])
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
    } catch (e) {
      console.error('support: failed to read transcript', e);
    }
  }
  if (!transcript && typeof body.transcript === 'string') transcript = body.transcript;

  // Look up the user's name/email for the emails.
  let userName = body.userName || '';
  let userEmail = body.userEmail || '';
  try {
    const u = await c.env.DB.prepare(`SELECT first_name, last_name, email FROM users WHERE id = ?`).bind(userId).first() as any;
    if (u) {
      userName = userName || `${u.first_name || ''} ${u.last_name || ''}`.trim();
      userEmail = userEmail || u.email || '';
    }
  } catch { /* non-fatal */ }

  const subject = (body.subject || 'Support conversation escalated').toString().slice(0, 140);

  // Record the ticket and mark the conversation escalated.
  try {
    await c.env.DB.prepare(
      `INSERT INTO support_tickets (id, ticket_number, user_id, subject, category, description, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'CHATBOT_ESCALATION', ?, 'ESCALATED', ?, ?)`
    ).bind(ticketId, ticketNumber, userId, subject, transcript || '(no transcript)', now, now).run();
  } catch (e) {
    console.error('support: failed to store escalation ticket', e);
  }
  if (conv) {
    try {
      await c.env.DB.prepare(`UPDATE support_conversations SET status = 'ESCALATED', ticket_number = ?, updated_at = ? WHERE id = ?`)
        .bind(ticketNumber, now, conv.id).run();
    } catch { /* non-fatal */ }
  }

  const { sendEmail: sendEmailUtil } = await import('../utils/email');
  const escalationEmail = c.env.SUPPORT_ESCALATION_EMAIL || c.env.ADMIN_NOTIFICATION_EMAIL || 'admin@heirloom.blue';
  const transcriptHtml = (transcript || '(no transcript)')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />');

  // Notify the support team.
  await sendEmailUtil(c.env, {
    from: 'Heirloom <noreply@heirloom.blue>',
    to: escalationEmail,
    replyTo: userEmail || undefined,
    subject: `[${ticketNumber}] Escalated from support assistant: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <h2 style="color: #b07a4a;">Support conversation escalated</h2>
        <p><strong>Reference:</strong> ${ticketNumber}</p>
        <p><strong>From:</strong> ${userName || 'Unknown'} (${userEmail || 'no email'})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <h3>Conversation transcript</h3>
        <p style="white-space: pre-wrap;">${transcriptHtml}</p>
      </div>
    `,
  }, 'SUPPORT_ESCALATION_TEAM').catch((e) => console.error('support: team email failed', e));

  // Confirm to the user with the reference number.
  if (userEmail) {
    await sendEmailUtil(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: userEmail,
      subject: `[${ticketNumber}] We've passed your question to a person`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #070d14; color: #f4ecd8; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;"><span style="font-size: 40px; color: #b07a4a;">&infin;</span></div>
          <h2 style="font-weight: 300;">A person is now reading your question</h2>
          <p>Hi ${userName || 'there'},</p>
          <p>Thanks for reaching out. Your conversation with the Heirloom assistant has been passed to a member of our team, who will reply to this email address.</p>
          <div style="border-left: 3px solid #b07a4a; padding: 8px 14px; margin: 24px 0;">
            <p style="margin: 0;"><strong>Your reference number:</strong> ${ticketNumber}</p>
          </div>
          <p>You can reply to this email to add anything else.</p>
          <p style="color: #8a8478; font-size: 12px; margin-top: 32px;">— The Heirloom team</p>
        </div>
      `,
    }, 'SUPPORT_ESCALATION_USER').catch((e) => console.error('support: user email failed', e));
  }

  return c.json({ success: true, ticketNumber });
});
