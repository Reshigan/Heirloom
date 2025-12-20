/**
 * Heirloom Billing Routes - FINAL PRODUCTION VERSION
 * 
 * Simple 3-tier pricing based on storage:
 * - Starter: $1/mo - 500MB
 * - Family: $5/mo - 5GB  
 * - Forever: $15/mo - 50GB
 * 
 * All tiers get ALL features. Only storage differs.
 * Auto-detects country from Cloudflare for regional pricing.
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const billingRoutes = new Hono<{ Bindings: Env }>();

// =============================================================================
// COUNTRY → CURRENCY MAPPING
// =============================================================================
const COUNTRY_CURRENCY: Record<string, string> = {
  // Africa
  ZA: 'ZAR', NG: 'NGN', KE: 'KES', GH: 'GHS', TZ: 'TZS', UG: 'UGX', 
  RW: 'RWF', ZW: 'USD', BW: 'BWP', NA: 'NAD', MZ: 'MZN', ZM: 'ZMW',
  
  // Europe
  GB: 'GBP',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', 
  IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR', SK: 'EUR', SI: 'EUR', LT: 'EUR',
  LV: 'EUR', EE: 'EUR', CY: 'EUR', MT: 'EUR', LU: 'EUR',
  
  // Asia
  IN: 'INR', PK: 'PKR', BD: 'BDT', PH: 'PHP', ID: 'IDR', MY: 'MYR', 
  SG: 'SGD', TH: 'THB', VN: 'VND', JP: 'JPY', KR: 'KRW', CN: 'CNY', 
  HK: 'HKD', TW: 'TWD', AE: 'AED', SA: 'SAR',
  
  // Americas
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL', AR: 'ARS', CO: 'COP', CL: 'CLP', PE: 'PEN',
  
  // Oceania
  AU: 'AUD', NZ: 'NZD',
};

// =============================================================================
// PRICING BY CURRENCY
// =============================================================================
const PRICING: Record<string, {
  symbol: string;
  code: string;
  STARTER: { monthly: number; yearly: number };
  FAMILY: { monthly: number; yearly: number };
  FOREVER: { monthly: number; yearly: number };
}> = {
  USD: {
    symbol: '$', code: 'USD',
    STARTER: { monthly: 1, yearly: 10 },
    FAMILY: { monthly: 5, yearly: 50 },
    FOREVER: { monthly: 15, yearly: 150 },
  },
  ZAR: {
    symbol: 'R', code: 'ZAR',
    STARTER: { monthly: 18, yearly: 180 },
    FAMILY: { monthly: 90, yearly: 900 },
    FOREVER: { monthly: 270, yearly: 2700 },
  },
  NGN: {
    symbol: '₦', code: 'NGN',
    STARTER: { monthly: 500, yearly: 5000 },
    FAMILY: { monthly: 2500, yearly: 25000 },
    FOREVER: { monthly: 7500, yearly: 75000 },
  },
  KES: {
    symbol: 'KSh', code: 'KES',
    STARTER: { monthly: 100, yearly: 1000 },
    FAMILY: { monthly: 500, yearly: 5000 },
    FOREVER: { monthly: 1500, yearly: 15000 },
  },
  GHS: {
    symbol: 'GH₵', code: 'GHS',
    STARTER: { monthly: 12, yearly: 120 },
    FAMILY: { monthly: 60, yearly: 600 },
    FOREVER: { monthly: 180, yearly: 1800 },
  },
  INR: {
    symbol: '₹', code: 'INR',
    STARTER: { monthly: 50, yearly: 500 },
    FAMILY: { monthly: 250, yearly: 2500 },
    FOREVER: { monthly: 750, yearly: 7500 },
  },
  GBP: {
    symbol: '£', code: 'GBP',
    STARTER: { monthly: 0.79, yearly: 7.90 },
    FAMILY: { monthly: 3.99, yearly: 39.90 },
    FOREVER: { monthly: 11.99, yearly: 119.90 },
  },
  EUR: {
    symbol: '€', code: 'EUR',
    STARTER: { monthly: 0.99, yearly: 9.90 },
    FAMILY: { monthly: 4.99, yearly: 49.90 },
    FOREVER: { monthly: 14.99, yearly: 149.90 },
  },
  CAD: {
    symbol: 'C$', code: 'CAD',
    STARTER: { monthly: 1.39, yearly: 13.90 },
    FAMILY: { monthly: 6.99, yearly: 69.90 },
    FOREVER: { monthly: 20.99, yearly: 209.90 },
  },
  AUD: {
    symbol: 'A$', code: 'AUD',
    STARTER: { monthly: 1.49, yearly: 14.90 },
    FAMILY: { monthly: 7.49, yearly: 74.90 },
    FOREVER: { monthly: 22.49, yearly: 224.90 },
  },
  BRL: {
    symbol: 'R$', code: 'BRL',
    STARTER: { monthly: 5, yearly: 50 },
    FAMILY: { monthly: 25, yearly: 250 },
    FOREVER: { monthly: 75, yearly: 750 },
  },
  MXN: {
    symbol: 'MX$', code: 'MXN',
    STARTER: { monthly: 18, yearly: 180 },
    FAMILY: { monthly: 90, yearly: 900 },
    FOREVER: { monthly: 270, yearly: 2700 },
  },
  PHP: {
    symbol: '₱', code: 'PHP',
    STARTER: { monthly: 50, yearly: 500 },
    FAMILY: { monthly: 250, yearly: 2500 },
    FOREVER: { monthly: 750, yearly: 7500 },
  },
  PKR: {
    symbol: 'Rs', code: 'PKR',
    STARTER: { monthly: 250, yearly: 2500 },
    FAMILY: { monthly: 1250, yearly: 12500 },
    FOREVER: { monthly: 3750, yearly: 37500 },
  },
};

const DEFAULT_CURRENCY = 'USD';

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
// TIER LIMITS - SIMPLE STORAGE-BASED (ALL FEATURES INCLUDED)
// =============================================================================
const TIER_LIMITS = {
  STARTER: {
    maxStorage: 500 * 1024 * 1024, // 500MB
    maxStorageLabel: '500 MB',
    maxRecipients: -1,
    maxLetters: -1,
    maxVoiceMinutes: -1,
    maxPhotos: -1,
    maxFamilyMembers: -1,
    maxVideoMinutes: 5,
    posthumousDelivery: true,
    deadManSwitchDays: 30,
    familyTree: true,
    aiTranscription: true,
    aiLetterHelp: true,
    yearWrapped: true,
    prioritySupport: false,
  },
  FAMILY: {
    maxStorage: 5 * 1024 * 1024 * 1024, // 5GB
    maxStorageLabel: '5 GB',
    maxRecipients: -1,
    maxLetters: -1,
    maxVoiceMinutes: -1,
    maxPhotos: -1,
    maxFamilyMembers: -1,
    maxVideoMinutes: 15,
    posthumousDelivery: true,
    deadManSwitchDays: 14,
    familyTree: true,
    aiTranscription: true,
    aiLetterHelp: true,
    yearWrapped: true,
    prioritySupport: true,
  },
  FOREVER: {
    maxStorage: 50 * 1024 * 1024 * 1024, // 50GB
    maxStorageLabel: '50 GB',
    maxRecipients: -1,
    maxLetters: -1,
    maxVoiceMinutes: -1,
    maxPhotos: -1,
    maxFamilyMembers: -1,
    maxVideoMinutes: 60,
    posthumousDelivery: true,
    deadManSwitchDays: 7,
    familyTree: true,
    aiTranscription: true,
    aiLetterHelp: true,
    yearWrapped: true,
    prioritySupport: true,
    centuryGuarantee: true,
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
  'FREE': 'STARTER', 'ESSENTIAL': 'STARTER', 'PREMIUM': 'FAMILY', 'LEGACY': 'FOREVER', 'PLUS': 'FAMILY'
};

// =============================================================================
// STRIPE PRICE IDS (Multi-currency - created via Stripe API)
// =============================================================================
const STRIPE_PRICE_IDS: Record<string, Record<string, Record<string, string>>> = {
  USD: {
    STARTER: { monthly: 'price_1SgNcE0wv1f1SxUqmVW3Glsh', yearly: 'price_1SgNcE0wv1f1SxUqD1OZ5JQ0' },
    FAMILY: { monthly: 'price_1SgNcE0wv1f1SxUqCYYS5l6f', yearly: 'price_1SgNcF0wv1f1SxUqS0csfMww' },
    FOREVER: { monthly: 'price_1SgNcF0wv1f1SxUqvRdvElr4', yearly: 'price_1SgNcF0wv1f1SxUqMTL4YDLk' },
  },
  ZAR: {
    STARTER: { monthly: 'price_1SgNuW0wv1f1SxUqQLy4gGPT', yearly: 'price_1SgNuW0wv1f1SxUqeMBSLH1N' },
    FAMILY: { monthly: 'price_1SgNuX0wv1f1SxUqLT2Jxuq5', yearly: 'price_1SgNuX0wv1f1SxUqbYfuZVgP' },
    FOREVER: { monthly: 'price_1SgNuX0wv1f1SxUqqoWkbkcS', yearly: 'price_1SgNuX0wv1f1SxUqYBsJihtg' },
  },
  EUR: {
    STARTER: { monthly: 'price_1SgNup0wv1f1SxUqhABE43BL', yearly: 'price_1SgNup0wv1f1SxUq1wX5KQhf' },
    FAMILY: { monthly: 'price_1SgNup0wv1f1SxUqFpyH6eO0', yearly: 'price_1SgNuq0wv1f1SxUqPyRfJ0Qm' },
    FOREVER: { monthly: 'price_1SgNuq0wv1f1SxUqADWRwe3G', yearly: 'price_1SgNuq0wv1f1SxUquIKDuqvO' },
  },
  GBP: {
    STARTER: { monthly: 'price_1SgNuq0wv1f1SxUqgr8MaqoJ', yearly: 'price_1SgNur0wv1f1SxUqADOdnFpX' },
    FAMILY: { monthly: 'price_1SgNur0wv1f1SxUqApwsDTvU', yearly: 'price_1SgNur0wv1f1SxUqo33Al5AR' },
    FOREVER: { monthly: 'price_1SgNur0wv1f1SxUqL1EXhKNn', yearly: 'price_1SgNus0wv1f1SxUqtytNLBvc' },
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

  return c.json({
    country,
    currency,
    symbol: prices.symbol,
    tiers: [
      {
        id: 'STARTER',
        name: 'Starter',
        storage: '500 MB',
        monthly: { amount: prices.STARTER.monthly, display: `${prices.symbol}${prices.STARTER.monthly}` },
        yearly: { amount: prices.STARTER.yearly, display: `${prices.symbol}${prices.STARTER.yearly}`, perMonth: `${prices.symbol}${(prices.STARTER.yearly / 12).toFixed(2)}` },
      },
      {
        id: 'FAMILY',
        name: 'Family',
        storage: '5 GB',
        popular: true,
        monthly: { amount: prices.FAMILY.monthly, display: `${prices.symbol}${prices.FAMILY.monthly}` },
        yearly: { amount: prices.FAMILY.yearly, display: `${prices.symbol}${prices.FAMILY.yearly}`, perMonth: `${prices.symbol}${(prices.FAMILY.yearly / 12).toFixed(2)}` },
      },
      {
        id: 'FOREVER',
        name: 'Forever',
        storage: '50 GB',
        monthly: { amount: prices.FOREVER.monthly, display: `${prices.symbol}${prices.FOREVER.monthly}` },
        yearly: { amount: prices.FOREVER.yearly, display: `${prices.symbol}${prices.FOREVER.yearly}`, perMonth: `${prices.symbol}${(prices.FOREVER.yearly / 12).toFixed(2)}` },
      },
    ],
    allFeatures: [
      'Unlimited memories', 'Unlimited letters', 'Unlimited voice recordings',
      'Posthumous delivery', 'Dead man\'s switch', 'AI writing help', 'Year Wrapped', 'Family tree'
    ],
    annualSavings: '2 months free',
  });
});

// Get subscription
billingRoutes.get('/subscription', async (c) => {
  const userId = c.get('userId');
  const sub = await c.env.DB.prepare('SELECT * FROM subscriptions WHERE user_id = ?').bind(userId).first();
  
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
  const sub = await c.env.DB.prepare('SELECT tier FROM subscriptions WHERE user_id = ?').bind(userId).first();
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
  const tierPrices = prices[normalizedTier as keyof typeof prices.STARTER];
  
  if (!tierPrices || typeof tierPrices === 'string') return c.json({ error: 'Invalid tier' }, 400);
  
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
  const tierPrices = prices[normalizedTier as keyof typeof prices.STARTER];
  
  if (!tierPrices || typeof tierPrices === 'string') return c.json({ error: 'Invalid tier' }, 400);
  
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
    const params: Record<string, string> = {
      'mode': 'subscription',
      'customer_email': user.email as string,
      'success_url': `${c.env.APP_URL}/settings?tab=subscription&success=true`,
      'cancel_url': `${c.env.APP_URL}/settings?tab=subscription&canceled=true`,
      'metadata[user_id]': userId,
      'metadata[tier]': normalizedTier,
      'metadata[billing_cycle]': billingInterval,
      // Pass metadata to subscription so webhooks can identify user
      'subscription_data[metadata][user_id]': userId,
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
          metadata?: { user_id?: string; tier?: string; billing_cycle?: string };
          subscription?: string;
        };
      };
    };
    
    const now = new Date().toISOString();
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
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
