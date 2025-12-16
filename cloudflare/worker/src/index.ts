/**
 * Heirloom API - Cloudflare Workers
 * 
 * A globally distributed API running at the edge
 * with D1 (SQLite), R2 (storage), and KV (sessions)
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

// Routes
import { authRoutes } from './routes/auth';
import { familyRoutes } from './routes/family';
import { memoriesRoutes } from './routes/memories';
import { lettersRoutes } from './routes/letters';
import { voiceRoutes } from './routes/voice';
import { billingRoutes } from './routes/billing';
import { settingsRoutes } from './routes/settings';
import { deadmanRoutes } from './routes/deadman';
import { encryptionRoutes } from './routes/encryption';
import { adminRoutes } from './routes/admin';
import { wrappedRoutes } from './routes/wrapped';

// Types
export interface Env {
  // D1 Database
  DB: D1Database;
  
  // R2 Storage
  STORAGE: R2Bucket;
  
  // KV Namespace
  KV: KVNamespace;
  
  // Durable Objects
  RATE_LIMITER: DurableObjectNamespace;
  
  // Environment Variables
  ENVIRONMENT: string;
  APP_URL: string;
  API_URL: string;
  
  // Secrets
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  ENCRYPTION_MASTER_KEY: string;
}

// Create Hono app with typed env
const app = new Hono<{ Bindings: Env }>();

// ============================================
// MIDDLEWARE
// ============================================

// Logging
app.use('*', logger());

// Security headers
app.use('*', secureHeaders());

// CORS
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = [
      'https://heirloom.blue',
      'https://www.heirloom.blue',
      'https://staging.heirloom.blue',
      'http://localhost:3000',
    ];
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/', (c) => {
  return c.json({
    name: 'Heirloom API',
    version: '1.0.0',
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
    edge: c.req.raw.cf?.colo || 'unknown',
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// API ROUTES
// ============================================

// Public routes (no auth required)
app.route('/api/auth', authRoutes);
app.route('/api/billing/webhook', billingRoutes);

// Protected routes (auth required)
const protectedApp = new Hono<{ Bindings: Env }>();

// JWT middleware for protected routes
protectedApp.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Verify JWT
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    
    // Check if session exists in KV
    const session = await c.env.KV.get(`session:${payload.sessionId}`);
    if (!session) {
      return c.json({ error: 'Session expired' }, 401);
    }
    
    // Add user to context
    c.set('user', payload);
    c.set('userId', payload.sub);
    
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// Mount protected routes
protectedApp.route('/family', familyRoutes);
protectedApp.route('/memories', memoriesRoutes);
protectedApp.route('/letters', lettersRoutes);
protectedApp.route('/voice', voiceRoutes);
protectedApp.route('/billing', billingRoutes);
protectedApp.route('/settings', settingsRoutes);
protectedApp.route('/deadman', deadmanRoutes);
protectedApp.route('/encryption', encryptionRoutes);
protectedApp.route('/wrapped', wrappedRoutes);

app.route('/api', protectedApp);

// Admin routes (separate auth)
app.route('/api/admin', adminRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.onError((err, c) => {
  console.error('Error:', err);
  
  if (err.message === 'Unauthorized') {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  return c.json({
    error: c.env.ENVIRONMENT === 'production' 
      ? 'Internal server error' 
      : err.message,
  }, 500);
});

app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// ============================================
// SCHEDULED HANDLERS (Cron)
// ============================================

export default {
  fetch: app.fetch,
  
  // Cron trigger for dead man's switch
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const cronType = event.cron;
    
    if (cronType === '0 9 * * *') {
      // Daily check for missed check-ins
      await checkMissedCheckIns(env);
    } else if (cronType === '0 0 * * 0') {
      // Weekly reminder emails
      await sendReminderEmails(env);
    }
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function verifyJWT(token: string, secret: string): Promise<any> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  
  const valid = await crypto.subtle.verify('HMAC', key, signature, data);
  
  if (!valid) {
    throw new Error('Invalid token');
  }
  
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
  
  // Check expiration
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error('Token expired');
  }
  
  return payload;
}

async function checkMissedCheckIns(env: Env) {
  const now = new Date().toISOString();
  
  // Find switches that need action
  const result = await env.DB.prepare(`
    SELECT dms.*, u.email, u.first_name
    FROM dead_man_switches dms
    JOIN users u ON dms.user_id = u.id
    WHERE dms.enabled = 1 
    AND dms.status = 'ACTIVE'
    AND dms.next_check_in_due < ?
  `).bind(now).all();
  
  for (const row of result.results) {
    // Increment missed check-ins
    const missed = (row.missed_check_ins as number) + 1;
    
    if (missed >= 3) {
      // Trigger the switch
      await env.DB.prepare(`
        UPDATE dead_man_switches 
        SET status = 'TRIGGERED', 
            triggered_at = ?,
            missed_check_ins = ?
        WHERE id = ?
      `).bind(now, missed, row.id).run();
      
      // Send notifications to legacy contacts
      await sendTriggerNotifications(env, row.user_id as string);
    } else {
      // Update missed count and send warning
      await env.DB.prepare(`
        UPDATE dead_man_switches 
        SET status = 'WARNING',
            missed_check_ins = ?
        WHERE id = ?
      `).bind(missed, row.id).run();
      
      // Send warning email to user
      await sendWarningEmail(env, row.email as string, row.first_name as string, missed);
    }
  }
}

async function sendReminderEmails(env: Env) {
  // Find users who need reminders
  const result = await env.DB.prepare(`
    SELECT dms.*, u.email, u.first_name
    FROM dead_man_switches dms
    JOIN users u ON dms.user_id = u.id
    WHERE dms.enabled = 1 
    AND dms.status = 'ACTIVE'
    AND date(dms.next_check_in_due) <= date('now', '+3 days')
  `).all();
  
  for (const row of result.results) {
    await sendReminderEmail(env, row.email as string, row.first_name as string);
  }
}

async function sendWarningEmail(env: Env, email: string, name: string, missedCount: number) {
  // Send via Resend
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Heirloom <noreply@heirloom.blue>',
      to: email,
      subject: `⚠️ Check-in Required - ${missedCount} missed`,
      html: `
        <h1>Hi ${name},</h1>
        <p>We noticed you've missed ${missedCount} check-in(s) on Heirloom.</p>
        <p>Please check in soon to confirm you're well.</p>
        <a href="${env.APP_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#c9a959;color:#050608;text-decoration:none;border-radius:8px;">
          Check In Now
        </a>
      `,
    }),
  });
}

async function sendReminderEmail(env: Env, email: string, name: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Heirloom <noreply@heirloom.blue>',
      to: email,
      subject: 'Friendly Reminder: Check-in Due Soon',
      html: `
        <h1>Hi ${name},</h1>
        <p>Just a friendly reminder that your Heirloom check-in is due in the next few days.</p>
        <a href="${env.APP_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#c9a959;color:#050608;text-decoration:none;border-radius:8px;">
          Check In Now
        </a>
      `,
    }),
  });
}

async function sendTriggerNotifications(env: Env, userId: string) {
  // Get legacy contacts
  const contacts = await env.DB.prepare(`
    SELECT * FROM legacy_contacts 
    WHERE user_id = ? AND verification_status = 'VERIFIED'
  `).bind(userId).all();
  
  // Send verification requests to each
  for (const contact of contacts.results) {
    const token = crypto.randomUUID();
    
    await env.DB.prepare(`
      INSERT INTO switch_verifications (dead_man_switch_id, legacy_contact_id, verification_token, expires_at)
      SELECT dms.id, ?, ?, datetime('now', '+7 days')
      FROM dead_man_switches dms WHERE dms.user_id = ?
    `).bind(contact.id, token, userId).run();
    
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Heirloom <noreply@heirloom.blue>',
        to: contact.email,
        subject: 'Heirloom: Verification Required',
        html: `
          <h1>Important Verification Request</h1>
          <p>A Heirloom user has named you as a trusted contact.</p>
          <p>We require verification before releasing their legacy content.</p>
          <a href="${env.APP_URL}/verify/${token}">Verify Now</a>
        `,
      }),
    });
  }
}

// ============================================
// RATE LIMITER DURABLE OBJECT
// ============================================

export class RateLimiter implements DurableObject {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private state: DurableObjectState) {}
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const ip = url.searchParams.get('ip') || 'unknown';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const window = parseInt(url.searchParams.get('window') || '60000'); // 1 minute
    
    const now = Date.now();
    const timestamps = this.requests.get(ip) || [];
    
    // Filter out old timestamps
    const validTimestamps = timestamps.filter(t => now - t < window);
    
    if (validTimestamps.length >= limit) {
      return new Response(JSON.stringify({ 
        allowed: false, 
        remaining: 0,
        reset: Math.ceil((validTimestamps[0] + window - now) / 1000)
      }), { status: 429 });
    }
    
    // Add new timestamp
    validTimestamps.push(now);
    this.requests.set(ip, validTimestamps);
    
    return new Response(JSON.stringify({ 
      allowed: true, 
      remaining: limit - validTimestamps.length,
      reset: Math.ceil(window / 1000)
    }));
  }
}
