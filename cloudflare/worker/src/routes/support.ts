/**
 * Support Routes - Cloudflare Workers
 * Handles support ticket submission and admin notifications
 */

import { Hono } from 'hono';
import type { Env, AppEnv } from '../index';

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
  
  // Send notification email to admin
  if (c.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Heirloom Support <support@heirloom.blue>',
          to: ['admin@heirloom.blue', 'reshigan@gonxt.tech'],
          subject: `[${ticketNumber}] New Support Ticket: ${body.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #D4AF37;">New Support Ticket</h2>
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
        }),
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
    }
  }
  
  // Send confirmation email to user
  if (body.userEmail && c.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Heirloom Support <support@heirloom.blue>',
          to: [body.userEmail],
          subject: `[${ticketNumber}] We received your support request`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #f5f5f0; padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px; color: #D4AF37;">&infin;</span>
                <h1 style="color: #D4AF37; margin: 8px 0;">Heirloom</h1>
              </div>
              <h2>We've received your support request</h2>
              <p>Hi ${body.userName || 'there'},</p>
              <p>Thank you for contacting Heirloom support. We've received your ticket and will get back to you as soon as possible.</p>
              <div style="background: #1a1a2e; padding: 16px; border-radius: 8px; margin: 24px 0;">
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
        }),
      });
    } catch (emailError) {
      console.error('Failed to send user confirmation email:', emailError);
    }
  }
  
  return c.json({ 
    success: true, 
    ticketId, 
    ticketNumber,
    message: 'Support ticket submitted successfully' 
  }, 201);
});
