/**
 * Engagement Routes - Automated Adoption Engine
 * Handles streaks, badges, drip campaigns, family invites, shareable cards
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { sendEmail } from '../utils/email';

export const engagementRoutes = new Hono<AppEnv>();

// ============================================
// STREAKS & BADGES
// ============================================

// Get user's streak and badges
engagementRoutes.get('/streaks', async (c) => {
  const userId = c.get('userId');
  
  // Get or create streak record
  let streak = await c.env.DB.prepare(`
    SELECT * FROM user_streaks WHERE user_id = ?
  `).bind(userId).first();
  
  if (!streak) {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO user_streaks (id, user_id, current_streak, longest_streak, total_activity_days, created_at, updated_at)
      VALUES (?, ?, 0, 0, 0, ?, ?)
    `).bind(id, userId, now, now).run();
    streak = { id, user_id: userId, current_streak: 0, longest_streak: 0, total_activity_days: 0 };
  }
  
  // Get badges
  const badges = await c.env.DB.prepare(`
    SELECT badge_type, badge_name, badge_description, earned_at
    FROM user_badges WHERE user_id = ?
    ORDER BY earned_at DESC
  `).bind(userId).all();
  
  return c.json({
    streak: {
      current: streak.current_streak,
      longest: streak.longest_streak,
      totalDays: streak.total_activity_days,
      lastActivity: streak.last_activity_date,
    },
    badges: badges.results,
  });
});

// Record activity (called when user creates content)
engagementRoutes.post('/activity', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const { activityType } = await c.req.json();
  
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  
  // Get current streak
  let streak = await c.env.DB.prepare(`
    SELECT * FROM user_streaks WHERE user_id = ?
  `).bind(userId).first();
  
  if (!streak) {
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO user_streaks (id, user_id, current_streak, longest_streak, last_activity_date, total_activity_days, created_at, updated_at)
      VALUES (?, ?, 1, 1, ?, 1, ?, ?)
    `).bind(id, userId, today, now, now).run();
    streak = { current_streak: 1, longest_streak: 1 };
  } else {
    const lastActivity = streak.last_activity_date as string;
    const lastDate = lastActivity ? new Date(lastActivity) : null;
    const todayDate = new Date(today);
    
    let newStreak = streak.current_streak as number;
    let newTotal = streak.total_activity_days as number;
    
    if (lastDate) {
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day, no change to streak
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        newStreak += 1;
        newTotal += 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
        newTotal += 1;
      }
    } else {
      newStreak = 1;
      newTotal = 1;
    }
    
    const newLongest = Math.max(newStreak, streak.longest_streak as number);
    
    await c.env.DB.prepare(`
      UPDATE user_streaks 
      SET current_streak = ?, longest_streak = ?, last_activity_date = ?, total_activity_days = ?, updated_at = ?
      WHERE user_id = ?
    `).bind(newStreak, newLongest, today, newTotal, now, userId).run();
    
    // Check for streak badges
    await checkAndAwardBadges(c.env, userId, 'streak', newStreak);
  }
  
  // Check for activity-specific badges
  await checkAndAwardBadges(c.env, userId, activityType, 1);
  
  return c.json({ success: true });
});

// ============================================
// FAMILY INVITES
// ============================================

// Send family invite
engagementRoutes.post('/invite', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const { email, name } = await c.req.json();
  
  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }
  
  // Check if already invited
  const existing = await c.env.DB.prepare(`
    SELECT id FROM family_invites 
    WHERE inviter_user_id = ? AND invitee_email = ? AND status = 'pending'
  `).bind(userId, email.toLowerCase()).first();
  
  if (existing) {
    return c.json({ error: 'Already invited this person' }, 400);
  }
  
  // Get inviter info
  const inviter = await c.env.DB.prepare(`
    SELECT first_name, last_name, email FROM users WHERE id = ?
  `).bind(userId).first();
  
  const inviteCode = `INV-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO family_invites (id, inviter_user_id, invitee_email, invitee_name, invite_code, sent_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, email.toLowerCase(), name || null, inviteCode, now.toISOString(), expiresAt.toISOString()).run();
  
  // Send invite email
  const inviterName = `${inviter?.first_name || ''} ${inviter?.last_name || ''}`.trim() || 'Someone';
  const inviteUrl = `https://heirloom.blue/join?code=${inviteCode}`;
  
  await sendEmail(c.env, {
    from: 'Heirloom <admin@heirloom.blue>',
    to: email,
    subject: `${inviterName} invited you to preserve family memories on Heirloom`,
    html: familyInviteEmail(inviterName, name || 'there', inviteUrl, inviteCode),
  }, 'FAMILY_INVITE');
  
  // Check for invite badges
  const inviteCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM family_invites WHERE inviter_user_id = ?
  `).bind(userId).first();
  
  await checkAndAwardBadges(c.env, userId, 'invite', inviteCount?.count as number || 1);
  
  return c.json({ success: true, inviteCode });
});

// Get user's invites
engagementRoutes.get('/invites', async (c) => {
  const userId = c.get('userId');
  
  const invites = await c.env.DB.prepare(`
    SELECT id, invitee_email, invitee_name, invite_code, status, sent_at, accepted_at, reward_claimed
    FROM family_invites WHERE inviter_user_id = ?
    ORDER BY sent_at DESC
  `).bind(userId).all();
  
  // Count accepted invites for rewards
  const acceptedCount = invites.results.filter((i: any) => i.status === 'accepted').length;
  const unclaimedRewards = invites.results.filter((i: any) => i.status === 'accepted' && !i.reward_claimed).length;
  
  return c.json({
    invites: invites.results,
    stats: {
      total: invites.results.length,
      accepted: acceptedCount,
      pending: invites.results.filter((i: any) => i.status === 'pending').length,
      unclaimedRewards,
    },
  });
});

// Accept invite (called during registration)
engagementRoutes.post('/invite/accept', async (c) => {
  const { inviteCode, newUserId } = await c.req.json();
  
  if (!inviteCode || !newUserId) {
    return c.json({ error: 'Invite code and user ID required' }, 400);
  }
  
  const invite = await c.env.DB.prepare(`
    SELECT * FROM family_invites WHERE invite_code = ? AND status = 'pending'
  `).bind(inviteCode).first();
  
  if (!invite) {
    return c.json({ error: 'Invalid or expired invite' }, 404);
  }
  
  const now = new Date().toISOString();
  
  // Update invite status
  await c.env.DB.prepare(`
    UPDATE family_invites SET status = 'accepted', accepted_at = ? WHERE id = ?
  `).bind(now, invite.id).run();
  
  // Award badge to inviter
  await checkAndAwardBadges(c.env, invite.inviter_user_id as string, 'referral_success', 1);
  
  return c.json({ success: true, inviterId: invite.inviter_user_id });
});

// ============================================
// SHAREABLE CARDS
// ============================================

// Create shareable card
engagementRoutes.post('/card', async (c) => {
  const userId = c.get('userId');
  const { memoryId, cardType, cardStyle } = await c.req.json();
  
  const shareToken = crypto.randomUUID().substring(0, 12);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year
  
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO shareable_cards (id, user_id, memory_id, card_type, card_style, share_token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, memoryId || null, cardType || 'memory', cardStyle || 'classic', shareToken, expiresAt, now).run();
  
  return c.json({
    success: true,
    shareUrl: `https://heirloom.blue/share/${shareToken}`,
    shareToken,
  });
});

// View shared card (public)
engagementRoutes.get('/card/:token', async (c) => {
  const token = c.req.param('token');
  
  const card = await c.env.DB.prepare(`
    SELECT sc.*, m.title, m.description, m.media_url, m.memory_type,
           u.first_name, u.last_name
    FROM shareable_cards sc
    LEFT JOIN memories m ON sc.memory_id = m.id
    LEFT JOIN users u ON sc.user_id = u.id
    WHERE sc.share_token = ? AND sc.is_public = 1
  `).bind(token).first();
  
  if (!card) {
    return c.json({ error: 'Card not found or expired' }, 404);
  }
  
  // Increment view count
  await c.env.DB.prepare(`
    UPDATE shareable_cards SET view_count = view_count + 1 WHERE share_token = ?
  `).bind(token).run();
  
  return c.json({
    cardType: card.card_type,
    cardStyle: card.card_style,
    memory: card.memory_id ? {
      title: card.title,
      description: card.description,
      mediaUrl: card.media_url,
      type: card.memory_type,
    } : null,
    creator: `${card.first_name || ''} ${card.last_name || ''}`.trim() || 'Anonymous',
    viewCount: card.view_count,
  });
});

// Track share
engagementRoutes.post('/card/:token/share', async (c) => {
  const token = c.req.param('token');
  
  await c.env.DB.prepare(`
    UPDATE shareable_cards SET share_count = share_count + 1 WHERE share_token = ?
  `).bind(token).run();
  
  return c.json({ success: true });
});

// ============================================
// ONBOARDING PROGRESS
// ============================================

// Get onboarding progress
engagementRoutes.get('/onboarding', async (c) => {
  const userId = c.get('userId');
  
  let progress = await c.env.DB.prepare(`
    SELECT * FROM onboarding_progress WHERE user_id = ?
  `).bind(userId).first();
  
  if (!progress) {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO onboarding_progress (id, user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).bind(id, userId, now, now).run();
    progress = { step_completed: 0 };
  }
  
  // Calculate completion percentage
  const steps = [
    'profile_completed',
    'first_memory_created',
    'first_family_added',
    'first_letter_written',
    'first_voice_recorded',
    'legacy_contact_added',
  ];
  
  const completed = steps.filter(s => (progress as any)[s] === 1).length;
  const percentage = Math.round((completed / steps.length) * 100);
  
  return c.json({
    progress: {
      profileCompleted: !!progress.profile_completed,
      firstMemoryCreated: !!progress.first_memory_created,
      firstFamilyAdded: !!progress.first_family_added,
      firstLetterWritten: !!progress.first_letter_written,
      firstVoiceRecorded: !!progress.first_voice_recorded,
      legacyContactAdded: !!progress.legacy_contact_added,
      tourCompleted: !!progress.tour_completed,
      wizardDismissed: !!progress.wizard_dismissed,
    },
    completionPercentage: percentage,
    nextStep: getNextOnboardingStep(progress),
  });
});

// Update onboarding step
engagementRoutes.post('/onboarding/:step', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const step = c.req.param('step');
  const now = new Date().toISOString();
  
  const validSteps = [
    'profile_completed', 'first_memory_created', 'first_family_added',
    'first_letter_written', 'first_voice_recorded', 'legacy_contact_added',
    'tour_completed', 'wizard_dismissed'
  ];
  
  if (!validSteps.includes(step)) {
    return c.json({ error: 'Invalid step' }, 400);
  }
  
  // Ensure record exists
  const existing = await c.env.DB.prepare(`
    SELECT id FROM onboarding_progress WHERE user_id = ?
  `).bind(userId).first();
  
  if (!existing) {
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO onboarding_progress (id, user_id, ${step}, created_at, updated_at)
      VALUES (?, ?, 1, ?, ?)
    `).bind(id, userId, now, now).run();
  } else {
    await c.env.DB.prepare(`
      UPDATE onboarding_progress SET ${step} = 1, updated_at = ? WHERE user_id = ?
    `).bind(now, userId).run();
  }
  
  // Award onboarding badges
  await checkAndAwardBadges(c.env, userId, step, 1);
  
  return c.json({ success: true });
});

// ============================================
// IMPORTANT DATES
// ============================================

// Add important date
engagementRoutes.post('/dates', async (c) => {
  const userId = c.get('userId');
  const { dateType, personName, familyMemberId, dateValue, yearValue, reminderDaysBefore, notes } = await c.req.json();
  
  if (!dateType || !dateValue) {
    return c.json({ error: 'Date type and value required' }, 400);
  }
  
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO important_dates (id, user_id, date_type, person_name, family_member_id, date_value, year_value, reminder_days_before, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, dateType, personName || null, familyMemberId || null, dateValue, yearValue || null, reminderDaysBefore || 7, notes || null, now, now).run();
  
  return c.json({ success: true, id });
});

// Get important dates
engagementRoutes.get('/dates', async (c) => {
  const userId = c.get('userId');
  
  const dates = await c.env.DB.prepare(`
    SELECT id.*, fm.name as family_member_name
    FROM important_dates id
    LEFT JOIN family_members fm ON id.family_member_id = fm.id
    WHERE id.user_id = ?
    ORDER BY id.date_value
  `).bind(userId).all();
  
  // Find upcoming dates (next 30 days)
  const today = new Date();
  const upcoming = dates.results.filter((d: any) => {
    const [month, day] = d.date_value.split('-').map(Number);
    const thisYear = new Date(today.getFullYear(), month - 1, day);
    const nextYear = new Date(today.getFullYear() + 1, month - 1, day);
    const targetDate = thisYear >= today ? thisYear : nextYear;
    const daysUntil = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil >= 0;
  });
  
  return c.json({
    dates: dates.results,
    upcoming,
  });
});

// ============================================
// EMAIL PREFERENCES / UNSUBSCRIBE
// ============================================

// Get email preferences
engagementRoutes.get('/email-preferences', async (c) => {
  const userId = c.get('userId');
  
  let prefs = await c.env.DB.prepare(`
    SELECT * FROM email_preferences WHERE user_id = ?
  `).bind(userId).first();
  
  if (!prefs) {
    // Return defaults (all enabled)
    return c.json({
      marketing_emails: true,
      drip_campaigns: true,
      content_prompts: true,
      date_reminders: true,
      product_updates: true,
      weekly_digest: true,
    });
  }
  
  return c.json({
    marketing_emails: !!prefs.marketing_emails,
    drip_campaigns: !!prefs.drip_campaigns,
    content_prompts: !!prefs.content_prompts,
    date_reminders: !!prefs.date_reminders,
    product_updates: !!prefs.product_updates,
    weekly_digest: !!prefs.weekly_digest,
  });
});

// Update email preferences
engagementRoutes.post('/email-preferences', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  // Check if preferences exist
  const existing = await c.env.DB.prepare(`
    SELECT id FROM email_preferences WHERE user_id = ?
  `).bind(userId).first();
  
  if (existing) {
    await c.env.DB.prepare(`
      UPDATE email_preferences SET
        marketing_emails = ?,
        drip_campaigns = ?,
        content_prompts = ?,
        date_reminders = ?,
        product_updates = ?,
        weekly_digest = ?,
        updated_at = ?
      WHERE user_id = ?
    `).bind(
      body.marketing_emails ?? true,
      body.drip_campaigns ?? true,
      body.content_prompts ?? true,
      body.date_reminders ?? true,
      body.product_updates ?? true,
      body.weekly_digest ?? true,
      now,
      userId
    ).run();
  } else {
    await c.env.DB.prepare(`
      INSERT INTO email_preferences (id, user_id, marketing_emails, drip_campaigns, content_prompts, date_reminders, product_updates, weekly_digest, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      userId,
      body.marketing_emails ?? true,
      body.drip_campaigns ?? true,
      body.content_prompts ?? true,
      body.date_reminders ?? true,
      body.product_updates ?? true,
      body.weekly_digest ?? true,
      now,
      now
    ).run();
  }
  
  return c.json({ success: true });
});

// Public unsubscribe endpoint (no auth required - uses token)
engagementRoutes.get('/unsubscribe/:token', async (c) => {
  const token = c.req.param('token');
  const category = c.req.query('category') || 'all';
  
  // Decode token (base64 encoded email)
  let email: string;
  try {
    email = atob(token);
  } catch {
    return c.json({ error: 'Invalid unsubscribe token' }, 400);
  }
  
  // Find user by email
  const user = await c.env.DB.prepare(`
    SELECT id FROM users WHERE email = ?
  `).bind(email.toLowerCase()).first();
  
  if (!user) {
    // Still return success to prevent email enumeration
    return c.json({ success: true, message: 'Unsubscribed successfully' });
  }
  
  const userId = user.id as string;
  const now = new Date().toISOString();
  
  // Get or create preferences
  let existing = await c.env.DB.prepare(`
    SELECT id FROM email_preferences WHERE user_id = ?
  `).bind(userId).first();
  
  if (!existing) {
    await c.env.DB.prepare(`
      INSERT INTO email_preferences (id, user_id, marketing_emails, drip_campaigns, content_prompts, date_reminders, product_updates, weekly_digest, created_at, updated_at)
      VALUES (?, ?, 1, 1, 1, 1, 1, 1, ?, ?)
    `).bind(crypto.randomUUID(), userId, now, now).run();
  }
  
  // Update based on category
  if (category === 'all') {
    await c.env.DB.prepare(`
      UPDATE email_preferences SET
        marketing_emails = 0,
        drip_campaigns = 0,
        content_prompts = 0,
        weekly_digest = 0,
        updated_at = ?
      WHERE user_id = ?
    `).bind(now, userId).run();
  } else if (category === 'marketing') {
    await c.env.DB.prepare(`
      UPDATE email_preferences SET marketing_emails = 0, updated_at = ? WHERE user_id = ?
    `).bind(now, userId).run();
  } else if (category === 'drip') {
    await c.env.DB.prepare(`
      UPDATE email_preferences SET drip_campaigns = 0, updated_at = ? WHERE user_id = ?
    `).bind(now, userId).run();
  } else if (category === 'prompts') {
    await c.env.DB.prepare(`
      UPDATE email_preferences SET content_prompts = 0, updated_at = ? WHERE user_id = ?
    `).bind(now, userId).run();
  } else if (category === 'digest') {
    await c.env.DB.prepare(`
      UPDATE email_preferences SET weekly_digest = 0, updated_at = ? WHERE user_id = ?
    `).bind(now, userId).run();
  }
  
  return c.json({ 
    success: true, 
    message: 'You have been unsubscribed successfully. You can manage your email preferences in your account settings.',
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function checkAndAwardBadges(env: any, userId: string, activityType: string, count: number) {
  const badges: { type: string; name: string; description: string; condition: boolean }[] = [
    // First actions
    { type: 'first_memory', name: 'Memory Keeper', description: 'Created your first memory', condition: activityType === 'first_memory_created' },
    { type: 'first_letter', name: 'Letter Writer', description: 'Wrote your first letter', condition: activityType === 'first_letter_written' },
    { type: 'first_voice', name: 'Voice Recorder', description: 'Recorded your first voice message', condition: activityType === 'first_voice_recorded' },
    { type: 'first_family', name: 'Family Builder', description: 'Added your first family member', condition: activityType === 'first_family_added' },
    
    // Streaks
    { type: 'streak_7', name: 'Week Warrior', description: '7-day activity streak', condition: activityType === 'streak' && count >= 7 },
    { type: 'streak_30', name: 'Monthly Master', description: '30-day activity streak', condition: activityType === 'streak' && count >= 30 },
    { type: 'streak_100', name: 'Century Champion', description: '100-day activity streak', condition: activityType === 'streak' && count >= 100 },
    
    // Invites
    { type: 'invite_1', name: 'Connector', description: 'Invited your first family member', condition: activityType === 'invite' && count >= 1 },
    { type: 'invite_3', name: 'Family Gatherer', description: 'Invited 3 family members', condition: activityType === 'invite' && count >= 3 },
    { type: 'invite_10', name: 'Legacy Ambassador', description: 'Invited 10 family members', condition: activityType === 'invite' && count >= 10 },
    
    // Referral success
    { type: 'referral_success', name: 'Influencer', description: 'Someone joined through your invite', condition: activityType === 'referral_success' },
    
    // Onboarding
    { type: 'onboarding_complete', name: 'Getting Started', description: 'Completed the onboarding tour', condition: activityType === 'tour_completed' },
    { type: 'legacy_guardian', name: 'Legacy Guardian', description: 'Added a legacy contact', condition: activityType === 'legacy_contact_added' },
  ];
  
  const now = new Date().toISOString();
  
  for (const badge of badges) {
    if (badge.condition) {
      // Check if already has badge
      const existing = await env.DB.prepare(`
        SELECT id FROM user_badges WHERE user_id = ? AND badge_type = ?
      `).bind(userId, badge.type).first();
      
      if (!existing) {
        await env.DB.prepare(`
          INSERT INTO user_badges (id, user_id, badge_type, badge_name, badge_description, earned_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), userId, badge.type, badge.name, badge.description, now).run();
      }
    }
  }
}

function getNextOnboardingStep(progress: any): string {
  if (!progress.first_memory_created) return 'Create your first memory';
  if (!progress.first_family_added) return 'Add a family member';
  if (!progress.first_voice_recorded) return 'Record a voice message';
  if (!progress.first_letter_written) return 'Write a letter';
  if (!progress.legacy_contact_added) return 'Add a legacy contact';
  return 'All done! Keep creating memories';
}

function familyInviteEmail(inviterName: string, inviteeName: string, inviteUrl: string, inviteCode: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: Georgia, serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #d4af37; font-size: 28px; font-weight: normal; margin: 0;">Heirloom</h1>
      <p style="color: #a0a0a0; font-size: 14px; margin-top: 5px;">Preserve what matters most</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 30px;">
      <h2 style="color: #f5f5dc; font-size: 22px; font-weight: normal; margin: 0 0 20px 0;">
        Hi ${inviteeName},
      </h2>
      
      <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        <strong style="color: #d4af37;">${inviterName}</strong> has invited you to join Heirloom, 
        a beautiful space to preserve and share family memories, stories, and messages for generations to come.
      </p>
      
      <p style="color: #c0c0c0; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Together, you can create a lasting legacy of photos, voice recordings, letters, and precious moments 
        that your family will treasure forever.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #0a0a0f; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: bold;">
          Join ${inviterName}'s Family
        </a>
      </div>
      
      <p style="color: #808080; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
        Your invite code: <strong style="color: #d4af37;">${inviteCode}</strong>
      </p>
    </div>
    
    <p style="color: #606060; font-size: 12px; text-align: center; margin-top: 30px;">
      This invitation expires in 30 days.<br>
      If you didn't expect this email, you can safely ignore it.
    </p>
  </div>
</body>
</html>
  `;
}

export default engagementRoutes;
