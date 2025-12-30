/**
 * Admin Routes - Cloudflare Workers
 * Handles admin panel operations, analytics, and user management
 */

import { Hono } from 'hono';
import type { Env, AppEnv } from '../index';
import { supportTicketReplyEmail, supportTicketResolvedEmail, newFeaturesAnnouncementEmail } from '../email-templates';
import { sendEmail } from '../utils/email';

export const adminRoutes = new Hono<AppEnv>();

// Admin authentication middleware
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

// Admin login
adminRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;
  
  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }
  
  const admin = await c.env.DB.prepare(`
    SELECT * FROM admin_users WHERE email = ? AND is_active = 1
  `).bind(email).first();
  
  if (!admin) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  
  // Verify password (simplified - in production use proper hashing)
  // For now, check if password matches or if it's the default that needs changing
  const encoder = new TextEncoder();
  const passwordHashStr = admin.password_hash as string;
  const colonIndex = passwordHashStr.indexOf(':');
  const storedHash = colonIndex >= 0 ? passwordHashStr.substring(0, colonIndex) : passwordHashStr;
  const storedSalt = colonIndex >= 0 ? passwordHashStr.substring(colonIndex + 1) : null;
  
  if (storedHash === 'CHANGE_ME_ON_FIRST_LOGIN' || passwordHashStr === 'CHANGE_ME_ON_FIRST_LOGIN') {
    // First login - set the password
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );
    
    const hash = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
    const saltBase64 = btoa(String.fromCharCode(...salt));
    const passwordHash = `${hash}:${saltBase64}`;
    
    const now = new Date().toISOString();
    await c.env.DB.prepare(`
      UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?
    `).bind(passwordHash, now, admin.id).run();
  } else {
    // Verify password
    if (!storedSalt) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    const saltBuffer = Uint8Array.from(atob(storedSalt), c => c.charCodeAt(0));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );
    
    const hash = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
    
    if (hash !== storedHash) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
  }
  
  // Create admin session
  const token = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const now = new Date().toISOString();
  
  await c.env.KV.put(
    `admin:session:${token}`,
    JSON.stringify({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      createdAt: now,
    }),
    { expirationTtl: 86400 } // 24 hours
  );
  
  // Update last login
  await c.env.DB.prepare(`
    UPDATE admin_users SET last_login_at = ? WHERE id = ?
  `).bind(now, admin.id).run();
  
  return c.json({
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      firstName: admin.first_name,
      lastName: admin.last_name,
      role: admin.role,
    },
  });
});

// Admin logout
adminRoutes.post('/logout', adminAuth, async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.substring(7);
  
  if (token) {
    await c.env.KV.delete(`admin:session:${token}`);
  }
  
  return c.json({ success: true });
});

// Get current admin
adminRoutes.get('/me', adminAuth, async (c) => {
  const adminId = c.get('adminId');
  
  const admin = await c.env.DB.prepare(`
    SELECT id, email, first_name, last_name, role, last_login_at, created_at
    FROM admin_users WHERE id = ?
  `).bind(adminId).first();
  
  return c.json({
    id: admin?.id,
    email: admin?.email,
    firstName: admin?.first_name,
    lastName: admin?.last_name,
    role: admin?.role,
    lastLoginAt: admin?.last_login_at,
    createdAt: admin?.created_at,
  });
});

// Get dashboard analytics
adminRoutes.get('/analytics', adminAuth, async (c) => {
  // User stats
  const userStats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) as new_users_week,
      SUM(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 ELSE 0 END) as new_users_month
    FROM users
  `).first();
  
  // Subscription stats
  const subStats = await c.env.DB.prepare(`
    SELECT 
      tier,
      COUNT(*) as count
    FROM subscriptions
    WHERE status = 'ACTIVE'
    GROUP BY tier
  `).all();
  
  // Content stats
  const contentStats = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM memories) as total_memories,
      (SELECT COUNT(*) FROM letters) as total_letters,
      (SELECT COUNT(*) FROM voice_recordings) as total_voice,
      (SELECT COUNT(*) FROM family_members) as total_family_members
  `).first();
  
  // Storage stats
  const storageStats = await c.env.DB.prepare(`
    SELECT 
      COALESCE(SUM(file_size), 0) as memory_storage
    FROM memories
  `).first();
  
  const voiceStorage = await c.env.DB.prepare(`
    SELECT 
      COALESCE(SUM(file_size), 0) as voice_storage
    FROM voice_recordings
  `).first();
  
  // Recent activity
  const recentUsers = await c.env.DB.prepare(`
    SELECT id, email, first_name, last_name, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 10
  `).all();
  
  return c.json({
    users: {
      total: userStats?.total_users || 0,
      newThisWeek: userStats?.new_users_week || 0,
      newThisMonth: userStats?.new_users_month || 0,
    },
    subscriptions: {
      byTier: subStats.results.reduce((acc: any, s: any) => {
        acc[s.tier] = s.count;
        return acc;
      }, {}),
    },
    content: {
      memories: contentStats?.total_memories || 0,
      letters: contentStats?.total_letters || 0,
      voiceRecordings: contentStats?.total_voice || 0,
      familyMembers: contentStats?.total_family_members || 0,
    },
    storage: {
      total: ((storageStats?.memory_storage as number) || 0) + ((voiceStorage?.voice_storage as number) || 0),
      memories: storageStats?.memory_storage || 0,
      voice: voiceStorage?.voice_storage || 0,
    },
    recentUsers: recentUsers.results.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: `${u.first_name} ${u.last_name}`,
      createdAt: u.created_at,
    })),
  });
});

// Get all users (paginated)
adminRoutes.get('/users', adminAuth, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const search = c.req.query('search');
  const offset = (page - 1) * limit;
  
  let query = `SELECT u.*, s.tier, s.status as subscription_status
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id`;
  const params: any[] = [];
  
  if (search) {
    query += ` WHERE u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const users = await c.env.DB.prepare(query).bind(...params).all();
  
  // Get total count
  let countQuery = `SELECT COUNT(*) as count FROM users`;
  if (search) {
    countQuery += ` WHERE email LIKE ? OR first_name LIKE ? OR last_name LIKE ?`;
  }
  const countResult = search 
    ? await c.env.DB.prepare(countQuery).bind(`%${search}%`, `%${search}%`, `%${search}%`).first()
    : await c.env.DB.prepare(countQuery).first();
  
  return c.json({
    data: users.results.map((u: any) => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      emailVerified: !!u.email_verified,
      tier: u.tier || 'FREE',
      subscriptionStatus: u.subscription_status || 'NONE',
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at,
    })),
    pagination: {
      page,
      limit,
      total: countResult?.count || 0,
      totalPages: Math.ceil((countResult?.count as number || 0) / limit),
    },
  });
});

// Get user details
adminRoutes.get('/users/:id', adminAuth, async (c) => {
  const userId = c.req.param('id');
  
  const user = await c.env.DB.prepare(`
    SELECT u.*, s.tier, s.status as subscription_status, s.current_period_end
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id
    WHERE u.id = ?
  `).bind(userId).first();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Get user stats
  const stats = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM memories WHERE user_id = ?) as memories,
      (SELECT COUNT(*) FROM letters WHERE user_id = ?) as letters,
      (SELECT COUNT(*) FROM voice_recordings WHERE user_id = ?) as voice,
      (SELECT COUNT(*) FROM family_members WHERE user_id = ?) as family
  `).bind(userId, userId, userId, userId).first();
  
  return c.json({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    emailVerified: !!user.email_verified,
    twoFactorEnabled: !!user.two_factor_enabled,
    tier: user.tier || 'FREE',
    subscriptionStatus: user.subscription_status || 'NONE',
    currentPeriodEnd: user.current_period_end,
    stats: {
      memories: stats?.memories || 0,
      letters: stats?.letters || 0,
      voiceRecordings: stats?.voice || 0,
      familyMembers: stats?.family || 0,
    },
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
  });
});

