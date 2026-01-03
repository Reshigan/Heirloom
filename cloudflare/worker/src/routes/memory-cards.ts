/**
 * Memory Cards Routes
 * Shareable, Instagram-ready cards generated from memories
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';

export const memoryCardsRoutes = new Hono<AppEnv>();

// Card styles available
const CARD_STYLES = {
  quote: {
    name: 'Quote Card',
    description: 'Memory excerpt with elegant typography',
    bgColor: '#0a0a0f',
    textColor: '#f5f5f0',
    accentColor: '#D4AF37',
  },
  polaroid: {
    name: 'Polaroid',
    description: 'Classic instant photo style',
    bgColor: '#ffffff',
    textColor: '#1a1a1a',
    accentColor: '#D4AF37',
  },
  vintage: {
    name: 'Vintage Postcard',
    description: 'Nostalgic postcard aesthetic',
    bgColor: '#f5e6d3',
    textColor: '#4a3728',
    accentColor: '#8b4513',
  },
  modern: {
    name: 'Modern Gradient',
    description: 'Contemporary gradient design',
    bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff',
    accentColor: '#ffd700',
  },
  holiday: {
    name: 'Holiday',
    description: 'Festive seasonal design',
    bgColor: '#1a472a',
    textColor: '#f5f5f0',
    accentColor: '#c41e3a',
  },
  mothers_day: {
    name: "Mother's Day",
    description: 'Soft floral design for mom',
    bgColor: '#fff0f5',
    textColor: '#8b4557',
    accentColor: '#ff69b4',
  },
  fathers_day: {
    name: "Father's Day",
    description: 'Classic design for dad',
    bgColor: '#1a365d',
    textColor: '#f5f5f0',
    accentColor: '#4299e1',
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
      WHERE m.id = ? AND m.user_id = ?
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
    const description = (memory.description as string) || '';
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
  
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  
  // Find memories from this day in previous years
  const memories = await c.env.DB.prepare(`
    SELECT m.*, 
           strftime('%Y', m.memory_date) as memory_year,
           (strftime('%Y', 'now') - strftime('%Y', m.memory_date)) as years_ago
    FROM memories m
    WHERE m.user_id = ?
      AND strftime('%m', m.memory_date) = ?
      AND strftime('%d', m.memory_date) = ?
      AND strftime('%Y', m.memory_date) < strftime('%Y', 'now')
    ORDER BY m.memory_date DESC
    LIMIT 10
  `).bind(userId, month.toString().padStart(2, '0'), day.toString().padStart(2, '0')).all();
  
  // Also check for memories created on this day (not memory_date)
  const createdOnThisDay = await c.env.DB.prepare(`
    SELECT m.*, 
           strftime('%Y', m.created_at) as created_year,
           (strftime('%Y', 'now') - strftime('%Y', m.created_at)) as years_ago
    FROM memories m
    WHERE m.user_id = ?
      AND strftime('%m', m.created_at) = ?
      AND strftime('%d', m.created_at) = ?
      AND strftime('%Y', m.created_at) < strftime('%Y', 'now')
    ORDER BY m.created_at DESC
    LIMIT 5
  `).bind(userId, month.toString().padStart(2, '0'), day.toString().padStart(2, '0')).all();
  
  // Get photos for memories
  const memoryIds = [...memories.results, ...createdOnThisDay.results].map((m: any) => m.id);
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
  
  const formatMemory = (m: any, type: 'memory_date' | 'created') => ({
    id: m.id,
    title: m.title,
    description: m.description?.substring(0, 200) + (m.description?.length > 200 ? '...' : ''),
    photoUrl: photosMap[m.id] || null,
    yearsAgo: m.years_ago,
    year: type === 'memory_date' ? m.memory_year : m.created_year,
    type,
    date: type === 'memory_date' ? m.memory_date : m.created_at,
  });
  
  return c.json({
    date: today.toISOString().split('T')[0],
    displayDate: today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
    memoriesFromThisDay: memories.results.map((m: any) => formatMemory(m, 'memory_date')),
    createdOnThisDay: createdOnThisDay.results.map((m: any) => formatMemory(m, 'created')),
    hasMemories: memories.results.length > 0 || createdOnThisDay.results.length > 0,
  });
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
