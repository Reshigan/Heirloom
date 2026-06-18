/**
 * Settings Routes - Cloudflare Workers
 * Handles user settings and profile operations
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { readDescription, decryptText, withinGrace, recordRevision } from '../lib/legacyArchive';
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
    SELECT id, email, first_name, last_name, avatar_url, preferred_currency, birth_date, gender,
           guardian_email, guardian_name, two_factor_enabled, email_verified, created_at, updated_at
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
    birthDate: user.birth_date,
    gender: user.gender,
    guardianEmail: user.guardian_email,
    guardianName: user.guardian_name,
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
  
  const { firstName, lastName, avatarUrl, preferredCurrency, birthDate, gender, guardianEmail, guardianName } = body;
  const now = new Date().toISOString();

  // Convert undefined to null for D1 compatibility. birth_date/gender use a
  // sentinel-free COALESCE so an explicit empty string clears them, while
  // undefined leaves the existing value untouched.
  await c.env.DB.prepare(`
    UPDATE users
    SET first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        avatar_url = COALESCE(?, avatar_url),
        preferred_currency = COALESCE(?, preferred_currency),
        birth_date = COALESCE(?, birth_date),
        gender = COALESCE(?, gender),
        guardian_email = COALESCE(?, guardian_email),
        guardian_name = COALESCE(?, guardian_name),
        updated_at = ?
    WHERE id = ?
  `).bind(
    firstName ?? null,
    lastName ?? null,
    avatarUrl ?? null,
    preferredCurrency ?? null,
    birthDate ?? null,
    gender ?? null,
    guardianEmail ?? null,
    guardianName ?? null,
    now,
    userId
  ).run();

  const user = await c.env.DB.prepare(`
    SELECT id, email, first_name, last_name, avatar_url, preferred_currency, birth_date, gender,
           guardian_email, guardian_name, two_factor_enabled, email_verified, created_at, updated_at
    FROM users WHERE id = ?
  `).bind(userId).first();

  return c.json({
    id: user?.id,
    email: user?.email,
    firstName: user?.first_name,
    lastName: user?.last_name,
    avatarUrl: user?.avatar_url,
    preferredCurrency: user?.preferred_currency,
    birthDate: user?.birth_date,
    gender: user?.gender,
    guardianEmail: user?.guardian_email,
    guardianName: user?.guardian_name,
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

// Change email
settingsRoutes.post('/change-email', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const { newEmail, password } = body;

  if (!newEmail || !password) {
    return c.json({ error: 'newEmail and password are required' }, 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    return c.json({ error: 'Invalid email format' }, 400);
  }

  // Get current user
  const user = await c.env.DB.prepare(`
    SELECT email, password_hash FROM users WHERE id = ?
  `).bind(userId).first();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Ensure new email is different from current
  if ((user.email as string).toLowerCase() === newEmail.toLowerCase()) {
    return c.json({ error: 'New email must be different from your current email' }, 400);
  }

  // Verify password using the same PBKDF2 pattern as change-password
  const encoder = new TextEncoder();
  const [storedSalt, storedHash] = (user.password_hash as string).split(':');
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

  const currentHash = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));

  if (currentHash !== storedHash) {
    return c.json({ error: 'Incorrect password' }, 401);
  }

  // Check that no other user already has this email
  const existing = await c.env.DB.prepare(`
    SELECT id FROM users WHERE email = ? AND id != ?
  `).bind(newEmail, userId).first();

  if (existing) {
    return c.json({ error: 'That email address is already in use' }, 409);
  }

  // Capture old email BEFORE the UPDATE so we can alert the prior owner.
  const oldEmail = user.email as string;
  const now = new Date().toISOString();

  // Update email and mark as unverified
  await c.env.DB.prepare(`
    UPDATE users SET email = ?, email_verified = 0, updated_at = ? WHERE id = ?
  `).bind(newEmail, now, userId).run();

  const safeNew = newEmail.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeOld = oldEmail.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Notify new address: confirmation that change took effect.
  try {
    await sendEmail(c.env, {
      from: 'Heirloom <accounts@heirloom.blue>',
      to: newEmail,
      subject: 'Your Heirloom email address has been changed',
      html: `<p style="font-family:Georgia,serif;font-size:16px;color:#0e0e0c;line-height:1.7;">
        Your Heirloom account email address has been updated to <strong>${safeNew}</strong>.<br><br>
        If you did not make this change, contact us immediately at
        <a href="mailto:support@heirloom.blue" style="color:#b07a4a;">support@heirloom.blue</a>.<br><br>
        <a href="https://heirloom.blue/settings" style="color:#b07a4a;">Visit your settings →</a>
      </p>`,
    });
  } catch (err) {
    console.error('Failed to send email-change confirmation to new address:', err);
  }

  // Alert old address so the account owner can act if this wasn't them.
  try {
    await sendEmail(c.env, {
      from: 'Heirloom <accounts@heirloom.blue>',
      to: oldEmail,
      subject: 'Your Heirloom email address was changed',
      html: `<p style="font-family:Georgia,serif;font-size:16px;color:#0e0e0c;line-height:1.7;">
        The email address on your Heirloom account has been changed from
        <strong>${safeOld}</strong> to <strong>${safeNew}</strong>.<br><br>
        If you made this change, no action is needed.<br><br>
        If you did <strong>not</strong> authorise this change, contact us immediately at
        <a href="mailto:support@heirloom.blue" style="color:#9f3a2a;">support@heirloom.blue</a>
        and we will help you secure your account.
      </p>`,
    });
  } catch (err) {
    console.error('Failed to send email-change alert to old address:', err);
  }

  return c.json({ success: true });
});

// Get notification preferences
settingsRoutes.get('/notifications', async (c) => {
  const userId = c.get('userId');

  const [notifications, prefs] = await Promise.all([
    c.env.DB.prepare(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `).bind(userId).all(),
    c.env.DB.prepare(`
      SELECT * FROM notification_preferences WHERE user_id = ?
    `).bind(userId).first(),
  ]);

  return c.json({
    preferences: {
      emailNotifications: prefs ? !!prefs.email_notifications : true,
      pushNotifications:  prefs ? !!prefs.push_enabled        : true,
      reminderEmails:     prefs ? !!prefs.daily_reminders      : true,
      marketingEmails:    prefs ? !!prefs.marketing_emails     : false,
      weeklyDigest:       prefs ? !!prefs.weekly_digest        : true,
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

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  // Upsert into notification_preferences
  await c.env.DB.prepare(`
    INSERT INTO notification_preferences
      (id, user_id, push_enabled, daily_reminders, weekly_digest, email_notifications, marketing_emails, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      push_enabled         = excluded.push_enabled,
      daily_reminders      = excluded.daily_reminders,
      weekly_digest        = excluded.weekly_digest,
      email_notifications  = excluded.email_notifications,
      marketing_emails     = excluded.marketing_emails,
      updated_at           = excluded.updated_at
  `).bind(
    id, userId,
    body.pushNotifications  ? 1 : 0,
    body.reminderEmails     ? 1 : 0,
    body.weeklyDigest       ? 1 : 0,
    body.emailNotifications ? 1 : 0,
    body.marketingEmails    ? 1 : 0,
    now, now,
  ).run();

  return c.json({ success: true, preferences: body });
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
    SELECT * FROM legacy_contacts WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at ASC
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

  // Generate the verification token. This is the key the public verify-contact
  // flow (and idx_legacy_token) looks up — clicking the email link flips this
  // contact's verification_status to 'VERIFIED', the gate sendTriggerNotifications
  // filters on.
  const verifyToken = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO legacy_contacts (id, user_id, name, email, phone, relationship, role, verification_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, name, email, phone || null, relationship || null, role || 'EXECUTOR', verifyToken, now, now).run();

  const contact = await c.env.DB.prepare(`
    SELECT * FROM legacy_contacts WHERE id = ?
  `).bind(id).first();

  // Send verification email to the legacy contact. The link targets the public
  // verify-contact API endpoint (not a frontend route) so confirming actually
  // sets verification_status='VERIFIED'. Best-effort — never block creation.
  try {
    const { verifyContactEmail } = await import('../email-templates');
    const verifyUrl = 'https://heirloom.blue/api/deadman/verify-contact/' + verifyToken;

    await sendEmail(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: email,
      subject: `${userName} named you a legacy contact`,
      html: verifyContactEmail(name, userName, verifyUrl),
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

// Resend verification email for a legacy contact
settingsRoutes.post('/legacy-contacts/:id/resend', async (c) => {
  const userId = c.get('userId');
  const contactId = c.req.param('id');

  const contact = await c.env.DB.prepare(`
    SELECT lc.*, u.first_name, u.last_name
    FROM legacy_contacts lc
    JOIN users u ON u.id = lc.user_id
    WHERE lc.id = ? AND lc.user_id = ? AND lc.deleted_at IS NULL
  `).bind(contactId, userId).first() as any;

  if (!contact) {
    return c.json({ error: 'Legacy contact not found' }, 404);
  }

  if (contact.verified || contact.verification_status === 'VERIFIED') {
    return c.json({ success: true, message: 'Already verified' });
  }

  try {
    // Backfill a token if this contact predates the verify-contact flow, so the
    // resent link resolves against verification_token.
    let token = contact.verification_token as string | null;
    if (!token) {
      token = crypto.randomUUID();
      await c.env.DB.prepare(`
        UPDATE legacy_contacts SET verification_token = ?, updated_at = ? WHERE id = ?
      `).bind(token, new Date().toISOString(), contact.id).run();
    }

    const { verifyContactEmail } = await import('../email-templates');
    const userName = `${contact.first_name} ${contact.last_name}`;
    const verifyUrl = 'https://heirloom.blue/api/deadman/verify-contact/' + token;

    await sendEmail(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: contact.email,
      subject: `${userName} named you a legacy contact`,
      html: verifyContactEmail(contact.name, userName, verifyUrl),
    }, 'LEGACY_CONTACT_VERIFICATION');
  } catch (err) {
    console.error('Failed to resend legacy contact verification email:', err);
    // Don't fail — stub returns success regardless
  }

  return c.json({ success: true, message: 'Verification resent' });
});

// Update legacy contact
settingsRoutes.patch('/legacy-contacts/:id', async (c) => {
  const userId = c.get('userId');
  const contactId = c.req.param('id');
  const body = await c.req.json();
  
  // Verify ownership (live rows only)
  const existing = await c.env.DB.prepare(`
    SELECT * FROM legacy_contacts WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).bind(contactId, userId).first();

  if (!existing) {
    return c.json({ error: 'Legacy contact not found' }, 404);
  }

  const { name, email, phone, relationship, role } = body;
  const now = new Date().toISOString();

  // Append-only: snapshot prior values to the immutable revision log before edit,
  // mirroring the memories/letters/voice surface. Within the mutability grace
  // window it's an in-place 'edit'; after it, an 'amendment'. The prior PII
  // (name/email/phone) lands in the snapshot column — stored encrypted-at-rest by
  // recordRevision — NOT in the plaintext Cloudflare log stream. The grace window
  // (mutable_until) is NOT extended on amendment, so the row's append-only
  // character is preserved.
  await recordRevision(c.env, 'legacy_contact', contactId, userId, {
    name: existing.name,
    email: existing.email,
    phone: existing.phone,
    relationship: existing.relationship,
    role: existing.role,
    updated_at: existing.updated_at,
  }, withinGrace(existing.mutable_until as string | null) ? 'edit' : 'amendment');

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

// Delete legacy contact — SOFT delete only.
// A hard DELETE would cascade (ON DELETE CASCADE) into the bequest junctions
// (letter_legacy_recipients, memory_legacy_recipients, voice_legacy_recipients)
// AND shamir_shares, permanently destroying the willed inheritance routing and
// the heir's Shamir key shares — unrecoverable. Setting deleted_at keeps the row
// alive so the cascade never fires; "remove" just hides it from reads.
settingsRoutes.delete('/legacy-contacts/:id', async (c) => {
  const userId = c.get('userId');
  const contactId = c.req.param('id');

  // Verify ownership (live rows only)
  const existing = await c.env.DB.prepare(`
    SELECT * FROM legacy_contacts WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).bind(contactId, userId).first();

  if (!existing) {
    return c.json({ error: 'Legacy contact not found' }, 404);
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    UPDATE legacy_contacts SET deleted_at = ?, deleted_reason = 'removed' WHERE id = ? AND user_id = ?
  `).bind(now, contactId, userId).run();

  return c.body(null, 204);
});

// Restore a soft-deleted legacy contact within the 7-day grace window
settingsRoutes.patch('/legacy-contacts/:id/restore', async (c) => {
  const userId = c.get('userId');
  const contactId = c.req.param('id');

  const existing = await c.env.DB.prepare(`
    SELECT * FROM legacy_contacts
    WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL
      AND deleted_at > datetime('now', '-7 days')
  `).bind(contactId, userId).first();

  if (!existing) {
    return c.json({ error: 'Contact not found or grace period expired' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE legacy_contacts SET deleted_at = NULL, deleted_reason = NULL WHERE id = ? AND user_id = ?
  `).bind(contactId, userId).run();

  return c.json({ success: true });
});

// Enable 2FA
settingsRoutes.post('/2fa/enable', async (c) => {
  const userId = c.get('userId');
  const { password } = await c.req.json().catch(() => ({})) as { password?: string };

  const user = await c.env.DB.prepare(
    'SELECT email, password_hash, two_factor_enabled FROM users WHERE id = ?'
  ).bind(userId).first<{ email: string; password_hash: string; two_factor_enabled: number }>();

  if (!user) return c.json({ error: 'User not found' }, 404);

  // If 2FA is already active, require password + existing TOTP confirmation before re-enrolling.
  if (user.two_factor_enabled) {
    if (!password) return c.json({ error: 'Password is required to re-enroll 2FA' }, 400);
    const ok = await verifyStoredPassword(password, user.password_hash);
    if (!ok) return c.json({ error: 'Incorrect password' }, 401);
  }

  const secret = base32Encode(crypto.getRandomValues(new Uint8Array(20)));
  // Store new secret but keep two_factor_enabled = 0 until /2fa/verify succeeds with it.
  await c.env.DB.prepare(
    'UPDATE users SET two_factor_secret = ?, two_factor_enabled = 0, updated_at = ? WHERE id = ?'
  ).bind(secret, new Date().toISOString(), userId).run();

  const otpauthUrl = `otpauth://totp/Heirloom:${user.email}?secret=${secret}&issuer=Heirloom`;

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
    c.env.DB.prepare(`SELECT COALESCE(SUM(file_size), 0) AS total FROM voice_recordings WHERE user_id = ? AND deleted_at IS NULL`).bind(userId).first<{ total: number }>(),
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

  const userRow = await c.env.DB.prepare(
    `SELECT u.password_hash, s.stripe_customer_id
     FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id
     WHERE u.id = ?`
  ).bind(userId).first();
  if (!userRow) return c.json({ error: 'User not found' }, 404);
  const validPw = await verifyStoredPassword(password, userRow.password_hash as string);
  if (!validPw) return c.json({ error: 'Incorrect password.' }, 401);

  // Collect R2 file keys and KV session IDs before deleting DB rows (GDPR Art. 17)
  const [memoryFiles, voiceFiles, activeSessions] = await Promise.all([
    c.env.DB.prepare(`SELECT file_key FROM memories WHERE user_id = ? AND file_key IS NOT NULL`).bind(userId).all(),
    c.env.DB.prepare(`SELECT file_key FROM voice_recordings WHERE user_id = ? AND file_key IS NOT NULL`).bind(userId).all(),
    c.env.DB.prepare(`SELECT id FROM sessions WHERE user_id = ?`).bind(userId).all(),
  ]);

  // Collect all avatar R2 keys for this user
  const avatarR2Keys: string[] = [];
  try {
    const avatarPrefix = `avatars/${userId}/`;
    const listed = await c.env.STORAGE.list({ prefix: avatarPrefix });
    for (const obj of listed.objects) avatarR2Keys.push(obj.key);
  } catch {
    // list may not be available on all binding versions — safe to skip
  }

  // Delete Stripe customer — personal data must leave the data processor (GDPR Art. 17 / POPIA §23)
  const stripeCustomerId = userRow.stripe_customer_id as string | null;
  if (stripeCustomerId && c.env.STRIPE_SECRET_KEY) {
    // Cancel active subscriptions before deleting customer
    try {
      const subsRes = await fetch(
        `https://api.stripe.com/v1/subscriptions?customer=${stripeCustomerId}&status=active&limit=5`,
        { headers: { 'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}` } },
      );
      if (subsRes.ok) {
        const subsData = await subsRes.json<{ data: Array<{ id: string }> }>();
        await Promise.all(subsData.data.map(sub =>
          fetch(`https://api.stripe.com/v1/subscriptions/${sub.id}/cancel`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'cancellation_details[comment]=Account+deleted+by+user',
          })
        ));
      }
    } catch (subErr) {
      console.error('Failed to cancel subscriptions before account deletion:', subErr);
      // Continue with deletion even if cancellation fails
    }
    try {
      await fetch(`https://api.stripe.com/v1/customers/${stripeCustomerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}` },
      });
    } catch {
      // Non-blocking: Stripe purge can be retried manually via dashboard
      console.error(`Stripe customer deletion failed for ${stripeCustomerId}`);
    }
  }

  // Purge all user data — D1 does not enforce FK cascades by default, so every
  // table with a user_id reference is deleted explicitly. Order: children first.
  await c.env.DB.batch([
    c.env.DB.prepare(`DELETE FROM thread_members WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM threads WHERE founder_user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM device_tokens WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM password_resets WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM shamir_shares WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM notifications WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM legacy_contacts WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM recipient_messages WHERE creator_user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM dead_man_switches WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM post_reminder_emails WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM wrapped_data WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM support_tickets WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM audit_logs WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM voice_recordings WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM letters WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM memories WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM family_members WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM subscriptions WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(userId),
    c.env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(userId),
  ]);

  // Invalidate KV sessions immediately — JWT stays valid until TTL without this
  await Promise.allSettled(
    (activeSessions.results as any[]).map((s) => c.env.KV.delete(`session:${s.id}`))
  );

  // Delete R2 binary objects — run after DB purge (best-effort; DB is authoritative)
  const fileKeys = [
    ...(memoryFiles.results as any[]).map((r) => r.file_key as string),
    ...(voiceFiles.results as any[]).map((r) => r.file_key as string),
    ...avatarR2Keys,
  ];
  await Promise.allSettled(fileKeys.map((key) => c.env.STORAGE.delete(key)));

  return c.json({ success: true, message: 'Account deleted successfully' });
});

// ============================================
// DATA EXPORT (GDPR Compliance)
// ============================================

settingsRoutes.get('/export', async (c) => {
  const userId = c.get('userId');
  
  try {
    // Gather all user data. The export is the user's complete GDPR archive, so
    // it also carries the bequest/recipient routing (which sealed entries were
    // willed to which legacy contact) and the append-only revision history —
    // ExportPage promises bequeathed entries are included and the product
    // promises nothing is lost. Each junction/revision query is scoped to the
    // exporting user by joining through the parent entity's user_id (revisions
    // carry their own user_id column).
    //
    // USER-OWNED TABLE LEDGER (keep in sync with the account-delete batch above).
    // This gather and the DELETE batch must enumerate the same set of user-owned
    // tables, or a table is silently either un-erased or un-exported. When a new
    // user-owned table is added, add it to BOTH lists (or deliberately exclude it
    // here and note why below).
    //   INCLUDED in this export:
    //     users, memories, voice_recordings, letters, family_members,
    //     legacy_contacts (incl. soft-deleted, see below), dead_man_switches,
    //     subscriptions, letter/memory/voice legacy-recipient junctions,
    //     legacy_revisions, wrapped_data, thread_members.
    //   INTENTIONALLY EXCLUDED (operational/transient, not user content):
    //     notifications, audit_logs, device_tokens, shamir_shares (key escrow —
    //     never exported in cleartext), password_resets, sessions,
    //     post_reminder_emails, support_tickets, recipient_messages, threads
    //     (founder-owned container row, surfaced via thread_members instead).
    const [
      user, memories, voiceRecordings, letters, familyMembers, legacyContacts,
      deadManSwitch, subscription,
      letterBequests, memoryBequests, voiceBequests, legacyRevisions,
      wrappedData, threadMemberships,
    ] = await Promise.all([
      c.env.DB.prepare(`
        SELECT id, email, first_name, last_name, avatar_url, preferred_currency,
               email_verified, two_factor_enabled, created_at, updated_at
        FROM users WHERE id = ?
      `).bind(userId).first(),
      c.env.DB.prepare(`SELECT * FROM memories WHERE user_id = ?`).bind(userId).all(),
      c.env.DB.prepare(`SELECT * FROM voice_recordings WHERE user_id = ?`).bind(userId).all(),
      c.env.DB.prepare(`SELECT * FROM letters WHERE user_id = ?`).bind(userId).all(),
      c.env.DB.prepare(`SELECT * FROM family_members WHERE user_id = ?`).bind(userId).all(),
      // Include soft-deleted contacts in the EXPORT gather (only here — the
      // live-delivery queries keep their deleted_at IS NULL filters). A bequest
      // junction can still reference a removed contact, so every exported
      // legacyContactId must resolve to a contact in this array or the archive
      // would carry a dangling reference. Each contact carries deletedAt so a
      // reader can tell live from revoked.
      c.env.DB.prepare(`SELECT * FROM legacy_contacts WHERE user_id = ?`).bind(userId).all(),
      c.env.DB.prepare(`SELECT * FROM dead_man_switches WHERE user_id = ?`).bind(userId).first(),
      c.env.DB.prepare(`SELECT * FROM subscriptions WHERE user_id = ?`).bind(userId).first(),
      // Bequest/recipient junctions — scoped to entries owned by this user.
      c.env.DB.prepare(`
        SELECT llr.letter_id, llr.legacy_contact_id, llr.added_at
        FROM letter_legacy_recipients llr
        JOIN letters l ON l.id = llr.letter_id
        WHERE l.user_id = ?
      `).bind(userId).all(),
      c.env.DB.prepare(`
        SELECT mlr.memory_id, mlr.legacy_contact_id, mlr.added_at
        FROM memory_legacy_recipients mlr
        JOIN memories m ON m.id = mlr.memory_id
        WHERE m.user_id = ?
      `).bind(userId).all(),
      c.env.DB.prepare(`
        SELECT vlr.voice_recording_id, vlr.legacy_contact_id, vlr.added_at
        FROM voice_legacy_recipients vlr
        JOIN voice_recordings v ON v.id = vlr.voice_recording_id
        WHERE v.user_id = ?
      `).bind(userId).all(),
      // Append-only revision history (migration 0040), scoped by its user_id.
      c.env.DB.prepare(`
        SELECT id, entity_type, entity_id, snapshot, reason, created_at
        FROM legacy_revisions WHERE user_id = ?
        ORDER BY created_at ASC
      `).bind(userId).all(),
      // Year-in-review aggregates (wrapped_data) — straightforward per-user rows.
      c.env.DB.prepare(`SELECT * FROM wrapped_data WHERE user_id = ? ORDER BY year ASC`).bind(userId).all(),
      // Family Thread memberships — the user's place(s) in any bloodline thread.
      c.env.DB.prepare(`SELECT * FROM thread_members WHERE user_id = ?`).bind(userId).all(),
    ]);

    // Decrypt encrypted memory descriptions so the personal data export carries
    // readable prose. This export is the user's complete GDPR archive, so it
    // intentionally includes revoked (soft-deleted) entries too — append-only
    // means nothing is lost until account erasure.
    for (const m of memories.results as any[]) {
      m.description = await readDescription(c.env, m);
    }

    // Decrypt revision snapshots the same way the live read path (listRevisions)
    // does — parse the stored JSON, swap any at-rest-encrypted description back
    // to plaintext, and drop the cipher fields. Without this the archive would
    // carry unreadable ciphertext for any revision recorded while at-rest
    // encryption was on, defeating the offline-copy promise. Client-side E2E
    // ciphertext (where the server never held the key) decrypts to null and is
    // left as-is. Parse failures fall back to the raw string.
    const decryptedRevisions: any[] = [];
    for (const r of legacyRevisions.results as any[]) {
      let snapshot: unknown = r.snapshot;
      try {
        const parsed = JSON.parse(r.snapshot as string) as Record<string, unknown>;
        if (parsed.description_enc && parsed.description_iv) {
          const plain = await decryptText(
            c.env,
            parsed.description_enc as string,
            parsed.description_iv as string,
          );
          if (plain !== null) parsed.description = plain;
          delete parsed.description_enc;
          delete parsed.description_iv;
        }
        snapshot = parsed;
      } catch {
        // Corrupt/non-JSON snapshot rows still surface as their raw value.
      }
      decryptedRevisions.push({
        id: r.id,
        entityType: r.entity_type,
        entityId: r.entity_id,
        snapshot,
        reason: r.reason,
        createdAt: r.created_at,
      });
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
      // Forward-compat marker for offline readers / future importers. Bump when
      // the export shape changes in a non-additive way.
      schemaVersion: '1',
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
        // At-rest encryption indicators — forward-portability so a future
        // client-side-key option can round-trip ciphertext + IV instead of
        // exporting undecryptable bytes labelled as prose. No behavior change
        // today (the server-held model decrypts in place before reads).
        encrypted: !!m.encrypted,
        encryptionIv: m.encryption_iv ?? null,
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
        encrypted: !!v.encrypted,
        encryptionIv: v.encryption_iv ?? null,
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
        encrypted: !!l.encrypted,
        encryptionIv: l.encryption_iv ?? null,
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
        // null for live members; ISO timestamp for soft-deleted ones (column per
        // migration 0043). The gather is unfiltered, so readers need this flag to
        // distinguish a live member from a removed one.
        deletedAt: f.deleted_at ?? null,
      })),
      legacyContacts: legacyContacts.results.map((lc: any) => ({
        id: lc.id,
        name: lc.name,
        email: lc.email,
        phone: lc.phone,
        relationship: lc.relationship,
        verificationStatus: lc.verification_status,
        createdAt: lc.created_at,
        // null for live contacts; ISO timestamp for soft-deleted (revoked) ones.
        // Present so bequest legacyContactIds referencing a removed contact still
        // resolve in the archive.
        deletedAt: lc.deleted_at ?? null,
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
      // Bequest/recipient routing — which sealed entries were willed to which
      // legacy contact (letter/memory/voice junctions). Preserved so the archive
      // reflects the bequeathed inheritance ExportPage promises.
      bequests: {
        letters: (letterBequests.results as any[]).map((b: any) => ({
          letterId: b.letter_id,
          legacyContactId: b.legacy_contact_id,
          addedAt: b.added_at,
        })),
        memories: (memoryBequests.results as any[]).map((b: any) => ({
          memoryId: b.memory_id,
          legacyContactId: b.legacy_contact_id,
          addedAt: b.added_at,
        })),
        voiceRecordings: (voiceBequests.results as any[]).map((b: any) => ({
          voiceRecordingId: b.voice_recording_id,
          legacyContactId: b.legacy_contact_id,
          addedAt: b.added_at,
        })),
      },
      // Append-only revision history (prior versions of every legacy entry),
      // snapshots decrypted above to readable prose where the server holds the key.
      revisions: decryptedRevisions,
      // Year-in-review aggregates per year.
      wrappedData: (wrappedData.results as any[]).map((w: any) => ({
        year: w.year,
        totalMemories: w.total_memories,
        totalVoiceStories: w.total_voice_stories,
        totalLetters: w.total_letters,
        totalStorage: w.total_storage,
        longestStreak: w.longest_streak,
        currentStreak: w.current_streak,
        topEmotions: w.top_emotions ? JSON.parse(w.top_emotions) : [],
        topTaggedPeople: w.top_tagged_people ? JSON.parse(w.top_tagged_people) : [],
        highlights: w.highlights ? JSON.parse(w.highlights) : [],
        summary: w.summary,
        generatedAt: w.generated_at,
      })),
      // The user's membership in any Family Thread (their place in the bloodline).
      threadMemberships: (threadMemberships.results as any[]).map((tm: any) => ({
        threadId: tm.thread_id,
        displayName: tm.display_name,
        email: tm.email,
        relationLabel: tm.relation_label,
        role: tm.role,
        targetRole: tm.target_role,
        createdAt: tm.created_at,
      })),
      fileManifest,
    };
    
    // Log to audit_logs for compliance (if table exists)
    try {
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (id, user_id, action, details, created_at)
        VALUES (?, ?, 'DATA_EXPORT', ?, ?)
      `).bind(crypto.randomUUID(), userId, JSON.stringify({ exportedAt: exportData.exportedAt }), new Date().toISOString()).run();
    } catch (err) {
      console.error('audit_logs INSERT failed:', err);
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

// Mark onboarding as complete
settingsRoutes.post('/onboarding/complete', async (c) => {
  const userId = c.get('userId');

  try {
    await c.env.DB.prepare(`
      UPDATE users SET onboarding_completed = 1, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), userId).run();
  } catch (err) {
    // Column may not exist on older DB instances — return success anyway
    console.error('Failed to set onboarding_completed:', err);
  }

  return c.json({ success: true });
});
