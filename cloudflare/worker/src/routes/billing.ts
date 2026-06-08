/**
 * Heirloom Billing Routes - PRODUCTION VERSION
 * 
 * Freemium 3-tier model with regional PPP adjustments:
 * - Free:    $0 forever - capped (the mass-adoption on-ramp)
 * - Family:  $6.99/mo or $69/yr - the paid family subscription
 * - Founder: $249 one-time, lifetime (the old 'LEGACY' slot, now one-time)
 *
 * Regional Pricing Tiers:
 * - Tier 1: US, UK, CA, AU, NZ (full price)
 * - Tier 2: EU, Western Europe (EUR pricing)
 * - Tier 3: ZA, BR, MX, Southeast Asia (50% PPP)
 * - Tier 4: IN, NG, KE, PK (annual-only, 30% PPP)
 *
 * 30-day Family trial, no credit card; drops to Free (never locks out).
 * Auto-detects country from Cloudflare for regional pricing.
 */

import { Hono } from 'hono';
import type { Env, AppEnv } from '../index';
import { sendEmail } from '../utils/email';
import { renderBookPdf } from '../services/bookPdf';

export const billingRoutes = new Hono<AppEnv>();

// =============================================================================
// PRICING TIER CONFIGURATION
// =============================================================================
type PricingTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

const COUNTRY_TO_PRICING_TIER: Record<string, PricingTier> = {
  // Tier 1 - Full price (US, UK, CA, AU, NZ)
  US: 'tier1', GB: 'tier1', CA: 'tier1', AU: 'tier1', NZ: 'tier1',
  
  // Tier 2 - EU pricing (Western Europe)
  DE: 'tier2', FR: 'tier2', IT: 'tier2', ES: 'tier2', NL: 'tier2',
  BE: 'tier2', AT: 'tier2', IE: 'tier2', PT: 'tier2', FI: 'tier2',
  GR: 'tier2', SK: 'tier2', SI: 'tier2', LT: 'tier2', LV: 'tier2',
  EE: 'tier2', CY: 'tier2', MT: 'tier2', LU: 'tier2',
  
  // Tier 3 - 50% PPP (ZA, BR, MX, Southeast Asia)
  ZA: 'tier3', BR: 'tier3', MX: 'tier3', AR: 'tier3',
  TH: 'tier3', MY: 'tier3', PH: 'tier3', ID: 'tier3',
  
  // Tier 4 - 30% PPP, annual-only (IN, NG, KE, PK, BD, EG, GH)
  IN: 'tier4', NG: 'tier4', KE: 'tier4', PK: 'tier4',
  BD: 'tier4', EG: 'tier4', GH: 'tier4',
};

const PRICING_TIER_CURRENCY: Record<PricingTier, string> = {
  tier1: 'USD',
  tier2: 'EUR',
  tier3: 'ZAR',
  tier4: 'INR',
};

// =============================================================================
// COUNTRY → CURRENCY MAPPING (for display)
// =============================================================================
const COUNTRY_CURRENCY: Record<string, string> = {
  // Tier 1
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD',
  
  // Tier 2 (EUR)
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', 
  IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR', SK: 'EUR', SI: 'EUR', LT: 'EUR',
  LV: 'EUR', EE: 'EUR', CY: 'EUR', MT: 'EUR', LU: 'EUR',
  
  // Tier 3
  ZA: 'ZAR', BR: 'BRL', MX: 'MXN', AR: 'ARS',
  TH: 'THB', MY: 'MYR', PH: 'PHP', ID: 'IDR',
  
  // Tier 4
  IN: 'INR', NG: 'NGN', KE: 'KES', PK: 'PKR', BD: 'BDT', EG: 'EGP', GH: 'GHS',
};

// =============================================================================
// PRICING BY CURRENCY - Updated for new pricing structure
// =============================================================================
// Freemium model (mass adoption):
//   FREE     — $0 forever (capped; never charged — no PRICING row needed)
//   FAMILY   — recurring monthly/yearly subscription (yearly = 2 months free)
//   FOUNDER  — single one-time lifetime purchase (the old 'LEGACY' tier slot)
// Localized PPP amounts re-scaled to the new model. Stripe is charged the exact
// number below via dynamic price_data (no fixed price IDs), so the displayed
// price always equals the charged price.
const PRICING: Record<string, {
  symbol: string;
  code: string;
  tier: PricingTier;
  annualOnly?: boolean;
  FAMILY: { monthly: number; yearly: number };
  FOUNDER: { lifetime: number };
}> = {
  // Tier 1 — full price
  USD: { symbol: '$',   code: 'USD', tier: 'tier1', FAMILY: { monthly: 6.99,  yearly: 69  }, FOUNDER: { lifetime: 249 } },
  GBP: { symbol: '£',   code: 'GBP', tier: 'tier1', FAMILY: { monthly: 5.99,  yearly: 59  }, FOUNDER: { lifetime: 199 } },
  CAD: { symbol: 'C$',  code: 'CAD', tier: 'tier1', FAMILY: { monthly: 9.99,  yearly: 99  }, FOUNDER: { lifetime: 329 } },
  AUD: { symbol: 'A$',  code: 'AUD', tier: 'tier1', FAMILY: { monthly: 10.99, yearly: 109 }, FOUNDER: { lifetime: 369 } },
  NZD: { symbol: 'NZ$', code: 'NZD', tier: 'tier1', FAMILY: { monthly: 11.99, yearly: 119 }, FOUNDER: { lifetime: 399 } },

  // Tier 2 — EU pricing
  EUR: { symbol: '€',   code: 'EUR', tier: 'tier2', FAMILY: { monthly: 5.99,  yearly: 59  }, FOUNDER: { lifetime: 229 } },

  // Tier 3 — 50% PPP
  ZAR: { symbol: 'R',   code: 'ZAR', tier: 'tier3', FAMILY: { monthly: 69,    yearly: 690 }, FOUNDER: { lifetime: 3999 } },
  BRL: { symbol: 'R$',  code: 'BRL', tier: 'tier3', FAMILY: { monthly: 19.99, yearly: 199 }, FOUNDER: { lifetime: 999 } },
  MXN: { symbol: 'MX$', code: 'MXN', tier: 'tier3', FAMILY: { monthly: 69,    yearly: 690 }, FOUNDER: { lifetime: 3999 } },
  PHP: { symbol: '₱',   code: 'PHP', tier: 'tier3', FAMILY: { monthly: 199,   yearly: 1999 }, FOUNDER: { lifetime: 9999 } },

  // Tier 4 — 30% PPP, annual-only (no monthly)
  INR: { symbol: '₹',   code: 'INR', tier: 'tier4', annualOnly: true, FAMILY: { monthly: 0, yearly: 1999 },  FOUNDER: { lifetime: 14999 } },
  NGN: { symbol: '₦',   code: 'NGN', tier: 'tier4', annualOnly: true, FAMILY: { monthly: 0, yearly: 13999 }, FOUNDER: { lifetime: 199999 } },
  KES: { symbol: 'KSh', code: 'KES', tier: 'tier4', annualOnly: true, FAMILY: { monthly: 0, yearly: 6999 },  FOUNDER: { lifetime: 24999 } },
  PKR: { symbol: 'Rs',  code: 'PKR', tier: 'tier4', annualOnly: true, FAMILY: { monthly: 0, yearly: 13999 }, FOUNDER: { lifetime: 49999 } },
};

