/**
 * Living Book service — Lulu Direct integration.
 *
 * The Living Book is the printed hardcover artifact of a Thread (or any
 * subset of entries from one). Per /THREAD.md §"Output products," the
 * book is a *view* on the Thread, not the product itself.
 *
 * Lulu Direct is pure pay-per-print: no monthly fee, ~$25-40 per
 * hardcover at 100-200 pages, white-label fulfillment to ~150 countries.
 * We charge a margin (e.g. $99 retail / $35 cost) — revenue-positive
 * from the first print.
 *
 * This module covers the book-order lifecycle:
 *
 *   1. Order intake — POST /api/threads/:id/book creates a book_orders
 *      row in COMPILING status with the entry filter + ship-to address.
 *   2. PDF compilation — separate offline tooling (or a future worker
 *      with WASM PDF rendering) reads the book_orders row, renders the
 *      interior + cover PDFs, uploads them to R2, and calls
 *      attachPdfsAndSubmit().
 *   3. Lulu submission — submitPrintJob() uses signed S3-style URLs to
 *      hand the PDFs to Lulu's print-job endpoint.
 *   4. Status sync — a webhook from Lulu updates lulu_status; the daily
 *      cron also polls open print jobs as a backstop.
 *
 * Lulu sandbox runs at the same URL with a separate API key. Toggle via
 * LULU_ENVIRONMENT=sandbox|production.
 */

import type { AppEnv } from '../index';

interface LuluCredentials {
  clientKey: string;
  clientSecret: string;
  baseUrl: string;
}

function getLuluCredentials(env: AppEnv['Bindings']): LuluCredentials | null {
  const e = env as AppEnv['Bindings'] & {
    LULU_API_KEY?: string;
    LULU_API_SECRET?: string;
    LULU_ENVIRONMENT?: string;
  };
  if (!e.LULU_API_KEY || !e.LULU_API_SECRET) return null;
  const isSandbox = (e.LULU_ENVIRONMENT ?? 'sandbox') !== 'production';
  return {
    clientKey: e.LULU_API_KEY,
    clientSecret: e.LULU_API_SECRET,
    baseUrl: isSandbox ? 'https://api.sandbox.lulu.com' : 'https://api.lulu.com',
  };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(creds: LuluCredentials): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.token;

  const basic = btoa(`${creds.clientKey}:${creds.clientSecret}`);
  const res = await fetch(`${creds.baseUrl}/auth/realms/glasstree/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Lulu auth failed: HTTP ${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

// =============================================================================
// PRINT JOB SUBMISSION
// =============================================================================

interface PrintJobInput {
  bookOrderId: string;
  // Pre-uploaded PDFs (R2 public URLs are fine — Lulu pulls them).
  interiorPdfUrl: string;
  coverPdfUrl: string;
  // Lulu pod_package_id describes trim size + paper + binding. Default
  // is a 6x9" hardcover with cream paper, which suits prose. See:
  //   https://api.lulu.com/print-job-cost-calculations/
  podPackageId?: string;
  pageCount: number;
  shipping: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state_code?: string;
    country_code: string;
    postcode: string;
    phone_number: string;
    email: string;
  };
  shippingLevel?: 'MAIL' | 'PRIORITY_MAIL' | 'GROUND' | 'EXPEDITED' | 'EXPRESS';
}

const DEFAULT_POD_PACKAGE_ID = '0850X1100BWSTDCW060UC444GXX'; // 8.5"x11" hardcover, B&W, cream

export async function submitPrintJob(
  env: AppEnv['Bindings'],
  input: PrintJobInput,
): Promise<{ ok: boolean; luluPrintJobId?: string; status?: string; error?: string }> {
  const creds = getLuluCredentials(env);
  if (!creds) return { ok: false, error: 'Lulu credentials not configured' };

  const token = await getAccessToken(creds);

  const body = {
    contact_email: input.shipping.email,
    external_id: input.bookOrderId,
    line_items: [
      {
        external_id: input.bookOrderId,
        printable_normalization: {
          cover: { source_url: input.coverPdfUrl },
          interior: { source_url: input.interiorPdfUrl },
          pod_package_id: input.podPackageId ?? DEFAULT_POD_PACKAGE_ID,
        },
        quantity: 1,
        title: 'Living Book',
      },
    ],
    shipping_address: input.shipping,
    shipping_level: input.shippingLevel ?? 'MAIL',
  };

  const res = await fetch(`${creds.baseUrl}/print-jobs/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    id?: number;
    status?: { name?: string };
    errors?: unknown;
  };
  if (!res.ok || !data.id) {
    return { ok: false, error: `Lulu print-job HTTP ${res.status}: ${JSON.stringify(data.errors)}` };
  }
  return { ok: true, luluPrintJobId: String(data.id), status: data.status?.name };
}

