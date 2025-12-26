import { Hono } from 'hono';
import type { Env, AppEnv } from '../index';
import { sendEmail } from '../utils/email';

const marketingRoutes = new Hono<AppEnv>();

const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.slice(7);
  try {
    const admin = await c.env.DB.prepare('SELECT * FROM admin_users WHERE id = ?').bind(token).first();
    if (!admin) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const adminUser = await c.env.DB.prepare('SELECT * FROM admin_users WHERE id = ?').bind(decoded.adminId).first();
      if (!adminUser) return c.json({ error: 'Unauthorized' }, 401);
      c.set('adminId', adminUser.id);
      c.set('adminRole', adminUser.role);
    } else {
      c.set('adminId', admin.id);
      c.set('adminRole', admin.role);
    }
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// ============================================
// CONTENT LIBRARY
// ============================================

marketingRoutes.get('/content', adminAuth, async (c) => {
  const platform = c.req.query('platform');
  const status = c.req.query('status');
  const theme = c.req.query('theme');
  
  let query = 'SELECT * FROM marketing_content WHERE 1=1';
  const params: string[] = [];
  
  if (platform) {
    query += ' AND (platform = ? OR platform = ?)';
    params.push(platform, 'ALL');
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (theme) {
    query += ' AND theme = ?';
    params.push(theme);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const content = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ content: content.results || [] });
});

marketingRoutes.post('/content', adminAuth, async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID().replace(/-/g, '');
  
  await c.env.DB.prepare(`
    INSERT INTO marketing_content (id, title, content_type, platform, theme, hook_type, audience_segment, body, caption, hashtags, cta, asset_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, body.title, body.contentType, body.platform, body.theme, body.hookType,
    body.audienceSegment, body.body, body.caption, body.hashtags, body.cta, body.assetUrl, 'DRAFT'
  ).run();
  
  return c.json({ success: true, id });
});

marketingRoutes.put('/content/:id', adminAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE marketing_content SET
      title = ?, content_type = ?, platform = ?, theme = ?, hook_type = ?,
      audience_segment = ?, body = ?, caption = ?, hashtags = ?, cta = ?,
      asset_url = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    body.title, body.contentType, body.platform, body.theme, body.hookType,
    body.audienceSegment, body.body, body.caption, body.hashtags, body.cta,
    body.assetUrl, body.status, id
  ).run();
  
  return c.json({ success: true });
});

marketingRoutes.delete('/content/:id', adminAuth, async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM marketing_content WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// ============================================
// INFLUENCER CRM
// ============================================

marketingRoutes.get('/influencers', adminAuth, async (c) => {
  const segment = c.req.query('segment');
  const status = c.req.query('status');
  const platform = c.req.query('platform');
  
  let query = 'SELECT * FROM influencers WHERE 1=1';
  const params: string[] = [];
  
  if (segment) {
    query += ' AND segment = ?';
    params.push(segment);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (platform) {
    query += ' AND platform = ?';
    params.push(platform);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const influencers = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ influencers: influencers.results || [] });
});

marketingRoutes.post('/influencers', adminAuth, async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID().replace(/-/g, '');
  
  const suppressed = await c.env.DB.prepare(
    'SELECT id FROM marketing_suppression WHERE email = ?'
  ).bind(body.email).first();
  
  if (suppressed) {
    return c.json({ error: 'Email is on suppression list' }, 400);
  }
  
  await c.env.DB.prepare(`
    INSERT INTO influencers (id, name, email, platform, handle, profile_url, follower_count, segment, source, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, body.name, body.email, body.platform, body.handle, body.profileUrl,
    body.followerCount, body.segment, body.source || 'MANUAL', body.notes
  ).run();
  
  return c.json({ success: true, id });
});

