import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Dye } from '../dye';
import { CosmicPanel } from './CosmicPanel';

/**
 * CosmicCard — a CosmicPanel that carries the family identity signal: a 3px
 * dye left-thread (§2.7). Optionally wraps as a router Link. Dyes stay signal
 * only — a thread on the margin, never a fill.
 */
export function CosmicCard({
  dye,
  to,
  interactive,
  solid,
  padded = true,
  className = '',
  style,
  children,
}: {
  dye?: Dye | null;
  to?: string;
  interactive?: boolean;
  solid?: boolean;
  padded?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const dyeVar = dye ? `var(--dye-${dye})` : undefined;
  const panelStyle: CSSProperties = {
    ...(dyeVar ? ({ ['--cosmic-dye']: dyeVar } as CSSProperties) : {}),
    ...style,
  };
  const cls = ['cosmic-card', className].filter(Boolean).join(' ');
  if (to) {
    return (
      <CosmicPanel
        as={Link}
        to={to}
        interactive={interactive ?? true}
        solid={solid}
        padded={padded}
        className={cls}
        style={{ display: 'block', textDecoration: 'none', color: 'inherit', ...panelStyle }}
      >
        {children}
      </CosmicPanel>
    );
  }
  return (
    <CosmicPanel
      interactive={interactive}
      solid={solid}
      padded={padded}
      className={cls}
      style={panelStyle}
    >
      {children}
    </CosmicPanel>
  );
}
