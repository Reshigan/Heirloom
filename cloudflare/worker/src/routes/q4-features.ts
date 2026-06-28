/**
 * Q4 2025 Features Routes
 * Weekly Challenges, Gift Subscriptions, QR Memorials, Milestone Alerts
 */

import { Hono } from 'hono';
import type { AppEnv, Env } from '../index';
import { sendEmail } from '../utils/email';
import { giftSubscriptionPurchaseEmail, giftSubscriptionReceivedEmail, giftSubscriptionRedeemedEmail } from '../email-templates';

// ============================================
// WEEKLY CHALLENGES ROUTES
// ============================================

export const challengesRoutes = new Hono<AppEnv>();

// Get current and upcoming challenges
challengesRoutes.get('/', async (c) => {
  const nowDate = new Date().toISOString().slice(0, 10);

  const challenges = await c.env.DB.prepare(`
    SELECT * FROM weekly_challenges
    WHERE end_date >= ?
    ORDER BY start_date ASC
    LIMIT 8
  `).bind(nowDate).all();

  return c.json(challenges.results);
});

// Get current active challenge
challengesRoutes.get('/current', async (c) => {
  const now = new Date().toISOString();
  
  const nowDate = now.slice(0, 10); // YYYY-MM-DD for date comparison
  const challenge = await c.env.DB.prepare(`
    SELECT * FROM weekly_challenges
    WHERE start_date <= ? AND end_date >= ?
    ORDER BY start_date DESC
    LIMIT 1
  `).bind(nowDate, nowDate).first();
  
  if (!challenge) {
    return c.json({ message: 'No active challenge' }, 404);
  }
  
  // Get submission count
  const stats = await c.env.DB.prepare(`
    SELECT COUNT(*) as submissions, SUM(social_shares) as totalShares
    FROM challenge_submissions WHERE challenge_id = ?
  `).bind(challenge.id).first();
  
  return c.json({
    ...challenge,
    submissionCount: stats?.submissions || 0,
    totalShares: stats?.totalShares || 0,
  });
});

// Get challenge submissions
challengesRoutes.get('/:id/submissions', async (c) => {
  const challengeId = c.req.param('id');
  
  const submissions = await c.env.DB.prepare(`
    SELECT cs.*, u.first_name, u.last_name, u.avatar_url
    FROM challenge_submissions cs
    JOIN users u ON cs.user_id = u.id
    WHERE cs.challenge_id = ?
    ORDER BY cs.likes DESC, cs.created_at DESC
    LIMIT 50
  `).bind(challengeId).all();
  
  return c.json(submissions.results);
});

// Submit to challenge
challengesRoutes.post('/:id/submit', async (c) => {
  const userId = c.get('userId');
  const challengeId = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  // Check if already submitted
  const existing = await c.env.DB.prepare(`
    SELECT id FROM challenge_submissions WHERE challenge_id = ? AND user_id = ?
  `).bind(challengeId, userId).first();
  
  if (existing) {
    return c.json({ error: 'Already submitted to this challenge' }, 400);
  }
  
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO challenge_submissions (id, challenge_id, user_id, memory_id, voice_id, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, challengeId, userId, body.memoryId, body.voiceId, body.content, now).run();
  
  return c.json({ id, success: true });
});

// Record social share
challengesRoutes.post('/submissions/:id/share', async (c) => {
  const submissionId = c.req.param('id');
  const body = await c.req.json();
  
  const platform = body.platform; // instagram, tiktok, facebook
  const column = `shared_to_${platform}`;
  
  await c.env.DB.prepare(`
    UPDATE challenge_submissions 
    SET social_shares = social_shares + 1, ${column} = 1
    WHERE id = ?
  `).bind(submissionId).run();
  
  return c.json({ success: true });
});

// ============================================
// GIFT SUBSCRIPTIONS ROUTES
// ============================================

export const giftRoutes = new Hono<AppEnv>();

