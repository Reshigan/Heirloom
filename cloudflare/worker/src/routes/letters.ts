/**
 * Letters Routes - Cloudflare Workers
 * Handles letter CRUD operations
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { classifyEmotionWithAI } from '../services/tinyllm';
import { mirrorIntoDefaultThread, mirrorLetterUpdate, mirrorLetterDelete } from '../services/threadMesh';
import { recordRevision, withinGrace, mutableUntilFrom, listRevisions } from '../lib/legacyArchive';
import { sendEmail, notifyAuthorDeliveryFailed } from '../utils/email';
import { letterDeliveryEmail, letterMilestoneTeaserEmail, letterOpenedNotificationEmail } from '../email-templates';

export const lettersRoutes = new Hono<AppEnv>();

/**
 * The composer (§6.3) offers five delivery triggers — now, date, death,
 * milestone, event — but the letters table CHECK constraint only permits
 * IMMEDIATE / SCHEDULED / POSTHUMOUS. Normalize the richer UI vocabulary onto
 * the storage enum here, at the API boundary, so the DB contract stays intact
 * and writes never 500 on a constraint violation:
 *   death            → POSTHUMOUS (released by the dead-man's-switch; bookPdf
 *                      already excludes POSTHUMOUS from the printed archive)
 *   milestone/event  → SCHEDULED, held with a null scheduled_date (no generic
 *                      cron sweeps letters on scheduled_date, so it stays
 *                      sealed until released — the intended "at the milestone")
 *   date             → SCHEDULED
 *   anything else    → IMMEDIATE
 */
function normalizeDeliveryTrigger(t: unknown): 'IMMEDIATE' | 'SCHEDULED' | 'POSTHUMOUS' {
  switch (String(t ?? '').toUpperCase()) {
    case 'SCHEDULED':
    case 'DATE':
    case 'MILESTONE':
    case 'EVENT':
      return 'SCHEDULED';
    case 'POSTHUMOUS':
    case 'AFTER_DEATH':
    case 'DEATH':
      return 'POSTHUMOUS';
    default:
      return 'IMMEDIATE';
  }
}

