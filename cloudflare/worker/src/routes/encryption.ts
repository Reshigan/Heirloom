/**
 * Encryption Routes - Cloudflare Workers
 * Handles encryption key management and escrow
 * Includes Shamir Secret Sharing for distributed key recovery
 */

import { Hono } from 'hono';
import type { Env } from '../index';

// =============================================================================
// SHAMIR SECRET SHARING IMPLEMENTATION
// =============================================================================

// GF(256) arithmetic for Shamir's Secret Sharing
const GF256 = {
  // Primitive polynomial: x^8 + x^4 + x^3 + x + 1 (0x11B)
  exp: new Uint8Array(512),
  log: new Uint8Array(256),
  
  init() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      this.exp[i] = x;
      this.log[x] = i;
      x = x << 1;
      if (x & 0x100) x ^= 0x11B;
    }
    for (let i = 255; i < 512; i++) {
      this.exp[i] = this.exp[i - 255];
    }
    this.log[0] = 0; // undefined, but set to 0 for safety
  },
  
  mul(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return this.exp[this.log[a] + this.log[b]];
  },
  
  div(a: number, b: number): number {
    if (b === 0) throw new Error('Division by zero');
    if (a === 0) return 0;
    return this.exp[this.log[a] + 255 - this.log[b]];
  },
};

// Initialize GF(256) tables
GF256.init();

// Split a secret into n shares, requiring k shares to reconstruct
function splitSecret(secret: Uint8Array, n: number, k: number): { x: number; y: Uint8Array }[] {
  if (k > n) throw new Error('Threshold cannot exceed total shares');
  if (k < 2) throw new Error('Threshold must be at least 2');
  if (n > 255) throw new Error('Cannot create more than 255 shares');
  
  const shares: { x: number; y: Uint8Array }[] = [];
  
  for (let i = 1; i <= n; i++) {
    shares.push({ x: i, y: new Uint8Array(secret.length) });
  }
  
  // For each byte of the secret
  for (let byteIdx = 0; byteIdx < secret.length; byteIdx++) {
    // Generate random coefficients for polynomial (a0 = secret byte, a1..ak-1 = random)
    const coefficients = new Uint8Array(k);
    coefficients[0] = secret[byteIdx];
    crypto.getRandomValues(coefficients.subarray(1));
    
    // Evaluate polynomial at each x value
    for (let shareIdx = 0; shareIdx < n; shareIdx++) {
      const x = shares[shareIdx].x;
      let y = 0;
      
      // Horner's method for polynomial evaluation
      for (let i = k - 1; i >= 0; i--) {
        y = GF256.mul(y, x) ^ coefficients[i];
      }
      
      shares[shareIdx].y[byteIdx] = y;
    }
  }
  
  return shares;
}

// Reconstruct secret from k shares using Lagrange interpolation
function reconstructSecret(shares: { x: number; y: Uint8Array }[]): Uint8Array {
  if (shares.length < 2) throw new Error('Need at least 2 shares');
  
  const secretLength = shares[0].y.length;
  const secret = new Uint8Array(secretLength);
  
  // For each byte position
  for (let byteIdx = 0; byteIdx < secretLength; byteIdx++) {
    let result = 0;
    
    // Lagrange interpolation at x = 0
    for (let i = 0; i < shares.length; i++) {
      let numerator = 1;
      let denominator = 1;
      
      for (let j = 0; j < shares.length; j++) {
        if (i !== j) {
          numerator = GF256.mul(numerator, shares[j].x);
          denominator = GF256.mul(denominator, shares[i].x ^ shares[j].x);
        }
      }
      
      const lagrangeCoeff = GF256.div(numerator, denominator);
      result ^= GF256.mul(shares[i].y[byteIdx], lagrangeCoeff);
    }
    
    secret[byteIdx] = result;
  }
  
  return secret;
}

// Convert share to base64 string for storage
function shareToString(share: { x: number; y: Uint8Array }): string {
  const combined = new Uint8Array(1 + share.y.length);
  combined[0] = share.x;
  combined.set(share.y, 1);
  return btoa(String.fromCharCode(...combined));
}

// Convert base64 string back to share
function stringToShare(str: string): { x: number; y: Uint8Array } {
  const decoded = Uint8Array.from(atob(str), c => c.charCodeAt(0));
  return {
    x: decoded[0],
    y: decoded.slice(1),
  };
}

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

// =============================================================================
// SHAMIR SECRET SHARING ROUTES
// =============================================================================