// Update user (admin action)
adminRoutes.patch('/users/:id', adminAuth, async (c) => {
  const userId = c.req.param('id');
  const body = await c.req.json();
  const adminRole = c.get('adminRole');
  
  if (adminRole !== 'SUPER_ADMIN') {
    return c.json({ error: 'Only super admins can modify users' }, 403);
  }
  
  const { tier, emailVerified } = body;
  const now = new Date().toISOString();
  
  if (tier) {
    // Update subscription
    const existing = await c.env.DB.prepare(`
      SELECT id FROM subscriptions WHERE user_id = ?
    `).bind(userId).first();
    
    if (existing) {
      await c.env.DB.prepare(`
        UPDATE subscriptions SET tier = ?, updated_at = ? WHERE user_id = ?
      `).bind(tier, now, userId).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO subscriptions (id, user_id, tier, status, billing_cycle, created_at, updated_at)
        VALUES (?, ?, ?, 'ACTIVE', 'monthly', ?, ?)
      `).bind(crypto.randomUUID(), userId, tier, now, now).run();
    }
  }
  
  if (emailVerified !== undefined) {
    await c.env.DB.prepare(`
      UPDATE users SET email_verified = ?, updated_at = ? WHERE id = ?
    `).bind(emailVerified ? 1 : 0, now, userId).run();
  }
  
  return c.json({ success: true, message: 'User updated' });
});

// Get all coupons
adminRoutes.get('/coupons', adminAuth, async (c) => {
  const coupons = await c.env.DB.prepare(`
    SELECT * FROM coupons ORDER BY created_at DESC
  `).all();
  
  return c.json(coupons.results.map((coupon: any) => ({
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
    maxUses: coupon.max_uses,
    currentUses: coupon.current_uses,
    validFrom: coupon.valid_from,
    validUntil: coupon.valid_until,
    isActive: !!coupon.is_active,
    applicableTiers: coupon.applicable_tiers ? JSON.parse(coupon.applicable_tiers) : [],
    createdAt: coupon.created_at,
  })));
});

// Create coupon
adminRoutes.post('/coupons', adminAuth, async (c) => {
  const adminId = c.get('adminId');
  const body = await c.req.json();
  
  const { code, description, discountType, discountValue, maxUses, validFrom, validUntil, applicableTiers } = body;
  
  if (!code || !discountValue) {
    return c.json({ error: 'Code and discount value are required' }, 400);
  }
  
  // Check if code already exists
  const existing = await c.env.DB.prepare(`
    SELECT id FROM coupons WHERE code = ?
  `).bind(code.toUpperCase()).first();
  
  if (existing) {
    return c.json({ error: 'Coupon code already exists' }, 400);
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO coupons (id, code, description, discount_type, discount_value, max_uses, valid_from, valid_until, applicable_tiers, created_by_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    code.toUpperCase(),
    description || null,
    discountType || 'PERCENTAGE',
    discountValue,
    maxUses || null,
    validFrom || now,
    validUntil || null,
    applicableTiers ? JSON.stringify(applicableTiers) : '[]',
    adminId,
    now,
    now
  ).run();
  
  const coupon = await c.env.DB.prepare(`
    SELECT * FROM coupons WHERE id = ?
  `).bind(id).first();
  
  return c.json({
    id: coupon?.id,
    code: coupon?.code,
    description: coupon?.description,
    discountType: coupon?.discount_type,
    discountValue: coupon?.discount_value,
    createdAt: coupon?.created_at,
  }, 201);
});

// Update coupon
adminRoutes.patch('/coupons/:id', adminAuth, async (c) => {
  const couponId = c.req.param('id');
  const body = await c.req.json();
  
  const { description, discountValue, maxUses, validUntil, isActive, applicableTiers } = body;
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE coupons 
    SET description = COALESCE(?, description),
        discount_value = COALESCE(?, discount_value),
        max_uses = COALESCE(?, max_uses),
        valid_until = COALESCE(?, valid_until),
        is_active = COALESCE(?, is_active),
        applicable_tiers = COALESCE(?, applicable_tiers),
        updated_at = ?
    WHERE id = ?
  `).bind(
    description,
    discountValue,
    maxUses,
    validUntil,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    applicableTiers ? JSON.stringify(applicableTiers) : null,
    now,
    couponId
  ).run();
  
  return c.json({ success: true, message: 'Coupon updated' });
});

// Delete coupon
adminRoutes.delete('/coupons/:id', adminAuth, async (c) => {
  const couponId = c.req.param('id');
  
  await c.env.DB.prepare(`
    DELETE FROM coupons WHERE id = ?
  `).bind(couponId).run();
  
  return c.body(null, 204);
});

// Get support tickets
adminRoutes.get('/support/tickets', adminAuth, async (c) => {
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  let query = `SELECT t.*, u.email, u.first_name, u.last_name
    FROM support_tickets t
    JOIN users u ON t.user_id = u.id`;
  const params: any[] = [];
  
  if (status) {
    query += ` WHERE t.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const tickets = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    data: tickets.results.map((t: any) => ({
      id: t.id,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      user: {
        id: t.user_id,
        email: t.email,
        name: `${t.first_name} ${t.last_name}`,
      },
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })),
  });
});

// Update support ticket
adminRoutes.patch('/support/tickets/:id', adminAuth, async (c) => {
  const ticketId = c.req.param('id');
  const adminId = c.get('adminId');
  const body = await c.req.json();
  
  const { status, assignedTo, priority, resolutionNote } = body;
  const now = new Date().toISOString();
  
  // Get current ticket status before update
  const currentTicket = await c.env.DB.prepare(`
    SELECT t.status, t.ticket_number, t.subject, u.email, u.first_name
    FROM support_tickets t
    JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `).bind(ticketId).first();
  
  await c.env.DB.prepare(`
    UPDATE support_tickets 
    SET status = COALESCE(?, status),
        assigned_to = COALESCE(?, assigned_to),
        priority = COALESCE(?, priority),
        updated_at = ?,
        resolved_at = CASE WHEN ? = 'RESOLVED' THEN ? ELSE resolved_at END
    WHERE id = ?
  `).bind(status, assignedTo || adminId, priority, now, status, now, ticketId).run();
  
  // Send email notification when ticket is resolved
  if (status === 'RESOLVED' && currentTicket && currentTicket.status !== 'RESOLVED' && currentTicket.email && c.env.RESEND_API_KEY) {
    try {
      const userName = (currentTicket.first_name as string) || 'there';
      const emailContent = supportTicketResolvedEmail(
        userName,
        currentTicket.ticket_number as string,
        currentTicket.subject as string,
        resolutionNote
      );
      
      await sendEmail(c.env, {
        from: 'Heirloom <noreply@heirloom.blue>',
        to: currentTicket.email as string,
        subject: emailContent.subject,
        html: emailContent.html,
      }, 'SUPPORT_TICKET_RESOLVED');
    } catch (emailError) {
      console.error('Failed to send ticket resolved email:', emailError);
    }
  }
  
  // Log audit action
  await logAuditAction(c.env, adminId, 'UPDATE_TICKET', { ticketId, status, priority });
  
  return c.json({ success: true, message: 'Ticket updated' });
});

// Get single support ticket with messages
adminRoutes.get('/support/tickets/:id', adminAuth, async (c) => {
  const ticketId = c.req.param('id');
  
  const ticket = await c.env.DB.prepare(`
    SELECT t.*, u.email, u.first_name, u.last_name
    FROM support_tickets t
    JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `).bind(ticketId).first();
  
  if (!ticket) {
    return c.json({ error: 'Ticket not found' }, 404);
  }
  
  const messages = await c.env.DB.prepare(`
    SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC
  `).bind(ticketId).all();
  
  return c.json({
    id: ticket.id,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    user: {
      id: ticket.user_id,
      email: ticket.email,
      name: `${ticket.first_name} ${ticket.last_name}`,
    },
    messages: messages.results.map((m: any) => ({
      id: m.id,
      content: m.content,
      senderType: m.sender_type,
      senderId: m.sender_id,
      createdAt: m.created_at,
    })),
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  });
});

// Reply to support ticket
adminRoutes.post('/support/tickets/:id/reply', adminAuth, async (c) => {
  const ticketId = c.req.param('id');
  const adminId = c.get('adminId');
  const body = await c.req.json();
  const { message } = body;
  
  if (!message) {
    return c.json({ error: 'Message is required' }, 400);
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO ticket_messages (id, ticket_id, content, sender_type, sender_id, created_at)
    VALUES (?, ?, ?, 'ADMIN', ?, ?)
  `).bind(id, ticketId, message, adminId, now).run();
  
  // Update ticket status to IN_PROGRESS if it was OPEN
  await c.env.DB.prepare(`
    UPDATE support_tickets SET status = 'IN_PROGRESS', updated_at = ? WHERE id = ? AND status = 'OPEN'
  `).bind(now, ticketId).run();
  
  // Get ticket details and user info for email
  const ticket = await c.env.DB.prepare(`
    SELECT t.ticket_number, t.subject, u.email, u.first_name, u.last_name
    FROM support_tickets t
    JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `).bind(ticketId).first();
  
  // Get admin name for email
  const admin = await c.env.DB.prepare(`
    SELECT first_name, last_name FROM admin_users WHERE id = ?
  `).bind(adminId).first();
  const adminName = admin ? `${(admin.first_name as string) || ''} ${(admin.last_name as string) || ''}`.trim() || 'Heirloom Support' : 'Heirloom Support';
  
  // Send email notification to user
  if (ticket && ticket.email && c.env.RESEND_API_KEY) {
    try {
      const userName = (ticket.first_name as string) || 'there';
      const emailContent = supportTicketReplyEmail(
        userName,
        ticket.ticket_number as string,
        ticket.subject as string,
        message,
        adminName
      );
      
      await sendEmail(c.env, {
        from: 'Heirloom <noreply@heirloom.blue>',
        to: ticket.email as string,
        subject: emailContent.subject,
        html: emailContent.html,
      }, 'SUPPORT_TICKET_REPLY');
    } catch (emailError) {
      console.error('Failed to send ticket reply email:', emailError);
    }
  }
  
  // Log audit action
  await logAuditAction(c.env, adminId, 'REPLY_TICKET', { ticketId });
  
  return c.json({ success: true, messageId: id });
});

// ============================================
// USER SUPPORT ACTIONS
// ============================================

// Extend user trial
adminRoutes.post('/users/:id/extend-trial', adminAuth, async (c) => {
  const userId = c.req.param('id');
  const adminId = c.get('adminId');
  const adminRole = c.get('adminRole');
  const body = await c.req.json();
  const { days } = body;
  
  if (adminRole !== 'SUPER_ADMIN' && adminRole !== 'ADMIN') {
    return c.json({ error: 'Insufficient permissions' }, 403);
  }
  
  const now = new Date().toISOString();
  const newEndDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  
  await c.env.DB.prepare(`
    UPDATE subscriptions 
    SET trial_end = ?, updated_at = ?
    WHERE user_id = ?
  `).bind(newEndDate, now, userId).run();
  
  await logAuditAction(c.env, adminId, 'EXTEND_TRIAL', { userId, days });
  
  return c.json({ success: true, message: `Trial extended by ${days} days` });
});

// Apply coupon to user
adminRoutes.post('/users/:id/apply-coupon', adminAuth, async (c) => {
  const userId = c.req.param('id');
  const adminId = c.get('adminId');
  const body = await c.req.json();
  const { couponCode } = body;
  
  const coupon = await c.env.DB.prepare(`
    SELECT * FROM coupons WHERE code = ? AND is_active = 1
  `).bind(couponCode.toUpperCase()).first();
  
  if (!coupon) {
    return c.json({ error: 'Invalid or inactive coupon' }, 400);
  }
  
  const now = new Date().toISOString();
  
  // Record coupon usage
  await c.env.DB.prepare(`
    INSERT INTO coupon_usages (id, coupon_id, user_id, applied_by_admin_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(crypto.randomUUID(), coupon.id, userId, adminId, now).run();
  
  // Update coupon usage count
  await c.env.DB.prepare(`
    UPDATE coupons SET current_uses = current_uses + 1 WHERE id = ?
  `).bind(coupon.id).run();
  
  await logAuditAction(c.env, adminId, 'APPLY_COUPON', { userId, couponCode });
  
  return c.json({ success: true, message: 'Coupon applied successfully' });
});

// Cancel user subscription
adminRoutes.post('/users/:id/cancel-subscription', adminAuth, async (c) => {
  const userId = c.req.param('id');
  const adminId = c.get('adminId');
  const adminRole = c.get('adminRole');
  
  if (adminRole !== 'SUPER_ADMIN') {
    return c.json({ error: 'Only super admins can cancel subscriptions' }, 403);
  }
  
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE subscriptions SET status = 'CANCELLED', cancelled_at = ?, updated_at = ? WHERE user_id = ?
  `).bind(now, now, userId).run();
  
  await logAuditAction(c.env, adminId, 'CANCEL_SUBSCRIPTION', { userId });
  
  return c.json({ success: true, message: 'Subscription cancelled' });
});

// ============================================
// SYSTEM HEALTH & MONITORING
// ============================================

adminRoutes.get('/system/health', adminAuth, async (c) => {
  const checks: any = {
    database: 'unknown',
    storage: 'unknown',
    kv: 'unknown',
    timestamp: new Date().toISOString(),
  };
  
  // Check database
  try {
    await c.env.DB.prepare('SELECT 1').first();
    checks.database = 'healthy';
  } catch {
    checks.database = 'unhealthy';
  }
  
  // Check KV
  try {
    await c.env.KV.put('health-check', 'ok', { expirationTtl: 60 });
    const val = await c.env.KV.get('health-check');
    checks.kv = val === 'ok' ? 'healthy' : 'unhealthy';
  } catch {
    checks.kv = 'unhealthy';
  }
  
  // Check R2
  try {
    await c.env.STORAGE.head('health-check');
    checks.storage = 'healthy';
  } catch (e: any) {
    // 404 is fine, means bucket is accessible
    checks.storage = e.message?.includes('404') || e.name === 'R2Error' ? 'healthy' : 'unhealthy';
  }
  
  const allHealthy = Object.values(checks).every(v => v === 'healthy' || v === new Date().toISOString());
  
  return c.json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
  });
});

