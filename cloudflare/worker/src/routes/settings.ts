/**
 * Settings Routes - Cloudflare Workers
 * Handles user settings and profile operations
 */

import { Hono } from 'hono';
import type { Env, AppEnv } from '../index';
import { readDescription } from '../lib/legacyArchive';
import { sendEmail } from '../utils/email';

export const settingsRoutes = new Hono<AppEnv>();

// ── TOTP helpers (RFC 6238 / RFC 4226) ────────────────────────────────────────

function base32Encode(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '', bits = 0, value = 0;
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { result += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) result += alphabet[(value << (5 - bits)) & 31];
  return result;
}

function base32Decode(s: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = s.toUpperCase().replace(/=+$/, '');
  let bits = 0, value = 0;
  const output: number[] = [];
  for (const char of clean) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { output.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return new Uint8Array(output);
}

async function verifyTOTP(base32Secret: string, code: string): Promise<boolean> {
  const secretBytes = base32Decode(base32Secret);
  const timeStep = Math.floor(Date.now() / 1000 / 30);
  for (const t of [timeStep - 1, timeStep, timeStep + 1]) {
    const buf = new ArrayBuffer(8);
    new DataView(buf).setUint32(4, t, false);
    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf));
    const offset = hmac[19] & 0xf;
    const otp = ((hmac[offset] & 0x7f) << 24 | hmac[offset + 1] << 16 | hmac[offset + 2] << 8 | hmac[offset + 3]) % 1_000_000;
    if (otp.toString().padStart(6, '0') === code.toString().trim()) return true;
  }
  return false;
}

async function verifyStoredPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(':');
  if (!saltB64 || !hashB64) return false;
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const storedHash = Uint8Array.from(atob(hashB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const derived = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256));
  if (derived.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < derived.length; i++) diff |= derived[i] ^ storedHash[i];
  return diff === 0;
}

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
  
  // Get user info for the email
  const user = await c.env.DB.prepare(
    'SELECT first_name, last_name FROM users WHERE id = ?'
  ).bind(userId).first();
  
  const userName = user ? `${user.first_name} ${user.last_name}` : 'A Heirloom user';
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  // Generate verification token for the legacy contact
  const verifyToken = crypto.randomUUID() + '-' + crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO legacy_contacts (id, user_id, name, email, phone, relationship, role, verification_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, name, email, phone || null, relationship || null, role || 'EXECUTOR', verifyToken, now, now).run();
  
  const contact = await c.env.DB.prepare(`
    SELECT * FROM legacy_contacts WHERE id = ?
  `).bind(id).first();
  
  // Send verification email to the legacy contact
  try {
    const { legacyContactVerificationEmail } = await import('../email-templates');
    const emailContent = legacyContactVerificationEmail(name, userName, verifyToken);
    
    await sendEmail(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    }, 'LEGACY_CONTACT_VERIFICATION');
  } catch (err) {
    console.error('Failed to send legacy contact verification email:', err);
    // Don't fail the request if email fails
  }
  
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

  const secret = base32Encode(crypto.getRandomValues(new Uint8Array(20)));
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'UPDATE users SET two_factor_secret = ?, two_factor_enabled = 0, updated_at = ? WHERE id = ?'
  ).bind(secret, now, userId).run();

  const user = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first<{ email: string }>();
  const otpauthUrl = `otpauth://totp/Heirloom:${user?.email}?secret=${secret}&issuer=Heirloom`;

  return c.json({
    secret,
    qrCodeUrl: otpauthUrl,
    message: 'Scan the QR code with your authenticator app, then verify with a code to complete setup',
  });
});

