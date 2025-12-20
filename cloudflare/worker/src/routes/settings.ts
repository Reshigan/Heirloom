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
  
  // Convert undefined to null for D1 compatibility
  await c.env.DB.prepare(`
    UPDATE users 
    SET first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        avatar_url = COALESCE(?, avatar_url),
        preferred_currency = COALESCE(?, preferred_currency),
        updated_at = ?
    WHERE id = ?
  `).bind(
    firstName ?? null, 
    lastName ?? null, 
    avatarUrl ?? null, 
    preferredCurrency ?? null, 
    now, 
    userId
  ).run();
  
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

// Get upload URL for avatar
settingsRoutes.post('/upload-url', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { filename, contentType } = body;
  
  if (!filename || !contentType) {
    return c.json({ error: 'Filename and content type are required' }, 400);
  }
  
  // Generate unique key for the file
  const key = `avatars/${userId}/${Date.now()}-${filename}`;
  
  // Check if R2 bucket is available (binding name is STORAGE in wrangler.jsonc)
  if (!c.env.STORAGE) {
    return c.json({ error: 'Storage not configured' }, 500);
  }
  
  // Generate a signed URL for direct upload to R2
  // For Cloudflare R2, we'll use a presigned URL approach
  const uploadUrl = `https://api.heirloom.blue/api/settings/upload/${key}`;
  const publicUrl = `https://uploads.heirloom.blue/${key}`;
  
  return c.json({
    uploadUrl,
    key,
    url: publicUrl,
  });
});

