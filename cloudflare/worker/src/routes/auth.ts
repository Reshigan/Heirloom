/**
 * Authentication Routes
 * Handles registration, login, logout, and token refresh
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const authRoutes = new Hono<{ Bindings: Env }>();

// ============================================
// REGISTER
// ============================================

authRoutes.post('/register', async (c) => {
  const body = await c.req.json();
  const { email, password, firstName, lastName } = body;
  
  // Validate input
  if (!email || !password || !firstName || !lastName) {
    return c.json({ error: 'All fields are required' }, 400);
  }
  
  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400);
  }
  
  // Check if user exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first();
  
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  // Create user
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(userId, email.toLowerCase(), passwordHash, firstName, lastName, now, now).run();
  
  // Create trial subscription
  const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO subscriptions (id, user_id, tier, status, trial_ends_at, created_at, updated_at)
    VALUES (?, ?, 'FREE', 'TRIALING', ?, ?, ?)
  `).bind(crypto.randomUUID(), userId, trialEnds, now, now).run();
  
  // Create session
  const { token, refreshToken, sessionId } = await createSession(c.env, userId);
  
  // Get user data
  const user = await c.env.DB.prepare(`
    SELECT id, email, first_name, last_name, avatar_url, email_verified, two_factor_enabled
    FROM users WHERE id = ?
  `).bind(userId).first();
  
  // Send verification email to new user
  try {
    const resendApiKey = c.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      // Generate verification token
      const verifyToken = crypto.randomUUID() + '-' + crypto.randomUUID();
      const tokenHash = await hashToken(verifyToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      
      // Store token
      await c.env.DB.prepare(`
        INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
        VALUES (?, ?, ?, ?)
      `).bind(crypto.randomUUID(), userId, tokenHash, expiresAt).run();
      
      // Send verification email
      const { verificationEmail } = await import('../email-templates');
      const emailContent = verificationEmail(firstName, verifyToken);
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Heirloom <noreply@heirloom.blue>',
          to: email.toLowerCase(),
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Failed to send verification email:', response.status, errorBody);
      }
      
      // Also send welcome email with trial info
      const { welcomeEmail } = await import('../email-templates');
      const welcomeContent = welcomeEmail(firstName);
      
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Heirloom <noreply@heirloom.blue>',
          to: email.toLowerCase(),
          subject: welcomeContent.subject,
          html: welcomeContent.html,
        }),
      });
    }
  } catch (err) {
    console.error('Failed to send verification email:', err);
    // Don't fail registration if verification email fails
  }
  
    // Send admin notification for new user signup
    try {
      const adminNotificationEmail = c.env.ADMIN_NOTIFICATION_EMAIL;
      const resendApiKey = c.env.RESEND_API_KEY;
    
      if (adminNotificationEmail && resendApiKey) {
        const { adminNewUserNotificationEmail } = await import('../email-templates');
        const emailContent = adminNewUserNotificationEmail(
          email.toLowerCase(),
          `${firstName} ${lastName}`,
          new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
        );
      
        const adminResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Heirloom <noreply@heirloom.blue>',
            to: adminNotificationEmail,
            subject: emailContent.subject,
            html: emailContent.html,
          }),
        });
      
        if (!adminResponse.ok) {
          const errorBody = await adminResponse.text();
          console.error('Failed to send admin notification email:', adminResponse.status, errorBody);
        }
      }
    } catch (err) {
      console.error('Failed to send admin notification:', err);
      // Don't fail registration if admin notification fails
    }
  
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      emailVerified: !!user.email_verified,
      twoFactorEnabled: !!user.two_factor_enabled,
    },
    token,
    refreshToken,
  }, 201);
});

// ============================================
// LOGIN
// ============================================

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;
  
  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400);
  }
  
  // Find user
  const user = await c.env.DB.prepare(`
    SELECT id, email, password_hash, first_name, last_name, avatar_url, 
           email_verified, two_factor_enabled, two_factor_secret
    FROM users WHERE email = ?
  `).bind(email.toLowerCase()).first();
  
  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }
  
  // Verify password
  const valid = await verifyPassword(password, user.password_hash as string);
  if (!valid) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }
  
  // Check 2FA
  if (user.two_factor_enabled) {
    // Return partial response requiring 2FA
    const tempToken = await createTempToken(c.env, user.id as string);
    return c.json({
      requiresTwoFactor: true,
      tempToken,
    });
  }
  
  // Create session
  const { token, refreshToken, sessionId } = await createSession(c.env, user.id as string);
  
  // Update last login
  await c.env.DB.prepare(
    'UPDATE users SET last_login_at = ? WHERE id = ?'
  ).bind(new Date().toISOString(), user.id).run();
  
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      emailVerified: !!user.email_verified,
      twoFactorEnabled: !!user.two_factor_enabled,
    },
    token,
    refreshToken,
  });
});

// ============================================
// VERIFY 2FA
// ============================================

authRoutes.post('/verify-2fa', async (c) => {
  const body = await c.req.json();
  const { tempToken, code } = body;
  
  // Get user ID from temp token
  const userId = await c.env.KV.get(`temp:${tempToken}`);
  if (!userId) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  
  // Get user
  const user = await c.env.DB.prepare(`
    SELECT id, email, first_name, last_name, avatar_url, 
           email_verified, two_factor_enabled, two_factor_secret
    FROM users WHERE id = ?
  `).bind(userId).first();
  
  if (!user || !user.two_factor_secret) {
    return c.json({ error: 'Invalid request' }, 400);
  }
  
  // Verify TOTP code
  const valid = verifyTOTP(code, user.two_factor_secret as string);
  if (!valid) {
    return c.json({ error: 'Invalid verification code' }, 401);
  }
  
  // Delete temp token
  await c.env.KV.delete(`temp:${tempToken}`);
  
  // Create session
  const { token, refreshToken, sessionId } = await createSession(c.env, userId);
  
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      emailVerified: !!user.email_verified,
      twoFactorEnabled: !!user.two_factor_enabled,
    },
    token,
    refreshToken,
  });
});

// ============================================
// REFRESH TOKEN
// ============================================

authRoutes.post('/refresh', async (c) => {
  const body = await c.req.json();
  const { refreshToken } = body;
  
  if (!refreshToken) {
    return c.json({ error: 'Refresh token required' }, 400);
  }
  
  // Get refresh token data from KV
  const data = await c.env.KV.get(`refresh:${refreshToken}`, 'json');
  if (!data) {
    return c.json({ error: 'Invalid refresh token' }, 401);
  }
  
  const { userId, sessionId } = data as { userId: string; sessionId: string };
  
  // Delete old refresh token
  await c.env.KV.delete(`refresh:${refreshToken}`);
  
  // Create new tokens
  const tokens = await createSession(c.env, userId, sessionId);
  
  return c.json({
    token: tokens.token,
    refreshToken: tokens.refreshToken,
  });
});

// ============================================
// LOGOUT
// ============================================

authRoutes.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    
    try {
      const payload = await verifyJWT(token, c.env.JWT_SECRET);
      
      // Delete session from KV
      await c.env.KV.delete(`session:${payload.sessionId}`);
      
      // Delete from database
      await c.env.DB.prepare(
        'DELETE FROM sessions WHERE id = ?'
      ).bind(payload.sessionId).run();
    } catch {
      // Token invalid, but logout anyway
    }
  }
  
  return c.json({ message: 'Logged out' });
});

// ============================================
// GET CURRENT USER
// ============================================

authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    
    const user = await c.env.DB.prepare(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url, 
             u.email_verified, u.two_factor_enabled, u.preferred_currency,
             s.tier, s.status, s.trial_ends_at
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.id = ?
    `).bind(payload.sub).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Calculate trial days remaining
    let trialDaysRemaining = 0;
    if (user.status === 'TRIALING' && user.trial_ends_at) {
      const trialEnd = new Date(user.trial_ends_at as string);
      trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    }
    
    return c.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      emailVerified: !!user.email_verified,
      twoFactorEnabled: !!user.two_factor_enabled,
      preferredCurrency: user.preferred_currency,
      subscription: {
        tier: user.tier,
        status: user.status,
        trialDaysRemaining,
      },
    });
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// ============================================
// FORGOT PASSWORD
// ============================================

authRoutes.post('/forgot-password', async (c) => {
  const body = await c.req.json();
  const { email } = body;
  
  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }
  
  // Find user (but don't reveal if they exist)
  const user = await c.env.DB.prepare(
    'SELECT id, first_name FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first();
  
  // Always return success to prevent email enumeration
  if (!user) {
    return c.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
  }
  
  // Generate secure token
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  
  // Delete any existing reset tokens for this user
  await c.env.DB.prepare(
    'DELETE FROM password_resets WHERE user_id = ?'
  ).bind(user.id).run();
  
  // Store token hash in database
  await c.env.DB.prepare(`
    INSERT INTO password_resets (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(crypto.randomUUID(), user.id, tokenHash, expiresAt).run();
  
  // Send password reset email
  const resendApiKey = c.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    // Still return success message to not reveal if account exists
    return c.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
  }
  
  try {
    const { passwordResetEmail } = await import('../email-templates');
    const emailContent = passwordResetEmail(user.first_name as string, token);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Heirloom <noreply@heirloom.blue>',
        to: email.toLowerCase(),
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Resend API error for password reset:', response.status, errorBody);
    }
  } catch (err) {
    console.error('Failed to send password reset email:', err);
  }
  
  return c.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
});

// ============================================
// RESET PASSWORD
// ============================================

authRoutes.post('/reset-password', async (c) => {
  const body = await c.req.json();
  const { token, password } = body;
  
  if (!token || !password) {
    return c.json({ error: 'Token and password are required' }, 400);
  }
  
  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400);
  }
  
  // Hash the token to compare with stored hash
  const tokenHash = await hashToken(token);
  
  // Find the reset token
  const resetRecord = await c.env.DB.prepare(`
    SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?
  `).bind(tokenHash).first();
  
  if (!resetRecord) {
    return c.json({ error: 'Invalid or expired reset link' }, 400);
  }
  
  // Check if already used
  if (resetRecord.used_at) {
    return c.json({ error: 'This reset link has already been used' }, 400);
  }
  
  // Check expiry
  const expiresAt = new Date(resetRecord.expires_at as string);
  if (Date.now() > expiresAt.getTime()) {
    return c.json({ error: 'This reset link has expired' }, 400);
  }
  
  // Hash new password
  const passwordHash = await hashPassword(password);
  
  // Update user's password
  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
  ).bind(passwordHash, new Date().toISOString(), resetRecord.user_id).run();
  
  // Mark token as used
  await c.env.DB.prepare(
    'UPDATE password_resets SET used_at = ? WHERE id = ?'
  ).bind(new Date().toISOString(), resetRecord.id).run();
  
  // Invalidate all existing sessions for this user
  await c.env.DB.prepare(
    'DELETE FROM sessions WHERE user_id = ?'
  ).bind(resetRecord.user_id).run();
  
  return c.json({ message: 'Password has been reset successfully. Please log in with your new password.' });
});

// ============================================
// EMAIL VERIFICATION
// ============================================

authRoutes.get('/verify-email', async (c) => {
  const token = c.req.query('token');
  
  if (!token) {
    return c.json({ error: 'Verification token is required' }, 400);
  }
  
  // Hash the token to compare with stored hash
  const tokenHash = await hashToken(token);
  
  // Find the verification token
  const verifyRecord = await c.env.DB.prepare(`
    SELECT id, user_id, expires_at, used_at FROM email_verification_tokens WHERE token_hash = ?
  `).bind(tokenHash).first();
  
  if (!verifyRecord) {
    return c.json({ error: 'Invalid verification link' }, 400);
  }
  
  // Check if already used
  if (verifyRecord.used_at) {
    return c.json({ error: 'This verification link has already been used' }, 400);
  }
  
  // Check expiry
  const expiresAt = new Date(verifyRecord.expires_at as string);
  if (Date.now() > expiresAt.getTime()) {
    return c.json({ error: 'This verification link has expired' }, 400);
  }
  
  // Mark email as verified
  await c.env.DB.prepare(
    'UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?'
  ).bind(new Date().toISOString(), verifyRecord.user_id).run();
  
  // Mark token as used
  await c.env.DB.prepare(
    'UPDATE email_verification_tokens SET used_at = ? WHERE id = ?'
  ).bind(new Date().toISOString(), verifyRecord.id).run();
  
  return c.json({ success: true, message: 'Email verified successfully!' });
});

authRoutes.post('/resend-verification', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    
    // Get user
    const user = await c.env.DB.prepare(
      'SELECT id, email, first_name, email_verified FROM users WHERE id = ?'
    ).bind(payload.sub).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    if (user.email_verified) {
      return c.json({ error: 'Email is already verified' }, 400);
    }
    
    // Invalidate old tokens
    await c.env.DB.prepare(
      'DELETE FROM email_verification_tokens WHERE user_id = ?'
    ).bind(user.id).run();
    
    // Generate new token
    const verifyToken = crypto.randomUUID() + '-' + crypto.randomUUID();
    const tokenHash = await hashToken(verifyToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    // Store token
    await c.env.DB.prepare(`
      INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(crypto.randomUUID(), user.id, tokenHash, expiresAt).run();
    
    // Send verification email using proper template
    const resendApiKey = c.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return c.json({ error: 'Email service not configured. Please contact support.' }, 500);
    }
    
    try {
      const { verificationEmail } = await import('../email-templates');
      const emailContent = verificationEmail(user.first_name as string, verifyToken);
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Heirloom <noreply@heirloom.blue>',
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Resend API error:', response.status, errorBody);
        return c.json({ error: 'Failed to send verification email. Please try again.' }, 500);
      }
      
      return c.json({ message: 'Verification email sent' });
    } catch (err) {
      console.error('Failed to send verification email:', err);
      return c.json({ error: 'Failed to send verification email. Please try again.' }, 500);
    }
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordData = encoder.encode(password);
  
  const key = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  );
  
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  
  return `${saltB64}:${hashB64}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(':');
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const storedHash = Uint8Array.from(atob(hashB64), c => c.charCodeAt(0));
  
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const key = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  );
  
  const computedHash = new Uint8Array(hash);
  
  if (computedHash.length !== storedHash.length) return false;
  
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash[i] ^ storedHash[i];
  }
  
  return result === 0;
}

async function createSession(env: Env, userId: string, existingSessionId?: string): Promise<{
  token: string;
  refreshToken: string;
  sessionId: string;
}> {
  const sessionId = existingSessionId || crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour
  
  // Create JWT
  const token = await signJWT(
    { sub: userId, sessionId, iat: now, exp },
    env.JWT_SECRET
  );
  
  // Create refresh token
  const refreshToken = crypto.randomUUID();
  
  // Store session in KV (1 hour TTL)
  await env.KV.put(`session:${sessionId}`, JSON.stringify({ userId }), {
    expirationTtl: 3600,
  });
  
  // Store refresh token in KV (30 days TTL)
  await env.KV.put(`refresh:${refreshToken}`, JSON.stringify({ userId, sessionId }), {
    expirationTtl: 30 * 24 * 3600,
  });
  
  // Store session in DB for tracking
  if (!existingSessionId) {
    await env.DB.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      sessionId,
      userId,
      sessionId, // Use sessionId instead of truncated token to avoid uniqueness issues
      new Date(exp * 1000).toISOString(),
      new Date().toISOString()
    ).run();
  }
  
  return { token, refreshToken, sessionId };
}

async function createTempToken(env: Env, userId: string): Promise<string> {
  const tempToken = crypto.randomUUID();
  
  // Store in KV with 5 minute TTL
  await env.KV.put(`temp:${tempToken}`, userId, {
    expirationTtl: 300,
  });
  
  return tempToken;
}

async function signJWT(payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

async function verifyJWT(token: string, secret: string): Promise<any> {
  const encoder = new TextEncoder();
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const signature = Uint8Array.from(
    atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );
  
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );
  
  if (!valid) throw new Error('Invalid signature');
  
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
  
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error('Token expired');
  }
  
  return payload;
}

function verifyTOTP(code: string, secret: string): boolean {
  // Basic TOTP verification (you may want to use a library)
  // This is a simplified implementation
  const time = Math.floor(Date.now() / 30000);
  
  for (let i = -1; i <= 1; i++) {
    const expectedCode = generateTOTP(secret, time + i);
    if (code === expectedCode) return true;
  }
  
  return false;
}

function generateTOTP(secret: string, time: number): string {
  // Simplified TOTP - in production use a proper library
  const counter = time.toString(16).padStart(16, '0');
  // This is a placeholder - real TOTP needs HMAC-SHA1
  return ((parseInt(secret.slice(0, 8), 36) + time) % 1000000).toString().padStart(6, '0');
}