const DEFAULT_CURRENCY = 'USD';

// Trial configuration
const TRIAL_DAYS = 30;
const TRIAL_TIER = 'FAMILY'; // Trial users get Family tier features

// =============================================================================
// HELPERS
// =============================================================================
function getCurrencyForCountry(countryCode: string): string {
  const currency = COUNTRY_CURRENCY[countryCode?.toUpperCase()];
  return (currency && PRICING[currency]) ? currency : DEFAULT_CURRENCY;
}

function getCountryFromRequest(c: any): string {
  // Cloudflare provides country in cf object
  const cfCountry = c.req.raw?.cf?.country;
  if (cfCountry) return cfCountry;
  
  // Fallback: check headers
  const headerCountry = c.req.header('cf-ipcountry') || c.req.header('x-country');
  if (headerCountry) return headerCountry;
  
  return 'US';
}

// =============================================================================
// TIER LIMITS - Feature-based tiers
// =============================================================================
const TIER_LIMITS = {
  // FREE tier (DB tier 'FREE'/'STARTER'). The free tier is gated on STORAGE and
  // THREADS only — every feature is available to try, but capped to one thread
  // and 500 MB so families upgrade for room and more threads, not features.
  STARTER: {
    maxStorage: 512 * 1024 * 1024, // 500 MB
    maxStorageLabel: '500 MB',
    maxThreads: 1,
    maxMemoriesPerMonth: -1, // unlimited within storage
    maxFamilyMembers: -1,
    maxRecipients: -1,
    maxLetters: -1,
    maxVoiceMinutes: -1,
    maxPhotos: -1,
    maxVideoMinutes: 5,
    posthumousDelivery: true,
    deadManSwitchDays: 30,
    familyTree: false,
    aiTranscription: false,
    aiLetterHelp: true,
    aiMemoryPrompts: true,
    yearWrapped: true,
    prioritySupport: false,
    premiumExport: false,
    apiAccess: false,
  },
  FAMILY: {
    maxStorage: 50 * 1024 * 1024 * 1024, // 50GB
    maxStorageLabel: '50 GB',
    maxThreads: -1,
    maxMemoriesPerMonth: -1, // unlimited
    maxFamilyMembers: 5,
    maxRecipients: -1,
    maxLetters: -1,
    maxVoiceMinutes: -1,
    maxPhotos: -1,
    maxVideoMinutes: 30,
    posthumousDelivery: true,
    deadManSwitchDays: 14,
    familyTree: true,
    aiTranscription: true,
    aiLetterHelp: true,
    aiMemoryPrompts: true,
    aiMemoryInsights: true,
    yearWrapped: true,
    prioritySupport: true,
    premiumExport: true,
    videoMontage: true,
    apiAccess: false,
  },
  LEGACY: {
    maxStorage: 500 * 1024 * 1024 * 1024, // 500GB
    maxStorageLabel: '500 GB',
    maxThreads: -1,
    maxMemoriesPerMonth: -1, // unlimited
    maxFamilyMembers: -1, // unlimited
    maxRecipients: -1,
    maxLetters: -1,
    maxVoiceMinutes: -1,
    maxPhotos: -1,
    maxVideoMinutes: -1, // unlimited
    posthumousDelivery: true,
    deadManSwitchDays: 7,
    familyTree: true,
    aiTranscription: true,
    aiLetterHelp: true,
    aiMemoryPrompts: true,
    aiMemoryInsights: true,
    livingLegacyAvatar: true, // future feature
    voiceToMemory: true,
    collaborativeEditing: true,
    yearWrapped: true,
    prioritySupport: true,
    dedicatedSupport: true,
    premiumExport: true,
    videoMontage: true,
    physicalMemoryBook: true, // 1/year
    apiAccess: true,
    whiteGloveOnboarding: true,
  },
  // Alias for backward compatibility
  FOREVER: {
    maxStorage: 500 * 1024 * 1024 * 1024, // 500GB
    maxStorageLabel: '500 GB',
    maxThreads: -1,
    maxMemoriesPerMonth: -1,
    maxFamilyMembers: -1,
    maxRecipients: -1,
    maxLetters: -1,
    maxVoiceMinutes: -1,
    maxPhotos: -1,
    maxVideoMinutes: -1,
    posthumousDelivery: true,
    deadManSwitchDays: 7,
    familyTree: true,
    aiTranscription: true,
    aiLetterHelp: true,
    aiMemoryPrompts: true,
    aiMemoryInsights: true,
    livingLegacyAvatar: true,
    voiceToMemory: true,
    collaborativeEditing: true,
    yearWrapped: true,
    prioritySupport: true,
    dedicatedSupport: true,
    premiumExport: true,
    videoMontage: true,
    physicalMemoryBook: true,
    apiAccess: true,
    whiteGloveOnboarding: true,
  },
};

// =============================================================================
// COUPONS
// =============================================================================
const COUPONS: Record<string, { discount: number; type: 'percent' | 'fixed'; expires?: string; maxUses?: number; description: string }> = {
  'LEGACY2024': { discount: 25, type: 'percent', expires: '2025-01-31', maxUses: 1000, description: 'Early bird - 25% off' },
  'HEIRLOOM25': { discount: 25, type: 'percent', expires: '2024-12-23', maxUses: 500, description: 'Launch weekend - 25% off' },
  'ANNUAL20': { discount: 20, type: 'percent', description: 'Switch to annual - 20% off' },
  'FRIEND10': { discount: 10, type: 'percent', description: 'Friend referral - 10% off' },
};

