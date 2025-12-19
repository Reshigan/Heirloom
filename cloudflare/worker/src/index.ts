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

// Routes - import from individual files (not routes/index.ts which has stubs)
import { authRoutes } from './routes/auth';
import { familyRoutes } from './routes/family';
import { memoriesRoutes } from './routes/memories';
import { lettersRoutes } from './routes/letters';
import { voiceRoutes } from './routes/voice';
import { billingRoutes } from './routes/billing';
import { deadmanRoutes } from './routes/deadman';
import { encryptionRoutes } from './routes/encryption';
import { settingsRoutes } from './routes/settings';
import { adminRoutes } from './routes/admin';
import { wrappedRoutes } from './routes/wrapped';
import { inheritRoutes } from './routes/inherit';
import { urgentCheckInEmail, checkInReminderEmail, deathVerificationRequestEmail } from './email-templates';

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
  
  // Cloudflare Workers AI
  AI: Ai;
  
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

// Test email endpoint
app.post('/api/test-email', async (c) => {
  const body = await c.req.json();
  const { email } = body;
  
  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }
  
  try {
    const { testEmail } = await import('./email-templates');
    const emailContent = testEmail();
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Heirloom <noreply@heirloom.blue>',
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: 'Failed to send email', details: error }, 500);
    }
    
    return c.json({ success: true, message: 'Test email sent successfully' });
  } catch (err: any) {
    return c.json({ error: 'Failed to send email', details: err.message }, 500);
  }
});

// ============================================
// API ROUTES
// ============================================

// Public health check at /api/health (in addition to /health)
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (no auth required)
app.route('/api/auth', authRoutes);
app.route('/api/billing/webhook', billingRoutes);
app.route('/api/inherit', inheritRoutes);

// Public billing routes (pricing and detect don't require auth)
app.get('/api/billing/pricing', async (c) => {
  // Import the billing logic inline to avoid circular dependencies
  const COUNTRY_CURRENCY: Record<string, string> = {
    ZA: 'ZAR', NG: 'NGN', KE: 'KES', GH: 'GHS', TZ: 'TZS', UG: 'UGX', 
    RW: 'RWF', ZW: 'USD', BW: 'BWP', NA: 'NAD', MZ: 'MZN', ZM: 'ZMW',
    GB: 'GBP',
    DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', 
    IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR', SK: 'EUR', SI: 'EUR', LT: 'EUR',
    LV: 'EUR', EE: 'EUR', CY: 'EUR', MT: 'EUR', LU: 'EUR',
    IN: 'INR', PK: 'PKR', BD: 'BDT', PH: 'PHP', ID: 'IDR', MY: 'MYR', 
    SG: 'SGD', TH: 'THB', VN: 'VND', JP: 'JPY', KR: 'KRW', CN: 'CNY', 
    HK: 'HKD', TW: 'TWD', AE: 'AED', SA: 'SAR',
    US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL', AR: 'ARS', CO: 'COP', CL: 'CLP', PE: 'PEN',
    AU: 'AUD', NZ: 'NZD',
  };

  const PRICING: Record<string, any> = {
    USD: { symbol: '$', code: 'USD', STARTER: { monthly: 1, yearly: 10 }, FAMILY: { monthly: 5, yearly: 50 }, FOREVER: { monthly: 15, yearly: 150 } },
    ZAR: { symbol: 'R', code: 'ZAR', STARTER: { monthly: 18, yearly: 180 }, FAMILY: { monthly: 90, yearly: 900 }, FOREVER: { monthly: 270, yearly: 2700 } },
    GBP: { symbol: '£', code: 'GBP', STARTER: { monthly: 0.79, yearly: 7.90 }, FAMILY: { monthly: 3.99, yearly: 39.90 }, FOREVER: { monthly: 11.99, yearly: 119.90 } },
    EUR: { symbol: '€', code: 'EUR', STARTER: { monthly: 0.99, yearly: 9.90 }, FAMILY: { monthly: 4.99, yearly: 49.90 }, FOREVER: { monthly: 14.99, yearly: 149.90 } },
    CAD: { symbol: 'C$', code: 'CAD', STARTER: { monthly: 1.39, yearly: 13.90 }, FAMILY: { monthly: 6.99, yearly: 69.90 }, FOREVER: { monthly: 20.99, yearly: 209.90 } },
    AUD: { symbol: 'A$', code: 'AUD', STARTER: { monthly: 1.49, yearly: 14.90 }, FAMILY: { monthly: 7.49, yearly: 74.90 }, FOREVER: { monthly: 22.49, yearly: 224.90 } },
    INR: { symbol: '₹', code: 'INR', STARTER: { monthly: 50, yearly: 500 }, FAMILY: { monthly: 250, yearly: 2500 }, FOREVER: { monthly: 750, yearly: 7500 } },
  };

  const cfCountry = c.req.raw?.cf?.country as string;
  const headerCountry = c.req.header('cf-ipcountry') || c.req.header('x-country');
  const country = cfCountry || headerCountry || 'US';
  
  const overrideCurrency = c.req.query('currency')?.toUpperCase();
  const detectedCurrency = COUNTRY_CURRENCY[country?.toUpperCase()] || 'USD';
  const currency = overrideCurrency && PRICING[overrideCurrency] ? overrideCurrency : (PRICING[detectedCurrency] ? detectedCurrency : 'USD');
  const prices = PRICING[currency];

  return c.json({
    country,
    currency,
    symbol: prices.symbol,
    tiers: [
      { id: 'STARTER', name: 'Starter', storage: '500 MB', monthly: { amount: prices.STARTER.monthly, display: `${prices.symbol}${prices.STARTER.monthly}` }, yearly: { amount: prices.STARTER.yearly, display: `${prices.symbol}${prices.STARTER.yearly}`, perMonth: `${prices.symbol}${(prices.STARTER.yearly / 12).toFixed(2)}` } },
      { id: 'FAMILY', name: 'Family', storage: '5 GB', popular: true, monthly: { amount: prices.FAMILY.monthly, display: `${prices.symbol}${prices.FAMILY.monthly}` }, yearly: { amount: prices.FAMILY.yearly, display: `${prices.symbol}${prices.FAMILY.yearly}`, perMonth: `${prices.symbol}${(prices.FAMILY.yearly / 12).toFixed(2)}` } },
      { id: 'FOREVER', name: 'Forever', storage: '50 GB', monthly: { amount: prices.FOREVER.monthly, display: `${prices.symbol}${prices.FOREVER.monthly}` }, yearly: { amount: prices.FOREVER.yearly, display: `${prices.symbol}${prices.FOREVER.yearly}`, perMonth: `${prices.symbol}${(prices.FOREVER.yearly / 12).toFixed(2)}` } },
    ],
    allFeatures: ['Unlimited memories', 'Unlimited letters', 'Unlimited voice recordings', 'Posthumous delivery', 'Dead man\'s switch', 'AI writing help', 'Year Wrapped', 'Family tree'],
    annualSavings: '2 months free',
  });
});

