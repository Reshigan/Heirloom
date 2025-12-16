/**
 * Voice Routes - Cloudflare Workers
 * Handles voice recording CRUD operations with R2 storage
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const voiceRoutes = new Hono<{ Bindings: Env }>();

// Get all voice recordings with pagination
voiceRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  const recordings = await c.env.DB.prepare(`
    SELECT * FROM voice_recordings WHERE user_id = ?
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).bind(userId, limit, offset).all();
  
  // Get recipients for each recording
  const recordingsWithRecipients = await Promise.all(
    recordings.results.map(async (recording: any) => {
      const recipients = await c.env.DB.prepare(`
        SELECT fm.id, fm.name, fm.relationship FROM family_members fm
        JOIN voice_recipients vr ON fm.id = vr.family_member_id
        WHERE vr.voice_recording_id = ?
      `).bind(recording.id).all();
      
      return {
        id: recording.id,
        title: recording.title,
        description: recording.description,
        fileUrl: recording.file_url,
        fileKey: recording.file_key,
        duration: recording.duration,
        fileSize: recording.file_size,
        transcript: recording.transcript,
        emotion: recording.emotion,
        encrypted: !!recording.encrypted,
        recipients: recipients.results,
        createdAt: recording.created_at,
        updatedAt: recording.updated_at,
      };
    })
  );
  
  // Get total count
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM voice_recordings WHERE user_id = ?
  `).bind(userId).first();
  
  return c.json({
    data: recordingsWithRecipients,
    pagination: {
      page,
      limit,
      total: countResult?.count || 0,
      totalPages: Math.ceil((countResult?.count as number || 0) / limit),
    },
  });
});

// Get voice stats
voiceRoutes.get('/stats', async (c) => {
  const userId = c.get('userId');
  
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(duration) as total_duration,
      SUM(file_size) as total_storage
    FROM voice_recordings WHERE user_id = ?
  `).bind(userId).first();
  
  return c.json({
    total: stats?.total || 0,
    totalDuration: stats?.total_duration || 0,
    totalStorage: stats?.total_storage || 0,
  });
});

// Get upload URL for R2
voiceRoutes.post('/upload-url', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { filename, contentType } = body;
  
  if (!filename || !contentType) {
    return c.json({ error: 'Filename and contentType are required' }, 400);
  }
  
  const key = `voice/${userId}/${Date.now()}-${filename}`;
  
  return c.json({
    uploadUrl: `${c.env.API_URL}/api/voice/upload/${encodeURIComponent(key)}`,
    key,
    fields: {},
  });
});

// Get a specific voice recording
voiceRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const recordingId = c.req.param('id');
  
  const recording = await c.env.DB.prepare(`
    SELECT * FROM voice_recordings WHERE id = ? AND user_id = ?
  `).bind(recordingId, userId).first();
  
  if (!recording) {
    return c.json({ error: 'Voice recording not found' }, 404);
  }
  
  // Get recipients
  const recipients = await c.env.DB.prepare(`
    SELECT fm.id, fm.name, fm.relationship, fm.email FROM family_members fm
    JOIN voice_recipients vr ON fm.id = vr.family_member_id
    WHERE vr.voice_recording_id = ?
  `).bind(recordingId).all();
  
  return c.json({
    id: recording.id,
    title: recording.title,
    description: recording.description,
    fileUrl: recording.file_url,
    fileKey: recording.file_key,
    duration: recording.duration,
    fileSize: recording.file_size,
    transcript: recording.transcript,
    emotion: recording.emotion,
    encrypted: !!recording.encrypted,
    recipients: recipients.results.map((r: any) => ({
      id: r.id,
      name: r.name,
      relationship: r.relationship,
      email: r.email,
    })),
    createdAt: recording.created_at,
    updatedAt: recording.updated_at,
  });
});

// Create a new voice recording
voiceRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { title, description, fileUrl, fileKey, duration, fileSize, transcript, emotion, recipientIds } = body;
  
  if (!title) {
    return c.json({ error: 'Title is required' }, 400);
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO voice_recordings (id, user_id, title, description, file_url, file_key, duration, file_size, transcript, emotion, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, title, description || null, fileUrl || null, fileKey || null, duration || null, fileSize || null, transcript || null, emotion || null, now, now).run();
  
  // Add recipients
  if (recipientIds && recipientIds.length > 0) {
    for (const recipientId of recipientIds) {
      await c.env.DB.prepare(`
        INSERT INTO voice_recipients (id, voice_recording_id, family_member_id, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(crypto.randomUUID(), id, recipientId, now).run();
    }
  }
  
  const recording = await c.env.DB.prepare(`
    SELECT * FROM voice_recordings WHERE id = ?
  `).bind(id).first();
  
  return c.json({
    id: recording?.id,
    title: recording?.title,
    description: recording?.description,
    fileUrl: recording?.file_url,
    fileKey: recording?.file_key,
    duration: recording?.duration,
    createdAt: recording?.created_at,
  }, 201);
});

// Update a voice recording
voiceRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const recordingId = c.req.param('id');
  const body = await c.req.json();
  
  // Verify ownership
  const existing = await c.env.DB.prepare(`
    SELECT * FROM voice_recordings WHERE id = ? AND user_id = ?
  `).bind(recordingId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Voice recording not found' }, 404);
  }
  
  const { title, description, transcript, emotion } = body;
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE voice_recordings 
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        transcript = COALESCE(?, transcript),
        emotion = COALESCE(?, emotion),
        updated_at = ?
    WHERE id = ?
  `).bind(title, description, transcript, emotion, now, recordingId).run();
  
  const recording = await c.env.DB.prepare(`
    SELECT * FROM voice_recordings WHERE id = ?
  `).bind(recordingId).first();
  
  return c.json({
    id: recording?.id,
    title: recording?.title,
    description: recording?.description,
    transcript: recording?.transcript,
    emotion: recording?.emotion,
    updatedAt: recording?.updated_at,
  });
});

// Delete a voice recording
voiceRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const recordingId = c.req.param('id');
  
  // Verify ownership
  const existing = await c.env.DB.prepare(`
    SELECT * FROM voice_recordings WHERE id = ? AND user_id = ?
  `).bind(recordingId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Voice recording not found' }, 404);
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
    DELETE FROM voice_recordings WHERE id = ?
  `).bind(recordingId).run();
  
  return c.body(null, 204);
});