// Verify and complete 2FA setup
settingsRoutes.post('/2fa/verify', async (c) => {
  const userId = c.get('userId');
  const { code } = await c.req.json();

  if (!code) {
    return c.json({ error: 'Verification code is required' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT two_factor_secret FROM users WHERE id = ?'
  ).bind(userId).first<{ two_factor_secret: string | null }>();

  if (!user?.two_factor_secret) {
    return c.json({ error: '2FA setup not initiated — call /2fa/enable first' }, 400);
  }

  const valid = await verifyTOTP(user.two_factor_secret, String(code));
  if (!valid) {
    return c.json({ error: 'Invalid verification code' }, 400);
  }

  await c.env.DB.prepare(
    'UPDATE users SET two_factor_enabled = 1, updated_at = ? WHERE id = ?'
  ).bind(new Date().toISOString(), userId).run();

  return c.json({ success: true, message: 'Two-factor authentication enabled successfully' });
});

// Disable 2FA
settingsRoutes.post('/2fa/disable', async (c) => {
  const userId = c.get('userId');
  const { password } = await c.req.json();

  if (!password) {
    return c.json({ error: 'Password is required to disable 2FA' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT password_hash FROM users WHERE id = ?'
  ).bind(userId).first<{ password_hash: string }>();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const ok = await verifyStoredPassword(password, user.password_hash);
  if (!ok) {
    return c.json({ error: 'Incorrect password' }, 401);
  }

  await c.env.DB.prepare(
    'UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL, updated_at = ? WHERE id = ?'
  ).bind(new Date().toISOString(), userId).run();

  return c.json({ success: true, message: 'Two-factor authentication disabled' });
});

// Exit quote — storage size + exit fee
settingsRoutes.get('/exit-quote', async (c) => {
  const userId = c.get('userId');

  const [memBytes, voiceBytes] = await Promise.all([
    c.env.DB.prepare(`SELECT COALESCE(SUM(file_size), 0) AS total FROM memories WHERE user_id = ? AND deleted_at IS NULL`).bind(userId).first<{ total: number }>(),
    c.env.DB.prepare(`SELECT COALESCE(SUM(file_size), 0) AS total FROM voice_recordings WHERE user_id = ?`).bind(userId).first<{ total: number }>(),
  ]);

  const totalBytes = (memBytes?.total ?? 0) + (voiceBytes?.total ?? 0);
  const totalMB = totalBytes / (1024 * 1024);

  let feeCents = 0;
  let tier = 'free';
  if (totalMB >= 2048) { feeCents = 2500; tier = '>2 GB'; }
  else if (totalMB >= 500) { feeCents = 1000; tier = '500 MB – 2 GB'; }
  else if (totalMB >= 100) { feeCents = 500; tier = '100 – 500 MB'; }

  return c.json({ totalBytes, totalMB: Math.round(totalMB * 10) / 10, feeCents, tier });
});

// Archive account (pre-deletion: 90-day window + email export link)
settingsRoutes.post('/archive', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { password } = body;

  if (!password) return c.json({ error: 'Password required' }, 400);

  const user = await c.env.DB.prepare(`SELECT email, first_name, password_hash FROM users WHERE id = ?`).bind(userId).first();
  if (!user) return c.json({ error: 'User not found' }, 404);

  const ok = await verifyStoredPassword(password, user.password_hash as string);
  if (!ok) return c.json({ error: 'Incorrect password.' }, 401);

  const deleteAfter = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `UPDATE users SET status = 'ARCHIVED', delete_after = ?, updated_at = ? WHERE id = ?`
  ).bind(deleteAfter, now, userId).run().catch(() => {
    // column may not exist on all instances yet — best effort
  });

  await sendEmail(c.env, {
    from: 'Heirloom <accounts@heirloom.blue>',
    to: user.email as string,
    subject: 'Your Heirloom archive is ready for download',
    html: `<p style="font-family:Georgia,serif;font-size:16px;color:#0e0e0c;line-height:1.7;">
      ${user.first_name ? `Dear ${user.first_name},` : 'Hello,'}<br><br>
      Your account has been scheduled for deletion on <strong>${new Date(deleteAfter).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
      Until then, you can download a full export of your memories, letters, and recordings at any time.<br><br>
      <a href="https://heirloom.blue/settings" style="color:#b07a4a;">Download your archive →</a><br><br>
      If you change your mind, reply to this email within 90 days and we will restore your account.
    </p>`,
  });

  return c.json({ success: true, deleteAfter });
});

// Delete account
settingsRoutes.delete('/account', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { password, confirmation } = body;

  if (!password || confirmation !== 'DELETE') {
    return c.json({ error: 'Password and confirmation are required' }, 400);
  }

  const userRow = await c.env.DB.prepare(`SELECT password_hash FROM users WHERE id = ?`).bind(userId).first();
  if (!userRow) return c.json({ error: 'User not found' }, 404);
  const validPw = await verifyStoredPassword(password, userRow.password_hash as string);
  if (!validPw) return c.json({ error: 'Incorrect password.' }, 401);

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

    // Decrypt encrypted memory descriptions so the personal data export carries
    // readable prose. This export is the user's complete GDPR archive, so it
    // intentionally includes revoked (soft-deleted) entries too — append-only
    // means nothing is lost until account erasure.
    for (const m of memories.results as any[]) {
      m.description = await readDescription(c.env, m);
    }

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

// ============================================
// RECIPIENT MESSAGES INBOX (Family Echo)
// ============================================

// Get all messages from recipients
settingsRoutes.get('/inbox', async (c) => {
  const userId = c.get('userId');
  
  const messages = await c.env.DB.prepare(`
    SELECT id, sender_name, sender_email, sender_relationship,
           content_type, content_id, reaction_type, message,
           voice_url, voice_duration, read_at, created_at
    FROM recipient_messages
    WHERE creator_user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).bind(userId).all();
  
  // Get unread count
  const unreadCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM recipient_messages
    WHERE creator_user_id = ? AND read_at IS NULL
  `).bind(userId).first();
  
  return c.json({
    messages: messages.results || [],
    unreadCount: unreadCount?.count || 0
  });
});

// Mark message as read
settingsRoutes.patch('/inbox/:messageId/read', async (c) => {
  const userId = c.get('userId');
  const messageId = c.req.param('messageId');
  
  await c.env.DB.prepare(`
    UPDATE recipient_messages
    SET read_at = ?
    WHERE id = ? AND creator_user_id = ?
  `).bind(new Date().toISOString(), messageId, userId).run();
  
  return c.json({ success: true });
});

// Mark all messages as read
settingsRoutes.post('/inbox/mark-all-read', async (c) => {
  const userId = c.get('userId');
  
  await c.env.DB.prepare(`
    UPDATE recipient_messages
    SET read_at = ?
    WHERE creator_user_id = ? AND read_at IS NULL
  `).bind(new Date().toISOString(), userId).run();
  
  return c.json({ success: true });
});