const LEGACY_MAP: Record<string, string> = {
  'FREE': 'STARTER', 'ESSENTIAL': 'STARTER', 'PREMIUM': 'FAMILY', 'FOREVER': 'LEGACY', 'PLUS': 'FAMILY'
};

// NOTE: Checkout always uses dynamic Stripe `price_data` built from the PRICING
// table above (see /checkout). We deliberately do NOT use pre-created fixed
// Stripe Price IDs — a fixed price object's amount can't be changed from code,
// so it would silently desync from the displayed price. Dynamic price_data
// guarantees Stripe charges exactly the amount the user was shown.

function normalizeTier(tier: string): keyof typeof TIER_LIMITS {
  const upper = (tier || 'STARTER').toUpperCase();
  return (TIER_LIMITS[upper as keyof typeof TIER_LIMITS] ? upper : LEGACY_MAP[upper] || 'STARTER') as keyof typeof TIER_LIMITS;
}

// =============================================================================
// ROUTES
// =============================================================================

// Auto-detect country/currency
billingRoutes.get('/detect', async (c) => {
  const country = getCountryFromRequest(c);
  const currency = getCurrencyForCountry(country);
  const prices = PRICING[currency];
  
  return c.json({ country, currency, symbol: prices.symbol });
});

// Get pricing - auto-detects currency from country
billingRoutes.get('/pricing', async (c) => {
  const overrideCurrency = c.req.query('currency')?.toUpperCase();
  const country = getCountryFromRequest(c);
  const currency = overrideCurrency && PRICING[overrideCurrency] ? overrideCurrency : getCurrencyForCountry(country);
  const prices = PRICING[currency];
  const pricingTier = COUNTRY_TO_PRICING_TIER[country] || 'tier1';
  const isAnnualOnly = prices.annualOnly || false;

  return c.json({
    country,
    currency,
    symbol: prices.symbol,
    pricingTier,
    isAnnualOnly,
    trialDays: TRIAL_DAYS,
    // Flat fields the web Pricing page reads directly for localized display.
    FAMILY: { monthly: prices.FAMILY.monthly, yearly: prices.FAMILY.yearly },
    FOUNDER: { lifetime: prices.FOUNDER.lifetime },
    tiers: [
      {
        id: 'FREE',
        name: 'Free',
        description: 'Start your family thread at no cost, forever',
        storage: '500 MB',
        maxThreads: 1,
        maxFamilyMembers: -1,
        price: { amount: 0, display: `${prices.symbol}0` },
        features: [
          'One family thread',
          '500 MB storage',
          'Try every feature — voice, photo & written',
          'Invite your whole family',
          'Export anytime — no lock-in',
        ],
      },
      {
        id: 'FAMILY',
        name: 'Family',
        description: 'The whole family, unlimited, with the keepsake features',
        storage: '50 GB',
        maxThreads: -1,
        maxFamilyMembers: 5,
        maxMemoriesPerMonth: -1,
        popular: true,
        monthly: isAnnualOnly ? null : {
          amount: prices.FAMILY.monthly,
          display: `${prices.symbol}${prices.FAMILY.monthly}`
        },
        yearly: {
          amount: prices.FAMILY.yearly,
          display: `${prices.symbol}${prices.FAMILY.yearly}`,
          perMonth: `${prices.symbol}${(prices.FAMILY.yearly / 12).toFixed(2)}`,
          savings: '2 months free'
        },
        features: [
          'Unlimited threads & entries',
          'Voice entries',
          'Time-locked & sealed entries',
          'Up to 5 family members',
          '50GB storage',
          'Family tree + premium export',
        ],
      },
      {
        id: 'FOUNDER',
        name: 'Founder',
        description: 'Everything in Family, once, for life',
        storage: '500 GB',
        maxThreads: -1,
        maxFamilyMembers: -1,
        oneTime: {
          amount: prices.FOUNDER.lifetime,
          display: `${prices.symbol}${prices.FOUNDER.lifetime}`,
        },
        features: [
          'Everything in Family, forever',
          'One-time payment — never billed again',
          'Founder badge + pledge number',
          'Locked price for life',
          'Vote on the product roadmap',
        ],
      },
    ],
    trial: {
      days: TRIAL_DAYS,
      tier: TRIAL_TIER,
      creditCardRequired: false,
      description: 'Full Family access for 30 days, then drops to Free — never locked out',
    },
    annualSavings: '2 months free',
  });
});

