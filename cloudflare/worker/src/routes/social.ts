/**
 * Social Posting Admin Routes
 * Admin endpoints for managing the social content calendar
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';

export const socialRoutes = new Hono<AppEnv>();

// POST /bulk-load - Load posts for a week from the content calendar
socialRoutes.post('/bulk-load', async (c) => {
  const body = await c.req.json();
  // body: { week: 1, startDate: "2026-04-14", posts: [...] }

  if (!body.week || !body.startDate || !body.posts || !Array.isArray(body.posts)) {
    return c.json({ error: 'week, startDate, and posts[] are required' }, 400);
  }

  const times = ['14:00', '16:00', '14:00', '16:00', '17:00']; // UTC times (SAST - 2)
  const now = new Date().toISOString();

  for (let i = 0; i < body.posts.length; i++) {
    const post = body.posts[i];
    const postDate = new Date(body.startDate);
    postDate.setDate(postDate.getDate() + i);
    const [hours, minutes] = times[i % times.length].split(':');
    postDate.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO social_posts (id, platforms, content, scheduled_at, campaign_week, pillar, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
    `).bind(
      id,
      JSON.stringify(post.platforms || ['tiktok', 'instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'threads']),
      JSON.stringify(post.content),
      postDate.toISOString(),
      body.week,
      post.pillar || 'general',
      now,
      now
    ).run();
  }

  return c.json({ loaded: body.posts.length, week: body.week });
});

// GET /calendar - Returns scheduled posts for admin dashboard
socialRoutes.get('/calendar', async (c) => {
  const week = c.req.query('week');
  const status = c.req.query('status');

  let query: string;
  const bindings: any[] = [];

  if (week) {
    query = `SELECT * FROM social_posts WHERE campaign_week = ?`;
    bindings.push(parseInt(week));
    if (status) {
      query += ` AND status = ?`;
      bindings.push(status);
    }
    query += ` ORDER BY scheduled_at ASC`;
  } else {
    query = `SELECT * FROM social_posts`;
    if (status) {
      query += ` WHERE status = ?`;
      bindings.push(status);
    }
    query += ` ORDER BY scheduled_at DESC LIMIT 50`;
  }

  const stmt = c.env.DB.prepare(query);
  const result = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();

  // Parse JSON fields for frontend
  const posts = result.results.map((post: any) => ({
    ...post,
    platforms: JSON.parse(post.platforms || '[]'),
    content: JSON.parse(post.content || '{}'),
  }));

  return c.json({ posts });
});

// GET /stats - Quick stats for admin dashboard
socialRoutes.get('/stats', async (c) => {
  const total = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM social_posts`).first();
  const published = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM social_posts WHERE status = 'published'`).first();
  const scheduled = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM social_posts WHERE status = 'scheduled'`).first();
  const failed = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM social_posts WHERE status = 'failed'`).first();
  const skipped = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM social_posts WHERE status = 'skipped'`).first();

  // Get latest published posts
  const recent = await c.env.DB.prepare(`
    SELECT id, platforms, content, published_at, campaign_week, pillar
    FROM social_posts WHERE status = 'published'
    ORDER BY published_at DESC LIMIT 5
  `).all();

  return c.json({
    total: (total?.count as number) || 0,
    published: (published?.count as number) || 0,
    scheduled: (scheduled?.count as number) || 0,
    failed: (failed?.count as number) || 0,
    skipped: (skipped?.count as number) || 0,
    recentPublished: recent.results,
  });
});

// POST /pause/:id - Mark a post as skipped
socialRoutes.post('/pause/:id', async (c) => {
  const id = c.req.param('id');
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    UPDATE social_posts SET status = 'skipped', updated_at = ? WHERE id = ?
  `).bind(now, id).run();
  return c.json({ success: true });
});

// POST /retry/:id - Reset a failed post to scheduled
socialRoutes.post('/retry/:id', async (c) => {
  const id = c.req.param('id');
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    UPDATE social_posts SET status = 'scheduled', error = NULL, retry_count = 0, updated_at = ?
    WHERE id = ?
  `).bind(now, id).run();
  return c.json({ success: true });
});

// DELETE /:id - Delete a scheduled post
socialRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM social_posts WHERE id = ?`).bind(id).run();
  return c.json({ success: true });
});

// POST /upload-asset - Upload video asset to R2
socialRoutes.post('/upload-asset', async (c) => {
  const body = await c.req.json();
  // body: { week: 1, day: "monday", filename: "mon-tiktok.mp4", contentType: "video/mp4" }

  if (!body.week || !body.day || !body.filename || !body.contentType) {
    return c.json({ error: 'week, day, filename, and contentType are required' }, 400);
  }

  const key = `social-assets/w${body.week}/${body.day}-${body.filename}`;

  // Generate presigned upload URL for R2
  const uploadUrl = await c.env.STORAGE.createMultipartUpload(key);

  return c.json({
    key,
    uploadId: uploadUrl.uploadId,
    message: 'Use presigned URL to upload video asset',
  });
});

// GET /templates - List content templates
socialRoutes.get('/templates', async (c) => {
  const week = c.req.query('week');
  let result;
  if (week) {
    result = await c.env.DB.prepare(`
      SELECT * FROM social_templates WHERE week = ? ORDER BY day
    `).bind(parseInt(week)).all();
  } else {
    result = await c.env.DB.prepare(`
      SELECT * FROM social_templates ORDER BY week, day
    `).all();
  }

  return c.json({ templates: result.results });
});

// POST /templates - Create a content template
socialRoutes.post('/templates', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    INSERT INTO social_templates (id, week, day, pillar, content, video_key, platform_overrides, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.week,
    body.day,
    body.pillar,
    JSON.stringify(body.content),
    body.video_key || null,
    body.platform_overrides ? JSON.stringify(body.platform_overrides) : null,
    now
  ).run();

  return c.json({ id, success: true }, 201);
});

export default socialRoutes;
