/**
 * Dead Man's Switch Routes - Cloudflare Workers
 * Handles dead man's switch configuration and check-ins
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const deadmanRoutes = new Hono<{ Bindings: Env }>();

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
  
  return c.json({
    configured: true,
    id: dms.id,
    status: dms.status,
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
          updated_at = ?
      WHERE user_id = ?
    `).bind(checkInIntervalDays, gracePeriodDays, triggerAction, notifyContacts ? 1 : 0, now, userId).run();
  } else {
    await c.env.DB.prepare(`
      INSERT INTO dead_man_switches (id, user_id, check_in_interval_days, grace_period_days, trigger_action, notify_contacts, status, last_check_in, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
    `).bind(crypto.randomUUID(), userId, checkInIntervalDays, gracePeriodDays, triggerAction, notifyContacts ? 1 : 0, now, now, now).run();
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
  
  // Update last check-in and reset missed count
  await c.env.DB.prepare(`
    UPDATE dead_man_switches 
    SET last_check_in = ?, missed_check_ins = 0, status = 'ACTIVE', updated_at = ?
    WHERE user_id = ?
  `).bind(now, now, userId).run();
  
  // Record check-in history
  await c.env.DB.prepare(`
    INSERT INTO check_in_history (id, dead_man_switch_id, check_in_time, method, created_at)
    VALUES (?, ?, ?, 'MANUAL', ?)
  `).bind(crypto.randomUUID(), dms.id, now, now).run();
  
  // Calculate next check-in due
  const intervalDays = dms.check_in_interval_days as number;
  const nextCheckIn = new Date(new Date().getTime() + intervalDays * 24 * 60 * 60 * 1000);
  
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
    UPDATE dead_man_switches SET status = 'DISABLED', updated_at = ? WHERE user_id = ?
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
    SELECT * FROM legacy_contacts WHERE user_id = ?
  `).bind(userId).all();
  
  // Get sealed letters
  const letters = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM letters WHERE user_id = ? AND sealed_at IS NOT NULL
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
