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
      {/* Skip link — first focusable element; lets keyboard/SR users jump past
          the topbar chrome straight to <main>. Off-screen until focused
          (.skip-to-content, globals.css). */}
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      {/* Topbar */}
      {!noTopbar && (
        <header
          style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 'var(--topbar-h)',
            zIndex: 20,
            display: 'flex', alignItems: 'flex-end',
            padding: '0 24px',
            // Floats over the deep water: a translucent ink scrim (no blur —
            // §2.6) with a hairline rule. The water already settles the top
            // band into ink, so topbar text stays legible.
            background: 'var(--ink-translucent)',
            borderBottom: '1px solid var(--rule)',
          }}
        >
          {/* Three collision-proof columns. The side columns share width
              equally (flex 1 1 0) so the center title stays truly centered, and
              both clip overflow (min-width:0 + overflow hidden) so a wide
              breadcrumb can never collide with the title on a narrow PWA
              viewport. The breadcrumb's last (current-page) crumb duplicates the
              centered title, so when space is tight it clips first — leaving the
              parent trail and the centered page name, no overlap, no info lost. */}
          <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>
            {topbarLeft}
          </div>
          <div style={{ flex: '0 1 auto', minWidth: 0, padding: '0 12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--bone-faint)', textTransform: 'uppercase' }}>
            {topbarCenter}
          </div>
          <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
            {/* Right slot is page-supplied only. The user-initial avatar was
                retired from the shared chrome — account + sign-out live on the
                "you" tab (BottomNav → /loom/profile), so the topbar stays clean. */}
            {topbarRight}
          </div>
        </header>
      )}

      {/* Content layer */}
      <main
        id="main-content"
        style={{
          position: 'absolute',
          inset: 0,
          top: noTopbar ? 0 : 'var(--topbar-h)',
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
