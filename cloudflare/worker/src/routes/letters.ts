/**
 * Letters Routes - Cloudflare Workers
 * Handles letter CRUD operations
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const lettersRoutes = new Hono<{ Bindings: Env }>();

// Get all letters with pagination
lettersRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM letters WHERE user_id = ?`;
  const params: any[] = [userId];
  
  if (status === 'draft') {
    query += ` AND sealed_at IS NULL`;
  } else if (status === 'sealed') {
    query += ` AND sealed_at IS NOT NULL`;
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const letters = await c.env.DB.prepare(query).bind(...params).all();
  
  // Get recipients for each letter
  const lettersWithRecipients = await Promise.all(
    letters.results.map(async (letter: any) => {
      const recipients = await c.env.DB.prepare(`
        SELECT fm.id, fm.name, fm.relationship FROM family_members fm
        JOIN letter_recipients lr ON fm.id = lr.family_member_id
        WHERE lr.letter_id = ?
      `).bind(letter.id).all();
      
      return {
        id: letter.id,
        title: letter.title,
        salutation: letter.salutation,
        bodyPreview: letter.body ? letter.body.substring(0, 200) + (letter.body.length > 200 ? '...' : '') : '',
        signature: letter.signature,
        deliveryTrigger: letter.delivery_trigger,
        scheduledDate: letter.scheduled_date,
        sealedAt: letter.sealed_at,
        encrypted: !!letter.encrypted,
        recipients: recipients.results,
        createdAt: letter.created_at,
        updatedAt: letter.updated_at,
      };
    })
  );
  
  // Get total count
  let countQuery = `SELECT COUNT(*) as count FROM letters WHERE user_id = ?`;
  if (status === 'draft') {
    countQuery += ` AND sealed_at IS NULL`;
  } else if (status === 'sealed') {
    countQuery += ` AND sealed_at IS NOT NULL`;
  }
  const countResult = await c.env.DB.prepare(countQuery).bind(userId).first();
  
  return c.json({
    data: lettersWithRecipients,
    pagination: {
      page,
      limit,
      total: countResult?.count || 0,
      totalPages: Math.ceil((countResult?.count as number || 0) / limit),
    },
  });
});

// Get a specific letter
lettersRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');
  
  const letter = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ? AND user_id = ?
  `).bind(letterId, userId).first();
  
  if (!letter) {
    return c.json({ error: 'Letter not found' }, 404);
  }
  
  // Get recipients
  const recipients = await c.env.DB.prepare(`
    SELECT fm.id, fm.name, fm.relationship, fm.email FROM family_members fm
    JOIN letter_recipients lr ON fm.id = lr.family_member_id
    WHERE lr.letter_id = ?
  `).bind(letterId).all();
  
  return c.json({
    id: letter.id,
    title: letter.title,
    salutation: letter.salutation,
    body: letter.body,
    signature: letter.signature,
    deliveryTrigger: letter.delivery_trigger,
    scheduledDate: letter.scheduled_date,
    sealedAt: letter.sealed_at,
    encrypted: !!letter.encrypted,
    recipients: recipients.results.map((r: any) => ({
      id: r.id,
      name: r.name,
      relationship: r.relationship,
      email: r.email,
    })),
    createdAt: letter.created_at,
    updatedAt: letter.updated_at,
  });
});

// Create a new letter
lettersRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { title, salutation, body: letterBody, signature, deliveryTrigger, scheduledDate, recipientIds } = body;
  
  if (!letterBody) {
    return c.json({ error: 'Letter body is required' }, 400);
  }
  
  if (!recipientIds || recipientIds.length === 0) {
    return c.json({ error: 'At least one recipient is required' }, 400);
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO letters (id, user_id, title, salutation, body, signature, delivery_trigger, scheduled_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, title || null, salutation || null, letterBody, signature || null, deliveryTrigger || 'IMMEDIATE', scheduledDate || null, now, now).run();
  
  // Add recipients
  for (const recipientId of recipientIds) {
    await c.env.DB.prepare(`
      INSERT INTO letter_recipients (id, letter_id, family_member_id, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(crypto.randomUUID(), id, recipientId, now).run();
  }
  
  const letter = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ?
  `).bind(id).first();
  
  return c.json({
    id: letter?.id,
    title: letter?.title,
    salutation: letter?.salutation,
    body: letter?.body,
    signature: letter?.signature,
    deliveryTrigger: letter?.delivery_trigger,
    createdAt: letter?.created_at,
  }, 201);
});

// Update a letter
lettersRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');
  const body = await c.req.json();
  
  // Verify ownership and not sealed
  const existing = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ? AND user_id = ?
  `).bind(letterId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Letter not found' }, 404);
  }
  
  if (existing.sealed_at) {
    return c.json({ error: 'Cannot edit a sealed letter' }, 403);
  }
  
  const { title, salutation, body: letterBody, signature, deliveryTrigger, scheduledDate, recipientIds } = body;
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE letters 
    SET title = COALESCE(?, title),
        salutation = COALESCE(?, salutation),
        body = COALESCE(?, body),
        signature = COALESCE(?, signature),
        delivery_trigger = COALESCE(?, delivery_trigger),
        scheduled_date = COALESCE(?, scheduled_date),
        updated_at = ?
    WHERE id = ?
  `).bind(title, salutation, letterBody, signature, deliveryTrigger, scheduledDate, now, letterId).run();
  
  // Update recipients if provided
  if (recipientIds && recipientIds.length > 0) {
    // Remove existing recipients
    await c.env.DB.prepare(`
      DELETE FROM letter_recipients WHERE letter_id = ?
    `).bind(letterId).run();
    
    // Add new recipients
    for (const recipientId of recipientIds) {
      await c.env.DB.prepare(`
        INSERT INTO letter_recipients (id, letter_id, family_member_id, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(crypto.randomUUID(), letterId, recipientId, now).run();
    }
  }
  
  const letter = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ?
  `).bind(letterId).first();
  
  return c.json({
    id: letter?.id,
    title: letter?.title,
    salutation: letter?.salutation,
    body: letter?.body,
    signature: letter?.signature,
    deliveryTrigger: letter?.delivery_trigger,
    updatedAt: letter?.updated_at,
  });
});

// Seal a letter
lettersRoutes.post('/:id/seal', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');
  
  // Verify ownership
  const existing = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ? AND user_id = ?
  `).bind(letterId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Letter not found' }, 404);
  }
  
  if (existing.sealed_at) {
    return c.json({ error: 'Letter is already sealed' }, 400);
  }
  
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE letters SET sealed_at = ?, updated_at = ? WHERE id = ?
  `).bind(now, now, letterId).run();
  
  // Get recipients for delivery scheduling
  const recipients = await c.env.DB.prepare(`
    SELECT fm.email, fm.name FROM family_members fm
    JOIN letter_recipients lr ON fm.id = lr.family_member_id
    WHERE lr.letter_id = ?
  `).bind(letterId).all();
  
  // Create delivery records
  for (const recipient of recipients.results as any[]) {
    if (recipient.email) {
      await c.env.DB.prepare(`
        INSERT INTO letter_deliveries (id, letter_id, recipient_email, status, created_at, updated_at)
        VALUES (?, ?, ?, 'PENDING', ?, ?)
      `).bind(crypto.randomUUID(), letterId, recipient.email, now, now).run();
    }
  }
  
  const letter = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ?
  `).bind(letterId).first();
  
  return c.json({
    id: letter?.id,
    title: letter?.title,
    sealedAt: letter?.sealed_at,
    message: 'Letter sealed successfully',
  });
});

// Delete a letter
lettersRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');
  
  // Verify ownership
  const existing = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ? AND user_id = ?
  `).bind(letterId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Letter not found' }, 404);
  }
  
  await c.env.DB.prepare(`
    DELETE FROM letters WHERE id = ?
  `).bind(letterId).run();
  
  return c.body(null, 204);
});