// =============================================================================
// STATUS POLLING
// =============================================================================

export async function getPrintJobStatus(
  env: AppEnv['Bindings'],
  luluPrintJobId: string,
): Promise<{ status?: string; trackingUrl?: string; cost?: number }> {
  const creds = getLuluCredentials(env);
  if (!creds) return {};
  const token = await getAccessToken(creds);

  const res = await fetch(`${creds.baseUrl}/print-jobs/${luluPrintJobId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return {};
  const data = (await res.json()) as {
    status?: { name?: string };
    tracking_urls?: string[];
    estimated_shipping_dates?: { dispatch_min?: string };
    costs?: { total_cost_incl_tax?: string };
  };

  return {
    status: data.status?.name,
    trackingUrl: data.tracking_urls?.[0],
    cost: data.costs?.total_cost_incl_tax ? Math.round(parseFloat(data.costs.total_cost_incl_tax) * 100) : undefined,
  };
}

// =============================================================================
// LIFECYCLE — COMPILING -> PRINTING -> SHIPPED
// =============================================================================

export async function attachPdfsAndSubmit(
  env: AppEnv['Bindings'],
  bookOrderId: string,
  interiorPdfKey: string,
  coverPdfKey: string,
  pageCount: number,
): Promise<void> {
  const order = await env.DB.prepare(`SELECT * FROM book_orders WHERE id = ?`).bind(bookOrderId).first<{
    id: string;
    ship_to_name: string;
    ship_to_address_json: string;
  }>();
  if (!order) throw new Error('book order not found');

  // The PDFs are stored in R2. We make them temporarily accessible via
  // signed URLs that Lulu can fetch.
  const apiUrl = (env as AppEnv['Bindings'] & { API_URL?: string }).API_URL ?? 'https://api.heirloom.blue';
  const interiorPdfUrl = `${apiUrl}/api/archive/r2/${encodeURIComponent(interiorPdfKey)}`;
  const coverPdfUrl = `${apiUrl}/api/archive/r2/${encodeURIComponent(coverPdfKey)}`;

  const shipping = JSON.parse(order.ship_to_address_json) as PrintJobInput['shipping'];

  const result = await submitPrintJob(env, {
    bookOrderId: order.id,
    interiorPdfUrl,
    coverPdfUrl,
    pageCount,
    shipping: { ...shipping, name: order.ship_to_name },
  });

  if (!result.ok) {
    await env.DB.prepare(
      `UPDATE book_orders SET status = 'FAILED', error = ?, updated_at = datetime('now') WHERE id = ?`,
    ).bind(result.error ?? 'unknown', bookOrderId).run();
    return;
  }

  await env.DB.prepare(
    `UPDATE book_orders
     SET status = 'PRINTING',
         lulu_print_job_id = ?,
         lulu_status = ?,
         interior_pdf_key = ?,
         cover_pdf_key = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
  ).bind(result.luluPrintJobId, result.status ?? null, interiorPdfKey, coverPdfKey, bookOrderId).run();
}

/**
 * Poll Lulu for any open jobs and update local status. Backstop in case
 * the webhook is missed or down.
 */
export async function syncOpenPrintJobs(env: AppEnv['Bindings']): Promise<{ updated: number }> {
  const open = await env.DB.prepare(
    `SELECT id, lulu_print_job_id FROM book_orders
     WHERE status IN ('PRINTING') AND lulu_print_job_id IS NOT NULL
     LIMIT 50`,
  ).all<{ id: string; lulu_print_job_id: string }>();

  let updated = 0;
  for (const o of open.results ?? []) {
    const status = await getPrintJobStatus(env, o.lulu_print_job_id);
    if (!status.status) continue;

    const localStatus =
      status.status === 'SHIPPED' ? 'SHIPPED' :
      status.status === 'REJECTED' || status.status === 'CANCELED' ? 'FAILED' :
      'PRINTING';

    await env.DB.prepare(
      `UPDATE book_orders
       SET lulu_status = ?, status = ?, tracking_url = COALESCE(?, tracking_url),
           total_cents = COALESCE(?, total_cents),
           updated_at = datetime('now')
       WHERE id = ?`,
    ).bind(status.status, localStatus, status.trackingUrl ?? null, status.cost ?? null, o.id).run();
    updated++;
  }
  return { updated };
}