// Split master key into shares for legacy contacts
encryptionRoutes.post('/shamir/split', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { encryptedMasterKey, totalShares, threshold, legacyContactIds } = body;
  
  if (!encryptedMasterKey || !totalShares || !threshold || !legacyContactIds) {
    return c.json({ error: 'Missing required parameters' }, 400);
  }
  
  if (threshold > totalShares) {
    return c.json({ error: 'Threshold cannot exceed total shares' }, 400);
  }
  
  if (legacyContactIds.length !== totalShares) {
    return c.json({ error: 'Number of legacy contacts must match total shares' }, 400);
  }
  
  try {
    // Decode the encrypted master key
    const keyBytes = Uint8Array.from(atob(encryptedMasterKey), c => c.charCodeAt(0));
    
    // Split into shares
    const shares = splitSecret(keyBytes, totalShares, threshold);
    
    const now = new Date().toISOString();
    
    // Store each share with its corresponding legacy contact
    for (let i = 0; i < shares.length; i++) {
      const shareString = shareToString(shares[i]);
      const contactId = legacyContactIds[i];
      
      // Check if share already exists for this contact
      const existing = await c.env.DB.prepare(`
        SELECT id FROM shamir_shares WHERE user_id = ? AND legacy_contact_id = ?
      `).bind(userId, contactId).first();
      
      if (existing) {
        await c.env.DB.prepare(`
          UPDATE shamir_shares 
          SET share_data = ?, share_index = ?, threshold = ?, total_shares = ?, updated_at = ?
          WHERE user_id = ? AND legacy_contact_id = ?
        `).bind(shareString, i + 1, threshold, totalShares, now, userId, contactId).run();
      } else {
        await c.env.DB.prepare(`
          INSERT INTO shamir_shares (id, user_id, legacy_contact_id, share_data, share_index, threshold, total_shares, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), userId, contactId, shareString, i + 1, threshold, totalShares, now, now).run();
      }
    }
    
    // Update key escrow to indicate Shamir sharing is configured
    const escrowExists = await c.env.DB.prepare(`
      SELECT id FROM key_escrows WHERE user_id = ?
    `).bind(userId).first();
    
    if (escrowExists) {
      await c.env.DB.prepare(`
        UPDATE key_escrows SET escrow_type = 'SHAMIR', updated_at = ? WHERE user_id = ?
      `).bind(now, userId).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO key_escrows (id, user_id, escrow_type, encrypted_key, created_at, updated_at)
        VALUES (?, ?, 'SHAMIR', ?, ?, ?)
      `).bind(crypto.randomUUID(), userId, 'SHAMIR_DISTRIBUTED', now, now).run();
    }
    
    return c.json({
      success: true,
      totalShares,
      threshold,
      message: `Master key split into ${totalShares} shares. ${threshold} shares required to reconstruct.`,
    });
  } catch (error) {
    console.error('Shamir split error:', error);
    return c.json({ error: 'Failed to split key' }, 500);
  }
});

// Get Shamir sharing status
encryptionRoutes.get('/shamir/status', async (c) => {
  const userId = c.get('userId');
  
  const shares = await c.env.DB.prepare(`
    SELECT ss.share_index, ss.threshold, ss.total_shares, ss.created_at,
           lc.name as contact_name, lc.email as contact_email
    FROM shamir_shares ss
    JOIN legacy_contacts lc ON ss.legacy_contact_id = lc.id
    WHERE ss.user_id = ?
    ORDER BY ss.share_index
  `).bind(userId).all();
  
  if (!shares.results || shares.results.length === 0) {
    return c.json({ configured: false });
  }
  
  const firstShare = shares.results[0] as { threshold: number; total_shares: number; created_at: string };
  
  return c.json({
    configured: true,
    threshold: firstShare.threshold,
    totalShares: firstShare.total_shares,
    createdAt: firstShare.created_at,
    contacts: shares.results.map((s: { share_index: number; contact_name: string; contact_email: string }) => ({
      shareIndex: s.share_index,
      name: s.contact_name,
      email: s.contact_email,
    })),
  });
});

// Reconstruct master key from shares (for recipient portal)
encryptionRoutes.post('/shamir/reconstruct', async (c) => {
  const body = await c.req.json();
  const { userId, shares } = body;
  
  if (!userId || !shares || !Array.isArray(shares)) {
    return c.json({ error: 'User ID and shares array required' }, 400);
  }
  
  try {
    // Get threshold from database
    const shareInfo = await c.env.DB.prepare(`
      SELECT threshold FROM shamir_shares WHERE user_id = ? LIMIT 1
    `).bind(userId).first();
    
    if (!shareInfo) {
      return c.json({ error: 'No Shamir shares found for user' }, 404);
    }
    
    const threshold = shareInfo.threshold as number;
    
    if (shares.length < threshold) {
      return c.json({ 
        error: `Insufficient shares. Need ${threshold}, got ${shares.length}`,
        threshold,
        provided: shares.length,
      }, 400);
    }
    
    // Convert share strings to share objects
    const shareObjects = shares.map((s: string) => stringToShare(s));
    
    // Reconstruct the secret
    const reconstructed = reconstructSecret(shareObjects);
    
    // Convert back to base64
    const reconstructedKey = btoa(String.fromCharCode(...reconstructed));
    
    return c.json({
      success: true,
      encryptedMasterKey: reconstructedKey,
      message: 'Master key reconstructed successfully',
    });
  } catch (error) {
    console.error('Shamir reconstruct error:', error);
    return c.json({ error: 'Failed to reconstruct key' }, 500);
  }
});

// Get share for a specific legacy contact (used during Dead Man's Switch release)
encryptionRoutes.get('/shamir/share/:contactId', async (c) => {
  const contactId = c.req.param('contactId');
  
  // Verify the contact has a valid session (from recipient portal)
  const sessionToken = c.req.header('X-Recipient-Token');
  if (!sessionToken) {
    return c.json({ error: 'Recipient token required' }, 401);
  }
  
  // Verify session
  const session = await c.env.DB.prepare(`
    SELECT rs.*, lc.user_id 
    FROM recipient_sessions rs
    JOIN legacy_contacts lc ON rs.legacy_contact_id = lc.id
    WHERE rs.session_token = ? AND rs.legacy_contact_id = ? AND rs.expires_at > datetime('now')
  `).bind(sessionToken, contactId).first();
  
  if (!session) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }
  
  // Get the share for this contact
  const share = await c.env.DB.prepare(`
    SELECT share_data, threshold, total_shares
    FROM shamir_shares
    WHERE user_id = ? AND legacy_contact_id = ?
  `).bind(session.user_id, contactId).first();
  
  if (!share) {
    return c.json({ error: 'No share found for this contact' }, 404);
  }
  
  return c.json({
    share: share.share_data,
    threshold: share.threshold,
    totalShares: share.total_shares,
  });
});
