/**
 * Wrapped Routes - Cloudflare Workers
 * Handles year-in-review (Wrapped) data generation and retrieval
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const wrappedRoutes = new Hono<{ Bindings: Env }>();

// Get wrapped data for current year (must be before /:year to avoid matching "current" as a year)
wrappedRoutes.get('/current', async (c) => {
  const userId = c.get('userId');
  const currentYear = new Date().getFullYear();
  
  // Check if wrapped data exists for current year
  let wrapped = await c.env.DB.prepare(`
    SELECT * FROM wrapped_data WHERE user_id = ? AND year = ?
  `).bind(userId, currentYear).first();
  
  if (!wrapped) {
    // Generate wrapped data for current year
    wrapped = await generateWrappedData(c.env.DB, userId, currentYear);
  }
  
  return c.json({
    id: wrapped.id,
    year: wrapped.year,
    totalMemories: wrapped.total_memories,
    totalVoiceStories: wrapped.total_voice_stories,
    totalLetters: wrapped.total_letters,
    totalStorage: wrapped.total_storage,
    longestStreak: wrapped.longest_streak,
    currentStreak: wrapped.current_streak,
    topEmotions: wrapped.top_emotions ? JSON.parse(wrapped.top_emotions as string) : [],
    topTaggedPeople: wrapped.top_tagged_people ? JSON.parse(wrapped.top_tagged_people as string) : [],
    highlights: wrapped.highlights ? JSON.parse(wrapped.highlights as string) : [],
    summary: wrapped.summary,
    generatedAt: wrapped.generated_at,
  });
});

// Get wrapped data for a specific year
wrappedRoutes.get('/:year', async (c) => {
  const userId = c.get('userId');
  const year = parseInt(c.req.param('year'));
  
  if (isNaN(year) || year < 2020 || year > new Date().getFullYear()) {
    return c.json({ error: 'Invalid year' }, 400);
  }
  
  // Check if wrapped data exists
  let wrapped = await c.env.DB.prepare(`
    SELECT * FROM wrapped_data WHERE user_id = ? AND year = ?
  `).bind(userId, year).first();
  
  if (!wrapped) {
    // Generate wrapped data
    wrapped = await generateWrappedData(c.env.DB, userId, year);
  }
  
  return c.json({
    id: wrapped.id,
    year: wrapped.year,
    totalMemories: wrapped.total_memories,
    totalVoiceStories: wrapped.total_voice_stories,
    totalLetters: wrapped.total_letters,
    totalStorage: wrapped.total_storage,
    longestStreak: wrapped.longest_streak,
    currentStreak: wrapped.current_streak,
    topEmotions: wrapped.top_emotions ? JSON.parse(wrapped.top_emotions as string) : [],
    topTaggedPeople: wrapped.top_tagged_people ? JSON.parse(wrapped.top_tagged_people as string) : [],
    highlights: wrapped.highlights ? JSON.parse(wrapped.highlights as string) : [],
    summary: wrapped.summary,
    generatedAt: wrapped.generated_at,
  });
});

// Get available years for wrapped
wrappedRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  
  // Get years with activity
  const memoriesYears = await c.env.DB.prepare(`
    SELECT DISTINCT strftime('%Y', created_at) as year FROM memories WHERE user_id = ?
  `).bind(userId).all();
  
  const lettersYears = await c.env.DB.prepare(`
    SELECT DISTINCT strftime('%Y', created_at) as year FROM letters WHERE user_id = ?
  `).bind(userId).all();
  
  const voiceYears = await c.env.DB.prepare(`
    SELECT DISTINCT strftime('%Y', created_at) as year FROM voice_recordings WHERE user_id = ?
  `).bind(userId).all();
  
  // Combine and deduplicate years
  const allYears = new Set<number>();
  [...memoriesYears.results, ...lettersYears.results, ...voiceYears.results].forEach((r: any) => {
    if (r.year) allYears.add(parseInt(r.year));
  });
  
  const years = Array.from(allYears).sort((a, b) => b - a);
  
  // Check which years have wrapped data generated
  const wrappedYears = await c.env.DB.prepare(`
    SELECT year, generated_at FROM wrapped_data WHERE user_id = ?
  `).bind(userId).all();
  
  const wrappedMap = new Map(wrappedYears.results.map((w: any) => [w.year, w.generated_at]));
  
  return c.json({
    availableYears: years.map(year => ({
      year,
      hasData: true,
      wrappedGenerated: wrappedMap.has(year),
      generatedAt: wrappedMap.get(year) || null,
    })),
  });
});

// Regenerate wrapped data for a year
wrappedRoutes.post('/:year/regenerate', async (c) => {
  const userId = c.get('userId');
  const year = parseInt(c.req.param('year'));
  
  if (isNaN(year) || year < 2020 || year > new Date().getFullYear()) {
    return c.json({ error: 'Invalid year' }, 400);
  }
  
  // Delete existing wrapped data
  await c.env.DB.prepare(`
    DELETE FROM wrapped_data WHERE user_id = ? AND year = ?
  `).bind(userId, year).run();
  
  // Generate new wrapped data
  const wrapped = await generateWrappedData(c.env.DB, userId, year);
  
  return c.json({
    id: wrapped.id,
    year: wrapped.year,
    totalMemories: wrapped.total_memories,
    totalVoiceStories: wrapped.total_voice_stories,
    totalLetters: wrapped.total_letters,
    totalStorage: wrapped.total_storage,
    longestStreak: wrapped.longest_streak,
    currentStreak: wrapped.current_streak,
    topEmotions: wrapped.top_emotions ? JSON.parse(wrapped.top_emotions as string) : [],
    topTaggedPeople: wrapped.top_tagged_people ? JSON.parse(wrapped.top_tagged_people as string) : [],
    highlights: wrapped.highlights ? JSON.parse(wrapped.highlights as string) : [],
    summary: wrapped.summary,
    generatedAt: wrapped.generated_at,
    message: 'Wrapped data regenerated successfully',
  });
});

// Helper function to generate wrapped data
async function generateWrappedData(db: D1Database, userId: string, year: number) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  // Get memory stats
  const memoryStats = await db.prepare(`
    SELECT 
      COUNT(*) as count,
      COALESCE(SUM(file_size), 0) as storage
    FROM memories 
    WHERE user_id = ? AND created_at >= ? AND created_at <= ?
  `).bind(userId, startDate, endDate).first();
  
  // Get letter stats
  const letterStats = await db.prepare(`
    SELECT COUNT(*) as count
    FROM letters 
    WHERE user_id = ? AND created_at >= ? AND created_at <= ?
  `).bind(userId, startDate, endDate).first();
  
  // Get voice stats
  const voiceStats = await db.prepare(`
    SELECT 
      COUNT(*) as count,
      COALESCE(SUM(file_size), 0) as storage
    FROM voice_recordings 
    WHERE user_id = ? AND created_at >= ? AND created_at <= ?
  `).bind(userId, startDate, endDate).first();
  
  // Get top emotions from memories metadata
  const emotions = await db.prepare(`
    SELECT metadata FROM memories 
    WHERE user_id = ? AND created_at >= ? AND created_at <= ? AND metadata IS NOT NULL
  `).bind(userId, startDate, endDate).all();
  
  const emotionCounts: Record<string, number> = {};
  emotions.results.forEach((m: any) => {
    try {
      const meta = JSON.parse(m.metadata);
      if (meta.emotion) {
        emotionCounts[meta.emotion] = (emotionCounts[meta.emotion] || 0) + 1;
      }
    } catch (e) {}
  });
  
  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emotion, count]) => ({ emotion, count }));
  
  // Get top tagged people (family members)
  const taggedPeople = await db.prepare(`
    SELECT fm.name, COUNT(*) as count
    FROM memory_recipients mr
    JOIN family_members fm ON mr.family_member_id = fm.id
    JOIN memories m ON mr.memory_id = m.id
    WHERE m.user_id = ? AND m.created_at >= ? AND m.created_at <= ?
    GROUP BY fm.id
    ORDER BY count DESC
    LIMIT 5
  `).bind(userId, startDate, endDate).all();
  
  // Calculate streaks (simplified - based on days with activity)
  const activityDays = await db.prepare(`
    SELECT DISTINCT date(created_at) as day FROM (
      SELECT created_at FROM memories WHERE user_id = ? AND created_at >= ? AND created_at <= ?
      UNION ALL
      SELECT created_at FROM letters WHERE user_id = ? AND created_at >= ? AND created_at <= ?
      UNION ALL
      SELECT created_at FROM voice_recordings WHERE user_id = ? AND created_at >= ? AND created_at <= ?
    ) ORDER BY day
  `).bind(userId, startDate, endDate, userId, startDate, endDate, userId, startDate, endDate).all();
  
  let longestStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;
  
  activityDays.results.forEach((d: any) => {
    const date = new Date(d.day);
    if (prevDate) {
      const diff = (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    prevDate = date;
  });
  longestStreak = Math.max(longestStreak, currentStreak);
  
  // Get highlights (most recent/notable memories)
  const highlights = await db.prepare(`
    SELECT id, title, type, created_at FROM memories 
    WHERE user_id = ? AND created_at >= ? AND created_at <= ?
    ORDER BY created_at DESC
    LIMIT 10
  `).bind(userId, startDate, endDate).all();
  
  // Generate summary
  const totalItems = ((memoryStats?.count as number) || 0) + ((letterStats?.count as number) || 0) + ((voiceStats?.count as number) || 0);
  const summary = totalItems > 0 
    ? `In ${year}, you created ${memoryStats?.count || 0} memories, wrote ${letterStats?.count || 0} letters, and recorded ${voiceStats?.count || 0} voice stories. Your longest streak was ${longestStreak} days of consecutive activity.`
    : `No activity recorded for ${year}.`;
  
  // Save wrapped data
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const totalStorage = ((memoryStats?.storage as number) || 0) + ((voiceStats?.storage as number) || 0);
  
  await db.prepare(`
    INSERT INTO wrapped_data (id, user_id, year, total_memories, total_voice_stories, total_letters, total_storage, longest_streak, current_streak, top_emotions, top_tagged_people, highlights, summary, generated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    userId,
    year,
    memoryStats?.count || 0,
    voiceStats?.count || 0,
    letterStats?.count || 0,
    totalStorage,
    longestStreak,
    currentStreak,
    JSON.stringify(topEmotions),
    JSON.stringify(taggedPeople.results.map((p: any) => ({ name: p.name, count: p.count }))),
    JSON.stringify(highlights.results.map((h: any) => ({ id: h.id, title: h.title, type: h.type, date: h.created_at }))),
    summary,
    now
  ).run();
  
  return {
    id,
    year,
    total_memories: memoryStats?.count || 0,
    total_voice_stories: voiceStats?.count || 0,
    total_letters: letterStats?.count || 0,
    total_storage: totalStorage,
    longest_streak: longestStreak,
    current_streak: currentStreak,
    top_emotions: JSON.stringify(topEmotions),
    top_tagged_people: JSON.stringify(taggedPeople.results.map((p: any) => ({ name: p.name, count: p.count }))),
    highlights: JSON.stringify(highlights.results.map((h: any) => ({ id: h.id, title: h.title, type: h.type, date: h.created_at }))),
    summary,
    generated_at: now,
  };
}
