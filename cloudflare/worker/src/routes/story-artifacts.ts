import { Hono } from 'hono';
import type { AppEnv } from '../index';

export const storyArtifactsRoutes = new Hono<AppEnv>();

// ============================================
// LIST STORY ARTIFACTS
// ============================================
storyArtifactsRoutes.get('/', async (c) => {
  const userId = c.get('userId');

  const artifacts = await c.env.DB.prepare(
    'SELECT * FROM story_artifacts WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();

  return c.json({ artifacts: artifacts.results || [] });
});

// ============================================
// GET SINGLE ARTIFACT
// ============================================
storyArtifactsRoutes.get('/:artifactId', async (c) => {
  const userId = c.get('userId');
  const artifactId = c.req.param('artifactId');

  const artifact = await c.env.DB.prepare(
    'SELECT * FROM story_artifacts WHERE id = ? AND user_id = ?'
  ).bind(artifactId, userId).first();

  if (!artifact) {
    return c.json({ error: 'Artifact not found' }, 404);
  }

  // Get associated memories
  const memoryIds = artifact.memory_ids ? JSON.parse(artifact.memory_ids as string) : [];
  let memories: unknown[] = [];
  if (memoryIds.length > 0) {
    const placeholders = memoryIds.map(() => '?').join(',');
    const memoriesResult = await c.env.DB.prepare(
      `SELECT id, title, file_url, thumbnail_url FROM memories WHERE id IN (${placeholders})`
    ).bind(...memoryIds).all();
    memories = memoriesResult.results || [];
  }

  // Get voice recording if exists
  let voiceRecording = null;
  if (artifact.voice_recording_id) {
    voiceRecording = await c.env.DB.prepare(
      'SELECT id, title, duration FROM voice_recordings WHERE id = ?'
    ).bind(artifact.voice_recording_id).first();
  }

  return c.json({ 
    artifact,
    memories,
    voiceRecording,
  });
});

// ============================================
// CREATE ARTIFACT
// ============================================
storyArtifactsRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const { title, description, memoryIds, voiceRecordingId, theme, backgroundMusic } = body;

  if (!title) {
    return c.json({ error: 'Title is required' }, 400);
  }

  const artifactId = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO story_artifacts (id, user_id, title, description, memory_ids, voice_recording_id, theme, background_music, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', datetime('now'), datetime('now'))
  `).bind(
    artifactId, 
    userId, 
    title, 
    description || null, 
    memoryIds ? JSON.stringify(memoryIds) : null,
    voiceRecordingId || null,
    theme || 'CLASSIC',
    backgroundMusic || null
  ).run();

  const artifact = await c.env.DB.prepare(
    'SELECT * FROM story_artifacts WHERE id = ?'
  ).bind(artifactId).first();

  return c.json({ artifact }, 201);
});

// ============================================
// UPDATE ARTIFACT
// ============================================
storyArtifactsRoutes.patch('/:artifactId', async (c) => {
  const userId = c.get('userId');
  const artifactId = c.req.param('artifactId');
  const body = await c.req.json();

  const artifact = await c.env.DB.prepare(
    'SELECT * FROM story_artifacts WHERE id = ? AND user_id = ?'
  ).bind(artifactId, userId).first();

  if (!artifact) {
    return c.json({ error: 'Artifact not found' }, 404);
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.title) {
    updates.push('title = ?');
    values.push(body.title);
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    values.push(body.description);
  }
  if (body.memoryIds) {
    updates.push('memory_ids = ?');
    values.push(JSON.stringify(body.memoryIds));
  }
  if (body.voiceRecordingId !== undefined) {
    updates.push('voice_recording_id = ?');
    values.push(body.voiceRecordingId);
  }
  if (body.theme) {
    updates.push('theme = ?');
    values.push(body.theme);
  }
  if (body.backgroundMusic !== undefined) {
    updates.push('background_music = ?');
    values.push(body.backgroundMusic);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(artifactId, userId);
    
    await c.env.DB.prepare(`
      UPDATE story_artifacts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?
    `).bind(...values).run();
  }

  const updated = await c.env.DB.prepare(
    'SELECT * FROM story_artifacts WHERE id = ?'
  ).bind(artifactId).first();

  return c.json({ artifact: updated });
});

// ============================================
// GENERATE ARTIFACT
// ============================================
storyArtifactsRoutes.post('/:artifactId/generate', async (c) => {
  const userId = c.get('userId');
  const artifactId = c.req.param('artifactId');

  const artifact = await c.env.DB.prepare(
    'SELECT * FROM story_artifacts WHERE id = ? AND user_id = ?'
  ).bind(artifactId, userId).first();

  if (!artifact) {
    return c.json({ error: 'Artifact not found' }, 404);
  }

  // Update status to processing
  await c.env.DB.prepare(`
    UPDATE story_artifacts SET status = 'PROCESSING', updated_at = datetime('now') WHERE id = ?
  `).bind(artifactId).run();

  // In a real implementation, this would trigger a video generation job
  // For now, we'll simulate by setting to READY after a delay
  // The actual generation would be done by a separate worker/queue

  // Simulate completion (in production, this would be async)
  await c.env.DB.prepare(`
    UPDATE story_artifacts SET status = 'READY', generated_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
  `).bind(artifactId).run();

  const updated = await c.env.DB.prepare(
    'SELECT * FROM story_artifacts WHERE id = ?'
  ).bind(artifactId).first();

  return c.json({ 
    artifact: updated,
    message: 'Artifact generation started. Check back soon for the result.',
  });
});

// ============================================
// DELETE ARTIFACT
// ============================================
storyArtifactsRoutes.delete('/:artifactId', async (c) => {
  const userId = c.get('userId');
  const artifactId = c.req.param('artifactId');

  const artifact = await c.env.DB.prepare(
    'SELECT * FROM story_artifacts WHERE id = ? AND user_id = ?'
  ).bind(artifactId, userId).first();

  if (!artifact) {
    return c.json({ error: 'Artifact not found' }, 404);
  }

  await c.env.DB.prepare(
    'DELETE FROM story_artifacts WHERE id = ? AND user_id = ?'
  ).bind(artifactId, userId).run();

  return c.json({ success: true });
});

// ============================================
// SHARE ARTIFACT
// ============================================
storyArtifactsRoutes.post('/:artifactId/share', async (c) => {
  const userId = c.get('userId');
  const artifactId = c.req.param('artifactId');
  const body = await c.req.json();

  const artifact = await c.env.DB.prepare(
    'SELECT * FROM story_artifacts WHERE id = ? AND user_id = ?'
  ).bind(artifactId, userId).first();

  if (!artifact) {
    return c.json({ error: 'Artifact not found' }, 404);
  }

  if (artifact.status !== 'READY') {
    return c.json({ error: 'Artifact must be ready before sharing' }, 400);
  }

  const shareToken = crypto.randomUUID();
  const expiresAt = body.expiresInDays 
    ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  await c.env.DB.prepare(`
    UPDATE story_artifacts SET share_token = ?, share_expires_at = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(shareToken, expiresAt, artifactId).run();

  return c.json({ 
    shareUrl: `/story/${shareToken}`,
    expiresAt,
  });
});

