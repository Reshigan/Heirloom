/**
 * Route Stubs for Heirloom Cloudflare Worker
 * Each of these would be expanded with full implementations
 */

import { Hono } from 'hono';
import type { Env } from '../index';

// ============================================
// FAMILY ROUTES
// ============================================

export const familyRoutes = new Hono<{ Bindings: Env }>();

familyRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  
  const result = await c.env.DB.prepare(`
    SELECT * FROM family_members WHERE user_id = ? ORDER BY name
  `).bind(userId).all();
  
  return c.json(result.results);
});

familyRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO family_members (id, user_id, name, relationship, email, phone, birth_date, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, body.name, body.relationship, body.email, body.phone, body.birthDate, body.notes, now, now).run();
  
  return c.json({ id, ...body }, 201);
});

familyRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  const member = await c.env.DB.prepare(`
    SELECT * FROM family_members WHERE id = ? AND user_id = ?
  `).bind(id, userId).first();
  
  if (!member) return c.json({ error: 'Not found' }, 404);
  
  return c.json(member);
});

familyRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE family_members 
    SET name = COALESCE(?, name),
        relationship = COALESCE(?, relationship),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        updated_at = ?
    WHERE id = ? AND user_id = ?
  `).bind(body.name, body.relationship, body.email, body.phone, new Date().toISOString(), id, userId).run();
  
  return c.json({ success: true });
});

familyRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  await c.env.DB.prepare(
    'DELETE FROM family_members WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();
  
  return c.json({ success: true });
});

// ============================================
// MEMORIES ROUTES
// ============================================

export const memoriesRoutes = new Hono<{ Bindings: Env }>();

memoriesRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const type = c.req.query('type');
  
  let query = 'SELECT * FROM memories WHERE user_id = ?';
  const params: any[] = [userId];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json(result.results);
});

memoriesRoutes.get('/stats/summary', async (c) => {
  const userId = c.get('userId');
  
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN type = 'PHOTO' THEN 1 ELSE 0 END) as photos,
      SUM(CASE WHEN type = 'VIDEO' THEN 1 ELSE 0 END) as videos,
      SUM(CASE WHEN type = 'VOICE' THEN 1 ELSE 0 END) as voices,
      SUM(CASE WHEN type = 'LETTER' THEN 1 ELSE 0 END) as letters,
      SUM(file_size) as totalSize
    FROM memories WHERE user_id = ?
  `).bind(userId).first();
  
  return c.json(stats);
});

memoriesRoutes.post('/upload-url', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const key = `${userId}/${crypto.randomUUID()}-${body.filename}`;
  
  // Generate presigned URL for R2 (this is simplified - R2 has specific methods)
  const uploadUrl = `https://api.heirloom.blue/api/memories/upload/${key}`;
  
  return c.json({ uploadUrl, key });
});

memoriesRoutes.put('/upload/:key', async (c) => {
  const key = c.req.param('key');
  const body = await c.req.arrayBuffer();
  
  await c.env.STORAGE.put(key, body, {
    httpMetadata: {
      contentType: c.req.header('Content-Type') || 'application/octet-stream',
    },
  });
  
  return c.json({ success: true, key });
});

memoriesRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO memories (id, user_id, type, title, description, file_url, file_key, file_size, mime_type, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, userId, body.type, body.title, body.description,
    body.fileUrl, body.fileKey, body.fileSize, body.mimeType,
    JSON.stringify(body.metadata || {}), now, now
  ).run();
  
  return c.json({ id, ...body }, 201);
});

memoriesRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  // Get file key to delete from R2
  const memory = await c.env.DB.prepare(
    'SELECT file_key FROM memories WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();
  
  if (memory?.file_key) {
    await c.env.STORAGE.delete(memory.file_key as string);
  }
  
  await c.env.DB.prepare(
    'DELETE FROM memories WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();
  
  return c.json({ success: true });
});

// ============================================
// LETTERS ROUTES
// ============================================

export const lettersRoutes = new Hono<{ Bindings: Env }>();

lettersRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  
  const result = await c.env.DB.prepare(`
    SELECT l.*, 
           json_group_array(json_object('id', fm.id, 'name', fm.name, 'relationship', fm.relationship)) as recipients
    FROM letters l
    LEFT JOIN letter_recipients lr ON l.id = lr.letter_id
    LEFT JOIN family_members fm ON lr.family_member_id = fm.id
    WHERE l.user_id = ?
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `).bind(userId).all();
  
  const letters = result.results.map(l => ({
    ...l,
    recipients: JSON.parse(l.recipients as string).filter((r: any) => r.id),
  }));
  
  return c.json(letters);
});

lettersRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO letters (id, user_id, title, salutation, body, signature, delivery_trigger, scheduled_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, userId, body.title, body.salutation, body.body, body.signature,
    body.deliveryTrigger || 'IMMEDIATE', body.scheduledDate, now, now
  ).run();
  
  // Add recipients
  if (body.recipientIds?.length) {
    for (const recipientId of body.recipientIds) {
      await c.env.DB.prepare(`
        INSERT INTO letter_recipients (id, letter_id, family_member_id, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(crypto.randomUUID(), id, recipientId, now).run();
    }
  }
  
  return c.json({ id, ...body }, 201);
});

lettersRoutes.post('/:id/seal', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE letters SET sealed_at = ?, updated_at = ?
    WHERE id = ? AND user_id = ? AND sealed_at IS NULL
  `).bind(now, now, id, userId).run();
  
  return c.json({ success: true, sealedAt: now });
});

lettersRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  await c.env.DB.prepare(
    'DELETE FROM letters WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();
  
  return c.json({ success: true });
});

// ============================================
// VOICE ROUTES
// ============================================

export const voiceRoutes = new Hono<{ Bindings: Env }>();

voiceRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  
  const result = await c.env.DB.prepare(`
    SELECT * FROM voice_recordings WHERE user_id = ? ORDER BY created_at DESC
  `).bind(userId).all();
  
  return c.json(result.results);
});

voiceRoutes.get('/prompts/list', async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT * FROM story_prompts WHERE active = 1 ORDER BY category, sort_order
  `).all();
  
  // Group by category
  const grouped = result.results.reduce((acc: any, prompt: any) => {
    if (!acc[prompt.category]) acc[prompt.category] = [];
    acc[prompt.category].push(prompt);
    return acc;
  }, {});
  
  return c.json(grouped);
});

voiceRoutes.post('/upload-url', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const key = `voice/${userId}/${crypto.randomUUID()}-${body.filename}`;
  
  return c.json({ 
    uploadUrl: `https://api.heirloom.blue/api/voice/upload/${encodeURIComponent(key)}`,
    key 
  });
});

voiceRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO voice_recordings (id, user_id, title, description, file_url, file_key, duration, file_size, waveform_data, transcript, prompt, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, userId, body.title, body.description, body.fileUrl, body.fileKey,
    body.duration, body.fileSize, JSON.stringify(body.waveformData),
    body.transcript, body.prompt, now, now
  ).run();
  
  return c.json({ id, ...body }, 201);
});

// ============================================
// BILLING ROUTES
// ============================================

export const billingRoutes = new Hono<{ Bindings: Env }>();

billingRoutes.get('/subscription', async (c) => {
  const userId = c.get('userId');
  
  const sub = await c.env.DB.prepare(`
    SELECT * FROM subscriptions WHERE user_id = ?
  `).bind(userId).first();
  
  if (!sub) {
    return c.json({ tier: 'FREE', status: 'ACTIVE' });
  }
  
  // Calculate trial days remaining
  let trialDaysRemaining = 0;
  if (sub.status === 'TRIALING' && sub.trial_ends_at) {
    const trialEnd = new Date(sub.trial_ends_at as string);
    trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  }
  
  return c.json({
    tier: sub.tier,
    status: sub.status,
    currentPeriodEnd: sub.current_period_end,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    trialDaysRemaining,
  });
});

billingRoutes.get('/limits', async (c) => {
  const userId = c.get('userId');
  
  // Get subscription tier
  const sub = await c.env.DB.prepare(
    'SELECT tier FROM subscriptions WHERE user_id = ?'
  ).bind(userId).first();
  
  const tier = (sub?.tier as string) || 'FREE';
  
  // Get current usage
  const usage = await c.env.DB.prepare(`
    SELECT SUM(file_size) as used FROM memories WHERE user_id = ?
  `).bind(userId).first();
  
  const limits: Record<string, { storage: number }> = {
    FREE: { storage: 100 * 1024 * 1024 }, // 100 MB
    ESSENTIAL: { storage: 5 * 1024 * 1024 * 1024 }, // 5 GB
    FAMILY: { storage: 25 * 1024 * 1024 * 1024 }, // 25 GB
    LEGACY: { storage: 100 * 1024 * 1024 * 1024 }, // 100 GB
  };
  
  const limit = limits[tier] || limits.FREE;
  const usedBytes = (usage?.used as number) || 0;
  
  return c.json({
    storageLimitMB: Math.round(limit.storage / (1024 * 1024)),
    storageUsedMB: Math.round(usedBytes / (1024 * 1024)),
    storageUsedPercent: Math.round((usedBytes / limit.storage) * 100),
  });
});