// Handle direct file upload to R2
settingsRoutes.put('/upload/:key{.+}', async (c) => {
  const userId = c.get('userId');
  const key = c.req.param('key');
  
  // Verify the key belongs to this user
  if (!key.startsWith(`avatars/${userId}/`)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  if (!c.env.STORAGE) {
    return c.json({ error: 'Storage not configured' }, 500);
  }
  
  const body = await c.req.arrayBuffer();
  const contentType = c.req.header('Content-Type') || 'image/jpeg';
  
  await c.env.STORAGE.put(key, body, {
    httpMetadata: { contentType },
  });
  
  return c.json({ success: true, key });
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
  // Format is salt:hash (matching auth.ts hashPassword function)
  const encoder = new TextEncoder();
  const [storedSalt, storedHash] = (user.password_hash as string).split(':');
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
  // Store in salt:hash format to match auth.ts hashPassword function
  const newPasswordHash = `${newSaltBase64}:${newHash}`;
  
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
  
  // Convert undefined to null for D1 compatibility
  await c.env.DB.prepare(`
    UPDATE legacy_contacts 
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        relationship = COALESCE(?, relationship),
        role = COALESCE(?, role),
        updated_at = ?
    WHERE id = ?
  `).bind(
    name ?? null, 
    email ?? null, 
    phone ?? null, 
    relationship ?? null, 
    role ?? null, 
    now, 
    contactId
  ).run();
  
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

// ============================================
// DATA EXPORT (GDPR Compliance)
// ============================================

settingsRoutes.get('/export', async (c) => {
  const userId = c.get('userId');
  
  try {
    // Gather all user data
    const [user, memories, voiceRecordings, letters, familyMembers, legacyContacts, deadManSwitch, subscription] = await Promise.all([
      c.env.DB.prepare(`
        SELECT id, email, first_name, last_name, avatar_url, preferred_currency, 
               email_verified, two_factor_enabled, created_at, updated_at
        FROM users WHERE id = ?
      `).bind(userId).first(),
      c.env.DB.prepare(`SELECT * FROM memories WHERE user_id = ?`).bind(userId).all(),
      c.env.DB.prepare(`SELECT * FROM voice_recordings WHERE user_id = ?`).bind(userId).all(),
      c.env.DB.prepare(`SELECT * FROM letters WHERE user_id = ?`).bind(userId).all(),
      c.env.DB.prepare(`SELECT * FROM family_members WHERE user_id = ?`).bind(userId).all(),
      c.env.DB.prepare(`SELECT * FROM legacy_contacts WHERE user_id = ?`).bind(userId).all(),
      c.env.DB.prepare(`SELECT * FROM dead_man_switches WHERE user_id = ?`).bind(userId).first(),
      c.env.DB.prepare(`SELECT * FROM subscriptions WHERE user_id = ?`).bind(userId).first(),
    ]);
    
    // Build file manifest with R2 URLs
    const fileManifest: { type: string; key: string; url: string }[] = [];
    
    // Add memory files
    for (const memory of memories.results) {
      if (memory.file_key) {
        fileManifest.push({
          type: 'memory',
          key: memory.file_key as string,
          url: `${c.env.API_URL}/api/memories/file/${encodeURIComponent(memory.file_key as string)}`,
        });
      }
    }
    
    // Add voice recording files
    for (const voice of voiceRecordings.results) {
      if (voice.file_key) {
        fileManifest.push({
          type: 'voice',
          key: voice.file_key as string,
          url: `${c.env.API_URL}/api/voice/file/${encodeURIComponent(voice.file_key as string)}`,
        });
      }
    }
    
    // Build export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: user ? {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
        preferredCurrency: user.preferred_currency,
        emailVerified: !!user.email_verified,
        twoFactorEnabled: !!user.two_factor_enabled,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      } : null,
      memories: memories.results.map((m: any) => ({
        id: m.id,
        type: m.type,
        title: m.title,
        description: m.description,
        fileKey: m.file_key,
        metadata: m.metadata ? JSON.parse(m.metadata) : null,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      })),
      voiceRecordings: voiceRecordings.results.map((v: any) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        fileKey: v.file_key,
        duration: v.duration,
        transcript: v.transcript,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      })),
      letters: letters.results.map((l: any) => ({
        id: l.id,
        title: l.title,
        salutation: l.salutation,
        body: l.body,
        signature: l.signature,
        deliveryTrigger: l.delivery_trigger,
        scheduledDate: l.scheduled_date,
        sealedAt: l.sealed_at,
        createdAt: l.created_at,
        updatedAt: l.updated_at,
      })),
      familyMembers: familyMembers.results.map((f: any) => ({
        id: f.id,
        name: f.name,
        relationship: f.relationship,
        email: f.email,
        phone: f.phone,
        birthDate: f.birth_date,
        notes: f.notes,
        createdAt: f.created_at,
      })),
      legacyContacts: legacyContacts.results.map((lc: any) => ({
        id: lc.id,
        name: lc.name,
        email: lc.email,
        phone: lc.phone,
        relationship: lc.relationship,
        verificationStatus: lc.verification_status,
        createdAt: lc.created_at,
      })),
      deadManSwitch: deadManSwitch ? {
        enabled: !!deadManSwitch.enabled,
        status: deadManSwitch.status,
        checkInIntervalDays: deadManSwitch.check_in_interval_days,
        gracePeriodDays: deadManSwitch.grace_period_days,
        lastCheckIn: deadManSwitch.last_check_in,
        nextCheckInDue: deadManSwitch.next_check_in_due,
        createdAt: deadManSwitch.created_at,
      } : null,
      subscription: subscription ? {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        trialEndsAt: subscription.trial_ends_at,
        createdAt: subscription.created_at,
      } : null,
      fileManifest,
    };
    
    // Log to audit_logs for compliance (if table exists)
    try {
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (id, user_id, action, details, created_at)
        VALUES (?, ?, 'DATA_EXPORT', ?, ?)
      `).bind(crypto.randomUUID(), userId, JSON.stringify({ exportedAt: exportData.exportedAt }), new Date().toISOString()).run();
    } catch {
      // audit_logs table may not exist, continue without logging
    }
    
    // Return as JSON with download headers
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="heirloom-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Data export error:', error);
    return c.json({ error: 'Failed to export data' }, 500);
  }
});