// Get subscription
billingRoutes.get('/subscription', async (c) => {
  const userId = c.get('userId');
  // Prioritize ACTIVE subscriptions over TRIALING, and get the most recent one
  const sub = await c.env.DB.prepare(`
    SELECT * FROM subscriptions WHERE user_id = ?
    ORDER BY CASE status WHEN 'ACTIVE' THEN 0 WHEN 'TRIALING' THEN 1 ELSE 2 END, created_at DESC
  `).bind(userId).first();
  
  if (!sub) {
    return c.json({ tier: 'STARTER', status: 'ACTIVE', storage: '500 MB', limits: TIER_LIMITS.STARTER, trialDaysRemaining: 0 });
  }
  
  // During an ACTIVE trial, honour TRIAL_TIER so the user gets full Family-level
  // access without subscribing. Once the trial window passes we DON'T lock out —
  // the user simply drops to their stored (Free) tier. No subscription required.
  const rawTier = normalizeTier(sub.tier as string);
  const trialActive = sub.status === 'TRIALING' && !!sub.trial_ends_at &&
    new Date(sub.trial_ends_at as string).getTime() > Date.now();
  const tier = (trialActive ? TRIAL_TIER : rawTier) as keyof typeof TIER_LIMITS;

  let trialDaysRemaining = 0;
  if (sub.status === 'TRIALING' && sub.trial_ends_at) {
    const trialEnd = new Date(sub.trial_ends_at as string);
    const now = new Date();
    trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return c.json({
    id: sub.id, tier, status: sub.status, billingCycle: sub.billing_cycle,
    currentPeriodEnd: sub.current_period_end, cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    trial_ends_at: sub.trial_ends_at ?? null,
    trialDaysRemaining,
    storage: TIER_LIMITS[tier].maxStorageLabel, limits: TIER_LIMITS[tier],
  });
});

// Get limits/usage
billingRoutes.get('/limits', async (c) => {
  const userId = c.get('userId');
  // Prioritize ACTIVE subscriptions over TRIALING, and get the most recent one
  const sub = await c.env.DB.prepare(`
    SELECT tier, status, trial_ends_at FROM subscriptions WHERE user_id = ?
    ORDER BY CASE status WHEN 'ACTIVE' THEN 0 WHEN 'TRIALING' THEN 1 ELSE 2 END, created_at DESC
  `).bind(userId).first();
  const rawTier = normalizeTier(sub?.tier as string || 'STARTER');
  const trialActive = sub?.status === 'TRIALING' && !!sub?.trial_ends_at &&
    new Date(sub.trial_ends_at as string).getTime() > Date.now();
  const tier = (trialActive ? TRIAL_TIER : rawTier) as keyof typeof TIER_LIMITS;
  const tierLimits = TIER_LIMITS[tier];
  
  const memoriesResult = await c.env.DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total FROM memories WHERE user_id = ?').bind(userId).first();
  const voiceResult = await c.env.DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(duration), 0) as totalMinutes, COALESCE(SUM(file_size), 0) as total FROM voice_recordings WHERE user_id = ?').bind(userId).first();
  const lettersResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM letters WHERE user_id = ?').bind(userId).first();
  
  const usedBytes = ((memoriesResult?.total as number) || 0) + ((voiceResult?.total as number) || 0);
  const percentage = Math.round((usedBytes / tierLimits.maxStorage) * 100);
  const usedMB = Math.round(usedBytes / (1024 * 1024));
  const maxMB = Math.round(tierLimits.maxStorage / (1024 * 1024));
  
  return c.json({
    tier,
    memories: {
      current: (memoriesResult?.count as number) || 0,
      max: -1,
    },
    voice: {
      current: Math.round(((voiceResult?.totalMinutes as number) || 0) / 60),
      max: -1,
    },
    letters: {
      current: (lettersResult?.count as number) || 0,
      max: -1,
    },
    storage: {
      current: usedMB,
      max: maxMB,
      usedMB,
      maxLabel: tierLimits.maxStorageLabel,
      percentage,
      warning: percentage > 80,
      full: percentage >= 100,
    },
    allFeaturesIncluded: true,
  });
});

// Validate coupon
billingRoutes.post('/validate-coupon', async (c) => {
  const { code } = await c.req.json();
  const coupon = COUPONS[code?.toUpperCase()];
  
  if (!coupon) return c.json({ valid: false, error: 'Invalid coupon code' }, 400);
  if (coupon.expires && new Date(coupon.expires) < new Date()) {
    return c.json({ valid: false, error: 'Coupon has expired' }, 400);
  }
  
  return c.json({ valid: true, code: code.toUpperCase(), discount: coupon.discount, description: coupon.description });
});

// Validate influencer discount code
billingRoutes.post('/validate-influencer-code', async (c) => {
  const { code } = await c.req.json();
  
  if (!code) {
    return c.json({ valid: false, error: 'Code is required' }, 400);
  }
  
  const influencer = await c.env.DB.prepare(`
    SELECT id, name, discount_code, discount_percent, status
    FROM influencers WHERE discount_code = ? AND status = 'ACTIVE'
  `).bind(code.toUpperCase()).first();
  
  if (!influencer) {
    return c.json({ valid: false, error: 'Invalid or inactive discount code' }, 400);
  }
  
  return c.json({
    valid: true,
    code: influencer.discount_code,
    discountPercent: influencer.discount_percent,
    influencerName: influencer.name,
  });
});

// Calculate price
billingRoutes.post('/calculate', async (c) => {
  const { tier, billingCycle, couponCode } = await c.req.json();
  
  const country = getCountryFromRequest(c);
  const currency = getCurrencyForCountry(country);
  const prices = PRICING[currency];
  const normalizedTier = normalizeTier(tier);
  // Family is the only recurring plan; Free is $0 and Founder is a one-time pledge (/founder).
  if (normalizedTier !== 'FAMILY') return c.json({ error: 'Only the Family plan is billed here.' }, 400);
  const tierPrices = prices.FAMILY;

  const isYearly = billingCycle === 'yearly';
  let basePrice = isYearly ? tierPrices.yearly : tierPrices.monthly;
  let discount = 0;
  
  if (couponCode) {
    const coupon = COUPONS[couponCode.toUpperCase()];
    if (coupon && (!coupon.expires || new Date(coupon.expires) > new Date())) {
      discount = coupon.type === 'percent' ? basePrice * (coupon.discount / 100) : coupon.discount;
    }
  }
  
  const finalPrice = Math.max(0, basePrice - discount);
  
  return c.json({
    country, currency, symbol: prices.symbol, tier: normalizedTier, billingCycle,
    basePrice, discount, finalPrice, display: `${prices.symbol}${finalPrice.toFixed(2)}`,
  });
});

