import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage if in browser
    if (browser) {
      this.token = localStorage.getItem('auth_token');
      if (this.token) {
        this.setAuthToken(this.token);
      }
    }

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add CSRF token if available
        const csrfToken = browser ? localStorage.getItem('csrf_token') : null;
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() };
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response time in development
        if (response.config.metadata) {
          const endTime = new Date();
          const duration = endTime.getTime() - response.config.metadata.startTime.getTime();
          console.log(`API ${response.config.method?.toUpperCase()} ${response.config.url}: ${duration}ms`);
        }

        return response;
      },
      (error) => {
        // Handle common errors
        if (error.response?.status === 401) {
          this.clearAuth();
          if (browser) {
            goto('/auth/login');
          }
        } else if (error.response?.status === 403) {
          console.error('Access forbidden:', error.response.data);
        } else if (error.response?.status >= 500) {
          console.error('Server error:', error.response.data);
        }

        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    if (browser) {
      localStorage.setItem('auth_token', token);
    }
  }

  clearAuth() {
    this.token = null;
    delete this.client.defaults.headers.common['Authorization'];
    
    if (browser) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('csrf_token');
    }
  }

  // Generic HTTP methods
  async get(url: string, config?: AxiosRequestConfig) {
    return this.client.get(url, config);
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post(url, data, config);
  }

  async put(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put(url, data, config);
  }

  async patch(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch(url, data, config);
  }

  async delete(url: string, config?: AxiosRequestConfig) {
    return this.client.delete(url, config);
  }

  // Authentication endpoints
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    phoneNumber?: string;
    referralCode?: string;
  }) {
    const response = await this.post('/auth/register', userData);
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response.data;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.post('/auth/login', credentials);
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response.data;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.clearAuth();
    }
  }

  async refreshToken() {
    const response = await this.post('/auth/refresh');
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response.data;
  }

  async forgotPassword(email: string) {
    return this.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string) {
    return this.post('/auth/reset-password', { token, password });
  }

  // User endpoints
  async getCurrentUser() {
    const response = await this.get('/auth/me');
    return response.data.user;
  }

  async updateProfile(profileData: any) {
    const response = await this.put('/users/profile', profileData);
    return response.data.user;
  }

  async updatePrivacySettings(settings: any) {
    const response = await this.put('/users/privacy', settings);
    return response.data;
  }

  async updateNotificationSettings(settings: any) {
    const response = await this.put('/users/notifications', settings);
    return response.data;
  }

  // Memory endpoints
  async getMemories(params?: {
    page?: number;
    limit?: number;
    type?: string;
    tags?: string[];
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await this.get('/memories', { params });
    return response.data;
  }

  async getMemory(id: string, includeAI = false) {
    const response = await this.get(`/memories/${id}`, {
      params: { includeAI }
    });
    return response.data.memory;
  }

  async createMemory(memoryData: {
    title: string;
    content: string;
    type: 'text' | 'photo' | 'video' | 'audio';
    mediaUrl?: string;
    tags?: string[];
    isPublic?: boolean;
    familyId?: string;
    generateAIStory?: boolean;
  }) {
    const response = await this.post('/memories', memoryData);
    return response.data.memory;
  }

  async updateMemory(id: string, updates: any) {
    const response = await this.put(`/memories/${id}`, updates);
    return response.data.memory;
  }

  async deleteMemory(id: string) {
    await this.delete(`/memories/${id}`);
  }

  async searchMemories(query: string, filters?: any) {
    const response = await this.get('/memories/search', {
      params: { q: query, ...filters }
    });
    return response.data;
  }

  async getMemoryAnalytics() {
    const response = await this.get('/memories/analytics');
    return response.data.analytics;
  }

  // AI endpoints
  async generateAIStory(memoryId: string, options: {
    style?: string;
    length?: string;
    customPrompt?: string;
  }) {
    const response = await this.post('/ai/generate-story', {
      memoryId,
      ...options
    });
    return response.data.story;
  }

  async analyzeSentiment(memoryId: string) {
    const response = await this.post('/ai/analyze-sentiment', { memoryId });
    return response.data.analysis;
  }

  async suggestTags(memoryId: string) {
    const response = await this.post('/ai/suggest-tags', { memoryId });
    return response.data.tags;
  }

  async findSimilarMemories(memoryId: string, limit = 5) {
    const response = await this.post('/ai/find-similar', { memoryId, limit });
    return response.data.similarMemories;
  }

  async getAIRecommendations() {
    const response = await this.get('/ai/recommendations/memories');
    return response.data.recommendations;
  }

  async getAIUsageStats() {
    const response = await this.get('/ai/usage/stats');
    return response.data.stats;
  }

  // Family endpoints
  async getFamilies() {
    const response = await this.get('/families');
    return response.data.families;
  }

  async getFamily(id: string) {
    const response = await this.get(`/families/${id}`);
    return response.data.family;
  }

  async createFamily(familyData: {
    name: string;
    description?: string;
  }) {
    const response = await this.post('/families', familyData);
    return response.data.family;
  }

  async inviteFamilyMember(familyId: string, inviteData: {
    email: string;
    role: string;
    message?: string;
  }) {
    const response = await this.post(`/families/${familyId}/invite`, inviteData);
    return response.data.invitation;
  }

  async getFamilyActivity(familyId: string) {
    const response = await this.get(`/families/${familyId}/activity`);
    return response.data.activities;
  }

  // Subscription endpoints
  async getSubscriptionTiers() {
    const response = await this.get('/subscriptions/tiers');
    return response.data.tiers;
  }

  async getCurrentSubscription() {
    const response = await this.get('/subscriptions/current');
    return response.data.subscription;
  }

  async createSubscription(subscriptionData: {
    tierId: string;
    paymentMethod?: any;
    trialDays?: number;
  }) {
    const response = await this.post('/subscriptions', subscriptionData);
    return response.data.subscription;
  }

  async updateSubscription(updates: any) {
    const response = await this.put('/subscriptions/current', updates);
    return response.data.subscription;
  }

  async cancelSubscription(immediate = false) {
    const response = await this.delete('/subscriptions/current', {
      data: { immediate }
    });
    return response.data.subscription;
  }

  async getSubscriptionUsage() {
    const response = await this.get('/subscriptions/usage');
    return response.data.usage;
  }

  // Time Capsule endpoints
  async getTimeCapsules() {
    const response = await this.get('/time-capsules');
    return response.data.timeCapsules;
  }

  async createTimeCapsule(capsuleData: {
    title: string;
    content: string;
    deliveryDate: string;
    recipients: string[];
    type: string;
  }) {
    const response = await this.post('/time-capsules', capsuleData);
    return response.data.timeCapsule;
  }

  async scheduleTimeCapsule(id: string, scheduleData: any) {
    const response = await this.post(`/time-capsules/${id}/schedule`, scheduleData);
    return response.data;
  }

  // Referral endpoints
  async getReferralCode() {
    const response = await this.get('/referrals/code');
    return response.data.referralCode;
  }

  async getReferralStatus() {
    const response = await this.get('/referrals/status');
    return response.data;
  }

  async claimReferralReward() {
    const response = await this.post('/referrals/claim-reward');
    return response.data.reward;
  }

  // Upload endpoints
  async uploadFile(file: File, type: 'avatar' | 'memory' | 'document') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await this.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.get('/health');
    return response.data;
  }

  // CSRF token
  async getCsrfToken() {
    const response = await this.get('/csrf-token');
    const token = response.data.csrfToken;
    
    if (browser) {
      localStorage.setItem('csrf_token', token);
    }
    
    return token;
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export types
export type { AxiosRequestConfig } from 'axios';