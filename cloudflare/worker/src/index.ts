/**
 * Heirloom API - Cloudflare Workers
 * 
 * A globally distributed API running at the edge
 * with D1 (SQLite), R2 (storage), and KV (sessions)
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { requestLogger } from './utils/logger';
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
import { shareRoutes } from './routes/share';
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
import pushNotificationRoutes, { sendPushToUser } from './routes/push-notifications';
import { referralRoutes } from './routes/referrals';
import { influencerRoutes } from './routes/influencers';
import { partnerRoutes } from './routes/partners';
import { socialImportRoutes } from './routes/social-import';
import { exportRoutes } from './routes/export';
import { capsulesRoutes } from './routes/capsules';
import { giftsV2Routes, giftsV2ProtectedRoutes } from './routes/gifts-v2';
import { threadsRoutes } from './routes/threads';
import { engagementV2Routes } from './routes/engagement-v2';
import { loomIndexRoutes } from './routes/loom-index';
import { onThisDayRoutes } from './routes/on-this-day';
import { socialRoutes } from './routes/social';
import { processSocialQueue } from './crons/social-posting';
import { resolveTimeLocks } from './crons/time-locks';
import { processArchivePinning } from './crons/archive-pinning';
import { backfillMemoryDescriptionEncryption } from './crons/legacy-encryption-backfill';
import { processScheduledDeletions } from './crons/scheduled-deletion';
import { processScheduledGifts } from './crons/scheduled-gifts';
import { archiveRoutes } from './routes/archive';
import { bookOrderRoutes, bookOrderProtectedRoutes } from './routes/books';
import { syncOpenPrintJobs } from './services/book';
import { founderRoutes } from './routes/founders';
import { urgentCheckInEmail, checkInReminderEmail, deathVerificationRequestEmail, upcomingCheckInReminderEmail, postReminderMemoryEmail, postReminderVoiceEmail, postReminderLetterEmail, postReminderWeeklyDigestEmail } from './email-templates';
import { sendEmail } from './utils/email';
import { processDripCampaigns, startWelcomeCampaigns, processInactiveUsers, sendDateReminders, processStreakMaintenance, processInfluencerOutreach, sendContentPrompts, processProspectOutreach, sendVoucherFollowUps, discoverNewProspects, processInfluencerFollowUps, processAutomatedPayouts, discoverFromTikTok, discoverFromInstagram, enrichPlaceholderEmails } from './jobs/adoption-jobs';
import { processPushNotificationQueue, cleanupOldNotifications } from './services/pushSender';

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
  // Where the in-app support assistant escalates to a human (defaults to admin@heirloom.blue)
  SUPPORT_ESCALATION_EMAIL?: string;

  // APNs (iOS Push Notifications)
  APNS_TEAM_ID?: string;
  APNS_KEY_ID?: string;
  APNS_PRIVATE_KEY?: string;
  APNS_BUNDLE_ID?: string;
  
  // FCM (Android Push Notifications)
  FCM_PROJECT_ID?: string;
  FCM_PRIVATE_KEY?: string;
  FCM_CLIENT_EMAIL?: string;

  // VAPID (Web Push — browser/PWA). Public key also lives in the frontend build
  // as VITE_VAPID_PUBLIC_KEY; the two MUST match. Private key is a Worker secret.
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;

  // Admin first-login gate: must match body.setupToken when password_hash = CHANGE_ME_ON_FIRST_LOGIN
  ADMIN_SETUP_SECRET?: string;

  // Long-lived shared secret the autopost engine uses to upload the freshly
  // rendered weave image (POST /api/admin/social/upload-image) on its unattended
  // daily schedule, where an expiring admin session is impractical.
  SOCIAL_UPLOAD_TOKEN?: string;

  // Feature flags
  CRON_ENABLED?: string;
  
  // Social Posting Engine (Postiz)
  POSTIZ_URL?: string;
  POSTIZ_API_KEY?: string;
  
  // Social Media OAuth (for importing photos)
  FACEBOOK_CLIENT_ID?: string;
  FACEBOOK_CLIENT_SECRET?: string;
  INSTAGRAM_CLIENT_ID?: string;
  INSTAGRAM_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
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

// Logging — structured JSON for Cloudflare log aggregation
app.use('*', requestLogger());

// Security headers
// Disable CORP globally so we can set it per-route (file serving routes need 'cross-origin' for embedding)
app.use('*', secureHeaders({
  crossOriginResourcePolicy: false,
  xFrameOptions: 'DENY',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
  referrerPolicy: 'strict-origin-when-cross-origin',
  xContentTypeOptions: 'nosniff',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
  },
  contentSecurityPolicy: {
    defaultSrc: ["'none'"],
    frameAncestors: ["'none'"],
  },
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
    // [W5] Return null for disallowed origins so Hono's cors() middleware
    // omits the Access-Control-Allow-Origin header entirely, rather than
    // reflecting the first allowed origin — which would grant CORS to every
    // request regardless of whether the origin is in the allow-list.
    return allowedOrigins.includes(origin) ? origin : null;
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

// Public health check at /api/health (in addition to /health)
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    encrypted: !!c.env.ENCRYPTION_MASTER_KEY,
    timestamp: new Date().toISOString(),
  });
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
    console.error('Rate limiter DO error:', error);
    // Fail closed on limiter outage for sensitive endpoints
    if (c.req.url.includes('/api/auth/')) {
      return c.json({ error: 'Service temporarily unavailable' }, 503);
    }
    // Non-auth routes: fail open is acceptable
  }

  return next();
});

// Public routes (no auth required)
app.route('/api/auth', authRoutes);
app.route('/api/inherit', inheritRoutes);
// Public share surfaces (OG meta + SVG cards) — zero-budget viral reach.
app.route('/api/share', shareRoutes);
app.route('/api/gift-vouchers', giftVoucherRoutes);
app.route('/api/referral', referralRoutes);
app.route('/api/influencer', influencerRoutes);
app.route('/api/partner', partnerRoutes);
// PUBLIC R2 serving for generated marketing images. The autopost engine renders
// a distinct woven-cloth + saying PNG per post and uploads it under
// social-assets/; social platforms (Meta/Pinterest/Bluesky) fetch it by URL, so
// this must be unauthenticated. Scoped strictly to the social-assets/ prefix —
// no path traversal, no arbitrary R2 access.
app.get('/api/social-assets/*', async (c) => {
  const url = new URL(c.req.url);
  const rest = decodeURIComponent(url.pathname.replace(/^\/api\/social-assets\//, ''));
  if (!rest || rest.includes('..') || rest.startsWith('/')) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  const key = `social-assets/${rest}`;
  const object = await c.env.STORAGE.get(key);
  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }
  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'image/png');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  return new Response(object.body, { headers });
});
// PUBLIC R2 serving for Living Book PDFs — Lulu fetches interior/cover
// PDFs from here. No auth: access is gated by checking the requested key
// against book_orders.interior_pdf_key / cover_pdf_key (so only PDFs that
// belong to a real order are servable), and the key must be under books/.
// Registered before the /api/archive sub-app mount so it takes precedence.
app.get('/api/archive/r2/*', async (c) => {
  const url = new URL(c.req.url);
  const pathAfterR2 = url.pathname.split('/archive/r2/')[1];
  if (!pathAfterR2) {
    return c.json({ error: 'Invalid file key' }, 400);
  }

  const key = decodeURIComponent(pathAfterR2);

  if (!key.startsWith('books/')) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // Verify the key belongs to a real book order — prevents access to
  // arbitrary R2 paths under books/.
  const row = await c.env.DB.prepare(
    'SELECT id FROM book_orders WHERE interior_pdf_key = ? OR cover_pdf_key = ? LIMIT 1'
  ).bind(key, key).first();
  if (!row) {
    return c.json({ error: 'File not found' }, 404);
  }

  try {
    const object = await c.env.STORAGE.get(key);
    if (!object) {
      return c.json({ error: 'File not found' }, 404);
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

    return new Response(object.body, { headers });
  } catch (err: any) {
    console.error('Error serving book PDF from R2:', err);
    return c.json({ error: 'Failed to retrieve file' }, 500);
  }
});

// Public continuity audit — anyone can see pin status. THREAD.md Pillar 5.
app.route('/api/archive', archiveRoutes);
// Lulu Direct webhook (no auth — uses HMAC signature instead).
app.route('/api/book-orders', bookOrderRoutes);
// Founder pledge intake — public form, idempotent on email.
app.route('/api/founders', founderRoutes);

// HTML escape helper — prevents XSS when interpolating user input into email HTML
function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
            <p><strong>From:</strong> ${escHtml(body.name)} (${escHtml(body.email)})</p>
            <p><strong>Subject:</strong> ${escHtml(body.subject)}</p>
            <hr style="border: 1px solid #333;" />
            <h3>Message:</h3>
            <p style="white-space: pre-wrap;">${escHtml(body.message)}</p>
            <hr style="border: 1px solid #333;" />
            <p style="color: #666; font-size: 12px;">
              Reply directly to ${escHtml(body.email)} to respond.
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
// /api/billing/pricing is in PUBLIC_API_PREFIXES so it bypasses the JWT guard on protectedApp.
// /api/billing/detect is registered on the public app so it never needs the prefix.

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

// File serving routes — for <img>/<video> tags that cannot send Authorization headers.
// Security: key must exist in the memories/voice_recordings table (UUID-based keys prevent guessing).
// IMPORTANT: Must set Cross-Origin-Resource-Policy: cross-origin to allow embedding from heirloom.blue
app.get('/api/memories/file/*', async (c) => {
  // Require authentication — verify JWT so we can confirm the caller owns the file
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  let requestingUserId: string;
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    const session = await c.env.KV.get(`session:${payload.sessionId}`);
    if (!session) {
      return c.json({ error: 'Session expired' }, 401);
    }
    requestingUserId = payload.sub;
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const url = new URL(c.req.url);
  const pathAfterFile = url.pathname.split('/memories/file/')[1];
  if (!pathAfterFile) {
    return c.json({ error: 'Invalid file key' }, 400);
  }

  const key = decodeURIComponent(pathAfterFile);

  if (!key.startsWith('memories/')) {
    return c.json({ error: 'Invalid file key format' }, 400);
  }

  // Verify the key exists in the DB AND belongs to the requesting user
  const row = await c.env.DB.prepare(
    'SELECT id FROM memories WHERE file_key = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1'
  ).bind(key, requestingUserId).first();
  if (!row) {
    return c.json({ error: 'File not found' }, 404);
  }

  try {
    const object = await c.env.STORAGE.get(key);
    if (!object) {
      return c.json({ error: 'File not found' }, 404);
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

    return new Response(object.body, { headers });
  } catch (err: any) {
    console.error('Error serving file from R2:', err);
    return c.json({ error: 'Failed to retrieve file' }, 500);
  }
});

app.get('/api/voice/file/*', async (c) => {
  // Require authentication — verify JWT so we can confirm the caller owns the file
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  let requestingUserId: string;
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    const session = await c.env.KV.get(`session:${payload.sessionId}`);
    if (!session) {
      return c.json({ error: 'Session expired' }, 401);
    }
    requestingUserId = payload.sub;
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const url = new URL(c.req.url);
  const pathAfterFile = url.pathname.split('/voice/file/')[1];
  if (!pathAfterFile) {
    return c.json({ error: 'Invalid file key' }, 400);
  }

  const key = decodeURIComponent(pathAfterFile);

  if (!key.startsWith('voice/')) {
    return c.json({ error: 'Invalid file key format' }, 400);
  }

  // Verify the key exists in the DB AND belongs to the requesting user
  const voiceRow = await c.env.DB.prepare(
    'SELECT id FROM voice_recordings WHERE file_key = ? AND user_id = ? LIMIT 1'
  ).bind(key, requestingUserId).first();
  if (!voiceRow) {
    return c.json({ error: 'File not found' }, 404);
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
    headers.set('Accept-Ranges', 'bytes');
    
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

// Social admin routes (own admin auth middleware)
app.route('/api/admin/social', socialRoutes);

// Marketing routes (mix of public and admin-protected endpoints)
app.route('/api/marketing', marketingRoutes);

// Announcements routes (mix of public and admin-protected endpoints)
app.route('/api/announcements', announcementsRoutes);

// Engagement routes (mix of public and protected endpoints)
app.route('/api/engagement', engagementRoutes);

// Heirloom v2 public routes
app.route('/api/gifts', giftsV2Routes);
app.get('/api/public/stats', async (c) => {
  // Proxy to engagement-v2 public stats
  try {
    const memoriesCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM memories').first();
    const voicesCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM voice_recordings').first();
    const lettersCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM letters').first();
    const usersCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
    return c.json({
      memories_preserved: ((memoriesCount?.count as number) || 0) + ((voicesCount?.count as number) || 0) + ((lettersCount?.count as number) || 0),
      families_connected: (usersCount?.count as number) || 0,
    });
  } catch {
    return c.json({ memories_preserved: 0, families_connected: 0 });
  }
});

// Protected routes (auth required)
const protectedApp = new Hono<AppEnv>();

// Public paths that live under /api but are mounted on `app` directly.
// Because protectedApp is also mounted at /api as a sub-app, its
// `use('*', auth)` middleware would otherwise intercept these. We let
// them through here.
//
// We use the absolute URL pathname (not c.req.path, which inside a
// mounted sub-app is the *relative* path with the /api prefix stripped).
const PUBLIC_API_PREFIXES = [
  '/api/archive/',            // continuity audit (THREAD.md Pillar 5)
  '/api/founders/count',      // public pledge counter
  '/api/founders/pledge',     // public pledge intake
  '/api/founders/by-session', // public lookup post-Stripe-checkout
  '/api/book-orders/webhook', // Lulu webhook (HMAC verified)
  '/api/billing/webhook',     // Stripe webhook (HMAC verified inside handler)
  '/api/billing/pricing',     // pricing is public — unauthenticated visitors see plans
];

// JWT middleware for protected routes. Bypasses for paths in
// PUBLIC_API_PREFIXES so /api/archive, /api/founders/count etc. are
// reachable without an Authorization header — those routes live on the
// public `app` instance but Hono's middleware on the parent /api mount
// still intercepts them.
//
// Hono's c.req.path returns a path RELATIVE to the mount point inside a
// sub-app, so we check both the relative and the absolute URL pathname
// against every prefix variant.
protectedApp.use('*', async (c, next) => {
  const reqPath = c.req.path;
  const urlPath = (() => {
    try { return new URL(c.req.url).pathname; } catch { return reqPath; }
  })();
  const candidates = [reqPath, urlPath, `/api${reqPath}`].filter(Boolean);
  const isPublic = PUBLIC_API_PREFIXES.some((p) => {
    const variants = [p, p.replace(/\/$/, ''), p.replace(/^\/api/, '')];
    return candidates.some((path) =>
      variants.some((v) => v && (path === v || path.startsWith(v + '/') || path === v)),
    );
  });
  if (isPublic) {
    return next();
  }

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
protectedApp.route('/import', socialImportRoutes);
protectedApp.route('/export', exportRoutes);

// Heirloom v2 Protected Routes
protectedApp.route('/capsules', capsulesRoutes);
protectedApp.route('/engagement', engagementV2Routes);
protectedApp.route('/loom-index', loomIndexRoutes);
protectedApp.route('/on-this-day', onThisDayRoutes);
protectedApp.route('/gifts', giftsV2ProtectedRoutes);

// The Family Thread — world-first multi-generational archive primitive.
// See /THREAD.md and /cloudflare/migrations/0036_family_thread.sql.
protectedApp.route('/threads', threadsRoutes);
// Living Book ordering (mounts under /api so paths are /api/threads/:id/book
// and /api/book-orders/:id). Webhook is public, see app.route() above.
protectedApp.route('/', bookOrderProtectedRoutes);

app.route('/api', protectedApp);

// ============================================
// ERROR HANDLING
// ============================================

app.onError((err, c) => {
  console.error('Error:', err);
  
  if (err.message === 'Unauthorized') {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Malformed request body (c.req.json() on invalid JSON throws SyntaxError) is a
  // client error, not a server fault — answer 400 rather than 500.
  if (err instanceof SyntaxError || /JSON|Unexpected (token|end)/i.test(err.message)) {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const body: Record<string, string> = { error: 'Internal server error' };
  if (c.env.ENVIRONMENT === 'development') {
    body.debug = err.message;
  }
  return c.json(body, 500);
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
      
      console.log('Discovering new influencers from viral list...');
      const discoveryResult = await discoverNewProspects(env);
      console.log(`Influencers discovered: ${discoveryResult.added} added, ${discoveryResult.skipped} skipped`);

      // Real platform discovery — no-ops if API keys aren't configured.
      // See REGISTRATION.md for the manual setup runbook.
      console.log('Discovering creators on TikTok…');
      const tiktokResult = await discoverFromTikTok(env);
      console.log(`TikTok: ${tiktokResult.added} added, ${tiktokResult.skipped} skipped${tiktokResult.reason ? ` (${tiktokResult.reason})` : ''}`);

      console.log('Discovering creators on Instagram…');
      const igResult = await discoverFromInstagram(env);
      console.log(`Instagram: ${igResult.added} added, ${igResult.skipped} skipped${igResult.reason ? ` (${igResult.reason})` : ''}`);

      // Re-scan public bios of prospects we couldn't find an email for at
      // discovery time. Many creators add a contact email later as their
      // account grows; this upgrades placeholder rows to real addresses
      // before outreach fires.
      console.log('Enriching placeholder emails from public bios…');
      const enrichResult = await enrichPlaceholderEmails(env);
      console.log(`Bio enrichment: ${enrichResult.upgraded} upgraded, ${enrichResult.stillPlaceholder} still placeholder`);

      // Family-Thread time-lock resolution. Releases entries whose DATE,
      // AGE, or GENERATION conditions have matured. AUTHOR_DEATH and
      // RECIPIENT_EVENT locks have separate verification flows.
      console.log('Resolving Thread time-locks…');
      const lockResult = await resolveTimeLocks(env);
      console.log(`Time-locks resolved — date:${lockResult.resolvedDate} age:${lockResult.resolvedAge} gen:${lockResult.resolvedGeneration} notifications:${lockResult.notifications}`);
      
      console.log('Processing influencer outreach...');
      const influencerResult = await processInfluencerOutreach(env);
      console.log(`Influencer outreach sent: ${influencerResult.sent}`);
      
      console.log('Processing influencer follow-ups...');
      const followUpResult = await processInfluencerFollowUps(env);
      console.log(`Influencer follow-ups sent: ${followUpResult.sent}`);
      
      console.log('Processing prospect outreach with trial vouchers...');
      const prospectResult = await processProspectOutreach(env);
      console.log(`Prospect outreach sent: ${prospectResult.sent}, vouchers created: ${prospectResult.vouchersCreated}`);
      
      console.log('Sending voucher follow-ups...');
      const voucherFollowUpResult = await sendVoucherFollowUps(env);
      console.log(`Voucher follow-ups sent: ${voucherFollowUpResult.sent}`);
      
      console.log('Processing automated influencer payouts...');
      const payoutResult = await processAutomatedPayouts(env);
      console.log(`Payouts processed: ${payoutResult.processed}, total paid: $${(payoutResult.totalPaid / 100).toFixed(2)}`);
      
      // At-rest encryption backfill — seals any pre-existing plaintext memory
      // descriptions once ENCRYPTION_MASTER_KEY is set. No-op when the key is
      // absent or all rows are already encrypted; converges over a few runs.
      console.log('Backfilling memory-description encryption…');
      const encBackfill = await backfillMemoryDescriptionEncryption(env);
      console.log(`Encryption backfill — encrypted:${encBackfill.encrypted} remaining:${encBackfill.remaining}${encBackfill.skipped ? ` (${encBackfill.skipped})` : ''}`);

      // GDPR Art. 17 / POPIA §23 — execute 90-day scheduled account deletions
      console.log('Processing scheduled account deletions…');
      const delResult = await processScheduledDeletions(env);
      console.log(`Scheduled deletions — deleted:${delResult.deleted} errors:${delResult.errors}`);

      console.log('Processing scheduled gift deliveries…');
      const giftResult = await processScheduledGifts(env);
      console.log(`Scheduled gift deliveries — delivered:${giftResult.delivered} errors:${giftResult.errors}`);

      // Family member grace-window expiry — hard-delete members whose 7-day
      // window has closed. Associated content rows cascade via FK ON DELETE CASCADE.
      // This is what removes the thread from the cloth permanently.
      console.log('Purging expired soft-deleted family members…');
      try {
        const expired = await env.DB.prepare(`
          SELECT id FROM family_members
          WHERE deleted_at IS NOT NULL
            AND deleted_at <= datetime('now', '-7 days')
        `).all();
        const expiredIds = expired.results.map((r: any) => r.id);
        if (expiredIds.length > 0) {
          // One round-trip instead of N — cascades still fire per FK ON DELETE CASCADE.
          await env.DB.prepare(
            `DELETE FROM family_members WHERE id IN (${expiredIds.map(() => '?').join(',')})`
          ).bind(...expiredIds).run();
        }
        console.log(`Family member purge — removed:${expiredIds.length}`);
      } catch (e) {
        console.error('Family member purge error:', e);
      }

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

      // Family-Thread continuity guarantee: weekly snapshot pinning to IPFS
      // via Web3.Storage + Pinata. No-op for any provider whose token isn't
      // configured. See /THREAD.md Pillar 5.
      console.log('Pinning Thread snapshots to IPFS…');
      const pinResult = await processArchivePinning(env);
      console.log(`Archive pinning — pinned:${pinResult.pinned} failed:${pinResult.failed} verified:${pinResult.verified} verifyFailed:${pinResult.verifyFailed}`);

      // Lulu Direct backstop — sync open print jobs in case webhook is down.
      console.log('Syncing open Lulu print jobs…');
      const luluResult = await syncOpenPrintJobs(env);
      console.log(`Lulu sync: ${luluResult.updated} orders updated`);

      // Purge stale audit and reminder rows — prevent unbounded table growth
      await env.DB.batch([
        env.DB.prepare(`DELETE FROM marketing_audit_log WHERE created_at < datetime('now', '-90 days')`),
        env.DB.prepare(`DELETE FROM post_reminder_emails WHERE sent_at < datetime('now', '-365 days')`),
        env.DB.prepare(`DELETE FROM notifications WHERE created_at < datetime('now', '-180 days') AND (read = 1 OR read IS NULL)`),
      ]);
      console.log('Stale audit/reminder/notification rows purged.');

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
      
      // Cleanup old push notifications
      console.log('Cleaning up old push notifications...');
      const cleanedUp = await cleanupOldNotifications(env);
      console.log(`Old push notifications cleaned up: ${cleanedUp}`);
      
      console.log('Twice-daily jobs complete.');
      
    } else if (cronType === '*/5 * * * *') {
      // ========== EVERY 5 MINUTES - Push Notifications + Social Posting ==========
      console.log('Processing push notification queue...');
      const pushResult = await processPushNotificationQueue(env);
      console.log(`Push notifications - processed: ${pushResult.processed}, sent: ${pushResult.sent}, failed: ${pushResult.failed}, skipped: ${pushResult.skipped}`);
      
      // Social posting engine
      console.log('Processing social posting queue...');
      const socialResult = await processSocialQueue(env);
      console.log(`Social posts - processed: ${socialResult.processed}, published: ${socialResult.published}, failed: ${socialResult.failed}`);
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

  // Reject algorithm-confusion / tampered headers before verifying.
  const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
  if (header.alg !== 'HS256' || header.typ !== 'JWT') throw new Error('Invalid token header');

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
      // Prefer push notification if the user has active device tokens
      const hasPush = await env.DB.prepare(
        `SELECT 1 FROM device_tokens WHERE user_id = ? AND is_active = 1 LIMIT 1`
      ).bind(row.user_id).first();

      let sent = false;
      if (hasPush) {
        // Map reminder type to a push nudge
        const pushMessages: Record<string, { title: string; body: string }> = {
          memory: { title: 'Your thread is waiting', body: 'A moment worth keeping is still untold. Add it now.' },
          voice:  { title: 'Capture your voice', body: 'Record a memory in your own words — future generations will hear you.' },
          letter: { title: 'Write for the future', body: 'A sealed letter is the most personal gift you can give.' },
          weekly: { title: 'Your weekly thread', body: `${userName ? userName + ', your' : 'Your'} Heirloom thread is growing — add to it today.` },
        };
        const msg = pushMessages[reminderType] ?? pushMessages.weekly;
        const pushResult = await sendPushToUser(env, row.user_id as string, {
          title: msg.title,
          body:  msg.body,
          data:  { type: 'retention', route: '/memories' },
        });
        sent = pushResult.sentCount > 0;
      }

      if (!sent) {
        // Fall back to email
        const result = await sendEmail(env, {
          from: 'Heirloom <noreply@heirloom.blue>',
          to: email as string,
          subject: emailContent.subject,
          html: emailContent.html,
        }, `POST_REMINDER_${reminderType.toUpperCase()}`);
        sent = result.success;
      }

      if (sent) {
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
        (SELECT COALESCE(SUM(duration), 0) / 60 FROM voice_recordings) as voice_minutes
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
  private lastCleanup: number = 0;
  private readonly CLEANUP_INTERVAL = 60000; // Clean up every minute
  private readonly MAX_IPS = 10000; // Maximum IPs to track before forced cleanup
  
  constructor(private state: DurableObjectState) {}
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const ip = url.searchParams.get('ip') || 'unknown';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const window = parseInt(url.searchParams.get('window') || '60000'); // 1 minute
    
    const now = Date.now();
    
    // Periodic cleanup of stale entries to prevent memory leak
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL || this.requests.size > this.MAX_IPS) {
      this.cleanupStaleEntries(now, window);
      this.lastCleanup = now;
    }
    
    const timestamps = this.requests.get(ip) || [];
    
    // Filter out old timestamps
    const validTimestamps = timestamps.filter(t => now - t < window);
    
    if (validTimestamps.length >= limit) {
      // Update with filtered timestamps even on rejection
      if (validTimestamps.length > 0) {
        this.requests.set(ip, validTimestamps);
      } else {
        this.requests.delete(ip);
      }
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
  
  // Clean up entries with no valid timestamps
  private cleanupStaleEntries(now: number, window: number): void {
    const ipsToDelete: string[] = [];
    
    for (const [ip, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < window);
      if (validTimestamps.length === 0) {
        ipsToDelete.push(ip);
      } else {
        // Update with filtered timestamps
        this.requests.set(ip, validTimestamps);
      }
    }
    
    // Delete stale IPs
    for (const ip of ipsToDelete) {
      this.requests.delete(ip);
    }
  }
}
