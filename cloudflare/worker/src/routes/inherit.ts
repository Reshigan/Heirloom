/**
 * Inherit Routes - Recipient Portal for Heirloom
 * Handles token-based access for recipients to view content after vault unlock
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const inheritRoutes = new Hono<{ Bindings: Env }>();

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
