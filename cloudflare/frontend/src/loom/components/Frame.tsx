import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

/**
 * Frame — the cross-screen chrome for the Loom.
 *
 * Top bar: brand mark on the left, the four primary surfaces in the
 * middle (Weft / Compose / Tied Off / Kin), a right slot for whatever
 * the screen wants to surface, and the vault/paper theme toggle.
 *
 * Below the top bar: the "horizon" warm light along the bottom 36% of
 * the body (a single accent that breathes on a 9-second cycle) and a
 * very faint paper grain overlay. Children render above both.
 *
 * Adapted from primitives.jsx in the Loom design handoff. See
 * src/loom/DESIGN.md for the principles ("AI is the invisible shuttle";
 * the only icon is ∞).
 */
export type LoomActive = 'weft' | 'compose' | 'tied' | 'kin';

interface FrameProps {
  active?: LoomActive;
  right?: ReactNode;
  showHorizon?: boolean;
  showGrain?: boolean;
  children: ReactNode;
}

const NAV: { to: string; label: string; key: LoomActive }[] = [
  { to: '/loom/weft', label: 'The Weft', key: 'weft' },
  { to: '/loom/compose', label: 'Compose', key: 'compose' },
  { to: '/loom/tied', label: 'Tied Off', key: 'tied' },
  { to: '/loom/kin', label: 'Kin', key: 'kin' },
];

export function Frame({
  active,
  right,
  showHorizon = true,
  showGrain = true,
  children,
}: FrameProps) {
  const { pathname } = useLocation();
  const inferredActive: LoomActive | undefined =
    active ??
    (pathname.startsWith('/loom/weft') ? 'weft'
      : pathname.startsWith('/loom/compose') ? 'compose'
      : pathname.startsWith('/loom/tied') ? 'tied'
      : pathname.startsWith('/loom/kin') ? 'kin'
      : undefined);

  return (
    <div className="loom-frame">
      <div className="loom-topbar">
        <Link to="/loom" className="loom-mark">
          <span className="infmark">∞</span>heirloom
        </Link>
        <nav>
          {NAV.map((n) => (
            <Link
              key={n.key}
              to={n.to}
              className={inferredActive === n.key ? 'active' : ''}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <span className="right">
          {right ?? <span className="loom-mono">2026·05·05 · 22:14</span>}
          <ThemeToggle />
        </span>
      </div>

      <div className="loom-frame__body">
        {children}
        {showHorizon ? <div className="loom-horizon" /> : null}
        {showGrain ? <div className="loom-grain" /> : null}
      </div>
    </div>
  );
}