// Create checkout
billingRoutes.post('/checkout', async (c) => {
  const userId = c.get('userId');
  const { tier, billingCycle, couponCode, influencerCode } = await c.req.json();
  
  const country = getCountryFromRequest(c);
  const currency = getCurrencyForCountry(country);
  const prices = PRICING[currency];
  const normalizedTier = normalizeTier(tier);
  // Family is the only recurring checkout. Free needs no payment; Founder is the
  // one-time lifetime pledge handled at /founder (founders.ts).
  if (normalizedTier !== 'FAMILY') {
    return c.json({ error: 'The Founder plan is a one-time pledge — visit /founder. Only the Family plan is billed here.' }, 400);
  }
  const tierPrices = prices.FAMILY;

  const isYearly = billingCycle === 'yearly';
  let finalPrice = isYearly ? tierPrices.yearly : tierPrices.monthly;
  let appliedDiscount: { type: 'coupon' | 'influencer'; code: string; percent: number } | null = null;
  let influencerId: string | null = null;
  
  // Check for influencer discount code first
  if (influencerCode) {
    const influencer = await c.env.DB.prepare(`
      SELECT id, discount_code, discount_percent, status
      FROM influencers WHERE discount_code = ? AND status = 'ACTIVE'
    `).bind(influencerCode.toUpperCase()).first();
    
    if (influencer) {
      const discountPercent = influencer.discount_percent as number;
      finalPrice = Math.max(0, finalPrice - (finalPrice * (discountPercent / 100)));
      appliedDiscount = { type: 'influencer', code: influencer.discount_code as string, percent: discountPercent };
      influencerId = influencer.id as string;
    }
  }
  
  // Apply coupon code if no influencer discount was applied
  if (!appliedDiscount && couponCode) {
    const coupon = COUPONS[couponCode.toUpperCase()];
    if (coupon && (!coupon.expires || new Date(coupon.expires) > new Date())) {
      const discountAmount = coupon.type === 'percent' ? finalPrice * (coupon.discount / 100) : coupon.discount;
      finalPrice = Math.max(0, finalPrice - discountAmount);
      appliedDiscount = { type: 'coupon', code: couponCode.toUpperCase(), percent: coupon.discount };
    }
  }
  
  // Get user email for Stripe
  const user = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first();
  if (!user) return c.json({ error: 'User not found' }, 404);
  
  // Check if Stripe is configured
  if (!c.env.STRIPE_SECRET_KEY) {
    // Fallback: Direct plan change without payment (for testing/development)
    const now = new Date().toISOString();
    const existing = await c.env.DB.prepare('SELECT id FROM subscriptions WHERE user_id = ?').bind(userId).first();
    
    if (existing) {
      await c.env.DB.prepare('UPDATE subscriptions SET tier = ?, billing_cycle = ?, updated_at = ? WHERE user_id = ?')
        .bind(normalizedTier, billingCycle || 'monthly', now, userId).run();
    } else {
      await c.env.DB.prepare('INSERT INTO subscriptions (id, user_id, tier, status, billing_cycle, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), userId, normalizedTier, 'ACTIVE', billingCycle || 'monthly', now, now).run();
    }
    
    return c.json({
      success: true,
      tier: normalizedTier,
      billingCycle,
      message: 'Subscription updated (Stripe not configured)',
    });
  }
  
  // Create Stripe checkout session
  try {
    const billingInterval = isYearly ? 'yearly' : 'monthly';

    // Build checkout session params
    const userIdStr = userId || '';
    const params: Record<string, string> = {
      'mode': 'subscription',
      'customer_email': user.email as string,
      'success_url': `${c.env.APP_URL}/settings?tab=subscription&success=true`,
      'cancel_url': `${c.env.APP_URL}/settings?tab=subscription&canceled=true`,
      'metadata[user_id]': userIdStr,
      'metadata[tier]': normalizedTier,
      'metadata[billing_cycle]': billingInterval,
      // Pass metadata to subscription so webhooks can identify user
      'subscription_data[metadata][user_id]': userIdStr,
      'subscription_data[metadata][tier]': normalizedTier,
      'subscription_data[metadata][billing_cycle]': billingInterval,
    };
    
    // Add influencer tracking metadata if applicable
    if (influencerId) {
      params['metadata[influencer_id]'] = influencerId;
      params['metadata[influencer_code]'] = appliedDiscount?.code || '';
      params['subscription_data[metadata][influencer_id]'] = influencerId;
      params['subscription_data[metadata][influencer_code]'] = appliedDiscount?.code || '';
    }
    
    // Dynamic price_data built from the PRICING table, so Stripe charges exactly
    // the displayed amount (see STRIPE PRICE IDS note above).
    const priceInCents = Math.round(finalPrice * 100);
    params['line_items[0][price_data][currency]'] = currency.toLowerCase();
    params['line_items[0][price_data][product_data][name]'] = `Heirloom ${normalizedTier} Plan`;
    params['line_items[0][price_data][product_data][description]'] = `${TIER_LIMITS[normalizedTier].maxStorageLabel} storage with all features`;
    params['line_items[0][price_data][unit_amount]'] = priceInCents.toString();
    params['line_items[0][price_data][recurring][interval]'] = isYearly ? 'year' : 'month';
    params['line_items[0][quantity]'] = '1';
    
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
    });
    
    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json() as { error?: { message?: string } };
      console.error('Stripe error:', errorData);
      return c.json({ error: errorData.error?.message || 'Failed to create checkout session' }, 500);
    }
    
    const session = await stripeResponse.json() as { id: string; url: string };

    return c.json({
      url: session.url,
      sessionId: session.id,
      tier: normalizedTier,
      billingCycle,
      currency,
      finalPrice,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

// Change plan - redirects to new checkout (for plan upgrades/downgrades)
billingRoutes.post('/change-plan', async (c) => {
  const userId = c.get('userId');
  const { tier, billingCycle } = await c.req.json();
  const normalizedTier = normalizeTier(tier);
  
  // Get current subscription
  const sub = await c.env.DB.prepare('SELECT stripe_subscription_id FROM subscriptions WHERE user_id = ?').bind(userId).first();
  
  // If user has an active Stripe subscription, cancel it first and create new checkout
  if (sub?.stripe_subscription_id && c.env.STRIPE_SECRET_KEY) {
    try {
      // Cancel the existing subscription at period end
      await fetch(`https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'cancel_at_period_end=true',
      });
    } catch (error) {
      console.error('Failed to cancel existing subscription:', error);
    }
  }
  
  // Redirect user to checkout for the new plan
  return c.json({ 
    success: true, 
    message: 'Please complete checkout for your new plan',
    redirectToCheckout: true,
    tier: normalizedTier,
    billingCycle: billingCycle || 'monthly',
  });
});

// Cancel subscription - updates both Stripe and local DB
billingRoutes.post('/cancel', async (c) => {
  const userId = c.get('userId');
  const now = new Date().toISOString();
  
  // Get the Stripe subscription ID
  const sub = await c.env.DB.prepare('SELECT stripe_subscription_id FROM subscriptions WHERE user_id = ?').bind(userId).first();
  
  if (sub?.stripe_subscription_id && c.env.STRIPE_SECRET_KEY) {
    try {
      // Cancel the subscription in Stripe at period end (so user keeps access until paid period ends)
      const response = await fetch(`https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'cancel_at_period_end=true',
      });
      
      if (!response.ok) {
        const error = await response.json() as { error?: { message?: string } };
        console.error('Stripe cancel error:', error);
        return c.json({ error: error.error?.message || 'Failed to cancel subscription' }, 500);
      }
    } catch (error) {
      console.error('Failed to cancel Stripe subscription:', error);
      return c.json({ error: 'Failed to cancel subscription' }, 500);
    }
  }
  
  // Update local DB
  await c.env.DB.prepare('UPDATE subscriptions SET cancel_at_period_end = 1, updated_at = ? WHERE user_id = ?')
    .bind(now, userId).run();
  
  return c.json({ success: true, message: 'Subscription will be canceled at the end of the billing period' });
});

// Stripe Customer Portal - for users to manage their subscription
billingRoutes.post('/portal', async (c) => {
  const userId = c.get('userId');
  
  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json({ error: 'Stripe not configured' }, 500);
  }
  
  // Get user's Stripe customer ID or email
  const user = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first();
  const sub = await c.env.DB.prepare('SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?').bind(userId).first();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  try {
    let customerId = sub?.stripe_customer_id as string | null;
    
    // If no customer ID stored, search by email
    if (!customerId) {
      const searchResponse = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email as string)}&limit=1`, {
        headers: { 'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}` },
      });
      const searchData = await searchResponse.json() as { data?: Array<{ id: string }> };
      customerId = searchData.data?.[0]?.id || null;
    }
    
    if (!customerId) {
      return c.json({ error: 'No billing history found. Please subscribe to a plan first.' }, 404);
    }
    
    // Create portal session
    const portalResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'customer': customerId,
        'return_url': `${c.env.APP_URL}/settings?tab=subscription`,
      }).toString(),
    });
    
    if (!portalResponse.ok) {
      const error = await portalResponse.json() as { error?: { message?: string } };
      return c.json({ error: error.error?.message || 'Failed to create portal session' }, 500);
    }
    
    const portal = await portalResponse.json() as { url: string };
    return c.json({ url: portal.url });
  } catch (error) {
    console.error('Portal error:', error);
    return c.json({ error: 'Failed to create portal session' }, 500);
  }
});

