/**
 * Founder pledge routes — first 100 families lifetime pledge.
 *
 * Public surface (no auth required for pledge intent):
 *   POST /api/founders/pledge   — capture lead + email admin
 *   GET  /api/founders/count    — how many pledges so far (for the public page)
 *
 * Admin surface (auth required):
 *   POST /api/admin/founders/:id/mark-paid  — flip to PAID + assign pledge number
 *
 * The flow is deliberately simple: leads pledge intent, an operator
 * sends a Stripe payment link, the operator marks paid. We can layer
 * Stripe Checkout automation later, but the lead capture + admin
 * notification is the minimum viable Founder funnel.
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { sendEmail } from '../utils/email';

export const founderRoutes = new Hono<AppEnv>();

const PLEDGE_AMOUNT_USD = 999;
const PLEDGE_CAP = 100;

founderRoutes.post('/pledge', async (c) => {
  const body = await c.req.json<{ name?: string; email?: string; family_name?: string; notes?: string }>();
  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  const familyName = (body.family_name ?? '').trim() || null;
  const notes = (body.notes ?? '').trim() || null;

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Name and a valid email are required.' }, 400);
  }

  // Refuse if the cap is reached.
  const paid = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM founder_pledges WHERE status = 'PAID'`).first<{ n: number }>();
  if ((paid?.n ?? 0) >= PLEDGE_CAP) {
    return c.json({ error: 'The first hundred Founder pledges are complete. Thank you.', cap_reached: true }, 410);
  }

  // Idempotent against duplicate intent.
  const existing = await c.env.DB.prepare(
    `SELECT id, status FROM founder_pledges WHERE email = ? AND status != 'REVOKED' LIMIT 1`,
  ).bind(email).first<{ id: string; status: string }>();
  if (existing) {
    return c.json({
      ok: true,
      already_pledged: true,
      status: existing.status,
      message: existing.status === 'PAID'
        ? 'You\'re already a Founder. Welcome.'
        : 'We already have your pledge. We\'ll be in touch shortly.',
    });
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO founder_pledges (id, name, email, family_name, notes, status)
     VALUES (?, ?, ?, ?, ?, 'PLEDGED')`,
  ).bind(id, name, email, familyName, notes).run();

  // Notify admin.
  const adminEmail = (c.env as AppEnv['Bindings'] & { ADMIN_NOTIFICATION_EMAIL?: string }).ADMIN_NOTIFICATION_EMAIL ?? 'admin@heirloom.blue';
  try {
    await sendEmail(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: adminEmail,
      subject: `New Founder pledge — ${name}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <p style="font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; color: #b07a4a;">Founder Pledge</p>
          <h2 style="font-weight: 300; font-size: 28px; margin: 8px 0 24px;">${escapeHtml(name)}</h2>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          ${familyName ? `<p><strong>Family:</strong> ${escapeHtml(familyName)}</p>` : ''}
          ${notes ? `<p style="white-space: pre-wrap;"><strong>Notes:</strong><br>${escapeHtml(notes)}</p>` : ''}
          <hr style="border: none; border-top: 1px solid rgba(0,0,0,0.1); margin: 24px 0;">
          <p style="font-size: 14px; color: rgba(0,0,0,0.6);">
            Send a Stripe payment link for $${PLEDGE_AMOUNT_USD}. Once paid, mark as PAID via the admin panel —
            that will assign the pledge number and trigger the Founder welcome flow.
          </p>
        </div>
      `,
    }, 'FOUNDER_PLEDGE');
  } catch (err) {
    console.error('founder pledge admin notify failed', err);
  }

  // Acknowledge to the prospective Founder.
  try {
    await sendEmail(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: email,
      subject: 'Thank you — your Founder pledge',
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; line-height: 1.7;">
          <p style="font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; color: #b07a4a;">Founder pledge</p>
          <h2 style="font-weight: 300; font-size: 28px; margin: 8px 0 24px;">Thank you, ${escapeHtml(name.split(' ')[0])}.</h2>
          <p>The Founder tier is capped at the first hundred families. Your pledge is recorded.</p>
          <p>We will be in touch within the next two business days with a payment link and the next steps. Once paid, you'll receive a Founder number, lifetime Family-tier access for your bloodline, and your name in the continuity record.</p>
          <p style="margin-top: 24px;">— The Heirloom team</p>
        </div>
      `,
    }, 'FOUNDER_PLEDGE_ACK');
  } catch (err) {
    console.error('founder pledge ack failed', err);
  }

  return c.json({ ok: true, id, status: 'PLEDGED' });
});

founderRoutes.get('/count', async (c) => {
  const row = await c.env.DB.prepare(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'PAID') AS paid,
       COUNT(*) FILTER (WHERE status = 'PLEDGED') AS pledged
     FROM founder_pledges`,
  ).first<{ paid: number; pledged: number }>();
  return c.json({
    paid: row?.paid ?? 0,
    pledged: row?.pledged ?? 0,
    cap: PLEDGE_CAP,
    remaining: Math.max(0, PLEDGE_CAP - (row?.paid ?? 0)),
    pledge_amount_usd: PLEDGE_AMOUNT_USD,
  });
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