marketingRoutes.post('/influencers/import', adminAuth, async (c) => {
  const body = await c.req.json();
  const influencers = body.influencers || [];
  
  let imported = 0;
  let skipped = 0;
  
  for (const inf of influencers) {
    try {
      const existing = await c.env.DB.prepare(
        'SELECT id FROM influencers WHERE email = ?'
      ).bind(inf.email).first();
      
      if (existing) {
        skipped++;
        continue;
      }
      
      const suppressed = await c.env.DB.prepare(
        'SELECT id FROM marketing_suppression WHERE email = ?'
      ).bind(inf.email).first();
      
      if (suppressed) {
        skipped++;
        continue;
      }
      
      const id = crypto.randomUUID().replace(/-/g, '');
      await c.env.DB.prepare(`
        INSERT INTO influencers (id, name, email, platform, handle, profile_url, follower_count, segment, source, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CSV_IMPORT', ?)
      `).bind(
        id, inf.name, inf.email, inf.platform, inf.handle, inf.profileUrl,
        inf.followerCount, inf.segment, inf.notes
      ).run();
      imported++;
    } catch (e) {
      skipped++;
    }
  }
  
  return c.json({ success: true, imported, skipped });
});

marketingRoutes.put('/influencers/:id', adminAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE influencers SET
      name = ?, email = ?, platform = ?, handle = ?, profile_url = ?,
      follower_count = ?, segment = ?, status = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    body.name, body.email, body.platform, body.handle, body.profileUrl,
    body.followerCount, body.segment, body.status, body.notes, id
  ).run();
  
  return c.json({ success: true });
});

// ============================================
// EMAIL CAMPAIGNS
// ============================================

marketingRoutes.get('/campaigns', adminAuth, async (c) => {
  const campaigns = await c.env.DB.prepare(`
    SELECT * FROM marketing_campaigns ORDER BY created_at DESC
  `).all();
  return c.json({ campaigns: campaigns.results || [] });
});

