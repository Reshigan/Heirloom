/**
 * Gift Voucher Routes for Heirloom
 * 
 * Allows users to purchase subscription gift vouchers for others.
 * Includes admin management capabilities.
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../index';
import { giftVoucherPurchaseEmail, giftVoucherReceivedEmail, giftVoucherRedeemedEmail } from '../email-templates';
import { sendEmail } from '../utils/email';

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
// Note: quarterly = 3 months at regular price (no discount)
const GIFT_PRICING: Record<string, Record<string, Record<string, number>>> = {
  USD: {
    STARTER: { quarterly: 300, yearly: 1000 },
    FAMILY: { quarterly: 1500, yearly: 5000 },
    FOREVER: { quarterly: 4500, yearly: 15000 },
  },
  ZAR: {
    STARTER: { quarterly: 5400, yearly: 18000 },
    FAMILY: { quarterly: 27000, yearly: 90000 },
    FOREVER: { quarterly: 81000, yearly: 270000 },
  },
  GBP: {
    STARTER: { quarterly: 237, yearly: 790 },
    FAMILY: { quarterly: 1197, yearly: 3990 },
    FOREVER: { quarterly: 3597, yearly: 11990 },
  },
  EUR: {
    STARTER: { quarterly: 297, yearly: 990 },
    FAMILY: { quarterly: 1497, yearly: 4990 },
    FOREVER: { quarterly: 4497, yearly: 14990 },
  },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', ZAR: 'R', GBP: '£', EUR: '€', CAD: 'C$', AUD: 'A$', INR: '₹',
};

// Admin authentication middleware for gift voucher admin routes
const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Admin authentication required' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  // Verify admin token from KV
  const adminSession = await c.env.KV.get(`admin:session:${token}`);
  if (!adminSession) {
    return c.json({ error: 'Invalid or expired admin session' }, 401);
  }
  
  const session = JSON.parse(adminSession);
  c.set('adminId', session.adminId);
  c.set('adminRole', session.role);
  
  await next();
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
        quarterly: { amount: prices.STARTER.quarterly / 100, display: `${symbol}${(prices.STARTER.quarterly / 100).toFixed(2)}` },
        yearly: { amount: prices.STARTER.yearly / 100, display: `${symbol}${(prices.STARTER.yearly / 100).toFixed(2)}`, savings: '2 months free' },
      },
      {
        id: 'FAMILY',
        name: 'Family',
        description: 'Most popular - ideal for families',
        storage: '5 GB',
        popular: true,
        quarterly: { amount: prices.FAMILY.quarterly / 100, display: `${symbol}${(prices.FAMILY.quarterly / 100).toFixed(2)}` },
        yearly: { amount: prices.FAMILY.yearly / 100, display: `${symbol}${(prices.FAMILY.yearly / 100).toFixed(2)}`, savings: '2 months free' },
      },
      {
        id: 'FOREVER',
        name: 'Forever',
        description: 'The ultimate legacy package',
        storage: '50 GB',
        quarterly: { amount: prices.FOREVER.quarterly / 100, display: `${symbol}${(prices.FOREVER.quarterly / 100).toFixed(2)}` },
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
  const validCycles = ['quarterly', 'yearly'];
  
  if (!validTiers.includes(tier.toUpperCase())) {
    return c.json({ error: 'Invalid tier' }, 400);
  }
  
  if (!validCycles.includes(billingCycle.toLowerCase())) {
    return c.json({ error: 'Invalid billing cycle' }, 400);
  }
  
  const prices = GIFT_PRICING[currency.toUpperCase()] || GIFT_PRICING.USD;
  const amount = prices[tier.toUpperCase()][billingCycle.toLowerCase()];
  const durationMonths = billingCycle.toLowerCase() === 'yearly' ? 12 : 3; // quarterly = 3 months
  
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
           recipient_name, recipient_message, purchaser_name, voucher_type, gold_member_number
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
  
  const isGoldLegacy = voucher.voucher_type === 'GOLD_LEGACY';
  
  return c.json({
    valid: true,
    voucher: {
      code: voucher.code,
      tier: isGoldLegacy ? 'GOLD_LEGACY' : voucher.tier,
      billingCycle: isGoldLegacy ? 'lifetime' : voucher.billing_cycle,
      durationMonths: isGoldLegacy ? 'lifetime' : voucher.duration_months,
      recipientName: voucher.recipient_name,
      recipientMessage: voucher.recipient_message,
      fromName: voucher.purchaser_name,
      expiresAt: voucher.expires_at,
      isGoldLegacy,
      memberNumber: isGoldLegacy ? voucher.gold_member_number : null,
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
  
  // Check if this is a Gold Legacy voucher (lifetime access)
  const isGoldLegacy = voucher.voucher_type === 'GOLD_LEGACY';
  
  // Check if user already has an active subscription
  const existingSub = await c.env.DB.prepare(`
    SELECT * FROM subscriptions WHERE user_id = ? AND status IN ('ACTIVE', 'TRIALING')
  `).bind(userId).first();
  
  // Calculate subscription period
  const now = new Date();
  const periodEnd = new Date(now);
  
  if (isGoldLegacy) {
    // Gold Legacy = lifetime access (100 years)
    periodEnd.setFullYear(periodEnd.getFullYear() + 100);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + (voucher.duration_months as number));
  }
  
  try {
    if (isGoldLegacy) {
      // Gold Legacy: Set lifetime access flag on user and create/update subscription
      await c.env.DB.prepare(`
        UPDATE users SET gold_legacy_member = 1, gold_member_number = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(voucher.gold_member_number || null, userId).run();
      
      if (existingSub) {
        // Upgrade to Gold Legacy
        await c.env.DB.prepare(`
          UPDATE subscriptions 
          SET tier = 'FOREVER', billing_cycle = 'lifetime', current_period_end = ?, status = 'ACTIVE', updated_at = datetime('now')
          WHERE user_id = ?
        `).bind(periodEnd.toISOString(), userId).run();
      } else {
        // Create Gold Legacy subscription
        await c.env.DB.prepare(`
          INSERT INTO subscriptions (user_id, tier, status, billing_cycle, current_period_start, current_period_end)
          VALUES (?, 'FOREVER', 'ACTIVE', 'lifetime', ?, ?)
        `).bind(userId, now.toISOString(), periodEnd.toISOString()).run();
      }
    } else {
      // Regular voucher redemption
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
      if (isGoldLegacy) {
        // Special Gold Legacy welcome email
        const goldWelcomeHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Georgia', serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; padding: 40px 0; border-bottom: 1px solid rgba(212, 175, 55, 0.3);">
      <div style="font-size: 48px; color: #D4AF37; margin-bottom: 10px;">∞</div>
      <h1 style="color: #D4AF37; font-size: 28px; font-weight: 300; letter-spacing: 4px; margin: 0;">
        WELCOME TO GOLD LEGACY
      </h1>
    </div>
    
    <div style="padding: 40px 0; text-align: center;">
      <h2 style="color: #f5f5f0; font-size: 24px; font-weight: 300; margin-bottom: 20px;">
        ${user.first_name ? `Dear ${user.first_name},` : 'Dear Member,'}
      </h2>
      <p style="color: rgba(245, 245, 240, 0.8); font-size: 16px; line-height: 1.8;">
        Your Gold Legacy membership is now active. You have lifetime access to all Heirloom features.
      </p>
      ${voucher.gold_member_number ? `
      <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 12px; padding: 20px; margin: 30px 0; display: inline-block;">
        <p style="color: rgba(245, 245, 240, 0.6); font-size: 12px; margin: 0 0 5px 0;">MEMBER NUMBER</p>
        <p style="color: #D4AF37; font-size: 20px; font-family: monospace; margin: 0;">${voucher.gold_member_number}</p>
      </div>
      ` : ''}
    </div>
    
    <div style="text-align: center; padding: 20px 0;">
      <a href="https://heirloom.blue/dashboard" 
         style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: #0a0a0f; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
        START YOUR LEGACY
      </a>
    </div>
    
    <div style="text-align: center; padding-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 40px;">
      <p style="color: #D4AF37; font-size: 11px; letter-spacing: 2px;">
        HEIRLOOM GOLD LEGACY — YOUR MEMORIES, FOREVER
      </p>
    </div>
  </div>
</body>
</html>`;
        
        await sendEmail(c.env, {
          from: 'Heirloom Gold Legacy <noreply@heirloom.blue>',
          to: user.email as string,
          subject: 'Welcome to Heirloom Gold Legacy',
          html: goldWelcomeHtml,
        }, 'GOLD_LEGACY_WELCOME');
      } else {
        const emailContent = giftVoucherRedeemedEmail(
          user.first_name as string || 'there',
          voucher.tier as string,
          voucher.duration_months as number
        );
        
        await sendEmail(c.env, {
          from: 'Heirloom <noreply@heirloom.blue>',
          to: user.email as string,
          subject: emailContent.subject,
          html: emailContent.html,
        }, 'VOUCHER_REDEEMED');
      }
    }
    
    return c.json({
      success: true,
      message: isGoldLegacy ? 'Welcome to Gold Legacy! Your lifetime access is now active.' : 'Gift voucher redeemed successfully!',
      subscription: {
        tier: isGoldLegacy ? 'GOLD_LEGACY' : voucher.tier,
        durationMonths: isGoldLegacy ? 'lifetime' : voucher.duration_months,
        periodEnd: periodEnd.toISOString(),
        isGoldLegacy,
        memberNumber: isGoldLegacy ? voucher.gold_member_number : null,
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
  const emailContent = giftVoucherReceivedEmail(
    recipientName || 'Friend',
    voucher.purchaser_name as string || 'Someone special',
    voucher.code as string,
    voucher.tier as string,
    voucher.duration_months as number,
    recipientMessage || null
  );
  
  await sendEmail(c.env, {
    from: 'Heirloom <noreply@heirloom.blue>',
    to: recipientEmail,
    subject: emailContent.subject,
    html: emailContent.html,
  }, 'VOUCHER_GIFT_SENT');
  
  // Log to voucher-specific email table as well
  await c.env.DB.prepare(`
    INSERT INTO gift_voucher_emails (voucher_id, email_type, recipient_email)
    VALUES (?, 'GIFT_SENT', ?)
  `).bind(voucherId, recipientEmail).run();
  
  return c.json({ success: true, message: 'Gift voucher sent to recipient!' });
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Get all vouchers (admin)
giftVoucherRoutes.get('/admin/all', adminAuth, async (c) => {
  const adminId = c.get('adminId');
  
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
giftVoucherRoutes.get('/admin/:id', adminAuth, async (c) => {
  const adminId = c.get('adminId');
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
giftVoucherRoutes.post('/admin/create', adminAuth, async (c) => {
  const adminId = c.get('adminId');
  const body = await c.req.json();
  const { tier, billingCycle, durationMonths, recipientEmail, recipientName, notes, sendEmail: shouldSendEmail } = body;
  
  if (!tier || !billingCycle) {
    return c.json({ error: 'Tier and billing cycle required' }, 400);
  }
  
  const voucherCode = generateVoucherCode();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  
  const duration = durationMonths || (billingCycle === 'yearly' ? 12 : 1);
  const status = shouldSendEmail && recipientEmail ? 'SENT' : 'PAID';
  
  const result = await c.env.DB.prepare(`
    INSERT INTO gift_vouchers (
      code, purchaser_email, purchaser_name, tier, billing_cycle, duration_months,
      amount, currency, status, expires_at, recipient_email, recipient_name,
      admin_notes, created_by_admin_id, sent_at
    ) VALUES (?, 'admin@heirloom.blue', 'Heirloom Team', ?, ?, ?, 0, 'USD', ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    voucherCode,
    tier.toUpperCase(),
    billingCycle.toLowerCase(),
    duration,
    status,
    expiresAt.toISOString(),
    recipientEmail || null,
    recipientName || null,
    notes || null,
    adminId,
    shouldSendEmail && recipientEmail ? new Date().toISOString() : null
  ).run();
  
  // Send email if requested
  if (shouldSendEmail && recipientEmail) {
    const emailContent = giftVoucherReceivedEmail(
      recipientName || 'Friend',
      'Heirloom Team',
      voucherCode,
      tier.toUpperCase(),
      duration,
      null
    );
    
    await sendEmail(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    }, 'ADMIN_VOUCHER_CREATED');
    
    // Log to voucher-specific email table as well
    await c.env.DB.prepare(`
      INSERT INTO gift_voucher_emails (voucher_id, email_type, recipient_email)
      VALUES ((SELECT id FROM gift_vouchers WHERE code = ?), 'GIFT_SENT', ?)
    `).bind(voucherCode, recipientEmail).run();
  }
  
  return c.json({
    success: true,
    voucher: {
      code: voucherCode,
      tier: tier.toUpperCase(),
      billingCycle: billingCycle.toLowerCase(),
      durationMonths: duration,
      expiresAt: expiresAt.toISOString(),
      emailSent: shouldSendEmail && recipientEmail,
    },
  });
});

// Update voucher (admin)
giftVoucherRoutes.patch('/admin/:id', adminAuth, async (c) => {
  const adminId = c.get('adminId');
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
giftVoucherRoutes.post('/admin/:id/resend', adminAuth, async (c) => {
  const adminId = c.get('adminId');
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
  
  const emailContent = giftVoucherReceivedEmail(
    voucher.recipient_name as string || 'Friend',
    voucher.purchaser_name as string || 'Someone special',
    voucher.code as string,
    voucher.tier as string,
    voucher.duration_months as number,
    voucher.recipient_message as string || null
  );
  
  await sendEmail(c.env, {
    from: 'Heirloom <noreply@heirloom.blue>',
    to: voucher.recipient_email as string,
    subject: emailContent.subject,
    html: emailContent.html,
  }, 'VOUCHER_RESENT');
  
  // Log to voucher-specific email table as well
  await c.env.DB.prepare(`
    INSERT INTO gift_voucher_emails (voucher_id, email_type, recipient_email)
    VALUES (?, 'GIFT_SENT', ?)
  `).bind(voucherId, voucher.recipient_email).run();
  
  return c.json({ success: true, message: 'Email resent to recipient' });
});

// =============================================================================
// GOLD LEGACY VOUCHER - EXCLUSIVE LIFETIME ACCESS
// =============================================================================

// Generate special Gold Legacy voucher code
function generateGoldLegacyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GOLD-';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 2) code += '-';
  }
  return code;
}

// Create Gold Legacy Voucher (admin only - exclusive lifetime access)
giftVoucherRoutes.post('/admin/gold-legacy/create', adminAuth, async (c) => {
  try {
  const adminId = c.get('adminId');
  const body = await c.req.json();
  const { recipientEmail, recipientName, personalMessage, memberNumber, sendEmail: shouldSendGoldEmail } = body;
  
  // Generate unique Gold Legacy code
  const voucherCode = generateGoldLegacyCode();
  
  // Gold Legacy vouchers never expire
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 100); // 100 years = effectively never
  
  // Generate member number if not provided
  const goldMemberNumber = memberNumber || `G-${String(Date.now()).slice(-6)}`;
  
  // Default personal message from Heirloom
  const defaultMessage = `Welcome to the Heirloom Gold Legacy Circle.

You have been personally selected to join an exclusive group of individuals who understand the profound importance of preserving memories for generations to come.

As a Gold Legacy member, you receive lifetime access to all Heirloom features, forever. Your stories, your voice, your memories will be preserved for eternity.

This is more than a subscription—it is an invitation to be part of something timeless.

With deepest gratitude,
The Heirloom Team`;

  const finalMessage = personalMessage || defaultMessage;
  const status = shouldSendGoldEmail && recipientEmail ? 'SENT' : 'PAID';
  
  await c.env.DB.prepare(`
    INSERT INTO gift_vouchers (
      code, purchaser_email, purchaser_name, tier, billing_cycle, duration_months,
      amount, currency, status, expires_at, recipient_email, recipient_name,
      recipient_message, admin_notes, created_by_admin_id, sent_at, voucher_type, gold_member_number
    ) VALUES (?, 'admin@heirloom.blue', 'Heirloom', 'FOREVER', 'yearly', 9999, 0, 'USD', ?, ?, ?, ?, ?, ?, ?, ?, 'GOLD_LEGACY', ?)
  `).bind(
    voucherCode,
    status,
    expiresAt.toISOString(),
    recipientEmail || null,
    recipientName || null,
    finalMessage,
    `Gold Legacy Voucher - Member #${goldMemberNumber}`,
    adminId,
    shouldSendGoldEmail && recipientEmail ? new Date().toISOString() : null,
    goldMemberNumber
  ).run();
  
  // Send special Gold Legacy invitation email if requested
  let emailSentSuccess = false;
  if (shouldSendGoldEmail && recipientEmail) {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Georgia', serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Gold Header -->
    <div style="text-align: center; padding: 40px 0; border-bottom: 1px solid rgba(212, 175, 55, 0.3);">
      <div style="font-size: 48px; color: #D4AF37; margin-bottom: 10px;">∞</div>
      <h1 style="color: #D4AF37; font-size: 28px; font-weight: 300; letter-spacing: 4px; margin: 0;">
        HEIRLOOM
      </h1>
      <p style="color: rgba(212, 175, 55, 0.7); font-size: 12px; letter-spacing: 3px; margin-top: 8px;">
        GOLD LEGACY CIRCLE
      </p>
    </div>
    
    <!-- Invitation -->
    <div style="padding: 40px 0; text-align: center;">
      <h2 style="color: #f5f5f0; font-size: 24px; font-weight: 300; margin-bottom: 20px;">
        ${recipientName ? `Dear ${recipientName},` : 'Dear Friend,'}
      </h2>
      <p style="color: rgba(245, 245, 240, 0.8); font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
        You have been invited to join the exclusive
      </p>
      <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 12px; padding: 30px; margin: 30px 0;">
        <h3 style="color: #D4AF37; font-size: 20px; font-weight: 400; letter-spacing: 2px; margin: 0 0 15px 0;">
          GOLD LEGACY MEMBERSHIP
        </h3>
        <p style="color: rgba(245, 245, 240, 0.6); font-size: 14px; margin: 0;">
          Member Number: <span style="color: #D4AF37; font-family: monospace;">${goldMemberNumber}</span>
        </p>
      </div>
    </div>
    
    <!-- Personal Message -->
    <div style="background: rgba(255, 255, 255, 0.02); border-left: 2px solid #D4AF37; padding: 25px; margin: 30px 0;">
      <p style="color: rgba(245, 245, 240, 0.9); font-size: 15px; line-height: 1.9; white-space: pre-line; margin: 0; font-style: italic;">
${finalMessage}
      </p>
    </div>
    
    <!-- Voucher Code -->
    <div style="text-align: center; padding: 30px 0;">
      <p style="color: rgba(245, 245, 240, 0.6); font-size: 12px; letter-spacing: 2px; margin-bottom: 15px;">
        YOUR EXCLUSIVE ACCESS CODE
      </p>
      <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); border-radius: 8px; padding: 20px 30px; display: inline-block;">
        <span style="color: #0a0a0f; font-size: 24px; font-family: monospace; letter-spacing: 3px; font-weight: bold;">
          ${voucherCode}
        </span>
      </div>
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center; padding: 20px 0;">
      <a href="https://heirloom.blue/gold/redeem?code=${voucherCode}" 
         style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: #0a0a0f; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
        ACCEPT INVITATION
      </a>
    </div>
    
    <!-- Benefits -->
    <div style="border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 30px; margin-top: 30px;">
      <h4 style="color: #D4AF37; font-size: 14px; letter-spacing: 2px; text-align: center; margin-bottom: 20px;">
        GOLD LEGACY BENEFITS
      </h4>
      <ul style="color: rgba(245, 245, 240, 0.7); font-size: 14px; line-height: 2; padding-left: 20px;">
        <li>Lifetime access to all Heirloom features</li>
        <li>Unlimited memory storage</li>
        <li>Priority support</li>
        <li>Exclusive Gold Legacy badge</li>
        <li>Early access to new features</li>
      </ul>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 40px;">
      <p style="color: rgba(245, 245, 240, 0.4); font-size: 12px;">
        This invitation is exclusively for you and cannot be transferred.
      </p>
      <p style="color: #D4AF37; font-size: 11px; letter-spacing: 2px; margin-top: 20px;">
        HEIRLOOM — YOUR MEMORIES, FOREVER
      </p>
    </div>
  </div>
</body>
</html>`;
    
    const emailResult = await sendEmail(c.env, {
      from: 'Heirloom Gold Legacy <noreply@heirloom.blue>',
      to: recipientEmail,
      subject: `You've Been Invited to the Heirloom Gold Legacy Circle`,
      html: emailHtml,
    }, 'GOLD_LEGACY_INVITATION');
    emailSentSuccess = emailResult.success;
  }
  
  return c.json({
    success: true,
    voucher: {
      code: voucherCode,
      type: 'GOLD_LEGACY',
      memberNumber: goldMemberNumber,
      recipientEmail,
      recipientName,
      personalMessage: finalMessage,
      emailSent: emailSentSuccess,
      emailAttempted: shouldSendGoldEmail && !!recipientEmail,
    },
  });
  } catch (error) {
    console.error('Gold Legacy create error:', error);
    return c.json({ error: 'Failed to create Gold Legacy voucher', details: String(error) }, 500);
  }
});

// Get all Gold Legacy vouchers (admin)
giftVoucherRoutes.get('/admin/gold-legacy/all', adminAuth, async (c) => {
  const vouchers = await c.env.DB.prepare(`
    SELECT gv.*, u.email as redeemer_email, u.first_name as redeemer_name
    FROM gift_vouchers gv
    LEFT JOIN users u ON gv.redeemed_by_user_id = u.id
    WHERE gv.voucher_type = 'GOLD_LEGACY'
    ORDER BY gv.created_at DESC
  `).all();
  
  return c.json({
    vouchers: vouchers.results || [],
    total: vouchers.results?.length || 0,
  });
});

// Get voucher stats (admin)
giftVoucherRoutes.get('/admin/stats', adminAuth, async (c) => {
  const adminId = c.get('adminId');
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
