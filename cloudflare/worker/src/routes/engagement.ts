/**
 * Engagement Routes - Automated Adoption Engine
 * Handles badges, drip campaigns, family invites, shareable cards
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { readDescription } from '../lib/legacyArchive';
import { sendEmail } from '../utils/email';
import { createNotification, kinJoinedEmail } from '../utils/notifications';
import { requireAuth } from '../lib/auth';

export const engagementRoutes = new Hono<AppEnv>();


// ============================================
// FAMILY INVITES
// ============================================

// Send family invite
engagementRoutes.post('/invite', requireAuth, async (c) => {
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

  // Resolve the inviter's primary thread so the invitee can join the bloodline on accept.
  let inviterThread = await c.env.DB.prepare(`
    SELECT id FROM threads WHERE founder_user_id = ? ORDER BY created_at ASC LIMIT 1
  `).bind(userId).first();
  if (!inviterThread) {
    inviterThread = await c.env.DB.prepare(`
      SELECT thread_id AS id FROM thread_members WHERE user_id = ? ORDER BY rowid ASC LIMIT 1
    `).bind(userId).first();
  }
  const threadId = (inviterThread?.id as string | undefined) || null;

  const inviteCode = `INV-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO family_invites (id, inviter_user_id, invitee_email, invitee_name, invite_code, thread_id, sent_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, email.toLowerCase(), name || null, inviteCode, threadId, now.toISOString(), expiresAt.toISOString()).run();
  
  // Send invite email
  const inviterName = `${inviter?.first_name || ''} ${inviter?.last_name || ''}`.trim() || 'Someone';
  const inviteUrl = `https://heirloom.blue/join?code=${inviteCode}`;
  
  await sendEmail(c.env, {
    from: 'Heirloom <admin@heirloom.blue>',
    to: email,
    subject: `${inviterName} included you in a family thread on Heirloom`,
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
engagementRoutes.get('/invites', requireAuth, async (c) => {
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

// Accept invite — user ID comes from auth session, never from client body
engagementRoutes.post('/invite/accept', requireAuth, async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { inviteCode } = await c.req.json();

  if (!inviteCode) {
    return c.json({ error: 'Invite code is required' }, 400);
  }

  const invite = await c.env.DB.prepare(`
    SELECT * FROM family_invites WHERE invite_code = ? AND status = 'pending'
  `).bind(inviteCode).first();

  if (!invite) {
    return c.json({ error: 'Invalid or expired invite' }, 404);
  }

  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    UPDATE family_invites SET status = 'accepted', accepted_at = ? WHERE id = ?
  `).bind(now, invite.id).run();

  // Join the accepting user to the inviter's bloodline thread (idempotent).
  // A membership failure must not abort the accept, so it's wrapped defensively.
  let joinedThread = false;
  const threadId = invite.thread_id as string | undefined;
  if (threadId) {
    try {
      const alreadyMember = await c.env.DB.prepare(`
        SELECT id FROM thread_members WHERE thread_id = ? AND user_id = ?
      `).bind(threadId, userId).first();

      if (!alreadyMember) {
        const acceptingUser = await c.env.DB.prepare(`
          SELECT first_name, last_name, email FROM users WHERE id = ?
        `).bind(userId).first();

        const userName = `${acceptingUser?.first_name || ''} ${acceptingUser?.last_name || ''}`.trim();
        const inviteeEmail = invite.invitee_email as string | undefined;
        const localPart = inviteeEmail ? inviteeEmail.split('@')[0] : '';
        // display_name is NOT NULL — fall back through invitee name, user name, then email local-part.
        const displayName = (invite.invitee_name as string | undefined) || userName || localPart || 'Family';
        const memberEmail = (acceptingUser?.email as string | undefined) || inviteeEmail || null;

        await c.env.DB.prepare(`
          INSERT INTO thread_members (id, thread_id, user_id, display_name, email, relation_label, role)
          VALUES (?, ?, ?, ?, ?, ?, 'AUTHOR')
        `).bind(crypto.randomUUID(), threadId, userId, displayName, memberEmail, 'family').run();
      }
      joinedThread = true;
    } catch {
      // Membership insert failed — the accept itself still stands.
      joinedThread = false;
    }
  }

  // Award badge to inviter
  await checkAndAwardBadges(c.env, invite.inviter_user_id as string, 'referral_success', 1);

  // Reciprocity — tell the inviter their kin arrived. An Inbox line now, plus an
  // email so it lands even when they're not in-app (push/VAPID still dormant).
  // Best-effort: the accept stands regardless of whether either signal fires.
  try {
    const inviterId = invite.inviter_user_id as string;
    const joiner = await c.env.DB.prepare(
      `SELECT first_name, last_name FROM users WHERE id = ?`
    ).bind(userId).first();
    const joinerName = `${joiner?.first_name || ''} ${joiner?.last_name || ''}`.trim() || 'Someone';
    await createNotification(
      c.env, inviterId, 'referral_accepted',
      `${joinerName} joined your thread`,
      `${joinerName} accepted your invitation and is now weaving with you.`,
      '/loom/pwa',
    );
    const inviter = await c.env.DB.prepare(
      `SELECT first_name, email FROM users WHERE id = ?`
    ).bind(inviterId).first();
    const inviterEmail = inviter?.email as string | undefined;
    if (inviterEmail) {
      const inviterName = `${inviter?.first_name || ''}`.trim() || 'there';
      await sendEmail(c.env, {
        from: 'Heirloom <admin@heirloom.blue>',
        to: inviterEmail,
        subject: `${joinerName} joined your family thread`,
        html: kinJoinedEmail(inviterName, joinerName, 'joined your thread', 'https://heirloom.blue/loom/pwa'),
      }, 'KIN_JOINED');
    }
  } catch {
    /* reciprocity signal is best-effort — the accept already succeeded */
  }

  return c.json({ success: true, inviterId: invite.inviter_user_id, joinedThread });
});

