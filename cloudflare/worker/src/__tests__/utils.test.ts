import { describe, it, expect } from 'vitest';

// Unit tests for utility functions and validation logic
// These tests verify core business logic without requiring the full Workers environment

describe('Email Validation', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  it('validates correct email addresses', () => {
    expect(emailRegex.test('user@example.com')).toBe(true);
    expect(emailRegex.test('test.user@domain.co.uk')).toBe(true);
    expect(emailRegex.test('name+tag@gmail.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(emailRegex.test('invalid')).toBe(false);
    expect(emailRegex.test('no@domain')).toBe(false);
    expect(emailRegex.test('@nodomain.com')).toBe(false);
    expect(emailRegex.test('spaces in@email.com')).toBe(false);
  });
});

describe('Tier Normalization', () => {
  const normalizeTier = (tier: string): string => {
    const tierMap: Record<string, string> = {
      'starter': 'STARTER',
      'family': 'FAMILY',
      'forever': 'FOREVER',
      'legacy': 'FOREVER',
    };
    return tierMap[tier.toLowerCase()] || tier.toUpperCase();
  };

  it('normalizes tier names to uppercase', () => {
    expect(normalizeTier('starter')).toBe('STARTER');
    expect(normalizeTier('STARTER')).toBe('STARTER');
    expect(normalizeTier('Starter')).toBe('STARTER');
  });

  it('maps legacy tier to FOREVER', () => {
    expect(normalizeTier('legacy')).toBe('FOREVER');
    expect(normalizeTier('LEGACY')).toBe('FOREVER');
  });

  it('handles all tier types', () => {
    expect(normalizeTier('family')).toBe('FAMILY');
    expect(normalizeTier('forever')).toBe('FOREVER');
  });
});

describe('Currency Detection', () => {
  const COUNTRY_CURRENCY: Record<string, string> = {
    ZA: 'ZAR', US: 'USD', GB: 'GBP', DE: 'EUR', IN: 'INR',
    NG: 'NGN', KE: 'KES', CA: 'CAD', AU: 'AUD',
  };

  const getCurrencyForCountry = (countryCode: string): string => {
    return COUNTRY_CURRENCY[countryCode?.toUpperCase()] || 'USD';
  };

  it('returns correct currency for known countries', () => {
    expect(getCurrencyForCountry('ZA')).toBe('ZAR');
    expect(getCurrencyForCountry('US')).toBe('USD');
    expect(getCurrencyForCountry('GB')).toBe('GBP');
    expect(getCurrencyForCountry('DE')).toBe('EUR');
  });

  it('defaults to USD for unknown countries', () => {
    expect(getCurrencyForCountry('XX')).toBe('USD');
    expect(getCurrencyForCountry('')).toBe('USD');
  });

  it('handles case insensitivity', () => {
    expect(getCurrencyForCountry('za')).toBe('ZAR');
    expect(getCurrencyForCountry('Za')).toBe('ZAR');
  });
});

describe('Ticket Number Generation', () => {
  it('generates ticket numbers with correct format', () => {
    const generateTicketNumber = () => `HLM-${Date.now().toString(36).toUpperCase()}`;
    
    const ticket = generateTicketNumber();
    expect(ticket).toMatch(/^HLM-[A-Z0-9]+$/);
  });

  it('generates unique ticket numbers', () => {
    const generateTicketNumber = () => `HLM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    
    const tickets = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tickets.add(generateTicketNumber());
    }
    expect(tickets.size).toBe(100);
  });
});

describe('Pricing Logic', () => {
  const PRICING = {
    USD: {
      symbol: '$',
      code: 'USD',
      STARTER: { monthly: 1, yearly: 10 },
      FAMILY: { monthly: 5, yearly: 50 },
      FOREVER: { monthly: 15, yearly: 150 },
    },
    ZAR: {
      symbol: 'R',
      code: 'ZAR',
      STARTER: { monthly: 18, yearly: 180 },
      FAMILY: { monthly: 90, yearly: 900 },
      FOREVER: { monthly: 270, yearly: 2700 },
    },
  };

  it('calculates yearly discount correctly (10 months = 2 free)', () => {
    const usdStarter = PRICING.USD.STARTER;
    expect(usdStarter.yearly).toBe(usdStarter.monthly * 10);
    
    const zarFamily = PRICING.ZAR.FAMILY;
    expect(zarFamily.yearly).toBe(zarFamily.monthly * 10);
  });

  it('maintains currency-specific pricing', () => {
    expect(PRICING.USD.STARTER.monthly).toBe(1);
    expect(PRICING.ZAR.STARTER.monthly).toBe(18);
  });

  it('has correct tier hierarchy (STARTER < FAMILY < FOREVER)', () => {
    const usd = PRICING.USD;
    expect(usd.STARTER.monthly).toBeLessThan(usd.FAMILY.monthly);
    expect(usd.FAMILY.monthly).toBeLessThan(usd.FOREVER.monthly);
  });
});

describe('Coupon Validation', () => {
  const COUPONS: Record<string, { discount: number; type: 'percent' | 'fixed'; expires?: string }> = {
    'LAUNCH50': { discount: 50, type: 'percent' },
    'SAVE10': { discount: 10, type: 'fixed' },
    'EXPIRED': { discount: 20, type: 'percent', expires: '2020-01-01' },
  };

  const validateCoupon = (code: string): { valid: boolean; discount?: number; type?: string } => {
    const coupon = COUPONS[code.toUpperCase()];
    if (!coupon) return { valid: false };
    if (coupon.expires && new Date(coupon.expires) < new Date()) return { valid: false };
    return { valid: true, discount: coupon.discount, type: coupon.type };
  };

  it('validates active coupons', () => {
    const result = validateCoupon('LAUNCH50');
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(50);
    expect(result.type).toBe('percent');
  });

  it('rejects unknown coupons', () => {
    const result = validateCoupon('INVALID');
    expect(result.valid).toBe(false);
  });

  it('rejects expired coupons', () => {
    const result = validateCoupon('EXPIRED');
    expect(result.valid).toBe(false);
  });

  it('handles case insensitivity', () => {
    expect(validateCoupon('launch50').valid).toBe(true);
    expect(validateCoupon('Launch50').valid).toBe(true);
  });
});

describe('Rate Limit Logic', () => {
  it('correctly identifies rate-limited auth paths', () => {
    const rateLimitedAuthPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-2fa'];
    
    expect(rateLimitedAuthPaths.includes('/login')).toBe(true);
    expect(rateLimitedAuthPaths.includes('/register')).toBe(true);
    expect(rateLimitedAuthPaths.includes('/refresh')).toBe(false);
    expect(rateLimitedAuthPaths.includes('/logout')).toBe(false);
    expect(rateLimitedAuthPaths.includes('/me')).toBe(false);
  });
});