// Usage stats
billingRoutes.get('/usage', async (c) => {
  const userId = c.get('userId');
  const sub = await c.env.DB.prepare('SELECT tier FROM subscriptions WHERE user_id = ?').bind(userId).first();
  const tier = normalizeTier(sub?.tier as string || 'STARTER');
  
  const memories = await c.env.DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as size FROM memories WHERE user_id = ?').bind(userId).first();
  const voice = await c.env.DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as size FROM voice_recordings WHERE user_id = ?').bind(userId).first();
  const letters = await c.env.DB.prepare('SELECT COUNT(*) as count FROM letters WHERE user_id = ?').bind(userId).first();
  
  const totalBytes = ((memories?.size as number) || 0) + ((voice?.size as number) || 0);
  
  return c.json({
    tier,
    storage: { usedMB: Math.round(totalBytes / (1024 * 1024)), maxLabel: TIER_LIMITS[tier].maxStorageLabel, percentage: Math.round((totalBytes / TIER_LIMITS[tier].maxStorage) * 100) },
    counts: { memories: memories?.count || 0, voiceRecordings: voice?.count || 0, letters: letters?.count || 0 },
  });
});

// Stripe webhook signature verification using HMAC-SHA256
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance: number = 300
): Promise<boolean> {
  const parts = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts['t'];
  const expectedSignature = parts['v1'];

  if (!timestamp || !expectedSignature) {
    return false;
  }

  const timestampNum = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  
  if (Math.abs(now - timestampNum) > tolerance) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );
  
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return computedSignature === expectedSignature;
}

// Validate that metadata.tier is consistent with the amount actually charged.
// Stripe metadata is attacker-controlled so we cross-check against amount_total.
// USD reference amounts (cents): FAMILY monthly = 699, FOUNDER lifetime = 24900.
// We accept any amount >= 24900 as FOUNDER and any amount < 24900 as FAMILY,
// regardless of metadata, so localised non-USD amounts are handled gracefully.
function validateTierFromAmount(metadataTier: string, amountTotal: number): 'FAMILY' | 'FOUNDER' {
  const upper = (metadataTier || '').toUpperCase();
  const claimedFounder = upper === 'FOUNDER' || upper === 'LEGACY' || upper === 'FOREVER';
  // Threshold: $249 USD in cents. Non-USD amounts for Founder are always >> 699.
  const paidEnoughForFounder = amountTotal >= 24900;

  if (claimedFounder && !paidEnoughForFounder) {
    // Claimed Founder but only paid Family-level — downgrade to FAMILY
    console.warn(`Tier spoof attempt: metadata says ${metadataTier} but amount_total=${amountTotal}; granting FAMILY`);
    return 'FAMILY';
  }
  if (!claimedFounder && paidEnoughForFounder) {
    // Claimed Family but paid Founder-level — upgrade to FOUNDER
    console.warn(`Tier under-claim: metadata says ${metadataTier} but amount_total=${amountTotal}; granting FOUNDER`);
    return 'FOUNDER';
  }
  return claimedFounder ? 'FOUNDER' : 'FAMILY';
}

