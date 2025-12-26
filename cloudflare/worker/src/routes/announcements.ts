import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { sendEmail } from '../utils/email';

const announcementsRoutes = new Hono<AppEnv>();

// Get unread announcements for current user
announcementsRoutes.get('/unread', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const announcements = await c.env.DB.prepare(`
    SELECT a.* FROM announcements a
    WHERE a.is_active = 1
    AND a.id NOT IN (
      SELECT announcement_id FROM announcement_views 
      WHERE user_id = ? AND dismissed = 1
    )
    ORDER BY a.created_at DESC
    LIMIT 5
  `).bind(userId).all();

  return c.json({ announcements: announcements.results || [] });
});

// Get all announcements (paginated)
announcementsRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = 10;
  const offset = (page - 1) * limit;

  const announcements = await c.env.DB.prepare(`
    SELECT a.*, 
      CASE WHEN av.id IS NOT NULL THEN 1 ELSE 0 END as viewed,
      av.viewed_at
    FROM announcements a
    LEFT JOIN announcement_views av ON a.id = av.announcement_id AND av.user_id = ?
    WHERE a.is_active = 1
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(userId, limit, offset).all();

  return c.json({ announcements: announcements.results || [] });
});

// Mark announcement as viewed
announcementsRoutes.post('/:id/view', async (c) => {
  const userId = c.get('userId');
  const announcementId = c.req.param('id');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = crypto.randomUUID().replace(/-/g, '');
  
  await c.env.DB.prepare(`
    INSERT OR REPLACE INTO announcement_views (id, announcement_id, user_id, viewed_at, dismissed)
    VALUES (?, ?, ?, datetime('now'), 0)
  `).bind(id, announcementId, userId).run();

  return c.json({ success: true });
});

// Dismiss announcement
announcementsRoutes.post('/:id/dismiss', async (c) => {
  const userId = c.get('userId');
  const announcementId = c.req.param('id');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = crypto.randomUUID().replace(/-/g, '');
  
  await c.env.DB.prepare(`
    INSERT OR REPLACE INTO announcement_views (id, announcement_id, user_id, viewed_at, dismissed)
    VALUES (?, ?, ?, datetime('now'), 1)
  `).bind(id, announcementId, userId).run();

  return c.json({ success: true });
});

// ============================================
// ADMIN ROUTES
// ============================================

const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.slice(7);
  try {
    const adminSession = await c.env.KV.get(`admin:session:${token}`);
    if (adminSession) {
      const session = JSON.parse(adminSession);
      c.set('adminId', session.adminId);
      c.set('adminRole', session.role);
      await next();
      return;
    }
    return c.json({ error: 'Unauthorized' }, 401);
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// Get all announcements (admin)
announcementsRoutes.get('/admin/list', adminAuth, async (c) => {
  const announcements = await c.env.DB.prepare(`
    SELECT a.*, 
      (SELECT COUNT(*) FROM announcement_views WHERE announcement_id = a.id) as view_count,
      (SELECT COUNT(*) FROM announcement_views WHERE announcement_id = a.id AND dismissed = 1) as dismiss_count,
      (SELECT COUNT(*) FROM announcement_emails WHERE announcement_id = a.id) as email_count
    FROM announcements a
    ORDER BY a.created_at DESC
  `).all();

  return c.json({ announcements: announcements.results || [] });
});

// Create announcement
announcementsRoutes.post('/admin/create', adminAuth, async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID().replace(/-/g, '');

  await c.env.DB.prepare(`
    INSERT INTO announcements (id, title, summary, body, feature_type, icon, cta_text, cta_link, is_active, send_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.title,
    body.summary,
    body.body,
    body.featureType || 'NEW_FEATURE',
    body.icon || 'sparkles',
    body.ctaText || null,
    body.ctaLink || null,
    body.isActive ? 1 : 0,
    body.sendEmail ? 1 : 0
  ).run();

  return c.json({ success: true, id });
});

