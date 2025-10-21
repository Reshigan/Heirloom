import { writable } from 'svelte/store';
import { api } from '$lib/api';

interface AdminStats {
  totalUsers: number;
  activeToday: number;
  totalMemories: number;
  monthlyRevenue: number;
  userGrowth: number;
  memoryGrowth: number;
  revenueGrowth: number;
  conversionRate: number;
  conversionChange: number;
}

interface AdminState {
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  stats: null,
  loading: false,
  error: null
};

function createAdminStore() {
  const { subscribe, set, update } = writable<AdminState>(initialState);

  return {
    subscribe,
    
    async getDashboardStats(): Promise<AdminStats> {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const response = await api.get('/admin/dashboard/stats');
        const stats = response.data.stats;
        
        update(state => ({ ...state, stats, loading: false }));
        return stats;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard stats';
        update(state => ({ ...state, error: errorMessage, loading: false }));
        throw error;
      }
    },

    async getDashboardData() {
      try {
        const response = await api.get('/admin/dashboard');
        return response.data;
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        throw error;
      }
    },

    async getUsers(params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      subscription?: string;
      role?: string;
      dateRange?: string;
    }) {
      try {
        const response = await api.get('/admin/users', { params });
        return response.data;
      } catch (error) {
        console.error('Failed to load users:', error);
        throw error;
      }
    },

    async getUser(userId: string) {
      try {
        const response = await api.get(`/admin/users/${userId}`);
        return response.data.user;
      } catch (error) {
        console.error('Failed to load user:', error);
        throw error;
      }
    },

    async createUser(userData: any) {
      try {
        const response = await api.post('/admin/users', userData);
        return response.data.user;
      } catch (error) {
        console.error('Failed to create user:', error);
        throw error;
      }
    },

    async updateUser(userId: string, userData: any) {
      try {
        const response = await api.put(`/admin/users/${userId}`, userData);
        return response.data.user;
      } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
      }
    },

    async deleteUser(userId: string) {
      try {
        await api.delete(`/admin/users/${userId}`);
      } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
      }
    },

    async banUser(userId: string) {
      try {
        const response = await api.post(`/admin/users/${userId}/ban`);
        return response.data.user;
      } catch (error) {
        console.error('Failed to ban user:', error);
        throw error;
      }
    },

    async unbanUser(userId: string) {
      try {
        const response = await api.post(`/admin/users/${userId}/unban`);
        return response.data.user;
      } catch (error) {
        console.error('Failed to unban user:', error);
        throw error;
      }
    },

    async exportUsers(filters: any): Promise<Blob> {
      try {
        const response = await api.get('/admin/users/export', {
          params: filters,
          responseType: 'blob'
        });
        return response.data;
      } catch (error) {
        console.error('Failed to export users:', error);
        throw error;
      }
    },

    async getContent(params: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      status?: string;
      dateRange?: string;
    }) {
      try {
        const response = await api.get('/admin/content', { params });
        return response.data;
      } catch (error) {
        console.error('Failed to load content:', error);
        throw error;
      }
    },

    async moderateContent(contentId: string, action: 'approve' | 'reject' | 'flag', reason?: string) {
      try {
        const response = await api.post(`/admin/content/${contentId}/moderate`, {
          action,
          reason
        });
        return response.data;
      } catch (error) {
        console.error('Failed to moderate content:', error);
        throw error;
      }
    },

    async getAnalytics(params: {
      period?: string;
      metrics?: string[];
      filters?: any;
    }) {
      try {
        const response = await api.get('/admin/analytics', { params });
        return response.data;
      } catch (error) {
        console.error('Failed to load analytics:', error);
        throw error;
      }
    },

    async getSecurityLogs(params: {
      page?: number;
      limit?: number;
      type?: string;
      severity?: string;
      dateRange?: string;
    }) {
      try {
        const response = await api.get('/admin/security/logs', { params });
        return response.data;
      } catch (error) {
        console.error('Failed to load security logs:', error);
        throw error;
      }
    },

    async getSystemHealth() {
      try {
        const response = await api.get('/admin/system/health');
        return response.data;
      } catch (error) {
        console.error('Failed to load system health:', error);
        throw error;
      }
    },

    async getSettings() {
      try {
        const response = await api.get('/admin/settings');
        return response.data.settings;
      } catch (error) {
        console.error('Failed to load settings:', error);
        throw error;
      }
    },

    async updateSettings(settings: any) {
      try {
        const response = await api.put('/admin/settings', settings);
        return response.data.settings;
      } catch (error) {
        console.error('Failed to update settings:', error);
        throw error;
      }
    },

    async runSecurityScan() {
      try {
        const response = await api.post('/admin/security/scan');
        return response.data;
      } catch (error) {
        console.error('Failed to run security scan:', error);
        throw error;
      }
    },

    async getBackups() {
      try {
        const response = await api.get('/admin/system/backups');
        return response.data.backups;
      } catch (error) {
        console.error('Failed to load backups:', error);
        throw error;
      }
    },

    async createBackup() {
      try {
        const response = await api.post('/admin/system/backups');
        return response.data.backup;
      } catch (error) {
        console.error('Failed to create backup:', error);
        throw error;
      }
    },

    async restoreBackup(backupId: string) {
      try {
        const response = await api.post(`/admin/system/backups/${backupId}/restore`);
        return response.data;
      } catch (error) {
        console.error('Failed to restore backup:', error);
        throw error;
      }
    },

    async getAuditLogs(params: {
      page?: number;
      limit?: number;
      action?: string;
      userId?: string;
      dateRange?: string;
    }) {
      try {
        const response = await api.get('/admin/audit-logs', { params });
        return response.data;
      } catch (error) {
        console.error('Failed to load audit logs:', error);
        throw error;
      }
    },

    async sendNotification(notification: {
      type: 'email' | 'push' | 'sms';
      recipients: string[];
      subject?: string;
      message: string;
      template?: string;
      data?: any;
    }) {
      try {
        const response = await api.post('/admin/notifications/send', notification);
        return response.data;
      } catch (error) {
        console.error('Failed to send notification:', error);
        throw error;
      }
    },

    async getSubscriptionAnalytics() {
      try {
        const response = await api.get('/admin/subscriptions/analytics');
        return response.data;
      } catch (error) {
        console.error('Failed to load subscription analytics:', error);
        throw error;
      }
    },

    async getRevenueAnalytics(params: {
      period?: string;
      breakdown?: string;
    }) {
      try {
        const response = await api.get('/admin/revenue/analytics', { params });
        return response.data;
      } catch (error) {
        console.error('Failed to load revenue analytics:', error);
        throw error;
      }
    },

    async getFeatureUsage() {
      try {
        const response = await api.get('/admin/features/usage');
        return response.data;
      } catch (error) {
        console.error('Failed to load feature usage:', error);
        throw error;
      }
    },

    async updateFeatureFlags(flags: any) {
      try {
        const response = await api.put('/admin/features/flags', flags);
        return response.data;
      } catch (error) {
        console.error('Failed to update feature flags:', error);
        throw error;
      }
    },

    async getPerformanceMetrics() {
      try {
        const response = await api.get('/admin/performance/metrics');
        return response.data;
      } catch (error) {
        console.error('Failed to load performance metrics:', error);
        throw error;
      }
    },

    async getErrorLogs(params: {
      page?: number;
      limit?: number;
      level?: string;
      service?: string;
      dateRange?: string;
    }) {
      try {
        const response = await api.get('/admin/logs/errors', { params });
        return response.data;
      } catch (error) {
        console.error('Failed to load error logs:', error);
        throw error;
      }
    },

    reset() {
      set(initialState);
    }
  };
}

export const adminStore = createAdminStore();