// Base prices (Tier 1 USD)
const GIFT_BASE_PRICES: Record<string, { monthly: number; annual: number }> = {
  STARTER: { monthly: 4.99, annual: 49.99 },
  FAMILY:  { monthly: 9.99, annual: 99.99 },
  FOREVER: { monthly: 19.99, annual: 199.99 },
};
const GIFT_DISCOUNT = { monthly: 0.05, annual: 0.10 }; // 5% / 10%

function giftPrice(tier: string, period: 'monthly' | 'annual'): number {
  const base = GIFT_BASE_PRICES[tier];
  if (!base) return period === 'annual' ? 49.99 : 4.99;
  const discount = GIFT_DISCOUNT[period];
  return Math.round(base[period] * (1 - discount) * 100) / 100;
}

// Get gift subscription pricing
giftRoutes.get('/pricing', async (c) => {
  const tiers = Object.entries(GIFT_BASE_PRICES).map(([id, base]) => ({
    id,
    name: id.charAt(0) + id.slice(1).toLowerCase(),
    monthly: {
      regular: base.monthly,
      gift: giftPrice(id, 'monthly'),
      discountPct: 5,
      durationMonths: 1,
    },
    annual: {
      regular: base.annual,
      gift: giftPrice(id, 'annual'),
      discountPct: 10,
      durationMonths: 12,
    },
  }));
  return c.json({
    tiers,
    styles: ['classic', 'elegant', 'festive', 'birthday', 'anniversary'],
  });
});

// Purchase gift subscription
giftRoutes.post('/purchase', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const now = new Date().toISOString();

  const giftCode = `GIFT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const id = crypto.randomUUID();

  const billingPeriod: 'monthly' | 'annual' = body.billingPeriod === 'monthly' ? 'monthly' : 'annual';
  const durationMonths = billingPeriod === 'monthly' ? 1 : 12;
  const amount = giftPrice(body.tier, billingPeriod);
  
  await c.env.DB.prepare(`
    INSERT INTO gift_subscriptions (
      id, purchaser_id, purchaser_email, purchaser_name, recipient_email, recipient_name,
      gift_code, tier, duration_months, personal_message, gift_card_style,
      scheduled_delivery_date, amount_paid, currency, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).bind(
    id, userId, body.purchaserEmail, body.purchaserName,
    body.recipientEmail, body.recipientName, giftCode, body.tier,
    durationMonths, body.personalMessage, body.style || 'classic',
    body.scheduledDeliveryDate, amount * 100, body.currency || 'USD', now
  ).run();
  
  const redeemUrl = `https://heirloom.blue/gift/redeem?code=${giftCode}`;
  const tierName = body.tier.charAt(0) + body.tier.slice(1).toLowerCase();

  // Send purchase confirmation to purchaser
  const purchaseTemplate = giftSubscriptionPurchaseEmail(
    body.purchaserName,
    body.recipientName,
    body.recipientEmail,
    tierName,
    amount,
    billingPeriod,
    giftCode,
    body.personalMessage,
    body.scheduledDeliveryDate,
  );
  await sendEmail(
    c.env,
    {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: body.purchaserEmail,
      subject: purchaseTemplate.subject,
      html: purchaseTemplate.html,
    },
    'gift_subscription_purchase',
  );

  // If no scheduled date, deliver immediately
  if (!body.scheduledDeliveryDate) {
    // Send gift notification to recipient (if no scheduled date, send now)
    const receivedTemplate = giftSubscriptionReceivedEmail(
      body.recipientName,
      body.purchaserName,
      tierName,
      billingPeriod,
      giftCode,
      redeemUrl,
      body.personalMessage,
    );
    await sendEmail(
      c.env,
      {
        from: 'Heirloom <noreply@heirloom.blue>',
        to: body.recipientEmail,
        subject: receivedTemplate.subject,
        html: receivedTemplate.html,
      },
      'gift_subscription_received',
    );

    await c.env.DB.prepare(`
      UPDATE gift_subscriptions SET status = 'delivered', delivered_at = ? WHERE id = ?
    `).bind(now, id).run();
  }

  return c.json({
    id,
    giftCode,
    redeemUrl,
  });
});

