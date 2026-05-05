import type { ReactNode } from 'react';
import { Navigation } from '../../components/Navigation';

/**
 * AppFrame — the canonical layout for every authenticated Loom page.
 *
 * Renders the shared Navigation top bar, then a scrolling content
 * area with the standard horizon glow + paper grain underneath, plus
 * a centred content column at one of two widths:
 *   - reading (1180px) for prose, lists, forms — the default
 *   - wide (full viewport) for visualisations (Family constellation,
 *     Memory map)
 *
 * Pages that previously rendered <Navigation /> + their own outer
 * container wrap themselves in <AppFrame> instead and skip
 * Navigation. Pages that haven't been refactored yet keep using
 * <Navigation /> directly; the bar looks the same either way.
 */
export function AppFrame({
  children,
  width = 'reading',
}: {
  children: ReactNode;
  width?: 'reading' | 'wide';
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateRows: '60px 1fr' }}>
      <Navigation />
      <main style={{ position: 'relative', overflowX: 'hidden' }}>
        <div className="loom-horizon" style={{ pointerEvents: 'none' }} />
        <div className="loom-grain" style={{ pointerEvents: 'none' }} />
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
      </main>
    </div>
  );
}
