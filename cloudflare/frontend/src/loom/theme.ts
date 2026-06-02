import { useEffect, useState, useCallback } from 'react';

/**
 * Loom theme management — three modes: light · dark · system.
 *
 * Default is 'light'. Persisted to localStorage. Applied as
 * `data-theme` on every `.loom` root in the document.
 */
export type LoomTheme = 'light' | 'dark' | 'system';
const KEY = 'heirloom-theme';

function resolveSystem(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function readInitial(): LoomTheme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
  } catch {
    /* ignore */
  }
  return 'light';
}

function applyTheme(theme: LoomTheme): void {
  const resolved = theme === 'system' ? resolveSystem() : theme;
  document.querySelectorAll('.loom').forEach((el) => {
    el.setAttribute('data-theme', resolved);
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

  // When in system mode, re-apply whenever the OS preference changes
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && (e.newValue === 'dark' || e.newValue === 'light' || e.newValue === 'system')) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((t: LoomTheme) => setThemeState(t), []);
  return { theme, setTheme };
}
