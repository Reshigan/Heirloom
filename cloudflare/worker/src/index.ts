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
import { aiRoutes, generateAndCachePrompts } from './routes/ai';
import { giftVoucherRoutes } from './routes/gift-vouchers';
import { supportRoutes } from './routes/support';
import { legacyPlanRoutes } from './routes/legacy-plan';
import { recipientExperienceRoutes } from './routes/recipient-experience';
import { storyArtifactsRoutes } from './routes/story-artifacts';
import { lifeEventsRoutes } from './routes/life-events';
import marketingRoutes from './routes/marketing';
import { announcementsRoutes } from './routes/announcements';
import engagementRoutes from './routes/engagement';
import { streaksRoutes, challengesRoutes, referralsRoutes, giftRoutes, memorialRoutes, milestonesRoutes, notificationsRoutes } from './routes/q4-features';
import memoryCardsRoutes from './routes/memory-cards';
import pushNotificationRoutes from './routes/push-notifications';
import { urgentCheckInEmail, checkInReminderEmail, deathVerificationRequestEmail, upcomingCheckInReminderEmail, postReminderMemoryEmail, postReminderVoiceEmail, postReminderLetterEmail, postReminderWeeklyDigestEmail } from './email-templates';
import { sendEmail } from './utils/email';
import { processDripCampaigns, startWelcomeCampaigns, processInactiveUsers, sendDateReminders, processStreakMaintenance, processInfluencerOutreach, sendContentPrompts, processProspectOutreach, sendVoucherFollowUps, discoverNewProspects } from './jobs/adoption-jobs';

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
  
  // Microsoft 365 / Azure AD (for email sending via Graph API)
  MS_TENANT_ID?: string;
  MS_CLIENT_ID?: string;
  MS_CLIENT_SECRET?: string;
  MS_DEFAULT_SENDER?: string; // Default sender mailbox (e.g., admin@heirloom.blue)
  
  // Admin notifications
  ADMIN_NOTIFICATION_EMAIL?: string;
  
  // Feature flags
  CRON_ENABLED?: string;
}

// Variables type for Hono context (set by middleware)
export interface Variables {
  user?: {
    sub: string;
    sessionId: string;
    iat: number;
    exp: number;
  };
  userId?: string;
  adminId?: string;
  adminRole?: string;
  // Used by inherit routes for recipient portal
  ownerId?: string;
  legacyContactId?: string;
}

// Shared app type for routes
export type AppEnv = { Bindings: Env; Variables: Variables };

// Create Hono app with typed env and variables
const app = new Hono<AppEnv>();

// ============================================
// MIDDLEWARE
// ============================================

// Logging
app.use('*', logger());

// Security headers
// Disable CORP globally so we can set it per-route (file serving routes need 'cross-origin' for embedding)
app.use('*', secureHeaders({
  crossOriginResourcePolicy: false,
}));

