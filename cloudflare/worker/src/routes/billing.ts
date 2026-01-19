/**
 * Heirloom Billing Routes - PRODUCTION VERSION
 * 
 * 3-tier pricing with regional PPP adjustments:
 * - Starter: $4.99/mo - 5GB storage, 1 user
 * - Family: $9.99/mo - 50GB storage, 5 family members
 * - Legacy: $19.99/mo - 500GB storage, unlimited family
 * 
 * Regional Pricing Tiers:
 * - Tier 1: US, UK, CA, AU, NZ (full price)
 * - Tier 2: EU, Western Europe (EUR pricing)
 * - Tier 3: ZA, BR, MX, Southeast Asia (50% PPP)
 * - Tier 4: IN, NG, KE, PK (annual-only, 30% PPP)
 * 
 * 14-day free trial with credit card required.
 * Auto-detects country from Cloudflare for regional pricing.
 */

import { Hono } from 'hono';
import type { Env, AppEnv } from '../index';
import { sendEmail } from '../utils/email';

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
const PRICING: Record<string, {
  symbol: string;
  code: string;
  tier: PricingTier;
  annualOnly?: boolean;
  STARTER: { monthly: number; yearly: number };
  FAMILY: { monthly: number; yearly: number };
  LEGACY: { monthly: number; yearly: number };
}> = {
  // Tier 1 - Full price
  USD: {
    symbol: '$', code: 'USD', tier: 'tier1',
    STARTER: { monthly: 4.99, yearly: 49.99 },
    FAMILY: { monthly: 9.99, yearly: 99.99 },
    LEGACY: { monthly: 19.99, yearly: 199.99 },
  },
  GBP: {
    symbol: '£', code: 'GBP', tier: 'tier1',
    STARTER: { monthly: 3.99, yearly: 39.99 },
    FAMILY: { monthly: 7.99, yearly: 79.99 },
    LEGACY: { monthly: 15.99, yearly: 159.99 },
  },
  CAD: {
    symbol: 'C$', code: 'CAD', tier: 'tier1',
    STARTER: { monthly: 6.99, yearly: 69.99 },
    FAMILY: { monthly: 13.99, yearly: 139.99 },
    LEGACY: { monthly: 27.99, yearly: 279.99 },
  },
  AUD: {
    symbol: 'A$', code: 'AUD', tier: 'tier1',
    STARTER: { monthly: 7.99, yearly: 79.99 },
    FAMILY: { monthly: 15.99, yearly: 159.99 },
    LEGACY: { monthly: 31.99, yearly: 319.99 },
  },
  NZD: {
    symbol: 'NZ$', code: 'NZD', tier: 'tier1',
    STARTER: { monthly: 8.99, yearly: 89.99 },
    FAMILY: { monthly: 17.99, yearly: 179.99 },
    LEGACY: { monthly: 35.99, yearly: 359.99 },
  },
  
  // Tier 2 - EU pricing
  EUR: {
    symbol: '€', code: 'EUR', tier: 'tier2',
    STARTER: { monthly: 3.99, yearly: 39.99 },
    FAMILY: { monthly: 7.99, yearly: 79.99 },
    LEGACY: { monthly: 14.99, yearly: 149.99 },
  },
  
  // Tier 3 - 50% PPP (ZAR as base)
  ZAR: {
    symbol: 'R', code: 'ZAR', tier: 'tier3',
    STARTER: { monthly: 49, yearly: 499 },
    FAMILY: { monthly: 99, yearly: 999 },
    LEGACY: { monthly: 169, yearly: 1699 },
  },
  BRL: {
    symbol: 'R$', code: 'BRL', tier: 'tier3',
    STARTER: { monthly: 14.99, yearly: 149.99 },
    FAMILY: { monthly: 29.99, yearly: 299.99 },
    LEGACY: { monthly: 59.99, yearly: 599.99 },
  },
  MXN: {
    symbol: 'MX$', code: 'MXN', tier: 'tier3',
    STARTER: { monthly: 49, yearly: 499 },
    FAMILY: { monthly: 99, yearly: 999 },
    LEGACY: { monthly: 199, yearly: 1999 },
  },
  PHP: {
    symbol: '₱', code: 'PHP', tier: 'tier3',
    STARTER: { monthly: 149, yearly: 1499 },
    FAMILY: { monthly: 299, yearly: 2999 },
    LEGACY: { monthly: 599, yearly: 5999 },
  },
  
  // Tier 4 - 30% PPP, annual-only
  INR: {
    symbol: '₹', code: 'INR', tier: 'tier4', annualOnly: true,
    STARTER: { monthly: 0, yearly: 1499 },
    FAMILY: { monthly: 0, yearly: 2999 },
    LEGACY: { monthly: 0, yearly: 5999 },
  },
  NGN: {
    symbol: '₦', code: 'NGN', tier: 'tier4', annualOnly: true,
    STARTER: { monthly: 0, yearly: 14999 },
    FAMILY: { monthly: 0, yearly: 29999 },
    LEGACY: { monthly: 0, yearly: 59999 },
  },
  KES: {
    symbol: 'KSh', code: 'KES', tier: 'tier4', annualOnly: true,
    STARTER: { monthly: 0, yearly: 4999 },
    FAMILY: { monthly: 0, yearly: 9999 },
    LEGACY: { monthly: 0, yearly: 19999 },
  },
  PKR: {
    symbol: 'Rs', code: 'PKR', tier: 'tier4', annualOnly: true,
    STARTER: { monthly: 0, yearly: 9999 },
    FAMILY: { monthly: 0, yearly: 19999 },
    LEGACY: { monthly: 0, yearly: 39999 },
  },
};

