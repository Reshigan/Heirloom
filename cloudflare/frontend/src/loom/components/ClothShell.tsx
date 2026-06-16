import { type ReactNode } from 'react';
import { CLOTH_BG_ENTRIES } from './ClothBackdrop';
import { BOTTOM_NAV_CLEARANCE } from './BottomNav';

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
  entries?: unknown[];
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
            // Floats over the filament web: a translucent ink scrim (no blur —
            // §2.6) with a filament underline. CosmicLoom already settles the
            // top band into ink, so topbar text stays legible.
            background: 'var(--ink-translucent)',
            borderBottom: '1px solid var(--filament)',
          }}
        >
          <div style={{ minWidth: 120 }}>
            {topbarLeft}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--bone-faint)', textTransform: 'uppercase' }}>
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
          // Reserve space for the fixed BottomNav so scrolling content never
          // ends underneath it. (Full-bleed absolute layouts like the Weft set
          // their own bottom inset — see Weft.tsx.)
          paddingBottom: BOTTOM_NAV_CLEARANCE,
        }}
      >
        {children}
      </main>
    </div>
  );
}