adminRoutes.get('/system/stats', adminAuth, async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM memories) as total_memories,
      (SELECT COUNT(*) FROM letters) as total_letters,
      (SELECT COUNT(*) FROM voice_recordings) as total_voice,
      (SELECT COUNT(*) FROM family_members) as total_family,
      (SELECT COUNT(*) FROM support_tickets WHERE status != 'RESOLVED') as open_tickets,
      (SELECT COALESCE(SUM(file_size), 0) FROM memories) as memory_storage,
      (SELECT COALESCE(SUM(file_size), 0) FROM voice_recordings) as voice_storage
  `).first();
  
  return c.json({
    users: stats?.total_users || 0,
    content: {
      memories: stats?.total_memories || 0,
      letters: stats?.total_letters || 0,
      voiceRecordings: stats?.total_voice || 0,
      familyMembers: stats?.total_family || 0,
    },
    storage: {
      total: ((stats?.memory_storage as number) || 0) + ((stats?.voice_storage as number) || 0),
      memories: stats?.memory_storage || 0,
      voice: stats?.voice_storage || 0,
    },
    openTickets: stats?.open_tickets || 0,
  });
});

// ============================================
// AUDIT LOGS
// ============================================

adminRoutes.get('/audit-logs', adminAuth, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const action = c.req.query('action');
  const adminId = c.req.query('adminId');
  const offset = (page - 1) * limit;
  
  let query = `SELECT al.*, au.email as admin_email, au.first_name, au.last_name
    FROM audit_logs al
    LEFT JOIN admin_users au ON al.admin_id = au.id`;
  const params: any[] = [];
  const conditions: string[] = [];
  
  if (action) {
    conditions.push('al.action = ?');
    params.push(action);
  }
  if (adminId) {
    conditions.push('al.admin_id = ?');
    params.push(adminId);
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const logs = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    data: logs.results.map((log: any) => ({
      id: log.id,
      action: log.action,
      details: log.details ? JSON.parse(log.details) : null,
      admin: {
        id: log.admin_id,
        email: log.admin_email,
        name: `${log.first_name || ''} ${log.last_name || ''}`.trim(),
      },
      ipAddress: log.ip_address,
      createdAt: log.created_at,
    })),
    pagination: { page, limit },
  });
});

// ============================================
// ADMIN USER MANAGEMENT
// ============================================

adminRoutes.get('/admin-users', adminAuth, async (c) => {
  const adminRole = c.get('adminRole');
  
  if (adminRole !== 'SUPER_ADMIN') {
    return c.json({ error: 'Only super admins can view admin users' }, 403);
  }
  
  const admins = await c.env.DB.prepare(`
    SELECT id, email, first_name, last_name, role, is_active, last_login_at, created_at
    FROM admin_users ORDER BY created_at DESC
  `).all();
  
  return c.json(admins.results.map((a: any) => ({
    id: a.id,
    email: a.email,
    firstName: a.first_name,
    lastName: a.last_name,
    role: a.role,
    isActive: !!a.is_active,
    lastLoginAt: a.last_login_at,
    createdAt: a.created_at,
  })));
});

adminRoutes.post('/admin-users', adminAuth, async (c) => {
  const adminId = c.get('adminId');
  const adminRole = c.get('adminRole');
  const body = await c.req.json();
  
  if (adminRole !== 'SUPER_ADMIN') {
    return c.json({ error: 'Only super admins can create admin users' }, 403);
  }
  
  const { email, firstName, lastName, role } = body;
  
  if (!email || !firstName || !lastName) {
    return c.json({ error: 'Email, first name, and last name are required' }, 400);
  }
  
  const existing = await c.env.DB.prepare(`
    SELECT id FROM admin_users WHERE email = ?
  `).bind(email).first();
  
  if (existing) {
    return c.json({ error: 'Admin user with this email already exists' }, 400);
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO admin_users (id, email, first_name, last_name, role, password_hash, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'CHANGE_ME_ON_FIRST_LOGIN:', 1, ?, ?)
  `).bind(id, email, firstName, lastName, role || 'ADMIN', now, now).run();
  
  await logAuditAction(c.env, adminId, 'CREATE_ADMIN', { newAdminId: id, email });
  
  return c.json({ success: true, id, message: 'Admin user created. They must set password on first login.' }, 201);
});

