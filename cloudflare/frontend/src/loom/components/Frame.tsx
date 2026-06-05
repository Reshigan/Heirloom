import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { memoriesApi } from '../../services/api';
import { HLogo } from './HLogo';
import { useSwUpdate } from '../../hooks/useSwUpdate';

// ── §1.5-B invariant: append-only counter always visible ──────────────────────
function useEntryCount(): number | null {
  const { isAuthenticated } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['entry-count'],
    queryFn: () => memoriesApi.getAll({ limit: 1 }).then((r) => (r.data as any)?.pagination?.total ?? null),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  return (data as number | null) ?? null;
}

// ── System security status ─────────────────────────────────────────────────
function useSystemStatus(): 'green' | 'red' | null {
  const [status, setStatus] = useState<'green' | 'red' | null>(null);
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const r = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
        if (!cancelled) setStatus(r.ok ? 'green' : 'red');
      } catch {
        if (!cancelled) setStatus('red');
      }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  return status;
}

export function SecurityDot({ size = 6 }: { size?: number }) {
  const status = useSystemStatus();
  if (!status) return null;
  return (
    <span
      role="img"
      title={status === 'green' ? 'All systems secure' : 'System issue — please check status'}
      aria-label={status === 'green' ? 'Secure' : 'System issue'}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        background: status === 'green' ? 'var(--safe)' : 'var(--danger)',
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  );
}

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
        aria-expanded={open}
        aria-label="User menu"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        style={{
          position: 'relative',
          width: 32, height: 32,
          background: 'transparent',
          border: '1px solid var(--rule)',
          borderRadius: 0,
          color: 'var(--bone-dim)',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.06em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'manipulation',
        }}
      >
        {initials}
      </button>
      <div
        aria-hidden={!open}
        style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          minWidth: 200,
          background: '#111110',
          border: '1px solid var(--rule)',
          zIndex: 50,
          borderRadius: 0,
          transformOrigin: 'top right',
          opacity: open ? 1 : 0,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.98) translateY(-6px)',
          pointerEvents: open ? 'auto' : 'none',
          visibility: open ? 'visible' : 'hidden',
          transition: 'opacity 180ms var(--ease), transform 180ms var(--ease), visibility 0ms linear ' + (open ? '0ms' : '180ms'),
        }}
      >
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--rule)' }}>
          <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)', fontWeight: 300, lineHeight: 1.3 }}>
            {user.firstName} {user.lastName}
          </p>
          <p style={{ margin: '4px 0 0', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.08em' }}>
            {user.email}
          </p>
        </div>
        <div style={{ padding: '6px 0', borderBottom: '1px solid var(--rule)' }}>
          <Link to="/memories" className="hl-menu-item" onClick={() => setOpen(false)}>Memories</Link>
          <Link to="/ask" className="hl-menu-item" onClick={() => setOpen(false)}>Ask the thread</Link>
          <Link to="/family" className="hl-menu-item" onClick={() => setOpen(false)}>Family</Link>
        </div>
        <div style={{ padding: '6px 0', borderBottom: '1px solid var(--rule)' }}>
          <Link to="/settings" className="hl-menu-item" onClick={() => setOpen(false)}>Settings</Link>
          <Link to="/billing" className="hl-menu-item" onClick={() => setOpen(false)}>Billing</Link>
        </div>
        <div style={{ padding: '6px 0' }}>
          <button type="button" className="hl-menu-item danger"
            onClick={() => { setOpen(false); logout(); }}>
            Sign out
          </button>
        </div>
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
        background: 'var(--void-abyss)',
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
            background: 'var(--bone)',
            opacity: h.alpha,
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
  const entryCount = useEntryCount();
  const { updateReady, applyUpdate } = useSwUpdate();

  return (
    <div
      className="hl-screen"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      <a
        href="#main-content"
        style={{
          position: 'absolute', top: -100, left: 8, zIndex: 100,
          padding: '8px 16px', background: 'var(--ink)', color: 'var(--bone)',
          fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em',
          textDecoration: 'none', border: '1px solid var(--bone-dim)',
          transition: 'top 100ms',
        }}
        onFocus={e => (e.currentTarget.style.top = '8px')}
        onBlur={e => (e.currentTarget.style.top = '-100px')}
      >
        skip to content
      </a>
      {/* Loom 3 absolute topbar — no nav links */}
      <div className="hl-topbar">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
          <Link to="/loom" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <HLogo size={18} wordmark />
          </Link>
          {label !== 'heirloom' && (
            <>
              <span className="hl-topbar-label" style={{ color: 'var(--bone-low)' }}>·</span>
              <span className="hl-topbar-label" style={{ color: 'var(--warm)' }}>{label}</span>
            </>
          )}
        </span>

        {/* center: §1.5-B append-only counter — ∞ until count loads, then the real number */}
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
          {entryCount !== null ? (
            <span className="hl-counter">{entryCount.toLocaleString()}</span>
          ) : (
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, fontVariationSettings: '"opsz" 20', color: 'var(--bone-dim)', letterSpacing: 0 }}>∞</span>
          )}
        </span>

        {/* right slot: action (hidden on mobile where BottomNav covers it) + theme toggle + security dot + user menu */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
          {updateReady && (
            <button
              type="button"
              onClick={applyUpdate}
              className="hl-topbar-action"
              style={{
                background: 'transparent',
                border: '1px solid rgba(176,122,74,0.4)',
                color: 'var(--warm)',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '3px 10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              update →
            </button>
          )}
          {right ? (
            <span className="hl-link warm hl-topbar-action">{right}</span>
          ) : (
            <Link to="/compose" className="hl-link warm hl-topbar-action">compose →</Link>
          )}
          <SecurityDot />
          <UserMenu />
        </span>
      </div>

      {/* scrollable content area — sits below the topbar, above the edge */}
      <div
        id="main-content"
        role="main"
        className="hl-frame-scroll"
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
