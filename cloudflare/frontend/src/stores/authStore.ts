import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { authApi, setTokens, clearTokens, clearApiCache } from '../services/api';
import { checkForServiceWorkerUpdate } from '../lib/registerSW';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  preferredCurrency?: string;
  /** ID of the user's default Family Thread. Lazy-created server-side on /auth/me. */
  defaultThreadId?: string | null;
}

interface ConsentData {
  acceptedTerms: boolean;
  acceptedTermsAt: string;
  marketingConsent: boolean;
  marketingConsentAt: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, consent?: ConsentData) => Promise<void>;
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
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.login({ email, password });
          // Wipe any prior account's cached API responses before this user's
          // data lands — the previous user may have closed the tab without a
          // clean logout, leaving their reads in the URL-keyed SW cache.
          clearApiCache();
          setTokens(data.token ?? data.accessToken, data.refreshToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          // Force-adopt the latest deployed shell on login so an installed PWA
          // never runs a stale build (fire-and-forget — never blocks the UI).
          void checkForServiceWorkerUpdate();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email, password, firstName, lastName, consent) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.register({ 
            email, 
            password, 
            firstName, 
            lastName,
            ...consent,
          });
          // New account on this device → wipe any prior user's URL-keyed API cache.
          clearApiCache();
          setTokens(data.token ?? data.accessToken, data.refreshToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          // New account on this device → same freshness guarantee as login.
          void checkForServiceWorkerUpdate();
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
          // Clear user-specific compose drafts so they don't persist across accounts on shared devices
          try {
            Object.keys(localStorage)
              .filter((k) => k.startsWith('hl-compose-draft:'))
              .forEach((k) => localStorage.removeItem(k));
          } catch { /* ignore — private browsing or quota issues */ }
          // Tell the SW to wipe the per-user API response cache so the next user
          // on the same device doesn't see this user's memories/letters offline.
          try {
            navigator.serviceWorker?.controller?.postMessage('CLEAR_API_CACHE');
          } catch { /* SW not available in this context */ }
          // Signal App.tsx to clear the React Query cache so stale user data
          // is not served to the next account on a shared device.
          try {
            window.dispatchEvent(new Event('heirloom-logout'));
          } catch { /* ignore */ }
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
