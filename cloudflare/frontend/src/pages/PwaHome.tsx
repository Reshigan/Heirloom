import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getAuthToken } from '../services/api';
import { useRole } from '../hooks/useRole';
import { useTapestryEntries } from '../hooks/useTapestryEntries';
import { useListener } from '../hooks/useListener';
import { useIsNewUser } from '../hooks/useIsNewUser';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { PwaWizard, shouldShowWizard } from '../loom/components/PwaWizard';
import { RoomHeader, CapturePills, RoomRow } from '../loom/components/room';
import type { UserRole } from '../hooks/useRole';
import type { CanvasEntry } from '../loom/components/TapestryCanvas';

/* ─── PWA profile menu ────────────────────────────────────────────────────── */
function PwaMenu() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '∞';

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 220)}
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
            'opacity 180ms var(--ease), transform 180ms var(--ease), visibility 0ms linear ' +
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
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
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
  reroll,
  stats,
}: {
  role: UserRole;
  entries: CanvasEntry[];
  prompt: string;
  reroll: () => void;
  stats: { entries: number; members: number } | null;
}) {
  const { user, isAuthenticated } = useAuthStore();
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
        <h2 className="hl-serif hl-tight" style={{ fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 24px', lineHeight: 1.15 }}>
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
        <h2 className="hl-serif hl-tight" style={{ fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 300, lineHeight: 1.15, margin: '0 0 18px', color: 'var(--bone)' }}>
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
        <h2 className="hl-serif hl-tight" style={{
          fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 300, lineHeight: 1.15,
          margin: '0 0 18px', color: 'var(--bone)', fontVariationSettings: '"opsz" 30',
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
          border: '1px solid rgba(244,236,216,0.10)',
          borderLeft: '2px solid rgba(176,122,74,0.55)',
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

  // ── Active author / reader — capture-first home (layout C) ──
  const isReadOnly = role === 'reader' || role === 'successor';
  const nowYear = new Date().getFullYear();
  const firstYear = count > 0
    ? entries.reduce((min, e) => Math.min(min, e.date.getFullYear()), nowYear)
    : nowYear;
  const threadYear = nowYear - firstYear + 1;
  const recent = [...entries].filter((e) => e.title).reverse().slice(0, 3);
  const QUIET_NAV: { to: string; label: string }[] = [
    { to: '/letters', label: 'letters' },
    { to: '/family', label: 'family' },
    { to: '/book', label: 'book' },
    { to: '/ask', label: 'ask' },
  ];

  return (
    <div style={{ padding: `0 ${P}`, maxWidth: 600, margin: '0 auto', paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Listener hero — over the touchable cloth band. Fills the first view. */}
      <div style={{
        minHeight: 'clamp(340px, calc(100svh - 200px - env(safe-area-inset-top, 0px)), 640px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        gap: 22, paddingBottom: 8,
      }}>
        <RoomHeader
          eyebrow={
            isReadOnly ? 'the cloth remembers' : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                the listener asks
                <button type="button" onClick={reroll} aria-label="another prompt" className="hl-mono"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--warm)', fontSize: 12, lineHeight: 1, padding: 2 }}>
                  ↻
                </button>
              </span>
            )
          }
          title={
            <span style={{ fontStyle: 'italic', textShadow: '0 0 50px var(--ink)' }}>
              {isReadOnly ? 'The cloth remembers.' : prompt}
            </span>
          }
        />
        {isReadOnly ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/loom" className="hl-btn" style={{ fontSize: 13, padding: '11px 20px' }}>open the thread →</Link>
          </div>
        ) : (
          <CapturePills writeHref="/compose" speakHref="/record" />
        )}
      </div>

      {/* Recently woven */}
      {recent.length > 0 && (
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 20, marginTop: 8 }}>
          <div className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 12 }}>
            recently woven
          </div>
          {recent.map((e, i) => (
            <RoomRow key={`${e.n}-${i}`} dye={e.dye} href="/loom/weft"
              title={`${e.title}${e.sealed ? ' ∞' : ''}`} meta={e.date.getFullYear()} />
          ))}
          <Link to="/memories" className="hl-mono" style={{ display: 'inline-block', marginTop: 14, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)', textDecoration: 'none' }}>
            see all {count} {count === 1 ? 'memory' : 'memories'} →
          </Link>
        </div>
      )}

      {/* Quiet nav */}
      <div style={{ borderTop: '1px solid var(--rule)', marginTop: 24, paddingTop: 18, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {QUIET_NAV.map((n) => (
          <Link key={n.to} to={n.to} className="hl-mono" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-dim)', textDecoration: 'none' }}>
            {n.label}
          </Link>
        ))}
      </div>

      {/* One status line */}
      <p className="hl-mono" style={{ marginTop: 22, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
        since {firstYear} · <b style={{ color: 'var(--warm-dim)', fontWeight: 400 }}>{count}</b>{' '}
        {count === 1 ? 'memory' : 'memories'} woven · year {threadYear} of a thousand
        {stats && stats.members > 0 ? ` · ${stats.members} ${stats.members === 1 ? 'voice' : 'voices'}` : ''}
      </p>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────── */
export function PwaHome() {
  const role = useRole();
  const { entries } = useTapestryEntries();
  const { prompt, reroll } = useListener();
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

  /* ── Cloth parallax: nudge CSS var on ClothShell as user scrolls ── */
  useEffect(() => {
    const el = document.querySelector('.loom main');
    if (!el) return;
    const onScroll = () => {
      const pct = (el as HTMLElement).scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
      (document.querySelector('.loom') as HTMLElement)?.style.setProperty('--cloth-parallax', `${pct * 4}deg`);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

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
            <h2 className="hl-serif hl-tight" style={{
              fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 300, lineHeight: 1.15,
              margin: '0 0 18px', color: 'var(--bone)', fontVariationSettings: '"opsz" 30',
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
              border: '1px solid rgba(244,236,216,0.10)',
              borderLeft: '2px solid rgba(176,122,74,0.55)',
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
          keeps content off the fixed nav and lets the cloth parallax read
          `.loom main` scroll. (A nested absolute scroller defeated both.) */}
      {!isNewUser && (
        <AuthHome role={role} entries={entries} prompt={prompt} reroll={reroll} stats={stats} />
      )}

    </ClothShell>
  );
}
