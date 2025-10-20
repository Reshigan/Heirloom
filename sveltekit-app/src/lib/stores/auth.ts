import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { api } from '$lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  subscription: 'basic' | 'premium' | 'family' | 'enterprise';
  onboardingCompleted: boolean;
  createdAt: string;
  lastActiveAt?: string;
  bio?: string;
  location?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
  };
  privacy: {
    profileVisibility: 'public' | 'family' | 'private';
    memoryDefaultVisibility: 'public' | 'family' | 'private';
    allowAIProcessing: boolean;
    allowAnalytics: boolean;
    marketingEmails: boolean;
  };
  notifications: {
    email: {
      memoryReminders: boolean;
      familyActivity: boolean;
      aiStoryReady: boolean;
      timeCapsuleDelivery: boolean;
    };
    push: {
      memoryReminders: boolean;
      familyActivity: boolean;
    };
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  token: null
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,

    async init() {
      if (!browser) return;

      const token = localStorage.getItem('auth_token');
      if (!token) return;

      update(state => ({ ...state, loading: true, token }));

      try {
        const user = await api.getCurrentUser();
        update(state => ({
          ...state,
          user,
          isAuthenticated: true,
          loading: false,
          error: null
        }));
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        this.logout();
      }
    },

    async register(userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      dateOfBirth?: string;
      phoneNumber?: string;
      referralCode?: string;
    }) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await api.register(userData);
        
        update(state => ({
          ...state,
          user: response.user,
          isAuthenticated: true,
          loading: false,
          token: response.token
        }));

        return response;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Registration failed';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async login(credentials: { email: string; password: string }) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await api.login(credentials);
        
        update(state => ({
          ...state,
          user: response.user,
          isAuthenticated: true,
          loading: false,
          token: response.token
        }));

        return response;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Login failed';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async logout() {
      update(state => ({ ...state, loading: true }));

      try {
        await api.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        set(initialState);
      }
    },

    async updateProfile(profileData: Partial<User>) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const updatedUser = await api.updateProfile(profileData);
        
        update(state => ({
          ...state,
          user: updatedUser,
          loading: false
        }));

        return updatedUser;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Profile update failed';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async updatePrivacySettings(settings: Partial<User['privacy']>) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        await api.updatePrivacySettings(settings);
        
        update(state => ({
          ...state,
          user: state.user ? {
            ...state.user,
            privacy: { ...state.user.privacy, ...settings }
          } : null,
          loading: false
        }));
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Privacy settings update failed';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async updateNotificationSettings(settings: Partial<User['notifications']>) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        await api.updateNotificationSettings(settings);
        
        update(state => ({
          ...state,
          user: state.user ? {
            ...state.user,
            notifications: { ...state.user.notifications, ...settings }
          } : null,
          loading: false
        }));
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Notification settings update failed';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async forgotPassword(email: string) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        await api.forgotPassword(email);
        update(state => ({ ...state, loading: false }));
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Password reset request failed';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async resetPassword(token: string, password: string) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        await api.resetPassword(token, password);
        update(state => ({ ...state, loading: false }));
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Password reset failed';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    async refreshToken() {
      try {
        const response = await api.refreshToken();
        update(state => ({
          ...state,
          token: response.token
        }));
        return response;
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.logout();
        throw error;
      }
    },

    clearError() {
      update(state => ({ ...state, error: null }));
    },

    // Utility methods
    hasRole(role: User['role']) {
      return new Promise<boolean>((resolve) => {
        const unsubscribe = subscribe(state => {
          resolve(state.user?.role === role || false);
          unsubscribe();
        });
      });
    },

    hasPermission(permission: string) {
      return new Promise<boolean>((resolve) => {
        const unsubscribe = subscribe(state => {
          if (!state.user) {
            resolve(false);
            unsubscribe();
            return;
          }

          // Define role-based permissions
          const permissions = {
            user: ['read_own_memories', 'create_memories', 'update_own_profile'],
            moderator: ['moderate_content', 'view_reports', 'ban_users'],
            admin: ['manage_users', 'manage_system', 'view_analytics', 'manage_subscriptions']
          };

          const userPermissions = permissions[state.user.role] || [];
          resolve(userPermissions.includes(permission));
          unsubscribe();
        });
      });
    },

    isSubscriptionActive() {
      return new Promise<boolean>((resolve) => {
        const unsubscribe = subscribe(state => {
          resolve(state.user?.subscription !== undefined && state.user.subscription !== 'basic');
          unsubscribe();
        });
      });
    }
  };
}

export const authStore = createAuthStore();

// Initialize auth store when module loads
if (browser) {
  authStore.init();
}