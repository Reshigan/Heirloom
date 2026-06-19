import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../services/api';
import { useRole } from '../hooks/useRole';
import { useTapestryEntries } from '../hooks/useTapestryEntries';
import { useListener } from '../hooks/useListener';
import { useIsNewUser } from '../hooks/useIsNewUser';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { ProgressHair } from '../loom/components/ProgressHair';
import { HLogo } from '../loom/components/HLogo';
import { PwaWizard, shouldShowWizard } from '../loom/components/PwaWizard';
import { EntryRow, WarmDot, WaxSeal } from '../loom/cosmic/CosmicUI';
import type { UserRole } from '../hooks/useRole';
import { dyeVar, type Dye } from '../loom/dye';
import type { CanvasEntry } from '../hooks/useTapestryEntries';

/* ─── PWA profile menu ────────────────────────────────────────────────────── */
function PwaMenu() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Dismiss on outside click or Escape (mirrors InfinityMenu). Escape returns
  // focus to the trigger so keyboard users aren't stranded.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '∞';

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen(v => !v)}
        style={{
          width: 36, height: 36,
          background: 'transparent',
          border: '1px solid var(--rule)',
          borderRadius: 0,
          color: 'var(--bone)',
          fontFamily: 'var(--mono)',
          fontSize: 12,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'manipulation',
          transition: 'border-color 180ms var(--ease)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--warm)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
      >
        {initials}
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          minWidth: 240,
          background: 'var(--ink-card, var(--ink))',
          border: '1px solid var(--rule)',
          padding: 12,
          zIndex: 60,
          opacity: open ? 1 : 0,
          transform: open ? 'scale(1)' : 'scale(0.97) translateY(-4px)',
          pointerEvents: open ? 'auto' : 'none',
          visibility: open ? 'visible' : 'hidden',
          transition:
            'opacity 180ms var(--ease), transform 180ms var(--ease), visibility 0ms var(--ease) ' +
            (open ? '0ms' : '180ms'),
        }}
      >
        <div style={{ padding: '6px 8px 12px', borderBottom: '1px solid var(--rule)', marginBottom: 10 }}>
          <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)', fontWeight: 400 }}>
            {user.firstName} {user.lastName}
          </p>
          <p style={{ margin: '2px 0 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.04em' }}>
            {user.email}
          </p>
        </div>

        {[
          { to: '/search',             label: 'search' },
          { to: '/inbox',              label: 'inbox' },
          { to: '/on-this-day',        label: 'on this day' },
          { to: '/book',               label: 'the book' },
          { to: '/wrapped',            label: 'wrapped' },
          { to: '/settings',           label: 'settings' },
          { to: '/billing',            label: 'billing' },
          { to: '/family',             label: 'family' },
          { to: '/gift-subscriptions', label: 'gift a thread' },
        ].map(item => (
          <Link
            key={item.to}
            to={item.to}
            role="menuitem"
            onClick={() => setOpen(false)}
            style={{
              display: 'block',
              padding: '9px 8px',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--bone-dim)',
              textDecoration: 'none',
              transition: 'color 180ms var(--ease)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--bone)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone-dim)')}
          >
            {item.label} →
          </Link>
        ))}

        <button
          type="button"
          role="menuitem"
          onClick={() => { logout(); setOpen(false); }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '10px 8px',
            marginTop: 4,
            background: 'transparent',
            border: 'none',
            borderTop: '1px solid var(--rule)',
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            transition: 'color 180ms var(--ease)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--warm)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone-faint)')}
        >
          sign out
        </button>
      </div>
    </div>
  );
}

