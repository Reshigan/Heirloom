import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '../../stores/authStore';

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  padding: '8px 12px',
  fontFamily: "'Source Serif 4', serif",
  fontSize: 14,
  color: 'var(--loom-bone-dim)',
  textDecoration: 'none',
};

function UserMenu() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const initials =
    `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '∞';
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        style={{
          width: 28,
          height: 28,
          background: 'transparent',
          border: '1px solid var(--loom-rule)',
          borderRadius: 0,
          color: 'var(--loom-bone)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1), transform 120ms cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--loom-warm)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--loom-rule)')}
      >
        {initials}
      </button>
      {open ? (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: 220,
            background: 'var(--loom-ink-card)',
            border: '1px solid var(--loom-rule)',
            padding: 8,
            zIndex: 50,
            borderRadius: 0,
            boxShadow: '0 12px 40px rgba(10,10,8,0.60)',
            transformOrigin: 'top right',
            animation: 'loom-menu-in 180ms cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--loom-rule)',
              marginBottom: 6,
            }}
          >
            <p style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 14, color: 'var(--loom-bone)' }}>
              {user.firstName} {user.lastName}
            </p>
            <p style={{ margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}>
              {user.email}
            </p>
          </div>
          {/* Data pages not in the 4-link topbar */}
          <div style={{ padding: '4px 0', borderBottom: '1px solid var(--loom-rule)', marginBottom: 6 }}>
            {[
              { to: '/compose', label: 'Write a memory' },
              { to: '/record', label: 'Voice record' },
              { to: '/letters', label: 'Letters' },
              { to: '/family', label: 'Family' },
              { to: '/threads', label: 'Threads' },
              { to: '/on-this-day', label: 'On this day' },
              { to: '/inbox', label: 'Inbox' },
              { to: '/wrapped', label: 'Wrapped' },
            ].map((item) => (
              <Link key={item.to} to={item.to} style={menuItemStyle} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
          <Link to="/settings" style={menuItemStyle} onClick={() => setOpen(false)}>
            Settings
          </Link>
          <Link to="/billing" style={menuItemStyle} onClick={() => setOpen(false)}>
            Billing
          </Link>
          <button
            type="button"
            onClick={() => { setOpen(false); logout(); }}
            style={{ ...menuItemStyle, background: 'transparent', border: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

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
          <UserMenu />
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

