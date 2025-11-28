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
    const result = await this.request<any>('/auth/register', {
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
    const result = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  async getCurrentUser(): Promise<{ user: User; vault: Vault }> {
    return this.request('/auth/me');
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
    return this.request('/vault/upload', {
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

    return this.request(`/vault/items?${query}`);
  }

  async getVaultStats(): Promise<{
    storage: { used: string; limit: string; percentUsed: number };
    uploads: { thisWeek: number; limit: number; remaining: number; nextReset: string };
    items: { total: number; byType: Record<string, number>; byEmotion: Record<string, number> };
    recipients: { total: number };
    tier: string;
  }> {
    return this.request('/vault/stats');
  }

  async addRecipient(data: {
    email: string;
    name?: string;
    relationship?: string;
    accessLevel?: string;
  }): Promise<{ recipient: Recipient }> {
    return this.request('/recipients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRecipients(): Promise<{ recipients: Recipient[] }> {
    return this.request('/recipients');
  }

  async addTrustedContact(data: {
    email: string;
    phone?: string;
    name?: string;
    shamirShareEncrypted: string;
  }): Promise<{ contact: TrustedContact; verificationSent: boolean }> {
    return this.request('/trusted-contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTrustedContacts(): Promise<{ contacts: TrustedContact[] }> {
    return this.request('/trusted-contacts');
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
    return this.request('/check-in/status');
  }

  async getCurrentSubscription(): Promise<{
    tier: string;
    subscription: { status: string; currentPeriodEnd: string } | null;
  }> {
    return this.request('/subscriptions/current');
  }

  async getMemories(): Promise<any[]> {
    const result = await this.getVaultItems();
    return result.items.map(item => ({
      id: item.id,
      title: item.title || `Untitled ${item.type}`,
      description: '',
      date: item.createdAt,
      media_url: item.thumbnailUrl,
      thumbnail_url: item.thumbnailUrl,
      type: item.type,
      emotion: item.emotionCategory,
      emotionCategory: item.emotionCategory,
      importance: item.importanceScore,
      sentimentLabel: (item as any).sentimentLabel,
      sentimentScore: (item as any).sentimentScore,
      keywords: (item as any).keywords,
      createdAt: item.createdAt
    }));
  }

  async getTimeCapsules(): Promise<any[]> {
    const result = await this.request<{ timeCapsules: any[] }>('/time-capsules');
    return result.timeCapsules;
  }

  async getHighlights(): Promise<any[]> {
    const result = await this.request<{ highlights: any[] }>('/highlights');
    return result.highlights;
  }

  async getWeeklyDigest(): Promise<any> {
    return this.request('/digest/weekly');
  }

  async startImport(source: string, settings: any): Promise<{ import_id: string; status: string }> {
    return this.request('/imports/start', {
      method: 'POST',
      body: JSON.stringify({ source, settings })
    });
  }

  async getImportStatus(importId: string): Promise<any> {
    return this.request(`/imports/${importId}/status`);
  }

  async getComments(itemId: string): Promise<any[]> {
    const result = await this.request<{ comments: any[] }>(`/vault/items/${itemId}/comments`);
    return result.comments;
  }

  async addComment(itemId: string, content: string): Promise<any> {
    const result = await this.request<{ comment: any }>(`/vault/items/${itemId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    return result.comment;
  }

  async getCuratorSuggestions(): Promise<any[]> {
    const result = await this.request<{ suggestions: any[] }>('/curator/suggestions');
    return result.suggestions;
  }

  async createStory(data: any): Promise<any> {
    return this.uploadItem({
      type: 'voice',
      title: data.title,
      encryptedData: data.encryptedData,
      encryptedDek: data.encryptedDek,
      thumbnailUrl: data.thumbnailUrl,
      fileSizeBytes: data.fileSizeBytes
    });
  }

  async getStories(): Promise<any[]> {
    const result = await this.getVaultItems({ type: 'voice' });
    return result.items;
  }
}

export const apiClient = new APIClient();
