/**
 * Admin Routes - Cloudflare Workers
 * Handles admin panel operations, analytics, and user management
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const adminRoutes = new Hono<{ Bindings: Env }>();

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
  const [storedHash, storedSalt] = (admin.password_hash as string).split(':');
  
  if (storedHash === 'CHANGE_ME_ON_FIRST_LOGIN') {
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
  
  const { status, assignedTo, priority } = body;
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE support_tickets 
    SET status = COALESCE(?, status),
        assigned_to = COALESCE(?, assigned_to),
        priority = COALESCE(?, priority),
        updated_at = ?,
        resolved_at = CASE WHEN ? = 'RESOLVED' THEN ? ELSE resolved_at END
    WHERE id = ?
  `).bind(status, assignedTo || adminId, priority, now, status, now, ticketId).run();
  
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
// HELPER FUNCTIONS
// ============================================

async function logAuditAction(env: any, adminId: string, action: string, details: any) {
  try {
    await env.DB.prepare(`
      INSERT INTO audit_logs (id, admin_id, action, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), adminId, action, JSON.stringify(details), new Date().toISOString()).run();
  } catch (e) {
    console.error('Failed to log audit action:', e);
  }
}