adminRoutes.patch('/admin-users/:id', adminAuth, async (c) => {
  const targetId = c.req.param('id');
  const adminId = c.get('adminId');
  const adminRole = c.get('adminRole');
  const body = await c.req.json();
  
  if (adminRole !== 'SUPER_ADMIN') {
    return c.json({ error: 'Only super admins can update admin users' }, 403);
  }
  
  const { role, isActive } = body;
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE admin_users 
    SET role = COALESCE(?, role),
        is_active = COALESCE(?, is_active),
        updated_at = ?
    WHERE id = ?
  `).bind(role, isActive !== undefined ? (isActive ? 1 : 0) : null, now, targetId).run();
  
  await logAuditAction(c.env, adminId, 'UPDATE_ADMIN', { targetId, role, isActive });
  
  return c.json({ success: true, message: 'Admin user updated' });
});

adminRoutes.delete('/admin-users/:id', adminAuth, async (c) => {
  const targetId = c.req.param('id');
  const adminId = c.get('adminId');
  const adminRole = c.get('adminRole');
  
  if (adminRole !== 'SUPER_ADMIN') {
    return c.json({ error: 'Only super admins can delete admin users' }, 403);
  }
  
  if (targetId === adminId) {
    return c.json({ error: 'Cannot delete yourself' }, 400);
  }
  
  await c.env.DB.prepare(`DELETE FROM admin_users WHERE id = ?`).bind(targetId).run();
  
  await logAuditAction(c.env, adminId, 'DELETE_ADMIN', { targetId });
  
  return c.body(null, 204);
});

// ============================================
// EMAIL MANAGEMENT
// ============================================

adminRoutes.get('/emails', adminAuth, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const status = c.req.query('status');
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM email_logs`;
  const params: any[] = [];
  
  if (status) {
    query += ` WHERE status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const emails = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    data: emails.results.map((e: any) => ({
      id: e.id,
      to: e.to_email,
      subject: e.subject,
      status: e.status,
      sentAt: e.sent_at,
      createdAt: e.created_at,
    })),
    pagination: { page, limit },
  });
});

// Get single email details (for viewing full body, error messages, etc.)
adminRoutes.get('/emails/:id', adminAuth, async (c) => {
  const emailId = c.req.param('id');
  
  const email = await c.env.DB.prepare(`
    SELECT * FROM email_logs WHERE id = ?
  `).bind(emailId).first();
  
  if (!email) {
    return c.json({ error: 'Email not found' }, 404);
  }
  
  return c.json({
    id: email.id,
    to: email.to_email,
    subject: email.subject,
    body: email.body,
    status: email.status,
    errorMessage: email.error_message,
    emailType: email.email_type,
    sentAt: email.sent_at,
    createdAt: email.created_at,
  });
});

// Resend a failed email
adminRoutes.post('/emails/:id/resend', adminAuth, async (c) => {
  const adminId = c.get('adminId');
  const emailId = c.req.param('id');
  
  const email = await c.env.DB.prepare(`
    SELECT * FROM email_logs WHERE id = ?
  `).bind(emailId).first();
  
  if (!email) {
    return c.json({ error: 'Email not found' }, 404);
  }
  
  if (email.status === 'SENT') {
    return c.json({ error: 'Email was already sent successfully' }, 400);
  }
  
  try {
    const result = await sendEmail(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: email.to_email as string,
      subject: email.subject as string,
      html: email.body as string,
    }, 'RESEND_FAILED_EMAIL');
    
    if (result.success) {
      await c.env.DB.prepare(`
        UPDATE email_logs SET status = 'SENT', sent_at = ?, error_message = NULL WHERE id = ?
      `).bind(new Date().toISOString(), emailId).run();
      
      await logAuditAction(c.env, adminId, 'RESEND_EMAIL', { emailId, to: email.to_email });
      
      return c.json({ success: true, message: 'Email resent successfully' });
    } else {
      return c.json({ error: `Failed to resend: ${result.error}` }, 500);
    }
  } catch (err: any) {
    return c.json({ error: `Failed to resend email: ${err.message}` }, 500);
  }
});

adminRoutes.post('/emails/bulk', adminAuth, async (c) => {
  const adminId = c.get('adminId');
  const adminRole = c.get('adminRole');
  const body = await c.req.json();
  
  if (adminRole !== 'SUPER_ADMIN') {
    return c.json({ error: 'Only super admins can send bulk emails' }, 403);
  }
  
  const { subject, body: emailBody, recipients } = body;
  
  if (!subject || !emailBody) {
    return c.json({ error: 'Subject and body are required' }, 400);
  }
  
  let recipientEmails: string[] = [];
  
  if (recipients === 'all') {
    const users = await c.env.DB.prepare(`SELECT email FROM users`).all();
    recipientEmails = users.results.map((u: any) => u.email);
  } else if (Array.isArray(recipients)) {
    recipientEmails = recipients;
  }
  
  // Queue emails (in production, use a proper queue)
  const now = new Date().toISOString();
  for (const email of recipientEmails) {
    await c.env.DB.prepare(`
      INSERT INTO email_logs (id, to_email, subject, body, status, created_at)
      VALUES (?, ?, ?, ?, 'QUEUED', ?)
    `).bind(crypto.randomUUID(), email, subject, emailBody, now).run();
  }
  
  await logAuditAction(c.env, adminId, 'SEND_BULK_EMAIL', { subject, recipientCount: recipientEmails.length });
  
  return c.json({ success: true, message: `${recipientEmails.length} emails queued` });
});

// Send product update email to users who opted in for marketing
adminRoutes.post('/emails/product-update', adminAuth, async (c) => {
  const adminId = c.get('adminId');
  const adminRole = c.get('adminRole');
  const body = await c.req.json();
  
  if (adminRole !== 'SUPER_ADMIN') {
    return c.json({ error: 'Only super admins can send product update emails' }, 403);
  }
  
  const { subject, body: emailBody, previewText } = body;
  
  if (!subject || !emailBody) {
    return c.json({ error: 'Subject and body are required' }, 400);
  }
  
  // Get users who opted in for marketing emails
  const users = await c.env.DB.prepare(`
    SELECT email, first_name, last_name 
    FROM users 
    WHERE marketing_consent = 1 OR marketing_consent = true
  `).all();
  
  if (users.results.length === 0) {
    return c.json({ error: 'No users have opted in for marketing emails' }, 400);
  }
  
  const now = new Date().toISOString();
  let sentCount = 0;
  let failedCount = 0;
  
  // Send emails to opted-in users
  for (const user of users.results as any[]) {
    try {
      const result = await sendEmail(c.env, {
        from: 'Heirloom <updates@heirloom.blue>',
        to: user.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #f5f5f0; padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 48px; color: #D4AF37;">&infin;</span>
              <h1 style="color: #D4AF37; margin: 8px 0;">Heirloom</h1>
            </div>
            <p>Hi ${user.first_name || 'there'},</p>
            ${emailBody}
            <hr style="border: 1px solid #333; margin: 24px 0;" />
            <p style="color: #888; font-size: 12px;">
              You're receiving this email because you opted in to receive product updates from Heirloom.
              <br /><br />
              <a href="https://heirloom.blue/settings?tab=notifications" style="color: #D4AF37;">Manage your email preferences</a>
            </p>
          </div>
        `,
      }, 'PRODUCT_UPDATE');
      
      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
        console.error('Failed to send product update email to', user.email);
      }
    } catch (err) {
      failedCount++;
      console.error('Error sending product update email:', err);
    }
  }
  
  await logAuditAction(c.env, adminId, 'SEND_PRODUCT_UPDATE_EMAIL', { 
    subject, 
    sentCount, 
    failedCount,
    totalOptedIn: users.results.length 
  });
  
  return c.json({ 
    success: true, 
    message: `Product update sent to ${sentCount} users (${failedCount} failed)`,
    sentCount,
    failedCount,
    totalOptedIn: users.results.length
  });
});