// ============================================
// VIEW SHARED ARTIFACT (PUBLIC)
// ============================================
storyArtifactsRoutes.get('/view/:token', async (c) => {
  const token = c.req.param('token');

  const artifact = await c.env.DB.prepare(`
    SELECT sa.*, u.first_name, u.last_name 
    FROM story_artifacts sa 
    JOIN users u ON sa.user_id = u.id 
    WHERE sa.share_token = ? AND sa.status = 'READY'
  `).bind(token).first();

  if (!artifact) {
    return c.json({ error: 'Artifact not found' }, 404);
  }

  // Check expiration
  if (artifact.share_expires_at && new Date(artifact.share_expires_at as string) < new Date()) {
    return c.json({ error: 'Share link has expired' }, 410);
  }

  // Get memories
  const memoryIds = artifact.memory_ids ? JSON.parse(artifact.memory_ids as string) : [];
  let memories: unknown[] = [];
  if (memoryIds.length > 0) {
    const placeholders = memoryIds.map(() => '?').join(',');
    const memoriesResult = await c.env.DB.prepare(
      `SELECT id, title, file_url, thumbnail_url FROM memories WHERE id IN (${placeholders})`
    ).bind(...memoryIds).all();
    memories = memoriesResult.results || [];
  }

  return c.json({
    artifact: {
      title: artifact.title,
      description: artifact.description,
      theme: artifact.theme,
      backgroundMusic: artifact.background_music,
      outputUrl: artifact.output_url,
      creatorName: `${artifact.first_name} ${artifact.last_name}`,
    },
    memories,
  });
});

export default storyArtifactsRoutes;
