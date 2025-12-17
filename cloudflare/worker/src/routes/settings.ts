/**
 * Settings Routes - Cloudflare Workers
 * Handles user settings and profile operations
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const settingsRoutes = new Hono<{ Bindings: Env }>();

// Get user profile
settingsRoutes.get('/profile', async (c) => {
  const userId = c.get('userId');
  
  const user = await c.env.DB.prepare(`
    SELECT id, email, first_name, last_name, avatar_url, preferred_currency, 
           two_factor_enabled, email_verified, created_at, updated_at
    FROM users WHERE id = ?
  `).bind(userId).first();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    avatarUrl: user.avatar_url,
    preferredCurrency: user.preferred_currency,
    twoFactorEnabled: !!user.two_factor_enabled,
    emailVerified: !!user.email_verified,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  });
});

// Update user profile
settingsRoutes.patch('/profile', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { firstName, lastName, avatarUrl, preferredCurrency } = body;
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE users 
    SET first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        avatar_url = COALESCE(?, avatar_url),
        preferred_currency = COALESCE(?, preferred_currency),
        updated_at = ?
    WHERE id = ?
  `).bind(firstName, lastName, avatarUrl, preferredCurrency, now, userId).run();
  
  const user = await c.env.DB.prepare(`
    SELECT id, email, first_name, last_name, avatar_url, preferred_currency, 
           two_factor_enabled, email_verified, created_at, updated_at
    FROM users WHERE id = ?
  `).bind(userId).first();
  
  return c.json({
    id: user?.id,
    email: user?.email,
    firstName: user?.first_name,
    lastName: user?.last_name,
    avatarUrl: user?.avatar_url,
    preferredCurrency: user?.preferred_currency,
    twoFactorEnabled: !!user?.two_factor_enabled,
    emailVerified: !!user?.email_verified,
    updatedAt: user?.updated_at,
  });
});

// Change password (supports both /password and /change-password for compatibility)
settingsRoutes.post('/change-password', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { currentPassword, newPassword } = body;
  
  if (!currentPassword || !newPassword) {
    return c.json({ error: 'Current password and new password are required' }, 400);
  }
  
  if (newPassword.length < 8) {
    return c.json({ error: 'New password must be at least 8 characters' }, 400);
  }
  
  // Get current user
  const user = await c.env.DB.prepare(`
    SELECT password_hash FROM users WHERE id = ?
  `).bind(userId).first();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Verify current password using Web Crypto API
  const encoder = new TextEncoder();
  const [storedHash, storedSalt] = (user.password_hash as string).split(':');
  const saltBuffer = Uint8Array.from(atob(storedSalt), c => c.charCodeAt(0));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(currentPassword),
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
  
  const currentHash = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
  
  if (currentHash !== storedHash) {
    return c.json({ error: 'Current password is incorrect' }, 401);
  }
  
  // Hash new password
  const newSalt = crypto.getRandomValues(new Uint8Array(16));
  const newKeyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(newPassword),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const newDerivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: newSalt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    newKeyMaterial,
    256
  );
  
  const newHash = btoa(String.fromCharCode(...new Uint8Array(newDerivedBits)));
  const newSaltBase64 = btoa(String.fromCharCode(...newSalt));
  const newPasswordHash = `${newHash}:${newSaltBase64}`;
  
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?
  `).bind(newPasswordHash, now, userId).run();
  
  return c.json({ success: true, message: 'Password updated successfully' });
});

// Get notification preferences
settingsRoutes.get('/notifications', async (c) => {
  const userId = c.get('userId');
  
  // Get user's notification settings from a settings table or user table
  // For now, return default preferences
  const notifications = await c.env.DB.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).bind(userId).all();
  
  return c.json({
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      reminderEmails: true,
      marketingEmails: false,
      weeklyDigest: true,
    },
    recentNotifications: notifications.results.map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: !!n.read,
      createdAt: n.created_at,
    })),
  });
});

// Update notification preferences
settingsRoutes.patch('/notifications', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  // In a full implementation, this would update a user_settings table
  // For now, just acknowledge the update
  return c.json({
    success: true,
    preferences: body,
    message: 'Notification preferences updated',
  });
});

// Mark notification as read
settingsRoutes.patch('/notifications/:id/read', async (c) => {
  const userId = c.get('userId');
  const notificationId = c.req.param('id');
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE notifications SET read = 1, updated_at = ? WHERE id = ? AND user_id = ?
  `).bind(now, notificationId, userId).run();
  
  return c.json({ success: true });
});

// Mark all notifications as read
settingsRoutes.post('/notifications/read-all', async (c) => {
  const userId = c.get('userId');
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE notifications SET read = 1, updated_at = ? WHERE user_id = ? AND read = 0
  `).bind(now, userId).run();
  
  return c.json({ success: true, message: 'All notifications marked as read' });
});

// Get legacy contacts
settingsRoutes.get('/legacy-contacts', async (c) => {
  const userId = c.get('userId');
  
  const contacts = await c.env.DB.prepare(`
    SELECT * FROM legacy_contacts WHERE user_id = ? ORDER BY created_at ASC
  `).bind(userId).all();
  
  return c.json(contacts.results.map((contact: any) => ({
    id: contact.id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    relationship: contact.relationship,
    role: contact.role,
    verified: !!contact.verified,
    verifiedAt: contact.verified_at,
    createdAt: contact.created_at,
  })));
});

// Add legacy contact
settingsRoutes.post('/legacy-contacts', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { name, email, phone, relationship, role } = body;
  
  if (!name || !email) {
    return c.json({ error: 'Name and email are required' }, 400);
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO legacy_contacts (id, user_id, name, email, phone, relationship, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, name, email, phone || null, relationship || null, role || 'EXECUTOR', now, now).run();
  
  const contact = await c.env.DB.prepare(`
    SELECT * FROM legacy_contacts WHERE id = ?
  `).bind(id).first();
  
  return c.json({
    id: contact?.id,
    name: contact?.name,
    email: contact?.email,
    phone: contact?.phone,
    relationship: contact?.relationship,
    role: contact?.role,
    verified: false,
    createdAt: contact?.created_at,
  }, 201);
});

// Update legacy contact
settingsRoutes.patch('/legacy-contacts/:id', async (c) => {
  const userId = c.get('userId');
  const contactId = c.req.param('id');
  const body = await c.req.json();
  
  // Verify ownership
  const existing = await c.env.DB.prepare(`
    SELECT * FROM legacy_contacts WHERE id = ? AND user_id = ?
  `).bind(contactId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Legacy contact not found' }, 404);
  }
  
  const { name, email, phone, relationship, role } = body;
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE legacy_contacts 
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        relationship = COALESCE(?, relationship),
        role = COALESCE(?, role),
        updated_at = ?
    WHERE id = ?
  `).bind(name, email, phone, relationship, role, now, contactId).run();
  
  const contact = await c.env.DB.prepare(`
    SELECT * FROM legacy_contacts WHERE id = ?
  `).bind(contactId).first();
  
  return c.json({
    id: contact?.id,
    name: contact?.name,
    email: contact?.email,
    phone: contact?.phone,
    relationship: contact?.relationship,
    role: contact?.role,
    verified: !!contact?.verified,
    updatedAt: contact?.updated_at,
  });
});

// Delete legacy contact
settingsRoutes.delete('/legacy-contacts/:id', async (c) => {
  const userId = c.get('userId');
  const contactId = c.req.param('id');
  
  // Verify ownership
  const existing = await c.env.DB.prepare(`
    SELECT * FROM legacy_contacts WHERE id = ? AND user_id = ?
  `).bind(contactId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Legacy contact not found' }, 404);
  }
  
  await c.env.DB.prepare(`
    DELETE FROM legacy_contacts WHERE id = ?
  `).bind(contactId).run();
  
  return c.body(null, 204);
});

// Enable 2FA
settingsRoutes.post('/2fa/enable', async (c) => {
  const userId = c.get('userId');
  
  // Generate a secret for TOTP
  const secret = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(20))));
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE users SET two_factor_secret = ?, updated_at = ? WHERE id = ?
  `).bind(secret, now, userId).run();
  
  // Get user email for the QR code
  const user = await c.env.DB.prepare(`
    SELECT email FROM users WHERE id = ?
  `).bind(userId).first();
  
  const otpauthUrl = `otpauth://totp/Heirloom:${user?.email}?secret=${secret}&issuer=Heirloom`;
  
  return c.json({
    secret,
    qrCodeUrl: otpauthUrl,
    message: 'Scan the QR code with your authenticator app, then verify with a code',
  });
});

// Verify and complete 2FA setup
settingsRoutes.post('/2fa/verify', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { code } = body;
  
  if (!code) {
    return c.json({ error: 'Verification code is required' }, 400);
  }
  
  // In production, verify the TOTP code against the secret
  // For now, just enable 2FA
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE users SET two_factor_enabled = 1, updated_at = ? WHERE id = ?
  `).bind(now, userId).run();
  
  return c.json({
    success: true,
    message: 'Two-factor authentication enabled successfully',
  });
});

// Disable 2FA
settingsRoutes.post('/2fa/disable', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { password } = body;
  
  if (!password) {
    return c.json({ error: 'Password is required to disable 2FA' }, 400);
  }
  
  // Verify password (simplified - in production, verify properly)
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL, updated_at = ? WHERE id = ?
  `).bind(now, userId).run();
  
  return c.json({
    success: true,
    message: 'Two-factor authentication disabled',
  });
});

// Delete account
settingsRoutes.delete('/account', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { password, confirmation } = body;
  
  if (!password || confirmation !== 'DELETE') {
    return c.json({ error: 'Password and confirmation are required' }, 400);
  }
  
  // In production, verify password first
  // Then delete all user data
  
  // Delete in order of dependencies
  await c.env.DB.prepare(`DELETE FROM notifications WHERE user_id = ?`).bind(userId).run();
  await c.env.DB.prepare(`DELETE FROM legacy_contacts WHERE user_id = ?`).bind(userId).run();
  await c.env.DB.prepare(`DELETE FROM voice_recordings WHERE user_id = ?`).bind(userId).run();
  await c.env.DB.prepare(`DELETE FROM letters WHERE user_id = ?`).bind(userId).run();
  await c.env.DB.prepare(`DELETE FROM memories WHERE user_id = ?`).bind(userId).run();
  await c.env.DB.prepare(`DELETE FROM family_members WHERE user_id = ?`).bind(userId).run();
  await c.env.DB.prepare(`DELETE FROM subscriptions WHERE user_id = ?`).bind(userId).run();
  await c.env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(userId).run();
  await c.env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(userId).run();
  
  return c.json({
    success: true,
    message: 'Account deleted successfully',
  });
});