app.get('/api/billing/detect', async (c) => {
  const COUNTRY_CURRENCY: Record<string, string> = {
    ZA: 'ZAR', NG: 'NGN', KE: 'KES', GH: 'GHS', GB: 'GBP',
    DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
    IN: 'INR', US: 'USD', CA: 'CAD', AU: 'AUD',
  };
  const PRICING_SYMBOLS: Record<string, string> = {
    USD: '$', ZAR: 'R', GBP: '£', EUR: '€', CAD: 'C$', AUD: 'A$', INR: '₹',
  };

  const cfCountry = c.req.raw?.cf?.country as string;
  const headerCountry = c.req.header('cf-ipcountry') || c.req.header('x-country');
  const country = cfCountry || headerCountry || 'US';
  const currency = COUNTRY_CURRENCY[country?.toUpperCase()] || 'USD';
  const symbol = PRICING_SYMBOLS[currency] || '$';

  return c.json({ country, currency, symbol });
});

// Admin routes (separate auth - must be before protected routes)
app.route('/api/admin', adminRoutes);

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
  // Send via Resend with themed template
  const emailContent = urgentCheckInEmail(name, missedCount);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Heirloom <noreply@heirloom.blue>',
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Failed to send warning email to ${email}: ${response.status} - ${errorBody}`);
    }
  } catch (error) {
    console.error(`Error sending warning email to ${email}:`, error);
  }
}

async function sendReminderEmail(env: Env, email: string, name: string) {
  // Send via Resend with themed template
  const emailContent = checkInReminderEmail(name, 3);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Heirloom <noreply@heirloom.blue>',
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Failed to send reminder email to ${email}: ${response.status} - ${errorBody}`);
    }
  } catch (error) {
    console.error(`Error sending reminder email to ${email}:`, error);
  }
}

async function sendTriggerNotifications(env: Env, userId: string) {
  // Get legacy contacts and user info
  const contacts = await env.DB.prepare(`
    SELECT lc.*, u.first_name as user_name
    FROM legacy_contacts lc
    JOIN users u ON lc.user_id = u.id
    WHERE lc.user_id = ? AND lc.verification_status = 'VERIFIED'
  `).bind(userId).all();
  
  // Send verification requests to each
  for (const contact of contacts.results) {
    const token = crypto.randomUUID();
    
    await env.DB.prepare(`
      INSERT INTO switch_verifications (dead_man_switch_id, legacy_contact_id, verification_token, expires_at)
      SELECT dms.id, ?, ?, datetime('now', '+7 days')
      FROM dead_man_switches dms WHERE dms.user_id = ?
    `).bind(contact.id, token, userId).run();
    
    // Send via Resend with themed template
    const emailContent = deathVerificationRequestEmail(
      contact.name as string,
      contact.user_name as string,
      token
    );
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Heirloom <noreply@heirloom.blue>',
          to: contact.email,
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Failed to send verification email to ${contact.email}: ${response.status} - ${errorBody}`);
      }
    } catch (error) {
      console.error(`Error sending verification email to ${contact.email}:`, error);
    }
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
