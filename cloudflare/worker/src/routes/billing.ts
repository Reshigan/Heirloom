/**
 * Billing Routes - Cloudflare Workers
 * Handles subscription and payment operations
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const billingRoutes = new Hono<{ Bindings: Env }>();

// Tier limits configuration
const TIER_LIMITS = {
  FREE: {
    maxStorage: 100 * 1024 * 1024, // 100MB
    maxRecipients: 2,
    maxLetters: 5,
    maxVoiceMinutes: 10,
    features: ['basic_memories', 'basic_letters'],
  },
  ESSENTIAL: {
    maxStorage: 1024 * 1024 * 1024, // 1GB
    maxRecipients: 5,
    maxLetters: 25,
    maxVoiceMinutes: 60,
    features: ['basic_memories', 'basic_letters', 'voice_recordings', 'emotion_capture'],
  },
  FAMILY: {
    maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
    maxRecipients: -1, // unlimited
    maxLetters: -1,
    maxVoiceMinutes: -1,
    features: ['basic_memories', 'basic_letters', 'voice_recordings', 'emotion_capture', 'ai_assistant', 'family_sharing'],
  },
  LEGACY: {
    maxStorage: 100 * 1024 * 1024 * 1024, // 100GB
    maxRecipients: -1,
    maxLetters: -1,
    maxVoiceMinutes: -1,
    features: ['basic_memories', 'basic_letters', 'voice_recordings', 'emotion_capture', 'ai_assistant', 'family_sharing', 'priority_support', 'advanced_encryption'],
  },
};

const TIER_PRICES = {
  FREE: { monthly: 0, yearly: 0 },
  ESSENTIAL: { monthly: 4.99, yearly: 49.99 },
  FAMILY: { monthly: 9.99, yearly: 99.99 },
  LEGACY: { monthly: 19.99, yearly: 199.99 },
};

// Get current subscription status
billingRoutes.get('/subscription', async (c) => {
  const userId = c.get('userId');
  
  const subscription = await c.env.DB.prepare(`
    SELECT * FROM subscriptions WHERE user_id = ?
  `).bind(userId).first();
  
  if (!subscription) {
    // Return free tier defaults
    return c.json({
      tier: 'FREE',
      status: 'ACTIVE',
      limits: TIER_LIMITS.FREE,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  }
  
  const tier = subscription.tier as keyof typeof TIER_LIMITS;
  
  return c.json({
    id: subscription.id,
    tier: subscription.tier,
    status: subscription.status,
    billingCycle: subscription.billing_cycle,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
    limits: TIER_LIMITS[tier] || TIER_LIMITS.FREE,
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
  
  const tier = (subscription?.tier || 'FREE') as keyof typeof TIER_LIMITS;
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.FREE;
  
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
  
  return c.json({
    storage: {
      used: totalStorage,
      limit: limits.maxStorage,
      percentage: limits.maxStorage > 0 ? (totalStorage / limits.maxStorage) * 100 : 0,
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

// Get pricing info
billingRoutes.get('/pricing', async (c) => {
  return c.json({
    tiers: Object.entries(TIER_LIMITS).map(([name, limits]) => ({
      name,
      limits,
      prices: TIER_PRICES[name as keyof typeof TIER_PRICES],
    })),
  });
});

// Check limit for a specific resource
billingRoutes.get('/limits/:resource', async (c) => {
  const userId = c.get('userId');
  const resource = c.req.param('resource');
  
  const subscription = await c.env.DB.prepare(`
    SELECT tier FROM subscriptions WHERE user_id = ?
  `).bind(userId).first();
  
  const tier = (subscription?.tier || 'FREE') as keyof typeof TIER_LIMITS;
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.FREE;
  
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
  const { tier, billingCycle, couponCode } = body;
  
  if (!tier || !['ESSENTIAL', 'FAMILY', 'LEGACY'].includes(tier)) {
    return c.json({ error: 'Invalid tier' }, 400);
  }
  
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
  
  const prices = TIER_PRICES[tier as keyof typeof TIER_PRICES];
  const basePrice = billingCycle === 'yearly' ? prices.yearly : prices.monthly;
  const finalPrice = discount < 1 ? basePrice * (1 - discount) : Math.max(0, basePrice - discount);
  
  // In production, this would create a Stripe checkout session
  // For now, return a placeholder response
  return c.json({
    checkoutUrl: `${c.env.APP_URL}/checkout?tier=${tier}&cycle=${billingCycle}&price=${finalPrice}`,
    tier,
    billingCycle,
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
  
  if (!newTier || !['FREE', 'ESSENTIAL', 'FAMILY', 'LEGACY'].includes(newTier)) {
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
    `).bind(newTier, now, userId).run();
  } else {
    await c.env.DB.prepare(`
      INSERT INTO subscriptions (id, user_id, tier, status, billing_cycle, created_at, updated_at)
      VALUES (?, ?, ?, 'ACTIVE', 'monthly', ?, ?)
    `).bind(crypto.randomUUID(), userId, newTier, now, now).run();
  }
  
  return c.json({
    success: true,
    tier: newTier,
    limits: TIER_LIMITS[newTier as keyof typeof TIER_LIMITS],
    message: `Plan changed to ${newTier}`,
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
