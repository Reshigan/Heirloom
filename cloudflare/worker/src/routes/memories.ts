/**
 * Memories Routes - Cloudflare Workers
 * Handles memory CRUD operations with R2 storage
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const memoriesRoutes = new Hono<{ Bindings: Env }>();

// Get all memories with pagination and filtering
memoriesRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const type = c.req.query('type');
  const recipientId = c.req.query('recipientId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM memories WHERE user_id = ?`;
  const params: any[] = [userId];
  
  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }
  
  if (recipientId) {
    query += ` AND id IN (SELECT memory_id FROM memory_recipients WHERE family_member_id = ?)`;
    params.push(recipientId);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const memories = await c.env.DB.prepare(query).bind(...params).all();
  
  // Get total count
  let countQuery = `SELECT COUNT(*) as count FROM memories WHERE user_id = ?`;
  const countParams: any[] = [userId];
  if (type) {
    countQuery += ` AND type = ?`;
    countParams.push(type);
  }
  const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({
    data: memories.results.map((m: any) => ({
      id: m.id,
      type: m.type,
      title: m.title,
      description: m.description,
      fileUrl: m.file_url,
      fileKey: m.file_key,
      fileSize: m.file_size,
      mimeType: m.mime_type,
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
      encrypted: !!m.encrypted,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    })),
    pagination: {
      page,
      limit,
      total: countResult?.count || 0,
      totalPages: Math.ceil((countResult?.count as number || 0) / limit),
    },
  });
});

// Get memory stats
memoriesRoutes.get('/stats/summary', async (c) => {
  const userId = c.get('userId');
  
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN type = 'PHOTO' THEN 1 ELSE 0 END) as photos,
      SUM(CASE WHEN type = 'VIDEO' THEN 1 ELSE 0 END) as videos,
      SUM(CASE WHEN type = 'VOICE' THEN 1 ELSE 0 END) as voice,
      SUM(CASE WHEN type = 'LETTER' THEN 1 ELSE 0 END) as letters,
      SUM(file_size) as total_storage
    FROM memories WHERE user_id = ?
  `).bind(userId).first();
  
  return c.json({
    total: stats?.total || 0,
    byType: {
      photos: stats?.photos || 0,
      videos: stats?.videos || 0,
      voice: stats?.voice || 0,
      letters: stats?.letters || 0,
    },
    totalStorage: stats?.total_storage || 0,
  });
});

// Get upload URL for R2
memoriesRoutes.post('/upload-url', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { filename, contentType } = body;
  
  if (!filename || !contentType) {
    return c.json({ error: 'Filename and contentType are required' }, 400);
  }
  
  const key = `memories/${userId}/${Date.now()}-${filename}`;
  
  // For R2, we'll use a presigned URL approach
  // In production, you'd generate a signed URL for direct upload
  // For now, return the key and let the client upload via the API
  return c.json({
    uploadUrl: `${c.env.API_URL}/api/memories/upload/${encodeURIComponent(key)}`,
    key,
    fields: {},
  });
});

// Get a specific memory
memoriesRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const memoryId = c.req.param('id');
  
  const memory = await c.env.DB.prepare(`
    SELECT * FROM memories WHERE id = ? AND user_id = ?
  `).bind(memoryId, userId).first();
  
  if (!memory) {
    return c.json({ error: 'Memory not found' }, 404);
  }
  
  // Get recipients
  const recipients = await c.env.DB.prepare(`
    SELECT fm.* FROM family_members fm
    JOIN memory_recipients mr ON fm.id = mr.family_member_id
    WHERE mr.memory_id = ?
  `).bind(memoryId).all();
  
  return c.json({
    id: memory.id,
    type: memory.type,
    title: memory.title,
    description: memory.description,
    fileUrl: memory.file_url,
    fileKey: memory.file_key,
    fileSize: memory.file_size,
    mimeType: memory.mime_type,
    metadata: memory.metadata ? JSON.parse(memory.metadata as string) : null,
    encrypted: !!memory.encrypted,
    recipients: recipients.results.map((r: any) => ({
      id: r.id,
      name: r.name,
      relationship: r.relationship,
    })),
    createdAt: memory.created_at,
    updatedAt: memory.updated_at,
  });
});

// Create a new memory
memoriesRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { type, title, description, fileUrl, fileKey, fileSize, mimeType, metadata, recipientIds } = body;
  
  if (!type || !title) {
    return c.json({ error: 'Type and title are required' }, 400);
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO memories (id, user_id, type, title, description, file_url, file_key, file_size, mime_type, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, type, title, description || null, fileUrl || null, fileKey || null, fileSize || null, mimeType || null, metadata ? JSON.stringify(metadata) : null, now, now).run();
  
  // Add recipients
  if (recipientIds && recipientIds.length > 0) {
    for (const recipientId of recipientIds) {
      await c.env.DB.prepare(`
        INSERT INTO memory_recipients (id, memory_id, family_member_id, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(crypto.randomUUID(), id, recipientId, now).run();
    }
  }
  
  const memory = await c.env.DB.prepare(`
    SELECT * FROM memories WHERE id = ?
  `).bind(id).first();
  
  return c.json({
    id: memory?.id,
    type: memory?.type,
    title: memory?.title,
    description: memory?.description,
    fileUrl: memory?.file_url,
    fileKey: memory?.file_key,
    createdAt: memory?.created_at,
  }, 201);
});

// Update a memory
memoriesRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const memoryId = c.req.param('id');
  const body = await c.req.json();
  
  // Verify ownership
  const existing = await c.env.DB.prepare(`
    SELECT * FROM memories WHERE id = ? AND user_id = ?
  `).bind(memoryId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Memory not found' }, 404);
  }
  
  const { title, description, metadata } = body;
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE memories 
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        metadata = COALESCE(?, metadata),
        updated_at = ?
    WHERE id = ?
  `).bind(title, description, metadata ? JSON.stringify(metadata) : null, now, memoryId).run();
  
  const memory = await c.env.DB.prepare(`
    SELECT * FROM memories WHERE id = ?
  `).bind(memoryId).first();
  
  return c.json({
    id: memory?.id,
    type: memory?.type,
    title: memory?.title,
    description: memory?.description,
    updatedAt: memory?.updated_at,
  });
});

// Delete a memory
memoriesRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const memoryId = c.req.param('id');
  
  // Verify ownership
  const existing = await c.env.DB.prepare(`
    SELECT * FROM memories WHERE id = ? AND user_id = ?
  `).bind(memoryId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Memory not found' }, 404);
  }
  
  // Delete from R2 if file exists
  if (existing.file_key) {
    try {
      await c.env.STORAGE.delete(existing.file_key as string);
    } catch (e) {
      console.error('Failed to delete file from R2:', e);
    }
  }
  
  await c.env.DB.prepare(`
    DELETE FROM memories WHERE id = ?
  `).bind(memoryId).run();
  
  return c.body(null, 204);
});
