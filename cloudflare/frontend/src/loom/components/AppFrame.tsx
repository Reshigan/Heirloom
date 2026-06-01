import type { ReactNode } from 'react';
import { Frame } from './Frame';

/**
 * AppFrame — layout shell for authenticated pages that are not yet
 * Loom-native (i.e. pages in src/pages/ that manage real data).
 *
 * Wraps the page in the canonical Loom Frame (TapestryEdge warp
 * pattern, clean 4-link nav, UserMenu, theme toggle) with a scrollable
 * content column. UserMenu and ThemeToggle live in Frame and are
 * present on every screen automatically.
 *
 * Set nav=false for pages that render their own top chrome (e.g.
 * Wrapped, which is a full-screen landscape layout).
 */
export function AppFrame({
  children,
  width = 'reading',
  nav = true,
}: {
  children: ReactNode;
  width?: 'reading' | 'wide';
  nav?: boolean;
}) {
  if (!nav) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative', background: 'var(--loom-ink)' }}>
        <div className="loom-grain" style={{ pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </div>
    );
  }

  return (
    <Frame>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: width === 'wide' ? '100%' : 1180,
            margin: '0 auto',
            padding: '40px 32px 96px',
          }}
        >
          {children}
        </div>
      </div>
    </Frame>
  );
}
