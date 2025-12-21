/**
 * Memories Routes - Cloudflare Workers
 * Handles memory CRUD operations with R2 storage
 */

import { Hono } from 'hono';
import type { Env } from '../index';
import { classifyEmotion, classifyEmotionWithAI } from '../services/tinyllm';

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
    data: memories.results.map((m: any) => {
      const parsedMetadata = m.metadata ? JSON.parse(m.metadata) : null;
      // Fallback: construct fileUrl from file_key if file_url is missing or broken
      let fileUrl = m.file_url;
      if ((!fileUrl || fileUrl.includes('undefined')) && m.file_key) {
        fileUrl = `${c.env.API_URL}/api/memories/file/${encodeURIComponent(m.file_key)}`;
      }
      return {
        id: m.id,
        type: m.type,
        title: m.title,
        description: m.description,
        fileUrl,
        fileKey: m.file_key,
        fileSize: m.file_size,
        mimeType: m.mime_type,
        metadata: parsedMetadata,
        emotion: parsedMetadata?.emotion || null,
        emotionConfidence: parsedMetadata?.emotionConfidence || null,
        encrypted: !!m.encrypted,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      };
    }),
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
  
  // Get letter count from letters table (letters are stored separately)
  const letterCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM letters WHERE user_id = ?
  `).bind(userId).first();
  
  // Get voice recording stats
  const voiceStats = await c.env.DB.prepare(`
    SELECT COUNT(*) as count, SUM(duration) as total_minutes FROM voice_recordings WHERE user_id = ?
  `).bind(userId).first();
  
  return c.json({
    total: stats?.total || 0,
    totalMemories: stats?.total || 0,
    totalLetters: letterCount?.count || 0,
    totalVoiceMinutes: Math.round(((voiceStats?.total_minutes as number) || 0) / 60),
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

// Upload file data to R2 using the key from the URL (supports both POST and PUT)
memoriesRoutes.put('/upload/*', async (c) => {
  const userId = c.get('userId');

  // Extract everything after /memories/upload/
  const url = new URL(c.req.url);
  const pathAfterUpload = url.pathname.split('/memories/upload/')[1];
  if (!pathAfterUpload) {
    return c.json({ error: 'Invalid upload key' }, 400);
  }

  const key = decodeURIComponent(pathAfterUpload);

  // Safety: ensure the key belongs to this user
  if (!key.startsWith(`memories/${userId}/`)) {
    return c.json({ error: 'Invalid key for user' }, 403);
  }

  const contentType = c.req.header('Content-Type') || 'application/octet-stream';
  
  try {
    // Get the raw body as ArrayBuffer for R2
    const bodyData = await c.req.arrayBuffer();
    if (!bodyData || bodyData.byteLength === 0) {
      return c.json({ error: 'No file data' }, 400);
    }

    await c.env.STORAGE.put(key, bodyData, {
      httpMetadata: { contentType },
    });

    // Generate the public URL for the file
    const fileUrl = `${c.env.API_URL}/api/memories/file/${encodeURIComponent(key)}`;

    return c.json({ success: true, key, fileUrl }, 201);
  } catch (err: any) {
    console.error('Error uploading memory to R2:', err);
    return c.json({ error: 'Failed to upload file', details: err.message }, 500);
  }
});

memoriesRoutes.post('/upload/*', async (c) => {
  const userId = c.get('userId');

  // Extract everything after /memories/upload/
  const url = new URL(c.req.url);
  const pathAfterUpload = url.pathname.split('/memories/upload/')[1];
  if (!pathAfterUpload) {
    return c.json({ error: 'Invalid upload key' }, 400);
  }

  const key = decodeURIComponent(pathAfterUpload);

  // Safety: ensure the key belongs to this user
  if (!key.startsWith(`memories/${userId}/`)) {
    return c.json({ error: 'Invalid key for user' }, 403);
  }

  const contentType = c.req.header('Content-Type') || 'application/octet-stream';
  
  try {
    // Get the raw body as ArrayBuffer for R2
    const bodyData = await c.req.arrayBuffer();
    if (!bodyData || bodyData.byteLength === 0) {
      return c.json({ error: 'No file data' }, 400);
    }

    await c.env.STORAGE.put(key, bodyData, {
      httpMetadata: { contentType },
    });

    // Generate the public URL for the file
    const fileUrl = `${c.env.API_URL}/api/memories/file/${encodeURIComponent(key)}`;

    return c.json({ success: true, key, fileUrl }, 201);
  } catch (err: any) {
    console.error('Error uploading memory to R2:', err);
    return c.json({ error: 'Failed to upload file', details: err.message }, 500);
  }
});

// Serve file from R2
memoriesRoutes.get('/file/*', async (c) => {
  const url = new URL(c.req.url);
  const pathAfterFile = url.pathname.split('/memories/file/')[1];
  if (!pathAfterFile) {
    return c.json({ error: 'Invalid file key' }, 400);
  }

  const key = decodeURIComponent(pathAfterFile);

  try {
    const object = await c.env.STORAGE.get(key);
    if (!object) {
      return c.json({ error: 'File not found' }, 404);
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000');

    return new Response(object.body, { headers });
  } catch (err: any) {
    console.error('Error serving file from R2:', err);
    return c.json({ error: 'Failed to retrieve file' }, 500);
  }
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
  
    const { type, title, description, fileUrl, fileKey, fileSize, mimeType, metadata, recipientIds, memoryDate } = body;
  
    if (!type || !title) {
      return c.json({ error: 'Type and title are required' }, 400);
    }
  
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    // Use memoryDate if provided (for historic memories), otherwise use current date
    const createdAt = memoryDate ? new Date(memoryDate).toISOString() : now;
  
  // Classify emotion using Cloudflare Workers AI (falls back to keyword-based)
  const textToClassify = `${title} ${description || ''}`.trim();
  const emotionResult = await classifyEmotionWithAI(textToClassify, c.env.AI);
  
  // Merge emotion into metadata
  const enrichedMetadata = {
    ...(metadata || {}),
    emotion: emotionResult.label,
    emotionConfidence: emotionResult.confidence,
  };
  
    await c.env.DB.prepare(`
      INSERT INTO memories (id, user_id, type, title, description, file_url, file_key, file_size, mime_type, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, userId, type, title, description || null, fileUrl || null, fileKey || null, fileSize || null, mimeType || null, JSON.stringify(enrichedMetadata), createdAt, now).run();
  
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
    emotion: emotionResult.label,
    emotionConfidence: emotionResult.confidence,
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

