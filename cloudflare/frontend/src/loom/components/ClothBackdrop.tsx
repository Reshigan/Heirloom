import { lazy, Suspense } from 'react';
import type { ClothEntry } from './ClothCanvas3D';
import { AmbientThreads } from './AmbientThreads';

const ClothCanvas3D = lazy(() =>
  import('./ClothCanvas3D').then(m => ({ default: m.ClothCanvas3D }))
);

// Deterministic background entries — shared across every screen so the cloth
// reads as one continuous tapestry, not a per-page decoration.
function sineHash(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
const DYE_KEYS = ['madder','cochineal','kermes','saffron','weld','walnut','oakgall','woad','indigo','iron'] as const;

export const CLOTH_BG_ENTRIES = Array.from({ length: 48 }, (_, i) => ({
  date: new Date(1952 + Math.floor(sineHash(i * 17 + 1) * 74), 0, 1),
  dye: DYE_KEYS[i % DYE_KEYS.length],
  locked: i % 4 === 0,
}));

interface ClothBackdropProps {
  /** Opacity of the woven 3D cloth layer (default 0.4). */
  opacity?: number;
  /** Opacity of the living thread-spark layer (default 0.6). */
  threadOpacity?: number;
  /** Override the deterministic background entries. */
  entries?: ClothEntry[];
}

/**
 * ClothBackdrop — the universal cloth substrate.
 *
 * Two stacked layers behind all content:
 *  1. the woven 3D tapestry (ClothCanvas3D, lazy three.js)
 *  2. AmbientThreads — dye-coloured sparks that pop in, glow, and dull out
 *
 * Both are zIndex 0, pointer-events none, and paint over the host's ink fill.
 * This is the "cloth on every screen" guarantee — mount it once per shell.
 */
export function ClothBackdrop({
  opacity = 0.4,
  threadOpacity = 0.6,
  entries,
}: ClothBackdropProps) {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          opacity,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <Suspense fallback={<div style={{ position: 'absolute', inset: 0, background: '#0e0e0c' }} />}>
          <ClothCanvas3D entries={entries ?? CLOTH_BG_ENTRIES} />
        </Suspense>
      </div>
      <AmbientThreads opacity={threadOpacity} />
    </>
  );
}