// ============================================
// BILLING ANALYSIS & ERROR MANAGEMENT
// ============================================

adminRoutes.get('/billing/errors', adminAuth, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  const status = c.req.query('status'); // FAILED, PENDING_RETRY, RESOLVED
  
  let query = `
    SELECT be.*, u.email, u.first_name, u.last_name, s.tier
    FROM billing_errors be
    JOIN users u ON be.user_id = u.id
    LEFT JOIN subscriptions s ON u.id = s.user_id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    query += ` AND be.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY be.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const errors = await c.env.DB.prepare(query).bind(...params).all();
  
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM billing_errors
  `).first();
  
  return c.json({
    data: errors.results.map((e: any) => ({
      id: e.id,
      userId: e.user_id,
      userEmail: e.email,
      userName: `${e.first_name} ${e.last_name}`,
      tier: e.tier,
      errorType: e.error_type,
      errorMessage: e.error_message,
      amount: e.amount,
      currency: e.currency,
      status: e.status,
      retryCount: e.retry_count,
      lastRetryAt: e.last_retry_at,
      notifiedAt: e.notified_at,
      resolvedAt: e.resolved_at,
      createdAt: e.created_at,
    })),
    pagination: { page, limit, total: countResult?.total || 0 },
  });
});

adminRoutes.get('/billing/errors/stats', adminAuth, async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'PENDING_RETRY' THEN 1 ELSE 0 END) as pending_retry,
      SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN created_at > datetime('now', '-24 hours') THEN 1 ELSE 0 END) as last_24h,
      SUM(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) as last_7d
    FROM billing_errors
  `).first();
  
  const byType = await c.env.DB.prepare(`
    SELECT error_type, COUNT(*) as count
    FROM billing_errors
    WHERE status != 'RESOLVED'
    GROUP BY error_type
  `).all();
  
  return c.json({
    total: stats?.total || 0,
    failed: stats?.failed || 0,
    pendingRetry: stats?.pending_retry || 0,
    resolved: stats?.resolved || 0,
    last24Hours: stats?.last_24h || 0,
    last7Days: stats?.last_7d || 0,
    byType: byType.results.reduce((acc: any, t: any) => {
      acc[t.error_type] = t.count;
      return acc;
    }, {}),
  });
});

adminRoutes.post('/billing/errors/:id/notify', adminAuth, async (c) => {
  const adminId = c.get('adminId');
  const errorId = c.req.param('id');
  
  const error = await c.env.DB.prepare(`
    SELECT be.*, u.email, u.first_name
    FROM billing_errors be
    JOIN users u ON be.user_id = u.id
    WHERE be.id = ?
  `).bind(errorId).first();
  
  if (!error) {
    return c.json({ error: 'Billing error not found' }, 404);
  }
  
  // Send notification email to user
  try {
    const { baseTemplate } = await import('../email-templates');
    const emailContent = baseTemplate(`
      <h1 style="color: #d4af37; font-size: 24px; margin-bottom: 16px;">Payment Issue</h1>
      <p>Hi ${error.first_name},</p>
      <p>We noticed there was an issue processing your recent payment for your Heirloom subscription.</p>
      <p><strong>Error:</strong> ${error.error_message}</p>
      <p><strong>Amount:</strong> $${(error.amount as number / 100).toFixed(2)} ${error.currency}</p>
      <p>Please update your payment method to continue enjoying Heirloom's features.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://heirloom.blue/settings?tab=billing" style="background: linear-gradient(135deg, #d4af37, #b8860b); color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">Update Payment Method</a>
      </div>
      <p>If you have any questions, please contact our support team.</p>
    `);
    
    await sendEmail(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: error.email as string,
      subject: 'Action Required: Payment Issue with Your Heirloom Subscription',
      html: emailContent,
    }, 'BILLING_ERROR_NOTIFICATION');
    
    // Update notification timestamp
    await c.env.DB.prepare(`
      UPDATE billing_errors SET notified_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), errorId).run();
    
    await logAuditAction(c.env, adminId, 'NOTIFY_BILLING_ERROR', { errorId, userId: error.user_id });
    
    return c.json({ success: true, message: 'Notification sent to user' });
  } catch (err: any) {
    return c.json({ error: 'Failed to send notification', details: err.message }, 500);
  }
});

adminRoutes.post('/billing/errors/:id/reprocess', adminAuth, async (c) => {
  const adminId = c.get('adminId');
  const errorId = c.req.param('id');
  
  const error = await c.env.DB.prepare(`
    SELECT * FROM billing_errors WHERE id = ?
  `).bind(errorId).first();
  
  if (!error) {
    return c.json({ error: 'Billing error not found' }, 404);
  }
  
  // Update retry count and status
  const now = new Date().toISOString();
  const newRetryCount = ((error.retry_count as number) || 0) + 1;
  
  // In production, this would call Stripe to retry the payment
  // For now, we'll simulate the retry and mark as pending
  await c.env.DB.prepare(`
    UPDATE billing_errors 
    SET status = 'PENDING_RETRY', retry_count = ?, last_retry_at = ?
    WHERE id = ?
  `).bind(newRetryCount, now, errorId).run();
  
  await logAuditAction(c.env, adminId, 'REPROCESS_BILLING', { errorId, userId: error.user_id, retryCount: newRetryCount });
  
  return c.json({ 
    success: true, 
    message: 'Payment reprocessing initiated',
    retryCount: newRetryCount,
  });
});

adminRoutes.post('/billing/errors/:id/resolve', adminAuth, async (c) => {
  const adminId = c.get('adminId');
  const errorId = c.req.param('id');
  const body = await c.req.json();
  const { resolution } = body;
  
  const error = await c.env.DB.prepare(`
    SELECT * FROM billing_errors WHERE id = ?
  `).bind(errorId).first();
  
  if (!error) {
    return c.json({ error: 'Billing error not found' }, 404);
  }
  
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    UPDATE billing_errors 
    SET status = 'RESOLVED', resolved_at = ?, resolution_notes = ?
    WHERE id = ?
  `).bind(now, resolution || 'Manually resolved by admin', errorId).run();
  
  await logAuditAction(c.env, adminId, 'RESOLVE_BILLING_ERROR', { errorId, userId: error.user_id, resolution });
  
  return c.json({ success: true, message: 'Billing error marked as resolved' });
});

adminRoutes.post('/billing/notify-all-failed', adminAuth, async (c) => {
  const adminId = c.get('adminId');
  const adminRole = c.get('adminRole');
  
  if (adminRole !== 'SUPER_ADMIN') {
    return c.json({ error: 'Only super admins can send bulk notifications' }, 403);
  }
  
  // Get all failed billing errors that haven't been notified in the last 24 hours
  const errors = await c.env.DB.prepare(`
    SELECT be.*, u.email, u.first_name
    FROM billing_errors be
    JOIN users u ON be.user_id = u.id
    WHERE be.status = 'FAILED'
    AND (be.notified_at IS NULL OR be.notified_at < datetime('now', '-24 hours'))
  `).all();
  
  let notifiedCount = 0;
  const now = new Date().toISOString();
  
  for (const error of errors.results as any[]) {
    try {
      const { baseTemplate } = await import('../email-templates');
      const emailContent = baseTemplate(`
        <h1 style="color: #d4af37; font-size: 24px; margin-bottom: 16px;">Payment Issue</h1>
        <p>Hi ${error.first_name},</p>
        <p>We noticed there was an issue processing your recent payment for your Heirloom subscription.</p>
        <p>Please update your payment method to continue enjoying Heirloom's features.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://heirloom.blue/settings?tab=billing" style="background: linear-gradient(135deg, #d4af37, #b8860b); color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">Update Payment Method</a>
        </div>
      `);
      
      await sendEmail(c.env, {
        from: 'Heirloom <noreply@heirloom.blue>',
        to: error.email as string,
        subject: 'Action Required: Payment Issue with Your Heirloom Subscription',
        html: emailContent,
      }, 'BILLING_ERROR_BULK_NOTIFICATION');
      
      await c.env.DB.prepare(`
        UPDATE billing_errors SET notified_at = ? WHERE id = ?
      `).bind(now, error.id).run();
      
      notifiedCount++;
    } catch (err) {
      console.error('Failed to notify user:', error.email, err);
    }
  }
  
  await logAuditAction(c.env, adminId, 'BULK_NOTIFY_BILLING_ERRORS', { notifiedCount, totalErrors: errors.results.length });
  
  return c.json({ success: true, message: `Notified ${notifiedCount} users with billing errors` });
});

