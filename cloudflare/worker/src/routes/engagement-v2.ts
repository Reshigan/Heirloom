/**
 * Engagement V2 Routes - Heirloom v2
 * Legacy Score, Family Feed, On This Day, Public Stats
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';

export const engagementV2Routes = new Hono<AppEnv>();

// Legacy Score - AI-powered metric (0-100)
engagementV2Routes.get('/legacy-score', async (c) => {
  const userId = c.get('userId');
  const now = new Date().toISOString();

  // Check if we have a cached score from today
  const cached = await c.env.DB.prepare(`
    SELECT * FROM legacy_scores WHERE user_id = ? AND computed_at > datetime('now', '-1 day')
    ORDER BY computed_at DESC LIMIT 1
  `).bind(userId).first();

  if (cached) {
    return c.json({
      score: cached.score,
      completed_items: JSON.parse((cached.completed_items as string) || '[]'),
      computed_at: cached.computed_at,
    });
  }

  // Compute score from scratch
  const rules = [
    { key: 'first_family', points: 10, query: `SELECT COUNT(*) as c FROM family_members WHERE user_id = ?` },
    { key: 'first_voice', points: 15, query: `SELECT COUNT(*) as c FROM voice_recordings WHERE user_id = ?` },
    { key: 'first_letter', points: 10, query: `SELECT COUNT(*) as c FROM letters WHERE user_id = ?` },
    { key: 'first_memory', points: 10, query: `SELECT COUNT(*) as c FROM memories WHERE user_id = ?` },
    { key: 'five_memories', points: 10, query: `SELECT CASE WHEN COUNT(*) >= 5 THEN 1 ELSE 0 END as c FROM memories WHERE user_id = ?` },
    { key: 'legacy_contact', points: 15, query: `SELECT COUNT(*) as c FROM legacy_contacts WHERE user_id = ?` },
    { key: 'dead_mans_switch', points: 10, query: `SELECT COUNT(*) as c FROM dead_mans_switches WHERE user_id = ? AND is_active = 1` },
    { key: 'encryption_setup', points: 10, query: `SELECT COUNT(*) as c FROM encryption_keys WHERE user_id = ?` },
    { key: 'profile_complete', points: 5, query: `SELECT CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND avatar_url IS NOT NULL THEN 1 ELSE 0 END as c FROM users WHERE id = ?` },
    { key: 'ten_voices', points: 5, query: `SELECT CASE WHEN COUNT(*) >= 10 THEN 1 ELSE 0 END as c FROM voice_recordings WHERE user_id = ?` },
  ];

  let totalScore = 0;
  const completedItems: string[] = [];

  for (const rule of rules) {
    try {
      const result = await c.env.DB.prepare(rule.query).bind(userId).first();
      const count = (result?.c as number) || 0;
      if (count > 0) {
        totalScore += rule.points;
        completedItems.push(rule.key);
      }
    } catch {
      // Table might not exist yet, skip
    }
  }

  // Cap at 100
  totalScore = Math.min(totalScore, 100);

  // Cache the score
  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(`
      INSERT INTO legacy_scores (id, user_id, score, completed_items, computed_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, userId, totalScore, JSON.stringify(completedItems), now).run();
  } catch {
    // Table might not exist yet
  }

  return c.json({
    score: totalScore,
    completed_items: completedItems,
    computed_at: now,
  });
});

// Family Feed - activity from family members
engagementV2Routes.get('/family-feed', async (c) => {
  const userId = c.get('userId');

  // Get family member IDs who share content with this user
  const familyResult = await c.env.DB.prepare(`
    SELECT DISTINCT fm2.user_id 
    FROM family_members fm1
    JOIN family_members fm2 ON fm1.user_id != fm2.user_id
    WHERE fm1.user_id = ? AND fm2.user_id IS NOT NULL
  `).bind(userId).all();

  const familyUserIds = familyResult.results.map((f: any) => f.user_id).filter(Boolean);

  if (familyUserIds.length === 0) {
    return c.json([]);
  }

  // Get recent activity from family members
  const placeholders = familyUserIds.map(() => '?').join(',');

  const memories = await c.env.DB.prepare(`
    SELECT m.id, m.title, m.description, m.created_at, m.user_id, 
           u.first_name, u.last_name, u.avatar_url,
           'memory' as type
    FROM memories m
    JOIN users u ON m.user_id = u.id
    WHERE m.user_id IN (${placeholders})
    ORDER BY m.created_at DESC
    LIMIT 20
  `).bind(...familyUserIds).all();

  const voices = await c.env.DB.prepare(`
    SELECT v.id, v.title, v.transcript as description, v.created_at, v.user_id,
           u.first_name, u.last_name, u.avatar_url,
           'voice' as type
    FROM voice_recordings v
    JOIN users u ON v.user_id = u.id
    WHERE v.user_id IN (${placeholders})
    ORDER BY v.created_at DESC
    LIMIT 20
  `).bind(...familyUserIds).all();

  const letters = await c.env.DB.prepare(`
    SELECT l.id, l.subject as title, l.body as description, l.created_at, l.user_id,
           u.first_name, u.last_name, u.avatar_url,
           'letter' as type
    FROM letters l
    JOIN users u ON l.user_id = u.id
    WHERE l.user_id IN (${placeholders})
    ORDER BY l.created_at DESC
    LIMIT 20
  `).bind(...familyUserIds).all();

  // Merge and sort by date
  const feed = [...memories.results, ...voices.results, ...letters.results]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30);

  return c.json(feed);
});

// Public stats endpoint
engagementV2Routes.get('/public/stats', async (c) => {
  try {
    const memoriesCount = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM memories`).first();
    const voicesCount = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM voice_recordings`).first();
    const lettersCount = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM letters`).first();
    const usersCount = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM users`).first();

    return c.json({
      memories_preserved: ((memoriesCount?.count as number) || 0) + ((voicesCount?.count as number) || 0) + ((lettersCount?.count as number) || 0),
      families_connected: (usersCount?.count as number) || 0,
    });
  } catch {
    return c.json({ memories_preserved: 0, families_connected: 0 });
  }
});

export default engagementV2Routes;
