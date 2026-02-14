/**
 * Letters Routes - Cloudflare Workers
 * Handles letter CRUD operations
 */

import { Hono } from 'hono';
import type { Env, AppEnv } from '../index';
import { generateLetterSuggestion, classifyEmotion, classifyEmotionWithAI } from '../services/tinyllm';

export const lettersRoutes = new Hono<AppEnv>();

// AI-powered letter suggestion using TinyLLM with Cloudflare Workers AI
lettersRoutes.post('/ai-suggest', async (c) => {
  const body = await c.req.json();
  const { salutation, body: letterBody, signature, recipientNames, tone, occasion } = body;
  
  // If we have existing letter content, provide contextual suggestions
  if (letterBody && letterBody.trim().length > 20) {
    // Analyze the existing content using Cloudflare Workers AI (falls back to keyword-based)
    const emotion = await classifyEmotionWithAI(letterBody, c.env.AI);
    
    const continuationSuggestions: Record<string, string[]> = {
      joyful: [
        "I hope this letter finds you smiling, just as I am while writing it.",
        "Every time I think of you, my heart fills with happiness.",
        "May the joy we share continue to grow with each passing day.",
      ],
      nostalgic: [
        "Those memories we created together are treasures I hold close to my heart.",
        "Looking back, I realize how much those moments shaped who we are today.",
        "I hope you hold onto these memories as dearly as I do.",
      ],
      grateful: [
        "I cannot express enough how thankful I am to have you in my life.",
        "Your presence has been a blessing that I never take for granted.",
        "Thank you for being exactly who you are.",
      ],
      loving: [
        "My love for you grows stronger with each passing day.",
        "You are the light that brightens even my darkest days.",
        "Know that you are loved beyond measure, always and forever.",
      ],
      bittersweet: [
        "Though we may be apart, you are always in my thoughts.",
        "I cherish every moment we had, even as I miss you deeply.",
        "Some goodbyes are not forever, just until we meet again.",
      ],
      sad: [
        "Even in difficult times, please know that you are not alone.",
        "I hope these words bring you some comfort during this time.",
        "Remember that after every storm, the sun will shine again.",
      ],
      reflective: [
        "Life has taught me many lessons, but knowing you has been the greatest.",
        "As I reflect on our journey together, I am filled with gratitude.",
        "These moments of reflection remind me of what truly matters.",
      ],
      proud: [
        "I am so incredibly proud of the person you have become.",
        "Your achievements inspire me more than you know.",
        "Never forget how far you have come and how much you have accomplished.",
      ],
      peaceful: [
        "May you find peace in knowing how much you are loved.",
        "In the quiet moments, remember that you are cherished.",
        "I hope this letter brings you a sense of calm and comfort.",
      ],
      hopeful: [
        "The future holds so many wonderful possibilities for you.",
        "I believe in you and all that you will accomplish.",
        "Keep looking forward with hope, for the best is yet to come.",
      ],
    };
    
    const suggestions = continuationSuggestions[emotion.label] || continuationSuggestions.loving;
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    return c.json({
      suggestion: randomSuggestion,
      emotion: emotion.label,
      confidence: emotion.confidence,
    });
  }
  
  // If no content yet, provide opening suggestions based on recipient
  if (recipientNames) {
    const openingSuggestions = [
      `As I sit down to write this letter to you, ${recipientNames}, I am filled with so many thoughts I want to share.`,
      `There are some things I have always wanted to tell you, ${recipientNames}, and today feels like the right time.`,
      `When you read this letter, ${recipientNames}, I hope you feel how much you mean to me.`,
      `I have been thinking about you lately, ${recipientNames}, and wanted to put my feelings into words.`,
    ];
    
    return c.json({
      suggestion: openingSuggestions[Math.floor(Math.random() * openingSuggestions.length)],
      emotion: 'loving',
      confidence: 0.8,
    });
  }
  
  // Default suggestion
  return c.json({
    suggestion: "I wanted to take a moment to tell you how much you mean to me. Life moves so quickly, and sometimes we forget to express the love we carry in our hearts.",
    emotion: 'loving',
    confidence: 0.7,
  });
});

