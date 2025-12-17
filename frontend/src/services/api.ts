import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Token management functions
export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('token', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) => api.post('/auth/reset-password', data),
};

// Family API
export const familyApi = {
  getAll: () => api.get('/family'),
  getOne: (id: string) => api.get(`/family/${id}`),
  create: (data: { name: string; relationship: string; email?: string; phone?: string; avatarUrl?: string }) =>
    api.post('/family', data),
  update: (id: string, data: Partial<{ name: string; relationship: string; email: string; avatarUrl: string }>) =>
    api.patch(`/family/${id}`, data),
  delete: (id: string) => api.delete(`/family/${id}`),
};

// Memories API
export const memoriesApi = {
  getAll: (params?: { type?: string; recipientId?: string; page?: number; limit?: number }) =>
    api.get('/memories', { params }),
  getOne: (id: string) => api.get(`/memories/${id}`),
  getStats: () => api.get('/memories/stats/summary'),
  getUploadUrl: (data: { filename: string; contentType: string }) =>
    api.post('/memories/upload-url', data),
  create: (data: any) => api.post('/memories', data),
  update: (id: string, data: any) => api.patch(`/memories/${id}`, data),
  delete: (id: string) => api.delete(`/memories/${id}`),
};

// Letters API
export const lettersApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/letters', { params }),
  getOne: (id: string) => api.get(`/letters/${id}`),
  create: (data: any) => api.post('/letters', data),
  update: (id: string, data: any) => api.patch(`/letters/${id}`, data),
  seal: (id: string) => api.post(`/letters/${id}/seal`),
  delete: (id: string) => api.delete(`/letters/${id}`),
};

// Voice API
export const voiceApi = {
  getAll: (params?: { page?: number; limit?: number }) => api.get('/voice', { params }),
  getOne: (id: string) => api.get(`/voice/${id}`),
  getStats: () => api.get('/voice/stats'),
  getPrompts: () => api.get('/voice/prompts/list'),
  getUploadUrl: (data: { filename: string; contentType: string }) =>
    api.post('/voice/upload-url', data),
  create: (data: any) => api.post('/voice', data),
  update: (id: string, data: any) => api.patch(`/voice/${id}`, data),
  delete: (id: string) => api.delete(`/voice/${id}`),
};

// Billing API
export const billingApi = {
  getSubscription: () => api.get('/billing/subscription'),
  getLimits: () => api.get('/billing/limits'),
  getPricing: (currency?: string) => api.get('/billing/pricing', { params: { currency } }),
  checkout: (data: { tier: string; billingCycle?: string; currency?: string }) =>
    api.post('/billing/checkout', data),
  subscribe: (tier: string, billingCycle: string) => 
    api.post('/billing/checkout', { tier, billingCycle }),
  cancel: () => api.post('/billing/cancel'),
  portal: () => api.post('/billing/portal'),
  updateCurrency: (currency: string) => api.patch('/billing/currency', { currency }),
};

// Settings API
export const settingsApi = {
  getProfile: () => api.get('/settings/profile'),
  updateProfile: (data: { firstName?: string; lastName?: string; avatarUrl?: string }) =>
    api.patch('/settings/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/settings/change-password', data),
  deleteAccount: (password: string) => api.delete('/settings/account', { data: { password } }),
  getUploadUrl: (data: { filename: string; contentType: string }) =>
    api.post('/settings/upload-url', data),
  getNotifications: () => api.get('/settings/notifications'),
  updateNotifications: (data: { emailNotifications?: boolean; pushNotifications?: boolean; reminderEmails?: boolean; marketingEmails?: boolean; weeklyDigest?: boolean }) =>
    api.patch('/settings/notifications', data),
};

// Dead Man's Switch API
export const deadmanApi = {
  getStatus: () => api.get('/deadman/status'),
  configure: (data: { intervalDays: number; gracePeriodDays?: number }) =>
    api.post('/deadman/configure', data),
  checkIn: () => api.post('/deadman/checkin'),
  cancel: (password: string) => api.post('/deadman/cancel', { password }),
  disable: () => api.post('/deadman/disable'),
  getHistory: () => api.get('/deadman/history'),
  verifyPassing: (token: string) => api.post(`/deadman/verify/${token}`),
};

// Encryption API
export const encryptionApi = {
  setup: (password: string) => api.post('/encryption/setup', { password }),
  getParams: () => api.get('/encryption/params'),
  setupEscrow: (data: { beneficiaryIds: string[]; encryptedKey: string }) =>
    api.post('/encryption/escrow', data),
  getEscrow: () => api.get('/encryption/escrow'),
};

// Legacy Contacts API
export const legacyContactsApi = {
  getAll: () => api.get('/settings/legacy-contacts'),
  add: (data: { name: string; email: string; phone?: string; relationship: string }) =>
    api.post('/settings/legacy-contacts', data),
  remove: (id: string) => api.delete(`/settings/legacy-contacts/${id}`),
  resendVerification: (id: string) => api.post(`/settings/legacy-contacts/${id}/resend`),
};

