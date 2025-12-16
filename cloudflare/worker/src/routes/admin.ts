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
  
  return c.json({ success: true, message: 'Ticket updated' });
});