// Get all letters with pagination
lettersRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM letters WHERE user_id = ?`;
  const params: any[] = [userId];
  
  if (status === 'draft') {
    query += ` AND sealed_at IS NULL`;
  } else if (status === 'sealed') {
    query += ` AND sealed_at IS NOT NULL`;
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const [letters, countResult] = await c.env.DB.batch([
    c.env.DB.prepare(query).bind(...params),
    c.env.DB.prepare(
      status === 'draft'
        ? `SELECT COUNT(*) as count FROM letters WHERE user_id = ? AND sealed_at IS NULL`
        : status === 'sealed'
        ? `SELECT COUNT(*) as count FROM letters WHERE user_id = ? AND sealed_at IS NOT NULL`
        : `SELECT COUNT(*) as count FROM letters WHERE user_id = ?`
    ).bind(userId),
  ]);
  
  const letterIds = letters.results.map((l: any) => l.id);
  let recipientMap: Record<string, any[]> = {};
  
  if (letterIds.length > 0) {
    const placeholders = letterIds.map(() => '?').join(',');
    const allRecipients = await c.env.DB.prepare(`
      SELECT lr.letter_id, fm.id, fm.name, fm.relationship FROM family_members fm
      JOIN letter_recipients lr ON fm.id = lr.family_member_id
      WHERE lr.letter_id IN (${placeholders})
    `).bind(...letterIds).all();
    
    for (const r of allRecipients.results as any[]) {
      if (!recipientMap[r.letter_id]) recipientMap[r.letter_id] = [];
      recipientMap[r.letter_id].push({ id: r.id, name: r.name, relationship: r.relationship });
    }
  }
  
  const lettersWithRecipients = letters.results.map((letter: any) => ({
    id: letter.id,
    title: letter.title,
    salutation: letter.salutation,
    bodyPreview: letter.body ? letter.body.substring(0, 200) + (letter.body.length > 200 ? '...' : '') : '',
    signature: letter.signature,
    deliveryTrigger: letter.delivery_trigger,
    scheduledDate: letter.scheduled_date,
    sealedAt: letter.sealed_at,
    encrypted: !!letter.encrypted,
    recipients: recipientMap[letter.id] || [],
    createdAt: letter.created_at,
    updatedAt: letter.updated_at,
  }));
  
  const countRow = countResult.results[0] as any;
  
  return c.json({
    data: lettersWithRecipients,
    pagination: {
      page,
      limit,
      total: countRow?.count || 0,
      totalPages: Math.ceil((countRow?.count as number || 0) / limit),
    },
  });
});

// Get a specific letter
lettersRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');
  
  const letter = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ? AND user_id = ?
  `).bind(letterId, userId).first();
  
  if (!letter) {
    return c.json({ error: 'Letter not found' }, 404);
  }
  
  // Get recipients
  const recipients = await c.env.DB.prepare(`
    SELECT fm.id, fm.name, fm.relationship, fm.email FROM family_members fm
    JOIN letter_recipients lr ON fm.id = lr.family_member_id
    WHERE lr.letter_id = ?
  `).bind(letterId).all();
  
  return c.json({
    id: letter.id,
    title: letter.title,
    salutation: letter.salutation,
    body: letter.body,
    signature: letter.signature,
    deliveryTrigger: letter.delivery_trigger,
    scheduledDate: letter.scheduled_date,
    sealedAt: letter.sealed_at,
    encrypted: !!letter.encrypted,
    encryptionIv: letter.encryption_iv,
    recipients: recipients.results.map((r: any) => ({
      id: r.id,
      name: r.name,
      relationship: r.relationship,
      email: r.email,
    })),
    createdAt: letter.created_at,
    updatedAt: letter.updated_at,
  });
});

// Create a new letter
lettersRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { 
    title, 
    salutation, 
    body: letterBody, 
    signature, 
    deliveryTrigger, 
    scheduledDate, 
    recipientIds,
    encrypted,
    encryption_iv 
  } = body;
  
  if (!letterBody) {
    return c.json({ error: 'Letter body is required' }, 400);
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  // Store encrypted flag and IV if provided (E2E encryption)
  await c.env.DB.prepare(`
    INSERT INTO letters (id, user_id, title, salutation, body, signature, delivery_trigger, scheduled_date, encrypted, encryption_iv, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, title || null, salutation || null, letterBody, signature || null, deliveryTrigger || 'IMMEDIATE', scheduledDate || null, encrypted ? 1 : 0, encryption_iv || null, now, now).run();
  
  if (recipientIds && recipientIds.length > 0) {
    await c.env.DB.batch(
      recipientIds.map((recipientId: string) =>
        c.env.DB.prepare(`INSERT INTO letter_recipients (id, letter_id, family_member_id, created_at) VALUES (?, ?, ?, ?)`)
          .bind(crypto.randomUUID(), id, recipientId, now)
      )
    );
  }
  
  const letter = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ?
  `).bind(id).first();
  
  return c.json({
    id: letter?.id,
    title: letter?.title,
    salutation: letter?.salutation,
    body: letter?.body,
    signature: letter?.signature,
    deliveryTrigger: letter?.delivery_trigger,
    encrypted: !!letter?.encrypted,
    encryptionIv: letter?.encryption_iv,
    createdAt: letter?.created_at,
  }, 201);
});