// ============================================
// REPORTS & EXPORTS
// ============================================

adminRoutes.get('/reports/revenue', adminAuth, async (c) => {
  const startDate = c.req.query('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = c.req.query('endDate') || new Date().toISOString().split('T')[0];
  
  // Get subscription counts by tier
  const subscriptions = await c.env.DB.prepare(`
    SELECT tier, COUNT(*) as count
    FROM subscriptions
    WHERE status = 'ACTIVE'
    GROUP BY tier
  `).all();
  
  // Calculate MRR based on tier pricing
  const tierPricing: Record<string, number> = { STARTER: 1, FAMILY: 2, FOREVER: 5 };
  let mrr = 0;
  const breakdown: Record<string, { count: number; revenue: number }> = {};
  
  for (const sub of subscriptions.results as any[]) {
    const price = tierPricing[sub.tier] || 0;
    const revenue = sub.count * price;
    mrr += revenue;
    breakdown[sub.tier] = { count: sub.count, revenue };
  }
  
  return c.json({
    period: { startDate, endDate },
    mrr,
    arr: mrr * 12,
    breakdown,
    activeSubscriptions: subscriptions.results.reduce((acc: number, s: any) => acc + s.count, 0),
  });
});

adminRoutes.get('/reports/user-growth', adminAuth, async (c) => {
  const days = parseInt(c.req.query('days') || '30');
  
  const growth = await c.env.DB.prepare(`
    SELECT date(created_at) as date, COUNT(*) as signups
    FROM users
    WHERE created_at >= date('now', '-' || ? || ' days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).bind(days).all();
  
  return c.json({
    period: `Last ${days} days`,
    data: growth.results.map((g: any) => ({
      date: g.date,
      signups: g.signups,
    })),
    totalSignups: growth.results.reduce((acc: number, g: any) => acc + g.signups, 0),
  });
});

adminRoutes.get('/reports/export/users', adminAuth, async (c) => {
  const adminRole = c.get('adminRole');
  const format = c.req.query('format') || 'json';
  
  if (adminRole !== 'SUPER_ADMIN') {
    return c.json({ error: 'Only super admins can export user data' }, 403);
  }
  
  const users = await c.env.DB.prepare(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.created_at, s.tier, s.status as subscription_status
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id
    ORDER BY u.created_at DESC
  `).all();
  
  if (format === 'csv') {
    const headers = 'id,email,first_name,last_name,created_at,tier,subscription_status\n';
    const rows = users.results.map((u: any) => 
      `${u.id},${u.email},${u.first_name},${u.last_name},${u.created_at},${u.tier || ''},${u.subscription_status || ''}`
    ).join('\n');
    
    return new Response(headers + rows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="users-export.csv"',
      },
    });
  }
  
  return c.json(users.results);
});

// ============================================
// ANALYTICS ENDPOINTS (Enhanced)
// ============================================

adminRoutes.get('/analytics/overview', adminAuth, async (c) => {
  const userStats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) as recent_signups
    FROM users
  `).first();
  
  const subStats = await c.env.DB.prepare(`
    SELECT 
      COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
      COUNT(CASE WHEN status = 'TRIALING' THEN 1 END) as trialing
    FROM subscriptions
  `).first();
  
  const subByTier = await c.env.DB.prepare(`
    SELECT tier, COUNT(*) as count FROM subscriptions WHERE status = 'ACTIVE' GROUP BY tier
  `).all();
  
  const contentStats = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM memories) as memories,
      (SELECT COUNT(*) FROM letters) as letters,
      (SELECT COUNT(*) FROM voice_recordings) as voice_recordings
  `).first();
  
  return c.json({
    users: {
      total: userStats?.total || 0,
      recentSignups: userStats?.recent_signups || 0,
      active: subStats?.active || 0,
      trialing: subStats?.trialing || 0,
    },
    subscriptions: subByTier.results.reduce((acc: any, s: any) => {
      acc[s.tier.toLowerCase()] = s.count;
      return acc;
    }, {}),
    content: {
      memories: contentStats?.memories || 0,
      letters: contentStats?.letters || 0,
      voiceRecordings: contentStats?.voice_recordings || 0,
    },
  });
});

adminRoutes.get('/analytics/revenue', adminAuth, async (c) => {
  const subscriptions = await c.env.DB.prepare(`
    SELECT tier, COUNT(*) as count FROM subscriptions WHERE status = 'ACTIVE' GROUP BY tier
  `).all();
  
  const tierPricing: Record<string, number> = { STARTER: 1, FAMILY: 2, FOREVER: 5 };
  let mrr = 0;
  let activeSubscriptions = 0;
  
  for (const sub of subscriptions.results as any[]) {
    mrr += sub.count * (tierPricing[sub.tier] || 0);
    activeSubscriptions += sub.count;
  }
  
  return c.json({
    mrr,
    arr: mrr * 12,
    activeSubscriptions,
    totalDiscountsLast30Days: 0, // Would need coupon usage tracking
  });
});

adminRoutes.get('/analytics/users', adminAuth, async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT 
      SUM(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 ELSE 0 END) as signups_30d,
      SUM(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) as signups_7d,
      SUM(CASE WHEN last_login_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) as active_7d
    FROM users
  `).first();
  
  const withContent = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM (
      SELECT user_id FROM memories
      UNION SELECT user_id FROM letters
      UNION SELECT user_id FROM voice_recordings
    )
  `).first();
  
  return c.json({
    signupsLast30Days: stats?.signups_30d || 0,
    signupsLast7Days: stats?.signups_7d || 0,
    activeUsersLast7Days: stats?.active_7d || 0,
    usersWithContent: withContent?.count || 0,
  });
});

// ============================================
// NEW FEATURES NOTIFICATIONS
// ============================================

adminRoutes.post('/notifications/new-features', adminAuth, async (c) => {
  const adminRole = c.get('adminRole');
  const adminId = c.get('adminId');
  
  if (adminRole !== 'SUPER_ADMIN') {
    return c.json({ error: 'Only super admins can send feature announcements' }, 403);
  }
  
  const body = await c.req.json().catch(() => ({}));
  const { sendEmail: shouldSendEmail = true, createInAppNotification = true } = body;
  
  const users = await c.env.DB.prepare(`
    SELECT id, email, first_name FROM users WHERE email_verified = 1
  `).all();
  
  const now = new Date().toISOString();
  let emailsSent = 0;
  let emailsFailed = 0;
  let notificationsCreated = 0;
  
  for (const user of users.results as any[]) {
    if (createInAppNotification) {
      try {
        const existingNotification = await c.env.DB.prepare(`
          SELECT id FROM notifications 
          WHERE user_id = ? AND type = 'NEW_FEATURES_DEC_2024'
        `).bind(user.id).first();
        
        if (!existingNotification) {
          await c.env.DB.prepare(`
            INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
            VALUES (?, ?, 'NEW_FEATURES_DEC_2024', 'New Features Available!', 'We''ve added 4 exciting new features: Legacy Playbook, Recipient Experience, Story Artifacts, and Life Event Triggers. Take the tour to learn more!', '{"features": ["legacy-playbook", "recipient-experience", "story-artifacts", "life-events"]}', ?)
          `).bind(crypto.randomUUID(), user.id, now).run();
          notificationsCreated++;
        }
      } catch (err) {
        console.error('Failed to create notification for user:', user.email, err);
      }
    }
    
    if (shouldSendEmail) {
      try {
        const emailData = newFeaturesAnnouncementEmail(user.first_name || 'there');
        const result = await sendEmail(c.env, {
          from: 'Heirloom <noreply@heirloom.blue>',
          to: user.email,
          subject: emailData.subject,
          html: emailData.html,
        }, 'NEW_FEATURES_ANNOUNCEMENT');
        
        if (result.success) {
          emailsSent++;
        } else {
          emailsFailed++;
        }
      } catch (err) {
        console.error('Failed to send email to user:', user.email, err);
        emailsFailed++;
      }
    }
  }
  
  await logAuditAction(c.env, adminId, 'SEND_NEW_FEATURES_NOTIFICATION', {
    totalUsers: users.results.length,
    emailsSent,
    emailsFailed,
    notificationsCreated,
  });
  
  return c.json({
    success: true,
    totalUsers: users.results.length,
    emailsSent,
    emailsFailed,
    notificationsCreated,
  });
});

