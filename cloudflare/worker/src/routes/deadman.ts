/**
 * Dead Man's Switch Routes - Cloudflare Workers
 * Handles dead man's switch configuration and check-ins
 */

import { Hono } from 'hono';
import type { AppEnv, Env } from '../index';
import { createMemorialForUser } from './q4-features';
import { releaseAuthorDeathEntries } from '../index';

// Escape user-controlled text (an author's first name) before it lands in the
// server-rendered confirm pages below. The page bodies are otherwise static.
const esc = (s: string): string =>
  String(s).replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));

export const deadmanRoutes = new Hono<AppEnv>();

// ── Minimal on-brand HTML for the public verify-contact pages ────────────────
// Cream (#f2e6d0) on ground (#070d14), serif, no external assets, NO inline
// <script> (production CSP forbids inline JS — the confirm flow is a plain
// <form> POST that needs none). Used by the unauthenticated contact-verification
// handlers below.
const verifyContactPage = (heading: string, body: string): string => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Heirloom</title>
<style>
  html, body { margin: 0; padding: 0; background: #070d14; color: #f2e6d0; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 40px 20px; box-sizing: border-box; line-height: 1.7;
  }
  .panel { max-width: 480px; width: 100%; }
  .mark { font-size: 40px; color: #e0a062; line-height: 1; margin-bottom: 28px; }
  h1 { font-size: 28px; font-weight: 400; margin: 0 0 18px; letter-spacing: -0.01em; }
  p { font-size: 16px; color: rgba(242,230,208,0.72); margin: 14px 0; }
  form { margin: 32px 0 0; }
  button {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
    color: #070d14; background: #e0a062; border: 1px solid #e0a062;
    padding: 14px 28px; cursor: pointer;
  }
  .foot {
    font-family: 'Courier New', Courier, monospace;
    font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(242,230,208,0.44); margin-top: 40px;
  }
</style>
</head>
<body>
  <div class="panel">
    <div class="mark">&#8734;</div>
    <h1>${heading}</h1>
    ${body}
    <p class="foot">Heirloom &middot; heirloom.blue</p>
  </div>
</body>
</html>`;

// Get dead man's switch status
deadmanRoutes.get('/status', async (c) => {
  const userId = c.get('userId');
  
  const dms = await c.env.DB.prepare(`
    SELECT * FROM dead_man_switches WHERE user_id = ?
  `).bind(userId).first();
  
  if (!dms) {
    return c.json({
      configured: false,
      status: null,
      message: 'Dead Man\'s Switch not configured',
    });
  }
  
  // Calculate days until next check-in
  const lastCheckIn = dms.last_check_in ? new Date(dms.last_check_in as string) : new Date(dms.created_at as string);
  const intervalDays = dms.check_in_interval_days as number;
  const nextCheckIn = new Date(lastCheckIn.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysUntilDue = Math.ceil((nextCheckIn.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  // The DB stores status uppercase ('ACTIVE'/'CANCELLED'/'TRIGGERED'); the
  // frontend matches lowercase. Also derive 'warning' for an active switch that
  // is past due but not yet triggered, so the UI can surface the grace period.
  const rawStatus = ((dms.status as string) || '').toLowerCase();
  const calculatedStatus = rawStatus === 'active' && daysUntilDue < 0 ? 'warning' : rawStatus;

  return c.json({
    configured: true,
    id: dms.id,
    status: calculatedStatus,
    checkInIntervalDays: dms.check_in_interval_days,
    gracePeriodDays: dms.grace_period_days,
    lastCheckIn: dms.last_check_in,
    nextCheckInDue: nextCheckIn.toISOString(),
    daysUntilDue,
    missedCheckIns: dms.missed_check_ins,
    triggerAction: dms.trigger_action,
    notifyContacts: !!dms.notify_contacts,
    createdAt: dms.created_at,
    updatedAt: dms.updated_at,
  });
});

// Configure dead man's switch
deadmanRoutes.post('/configure', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { 
    checkInIntervalDays = 30, 
    gracePeriodDays = 7, 
    triggerAction = 'RELEASE_ALL',
    notifyContacts = true 
  } = body;
  
  if (checkInIntervalDays < 7 || checkInIntervalDays > 365) {
    return c.json({ error: 'Check-in interval must be between 7 and 365 days' }, 400);
  }
  
  if (gracePeriodDays < 1 || gracePeriodDays > 30) {
    return c.json({ error: 'Grace period must be between 1 and 30 days' }, 400);
  }
  
  const now = new Date().toISOString();
  // Compute when the next check-in falls due, measured from now. This MUST be
  // persisted: all three cron paths compare against next_check_in_due, and a
  // NULL never satisfies those comparisons (the switch could never trigger).
  const nextCheckInDue = new Date(Date.now() + checkInIntervalDays * 24 * 60 * 60 * 1000).toISOString();

  // Check if already exists
  const existing = await c.env.DB.prepare(`
    SELECT id FROM dead_man_switches WHERE user_id = ?
  `).bind(userId).first();

  if (existing) {
    await c.env.DB.prepare(`
      UPDATE dead_man_switches
      SET check_in_interval_days = ?,
          grace_period_days = ?,
          trigger_action = ?,
          notify_contacts = ?,
          status = 'ACTIVE',
          next_check_in_due = ?,
          updated_at = ?
      WHERE user_id = ?
    `).bind(checkInIntervalDays, gracePeriodDays, triggerAction, notifyContacts ? 1 : 0, nextCheckInDue, now, userId).run();
  } else {
    await c.env.DB.prepare(`
      INSERT INTO dead_man_switches (id, user_id, check_in_interval_days, grace_period_days, trigger_action, notify_contacts, status, last_check_in, next_check_in_due, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), userId, checkInIntervalDays, gracePeriodDays, triggerAction, notifyContacts ? 1 : 0, now, nextCheckInDue, now, now).run();
  }
  
  const dms = await c.env.DB.prepare(`
    SELECT * FROM dead_man_switches WHERE user_id = ?
  `).bind(userId).first();
  
  return c.json({
    success: true,
    id: dms?.id,
    status: dms?.status,
    checkInIntervalDays: dms?.check_in_interval_days,
    gracePeriodDays: dms?.grace_period_days,
    triggerAction: dms?.trigger_action,
    notifyContacts: !!dms?.notify_contacts,
    message: 'Dead Man\'s Switch configured successfully',
  });
});