// Redeem gift subscription
giftRoutes.post('/redeem', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  const gift = await c.env.DB.prepare(`
    SELECT * FROM gift_subscriptions WHERE gift_code = ? AND status IN ('pending', 'delivered')
  `).bind(body.giftCode).first();
  
  if (!gift) {
    return c.json({ error: 'Invalid or already redeemed gift code' }, 400);
  }
  
  // Update gift status
  await c.env.DB.prepare(`
    UPDATE gift_subscriptions SET status = 'redeemed', redeemed_at = ?, redeemed_by_user_id = ? WHERE id = ?
  `).bind(now, userId, gift.id).run();
  
  // Create/update subscription
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + (gift.duration_months as number));
  
  await c.env.DB.prepare(`
    INSERT INTO subscriptions (id, user_id, tier, status, current_period_start, current_period_end, created_at, updated_at)
    VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      tier = excluded.tier,
      status = 'ACTIVE',
      current_period_end = excluded.current_period_end,
      updated_at = excluded.updated_at
  `).bind(crypto.randomUUID(), userId, gift.tier, now, endDate.toISOString(), now, now).run();
  
  // Notify purchaser
  if (gift.purchaser_id) {
    await c.env.DB.prepare(`
      INSERT INTO user_notifications (id, user_id, notification_type, title, message, created_at)
      VALUES (?, ?, 'gift_redeemed', ?, ?, ?)
    `).bind(
      crypto.randomUUID(), gift.purchaser_id,
      'Your Gift Was Redeemed!',
      `${gift.recipient_name || 'The recipient'} has redeemed your Heirloom gift subscription!`,
      now
    ).run();
  }

  // Send redemption confirmation email to the redeemer
  try {
    const redeemerUser = await c.env.DB.prepare('SELECT email, first_name FROM users WHERE id = ?').bind(userId).first();
    if (redeemerUser) {
      const tierName = (gift.tier as string).charAt(0) + (gift.tier as string).slice(1).toLowerCase();
      const redeemedTemplate = giftSubscriptionRedeemedEmail(
        (redeemerUser as any).first_name || 'there',
        tierName,
        gift.duration_months as number,
        endDate.toISOString(),
      );
      await sendEmail(c.env, {
        from: 'Heirloom <noreply@heirloom.blue>',
        to: (redeemerUser as any).email,
        subject: redeemedTemplate.subject,
        html: redeemedTemplate.html,
      }, 'GIFT_SUBSCRIPTION_REDEEMED');
    }
  } catch (err) {
    console.error('Failed to send gift redemption confirmation email:', err);
  }

  return c.json({
    success: true,
    tier: gift.tier,
    expiresAt: endDate.toISOString(),
  });
});

// Get user's purchased gifts
giftRoutes.get('/purchased', async (c) => {
  const userId = c.get('userId');
  
  const gifts = await c.env.DB.prepare(`
    SELECT * FROM gift_subscriptions WHERE purchaser_id = ? ORDER BY created_at DESC
  `).bind(userId).all();
  
  return c.json(gifts.results);
});

// ============================================
// QR MEMORIAL CODES ROUTES
// ============================================

/**
 * Auto-convert a deceased user's profile into a memorial.
 *
 * Called from the death-confirmation path (deadman.ts /verify/:token). Creates a
 * row in qr_memorial_codes using the SAME table + columns as the manual POST '/'
 * handler below. Idempotent: if any memorial already exists for this user, it
 * returns the existing id without creating a duplicate — re-confirming a death
 * (or a re-POST of the token) never spawns a second memorial.
 */
