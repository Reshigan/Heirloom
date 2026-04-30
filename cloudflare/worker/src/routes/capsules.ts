/**
 * Time Capsules Routes - Heirloom v2
 * Create, seal, and open collaborative time capsules
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { mirrorIntoDefaultThread } from '../services/threadMesh';

export const capsulesRoutes = new Hono<AppEnv>();

// Get all capsules for user
capsulesRoutes.get('/', async (c) => {
  const userId = c.get('userId');

  const capsules = await c.env.DB.prepare(`
    SELECT tc.*, 
      (SELECT COUNT(*) FROM capsule_contributors cc WHERE cc.capsule_id = tc.id) as contributor_count,
      (SELECT COUNT(*) FROM capsule_items ci WHERE ci.capsule_id = tc.id) as item_count
    FROM time_capsules tc
    WHERE tc.creator_id = ? 
       OR tc.id IN (SELECT capsule_id FROM capsule_contributors WHERE user_id = ?)
    ORDER BY tc.created_at DESC
  `).bind(userId, userId).all();

  return c.json(capsules.results);
});

// Get single capsule
capsulesRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const capsuleId = c.req.param('id');

  const capsule = await c.env.DB.prepare(`
    SELECT * FROM time_capsules WHERE id = ?
  `).bind(capsuleId).first();

  if (!capsule) {
    return c.json({ error: 'Capsule not found' }, 404);
  }

  // Check access
  const isCreator = capsule.creator_id === userId;
  const isContributor = await c.env.DB.prepare(`
    SELECT id FROM capsule_contributors WHERE capsule_id = ? AND user_id = ?
  `).bind(capsuleId, userId).first();

  if (!isCreator && !isContributor) {
    return c.json({ error: 'Access denied' }, 403);
  }

  // Get contributors
  const contributors = await c.env.DB.prepare(`
    SELECT cc.*, u.first_name, u.last_name, u.avatar_url
    FROM capsule_contributors cc
    LEFT JOIN users u ON cc.user_id = u.id
    WHERE cc.capsule_id = ?
  `).bind(capsuleId).all();

  // Get items (only if capsule is open or unlocked)
  let items: any[] = [];
  if (!capsule.sealed_at || capsule.opened_at) {
    const itemsResult = await c.env.DB.prepare(`
      SELECT ci.*, u.first_name, u.last_name
      FROM capsule_items ci
      LEFT JOIN users u ON ci.contributor_id = u.id
      WHERE ci.capsule_id = ?
      ORDER BY ci.created_at ASC
    `).bind(capsuleId).all();
    items = itemsResult.results;
  }

  return c.json({
    ...capsule,
    contributors: contributors.results,
    items,
  });
});

// Create capsule
capsulesRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const now = new Date().toISOString();

  if (!body.title || !body.unlock_date) {
    return c.json({ error: 'Title and unlock date are required' }, 400);
  }

  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO time_capsules (id, creator_id, title, description, unlock_date, cover_style, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, body.title, body.description || null, body.unlock_date, body.cover_style || 'default', now, now).run();

  // Dual-write: capsules become a thread entry with a DATE unlock so the
  // unified time-locked inbox surfaces them alongside thread-native entries.
  await mirrorIntoDefaultThread(c.env, userId, {
    title: body.title,
    dateLock: body.unlock_date,
  });

  return c.json({ id, success: true }, 201);
});

// Add item to capsule
capsulesRoutes.post('/:id/items', async (c) => {
  const userId = c.get('userId');
  const capsuleId = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();

  // Check capsule exists and is not sealed
  const capsule = await c.env.DB.prepare(`
    SELECT * FROM time_capsules WHERE id = ?
  `).bind(capsuleId).first();

  if (!capsule) {
    return c.json({ error: 'Capsule not found' }, 404);
  }

  if (capsule.sealed_at) {
    return c.json({ error: 'Capsule is sealed, cannot add items' }, 400);
  }

  const itemId = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO capsule_items (id, capsule_id, contributor_id, item_type, title, content, file_key, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(itemId, capsuleId, userId, body.item_type || 'text', body.title || 'Untitled', body.content || null, body.file_key || null, now).run();

  return c.json({ id: itemId, success: true }, 201);
});

// Seal capsule
capsulesRoutes.post('/:id/seal', async (c) => {
  const userId = c.get('userId');
  const capsuleId = c.req.param('id');
  const now = new Date().toISOString();

  const capsule = await c.env.DB.prepare(`
    SELECT * FROM time_capsules WHERE id = ? AND creator_id = ?
  `).bind(capsuleId, userId).first();

  if (!capsule) {
    return c.json({ error: 'Capsule not found or not owner' }, 404);
  }

  if (capsule.sealed_at) {
    return c.json({ error: 'Capsule is already sealed' }, 400);
  }

  await c.env.DB.prepare(`
    UPDATE time_capsules SET sealed_at = ?, updated_at = ? WHERE id = ?
  `).bind(now, now, capsuleId).run();

  return c.json({ success: true, sealed_at: now });
});

// Open capsule (only if unlock_date has passed)
capsulesRoutes.post('/:id/open', async (c) => {
  const userId = c.get('userId');
  const capsuleId = c.req.param('id');
  const now = new Date();

  const capsule = await c.env.DB.prepare(`
    SELECT * FROM time_capsules WHERE id = ? AND creator_id = ?
  `).bind(capsuleId, userId).first();

  if (!capsule) {
    return c.json({ error: 'Capsule not found or not owner' }, 404);
  }

  if (!capsule.sealed_at) {
    return c.json({ error: 'Capsule must be sealed before opening' }, 400);
  }

  if (capsule.opened_at) {
    return c.json({ error: 'Capsule is already opened' }, 400);
  }

  const unlockDate = new Date(capsule.unlock_date as string);
  if (now < unlockDate) {
    return c.json({ error: 'Capsule unlock date has not yet arrived' }, 400);
  }

  await c.env.DB.prepare(`
    UPDATE time_capsules SET opened_at = ?, updated_at = ? WHERE id = ?
  `).bind(now.toISOString(), now.toISOString(), capsuleId).run();

  return c.json({ success: true, opened_at: now.toISOString() });
});

// Invite contributor
capsulesRoutes.post('/:id/invite', async (c) => {
  const userId = c.get('userId');
  const capsuleId = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();

  const capsule = await c.env.DB.prepare(`
    SELECT * FROM time_capsules WHERE id = ? AND creator_id = ?
  `).bind(capsuleId, userId).first();

  if (!capsule) {
    return c.json({ error: 'Capsule not found or not owner' }, 404);
  }

  const inviteToken = crypto.randomUUID().slice(0, 12);
  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO capsule_contributors (id, capsule_id, email, invite_token, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, capsuleId, body.email, inviteToken, now).run();

  return c.json({ id, invite_token: inviteToken, success: true });
});

export default capsulesRoutes;
