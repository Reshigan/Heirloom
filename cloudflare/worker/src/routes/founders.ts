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

export const founderRoutes = new Hono<AppEnv>();

const PLEDGE_AMOUNT_USD = 249;
const PLEDGE_CAP = 100;

founderRoutes.post('/pledge', async (c) => {
  // Founder SKU withdrawn from sale — pledges are CLOSED. Server gate (not just
  // the removed UI) so a direct POST can't open a Stripe checkout. /count,
  // /by-session and admin mark-paid stay live so in-flight pledges still resolve.
  return c.json({ error: 'Founder pledges are closed.', closed: true }, 410);
});

// Public: lookup the pledge by Stripe session id. Used by /founder/welcome
// to surface the Founder number once the webhook has processed the
// payment. Returns minimal info — just enough to render the welcome page.
founderRoutes.get('/by-session', async (c) => {
  const sessionId = c.req.query('session_id');
  if (!sessionId) return c.json({ ok: false, error: 'session_id required' }, 400);
  const row = await c.env.DB.prepare(
    `SELECT pledge_number, status, family_name FROM founder_pledges WHERE stripe_session_id = ?`,
  ).bind(sessionId).first<{ pledge_number: number | null; status: string; family_name: string | null }>();
  if (!row) return c.json({ ok: false, status: 'NOT_FOUND' });
  return c.json({
    ok: true,
    pledge_number: row.pledge_number,
    status: row.status,
    family_name: row.family_name,
  });
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
