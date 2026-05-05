import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLoomTheme } from '../theme';
import '../styles/loom.css';

/**
 * LoomShell — the .loom root that scopes the design tokens and theme
 * to /loom/* surfaces. Wrap every Loom page in this. Sets `data-theme`
 * from the persisted preference (vault by default).
 *
 * Renders inside a fixed-positioned wrapper (inset:0) because each
 * Loom screen positions its content absolutely against the Frame.
 */
export function LoomShell({ children }: { children: ReactNode }) {
  const { theme } = useLoomTheme();
  // Ensure body has no scrollbars while a Loom screen is mounted —
  // each Frame is full-viewport.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div
      className="loom"
      data-theme={theme}
      style={{ position: 'fixed', inset: 0 }}
    >
      {children}
    </div>
  );
}
