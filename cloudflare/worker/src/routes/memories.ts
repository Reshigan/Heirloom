/**
 * Memories Routes - Cloudflare Workers
 * Handles memory CRUD operations with R2 storage
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { classifyEmotionWithAI } from '../services/tinyllm';
import { mirrorIntoDefaultThread, mirrorMemoryUpdate, mirrorMemoryDelete } from '../services/threadMesh';
import {
  descriptionColumnsForWrite,
  readDescription,
  recordRevision,
  mutableUntilFrom,
  withinGrace,
  listRevisions,
} from '../lib/legacyArchive';
import { sendEmail } from '../utils/email';
import { createNotification, kinJoinedEmail } from '../utils/notifications';
import { checkStorageQuota } from '../lib/quota';

export const memoriesRoutes = new Hono<AppEnv>();

// Get all memories with pagination and filtering
memoriesRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const type = c.req.query('type');
  const recipientId = c.req.query('recipientId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  
  // Append-only: never surface soft-deleted (revoked) rows.
  let query = `SELECT * FROM memories WHERE user_id = ? AND deleted_at IS NULL`;
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
  let countQuery = `SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND deleted_at IS NULL`;
  const countParams: any[] = [userId];
  if (type) {
    countQuery += ` AND type = ?`;
    countParams.push(type);
  }
  const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();

  // Bequest routing for the page: one extra query keyed by the page's memory ids,
  // grouped client-side, so browsing shows legacyRecipients without N+1. Uses the
  // SAME join/shape as the single-entry GET (legacy_contacts → memory_legacy_recipients).
  const pageIds = memories.results.map((m: any) => m.id);
  const legacyByMemory = new Map<string, Array<{ id: any; name: any; email: any }>>();
  if (pageIds.length > 0) {
    const legacyRows = await c.env.DB.prepare(`
      SELECT mlr.memory_id, lc.id, lc.name, lc.email FROM legacy_contacts lc
      JOIN memory_legacy_recipients mlr ON lc.id = mlr.legacy_contact_id
      WHERE mlr.memory_id IN (${pageIds.map(() => '?').join(',')}) AND lc.deleted_at IS NULL
    `).bind(...pageIds).all();
    for (const r of legacyRows.results as any[]) {
      const list = legacyByMemory.get(r.memory_id) || [];
      list.push({ id: r.id, name: r.name, email: r.email });
      legacyByMemory.set(r.memory_id, list);
    }
  }

  return c.json({
    data: await Promise.all(memories.results.map(async (m: any) => {
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
        description: await readDescription(c.env, m),
        fileUrl,
        fileKey: m.file_key,
        fileSize: m.file_size,
        mimeType: m.mime_type,
        metadata: parsedMetadata,
        emotion: parsedMetadata?.emotion || null,
        emotionConfidence: parsedMetadata?.emotionConfidence || null,
        encrypted: !!m.encrypted,
        legacyRecipients: legacyByMemory.get(m.id) || [],
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      };
    })),
    pagination: {
      page,
      limit,
      total: countResult?.count || 0,
      totalPages: Math.ceil((countResult?.count as number || 0) / limit),
    },
  });
});

// Get memories with geolocation data for map view
memoriesRoutes.get('/map', async (c) => {
  const userId = c.get('userId');
  const type = c.req.query('type');

  const memories: any[] = [];

  // Get geotagged memories
  if (!type || type === 'memory') {
    const result = await c.env.DB.prepare(`
      SELECT id, title, 'memory' as type, latitude, longitude, location_name, created_at
      FROM memories WHERE user_id = ? AND deleted_at IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY created_at DESC
    `).bind(userId).all();
    memories.push(...result.results);
  }

  // Get geotagged voice recordings
  if (!type || type === 'voice') {
    const result = await c.env.DB.prepare(`
      SELECT id, title, 'voice' as type, latitude, longitude, location_name, created_at
      FROM voice_recordings WHERE user_id = ? AND deleted_at IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY created_at DESC
    `).bind(userId).all();
    memories.push(...result.results);
  }

  // Get geotagged letters
  if (!type || type === 'letter') {
    const result = await c.env.DB.prepare(`
      SELECT id, title, 'letter' as type, latitude, longitude, location_name, created_at
      FROM letters WHERE user_id = ? AND deleted_at IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY created_at DESC
    `).bind(userId).all();
    memories.push(...result.results);
  }

  // Sort by date descending
  memories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return c.json({ memories });
});

// Get memory stats
memoriesRoutes.get('/stats/summary', async (c) => {
  const userId = c.get('userId');
  
  const [statsResult, letterCountResult, voiceStatsResult] = await c.env.DB.batch([
    c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type = 'PHOTO' THEN 1 ELSE 0 END) as photos,
        SUM(CASE WHEN type = 'VIDEO' THEN 1 ELSE 0 END) as videos,
        SUM(CASE WHEN type = 'VOICE' THEN 1 ELSE 0 END) as voice,
        SUM(CASE WHEN type = 'LETTER' THEN 1 ELSE 0 END) as letters,
        SUM(file_size) as total_storage
      FROM memories WHERE user_id = ? AND deleted_at IS NULL
    `).bind(userId),
    c.env.DB.prepare(`SELECT COUNT(*) as count FROM letters WHERE user_id = ? AND deleted_at IS NULL`).bind(userId),
    c.env.DB.prepare(`SELECT COUNT(*) as count, SUM(duration) as total_minutes FROM voice_recordings WHERE user_id = ? AND deleted_at IS NULL`).bind(userId),
  ]);
  
  const stats = statsResult.results[0] as any;
  const letterCount = letterCountResult.results[0] as any;
  const voiceStats = voiceStatsResult.results[0] as any;
  
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
  
  const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500 MB hard cap

  try {
    // Get the raw body as ArrayBuffer for R2
    const bodyData = await c.req.arrayBuffer();
    if (bodyData.byteLength === 0) {
      return c.json({ error: 'Empty file' }, 400);
    }
    if (bodyData.byteLength > MAX_UPLOAD_BYTES) {
      return c.json({ error: 'File too large. Maximum upload size is 500 MB.' }, 413);
    }

    await c.env.STORAGE.put(key, bodyData, {
      httpMetadata: { contentType },
    });

    // Generate the public URL for the file
    const fileUrl = `${c.env.API_URL}/api/memories/file/${encodeURIComponent(key)}`;

    return c.json({ success: true, key, fileUrl }, 201);
  } catch (err: any) {
    console.error('Error uploading memory to R2:', err);
    return c.json({ error: 'Failed to upload file' }, 500);
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

  const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500 MB hard cap

  try {
    // Get the raw body as ArrayBuffer for R2
    const bodyData = await c.req.arrayBuffer();
    if (bodyData.byteLength === 0) {
      return c.json({ error: 'Empty file' }, 400);
    }
    if (bodyData.byteLength > MAX_UPLOAD_BYTES) {
      return c.json({ error: 'File too large. Maximum upload size is 500 MB.' }, 413);
    }

    await c.env.STORAGE.put(key, bodyData, {
      httpMetadata: { contentType },
    });

    // Generate the public URL for the file
    const fileUrl = `${c.env.API_URL}/api/memories/file/${encodeURIComponent(key)}`;

    return c.json({ success: true, key, fileUrl }, 201);
  } catch (err: any) {
    console.error('Error uploading memory to R2:', err);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// Memories addressed to the current user by family members
memoriesRoutes.get('/received', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const user = await c.env.DB.prepare(
    `SELECT first_name, last_name, email FROM users WHERE id = ?`
  ).bind(userId).first();
  if (!user) return c.json({ received: [] });

  const email = ((user.email as string) || '').toLowerCase();
  if (!email) return c.json({ received: [] });

  // Match only on the viewer's verified email via the explicit memory_recipients
  // junction table. Name-based matching is not a reliable identity check and
  // can leak memories across accounts that share a first name.
  const result = await c.env.DB.prepare(`
    SELECT m.id, m.title, m.type, m.created_at, m.metadata,
           u.first_name AS from_first, u.last_name AS from_last
    FROM memories m
    JOIN users u ON u.id = m.user_id
    WHERE m.user_id != ?
      AND m.deleted_at IS NULL
      AND m.id IN (
        SELECT mr.memory_id FROM memory_recipients mr
        JOIN family_members fm ON fm.id = mr.family_member_id
        WHERE LOWER(fm.email) = ?
      )
    ORDER BY m.created_at DESC
    LIMIT 50
  `).bind(userId, email).all();

  return c.json({
    received: result.results.map((m: any) => ({
      id: m.id,
      title: m.title,
      type: m.type,
      createdAt: m.created_at,
      from: `${m.from_first || ''} ${m.from_last || ''}`.trim(),
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
    })),
  });
});

// ============================================
// FULL-TEXT SEARCH
// Defined BEFORE /:id so the literal segment /search is not swallowed by the param route.
// ============================================

memoriesRoutes.get('/search', async (c) => {
  const userId = c.get('userId');
  const q = c.req.query('q');
  const typeParam = c.req.query('type') || 'all'; // 'memory'|'voice'|'letter'|'all'
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

  if (!q || q.trim().length < 2) {
    return c.json({ error: 'Search query must be at least 2 characters' }, 400);
  }

  // Helper: count non-overlapping occurrences of needle in haystack (case-insensitive)
  const countOccurrences = (haystack: string, needle: string): number => {
    if (!haystack) return 0;
    const lower = haystack.toLowerCase();
    const lowerNeedle = needle.toLowerCase();
    let count = 0;
    let pos = 0;
    while ((pos = lower.indexOf(lowerNeedle, pos)) !== -1) {
      count++;
      pos += lowerNeedle.length;
    }
    return count;
  };

  // Escape LIKE metacharacters to prevent crafted % / _ patterns causing full table scans.
  const safQ = q.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
  const likePattern = `%${safQ}%`;
  const results: Array<{
    id: unknown;
    type: 'memory' | 'voice' | 'letter';
    title: string;
    snippet: string;
    created_at: unknown;
    score: number;
  }> = [];

  // Search memories (title + description). Description is encrypted at rest when
  // ENCRYPTION_MASTER_KEY is set — the base `description` column is NULLed and the
  // ciphertext lives in description_enc/iv (see legacyArchive). A raw `description
  // LIKE ?` is therefore blind to all body text once a key is configured; only the
  // plaintext title matched. Fetch the user's rows and decrypt-scan via
  // readDescription, which transparently handles both encrypted and plaintext rows.
  // The old LIKE was already a full table scan (no FTS index), so this is the same
  // cost plus a per-row decrypt; it also fixes the latent bug where matches past the
  // 120-char snippet window never scored.
  // ponytail: O(n) decrypt scan over one user's memories — fine for a family archive
  // (hundreds–low thousands). Add a blind/HMAC token index if a single thread ever
  // holds tens of thousands of entries.
  if (typeParam === 'all' || typeParam === 'memory') {
    const rows = await c.env.DB.prepare(`
      SELECT id, title, description, description_enc, description_iv, created_at
      FROM memories
      WHERE user_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC
    `).bind(userId).all();

    for (const r of rows.results) {
      const title = (r.title as string) || '';
      const description = (await readDescription(c.env, r)) || '';
      const score = countOccurrences(title, q) + countOccurrences(description, q);
      if (score === 0) continue;
      results.push({ id: r.id, type: 'memory', title, snippet: description.slice(0, 120), created_at: r.created_at, score });
    }
  }

  // Search voice recordings (title, transcript)
  if (typeParam === 'all' || typeParam === 'voice') {
    const rows = await c.env.DB.prepare(`
      SELECT id, title, transcript, created_at
      FROM voice_recordings
      WHERE user_id = ? AND deleted_at IS NULL
        AND (title LIKE ? ESCAPE '\\' OR transcript LIKE ? ESCAPE '\\')
      ORDER BY created_at DESC
    `).bind(userId, likePattern, likePattern).all();

    for (const r of rows.results) {
      const title = (r.title as string) || '';
      const transcript = (r.transcript as string) || '';
      const snippet = transcript.slice(0, 120);
      const score = countOccurrences(title, q) + countOccurrences(snippet, q);
      results.push({ id: r.id, type: 'voice', title, snippet, created_at: r.created_at, score });
    }
  }

  // Search letters (title, body)
  if (typeParam === 'all' || typeParam === 'letter') {
    const rows = await c.env.DB.prepare(`
      SELECT id, title, body, created_at
      FROM letters
      WHERE user_id = ? AND deleted_at IS NULL
        AND (title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\')
      ORDER BY created_at DESC
    `).bind(userId, likePattern, likePattern).all();

    for (const r of rows.results) {
      const title = (r.title as string) || '';
      const body = (r.body as string) || '';
      const snippet = body.slice(0, 120);
      const score = countOccurrences(title, q) + countOccurrences(snippet, q);
      results.push({ id: r.id, type: 'letter', title, snippet, created_at: r.created_at, score });
    }
  }

  // Sort by score DESC, then created_at DESC
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime();
  });

  const sliced = results.slice(0, limit);

  return c.json({
    results: sliced,
    total: results.length,
    query: q,
  });
});

// Get a specific memory
// Selvedge: the append-only revision log for one memory, newest first.
// No deleted_at filter — revoked entries keep their history readable.
memoriesRoutes.get('/:id/revisions', async (c) => {
  const userId = c.get('userId');
  const memoryId = c.req.param('id');

  const owned = await c.env.DB.prepare(
    `SELECT id FROM memories WHERE id = ? AND user_id = ?`,
  ).bind(memoryId, userId).first();
  if (!owned) {
    return c.json({ error: 'Memory not found' }, 404);
  }

  const revisions = await listRevisions(c.env, 'memory', memoryId);
  return c.json({ revisions });
});

memoriesRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const memoryId = c.req.param('id');

  const memory = await c.env.DB.prepare(`
    SELECT * FROM memories WHERE id = ? AND user_id = ? AND deleted_at IS NULL
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

  // Get legacy-contact recipients (so the Composer can rehydrate the bequest on edit).
  const legacyRecipients = await c.env.DB.prepare(`
    SELECT lc.id, lc.name, lc.email FROM legacy_contacts lc
    JOIN memory_legacy_recipients mlr ON lc.id = mlr.legacy_contact_id
    WHERE mlr.memory_id = ? AND lc.deleted_at IS NULL
  `).bind(memoryId).all();

  return c.json({
    id: memory.id,
    type: memory.type,
    title: memory.title,
    description: await readDescription(c.env, memory),
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
    legacyRecipients: legacyRecipients.results.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email,
    })),
    createdAt: memory.created_at,
    updatedAt: memory.updated_at,
  });
});

// Create a new memory
memoriesRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);
  const body = await c.req.json();
  
    const { type, title, description, fileUrl, fileKey, fileSize, mimeType, metadata, recipientIds, legacyRecipientIds, memoryDate, encrypted, encryption_iv, clientKey } = body;

    if (!type || !title) {
      return c.json({ error: 'Type and title are required' }, 400);
    }

    // Idempotency: a client may replay this POST (offline queue / retry). If a
    // memory with this client-minted key already exists for the user, return it
    // unchanged instead of inserting a duplicate. Checked BEFORE the quota gate so
    // a replay can never be rejected by a cap the original already counted toward.
    // (Mirrors voice.ts dedup.)
    if (clientKey) {
      const dup = await c.env.DB.prepare(
        `SELECT * FROM memories WHERE user_id = ? AND client_key = ? AND deleted_at IS NULL`
      ).bind(userId, clientKey).first();
      if (dup) {
        return c.json({
          id: dup.id,
          type: dup.type,
          title: dup.title,
          description: await readDescription(c.env, dup as any),
          fileUrl: dup.file_url,
          fileKey: dup.file_key,
          createdAt: dup.created_at,
        }, 200);
      }
    }

    // Must match the DB CHECK constraint exactly (migration 0045):
    // type IN ('PHOTO','VOICE','LETTER','VIDEO','TEXT','NOTE'). When these
    // drifted apart, valid-here-invalid-there types (AUDIO/LINK/DOCUMENT) passed
    // this gate then died on a raw D1 CHECK 500, and DB-valid LETTER (used by
    // the offline-note sync) was wrongly rejected here — so offline notes never
    // persisted. Keep this list identical to the constraint.
    const VALID_TYPES = ['TEXT', 'PHOTO', 'VIDEO', 'VOICE', 'LETTER', 'NOTE'];
    if (type && !VALID_TYPES.includes(type)) {
      return c.json({ error: 'Invalid memory type' }, 400);
    }

    // Enforce the plan's storage cap before persisting a file-backed entry.
    const incomingBytes = Number(fileSize) || 0;
    if (incomingBytes > 0) {
      const quota = await checkStorageQuota(c.env, userId, incomingBytes);
      if (!quota.ok) {
        return c.json({
          error: 'Storage limit reached for your plan. Upgrade for more room, or remove a few large items.',
          used: quota.used,
          cap: quota.cap,
        }, 413);
      }
    }

    // First-memory reciprocity: checked BEFORE the insert (0 prior rows = the
    // one we're about to write is their first). Used only to notify whoever
    // invited them. Best-effort — never gates the write.
    const priorCount = await c.env.DB.prepare(
      `SELECT COUNT(*) as n FROM memories WHERE user_id = ? AND deleted_at IS NULL`
    ).bind(userId).first() as { n: number } | null;
    const isFirstMemory = (priorCount?.n ?? 0) === 0;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    // Use memoryDate if provided (for historic memories), otherwise use current date
    const createdAt = memoryDate ? new Date(memoryDate).toISOString() : now;
  
  // Sanitize metadata — only allow known keys to prevent proto-pollution and
  // block the metadata.to notification-injection vector. Scalar keys take
  // string/number values; `images` is the composer's photo array; `tags` a
  // string list. Everything else (incl. metadata.to) is dropped.
  const SCALAR_METADATA_KEYS = new Set([
    'location', 'weather', 'device', 'source', 'color', 'caption',
    'visibility', 'dye', 'dyeMotif', 'entryDate',
    // Composer attributes — subject the memory is about, its relation, the
    // place/room it belongs to, and a user-chosen feeling (the subtle AI
    // classifier below only fills `emotion` when the author leaves it blank).
    'about', 'aboutRelation', 'room', 'emotion',
    // Offline provenance — when a note was drafted offline (`offlineAt` ISO
    // timestamp). `offline` is a boolean flag handled separately below.
    'offlineAt',
  ]);
  const safeUserMeta: Record<string, unknown> = {};
  if (metadata && typeof metadata === 'object') {
    for (const [k, v] of Object.entries(metadata as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      if (SCALAR_METADATA_KEYS.has(k) && (typeof v === 'string' || typeof v === 'number')) {
        safeUserMeta[k] = v;
      } else if (k === 'offline' && typeof v === 'boolean') {
        safeUserMeta[k] = v;
      } else if (k === 'tags' && Array.isArray(v)) {
        safeUserMeta[k] = v.filter((t) => typeof t === 'string').slice(0, 50);
      } else if (k === 'images' && Array.isArray(v)) {
        safeUserMeta[k] = v
          .filter((im) => im && typeof im === 'object')
          .slice(0, 30)
          .map((im) => {
            const o = im as Record<string, unknown>;
            return {
              fileKey: typeof o.fileKey === 'string' ? o.fileKey : undefined,
              fileUrl: typeof o.fileUrl === 'string' ? o.fileUrl : undefined,
              mimeType: typeof o.mimeType === 'string' ? o.mimeType : undefined,
            };
          });
      }
    }
  }

  // The subtle AI: when the author named a feeling in the Composer we keep it
  // (the human's word wins); otherwise Workers AI reads the entry and names one.
  const userEmotion = typeof safeUserMeta.emotion === 'string' ? safeUserMeta.emotion.trim() : '';
  const emotionResult = userEmotion
    ? { label: userEmotion, confidence: 1 }
    : await classifyEmotionWithAI(`${title} ${description || ''}`.trim(), c.env.AI);

  // Merge emotion into metadata
  const enrichedMetadata = {
    ...safeUserMeta,
    emotion: emotionResult.label,
    emotionConfidence: emotionResult.confidence,
  };
  
    // Encrypt the long-form description at rest (ciphertext → description_enc/iv,
    // base `description` NULLed so the FTS index never holds ciphertext). Falls
    // back to plaintext if no master key is configured.
    const desc = await descriptionColumnsForWrite(c.env, description);
    const mutableUntil = mutableUntilFrom(createdAt);

    // ON CONFLICT(user_id, client_key) DO NOTHING guards the race the pre-check
    // above cannot: two concurrent replays of the same clientKey. The unique index
    // on (user_id, client_key) is added by the migration. If the insert is a no-op
    // (a concurrent request already won), we re-fetch and return that existing row.
    const insertResult = await c.env.DB.prepare(`
      INSERT INTO memories (id, user_id, type, title, description, description_enc, description_iv, file_url, file_key, file_size, mime_type, metadata, encrypted, encryption_iv, mutable_until, created_at, updated_at, client_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, client_key) DO NOTHING
    `).bind(id, userId, type, title, desc.description, desc.description_enc, desc.description_iv, fileUrl || null, fileKey || null, fileSize || null, mimeType || null, JSON.stringify(enrichedMetadata), encrypted ? 1 : 0, encryption_iv || null, mutableUntil, createdAt, now, clientKey ?? null).run();

    if (clientKey && insertResult.meta.changes === 0) {
      const dup = await c.env.DB.prepare(
        `SELECT * FROM memories WHERE user_id = ? AND client_key = ?`
      ).bind(userId, clientKey).first();
      if (dup) {
        return c.json({
          id: dup.id,
          type: dup.type,
          title: dup.title,
          description: await readDescription(c.env, dup as any),
          fileUrl: dup.file_url,
          fileKey: dup.file_key,
          createdAt: dup.created_at,
        }, 200);
      }
    }

  // Dual-write into the Family Thread (best-effort; never blocks the legacy write).
  await mirrorIntoDefaultThread(c.env, userId, {
    memoryId: id,
    title,
    eraYear: memoryDate ? new Date(memoryDate).getUTCFullYear() : null,
  });

  // First memory by an invited member closes the reciprocity loop back to the
  // inviter ("X wrote their first memory"). Only fires when this is genuinely
  // their first memory AND they arrived via an accepted invite. Best-effort —
  // the memory is already written; a failure here changes nothing for the author.
  if (isFirstMemory) {
    try {
      const me = await c.env.DB.prepare(
        `SELECT first_name, last_name, email FROM users WHERE id = ?`
      ).bind(userId).first();
      const myEmail = (me?.email as string | undefined)?.toLowerCase();
      if (myEmail) {
        const invite = await c.env.DB.prepare(
          `SELECT inviter_user_id FROM family_invites
           WHERE lower(invitee_email) = ? AND status = 'accepted'
           ORDER BY accepted_at DESC LIMIT 1`
        ).bind(myEmail).first();
        const inviterId = invite?.inviter_user_id as string | undefined;
        if (inviterId && inviterId !== userId) {
          const myName = `${me?.first_name || ''} ${me?.last_name || ''}`.trim() || 'Someone';
          await createNotification(
            c.env, inviterId, 'referral_reward',
            `${myName} wrote their first memory`,
            `${myName} just let their first memory settle into the family's Deep.`,
            '/loom/pwa',
          );
          const inviter = await c.env.DB.prepare(
            `SELECT first_name, email FROM users WHERE id = ?`
          ).bind(inviterId).first();
          const inviterEmail = inviter?.email as string | undefined;
          if (inviterEmail) {
            const inviterName = `${inviter?.first_name || ''}`.trim() || 'there';
            await sendEmail(c.env, {
              from: 'Heirloom <admin@heirloom.blue>',
              to: inviterEmail,
              subject: `${myName} wrote their first memory`,
              html: kinJoinedEmail(inviterName, myName, 'wrote their first memory', 'https://heirloom.blue/loom/pwa'),
            }, 'KIN_FIRST_MEMORY');
          }
        }
      }
    } catch {
      /* reciprocity signal is best-effort — the memory write already succeeded */
    }
  }

  if (recipientIds && recipientIds.length > 0) {
    // Ownership guard — all family_member_ids must belong to the authenticated user
    const ownedCheck = await c.env.DB.prepare(
      `SELECT COUNT(*) as n FROM family_members WHERE id IN (${recipientIds.map(() => '?').join(',')}) AND user_id = ?`
    ).bind(...recipientIds, userId).first() as { n: number } | null;
    if (!ownedCheck || ownedCheck.n !== recipientIds.length) {
      return c.json({ error: 'One or more recipients not found' }, 400);
    }
    await c.env.DB.batch(
      recipientIds.map((recipientId: string) =>
        c.env.DB.prepare(`INSERT INTO memory_recipients (id, memory_id, family_member_id, created_at) VALUES (?, ?, ?, ?)`)
          .bind(crypto.randomUUID(), id, recipientId, now)
      )
    );
  }

  if (legacyRecipientIds && legacyRecipientIds.length > 0) {
    // Ownership guard — all legacy_contact ids must belong to the authenticated user
    const ownedLegacyCheck = await c.env.DB.prepare(
      `SELECT COUNT(*) as n FROM legacy_contacts WHERE id IN (${legacyRecipientIds.map(() => '?').join(',')}) AND user_id = ? AND deleted_at IS NULL`
    ).bind(...legacyRecipientIds, userId).first() as { n: number } | null;
    if (!ownedLegacyCheck || ownedLegacyCheck.n !== legacyRecipientIds.length) {
      return c.json({ error: 'One or more legacy recipients not found' }, 400);
    }
    await c.env.DB.batch(
      legacyRecipientIds.map((legacyContactId: string) =>
        c.env.DB.prepare(`INSERT OR IGNORE INTO memory_legacy_recipients (memory_id, legacy_contact_id) VALUES (?, ?)`)
          .bind(id, legacyContactId)
      )
    );
  }

  // Email notification when a memory is explicitly addressed to a family member
  // who has a verified email on file. We look up by recipientId (explicit link)
  // rather than by free-text name, so no name-based matching is ever used here.
  const addressedTo = (enrichedMetadata as Record<string, unknown>)?.to as string | undefined;
  if (addressedTo && recipientIds && recipientIds.length > 0) {
    const sender = await c.env.DB.prepare(
      `SELECT first_name, last_name FROM users WHERE id = ?`
    ).bind(userId).first();
    // Use only explicitly linked recipients with a verified email.
    // AND user_id = ? is defense-in-depth (TOCTOU): the ownership check above
    // already validated these IDs, but re-scoping to the current user here
    // ensures stale IDs from a concurrent request cannot leak another user's email.
    const recipientRows = await c.env.DB.prepare(
      `SELECT email FROM family_members WHERE id IN (${recipientIds.map(() => '?').join(',')}) AND user_id = ? AND email IS NOT NULL LIMIT 5`
    ).bind(...recipientIds, userId).all();
    for (const row of recipientRows.results) {
      const recipientEmail = row.email as string;
      const fromName = `${sender?.first_name || ''} ${sender?.last_name || ''}`.trim() || 'Someone';
      // HTML-escape every interpolated value before embedding in the email template.
      const esc = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      await sendEmail(c.env, {
        from: 'Heirloom <memories@heirloom.blue>',
        to: recipientEmail,
        subject: `${fromName} wove a memory for you`,
        html: `<p style="font-family:Georgia,serif;font-size:16px;color:#070d14;">
          ${esc(fromName)} addressed a memory to you on Heirloom.<br><br>
          <strong>${esc(title)}</strong><br><br>
          <a href="https://heirloom.blue/inbox" style="color:#b07a4a;">View in your inbox →</a>
        </p>`,
      });
    }
  }
  
  const memory = await c.env.DB.prepare(`
    SELECT * FROM memories WHERE id = ?
  `).bind(id).first();
  
  return c.json({
    id: memory?.id,
    type: memory?.type,
    title: memory?.title,
    description: description || null,
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
  
  // Verify ownership (a soft-deleted memory can no longer be edited).
  const existing = await c.env.DB.prepare(`
    SELECT * FROM memories WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).bind(memoryId, userId).first();

  if (!existing) {
    return c.json({ error: 'Memory not found' }, 404);
  }

  const { title, description, metadata, legacyRecipientIds } = body;
  const now = new Date().toISOString();

  // Append-only: snapshot the prior values to the immutable revision log before
  // mutating. Encrypted fields are snapshotted in ciphertext form (never plaintext).
  // Within the 30-day grace window an edit is an 'edit'; after it, an 'amendment'.
  const reason = withinGrace(existing.mutable_until as string | null) ? 'edit' : 'amendment';
  await recordRevision(c.env, 'memory', memoryId, userId, {
    title: existing.title,
    description: existing.description,
    description_enc: existing.description_enc,
    description_iv: existing.description_iv,
    metadata: existing.metadata,
    updated_at: existing.updated_at,
  }, reason);

  if (description !== undefined) {
    // Re-encrypt the new description (or store plaintext fallback if no key).
    const desc = await descriptionColumnsForWrite(c.env, description);
    await c.env.DB.prepare(`
      UPDATE memories
      SET title = COALESCE(?, title),
          description = ?,
          description_enc = ?,
          description_iv = ?,
          metadata = COALESCE(?, metadata),
          updated_at = ?
      WHERE id = ?
    `).bind(title ?? null, desc.description, desc.description_enc, desc.description_iv, metadata ? JSON.stringify(metadata) : null, now, memoryId).run();
  } else {
    await c.env.DB.prepare(`
      UPDATE memories
      SET title = COALESCE(?, title),
          metadata = COALESCE(?, metadata),
          updated_at = ?
      WHERE id = ?
    `).bind(title ?? null, metadata ? JSON.stringify(metadata) : null, now, memoryId).run();
  }

  if (title !== undefined) {
    await mirrorMemoryUpdate(c.env, memoryId, { title });
  }

  // Update legacy-contact recipients if provided — replace the full set (mirrors
  // the letters PATCH bequest logic). Only acts when the field is present, so an
  // edit that omits it leaves the existing bequest untouched.
  // Intentional full-replace: this junction is routing metadata, not append-only content.
  if (legacyRecipientIds !== undefined) {
    await c.env.DB.prepare(`DELETE FROM memory_legacy_recipients WHERE memory_id = ?`).bind(memoryId).run();
    if (Array.isArray(legacyRecipientIds) && legacyRecipientIds.length > 0) {
      const lcCheck = await c.env.DB.prepare(
        `SELECT COUNT(*) as n FROM legacy_contacts WHERE id IN (${legacyRecipientIds.map(() => '?').join(',')}) AND user_id = ? AND deleted_at IS NULL`
      ).bind(...legacyRecipientIds, userId).first() as { n: number } | null;
      if (!lcCheck || lcCheck.n !== legacyRecipientIds.length) {
        return c.json({ error: 'One or more legacy recipients not found' }, 400);
      }
      await c.env.DB.batch(
        legacyRecipientIds.map((legacyContactId: string) =>
          c.env.DB.prepare(`INSERT OR IGNORE INTO memory_legacy_recipients (memory_id, legacy_contact_id) VALUES (?, ?)`)
            .bind(memoryId, legacyContactId)
        )
      );
    }
  }

  const memory = await c.env.DB.prepare(`
    SELECT * FROM memories WHERE id = ?
  `).bind(memoryId).first();

  return c.json({
    id: memory?.id,
    type: memory?.type,
    title: memory?.title,
    description: await readDescription(c.env, memory as any),
    updatedAt: memory?.updated_at,
  });
});

// "Delete" a memory — append-only soft revoke. The row and its R2 file are
// preserved; the item is simply hidden from every read. True erasure of the
// underlying bytes happens only at the account level (GDPR), never here, so a
// family thread can never silently lose a entry. (§ "never lose a thread")
memoriesRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const memoryId = c.req.param('id');
  const reason = c.req.query('reason') || null;

  // Verify ownership (idempotent: an already-revoked memory is treated as gone).
  const existing = await c.env.DB.prepare(`
    SELECT * FROM memories WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).bind(memoryId, userId).first();

  if (!existing) {
    return c.json({ error: 'Memory not found' }, 404);
  }

  const now = new Date().toISOString();

  // Preserve the final state in the revision log, then revoke (soft-delete).
  await recordRevision(c.env, 'memory', memoryId, userId, {
    title: existing.title,
    description: existing.description,
    description_enc: existing.description_enc,
    description_iv: existing.description_iv,
    metadata: existing.metadata,
    file_key: existing.file_key,
  }, 'revoke');

  await c.env.DB.prepare(`
    UPDATE memories SET deleted_at = ?, deleted_reason = ?, updated_at = ? WHERE id = ?
  `).bind(now, reason, now, memoryId).run();

  // Mirror the revoke into the Family Thread (also a soft visibility revoke).
  await mirrorMemoryDelete(c.env, memoryId);

  return c.body(null, 204);
});

