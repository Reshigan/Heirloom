/**
 * Encryption Routes - Cloudflare Workers
 * Handles encryption key management and escrow
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const encryptionRoutes = new Hono<{ Bindings: Env }>();

// Get encryption parameters (for client-side key derivation)
encryptionRoutes.get('/params', async (c) => {
  // Return default encryption parameters
  // These are used by the client to derive encryption keys
  return c.json({
    algorithm: 'AES-GCM',
    keySize: 256,
    ivSize: 12,
    tagSize: 128,
    keyDerivation: {
      algorithm: 'PBKDF2',
      iterations: 100000,
      hash: 'SHA-256',
    },
  });
});

// Get encryption status
encryptionRoutes.get('/status', async (c) => {
  const userId = c.get('userId');
  
  const user = await c.env.DB.prepare(`
    SELECT encryption_salt, encrypted_master_key, key_derivation_params FROM users WHERE id = ?
  `).bind(userId).first();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  const hasEncryption = !!(user.encryption_salt && user.encrypted_master_key);
  
  // Check for key escrow
  const escrow = await c.env.DB.prepare(`
    SELECT id, escrow_type, created_at FROM key_escrows WHERE user_id = ?
  `).bind(userId).first();
  
  return c.json({
    encryptionEnabled: hasEncryption,
    hasEscrow: !!escrow,
    escrowType: escrow?.escrow_type || null,
    escrowCreatedAt: escrow?.created_at || null,
    keyDerivationParams: user.key_derivation_params ? JSON.parse(user.key_derivation_params as string) : null,
  });
});

// Setup encryption (generate and store encrypted master key)
encryptionRoutes.post('/setup', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { encryptedMasterKey, encryptionSalt, keyDerivationParams } = body;
  
  if (!encryptedMasterKey || !encryptionSalt) {
    return c.json({ error: 'Encrypted master key and salt are required' }, 400);
  }
  
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE users 
    SET encrypted_master_key = ?,
        encryption_salt = ?,
        key_derivation_params = ?,
        updated_at = ?
    WHERE id = ?
  `).bind(
    encryptedMasterKey, 
    encryptionSalt, 
    keyDerivationParams ? JSON.stringify(keyDerivationParams) : null,
    now, 
    userId
  ).run();
  
  return c.json({
    success: true,
    message: 'Encryption setup complete',
  });
});

// Get encryption salt (for key derivation on client)
encryptionRoutes.get('/salt', async (c) => {
  const userId = c.get('userId');
  
  const user = await c.env.DB.prepare(`
    SELECT encryption_salt, key_derivation_params FROM users WHERE id = ?
  `).bind(userId).first();
  
  if (!user || !user.encryption_salt) {
    return c.json({ error: 'Encryption not configured' }, 404);
  }
  
  return c.json({
    salt: user.encryption_salt,
    keyDerivationParams: user.key_derivation_params ? JSON.parse(user.key_derivation_params as string) : {
      algorithm: 'PBKDF2',
      iterations: 100000,
      hash: 'SHA-256',
    },
  });
});

// Get encrypted master key
encryptionRoutes.get('/master-key', async (c) => {
  const userId = c.get('userId');
  
  const user = await c.env.DB.prepare(`
    SELECT encrypted_master_key FROM users WHERE id = ?
  `).bind(userId).first();
  
  if (!user || !user.encrypted_master_key) {
    return c.json({ error: 'Encryption not configured' }, 404);
  }
  
  return c.json({
    encryptedMasterKey: user.encrypted_master_key,
  });
});

// Setup key escrow
encryptionRoutes.post('/escrow', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { escrowType, encryptedKey, recoveryHint, trustedContactId } = body;
  
  if (!escrowType || !encryptedKey) {
    return c.json({ error: 'Escrow type and encrypted key are required' }, 400);
  }
  
  const validTypes = ['SECURITY_QUESTIONS', 'TRUSTED_CONTACT', 'PAPER_KEY'];
  if (!validTypes.includes(escrowType)) {
    return c.json({ error: 'Invalid escrow type' }, 400);
  }
  
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  
  // Check if escrow already exists
  const existing = await c.env.DB.prepare(`
    SELECT id FROM key_escrows WHERE user_id = ?
  `).bind(userId).first();
  
  if (existing) {
    await c.env.DB.prepare(`
      UPDATE key_escrows 
      SET escrow_type = ?,
          encrypted_key = ?,
          recovery_hint = ?,
          trusted_contact_id = ?,
          updated_at = ?
      WHERE user_id = ?
    `).bind(escrowType, encryptedKey, recoveryHint || null, trustedContactId || null, now, userId).run();
  } else {
    await c.env.DB.prepare(`
      INSERT INTO key_escrows (id, user_id, escrow_type, encrypted_key, recovery_hint, trusted_contact_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, userId, escrowType, encryptedKey, recoveryHint || null, trustedContactId || null, now, now).run();
  }
  
  return c.json({
    success: true,
    escrowType,
    message: 'Key escrow configured successfully',
  });
});

// Get escrow info (without the actual key)
encryptionRoutes.get('/escrow', async (c) => {
  const userId = c.get('userId');
  
  const escrow = await c.env.DB.prepare(`
    SELECT id, escrow_type, recovery_hint, trusted_contact_id, created_at, updated_at
    FROM key_escrows WHERE user_id = ?
  `).bind(userId).first();
  
  if (!escrow) {
    return c.json({ configured: false });
  }
  
  // Get trusted contact info if applicable
  let trustedContact = null;
  if (escrow.trusted_contact_id) {
    trustedContact = await c.env.DB.prepare(`
      SELECT id, name, email FROM legacy_contacts WHERE id = ?
    `).bind(escrow.trusted_contact_id).first();
  }
  
  return c.json({
    configured: true,
    escrowType: escrow.escrow_type,
    recoveryHint: escrow.recovery_hint,
    trustedContact: trustedContact ? {
      id: trustedContact.id,
      name: trustedContact.name,
      email: trustedContact.email,
    } : null,
    createdAt: escrow.created_at,
    updatedAt: escrow.updated_at,
  });
});

// Recover key using escrow
encryptionRoutes.post('/recover', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { recoveryMethod, recoveryData } = body;
  
  if (!recoveryMethod || !recoveryData) {
    return c.json({ error: 'Recovery method and data are required' }, 400);
  }
  
  const escrow = await c.env.DB.prepare(`
    SELECT * FROM key_escrows WHERE user_id = ?
  `).bind(userId).first();
  
  if (!escrow) {
    return c.json({ error: 'No key escrow configured' }, 404);
  }
  
  // In production, verify the recovery data matches the escrow type
  // For now, return the encrypted key
  return c.json({
    success: true,
    encryptedKey: escrow.encrypted_key,
    message: 'Key recovered successfully. Decrypt with your recovery credentials.',
  });
});

// Delete escrow
encryptionRoutes.delete('/escrow', async (c) => {
  const userId = c.get('userId');
  
  await c.env.DB.prepare(`
    DELETE FROM key_escrows WHERE user_id = ?
  `).bind(userId).run();
  
  return c.json({
    success: true,
    message: 'Key escrow removed',
  });
});

// Rotate encryption key
encryptionRoutes.post('/rotate', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { newEncryptedMasterKey, newEncryptionSalt, newKeyDerivationParams } = body;
  
  if (!newEncryptedMasterKey || !newEncryptionSalt) {
    return c.json({ error: 'New encrypted master key and salt are required' }, 400);
  }
  
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE users 
    SET encrypted_master_key = ?,
        encryption_salt = ?,
        key_derivation_params = ?,
        updated_at = ?
    WHERE id = ?
  `).bind(
    newEncryptedMasterKey, 
    newEncryptionSalt, 
    newKeyDerivationParams ? JSON.stringify(newKeyDerivationParams) : null,
    now, 
    userId
  ).run();
  
  // Invalidate existing escrow since key changed
  await c.env.DB.prepare(`
    DELETE FROM key_escrows WHERE user_id = ?
  `).bind(userId).run();
  
  return c.json({
    success: true,
    message: 'Encryption key rotated. Please set up key escrow again.',
  });
});
