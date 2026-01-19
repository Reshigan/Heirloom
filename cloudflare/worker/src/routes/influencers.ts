/**
 * Influencer System Routes for Heirloom
 * 
 * Manages influencer partnerships, tracking, commissions, and payouts.
 * Modeled after Hume Health's successful affiliate program.
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const influencerRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// =============================================================================
// CONSTANTS
// =============================================================================

// Commission structure by tier (in cents)
const COMMISSION_RATES = {
  STARTER: { yearly: 1000, monthly: 200 },  // $10 yearly, $2 monthly
  FAMILY: { yearly: 2000, monthly: 400 },   // $20 yearly, $4 monthly
  LEGACY: { yearly: 4000, monthly: 800 },   // $40 yearly, $8 monthly
};

// Discount percentages by influencer tier
const DISCOUNT_BY_TIER = {
  NANO: 10,    // <1K followers
  MICRO: 15,   // 1K-10K followers
  MID: 20,     // 10K-100K followers
  MACRO: 25,   // 100K-1M followers
  MEGA: 30,    // 1M+ followers
};

// =============================================================================
// HELPERS
// =============================================================================

function generateInfluencerCode(name: string): string {
  const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
  const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${cleanName}${randomSuffix}`;
}

function generateLandingPageSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20);
}

function calculateCommission(tier: string, billingCycle: string): number {
  const rates = COMMISSION_RATES[tier as keyof typeof COMMISSION_RATES] || COMMISSION_RATES.STARTER;
  return billingCycle === 'yearly' ? rates.yearly : rates.monthly;
}

// =============================================================================
// PUBLIC ROUTES (No auth required)
// =============================================================================

// Apply to become an influencer
influencerRoutes.post('/apply', async (c) => {
  const body = await c.req.json();
  
  const {
    name, email, instagramHandle, tiktokHandle, youtubeChannel,
    twitterHandle, websiteUrl, followerCount, niche
  } = body;
  
  if (!name || !email) {
    return c.json({ error: 'Name and email are required' }, 400);
  }
  
  // Check if already applied
  const existing = await c.env.DB.prepare(`
    SELECT id, status FROM influencers WHERE email = ?
  `).bind(email).first();
  
  if (existing) {
    return c.json({ 
      error: 'An application with this email already exists',
      status: existing.status,
    }, 400);
  }
  
  // Determine tier based on follower count
  let tier = 'MICRO';
  if (followerCount < 1000) tier = 'NANO';
  else if (followerCount < 10000) tier = 'MICRO';
  else if (followerCount < 100000) tier = 'MID';
  else if (followerCount < 1000000) tier = 'MACRO';
  else tier = 'MEGA';
  
  // Generate unique discount code and landing page slug
  let discountCode = generateInfluencerCode(name);
  let landingPageSlug = generateLandingPageSlug(name);
  
  // Ensure uniqueness
  let attempts = 0;
  while (attempts < 10) {
    const existingCode = await c.env.DB.prepare(`
      SELECT id FROM influencers WHERE discount_code = ? OR landing_page_slug = ?
    `).bind(discountCode, landingPageSlug).first();
    
    if (!existingCode) break;
    discountCode = generateInfluencerCode(name);
    landingPageSlug = generateLandingPageSlug(name) + Math.random().toString(36).substring(2, 4);
    attempts++;
  }
  
  const id = crypto.randomUUID();
  const discountPercent = DISCOUNT_BY_TIER[tier as keyof typeof DISCOUNT_BY_TIER] || 15;
  
  await c.env.DB.prepare(`
    INSERT INTO influencers (
      id, name, email, instagram_handle, tiktok_handle, youtube_channel,
      twitter_handle, website_url, follower_count, tier, niche,
      discount_code, discount_percent, landing_page_slug, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
  `).bind(
    id, name, email, instagramHandle || null, tiktokHandle || null,
    youtubeChannel || null, twitterHandle || null, websiteUrl || null,
    followerCount || 0, tier, niche || null, discountCode, discountPercent, landingPageSlug
  ).run();
  
  return c.json({
    success: true,
    message: 'Application submitted successfully. We will review and get back to you within 48 hours.',
    applicationId: id,
  });
});

// Validate influencer discount code (for checkout)
influencerRoutes.get('/validate-code/:code', async (c) => {
  const code = c.req.param('code')?.toUpperCase();
  
  const influencer = await c.env.DB.prepare(`
    SELECT id, name, discount_code, discount_percent, status
    FROM influencers WHERE discount_code = ? AND status = 'ACTIVE'
  `).bind(code).first();
  
  if (!influencer) {
    return c.json({ valid: false, error: 'Invalid or inactive discount code' }, 404);
  }
  
  return c.json({
    valid: true,
    code: influencer.discount_code,
    discountPercent: influencer.discount_percent,
    influencerName: influencer.name,
  });
});

// Get influencer landing page data
influencerRoutes.get('/landing/:slug', async (c) => {
  const slug = c.req.param('slug')?.toLowerCase();
  
  const influencer = await c.env.DB.prepare(`
    SELECT id, name, discount_code, discount_percent, niche, status
    FROM influencers WHERE landing_page_slug = ? AND status = 'ACTIVE'
  `).bind(slug).first();
  
  if (!influencer) {
    return c.json({ error: 'Influencer not found' }, 404);
  }
  
  // Track landing page visit
  await c.env.DB.prepare(`
    UPDATE influencers SET total_clicks = total_clicks + 1, last_activity_at = datetime('now') WHERE id = ?
  `).bind(influencer.id).run();
  
  return c.json({
    name: influencer.name,
    discountCode: influencer.discount_code,
    discountPercent: influencer.discount_percent,
    niche: influencer.niche,
  });
});

// Track conversion (called during checkout with influencer code)
influencerRoutes.post('/track-conversion', async (c) => {
  const body = await c.req.json();
  const {
    discountCode, userId, userEmail, subscriptionTier,
    billingCycle, subscriptionValue, attributionMethod
  } = body;
  
  if (!discountCode || !userEmail || !subscriptionTier) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  const influencer = await c.env.DB.prepare(`
    SELECT id, commission_type, commission_rate FROM influencers 
    WHERE discount_code = ? AND status = 'ACTIVE'
  `).bind(discountCode.toUpperCase()).first();
  
  if (!influencer) {
    return c.json({ error: 'Invalid influencer code' }, 404);
  }
  
  // Calculate commission
  let commissionAmount = calculateCommission(subscriptionTier, billingCycle);
  if (influencer.commission_type === 'PERCENTAGE') {
    commissionAmount = Math.round(subscriptionValue * (influencer.commission_rate as number) / 100);
  }
  
  // Record the conversion
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO influencer_conversions (
      id, influencer_id, user_id, user_email, subscription_tier,
      subscription_billing_cycle, subscription_value, commission_amount,
      attribution_method, discount_code_used
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, influencer.id, userId || null, userEmail, subscriptionTier,
    billingCycle, subscriptionValue, commissionAmount,
    attributionMethod || 'DISCOUNT_CODE', discountCode.toUpperCase()
  ).run();
  
  // Update influencer stats
  await c.env.DB.prepare(`
    UPDATE influencers SET 
      total_conversions = total_conversions + 1,
      total_revenue_generated = total_revenue_generated + ?,
      total_commission_earned = total_commission_earned + ?,
      last_activity_at = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(subscriptionValue, commissionAmount, influencer.id).run();
  
  return c.json({
    success: true,
    conversionId: id,
    commissionAmount,
  });
});

// =============================================================================
// INFLUENCER DASHBOARD ROUTES (Authenticated influencer)
// =============================================================================

// Influencer auth middleware
const influencerAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  // Check for influencer session in KV
  const sessionData = await c.env.KV.get(`influencer:session:${token}`);
  if (!sessionData) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }
  
  const session = JSON.parse(sessionData);
  c.set('influencerId', session.influencerId);
  
  await next();
};

// Influencer login
influencerRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, code } = body;
  
  // Simple auth: email + discount code
  const influencer = await c.env.DB.prepare(`
    SELECT id, name, email, status FROM influencers 
    WHERE email = ? AND discount_code = ? AND status IN ('ACTIVE', 'APPROVED')
  `).bind(email, code?.toUpperCase()).first();
  
  if (!influencer) {
    return c.json({ error: 'Invalid credentials or account not active' }, 401);
  }
  
  // Create session
  const token = crypto.randomUUID();
  await c.env.KV.put(
    `influencer:session:${token}`,
    JSON.stringify({ influencerId: influencer.id, email: influencer.email }),
    { expirationTtl: 60 * 60 * 24 * 7 } // 7 days
  );
  
  return c.json({
    success: true,
    token,
    influencer: {
      id: influencer.id,
      name: influencer.name,
      email: influencer.email,
    },
  });
});

// Get influencer dashboard data
influencerRoutes.get('/dashboard', influencerAuth, async (c) => {
  const influencerId = c.get('influencerId');
  
  const influencer = await c.env.DB.prepare(`
    SELECT * FROM influencers WHERE id = ?
  `).bind(influencerId).first();
  
  if (!influencer) {
    return c.json({ error: 'Influencer not found' }, 404);
  }
  
  // Get recent conversions
  const recentConversions = await c.env.DB.prepare(`
    SELECT * FROM influencer_conversions 
    WHERE influencer_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).bind(influencerId).all();
  
  // Get monthly stats
  const monthlyStats = await c.env.DB.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as conversions,
      SUM(subscription_value) as revenue,
      SUM(commission_amount) as commission
    FROM influencer_conversions
    WHERE influencer_id = ?
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
    LIMIT 12
  `).bind(influencerId).all();
  
  // Calculate pending commission
  const pendingCommission = await c.env.DB.prepare(`
    SELECT SUM(commission_amount) as total
    FROM influencer_conversions
    WHERE influencer_id = ? AND commission_status = 'PENDING'
  `).bind(influencerId).first();
  
  return c.json({
    profile: {
      id: influencer.id,
      name: influencer.name,
      email: influencer.email,
      tier: influencer.tier,
      discountCode: influencer.discount_code,
      discountPercent: influencer.discount_percent,
      landingPageUrl: `https://heirloom.app/ref/${influencer.landing_page_slug}`,
      status: influencer.status,
    },
    stats: {
      totalClicks: influencer.total_clicks,
      totalSignups: influencer.total_signups,
      totalConversions: influencer.total_conversions,
      totalRevenueGenerated: influencer.total_revenue_generated,
      totalCommissionEarned: influencer.total_commission_earned,
      totalCommissionPaid: influencer.total_commission_paid,
      pendingCommission: pendingCommission?.total || 0,
      conversionRate: influencer.total_clicks ? 
        ((influencer.total_conversions as number) / (influencer.total_clicks as number) * 100).toFixed(2) : '0',
    },
    recentConversions: recentConversions.results.map(conv => ({
      id: conv.id,
      userEmail: (conv.user_email as string).replace(/(.{2}).*(@.*)/, '$1***$2'),
      tier: conv.subscription_tier,
      billingCycle: conv.subscription_billing_cycle,
      value: conv.subscription_value,
      commission: conv.commission_amount,
      status: conv.commission_status,
      createdAt: conv.created_at,
    })),
    monthlyStats: monthlyStats.results,
  });
});

// Get influencer's conversions
influencerRoutes.get('/conversions', influencerAuth, async (c) => {
  const influencerId = c.get('influencerId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  
  const conversions = await c.env.DB.prepare(`
    SELECT * FROM influencer_conversions 
    WHERE influencer_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(influencerId, limit, offset).all();
  
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM influencer_conversions WHERE influencer_id = ?
  `).bind(influencerId).first();
  
  return c.json({
    conversions: conversions.results.map(conv => ({
      id: conv.id,
      userEmail: (conv.user_email as string).replace(/(.{2}).*(@.*)/, '$1***$2'),
      tier: conv.subscription_tier,
      billingCycle: conv.subscription_billing_cycle,
      value: conv.subscription_value,
      commission: conv.commission_amount,
      status: conv.commission_status,
      createdAt: conv.created_at,
    })),
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total as number || 0) / limit),
    },
  });
});

// Get influencer's payouts
influencerRoutes.get('/payouts', influencerAuth, async (c) => {
  const influencerId = c.get('influencerId');
  
  const payouts = await c.env.DB.prepare(`
    SELECT * FROM influencer_payouts 
    WHERE influencer_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).bind(influencerId).all();
  
  return c.json({
    payouts: payouts.results,
  });
});

// Update payment info
influencerRoutes.patch('/payment-info', influencerAuth, async (c) => {
  const influencerId = c.get('influencerId');
  const body = await c.req.json();
  const { paymentEmail, paymentMethod } = body;
  
  await c.env.DB.prepare(`
    UPDATE influencers SET 
      payment_email = COALESCE(?, payment_email),
      payment_method = COALESCE(?, payment_method),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(paymentEmail, paymentMethod, influencerId).run();
  
  return c.json({ success: true });
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

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

// Get all influencers (admin)
influencerRoutes.get('/admin/list', adminAuth, async (c) => {
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM influencers`;
  const params: any[] = [];
  
  if (status) {
    query += ` WHERE status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const influencers = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = `SELECT COUNT(*) as total FROM influencers`;
  if (status) {
    countQuery += ` WHERE status = ?`;
  }
  const countResult = await c.env.DB.prepare(countQuery).bind(...(status ? [status] : [])).first();
  
  return c.json({
    influencers: influencers.results,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total as number || 0) / limit),
    },
  });
});

// Get influencer stats (admin)
influencerRoutes.get('/admin/stats', adminAuth, async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_influencers,
      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_influencers,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_applications,
      SUM(total_conversions) as total_conversions,
      SUM(total_revenue_generated) as total_revenue,
      SUM(total_commission_earned) as total_commission_earned,
      SUM(total_commission_paid) as total_commission_paid
    FROM influencers
  `).first();
  
  const topInfluencers = await c.env.DB.prepare(`
    SELECT id, name, email, tier, total_conversions, total_revenue_generated, total_commission_earned
    FROM influencers
    WHERE status = 'ACTIVE'
    ORDER BY total_revenue_generated DESC
    LIMIT 10
  `).all();
  
  return c.json({
    stats,
    topInfluencers: topInfluencers.results,
  });
});

// Approve/reject influencer application (admin)
influencerRoutes.patch('/admin/:id/status', adminAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { status, notes } = body;
  
  if (!['APPROVED', 'ACTIVE', 'PAUSED', 'TERMINATED'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE influencers SET 
      status = ?,
      notes = COALESCE(?, notes),
      approved_at = CASE WHEN ? IN ('APPROVED', 'ACTIVE') THEN datetime('now') ELSE approved_at END,
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(status, notes, status, id).run();
  
  // If approved, also create the discount code in discount_codes table
  if (status === 'APPROVED' || status === 'ACTIVE') {
    const influencer = await c.env.DB.prepare(`
      SELECT discount_code, discount_percent FROM influencers WHERE id = ?
    `).bind(id).first();
    
    if (influencer) {
      const discountId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO discount_codes (
          id, code, owner_type, owner_id, discount_type, discount_value, is_active
        ) VALUES (?, ?, 'INFLUENCER', ?, 'PERCENT', ?, 1)
      `).bind(discountId, influencer.discount_code, id, influencer.discount_percent).run();
    }
  }
  
  return c.json({ success: true });
});

// Update influencer commission (admin)
influencerRoutes.patch('/admin/:id/commission', adminAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { commissionType, commissionRate, discountPercent } = body;
  
  await c.env.DB.prepare(`
    UPDATE influencers SET 
      commission_type = COALESCE(?, commission_type),
      commission_rate = COALESCE(?, commission_rate),
      discount_percent = COALESCE(?, discount_percent),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(commissionType, commissionRate, discountPercent, id).run();
  
  // Update discount code if discount percent changed
  if (discountPercent) {
    const influencer = await c.env.DB.prepare(`
      SELECT discount_code FROM influencers WHERE id = ?
    `).bind(id).first();
    
    if (influencer) {
      await c.env.DB.prepare(`
        UPDATE discount_codes SET discount_value = ? WHERE code = ?
      `).bind(discountPercent, influencer.discount_code).run();
    }
  }
  
  return c.json({ success: true });
});

// Process payout (admin)
influencerRoutes.post('/admin/:id/payout', adminAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { amount, paymentReference, periodStart, periodEnd, notes } = body;
  
  const influencer = await c.env.DB.prepare(`
    SELECT payment_method, payment_email FROM influencers WHERE id = ?
  `).bind(id).first();
  
  if (!influencer) {
    return c.json({ error: 'Influencer not found' }, 404);
  }
  
  // Count conversions in period
  const conversionsCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM influencer_conversions
    WHERE influencer_id = ? AND created_at >= ? AND created_at <= ? AND commission_status = 'PENDING'
  `).bind(id, periodStart, periodEnd).first();
  
  // Create payout record
  const payoutId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO influencer_payouts (
      id, influencer_id, amount, payment_method, payment_reference,
      period_start, period_end, conversions_count, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
  `).bind(
    payoutId, id, amount, influencer.payment_method, paymentReference,
    periodStart, periodEnd, conversionsCount?.count || 0, notes
  ).run();
  
  // Update conversions to paid
  await c.env.DB.prepare(`
    UPDATE influencer_conversions 
    SET commission_status = 'PAID', commission_paid_at = datetime('now')
    WHERE influencer_id = ? AND created_at >= ? AND created_at <= ? AND commission_status = 'PENDING'
  `).bind(id, periodStart, periodEnd).run();
  
  // Update influencer total paid
  await c.env.DB.prepare(`
    UPDATE influencers SET 
      total_commission_paid = total_commission_paid + ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(amount, id).run();
  
  return c.json({ success: true, payoutId });
});
