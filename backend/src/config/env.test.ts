import { describe, it, expect } from 'vitest';
import { TIER_LIMITS, PRICING } from './env';

// Guardrails on the commercial model. These constants drive paywall gating
// (billing.service.checkLimit) and the pricing surfaces, so a careless edit
// here is a revenue/limits bug. -1 is the "unlimited" sentinel.

describe('TIER_LIMITS', () => {
  it('defines all four tiers with the expected limit keys', () => {
    for (const tier of ['FREE', 'ESSENTIAL', 'FAMILY', 'LEGACY'] as const) {
      const t = TIER_LIMITS[tier];
      expect(t).toBeDefined();
      for (const key of ['maxMemories', 'maxLetters', 'maxRecipients', 'maxVoiceMinutes', 'maxStorageMB'] as const) {
        expect(typeof t[key]).toBe('number');
      }
    }
  });

  it('keeps FREE finite and usable (not -1) so the free tier is real but bounded', () => {
    expect(TIER_LIMITS.FREE.maxMemories).toBeGreaterThan(0);
    expect(TIER_LIMITS.FREE.maxStorageMB).toBeGreaterThan(0);
  });

  it('makes FAMILY/LEGACY unlimited (-1) for core content', () => {
    expect(TIER_LIMITS.FAMILY.maxMemories).toBe(-1);
    expect(TIER_LIMITS.LEGACY.maxMemories).toBe(-1);
  });

  it('storage only ever increases up the ladder', () => {
    expect(TIER_LIMITS.ESSENTIAL.maxStorageMB).toBeGreaterThan(TIER_LIMITS.FREE.maxStorageMB);
    expect(TIER_LIMITS.FAMILY.maxStorageMB).toBeGreaterThan(TIER_LIMITS.ESSENTIAL.maxStorageMB);
    expect(TIER_LIMITS.LEGACY.maxStorageMB).toBeGreaterThan(TIER_LIMITS.FAMILY.maxStorageMB);
  });
});

describe('PRICING', () => {
  it('is denominated in positive integer cents', () => {
    const cents = [
      PRICING.ESSENTIAL.monthly, PRICING.ESSENTIAL.yearly,
      PRICING.FAMILY.monthly, PRICING.FAMILY.yearly,
      PRICING.LEGACY.yearly, PRICING.GIFT_YEAR.once,
    ];
    for (const c of cents) {
      expect(Number.isInteger(c)).toBe(true);
      expect(c).toBeGreaterThan(0);
    }
  });

  it('prices a yearly plan below 12× the monthly (a real discount)', () => {
    expect(PRICING.ESSENTIAL.yearly).toBeLessThan(PRICING.ESSENTIAL.monthly * 12);
    expect(PRICING.FAMILY.yearly).toBeLessThan(PRICING.FAMILY.monthly * 12);
  });
});