export async function createMemorialForUser(
  env: Env,
  userId: string,
): Promise<{ id: string; qrCode: string; created: boolean }> {
  // Idempotency guard — a memorial already exists for this user.
  const existing = await env.DB.prepare(`
    SELECT id, qr_code FROM qr_memorial_codes WHERE user_id = ? ORDER BY created_at ASC LIMIT 1
  `).bind(userId).first();

  if (existing) {
    return { id: existing.id as string, qrCode: existing.qr_code as string, created: false };
  }

  // Derive a memorial name from the user's profile (memorial_name is NOT NULL).
  const user = await env.DB.prepare(`
    SELECT first_name, last_name FROM users WHERE id = ?
  `).bind(userId).first<{ first_name: string | null; last_name: string | null }>();

  const memorialName =
    `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'In Loving Memory';

  const id = crypto.randomUUID();
  const qrCode = `MEM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const shortUrl = `hlm.blue/m/${qrCode}`;
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO qr_memorial_codes (
      id, user_id, family_member_id, memorial_name, memorial_description,
      qr_code, short_url, design_style, is_public, birth_date, death_date,
      location, epitaph, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, userId, null, memorialName, null,
    qrCode, shortUrl, 'classic', 0, null, now,
    null, null, now, now,
  ).run();

  return { id, qrCode, created: true };
}

export const memorialRoutes = new Hono<AppEnv>();

// Get user's memorial codes
memorialRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  
  const memorials = await c.env.DB.prepare(`
    SELECT qm.*, fm.name as family_member_name
    FROM qr_memorial_codes qm
    LEFT JOIN family_members fm ON qm.family_member_id = fm.id
    WHERE qm.user_id = ?
    ORDER BY qm.created_at DESC
  `).bind(userId).all();
  
  return c.json(memorials.results);
});

// Create memorial code
memorialRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const now = new Date().toISOString();

  // name is the only required field (mirrors the modal's submit guard).
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return c.json({ error: 'A name is required.' }, 400);

  const id = crypto.randomUUID();
  const qrCode = `MEM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const shortUrl = `hlm.blue/m/${qrCode}`;

  // D1 .bind() rejects `undefined` ("Type 'undefined' not supported") — the
  // modal never sends familyMemberId and may omit optional fields, so coerce
  // every nullable column to `null`. Empty strings stay as-is (valid TEXT).
  await c.env.DB.prepare(`
    INSERT INTO qr_memorial_codes (
      id, user_id, family_member_id, memorial_name, memorial_description,
      qr_code, short_url, design_style, is_public, birth_date, death_date,
      location, epitaph, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, userId, body.familyMemberId ?? null, name, body.description ?? null,
    qrCode, shortUrl, body.style || 'classic', body.isPublic ? 1 : 0,
    body.birthDate ?? null, body.deathDate ?? null, body.location ?? null, body.epitaph ?? null, now, now
  ).run();
  
  return c.json({
    id,
    qrCode,
    shortUrl: `https://${shortUrl}`,
    qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://${shortUrl}`,
  });
});

// Get memorial page (public)
memorialRoutes.get('/page/:code', async (c) => {
  const code = c.req.param('code');
  
  const memorial = await c.env.DB.prepare(`
    SELECT qm.*, fm.name as family_member_name, fm.avatar_url as family_member_avatar
    FROM qr_memorial_codes qm
    LEFT JOIN family_members fm ON qm.family_member_id = fm.id
    WHERE qm.qr_code = ?
  `).bind(code).first();
  
  if (!memorial) {
    return c.json({ error: 'Memorial not found' }, 404);
  }
  
  // Increment view count
  await c.env.DB.prepare(`
    UPDATE qr_memorial_codes SET view_count = view_count + 1, last_viewed_at = ? WHERE id = ?
  `).bind(new Date().toISOString(), memorial.id).run();
  
  // Get content
  const content = await c.env.DB.prepare(`
    SELECT * FROM memorial_page_content 
    WHERE memorial_id = ? AND is_approved = 1
    ORDER BY display_order, created_at DESC
  `).bind(memorial.id).all();
  
  // Notify owner of view (if significant)
  const viewCount = (memorial.view_count as number) + 1;
  if ([10, 50, 100, 500, 1000].includes(viewCount)) {
    await c.env.DB.prepare(`
      INSERT INTO user_notifications (id, user_id, notification_type, title, message, action_url, created_at)
      VALUES (?, ?, 'memorial_view', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), memorial.user_id,
      `Memorial Milestone: ${viewCount} Views`,
      `${memorial.memorial_name}'s memorial page has been viewed ${viewCount} times.`,
      `/memorials/${memorial.id}`,
      new Date().toISOString()
    ).run();
  }
  
  return c.json({
    ...memorial,
    content: content.results,
  });
});

