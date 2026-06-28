import WaterCanvas from '../water/WaterCanvas';
import { useLoomTheme } from '../theme';

// Empty back-compat export — ClothShell re-exports this name. Kept empty so the
// re-export resolves without fabricated entries.
export const CLOTH_BG_ENTRIES: never[] = [];

/**
 * ClothBackdrop — the global ambient layer. The Deep is water only: in dark
 * theme the whole app floats over one living sheet of family dye diffusing in
 * lit water (WaterCanvas, mounted once so it persists across navigation). In
 * light theme the backdrop is clean ink/bone — no second decorative surface,
 * no per-route gesture. Water is the one surface the brand keeps.
 */
interface ClothBackdropProps {
  /** Deprecated — kept for back-compat with older call sites. */
  opacity?: number;
  threadOpacity?: number;
  entries?: unknown[];
}

export function ClothBackdrop(_props: ClothBackdropProps) {
  const { theme } = useLoomTheme();
  const resolvedDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  // Light theme: clean ground, no backdrop. Page surfaces carry their own bone
  // paper; nothing layered behind them.
  if (!resolvedDark) return null;

  // The .deep-scrim sits in this same fixed z0 backdrop layer, painted OVER the
  // water but UNDER all page content — one global legibility veil so every
  // surface reads, whether it wraps ClothShell or paints its own ground. It is
  // viewport-fixed (this whole layer is `position:fixed`), so long-scroll prose
  // (ReadingRoom) stays legible past the fold. A radial keeps the centre calm
  // for type while the water still breathes bright at the margins.
  return (
    <>
      <WaterCanvas />
      <div className="deep-scrim" aria-hidden />
    </>
  );
}