// Check in (reset the timer)
deadmanRoutes.post('/checkin', async (c) => {
  const userId = c.get('userId');
  const now = new Date().toISOString();
  
  const dms = await c.env.DB.prepare(`
    SELECT * FROM dead_man_switches WHERE user_id = ?
  `).bind(userId).first();
  
  if (!dms) {
    return c.json({ error: 'Dead Man\'s Switch not configured' }, 404);
  }
  
  // Compute the next check-in due date from the configured interval and persist
  // it — the cron paths trigger off next_check_in_due, so a check-in must push
  // it forward (and a fresh config must seed it).
  const intervalDays = dms.check_in_interval_days as number;
  const nextCheckIn = new Date(new Date().getTime() + intervalDays * 24 * 60 * 60 * 1000);

  // Update last check-in, advance next due date, and reset missed count
  await c.env.DB.prepare(`
    UPDATE dead_man_switches
    SET last_check_in = ?, next_check_in_due = ?, missed_check_ins = 0, status = 'ACTIVE', updated_at = ?
    WHERE user_id = ?
  `).bind(now, nextCheckIn.toISOString(), now, userId).run();
  
  // Record check-in history. Both user_id and checked_in_at are NOT NULL in the
  // base schema (migration 0001); dead_man_switch_id/check_in_time were added by
  // 0006. All five must be supplied or the row violates a NOT NULL constraint.
  await c.env.DB.prepare(`
    INSERT INTO check_in_history (id, user_id, dead_man_switch_id, checked_in_at, check_in_time, method, created_at)
    VALUES (?, ?, ?, ?, ?, 'MANUAL', ?)
  `).bind(crypto.randomUUID(), userId, dms.id, now, now, now).run();

  return c.json({
    success: true,
    lastCheckIn: now,
    nextCheckInDue: nextCheckIn.toISOString(),
    daysUntilDue: intervalDays,
    message: 'Check-in recorded successfully',
  });
});

// Cancel/disable dead man's switch
deadmanRoutes.post('/cancel', async (c) => {
  const userId = c.get('userId');
  const now = new Date().toISOString();
  
  const dms = await c.env.DB.prepare(`
    SELECT id FROM dead_man_switches WHERE user_id = ?
  `).bind(userId).first();
  
  if (!dms) {
    return c.json({ error: 'Dead Man\'s Switch not configured' }, 404);
  }
  
  await c.env.DB.prepare(`
    UPDATE dead_man_switches SET status = 'CANCELLED', updated_at = ? WHERE user_id = ?
  `).bind(now, userId).run();
  
  return c.json({
    success: true,
    message: 'Dead Man\'s Switch disabled',
  });
});

