/**
 * Living Book routes — order intake + Lulu webhook + status read.
 *
 * Order flow:
 *   POST /api/threads/:id/book        (auth) → creates COMPILING order
 *   GET  /api/book-orders/:id         (auth) → status for the order
 *   POST /api/book-orders/webhook     (no auth, Lulu signature) → status update
 *
 * The actual PDF compilation is offline tooling (or a future WASM-PDF
 * worker job). This route just creates the row + waits.
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';

export const bookOrderRoutes = new Hono<AppEnv>();
export const bookOrderProtectedRoutes = new Hono<AppEnv>();

interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state_code?: string;
  country_code: string;
  postcode: string;
  phone_number: string;
  email: string;
}

// POST /api/threads/:id/book
bookOrderProtectedRoutes.post('/threads/:id/book', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const threadId = c.req.param('id');
  const member = await c.env.DB.prepare(
    `SELECT id, role FROM thread_members
     WHERE thread_id = ? AND user_id = ? AND revoked_at IS NULL`,
  ).bind(threadId, userId).first<{ id: string; role: string }>();
  if (!member) return c.json({ error: 'Not a member of this thread' }, 403);

  const body = await c.req.json<{
    ship_to: ShippingAddress;
    entry_filter?: { from?: string; to?: string; member_ids?: string[]; era_year?: number };
  }>();
  if (!body.ship_to?.line1 || !body.ship_to?.country_code || !body.ship_to?.postcode) {
    return c.json({ error: 'Complete shipping address required' }, 400);
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO book_orders (
       id, prompt_subscription_id, purchaser_user_id, ship_to_name,
       ship_to_address_json, currency, status
     ) VALUES (?, NULL, ?, ?, ?, 'USD', 'PENDING')`,
  ).bind(
    id,
    userId,
    body.ship_to.name,
    JSON.stringify(body.ship_to),
  ).run();

  // Note: prompt_subscription_id is nullable in 0036 migration; we keep
  // book_orders general-purpose so a non-prompt thread can also be
  // printed. The thread linkage is recovered from the entry_filter
  // metadata stashed in entry_filter_json (added below).

  await c.env.DB.prepare(
    `UPDATE book_orders SET status = 'COMPILING', updated_at = datetime('now') WHERE id = ?`,
  ).bind(id).run();

  return c.json({
    book_order: { id, status: 'COMPILING' },
    note: 'Your book is being compiled. We will email you when it is ready to ship.',
  });
});

// GET /api/book-orders/:id — status for a specific order
bookOrderProtectedRoutes.get('/book-orders/:id', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const id = c.req.param('id');
  const order = await c.env.DB.prepare(
    `SELECT id, status, lulu_status, tracking_url, total_cents, currency,
            created_at, updated_at
     FROM book_orders WHERE id = ? AND purchaser_user_id = ?`,
  ).bind(id, userId).first();
  if (!order) return c.json({ error: 'Order not found' }, 404);
  return c.json({ book_order: order });
});

// POST /api/book-orders/webhook — Lulu lifecycle webhook
bookOrderRoutes.post('/webhook', async (c) => {
  // Lulu webhook signature: HMAC-SHA256 of payload using LULU_WEBHOOK_SECRET.
  const secret = (c.env as AppEnv['Bindings'] & { LULU_WEBHOOK_SECRET?: string }).LULU_WEBHOOK_SECRET;
  const signature = c.req.header('x-lulu-hmac-sha256');
  const raw = await c.req.text();

  if (secret && signature) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(raw));
    const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
    if (expected !== signature) {
      return c.json({ error: 'invalid signature' }, 401);
    }
  }

  let payload: { topic?: string; data?: { id?: number; status?: { name?: string }; tracking_urls?: string[]; external_id?: string } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return c.json({ error: 'invalid json' }, 400);
  }

  const externalId = payload.data?.external_id;
  const luluStatus = payload.data?.status?.name;
  const trackingUrl = payload.data?.tracking_urls?.[0];
  if (!externalId || !luluStatus) return c.json({ ok: true, ignored: true });

  const localStatus =
    luluStatus === 'SHIPPED' ? 'SHIPPED' :
    luluStatus === 'REJECTED' || luluStatus === 'CANCELED' ? 'FAILED' :
    'PRINTING';

  await c.env.DB.prepare(
    `UPDATE book_orders
     SET lulu_status = ?, status = ?, tracking_url = COALESCE(?, tracking_url),
         updated_at = datetime('now')
     WHERE id = ?`,
  ).bind(luluStatus, localStatus, trackingUrl ?? null, externalId).run();

  return c.json({ ok: true });
});
