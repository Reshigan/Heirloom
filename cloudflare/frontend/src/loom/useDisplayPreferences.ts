import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

/**
 * Loom display preferences — reader comfort controls that sit alongside the
 * theme (light · dark · system).
 *
 *   • textScale  — the prose magnification: 80 · 100 · 120 · 140 · 160 (%).
 *   • highContrast — lift bone-dim/bone-faint toward full bone for low vision.
 *
 * Persisted to localStorage ("heirloom-display"). Applied as `data-text-scale`
 * and `data-contrast` on every `.loom` root, mirroring how theme.ts drops
 * `data-theme`. globals.css keys off `.loom[data-text-scale="…"]` and
 * `.loom[data-contrast="true"]` to do the actual re-scaling/contrast lift.
 */
export type TextScale = 80 | 100 | 120 | 140 | 160;
const TEXT_SCALES: readonly TextScale[] = [80, 100, 120, 140, 160];

interface DisplayState {
  textScale: TextScale;
  highContrast: boolean;
  setTextScale: (scale: TextScale) => void;
  setHighContrast: (on: boolean) => void;
}

// Apply preferences to every `.loom` root, mirroring theme.ts's applyTheme.
function applyDisplay(state: Pick<DisplayState, 'textScale' | 'highContrast'>): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.loom').forEach((el) => {
    el.setAttribute('data-text-scale', String(state.textScale));
    if (state.highContrast) {
      el.setAttribute('data-contrast', 'true');
    } else {
      el.removeAttribute('data-contrast');
    }
  });
}

// Safe localStorage wrapper that handles corrupted data gracefully — same
// pattern as stores/authStore.ts.
const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      const value = localStorage.getItem(name);
      if (value) {
        JSON.parse(value);
      }
      return value;
    } catch {
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* ignore — quota exceeded / private browsing */
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export const useDisplayStore = create<DisplayState>()(
  persist(
    (set) => ({
      textScale: 100,
      highContrast: false,

      setTextScale: (scale) => {
        const next = TEXT_SCALES.includes(scale) ? scale : 100;
        set({ textScale: next });
        applyDisplay({ textScale: next, highContrast: useDisplayStore.getState().highContrast });
      },

      setHighContrast: (on) => {
        set({ highContrast: on });
        applyDisplay({ textScale: useDisplayStore.getState().textScale, highContrast: on });
      },
    }),
    {
      name: 'heirloom-display',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ textScale: state.textScale, highContrast: state.highContrast }),
      onRehydrateStorage: () => (state) => {
        if (state) applyDisplay({ textScale: state.textScale, highContrast: state.highContrast });
      },
    }
  )
);

/**
 * useDisplayPreferences — the comfort-controls hook.
 *
 * Returns `{ textScale, setTextScale, highContrast, setHighContrast }`.
 * Settings.tsx and App.tsx's LoomShellRoot read from here.
 */
export function useDisplayPreferences() {
  const textScale = useDisplayStore((s) => s.textScale);
  const setTextScale = useDisplayStore((s) => s.setTextScale);
  const highContrast = useDisplayStore((s) => s.highContrast);
  const setHighContrast = useDisplayStore((s) => s.setHighContrast);
  return { textScale, setTextScale, highContrast, setHighContrast };
}