/* ─── Authenticated home content ─────────────────────────────────────────── */
function AuthHome({
  role,
  entries,
  prompt,
  stats,
}: {
  role: UserRole;
  entries: CanvasEntry[];
  prompt: string;
  stats: { entries: number; members: number } | null;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const count = entries.length;
  const P = 'clamp(20px, 5vw, 28px)';

  const greeting = isAuthenticated && user
    ? `${user.firstName}'s thread.`
    : "Start your family’s thousand-year thread.";

  // Visitor — no cloth, just invite
  if (role === 'visitor') {
    return (
      <div style={{ padding: `36px ${P}`, maxWidth: 560, margin: '0 auto', paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 12 }}>preview</span>
        <h2 className="loom-display hl-tight" style={{ fontSize: 'clamp(24px, 6vw, 30px)', fontWeight: 500, color: 'var(--bone)', margin: '0 0 24px', lineHeight: 1.15 }}>
          {greeting}
        </h2>
        <Link to="/signup" className="hl-btn" style={{ fontSize: 13 }}>Begin free →</Link>
      </div>
    );
  }

  // First-run for read-only thread members: show thread-viewer empty state
  if (count === 0 && (role === 'reader' || role === 'successor')) {
    return (
      <div style={{ padding: `clamp(40px, 9vw, 64px) ${P}`, maxWidth: 480, margin: '0 auto', paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 18, color: 'var(--warm)' }}>
          {role === 'successor' ? 'heir' : 'reader'}
        </span>
        <h2 className="loom-display hl-tight" style={{ fontSize: 'clamp(24px, 6vw, 30px)', fontWeight: 500, lineHeight: 1.15, margin: '0 0 18px', color: 'var(--bone)' }}>
          You have been given access to this thread.
        </h2>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone-dim)', lineHeight: 1.75, margin: 0 }}>
          New entries will appear here as they are woven in.
        </p>
      </div>
    );
  }

  // First-run: no entries yet — show sealed letter prompt
  if (count === 0) {
    return (
      <div style={{ padding: `clamp(40px, 9vw, 64px) ${P}`, maxWidth: 560, margin: '0 auto', paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="hl-eyebrow" style={{ marginBottom: 18, color: 'var(--warm)' }}>
          entry no. 0001
        </div>
        <h2 className="loom-display hl-tight" style={{
          fontSize: 'clamp(24px, 6vw, 30px)', fontWeight: 500, lineHeight: 1.15,
          margin: '0 0 18px', color: 'var(--bone)',
        }}>
          There is someone who needs to read this.<br />Just not yet.
        </h2>
        <p className="hl-serif" style={{
          fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 300,
          color: 'var(--bone-dim)', lineHeight: 1.68, margin: '0 0 28px', maxWidth: '40ch',
        }}>
          Write a letter today. Seal it for a date, a milestone, a death — or the moment you choose.
          It holds safe and finds them exactly when you intended.
        </p>

        {/* Sealed letter preview */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          padding: '12px 16px 12px 18px',
          border: '1px solid var(--rule)',
          borderLeft: '1px solid color-mix(in srgb, var(--warm) 55%, transparent)',
          marginBottom: 28,
        }}>
          <div className="hl-mono" style={{ fontSize: 8.5, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
            sealed · delivery: your choice
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="hl-serif" style={{ fontSize: 20, fontWeight: 300, color: 'var(--warm)', lineHeight: 1 }}>∞</span>
            <span className="hl-serif" style={{ fontSize: 13, fontWeight: 300, fontStyle: 'italic', color: 'var(--bone-dim)' }}>
              your first letter — written today
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 36 }}>
          <Link to="/compose" className="hl-btn" style={{ fontSize: 13, padding: '11px 20px' }}>
            Write your first sealed letter →
          </Link>
          <Link to="/record" style={{
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--bone-dim)', textDecoration: 'none', borderBottom: '1px solid var(--rule)', paddingBottom: 1,
          }}>or speak →</Link>
        </div>

        {prompt && (
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 16 }}>
            <div className="hl-eyebrow" style={{ marginBottom: 8, color: 'var(--bone-faint)' }}>the listener</div>
            <p className="hl-serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--bone-faint)', lineHeight: 1.7, margin: 0 }}>
              {prompt}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Active author / reader — the Listener's capture home (Higgsfield "B") ──
  const isReadOnly = role === 'reader' || role === 'successor';
  const nowYear = new Date().getFullYear();
  const firstYear = count > 0
    ? entries.reduce((min, e) => Math.min(min, e.date.getFullYear()), nowYear)
    : nowYear;
  const threadYear = nowYear - firstYear + 1;

  // The real thread, woven into ledger rows — newest nearest the present.
  const recent = entries
    .slice()
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6)
    .map((e) => ({
      title: (e.title && String(e.title)) || (e.sealed ? 'a sealed letter' : 'an unwoven thread'),
      year: e.date.getFullYear(),
      dye: e.dye as Dye,
      sealed: !!e.sealed,
      route: e.sealed ? '/loom/tied' : '/loom/weft',
    }));

  const status =
    `since ${firstYear} · ${count} ${count === 1 ? 'memory' : 'memories'} woven · year ${threadYear} of a thousand` +
    (stats && stats.members > 0 ? ` · ${stats.members} ${stats.members === 1 ? 'voice' : 'voices'}` : '');

  return (
    <div style={{
      display: 'grid',
      placeItems: 'center',
      minHeight: 'calc(100svh - 56px - 104px - env(safe-area-inset-top, 0px))',
      padding: `clamp(40px, 9vh, 96px) ${P}`,
      paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
    }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        {/* Warm mono eyebrow — the Listener */}
        <div className="hl-mono" style={{
          marginBottom: 18,
          fontSize: 10, letterSpacing: '0.34em', textTransform: 'uppercase',
          color: 'var(--warm)',
        }}>
          {isReadOnly ? 'the thread' : 'the listener asks'}
        </div>

        {/* The rotating prompt — type is the hero */}
        <h1 className="loom-display hl-tight" style={{
          fontSize: 'clamp(28px, 7vw, 44px)',
          fontWeight: 500, lineHeight: 1.1,
          letterSpacing: '-0.018em',
          margin: '0 0 40px',
          color: 'var(--bone)',
        }}>
          {isReadOnly ? `${count} ${count === 1 ? 'memory' : 'memories'} woven so far.` : prompt}
        </h1>

        {/* Two outlined mono pills — WRITE / SPEAK */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate(isReadOnly ? '/loom' : '/compose')}
            className="hl-cta-warm"
            style={{
              padding: '12px 28px',
              background: 'transparent',
              border: '1px solid var(--warm)',
              borderRadius: 0,
              color: 'var(--warm)',
              fontFamily: 'var(--mono)',
              fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'border-color 360ms var(--ease), color 360ms var(--ease)',
            }}
          >
            {isReadOnly ? 'open' : 'write'}
          </button>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => navigate('/record')}
              className="hl-cta-warm"
              style={{
                padding: '12px 28px',
                background: 'transparent',
                border: '1px solid var(--warm)',
                borderRadius: 0,
                color: 'var(--warm)',
                fontFamily: 'var(--mono)',
                fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'border-color 360ms var(--ease), color 360ms var(--ease)',
              }}
            >
              speak
            </button>
          )}
        </div>

        {/* A short ledger of recent threads */}
        {recent.length > 0 && (
          <div style={{ marginTop: 56, textAlign: 'left' }}>
            {recent.map((e, i) => (
              <EntryRow
                key={i}
                title={
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10 }}>
                    <WarmDot color={dyeVar(e.dye)} size={5} />
                    {e.title}
                  </span>
                }
                italic={e.sealed}
                year={e.year}
                onClick={() => navigate(e.route)}
              />
            ))}
          </div>
        )}

        {/* Quiet status foot */}
        <div className="hl-mono" style={{
          marginTop: 40,
          fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--bone-faint)',
        }}>
          {status}
        </div>

        <div style={{ marginTop: 40 }}>
          <WaxSeal size={26} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────── */