// Add tribute to memorial
memorialRoutes.post('/page/:code/tribute', async (c) => {
  const code = c.req.param('code');
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  const memorial = await c.env.DB.prepare(`
    SELECT id, user_id, memorial_name FROM qr_memorial_codes WHERE qr_code = ?
  `).bind(code).first();
  
  if (!memorial) {
    return c.json({ error: 'Memorial not found' }, 404);
  }

  // Public route — name/email are optional on the tribute form. Coerce every
  // nullable bind to null; an omitted value would otherwise reach D1 as
  // `undefined` and throw D1_TYPE_ERROR → 500 for an anonymous visitor.
  if (!body.message) {
    return c.json({ error: 'A tribute message is required' }, 400);
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO memorial_page_content (
      id, memorial_id, content_type, content_text, submitted_by_name, submitted_by_email, created_at
    ) VALUES (?, ?, 'tribute', ?, ?, ?, ?)
  `).bind(id, memorial.id, body.message, body.name ?? null, body.email ?? null, now).run();
  
  // Notify owner
  await c.env.DB.prepare(`
    INSERT INTO user_notifications (id, user_id, notification_type, title, message, action_url, created_at)
    VALUES (?, ?, 'memorial_tribute', ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(), memorial.user_id,
    'New Tribute Received',
    `${body.name || 'Someone'} left a tribute on ${memorial.memorial_name}'s memorial page.`,
    `/memorials/${memorial.id}`,
    now
  ).run();
  
  return c.json({ id, success: true });
});

// ============================================
// MILESTONE ALERTS ROUTES
// ============================================

export const milestonesRoutes = new Hono<AppEnv>();

// Get user's milestones
milestonesRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  
  const milestones = await c.env.DB.prepare(`
    SELECT ma.*, fm.name as family_member_name
    FROM milestone_alerts ma
    LEFT JOIN family_members fm ON ma.family_member_id = fm.id
    WHERE ma.user_id = ? AND ma.is_active = 1
    ORDER BY ma.milestone_date ASC
  `).bind(userId).all();
  
  return c.json(milestones.results);
});

// Get upcoming milestones (next 30 days)
milestonesRoutes.get('/upcoming', async (c) => {
  const userId = c.get('userId');
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  // Get milestones that fall within next 30 days (accounting for recurring)
  const milestones = await c.env.DB.prepare(`
    SELECT ma.*, fm.name as family_member_name
    FROM milestone_alerts ma
    LEFT JOIN family_members fm ON ma.family_member_id = fm.id
    WHERE ma.user_id = ? AND ma.is_active = 1
    ORDER BY ma.milestone_date ASC
  `).bind(userId).all();
  
  // Filter to upcoming (handle recurring dates)
  const upcoming = milestones.results.filter((m: any) => {
    const date = new Date(m.milestone_date);
    // For recurring, check if this year's date is upcoming
    if (m.recurring) {
      const thisYear = new Date(now.getFullYear(), date.getMonth(), date.getDate());
      if (thisYear < now) {
        thisYear.setFullYear(thisYear.getFullYear() + 1);
      }
      return thisYear <= thirtyDaysFromNow;
    }
    return date >= now && date <= thirtyDaysFromNow;
  });
  
  return c.json(upcoming);
});

