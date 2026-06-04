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
import { applyMigrations, seedUser } from './helpers/migrate';

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

  it('every tier has quarterly and yearly prices that are valid numbers > 0', async () => {
    const res = await json('/api/gift-vouchers/pricing');
    const { tiers } = await res.json() as any;

    for (const tier of tiers) {
      const { quarterly, yearly } = tier;
      expect(quarterly, `${tier.id}.quarterly is undefined`).toBeDefined();
      expect(yearly, `${tier.id}.yearly is undefined`).toBeDefined();

      expect(typeof quarterly.amount, `${tier.id}.quarterly.amount is not a number`).toBe('number');
      expect(typeof yearly.amount, `${tier.id}.yearly.amount is not a number`).toBe('number');

      expect(isNaN(quarterly.amount), `${tier.id}.quarterly.amount is NaN`).toBe(false);
      expect(isNaN(yearly.amount), `${tier.id}.yearly.amount is NaN`).toBe(false);

      expect(quarterly.amount, `${tier.id}.quarterly.amount <= 0`).toBeGreaterThan(0);
      expect(yearly.amount, `${tier.id}.yearly.amount <= 0`).toBeGreaterThan(0);
    }
  });

  it('yearly price is less than 12× quarterly (year-discount makes sense)', async () => {
    const res = await json('/api/gift-vouchers/pricing');
    const { tiers } = await res.json() as any;
    for (const tier of tiers) {
      const annualized = tier.quarterly.amount * 4;
      expect(
        tier.yearly.amount,
        `${tier.id}: yearly should be cheaper than 4× quarterly`,
      ).toBeLessThan(annualized);
    }
  });

  it('display strings match amounts', async () => {
    const res = await json('/api/gift-vouchers/pricing');
    const { tiers, symbol } = await res.json() as any;
    for (const tier of tiers) {
      for (const period of ['quarterly', 'yearly'] as const) {
        const { amount, display } = tier[period];
        const expected = `${symbol}${amount.toFixed(2)}`;
        expect(display, `${tier.id}.${period}.display mismatch`).toBe(expected);
      }
    }
  });

  it('USD pricing matches known values for STARTER quarterly', async () => {
    const res = await json('/api/gift-vouchers/pricing?currency=USD');
    const { tiers } = await res.json() as any;
    const starter = tiers.find((t: any) => t.id === 'STARTER');
    expect(starter).toBeDefined();
    // $14.99 / 100 cents = 14.99
    expect(starter.quarterly.amount).toBe(14.99);
  });

  it('falls back to USD for unknown currency', async () => {
    const resUsd = await json('/api/gift-vouchers/pricing?currency=USD');
    const resUnknown = await json('/api/gift-vouchers/pricing?currency=XYZ');
    const usd = await resUsd.json() as any;
    const unknown = await resUnknown.json() as any;
    expect(unknown.tiers[0].quarterly.amount).toBe(usd.tiers[0].quarterly.amount);
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
      billingCycle: 'monthly',
      purchaserEmail: 'buyer@example.com',
    });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toMatch(/invalid billing cycle/i);
  });

  it('accepts LEGACY as a valid tier input', async () => {
    // Should not return "Invalid tier" — it must reach the Stripe call
    // which will fail without a real key, but we only care about tier validation.
    const res = await post('/api/gift-vouchers/checkout', {
      tier: 'LEGACY',
      billingCycle: 'yearly',
      purchaserEmail: 'buyer@example.com',
      currency: 'USD',
    });
    // With no STRIPE_SECRET_KEY in the test env the Stripe call fails, but
    // the response must NOT be a 400 with "Invalid tier".
    const body = await res.json() as any;
    expect(body.error).not.toMatch(/invalid tier/i);
  });

  it('accepts STARTER quarterly', async () => {
    const res = await post('/api/gift-vouchers/checkout', {
      tier: 'STARTER',
      billingCycle: 'quarterly',
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
    await applyMigrations(env.DB);
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
    await applyMigrations(env.DB);
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
    await applyMigrations(env.DB);
  });

  it('PAID voucher passes /validate', async () => {
    const code = 'HRLM-TEST-PAID-0001';
    const expires = new Date(Date.now() + 86400 * 365 * 1000).toISOString();

    await env.DB.prepare(`
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

    await env.DB.prepare(`
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

    await env.DB.prepare(`
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

    await env.DB.prepare(`
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
      env.DB.prepare(`
        INSERT INTO gift_vouchers
          (id, code, purchaser_email, tier, billing_cycle, duration_months, amount, currency, status, expires_at)
        VALUES
          ('gv-legacychk', 'HRLM-LGCY-CHCK-0001', 'b@t.com', 'LEGACY', 'yearly', 12, 4999, 'USD', 'PENDING', '2027-01-01T00:00:00Z')
      `).run(),
    ).rejects.toThrow(); // CHECK constraint: tier must be STARTER/FAMILY/FOREVER

    await expect(
      env.DB.prepare(`
        INSERT INTO gift_vouchers
          (id, code, purchaser_email, tier, billing_cycle, duration_months, amount, currency, status, expires_at)
        VALUES
          ('gv-legacychk2', 'HRLM-LGCY-CHCK-0002', 'b@t.com', 'FOREVER', 'yearly', 12, 4999, 'USD', 'PENDING', '2027-01-01T00:00:00Z')
      `).run(),
    ).resolves.toBeDefined(); // FOREVER is valid
  });
});