billingRoutes.post('/checkout', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  // Create Stripe checkout session
  // This would use the Stripe API
  const checkoutUrl = `https://checkout.stripe.com/...`;
  
  return c.json({ checkoutUrl });
});

// ============================================
// SETTINGS ROUTES
// ============================================

export const settingsRoutes = new Hono<{ Bindings: Env }>();

settingsRoutes.get('/profile', async (c) => {
  const userId = c.get('userId');
  
  const user = await c.env.DB.prepare(`
    SELECT id, email, first_name, last_name, avatar_url, preferred_currency
    FROM users WHERE id = ?
  `).bind(userId).first();
  
  return c.json(user);
});

settingsRoutes.patch('/profile', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE users 
    SET first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        updated_at = ?
    WHERE id = ?
  `).bind(body.firstName, body.lastName, new Date().toISOString(), userId).run();
  
  return c.json({ success: true });
});

// ============================================
// DEADMAN ROUTES
// ============================================

export const deadmanRoutes = new Hono<{ Bindings: Env }>();

deadmanRoutes.get('/status', async (c) => {
  const userId = c.get('userId');
  
  const status = await c.env.DB.prepare(`
    SELECT * FROM dead_man_switches WHERE user_id = ?
  `).bind(userId).first();
  
  if (!status) {
    return c.json({ enabled: false });
  }
  
  return c.json({
    enabled: !!status.enabled,
    status: status.status,
    checkInIntervalDays: status.check_in_interval_days,
    lastCheckIn: status.last_check_in,
    nextCheckIn: status.next_check_in_due,
    needsCheckIn: status.next_check_in_due && new Date(status.next_check_in_due as string) < new Date(),
  });
});

deadmanRoutes.post('/configure', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  const nextCheckIn = new Date(Date.now() + body.intervalDays * 24 * 60 * 60 * 1000).toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO dead_man_switches (id, user_id, check_in_interval_days, grace_period_days, next_check_in_due, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      check_in_interval_days = excluded.check_in_interval_days,
      grace_period_days = excluded.grace_period_days,
      next_check_in_due = excluded.next_check_in_due,
      updated_at = excluded.updated_at
  `).bind(
    crypto.randomUUID(), userId, body.intervalDays, body.gracePeriodDays || 7,
    nextCheckIn, now, now
  ).run();
  
  return c.json({ success: true, nextCheckIn });
});

deadmanRoutes.post('/checkin', async (c) => {
  const userId = c.get('userId');
  const now = new Date().toISOString();
  
  // Get current interval
  const current = await c.env.DB.prepare(
    'SELECT check_in_interval_days FROM dead_man_switches WHERE user_id = ?'
  ).bind(userId).first();
  
  const intervalDays = (current?.check_in_interval_days as number) || 30;
  const nextCheckIn = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString();
  
  await c.env.DB.prepare(`
    UPDATE dead_man_switches 
    SET last_check_in = ?, next_check_in_due = ?, status = 'ACTIVE', missed_check_ins = 0, updated_at = ?
    WHERE user_id = ?
  `).bind(now, nextCheckIn, now, userId).run();
  
  // Record check-in
  await c.env.DB.prepare(`
    INSERT INTO check_in_history (id, user_id, checked_in_at, method, created_at)
    VALUES (?, ?, ?, 'MANUAL', ?)
  `).bind(crypto.randomUUID(), userId, now, now).run();
  
  return c.json({ success: true, nextCheckIn });
});

// ============================================
// ENCRYPTION ROUTES
// ============================================

export const encryptionRoutes = new Hono<{ Bindings: Env }>();

encryptionRoutes.get('/params', async (c) => {
  const userId = c.get('userId');
  
  const user = await c.env.DB.prepare(`
    SELECT encryption_salt, key_derivation_params FROM users WHERE id = ?
  `).bind(userId).first();
  
  if (!user?.encryption_salt) {
    return c.json({ configured: false });
  }
  
  return c.json({
    configured: true,
    salt: user.encryption_salt,
    params: user.key_derivation_params ? JSON.parse(user.key_derivation_params as string) : null,
  });
});

encryptionRoutes.post('/setup', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  // Generate salt
  const salt = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  
  const params = {
    algorithm: 'PBKDF2',
    iterations: 100000,
    hash: 'SHA-256',
  };
  
  await c.env.DB.prepare(`
    UPDATE users 
    SET encryption_salt = ?, 
        encrypted_master_key = ?,
        key_derivation_params = ?,
        updated_at = ?
    WHERE id = ?
  `).bind(salt, body.encryptedMasterKey, JSON.stringify(params), new Date().toISOString(), userId).run();
  
  return c.json({ success: true, salt, params });
});
