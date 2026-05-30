import { describe, it, expect, vi } from 'vitest';

// billing.service pulls in Prisma + Redis + email at module load. Stub them so
// importing the module is side-effect-free; we only test the pure currency math.
vi.mock('../config/redis', () => ({
  redis: { on: vi.fn() },
  cache: { get: vi.fn(), set: vi.fn(), del: vi.fn(), delPattern: vi.fn() },
}));
vi.mock('../config/database', () => ({ default: {}, prisma: {} }));
vi.mock('./email.service', () => ({ emailService: {} }));

import { billingService } from './billing.service';

describe('billingService — convertCurrency', () => {
  it('returns USD unchanged with a $ symbol', () => {
    const p = billingService.convertCurrency(999, 'USD'); // $9.99
    expect(p.currency).toBe('USD');
    expect(p.symbol).toBe('$');
    expect(p.amount).toBe(9.99);
    expect(p.formatted).toBe('$9.99');
  });

  it('applies the exchange rate and the right symbol for other currencies', () => {
    const gbp = billingService.convertCurrency(999, 'GBP'); // rate 0.79
    expect(gbp.symbol).toBe('£');
    expect(gbp.amount).toBeCloseTo(7.89, 2);
    expect(gbp.formatted).toBe('£7.89');
  });

  it('upper-cases the currency code and is case-insensitive', () => {
    expect(billingService.convertCurrency(999, 'eur').currency).toBe('EUR');
    expect(billingService.convertCurrency(999, 'eur').symbol).toBe('€');
  });

  it('falls back to USD/$ for an unknown currency', () => {
    const p = billingService.convertCurrency(999, 'XYZ');
    expect(p.symbol).toBe('$');
    expect(p.amount).toBe(9.99);
  });

  it('always formats to two decimal places', () => {
    expect(billingService.convertCurrency(500, 'USD').formatted).toBe('$5.00');
  });
});

describe('billingService — getPricingInCurrency', () => {
  it('returns essential/family/legacy prices in the requested currency', () => {
    const pricing = billingService.getPricingInCurrency('EUR');
    expect(pricing.essential.monthly.currency).toBe('EUR');
    expect(pricing.family.yearly.currency).toBe('EUR');
    expect(pricing.legacy.yearly.currency).toBe('EUR');
    // family monthly should cost more than essential monthly
    expect(pricing.family.monthly.amount).toBeGreaterThan(pricing.essential.monthly.amount);
  });
});
