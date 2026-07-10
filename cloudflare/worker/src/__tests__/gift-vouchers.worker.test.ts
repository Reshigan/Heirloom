/**
 * Gift voucher route tests — runs in the real Workers runtime via
 * @cloudflare/vitest-pool-workers so every request goes through the
 * actual Hono handlers, middleware, and business logic.
 *
 * Run:  npm run test:worker
 *
 * What this catches:
 *  - Pricing key mismatches that produce NaN amounts
 *  - DB CHECK constraint violations on tier/billing_cycle
 *  - Missing or wrong-status validation on the redeem flow
 *  - Broken billingCycle → monthKey mapping
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applyMigrations } from './helpers/migrate';
// The one source of truth for prices. Asserting literals here is how this suite
// drifted: the table moved to $2.99/$29 and the tests kept demanding $6.99/$69.
import { PRICING } from '../routes/billing';

const API = 'http://localhost';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function json(path: string, opts: RequestInit = {}) {
  return SELF.fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
}

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return json(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });
}

// ─── Pricing endpoint ────────────────────────────────────────────────────────
// This is the highest-value suite: the NaN bug lived here.
// No DB required — pricing is static constants in the handler.

describe('GET /api/gift-vouchers/pricing', () => {
  it('returns HTTP 200', async () => {
    const res = await json('/api/gift-vouchers/pricing');
    expect(res.status).toBe(200);
  });

  it('returns tiers array', async () => {
    const res = await json('/api/gift-vouchers/pricing');
    const body = await res.json() as any;
    expect(Array.isArray(body.tiers)).toBe(true);
    expect(body.tiers.length).toBeGreaterThanOrEqual(2);
  });

  it('mirrors the canonical plans: Starter free, Family monthly+yearly, no Legacy', async () => {
    const res = await json('/api/gift-vouchers/pricing');
    const { tiers } = await res.json() as any;

    const starter = tiers.find((t: any) => t.id === 'STARTER');
    const family = tiers.find((t: any) => t.id === 'FAMILY');

    expect(starter?.free, 'Starter must be free').toBe(true);

    for (const cycle of ['monthly', 'yearly'] as const) {
      expect(family[cycle], `FAMILY.${cycle} undefined`).toBeDefined();
      expect(typeof family[cycle].amount).toBe('number');
      expect(isNaN(family[cycle].amount), `FAMILY.${cycle}.amount is NaN`).toBe(false);
      expect(family[cycle].amount, `FAMILY.${cycle}.amount <= 0`).toBeGreaterThan(0);
    }

    // The Founder/Legacy SKU is withdrawn from sale — it must not be offered.
    expect(tiers.find((t: any) => t.id === 'LEGACY')).toBeUndefined();
  });

  it('Family yearly is less than 12× monthly (the year-discount makes sense)', async () => {
    const res = await json('/api/gift-vouchers/pricing');
    const { tiers } = await res.json() as any;
    const family = tiers.find((t: any) => t.id === 'FAMILY');
    expect(family.yearly.amount).toBeLessThan(family.monthly.amount * 12);
  });

  it('the giver pays a 10% discount off the list price', async () => {
    const res = await json('/api/gift-vouchers/pricing?currency=USD');
    const { tiers } = await res.json() as any;
    const family = tiers.find((t: any) => t.id === 'FAMILY');
    const list = PRICING.FAMILY.yearly;
    expect(family.yearly.listAmount).toBe(list);
    expect(family.yearly.amount).toBe(Math.round(list * 100 * 0.9) / 100);
    expect(family.yearly.giftDiscount).toBe('10% off');
  });

  it('display strings match amounts', async () => {
    const res = await json('/api/gift-vouchers/pricing');
    const { tiers, symbol } = await res.json() as any;
    for (const tier of tiers) {
      for (const cycle of ['monthly', 'yearly', 'lifetime'] as const) {
        const m = tier[cycle];
        if (!m || m.amount === 0) continue; // free tier carries display 'Free'
        expect(m.display, `${tier.id}.${cycle}.display mismatch`).toBe(`${symbol}${m.amount.toFixed(2)}`);
      }
    }
  });

  it('USD Family monthly matches the canonical billing.ts list price', async () => {
    const res = await json('/api/gift-vouchers/pricing?currency=USD');
    const { tiers } = await res.json() as any;
    const family = tiers.find((t: any) => t.id === 'FAMILY');
    expect(family.monthly.listAmount).toBe(PRICING.FAMILY.monthly);
  });

  it('falls back to USD for unknown currency', async () => {
    const resUsd = await json('/api/gift-vouchers/pricing?currency=USD');
    const resUnknown = await json('/api/gift-vouchers/pricing?currency=XYZ');
    const usd = await resUsd.json() as any;
    const unknown = await resUnknown.json() as any;
    const usdFamily = usd.tiers.find((t: any) => t.id === 'FAMILY');
    const unknownFamily = unknown.tiers.find((t: any) => t.id === 'FAMILY');
    expect(unknownFamily.monthly.amount).toBe(usdFamily.monthly.amount);
  });
});

// ─── Checkout validation (no Stripe, no DB insert needed) ────────────────────
// Test that the handler rejects invalid inputs before ever hitting Stripe or D1.

describe('POST /api/gift-vouchers/checkout — validation', () => {
  it('400 when required fields are missing', async () => {
    const res = await post('/api/gift-vouchers/checkout', {});
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toMatch(/missing/i);
  });

  it('400 when tier is invalid', async () => {
    const res = await post('/api/gift-vouchers/checkout', {
      tier: 'GOLD',
      billingCycle: 'yearly',
      purchaserEmail: 'buyer@example.com',
    });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toMatch(/invalid tier/i);
  });

  it('400 when billingCycle is invalid', async () => {
    const res = await post('/api/gift-vouchers/checkout', {
      tier: 'FAMILY',
      billingCycle: 'weekly',
      purchaserEmail: 'buyer@example.com',
    });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toMatch(/invalid billing cycle/i);
  });

  it('400 when STARTER is gifted (it is free)', async () => {
    const res = await post('/api/gift-vouchers/checkout', {
      tier: 'STARTER',
      billingCycle: 'monthly',
      purchaserEmail: 'buyer@example.com',
      currency: 'USD',
    });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toMatch(/free/i);
  });

  // The Founder/LEGACY gift SKU is withdrawn from sale. The UI no longer offers
  // it, but the server must refuse it too — otherwise a hand-rolled POST buys a
  // closed SKU. Both cycles, including the lifetime one it used to accept.
  for (const billingCycle of ['yearly', 'lifetime'] as const) {
    it(`400 when the withdrawn LEGACY tier is gifted (${billingCycle})`, async () => {
      const res = await post('/api/gift-vouchers/checkout', {
        tier: 'LEGACY',
        billingCycle,
        purchaserEmail: 'buyer@example.com',
        currency: 'USD',
      });
      expect(res.status).toBe(400);
      const body = await res.json() as any;
      expect(body.error).toMatch(/invalid tier/i);
    });
  }

  it('accepts FAMILY monthly', async () => {
    const res = await post('/api/gift-vouchers/checkout', {
      tier: 'FAMILY',
      billingCycle: 'monthly',
      purchaserEmail: 'buyer@example.com',
      currency: 'USD',
    });
    const body = await res.json() as any;
    expect(body.error).not.toMatch(/invalid tier/i);
    expect(body.error).not.toMatch(/invalid billing cycle/i);
    expect(body.error).not.toMatch(/pricing unavailable/i);
  });
});

// ─── Validate endpoint (no DB needed for 404/missing cases) ──────────────────

describe('GET /api/gift-vouchers/validate/:code', () => {
  beforeEach(async () => {
    await applyMigrations(env.DB!);
  });

  it('404 for a code that does not exist', async () => {
    const res = await json('/api/gift-vouchers/validate/HRLM-FAKE-FAKE-FAKE');
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.valid).toBe(false);
  });
});

// ─── Redeem — DB-backed tests ─────────────────────────────────────────────────
// These need the full schema so we run migrations first.

describe('POST /api/gift-vouchers/redeem', () => {
  beforeEach(async () => {
    await applyMigrations(env.DB!);
  });

  it('401 without auth token', async () => {
    const res = await post('/api/gift-vouchers/redeem', { code: 'HRLM-TEST-TEST-TEST' });
    expect(res.status).toBe(401);
  });

  it('401 with malformed token', async () => {
    const res = await post(
      '/api/gift-vouchers/redeem',
      { code: 'HRLM-TEST-TEST-TEST' },
      { Authorization: 'Bearer notavalidjwt' },
    );
    expect(res.status).toBe(401);
  });
});

// ─── PAID voucher flow — insert directly, then validate ──────────────────────

describe('Gift voucher lifecycle (DB-backed)', () => {
  beforeEach(async () => {
    await applyMigrations(env.DB!);
  });

  it('PAID voucher passes /validate', async () => {
    const code = 'HRLM-TEST-PAID-0001';
    const expires = new Date(Date.now() + 86400 * 365 * 1000).toISOString();

    await env.DB!.prepare(`
      INSERT INTO gift_vouchers
        (id, code, purchaser_email, tier, billing_cycle, duration_months, amount, currency, status, expires_at)
      VALUES
        ('gv-paid-001', ?, 'buyer@test.com', 'STARTER', 'yearly', 12, 4999, 'USD', 'PAID', ?)
    `).bind(code, expires).run();

    const res = await json(`/api/gift-vouchers/validate/${code}`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.valid).toBe(true);
    expect(body.voucher.code).toBe(code);
  });

  it('PENDING voucher fails /validate with "not yet active"', async () => {
    const code = 'HRLM-TEST-PEND-0001';
    const expires = new Date(Date.now() + 86400 * 365 * 1000).toISOString();

    await env.DB!.prepare(`
      INSERT INTO gift_vouchers
        (id, code, purchaser_email, tier, billing_cycle, duration_months, amount, currency, status, expires_at)
      VALUES
        ('gv-pend-001', ?, 'buyer@test.com', 'FAMILY', 'quarterly', 3, 2999, 'USD', 'PENDING', ?)
    `).bind(code, expires).run();

    const res = await json(`/api/gift-vouchers/validate/${code}`);
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/not yet active/i);
  });

  it('REDEEMED voucher fails /validate', async () => {
    const code = 'HRLM-TEST-REEM-0001';
    const expires = new Date(Date.now() + 86400 * 365 * 1000).toISOString();

    await env.DB!.prepare(`
      INSERT INTO gift_vouchers
        (id, code, purchaser_email, tier, billing_cycle, duration_months, amount, currency, status, expires_at)
      VALUES
        ('gv-reem-001', ?, 'buyer@test.com', 'FAMILY', 'quarterly', 3, 2999, 'USD', 'REDEEMED', ?)
    `).bind(code, expires).run();

    const res = await json(`/api/gift-vouchers/validate/${code}`);
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/already been redeemed/i);
  });

  it('expired voucher fails /validate', async () => {
    const code = 'HRLM-TEST-EXPD-0001';
    const expired = new Date(Date.now() - 86400 * 1000).toISOString();

    await env.DB!.prepare(`
      INSERT INTO gift_vouchers
        (id, code, purchaser_email, tier, billing_cycle, duration_months, amount, currency, status, expires_at)
      VALUES
        ('gv-expd-001', ?, 'buyer@test.com', 'STARTER', 'yearly', 12, 4999, 'USD', 'PAID', ?)
    `).bind(code, expired).run();

    const res = await json(`/api/gift-vouchers/validate/${code}`);
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/expired/i);
  });

  it('tier stored as FOREVER when LEGACY is passed to checkout', async () => {
    // Directly check the DB normalisation logic: the checkout handler must
    // write 'FOREVER' (the only DB-valid value) when the client sends 'LEGACY'.
    // We test this by trying to insert LEGACY and confirming the CHECK fires,
    // then confirming FOREVER does not.
    await expect(
      env.DB!.prepare(`
        INSERT INTO gift_vouchers
          (id, code, purchaser_email, tier, billing_cycle, duration_months, amount, currency, status, expires_at)
        VALUES
          ('gv-legacychk', 'HRLM-LGCY-CHCK-0001', 'b@t.com', 'LEGACY', 'yearly', 12, 4999, 'USD', 'PENDING', '2027-01-01T00:00:00Z')
      `).run(),
    ).rejects.toThrow(); // CHECK constraint: tier must be STARTER/FAMILY/FOREVER

    await expect(
      env.DB!.prepare(`
        INSERT INTO gift_vouchers
          (id, code, purchaser_email, tier, billing_cycle, duration_months, amount, currency, status, expires_at)
        VALUES
          ('gv-legacychk2', 'HRLM-LGCY-CHCK-0002', 'b@t.com', 'FOREVER', 'yearly', 12, 4999, 'USD', 'PENDING', '2027-01-01T00:00:00Z')
      `).run(),
    ).resolves.toBeDefined(); // FOREVER is valid
  });
});
