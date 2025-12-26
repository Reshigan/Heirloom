/**
 * Inherit Routes - Recipient Portal for Heirloom
 * Handles token-based access for recipients to view content after vault unlock
 */

import { Hono } from 'hono';
import type { Env, AppEnv } from '../index';

export const inheritRoutes = new Hono<AppEnv>();

// Validate access token and get recipient info
inheritRoutes.get('/:token', async (c) => {
  const token = c.req.param('token');
  
  if (!token) {
    return c.json({ error: 'Access token is required' }, 400);
  }
  
  // Look up the verification token
  const verification = await c.env.DB.prepare(`
    SELECT 
      sv.id,
      sv.dead_man_switch_id,
      sv.legacy_contact_id,
      sv.verification_token,
      sv.verified_at,
      sv.expires_at,
      sv.created_at,
      lc.name as recipient_name,
      lc.email as recipient_email,
      lc.relationship,
      u.first_name as owner_first_name,
      u.last_name as owner_last_name,
      u.id as owner_id
    FROM switch_verifications sv
    JOIN legacy_contacts lc ON sv.legacy_contact_id = lc.id
    JOIN dead_man_switches dms ON sv.dead_man_switch_id = dms.id
    JOIN users u ON dms.user_id = u.id
    WHERE sv.verification_token = ?
  `).bind(token).first();
  
  if (!verification) {
    return c.json({ error: 'Invalid or expired access link' }, 404);
  }
  
  // Check if token has expired
  const expiresAt = new Date(verification.expires_at as string);
  if (expiresAt < new Date()) {
    return c.json({ error: 'This access link has expired' }, 410);
  }
  
  // Mark as verified if not already
  if (!verification.verified_at) {
    await c.env.DB.prepare(`
      UPDATE switch_verifications SET verified_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), verification.id).run();
  }
  
  // Generate a short-lived session token for subsequent requests
  const sessionToken = crypto.randomUUID();
  const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  
  // Store session in a simple way (could use KV or D1)
  await c.env.DB.prepare(`
    INSERT INTO recipient_sessions (id, verification_id, owner_id, legacy_contact_id, session_token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    verification.id,
    verification.owner_id,
    verification.legacy_contact_id,
    sessionToken,
    sessionExpires,
    new Date().toISOString()
  ).run();
  
  return c.json({
    valid: true,
    sessionToken,
    recipient: {
      name: verification.recipient_name,
      relationship: verification.relationship,
    },
    owner: {
      name: `${verification.owner_first_name} ${verification.owner_last_name}`,
    },
    expiresAt: sessionExpires,
  });
});

// Middleware to validate recipient session
const validateRecipientSession = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Session token required' }, 401);
  }
  
  const sessionToken = authHeader.slice(7);
  
  const session = await c.env.DB.prepare(`
    SELECT 
      rs.id,
      rs.owner_id,
      rs.legacy_contact_id,
      rs.expires_at
    FROM recipient_sessions rs
    WHERE rs.session_token = ?
  `).bind(sessionToken).first();
  
  if (!session) {
    return c.json({ error: 'Invalid session' }, 401);
  }
  
  const expiresAt = new Date(session.expires_at as string);
  if (expiresAt < new Date()) {
    return c.json({ error: 'Session expired' }, 401);
  }
  
  c.set('ownerId', session.owner_id);
  c.set('legacyContactId', session.legacy_contact_id);
  
  await next();
};

// Get all content shared with this recipient
inheritRoutes.get('/content/all', validateRecipientSession, async (c) => {
  const ownerId = c.get('ownerId');
  const legacyContactId = c.get('legacyContactId');
  
  // Get the family member ID associated with this legacy contact
  const legacyContact = await c.env.DB.prepare(`
    SELECT id, name, email FROM legacy_contacts WHERE id = ?
  `).bind(legacyContactId).first();
  
  // Get letters shared with this recipient (via family member relationship)
  const letters = await c.env.DB.prepare(`
    SELECT 
      l.id,
      l.title,
      l.salutation,
      l.body,
      l.signature,
      l.emotion,
      l.sealed_at,
      l.created_at
    FROM letters l
    WHERE l.user_id = ? AND l.sealed_at IS NOT NULL
    ORDER BY l.created_at DESC
  `).bind(ownerId).all();
  
  // Get memories shared with this recipient
  const memories = await c.env.DB.prepare(`
    SELECT 
      m.id,
      m.title,
      m.description,
      m.file_url,
      m.file_type,
      m.emotion,
      m.created_at
    FROM memories m
    WHERE m.user_id = ?
    ORDER BY m.created_at DESC
  `).bind(ownerId).all();
  
  // Get voice recordings shared with this recipient
  const voiceRecordings = await c.env.DB.prepare(`
    SELECT 
      v.id,
      v.title,
      v.description,
      v.file_url,
      v.duration,
      v.emotion,
      v.transcript,
      v.created_at
    FROM voice_recordings v
    WHERE v.user_id = ?
    ORDER BY v.created_at DESC
  `).bind(ownerId).all();
  
  return c.json({
    letters: letters.results.map((l: any) => ({
      id: l.id,
      title: l.title,
      salutation: l.salutation,
      body: l.body,
      signature: l.signature,
      emotion: l.emotion,
      sealedAt: l.sealed_at,
      createdAt: l.created_at,
    })),
    memories: memories.results.map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      fileUrl: m.file_url,
      fileType: m.file_type,
      emotion: m.emotion,
      createdAt: m.created_at,
    })),
    voiceRecordings: voiceRecordings.results.map((v: any) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      fileUrl: v.file_url,
      duration: v.duration,
      emotion: v.emotion,
      transcript: v.transcript,
      createdAt: v.created_at,
    })),
  });
});

