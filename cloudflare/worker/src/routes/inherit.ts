/**
 * Inherit Routes - Recipient Portal for Heirloom
 * Handles token-based access for recipients to view content after vault unlock
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { readDescription } from '../lib/legacyArchive';
import { AI_TEXT_MODEL } from '../lib/aiModels';

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
    JOIN legacy_contacts lc ON sv.legacy_contact_id = lc.id AND lc.deleted_at IS NULL
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
    JOIN legacy_contacts lc ON lc.id = rs.legacy_contact_id
    WHERE rs.session_token = ? AND lc.deleted_at IS NULL
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
  const legacyContactId = c.get('legacyContactId');

  // Only return letters explicitly addressed to this legacy contact.
  // letter_legacy_recipients is the access-control junction table populated
  // when the author adds a legacy contact as a recipient in the composer.
  // Letters not present in that table for this legacyContactId are NOT visible —
  // this prevents all sealed letters leaking to every inherit session holder.
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
    INNER JOIN letter_legacy_recipients llr ON llr.letter_id = l.id
    WHERE llr.legacy_contact_id = ?
      AND l.sealed_at IS NOT NULL
      AND l.deleted_at IS NULL
    ORDER BY l.created_at DESC
  `).bind(legacyContactId).all();

  // Memories and voice recordings are scoped to this recipient via the
  // memory_legacy_recipients / voice_legacy_recipients junction tables —
  // the parallel of letter_legacy_recipients. A memory or voice recording is
  // only visible to a legacy contact present in the matching table for this
  // legacyContactId, mirroring the letter scoping above.
  const [memories, voiceRecordings] = await Promise.all([
    c.env.DB.prepare(`
      SELECT
        m.id,
        m.type,
        m.title,
        m.description,
        m.description_enc,
        m.description_iv,
        m.encrypted,
        m.file_url,
        m.file_key,
        m.file_size,
        m.mime_type,
        m.metadata,
        m.emotion,
        m.created_at
      FROM memories m
      INNER JOIN memory_legacy_recipients mlr ON mlr.memory_id = m.id
      WHERE mlr.legacy_contact_id = ?
        AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC
    `).bind(legacyContactId).all(),
    c.env.DB.prepare(`
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
      INNER JOIN voice_legacy_recipients vlr ON vlr.voice_recording_id = v.id
      WHERE vlr.legacy_contact_id = ?
        AND v.deleted_at IS NULL
      ORDER BY v.created_at DESC
    `).bind(legacyContactId).all(),
  ]);

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
    memories: await Promise.all(memories.results.map(async (m: any) => ({
      id: m.id,
      type: m.type,
      title: m.title,
      description: await readDescription(c.env, m),
      fileUrl: m.file_url,
      emotion: m.emotion,
      createdAt: m.created_at,
    }))),
    recipientScopedMemories: true,
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
    recipientScopedVoice: true,
  });
});

// Get a specific letter
inheritRoutes.get('/content/letter/:id', validateRecipientSession, async (c) => {
  const legacyContactId = c.get('legacyContactId');
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
    INNER JOIN letter_legacy_recipients llr ON llr.letter_id = l.id
    WHERE l.id = ?
      AND llr.legacy_contact_id = ?
      AND l.sealed_at IS NOT NULL
      AND l.deleted_at IS NULL
  `).bind(letterId, legacyContactId).first();
  
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
  const legacyContactId = c.get('legacyContactId');
  const voiceId = c.req.param('id');

  // Scope by both owner and the recipient's voice_legacy_recipients row so a
  // session can only fetch recordings explicitly addressed to this legacy
  // contact — mirroring the letter-by-id join above.
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
    INNER JOIN voice_legacy_recipients vlr ON vlr.voice_recording_id = v.id
    WHERE v.id = ?
      AND v.user_id = ?
      AND vlr.legacy_contact_id = ?
      AND v.deleted_at IS NULL
  `).bind(voiceId, ownerId, legacyContactId).first();
  
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
  const legacyContactId = c.get('legacyContactId');
  const body = await c.req.json();
  const { query } = body;
  
  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    return c.json({ error: 'Please provide a search query (at least 3 characters)' }, 400);
  }
  
  try {
    // Fetch content scoped to this recipient — each content type is joined
    // through its legacy-recipient junction table so search only ever covers
    // entries explicitly addressed to this legacy contact.
    const [letters, memories, voiceRecordings] = await Promise.all([
      c.env.DB.prepare(`
        SELECT l.id, l.title, l.salutation, l.body, l.signature, l.emotion, l.sealed_at, l.created_at
        FROM letters l
        INNER JOIN letter_legacy_recipients llr ON llr.letter_id = l.id
        WHERE llr.legacy_contact_id = ? AND l.sealed_at IS NOT NULL AND l.deleted_at IS NULL
        ORDER BY l.created_at DESC
      `).bind(legacyContactId).all(),
      c.env.DB.prepare(`
        SELECT m.id, m.title, m.description, m.description_enc, m.description_iv, m.encrypted,
               m.file_url, m.mime_type AS file_type, m.emotion, m.created_at
        FROM memories m
        INNER JOIN memory_legacy_recipients mlr ON mlr.memory_id = m.id
        WHERE mlr.legacy_contact_id = ? AND m.deleted_at IS NULL
        ORDER BY m.created_at DESC
      `).bind(legacyContactId).all(),
      c.env.DB.prepare(`
        SELECT v.id, v.title, v.description, v.file_url, v.duration, v.emotion, v.transcript, v.created_at
        FROM voice_recordings v
        INNER JOIN voice_legacy_recipients vlr ON vlr.voice_recording_id = v.id
        WHERE vlr.legacy_contact_id = ? AND v.deleted_at IS NULL
        ORDER BY v.created_at DESC
      `).bind(legacyContactId).all()
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
    
    // Add memories (description is decrypted from at-rest ciphertext if present)
    for (const m of memories.results as any[]) {
      const description = await readDescription(c.env, m);
      searchableItems.push({
        type: 'memory',
        id: m.id,
        title: m.title || 'Untitled Memory',
        content: description || m.title || '',
        date: m.created_at,
        emotion: m.emotion,
        metadata: { fileUrl: m.file_url, fileType: m.file_type }
      });
    }
    
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

    const response = await c.env.AI.run(AI_TEXT_MODEL, {
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
  
  // Get the legacy contact info for sender details (live rows only —
  // a soft-deleted contact must not surface as a sender; defense-in-depth)
  const legacyContact = await c.env.DB.prepare(`
    SELECT name, email, relationship FROM legacy_contacts WHERE id = ? AND deleted_at IS NULL
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
