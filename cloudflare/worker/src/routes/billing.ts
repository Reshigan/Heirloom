/**
 * Heirloom Billing Routes - PRODUCTION VERSION
 *
 * Flat USD globally — one price for the whole world, no per-country parity:
 * - Free:    $0 forever - capped (the mass-adoption on-ramp)
 * - Family:  $2.99/mo or $29/yr - the volume paid tier
 * - Deep:    $7.99/mo or $79/yr - unlimited members + 250 GB + priority
 * - Founder: $249 one-time, lifetime — WITHDRAWN from buy surfaces (kept in
 *            PRICING + TIER_LIMITS only so existing founders retain access; no
 *            Founder card is rendered on /pricing or /signup).
 *
 * Checkout always uses dynamic Stripe price_data built from the table below, so
 * Stripe charges exactly the displayed amount (no fixed Price IDs to drift).
 * Existing subscribers keep the amount Stripe recorded at signup; repricing the
 * table only changes what NEW checkouts charge (standard grandfathering).
 *
 * Location's only effect: a small set of deepest-PPP regions (IN/NG/KE/PK/BD/
 * EG/GH) are ANNUAL-ONLY — the monthly toggle is suppressed there. Everyone
 * else pays the same flat USD price, monthly or annual.
 *
 * 30-day Family trial, no credit card; drops to Free (never locks out).
 * Country is auto-detected from Cloudflare's cf.country.
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { sendEmail } from '../utils/email';
import { renderBookPdf } from '../services/bookPdf';
import { FREE_STORAGE_BYTES } from '../lib/quota';

export const billingRoutes = new Hono<AppEnv>();

// =============================================================================
// ANNUAL-ONLY REGIONS — location's only effect on pricing
// =============================================================================
// Flat USD everywhere; no per-country parity. A small set of deepest-PPP
// regions are annual-only (monthly toggle suppressed). Everyone else pays the
// same flat USD price, monthly or annual.
const ANNUAL_ONLY_COUNTRIES = new Set(['IN', 'NG', 'KE', 'PK', 'BD', 'EG', 'GH']);

function isAnnualOnlyCountry(countryCode: string): boolean {
  return ANNUAL_ONLY_COUNTRIES.has(countryCode?.toUpperCase());
}

// =============================================================================
// PRICING — flat USD, the single global standard
// =============================================================================
// Stripe is charged the exact number below via dynamic price_data (no fixed
// Price IDs), so the displayed price always equals the charged price.
type TierPrices = { monthly: number; yearly: number };
const PRICING: {
  symbol: string;
  code: string;
  FAMILY: TierPrices;
  DEEP: TierPrices;
  // FOUNDER kept for existing founders only — no Founder card is rendered on
  // /pricing or /signup (tier withdrawn). The webhook's founder-pledge branch
  // still grants LEGACY/FOREVER from /founder, independent of this table.
  FOUNDER: { lifetime: number };
} = {
  symbol: '$',
  code: 'USD',
  FAMILY: { monthly: 2.99, yearly: 29 },
  DEEP:   { monthly: 7.99, yearly: 79 },
  FOUNDER: { lifetime: 249 },
};

// Trial configuration
const TRIAL_DAYS = 30;
const TRIAL_TIER = 'FAMILY'; // Trial users get Family tier features

// =============================================================================
// HELPERS
// =============================================================================
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
  // and 50 MB so families upgrade for room and more threads, not features.
  STARTER: {
    maxStorage: FREE_STORAGE_BYTES, // 50 MB — shared with quota.ts enforcement
    maxStorageLabel: '50 MB',
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
  // DEEP tier — the upgrade above Family: unlimited members + 250 GB + priority
  // support. The volume ladder's "best" tier. Trial still honours FAMILY (not
  // DEEP) — DEEP is an explicit paid upgrade from Family.
  DEEP: {
    maxStorage: 250 * 1024 * 1024 * 1024, // 250GB
    maxStorageLabel: '250 GB',
    maxThreads: -1,
    maxMemoriesPerMonth: -1, // unlimited
    maxFamilyMembers: -1, // unlimited — the multi-generational bloodline tier
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
    livingLegacyAvatar: true,
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

// Auto-detect country (currency is always USD — flat global pricing)
billingRoutes.get('/detect', async (c) => {
  const country = getCountryFromRequest(c);
  return c.json({ country, currency: PRICING.code, symbol: PRICING.symbol });
});

// Get pricing — flat USD worldwide; location only sets annual-only for tier4.
billingRoutes.get('/pricing', async (c) => {
  const country = getCountryFromRequest(c);
  const prices = PRICING;
  const pricingTier = isAnnualOnlyCountry(country) ? 'tier4' : 'tier1';
  const isAnnualOnly = isAnnualOnlyCountry(country);

  return c.json({
    country,
    currency: PRICING.code,
    symbol: prices.symbol,
    pricingTier,
    isAnnualOnly,
    trialDays: TRIAL_DAYS,
    // Flat fields the web Pricing page reads directly for display.
    FAMILY: { monthly: prices.FAMILY.monthly, yearly: prices.FAMILY.yearly },
    DEEP: { monthly: prices.DEEP.monthly, yearly: prices.DEEP.yearly },
    // FOUNDER flat field kept for the Billing page of existing founders (the
    // tier is withdrawn from buy surfaces — no FOUNDER card in `tiers` below).
    FOUNDER: { lifetime: prices.FOUNDER.lifetime },
    tiers: [
      {
        id: 'FREE',
        name: 'Free',
        description: 'Let the first entry settle into the Deep — no cost, forever',
        storage: '50 MB',
        maxThreads: 1,
        maxFamilyMembers: -1,
        price: { amount: 0, display: `${prices.symbol}0` },
        features: [
          'One bloodline in the Deep',
          '500 MB storage',
          'Try every feature — voice, photo & written entries',
          'Invite your whole family',
          'Export anytime — no lock-in',
        ],
      },
      {
        id: 'FAMILY',
        name: 'Family',
        description: 'The whole bloodline, unlimited entries, with the keepsake features',
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
          'Unlimited entries in the Deep',
          'Voice entries',
          'Sealed & time-locked notes',
          'Up to 5 family members',
          '50 GB storage',
          'Family tree + premium export',
        ],
      },
      {
        id: 'DEEP',
        name: 'Deep',
        description: 'The multi-generational bloodline — unlimited members, 250 GB, priority',
        storage: '250 GB',
        maxThreads: -1,
        maxFamilyMembers: -1,
        maxMemoriesPerMonth: -1,
        monthly: isAnnualOnly ? null : {
          amount: prices.DEEP.monthly,
          display: `${prices.symbol}${prices.DEEP.monthly}`
        },
        yearly: {
          amount: prices.DEEP.yearly,
          display: `${prices.symbol}${prices.DEEP.yearly}`,
          perMonth: `${prices.symbol}${(prices.DEEP.yearly / 12).toFixed(2)}`,
          savings: '2 months free'
        },
        features: [
          'Everything in Family',
          'Unlimited family members — the whole bloodline',
          '250 GB storage',
          'Unlimited voice & video entries',
          'Priority support + dedicated onboarding',
          'Annual physical memory book',
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
    return c.json({ tier: 'STARTER', status: 'ACTIVE', storage: '50 MB', limits: TIER_LIMITS.STARTER, trialDaysRemaining: 0 });
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
  
  const memoriesResult = await c.env.DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total FROM memories WHERE user_id = ? AND deleted_at IS NULL').bind(userId).first();
  const voiceResult = await c.env.DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(duration), 0) as totalMinutes, COALESCE(SUM(file_size), 0) as total FROM voice_recordings WHERE user_id = ? AND deleted_at IS NULL').bind(userId).first();
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
  const currency = PRICING.code;
  const prices = PRICING;
  const normalizedTier = normalizeTier(tier);
  // Family + Deep are the recurring plans; Free is $0 and Founder is a one-time pledge (/founder).
  if (normalizedTier !== 'FAMILY' && normalizedTier !== 'DEEP') return c.json({ error: 'Only the Family and Deep plans are billed here.' }, 400);
  const tierPrices = prices[normalizedTier];

  const isYearly = billingCycle === 'yearly';
  // Annual-only regions: monthly billing is not offered.
  if (!isYearly && isAnnualOnlyCountry(country)) {
    return c.json({ error: 'Monthly billing is not available in your region — choose annual.' }, 400);
  }
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
  const currency = PRICING.code;
  const prices = PRICING;
  const normalizedTier = normalizeTier(tier);
  // Family + Deep are the recurring checkouts. Free needs no payment; Founder
  // is the one-time lifetime pledge handled at /founder (founders.ts).
  if (normalizedTier !== 'FAMILY' && normalizedTier !== 'DEEP') {
    return c.json({ error: 'Only the Family and Deep plans are billed here. Founder is a one-time pledge at /founder.' }, 400);
  }
  const tierPrices = prices[normalizedTier];

  const isYearly = billingCycle === 'yearly';
  // Annual-only regions: reject monthly checkout so Stripe never builds a
  // monthly subscription for a market that's annual-only.
  if (!isYearly && isAnnualOnlyCountry(country)) {
    return c.json({ error: 'Monthly billing is not available in your region — choose annual.' }, 400);
  }
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
  
  const memories = await c.env.DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as size FROM memories WHERE user_id = ? AND deleted_at IS NULL').bind(userId).first();
  const voice = await c.env.DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as size FROM voice_recordings WHERE user_id = ? AND deleted_at IS NULL').bind(userId).first();
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

                    // Grant lifetime Family-tier access (FOREVER) if this
                    // pledge's email already has an account. Founder pledges
                    // never reach the regular-subscription branch below, so
                    // without this the payment was taken and no tier was ever
                    // granted. If the pledger has no account yet, the grant
                    // happens at registration (auth.ts register Founder-claim).
                    if (pledge?.email) {
                      const founderUser = await c.env.DB.prepare(
                        'SELECT id FROM users WHERE LOWER(email) = LOWER(?)'
                      ).bind(pledge.email).first<{ id: string }>();
                      if (founderUser?.id) {
                        const lifetimeEnd = new Date();
                        lifetimeEnd.setFullYear(lifetimeEnd.getFullYear() + 100);
                        const existingSub = await c.env.DB.prepare(
                          'SELECT id FROM subscriptions WHERE user_id = ?'
                        ).bind(founderUser.id).first();
                        if (existingSub) {
                          await c.env.DB.prepare(`
                            UPDATE subscriptions
                            SET tier = 'FOREVER', status = 'ACTIVE', billing_cycle = 'lifetime',
                                current_period_end = ?, trial_ends_at = NULL, updated_at = ?
                            WHERE user_id = ?
                          `).bind(lifetimeEnd.toISOString(), now, founderUser.id).run();
                        } else {
                          await c.env.DB.prepare(`
                            INSERT INTO subscriptions (id, user_id, tier, status, billing_cycle, current_period_start, current_period_end, created_at, updated_at)
                            VALUES (?, ?, 'FOREVER', 'ACTIVE', 'lifetime', ?, ?, ?, ?)
                          `).bind(crypto.randomUUID(), founderUser.id, now, lifetimeEnd.toISOString(), now, now).run();
                        }
                      }
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
                          html: `<p>Thank you for giving someone a place in Heirloom.</p>
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
                          subject: `${voucher.purchaser_name || 'Someone'} sent you a Heirloom gift`,
                          html: `<p>A gift has arrived for you, from ${voucher.purchaser_name || 'a friend'}.</p>
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
        
              // Handle regular subscription checkout. Founder pledges, gift
              // vouchers, and book orders each `break` in their own branches
              // above, so only recurring checkouts (Family or Deep) reach here.
              // Grant the tier from metadata — /checkout stamps the normalized
              // tier there and validates it's FAMILY or DEEP. Default to FAMILY
              // only when metadata is missing (legacy sessions pre-dating Deep).
              // Never trust the amount: a localised Deep payment could cross the
              // old $249 founder threshold, and 'FOUNDER' is not a valid
              // subscriptions.tier (CHECK rejects it) — the metadata is source of
              // truth, not the price.
              const userId = session.metadata?.user_id;
              const metaTier = (session.metadata?.tier || 'FAMILY').toUpperCase();
              const tier = (metaTier === 'DEEP') ? 'DEEP' : 'FAMILY';
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
