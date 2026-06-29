import { useEffect, useState, useCallback } from 'react';

/**
 * Loom theme — the Deep is deep water only.
 *
 * There is no light/paper theme. The app always resolves to 'dark' (the living
 * dye-bath water — the canonical Heirloom ground). The `LoomTheme` type and
 * `setTheme` are retained so existing call sites compile, but `setTheme` is a
 * no-op and `theme` is always 'dark'. Applied as `data-theme` on the document
 * root (`<html>`); every `.loom` root themes off that ancestor via CSS
 * descendant selectors. Cold-booted pre-paint by public/theme-boot.js.
 */
export type LoomTheme = 'light' | 'dark' | 'system';
const KEY = 'heirloom-theme';

function applyTheme(): void {
  document.documentElement.setAttribute('data-theme', 'dark');
}

export function useLoomTheme() {
  const [, setThemeState] = useState<LoomTheme>('dark');

  useEffect(() => {
    applyTheme();
    // Persist 'dark' so any legacy 'light'/'system' value is overwritten and
    // older builds reading the key still land on dark.
    try {
      localStorage.setItem(KEY, 'dark');
    } catch {
      /* ignore */
    }
  }, []);

  // setTheme is retained for call-site compatibility but is a no-op — the
  // Deep is water-only, there is nothing to switch to.
  const setTheme = useCallback((_t: LoomTheme) => {
    setThemeState('dark');
    applyTheme();
  }, []);
  return { theme: 'dark', setTheme };
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