marketingRoutes.post('/campaigns', adminAuth, async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID().replace(/-/g, '');
  
  await c.env.DB.prepare(`
    INSERT INTO marketing_campaigns (id, name, description, campaign_type, subject_line, from_name, from_email, target_segment, rate_limit_per_hour)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, body.name, body.description, body.campaignType, body.subjectLine,
    body.fromName || 'The Heirloom Team', body.fromEmail || 'admin@heirloom.blue',
    body.targetSegment, body.rateLimitPerHour || 20
  ).run();
  
  return c.json({ success: true, id });
});

marketingRoutes.post('/campaigns/:id/send', adminAuth, async (c) => {
  const campaignId = c.req.param('id');
  const body = await c.req.json();
  
  const campaign = await c.env.DB.prepare(
    'SELECT * FROM marketing_campaigns WHERE id = ?'
  ).bind(campaignId).first();
  
  if (!campaign) {
    return c.json({ error: 'Campaign not found' }, 404);
  }
  
  let influencerQuery = 'SELECT * FROM influencers WHERE status NOT IN (?, ?)';
  const params: string[] = ['UNSUBSCRIBED', 'DECLINED'];
  
  if (body.segment) {
    influencerQuery += ' AND segment = ?';
    params.push(body.segment);
  }
  
  if (body.influencerIds && body.influencerIds.length > 0) {
    influencerQuery = `SELECT * FROM influencers WHERE id IN (${body.influencerIds.map(() => '?').join(',')})`;
    params.length = 0;
    params.push(...body.influencerIds);
  }
  
  const influencers = await c.env.DB.prepare(influencerQuery).bind(...params).all();
  const recipients = influencers.results || [];
  
  const suppressedEmails = await c.env.DB.prepare(
    'SELECT email FROM marketing_suppression'
  ).all();
  const suppressedSet = new Set((suppressedEmails.results || []).map((s: any) => s.email));
  
  const validRecipients = recipients.filter((r: any) => r.email && !suppressedSet.has(r.email));
  
  await c.env.DB.prepare(`
    UPDATE marketing_campaigns SET status = 'SENDING', started_at = datetime('now'), total_recipients = ?
    WHERE id = ?
  `).bind(validRecipients.length, campaignId).run();
  
  let sentCount = 0;
  let failedCount = 0;
  
  for (const recipient of validRecipients) {
    try {
      const trackingId = crypto.randomUUID().replace(/-/g, '');
      const personalizedSubject = (campaign.subject_line as string).replace(/\[Name\]/g, (recipient as any).name || 'there');
      const personalizedBody = (body.bodyHtml || '').replace(/\[Name\]/g, (recipient as any).name || 'there');
      
      const unsubscribeUrl = `${c.env.APP_URL || 'https://heirloom.blue'}/unsubscribe?email=${encodeURIComponent((recipient as any).email)}&tracking=${trackingId}`;
      const bodyWithUnsubscribe = personalizedBody + `
        <br><br>
        <p style="font-size: 12px; color: #666; text-align: center;">
          <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> from future emails
        </p>
      `;
      
      await c.env.DB.prepare(`
        INSERT INTO marketing_outreach (id, campaign_id, influencer_id, email_to, subject, body, status, tracking_id)
        VALUES (?, ?, ?, ?, ?, ?, 'QUEUED', ?)
      `).bind(
        crypto.randomUUID().replace(/-/g, ''),
        campaignId,
        (recipient as any).id,
        (recipient as any).email,
        personalizedSubject,
        bodyWithUnsubscribe,
        trackingId
      ).run();
      
      const result = await sendEmail(c.env, {
        from: `${campaign.from_name} <${campaign.from_email}>`,
        to: (recipient as any).email,
        subject: personalizedSubject,
        html: bodyWithUnsubscribe,
      }, 'MARKETING_CAMPAIGN');
      
      if (result.success) {
        sentCount++;
        await c.env.DB.prepare(`
          UPDATE marketing_outreach SET status = 'SENT', sent_at = datetime('now') WHERE tracking_id = ?
        `).bind(trackingId).run();
        
        await c.env.DB.prepare(`
          UPDATE influencers SET status = 'CONTACTED', last_contacted_at = datetime('now') WHERE id = ?
        `).bind((recipient as any).id).run();
      } else {
        failedCount++;
        await c.env.DB.prepare(`
          UPDATE marketing_outreach SET status = 'FAILED', error_message = ? WHERE tracking_id = ?
        `).bind(result.error || 'Unknown error', trackingId).run();
      }
    } catch (e) {
      failedCount++;
    }
  }
  
  await c.env.DB.prepare(`
    UPDATE marketing_campaigns SET status = 'COMPLETED', completed_at = datetime('now'), sent_count = ?
    WHERE id = ?
  `).bind(sentCount, campaignId).run();
  
  await c.env.DB.prepare(`
    INSERT INTO marketing_audit_log (id, action, entity_type, entity_id, admin_id, details)
    VALUES (?, 'CAMPAIGN_SENT', 'campaign', ?, ?, ?)
  `).bind(
    crypto.randomUUID().replace(/-/g, ''),
    campaignId,
    c.get('adminId'),
    JSON.stringify({ sentCount, failedCount, totalRecipients: validRecipients.length })
  ).run();
  
  return c.json({ success: true, sentCount, failedCount, totalRecipients: validRecipients.length });
});

// ============================================
// UNSUBSCRIBE & COMPLIANCE
// ============================================

marketingRoutes.get('/unsubscribe', async (c) => {
  const email = c.req.query('email');
  const tracking = c.req.query('tracking');
  
  if (!email) {
    return c.json({ error: 'Email required' }, 400);
  }
  
  await c.env.DB.prepare(`
    INSERT OR IGNORE INTO marketing_suppression (id, email, reason)
    VALUES (?, ?, 'UNSUBSCRIBE')
  `).bind(crypto.randomUUID().replace(/-/g, ''), email).run();
  
  await c.env.DB.prepare(`
    UPDATE influencers SET status = 'UNSUBSCRIBED' WHERE email = ?
  `).bind(email).run();
  
  if (tracking) {
    await c.env.DB.prepare(`
      UPDATE marketing_outreach SET status = 'UNSUBSCRIBED' WHERE tracking_id = ?
    `).bind(tracking).run();
  }
  
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unsubscribed - Heirloom</title>
      <style>
        body { font-family: 'Cormorant', Georgia, serif; background: #030305; color: #ebe6dc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .container { text-align: center; padding: 40px; }
        h1 { color: #d4a853; font-size: 2rem; margin-bottom: 1rem; }
        p { color: #ebe6dc99; }
        a { color: #d4a853; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>You've been unsubscribed</h1>
        <p>You will no longer receive marketing emails from Heirloom.</p>
        <p><a href="https://heirloom.blue">Return to Heirloom</a></p>
      </div>
    </body>
    </html>
  `);
});

