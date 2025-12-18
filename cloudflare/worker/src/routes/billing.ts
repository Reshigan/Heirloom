/**
 * Billing Routes - Cloudflare Workers
 * Handles subscription and payment operations
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const billingRoutes = new Hono<{ Bindings: Env }>();

// New Mass-Adoption Pricing Tiers
// Starter: $1/mo - Entry level for individuals
// Family: $2/mo - For families with more features
// Forever: $5/mo - Premium with unlimited everything

const TIER_LIMITS = {
  STARTER: {
    maxStorage: 500 * 1024 * 1024, // 500MB
    maxRecipients: 2,
    maxLetters: 5,
    maxVoiceMinutes: 3,
    maxPhotos: 50,
    maxFamilyMembers: 2,
    maxVideoMinutes: 0,
    features: ['basic_memories', 'basic_letters', 'voice_recordings'],
    posthumousDelivery: false,
    deadManSwitchDays: 0,
    familyTree: false,
    aiTranscription: false,
    legalDocs: false,
    prioritySupport: false,
  },
  FAMILY: {
    maxStorage: 5 * 1024 * 1024 * 1024, // 5GB
    maxRecipients: 10,
    maxLetters: -1, // unlimited
    maxVoiceMinutes: 20,
    maxPhotos: -1, // unlimited
    maxFamilyMembers: 10,
    maxVideoMinutes: 2,
    features: ['basic_memories', 'basic_letters', 'voice_recordings', 'emotion_capture', 'video_messages', 'family_tree'],
    posthumousDelivery: true,
    deadManSwitchDays: 30,
    familyTree: true,
    aiTranscription: false,
    legalDocs: false,
    prioritySupport: false,
  },
  FOREVER: {
    maxStorage: 25 * 1024 * 1024 * 1024, // 25GB
    maxRecipients: -1, // unlimited
    maxLetters: -1,
    maxVoiceMinutes: -1, // unlimited
    maxPhotos: -1,
    maxFamilyMembers: -1,
    maxVideoMinutes: 10,
    features: ['basic_memories', 'basic_letters', 'voice_recordings', 'emotion_capture', 'video_messages', 'family_tree', 'ai_transcription', 'legal_docs', 'priority_support'],
    posthumousDelivery: true,
    deadManSwitchDays: 7,
    familyTree: true,
    aiTranscription: true,
    legalDocs: true,
    prioritySupport: true,
  },
};

// Legacy tier mapping for existing users
const LEGACY_TIER_MAP: Record<string, string> = {
  'FREE': 'STARTER',
  'ESSENTIAL': 'STARTER',
  'LEGACY': 'FOREVER',
};

// Regional pricing in local currencies
const REGIONAL_PRICING: Record<string, Record<string, { monthly: number; yearly: number }>> = {
  USD: {
    STARTER: { monthly: 1, yearly: 10 },
    FAMILY: { monthly: 2, yearly: 20 },
    FOREVER: { monthly: 5, yearly: 50 },
  },
  EUR: {
    STARTER: { monthly: 1, yearly: 10 },
    FAMILY: { monthly: 2, yearly: 20 },
    FOREVER: { monthly: 5, yearly: 50 },
  },
  GBP: {
    STARTER: { monthly: 1, yearly: 10 },
    FAMILY: { monthly: 2, yearly: 20 },
    FOREVER: { monthly: 4, yearly: 40 },
  },
  ZAR: {
    STARTER: { monthly: 19, yearly: 190 },
    FAMILY: { monthly: 39, yearly: 390 },
    FOREVER: { monthly: 95, yearly: 950 },
  },
  NGN: {
    STARTER: { monthly: 500, yearly: 5000 },
    FAMILY: { monthly: 1000, yearly: 10000 },
    FOREVER: { monthly: 2500, yearly: 25000 },
  },
  KES: {
    STARTER: { monthly: 100, yearly: 1000 },
    FAMILY: { monthly: 200, yearly: 2000 },
    FOREVER: { monthly: 500, yearly: 5000 },
  },
  INR: {
    STARTER: { monthly: 49, yearly: 490 },
    FAMILY: { monthly: 99, yearly: 990 },
    FOREVER: { monthly: 249, yearly: 2490 },
  },
  BRL: {
    STARTER: { monthly: 5, yearly: 50 },
    FAMILY: { monthly: 10, yearly: 100 },
    FOREVER: { monthly: 25, yearly: 250 },
  },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  ZAR: 'R',
  NGN: '₦',
  KES: 'KSh',
  INR: '₹',
  BRL: 'R$',
};

// Helper to normalize tier names (handle legacy tiers)
function normalizeTier(tier: string): keyof typeof TIER_LIMITS {
  if (tier in TIER_LIMITS) {
    return tier as keyof typeof TIER_LIMITS;
  }
  return (LEGACY_TIER_MAP[tier] || 'STARTER') as keyof typeof TIER_LIMITS;
}

// Get current subscription status
billingRoutes.get('/subscription', async (c) => {
  const userId = c.get('userId');
  
  const subscription = await c.env.DB.prepare(`
    SELECT * FROM subscriptions WHERE user_id = ?
  `).bind(userId).first();
  
  if (!subscription) {
    // Return starter tier defaults (was FREE)
    return c.json({
      tier: 'STARTER',
      status: 'ACTIVE',
      limits: TIER_LIMITS.STARTER,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  }
  
  const tier = normalizeTier(subscription.tier as string);
  
  return c.json({
    id: subscription.id,
    tier: tier,
    status: subscription.status,
    billingCycle: subscription.billing_cycle,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
    limits: TIER_LIMITS[tier],
    stripeCustomerId: subscription.stripe_customer_id,
    stripeSubscriptionId: subscription.stripe_subscription_id,
  });
});

// Get usage stats
billingRoutes.get('/usage', async (c) => {
  const userId = c.get('userId');
  
  // Get subscription tier
  const subscription = await c.env.DB.prepare(`
    SELECT tier FROM subscriptions WHERE user_id = ?
  `).bind(userId).first();
  
  const tier = normalizeTier(subscription?.tier as string || 'STARTER');
  const limits = TIER_LIMITS[tier];
  
  // Get current usage
  const storageUsage = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(file_size), 0) as total FROM memories WHERE user_id = ?
  `).bind(userId).first();
  
  const voiceStorage = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(file_size), 0) as total FROM voice_recordings WHERE user_id = ?
  `).bind(userId).first();
  
  const recipientCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM family_members WHERE user_id = ?
  `).bind(userId).first();
  
  const letterCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM letters WHERE user_id = ?
  `).bind(userId).first();
  
  const voiceDuration = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(duration), 0) as total FROM voice_recordings WHERE user_id = ?
  `).bind(userId).first();
  
  const totalStorage = ((storageUsage?.total as number) || 0) + ((voiceStorage?.total as number) || 0);
  
  // Calculate storage in MB for frontend compatibility
  const storageUsedMB = Math.round(totalStorage / (1024 * 1024));
  const storageLimitMB = Math.round(limits.maxStorage / (1024 * 1024));
  const storageUsedPercent = limits.maxStorage > 0 ? (totalStorage / limits.maxStorage) * 100 : 0;

  return c.json({
    // New flat fields for Dashboard compatibility
    storageUsedMB,
    storageLimitMB,
    storageUsedPercent,
    // Original nested structure for backwards compatibility
    storage: {
      used: totalStorage,
      limit: limits.maxStorage,
      percentage: storageUsedPercent,
    },
    recipients: {
      used: recipientCount?.count || 0,
      limit: limits.maxRecipients,
      percentage: limits.maxRecipients > 0 ? ((recipientCount?.count as number || 0) / limits.maxRecipients) * 100 : 0,
    },
    letters: {
      used: letterCount?.count || 0,
      limit: limits.maxLetters,
      percentage: limits.maxLetters > 0 ? ((letterCount?.count as number || 0) / limits.maxLetters) * 100 : 0,
    },
    voiceMinutes: {
      used: Math.round(((voiceDuration?.total as number) || 0) / 60),
      limit: limits.maxVoiceMinutes,
      percentage: limits.maxVoiceMinutes > 0 ? (((voiceDuration?.total as number || 0) / 60) / limits.maxVoiceMinutes) * 100 : 0,
    },
  });
});

// Get pricing info with regional support
billingRoutes.get('/pricing', async (c) => {
  const currency = (c.req.query('currency') || 'USD').toUpperCase();
  const prices = REGIONAL_PRICING[currency] || REGIONAL_PRICING.USD;
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  
  return c.json({
    currency,
    symbol,
    tiers: Object.entries(TIER_LIMITS).map(([name, limits]) => ({
      name,
      limits,
      prices: prices[name as keyof typeof prices] || { monthly: 0, yearly: 0 },
      formatted: {
        monthly: `${symbol}${prices[name as keyof typeof prices]?.monthly || 0}`,
        yearly: `${symbol}${prices[name as keyof typeof prices]?.yearly || 0}`,
      },
    })),
    pricing: {
      starter: {
        monthly: { amount: prices.STARTER.monthly, formatted: `${symbol}${prices.STARTER.monthly}` },
        yearly: { amount: prices.STARTER.yearly, formatted: `${symbol}${prices.STARTER.yearly}` },
      },
      family: {
        monthly: { amount: prices.FAMILY.monthly, formatted: `${symbol}${prices.FAMILY.monthly}` },
        yearly: { amount: prices.FAMILY.yearly, formatted: `${symbol}${prices.FAMILY.yearly}` },
      },
      forever: {
        monthly: { amount: prices.FOREVER.monthly, formatted: `${symbol}${prices.FOREVER.monthly}` },
        yearly: { amount: prices.FOREVER.yearly, formatted: `${symbol}${prices.FOREVER.yearly}` },
      },
    },
  });
});

// Get all limits for current user (used by Settings page)
billingRoutes.get('/limits', async (c) => {
  const userId = c.get('userId');
  
  // Get subscription tier
  const subscription = await c.env.DB.prepare(`
    SELECT tier FROM subscriptions WHERE user_id = ?
  `).bind(userId).first();
  
  const tier = normalizeTier(subscription?.tier as string || 'STARTER');
  const limits = TIER_LIMITS[tier];
  
  // Get current usage counts
  const memoriesCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM memories WHERE user_id = ?
  `).bind(userId).first();
  
  const voiceDuration = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(duration), 0) as total FROM voice_recordings WHERE user_id = ?
  `).bind(userId).first();
  
  const letterCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM letters WHERE user_id = ?
  `).bind(userId).first();
  
  const storageUsage = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(file_size), 0) as total FROM memories WHERE user_id = ?
  `).bind(userId).first();
  
  const voiceStorage = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(file_size), 0) as total FROM voice_recordings WHERE user_id = ?
  `).bind(userId).first();
  
  const totalStorageMB = Math.round((((storageUsage?.total as number) || 0) + ((voiceStorage?.total as number) || 0)) / (1024 * 1024));
  const maxStorageMB = limits.maxStorage === -1 ? -1 : Math.round(limits.maxStorage / (1024 * 1024));
  
  const voiceMinutesUsed = Math.round(((voiceDuration?.total as number) || 0) / 60);
  
  return c.json({
    memories: {
      current: (memoriesCount?.count as number) || 0,
      max: limits.maxPhotos,
    },
    voice: {
      current: voiceMinutesUsed,
      max: limits.maxVoiceMinutes,
    },
    letters: {
      current: (letterCount?.count as number) || 0,
      max: limits.maxLetters,
    },
    storage: {
      current: totalStorageMB,
      max: maxStorageMB,
    },
  });
});

// Check limit for a specific resource
billingRoutes.get('/limits/:resource', async (c) => {
  const userId = c.get('userId');
  const resource = c.req.param('resource');
  
  const subscription = await c.env.DB.prepare(`
    SELECT tier FROM subscriptions WHERE user_id = ?
  `).bind(userId).first();
  
  const tier = normalizeTier(subscription?.tier as string || 'STARTER');
  const limits = TIER_LIMITS[tier];
  
  let current = 0;
  let max = 0;
  
  switch (resource) {
    case 'recipients':
    case 'maxRecipients':
      const recipientCount = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM family_members WHERE user_id = ?
      `).bind(userId).first();
      current = (recipientCount?.count as number) || 0;
      max = limits.maxRecipients;
      break;
    case 'letters':
    case 'maxLetters':
      const letterCount = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM letters WHERE user_id = ?
      `).bind(userId).first();
      current = (letterCount?.count as number) || 0;
      max = limits.maxLetters;
      break;
    case 'storage':
    case 'maxStorage':
      const storageUsage = await c.env.DB.prepare(`
        SELECT COALESCE(SUM(file_size), 0) as total FROM memories WHERE user_id = ?
      `).bind(userId).first();
      current = (storageUsage?.total as number) || 0;
      max = limits.maxStorage;
      break;
    default:
      return c.json({ error: 'Unknown resource type' }, 400);
  }
  
  return c.json({
    resource,
    current,
    max,
    allowed: max === -1 || current < max,
    remaining: max === -1 ? -1 : Math.max(0, max - current),
  });
});

// Create checkout session (placeholder - needs Stripe integration)
billingRoutes.post('/checkout', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { tier, billingCycle, couponCode, currency } = body;
  
  // Accept both old and new tier names
  const normalizedTier = normalizeTier(tier);
  if (!['STARTER', 'FAMILY', 'FOREVER'].includes(normalizedTier)) {
    return c.json({ error: 'Invalid tier' }, 400);
  }
  
  // Get regional pricing
  const currencyCode = (currency || 'USD').toUpperCase();
  const prices = REGIONAL_PRICING[currencyCode] || REGIONAL_PRICING.USD;
  const tierPrices = prices[normalizedTier as keyof typeof prices];
  
  // Validate coupon if provided
  let discount = 0;
  if (couponCode) {
    const coupon = await c.env.DB.prepare(`
      SELECT * FROM coupons 
      WHERE code = ? AND is_active = 1 
      AND (valid_until IS NULL OR valid_until > datetime('now'))
      AND (max_uses IS NULL OR current_uses < max_uses)
    `).bind(couponCode).first();
    
    if (coupon) {
      if (coupon.discount_type === 'PERCENTAGE') {
        discount = (coupon.discount_value as number) / 100;
      } else {
        discount = coupon.discount_value as number;
      }
    }
  }
  
  const basePrice = billingCycle === 'yearly' ? tierPrices.yearly : tierPrices.monthly;
  const finalPrice = discount < 1 ? basePrice * (1 - discount) : Math.max(0, basePrice - discount);
  
  // In production, this would create a Stripe checkout session
  // For now, return a placeholder response
  return c.json({
    checkoutUrl: `${c.env.APP_URL}/checkout?tier=${normalizedTier}&cycle=${billingCycle}&price=${finalPrice}`,
    tier: normalizedTier,
    billingCycle,
    currency: currencyCode,
    originalPrice: basePrice,
    discount: discount * (discount < 1 ? basePrice : 1),
    finalPrice,
    message: 'Stripe integration required for production',
  });
});

// Change subscription tier
billingRoutes.post('/change-plan', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { newTier } = body;
  
  // Accept both old and new tier names
  const normalizedTier = normalizeTier(newTier || 'STARTER');
  if (!['STARTER', 'FAMILY', 'FOREVER'].includes(normalizedTier)) {
    return c.json({ error: 'Invalid tier' }, 400);
  }
  
  const now = new Date().toISOString();
  
  // Check if subscription exists
  const existing = await c.env.DB.prepare(`
    SELECT * FROM subscriptions WHERE user_id = ?
  `).bind(userId).first();
  
  if (existing) {
    await c.env.DB.prepare(`
      UPDATE subscriptions SET tier = ?, updated_at = ? WHERE user_id = ?
    `).bind(normalizedTier, now, userId).run();
  } else {
    await c.env.DB.prepare(`
      INSERT INTO subscriptions (id, user_id, tier, status, billing_cycle, created_at, updated_at)
      VALUES (?, ?, ?, 'ACTIVE', 'monthly', ?, ?)
    `).bind(crypto.randomUUID(), userId, normalizedTier, now, now).run();
  }
  
  return c.json({
    success: true,
    tier: normalizedTier,
    limits: TIER_LIMITS[normalizedTier],
    message: `Plan changed to ${normalizedTier}`,
  });
});

// Cancel subscription
billingRoutes.post('/cancel', async (c) => {
  const userId = c.get('userId');
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE subscriptions SET cancel_at_period_end = 1, updated_at = ? WHERE user_id = ?
  `).bind(now, userId).run();
  
  return c.json({
    success: true,
    message: 'Subscription will be cancelled at the end of the current billing period',
  });
});

// Validate coupon
billingRoutes.post('/validate-coupon', async (c) => {
  const body = await c.req.json();
  const { code } = body;
  
  if (!code) {
    return c.json({ error: 'Coupon code is required' }, 400);
  }
  
  const coupon = await c.env.DB.prepare(`
    SELECT * FROM coupons 
    WHERE code = ? AND is_active = 1 
    AND (valid_until IS NULL OR valid_until > datetime('now'))
    AND (max_uses IS NULL OR current_uses < max_uses)
  `).bind(code).first();
  
  if (!coupon) {
    return c.json({ valid: false, error: 'Invalid or expired coupon' }, 400);
  }
  
  return c.json({
    valid: true,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
    applicableTiers: coupon.applicable_tiers ? JSON.parse(coupon.applicable_tiers as string) : [],
  });
});