const DEFAULT_CURRENCY = 'USD';

// Trial configuration
const TRIAL_DAYS = 14;
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
  STARTER: {
    maxStorage: 5 * 1024 * 1024 * 1024, // 5GB
    maxStorageLabel: '5 GB',
    maxMemoriesPerMonth: 50,
    maxFamilyMembers: 1,
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

// =============================================================================
// STRIPE PRICE IDS (Multi-currency - created via Stripe API)
// NOTE: These price IDs need to be updated in Stripe Dashboard with new prices
// =============================================================================
const STRIPE_PRICE_IDS: Record<string, Record<string, Record<string, string>>> = {
  USD: {
    STARTER: { monthly: 'price_starter_monthly_usd', yearly: 'price_starter_yearly_usd' },
    FAMILY: { monthly: 'price_family_monthly_usd', yearly: 'price_family_yearly_usd' },
    LEGACY: { monthly: 'price_legacy_monthly_usd', yearly: 'price_legacy_yearly_usd' },
  },
  GBP: {
    STARTER: { monthly: 'price_starter_monthly_gbp', yearly: 'price_starter_yearly_gbp' },
    FAMILY: { monthly: 'price_family_monthly_gbp', yearly: 'price_family_yearly_gbp' },
    LEGACY: { monthly: 'price_legacy_monthly_gbp', yearly: 'price_legacy_yearly_gbp' },
  },
  EUR: {
    STARTER: { monthly: 'price_starter_monthly_eur', yearly: 'price_starter_yearly_eur' },
    FAMILY: { monthly: 'price_family_monthly_eur', yearly: 'price_family_yearly_eur' },
    LEGACY: { monthly: 'price_legacy_monthly_eur', yearly: 'price_legacy_yearly_eur' },
  },
  ZAR: {
    STARTER: { monthly: 'price_starter_monthly_zar', yearly: 'price_starter_yearly_zar' },
    FAMILY: { monthly: 'price_family_monthly_zar', yearly: 'price_family_yearly_zar' },
    LEGACY: { monthly: 'price_legacy_monthly_zar', yearly: 'price_legacy_yearly_zar' },
  },
  INR: {
    STARTER: { yearly: 'price_starter_yearly_inr' },
    FAMILY: { yearly: 'price_family_yearly_inr' },
    LEGACY: { yearly: 'price_legacy_yearly_inr' },
  },
  NGN: {
    STARTER: { yearly: 'price_starter_yearly_ngn' },
    FAMILY: { yearly: 'price_family_yearly_ngn' },
    LEGACY: { yearly: 'price_legacy_yearly_ngn' },
  },
};

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
    tiers: [
      {
        id: 'STARTER',
        name: 'Starter',
        description: 'Perfect for individuals starting their legacy',
        storage: '5 GB',
        maxFamilyMembers: 1,
        maxMemoriesPerMonth: 50,
        monthly: isAnnualOnly ? null : { 
          amount: prices.STARTER.monthly, 
          display: `${prices.symbol}${prices.STARTER.monthly}` 
        },
        yearly: { 
          amount: prices.STARTER.yearly, 
          display: `${prices.symbol}${prices.STARTER.yearly}`, 
          perMonth: `${prices.symbol}${(prices.STARTER.yearly / 12).toFixed(2)}`,
          savings: '17% off'
        },
        features: [
          '1 user account',
          '50 memory entries/month',
          '5GB storage',
          'Basic AI memory prompts',
          'Email support',
          'Standard export (PDF)',
        ],
      },
      {
        id: 'FAMILY',
        name: 'Family',
        description: 'Share memories across generations',
        storage: '50 GB',
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
          savings: '17% off'
        },
        features: [
          'Up to 5 family members',
          'Unlimited memory entries',
          '50GB storage',
          'Advanced AI prompts & suggestions',
          'AI-powered memory insights',
          'Priority email support',
          'Premium export (PDF, video montage)',
          'Family tree integration',
        ],
      },
      {
        id: 'LEGACY',
        name: 'Legacy',
        description: 'The ultimate preservation package',
        storage: '500 GB',
        maxFamilyMembers: -1,
        maxMemoriesPerMonth: -1,
        monthly: isAnnualOnly ? null : { 
          amount: prices.LEGACY.monthly, 
          display: `${prices.symbol}${prices.LEGACY.monthly}` 
        },
        yearly: { 
          amount: prices.LEGACY.yearly, 
          display: `${prices.symbol}${prices.LEGACY.yearly}`, 
          perMonth: `${prices.symbol}${(prices.LEGACY.yearly / 12).toFixed(2)}`,
          savings: '17% off'
        },
        features: [
          'Unlimited family members',
          'Unlimited memory entries',
          '500GB storage',
          'Living Legacy AI Avatar (coming soon)',
          'Voice-to-memory transcription',
          'Collaborative memory editing',
          'Dedicated support',
          'API access',
          'White-glove onboarding',
          'Physical memory book printing (1/year)',
        ],
      },
    ],
    trial: {
      days: TRIAL_DAYS,
      tier: TRIAL_TIER,
      creditCardRequired: true,
      description: 'Full access to Family tier features for 14 days',
    },
    annualSavings: '17% off (2 months free)',
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
  
  const tier = normalizeTier(sub.tier as string);
  
  let trialDaysRemaining = 0;
  if (sub.status === 'TRIALING' && sub.trial_ends_at) {
    const trialEnd = new Date(sub.trial_ends_at as string);
    const now = new Date();
    trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }
  
  return c.json({
    id: sub.id, tier, status: sub.status, billingCycle: sub.billing_cycle,
    currentPeriodEnd: sub.current_period_end, cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    storage: TIER_LIMITS[tier].maxStorageLabel, limits: TIER_LIMITS[tier],
    trialDaysRemaining,
  });
});

