/**
 * Loom Index Route
 *
 * GET /api/loom-index — aggregate overview for the authenticated user.
 *
 * Returns:
 *   - counts: total memories, letters, voice recordings
 *   - recent: the 10 most recently created entries across all three kinds,
 *             merged and sorted by created_at DESC
 *
 * The frontend LoomIndex page fetches the three collections individually via
 * memoriesApi / lettersApi / voiceApi, so this route is the lightweight
 * summary surface used by dashboard widgets and the PWA home screen.
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';

export const loomIndexRoutes = new Hono<AppEnv>();

loomIndexRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  try {
    // Counts — three lightweight queries run concurrently.
    const [memCount, letCount, voxCount] = await Promise.all([
      c.env.DB.prepare(`SELECT COUNT(*) as c FROM memories WHERE user_id = ? AND deleted_at IS NULL`)
        .bind(userId).first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) as c FROM letters WHERE user_id = ? AND deleted_at IS NULL`)
        .bind(userId).first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) as c FROM voice_recordings WHERE user_id = ? AND deleted_at IS NULL`)
        .bind(userId).first<{ c: number }>(),
    ]);

    // Recent entries — top 4 from each kind so we can merge-sort to 10.
    const [recentMem, recentLet, recentVox] = await Promise.all([
      c.env.DB.prepare(
        `SELECT id, title, created_at, 'memory' as kind FROM memories
         WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 4`,
      ).bind(userId).all(),
      c.env.DB.prepare(
        `SELECT id, title, created_at, 'letter' as kind FROM letters
         WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 4`,
      ).bind(userId).all(),
      c.env.DB.prepare(
        `SELECT id, title, created_at, 'voice' as kind FROM voice_recordings
         WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 4`,
      ).bind(userId).all(),
    ]);

    const recent = [
      ...recentMem.results,
      ...recentLet.results,
      ...recentVox.results,
    ]
      .sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 10);

    return c.json({
      counts: {
        memories: memCount?.c ?? 0,
        letters: letCount?.c ?? 0,
        voice: voxCount?.c ?? 0,
        total: (memCount?.c ?? 0) + (letCount?.c ?? 0) + (voxCount?.c ?? 0),
      },
      recent,
    });
  } catch (err: any) {
    console.error('[loom-index] failed:', err?.message ?? err);
    return c.json({ error: 'Failed to load loom index' }, 500);
  }
});