// Get a specific letter
inheritRoutes.get('/content/letter/:id', validateRecipientSession, async (c) => {
  const ownerId = c.get('ownerId');
  const letterId = c.req.param('id');
  
  const letter = await c.env.DB.prepare(`
    SELECT 
      l.id,
      l.title,
      l.salutation,
      l.body,
      l.signature,
      l.emotion,
      l.sealed_at,
      l.created_at
    FROM letters l
    WHERE l.id = ? AND l.user_id = ? AND l.sealed_at IS NOT NULL
  `).bind(letterId, ownerId).first();
  
  if (!letter) {
    return c.json({ error: 'Letter not found' }, 404);
  }
  
  return c.json({
    id: letter.id,
    title: letter.title,
    salutation: letter.salutation,
    body: letter.body,
    signature: letter.signature,
    emotion: letter.emotion,
    sealedAt: letter.sealed_at,
    createdAt: letter.created_at,
  });
});

// Get a specific voice recording
inheritRoutes.get('/content/voice/:id', validateRecipientSession, async (c) => {
  const ownerId = c.get('ownerId');
  const voiceId = c.req.param('id');
  
  const voice = await c.env.DB.prepare(`
    SELECT 
      v.id,
      v.title,
      v.description,
      v.file_url,
      v.duration,
      v.emotion,
      v.transcript,
      v.created_at
    FROM voice_recordings v
    WHERE v.id = ? AND v.user_id = ?
  `).bind(voiceId, ownerId).first();
  
  if (!voice) {
    return c.json({ error: 'Voice recording not found' }, 404);
  }
  
  return c.json({
    id: voice.id,
    title: voice.title,
    description: voice.description,
    fileUrl: voice.file_url,
    duration: voice.duration,
    emotion: voice.emotion,
    transcript: voice.transcript,
    createdAt: voice.created_at,
  });
});

