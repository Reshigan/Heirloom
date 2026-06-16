/**
 * Memory Cards Routes
 * Shareable, Instagram-ready cards generated from memories
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { readDescription } from '../lib/legacyArchive';

export const memoryCardsRoutes = new Hono<AppEnv>();

// Card styles — every share card is the brand's public face, so all draw from
// the one constitution palette (ink #0e0e0c · bone #f4ecd8 · warm #b07a4a /
// bright #cf935a / dim #8c5a30). The styles vary ground (ink "vault" vs paper
// "bone") and accent weight, never hue. The ids are stable (stored on existing
// cards); only the colors changed from the pre-migration gold/purple/pink set.
const CARD_STYLES = {
  quote: {
    name: 'The Archive',
    description: 'Bone serif on deep ink — the house style',
    bgColor: '#0e0e0c',
    textColor: '#f4ecd8',
    accentColor: '#b07a4a',
  },
  polaroid: {
    name: 'Paper',
    description: 'Ink on warm paper, like a page from the book',
    bgColor: '#f4ecd8',
    textColor: '#1a1712',
    accentColor: '#8c5a30',
  },
  vintage: {
    name: 'Aged Leaf',
    description: 'Sun-faded paper and walnut ink',
    bgColor: '#e9dcc0',
    textColor: '#2a2118',
    accentColor: '#8c5a30',
  },
  modern: {
    name: 'Nightfall',
    description: 'Deep ink with a bright sealing-wax mark',
    bgColor: '#0e0e0c',
    textColor: '#f4ecd8',
    accentColor: '#cf935a',
  },
  holiday: {
    name: 'Hearth',
    description: 'A warm-dark ground for a gathered season',
    bgColor: '#14110c',
    textColor: '#f4ecd8',
    accentColor: '#cf935a',
  },
  mothers_day: {
    name: "Mother's Day",
    description: 'Soft paper with a quiet warm accent',
    bgColor: '#f4ecd8',
    textColor: '#2a2118',
    accentColor: '#b07a4a',
  },
  fathers_day: {
    name: "Father's Day",
    description: 'Deep ink with a steady warm accent',
    bgColor: '#0e0e0c',
    textColor: '#f4ecd8',
    accentColor: '#b07a4a',
  },
};

// Get available card styles
memoryCardsRoutes.get('/styles', async (c) => {
  return c.json({
    styles: Object.entries(CARD_STYLES).map(([id, style]) => ({
      id,
      ...style,
    })),
  });
});

// Generate a memory card
memoryCardsRoutes.post('/generate', async (c) => {
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const body = await c.req.json();
  const { memoryId, style, customText, includePhoto } = body;
  
  if (!memoryId) {
    return c.json({ error: 'Memory ID is required' }, 400);
  }
  
  const cardStyle = style || 'quote';
  if (!CARD_STYLES[cardStyle as keyof typeof CARD_STYLES]) {
    return c.json({ error: 'Invalid card style' }, 400);
  }
  
  try {
    // Get the memory
    const memory = await c.env.DB.prepare(`
      SELECT m.*, u.first_name, u.last_name
      FROM memories m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ? AND m.user_id = ? AND m.deleted_at IS NULL
    `).bind(memoryId, userId).first();
    
    if (!memory) {
      return c.json({ error: 'Memory not found' }, 404);
    }
    
    // Get memory photo if requested
    let photoUrl = null;
    if (includePhoto !== false) {
      const photo = await c.env.DB.prepare(`
        SELECT file_key FROM memory_files WHERE memory_id = ? AND file_type LIKE 'image/%' LIMIT 1
      `).bind(memoryId).first();
      
      if (photo) {
        photoUrl = `https://api.heirloom.blue/api/files/${photo.file_key}`;
      }
    }
    
    // Extract quote from memory
    const description = (await readDescription(c.env, memory)) || '';
    const title = (memory.title as string) || '';
    const memoryDate = memory.memory_date ? new Date(memory.memory_date as string).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : null;
    
    // Use custom text or extract a quote from description
    let quote = customText;
    if (!quote) {
      // Try to extract a meaningful quote (first 2-3 sentences, max 200 chars)
      const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (sentences.length > 0) {
        quote = sentences.slice(0, 2).join('. ').trim();
        if (quote.length > 200) {
          quote = quote.substring(0, 197) + '...';
        }
        if (!quote.endsWith('.') && !quote.endsWith('!') && !quote.endsWith('?')) {
          quote += '.';
        }
      } else {
        quote = title || 'A precious memory...';
      }
    }
    
    // Generate card ID and store
    const cardId = crypto.randomUUID();
    const now = new Date().toISOString();
    const authorName = `${memory.first_name || ''} ${memory.last_name || ''}`.trim() || 'Anonymous';
    
    await c.env.DB.prepare(`
      INSERT INTO memory_cards (id, user_id, memory_id, style, quote_text, photo_url, author_name, memory_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(cardId, userId, memoryId, cardStyle, quote, photoUrl, authorName, memoryDate, now).run();
    
    // Generate share URL
    const shareUrl = `https://heirloom.blue/card/${cardId}`;
    const shareText = `"${quote.substring(0, 100)}${quote.length > 100 ? '...' : ''}" - A memory preserved on Heirloom`;
    
    return c.json({
      id: cardId,
      style: cardStyle,
      styleConfig: CARD_STYLES[cardStyle as keyof typeof CARD_STYLES],
      quote,
      photoUrl,
      authorName,
      memoryDate,
      memoryTitle: title,
      shareUrl,
      shareText,
      socialShareUrls: {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      },
    });
  } catch (error) {
    console.error('Memory card generation error:', error);
    return c.json({ error: 'Failed to generate memory card' }, 500);
  }
});

// Get user's generated cards
memoryCardsRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const cards = await c.env.DB.prepare(`
    SELECT mc.*, m.title as memory_title
    FROM memory_cards mc
    JOIN memories m ON mc.memory_id = m.id
    WHERE mc.user_id = ?
    ORDER BY mc.created_at DESC
    LIMIT 50
  `).bind(userId).all();
  
  return c.json({
    cards: cards.results.map((card: any) => ({
      id: card.id,
      memoryId: card.memory_id,
      memoryTitle: card.memory_title,
      style: card.style,
      quote: card.quote_text,
      photoUrl: card.photo_url,
      authorName: card.author_name,
      memoryDate: card.memory_date,
      shareUrl: `https://heirloom.blue/card/${card.id}`,
      sharedAt: card.shared_at,
      shareCount: card.share_count || 0,
      createdAt: card.created_at,
    })),
  });
});

// ============================================
// ON THIS DAY FEATURE (must be before /:id to avoid route conflict)
// ============================================

// Get "On This Day" memories
memoryCardsRoutes.get('/on-this-day', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const mm = month.toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');

    // Find memories written on this date in previous years (memories table has no
    // memory_date column — created_at is the only date field available)
    const memories = await c.env.DB.prepare(`
      SELECT m.*,
             strftime('%Y', m.created_at) as created_year,
             (strftime('%Y', 'now') - strftime('%Y', m.created_at)) as years_ago
      FROM memories m
      WHERE m.user_id = ?
        AND m.deleted_at IS NULL
        AND strftime('%m', m.created_at) = ?
        AND strftime('%d', m.created_at) = ?
        AND strftime('%Y', m.created_at) < strftime('%Y', 'now')
      ORDER BY m.created_at DESC
      LIMIT 10
    `).bind(userId, mm, dd).all();

    // Get photos for memories
    const memoryIds = memories.results.map((m: any) => m.id);
    let photosMap: Record<string, string> = {};

    if (memoryIds.length > 0) {
      const photos = await c.env.DB.prepare(`
        SELECT memory_id, file_key FROM memory_files
        WHERE memory_id IN (${memoryIds.map(() => '?').join(',')})
        AND file_type LIKE 'image/%'
      `).bind(...memoryIds).all();

      photos.results.forEach((p: any) => {
        if (!photosMap[p.memory_id]) {
          photosMap[p.memory_id] = `https://api.heirloom.blue/api/files/${p.file_key}`;
        }
      });
    }

    const formatMemory = async (m: any) => {
      const d = (await readDescription(c.env, m)) || '';
      return {
        id: m.id,
        title: m.title,
        description: d.substring(0, 200) + (d.length > 200 ? '...' : ''),
        photoUrl: photosMap[m.id] || null,
        yearsAgo: m.years_ago,
        year: m.created_year,
        type: 'memory',
        date: m.created_at,
      };
    };

    const formatted = await Promise.all(memories.results.map((m: any) => formatMemory(m)));

    return c.json({
      date: today.toISOString().split('T')[0],
      displayDate: `${today.toLocaleString('en-US', { month: 'long' })} ${day}`,
      memoriesFromThisDay: formatted,
      createdOnThisDay: [],
      hasMemories: memories.results.length > 0,
    });
  } catch (err: any) {
    console.error('[on-this-day] failed:', err?.message ?? err);
    return c.json({ error: 'Failed to load on-this-day data' }, 500);
  }
});

// Get a specific card (public endpoint for sharing)
memoryCardsRoutes.get('/:id', async (c) => {
  const cardId = c.req.param('id');
  
  const card = await c.env.DB.prepare(`
    SELECT mc.*, m.title as memory_title
    FROM memory_cards mc
    JOIN memories m ON mc.memory_id = m.id
    WHERE mc.id = ?
  `).bind(cardId).first();
  
  if (!card) {
    return c.json({ error: 'Card not found' }, 404);
  }
  
  // Increment view count
  await c.env.DB.prepare(`
    UPDATE memory_cards SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?
  `).bind(cardId).run();
  
  return c.json({
    id: card.id,
    style: card.style,
    styleConfig: CARD_STYLES[card.style as keyof typeof CARD_STYLES] || CARD_STYLES.quote,
    quote: card.quote_text,
    photoUrl: card.photo_url,
    authorName: card.author_name,
    memoryDate: card.memory_date,
    memoryTitle: card.memory_title,
    shareUrl: `https://heirloom.blue/card/${card.id}`,
  });
});

// Record share action
memoryCardsRoutes.post('/:id/share', async (c) => {
  const cardId = c.req.param('id');
  const body = await c.req.json();
  const platform = body.platform || 'unknown';
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE memory_cards 
    SET share_count = COALESCE(share_count, 0) + 1, 
        shared_at = COALESCE(shared_at, ?),
        last_shared_platform = ?
    WHERE id = ?
  `).bind(now, platform, cardId).run();
  
  return c.json({ success: true });
});

// Delete a card
memoryCardsRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const cardId = c.req.param('id');
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await c.env.DB.prepare(`
    DELETE FROM memory_cards WHERE id = ? AND user_id = ?
  `).bind(cardId, userId).run();
  
  return c.json({ success: true });
});

export default memoryCardsRoutes;