adminRoutes.post('/notifications/new-user-features', adminAuth, async (c) => {
  const userId = c.req.query('userId');
  
  if (!userId) {
    return c.json({ error: 'userId is required' }, 400);
  }
  
  const now = new Date().toISOString();
  
  const existingNotification = await c.env.DB.prepare(`
    SELECT id FROM notifications 
    WHERE user_id = ? AND type = 'NEW_FEATURES_DEC_2024'
  `).bind(userId).first();
  
  if (existingNotification) {
    return c.json({ success: true, message: 'Notification already exists' });
  }
  
  await c.env.DB.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
    VALUES (?, ?, 'NEW_FEATURES_DEC_2024', 'New Features Available!', 'We''ve added 4 exciting new features: Legacy Playbook, Recipient Experience, Story Artifacts, and Life Event Triggers. Take the tour to learn more!', '{"features": ["legacy-playbook", "recipient-experience", "story-artifacts", "life-events"]}', ?)
  `).bind(crypto.randomUUID(), userId, now).run();
  
  return c.json({ success: true, message: 'Notification created' });
});

// ============================================
// USAGE ANALYTICS
// ============================================

// Get detailed usage analytics - when users are active, what they're doing
adminRoutes.get('/analytics/usage', adminAuth, async (c) => {
  // Activity by hour of day (last 30 days)
  const activityByHour = await c.env.DB.prepare(`
    SELECT 
      strftime('%H', last_login_at) as hour,
      COUNT(*) as logins
    FROM users
    WHERE last_login_at > datetime('now', '-30 days')
    GROUP BY hour
    ORDER BY hour
  `).all();

  // Activity by day of week (last 30 days)
  const activityByDay = await c.env.DB.prepare(`
    SELECT 
      strftime('%w', last_login_at) as day_of_week,
      COUNT(*) as logins
    FROM users
    WHERE last_login_at > datetime('now', '-30 days')
    GROUP BY day_of_week
    ORDER BY day_of_week
  `).all();

  // Daily active users trend (last 30 days)
  const dailyActiveUsers = await c.env.DB.prepare(`
    SELECT 
      date(last_login_at) as date,
      COUNT(DISTINCT id) as active_users
    FROM users
    WHERE last_login_at > datetime('now', '-30 days')
    GROUP BY date
    ORDER BY date
  `).all();

  // Content creation activity (last 30 days)
  const contentActivity = await c.env.DB.prepare(`
    SELECT 
      date(created_at) as date,
      'memory' as type,
      COUNT(*) as count
    FROM memories
    WHERE created_at > datetime('now', '-30 days')
    GROUP BY date
    UNION ALL
    SELECT 
      date(created_at) as date,
      'letter' as type,
      COUNT(*) as count
    FROM letters
    WHERE created_at > datetime('now', '-30 days')
    GROUP BY date
    UNION ALL
    SELECT 
      date(created_at) as date,
      'voice' as type,
      COUNT(*) as count
    FROM voice_recordings
    WHERE created_at > datetime('now', '-30 days')
    GROUP BY date
    ORDER BY date
  `).all();

  // User engagement metrics
  const engagementMetrics = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN last_login_at > datetime('now', '-1 days') THEN 1 ELSE 0 END) as active_today,
      SUM(CASE WHEN last_login_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) as active_7d,
      SUM(CASE WHEN last_login_at > datetime('now', '-30 days') THEN 1 ELSE 0 END) as active_30d,
      SUM(CASE WHEN last_login_at IS NULL OR last_login_at < datetime('now', '-30 days') THEN 1 ELSE 0 END) as dormant
    FROM users
  `).first();

  // Users with content vs without
  const contentEngagement = await c.env.DB.prepare(`
    SELECT 
      COUNT(DISTINCT u.id) as total_users,
      COUNT(DISTINCT CASE WHEN m.user_id IS NOT NULL OR l.user_id IS NOT NULL OR v.user_id IS NOT NULL THEN u.id END) as users_with_content,
      COUNT(DISTINCT m.user_id) as users_with_memories,
      COUNT(DISTINCT l.user_id) as users_with_letters,
      COUNT(DISTINCT v.user_id) as users_with_voice
    FROM users u
    LEFT JOIN memories m ON u.id = m.user_id
    LEFT JOIN letters l ON u.id = l.user_id
    LEFT JOIN voice_recordings v ON u.id = v.user_id
  `).first();

  // Recent user sessions (last 20 logins)
  const recentSessions = await c.env.DB.prepare(`
    SELECT 
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.last_login_at,
      s.tier,
      (SELECT COUNT(*) FROM memories WHERE user_id = u.id) as memory_count,
      (SELECT COUNT(*) FROM letters WHERE user_id = u.id) as letter_count
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id
    WHERE u.last_login_at IS NOT NULL
    ORDER BY u.last_login_at DESC
    LIMIT 20
  `).all();

  // Funnel metrics
  const funnelMetrics = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM users) as registered,
      (SELECT COUNT(*) FROM users WHERE email_verified = 1) as verified,
      (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE status = 'ACTIVE') as subscribed,
      (SELECT COUNT(DISTINCT user_id) FROM memories) as created_memory,
      (SELECT COUNT(DISTINCT user_id) FROM family_members) as added_family,
      (SELECT COUNT(DISTINCT user_id) FROM legacy_contacts) as added_legacy_contact
  `).first();

  // Cron/reminder email status
  const reminderStatus = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM dead_man_switches WHERE enabled = 1) as active_switches,
      (SELECT COUNT(*) FROM dead_man_switches WHERE status = 'WARNING') as warning_switches,
      (SELECT COUNT(*) FROM dead_man_switches WHERE status = 'TRIGGERED') as triggered_switches
  `).first();

  // Map day numbers to names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return c.json({
    activityByHour: activityByHour.results.map((r: any) => ({
      hour: parseInt(r.hour),
      logins: r.logins,
    })),
    activityByDay: activityByDay.results.map((r: any) => ({
      day: dayNames[parseInt(r.day_of_week)],
      dayNum: parseInt(r.day_of_week),
      logins: r.logins,
    })),
    dailyActiveUsers: dailyActiveUsers.results,
    contentActivity: contentActivity.results,
    engagement: {
      totalUsers: engagementMetrics?.total_users || 0,
      activeToday: engagementMetrics?.active_today || 0,
      active7d: engagementMetrics?.active_7d || 0,
      active30d: engagementMetrics?.active_30d || 0,
      dormant: engagementMetrics?.dormant || 0,
    },
    contentEngagement: {
      totalUsers: contentEngagement?.total_users || 0,
      usersWithContent: contentEngagement?.users_with_content || 0,
      usersWithMemories: contentEngagement?.users_with_memories || 0,
      usersWithLetters: contentEngagement?.users_with_letters || 0,
      usersWithVoice: contentEngagement?.users_with_voice || 0,
    },
    recentSessions: recentSessions.results.map((r: any) => ({
      id: r.id,
      email: r.email,
      name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Unknown',
      lastLogin: r.last_login_at,
      tier: r.tier || 'FREE',
      memoryCount: r.memory_count,
      letterCount: r.letter_count,
    })),
    funnel: {
      registered: funnelMetrics?.registered || 0,
      verified: funnelMetrics?.verified || 0,
      subscribed: funnelMetrics?.subscribed || 0,
      createdMemory: funnelMetrics?.created_memory || 0,
      addedFamily: funnelMetrics?.added_family || 0,
      addedLegacyContact: funnelMetrics?.added_legacy_contact || 0,
    },
    reminderStatus: {
      activeSwitches: reminderStatus?.active_switches || 0,
      warningSwitches: reminderStatus?.warning_switches || 0,
      triggeredSwitches: reminderStatus?.triggered_switches || 0,
    },
  });
});

// ============================================
// MARKETING CONVERSION ANALYTICS
// ============================================

