import { lazy, Suspense, type ReactNode } from 'react';
import type { ClothEntry } from './ClothCanvas3D';

const ClothCanvas3D = lazy(() =>
  import('./ClothCanvas3D').then(m => ({ default: m.ClothCanvas3D }))
);

// Deterministic background entries — shared across all rooms
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

interface ClothShellProps {
  children: ReactNode;
  topbarLeft?: ReactNode;
  topbarCenter?: ReactNode;
  topbarRight?: ReactNode;
  backdropOpacity?: number;
  noTopbar?: boolean;
  entries?: ClothEntry[];
}

export function ClothShell({
  children,
  topbarLeft,
  topbarCenter,
  topbarRight,
  backdropOpacity = 0.4,
  noTopbar = false,
  entries,
}: ClothShellProps) {
  return (
    <div
      className="loom"
      data-theme="dark"
      style={{ position: 'fixed', inset: 0, background: '#0e0e0c', overflow: 'hidden' }}
    >
      {/* Animated cloth backdrop */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          opacity: backdropOpacity,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <Suspense fallback={<div style={{ position: 'absolute', inset: 0, background: '#0e0e0c' }} />}>
          <ClothCanvas3D entries={entries ?? CLOTH_BG_ENTRIES} />
        </Suspense>
      </div>

      {/* Topbar */}
      {!noTopbar && (
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 56,
            zIndex: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px',
            background: 'rgba(14,14,12,0.72)',
            borderBottom: '1px solid rgba(244,236,216,0.07)',
          }}
        >
          <div style={{ minWidth: 120 }}>
            {topbarLeft}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'rgba(244,236,216,0.38)', textTransform: 'uppercase' }}>
            {topbarCenter}
          </div>
          <div style={{ minWidth: 120, display: 'flex', justifyContent: 'flex-end' }}>
            {topbarRight}
          </div>
        </div>
      )}

      {/* Content layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          top: noTopbar ? 0 : 56,
          zIndex: 10,
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