// Create milestone
milestonesRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const now = new Date().toISOString();

  // Required fields. familyMemberId is optional (a milestone can stand alone,
  // e.g. an anniversary) — but it must be coerced to null at the bind layer, or
  // an omitted value reaches D1 as `undefined` and throws D1_TYPE_ERROR → 500.
  if (!body.name || !body.date) {
    return c.json({ error: 'Milestone name and date are required' }, 400);
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO milestone_alerts (
      id, user_id, family_member_id, milestone_type, milestone_name,
      milestone_date, recurring, reminder_days_before, prompt_suggestion, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, userId, body.familyMemberId ?? null, body.type || 'birthday', body.name,
    body.date, body.recurring ? 1 : 0, body.reminderDays || 7,
    body.promptSuggestion ?? null, now
  ).run();

  return c.json({ id, success: true });
});

// Auto-detect milestones from memories
milestonesRoutes.post('/auto-detect', async (c) => {
  const userId = c.get('userId');
  const now = new Date().toISOString();
  
  // Get family members with birth dates
  const family = await c.env.DB.prepare(`
    SELECT id, name, birth_date, relationship FROM family_members 
    WHERE user_id = ? AND birth_date IS NOT NULL
  `).bind(userId).all();
  
  const created: string[] = [];
  
  for (const member of family.results as any[]) {
    // Check if birthday milestone already exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM milestone_alerts 
      WHERE user_id = ? AND family_member_id = ? AND milestone_type = 'birthday'
    `).bind(userId, member.id).first();
    
    if (!existing) {
      const id = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO milestone_alerts (
          id, user_id, family_member_id, milestone_type, milestone_name,
          milestone_date, recurring, reminder_days_before, prompt_suggestion, created_at
        ) VALUES (?, ?, ?, 'birthday', ?, ?, 1, 7, ?, ?)
      `).bind(
        id, userId, member.id, `${member.name}'s Birthday`,
        member.birth_date,
        `Share a favorite memory of ${member.name} or record a birthday message!`,
        now
      ).run();
      created.push(member.name);
    }
  }
  
  return c.json({ 
    success: true, 
    created: created.length,
    names: created,
  });
});

// Delete milestone
milestonesRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  await c.env.DB.prepare(`
    DELETE FROM milestone_alerts WHERE id = ? AND user_id = ?
  `).bind(id, userId).run();
  
  return c.json({ success: true });
});

// ============================================
// USER NOTIFICATIONS ROUTES
// ============================================

export const notificationsRoutes = new Hono<AppEnv>();

// Get user notifications
notificationsRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const limit = parseInt(c.req.query('limit') || '20');
  const unreadOnly = c.req.query('unread') === 'true';
  
  let query = `
    SELECT * FROM user_notifications 
    WHERE user_id = ?
  `;
  
  if (unreadOnly) {
    query += ' AND is_read = 0';
  }
  
  query += ' ORDER BY created_at DESC LIMIT ?';
  
  const notifications = await c.env.DB.prepare(query).bind(userId, limit).all();
  
  const unreadCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = 0
  `).bind(userId).first();
  
  return c.json({
    notifications: notifications.results,
    unreadCount: unreadCount?.count || 0,
  });
});

// Mark notification as read
notificationsRoutes.patch('/:id/read', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  await c.env.DB.prepare(`
    UPDATE user_notifications SET is_read = 1 WHERE id = ? AND user_id = ?
  `).bind(id, userId).run();
  
  return c.json({ success: true });
});

// Mark all as read
notificationsRoutes.post('/read-all', async (c) => {
  const userId = c.get('userId');
  
  await c.env.DB.prepare(`
    UPDATE user_notifications SET is_read = 1 WHERE user_id = ?
  `).bind(userId).run();
  
  return c.json({ success: true });
});