// ============================================
// FULL-TEXT SEARCH
// ============================================

memoriesRoutes.get('/search', async (c) => {
  const userId = c.get('userId');
  const query = c.req.query('q');
  const type = c.req.query('type'); // 'all', 'memories', 'voice', 'letters'
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  
  if (!query || query.trim().length < 2) {
    return c.json({ error: 'Search query must be at least 2 characters' }, 400);
  }
  
  // Sanitize query for FTS5 - escape special characters
  const sanitizedQuery = query
    .replace(/['"]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 1)
    .map(word => `"${word}"*`)
    .join(' OR ');
  
  if (!sanitizedQuery) {
    return c.json({ results: [], total: 0 });
  }
  
  const results: any[] = [];
  const searchType = type || 'all';
  
  try {
    // Search memories
    if (searchType === 'all' || searchType === 'memories') {
      const memoriesResults = await c.env.DB.prepare(`
        SELECT m.id, m.type, m.title, m.description, m.file_url, m.file_key, m.created_at,
               snippet(memories_fts, 0, '<mark>', '</mark>', '...', 32) as title_snippet,
               snippet(memories_fts, 1, '<mark>', '</mark>', '...', 64) as description_snippet
        FROM memories_fts
        JOIN memories m ON memories_fts.rowid = m.rowid
        WHERE memories_fts MATCH ? AND m.user_id = ?
        ORDER BY rank
        LIMIT ?
      `).bind(sanitizedQuery, userId, limit).all();
      
      for (const r of memoriesResults.results) {
        let fileUrl = r.file_url;
        if ((!fileUrl || fileUrl.includes('undefined')) && r.file_key) {
          fileUrl = `${c.env.API_URL}/api/memories/file/${encodeURIComponent(r.file_key)}`;
        }
        results.push({
          id: r.id,
          type: 'memory',
          subType: r.type,
          title: r.title,
          snippet: r.description_snippet || r.title_snippet,
          fileUrl,
          createdAt: r.created_at,
        });
      }
    }
    
    // Search voice recordings
    if (searchType === 'all' || searchType === 'voice') {
      const voiceResults = await c.env.DB.prepare(`
        SELECT v.id, v.title, v.description, v.transcript, v.file_url, v.file_key, v.created_at,
               snippet(voice_fts, 0, '<mark>', '</mark>', '...', 32) as title_snippet,
               snippet(voice_fts, 2, '<mark>', '</mark>', '...', 64) as transcript_snippet
        FROM voice_fts
        JOIN voice_recordings v ON voice_fts.rowid = v.rowid
        WHERE voice_fts MATCH ? AND v.user_id = ?
        ORDER BY rank
        LIMIT ?
      `).bind(sanitizedQuery, userId, limit).all();
      
      for (const r of voiceResults.results) {
        let fileUrl = r.file_url;
        if ((!fileUrl || fileUrl.includes('undefined')) && r.file_key) {
          fileUrl = `${c.env.API_URL}/api/voice/file/${encodeURIComponent(r.file_key)}`;
        }
        results.push({
          id: r.id,
          type: 'voice',
          title: r.title,
          snippet: r.transcript_snippet || r.title_snippet,
          fileUrl,
          createdAt: r.created_at,
        });
      }
    }
    
    // Search letters
    if (searchType === 'all' || searchType === 'letters') {
      const lettersResults = await c.env.DB.prepare(`
        SELECT l.id, l.title, l.salutation, l.body, l.created_at,
               snippet(letters_fts, 2, '<mark>', '</mark>', '...', 64) as body_snippet
        FROM letters_fts
        JOIN letters l ON letters_fts.rowid = l.rowid
        WHERE letters_fts MATCH ? AND l.user_id = ?
        ORDER BY rank
        LIMIT ?
      `).bind(sanitizedQuery, userId, limit).all();
      
      for (const r of lettersResults.results) {
        results.push({
          id: r.id,
          type: 'letter',
          title: r.title || r.salutation || 'Untitled Letter',
          snippet: r.body_snippet,
          createdAt: r.created_at,
        });
      }
    }
    
    // Sort all results by relevance (already sorted by rank within each type)
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return c.json({
      results: results.slice(0, limit),
      total: results.length,
      query: query,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    // If FTS tables don't exist yet, return empty results
    if (error.message?.includes('no such table')) {
      return c.json({ results: [], total: 0, query });
    }
    return c.json({ error: 'Search failed' }, 500);
  }
});

// ============================================
// SHAREABLE MEMORY CARDS (SVG)
// ============================================

memoriesRoutes.get('/:id/card', async (c) => {
  const userId = c.get('userId');
  const memoryId = c.req.param('id');
  const style = c.req.query('style') || 'classic'; // classic, modern, vintage
  
  // Get memory
  const memory = await c.env.DB.prepare(`
    SELECT m.*, u.first_name, u.last_name
    FROM memories m
    JOIN users u ON m.user_id = u.id
    WHERE m.id = ? AND m.user_id = ?
  `).bind(memoryId, userId).first();
  
  if (!memory) {
    return c.json({ error: 'Memory not found' }, 404);
  }
  
  // Parse metadata for emotion
  const metadata = memory.metadata ? JSON.parse(memory.metadata as string) : {};
  const emotion = metadata.emotion || 'love';
  
  // Emotion to emoji mapping
  const emotionEmojis: Record<string, string> = {
    joy: '😊',
    love: '❤️',
    nostalgia: '🌅',
    gratitude: '🙏',
    pride: '🏆',
    hope: '🌟',
    peace: '☮️',
    excitement: '🎉',
    sadness: '💙',
    reflection: '🤔',
  };
  
  // Style configurations
  const styles: Record<string, { bg: string; text: string; accent: string; border: string }> = {
    classic: { bg: '#1a1a2e', text: '#f5f3ee', accent: '#c9a959', border: '#c9a959' },
    modern: { bg: '#0f172a', text: '#f8fafc', accent: '#ec4899', border: '#3b82f6' },
    vintage: { bg: '#fef3c7', text: '#451a03', accent: '#92400e', border: '#d97706' },
  };
  
  const s = styles[style] || styles.classic;
  const emoji = emotionEmojis[emotion] || '✨';
  const authorName = `${memory.first_name} ${memory.last_name}`;
  const date = new Date(memory.created_at as string).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Helper function to wrap text
  const wrapText = (text: string, maxChars: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxChars) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.slice(0, 4); // Max 4 lines
  };
  
  // Escape XML special characters
  const escapeXml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  const title = escapeXml(memory.title as string || 'Untitled Memory');
  const description = memory.description ? escapeXml(memory.description as string) : '';
  const titleLines = wrapText(title, 35);
  const descLines = description ? wrapText(description, 50) : [];
  
  // Generate SVG (1200x630 for social sharing)
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${s.bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${s.bg};stop-opacity:0.9" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  
  <!-- Border -->
  <rect x="20" y="20" width="1160" height="590" fill="none" stroke="${s.border}" stroke-width="2" rx="16"/>
  
  <!-- Infinity symbol (Heirloom logo) -->
  <text x="60" y="80" font-family="Georgia, serif" font-size="48" fill="${s.accent}">∞</text>
  <text x="120" y="75" font-family="Georgia, serif" font-size="16" fill="${s.text}" opacity="0.7" letter-spacing="0.15em">HEIRLOOM</text>
  
  <!-- Emotion emoji -->
  <text x="1100" y="80" font-size="48" text-anchor="end">${emoji}</text>
  
  <!-- Title -->
  ${titleLines.map((line, i) => `<text x="60" y="${200 + i * 50}" font-family="Georgia, serif" font-size="42" fill="${s.text}" font-weight="bold">${line}</text>`).join('\n  ')}
  
  <!-- Description -->
  ${descLines.map((line, i) => `<text x="60" y="${200 + titleLines.length * 50 + 40 + i * 32}" font-family="Georgia, serif" font-size="24" fill="${s.text}" opacity="0.8">${line}</text>`).join('\n  ')}
  
  <!-- Author and date -->
  <text x="60" y="560" font-family="Georgia, serif" font-size="20" fill="${s.accent}">— ${escapeXml(authorName)}</text>
  <text x="60" y="590" font-family="Georgia, serif" font-size="16" fill="${s.text}" opacity="0.6">${date}</text>
  
  <!-- Heirloom URL -->
  <text x="1140" y="590" font-family="Georgia, serif" font-size="14" fill="${s.text}" opacity="0.5" text-anchor="end">heirloom.blue</text>
</svg>`;
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
