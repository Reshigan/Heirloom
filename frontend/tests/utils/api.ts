/**
 * API utilities for seeding test data
 * These functions call the backend API to create users, memories, recipients, etc.
 */

const API_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://loom.vantax.co.za';

export interface User {
  userId: string;
  email: string;
  token: string;
  password: string;
}

export interface VaultItem {
  id: string;
  type: string;
  title: string;
  encryptedData: string;
  encryptedDek: string;
  thumbnailUrl?: string;
}

/**
 * Register a new user
 */
export async function registerUser(email: string, password: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error(`Registration failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return {
    userId: data.user.id,
    email: data.user.email,
    token: data.token,
    password
  };
}

/**
 * Login existing user
 */
export async function loginUser(email: string, password: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return {
    userId: data.user.id,
    email: data.user.email,
    token: data.token,
    password
  };
}

/**
 * Create a vault item (memory)
 * Uses minimal encrypted data for speed
 */
export async function createVaultItem(
  token: string,
  options: {
    type: string;
    title: string;
    recipientIds?: string[];
    emotionCategory?: string;
    importanceScore?: number;
  }
): Promise<VaultItem> {
  const encryptedData = Buffer.from(`encrypted-${options.title}`).toString('base64');
  const encryptedDek = Buffer.from('test-dek-key').toString('base64');

  const response = await fetch(`${API_BASE_URL}/api/vault/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      type: options.type,
      title: options.title,
      encryptedData,
      encryptedDek,
      fileSizeBytes: encryptedData.length,
      recipientIds: options.recipientIds || [],
      emotionCategory: options.emotionCategory,
      importanceScore: options.importanceScore || 5
    })
  });

  if (!response.ok) {
    throw new Error(`Create vault item failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return {
    id: data.item.id,
    type: data.item.type,
    title: data.item.title,
    encryptedData,
    encryptedDek
  };
}

/**
 * Add a recipient to the vault
 */
export async function addRecipient(
  token: string,
  options: {
    email: string;
    name: string;
    relationship?: string;
    accessLevel?: string;
  }
): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/recipients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      email: options.email,
      name: options.name,
      relationship: options.relationship || 'family',
      accessLevel: options.accessLevel || 'SPECIFIC'
    })
  });

  if (!response.ok) {
    throw new Error(`Add recipient failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return { id: data.recipient.id };
}

/**
 * Add a trusted contact
 */
export async function addTrustedContact(
  token: string,
  options: {
    email: string;
    name: string;
    phone?: string;
  }
): Promise<{ id: string }> {
  const shamirShareEncrypted = Buffer.from('test-shamir-share').toString('base64');

  const response = await fetch(`${API_BASE_URL}/api/trusted-contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      email: options.email,
      name: options.name,
      phone: options.phone,
      shamirShareEncrypted
    })
  });

  if (!response.ok) {
    throw new Error(`Add trusted contact failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return { id: data.contact.id };
}

/**
 * Configure check-in
 */
export async function configureCheckIn(
  token: string,
  method: string = 'app_notification'
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ method })
  });

  if (!response.ok) {
    throw new Error(`Configure check-in failed: ${response.status} ${await response.text()}`);
  }
}

/**
 * Get notifications
 */
export async function getNotifications(token: string): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Get notifications failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.notifications || [];
}

/**
 * Get vault stats
 */
export async function getVaultStats(token: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/vault/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Get vault stats failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

/**
 * Seed multiple vault items quickly
 */
export async function seedVaultItems(
  token: string,
  count: number,
  options?: {
    recipientIds?: string[];
    types?: string[];
  }
): Promise<VaultItem[]> {
  const types = options?.types || ['photo', 'letter', 'video', 'voice', 'document'];
  const emotions = ['joyful', 'happy', 'neutral', 'sad'];
  const items: VaultItem[] = [];

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const emotion = emotions[i % emotions.length];
    const timestamp = Date.now() + i;
    
    const item = await createVaultItem(token, {
      type,
      title: `Test ${type} memory ${timestamp}`,
      recipientIds: options?.recipientIds,
      emotionCategory: emotion,
      importanceScore: (i % 10) + 1
    });
    
    items.push(item);
  }

  return items;
}