// Update announcement
announcementsRoutes.put('/admin/:id', adminAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  await c.env.DB.prepare(`
    UPDATE announcements SET
      title = ?, summary = ?, body = ?, feature_type = ?, icon = ?,
      cta_text = ?, cta_link = ?, is_active = ?, send_email = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    body.title,
    body.summary,
    body.body,
    body.featureType || 'NEW_FEATURE',
    body.icon || 'sparkles',
    body.ctaText || null,
    body.ctaLink || null,
    body.isActive ? 1 : 0,
    body.sendEmail ? 1 : 0,
    id
  ).run();

  return c.json({ success: true });
});

// Delete announcement
announcementsRoutes.delete('/admin/:id', adminAuth, async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM announcements WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Send announcement email to all users
announcementsRoutes.post('/admin/:id/send-email', adminAuth, async (c) => {
  const announcementId = c.req.param('id');

  const announcement = await c.env.DB.prepare(
    'SELECT * FROM announcements WHERE id = ?'
  ).bind(announcementId).first();

  if (!announcement) {
    return c.json({ error: 'Announcement not found' }, 404);
  }

  // Get all active users with email
  const users = await c.env.DB.prepare(`
    SELECT id, email, name FROM users 
    WHERE email IS NOT NULL AND email != ''
  `).all();

  const recipients = users.results || [];
  let sentCount = 0;
  let failedCount = 0;

  for (const user of recipients) {
    try {
      const emailId = crypto.randomUUID().replace(/-/g, '');
      
      const result = await sendEmail(c.env, {
        from: 'Heirloom <updates@heirloom.blue>',
        to: (user as any).email,
        subject: `What's New: ${announcement.title}`,
        html: generateAnnouncementEmail(announcement, (user as any).name),
      }, 'ANNOUNCEMENT');

      await c.env.DB.prepare(`
        INSERT INTO announcement_emails (id, announcement_id, user_id, email, status, sent_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        emailId,
        announcementId,
        (user as any).id,
        (user as any).email,
        result.success ? 'SENT' : 'FAILED'
      ).run();

      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    } catch (e) {
      failedCount++;
    }
  }

  // Update announcement with email sent info
  await c.env.DB.prepare(`
    UPDATE announcements SET 
      email_sent_at = datetime('now'),
      email_sent_count = ?
    WHERE id = ?
  `).bind(sentCount, announcementId).run();

  return c.json({ success: true, sentCount, failedCount, totalRecipients: recipients.length });
});

// Send announcement email with voucher to influencers
announcementsRoutes.post('/admin/send-influencer-vouchers', adminAuth, async (c) => {
  const body = await c.req.json();
  const { announcementId, voucherCodes } = body;

  // Get influencers
  const influencers = await c.env.DB.prepare(`
    SELECT * FROM influencers WHERE status NOT IN ('UNSUBSCRIBED', 'DECLINED')
  `).all();

  const recipients = influencers.results || [];
  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < recipients.length; i++) {
    const influencer = recipients[i] as any;
    const voucherCode = voucherCodes && voucherCodes[i] ? voucherCodes[i] : null;

    try {
      const result = await sendEmail(c.env, {
        from: 'Heirloom <admin@heirloom.blue>',
        to: influencer.email,
        subject: 'Partnership Opportunity: Help Families Preserve Their Stories with Heirloom',
        html: generateInfluencerEmail(influencer.name, voucherCode),
      }, 'INFLUENCER_OUTREACH');

      if (result.success) {
        sentCount++;
        await c.env.DB.prepare(`
          UPDATE influencers SET status = 'CONTACTED', last_contacted_at = datetime('now') WHERE id = ?
        `).bind(influencer.id).run();
      } else {
        failedCount++;
      }
    } catch (e) {
      failedCount++;
    }
  }

  return c.json({ success: true, sentCount, failedCount, totalRecipients: recipients.length });
});

function generateAnnouncementEmail(announcement: any, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #030305; font-family: 'Georgia', serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 48px; color: #d4a853;">&#8734;</span>
          <h1 style="color: #d4a853; font-size: 28px; margin: 8px 0;">Heirloom</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 32px; border: 1px solid #d4a85333;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="background: #d4a853; color: #030305; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">WHAT'S NEW</span>
          </div>
          
          <h2 style="color: #ebe6dc; font-size: 24px; margin: 0 0 16px 0; text-align: center;">${announcement.title}</h2>
          
          <p style="color: #ebe6dc99; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Hi ${userName || 'there'},
          </p>
          
          <p style="color: #ebe6dc99; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            ${announcement.summary}
          </p>
          
          <div style="color: #ebe6dc; font-size: 15px; line-height: 1.7;">
            ${announcement.body}
          </div>
          
          ${announcement.cta_text && announcement.cta_link ? `
            <div style="text-align: center; margin-top: 32px;">
              <a href="${announcement.cta_link}" style="display: inline-block; background: #d4a853; color: #030305; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                ${announcement.cta_text}
              </a>
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 32px; color: #ebe6dc66; font-size: 12px;">
          <p>With love,<br>The Heirloom Team</p>
          <p style="margin-top: 16px;">
            <a href="https://heirloom.blue" style="color: #d4a853;">heirloom.blue</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateInfluencerEmail(name: string, voucherCode: string | null): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #030305; font-family: 'Georgia', serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 48px; color: #d4a853;">&#8734;</span>
          <h1 style="color: #d4a853; font-size: 28px; margin: 8px 0;">Heirloom</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 32px; border: 1px solid #d4a85333;">
          <p style="color: #ebe6dc; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Hi ${name || 'there'},
          </p>
          
          <p style="color: #ebe6dc99; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            I'm reaching out because your work resonates deeply with what we're building at Heirloom - a platform that helps families preserve their most precious stories, voices, and memories for future generations.
          </p>
          
          <p style="color: #ebe6dc99; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            We've just launched three powerful new features that I think your audience would love:
          </p>
          
          <ul style="color: #ebe6dc; font-size: 15px; line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px;">
            <li><strong style="color: #d4a853;">60-Second Message</strong> - Record a quick voice message for someone you love in under a minute</li>
            <li><strong style="color: #d4a853;">Person Page</strong> - See everything you've left for each family member in one beautiful view</li>
            <li><strong style="color: #d4a853;">Family Echo</strong> - Recipients can send heartfelt notes back after viewing your messages</li>
          </ul>
          
          ${voucherCode ? `
            <div style="background: #d4a85322; border: 1px solid #d4a853; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="color: #d4a853; font-size: 14px; margin: 0 0 8px 0; font-weight: bold;">YOUR COMPLIMENTARY 1-YEAR FAMILY PLAN</p>
              <p style="color: #ebe6dc; font-size: 24px; font-family: monospace; margin: 0; letter-spacing: 2px;">${voucherCode}</p>
              <p style="color: #ebe6dc99; font-size: 12px; margin: 12px 0 0 0;">Redeem at heirloom.blue/gift/redeem</p>
            </div>
          ` : ''}
          
          <p style="color: #ebe6dc99; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            We'd love to explore a partnership where you could share Heirloom with your community. We offer:
          </p>
          
          <ul style="color: #ebe6dc; font-size: 15px; line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px;">
            <li>Free premium access for you and your family</li>
            <li>Exclusive discount codes for your audience</li>
            <li>Affiliate commission on referrals</li>
          </ul>
          
          <p style="color: #ebe6dc99; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Would you be open to a quick chat about how we might work together?
          </p>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="https://heirloom.blue" style="display: inline-block; background: #d4a853; color: #030305; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Explore Heirloom
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 32px; color: #ebe6dc66; font-size: 12px;">
          <p>Warm regards,<br>The Heirloom Team</p>
          <p style="margin-top: 16px;">
            <a href="https://heirloom.blue" style="color: #d4a853;">heirloom.blue</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export { announcementsRoutes };