// Cancel / delete a pending invite
engagementRoutes.delete('/invites/:id', requireAuth, async (c) => {
  const userId = c.get('userId');
  const inviteId = c.req.param('id');

  const invite = await c.env.DB.prepare(`
    SELECT id FROM family_invites WHERE id = ? AND inviter_user_id = ? AND status = 'pending'
  `).bind(inviteId, userId).first();

  if (!invite) {
    return c.json({ error: 'Invite not found' }, 404);
  }

  await c.env.DB.prepare(`DELETE FROM family_invites WHERE id = ?`).bind(inviteId).run();
  return c.body(null, 204);
});

// Edit a pending invite's name / email (before it's accepted).
engagementRoutes.patch('/invites/:id', requireAuth, async (c) => {
  const userId = c.get('userId');
  const inviteId = c.req.param('id');
  const body = await c.req
    .json<{ email?: string; name?: string | null }>()
    .catch(() => ({} as { email?: string; name?: string | null }));

  const invite = await c.env.DB.prepare(`
    SELECT id, invitee_name FROM family_invites WHERE id = ? AND inviter_user_id = ? AND status = 'pending'
  `).bind(inviteId, userId).first();

  if (!invite) {
    return c.json({ error: 'Invite not found' }, 404);
  }

  const email = body.email?.trim().toLowerCase();
  // name: undefined = leave as-is; '' = clear to null; else the trimmed value.
  const name = body.name === undefined
    ? ((invite as { invitee_name?: string | null }).invitee_name ?? null)
    : (body.name?.trim() || null);
  if (email !== undefined && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return c.json({ error: 'A valid email is required' }, 400);
  }

  await c.env.DB.prepare(`
    UPDATE family_invites SET invitee_email = COALESCE(?, invitee_email), invitee_name = ? WHERE id = ?
  `).bind(email ?? null, name, inviteId).run();

  return c.body(null, 204);
});

