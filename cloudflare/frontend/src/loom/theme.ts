import { useEffect, useState, useCallback } from 'react';

/**
 * Loom theme management.
 *
 * Two themes:
 *   - dark   ("vault")  — default
 *   - light  ("paper")
 *
 * Persisted to localStorage under "heirloom-theme" so the same setting
 * carries between /loom, /loom/marketing, and the splash. Applied as
 * `data-theme` on every `.loom` root in the document.
 *
 * useLoomTheme is a tiny hook that returns [theme, setTheme]. It
 * subscribes to "storage" events so two tabs stay in sync.
 */
export type LoomTheme = 'dark' | 'light';
const KEY = 'heirloom-theme';

function readInitial(): LoomTheme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return 'dark';
}

function applyTheme(theme: LoomTheme): void {
  document.querySelectorAll('.loom').forEach((el) => {
    el.setAttribute('data-theme', theme);
  });
}

export function useLoomTheme() {
  const [theme, setThemeState] = useState<LoomTheme>(readInitial);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((t: LoomTheme) => setThemeState(t), []);
  return { theme, setTheme };
}