// Restore a revoked memory within the 7-day grace window — the inverse of the
// soft-delete above (flips deleted_at back to NULL). Scoped to the owner. Mirrors
// family.ts /:id/restore: same eligibility window, owner-scoped, only acts while
// the row is within grace.
memoriesRoutes.patch('/:id/restore', async (c) => {
  const userId = c.get('userId');
  const memoryId = c.req.param('id');

  const existing = await c.env.DB.prepare(`
    SELECT * FROM memories
    WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL
      AND deleted_at > datetime('now', '-7 days')
  `).bind(memoryId, userId).first();

  if (!existing) {
    return c.json({ error: 'Memory not found or grace period expired' }, 404);
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    UPDATE memories SET deleted_at = NULL, deleted_reason = NULL, updated_at = ? WHERE id = ?
  `).bind(now, memoryId).run();

  return c.json({ id: memoryId, restoredAt: now });
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
    WHERE m.id = ? AND m.user_id = ? AND m.deleted_at IS NULL
  `).bind(memoryId, userId).first();

  if (!memory) {
    return c.json({ error: 'Memory not found' }, 404);
  }

  const plainDescription = await readDescription(c.env, memory as any);

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
    classic: { bg: '#1a1a2e', text: '#f5f3ee', accent: '#e0a062', border: '#e0a062' },
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
  const description = plainDescription ? escapeXml(plainDescription) : '';
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
  
  <!-- the Drop mark (Heirloom logo) -->
  <g transform="translate(52, 44)" fill="${s.accent}">
    <path d="M4 13.9 C 15 11.9, 29 15.3, 44 13 C 30 16.3, 15 14, 4 15 Z"/>
    <path d="M23.6 24.9 C 26.8 24.8, 28.7 27.2, 28.2 30 C 27.8 32.6, 25.2 34.1, 22.8 33.4 C 20.5 32.7, 19.5 30.3, 20.3 27.9 C 21 26, 22.2 25.1, 23.6 24.9 Z"/>
    <path d="M10 31.4 C 14.5 41.2, 33.5 41.9, 38.4 30.7 C 33.5 40.2, 14.5 40.2, 10 31.4 Z" fill-opacity="0.55"/>
  </g>
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