export function PwaHome() {
  const role = useRole();
  const { entries, isLoading: entriesLoading } = useTapestryEntries();
  const { prompt } = useListener();
  const { isNewUser, isLoading: isNewUserLoading } = useIsNewUser();
  const [wizardDone, setWizardDone] = useState(() => !shouldShowWizard());
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [stats, setStats] = useState<{ entries: number; members: number } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    memoriesApi.getStats()
      .then(r => setStats({ entries: r.data?.total ?? 0, members: 0 }))
      .catch(() => {});
  }, [isAuthenticated]);

  // The installed app remembers you. Once auth has rehydrated, a launch with no
  // token (never signed in, or session cleared) goes straight to login rather
  // than the visitor marketing preview — the PWA opens directly into its door.
  if (_hasHydrated && !isAuthenticated && !getAuthToken()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ClothShell
      topbarLeft={<HLogo size="sm" wordmark />}
      topbarRight={<PwaMenu />}
    >
      {!wizardDone && <PwaWizard onDone={() => setWizardDone(true)} />}

      {/* Still resolving whether this is a first-run user or loading the thread —
          show the hairline rather than flashing the first-run prompt or an empty cloth. */}
      {(isNewUserLoading || (entriesLoading && entries.length === 0)) && (
        <div style={{ padding: 'clamp(40px, 9vw, 64px) clamp(20px, 5vw, 32px)', maxWidth: 520, margin: '0 auto' }}>
          <ProgressHair width={80} />
        </div>
      )}

      {/* First-run experience — shown when the user has no entries yet */}
      {!isNewUserLoading && isNewUser && (
          <div style={{
            padding: 'clamp(40px, 9vw, 64px) clamp(20px, 5vw, 32px)',
            maxWidth: 520,
            margin: '0 auto',
            paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          }}>
            <div className="hl-eyebrow" style={{ marginBottom: 18, color: 'var(--warm)' }}>
              entry no. 0001
            </div>
            <h2 className="loom-display hl-tight" style={{
              fontSize: 'clamp(24px, 6vw, 30px)', fontWeight: 500, lineHeight: 1.15,
              margin: '0 0 18px', color: 'var(--bone)',
            }}>
              There is someone who needs to read this.<br />Just not yet.
            </h2>
            <p className="hl-serif" style={{
              fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 300,
              color: 'var(--bone-dim)', lineHeight: 1.68, margin: '0 0 28px', maxWidth: '40ch',
            }}>
              Write a letter today. Seal it for a date, a milestone, a death — or the moment you choose.
              It holds safe and finds them exactly when you intended.
            </p>

            {/* Sealed letter preview */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 6,
              padding: '12px 16px 12px 18px',
              border: '1px solid var(--rule)',
              borderLeft: '1px solid color-mix(in srgb, var(--warm) 55%, transparent)',
              marginBottom: 28,
            }}>
              <div className="hl-mono" style={{ fontSize: 8.5, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
                sealed · delivery: your choice
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="hl-serif" style={{ fontSize: 20, fontWeight: 300, color: 'var(--warm)', lineHeight: 1 }}>∞</span>
                <span className="hl-serif" style={{ fontSize: 13, fontWeight: 300, fontStyle: 'italic', color: 'var(--bone-dim)' }}>
                  your first letter — written today
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 36 }}>
              <Link to="/compose" className="hl-btn" style={{ fontSize: 13, padding: '11px 20px' }}>
                Write your first sealed letter →
              </Link>
              <Link to="/record" style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--bone-dim)', textDecoration: 'none', borderBottom: '1px solid var(--rule)', paddingBottom: 1,
              }}>or speak →</Link>
            </div>

            {prompt && (
              <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 16 }}>
                <div className="hl-eyebrow" style={{ marginBottom: 8, color: 'var(--bone-faint)' }}>the listener</div>
                <p className="hl-serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--bone-faint)', lineHeight: 1.7, margin: 0 }}>
                  {prompt}
                </p>
              </div>
            )}
          </div>
      )}

      {/* Content — ClothShell's <main> is the single scroller: it offsets the
          topbar and reserves BottomNav clearance, so rendering directly here
          keeps content off the fixed nav. (A nested absolute scroller defeated
          this.) */}
      {!isNewUserLoading && !isNewUser && !(entriesLoading && entries.length === 0) && (
        <AuthHome role={role} entries={entries} prompt={prompt} stats={stats} />
      )}

    </ClothShell>
  );
}