// AI-powered semantic search across all inherited content
inheritRoutes.post('/search', validateRecipientSession, async (c) => {
  const ownerId = c.get('ownerId');
  const body = await c.req.json();
  const { query } = body;
  
  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    return c.json({ error: 'Please provide a search query (at least 3 characters)' }, 400);
  }
  
  try {
    // Fetch all content for this owner
    const [letters, memories, voiceRecordings] = await Promise.all([
      c.env.DB.prepare(`
        SELECT id, title, salutation, body, signature, emotion, sealed_at, created_at
        FROM letters WHERE user_id = ? AND sealed_at IS NOT NULL
        ORDER BY created_at DESC
      `).bind(ownerId).all(),
      c.env.DB.prepare(`
        SELECT id, title, description, file_url, file_type, emotion, created_at
        FROM memories WHERE user_id = ?
        ORDER BY created_at DESC
      `).bind(ownerId).all(),
      c.env.DB.prepare(`
        SELECT id, title, description, file_url, duration, emotion, transcript, created_at
        FROM voice_recordings WHERE user_id = ?
        ORDER BY created_at DESC
      `).bind(ownerId).all()
    ]);
    
    // Build searchable content with context
    const searchableItems: Array<{
      type: 'letter' | 'memory' | 'voice';
      id: string;
      title: string;
      content: string;
      date: string;
      emotion?: string;
      metadata?: any;
    }> = [];
    
    // Add letters
    letters.results.forEach((l: any) => {
      searchableItems.push({
        type: 'letter',
        id: l.id,
        title: l.title || 'Untitled Letter',
        content: `${l.salutation || ''} ${l.body || ''} ${l.signature || ''}`.trim(),
        date: l.created_at,
        emotion: l.emotion,
        metadata: { sealedAt: l.sealed_at }
      });
    });
    
    // Add memories
    memories.results.forEach((m: any) => {
      searchableItems.push({
        type: 'memory',
        id: m.id,
        title: m.title || 'Untitled Memory',
        content: m.description || m.title || '',
        date: m.created_at,
        emotion: m.emotion,
        metadata: { fileUrl: m.file_url, fileType: m.file_type }
      });
    });
    
    // Add voice recordings (with transcripts)
    voiceRecordings.results.forEach((v: any) => {
      searchableItems.push({
        type: 'voice',
        id: v.id,
        title: v.title || 'Untitled Recording',
        content: v.transcript || v.description || v.title || '',
        date: v.created_at,
        emotion: v.emotion,
        metadata: { fileUrl: v.file_url, duration: v.duration }
      });
    });
    
    if (searchableItems.length === 0) {
      return c.json({
        answer: "There are no memories to search through yet.",
        results: [],
        query
      });
    }
    
    // Build context for AI
    const contentContext = searchableItems.map((item, idx) => {
      const dateStr = new Date(item.date).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
      return `[${idx + 1}] ${item.type.toUpperCase()} - "${item.title}" (${dateStr})${item.emotion ? ` [${item.emotion}]` : ''}: ${item.content.slice(0, 500)}`;
    }).join('\n\n');
    
    // Use AI to find relevant content and generate an answer
    const systemPrompt = `You are a helpful assistant helping someone search through their loved one's memories, letters, and voice recordings. The person who created these memories has passed away or activated their legacy vault.

Your job is to:
1. Find the most relevant memories based on the user's question
2. Provide a warm, empathetic answer that references specific memories
3. Include dates and context when relevant
4. If the question asks about a specific event (like "when did dad buy his first car"), look for mentions of that event in the content

Here are all the available memories:

${contentContext}

Important:
- Be warm and compassionate - these are precious memories
- Reference specific items by their number [1], [2], etc.
- If you can't find relevant information, say so gently
- Keep your answer concise but meaningful (2-4 sentences)`;

    const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: 300,
      temperature: 0.3
    });
    
    const aiAnswer = (response as any).response?.trim() || "I couldn't find specific information about that in the memories.";
    
    // Extract referenced item numbers from the AI response
    const referencedNumbers = (aiAnswer.match(/\[(\d+)\]/g) || [])
      .map((match: string) => parseInt(match.replace(/[\[\]]/g, '')) - 1)
      .filter((idx: number) => idx >= 0 && idx < searchableItems.length);
    
    // Get the referenced items or do a simple text search as fallback
    type SearchableItem = typeof searchableItems[number];
    let relevantItems: SearchableItem[] = referencedNumbers.map((idx: number) => searchableItems[idx]);
    
    // If AI didn't reference specific items, do a simple text search
    if (relevantItems.length === 0) {
      const queryLower = query.toLowerCase();
      relevantItems = searchableItems.filter((item: SearchableItem) => 
        item.title.toLowerCase().includes(queryLower) ||
        item.content.toLowerCase().includes(queryLower)
      ).slice(0, 5);
    }
    
    return c.json({
      answer: aiAnswer,
      results: relevantItems.map(item => ({
        type: item.type,
        id: item.id,
        title: item.title,
        snippet: item.content.slice(0, 200) + (item.content.length > 200 ? '...' : ''),
        date: item.date,
        emotion: item.emotion,
        ...(item.type === 'memory' && { fileUrl: item.metadata?.fileUrl }),
        ...(item.type === 'voice' && { fileUrl: item.metadata?.fileUrl, duration: item.metadata?.duration })
      })),
      query,
      totalItems: searchableItems.length
    });
  } catch (error) {
    console.error('AI search error:', error);
    return c.json({ error: 'Failed to search memories' }, 500);
  }
});

// ============================================
// RECIPIENT MESSAGES (Family Echo)
// ============================================

// Send a message back to the creator
inheritRoutes.post('/reply', validateRecipientSession, async (c) => {
  const ownerId = c.get('ownerId');
  const legacyContactId = c.get('legacyContactId');
  
  const body = await c.req.json();
  const { reactionType, message, contentType, contentId } = body;
  
  if (!reactionType && !message) {
    return c.json({ error: 'Please provide a reaction or message' }, 400);
  }
  
  // Get the legacy contact info for sender details
  const legacyContact = await c.env.DB.prepare(`
    SELECT name, email, relationship FROM legacy_contacts WHERE id = ?
  `).bind(legacyContactId).first();
  
  if (!legacyContact) {
    return c.json({ error: 'Sender not found' }, 404);
  }
  
  const messageId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO recipient_messages (
      id, sender_name, sender_email, sender_relationship, creator_user_id,
      content_type, content_id, reaction_type, message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    messageId,
    legacyContact.name,
    legacyContact.email,
    legacyContact.relationship,
    ownerId,
    contentType || 'GENERAL',
    contentId || null,
    reactionType || 'CUSTOM',
    message || null,
    new Date().toISOString()
  ).run();
  
  return c.json({ 
    success: true, 
    message: 'Your message has been sent',
    id: messageId
  });
});
