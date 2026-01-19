/**
 * Partner Portal Routes for Heirloom
 * 
 * Manages offline partner relationships (funeral homes, estate planners, etc.),
 * wholesale voucher orders, QR code tracking, and referral commissions.
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const partnerRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// =============================================================================
// CONSTANTS
// =============================================================================

// Wholesale pricing (30% discount from retail)
const WHOLESALE_DISCOUNT_PERCENT = 30;

// Retail prices in cents (from gift voucher pricing)
const RETAIL_PRICES = {
  STARTER: { '3': 1499, '6': 2799, '12': 4999, '24': 8499 },
  FAMILY: { '3': 2999, '6': 5499, '12': 9999, '24': 16999 },
  LEGACY: { '3': 5999, '6': 10999, '12': 19999, '24': 33999 },
};

// Referral commission (15% of subscription value)
const REFERRAL_COMMISSION_PERCENT = 15;

// =============================================================================
// HELPERS
// =============================================================================

function generatePartnerCode(businessName: string): string {
  const cleanName = businessName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `P-${cleanName}${randomSuffix}`;
}

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'HRLM-';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) code += '-';
  }
  return code;
}

function calculateWholesalePrice(retailPrice: number, discountPercent: number): number {
  return Math.round(retailPrice * (100 - discountPercent) / 100);
}

// =============================================================================
// PUBLIC ROUTES (No auth required)
// =============================================================================

// Apply to become a partner
partnerRoutes.post('/apply', async (c) => {
  const body = await c.req.json();
  
  const {
    businessName, businessType, contactName, contactEmail, contactPhone,
    addressLine1, addressLine2, city, state, postalCode, country
  } = body;
  
  if (!businessName || !businessType || !contactName || !contactEmail) {
    return c.json({ error: 'Business name, type, contact name, and email are required' }, 400);
  }
  
  const validTypes = ['FUNERAL_HOME', 'ESTATE_PLANNER', 'SENIOR_LIVING', 'PHOTOGRAPHER', 'GENEALOGY', 'THERAPIST', 'OTHER'];
  if (!validTypes.includes(businessType)) {
    return c.json({ error: 'Invalid business type' }, 400);
  }
  
  // Check if already applied
  const existing = await c.env.DB.prepare(`
    SELECT id, status FROM partners WHERE contact_email = ?
  `).bind(contactEmail).first();
  
  if (existing) {
    return c.json({ 
      error: 'An application with this email already exists',
      status: existing.status,
    }, 400);
  }
  
  // Generate unique partner code
  let partnerCode = generatePartnerCode(businessName);
  let attempts = 0;
  while (attempts < 10) {
    const existingCode = await c.env.DB.prepare(`
      SELECT id FROM partners WHERE partner_code = ?
    `).bind(partnerCode).first();
    
    if (!existingCode) break;
    partnerCode = generatePartnerCode(businessName);
    attempts++;
  }
  
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO partners (
      id, business_name, business_type, contact_name, contact_email, contact_phone,
      address_line1, address_line2, city, state, postal_code, country,
      partner_code, wholesale_discount_percent, referral_commission_percent, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
  `).bind(
    id, businessName, businessType, contactName, contactEmail, contactPhone || null,
    addressLine1 || null, addressLine2 || null, city || null, state || null,
    postalCode || null, country || 'US', partnerCode, WHOLESALE_DISCOUNT_PERCENT,
    REFERRAL_COMMISSION_PERCENT
  ).run();
  
  return c.json({
    success: true,
    message: 'Application submitted successfully. We will review and get back to you within 48-72 hours.',
    applicationId: id,
  });
});

// Track QR code scan / partner link click
partnerRoutes.post('/track-click', async (c) => {
  const body = await c.req.json();
  const { partnerCode, attributionMethod } = body;
  
  const partner = await c.env.DB.prepare(`
    SELECT id FROM partners WHERE partner_code = ? AND status = 'ACTIVE'
  `).bind(partnerCode?.toUpperCase()).first();
  
  if (!partner) {
    return c.json({ error: 'Invalid partner code' }, 404);
  }
  
  // We'll track this as a referral when they sign up
  return c.json({ success: true, partnerId: partner.id });
});

// Record partner referral signup
partnerRoutes.post('/record-signup', async (c) => {
  const body = await c.req.json();
  const { partnerCode, userId, userEmail, attributionMethod } = body;
  
  if (!partnerCode || !userEmail) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  const partner = await c.env.DB.prepare(`
    SELECT id FROM partners WHERE partner_code = ? AND status = 'ACTIVE'
  `).bind(partnerCode.toUpperCase()).first();
  
  if (!partner) {
    return c.json({ error: 'Invalid partner code' }, 404);
  }
  
  // Check if already referred
  const existingReferral = await c.env.DB.prepare(`
    SELECT id FROM partner_referrals WHERE user_email = ?
  `).bind(userEmail).first();
  
  if (existingReferral) {
    return c.json({ error: 'This email has already been referred' }, 400);
  }
  
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO partner_referrals (id, partner_id, user_id, user_email, attribution_method, status)
    VALUES (?, ?, ?, ?, ?, 'SIGNED_UP')
  `).bind(id, partner.id, userId || null, userEmail, attributionMethod || 'PARTNER_CODE').run();
  
  // Update partner stats
  await c.env.DB.prepare(`
    UPDATE partners SET total_referral_signups = total_referral_signups + 1, updated_at = datetime('now') WHERE id = ?
  `).bind(partner.id).run();
  
  return c.json({ success: true, referralId: id });
});

// Record partner referral conversion
partnerRoutes.post('/record-conversion', async (c) => {
  const body = await c.req.json();
  const { userId, subscriptionTier, subscriptionValue } = body;
  
  // Find the referral
  const referral = await c.env.DB.prepare(`
    SELECT pr.*, p.referral_commission_percent
    FROM partner_referrals pr
    JOIN partners p ON pr.partner_id = p.id
    WHERE pr.user_id = ? AND pr.status IN ('SIGNED_UP', 'TRIALING')
  `).bind(userId).first();
  
  if (!referral) {
    return c.json({ success: false, message: 'No pending partner referral found' });
  }
  
  // Calculate commission
  const commissionAmount = Math.round(subscriptionValue * (referral.referral_commission_percent as number) / 100);
  
  // Update referral
  await c.env.DB.prepare(`
    UPDATE partner_referrals SET 
      status = 'CONVERTED', converted_at = datetime('now'),
      subscription_tier = ?, subscription_value = ?,
      commission_amount = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(subscriptionTier, subscriptionValue, commissionAmount, referral.id).run();
  
  // Update partner stats
  await c.env.DB.prepare(`
    UPDATE partners SET 
      total_referral_conversions = total_referral_conversions + 1,
      total_referral_commission_earned = total_referral_commission_earned + ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(commissionAmount, referral.partner_id).run();
  
  return c.json({ success: true, commissionAmount });
});

// Redeem partner voucher
partnerRoutes.post('/redeem-voucher', async (c) => {
  const body = await c.req.json();
  const { code, userId } = body;
  
  if (!code || !userId) {
    return c.json({ error: 'Voucher code and user ID are required' }, 400);
  }
  
  const voucher = await c.env.DB.prepare(`
    SELECT pv.*, p.business_name as partner_name
    FROM partner_vouchers pv
    JOIN partners p ON pv.partner_id = p.id
    WHERE pv.code = ? AND pv.status = 'AVAILABLE'
  `).bind(code.toUpperCase()).first();
  
  if (!voucher) {
    return c.json({ error: 'Invalid or already redeemed voucher' }, 404);
  }
  
  // Check expiry
  if (voucher.expires_at && new Date(voucher.expires_at as string) < new Date()) {
    await c.env.DB.prepare(`
      UPDATE partner_vouchers SET status = 'EXPIRED', updated_at = datetime('now') WHERE id = ?
    `).bind(voucher.id).run();
    return c.json({ error: 'This voucher has expired' }, 400);
  }
  
  // Mark as redeemed
  await c.env.DB.prepare(`
    UPDATE partner_vouchers SET 
      status = 'REDEEMED', redeemed_by_user_id = ?, redeemed_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(userId, voucher.id).run();
  
  // Update partner stats
  await c.env.DB.prepare(`
    UPDATE partners SET total_vouchers_redeemed = total_vouchers_redeemed + 1, updated_at = datetime('now') WHERE id = ?
  `).bind(voucher.partner_id).run();
  
  // Apply subscription to user (similar to gift voucher redemption)
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + (voucher.duration_months as number));
  
  // Check for existing subscription
  const existingSub = await c.env.DB.prepare(`
    SELECT id, current_period_end FROM subscriptions WHERE user_id = ?
    ORDER BY CASE status WHEN 'ACTIVE' THEN 0 WHEN 'TRIALING' THEN 1 ELSE 2 END, created_at DESC
  `).bind(userId).first();
  
  if (existingSub) {
    // Extend existing subscription
    const baseDate = existingSub.current_period_end ? new Date(existingSub.current_period_end as string) : now;
    const newPeriodEnd = new Date(baseDate);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + (voucher.duration_months as number));
    
    await c.env.DB.prepare(`
      UPDATE subscriptions 
      SET tier = ?, current_period_start = COALESCE(current_period_start, ?), 
          current_period_end = ?, status = 'ACTIVE', trial_ends_at = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).bind(voucher.tier, now.toISOString(), newPeriodEnd.toISOString(), existingSub.id).run();
  } else {
    // Create new subscription
    const subId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO subscriptions (id, user_id, tier, status, billing_cycle, current_period_start, current_period_end)
      VALUES (?, ?, ?, 'ACTIVE', 'yearly', ?, ?)
    `).bind(subId, userId, voucher.tier, now.toISOString(), periodEnd.toISOString()).run();
  }
  
  return c.json({
    success: true,
    tier: voucher.tier,
    durationMonths: voucher.duration_months,
    partnerName: voucher.partner_name,
  });
});

// =============================================================================
// PARTNER PORTAL ROUTES (Authenticated partner)
// =============================================================================

// Partner auth middleware
const partnerAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  const sessionData = await c.env.KV.get(`partner:session:${token}`);
  if (!sessionData) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }
  
  const session = JSON.parse(sessionData);
  c.set('partnerId', session.partnerId);
  
  await next();
};

// Partner login
partnerRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, partnerCode } = body;
  
  const partner = await c.env.DB.prepare(`
    SELECT id, business_name, contact_email, status FROM partners 
    WHERE contact_email = ? AND partner_code = ? AND status IN ('ACTIVE', 'APPROVED')
  `).bind(email, partnerCode?.toUpperCase()).first();
  
  if (!partner) {
    return c.json({ error: 'Invalid credentials or account not active' }, 401);
  }
  
  const token = crypto.randomUUID();
  await c.env.KV.put(
    `partner:session:${token}`,
    JSON.stringify({ partnerId: partner.id, email: partner.contact_email }),
    { expirationTtl: 60 * 60 * 24 * 7 } // 7 days
  );
  
  return c.json({
    success: true,
    token,
    partner: {
      id: partner.id,
      businessName: partner.business_name,
      email: partner.contact_email,
    },
  });
});

// Get partner dashboard
partnerRoutes.get('/dashboard', partnerAuth, async (c) => {
  const partnerId = c.get('partnerId');
  
  const partner = await c.env.DB.prepare(`
    SELECT * FROM partners WHERE id = ?
  `).bind(partnerId).first();
  
  if (!partner) {
    return c.json({ error: 'Partner not found' }, 404);
  }
  
  // Get voucher stats
  const voucherStats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'REDEEMED' THEN 1 ELSE 0 END) as redeemed,
      SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) as expired
    FROM partner_vouchers WHERE partner_id = ?
  `).bind(partnerId).first();
  
  // Get recent orders
  const recentOrders = await c.env.DB.prepare(`
    SELECT * FROM partner_wholesale_orders 
    WHERE partner_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).bind(partnerId).all();
  
  // Get recent referrals
  const recentReferrals = await c.env.DB.prepare(`
    SELECT * FROM partner_referrals 
    WHERE partner_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).bind(partnerId).all();
  
  return c.json({
    profile: {
      id: partner.id,
      businessName: partner.business_name,
      businessType: partner.business_type,
      contactName: partner.contact_name,
      contactEmail: partner.contact_email,
      partnerCode: partner.partner_code,
      qrLandingPage: `https://heirloom.app/p/${partner.partner_code}`,
      wholesaleDiscount: partner.wholesale_discount_percent,
      referralCommission: partner.referral_commission_percent,
      status: partner.status,
    },
    stats: {
      totalWholesaleOrders: partner.total_wholesale_orders,
      totalWholesaleRevenue: partner.total_wholesale_revenue,
      totalVouchersPurchased: partner.total_vouchers_purchased,
      totalVouchersRedeemed: partner.total_vouchers_redeemed,
      vouchersAvailable: voucherStats?.available || 0,
      totalReferralSignups: partner.total_referral_signups,
      totalReferralConversions: partner.total_referral_conversions,
      totalReferralCommission: partner.total_referral_commission_earned,
    },
    voucherStats,
    recentOrders: recentOrders.results,
    recentReferrals: recentReferrals.results.map(r => ({
      ...r,
      user_email: (r.user_email as string).replace(/(.{2}).*(@.*)/, '$1***$2'),
    })),
  });
});

// Get wholesale pricing
partnerRoutes.get('/pricing', partnerAuth, async (c) => {
  const partnerId = c.get('partnerId');
  
  const partner = await c.env.DB.prepare(`
    SELECT wholesale_discount_percent, minimum_order_quantity FROM partners WHERE id = ?
  `).bind(partnerId).first();
  
  if (!partner) {
    return c.json({ error: 'Partner not found' }, 404);
  }
  
  const discount = partner.wholesale_discount_percent as number;
  
  const pricing = {
    STARTER: {
      '3': { retail: RETAIL_PRICES.STARTER['3'], wholesale: calculateWholesalePrice(RETAIL_PRICES.STARTER['3'], discount) },
      '6': { retail: RETAIL_PRICES.STARTER['6'], wholesale: calculateWholesalePrice(RETAIL_PRICES.STARTER['6'], discount) },
      '12': { retail: RETAIL_PRICES.STARTER['12'], wholesale: calculateWholesalePrice(RETAIL_PRICES.STARTER['12'], discount) },
      '24': { retail: RETAIL_PRICES.STARTER['24'], wholesale: calculateWholesalePrice(RETAIL_PRICES.STARTER['24'], discount) },
    },
    FAMILY: {
      '3': { retail: RETAIL_PRICES.FAMILY['3'], wholesale: calculateWholesalePrice(RETAIL_PRICES.FAMILY['3'], discount) },
      '6': { retail: RETAIL_PRICES.FAMILY['6'], wholesale: calculateWholesalePrice(RETAIL_PRICES.FAMILY['6'], discount) },
      '12': { retail: RETAIL_PRICES.FAMILY['12'], wholesale: calculateWholesalePrice(RETAIL_PRICES.FAMILY['12'], discount) },
      '24': { retail: RETAIL_PRICES.FAMILY['24'], wholesale: calculateWholesalePrice(RETAIL_PRICES.FAMILY['24'], discount) },
    },
    LEGACY: {
      '3': { retail: RETAIL_PRICES.LEGACY['3'], wholesale: calculateWholesalePrice(RETAIL_PRICES.LEGACY['3'], discount) },
      '6': { retail: RETAIL_PRICES.LEGACY['6'], wholesale: calculateWholesalePrice(RETAIL_PRICES.LEGACY['6'], discount) },
      '12': { retail: RETAIL_PRICES.LEGACY['12'], wholesale: calculateWholesalePrice(RETAIL_PRICES.LEGACY['12'], discount) },
      '24': { retail: RETAIL_PRICES.LEGACY['24'], wholesale: calculateWholesalePrice(RETAIL_PRICES.LEGACY['24'], discount) },
    },
  };
  
  return c.json({
    discountPercent: discount,
    minimumOrderQuantity: partner.minimum_order_quantity,
    pricing,
  });
});

// Create wholesale order
partnerRoutes.post('/orders', partnerAuth, async (c) => {
  const partnerId = c.get('partnerId');
  const body = await c.req.json();
  const { tier, durationMonths, quantity } = body;
  
  if (!tier || !durationMonths || !quantity) {
    return c.json({ error: 'Tier, duration, and quantity are required' }, 400);
  }
  
  const partner = await c.env.DB.prepare(`
    SELECT wholesale_discount_percent, minimum_order_quantity FROM partners WHERE id = ?
  `).bind(partnerId).first();
  
  if (!partner) {
    return c.json({ error: 'Partner not found' }, 404);
  }
  
  if (quantity < (partner.minimum_order_quantity as number)) {
    return c.json({ error: `Minimum order quantity is ${partner.minimum_order_quantity}` }, 400);
  }
  
  const retailPrice = RETAIL_PRICES[tier as keyof typeof RETAIL_PRICES]?.[durationMonths as keyof typeof RETAIL_PRICES.STARTER];
  if (!retailPrice) {
    return c.json({ error: 'Invalid tier or duration' }, 400);
  }
  
  const wholesalePrice = calculateWholesalePrice(retailPrice, partner.wholesale_discount_percent as number);
  const totalAmount = wholesalePrice * quantity;
  const discountAmount = (retailPrice - wholesalePrice) * quantity;
  
  const orderId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO partner_wholesale_orders (
      id, partner_id, voucher_tier, voucher_duration_months, quantity,
      unit_price, retail_price, total_amount, discount_applied, payment_status, fulfillment_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING')
  `).bind(
    orderId, partnerId, tier, durationMonths, quantity,
    wholesalePrice, retailPrice, totalAmount, discountAmount
  ).run();
  
  // In a real implementation, you would create a Stripe checkout session here
  // For now, we'll return the order details
  
  return c.json({
    success: true,
    orderId,
    order: {
      tier,
      durationMonths,
      quantity,
      unitPrice: wholesalePrice,
      retailPrice,
      totalAmount,
      discountSaved: discountAmount,
    },
    // checkoutUrl would be returned here in production
  });
});

// Get partner's orders
partnerRoutes.get('/orders', partnerAuth, async (c) => {
  const partnerId = c.get('partnerId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  
  const orders = await c.env.DB.prepare(`
    SELECT * FROM partner_wholesale_orders 
    WHERE partner_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(partnerId, limit, offset).all();
  
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM partner_wholesale_orders WHERE partner_id = ?
  `).bind(partnerId).first();
  
  return c.json({
    orders: orders.results,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total as number || 0) / limit),
    },
  });
});

// Get partner's vouchers
partnerRoutes.get('/vouchers', partnerAuth, async (c) => {
  const partnerId = c.get('partnerId');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM partner_vouchers WHERE partner_id = ?`;
  const params: any[] = [partnerId];
  
  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const vouchers = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = `SELECT COUNT(*) as total FROM partner_vouchers WHERE partner_id = ?`;
  if (status) {
    countQuery += ` AND status = ?`;
  }
  const countResult = await c.env.DB.prepare(countQuery).bind(...(status ? [partnerId, status] : [partnerId])).first();
  
  return c.json({
    vouchers: vouchers.results,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total as number || 0) / limit),
    },
  });
});

// Assign voucher to recipient
partnerRoutes.patch('/vouchers/:id/assign', partnerAuth, async (c) => {
  const partnerId = c.get('partnerId');
  const voucherId = c.req.param('id');
  const body = await c.req.json();
  const { recipientName, recipientEmail } = body;
  
  const voucher = await c.env.DB.prepare(`
    SELECT id, status FROM partner_vouchers WHERE id = ? AND partner_id = ?
  `).bind(voucherId, partnerId).first();
  
  if (!voucher) {
    return c.json({ error: 'Voucher not found' }, 404);
  }
  
  if (voucher.status !== 'AVAILABLE') {
    return c.json({ error: 'Voucher is not available for assignment' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE partner_vouchers SET 
      status = 'ASSIGNED', assigned_to_name = ?, assigned_to_email = ?, 
      assigned_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(recipientName, recipientEmail, voucherId).run();
  
  return c.json({ success: true });
});

// Get partner's referrals
partnerRoutes.get('/referrals', partnerAuth, async (c) => {
  const partnerId = c.get('partnerId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  
  const referrals = await c.env.DB.prepare(`
    SELECT * FROM partner_referrals 
    WHERE partner_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(partnerId, limit, offset).all();
  
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM partner_referrals WHERE partner_id = ?
  `).bind(partnerId).first();
  
  return c.json({
    referrals: referrals.results.map(r => ({
      ...r,
      user_email: (r.user_email as string).replace(/(.{2}).*(@.*)/, '$1***$2'),
    })),
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total as number || 0) / limit),
    },
  });
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

// Get all partners (admin)
partnerRoutes.get('/admin/list', adminAuth, async (c) => {
  const status = c.req.query('status');
  const businessType = c.req.query('businessType');
  const page = parseInt(c.req.query('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM partners WHERE 1=1`;
  const params: any[] = [];
  
  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }
  if (businessType) {
    query += ` AND business_type = ?`;
    params.push(businessType);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const partners = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = `SELECT COUNT(*) as total FROM partners WHERE 1=1`;
  const countParams: any[] = [];
  if (status) {
    countQuery += ` AND status = ?`;
    countParams.push(status);
  }
  if (businessType) {
    countQuery += ` AND business_type = ?`;
    countParams.push(businessType);
  }
  const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({
    partners: partners.results,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total as number || 0) / limit),
    },
  });
});

// Get partner stats (admin)
partnerRoutes.get('/admin/stats', adminAuth, async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_partners,
      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_partners,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_applications,
      SUM(total_wholesale_orders) as total_orders,
      SUM(total_wholesale_revenue) as total_revenue,
      SUM(total_vouchers_purchased) as total_vouchers_sold,
      SUM(total_vouchers_redeemed) as total_vouchers_redeemed,
      SUM(total_referral_conversions) as total_referral_conversions,
      SUM(total_referral_commission_earned) as total_commission_owed
    FROM partners
  `).first();
  
  const byType = await c.env.DB.prepare(`
    SELECT business_type, COUNT(*) as count
    FROM partners WHERE status = 'ACTIVE'
    GROUP BY business_type
  `).all();
  
  const topPartners = await c.env.DB.prepare(`
    SELECT id, business_name, business_type, total_wholesale_revenue, total_vouchers_redeemed
    FROM partners WHERE status = 'ACTIVE'
    ORDER BY total_wholesale_revenue DESC
    LIMIT 10
  `).all();
  
  return c.json({
    stats,
    byType: byType.results,
    topPartners: topPartners.results,
  });
});

// Approve/reject partner application (admin)
partnerRoutes.patch('/admin/:id/status', adminAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { status, notes } = body;
  
  if (!['APPROVED', 'ACTIVE', 'PAUSED', 'TERMINATED'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE partners SET 
      status = ?,
      notes = COALESCE(?, notes),
      approved_at = CASE WHEN ? IN ('APPROVED', 'ACTIVE') THEN datetime('now') ELSE approved_at END,
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(status, notes, status, id).run();
  
  return c.json({ success: true });
});

// Update partner discount/commission (admin)
partnerRoutes.patch('/admin/:id/terms', adminAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { wholesaleDiscount, referralCommission, minimumOrderQuantity } = body;
  
  await c.env.DB.prepare(`
    UPDATE partners SET 
      wholesale_discount_percent = COALESCE(?, wholesale_discount_percent),
      referral_commission_percent = COALESCE(?, referral_commission_percent),
      minimum_order_quantity = COALESCE(?, minimum_order_quantity),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(wholesaleDiscount, referralCommission, minimumOrderQuantity, id).run();
  
  return c.json({ success: true });
});

// Fulfill wholesale order (admin)
partnerRoutes.post('/admin/orders/:id/fulfill', adminAuth, async (c) => {
  const orderId = c.req.param('id');
  
  const order = await c.env.DB.prepare(`
    SELECT * FROM partner_wholesale_orders WHERE id = ? AND payment_status = 'PAID' AND fulfillment_status = 'PENDING'
  `).bind(orderId).first();
  
  if (!order) {
    return c.json({ error: 'Order not found or not ready for fulfillment' }, 404);
  }
  
  // Generate vouchers
  const vouchers: string[] = [];
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiry
  
  for (let i = 0; i < (order.quantity as number); i++) {
    let code = generateVoucherCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await c.env.DB.prepare(`
        SELECT id FROM partner_vouchers WHERE code = ?
      `).bind(code).first();
      if (!existing) break;
      code = generateVoucherCode();
      attempts++;
    }
    
    const voucherId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO partner_vouchers (
        id, wholesale_order_id, partner_id, code, tier, duration_months, status, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', ?)
    `).bind(
      voucherId, orderId, order.partner_id, code, order.voucher_tier,
      order.voucher_duration_months, expiresAt.toISOString()
    ).run();
    
    vouchers.push(code);
  }
  
  // Update order status
  await c.env.DB.prepare(`
    UPDATE partner_wholesale_orders SET 
      fulfillment_status = 'FULFILLED', fulfilled_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(orderId).run();
  
  // Update partner stats
  await c.env.DB.prepare(`
    UPDATE partners SET 
      total_wholesale_orders = total_wholesale_orders + 1,
      total_wholesale_revenue = total_wholesale_revenue + ?,
      total_vouchers_purchased = total_vouchers_purchased + ?,
      last_order_at = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(order.total_amount, order.quantity, order.partner_id).run();
  
  return c.json({
    success: true,
    vouchersGenerated: vouchers.length,
    vouchers,
  });
});

// Mark order as paid (admin - for manual payment processing)
partnerRoutes.patch('/admin/orders/:id/paid', adminAuth, async (c) => {
  const orderId = c.req.param('id');
  const body = await c.req.json();
  const { paymentReference } = body;
  
  await c.env.DB.prepare(`
    UPDATE partner_wholesale_orders SET 
      payment_status = 'PAID', paid_at = datetime('now'),
      stripe_payment_intent_id = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(paymentReference || null, orderId).run();
  
  return c.json({ success: true });
});
