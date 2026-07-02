import { useState, useEffect, useRef } from 'react';
import type { ReactNode, KeyboardEvent as ReactKeyboardEvent } from 'react';
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
// Only polls /api/health when authenticated — avoids 500 browser console
// errors on public/marketing pages where the API is not expected to respond.
function useSystemStatus(): 'green' | 'red' | null {
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<'green' | 'red' | null>(null);
  useEffect(() => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated]);
  return status;
}

export function SecurityDot({ size = 6 }: { size?: number }) {
  const status = useSystemStatus();
  if (!status) return null;
  const isGreen = status === 'green';
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={isGreen ? 'Secure' : 'System issue'}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        // ok: small filled neutral square. alert: WarmDot pattern — square,
        // 1px copper stroke, transparent fill (copper as signal stroke, never fill).
        background: isGreen ? 'var(--bone-dim)' : 'transparent',
        border: isGreen ? 'none' : '1px solid var(--warm)',
        borderRadius: 0,
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  );
}

export function UserMenu() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // ponytail: collect menuitem nodes for roving focus instead of per-item refs.
  const itemsRef = useRef<HTMLElement[]>([]);
  itemsRef.current = [];
  const registerItem = (el: HTMLElement | null) => { if (el) itemsRef.current.push(el); };
  const focusItem = (i: number) => {
    const items = itemsRef.current;
    if (!items.length) return;
    const idx = (i + items.length) % items.length;
    items[idx]?.focus();
  };

  // Dismiss on outside click or Escape (mirrors InfinityMenu).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Roving focus: focus first item on open; return focus to trigger on close.
  // ponytail: skip the initial mount so we don't steal focus to the trigger.
  const mounted = useRef(false);
  useEffect(() => {
    if (open) focusItem(0);
    else if (mounted.current) triggerRef.current?.focus();
    mounted.current = true;
  }, [open]);

  // ArrowUp/Down cycle, Home/End jump, Escape closes + restores trigger focus.
  const onMenuKeyDown = (e: ReactKeyboardEvent) => {
    const items = itemsRef.current;
    const current = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); focusItem(current + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusItem(current - 1); }
    else if (e.key === 'Home') { e.preventDefault(); focusItem(0); }
    else if (e.key === 'End') { e.preventDefault(); focusItem(items.length - 1); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  if (!user) return null;
  // Singular-mark law: the ∞ is the BottomNav center / WaxSeal foot only.
  // When the user has no name initials, fall back to the first email char,
  // else a neutral mid-dot — never a second ∞ on the surface.
  const initials =
    `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() ||
    user.email?.[0]?.toUpperCase() || '·';
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        className="hl-topbar-user-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label="User menu"
        onClick={() => setOpen((v) => !v)}
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
        id="account-menu"
        role="menu"
        aria-label="Account menu"
        aria-hidden={!open}
        onKeyDown={onMenuKeyDown}
        style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          minWidth: 200,
          background: 'var(--ink-card)',
          border: '1px solid var(--rule)',
          zIndex: 50,
          borderRadius: 0,
          transformOrigin: 'top right',
          opacity: open ? 1 : 0,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.98) translateY(-6px)',
          pointerEvents: open ? 'auto' : 'none',
          visibility: open ? 'visible' : 'hidden',
          transition: 'opacity 180ms var(--ease), transform 180ms var(--ease)',
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
          <Link ref={registerItem} role="menuitem" tabIndex={-1} to="/family"             className="hl-menu-item" onClick={() => setOpen(false)}>family</Link>
          <Link ref={registerItem} role="menuitem" tabIndex={-1} to="/settings"           className="hl-menu-item" onClick={() => setOpen(false)}>settings</Link>
          <Link ref={registerItem} role="menuitem" tabIndex={-1} to="/billing"            className="hl-menu-item" onClick={() => setOpen(false)}>billing</Link>
          <Link ref={registerItem} role="menuitem" tabIndex={-1} to="/gift-subscriptions" className="hl-menu-item" onClick={() => setOpen(false)}>gift a membership</Link>
          <Link ref={registerItem} role="menuitem" tabIndex={-1} to="/help"               className="hl-menu-item" onClick={() => setOpen(false)}>help &amp; support</Link>
        </div>
        <div style={{ padding: '6px 0' }}>
          <button ref={registerItem} role="menuitem" tabIndex={-1} type="button" className="hl-menu-item danger"
            onClick={() => { setOpen(false); logout(); }}>
            sign out
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

// nowFrac is a REAL position signal (e.g. StoryView's reading place). The copper
// "now" hairline renders ONLY when a caller passes a genuine fraction — Frame mounts
// <TapestryEdge /> with none, so no decorative copper appears in app chrome.
export function TapestryEdge({ nowFrac }: { nowFrac?: number }) {
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
        background: 'var(--ink-deep)',
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
      {nowFrac !== undefined && (
        <span
          style={{
            position: 'absolute',
            top: 0, bottom: 0,
            left: `${nowFrac * 100}%`,
            width: 1,
            background: 'var(--warm)',
          }}
        />
      )}
    </div>
  );
}

// ── Route → label map ─────────────────────────────────────────────────────
function routeLabel(pathname: string): string {
  if (pathname.startsWith('/loom/pwa'))    return 'the Deep';
  if (pathname.startsWith('/loom/compose')) return 'compose';
  if (pathname.startsWith('/loom/tied'))    return 'tied off';
  if (pathname.startsWith('/loom/kin'))     return 'kin';
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
  if (pathname.startsWith('/ask'))          return 'ask the deep';
  if (pathname.startsWith('/on-this-day'))  return 'on this day';
  if (pathname.startsWith('/loom/today'))   return 'today';
  if (pathname.startsWith('/loom/pwa'))     return 'home';
  if (pathname.startsWith('/pricing'))      return 'pricing';
  if (pathname.startsWith('/showcase'))     return 'showcase';
  if (pathname.startsWith('/memories'))     return 'memories';
  if (pathname.startsWith('/qa'))           return 'ask the deep';
  if (pathname.startsWith('/invite'))       return 'invite';
  if (pathname.startsWith('/wrapped'))      return 'wrapped';
  if (pathname.startsWith('/loom/letter'))         return 'letter';
  if (pathname.startsWith('/loom/voice'))          return 'voice';
  if (pathname.startsWith('/loom/compose-letter')) return 'compose letter';
  if (pathname.startsWith('/gift-subscriptions'))  return 'gift';
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
  /** When the signed-in user is on a trial/free-becoming state, surface ONE
      ambient, STATIC loss-aversion line linking to billing. No counter, no
      escalation — the frame already knows the role; this never fetches. */
  trial?: boolean;
  showEdge?: boolean;
  children: ReactNode;
  /** @deprecated Loom 3: nav links removed; prop accepted but ignored */
  active?: string;
  /** @deprecated Loom 3: horizon removed; prop accepted but ignored */
  showHorizon?: boolean;
  /** @deprecated Loom 3: grain removed; prop accepted but ignored */
  showGrain?: boolean;
}

export function Frame({ left, right, trial, showEdge = true, children }: FrameProps) {
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
          transition: 'top 180ms var(--ease)',
        }}
        onFocus={e => (e.currentTarget.style.top = '8px')}
        onBlur={e => (e.currentTarget.style.top = '-100px')}
      >
        skip to content
      </a>
      {/* Loom 3 absolute topbar — no nav links */}
      <div className="hl-topbar">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
          <HLogo size={18} wordmark href="/loom/pwa" />
          {label !== 'heirloom' && (
            <>
              <span className="hl-topbar-label" style={{ color: 'var(--bone-low)' }}>·</span>
              <span className="hl-topbar-label" style={{ color: 'var(--bone)' }}>{label}</span>
            </>
          )}
          {trial && (
            <>
              <span className="hl-topbar-label" aria-hidden style={{ color: 'var(--bone-low)' }}>·</span>
              {/* STATIC ambient line — no days-remaining, no color/size escalation.
                  Inherits the topbar's JetBrains Mono uppercase letterspacing; bone-faint. */}
              <Link to="/billing" className="hl-topbar-label hl-topbar-action" style={{ color: 'var(--bone-faint)', textDecoration: 'none' }}>
                free thread · keep it forever
              </Link>
            </>
          )}
        </span>

        {/* center: §1.5-B append-only counter — a dim em-dash until count loads
            (never ∞: the singular mark is reserved for the BottomNav center /
            WaxSeal foot), then the real number */}
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
          {entryCount !== null ? (
            <span className="hl-counter"><b>{entryCount.toLocaleString()}</b></span>
          ) : (
            <span aria-hidden="true" style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, color: 'var(--bone-dim)', letterSpacing: 0 }}>—</span>
          )}
        </span>

        {/* right slot: action (hidden on mobile where BottomNav covers it) + security dot + user menu */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
          {updateReady && (
            <button
              type="button"
              onClick={applyUpdate}
              className="hl-topbar-action"
              style={{
                background: 'transparent',
                border: '1px solid var(--rule-warm)',
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
            <Link to="/capture" className="hl-link warm hl-topbar-action">speak something →</Link>
          )}
          <SecurityDot />
          {/* user-initial avatar retired from chrome — account + sign-out on the "you" tab */}
        </span>
      </div>

      {/* scrollable content area — sits below the topbar, above the edge */}
      <div
        id="main-content"
        role="main"
        className="hl-frame-scroll"
        style={{
          position: 'absolute',
          top: 'var(--topbar-h)',
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
