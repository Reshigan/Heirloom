/**
 * Referral System Routes for Heirloom
 * 
 * Enables user-to-user referrals with rewards for both parties.
 * Referrer gets 1 free month, referee gets extended trial + discount.
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const referralRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// =============================================================================
// HELPERS
// =============================================================================

function generateReferralCode(firstName: string): string {
  const cleanName = firstName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}${randomSuffix}`;
}

// Commission structure based on tier
const REFERRAL_COMMISSION = {
  STARTER: { yearly: 1000, monthly: 100 }, // $10 yearly, $1 monthly
  FAMILY: { yearly: 2000, monthly: 200 },  // $20 yearly, $2 monthly
  LEGACY: { yearly: 4000, monthly: 400 },  // $40 yearly, $4 monthly
};

// =============================================================================
// USER ROUTES (Authenticated)
// =============================================================================

// Get or create user's referral code
referralRoutes.get('/my-code', async (c) => {
  const userId = c.get('userId');
  
  // Check if user already has a referral code
  let referralCode = await c.env.DB.prepare(`
    SELECT * FROM referral_codes WHERE user_id = ?
  `).bind(userId).first();
  
  if (!referralCode) {
    // Get user's first name to generate code
    const user = await c.env.DB.prepare(`
      SELECT first_name FROM users WHERE id = ?
    `).bind(userId).first();
    
    const firstName = (user?.first_name as string) || 'USER';
    let code = generateReferralCode(firstName);
    
    // Ensure code is unique
    let attempts = 0;
    while (attempts < 10) {
      const existing = await c.env.DB.prepare(`
        SELECT id FROM referral_codes WHERE code = ?
      `).bind(code).first();
      
      if (!existing) break;
      code = generateReferralCode(firstName);
      attempts++;
    }
    
    // Create the referral code
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO referral_codes (id, user_id, code, referrer_reward_type, referrer_reward_value, referee_reward_type, referee_reward_value)
      VALUES (?, ?, ?, 'FREE_MONTH', 1, 'EXTENDED_TRIAL', 30)
    `).bind(id, userId, code).run();
    
    referralCode = await c.env.DB.prepare(`
      SELECT * FROM referral_codes WHERE id = ?
    `).bind(id).first();
  }
  
  // Get referral stats
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_referrals,
      SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) as conversions,
      SUM(CASE WHEN referrer_reward_applied = 1 THEN 1 ELSE 0 END) as rewards_earned
    FROM referrals WHERE referral_code_id = ?
  `).bind(referralCode?.id).first();
  
  return c.json({
    code: referralCode?.code,
    referralLink: `https://heirloom.app/ref/${referralCode?.code}`,
    rewards: {
      referrerRewardType: referralCode?.referrer_reward_type,
      referrerRewardValue: referralCode?.referrer_reward_value,
      refereeRewardType: referralCode?.referee_reward_type,
      refereeRewardValue: referralCode?.referee_reward_value,
    },
    stats: {
      totalReferrals: stats?.total_referrals || 0,
      conversions: stats?.conversions || 0,
      rewardsEarned: stats?.rewards_earned || 0,
    },
    isActive: !!referralCode?.is_active,
  });
});

// Get user's referral history
referralRoutes.get('/my-referrals', async (c) => {
  const userId = c.get('userId');
  
  const referrals = await c.env.DB.prepare(`
    SELECT r.*, rc.code as referral_code
    FROM referrals r
    JOIN referral_codes rc ON r.referral_code_id = rc.id
    WHERE r.referrer_user_id = ?
    ORDER BY r.created_at DESC
    LIMIT 50
  `).bind(userId).all();
  
  return c.json({
    referrals: referrals.results.map(r => ({
      id: r.id,
      refereeEmail: (r.referee_email as string).replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
      status: r.status,
      signedUpAt: r.signed_up_at,
      convertedAt: r.converted_at,
      subscriptionTier: r.subscription_tier,
      referrerRewardApplied: !!r.referrer_reward_applied,
      createdAt: r.created_at,
    })),
  });
});

// Customize referral code (premium feature)
referralRoutes.post('/customize-code', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const newCode = (body.code as string)?.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (!newCode || newCode.length < 4 || newCode.length > 12) {
    return c.json({ error: 'Code must be 4-12 alphanumeric characters' }, 400);
  }
  
  // Check if code is available
  const existing = await c.env.DB.prepare(`
    SELECT id FROM referral_codes WHERE code = ? AND user_id != ?
  `).bind(newCode, userId).first();
  
  if (existing) {
    return c.json({ error: 'This code is already taken' }, 400);
  }
  
  // Update the code
  await c.env.DB.prepare(`
    UPDATE referral_codes SET code = ?, updated_at = datetime('now') WHERE user_id = ?
  `).bind(newCode, userId).run();
  
  return c.json({ 
    success: true, 
    code: newCode,
    referralLink: `https://heirloom.app/ref/${newCode}`,
  });
});

// =============================================================================
// PUBLIC ROUTES (No auth required)
// =============================================================================

// Validate a referral code (for signup page)
referralRoutes.get('/validate/:code', async (c) => {
  const code = c.req.param('code')?.toUpperCase();
  
  const referralCode = await c.env.DB.prepare(`
    SELECT rc.*, u.first_name as referrer_name
    FROM referral_codes rc
    JOIN users u ON rc.user_id = u.id
    WHERE rc.code = ? AND rc.is_active = 1
  `).bind(code).first();
  
  if (!referralCode) {
    return c.json({ valid: false, error: 'Invalid or inactive referral code' }, 404);
  }
  
  return c.json({
    valid: true,
    code: referralCode.code,
    referrerName: referralCode.referrer_name,
    benefits: {
      extendedTrialDays: referralCode.referee_reward_value,
      discountPercent: 20, // 20% off first year
    },
  });
});

// Track referral click (called when someone visits referral link)
referralRoutes.post('/track-click', async (c) => {
  const body = await c.req.json();
  const code = (body.code as string)?.toUpperCase();
  const landingPage = body.landingPage as string;
  const utmSource = body.utmSource as string;
  const utmMedium = body.utmMedium as string;
  const utmCampaign = body.utmCampaign as string;
  
  const referralCode = await c.env.DB.prepare(`
    SELECT id, user_id FROM referral_codes WHERE code = ? AND is_active = 1
  `).bind(code).first();
  
  if (!referralCode) {
    return c.json({ error: 'Invalid referral code' }, 404);
  }
  
  // Update click count
  await c.env.DB.prepare(`
    UPDATE referral_codes SET total_referrals = total_referrals + 1, updated_at = datetime('now') WHERE id = ?
  `).bind(referralCode.id).run();
  
  return c.json({ success: true });
});

// Record referral signup (called during user registration)
referralRoutes.post('/record-signup', async (c) => {
  const body = await c.req.json();
  const code = (body.code as string)?.toUpperCase();
  const refereeEmail = body.email as string;
  const refereeUserId = body.userId as string;
  
  if (!code || !refereeEmail) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  const referralCode = await c.env.DB.prepare(`
    SELECT id, user_id FROM referral_codes WHERE code = ? AND is_active = 1
  `).bind(code).first();
  
  if (!referralCode) {
    return c.json({ error: 'Invalid referral code' }, 404);
  }
  
  // Don't allow self-referral
  if (referralCode.user_id === refereeUserId) {
    return c.json({ error: 'Cannot use your own referral code' }, 400);
  }
  
  // Check if this email was already referred
  const existingReferral = await c.env.DB.prepare(`
    SELECT id FROM referrals WHERE referee_email = ?
  `).bind(refereeEmail).first();
  
  if (existingReferral) {
    return c.json({ error: 'This email has already been referred' }, 400);
  }
  
  // Create the referral record
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO referrals (id, referral_code_id, referrer_user_id, referee_user_id, referee_email, status, signed_up_at)
    VALUES (?, ?, ?, ?, ?, 'SIGNED_UP', datetime('now'))
  `).bind(id, referralCode.id, referralCode.user_id, refereeUserId, refereeEmail).run();
  
  // Apply referee reward (extended trial)
  // This should be handled by the subscription creation logic
  
  return c.json({ 
    success: true, 
    referralId: id,
    benefits: {
      extendedTrialDays: 30,
      discountPercent: 20,
    },
  });
});

// Record referral conversion (called when referee subscribes)
referralRoutes.post('/record-conversion', async (c) => {
  const body = await c.req.json();
  const refereeUserId = body.userId as string;
  const subscriptionTier = body.tier as string;
  const subscriptionValue = body.value as number; // in cents
  const billingCycle = body.billingCycle as string;
  
  // Find the referral
  const referral = await c.env.DB.prepare(`
    SELECT r.*, rc.user_id as referrer_user_id
    FROM referrals r
    JOIN referral_codes rc ON r.referral_code_id = rc.id
    WHERE r.referee_user_id = ? AND r.status IN ('SIGNED_UP', 'TRIALING')
  `).bind(refereeUserId).first();
  
  if (!referral) {
    return c.json({ success: false, message: 'No pending referral found' });
  }
  
  // Update referral status
  await c.env.DB.prepare(`
    UPDATE referrals 
    SET status = 'CONVERTED', converted_at = datetime('now'), 
        subscription_tier = ?, subscription_value = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(subscriptionTier, subscriptionValue, referral.id).run();
  
  // Update referral code stats
  await c.env.DB.prepare(`
    UPDATE referral_codes 
    SET successful_conversions = successful_conversions + 1, updated_at = datetime('now')
    WHERE id = ?
  `).bind(referral.referral_code_id).run();
  
  // Apply referrer reward (1 free month)
  // Add 1 month to referrer's subscription
  const referrerSub = await c.env.DB.prepare(`
    SELECT id, current_period_end FROM subscriptions WHERE user_id = ?
  `).bind(referral.referrer_user_id).first();
  
  if (referrerSub && referrerSub.current_period_end) {
    const currentEnd = new Date(referrerSub.current_period_end as string);
    currentEnd.setMonth(currentEnd.getMonth() + 1);
    
    await c.env.DB.prepare(`
      UPDATE subscriptions SET current_period_end = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(currentEnd.toISOString(), referrerSub.id).run();
    
    // Mark reward as applied
    await c.env.DB.prepare(`
      UPDATE referrals 
      SET referrer_reward_applied = 1, referrer_reward_applied_at = datetime('now')
      WHERE id = ?
    `).bind(referral.id).run();
    
    await c.env.DB.prepare(`
      UPDATE referral_codes 
      SET total_rewards_earned = total_rewards_earned + 1
      WHERE id = ?
    `).bind(referral.referral_code_id).run();
  }
  
  return c.json({ 
    success: true,
    referrerRewarded: !!referrerSub,
  });
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Admin middleware
const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Admin authentication required' }, 401);
  }
  
  const token = authHeader.substring(7);
  const adminSession = await c.env.KV.get(`admin:session:${token}`);
  if (!adminSession) {
    return c.json({ error: 'Invalid or expired admin session' }, 401);
  }
  
  const session = JSON.parse(adminSession);
  c.set('adminId', session.adminId);
  c.set('adminRole', session.role);
  
  await next();
};

// Get all referral codes (admin)
referralRoutes.get('/admin/codes', adminAuth, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;
  
  const codes = await c.env.DB.prepare(`
    SELECT rc.*, u.email as user_email, u.first_name, u.last_name
    FROM referral_codes rc
    JOIN users u ON rc.user_id = u.id
    ORDER BY rc.successful_conversions DESC, rc.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();
  
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM referral_codes
  `).first();
  
  return c.json({
    codes: codes.results,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total as number || 0) / limit),
    },
  });
});

// Get referral stats (admin)
referralRoutes.get('/admin/stats', adminAuth, async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(DISTINCT rc.id) as total_codes,
      SUM(rc.total_referrals) as total_clicks,
      SUM(rc.successful_conversions) as total_conversions,
      SUM(rc.total_rewards_earned) as total_rewards_given
    FROM referral_codes rc
  `).first();
  
  const recentReferrals = await c.env.DB.prepare(`
    SELECT r.*, rc.code, u.email as referrer_email
    FROM referrals r
    JOIN referral_codes rc ON r.referral_code_id = rc.id
    JOIN users u ON r.referrer_user_id = u.id
    ORDER BY r.created_at DESC
    LIMIT 20
  `).all();
  
  return c.json({
    stats: {
      totalCodes: stats?.total_codes || 0,
      totalClicks: stats?.total_clicks || 0,
      totalConversions: stats?.total_conversions || 0,
      totalRewardsGiven: stats?.total_rewards_given || 0,
      conversionRate: stats?.total_clicks ? 
        ((stats?.total_conversions as number || 0) / (stats?.total_clicks as number) * 100).toFixed(2) + '%' : '0%',
    },
    recentReferrals: recentReferrals.results,
  });
});
