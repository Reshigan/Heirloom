import { useEffect, useState, useCallback } from 'react';

/**
 * Loom theme management — three modes: light · dark · system.
 *
 * Default is 'dark' (the living dye-bath water — the canonical Heirloom
 * ground). 'light' is the warm-paper opt-out via the toggle. Persisted to
 * localStorage.
 * Applied as `data-theme` on the document root (`<html>`). Every `.loom` root
 * themes off that ancestor via CSS descendant selectors (`[data-theme] .loom`),
 * so routes that mount a fresh ClothShell `.loom` after a theme change still
 * theme correctly — no per-element stamping that goes stale on navigation.
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
  return 'dark';
}

function applyTheme(theme: LoomTheme): void {
  const resolved = theme === 'system' ? resolveSystem() : theme;
  document.documentElement.setAttribute('data-theme', resolved);
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

/**
 * Loom accent — the single point of emotion (ART_DIRECTION §2), now a per-user
 * choice rather than a brand edict. Five hues; default 'seafoam' (cool, sits in
 * the deep water). Applied as `data-accent` on `<html>`; globals.css derives the
 * whole warm/copper family from one `--accent` pair in the dark scope. Light
 * theme keeps its AA copper-browns regardless — accent is a dark-water choice.
 * Cold-booted pre-paint by public/theme-boot.js (keep the valid set in sync).
 */
export type LoomAccent = 'copper' | 'seafoam' | 'glacial' | 'jade' | 'moonstone';
const ACCENT_KEY = 'heirloom-accent';
const ACCENTS: readonly LoomAccent[] = ['copper', 'seafoam', 'glacial', 'jade', 'moonstone'];

function readInitialAccent(): LoomAccent {
  try {
    const saved = localStorage.getItem(ACCENT_KEY) as LoomAccent | null;
    if (saved && ACCENTS.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  return 'seafoam';
}

export function useLoomAccent() {
  const [accent, setAccentState] = useState<LoomAccent>(readInitialAccent);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    try {
      localStorage.setItem(ACCENT_KEY, accent);
    } catch {
      /* ignore */
    }
  }, [accent]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACCENT_KEY && e.newValue && ACCENTS.includes(e.newValue as LoomAccent)) {
        setAccentState(e.newValue as LoomAccent);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setAccent = useCallback((a: LoomAccent) => setAccentState(a), []);
  return { accent, setAccent, accents: ACCENTS };
}
