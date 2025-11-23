/**
 * API client for Constellation Vault Platform
 * Handles communication with Node.js backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  email: string;
  status: string;
  nextCheckIn?: string;
}

export interface Vault {
  id: string;
  tier: string;
  storageUsed: string;
  storageLimit: string;
  uploadsThisWeek: number;
  uploadLimit: number;
}

export interface VaultItem {
  id: string;
  type: string;
  title?: string;
  thumbnailUrl?: string;
  emotionCategory?: string;
  importanceScore: number;
  recipientIds: string[];
  scheduledDelivery?: string;
  createdAt: string;
}

export interface Recipient {
  id: string;
  email: string;
  name?: string;
  relationship?: string;
  accessLevel: string;
  createdAt: string;
}

export interface TrustedContact {
  id: string;
  email: string;
  name?: string;
  verificationStatus: string;
  createdAt: string;
}

class APIClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('heirloom:auth:token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('heirloom:auth:token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('heirloom:auth:token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async register(email: string, password: string): Promise<{
    user: User;
    vault: Vault;
    token: string;
    vmkSalt: string;
  }> {
    const result = await this.request<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  async login(email: string, password: string): Promise<{
    user: User;
    vault: Vault;
    token: string;
  }> {
    const result = await this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  async getCurrentUser(): Promise<{ user: User; vault: Vault }> {
    return this.request('/api/auth/me');
  }

  async getMe(): Promise<User> {
    const result = await this.getCurrentUser();
    return result.user;
  }

  async uploadItem(data: {
    type: string;
    title?: string;
    encryptedData: string;
    encryptedDek: string;
    thumbnailUrl?: string;
    fileSizeBytes?: number;
    recipientIds?: string[];
    scheduledDelivery?: string;
    emotionCategory?: string;
    importanceScore?: number;
  }): Promise<{
    item: VaultItem;
    vault: { storageUsed: string; storageLimit: string; uploadsRemaining: number };
  }> {
    return this.request('/api/vault/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVaultItems(params?: {
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    items: VaultItem[];
    total: number;
    vault: Vault;
  }> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    return this.request(`/api/vault/items?${query}`);
  }

  async getVaultStats(): Promise<{
    storage: { used: string; limit: string; percentUsed: number };
    uploads: { thisWeek: number; limit: number; remaining: number; nextReset: string };
    items: { total: number; byType: Record<string, number>; byEmotion: Record<string, number> };
    recipients: { total: number };
    tier: string;
  }> {
    return this.request('/api/vault/stats');
  }

  async addRecipient(data: {
    email: string;
    name?: string;
    relationship?: string;
    accessLevel?: string;
  }): Promise<{ recipient: Recipient }> {
    return this.request('/api/recipients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRecipients(): Promise<{ recipients: Recipient[] }> {
    return this.request('/api/recipients');
  }

  async addTrustedContact(data: {
    email: string;
    phone?: string;
    name?: string;
    shamirShareEncrypted: string;
  }): Promise<{ contact: TrustedContact; verificationSent: boolean }> {
    return this.request('/api/trusted-contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTrustedContacts(): Promise<{ contacts: TrustedContact[] }> {
    return this.request('/api/trusted-contacts');
  }

  async getCheckInStatus(): Promise<{
    status: string;
    nextCheckIn: string;
    intervalDays: number;
    missedCount: number;
    recentCheckIns: Array<{
      sentAt: string;
      respondedAt?: string;
      missed: boolean;
    }>;
  }> {
    return this.request('/api/check-in/status');
  }

  async getCurrentSubscription(): Promise<{
    tier: string;
    subscription: { status: string; currentPeriodEnd: string } | null;
  }> {
    return this.request('/api/subscriptions/current');
  }
}

export const apiClient = new APIClient();