// Get marketing conversion analytics - automated vs direct channels
adminRoutes.get('/analytics/marketing', adminAuth, async (c) => {
  // Email campaign performance
  const emailStats = await c.env.DB.prepare(`
    SELECT 
      email_type,
      COUNT(*) as sent,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as opened,
      SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as clicked,
      SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced
    FROM email_logs
    WHERE sent_at > datetime('now', '-30 days')
    GROUP BY email_type
    ORDER BY sent DESC
  `).all();

  // Voucher/gift card performance
  const voucherStats = await c.env.DB.prepare(`
    SELECT 
      voucher_type,
      plan_type,
      COUNT(*) as total_created,
      SUM(CASE WHEN status = 'REDEEMED' THEN 1 ELSE 0 END) as redeemed,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) as expired
    FROM gift_vouchers
    WHERE created_at > datetime('now', '-30 days')
    GROUP BY voucher_type, plan_type
  `).all();

  // Influencer outreach performance
  const influencerStats = await c.env.DB.prepare(`
    SELECT 
      outreach_type,
      COUNT(*) as total_sent,
      COUNT(DISTINCT influencer_id) as unique_influencers
    FROM influencer_outreach
    WHERE sent_at > datetime('now', '-30 days')
    GROUP BY outreach_type
  `).all();

  // Drip campaign performance
  const dripStats = await c.env.DB.prepare(`
    SELECT 
      campaign_type,
      COUNT(*) as total_users,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'unsubscribed' THEN 1 ELSE 0 END) as unsubscribed,
      AVG(emails_sent) as avg_emails_sent
    FROM drip_campaigns
    GROUP BY campaign_type
  `).all();

  // User acquisition by channel (based on how they signed up)
  const acquisitionByChannel = await c.env.DB.prepare(`
    SELECT 
      CASE 
        WHEN gv.id IS NOT NULL THEN 'voucher'
        WHEN fi.id IS NOT NULL THEN 'family_invite'
        ELSE 'direct'
      END as channel,
      COUNT(DISTINCT u.id) as users,
      COUNT(DISTINCT CASE WHEN s.status = 'ACTIVE' AND s.tier != 'FREE' THEN u.id END) as paid_conversions
    FROM users u
    LEFT JOIN gift_vouchers gv ON u.email = gv.recipient_email AND gv.status = 'REDEEMED'
    LEFT JOIN family_invites fi ON u.email = fi.invitee_email AND fi.status = 'accepted'
    LEFT JOIN subscriptions s ON u.id = s.user_id
    WHERE u.created_at > datetime('now', '-30 days')
    GROUP BY channel
  `).all();

  // Conversion funnel by source
  const conversionFunnel = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_vouchers_sent,
      SUM(CASE WHEN status = 'REDEEMED' THEN 1 ELSE 0 END) as vouchers_redeemed,
      (SELECT COUNT(DISTINCT user_id) FROM memories m 
       JOIN users u ON m.user_id = u.id 
       JOIN gift_vouchers gv ON u.email = gv.recipient_email 
       WHERE gv.status = 'REDEEMED') as created_content,
      (SELECT COUNT(DISTINCT s.user_id) FROM subscriptions s 
       JOIN users u ON s.user_id = u.id 
       JOIN gift_vouchers gv ON u.email = gv.recipient_email 
       WHERE gv.status = 'REDEEMED' AND s.tier != 'FREE' AND s.status = 'ACTIVE') as paid_subscribers
    FROM gift_vouchers
    WHERE created_at > datetime('now', '-90 days')
  `).first();

  // Daily marketing activity (last 30 days)
  const dailyMarketingActivity = await c.env.DB.prepare(`
    SELECT 
      date(sent_at) as date,
      COUNT(*) as emails_sent,
      SUM(CASE WHEN email_type LIKE 'DRIP%' THEN 1 ELSE 0 END) as drip_emails,
      SUM(CASE WHEN email_type LIKE 'PROSPECT%' THEN 1 ELSE 0 END) as prospect_emails,
      SUM(CASE WHEN email_type LIKE 'VOUCHER%' THEN 1 ELSE 0 END) as voucher_emails
    FROM email_logs
    WHERE sent_at > datetime('now', '-30 days')
    GROUP BY date
    ORDER BY date
  `).all();

  // Automated vs manual comparison
  const automatedVsManual = await c.env.DB.prepare(`
    SELECT 
      CASE 
        WHEN email_type IN ('DRIP_WELCOME', 'DRIP_INACTIVE', 'DRIP_REACTIVATION', 'PROSPECT_OUTREACH', 'VOUCHER_FOLLOWUP_1', 'VOUCHER_FOLLOWUP_2', 'DATE_REMINDER', 'CONTENT_PROMPT', 'STREAK_REMINDER') THEN 'automated'
        ELSE 'manual'
      END as source,
      COUNT(*) as total_sent,
      COUNT(DISTINCT recipient_email) as unique_recipients
    FROM email_logs
    WHERE sent_at > datetime('now', '-30 days')
    GROUP BY source
  `).all();

  // Calculate conversion rates
  const totalVouchers = (conversionFunnel?.total_vouchers_sent as number) || 0;
  const redeemedVouchers = (conversionFunnel?.vouchers_redeemed as number) || 0;
  const contentCreators = (conversionFunnel?.created_content as number) || 0;
  const paidSubscribers = (conversionFunnel?.paid_subscribers as number) || 0;

  return c.json({
    emailPerformance: emailStats.results.map((r: any) => ({
      type: r.email_type,
      sent: r.sent,
      delivered: r.delivered || 0,
      opened: r.opened || 0,
      clicked: r.clicked || 0,
      bounced: r.bounced || 0,
      openRate: r.delivered > 0 ? ((r.opened || 0) / r.delivered * 100).toFixed(1) : '0',
      clickRate: r.opened > 0 ? ((r.clicked || 0) / r.opened * 100).toFixed(1) : '0',
    })),
    voucherPerformance: voucherStats.results.map((r: any) => ({
      type: r.voucher_type,
      plan: r.plan_type,
      created: r.total_created,
      redeemed: r.redeemed || 0,
      pending: r.pending || 0,
      expired: r.expired || 0,
      redemptionRate: r.total_created > 0 ? ((r.redeemed || 0) / r.total_created * 100).toFixed(1) : '0',
    })),
    influencerOutreach: influencerStats.results.map((r: any) => ({
      type: r.outreach_type,
      sent: r.total_sent,
      uniqueInfluencers: r.unique_influencers,
    })),
    dripCampaigns: dripStats.results.map((r: any) => ({
      type: r.campaign_type,
      totalUsers: r.total_users,
      active: r.active || 0,
      completed: r.completed || 0,
      unsubscribed: r.unsubscribed || 0,
      avgEmailsSent: parseFloat(r.avg_emails_sent || 0).toFixed(1),
      completionRate: r.total_users > 0 ? ((r.completed || 0) / r.total_users * 100).toFixed(1) : '0',
    })),
    acquisitionByChannel: acquisitionByChannel.results.map((r: any) => ({
      channel: r.channel,
      users: r.users,
      paidConversions: r.paid_conversions || 0,
      conversionRate: r.users > 0 ? ((r.paid_conversions || 0) / r.users * 100).toFixed(1) : '0',
    })),
    conversionFunnel: {
      vouchersSent: totalVouchers,
      vouchersRedeemed: redeemedVouchers,
      redemptionRate: totalVouchers > 0 ? (redeemedVouchers / totalVouchers * 100).toFixed(1) : '0',
      contentCreators: contentCreators,
      contentRate: redeemedVouchers > 0 ? (contentCreators / redeemedVouchers * 100).toFixed(1) : '0',
      paidSubscribers: paidSubscribers,
      paidRate: contentCreators > 0 ? (paidSubscribers / contentCreators * 100).toFixed(1) : '0',
    },
    dailyActivity: dailyMarketingActivity.results,
    automatedVsManual: automatedVsManual.results.reduce((acc: any, r: any) => {
      acc[r.source] = {
        totalSent: r.total_sent,
        uniqueRecipients: r.unique_recipients,
      };
      return acc;
    }, {}),
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function logAuditAction(env: any, adminId: string | undefined, action: string, details: any) {
  if (!adminId) {
    console.error('Cannot log audit action: adminId is undefined');
    return;
  }
  try {
    await env.DB.prepare(`
      INSERT INTO audit_logs (id, admin_id, action, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), adminId, action, JSON.stringify(details), new Date().toISOString()).run();
  } catch (e) {
    console.error('Failed to log audit action:', e);
  }
}