// Update a letter
lettersRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');
  const body = await c.req.json();
  
  // Verify ownership and not sealed
  const existing = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ? AND user_id = ?
  `).bind(letterId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Letter not found' }, 404);
  }
  
  if (existing.sealed_at) {
    return c.json({ error: 'Cannot edit a sealed letter' }, 403);
  }
  
  const { title, salutation, body: letterBody, signature, deliveryTrigger, scheduledDate, recipientIds, encrypted, encryption_iv } = body;
  const now = new Date().toISOString();
  
  // Convert undefined to null for D1 compatibility
  // Include encryption fields if provided (E2E encryption)
  await c.env.DB.prepare(`
    UPDATE letters 
    SET title = COALESCE(?, title),
        salutation = COALESCE(?, salutation),
        body = COALESCE(?, body),
        signature = COALESCE(?, signature),
        delivery_trigger = COALESCE(?, delivery_trigger),
        scheduled_date = COALESCE(?, scheduled_date),
        encrypted = COALESCE(?, encrypted),
        encryption_iv = COALESCE(?, encryption_iv),
        updated_at = ?
    WHERE id = ?
  `).bind(
    title ?? null, 
    salutation ?? null, 
    letterBody ?? null, 
    signature ?? null, 
    deliveryTrigger ?? null, 
    scheduledDate ?? null, 
    encrypted !== undefined ? (encrypted ? 1 : 0) : null,
    encryption_iv ?? null,
    now, 
    letterId
  ).run();
  
  // Update recipients if provided
  if (recipientIds && recipientIds.length > 0) {
    // Remove existing recipients
    await c.env.DB.prepare(`
      DELETE FROM letter_recipients WHERE letter_id = ?
    `).bind(letterId).run();
    
    await c.env.DB.batch(
      recipientIds.map((recipientId: string) =>
        c.env.DB.prepare(`INSERT INTO letter_recipients (id, letter_id, family_member_id, created_at) VALUES (?, ?, ?, ?)`)
          .bind(crypto.randomUUID(), letterId, recipientId, now)
      )
    );
  }
  
  const letter = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ?
  `).bind(letterId).first();
  
  return c.json({
    id: letter?.id,
    title: letter?.title,
    salutation: letter?.salutation,
    body: letter?.body,
    signature: letter?.signature,
    deliveryTrigger: letter?.delivery_trigger,
    encrypted: !!letter?.encrypted,
    encryptionIv: letter?.encryption_iv,
    updatedAt: letter?.updated_at,
  });
});

// Seal a letter
lettersRoutes.post('/:id/seal', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');
  
  // Verify ownership
  const existing = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ? AND user_id = ?
  `).bind(letterId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Letter not found' }, 404);
  }
  
  if (existing.sealed_at) {
    return c.json({ error: 'Letter is already sealed' }, 400);
  }
  
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE letters SET sealed_at = ?, updated_at = ? WHERE id = ?
  `).bind(now, now, letterId).run();
  
  // Get recipients for delivery scheduling
  const recipients = await c.env.DB.prepare(`
    SELECT fm.email, fm.name FROM family_members fm
    JOIN letter_recipients lr ON fm.id = lr.family_member_id
    WHERE lr.letter_id = ?
  `).bind(letterId).all();
  
  const recipientsWithEmail = (recipients.results as any[]).filter(r => r.email);
  if (recipientsWithEmail.length > 0) {
    await c.env.DB.batch(
      recipientsWithEmail.map((recipient: any) =>
        c.env.DB.prepare(`INSERT INTO letter_deliveries (id, letter_id, recipient_email, status, created_at, updated_at) VALUES (?, ?, ?, 'PENDING', ?, ?)`)
          .bind(crypto.randomUUID(), letterId, recipient.email, now, now)
      )
    );
  }
  
  const letter = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ?
  `).bind(letterId).first();
  
  return c.json({
    id: letter?.id,
    title: letter?.title,
    sealedAt: letter?.sealed_at,
    message: 'Letter sealed successfully',
  });
});

// Delete a letter
lettersRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');
  
  // Verify ownership
  const existing = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ? AND user_id = ?
  `).bind(letterId, userId).first();
  
  if (!existing) {
    return c.json({ error: 'Letter not found' }, 404);
  }
  
  await c.env.DB.prepare(`
    DELETE FROM letters WHERE id = ?
  `).bind(letterId).run();
  
  return c.body(null, 204);
});