// AI-powered letter suggestion using TinyLLM with Cloudflare Workers AI
lettersRoutes.post('/ai-suggest', async (c) => {
  const body = await c.req.json();
  const { body: letterBody, recipientNames } = body;
  
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
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  
  // Append-only: never surface soft-deleted (revoked) letters.
  let query = `SELECT * FROM letters WHERE user_id = ? AND deleted_at IS NULL`;
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
        ? `SELECT COUNT(*) as count FROM letters WHERE user_id = ? AND deleted_at IS NULL AND sealed_at IS NULL`
        : status === 'sealed'
        ? `SELECT COUNT(*) as count FROM letters WHERE user_id = ? AND deleted_at IS NULL AND sealed_at IS NOT NULL`
        : `SELECT COUNT(*) as count FROM letters WHERE user_id = ? AND deleted_at IS NULL`
    ).bind(userId),
  ]);
  
  const letterIds = letters.results.map((l: any) => l.id);
  let recipientMap: Record<string, any[]> = {};
  let legacyRecipientMap: Record<string, any[]> = {};

  if (letterIds.length > 0) {
    const placeholders = letterIds.map(() => '?').join(',');
    // Both recipient joins are keyed on the current page's letter ids in a
    // single round-trip each (no per-letter N+1). Mirrors the single-letter
    // GET, which joins family recipients AND legacy_contacts recipients.
    const [allRecipients, allLegacyRecipients] = await c.env.DB.batch([
      c.env.DB.prepare(`
        SELECT lr.letter_id, fm.id, fm.name, fm.relationship FROM family_members fm
        JOIN letter_recipients lr ON fm.id = lr.family_member_id
        WHERE lr.letter_id IN (${placeholders})
      `).bind(...letterIds),
      c.env.DB.prepare(`
        SELECT llr.letter_id, lc.id, lc.name, lc.email FROM legacy_contacts lc
        JOIN letter_legacy_recipients llr ON lc.id = llr.legacy_contact_id
        WHERE llr.letter_id IN (${placeholders}) AND lc.deleted_at IS NULL
      `).bind(...letterIds),
    ]);

    for (const r of allRecipients.results as any[]) {
      if (!recipientMap[r.letter_id]) recipientMap[r.letter_id] = [];
      recipientMap[r.letter_id].push({ id: r.id, name: r.name, relationship: r.relationship });
    }
    for (const r of allLegacyRecipients.results as any[]) {
      if (!legacyRecipientMap[r.letter_id]) legacyRecipientMap[r.letter_id] = [];
      legacyRecipientMap[r.letter_id].push({ id: r.id, name: r.name, email: r.email });
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
    milestoneLabel: letter.milestone_label,
    sealedAt: letter.sealed_at,
    deliveredAt: letter.delivered_at,
    encrypted: !!letter.encrypted,
    recipients: recipientMap[letter.id] || [],
    legacyRecipients: legacyRecipientMap[letter.id] || [],
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

// Milestone letters waiting for ME (the logged-in recipient).
//
// A milestone letter is held sealed (delivery_trigger SCHEDULED, null
// scheduled_date) and carries a milestone_label. We link recipients to platform
// users by email: a letter is "awaiting me" if one of its recipients shares the
// current user's email, it isn't yet delivered, and it isn't my own letter.
// Registered BEFORE GET /:id so "awaiting-me" isn't parsed as a letter id.
lettersRoutes.get('/awaiting-me', async (c) => {
  const userId = c.get('userId');
  const me = await c.env.DB.prepare(`SELECT email, first_name, last_name FROM users WHERE id = ?`).bind(userId).first() as
    | { email: string; first_name: string; last_name: string }
    | null;
  if (!me?.email) return c.json({ data: [] });

  const rows = await c.env.DB.prepare(`
    SELECT l.id, l.salutation, l.milestone_label, l.created_at,
           u.first_name AS author_first, u.last_name AS author_last
    FROM letters l
    JOIN letter_recipients lr ON lr.letter_id = l.id
    JOIN family_members fm ON fm.id = lr.family_member_id
    JOIN users u ON u.id = l.user_id
    WHERE lower(fm.email) = lower(?)
      AND l.user_id != ?
      AND l.milestone_label IS NOT NULL
      AND l.sealed_at IS NOT NULL
      AND l.delivered_at IS NULL
      AND l.deleted_at IS NULL
    ORDER BY l.created_at DESC
    LIMIT 50
  `).bind(me.email, userId).all();

  return c.json({
    data: (rows.results as any[]).map((r) => ({
      id: r.id,
      salutation: r.salutation,
      milestoneLabel: r.milestone_label,
      from: `${r.author_first ?? ''} ${r.author_last ?? ''}`.trim() || 'your family',
      createdAt: r.created_at,
    })),
  });
});

// Letters I've received and opened — these become part of MY cloth.
//
// Once a recipient opens a released letter, it's woven into their own tapestry:
// the words another author left them now belong to their thread too. This
// returns the full opened letters addressed to the current user (by email),
// carrying the original author's identity for dye/attribution.
// Registered BEFORE GET /:id.
lettersRoutes.get('/received', async (c) => {
  const userId = c.get('userId');
  const me = await c.env.DB.prepare(`SELECT email FROM users WHERE id = ?`).bind(userId).first() as
    | { email: string }
    | null;
  if (!me?.email) return c.json({ data: [] });

  const rows = await c.env.DB.prepare(`
    SELECT l.id, l.title, l.salutation, l.body, l.signature, l.milestone_label,
           l.delivered_at, l.created_at,
           u.first_name AS author_first, u.last_name AS author_last
    FROM letters l
    JOIN letter_recipients lr ON lr.letter_id = l.id
    JOIN family_members fm ON fm.id = lr.family_member_id
    JOIN users u ON u.id = l.user_id
    WHERE lower(fm.email) = lower(?)
      AND l.user_id != ?
      AND l.delivered_at IS NOT NULL
      AND l.deleted_at IS NULL
    ORDER BY l.delivered_at DESC
    LIMIT 200
  `).bind(me.email, userId).all();

  return c.json({
    data: (rows.results as any[]).map((r) => ({
      id: r.id,
      title: r.title,
      salutation: r.salutation,
      body: r.body,
      signature: r.signature,
      milestoneLabel: r.milestone_label,
      from: `${r.author_first ?? ''} ${r.author_last ?? ''}`.trim() || 'your family',
      deliveredAt: r.delivered_at,
      createdAt: r.created_at,
      received: true,
    })),
  });
});

// B4 (Day 23): share-this-note — mint an opaque, revocable read-only link.
// Registered before GET /:id so "shared" is never parsed as a letter id. The
// token is a high-entropy opaque string (never the letter id), so a leaked link
// can be killed without rotating the letter. Owner-only: only the letter's
// author can mint a share link for it.
lettersRoutes.post('/:id/share-token', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');

  const owned = await c.env.DB.prepare(
    `SELECT id FROM letters WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  ).bind(letterId, userId).first();
  if (!owned) return c.json({ error: 'Letter not found' }, 404);

  const token = crypto.randomUUID() + crypto.randomUUID();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO letter_share_tokens (id, letter_id, user_id, token) VALUES (?, ?, ?, ?)`,
  ).bind(id, letterId, userId, token).run();

  const origin = c.env?.APP_URL || new URL(c.req.url).origin;
  return c.json({ token, url: `${origin}/note/${token}` });
});

// B4: list this letter's active share links (author only). Lets the author see
// and revoke links they've already minted without minting a new one each time.
lettersRoutes.get('/:id/share-tokens', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');

  const owned = await c.env.DB.prepare(
    `SELECT id FROM letters WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  ).bind(letterId, userId).first();
  if (!owned) return c.json({ error: 'Letter not found' }, 404);

  const rows = await c.env.DB.prepare(
    `SELECT id, token, revoked_at, created_at FROM letter_share_tokens
     WHERE letter_id = ? AND user_id = ? ORDER BY created_at DESC`,
  ).bind(letterId, userId).all();

  return c.json({
    data: (rows.results as any[]).map((r) => ({
      id: r.id,
      token: r.token,
      revokedAt: r.revoked_at,
      createdAt: r.created_at,
      url: `${c.env?.APP_URL || new URL(c.req.url).origin}/note/${r.token}`,
    })),
  });
});

// B4: revoke a share link. The token row carries user_id, so only its author can
// revoke. Idempotent: revoking an already-revoked link is a no-op.
lettersRoutes.delete('/share-token/:tokenId', async (c) => {
  const userId = c.get('userId');
  const tokenId = c.req.param('tokenId');

  const row = await c.env.DB.prepare(
    `SELECT id, user_id, revoked_at FROM letter_share_tokens WHERE id = ?`,
  ).bind(tokenId).first() as { id: string; user_id: string; revoked_at: string | null } | null;
  if (!row) return c.json({ error: 'Share link not found' }, 404);
  if (row.user_id !== userId) return c.json({ error: 'Not yours to revoke' }, 403);
  if (row.revoked_at) return c.json({ ok: true });

  await c.env.DB.prepare(
    `UPDATE letter_share_tokens SET revoked_at = datetime('now') WHERE id = ?`,
  ).bind(tokenId).run();
  return c.json({ ok: true });
});

// Get a specific letter
// Selvedge: the append-only revision log for one letter, newest first.
// No deleted_at filter — revoked entries keep their history readable.
lettersRoutes.get('/:id/revisions', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');

  const owned = await c.env.DB.prepare(
    `SELECT id FROM letters WHERE id = ? AND user_id = ?`,
  ).bind(letterId, userId).first();
  if (!owned) {
    return c.json({ error: 'Letter not found' }, 404);
  }

  const revisions = await listRevisions(c.env, 'letter', letterId);
  return c.json({ revisions });
});

lettersRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');

  const letter = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ? AND user_id = ? AND deleted_at IS NULL
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

  // Get legacy-contact recipients (named beyond the family roster).
  const legacyRecipients = await c.env.DB.prepare(`
    SELECT lc.id, lc.name, lc.email FROM legacy_contacts lc
    JOIN letter_legacy_recipients llr ON lc.id = llr.legacy_contact_id
    WHERE llr.letter_id = ? AND lc.deleted_at IS NULL
  `).bind(letterId).all();

  return c.json({
    id: letter.id,
    title: letter.title,
    salutation: letter.salutation,
    body: letter.body,
    signature: letter.signature,
    deliveryTrigger: letter.delivery_trigger,
    scheduledDate: letter.scheduled_date,
    milestoneLabel: letter.milestone_label,
    sealedAt: letter.sealed_at,
    deliveredAt: letter.delivered_at,
    encrypted: !!letter.encrypted,
    encryptionIv: letter.encryption_iv,
    recipients: recipients.results.map((r: any) => ({
      id: r.id,
      name: r.name,
      relationship: r.relationship,
      email: r.email,
    })),
    legacyRecipients: legacyRecipients.results.map((r: any) => ({
      id: r.id,
      name: r.name,
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
    milestoneLabel,
    recipientIds,
    legacyRecipientIds,
    encrypted,
    encryption_iv
  } = body;

  if (!letterBody) {
    return c.json({ error: 'Letter body is required' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const trigger = normalizeDeliveryTrigger(deliveryTrigger);

  // Store encrypted flag and IV if provided (E2E encryption)
  const mutableUntil = mutableUntilFrom(now);
  await c.env.DB.prepare(`
    INSERT INTO letters (id, user_id, title, salutation, body, signature, delivery_trigger, scheduled_date, milestone_label, encrypted, encryption_iv, mutable_until, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, title || null, salutation || null, letterBody, signature || null, trigger, scheduledDate || null, milestoneLabel || null, encrypted ? 1 : 0, encryption_iv || null, mutableUntil, now, now).run();

  // Dual-write into the Family Thread; SCHEDULED letters get a DATE unlock.
  await mirrorIntoDefaultThread(c.env, userId, {
    title: title || salutation || null,
    dateLock: trigger === 'SCHEDULED' ? scheduledDate || null : null,
  });

  if (recipientIds && recipientIds.length > 0) {
    // Verify every recipient belongs to the authenticated user (IDOR guard)
    const ownedCheck = await c.env.DB.prepare(
      `SELECT COUNT(*) as n FROM family_members WHERE id IN (${recipientIds.map(() => '?').join(',')}) AND user_id = ?`
    ).bind(...recipientIds, userId).first() as { n: number } | null;
    if (!ownedCheck || ownedCheck.n !== recipientIds.length) {
      return c.json({ error: 'One or more recipients not found' }, 400);
    }
    await c.env.DB.batch(
      recipientIds.map((recipientId: string) =>
        c.env.DB.prepare(`INSERT INTO letter_recipients (id, letter_id, family_member_id, created_at) VALUES (?, ?, ?, ?)`)
          .bind(crypto.randomUUID(), id, recipientId, now)
      )
    );
  }

  // Populate inherit access-control table for legacy contact recipients.
  // legacyRecipientIds are legacy_contacts.id values owned by this user.
  if (legacyRecipientIds && legacyRecipientIds.length > 0) {
    const lcCheck = await c.env.DB.prepare(
      `SELECT COUNT(*) as n FROM legacy_contacts WHERE id IN (${legacyRecipientIds.map(() => '?').join(',')}) AND user_id = ? AND deleted_at IS NULL`
    ).bind(...legacyRecipientIds, userId).first() as { n: number } | null;
    if (!lcCheck || lcCheck.n !== legacyRecipientIds.length) {
      return c.json({ error: 'One or more legacy contact recipients not found' }, 400);
    }
    await c.env.DB.batch(
      legacyRecipientIds.map((contactId: string) =>
        c.env.DB.prepare(`INSERT OR IGNORE INTO letter_legacy_recipients (letter_id, legacy_contact_id) VALUES (?, ?)`)
          .bind(id, contactId)
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
    milestoneLabel: letter?.milestone_label,
    deliveredAt: letter?.delivered_at,
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
  
  // Verify ownership (a soft-deleted letter is also un-editable)
  const existing = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).bind(letterId, userId).first();

  if (!existing) {
    return c.json({ error: 'Letter not found' }, 404);
  }

  // Note: sealed_at check intentionally removed — authors can always edit their letters.
  // Sealed status controls RECIPIENT access, not author write access.

  const { title, salutation, body: letterBody, signature, deliveryTrigger, scheduledDate, milestoneLabel, recipientIds, legacyRecipientIds, encrypted, encryption_iv } = body;
  const now = new Date().toISOString();
  // Normalize only when the client actually sends a trigger; undefined leaves
  // the existing value untouched via COALESCE below.
  const normalizedTrigger = deliveryTrigger != null ? normalizeDeliveryTrigger(deliveryTrigger) : null;

  // Append-only: snapshot prior values to the immutable revision log before edit.
  await recordRevision(c.env, 'letter', letterId, userId, {
    title: existing.title,
    salutation: existing.salutation,
    body: existing.body,
    signature: existing.signature,
    delivery_trigger: existing.delivery_trigger,
    scheduled_date: existing.scheduled_date,
    milestone_label: existing.milestone_label,
    encrypted: existing.encrypted,
    encryption_iv: existing.encryption_iv,
    updated_at: existing.updated_at,
  }, withinGrace(existing.mutable_until as string | null) ? 'edit' : 'amendment');

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
        milestone_label = COALESCE(?, milestone_label),
        encrypted = COALESCE(?, encrypted),
        encryption_iv = COALESCE(?, encryption_iv),
        updated_at = ?
    WHERE id = ?
  `).bind(
    title ?? null,
    salutation ?? null,
    letterBody ?? null,
    signature ?? null,
    normalizedTrigger,
    scheduledDate ?? null,
    milestoneLabel ?? null,
    encrypted !== undefined ? (encrypted ? 1 : 0) : null,
    encryption_iv ?? null,
    now,
    letterId
  ).run();
  
  // Update recipients if provided
  if (recipientIds && recipientIds.length > 0) {
    // Verify every recipient belongs to the authenticated user (IDOR guard)
    const ownedCheck = await c.env.DB.prepare(
      `SELECT COUNT(*) as n FROM family_members WHERE id IN (${recipientIds.map(() => '?').join(',')}) AND user_id = ?`
    ).bind(...recipientIds, userId).first() as { n: number } | null;
    if (!ownedCheck || ownedCheck.n !== recipientIds.length) {
      return c.json({ error: 'One or more recipients not found' }, 400);
    }
    // Remove existing recipients
    await c.env.DB.prepare(`DELETE FROM letter_recipients WHERE letter_id = ?`).bind(letterId).run();
    await c.env.DB.batch(
      recipientIds.map((recipientId: string) =>
        c.env.DB.prepare(`INSERT INTO letter_recipients (id, letter_id, family_member_id, created_at) VALUES (?, ?, ?, ?)`)
          .bind(crypto.randomUUID(), letterId, recipientId, now)
      )
    );
  }
  
  // Update legacy contact recipients if provided — replace the full set.
  // Intentional full-replace: this junction is routing metadata (who a letter is
  // addressed to), not append-only legacy content, so a PATCH overwrites it wholesale.
  if (legacyRecipientIds !== undefined) {
    await c.env.DB.prepare(`DELETE FROM letter_legacy_recipients WHERE letter_id = ?`).bind(letterId).run();
    if (legacyRecipientIds && legacyRecipientIds.length > 0) {
      const lcCheck = await c.env.DB.prepare(
        `SELECT COUNT(*) as n FROM legacy_contacts WHERE id IN (${legacyRecipientIds.map(() => '?').join(',')}) AND user_id = ? AND deleted_at IS NULL`
      ).bind(...legacyRecipientIds, userId).first() as { n: number } | null;
      if (!lcCheck || lcCheck.n !== legacyRecipientIds.length) {
        return c.json({ error: 'One or more legacy contact recipients not found' }, 400);
      }
      await c.env.DB.batch(
        legacyRecipientIds.map((contactId: string) =>
          c.env.DB.prepare(`INSERT OR IGNORE INTO letter_legacy_recipients (letter_id, legacy_contact_id) VALUES (?, ?)`)
            .bind(letterId, contactId)
        )
      );
    }
  }

  if (title !== undefined || salutation !== undefined) {
    await mirrorLetterUpdate(c.env, letterId, { title, salutation });
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
    milestoneLabel: letter?.milestone_label,
    deliveredAt: letter?.delivered_at,
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
    SELECT * FROM letters WHERE id = ? AND user_id = ? AND deleted_at IS NULL
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

    // Identify the sender once for any seal-time email below.
    const author = await c.env.DB.prepare(`SELECT first_name, last_name FROM users WHERE id = ?`).bind(userId).first() as
      | { first_name: string; last_name: string }
      | null;
    const senderName = `${author?.first_name ?? ''} ${author?.last_name ?? ''}`.trim() || 'Someone in your family';

    if (existing.milestone_label) {
      // Milestone teaser (viral hook): the moment a milestone letter is sealed,
      // tell each recipient something awaits them for the named moment — without
      // revealing the content. The letter itself stays sealed until release/open.
      for (const recipient of recipientsWithEmail) {
        try {
          const { subject, html } = letterMilestoneTeaserEmail(
            recipient.name || 'there',
            senderName,
            String(existing.milestone_label)
          );
          await sendEmail(c.env, { from: 'Heirloom <noreply@heirloom.blue>', to: recipient.email, subject, html }, 'letter_milestone_teaser');
        } catch (err) {
          console.error('Milestone teaser email failed', recipient.email, err);
        }
      }
    } else if (String(existing.delivery_trigger) === 'IMMEDIATE') {
      // Immediate, non-milestone letter: the recipient already has an email at
      // seal time, so send the full letter now and mark it delivered. Without
      // this an IMMEDIATE letter sat as a PENDING row that nothing sent until
      // the recipient's family record was next edited (redeliverPendingLetters).
      let delivered = 0;
      const failedEmails: string[] = [];
      for (const recipient of recipientsWithEmail) {
        try {
          const { subject, html } = letterDeliveryEmail(recipient.name || 'there', senderName, {
            salutation: String(existing.salutation || ''),
            body: String(existing.body || ''),
            signature: String(existing.signature || ''),
          });
          const result = await sendEmail(c.env, { from: 'Heirloom <noreply@heirloom.blue>', to: recipient.email, subject, html }, 'letter_delivery');
          // Only mark DELIVERED / stamp delivered_at when the provider accepted
          // the send. A failed send leaves the row PENDING so redeliverPendingLetters
          // can retry it later — never silently swallow the failure.
          if (!result.success) {
            failedEmails.push(recipient.email);
            continue;
          }
          await c.env.DB.prepare(`
            UPDATE letter_deliveries SET status = 'DELIVERED', sent_at = ?, delivered_at = ?, updated_at = ?
            WHERE letter_id = ? AND recipient_email = ?
          `).bind(now, now, now, letterId, recipient.email).run();
          delivered++;
        } catch (err) {
          console.error('Immediate letter delivery failed', recipient.email, err);
          failedEmails.push(recipient.email);
        }
      }
      if (delivered > 0) {
        await c.env.DB.prepare(`UPDATE letters SET delivered_at = ?, updated_at = ? WHERE id = ?`)
          .bind(now, now, letterId).run();
      }
      await notifyAuthorDeliveryFailed(c.env, userId, failedEmails);
    }
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

// Release a milestone letter (author / family action).
//
// Milestone letters are held sealed with no scheduled date — nothing auto-fires
// them (and we deliberately never auto-open on a keyword match). When the family
// judges the milestone has arrived, the author releases the letter: every
// recipient with a saved email is sent the letter by email, and the letter is
// marked delivered so any on-platform recipient sees it as opened too.
lettersRoutes.post('/:id/release', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');

  const letter = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).bind(letterId, userId).first() as any;

  if (!letter) return c.json({ error: 'Letter not found' }, 404);
  if (!letter.sealed_at) return c.json({ error: 'Letter must be sealed before it can be released' }, 400);
  if (letter.delivered_at) return c.json({ error: 'Letter has already been released' }, 400);

  // Author name, family list, and legacy list are independent reads — fetch in parallel.
  const [author, recipients, legacyRecipients] = await Promise.all([
    c.env.DB.prepare(`SELECT first_name, last_name FROM users WHERE id = ?`).bind(userId).first() as Promise<
      { first_name: string; last_name: string } | null
    >,
    c.env.DB.prepare(`
      SELECT fm.email, fm.name FROM family_members fm
      JOIN letter_recipients lr ON fm.id = lr.family_member_id
      WHERE lr.letter_id = ?
    `).bind(letterId).all(),
    c.env.DB.prepare(`
      SELECT lc.email, lc.name FROM legacy_contacts lc
      JOIN letter_legacy_recipients llr ON lc.id = llr.legacy_contact_id
      WHERE llr.letter_id = ? AND lc.deleted_at IS NULL
    `).bind(letterId).all(),
  ]);
  const senderName = `${author?.first_name ?? ''} ${author?.last_name ?? ''}`.trim() || 'your family';

  // Family + legacy contacts, deduped by email (family wins on a clash so nobody is emailed twice).
  const recipientsWithEmail: { email: string; name: string }[] = [];
  const seenEmails = new Set<string>();
  for (const r of [...(recipients.results as any[]), ...(legacyRecipients.results as any[])]) {
    if (!r.email) continue;
    const key = String(r.email).toLowerCase();
    if (seenEmails.has(key)) continue;
    seenEmails.add(key);
    recipientsWithEmail.push({ email: r.email, name: r.name });
  }
  const now = new Date().toISOString();
  const deliveredEmails: string[] = [];
  const failedEmails: string[] = [];

  // Send emails first (each gated on result.success); defer all DB writes to one
  // batch. A failed send is NOT pushed to deliveredEmails, so its delivery row
  // stays PENDING for a later retry rather than being marked DELIVERED unsent.
  for (const recipient of recipientsWithEmail) {
    try {
      const { subject, html } = letterDeliveryEmail(recipient.name || 'there', senderName, {
        salutation: letter.salutation || '',
        body: letter.body || '',
        signature: letter.signature || '',
      });
      const result = await sendEmail(
        c.env,
        {
          from: 'Heirloom <noreply@heirloom.blue>',
          to: recipient.email,
          subject,
          html,
        },
        'letter_delivery'
      );
      if (result.success) {
        deliveredEmails.push(recipient.email);
      } else {
        failedEmails.push(recipient.email);
      }
    } catch (err) {
      console.error('Letter release email failed', recipient.email, err);
      failedEmails.push(recipient.email);
    }
  }

  // One round-trip for all delivery rows + the letter, instead of N+1 sequential writes.
  const writes = deliveredEmails.map((email) =>
    c.env.DB.prepare(`
      UPDATE letter_deliveries SET status = 'DELIVERED', sent_at = ?, delivered_at = ?, updated_at = ?
      WHERE letter_id = ? AND recipient_email = ?
    `).bind(now, now, now, letterId, email)
  );
  // Mark the letter released only when nothing failed (all sent, or there were no
  // emailable recipients). If any send failed, leave delivered_at NULL so the
  // author can re-release to retry — the `already released` guard would otherwise
  // permanently lock a letter that never reached someone.
  if (failedEmails.length === 0) {
    writes.push(
      c.env.DB.prepare(`UPDATE letters SET delivered_at = ?, updated_at = ? WHERE id = ?`).bind(now, now, letterId)
    );
  }
  if (writes.length > 0) await c.env.DB.batch(writes);
  await notifyAuthorDeliveryFailed(c.env, userId, failedEmails);
  const sent = deliveredEmails.length;

  return c.json({ id: letterId, deliveredAt: failedEmails.length === 0 ? now : null, emailsSent: sent, failed: failedEmails.length, message: 'Letter released' });
});

// Open a milestone letter (recipient action).
//
// A logged-in recipient (matched by email against the letter's recipients) opens
// the letter the family released — marking it delivered if it wasn't already, and
// returning the full letter body to reveal. Human-confirmed: the recipient chooses
// to open; we never reveal it automatically.
lettersRoutes.post('/:id/open', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');

  const me = await c.env.DB.prepare(`SELECT email, first_name, last_name FROM users WHERE id = ?`).bind(userId).first() as
    | { email: string; first_name: string; last_name: string }
    | null;
  if (!me?.email) return c.json({ error: 'No email on account' }, 400);

  const letter = await c.env.DB.prepare(`
    SELECT l.* FROM letters l
    JOIN letter_recipients lr ON lr.letter_id = l.id
    JOIN family_members fm ON fm.id = lr.family_member_id
    WHERE l.id = ?
      AND lower(fm.email) = lower(?)
      AND l.sealed_at IS NOT NULL
      AND l.deleted_at IS NULL
    LIMIT 1
  `).bind(letterId, me.email).first() as any;

  if (!letter) return c.json({ error: 'Letter not found or not addressed to you' }, 404);

  const now = new Date().toISOString();
  const firstOpen = !letter.delivered_at;
  if (firstOpen) {
    await c.env.DB.prepare(`UPDATE letters SET delivered_at = ?, updated_at = ? WHERE id = ?`)
      .bind(now, now, letterId).run();

    // Notify the originator — but only on the first open, and only if they're
    // still alive (a triggered/verified/released dead-man switch means they're
    // gone, and a "your letter was opened" note would be macabre).
    try {
      const switchRow = await c.env.DB.prepare(`
        SELECT status FROM dead_man_switches WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
      `).bind(letter.user_id).first() as { status: string } | null;
      const deceased = !!switchRow && ['TRIGGERED', 'VERIFIED', 'RELEASED'].includes(switchRow.status);

      if (!deceased) {
        const author = await c.env.DB.prepare(`SELECT email, first_name, last_name FROM users WHERE id = ?`)
          .bind(letter.user_id).first() as { email: string; first_name: string; last_name: string } | null;
        const recipientName = `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim() || 'Someone';
        const authorName = `${author?.first_name ?? ''} ${author?.last_name ?? ''}`.trim() || 'there';

        await c.env.DB.prepare(`
          INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
          VALUES (?, ?, 'LETTER_OPENED', ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          letter.user_id,
          'Your letter was opened',
          `${recipientName} opened the letter you left them${letter.milestone_label ? ` for ${letter.milestone_label}` : ''}.`,
          JSON.stringify({ letterId, recipientName }),
          now
        ).run();

        if (author?.email) {
          const { subject, html } = letterOpenedNotificationEmail(authorName, recipientName, letter.milestone_label || null);
          await sendEmail(c.env, { from: 'Heirloom <noreply@heirloom.blue>', to: author.email, subject, html }, 'letter_opened');
        }
      }
    } catch (err) {
      console.error('Originator open-notification failed', letterId, err);
    }
  }

  return c.json({
    id: letter.id,
    title: letter.title,
    salutation: letter.salutation,
    body: letter.body,
    signature: letter.signature,
    milestoneLabel: letter.milestone_label,
    openedAt: letter.delivered_at || now,
  });
});

// "Delete" a letter — append-only soft revoke. The row is preserved and simply
// hidden from reads; true erasure happens only at the account level (GDPR).
lettersRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');
  const reason = c.req.query('reason') || null;

  // Verify ownership (idempotent: an already-revoked letter is treated as gone).
  const existing = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).bind(letterId, userId).first();

  if (!existing) {
    return c.json({ error: 'Letter not found' }, 404);
  }

  const now = new Date().toISOString();

  // Preserve the final state in the revision log, then revoke (soft-delete).
  await recordRevision(c.env, 'letter', letterId, userId, {
    title: existing.title,
    salutation: existing.salutation,
    body: existing.body,
    signature: existing.signature,
    sealed_at: existing.sealed_at,
  }, 'revoke');

  await c.env.DB.prepare(`
    UPDATE letters SET deleted_at = ?, deleted_reason = ?, updated_at = ? WHERE id = ?
  `).bind(now, reason, now, letterId).run();

  await mirrorLetterDelete(c.env, letterId);

  return c.body(null, 204);
});

// Restore a revoked letter within the 7-day grace window.
//
// Mirrors family.ts PATCH /:id/restore — flips deleted_at back to NULL,
// owner-scoped, only while the soft-delete is younger than the same 7-day
// window. Returns the restored letter row. The DELETE above only sets
// deleted_at, so the underlying row is intact and simply un-hidden here.
lettersRoutes.patch('/:id/restore', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');

  const existing = await c.env.DB.prepare(`
    SELECT * FROM letters
    WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL
      AND deleted_at > datetime('now', '-7 days')
  `).bind(letterId, userId).first() as any;

  if (!existing) {
    return c.json({ error: 'Letter not found or grace period expired' }, 404);
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    UPDATE letters SET deleted_at = NULL, deleted_reason = NULL, updated_at = ? WHERE id = ?
  `).bind(now, letterId).run();

  return c.json({
    id: existing.id,
    title: existing.title,
    salutation: existing.salutation,
    body: existing.body,
    signature: existing.signature,
    deliveryTrigger: existing.delivery_trigger,
    scheduledDate: existing.scheduled_date,
    milestoneLabel: existing.milestone_label,
    sealedAt: existing.sealed_at,
    deliveredAt: existing.delivered_at,
    encrypted: !!existing.encrypted,
    encryptionIv: existing.encryption_iv,
    deletedAt: null,
    createdAt: existing.created_at,
    updatedAt: now,
  });
});
