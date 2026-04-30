import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api';

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
  localStorage.removeItem('heirloom-auth');
};

// Get current auth token (for use with raw fetch calls that bypass axios)
export const getAuthToken = (): string | null => localStorage.getItem('token');

// Get auth headers for raw fetch calls (e.g., file uploads)
// Returns a Record type that can be spread into fetch headers
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token refresh retry limit to prevent infinite loops (BUG-004 fix)
const MAX_RETRY_ATTEMPTS = 3;
let retryCount = 0;

// Handle token refresh on 401 and rate limiting on 429
api.interceptors.response.use(
  (response) => {
    retryCount = 0; // Reset on successful response
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle rate limiting (BUG-008 fix)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      const errorMessage = `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
      error.message = errorMessage;
      return Promise.reject(error);
    }
    
    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (retryCount >= MAX_RETRY_ATTEMPTS) {
        retryCount = 0;
        clearTokens();
        window.location.href = '/login?session_expired=true';
        return Promise.reject(error);
      }
      
      retryCount++;
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearTokens();
        window.location.href = '/login?session_expired=true';
        return Promise.reject(refreshError);
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
  update: (id: string, data: Partial<{ name: string; relationship: string; email: string; avatarUrl: string; notes: string }>) =>
    api.patch(`/family/${id}`, data),
  delete: (id: string) => api.delete(`/family/${id}`),
};

// Memories API
export const memoriesApi = {
  getAll: (params?: { type?: string; recipientId?: string; page?: number; limit?: number }) =>
    api.get('/memories', { params }),
  getMapMemories: (params?: { type?: string }) => api.get('/memories/map', { params }),
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
  aiSuggest: (data: { salutation?: string; body?: string; signature?: string; recipientNames?: string; tone?: string; occasion?: string }) =>
    api.post('/letters/ai-suggest', data),
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

// Gifts API (Gift-a-Memory viral loop)
export const giftsApi = {
  send: (data: { memory_type: string; memory_id: string; recipient_email: string; recipient_name: string; personal_message?: string; unlock_date?: string }) =>
    api.post('/gifts/send', data),
  receive: (token: string) => api.get(`/gifts/receive/${token}`),
  claim: (token: string) => api.post(`/gifts/claim/${token}`),
};

// Capsules API (Time Capsules)
export const capsulesApi = {
  getAll: () => api.get('/capsules'),
  getOne: (id: string) => api.get(`/capsules/${id}`),
  create: (data: { title: string; description?: string; unlock_date: string; cover_style?: string }) =>
    api.post('/capsules', data),
  addItem: (capsuleId: string, data: { item_type: string; title: string; content?: string; file_key?: string }) =>
    api.post(`/capsules/${capsuleId}/items`, data),
  seal: (capsuleId: string) => api.post(`/capsules/${capsuleId}/seal`),
  open: (capsuleId: string) => api.post(`/capsules/${capsuleId}/open`),
  invite: (capsuleId: string, data: { email: string }) =>
    api.post(`/capsules/${capsuleId}/invite`, data),
};

// Engagement API (Family Feed, On This Day, Legacy Score, Streaks)
export const engagementApi = {
  getLegacyScore: () => api.get('/engagement/legacy-score'),
  getFamilyFeed: () => api.get('/engagement/family-feed'),
  getOnThisDay: () => api.get('/memories/on-this-day'),
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
  markNotificationRead: (id: string) => api.patch(`/settings/notifications/${id}/read`),
  markAllNotificationsRead: () => api.post('/settings/notifications/read-all'),
  submitTicket: (data: { subject: string; category: string; description: string; userEmail?: string; userName?: string }) =>
    api.post('/support/ticket', data),
  // Family Echo Inbox
  getInbox: () => api.get('/settings/inbox'),
  markInboxMessageRead: (id: string) => api.patch(`/settings/inbox/${id}/read`),
  markAllInboxRead: () => api.post('/settings/inbox/mark-all-read'),
  // Onboarding
  completeOnboarding: () => api.post('/settings/onboarding/complete'),
  // WhatsApp
  connectWhatsApp: (data: { phone: string }) => api.post('/settings/connect-whatsapp', data),
  verifyWhatsApp: (data: { code: string }) => api.post('/settings/verify-whatsapp', data),
};

// Dead Man's Switch API
export const deadmanApi = {
  getStatus: () => api.get('/deadman/status'),
  configure: (data: { intervalDays: number; gracePeriodDays?: number }) =>
    api.post('/deadman/configure', { 
      checkInIntervalDays: data.intervalDays, 
      gracePeriodDays: data.gracePeriodDays 
    }),
  checkIn: () => api.post('/deadman/checkin'),
  cancel: (password: string) => api.post('/deadman/cancel', { password }),
  disable: () => api.post('/deadman/disable'),
  getHistory: () => api.get('/deadman/history'),
  verifyPassing: (token: string) => api.post(`/deadman/verify/${token}`),
};

// Encryption API
export const encryptionApi = {
  setup: (data: { encryptedMasterKey: string; encryptionSalt: string; keyDerivationParams?: any }) => 
    api.post('/encryption/setup', data),
  getParams: () => api.get('/encryption/params'),
  getStatus: () => api.get('/encryption/status'),
  getSalt: () => api.get('/encryption/salt'),
  getMasterKey: () => api.get('/encryption/master-key'),
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

// AI API (new viral features)
export const aiApi = {
  // Memory prompts
  getPrompt: () => api.get('/ai/prompt'),
  getPrompts: (limit?: number) => api.get('/ai/prompts', { params: { limit } }),
  markPromptUsed: (id: string) => api.post(`/ai/prompt/${id}/used`),
  markPromptShared: (id: string) => api.post(`/ai/prompt/${id}/shared`),
  
  // Future letter
  generateFutureLetter: (data: { currentAge: number; values: string; hopes: string; fears: string; lovedOnes: string }) =>
    api.post('/ai/future-letter', data),
  getFutureLetters: () => api.get('/ai/future-letters'),
  markFutureLetterShared: (id: string) => api.post(`/ai/future-letter/${id}/shared`),
  
  // Legacy score
  getLegacyScore: () => api.get('/ai/legacy-score'),

  // Interview follow-up
  interviewFollowup: (data: { currentQuestion: string; transcriptSoFar: string }) =>
    api.post('/ai/interview-followup', data),

  // Transcribe
  transcribe: (data: { audioUrl: string }) => api.post('/ai/transcribe', data),
};

// Search API
export const searchApi = {
  search: (query: string, type?: 'all' | 'memories' | 'voice' | 'letters', limit?: number) =>
    api.get('/memories/search', { params: { q: query, type, limit } }),
};

// Voice transcription API extension
export const transcriptionApi = {
  transcribe: (id: string) => api.post(`/voice/${id}/transcribe`),
  transcribeAll: () => api.post('/voice/transcribe-all'),
};

// Memory cards API - Shareable Instagram-ready cards
export const memoryCardsApi = {
  // Get available card styles
  getStyles: () => api.get('/memory-cards/styles'),
  
  // Generate a new card from a memory
  generate: (data: { memoryId: string; style?: string; customText?: string; includePhoto?: boolean }) =>
    api.post('/memory-cards/generate', data),
  
  // Get user's generated cards
  getAll: () => api.get('/memory-cards'),
  
  // Get a specific card (public)
  getOne: (id: string) => api.get(`/memory-cards/${id}`),
  
  // Record share action
  recordShare: (id: string, platform: string) => api.post(`/memory-cards/${id}/share`, { platform }),
  
  // Delete a card
  delete: (id: string) => api.delete(`/memory-cards/${id}`),
  
  // On This Day memories
  getOnThisDay: () => api.get('/memory-cards/on-this-day'),
};

// Data export API extension
export const exportApi = {
  exportData: () => api.get('/settings/export'),
  bookPreview: (config: any) => api.post('/export/book/preview', config),
  bookOrder: (config: any) => api.post('/export/book/order', config),
};

// Email verification API extension
export const emailVerificationApi = {
  verifyEmail: (token: string) => api.get('/auth/verify-email', { params: { token } }),
  resendVerification: () => api.post('/auth/resend-verification'),
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
  getEmailDetail: (id: string) => adminAxios.get(`/admin/emails/${id}`),
  resendEmail: (id: string) => adminAxios.post(`/admin/emails/${id}/resend`),
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
  
  // Usage Analytics
  getUsageAnalytics: () => adminAxios.get('/admin/analytics/usage'),
  
  // Encryption Stats
  getEncryptionStats: () => adminAxios.get('/encryption/admin/stats'),
};

export const referralApi = {
  getMyReferral: () => api.get('/marketing/referral/code'),
  trackShare: (platform: string) => api.post('/marketing/share/track', { platform }),
};

// Q4 2025 Features APIs

// Memory Streaks API
export const streaksApi = {
  getStatus: () => api.get('/streaks'),
  recordActivity: () => api.post('/streaks/activity'),
  freezeStreak: () => api.post('/streaks/freeze'),
};

// Weekly Challenges API
export const challengesApi = {
  getAll: () => api.get('/challenges'),
  getCurrent: () => api.get('/challenges/current'),
  getSubmissions: (challengeId: string) => api.get(`/challenges/${challengeId}/submissions`),
  submit: (challengeId: string, data: { memoryId?: string; voiceId?: string; content?: string }) =>
    api.post(`/challenges/${challengeId}/submit`, data),
  recordShare: (submissionId: string, platform: string) =>
    api.post(`/challenges/submissions/${submissionId}/share`, { platform }),
};

// Family Referrals API
export const familyReferralsApi = {
  getStats: () => api.get('/referrals'),
  createInvite: (data: { email: string; branch?: string; relationship?: string }) =>
    api.post('/referrals/invite', data),
  acceptInvite: (inviteCode: string, userId: string, firstName?: string) =>
    api.post('/referrals/accept', { inviteCode, userId, firstName }),
};

// Gift Subscriptions API
export const giftSubscriptionsApi = {
  getPricing: () => api.get('/gifts/pricing'),
  purchase: (data: {
    purchaserEmail: string;
    purchaserName: string;
    recipientEmail: string;
    recipientName: string;
    tier: string;
    personalMessage?: string;
    style?: string;
    scheduledDeliveryDate?: string;
  }) => api.post('/gifts/purchase', data),
  redeem: (giftCode: string) => api.post('/gifts/redeem', { giftCode }),
  getPurchased: () => api.get('/gifts/purchased'),
};

// QR Memorial Codes API
export const memorialsApi = {
  getAll: () => api.get('/memorials'),
  create: (data: {
    familyMemberId?: string;
    name: string;
    description?: string;
    style?: string;
    isPublic?: boolean;
    birthDate?: string;
    deathDate?: string;
    location?: string;
    epitaph?: string;
  }) => api.post('/memorials', data),
  getPage: (code: string) => api.get(`/memorials/page/${code}`),
  addTribute: (code: string, data: { message: string; name?: string; email?: string }) =>
    api.post(`/memorials/page/${code}/tribute`, data),
};

// Milestone Alerts API
export const milestonesApi = {
  getAll: () => api.get('/milestones'),
  getUpcoming: () => api.get('/milestones/upcoming'),
  create: (data: {
    familyMemberId?: string;
    type: string;
    name: string;
    date: string;
    recurring?: boolean;
    reminderDays?: number;
    promptSuggestion?: string;
  }) => api.post('/milestones', data),
  autoDetect: () => api.post('/milestones/auto-detect'),
  delete: (id: string) => api.delete(`/milestones/${id}`),
};

// User Notifications API
export const userNotificationsApi = {
  getAll: (params?: { limit?: number; unread?: boolean }) =>
    api.get('/notifications', { params: { ...params, unread: params?.unread ? 'true' : undefined } }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

// Social Posting Engine Admin API
export const socialApi = {
  getCalendar: (params?: { week?: number; status?: string }) =>
    adminAxios.get('/admin/social/calendar', { params }),
  getStats: () => adminAxios.get('/admin/social/stats'),
  bulkLoad: (data: { week: number; startDate: string; posts: any[] }) =>
    adminAxios.post('/admin/social/bulk-load', data),
  pause: (id: string) => adminAxios.post(`/admin/social/pause/${id}`),
  retry: (id: string) => adminAxios.post(`/admin/social/retry/${id}`),
  deletePost: (id: string) => adminAxios.delete(`/admin/social/${id}`),
  uploadAsset: (data: { week: number; day: string; filename: string; contentType: string }) =>
    adminAxios.post('/admin/social/upload-asset', data),
  getTemplates: (week?: number) => adminAxios.get('/admin/social/templates', { params: { week } }),
  createTemplate: (data: any) => adminAxios.post('/admin/social/templates', data),
};

export const marketingApi = {
  getContent: (params?: { platform?: string; status?: string; theme?: string }) =>
    adminAxios.get('/marketing/content', { params }),
  createContent: (data: any) => adminAxios.post('/marketing/content', data),
  updateContent: (id: string, data: any) => adminAxios.put(`/marketing/content/${id}`, data),
  deleteContent: (id: string) => adminAxios.delete(`/marketing/content/${id}`),
  
  getInfluencers: (params?: { segment?: string; status?: string; platform?: string }) =>
    adminAxios.get('/marketing/influencers', { params }),
  createInfluencer: (data: any) => adminAxios.post('/marketing/influencers', data),
  importInfluencers: (influencers: any[]) => adminAxios.post('/marketing/influencers/import', { influencers }),
  updateInfluencer: (id: string, data: any) => adminAxios.put(`/marketing/influencers/${id}`, data),
  
  getCampaigns: () => adminAxios.get('/marketing/campaigns'),
  createCampaign: (data: any) => adminAxios.post('/marketing/campaigns', data),
  sendCampaign: (id: string, data: { segment?: string; influencerIds?: string[]; bodyHtml: string }) =>
    adminAxios.post(`/marketing/campaigns/${id}/send`, data),
  
  getCreatorSignups: () => adminAxios.get('/marketing/creator-signups'),
  approveCreatorSignup: (id: string) => adminAxios.post(`/marketing/creator-signups/${id}/approve`),
  
  getSuppression: () => adminAxios.get('/marketing/suppression'),
  getAuditLog: () => adminAxios.get('/marketing/audit-log'),
  
  getTestimonials: (featured?: boolean) => adminAxios.get('/marketing/testimonials', { params: { featured } }),
  createTestimonial: (data: any) => adminAxios.post('/marketing/testimonials', data),
  
  refreshStats: () => adminAxios.post('/marketing/stats/refresh'),
};

// ============================================================================
// Family Thread API — the append-only, multi-generational primitive.
// Schema: cloudflare/migrations/0036_family_thread.sql
// Worker:  cloudflare/worker/src/routes/threads.ts
// ============================================================================

export type ThreadVisibility = 'PRIVATE' | 'FAMILY' | 'DESCENDANTS' | 'HISTORIAN';
export type ThreadRole = 'FOUNDER' | 'SUCCESSOR' | 'AUTHOR' | 'READER' | 'PLACEHOLDER';
export type ThreadLockType = 'DATE' | 'AGE' | 'AUTHOR_DEATH' | 'RECIPIENT_EVENT' | 'GENERATION';

export interface ThreadSummary {
  id: string;
  name: string;
  dedication: string | null;
  plan: 'FREE' | 'FAMILY' | 'FOUNDER';
  status: 'ACTIVE' | 'ARCHIVED';
  default_visibility: ThreadVisibility;
  role: ThreadRole;
  generation_offset: number;
  entry_count: number;
  member_count: number;
  created_at: string;
}

export interface ThreadMember {
  id: string;
  display_name: string;
  email: string | null;
  relation_label: string | null;
  role: ThreadRole;
  age_gate_years: number | null;
  target_role: 'AUTHOR' | 'READER' | null;
  generation_offset: number;
  parent_member_id: string | null;
  granted_at: string;
}

export interface ThreadEntry {
  id: string;
  thread_id: string;
  author_member_id: string;
  title: string | null;
  body_ciphertext: string | null;
  body_iv: string | null;
  body_auth_tag: string | null;
  voice_recording_id: string | null;
  memory_id: string | null;
  visibility: ThreadVisibility;
  era_label: string | null;
  era_year: number | null;
  mutable_until: string;
  created_at: string;
  tags_json: string | null;
  pending_lock: ThreadLockType | null;
}

export interface UpcomingUnlock {
  unlock_id: string;
  lock_type: ThreadLockType;
  unlock_date: string | null;
  age_years: number | null;
  target_member_id: string | null;
  entry_id: string;
  entry_title: string | null;
  thread_id: string;
  thread_name: string;
  target_name: string | null;
  target_birth_date: string | null;
  caller_role: ThreadRole;
  caller_generation: number;
}

export const threadsApi = {
  list: () => api.get<{ threads: ThreadSummary[] }>('/threads'),
  get: (id: string) => api.get<{ thread: ThreadSummary; membership: ThreadMember }>(`/threads/${id}`),
  create: (data: { name: string; dedication?: string; default_visibility?: ThreadVisibility }) =>
    api.post<{ thread: ThreadSummary; membership: { id: string; role: ThreadRole } }>('/threads', data),

  // Members
  listMembers: (threadId: string) => api.get<{ members: ThreadMember[] }>(`/threads/${threadId}/members`),
  addMember: (
    threadId: string,
    data: {
      display_name: string;
      email?: string;
      relation_label?: string;
      role: Exclude<ThreadRole, 'FOUNDER'>;
      age_gate_years?: number;
      target_role?: 'AUTHOR' | 'READER';
      birth_date?: string;
      parent_member_id?: string;
      generation_offset?: number;
    },
  ) => api.post<{ member: { id: string; role: ThreadRole; display_name: string } }>(`/threads/${threadId}/members`, data),

  // Entries
  listEntries: (
    threadId: string,
    params?: { ancestor?: string; era?: string; limit?: number; offset?: number },
  ) => api.get<{ entries: ThreadEntry[] }>(`/threads/${threadId}/entries`, { params }),
  createEntry: (
    threadId: string,
    data: {
      title?: string;
      body_ciphertext?: string;
      body_iv?: string;
      body_auth_tag?: string;
      voice_recording_id?: string;
      memory_id?: string;
      visibility?: ThreadVisibility;
      era_label?: string;
      era_year?: number;
      tags?: { type: 'PERSON' | 'PLACE' | 'DATE' | 'ERA' | 'TOPIC'; label: string; member_id?: string; year_value?: number }[];
      unlock?: {
        lock_type: ThreadLockType;
        unlock_date?: string;
        age_years?: number;
        target_member_id?: string;
        event_label?: string;
        target_generation?: number;
        encrypted_key: string;
      };
    },
  ) => api.post<{ entry: { id: string; visibility: ThreadVisibility; mutable_until: string } }>(`/threads/${threadId}/entries`, data),
  addComment: (
    threadId: string,
    entryId: string,
    data: { ciphertext: string; iv: string; auth_tag: string },
  ) => api.post<{ comment: { id: string } }>(`/threads/${threadId}/entries/${entryId}/comments`, data),

  // Successor designations
  listSuccessors: (threadId: string) => api.get(`/threads/${threadId}/successors`),
  designateSuccessor: (threadId: string, data: { successor_member_id: string; rank?: number }) =>
    api.post(`/threads/${threadId}/successors`, data),

  // Time-locked inbox (cross-thread, scoped to caller)
  upcomingUnlocks: (days = 90) =>
    api.get<{ upcoming: UpcomingUnlock[]; days: number }>('/threads/inbox/upcoming', { params: { days } }),
  recentUnlocks: (days = 30) =>
    api.get<{ recent: any[]; days: number }>('/threads/inbox/recent', { params: { days } }),

  // Starter prompts ("I don't know what to write")
  starterPrompts: (params?: { audience?: string; category?: string }) =>
    api.get<{ prompts: { id: string; prompt_text: string; category: string; suggested_audience: string; era_hint: string | null }[] }>(
      '/threads/starter-prompts',
      { params },
    ),

  // Living Book — order a printed book of the thread
  orderBook: (
    threadId: string,
    data: {
      ship_to: {
        name: string;
        line1: string;
        line2?: string;
        city: string;
        state_code?: string;
        country_code: string;
        postcode: string;
        phone_number: string;
        email: string;
      };
      entry_filter?: { from?: string; to?: string; member_ids?: string[]; era_year?: number };
    },
  ) => api.post<{ book_order: { id: string; status: string }; note: string }>(`/threads/${threadId}/book`, data),
};

// ============================================================================
// Founder pledge API — first 100 families, $999 lifetime.
// Public surface (no auth required).
// ============================================================================

export interface FounderCount {
  paid: number;
  pledged: number;
  cap: number;
  remaining: number;
  pledge_amount_usd: number;
}

export interface FounderPledgeStatus {
  ok: boolean;
  pledge_number?: number | null;
  status?: string;
  family_name?: string | null;
}

export const foundersApi = {
  count: () => api.get<FounderCount>('/founders/count'),
  pledge: (data: { name: string; email: string; family_name?: string; notes?: string }) =>
    api.post<{
      ok: boolean;
      id?: string;
      already_pledged?: boolean;
      status?: string;
      message?: string;
      cap_reached?: boolean;
      checkout_url?: string | null;
    }>('/founders/pledge', data),
  bySession: (sessionId: string) =>
    api.get<FounderPledgeStatus>('/founders/by-session', { params: { session_id: sessionId } }),
};

// ============================================================================
// Archive API — public continuity audit (IPFS pin status).
// ============================================================================

export interface ArchiveAudit {
  summary: {
    total_pins: number;
    threads_pinned: number;
    total_bytes_pinned: number;
    total_entries_archived: number;
  };
  providers: { provider: string; pins: number; most_recent: string }[];
  freshness: { verified_last_week: number; verification_failed: number };
  commitment: string;
  audit_generated_at: string;
}

export const archiveApi = {
  audit: () => api.get<ArchiveAudit>('/archive/audit'),
};

// ============================================================================
// Books API — order status read for the Living Book.
// (Ordering happens via threadsApi.orderBook.)
// ============================================================================

export interface BookOrder {
  id: string;
  status: 'PENDING' | 'COMPILING' | 'PRINTING' | 'SHIPPED' | 'FAILED';
  lulu_status: string | null;
  tracking_url: string | null;
  total_cents: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export const booksApi = {
  getOrder: (id: string) => api.get<{ book_order: BookOrder }>(`/book-orders/${id}`),
};

export default api;