// CORS - localhost only allowed in development
app.use('*', cors({
  origin: (origin, c) => {
    const isDev = c.env.ENVIRONMENT === 'development';
    const allowedOrigins = [
      'https://heirloom.blue',
      'https://www.heirloom.blue',
      'https://staging.heirloom.blue',
      ...(isDev ? ['http://localhost:3000'] : []),
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
    const { sendEmail } = await import('./utils/email');
    const emailContent = testEmail();
    
    const result = await sendEmail(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
    
    if (!result.success) {
      return c.json({ error: 'Failed to send email', details: result.error }, 500);
    }
    
    return c.json({ success: true, message: 'Test email sent successfully' });
  } catch (err: any) {
    return c.json({ error: 'Failed to send email', details: err.message }, 500);
  }
});

// Test post reminder email endpoint
app.post('/api/test-post-reminder', async (c) => {
  try {
    const body = await c.req.json();
    const { email, type } = body;
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    const reminderType = type || 'weekly';
    if (!['memory', 'voice', 'letter', 'weekly'].includes(reminderType)) {
      return c.json({ error: 'Invalid type. Must be: memory, voice, letter, or weekly' }, 400);
    }
    
    const result = await sendSinglePostReminderEmail(c.env, email, reminderType as 'memory' | 'voice' | 'letter' | 'weekly');
    
    if (result.success) {
      return c.json(result);
    } else {
      return c.json(result, 500);
    }
  } catch (err: any) {
    console.error('Error in test-post-reminder:', err);
    return c.json({ error: 'Failed to send post reminder', details: err.message }, 500);
  }
});

// ============================================
// API ROUTES
// ============================================

// Public health check at /api/health (in addition to /health)
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// RATE LIMITING MIDDLEWARE
// ============================================

// Rate limiting for brute-forceable auth endpoints
// Protects: login, register, forgot-password, reset-password, verify-2fa
// Does NOT rate limit: refresh, logout, me (high-frequency or non-brute-forceable)
const rateLimitedAuthPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-2fa'];

app.use('/api/auth/*', async (c, next) => {
  const path = c.req.path.replace('/api/auth', '');
  
  // Only rate limit brute-forceable endpoints
  if (!rateLimitedAuthPaths.includes(path)) {
    return next();
  }
  
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  
  try {
    const id = c.env.RATE_LIMITER.idFromName(ip);
    const limiter = c.env.RATE_LIMITER.get(id);
    
    // 10 requests per minute for auth endpoints
    const response = await limiter.fetch(
      new Request(`http://internal/check?ip=${ip}&limit=10&window=60000`)
    );
    const result = await response.json() as { allowed: boolean; remaining: number; reset: number };
    
    if (!result.allowed) {
      return c.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(result.reset) } }
      );
    }
  } catch (error) {
    // If rate limiter fails, allow the request (fail open)
    console.error('Rate limiter error:', error);
  }
  
  return next();
});

// Public routes (no auth required)
app.route('/api/auth', authRoutes);
app.route('/api/billing/webhook', billingRoutes);
app.route('/api/inherit', inheritRoutes);
app.route('/api/gift-vouchers', giftVoucherRoutes);