// Get check-in history
deadmanRoutes.get('/history', async (c) => {
  const userId = c.get('userId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  const dms = await c.env.DB.prepare(`
    SELECT id FROM dead_man_switches WHERE user_id = ?
  `).bind(userId).first();
  
  if (!dms) {
    return c.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
  }
  
  const history = await c.env.DB.prepare(`
    SELECT * FROM check_in_history 
    WHERE dead_man_switch_id = ?
    ORDER BY check_in_time DESC
    LIMIT ? OFFSET ?
  `).bind(dms.id, limit, offset).all();
  
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM check_in_history WHERE dead_man_switch_id = ?
  `).bind(dms.id).first();
  
  return c.json({
    data: history.results.map((h: any) => ({
      id: h.id,
      checkInTime: h.check_in_time,
      method: h.method,
      ipAddress: h.ip_address,
      userAgent: h.user_agent,
    })),
    pagination: {
      page,
      limit,
      total: countResult?.count || 0,
      totalPages: Math.ceil((countResult?.count as number || 0) / limit),
    },
  });
});

// Disable dead man's switch (sets is_active = 0 / status = DISABLED)
deadmanRoutes.post('/disable', async (c) => {
  const userId = c.get('userId');
  const now = new Date().toISOString();

  const dms = await c.env.DB.prepare(`
    SELECT id FROM dead_man_switches WHERE user_id = ?
  `).bind(userId).first();

  if (!dms) {
    return c.json({ error: 'Dead Man\'s Switch not configured' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE dead_man_switches SET status = 'CANCELLED', updated_at = ? WHERE user_id = ?
  `).bind(now, userId).run();

  return c.json({ success: true });
});

// Public: a legacy contact lands here from the verification email link.
// Unauthenticated by design — keyed solely on the verification_token. Renders a
// minimal page with a plain POST form (no JS) so the contact can confirm the
// role, flipping verification_status to 'VERIFIED'.
deadmanRoutes.get('/verify-contact/:token', async (c) => {
  const token = c.req.param('token');

  const contact = await c.env.DB.prepare(`
    SELECT id, verification_status FROM legacy_contacts WHERE verification_token = ? AND deleted_at IS NULL
  `).bind(token).first<{ id: string; verification_status: string }>();

  if (!contact) {
    return c.html(
      verifyContactPage(
        'This link is no longer valid.',
        `<p>We couldn't find a verification request for this link. It may have expired,
         or the role may have been withdrawn. If you believe this is a mistake, ask the
         person who named you to send the invitation again.</p>`,
      ),
    );
  }

  if (contact.verification_status === 'VERIFIED') {
    return c.html(
      verifyContactPage(
        'Already confirmed.',
        `<p>You have already accepted this role. There is nothing more to do &mdash;
         what has been entrusted to you remains in your care.</p>`,
      ),
    );
  }

  // Interpolate only the path param into the form action, URL-encoded so it can
  // never break out of the attribute. Never any user-supplied body content.
  const action = `/api/deadman/verify-contact/${encodeURIComponent(token)}`;

  return c.html(
    verifyContactPage(
      'You’ve been entrusted.',
      `<p>Someone has named you a legacy contact on Heirloom &mdash; a family thread meant
       to outlast all of us. By confirming below, you accept that you will safeguard what
       has been left in your care.</p>
       <form method="POST" action="${action}">
         <button type="submit">Confirm &mdash; I will safeguard this</button>
       </form>`,
    ),
  );
});

// Public: the POST target of the verify-contact form. Marks the contact VERIFIED
// (unless already REJECTED) and confirms. Idempotent — a re-POST stays VERIFIED.
deadmanRoutes.post('/verify-contact/:token', async (c) => {
  const token = c.req.param('token');
  const now = new Date().toISOString();

  const contact = await c.env.DB.prepare(`
    SELECT id, verification_status FROM legacy_contacts WHERE verification_token = ? AND deleted_at IS NULL
  `).bind(token).first<{ id: string; verification_status: string }>();

  if (!contact) {
    return c.html(
      verifyContactPage(
        'This link is no longer valid.',
        `<p>We couldn't find a verification request for this link. It may have expired,
         or the role may have been withdrawn.</p>`,
      ),
    );
  }

  // Only promote to VERIFIED if not explicitly REJECTED. Re-POSTing a VERIFIED
  // row simply re-sets it to VERIFIED (idempotent).
  if (contact.verification_status !== 'REJECTED') {
    await c.env.DB.prepare(`
      UPDATE legacy_contacts SET verification_status = 'VERIFIED', updated_at = ? WHERE verification_token = ? AND deleted_at IS NULL
    `).bind(now, token).run();
  }

  return c.html(
    verifyContactPage(
      'Thank you.',
      `<p>You have confirmed your role. Should the day ever come, you will help carry
       this family's thread forward. Nothing more is required of you now.</p>
       <p>You may close this window.</p>`,
    ),
  );
});

// ── The HUMAN attestation gate ───────────────────────────────────────────────
// A one-time switch_verifications token is emailed ONLY to a VERIFIED legacy
// contact when the switch enters TRIGGERED. Possessing and submitting it IS that
// contact's active confirmation that the author has passed. This is the gate the
// missed-check-in timer deliberately does NOT satisfy on its own — so a
// living-but-disengaged author's sealed entries can't be opened by a clock.
//
// Two public surfaces share one release path:
//   • GET/POST /verify-passing/:token — the browser flow the trigger email links
//     to (server-rendered confirm page → form POST → result page).
//   • POST /verify/:token — JSON, for the SPA `verifyPassing` api method.

type PassingResult =
  | { ok: false; code: 404 | 410 | 409; message: string }
  | { ok: true; switchId: string; userId: string; triggerAction: string; releasedAt: string };

// Read-only lookup of a passing token — no mutation. Powers the GET confirm page.
async function lookupPassing(env: Env, token: string) {
  return env.DB.prepare(`
    SELECT sv.id AS sv_id, sv.expires_at,
           dms.id AS dms_id, dms.user_id, dms.status, dms.trigger_action,
           u.first_name AS user_name
    FROM switch_verifications sv
    JOIN dead_man_switches dms ON dms.id = sv.dead_man_switch_id
    JOIN users u ON u.id = dms.user_id
    WHERE sv.verification_token = ?
  `).bind(token).first<any>();
}

// Consume the token and release. Idempotent on an already-RELEASED switch.
// Single source of truth for both the JSON and the browser handlers.
async function consumeAndRelease(env: Env, token: string): Promise<PassingResult> {
  const sv = await lookupPassing(env, token);
  if (!sv) {
    return { ok: false, code: 404, message: 'Token not found or already used' };
  }
  if (new Date(sv.expires_at as string).getTime() < Date.now()) {
    return { ok: false, code: 410, message: 'This confirmation link has expired.' };
  }
  // The author checked in again / stood the switch down — refuse to release.
  if (sv.status === 'ACTIVE' || sv.status === 'CANCELLED') {
    return { ok: false, code: 409, message: 'This account is active. No action taken.' };
  }

  const now = new Date().toISOString();

  // Consume the one-time token first so the attestation can't be replayed.
  await env.DB.prepare(`DELETE FROM switch_verifications WHERE id = ?`).bind(sv.sv_id).run();

  if (sv.status !== 'RELEASED') {
    await env.DB.prepare(`
      UPDATE dead_man_switches
      SET status = 'RELEASED',
          verified_at = COALESCE(verified_at, ?),
          released_at = ?,
          updated_at = ?
      WHERE id = ?
    `).bind(now, now, now, sv.dms_id).run();

    // The irreversible step — open the departed author's after-death entries,
    // now gated on this human attestation rather than the timer. Best-effort.
    if ((sv.trigger_action as string) === 'RELEASE_ALL') {
      try {
        await releaseAuthorDeathEntries(env, sv.user_id as string);
      } catch (err) {
        console.error('RELEASE_ALL on attestation failed:', err);
      }
    }
  }

  // M3: auto-convert the deceased's profile to a memorial. Best-effort and
  // idempotent (skips if one already exists) — never abort the trigger if it fails.
  try {
    await createMemorialForUser(env, sv.user_id as string);
  } catch (err) {
    console.error('Failed to auto-create memorial on death confirmation:', err);
  }

  return {
    ok: true,
    switchId: sv.dms_id as string,
    userId: sv.user_id as string,
    triggerAction: sv.trigger_action as string,
    releasedAt: now,
  };
}

// JSON variant — for the SPA `verifyPassing(token)` api method.
deadmanRoutes.post('/verify/:token', async (c) => {
  try {
    const token = c.req.param('token');
    if (!token) return c.json({ error: 'Token is required' }, 400);

    const result = await consumeAndRelease(c.env, token);
    if (!result.ok) return c.json({ error: result.message }, result.code);

    return c.json({
      success: true,
      switchId: result.switchId,
      status: 'RELEASED',
      triggerAction: result.triggerAction,
      releasedAt: result.releasedAt,
    });
  } catch {
    return c.json({ error: 'Token not found or already used' }, 404);
  }
});

// Browser flow — the GET target of the trigger email. Renders an on-brand confirm
// page (no release yet); the actual release happens on the POST below. Public.
deadmanRoutes.get('/verify-passing/:token', async (c) => {
  const token = c.req.param('token');
  const sv = await lookupPassing(c.env, token);

  if (!sv) {
    return c.html(verifyContactPage(
      'This link is no longer valid.',
      `<p>We couldn't find a confirmation request for this link. It may have already
       been used, or it may have expired. If you believe this is a mistake, please
       contact us at heirloom.blue.</p>`,
    ));
  }
  if (new Date(sv.expires_at as string).getTime() < Date.now()) {
    return c.html(verifyContactPage(
      'This link has expired.',
      `<p>For everyone's safety these confirmation links are short-lived. If
       confirmation is still needed, a fresh link will follow.</p>`,
    ));
  }
  if (sv.status === 'ACTIVE' || sv.status === 'CANCELLED') {
    return c.html(verifyContactPage(
      'No action is needed.',
      `<p><span style="color:#e0a062">${esc(sv.user_name as string)}</span> has since
       checked in. Nothing is required of you. You may close this window.</p>`,
    ));
  }
  if (sv.status === 'RELEASED') {
    return c.html(verifyContactPage(
      'Already confirmed.',
      `<p>This passing has already been confirmed and what was left has been carried
       forward. There is nothing more to do.</p>`,
    ));
  }

  const action = `/api/deadman/verify-passing/${encodeURIComponent(token)}`;
  return c.html(verifyContactPage(
    'A difficult confirmation.',
    `<p>You were named a legacy contact by
       <span style="color:#e0a062">${esc(sv.user_name as string)}</span>. We have not
       been able to reach them for their scheduled check-in.</p>
     <p>Only confirm below if you know that ${esc(sv.user_name as string)} has passed
       away. Doing so releases the entries they set to open on their death to the
       people they chose. This cannot be undone.</p>
     <form method="POST" action="${action}">
       <button type="submit">I confirm — ${esc(sv.user_name as string)} has passed</button>
     </form>
     <p style="font-size:13px;color:rgba(242,230,208,0.44)">If they are still with us,
       do nothing — and please ask them to check in.</p>`,
  ));
});

// Browser flow — the POST target of the confirm form. Runs the release. Public.
deadmanRoutes.post('/verify-passing/:token', async (c) => {
  const token = c.req.param('token');
  const result = await consumeAndRelease(c.env, token);

  if (!result.ok) {
    return c.html(verifyContactPage(
      'We couldn’t complete that.',
      `<p>${esc(result.message)}</p>`,
    ));
  }
  return c.html(verifyContactPage(
    'Thank you.',
    `<p>You have confirmed this passing. What was entrusted has been carried forward
       to the people who were chosen. We are sorry for your loss.</p>
     <p>You may close this window.</p>`,
  ));
});

// Test trigger (for testing purposes)
deadmanRoutes.post('/test-trigger', async (c) => {
  const userId = c.get('userId');
  
  const dms = await c.env.DB.prepare(`
    SELECT * FROM dead_man_switches WHERE user_id = ?
  `).bind(userId).first();
  
  if (!dms) {
    return c.json({ error: 'Dead Man\'s Switch not configured' }, 404);
  }
  
  // Get legacy contacts
  const contacts = await c.env.DB.prepare(`
    SELECT * FROM legacy_contacts WHERE user_id = ? AND deleted_at IS NULL
  `).bind(userId).all();
  
  // Get sealed letters
  const letters = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM letters WHERE user_id = ? AND sealed_at IS NOT NULL AND deleted_at IS NULL
  `).bind(userId).first();
  
  return c.json({
    testMode: true,
    wouldTrigger: {
      action: dms.trigger_action,
      notifyContacts: !!dms.notify_contacts,
      contactCount: contacts.results.length,
      sealedLettersCount: letters?.count || 0,
    },
    message: 'This is a test. No actual trigger occurred.',
  });
});
