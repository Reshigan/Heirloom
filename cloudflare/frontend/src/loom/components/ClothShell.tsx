import { type ReactNode } from 'react';
import type { ClothEntry } from './ClothCanvas3D';
import { CLOTH_BG_ENTRIES } from './ClothBackdrop';

// Re-exported for back-compat — the canonical source now lives in ClothBackdrop.
export { CLOTH_BG_ENTRIES };

interface ClothShellProps {
  children: ReactNode;
  topbarLeft?: ReactNode;
  topbarCenter?: ReactNode;
  topbarRight?: ReactNode;
  /** @deprecated cloth is now a single global backdrop (LoomShellRoot) */
  backdropOpacity?: number;
  noTopbar?: boolean;
  /** @deprecated cloth is now a single global backdrop (LoomShellRoot) */
  entries?: ClothEntry[];
}

export function ClothShell({
  children,
  topbarLeft,
  topbarCenter,
  topbarRight,
  noTopbar = false,
}: ClothShellProps) {
  return (
    <div
      className="loom"
      data-theme="dark"
      style={{ position: 'fixed', inset: 0, background: 'transparent', overflow: 'hidden' }}
    >
      {/* Topbar */}
      {!noTopbar && (
        <header
          aria-label="Navigation"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 'calc(56px + env(safe-area-inset-top, 0px))',
            zIndex: 20,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            padding: '0 24px',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            background: 'rgba(14,14,12,0.92)',
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
        </header>
      )}

      {/* Content layer */}
      <main
        style={{
          position: 'absolute',
          inset: 0,
          top: noTopbar ? 0 : 'calc(56px + env(safe-area-inset-top, 0px))',
          zIndex: 10,
          overflowY: 'auto',
        }}
      >
        {children}
      </main>
    </div>
  );
}