// Public contact form endpoint (rate limited to prevent abuse)
app.post('/api/contact', async (c) => {
  // Rate limit: 5 requests per IP per hour
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  try {
    const id = c.env.RATE_LIMITER.idFromName(`contact:${ip}`);
    const limiter = c.env.RATE_LIMITER.get(id);
    const response = await limiter.fetch(
      new Request(`http://internal/check?ip=${ip}&limit=5&window=3600000`)
    );
    const result = await response.json() as { allowed: boolean };
    if (!result.allowed) {
      return c.json({ error: 'Too many requests. Please try again later.' }, 429);
    }
  } catch (error) {
    console.error('Rate limiter error:', error);
  }

  const body = await c.req.json();
  const now = new Date().toISOString();
  
  // Validate required fields
  if (!body.name || !body.email || !body.subject || !body.message) {
    return c.json({ error: 'All fields are required' }, 400);
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return c.json({ error: 'Invalid email address' }, 400);
  }

  const ticketId = crypto.randomUUID();
  const ticketNumber = `HLM-${Date.now().toString(36).toUpperCase()}`;
  
  // Store ticket in database (optional - may fail if table doesn't exist)
  try {
    await c.env.DB.prepare(`
      INSERT INTO support_tickets (id, ticket_number, user_id, subject, category, description, status, created_at, updated_at)
      VALUES (?, ?, NULL, ?, ?, ?, 'OPEN', ?, ?)
    `).bind(ticketId, ticketNumber, body.subject, body.category || 'general', body.message, now, now).run();
  } catch (dbError) {
    console.error('Failed to store contact form in database:', dbError);
  }
  
  // Use dynamic import for sendEmail to ensure we get the correct module
  const { sendEmail: sendEmailUtil } = await import('./utils/email');
  
  // Track email results for debugging
  let adminEmailResult: { success: boolean; error?: string } = { success: false, error: 'ADMIN_NOTIFICATION_EMAIL not configured' };
  let userEmailResult: { success: boolean; error?: string } = { success: false, error: 'Not attempted' };
  
  // Send notification email to admin (no fallback - require proper configuration)
  const adminEmail = c.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.error('ADMIN_NOTIFICATION_EMAIL not configured');
  } else {
    try {
      const adminResult = await sendEmailUtil(c.env, {
        from: 'Heirloom <noreply@heirloom.blue>',
        to: adminEmail,
        subject: `[${ticketNumber}] Contact Form: ${body.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #D4AF37;">New Contact Form Submission</h2>
            <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
            <p><strong>From:</strong> ${body.name} (${body.email})</p>
            <p><strong>Subject:</strong> ${body.subject}</p>
            <hr style="border: 1px solid #333;" />
            <h3>Message:</h3>
            <p style="white-space: pre-wrap;">${body.message}</p>
            <hr style="border: 1px solid #333;" />
            <p style="color: #666; font-size: 12px;">
              Reply directly to ${body.email} to respond.
            </p>
          </div>
        `,
        replyTo: body.email,
      }, 'CONTACT_FORM_ADMIN');
      adminEmailResult = adminResult;
      if (!adminResult.success) {
        console.error('Failed to send admin notification email:', adminResult.error);
      }
    } catch (err: any) {
      adminEmailResult = { success: false, error: `Exception: ${err.message}` };
      console.error('Exception sending admin email:', err);
    }
  }
  
  // Send confirmation email to user
  try {
    const userResult = await sendEmailUtil(c.env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: body.email,
      subject: `[${ticketNumber}] We received your message`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #f5f5f0; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px; color: #D4AF37;">&infin;</span>
            <h1 style="color: #D4AF37; margin: 8px 0;">Heirloom</h1>
          </div>
          <h2>Thank you for reaching out</h2>
          <p>Hi ${body.name},</p>
          <p>We've received your message and will get back to you within 24-48 hours.</p>
          <div style="background: #1a1a2e; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p><strong>Reference:</strong> ${ticketNumber}</p>
            <p><strong>Subject:</strong> ${body.subject}</p>
          </div>
          <p style="color: #888; font-size: 12px; margin-top: 32px;">
            - The Heirloom Team
          </p>
        </div>
      `,
    }, 'CONTACT_FORM_CONFIRMATION');
    userEmailResult = userResult;
    if (!userResult.success) {
      console.error('Failed to send user confirmation email:', userResult.error);
    }
  } catch (err: any) {
    userEmailResult = { success: false, error: `Exception: ${err.message}` };
    console.error('Exception sending user email:', err);
  }
  
  return c.json({ 
    success: true, 
    ticketNumber,
    message: 'Message sent successfully',
    emailStatus: {
      adminEmail: adminEmailResult,
      userEmail: userEmailResult
    }
  }, 201);
});

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

// Public file serving routes (for <img> and <video> tags that can't send auth headers)
// These files are stored with unguessable keys (memories/{userId}/{timestamp}-{filename})
// IMPORTANT: Must set Cross-Origin-Resource-Policy: cross-origin to allow embedding from heirloom.blue
app.get('/api/memories/file/*', async (c) => {
  const url = new URL(c.req.url);
  const pathAfterFile = url.pathname.split('/memories/file/')[1];
  if (!pathAfterFile) {
    return c.json({ error: 'Invalid file key' }, 400);
  }

  const key = decodeURIComponent(pathAfterFile);

  // Validate key format (must be memories/{userId}/{filename})
  if (!key.startsWith('memories/')) {
    return c.json({ error: 'Invalid file key format' }, 400);
  }

  try {
    const object = await c.env.STORAGE.get(key);
    if (!object) {
      return c.json({ error: 'File not found' }, 404);
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000');
    // Allow cross-origin embedding (images served from api.heirloom.blue, embedded in heirloom.blue)
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

    return new Response(object.body, { headers });
  } catch (err: any) {
    console.error('Error serving file from R2:', err);
    return c.json({ error: 'Failed to retrieve file' }, 500);
  }
});

app.get('/api/voice/file/*', async (c) => {
  const url = new URL(c.req.url);
  const pathAfterFile = url.pathname.split('/voice/file/')[1];
  if (!pathAfterFile) {
    return c.json({ error: 'Invalid file key' }, 400);
  }

  const key = decodeURIComponent(pathAfterFile);

  // Validate key format (must be voice/{userId}/{filename})
  if (!key.startsWith('voice/')) {
    return c.json({ error: 'Invalid file key format' }, 400);
  }

  try {
    // Check for Range header (browsers send this for media playback)
    const rangeHeader = c.req.header('Range');
    
    // Get file metadata first to know the size
    const headObject = await c.env.STORAGE.head(key);
    if (!headObject) {
      return c.json({ error: 'File not found' }, 404);
    }
    
    const fileSize = headObject.size;
    
    // Determine Content-Type: override if stored type is missing or not audio/*
    let contentType = headObject.httpMetadata?.contentType;
    if (!contentType || !contentType.startsWith('audio/')) {
      // Infer from file extension
      if (key.endsWith('.mp3')) {
        contentType = 'audio/mpeg';
      } else if (key.endsWith('.webm')) {
        contentType = 'audio/webm';
      } else if (key.endsWith('.mp4') || key.endsWith('.m4a')) {
        contentType = 'audio/mp4';
      } else if (key.endsWith('.wav')) {
        contentType = 'audio/wav';
      } else if (key.endsWith('.ogg')) {
        contentType = 'audio/ogg';
      } else {
        // Default to audio/mpeg (MP3) for universal playback
        contentType = 'audio/mpeg';
      }
    }
    
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Accept-Ranges', 'bytes');
    // Debug header to confirm this handler is serving the file
    headers.set('X-Heirloom-Voice-Handler', 'public-index-v2');
    
    // Handle Range requests for proper media streaming
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
        
        // Validate range
        if (start >= fileSize || end >= fileSize || start > end) {
          return new Response('Range Not Satisfiable', {
            status: 416,
            headers: { 'Content-Range': `bytes */${fileSize}` }
          });
        }
        
        // Get the requested range from R2
        const object = await c.env.STORAGE.get(key, {
          range: { offset: start, length: end - start + 1 }
        });
        
        if (!object) {
          return c.json({ error: 'File not found' }, 404);
        }
        
        headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        headers.set('Content-Length', String(end - start + 1));
        
        return new Response(object.body, { status: 206, headers });
      }
    }
    
    // Full file request (no Range header)
    const object = await c.env.STORAGE.get(key);
    if (!object) {
      return c.json({ error: 'File not found' }, 404);
    }
    
    headers.set('Content-Length', String(fileSize));
    return new Response(object.body, { headers });
  } catch (err: any) {
    console.error('Error serving file from R2:', err);
    return c.json({ error: 'Failed to retrieve file' }, 500);
  }
});

// Admin routes (separate auth - must be before protected routes)
app.route('/api/admin', adminRoutes);

// Marketing routes (mix of public and admin-protected endpoints)
app.route('/api/marketing', marketingRoutes);

// Announcements routes (mix of public and admin-protected endpoints)
app.route('/api/announcements', announcementsRoutes);

// Engagement routes (mix of public and protected endpoints)
app.route('/api/engagement', engagementRoutes);

// Protected routes (auth required)
const protectedApp = new Hono<AppEnv>();

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
protectedApp.route('/ai', aiRoutes);
protectedApp.route('/support', supportRoutes);
protectedApp.route('/legacy-plan', legacyPlanRoutes);
protectedApp.route('/recipient-experience', recipientExperienceRoutes);
protectedApp.route('/story-artifacts', storyArtifactsRoutes);
protectedApp.route('/life-events', lifeEventsRoutes);

// Q4 2025 Features
protectedApp.route('/streaks', streaksRoutes);
protectedApp.route('/challenges', challengesRoutes);
protectedApp.route('/referrals', referralsRoutes);
protectedApp.route('/gifts', giftRoutes);
protectedApp.route('/memorials', memorialRoutes);
protectedApp.route('/milestones', milestonesRoutes);
protectedApp.route('/notifications', notificationsRoutes);
protectedApp.route('/memory-cards', memoryCardsRoutes);
protectedApp.route('/push', pushNotificationRoutes);

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
  
  // Cron trigger for dead man's switch and adoption engine
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Safety guard: only run cron jobs if explicitly enabled
    if (env.CRON_ENABLED !== 'true') {
      console.error('Cron job triggered but CRON_ENABLED is not set to "true". Skipping execution.');
      return;
    }
    
    const cronType = event.cron;
    
    if (cronType === '0 9 * * *') {
      // ========== DAILY JOBS (9 AM UTC) ==========
      console.log('Running daily jobs...');
      
      // Dead Man's Switch jobs
      await checkMissedCheckIns(env);
      await sendUpcomingCheckInReminders(env);
      await sendDailyAdminSummary(env);
      
      // Adoption Engine jobs
      console.log('Processing drip campaigns...');
      const dripResult = await processDripCampaigns(env);
      console.log(`Drip campaigns processed: ${dripResult.processed}`);
      
      console.log('Starting welcome campaigns for new users...');
      const welcomeResult = await startWelcomeCampaigns(env);
      console.log(`Welcome campaigns started: ${welcomeResult.started}`);
      
      console.log('Processing inactive user re-engagement...');
      const inactiveResult = await processInactiveUsers(env);
      console.log(`Inactive user campaigns started: ${inactiveResult.started}`);
      
      console.log('Sending date reminders (birthdays, anniversaries)...');
      const dateResult = await sendDateReminders(env);
      console.log(`Date reminders processed: ${dateResult.processed}`);
      
      console.log('Processing streak maintenance...');
      const streakResult = await processStreakMaintenance(env);
      console.log(`Streaks reset: ${streakResult.reset}`);
      
      console.log('Processing influencer outreach...');
      const influencerResult = await processInfluencerOutreach(env);
      console.log(`Influencer outreach sent: ${influencerResult.sent}`);
      
      console.log('Processing prospect outreach with trial vouchers...');
      const prospectResult = await processProspectOutreach(env);
      console.log(`Prospect outreach sent: ${prospectResult.sent}, vouchers created: ${prospectResult.vouchersCreated}`);
      
      console.log('Sending voucher follow-ups...');
      const voucherFollowUpResult = await sendVoucherFollowUps(env);
      console.log(`Voucher follow-ups sent: ${voucherFollowUpResult.sent}`);
      
      console.log('Daily jobs complete.');
      
    } else if (cronType === '0 0 * * 0' || cronType === '0 0 * * SUN') {
      // ========== WEEKLY JOBS (Sunday midnight UTC) ==========
      console.log('Running weekly jobs...');
      
      // Dead Man's Switch weekly reminders
      await sendReminderEmails(env);
      
      // Weekly engagement nudges
      await sendPostReminderEmails(env);
      
      // Weekly content prompts for active users
      console.log('Sending weekly content prompts...');
      const promptResult = await sendContentPrompts(env);
      console.log(`Content prompts sent: ${promptResult.sent}`);
      
      // Discover new prospects from curated list
      console.log('Discovering new prospects...');
      const discoveryResult = await discoverNewProspects(env);
      console.log(`Prospects discovered: ${discoveryResult.added} added, ${discoveryResult.skipped} skipped`);
      
      console.log('Weekly jobs complete.');
      
    } else if (cronType === '0 */12 * * *') {
      // ========== TWICE DAILY JOBS (every 12 hours) ==========
      console.log('Running twice-daily jobs...');
      
      // Regenerate AI prompts cache
      console.log('Regenerating AI prompts cache...');
      await generateAndCachePrompts(env, 50);
      console.log('AI prompts cache regenerated');
      
      // Process any pending drip campaigns (catch-up for missed daily run)
      console.log('Processing drip campaigns (catch-up)...');
      const dripResult = await processDripCampaigns(env);
      console.log(`Drip campaigns processed: ${dripResult.processed}`);
      
      console.log('Twice-daily jobs complete.');
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
  const emailContent = urgentCheckInEmail(name, missedCount);
  try {
    await sendEmail(env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    }, 'URGENT_CHECKIN_WARNING');
  } catch (error) {
    console.error(`Error sending warning email to ${email}:`, error);
  }
}

async function sendReminderEmail(env: Env, email: string, name: string) {
  const emailContent = checkInReminderEmail(name, 3);
  try {
    await sendEmail(env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    }, 'CHECKIN_REMINDER');
  } catch (error) {
    console.error(`Error sending reminder email to ${email}:`, error);
  }
}

async function sendUpcomingCheckInReminders(env: Env) {
  // Find users with check-ins due in the next 24 hours who haven't been reminded yet
  const result = await env.DB.prepare(`
    SELECT dms.*, u.email, u.first_name
    FROM dead_man_switches dms
    JOIN users u ON dms.user_id = u.id
    WHERE dms.enabled = 1 
    AND dms.status = 'ACTIVE'
    AND datetime(dms.next_check_in_due) <= datetime('now', '+24 hours')
    AND datetime(dms.next_check_in_due) > datetime('now')
    AND (dms.reminder_sent_at IS NULL OR datetime(dms.reminder_sent_at) < datetime('now', '-20 hours'))
  `).all();
  
  for (const row of result.results) {
    // Calculate hours until due
    const dueDate = new Date(row.next_check_in_due as string);
    const hoursUntil = Math.max(1, Math.round((dueDate.getTime() - Date.now()) / (1000 * 60 * 60)));
    
    // Send reminder email
    const emailContent = upcomingCheckInReminderEmail(row.first_name as string, hoursUntil);
    try {
      const result = await sendEmail(env, {
        from: 'Heirloom <noreply@heirloom.blue>',
        to: row.email as string,
        subject: emailContent.subject,
        html: emailContent.html,
      }, 'UPCOMING_CHECKIN_REMINDER');
      
      if (result.success) {
        // Mark reminder as sent
        await env.DB.prepare(`
          UPDATE dead_man_switches SET reminder_sent_at = ? WHERE id = ?
        `).bind(new Date().toISOString(), row.id).run();
      }
    } catch (error) {
      console.error(`Error sending upcoming reminder to ${row.email}:`, error);
    }
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
      await sendEmail(env, {
        from: 'Heirloom <noreply@heirloom.blue>',
        to: contact.email as string,
        subject: emailContent.subject,
        html: emailContent.html,
      }, 'DEATH_VERIFICATION_REQUEST');
    } catch (error) {
      console.error(`Error sending verification email to ${contact.email}:`, error);
    }
  }
}

// ============================================
// POST REMINDER EMAILS (Engagement Nudges)
// ============================================

async function sendPostReminderEmails(env: Env) {
  // Find active users who haven't posted in a while (7+ days) or have never posted
  // Only send to users with verified emails and active subscriptions
  const result = await env.DB.prepare(`
    SELECT 
      u.id as user_id,
      u.email,
      u.first_name,
      u.created_at as user_created_at,
      (SELECT COUNT(*) FROM memories WHERE user_id = u.id) as memories_count,
      (SELECT MAX(created_at) FROM memories WHERE user_id = u.id) as last_memory_at,
      (SELECT COUNT(*) FROM voice_recordings WHERE user_id = u.id) as recordings_count,
      (SELECT COALESCE(SUM(duration), 0) FROM voice_recordings WHERE user_id = u.id) as total_voice_seconds,
      (SELECT COUNT(*) FROM letters WHERE user_id = u.id) as letters_count,
      (SELECT COUNT(*) FROM letters WHERE user_id = u.id AND sealed_at IS NOT NULL) as sealed_letters_count,
      (SELECT COUNT(*) FROM family_members WHERE user_id = u.id) as family_count
    FROM users u
    WHERE u.email_verified = 1
    AND (
      SELECT COUNT(*) FROM subscriptions s 
      WHERE s.user_id = u.id AND s.status IN ('ACTIVE', 'TRIALING')
    ) > 0
    AND u.id NOT IN (
      SELECT DISTINCT user_id FROM post_reminder_emails 
      WHERE sent_at > datetime('now', '-7 days')
    )
    LIMIT 50
  `).all();
  
  for (const row of result.results) {
    const userName = row.first_name as string;
    const email = row.email as string;
    const memoriesCount = row.memories_count as number;
    const recordingsCount = row.recordings_count as number;
    const lettersCount = row.letters_count as number;
    const familyCount = row.family_count as number;
    const totalVoiceMinutes = Math.round((row.total_voice_seconds as number) / 60);
    const hasSealedLetters = (row.sealed_letters_count as number) > 0;
    
    // Calculate days since last memory
    let daysSinceLastPost: number | null = null;
    if (row.last_memory_at) {
      const lastMemoryDate = new Date(row.last_memory_at as string);
      daysSinceLastPost = Math.floor((Date.now() - lastMemoryDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    // Determine which type of reminder to send based on user activity
    // Prioritize the area where user has least engagement
    let emailContent;
    let reminderType: 'memory' | 'voice' | 'letter' | 'weekly';
    
    if (memoriesCount === 0 && recordingsCount === 0 && lettersCount === 0) {
      // New user with no content - send weekly digest with memory focus
      emailContent = postReminderWeeklyDigestEmail(userName, {
        memoriesCount,
        voiceMinutes: totalVoiceMinutes,
        lettersCount,
        familyCount,
      }, 'memory');
      reminderType = 'weekly';
    } else if (recordingsCount === 0) {
      // No voice recordings - encourage voice
      emailContent = postReminderVoiceEmail(userName, recordingsCount, totalVoiceMinutes);
      reminderType = 'voice';
    } else if (lettersCount === 0) {
      // No letters - encourage writing
      emailContent = postReminderLetterEmail(userName, lettersCount, hasSealedLetters);
      reminderType = 'letter';
    } else if (daysSinceLastPost && daysSinceLastPost > 14) {
      // Haven't posted in 2+ weeks - encourage memories
      emailContent = postReminderMemoryEmail(userName, memoriesCount, daysSinceLastPost);
      reminderType = 'memory';
    } else {
      // Active user - send weekly digest
      const suggestedAction = memoriesCount <= recordingsCount && memoriesCount <= lettersCount ? 'memory' :
                              recordingsCount <= lettersCount ? 'voice' : 'letter';
      emailContent = postReminderWeeklyDigestEmail(userName, {
        memoriesCount,
        voiceMinutes: totalVoiceMinutes,
        lettersCount,
        familyCount,
      }, suggestedAction);
      reminderType = 'weekly';
    }
    
    try {
      const result = await sendEmail(env, {
        from: 'Heirloom <noreply@heirloom.blue>',
        to: email as string,
        subject: emailContent.subject,
        html: emailContent.html,
      }, `POST_REMINDER_${reminderType.toUpperCase()}`);
      
      if (result.success) {
        // Record that we sent a reminder to this user
        await env.DB.prepare(`
          INSERT INTO post_reminder_emails (user_id, reminder_type, sent_at)
          VALUES (?, ?, ?)
        `).bind(row.user_id, reminderType, new Date().toISOString()).run();
      }
    } catch (error) {
      console.error(`Error sending post reminder to ${email}:`, error);
    }
  }
}

// Send a single post reminder email to a specific user (for testing)
async function sendSinglePostReminderEmail(env: Env, email: string, reminderType: 'memory' | 'voice' | 'letter' | 'weekly') {
  // Get user stats
  const user = await env.DB.prepare(`
    SELECT 
      u.id as user_id,
      u.email,
      u.first_name,
      (SELECT COUNT(*) FROM memories WHERE user_id = u.id) as memories_count,
      (SELECT MAX(created_at) FROM memories WHERE user_id = u.id) as last_memory_at,
      (SELECT COUNT(*) FROM voice_recordings WHERE user_id = u.id) as recordings_count,
      (SELECT COALESCE(SUM(duration), 0) FROM voice_recordings WHERE user_id = u.id) as total_voice_seconds,
      (SELECT COUNT(*) FROM letters WHERE user_id = u.id) as letters_count,
      (SELECT COUNT(*) FROM letters WHERE user_id = u.id AND sealed_at IS NOT NULL) as sealed_letters_count,
      (SELECT COUNT(*) FROM family_members WHERE user_id = u.id) as family_count
    FROM users u
    WHERE u.email = ?
  `).bind(email).first();
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  const userName = user.first_name as string;
  const memoriesCount = user.memories_count as number;
  const recordingsCount = user.recordings_count as number;
  const lettersCount = user.letters_count as number;
  const familyCount = user.family_count as number;
  const totalVoiceMinutes = Math.round((user.total_voice_seconds as number) / 60);
  const hasSealedLetters = (user.sealed_letters_count as number) > 0;
  
  let daysSinceLastPost: number | null = null;
  if (user.last_memory_at) {
    const lastMemoryDate = new Date(user.last_memory_at as string);
    daysSinceLastPost = Math.floor((Date.now() - lastMemoryDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  let emailContent;
  switch (reminderType) {
    case 'memory':
      emailContent = postReminderMemoryEmail(userName, memoriesCount, daysSinceLastPost);
      break;
    case 'voice':
      emailContent = postReminderVoiceEmail(userName, recordingsCount, totalVoiceMinutes);
      break;
    case 'letter':
      emailContent = postReminderLetterEmail(userName, lettersCount, hasSealedLetters);
      break;
    case 'weekly':
      const suggestedAction = memoriesCount <= recordingsCount && memoriesCount <= lettersCount ? 'memory' :
                              recordingsCount <= lettersCount ? 'voice' : 'letter';
      emailContent = postReminderWeeklyDigestEmail(userName, {
        memoriesCount,
        voiceMinutes: totalVoiceMinutes,
        lettersCount,
        familyCount,
      }, suggestedAction);
      break;
  }
  
  try {
    const result = await sendEmail(env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    }, `POST_REMINDER_${reminderType.toUpperCase()}`);
    
    if (result.success) {
      return { success: true, message: `${reminderType} reminder sent to ${email}` };
    } else {
      return { success: false, error: `Failed to send: ${result.error}` };
    }
  } catch (error) {
    return { success: false, error: `Error: ${error}` };
  }
}

// ============================================
// DAILY ADMIN SUMMARY EMAIL
// ============================================

async function sendDailyAdminSummary(env: Env) {
  const adminEmail = env.ADMIN_NOTIFICATION_EMAIL;
  const resendApiKey = env.RESEND_API_KEY;
  
  if (!adminEmail || !resendApiKey) {
    console.log('Admin email or Resend API key not configured, skipping daily summary');
    return;
  }
  
  try {
    // Get user stats
    const userStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN created_at > datetime('now', '-1 day') THEN 1 ELSE 0 END) as new_today,
        SUM(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) as new_week
      FROM users
    `).first();
    
    // Get subscription stats
    const subStats = await env.DB.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'TRIALING' THEN 1 END) as trialing
      FROM subscriptions
    `).first();
    
    // Get content stats
    const contentStats = await env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM memories) as memories,
        (SELECT COUNT(*) FROM letters) as letters,
        (SELECT COALESCE(SUM(duration_seconds), 0) / 60 FROM voice_recordings) as voice_minutes
    `).first();
    
    // Get support ticket stats
    const ticketStats = await env.DB.prepare(`
      SELECT 
        COUNT(CASE WHEN status IN ('OPEN', 'IN_PROGRESS') THEN 1 END) as open_tickets,
        COUNT(CASE WHEN created_at > datetime('now', '-1 day') THEN 1 END) as new_today
      FROM support_tickets
    `).first();
    
    const stats = {
      totalUsers: Number(userStats?.total) || 0,
      newUsersToday: Number(userStats?.new_today) || 0,
      newUsersWeek: Number(userStats?.new_week) || 0,
      activeSubscriptions: Number(subStats?.active) || 0,
      trialingUsers: Number(subStats?.trialing) || 0,
      totalMemories: Number(contentStats?.memories) || 0,
      totalLetters: Number(contentStats?.letters) || 0,
      totalVoiceMinutes: Number(contentStats?.voice_minutes) || 0,
      openTickets: Number(ticketStats?.open_tickets) || 0,
      newTicketsToday: Number(ticketStats?.new_today) || 0,
    };
    
    const { adminDailySummaryEmail } = await import('./email-templates');
    const { sendEmail } = await import('./utils/email');
    const date = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const emailContent = adminDailySummaryEmail(stats, date);
    
    const result = await sendEmail(env, {
      from: 'Heirloom <noreply@heirloom.blue>',
      to: adminEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });
    
    if (!result.success) {
      console.error('Failed to send daily admin summary:', result.error);
    } else {
      console.log('Daily admin summary sent successfully');
    }
  } catch (error) {
    console.error('Error sending daily admin summary:', error);
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
