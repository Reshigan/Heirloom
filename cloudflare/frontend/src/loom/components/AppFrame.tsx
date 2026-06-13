import type { ReactNode } from 'react';
import { Frame } from './Frame';

// AppFrame — Loom 3 layout shell for authenticated data pages.
// Wraps content in the canonical Frame (absolute hl-topbar + TapestryEdge)
// with a centred, max-width-constrained scrollable content column.
// Set nav=false for full-screen pages that manage their own chrome.
// Canonical content widths — all sourced from the layout tokens in globals.css
// so every authenticated page sits on the same measure. 'reading' is the
// default data column; 'prose'/'focus' narrow for long-form text; 'wide' fills.
const WIDTH_TOKEN: Record<string, string> = {
  reading: 'var(--page-max-reading)',
  wide: '100%',
  prose: 'var(--page-max-prose)',
  focus: 'var(--page-max-focus)',
};

export function AppFrame({
  children,
  width = 'reading',
  left,
  right,
  nav = true,
  role: _role, // TODO(wave-3): consumed by PwaHome role-keyed rendering
}: {
  children: ReactNode;
  width?: 'reading' | 'wide' | 'prose' | 'focus';
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
          maxWidth: WIDTH_TOKEN[width] ?? 'var(--page-max-reading)',
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        {children}
      </div>
    </Frame>
  );
}
