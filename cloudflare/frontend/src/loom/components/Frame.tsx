import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { HLogo } from './HLogo';

// ── UserMenu: initials button + dropdown (preserved from v1) ──────────────
const menuItemStyle: React.CSSProperties = {
  display: 'block',
  padding: '8px 12px',
  fontFamily: 'var(--serif)',
  fontSize: 14,
  color: 'var(--bone-dim)',
  textDecoration: 'none',
  cursor: 'pointer',
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
        className="hl-topbar-user-btn"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        style={{
          position: 'relative',
          width: 28,
          height: 28,
          background: 'transparent',
          border: '1px solid var(--rule)',
          borderRadius: 0,
          color: 'var(--bone)',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'manipulation',
        }}
      >
        {initials}
      </button>
      {/* always rendered — CSS opacity/transform drives open/close so the transition is smooth */}
      <div
        aria-hidden={!open}
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          minWidth: 220,
          background: '#131310',
          border: '1px solid var(--rule)',
          padding: 8,
          zIndex: 50,
          borderRadius: 0,
          boxShadow: '0 12px 40px rgba(10,10,8,0.60)',
          transformOrigin: 'top right',
          opacity: open ? 1 : 0,
          transform: open ? 'scale(1)' : 'scale(0.97) translateY(-4px)',
          pointerEvents: open ? 'auto' : 'none',
          visibility: open ? 'visible' : 'hidden',
          transition: 'opacity 150ms cubic-bezier(0.16,1,0.3,1), transform 150ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--rule)', marginBottom: 6 }}>
            <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--bone)' }}>
              {user.firstName} {user.lastName}
            </p>
            <p style={{ margin: '2px 0 0', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.04em' }}>
              {user.email}
            </p>
          </div>
          <div style={{ padding: '4px 0', borderBottom: '1px solid var(--rule)', marginBottom: 6 }}>
            {[
              { to: '/loom/weft', label: 'The weft' },
              { to: '/loom/compose', label: 'Compose' },
              { to: '/loom/kin', label: 'Kin' },
              { to: '/inbox', label: 'Inbox' },
              { to: '/letters', label: 'Letters' },
              { to: '/threads', label: 'Threads' },
              { to: '/family', label: 'Family' },
            ].map((item) => (
              <Link key={item.to} to={item.to} style={menuItemStyle} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
          <Link to="/settings" style={menuItemStyle} onClick={() => setOpen(false)}>Settings</Link>
          <Link to="/billing" style={menuItemStyle} onClick={() => setOpen(false)}>Billing</Link>
          <button
            type="button"
            onClick={() => { setOpen(false); logout(); }}
            style={{ ...menuItemStyle, background: 'transparent', border: 0, width: '100%', textAlign: 'left' }}
          >
            Sign out
          </button>
        </div>
    </div>
  );
}

// ── TapestryEdge — 8px woven band at the bottom of every authed screen ─────
function jitter(seed: number): number {
  const t = Math.sin(seed * 12.9898) * 43758.5453;
  return t - Math.floor(t);
}

export function TapestryEdge({ nowFrac = 0.78 }: { nowFrac?: number }) {
  const hairs = Array.from({ length: 160 }, (_, k) => ({
    left: ((k * 7) / (160 * 7) + (jitter(k * 1.7 + 3) - 0.5) * 0.0008) * 100,
    alpha: 0.05 + jitter(k * 2.3 + 1) * 0.07,
  }));
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        height: 8,
        background: '#0a0a08',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {hairs.map((h, k) => (
        <span
          key={k}
          style={{
            position: 'absolute',
            top: 0, bottom: 0,
            left: `${h.left}%`,
            width: 1,
            background: `rgba(244,236,216,${h.alpha.toFixed(3)})`,
          }}
        />
      ))}
      <span
        style={{
          position: 'absolute',
          top: -2, bottom: -2,
          left: `${nowFrac * 100}%`,
          width: 1,
          background: 'var(--warm)',
          opacity: 0.9,
        }}
      />
    </div>
  );
}

// ── Route → label map ─────────────────────────────────────────────────────
function routeLabel(pathname: string): string {
  if (pathname.startsWith('/loom/weft'))    return 'the weft';
  if (pathname.startsWith('/loom/compose')) return 'compose';
  if (pathname.startsWith('/loom/tied'))    return 'tied off';
  if (pathname.startsWith('/loom/kin'))     return 'kin';
  if (pathname.startsWith('/loom/echo'))    return 'echo';
  if (pathname.startsWith('/loom/read'))    return 'reading room';
  if (pathname.startsWith('/billing'))      return 'billing';
  if (pathname.startsWith('/settings'))     return 'settings';
  if (pathname.startsWith('/family'))       return 'family';
  if (pathname.startsWith('/letters'))      return 'letters';
  if (pathname.startsWith('/threads'))      return 'threads';
  if (pathname.startsWith('/inbox'))        return 'inbox';
  if (pathname.startsWith('/compose'))      return 'composing';
  if (pathname.startsWith('/record'))       return 'voice';
  if (pathname.startsWith('/challenges'))   return 'challenges';
  if (pathname.startsWith('/ask'))          return 'ask the thread';
  if (pathname.startsWith('/on-this-day'))  return 'on this day';
  if (pathname.startsWith('/loom/today'))   return 'today';
  if (pathname.startsWith('/loom/pwa'))     return 'home';
  if (pathname.startsWith('/pricing'))      return 'pricing';
  if (pathname.startsWith('/showcase'))     return 'showcase';
  if (pathname.startsWith('/memories'))     return 'memories';
  if (pathname.startsWith('/qa'))           return 'ask the thread';
  if (pathname.startsWith('/invite'))       return 'invite';
  if (pathname.startsWith('/wrapped'))      return 'wrapped';
  return 'heirloom';
}

// ── Frame — the Loom 3 screen shell ─────────────────────────────────────
// Loom 3 spec: hl-topbar is `position: absolute; top: 0` — no nav links,
// three slots only: left (context), center (counter), right (action + user).
// TapestryEdge anchors to bottom: 0.
export interface FrameProps {
  /** Override the auto-derived left context label */
  left?: string;
  /** Primary right-side action link text (defaults to "compose →") */
  right?: ReactNode;
  showEdge?: boolean;
  children: ReactNode;
  /** @deprecated Loom 3: nav links removed; prop accepted but ignored */
  active?: string;
  /** @deprecated Loom 3: horizon removed; prop accepted but ignored */
  showHorizon?: boolean;
  /** @deprecated Loom 3: grain removed; prop accepted but ignored */
  showGrain?: boolean;
}

export function Frame({ left, right, showEdge = true, children }: FrameProps) {
  const { pathname } = useLocation();
  const label = left ?? routeLabel(pathname);

  return (
    <div
      className="hl-screen"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      {/* Loom 3 absolute topbar — no nav links */}
      <div className="hl-topbar">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
          <Link to="/loom" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <HLogo size={18} wordmark />
          </Link>
          {label !== 'heirloom' && (
            <>
              <span style={{ color: 'var(--bone-low)' }}>·</span>
              <span>{label}</span>
            </>
          )}
        </span>

        {/* center: ∞ mark — the only allowed symbol (brief §2) */}
        <span className="hl-counter" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: 14 }}>
          ∞
        </span>

        {/* right slot: action (hidden on mobile where BottomNav covers it) + user menu */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
          {right ? (
            <span className="hl-link warm hl-topbar-action">{right}</span>
          ) : (
            <Link to="/loom/compose" className="hl-link warm hl-topbar-action">compose →</Link>
          )}
          <UserMenu />
        </span>
      </div>

      {/* scrollable content area — sits below the topbar, above the edge */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(56px + env(safe-area-inset-top, 0px))',
          bottom: showEdge ? 8 : 0,
          left: 0,
          right: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {children}
      </div>

      {showEdge && <TapestryEdge />}
    </div>
  );
}

// legacy type alias kept for any callers that reference LoomActive
export type LoomActive = 'weft' | 'compose' | 'tied' | 'kin';
