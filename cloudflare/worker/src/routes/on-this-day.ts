/**
 * On This Day Route
 *
 * GET /api/on-this-day — memories, letters, and voice recordings created on
 * today's month/day in previous years, sorted by year descending.
 *
 * The /memory-cards/on-this-day endpoint covers memories only. This route
 * aggregates all three content kinds and is the surface for the OnThisDay
 * page when it migrates off the memory-cards path.
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { readDescription } from '../lib/legacyArchive';

export const onThisDayRoutes = new Hono<AppEnv>();

onThisDayRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  try {
    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');

    const [memories, letters, voices] = await Promise.all([
      c.env.DB.prepare(`
        SELECT id, title, description, description_enc, description_iv,
               created_at,
               strftime('%Y', created_at) as year,
               (strftime('%Y', 'now') - strftime('%Y', created_at)) as years_ago,
               'memory' as kind
        FROM memories
        WHERE user_id = ?
          AND deleted_at IS NULL
          AND strftime('%m', created_at) = ?
          AND strftime('%d', created_at) = ?
          AND strftime('%Y', created_at) < strftime('%Y', 'now')
        ORDER BY created_at DESC
        LIMIT 10
      `).bind(userId, mm, dd).all(),

      c.env.DB.prepare(`
        SELECT id, title, created_at,
               strftime('%Y', created_at) as year,
               (strftime('%Y', 'now') - strftime('%Y', created_at)) as years_ago,
               'letter' as kind
        FROM letters
        WHERE user_id = ?
          AND deleted_at IS NULL
          AND strftime('%m', created_at) = ?
          AND strftime('%d', created_at) = ?
          AND strftime('%Y', created_at) < strftime('%Y', 'now')
        ORDER BY created_at DESC
        LIMIT 10
      `).bind(userId, mm, dd).all(),

      c.env.DB.prepare(`
        SELECT id, title, created_at,
               strftime('%Y', created_at) as year,
               (strftime('%Y', 'now') - strftime('%Y', created_at)) as years_ago,
               'voice' as kind
        FROM voice_recordings
        WHERE user_id = ?
          AND deleted_at IS NULL
          AND strftime('%m', created_at) = ?
          AND strftime('%d', created_at) = ?
          AND strftime('%Y', created_at) < strftime('%Y', 'now')
        ORDER BY created_at DESC
        LIMIT 10
      `).bind(userId, mm, dd).all(),
    ]);

    // Resolve encrypted descriptions for memories.
    const formattedMemories = await Promise.all(
      (memories.results as any[]).map(async (m) => {
        const desc = (await readDescription(c.env, m)) || '';
        return {
          id: m.id,
          title: m.title,
          description: desc.substring(0, 200) + (desc.length > 200 ? '...' : ''),
          year: m.year,
          yearsAgo: Number(m.years_ago),
          kind: 'memory' as const,
          date: m.created_at,
        };
      }),
    );

    const formattedLetters = (letters.results as any[]).map((l) => ({
      id: l.id,
      title: l.title,
      description: null,
      year: l.year,
      yearsAgo: Number(l.years_ago),
      kind: 'letter' as const,
      date: l.created_at,
    }));

    const formattedVoices = (voices.results as any[]).map((v) => ({
      id: v.id,
      title: v.title,
      description: null,
      year: v.year,
      yearsAgo: Number(v.years_ago),
      kind: 'voice' as const,
      date: v.created_at,
    }));

    // Merge all kinds, sort by year desc (most recent past year first).
    const all = [...formattedMemories, ...formattedLetters, ...formattedVoices].sort(
      (a, b) => Number(b.year) - Number(a.year),
    );

    return c.json({
      date: today.toISOString().split('T')[0],
      displayDate: `${today.toLocaleString('en-US', { month: 'long' })} ${today.getDate()}`,
      items: all,
      hasItems: all.length > 0,
    });
  } catch (err: any) {
    console.error('[on-this-day] failed:', err?.message ?? err);
    return c.json({ error: 'Failed to load on-this-day data' }, 500);
  }
});