// Wrapped API
export const wrappedApi = {
  getCurrent: () => api.get('/wrapped/current'),
  getYear: (year: number) => api.get(`/wrapped/${year}`),
  regenerate: (year: number) => api.post(`/wrapped/${year}/regenerate`),
  getYears: () => api.get('/wrapped'),
};

// Admin API (uses separate admin token)
const adminAxios = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminApi = {
  login: (data: { email: string; password: string }) => adminAxios.post('/admin/login', data),
  logout: () => adminAxios.post('/admin/logout'),
  getMe: () => adminAxios.get('/admin/me'),
  getAnalyticsOverview: () => adminAxios.get('/admin/analytics/overview'),
  getAnalyticsRevenue: () => adminAxios.get('/admin/analytics/revenue'),
  getAnalyticsUsers: () => adminAxios.get('/admin/analytics/users'),
  
  // Coupons
  getCoupons: () => adminAxios.get('/admin/coupons'),
  createCoupon: (data: any) => adminAxios.post('/admin/coupons', data),
  updateCoupon: (id: string, data: any) => adminAxios.patch(`/admin/coupons/${id}`, data),
  deleteCoupon: (id: string) => adminAxios.delete(`/admin/coupons/${id}`),
  
  // Users
  getUsers: (params?: { search?: string; limit?: number; page?: number }) => adminAxios.get('/admin/users', { params }),
  getUser: (id: string) => adminAxios.get(`/admin/users/${id}`),
  updateUser: (id: string, data: any) => adminAxios.patch(`/admin/users/${id}`, data),
  extendTrial: (userId: string, days: number) => adminAxios.post(`/admin/users/${userId}/extend-trial`, { days }),
  applyCouponToUser: (userId: string, couponCode: string) => adminAxios.post(`/admin/users/${userId}/apply-coupon`, { couponCode }),
  cancelSubscription: (userId: string) => adminAxios.post(`/admin/users/${userId}/cancel-subscription`),
  
  // Support Tickets
  getTickets: (params?: { status?: string; priority?: string; page?: number; limit?: number }) => 
    adminAxios.get('/admin/support/tickets', { params }),
  getTicket: (id: string) => adminAxios.get(`/admin/support/tickets/${id}`),
  updateTicket: (id: string, data: any) => adminAxios.patch(`/admin/support/tickets/${id}`, data),
  replyToTicket: (id: string, message: string) => adminAxios.post(`/admin/support/tickets/${id}/reply`, { message }),
  
  // System Health
  getSystemHealth: () => adminAxios.get('/admin/system/health'),
  getSystemStats: () => adminAxios.get('/admin/system/stats'),
  
  // Audit Logs
  getAuditLogs: (params?: { action?: string; adminId?: string; page?: number; limit?: number }) => 
    adminAxios.get('/admin/audit-logs', { params }),
  
  // Admin Users
  getAdminUsers: () => adminAxios.get('/admin/admin-users'),
  createAdminUser: (data: { email: string; firstName: string; lastName: string; role: string }) => 
    adminAxios.post('/admin/admin-users', data),
  updateAdminUser: (id: string, data: any) => adminAxios.patch(`/admin/admin-users/${id}`, data),
  deleteAdminUser: (id: string) => adminAxios.delete(`/admin/admin-users/${id}`),
  
  // Email Management
  getEmailLogs: (params?: { status?: string; page?: number; limit?: number }) => 
    adminAxios.get('/admin/emails', { params }),
  sendBulkEmail: (data: { subject: string; body: string; recipients: string[] | 'all' }) => 
    adminAxios.post('/admin/emails/bulk', data),
  
  // Reports
  getRevenueReport: (params?: { startDate?: string; endDate?: string }) => 
    adminAxios.get('/admin/reports/revenue', { params }),
  getUserGrowthReport: (params?: { startDate?: string; endDate?: string }) => 
    adminAxios.get('/admin/reports/user-growth', { params }),
  exportUsers: (format: 'csv' | 'json') => adminAxios.get('/admin/reports/export/users', { params: { format } }),
  
  // Billing Analysis
  getBillingErrors: (params?: { status?: string; page?: number; limit?: number }) => 
    adminAxios.get('/admin/billing/errors', { params }),
  getBillingErrorStats: () => adminAxios.get('/admin/billing/errors/stats'),
  notifyBillingError: (errorId: string) => adminAxios.post(`/admin/billing/errors/${errorId}/notify`),
  reprocessBillingError: (errorId: string) => adminAxios.post(`/admin/billing/errors/${errorId}/reprocess`),
  resolveBillingError: (errorId: string, data: { resolution?: string }) => 
    adminAxios.post(`/admin/billing/errors/${errorId}/resolve`, data),
  notifyAllFailedBilling: () => adminAxios.post('/admin/billing/notify-all-failed'),
};

export default api;
