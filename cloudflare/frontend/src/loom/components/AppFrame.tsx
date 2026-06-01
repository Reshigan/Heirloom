import type { ReactNode } from 'react';
import { Frame } from './Frame';

// AppFrame — Loom 3 layout shell for authenticated data pages.
// Wraps content in the canonical Frame (absolute hl-topbar + TapestryEdge)
// with a centred, max-width-constrained scrollable content column.
// Set nav=false for full-screen pages that manage their own chrome.
export function AppFrame({
  children,
  width = 'reading',
  left,
  right,
  nav = true,
  role: _role, // TODO(wave-3): consumed by PwaHome role-keyed rendering
}: {
  children: ReactNode;
  width?: 'reading' | 'wide';
  left?: string;
  right?: ReactNode;
  nav?: boolean;
  role?: 'visitor' | 'trial' | 'family' | 'founder' | 'author' | 'reader' | 'successor' | 'future_member' | 'legacy' | 'admin';
}) {
  if (!nav) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--ink)', overflow: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <Frame left={left} right={right}>
      <div
        style={{
          maxWidth: width === 'wide' ? '100%' : 1180,
          margin: '0 auto',
          padding: '40px 32px 96px',
        }}
      >
        {children}
      </div>
    </Frame>
  );
}
