/**
 * Gift Voucher Routes for Heirloom
 * 
 * Allows users to purchase subscription gift vouchers for others.
 * Includes admin management capabilities.
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../index';
import { giftVoucherPurchaseEmail, giftVoucherReceivedEmail, giftVoucherRedeemedEmail } from '../email-templates';

export const giftVoucherRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// =============================================================================
// HELPERS
// =============================================================================

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

// Pricing by tier and cycle (in cents for Stripe)
const GIFT_PRICING: Record<string, Record<string, Record<string, number>>> = {
  USD: {
    STARTER: { monthly: 100, yearly: 1000 },
    FAMILY: { monthly: 500, yearly: 5000 },
    FOREVER: { monthly: 1500, yearly: 15000 },
  },
  ZAR: {
    STARTER: { monthly: 1800, yearly: 18000 },
    FAMILY: { monthly: 9000, yearly: 90000 },
    FOREVER: { monthly: 27000, yearly: 270000 },
  },
  GBP: {
    STARTER: { monthly: 79, yearly: 790 },
    FAMILY: { monthly: 399, yearly: 3990 },
    FOREVER: { monthly: 1199, yearly: 11990 },
  },
  EUR: {
    STARTER: { monthly: 99, yearly: 990 },
    FAMILY: { monthly: 499, yearly: 4990 },
    FOREVER: { monthly: 1499, yearly: 14990 },
  },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', ZAR: 'R', GBP: '£', EUR: '€', CAD: 'C$', AUD: 'A$', INR: '₹',
};

// =============================================================================
// PUBLIC ROUTES (No auth required for purchasing)
// =============================================================================

// Get gift voucher pricing
giftVoucherRoutes.get('/pricing', async (c) => {
  const currency = (c.req.query('currency') || 'USD').toUpperCase();
  const prices = GIFT_PRICING[currency] || GIFT_PRICING.USD;
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  
  return c.json({
    currency,
    symbol,
    tiers: [
      {
        id: 'STARTER',
        name: 'Starter',
        description: 'Perfect for getting started with digital legacy',
        storage: '500 MB',
        monthly: { amount: prices.STARTER.monthly / 100, display: `${symbol}${(prices.STARTER.monthly / 100).toFixed(2)}` },
        yearly: { amount: prices.STARTER.yearly / 100, display: `${symbol}${(prices.STARTER.yearly / 100).toFixed(2)}`, savings: '2 months free' },
      },
      {
        id: 'FAMILY',
        name: 'Family',
        description: 'Most popular - ideal for families',
        storage: '5 GB',
        popular: true,
        monthly: { amount: prices.FAMILY.monthly / 100, display: `${symbol}${(prices.FAMILY.monthly / 100).toFixed(2)}` },
        yearly: { amount: prices.FAMILY.yearly / 100, display: `${symbol}${(prices.FAMILY.yearly / 100).toFixed(2)}`, savings: '2 months free' },
      },
      {
        id: 'FOREVER',
        name: 'Forever',
        description: 'The ultimate legacy package',
        storage: '50 GB',
        monthly: { amount: prices.FOREVER.monthly / 100, display: `${symbol}${(prices.FOREVER.monthly / 100).toFixed(2)}` },
        yearly: { amount: prices.FOREVER.yearly / 100, display: `${symbol}${(prices.FOREVER.yearly / 100).toFixed(2)}`, savings: '2 months free' },
      },
    ],
  });
});

// Create checkout session for gift voucher purchase
giftVoucherRoutes.post('/checkout', async (c) => {
  const body = await c.req.json();
  const { tier, billingCycle, purchaserEmail, purchaserName, recipientEmail, recipientName, recipientMessage, currency = 'USD' } = body;
  
  if (!tier || !billingCycle || !purchaserEmail) {
    return c.json({ error: 'Missing required fields: tier, billingCycle, purchaserEmail' }, 400);
  }
  
  const validTiers = ['STARTER', 'FAMILY', 'FOREVER'];
  const validCycles = ['monthly', 'yearly'];
  
  if (!validTiers.includes(tier.toUpperCase())) {
    return c.json({ error: 'Invalid tier' }, 400);
  }
  
  if (!validCycles.includes(billingCycle.toLowerCase())) {
    return c.json({ error: 'Invalid billing cycle' }, 400);
  }
  
  const prices = GIFT_PRICING[currency.toUpperCase()] || GIFT_PRICING.USD;
  const amount = prices[tier.toUpperCase()][billingCycle.toLowerCase()];
  const durationMonths = billingCycle.toLowerCase() === 'yearly' ? 12 : 1;
  
  // Generate voucher code
  const voucherCode = generateVoucherCode();
  
  // Calculate expiry (1 year from now)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  
  // Get user ID if logged in
  const userId = c.get('userId') || null;
  
  try {
    // Create Stripe checkout session
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'success_url': `${c.env.APP_URL}/gift/success?code=${voucherCode}`,
        'cancel_url': `${c.env.APP_URL}/gift/cancelled`,
        'customer_email': purchaserEmail,
        'line_items[0][price_data][currency]': currency.toLowerCase(),
        'line_items[0][price_data][unit_amount]': amount.toString(),
        'line_items[0][price_data][product_data][name]': `Heirloom ${tier} Gift Voucher (${durationMonths} month${durationMonths > 1 ? 's' : ''})`,
        'line_items[0][price_data][product_data][description]': `Gift a ${tier} subscription to someone special`,
        'line_items[0][quantity]': '1',
        'metadata[voucher_code]': voucherCode,
        'metadata[tier]': tier.toUpperCase(),
        'metadata[billing_cycle]': billingCycle.toLowerCase(),
        'metadata[type]': 'gift_voucher',
      }),
    });
    
    if (!stripeResponse.ok) {
      const error = await stripeResponse.text();
      console.error('Stripe error:', error);
      return c.json({ error: 'Failed to create checkout session' }, 500);
    }
    
    const session = await stripeResponse.json() as { id: string; url: string };
    
    // Create voucher record (pending payment)
    await c.env.DB.prepare(`
      INSERT INTO gift_vouchers (
        code, purchaser_user_id, purchaser_email, purchaser_name,
        recipient_email, recipient_name, recipient_message,
        tier, billing_cycle, duration_months, amount, currency,
        stripe_checkout_session_id, status, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).bind(
      voucherCode,
      userId,
      purchaserEmail,
      purchaserName || null,
      recipientEmail || null,
      recipientName || null,
      recipientMessage || null,
      tier.toUpperCase(),
      billingCycle.toLowerCase(),
      durationMonths,
      amount,
      currency.toUpperCase(),
      session.id,
      expiresAt.toISOString()
    ).run();
    
    return c.json({
      checkoutUrl: session.url,
      voucherCode,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error('Gift voucher checkout error:', err);
    return c.json({ error: 'Failed to create gift voucher checkout' }, 500);
  }
});

// Validate a voucher code (public - for redemption page)
giftVoucherRoutes.get('/validate/:code', async (c) => {
  const code = c.req.param('code')?.toUpperCase();
  
  if (!code) {
    return c.json({ error: 'Voucher code required' }, 400);
  }
  
  const voucher = await c.env.DB.prepare(`
    SELECT id, code, tier, billing_cycle, duration_months, status, expires_at,
           recipient_name, recipient_message, purchaser_name
    FROM gift_vouchers WHERE code = ?
  `).bind(code).first();
  
  if (!voucher) {
    return c.json({ valid: false, error: 'Invalid voucher code' }, 404);
  }
  
  if (voucher.status === 'REDEEMED') {
    return c.json({ valid: false, error: 'This voucher has already been redeemed' }, 400);
  }
  
  if (voucher.status === 'EXPIRED' || new Date(voucher.expires_at as string) < new Date()) {
    return c.json({ valid: false, error: 'This voucher has expired' }, 400);
  }
  
  if (voucher.status !== 'PAID' && voucher.status !== 'SENT') {
    return c.json({ valid: false, error: 'This voucher is not yet active' }, 400);
  }
  
  return c.json({
    valid: true,
    voucher: {
      code: voucher.code,
      tier: voucher.tier,
      billingCycle: voucher.billing_cycle,
      durationMonths: voucher.duration_months,
      recipientName: voucher.recipient_name,
      recipientMessage: voucher.recipient_message,
      fromName: voucher.purchaser_name,
      expiresAt: voucher.expires_at,
    },
  });
});

// =============================================================================
// AUTHENTICATED ROUTES
// =============================================================================

// Redeem a voucher (requires auth)
giftVoucherRoutes.post('/redeem', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  const body = await c.req.json();
  const { code } = body;
  
  if (!code) {
    return c.json({ error: 'Voucher code required' }, 400);
  }
  
  const voucher = await c.env.DB.prepare(`
    SELECT * FROM gift_vouchers WHERE code = ?
  `).bind(code.toUpperCase()).first();
  
  if (!voucher) {
    return c.json({ error: 'Invalid voucher code' }, 404);
  }
  
  if (voucher.status === 'REDEEMED') {
    return c.json({ error: 'This voucher has already been redeemed' }, 400);
  }
  
  if (voucher.status === 'EXPIRED' || new Date(voucher.expires_at as string) < new Date()) {
    return c.json({ error: 'This voucher has expired' }, 400);
  }
  
  if (voucher.status !== 'PAID' && voucher.status !== 'SENT') {
    return c.json({ error: 'This voucher is not yet active' }, 400);
  }
  
  // Check if user already has an active subscription
  const existingSub = await c.env.DB.prepare(`
    SELECT * FROM subscriptions WHERE user_id = ? AND status IN ('ACTIVE', 'TRIALING')
  `).bind(userId).first();
  
  // Calculate subscription period
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + (voucher.duration_months as number));
  
  try {
    // Start transaction
    if (existingSub) {
      // Extend existing subscription
      const newPeriodEnd = new Date(existingSub.current_period_end as string);
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + (voucher.duration_months as number));
      
      // Upgrade tier if gift is higher
      const tierOrder = { STARTER: 1, FAMILY: 2, FOREVER: 3 };
      const currentTier = (existingSub.tier as string).toUpperCase();
      const giftTier = (voucher.tier as string).toUpperCase();
      const newTier = tierOrder[giftTier as keyof typeof tierOrder] > tierOrder[currentTier as keyof typeof tierOrder] ? giftTier : currentTier;
      
      await c.env.DB.prepare(`
        UPDATE subscriptions 
        SET tier = ?, current_period_end = ?, status = 'ACTIVE', updated_at = datetime('now')
        WHERE user_id = ?
      `).bind(newTier, newPeriodEnd.toISOString(), userId).run();
    } else {
      // Create new subscription
      await c.env.DB.prepare(`
        INSERT INTO subscriptions (user_id, tier, status, billing_cycle, current_period_start, current_period_end)
        VALUES (?, ?, 'ACTIVE', ?, ?, ?)
      `).bind(userId, voucher.tier, voucher.billing_cycle, now.toISOString(), periodEnd.toISOString()).run();
    }
    
    // Mark voucher as redeemed
    await c.env.DB.prepare(`
      UPDATE gift_vouchers 
      SET status = 'REDEEMED', redeemed_by_user_id = ?, redeemed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(userId, voucher.id).run();
    
    // Get user email for confirmation
    const user = await c.env.DB.prepare('SELECT email, first_name FROM users WHERE id = ?').bind(userId).first();
    
    // Send redemption confirmation email
    if (user?.email && c.env.RESEND_API_KEY) {
      const emailContent = giftVoucherRedeemedEmail(
        user.first_name as string || 'there',
        voucher.tier as string,
        voucher.duration_months as number
      );
      
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Heirloom <noreply@heirloom.blue>',
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      });
    }
    
    return c.json({
      success: true,
      message: 'Gift voucher redeemed successfully!',
      subscription: {
        tier: voucher.tier,
        durationMonths: voucher.duration_months,
        periodEnd: periodEnd.toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Gift voucher redemption error:', err);
    return c.json({ error: 'Failed to redeem voucher' }, 500);
  }
});

// Get user's purchased vouchers
giftVoucherRoutes.get('/purchased', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  const vouchers = await c.env.DB.prepare(`
    SELECT id, code, tier, billing_cycle, duration_months, amount, currency,
           recipient_email, recipient_name, status, expires_at, redeemed_at, created_at
    FROM gift_vouchers 
    WHERE purchaser_user_id = ?
    ORDER BY created_at DESC
  `).bind(userId).all();
  
  return c.json({ vouchers: vouchers.results || [] });
});

// Send voucher to recipient (if not sent at purchase)
giftVoucherRoutes.post('/:id/send', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  const voucherId = c.req.param('id');
  const body = await c.req.json();
  const { recipientEmail, recipientName, recipientMessage } = body;
  
  if (!recipientEmail) {
    return c.json({ error: 'Recipient email required' }, 400);
  }
  
  const voucher = await c.env.DB.prepare(`
    SELECT * FROM gift_vouchers WHERE id = ? AND purchaser_user_id = ?
  `).bind(voucherId, userId).first();
  
  if (!voucher) {
    return c.json({ error: 'Voucher not found' }, 404);
  }
  
  if (voucher.status !== 'PAID') {
    return c.json({ error: 'Voucher must be paid before sending' }, 400);
  }
  
  // Update voucher with recipient info
  await c.env.DB.prepare(`
    UPDATE gift_vouchers 
    SET recipient_email = ?, recipient_name = ?, recipient_message = ?, 
        status = 'SENT', sent_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(recipientEmail, recipientName || null, recipientMessage || null, voucherId).run();
  
  // Send gift email to recipient
  if (c.env.RESEND_API_KEY) {
    const emailContent = giftVoucherReceivedEmail(
      recipientName || 'Friend',
      voucher.purchaser_name as string || 'Someone special',
      voucher.code as string,
      voucher.tier as string,
      voucher.duration_months as number,
      recipientMessage || null
    );
    
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Heirloom <noreply@heirloom.blue>',
        to: recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });
    
    // Log email
    await c.env.DB.prepare(`
      INSERT INTO gift_voucher_emails (voucher_id, email_type, recipient_email)
      VALUES (?, 'GIFT_SENT', ?)
    `).bind(voucherId, recipientEmail).run();
  }
  
  return c.json({ success: true, message: 'Gift voucher sent to recipient!' });
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Get all vouchers (admin)
giftVoucherRoutes.get('/admin/all', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  
  const status = c.req.query('status');
  const search = c.req.query('search');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  
  let query = `
    SELECT gv.*, u.email as redeemer_email, u.first_name as redeemer_name
    FROM gift_vouchers gv
    LEFT JOIN users u ON gv.redeemed_by_user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    query += ' AND gv.status = ?';
    params.push(status.toUpperCase());
  }
  
  if (search) {
    query += ' AND (gv.code LIKE ? OR gv.purchaser_email LIKE ? OR gv.recipient_email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY gv.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const vouchers = await c.env.DB.prepare(query).bind(...params).all();
  
  // Get counts by status
  const counts = await c.env.DB.prepare(`
    SELECT status, COUNT(*) as count FROM gift_vouchers GROUP BY status
  `).all();
  
  const statusCounts: Record<string, number> = {};
  for (const row of counts.results || []) {
    statusCounts[row.status as string] = row.count as number;
  }
  
  return c.json({
    vouchers: vouchers.results || [],
    counts: statusCounts,
    pagination: { limit, offset },
  });
});

// Get voucher details (admin)
giftVoucherRoutes.get('/admin/:id', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  
  const voucherId = c.req.param('id');
  
  const voucher = await c.env.DB.prepare(`
    SELECT gv.*, 
           pu.email as purchaser_user_email, pu.first_name as purchaser_first_name,
           ru.email as redeemer_email, ru.first_name as redeemer_first_name
    FROM gift_vouchers gv
    LEFT JOIN users pu ON gv.purchaser_user_id = pu.id
    LEFT JOIN users ru ON gv.redeemed_by_user_id = ru.id
    WHERE gv.id = ?
  `).bind(voucherId).first();
  
  if (!voucher) {
    return c.json({ error: 'Voucher not found' }, 404);
  }
  
  // Get email history
  const emails = await c.env.DB.prepare(`
    SELECT * FROM gift_voucher_emails WHERE voucher_id = ? ORDER BY sent_at DESC
  `).bind(voucherId).all();
  
  return c.json({
    voucher,
    emails: emails.results || [],
  });
});

// Create voucher manually (admin)
giftVoucherRoutes.post('/admin/create', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  
  const body = await c.req.json();
  const { tier, billingCycle, durationMonths, recipientEmail, recipientName, notes } = body;
  
  if (!tier || !billingCycle) {
    return c.json({ error: 'Tier and billing cycle required' }, 400);
  }
  
  const voucherCode = generateVoucherCode();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  
  const duration = durationMonths || (billingCycle === 'yearly' ? 12 : 1);
  
  await c.env.DB.prepare(`
    INSERT INTO gift_vouchers (
      code, purchaser_email, tier, billing_cycle, duration_months,
      amount, currency, status, expires_at, recipient_email, recipient_name,
      admin_notes, created_by_admin_id
    ) VALUES (?, 'admin@heirloom.blue', ?, ?, ?, 0, 'USD', 'PAID', ?, ?, ?, ?, ?)
  `).bind(
    voucherCode,
    tier.toUpperCase(),
    billingCycle.toLowerCase(),
    duration,
    expiresAt.toISOString(),
    recipientEmail || null,
    recipientName || null,
    notes || null,
    adminId
  ).run();
  
  return c.json({
    success: true,
    voucher: {
      code: voucherCode,
      tier: tier.toUpperCase(),
      billingCycle: billingCycle.toLowerCase(),
      durationMonths: duration,
      expiresAt: expiresAt.toISOString(),
    },
  });
});

// Update voucher (admin)
giftVoucherRoutes.patch('/admin/:id', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  
  const voucherId = c.req.param('id');
  const body = await c.req.json();
  const { status, expiresAt, adminNotes } = body;
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (status) {
    updates.push('status = ?');
    params.push(status.toUpperCase());
  }
  
  if (expiresAt) {
    updates.push('expires_at = ?');
    params.push(expiresAt);
  }
  
  if (adminNotes !== undefined) {
    updates.push('admin_notes = ?');
    params.push(adminNotes);
  }
  
  if (updates.length === 0) {
    return c.json({ error: 'No updates provided' }, 400);
  }
  
  updates.push('updated_at = datetime(\'now\')');
  params.push(voucherId);
  
  await c.env.DB.prepare(`
    UPDATE gift_vouchers SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();
  
  return c.json({ success: true, message: 'Voucher updated' });
});

// Resend voucher email (admin)
giftVoucherRoutes.post('/admin/:id/resend', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  
  const voucherId = c.req.param('id');
  
  const voucher = await c.env.DB.prepare(`
    SELECT * FROM gift_vouchers WHERE id = ?
  `).bind(voucherId).first();
  
  if (!voucher) {
    return c.json({ error: 'Voucher not found' }, 404);
  }
  
  if (!voucher.recipient_email) {
    return c.json({ error: 'No recipient email set' }, 400);
  }
  
  if (c.env.RESEND_API_KEY) {
    const emailContent = giftVoucherReceivedEmail(
      voucher.recipient_name as string || 'Friend',
      voucher.purchaser_name as string || 'Someone special',
      voucher.code as string,
      voucher.tier as string,
      voucher.duration_months as number,
      voucher.recipient_message as string || null
    );
    
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Heirloom <noreply@heirloom.blue>',
        to: voucher.recipient_email,
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });
    
    // Log email
    await c.env.DB.prepare(`
      INSERT INTO gift_voucher_emails (voucher_id, email_type, recipient_email)
      VALUES (?, 'GIFT_SENT', ?)
    `).bind(voucherId, voucher.recipient_email).run();
  }
  
  return c.json({ success: true, message: 'Email resent to recipient' });
});

// Get voucher stats (admin)
giftVoucherRoutes.get('/admin/stats', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid,
      SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status = 'REDEEMED' THEN 1 ELSE 0 END) as redeemed,
      SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) as expired,
      SUM(CASE WHEN status IN ('PAID', 'SENT', 'REDEEMED') THEN amount ELSE 0 END) as total_revenue,
      SUM(CASE WHEN status = 'REDEEMED' THEN amount ELSE 0 END) as redeemed_value
    FROM gift_vouchers
  `).first();
  
  const recentVouchers = await c.env.DB.prepare(`
    SELECT code, tier, status, amount, currency, created_at
    FROM gift_vouchers
    ORDER BY created_at DESC
    LIMIT 10
  `).all();
  
  return c.json({
    stats,
    recentVouchers: recentVouchers.results || [],
  });
});

export default giftVoucherRoutes;