// Stripe webhook handler
billingRoutes.post('/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  const body = await c.req.text();

  if (!c.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return c.json({ error: 'Webhook not configured' }, 400);
  }

  const isValid = await verifyStripeSignature(body, signature, c.env.STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    console.error('Invalid Stripe webhook signature');
    return c.json({ error: 'Invalid signature' }, 401);
  }

  try {
    const event = JSON.parse(body) as {
      id: string;
      type: string;
      data: {
        object: {
          id: string;
          customer?: string;
          customer_email?: string;
          amount_total?: number;
          metadata?: { user_id?: string; tier?: string; billing_cycle?: string; type?: string; voucher_code?: string; pledge_id?: string; book_order_id?: string };
          subscription?: string;
          payment_intent?: string;
        };
      };
    };

    // Idempotency: ensure each Stripe event is processed at most once.
    // D1's INSERT OR IGNORE + changes() == 0 means already processed.
    await c.env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS processed_webhook_events (event_id TEXT PRIMARY KEY, processed_at INTEGER NOT NULL)`
    ).run();
    const insertResult = await c.env.DB.prepare(
      `INSERT OR IGNORE INTO processed_webhook_events (event_id, processed_at) VALUES (?, ?)`
    ).bind(event.id, Date.now()).run();
    if (insertResult.meta.changes === 0) {
      // Already processed — return 200 so Stripe stops retrying
      return c.json({ received: true, duplicate: true });
    }

    const now = new Date().toISOString();
    
    switch (event.type) {
            case 'checkout.session.completed': {
              const session = event.data.object;
              const metadataType = session.metadata?.type;
        
              // Handle Founder pledge checkout — atomically mark PAID and
              // assign the next pledge_number (1..100). Send Founder
              // welcome email.
              if (metadataType === 'founder_pledge') {
                const pledgeId = session.metadata?.pledge_id;
                if (pledgeId) {
                  try {
                    await c.env.DB.prepare(
                      `UPDATE founder_pledges
                       SET status = 'PAID',
                           paid_at = ?,
                           pledge_number = (
                             SELECT COALESCE(MAX(pledge_number), 0) + 1
                             FROM founder_pledges
                             WHERE status IN ('PAID', 'ENGRAVED')
                           ),
                           stripe_session_id = COALESCE(stripe_session_id, ?),
                           updated_at = ?
                       WHERE id = ? AND status = 'PLEDGED'`,
                    ).bind(now, session.id, now, pledgeId).run();

                    const pledge = await c.env.DB.prepare(
                      `SELECT name, email, family_name, pledge_number FROM founder_pledges WHERE id = ?`,
                    ).bind(pledgeId).first<{ name: string; email: string; family_name: string | null; pledge_number: number | null }>();

                    if (pledge?.email && pledge.pledge_number) {
                      const numStr = String(pledge.pledge_number).padStart(3, '0');
                      await sendEmail(c.env, {
                        from: 'Heirloom <noreply@heirloom.blue>',
                        to: pledge.email,
                        subject: `Welcome, Founder #${numStr}`,
                        html: `
                          <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; line-height: 1.7; color: #1a1410;">
                            <p style="font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase; color: #b07a4a;">Founder · ${numStr} of 100</p>
                            <h2 style="font-weight: 300; font-size: 28px; margin: 8px 0 24px;">Thank you, ${(pledge.name || '').split(' ')[0]}.</h2>
                            <p>Your pledge is paid. ${pledge.family_name ? `The ${pledge.family_name} family ` : 'Your family '}now has lifetime Family-tier access on Heirloom.</p>
                            <p>Your name will appear in the continuity record we file with the successor non-profit at incorporation. We'll send you a copy when it's filed.</p>
                            <p>You'll get a calendar invite within the week for the first quarterly Founder call.</p>
                            <p>For now: <a href="https://heirloom.blue/threads" style="color: #b07a4a;">open your family's first thread</a>. The first entry is the hardest.</p>
                            <p style="margin-top: 32px;">— The Heirloom team</p>
                          </div>
                        `,
                      }, 'FOUNDER_WELCOME');
                    }
                  } catch (err) {
                    console.error('Founder pledge webhook error', err);
                  }
                }
                break;
              }

              // Handle Living Book print order checkout — payment is
              // confirmed, so flip the purchaser's PENDING order (created at
              // checkout time with their full wizard config) to COMPILING and
              // kick off PDF rendering (which uploads to R2 and submits to Lulu).
              if (metadataType === 'book_order') {
                const bookUserId = session.metadata?.user_id;
                const bookOrderId = session.metadata?.book_order_id;
                if (bookUserId && bookOrderId) {
                  try {
                    // Re-verify ownership + state in the webhook: Stripe
                    // metadata is attacker-controlled, so we only ever
                    // compile+print orders that are still pending and belong
                    // to the user named in the session.
                    const order = await c.env.DB.prepare(
                      `SELECT id FROM book_orders
                       WHERE id = ? AND purchaser_user_id = ? AND status = 'PENDING'`,
                    ).bind(bookOrderId, bookUserId).first();
                    if (!order) {
                      console.error('Book order webhook: order not found or not pending', { bookUserId, bookOrderId });
                      break;
                    }

                    await c.env.DB.prepare(
                      `UPDATE book_orders SET status = 'COMPILING', updated_at = datetime('now') WHERE id = ?`,
                    ).bind(bookOrderId).run();

                    c.executionCtx.waitUntil(
                      renderBookPdf(c.env, bookOrderId).catch(async (err) => {
                        const msg = err instanceof Error ? err.message : String(err);
                        await c.env.DB.prepare(
                          `UPDATE book_orders SET status = 'FAILED', error = ?, updated_at = datetime('now') WHERE id = ?`,
                        ).bind(msg, bookOrderId).run();
                      }),
                    );
                  } catch (err) {
                    console.error('Book order webhook error', err);
                  }
                }
                break;
              }

              // Handle gift voucher checkout
              if (metadataType === 'gift_voucher') {
                const voucherCode = session.metadata?.voucher_code;
                if (voucherCode) {
                  // Update voucher status to PAID
                  await c.env.DB.prepare(`
                    UPDATE gift_vouchers 
                    SET status = 'PAID', stripe_payment_intent_id = ?, updated_at = ?
                    WHERE code = ? AND status = 'PENDING'
                  `).bind(session.payment_intent || session.id, now, voucherCode).run();
            
                  // Get voucher details for email
                  const voucher = await c.env.DB.prepare(`
                    SELECT id, purchaser_email, purchaser_name, recipient_email, recipient_name, 
                           recipient_message, tier, duration_months, code
                    FROM gift_vouchers WHERE code = ?
                  `).bind(voucherCode).first();
            
                  if (voucher) {
                    // Send email to purchaser
                    if (voucher.purchaser_email) {
                      try {
                        await sendEmail(c.env, {
                          from: 'Heirloom <noreply@heirloom.blue>',
                          to: voucher.purchaser_email as string,
                          subject: 'Your Heirloom Gift Voucher is Ready',
                          html: `<p>Thank you for purchasing a Heirloom gift voucher!</p>
                                 <p>Your voucher code is: <strong>${voucher.code}</strong></p>
                                 <p>This voucher is for a ${voucher.tier} subscription (${voucher.duration_months} month${(voucher.duration_months as number) > 1 ? 's' : ''}).</p>
                                 <p>Share this code with your recipient or send them this link: ${c.env.APP_URL}/gift/redeem?code=${voucher.code}</p>`,
                        }, 'GIFT_VOUCHER_PURCHASER_CONFIRMATION');
                      } catch (e) {
                        console.error('Failed to send purchaser email:', e);
                      }
                    }
              
                    // If recipient email provided, send gift notification
                    if (voucher.recipient_email) {
                      try {
                        await sendEmail(c.env, {
                          from: 'Heirloom <noreply@heirloom.blue>',
                          to: voucher.recipient_email as string,
                          subject: `${voucher.purchaser_name || 'Someone'} sent you a Heirloom gift!`,
                          html: `<p>You've received a gift from ${voucher.purchaser_name || 'a friend'}!</p>
                                 ${voucher.recipient_message ? `<p><em>"${voucher.recipient_message}"</em></p>` : ''}
                                 <p>Your gift voucher code is: <strong>${voucher.code}</strong></p>
                                 <p>Redeem it here: <a href="${c.env.APP_URL}/gift/redeem?code=${voucher.code}">${c.env.APP_URL}/gift/redeem</a></p>`,
                        }, 'GIFT_VOUCHER_RECIPIENT_NOTIFICATION');
                  
                        // Update status to SENT
                        await c.env.DB.prepare(`
                          UPDATE gift_vouchers SET status = 'SENT', updated_at = ? WHERE code = ?
                        `).bind(now, voucherCode).run();
                      } catch (e) {
                        console.error('Failed to send recipient email:', e);
                      }
                    }
                  }
                }
                break;
              }
        
              // Handle regular subscription checkout
              const userId = session.metadata?.user_id;
              const rawTierMeta = session.metadata?.tier || 'STARTER';
              // Cross-validate metadata.tier against the amount actually charged
              // to prevent tier-spoofing via manipulated session metadata.
              const tier = validateTierFromAmount(rawTierMeta, session.amount_total ?? 0);
              const billingCycle = session.metadata?.billing_cycle || 'monthly';

              if (userId) {
                const existing = await c.env.DB.prepare('SELECT id FROM subscriptions WHERE user_id = ?').bind(userId).first();
                const customerId = session.customer || null;
                const subscriptionId = session.subscription || null;

                if (existing) {
                  await c.env.DB.prepare(`
                    UPDATE subscriptions
                    SET tier = ?, status = 'ACTIVE', billing_cycle = ?,
                        stripe_subscription_id = ?,
                        stripe_customer_id = COALESCE(stripe_customer_id, ?),
                        trial_ends_at = NULL, updated_at = ?
                    WHERE user_id = ?
                  `).bind(tier, billingCycle, subscriptionId, customerId, now, userId).run();
                } else {
                  await c.env.DB.prepare(`
                    INSERT INTO subscriptions (id, user_id, tier, status, billing_cycle, stripe_subscription_id, stripe_customer_id, created_at, updated_at)
                    VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?)
                  `).bind(crypto.randomUUID(), userId, tier, billingCycle, subscriptionId, customerId, now, now).run();
                }
              }
              break;
            }
      
      case 'invoice.payment_succeeded': {
        // Subscription renewed successfully
        const invoice = event.data.object as {
          id: string;
          subscription?: string;
          metadata?: { user_id?: string };
        };
        
        // Try to get user_id from invoice metadata first, then lookup by subscription ID
        let userId = invoice.metadata?.user_id;
        if (!userId && invoice.subscription) {
          const sub = await c.env.DB.prepare('SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?')
            .bind(invoice.subscription).first();
          userId = sub?.user_id as string | undefined;
        }
        
        if (userId) {
          await c.env.DB.prepare(`
            UPDATE subscriptions SET status = 'ACTIVE', updated_at = ? WHERE user_id = ?
          `).bind(now, userId).run();
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        // Payment failed - mark subscription as past due
        const invoice = event.data.object as {
          id: string;
          subscription?: string;
          metadata?: { user_id?: string };
        };
        
        // Try to get user_id from invoice metadata first, then lookup by subscription ID
        let userId = invoice.metadata?.user_id;
        if (!userId && invoice.subscription) {
          const sub = await c.env.DB.prepare('SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?')
            .bind(invoice.subscription).first();
          userId = sub?.user_id as string | undefined;
        }
        
        if (userId) {
          await c.env.DB.prepare(`
            UPDATE subscriptions SET status = 'PAST_DUE', updated_at = ? WHERE user_id = ?
          `).bind(now, userId).run();
          
          // Log billing error
          await c.env.DB.prepare(`
            INSERT INTO billing_errors (id, user_id, error_type, error_message, created_at)
            VALUES (?, ?, 'PAYMENT_FAILED', 'Invoice payment failed', ?)
          `).bind(crypto.randomUUID(), userId, now).run();
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        // Subscription updated (e.g., plan change, renewal)
        const subscription = event.data.object as {
          id: string;
          metadata?: { user_id?: string; tier?: string; billing_cycle?: string };
          cancel_at_period_end?: boolean;
        };
        
        // Try to get user_id from subscription metadata first, then lookup by subscription ID
        let userId = subscription.metadata?.user_id;
        if (!userId) {
          const sub = await c.env.DB.prepare('SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?')
            .bind(subscription.id).first();
          userId = sub?.user_id as string | undefined;
        }
        
        if (userId) {
          await c.env.DB.prepare(`
            UPDATE subscriptions SET cancel_at_period_end = ?, updated_at = ? WHERE user_id = ?
          `).bind(subscription.cancel_at_period_end ? 1 : 0, now, userId).run();
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        // Subscription canceled
        const subscription = event.data.object as {
          id: string;
          metadata?: { user_id?: string };
        };

        // Try to get user_id from subscription metadata first, then lookup by subscription ID
        let userId = subscription.metadata?.user_id;
        if (!userId) {
          const sub = await c.env.DB.prepare('SELECT user_id, tier FROM subscriptions WHERE stripe_subscription_id = ?')
            .bind(subscription.id).first();
          userId = sub?.user_id as string | undefined;
          // Never downgrade LEGACY/Founder lifetime buyers via a subscription.deleted event —
          // they paid once, have no recurring subscription to cancel.
          if (sub?.tier === 'LEGACY' || sub?.tier === 'FOREVER') break;
        }

        if (userId) {
          // Check current tier before overwriting — protect lifetime buyers
          const current = await c.env.DB.prepare('SELECT tier FROM subscriptions WHERE user_id = ?')
            .bind(userId).first();
          if (current?.tier === 'LEGACY' || current?.tier === 'FOREVER') break;

          await c.env.DB.prepare(`
            UPDATE subscriptions SET status = 'CANCELLED', tier = 'STARTER', stripe_subscription_id = NULL, updated_at = ? WHERE user_id = ?
          `).bind(now, userId).run();
        }
        break;
      }
    }
    
    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// Update preferred currency for the authenticated user
billingRoutes.patch('/currency', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => ({})) as { currency?: string };
  const { currency } = body;

  if (!currency || typeof currency !== 'string' || currency.length !== 3) {
    return c.json({ error: 'Invalid currency code' }, 400);
  }

  await c.env.DB.prepare(`
    UPDATE users SET preferred_currency = ?, updated_at = ? WHERE id = ?
  `).bind(currency.toUpperCase(), new Date().toISOString(), userId).run();

  return c.json({ success: true });
});