marketingRoutes.get('/suppression', adminAuth, async (c) => {
  const list = await c.env.DB.prepare('SELECT * FROM marketing_suppression ORDER BY created_at DESC').all();
  return c.json({ suppression: list.results || [] });
});

// ============================================
// CREATOR SIGNUP (PUBLIC)
// ============================================

marketingRoutes.post('/creator-signup', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID().replace(/-/g, '');
  
  if (!body.email || !body.name) {
    return c.json({ error: 'Name and email required' }, 400);
  }
  
  const existing = await c.env.DB.prepare(
    'SELECT id FROM creator_signups WHERE email = ?'
  ).bind(body.email).first();
  
  if (existing) {
    return c.json({ error: 'Already signed up' }, 400);
  }
  
  await c.env.DB.prepare(`
    INSERT INTO creator_signups (id, name, email, platform, handle, profile_url, follower_count, content_type, why_interested, consent_marketing, consent_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    id, body.name, body.email, body.platform, body.handle, body.profileUrl,
    body.followerCount, body.contentType, body.whyInterested, body.consentMarketing ? 1 : 0
  ).run();
  
  return c.json({ success: true, message: 'Thank you for signing up! We\'ll be in touch soon.' });
});

marketingRoutes.get('/creator-signups', adminAuth, async (c) => {
  const signups = await c.env.DB.prepare(`
    SELECT * FROM creator_signups ORDER BY created_at DESC
  `).all();
  return c.json({ signups: signups.results || [] });
});

marketingRoutes.post('/creator-signups/:id/approve', adminAuth, async (c) => {
  const id = c.req.param('id');
  
  const signup = await c.env.DB.prepare(
    'SELECT * FROM creator_signups WHERE id = ?'
  ).bind(id).first();
  
  if (!signup) {
    return c.json({ error: 'Signup not found' }, 404);
  }
  
  const influencerId = crypto.randomUUID().replace(/-/g, '');
  
  await c.env.DB.prepare(`
    INSERT INTO influencers (id, name, email, platform, handle, profile_url, follower_count, segment, source, consent_given, consent_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'OTHER', 'SIGNUP_FORM', 1, datetime('now'))
  `).bind(
    influencerId, signup.name, signup.email, signup.platform, signup.handle,
    signup.profile_url, signup.follower_count
  ).run();
  
  await c.env.DB.prepare(`
    UPDATE creator_signups SET status = 'CONVERTED', converted_to_influencer_id = ?, reviewed_by = ?, reviewed_at = datetime('now')
    WHERE id = ?
  `).bind(influencerId, c.get('adminId'), id).run();
  
  return c.json({ success: true, influencerId });
});

// ============================================
// REFERRAL SYSTEM
// ============================================

marketingRoutes.get('/referral/code', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.slice(7);
  let userId: string;
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    userId = decoded.userId;
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
  
  let referral = await c.env.DB.prepare(
    'SELECT * FROM referral_codes WHERE user_id = ? AND is_active = 1'
  ).bind(userId).first();
  
  if (!referral) {
    const code = 'HEIR' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const id = crypto.randomUUID().replace(/-/g, '');
    
    await c.env.DB.prepare(`
      INSERT INTO referral_codes (id, user_id, code, reward_type, reward_value)
      VALUES (?, ?, ?, 'EXTENDED_TRIAL', '7')
    `).bind(id, userId, code).run();
    
    referral = { id, code, uses_count: 0 };
  }
  
  const referralUrl = `${c.env.APP_URL || 'https://heirloom.blue'}/signup?ref=${referral.code}`;
  
  return c.json({
    code: referral.code,
    url: referralUrl,
    usesCount: referral.uses_count,
    rewardType: 'EXTENDED_TRIAL',
    rewardValue: '7 days'
  });
});

marketingRoutes.post('/referral/track', async (c) => {
  const body = await c.req.json();
  const { code, referredUserId } = body;
  
  const referralCode = await c.env.DB.prepare(
    'SELECT * FROM referral_codes WHERE code = ? AND is_active = 1'
  ).bind(code).first();
  
  if (!referralCode) {
    return c.json({ error: 'Invalid referral code' }, 400);
  }
  
  if (referralCode.max_uses && (referralCode.uses_count as number) >= (referralCode.max_uses as number)) {
    return c.json({ error: 'Referral code has reached maximum uses' }, 400);
  }
  
  const id = crypto.randomUUID().replace(/-/g, '');
  await c.env.DB.prepare(`
    INSERT INTO referral_conversions (id, referral_code_id, referred_user_id, referrer_user_id, status)
    VALUES (?, ?, ?, ?, 'PENDING')
  `).bind(id, referralCode.id, referredUserId, referralCode.user_id).run();
  
  await c.env.DB.prepare(`
    UPDATE referral_codes SET uses_count = uses_count + 1 WHERE id = ?
  `).bind(referralCode.id).run();
  
  return c.json({ success: true });
});

// ============================================
// PLATFORM STATS (SOCIAL PROOF)
// ============================================

marketingRoutes.get('/stats/public', async (c) => {
  const stats = await c.env.DB.prepare('SELECT * FROM platform_stats WHERE id = ?').bind('global').first();
  
  if (!stats) {
    return c.json({
      totalFamilies: 0,
      totalMemories: 0,
      totalLetters: 0,
      countriesCount: 0
    });
  }
  
  return c.json({
    totalFamilies: stats.total_families,
    totalMemories: stats.total_memories,
    totalLetters: stats.total_letters,
    countriesCount: stats.countries_count
  });
});

marketingRoutes.post('/stats/refresh', adminAuth, async (c) => {
  const users = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
  const memories = await c.env.DB.prepare('SELECT COUNT(*) as count FROM memories').first();
  const letters = await c.env.DB.prepare('SELECT COUNT(*) as count FROM letters').first();
  
  await c.env.DB.prepare(`
    UPDATE platform_stats SET
      total_families = ?,
      total_memories = ?,
      total_letters = ?,
      last_updated = datetime('now')
    WHERE id = 'global'
  `).bind(
    (users as any)?.count || 0,
    (memories as any)?.count || 0,
    (letters as any)?.count || 0
  ).run();
  
  return c.json({ success: true });
});

// ============================================
// TESTIMONIALS
// ============================================

marketingRoutes.get('/testimonials', async (c) => {
  const featured = c.req.query('featured') === 'true';
  
  let query = 'SELECT * FROM testimonials WHERE is_approved = 1';
  if (featured) {
    query += ' AND is_featured = 1';
  }
  query += ' ORDER BY created_at DESC LIMIT 10';
  
  const testimonials = await c.env.DB.prepare(query).all();
  return c.json({ testimonials: testimonials.results || [] });
});

marketingRoutes.post('/testimonials', adminAuth, async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID().replace(/-/g, '');
  
  await c.env.DB.prepare(`
    INSERT INTO testimonials (id, author_name, author_title, author_location, content, rating, is_featured, is_approved, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, body.authorName, body.authorTitle, body.authorLocation, body.content,
    body.rating, body.isFeatured ? 1 : 0, body.isApproved ? 1 : 0, body.source
  ).run();
  
  return c.json({ success: true, id });
});

// ============================================
// SHARE TRACKING
// ============================================

marketingRoutes.post('/share/track', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID().replace(/-/g, '');
  
  await c.env.DB.prepare(`
    INSERT INTO share_actions (id, user_id, share_type, platform, content_id, share_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, body.userId, body.shareType, body.platform, body.contentId, body.shareUrl).run();
  
  return c.json({ success: true, id });
});

// ============================================
// AUDIT LOG
// ============================================

marketingRoutes.get('/audit-log', adminAuth, async (c) => {
  const logs = await c.env.DB.prepare(`
    SELECT * FROM marketing_audit_log ORDER BY created_at DESC LIMIT 100
  `).all();
  return c.json({ logs: logs.results || [] });
});

export default marketingRoutes;
