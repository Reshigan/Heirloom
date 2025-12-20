import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { authApi, setTokens, clearTokens } from '../services/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  preferredCurrency?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

// Safe localStorage wrapper that handles corrupted data gracefully
const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      const value = localStorage.getItem(name);
      if (value) {
        // Validate that it's valid JSON before returning
        JSON.parse(value);
      }
      return value;
    } catch {
      // If localStorage is corrupted, clear it and return null
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Ignore storage errors (e.g., quota exceeded)
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignore removal errors
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.login({ email, password });
          setTokens(data.token ?? data.accessToken, data.refreshToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email, password, firstName, lastName) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.register({ email, password, firstName, lastName });
          setTokens(data.token ?? data.accessToken, data.refreshToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore errors
        } finally {
          clearTokens();
          set({ user: null, isAuthenticated: false });
        }
      },

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.me();
          set({ user: data, isAuthenticated: true, isLoading: false });
        } catch {
          clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
    }),
    {
      name: 'heirloom-auth',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
