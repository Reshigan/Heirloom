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
 * Below the top bar: the persistent TapestryEdge — an 8px woven edge
 * band pinned to the bottom of every authed screen, carrying the warm
 * "now" hairline. This is the cloth persisting across screens (invariant
 * A); it replaces the old radial "horizon" glow (a §2.6 anti-pattern).
 * A very faint paper grain overlay sits above it; children render above
 * both.
 *
 * Adapted from primitives.jsx in the Loom design handoff. See
 * src/loom/DESIGN.md for the principles ("AI is the invisible shuttle";
 * the only icon is ∞).
 */
export type LoomActive = 'weft' | 'compose' | 'tied' | 'kin';

interface FrameProps {
  active?: LoomActive;
  right?: ReactNode;
  /** show the persistent woven TapestryEdge band (default true). */
  showHorizon?: boolean;
  showGrain?: boolean;
  children: ReactNode;
}

/**
 * TapestryEdge — the persistent 8px woven edge band. A stack of jittered
 * vertical warp hairlines (so it reads as cloth, not a flat bar) with the
 * warm "now" hairline at `nowFrac`. Pure DOM, no canvas, no glow.
 */
function jitter(seed: number): number {
  const t = Math.sin(seed * 12.9898) * 43758.5453;
  return t - Math.floor(t);
}

function TapestryEdge({ nowFrac = 0.78 }: { nowFrac?: number }) {
  const hairs = Array.from({ length: 160 }, (_, k) => ({
    left: ((k * 7) / (160 * 7) + (jitter(k * 1.7 + 3) - 0.5) * 0.0008) * 100,
    alpha: 0.05 + jitter(k * 2.3 + 1) * 0.07,
  }));
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 8,
        background: '#0a0a08',
        overflow: 'hidden',
        pointerEvents: 'none',
        borderTop: '1px solid var(--loom-rule)',
      }}
    >
      {hairs.map((h, k) => (
        <span
          key={k}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${h.left}%`,
            width: 1,
            background: `rgba(244,236,216,${h.alpha.toFixed(3)})`,
          }}
        />
      ))}
      {/* the warm now hairline rides the edge */}
      <span
        style={{
          position: 'absolute',
          top: -2,
          bottom: -2,
          left: `${nowFrac * 100}%`,
          width: 1,
          background: 'var(--loom-warm)',
          opacity: 0.9,
        }}
      />
    </div>
  );
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
          {right}
          <ThemeToggle />
        </span>
      </div>

      <div className="loom-frame__body">
        {children}
        {showHorizon ? <TapestryEdge /> : null}
        {showGrain ? <div className="loom-grain" /> : null}
      </div>
    </div>
  );
}