// Public invite preview — UNAUTHED. A prospective joiner opening an invite link
// sees proof the thread is real and alive BEFORE signing up: who invited them,
// the thread name, how many hands, since when, and ONE safe memory title.
// Privacy is by construction — the title query excludes anything sealed,
// encrypted, directed at specific recipients, marked private, or a private
// letter/voice note. Bodies and files are NEVER returned. Unknown code → a
// generic 404 (no enumeration signal).
engagementRoutes.get('/invite/:code/preview', async (c) => {
  const code = c.req.param('code');
  if (!code) return c.json({ error: 'Not found' }, 404);

  try {
    const invite = await c.env.DB.prepare(
      `SELECT inviter_user_id, invitee_name, thread_id FROM family_invites WHERE invite_code = ?`
    ).bind(code).first();
    if (!invite) return c.json({ error: 'Not found' }, 404);

    const inviterId = invite.inviter_user_id as string;
    const inviter = await c.env.DB.prepare(
      `SELECT first_name FROM users WHERE id = ?`
    ).bind(inviterId).first();

    let threadName: string | null = null;
    let memberCount = 1;
    if (invite.thread_id) {
      const thread = await c.env.DB.prepare(
        `SELECT name FROM threads WHERE id = ?`
      ).bind(invite.thread_id).first();
      threadName = (thread?.name as string) ?? null;
      const members = await c.env.DB.prepare(
        `SELECT COUNT(*) as n FROM thread_members WHERE thread_id = ?`
      ).bind(invite.thread_id).first() as { n: number } | null;
      if (members?.n) memberCount = members.n;
    }

    const counts = await c.env.DB.prepare(
      `SELECT COUNT(*) as n, MIN(created_at) as first_at
       FROM memories WHERE user_id = ? AND deleted_at IS NULL`
    ).bind(inviterId).first() as { n: number; first_at: string | null } | null;
    const memoryCount = counts?.n ?? 0;
    const sinceYear = counts?.first_at ? new Date(counts.first_at).getUTCFullYear() : null;

    // The single safe title — strict public gate, earliest first.
    const safe = await c.env.DB.prepare(
      `SELECT title FROM memories m
       WHERE m.user_id = ?
         AND m.deleted_at IS NULL
         AND m.encrypted = 0
         AND m.type IN ('TEXT','PHOTO','VIDEO','NOTE')
         AND COALESCE(lower(json_extract(m.metadata, '$.visibility')), '') <> 'private'
         AND NOT EXISTS (SELECT 1 FROM memory_recipients r WHERE r.memory_id = m.id)
       ORDER BY m.created_at ASC
       LIMIT 1`
    ).bind(inviterId).first();

    return c.json({
      inviterName: (inviter?.first_name as string) || 'A family member',
      inviteeName: (invite.invitee_name as string) || null,
      threadName,
      memberCount,
      memoryCount,
      sinceYear,
      sampleTitle: (safe?.title as string) || null,
    });
  } catch {
    return c.json({ error: 'Not found' }, 404);
  }
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
    SELECT sc.*, m.title, m.description, m.description_enc, m.description_iv,
           m.media_url, m.memory_type,
           u.first_name, u.last_name
    FROM shareable_cards sc
    LEFT JOIN memories m ON sc.memory_id = m.id AND m.deleted_at IS NULL
    LEFT JOIN users u ON sc.user_id = u.id
    WHERE sc.share_token = ? AND sc.is_public = 1
  `).bind(token).first();

  if (!card) {
    return c.json({ error: 'Card not found or expired' }, 404);
  }

  // A card whose underlying memory has since been revoked has no content to show.
  if (card.memory_id && !card.title && !card.description && !card.description_enc) {
    return c.json({ error: 'This card is no longer available' }, 404);
  }

  const cardDescription = card.memory_id ? await readDescription(c.env, card as any) : null;
  
  // Increment view count
  await c.env.DB.prepare(`
    UPDATE shareable_cards SET view_count = view_count + 1 WHERE share_token = ?
  `).bind(token).run();
  
  return c.json({
    cardType: card.card_type,
    cardStyle: card.card_style,
    memory: card.memory_id ? {
      title: card.title,
      description: cardDescription,
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
  
  const STEP_COLUMNS: Record<string, string> = {
    profile_completed: 'profile_completed',
    first_memory_created: 'first_memory_created',
    first_family_added: 'first_family_added',
    first_letter_written: 'first_letter_written',
    first_voice_recorded: 'first_voice_recorded',
    legacy_contact_added: 'legacy_contact_added',
    tour_completed: 'tour_completed',
    wizard_dismissed: 'wizard_dismissed',
  };

  const col = STEP_COLUMNS[step];
  if (!col) return c.json({ error: 'Invalid step' }, 400);

  // Ensure record exists
  const existing = await c.env.DB.prepare(`
    SELECT id FROM onboarding_progress WHERE user_id = ?
  `).bind(userId).first();

  if (!existing) {
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO onboarding_progress (id, user_id, ${col}, created_at, updated_at)
      VALUES (?, ?, 1, ?, ?)
    `).bind(id, userId, now, now).run();
  } else {
    await c.env.DB.prepare(`
      UPDATE onboarding_progress SET ${col} = 1, updated_at = ? WHERE user_id = ?
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
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to Heirloom</title>
</head>
<body style="margin:0;padding:0;background:#0e0e0c;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px 64px;">

    <!-- wordmark -->
    <div style="margin-bottom:48px;">
      <span style="font-family:Georgia,serif;font-size:13px;font-weight:normal;letter-spacing:0.28em;text-transform:uppercase;color:#b07a4a;">heirloom</span>
    </div>

    <!-- divider -->
    <div style="height:1px;background:#2a2a28;margin-bottom:40px;"></div>

    <!-- eyebrow -->
    <p style="margin:0 0 14px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#6b6b68;">
      you've been included
    </p>

    <!-- headline -->
    <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:normal;line-height:1.25;letter-spacing:-0.01em;color:#f4ecd8;">
      ${inviterName} has woven a thread for you.
    </h1>

    <!-- body -->
    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#b8b0a0;font-weight:normal;">
      Heirloom is a perpetual, append-only family archive — owned by your bloodline, not a platform. Every word woven in becomes a permanent record.
    </p>
    <p style="margin:0 0 40px;font-size:16px;line-height:1.7;color:#b8b0a0;font-weight:normal;">
      ${inviteeName}, you're already part of this cloth. Add your voice, or simply read what has been written.
    </p>

    <!-- invite code box -->
    <div style="border:1px solid #2a2a28;padding:20px 24px;margin-bottom:32px;">
      <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:#6b6b68;">your invite code</p>
      <p style="margin:0;font-family:'Courier New',monospace;font-size:15px;color:#f4ecd8;letter-spacing:0.12em;">${inviteCode}</p>
    </div>

    <!-- CTA -->
    <div style="margin-bottom:48px;">
      <a href="${inviteUrl}"
         style="display:inline-block;background:#b07a4a;color:#0e0e0c;text-decoration:none;padding:14px 32px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:normal;">
        accept invitation →
      </a>
    </div>

    <!-- divider -->
    <div style="height:1px;background:#2a2a28;margin-bottom:28px;"></div>

    <!-- footer -->
    <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;line-height:1.8;color:#4a4a48;letter-spacing:0.06em;">
      This invitation expires in 30 days.<br>
      If you didn't expect this, you can safely ignore it.<br>
      heirloom.blue
    </p>

  </div>
</body>
</html>`;
}

export default engagementRoutes;