// Get limits/usage
billingRoutes.get('/limits', async (c) => {
  const userId = c.get('userId');
  // Prioritize ACTIVE subscriptions over TRIALING, and get the most recent one
  const sub = await c.env.DB.prepare(`
    SELECT tier FROM subscriptions WHERE user_id = ?
    ORDER BY CASE status WHEN 'ACTIVE' THEN 0 WHEN 'TRIALING' THEN 1 ELSE 2 END, created_at DESC
  `).bind(userId).first();
  const tier = normalizeTier(sub?.tier as string || 'STARTER');
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

// Calculate price
billingRoutes.post('/calculate', async (c) => {
  const { tier, billingCycle, couponCode } = await c.req.json();
  
  const country = getCountryFromRequest(c);
  const currency = getCurrencyForCountry(country);
  const prices = PRICING[currency];
  const normalizedTier = normalizeTier(tier);
  // Map FOREVER to LEGACY for backward compatibility
  const pricingTier = (normalizedTier === 'FOREVER' ? 'LEGACY' : normalizedTier) as 'STARTER' | 'FAMILY' | 'LEGACY';
  const tierPrices = prices[pricingTier];
  
  if (!tierPrices) return c.json({ error: 'Invalid tier' }, 400);
  
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
  const { tier, billingCycle, couponCode } = await c.req.json();
  
  const country = getCountryFromRequest(c);
  const currency = getCurrencyForCountry(country);
  const prices = PRICING[currency];
  const normalizedTier = normalizeTier(tier);
  // Map FOREVER to LEGACY for backward compatibility
  const pricingTier = (normalizedTier === 'FOREVER' ? 'LEGACY' : normalizedTier) as 'STARTER' | 'FAMILY' | 'LEGACY';
  const tierPrices = prices[pricingTier];
  
  if (!tierPrices) return c.json({ error: 'Invalid tier' }, 400);
  
  const isYearly = billingCycle === 'yearly';
  let finalPrice = isYearly ? tierPrices.yearly : tierPrices.monthly;
  
  if (couponCode) {
    const coupon = COUPONS[couponCode.toUpperCase()];
    if (coupon && (!coupon.expires || new Date(coupon.expires) > new Date())) {
      finalPrice = Math.max(0, finalPrice - (coupon.type === 'percent' ? finalPrice * (coupon.discount / 100) : coupon.discount));
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
    
    // Use pre-created Stripe Price IDs for supported currencies (USD, ZAR, EUR, GBP)
    const stripePriceId = STRIPE_PRICE_IDS[currency]?.[normalizedTier]?.[billingInterval] || null;
    
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
    
    if (stripePriceId) {
      // Use pre-created Stripe Price ID
      params['line_items[0][price]'] = stripePriceId;
      params['line_items[0][quantity]'] = '1';
    } else {
      // Fallback to dynamic pricing for non-USD currencies
      const priceInCents = Math.round(finalPrice * 100);
      params['line_items[0][price_data][currency]'] = currency.toLowerCase();
      params['line_items[0][price_data][product_data][name]'] = `Heirloom ${normalizedTier} Plan`;
      params['line_items[0][price_data][product_data][description]'] = `${TIER_LIMITS[normalizedTier].maxStorageLabel} storage with all features`;
      params['line_items[0][price_data][unit_amount]'] = priceInCents.toString();
      params['line_items[0][price_data][recurring][interval]'] = isYearly ? 'year' : 'month';
      params['line_items[0][quantity]'] = '1';
    }
    
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
      checkoutUrl: session.url,
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
    return c.json({ portalUrl: portal.url });
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
      type: string;
      data: {
        object: {
          id: string;
          customer_email?: string;
          metadata?: { user_id?: string; tier?: string; billing_cycle?: string; type?: string; voucher_code?: string };
          subscription?: string;
          payment_intent?: string;
        };
      };
    };
    
    const now = new Date().toISOString();
    
    switch (event.type) {
            case 'checkout.session.completed': {
              const session = event.data.object;
              const metadataType = session.metadata?.type;
        
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
              const tier = session.metadata?.tier || 'STARTER';
              const billingCycle = session.metadata?.billing_cycle || 'monthly';
        
              if (userId) {
                const existing = await c.env.DB.prepare('SELECT id FROM subscriptions WHERE user_id = ?').bind(userId).first();
          
                if (existing) {
                  await c.env.DB.prepare(`
                    UPDATE subscriptions 
                    SET tier = ?, status = 'ACTIVE', billing_cycle = ?, stripe_subscription_id = ?, updated_at = ?
                    WHERE user_id = ?
                  `).bind(tier, billingCycle, session.subscription || null, now, userId).run();
                } else {
                  await c.env.DB.prepare(`
                    INSERT INTO subscriptions (id, user_id, tier, status, billing_cycle, stripe_subscription_id, created_at, updated_at)
                    VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?, ?)
                  `).bind(crypto.randomUUID(), userId, tier, billingCycle, session.subscription || null, now, now).run();
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
          const sub = await c.env.DB.prepare('SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?')
            .bind(subscription.id).first();
          userId = sub?.user_id as string | undefined;
        }
        
        if (userId) {
          await c.env.DB.prepare(`
            UPDATE subscriptions SET status = 'CANCELED', tier = 'STARTER', stripe_subscription_id = NULL, updated_at = ? WHERE user_id = ?
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
