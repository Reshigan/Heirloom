/**
 * Q4 2025 Features Routes
 * Memory Streaks, Weekly Challenges, Family Referrals, Gift Subscriptions, QR Memorials, Milestone Alerts
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';

// ============================================
// MEMORY STREAKS ROUTES
// ============================================

export const streaksRoutes = new Hono<AppEnv>();

// Get user's streak status
streaksRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  
  let streak = await c.env.DB.prepare(`
    SELECT * FROM memory_streaks WHERE user_id = ?
  `).bind(userId).first();
  
  if (!streak) {
    // Create initial streak record
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await c.env.DB.prepare(`
      INSERT INTO memory_streaks (id, user_id, current_streak, longest_streak, total_memories_created, created_at, updated_at)
      VALUES (?, ?, 0, 0, 0, ?, ?)
    `).bind(id, userId, now, now).run();
    
    streak = { id, user_id: userId, current_streak: 0, longest_streak: 0, total_memories_created: 0 };
  }
  
  // Check if streak is still active (last activity within 24 hours)
  const lastActivity = streak.last_activity_date ? new Date(streak.last_activity_date as string) : null;
  const now = new Date();
  const hoursSinceActivity = lastActivity ? (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60) : Infinity;
  
  // Streak breaks after 48 hours (gives 24 hour grace period)
  const isStreakActive = hoursSinceActivity < 48;
  const canExtendStreak = hoursSinceActivity >= 24 && hoursSinceActivity < 48;
  
  return c.json({
    currentStreak: isStreakActive ? streak.current_streak : 0,
    longestStreak: streak.longest_streak,
    totalMemoriesCreated: streak.total_memories_created,
    lastActivityDate: streak.last_activity_date,
    streakStartedAt: streak.streak_started_at,
    isStreakActive,
    canExtendStreak,
    streakFrozenUntil: streak.streak_frozen_until,
  });
});

// Record activity (called when user creates memory/voice/letter)
streaksRoutes.post('/activity', async (c) => {
  const userId = c.get('userId');
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  const streak = await c.env.DB.prepare(`
    SELECT * FROM memory_streaks WHERE user_id = ?
  `).bind(userId).first();
  
  if (!streak) {
    return c.json({ error: 'Streak not initialized' }, 400);
  }
  
  const lastActivityDate = streak.last_activity_date ? (streak.last_activity_date as string).split('T')[0] : null;
  const hoursSinceActivity = streak.last_activity_date 
    ? (now.getTime() - new Date(streak.last_activity_date as string).getTime()) / (1000 * 60 * 60)
    : Infinity;
  
  let newStreak = streak.current_streak as number;
  let longestStreak = streak.longest_streak as number;
  let streakStartedAt = streak.streak_started_at;
  
  if (lastActivityDate === today) {
    // Already recorded activity today, just increment total
  } else if (hoursSinceActivity < 48) {
    // Within grace period, extend streak
    newStreak += 1;
    if (newStreak > longestStreak) {
      longestStreak = newStreak;
    }
  } else {
    // Streak broken, start new
    newStreak = 1;
    streakStartedAt = now.toISOString();
  }
  
  await c.env.DB.prepare(`
    UPDATE memory_streaks 
    SET current_streak = ?, longest_streak = ?, last_activity_date = ?, 
        streak_started_at = COALESCE(?, streak_started_at), 
        total_memories_created = total_memories_created + 1, updated_at = ?
    WHERE user_id = ?
  `).bind(newStreak, longestStreak, now.toISOString(), streakStartedAt, now.toISOString(), userId).run();
  
  // Check for milestone notifications
  const milestones = [7, 14, 30, 60, 100, 365];
  if (milestones.includes(newStreak)) {
    await c.env.DB.prepare(`
      INSERT INTO user_notifications (id, user_id, notification_type, title, message, action_url, created_at)
      VALUES (?, ?, 'streak_milestone', ?, ?, '/dashboard', ?)
    `).bind(
      crypto.randomUUID(), userId, 
      `${newStreak} Day Streak!`,
      `Amazing! You've maintained a ${newStreak}-day memory streak. Keep preserving those precious moments!`,
      now.toISOString()
    ).run();
  }
  
  return c.json({
    currentStreak: newStreak,
    longestStreak,
    isNewMilestone: milestones.includes(newStreak),
  });
});

// Freeze streak (costs money or watch ad)
streaksRoutes.post('/freeze', async (c) => {
  const userId = c.get('userId');
  const now = new Date();
  const freezeUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  
  await c.env.DB.prepare(`
    UPDATE memory_streaks SET streak_frozen_until = ?, updated_at = ? WHERE user_id = ?
  `).bind(freezeUntil, now.toISOString(), userId).run();
  
  return c.json({ success: true, frozenUntil: freezeUntil });
});

// ============================================
// WEEKLY CHALLENGES ROUTES
// ============================================

export const challengesRoutes = new Hono<AppEnv>();

// Get current and upcoming challenges
challengesRoutes.get('/', async (c) => {
  const now = new Date().toISOString();
  
  const challenges = await c.env.DB.prepare(`
    SELECT * FROM weekly_challenges 
    WHERE end_date >= ? 
    ORDER BY start_date ASC
    LIMIT 5
  `).bind(now).all();
  
  return c.json(challenges.results);
});

// Get current active challenge
challengesRoutes.get('/current', async (c) => {
  const now = new Date().toISOString();
  
  const challenge = await c.env.DB.prepare(`
    SELECT * FROM weekly_challenges 
    WHERE start_date <= ? AND end_date >= ? AND is_active = 1
    LIMIT 1
  `).bind(now, now).first();
  
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
  
  // Record streak activity
  await fetch(`${c.req.url.split('/challenges')[0]}/streaks/activity`, {
    method: 'POST',
    headers: { 'Authorization': c.req.header('Authorization') || '' },
  });
  
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
// FAMILY REFERRALS ROUTES
// ============================================

export const referralsRoutes = new Hono<AppEnv>();

// Get user's referral stats and tree
referralsRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  
  const referrals = await c.env.DB.prepare(`
    SELECT fr.*, u.first_name, u.last_name, u.avatar_url
    FROM family_referrals fr
    LEFT JOIN users u ON fr.referred_user_id = u.id
    WHERE fr.referrer_id = ?
    ORDER BY fr.created_at DESC
  `).bind(userId).all();
  
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_invites,
      SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
      SUM(storage_bonus_mb) as total_bonus_mb
    FROM family_referrals WHERE referrer_id = ?
  `).bind(userId).first();
  
  // Get rewards
  const rewards = await c.env.DB.prepare(`
    SELECT * FROM referral_rewards WHERE user_id = ? ORDER BY claimed_at DESC
  `).bind(userId).all();
  
  return c.json({
    referrals: referrals.results,
    stats: {
      totalInvites: stats?.total_invites || 0,
      accepted: stats?.accepted || 0,
      totalBonusMB: stats?.total_bonus_mb || 0,
    },
    rewards: rewards.results,
  });
});

// Generate invite link
referralsRoutes.post('/invite', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  const inviteCode = `HLM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO family_referrals (id, referrer_id, referred_email, family_branch, relationship, invite_code, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, body.email, body.branch, body.relationship, inviteCode, now).run();
  
  // Send invite email
  // TODO: Integrate with email service
  
  return c.json({
    id,
    inviteCode,
    inviteUrl: `https://heirloom.blue/signup?ref=${inviteCode}`,
  });
});

// Accept referral (called during signup)
referralsRoutes.post('/accept', async (c) => {
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  const referral = await c.env.DB.prepare(`
    SELECT * FROM family_referrals WHERE invite_code = ? AND status = 'pending'
  `).bind(body.inviteCode).first();
  
  if (!referral) {
    return c.json({ error: 'Invalid or expired invite code' }, 400);
  }
  
  // Update referral
  await c.env.DB.prepare(`
    UPDATE family_referrals 
    SET status = 'accepted', referred_user_id = ?, accepted_at = ?, storage_bonus_mb = 100
    WHERE id = ?
  `).bind(body.userId, now, referral.id).run();
  
  // Give referrer bonus storage
  const acceptedCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM family_referrals WHERE referrer_id = ? AND status = 'accepted'
  `).bind(referral.referrer_id).first();
  
  const count = (acceptedCount?.count as number) || 0;
  
  // Check for milestone rewards
  const milestones: Record<number, { type: string; value: string; milestone: string }> = {
    5: { type: 'storage_bonus', value: '500MB', milestone: '5 family members' },
    10: { type: 'discount', value: '25%', milestone: '10 family members' },
    25: { type: 'free_month', value: '1 month', milestone: '25 family members' },
    50: { type: 'lifetime_discount', value: '50%', milestone: 'Complete family tree' },
  };
  
  if (milestones[count]) {
    const reward = milestones[count];
    await c.env.DB.prepare(`
      INSERT INTO referral_rewards (id, user_id, reward_type, reward_value, milestone, claimed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), referral.referrer_id, reward.type, reward.value, reward.milestone, now).run();
    
    // Notify referrer
    await c.env.DB.prepare(`
      INSERT INTO user_notifications (id, user_id, notification_type, title, message, action_url, created_at)
      VALUES (?, ?, 'referral_reward', ?, ?, '/settings/referrals', ?)
    `).bind(
      crypto.randomUUID(), referral.referrer_id,
      `Referral Milestone Reached!`,
      `You've invited ${count} family members and earned ${reward.value}!`,
      now
    ).run();
  }
  
  // Notify referrer of acceptance
  await c.env.DB.prepare(`
    INSERT INTO user_notifications (id, user_id, notification_type, title, message, action_url, created_at)
    VALUES (?, ?, 'referral_accepted', ?, ?, '/family', ?)
  `).bind(
    crypto.randomUUID(), referral.referrer_id,
    'Family Member Joined!',
    `${body.firstName || 'Someone'} accepted your invite and joined Heirloom!`,
    now
  ).run();
  
  return c.json({ success: true, bonusMB: 100 });
});

// ============================================
// GIFT SUBSCRIPTIONS ROUTES
// ============================================

export const giftRoutes = new Hono<AppEnv>();

// Get gift subscription pricing
giftRoutes.get('/pricing', async (c) => {
  return c.json({
    tiers: [
      { id: 'STARTER', name: 'Starter', price: 12, duration: 12, description: '1 year of Starter plan' },
      { id: 'FAMILY', name: 'Family', price: 24, duration: 12, description: '1 year of Family plan' },
      { id: 'FOREVER', name: 'Forever', price: 60, duration: 12, description: '1 year of Forever plan' },
    ],
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
  
  // Calculate price based on tier
  const prices: Record<string, number> = { STARTER: 12, FAMILY: 24, FOREVER: 60 };
  const amount = prices[body.tier] || 12;
  
  await c.env.DB.prepare(`
    INSERT INTO gift_subscriptions (
      id, purchaser_id, purchaser_email, purchaser_name, recipient_email, recipient_name,
      gift_code, tier, duration_months, personal_message, gift_card_style,
      scheduled_delivery_date, amount_paid, currency, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).bind(
    id, userId, body.purchaserEmail, body.purchaserName,
    body.recipientEmail, body.recipientName, giftCode, body.tier,
    body.durationMonths || 12, body.personalMessage, body.style || 'classic',
    body.scheduledDeliveryDate, amount * 100, body.currency || 'USD', now
  ).run();
  
  // If no scheduled date, deliver immediately
  if (!body.scheduledDeliveryDate) {
    // Send gift email
    // TODO: Integrate with email service
    await c.env.DB.prepare(`
      UPDATE gift_subscriptions SET status = 'delivered', delivered_at = ? WHERE id = ?
    `).bind(now, id).run();
  }
  
  return c.json({
    id,
    giftCode,
    redeemUrl: `https://heirloom.blue/gift/redeem?code=${giftCode}`,
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
  
  const id = crypto.randomUUID();
  const qrCode = `MEM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const shortUrl = `hlm.blue/m/${qrCode}`;
  
  await c.env.DB.prepare(`
    INSERT INTO qr_memorial_codes (
      id, user_id, family_member_id, memorial_name, memorial_description,
      qr_code, short_url, design_style, is_public, birth_date, death_date,
      location, epitaph, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, userId, body.familyMemberId, body.name, body.description,
    qrCode, shortUrl, body.style || 'classic', body.isPublic ? 1 : 0,
    body.birthDate, body.deathDate, body.location, body.epitaph, now, now
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
  
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO memorial_page_content (
      id, memorial_id, content_type, content_text, submitted_by_name, submitted_by_email, created_at
    ) VALUES (?, ?, 'tribute', ?, ?, ?, ?)
  `).bind(id, memorial.id, body.message, body.name, body.email, now).run();
  
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
  
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO milestone_alerts (
      id, user_id, family_member_id, milestone_type, milestone_name,
      milestone_date, recurring, reminder_days_before, prompt_suggestion, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, userId, body.familyMemberId, body.type, body.name,
    body.date, body.recurring ? 1 : 0, body.reminderDays || 7,
    body.promptSuggestion, now
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
