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
};

// Family API
export const familyApi = {
  getAll: () => api.get('/family'),
  getOne: (id: string) => api.get(`/family/${id}`),
  create: (data: { name: string; relationship: string; email?: string; phone?: string }) =>
    api.post('/family', data),
  update: (id: string, data: Partial<{ name: string; relationship: string; email: string }>) =>
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
  updateProfile: (data: { firstName?: string; lastName?: string }) =>
    api.patch('/settings/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/settings/change-password', data),
  deleteAccount: (password: string) => api.delete('/settings/account', { data: { password } }),
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

export default api;
