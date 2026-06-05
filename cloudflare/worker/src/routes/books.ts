/**
 * Living Book routes — order intake + Lulu webhook + status read.
 *
 * Order flow:
 *   POST /api/threads/:id/book        (auth) → creates COMPILING order, kicks off PDF render
 *   GET  /api/book-orders/:id         (auth) → status for the order
 *   POST /api/book-orders/webhook     (no auth, Lulu signature) → status update
 *
 * PDF rendering happens async via waitUntil() — the response returns
 * immediately while pdf-lib builds the interior + cover in the background,
 * uploads to R2, and submits the Lulu print job.
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { renderBookPdf } from '../services/bookPdf';
import { sendBookShippedEmail } from '../services/book';

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
       ship_to_address_json, thread_id, entry_filter_json, currency, status
     ) VALUES (?, NULL, ?, ?, ?, ?, ?, 'USD', 'COMPILING')`,
  ).bind(
    id,
    userId,
    body.ship_to.name,
    JSON.stringify(body.ship_to),
    threadId,
    body.entry_filter ? JSON.stringify(body.entry_filter) : null,
  ).run();

  // Kick off PDF rendering asynchronously — response returns immediately
  // while pdf-lib builds interior + cover PDFs, uploads to R2, and
  // submits the Lulu print job.
  c.executionCtx.waitUntil(
    renderBookPdf(c.env, id).catch(async (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      await c.env.DB.prepare(
        `UPDATE book_orders SET status = 'FAILED', error = ?, updated_at = datetime('now') WHERE id = ?`,
      ).bind(msg, id).run();
    }),
  );

  return c.json({
    book_order: { id, status: 'COMPILING' },
    note: 'Your book is being compiled. We will email you when it is ready to ship.',
  });
});

// POST /api/book-orders/checkout — create a Stripe Checkout Session for a
// paid Living Book print order. The book_orders row is NOT created here;
// it is created on checkout.session.completed (see billing webhook), so we
// only ever render+print for paid orders. Ship-to + cover choice ride along
// in the session metadata.
bookOrderProtectedRoutes.post('/book-orders/checkout', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const body = await c.req.json<{
    ship_to: ShippingAddress;
    cover_type: 'hardcover' | 'softcover';
    thread_id?: string;
  }>();

  if (
    !body.ship_to?.name ||
    !body.ship_to?.line1 ||
    !body.ship_to?.country_code ||
    !body.ship_to?.postcode
  ) {
    return c.json({ error: 'Complete shipping address required' }, 400);
  }

  // IDOR guard: if a thread_id is supplied, confirm the caller is a member.
  // Without this check any authenticated user could submit any thread_id and
  // have its entries rendered into a paid book.
  if (body.thread_id) {
    const member = await c.env.DB.prepare(
      `SELECT id FROM thread_members
       WHERE thread_id = ? AND user_id = ? AND revoked_at IS NULL`,
    ).bind(body.thread_id, userId).first();
    if (!member) return c.json({ error: 'Forbidden' }, 403);
  }

  const coverType = body.cover_type === 'hardcover' ? 'hardcover' : 'softcover';
  const unitAmount = coverType === 'hardcover' ? 4999 : 2999;

  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json({ error: 'Payments not configured' }, 503);
  }

  const params: Record<string, string> = {
    'mode': 'payment',
    'success_url': `${c.env.APP_URL}/book-builder/success?session={CHECKOUT_SESSION_ID}`,
    'cancel_url': `${c.env.APP_URL}/book-builder`,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(unitAmount),
    'line_items[0][price_data][product_data][name]': `Heirloom Book — ${coverType}`,
    'metadata[type]': 'book_order',
    'metadata[user_id]': userId,
    'metadata[ship_to_json]': JSON.stringify(body.ship_to),
    'metadata[thread_id]': body.thread_id || '',
  };

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    console.error('Stripe book checkout error:', errorData);
    return c.json({ error: errorData.error?.message || 'Failed to create checkout session' }, 500);
  }

  const session = (await res.json()) as { id: string; url: string };
  return c.json({ url: session.url });
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

  // Notify the purchaser when the book ships.
  if (luluStatus === 'SHIPPED') {
    c.executionCtx.waitUntil(sendBookShippedEmail(c.env, externalId, trackingUrl));
  }

  return c.json({ ok: true });
});
