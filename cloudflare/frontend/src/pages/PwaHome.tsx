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
import type { UserRole } from '../hooks/useRole';
import type { CanvasEntry } from '../loom/components/TapestryCanvas';

/* ─── Date anchor — journal-style today stamp ────────────────────────────── */
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function todayStamp(): string {
  const d = new Date();
  return `${DAYS[d.getDay()]} · ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/* ─── Stage-based encouragement ──────────────────────────────────────────── */
interface Stage { headline: string; body: string }
function getStage(count: number): Stage {
  if (count === 0) return { headline: 'Your cloth is empty.',      body: 'The first thread changes everything.' };
  if (count <= 3)  return { headline: 'The thread has begun.',     body: 'Every cloth in the world started here.' };
  if (count <= 10) return { headline: 'The first threads are in.', body: 'A few more and the pattern begins to show.' };
  if (count <= 25) return { headline: 'The cloth is forming.',     body: 'Someone will find this one day.' };
  if (count <= 60) return { headline: 'The pattern is emerging.',  body: 'This is where most families stop. Keep going.' };
  if (count <= 100) return { headline: 'The cloth is taking shape.', body: 'A hundred threads holds a life.' };
  if (count <= 200) return { headline: 'A meaningful cloth.',       body: 'This will outlast you.' };
  if (count <= 400) return { headline: 'A remarkable cloth.',       body: 'Most families never get here.' };
  return { headline: 'A full cloth.', body: 'This will hold for a thousand years.' };
}

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
  stats,
}: {
  role: UserRole;
  entries: CanvasEntry[];
  prompt: string;
  stats: { entries: number; members: number } | null;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const count = entries.length;
  const stage = getStage(count);
  const P = 'clamp(20px, 5vw, 28px)';
  const TARGET = 400;

  const greeting = isAuthenticated && user
    ? `${user.firstName}'s thread.`
    : "Start your family’s thousand-year thread.";

  // Visitor — no cloth, just invite
  if (role === 'visitor') {
    return (
      <div style={{ padding: `36px ${P}`, paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
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
      <div style={{ padding: `clamp(40px, 9vw, 64px) ${P}`, maxWidth: 480, paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
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
      <div style={{ padding: `clamp(40px, 9vw, 64px) ${P}`, maxWidth: 560, paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
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

  const isReadOnly = role === 'reader' || role === 'successor';
  const primaryCta = isReadOnly
    ? { label: 'thread →', to: '/loom' }
    : { label: 'write →', to: '/compose' };

  const nowYear = new Date().getFullYear();
  const firstYear = count > 0
    ? entries.reduce((min, e) => Math.min(min, e.date.getFullYear()), nowYear)
    : nowYear;
  const threadYear = nowYear - firstYear + 1;
  const heroStat = {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    letterSpacing: '0.3em',
    textTransform: 'uppercase' as const,
    color: 'var(--bone-faint)',
    textShadow: '0 1px 10px var(--ink), 0 0 22px var(--ink)',
  };

  return (
    <>
      {/* Home hero — the edge of the cloth. The cloth itself is the global
          backdrop; this layer holds only the prompt, the breathing fell
          line, and the selvedge stats. */}
      <div style={{
        position: 'relative',
        // Fill exactly the first screen above the fixed BottomNav (76px) and
        // below the topbar (56px) — svh, not vh, so iOS browser chrome can't
        // overshoot and shove the selvedge stats behind the nav.
        minHeight: 'clamp(360px, calc(100svh - 132px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)), 720px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        paddingBottom: 130,
      }}>
        <div style={{ textAlign: 'center', padding: `0 ${P}` }}>
          <p style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: 'var(--warm-dim)',
            margin: '0 0 18px',
          }}>
            {todayStamp().toLowerCase()} · the edge of the cloth
          </p>
          {isReadOnly ? (
            <p className="hl-serif" style={{
              fontStyle: 'italic', fontWeight: 300,
              fontSize: 'clamp(28px, 4.4vw, 48px)',
              color: 'var(--bone)', margin: 0,
              textShadow: '0 0 50px var(--ink)',
            }}>
              The cloth remembers.
            </p>
          ) : (
            <Link to="/compose" className="hl-serif" style={{
              display: 'inline-block',
              fontStyle: 'italic', fontWeight: 300,
              fontSize: 'clamp(28px, 4.4vw, 48px)',
              color: 'var(--bone)', textDecoration: 'none',
              cursor: 'text',
              textShadow: '0 0 50px var(--ink)',
            }}>
              What will you keep from today?<span className="hl-hero-caret" aria-hidden />
            </Link>
          )}
        </div>
        <div className="hl-fell-line" style={{ bottom: 96 }} aria-hidden />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 30,
          display: 'flex', justifyContent: 'space-between',
          gap: 14, flexWrap: 'wrap',
          padding: '0 28px',
        }}>
          <span style={heroStat}>
            since {firstYear} · <b style={{ color: 'var(--warm-dim)', fontWeight: 400 }}>{count}</b> {count === 1 ? 'memory' : 'memories'} woven
          </span>
          <span style={heroStat}>touch a thread — the cloth remembers</span>
          <span style={heroStat}>
            {stats && stats.members > 0 ? `${stats.members} ${stats.members === 1 ? 'voice' : 'voices'} · ` : ''}year {threadYear} of a thousand
          </span>
        </div>
      </div>

      {/* Count + stage message */}
      <div style={{ padding: `28px ${P} 24px` }}>
        <div
          className="hl-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.30em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            marginBottom: 14,
          }}
        >
          {count} {count === 1 ? 'memory' : 'memories'} woven · {TARGET - count > 0 ? `${TARGET - count} remaining` : 'full cloth'}
        </div>

        <h2
          className="hl-serif"
          style={{
            fontSize: 'clamp(20px, 5.5vw, 26px)',
            fontWeight: 300,
            color: 'var(--bone)',
            margin: '0 0 10px',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            fontVariationSettings: '"opsz" 24',
          }}
        >
          {stage.headline}
        </h2>

        <p
          className="hl-serif"
          style={{
            fontSize: 'clamp(14px, 3.8vw, 16px)',
            fontStyle: 'italic',
            color: 'var(--bone-dim)',
            margin: '0 0 6px',
            lineHeight: 1.55,
          }}
        >
          {stage.body}
        </p>

        {/* Listener prompt — shown only when there's an interesting prompt */}
        {prompt && count > 0 && (
          <p
            className="hl-serif"
            style={{
              fontSize: 'clamp(13px, 3.5vw, 15px)',
              fontStyle: 'italic',
              color: 'var(--warm)',
              margin: '14px 0 0',
              lineHeight: 1.55,
              borderLeft: '2px solid rgba(176,122,74,0.3)',
              paddingLeft: 12,
            }}
          >
            {prompt}
          </p>
        )}

        {/* Entry count progress hairline */}
        <div style={{ position: 'relative', height: 1, width: '100%', marginTop: 24, marginBottom: 24 }}>
          <div style={{
            position: 'absolute', top: 0, left: 0,
            height: 1,
            width: '100%',
            background: 'rgba(244,236,216,0.06)',
          }} />
          <div style={{
            position: 'absolute', top: 0, left: 0,
            height: 1,
            width: `${Math.min(100, (count / TARGET) * 100)}%`,
            background: 'linear-gradient(to right, rgba(176,122,74,0.3), rgba(176,122,74,0.7))',
            transition: 'width 720ms cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>

        {/* Primary CTA */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 0, alignItems: 'center' }}>
          <Link to={primaryCta.to} className="hl-btn" style={{ fontSize: 13, padding: '11px 20px' }}>
            {primaryCta.label}
          </Link>
          {!isReadOnly && (
            <Link to="/record" className="hl-btn text" style={{ fontSize: 13 }}>
              speak →
            </Link>
          )}
          {role === 'trial' && (
            <Link to="/billing" className="hl-btn text" style={{ fontSize: 12 }}>
              upgrade →
            </Link>
          )}
        </div>
      </div>

      {/* Recently woven — the thread itself, not just its count. The most
          recent entries with a title, newest first, each opening the woven
          band. This is the list the cloth promises: what's actually here. */}
      {count > 0 && (() => {
        const recent = [...entries].filter(e => e.title).reverse().slice(0, 5);
        if (recent.length === 0) return null;
        return (
          <div style={{ borderTop: '1px solid var(--rule)', padding: `20px ${P} 4px` }}>
            <div className="hl-mono" style={{
              fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'var(--bone-faint)', marginBottom: 14,
            }}>
              recently woven
            </div>
            {recent.map((e, i) => (
              <Link
                key={`${e.n}-${i}`}
                to="/loom/weft"
                style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr auto',
                  alignItems: 'baseline', columnGap: 12,
                  textDecoration: 'none', padding: '11px 0', minHeight: 44,
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                <span aria-hidden style={{
                  width: 8, height: 8, alignSelf: 'center',
                  background: `var(--dye-${e.dye}, var(--warm))`,
                  boxShadow: `0 0 8px var(--dye-${e.dye}, var(--warm))`,
                }} />
                <span className="hl-serif" style={{
                  fontSize: 'clamp(15px, 4vw, 17px)', fontWeight: 300, color: 'var(--bone)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {e.title}{e.sealed ? ' ∞' : ''}
                </span>
                <span className="hl-mono" style={{
                  fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: 'var(--bone-faint)', textAlign: 'right',
                }}>
                  {e.date.getFullYear()}
                </span>
              </Link>
            ))}
            <Link to="/memories" className="hl-mono" style={{
              display: 'inline-block', marginTop: 14,
              fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--warm)', textDecoration: 'none',
            }}>
              see all {count} {count === 1 ? 'memory' : 'memories'} →
            </Link>
          </div>
        );
      })()}

      {/* Quick links */}
      <div
        style={{
          borderTop: '1px solid var(--rule)',
          padding: `16px ${P}`,
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {([
          { to: '/wrapped',            label: 'wrapped',       sub: 'your thread, this year' },
          { to: '/letters',            label: 'letters',       sub: 'write to someone not yet ready' },
          { to: '/memories',           label: 'memories',      sub: 'add a thread to the weave' },
          { to: '/ask',                label: 'ask the thread', sub: 'what did they say about…' },
          { to: '/family',             label: 'family',        sub: 'the bloodline' },
          { to: '/book',               label: 'the book',      sub: 'make it physical, permanent' },
          { to: '/gift-subscriptions', label: 'gift a thread', sub: 'start someone else\'s cloth' },
        ] as const).map(item => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'baseline',
              columnGap: 12,
              fontFamily: 'var(--mono)',
              textDecoration: 'none',
              padding: '12px 0',
              minHeight: 44,
              borderBottom: '1px solid var(--rule)',
              transition: 'opacity 180ms var(--ease)',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}
          >
            <span style={{
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-dim)',
            }}>
              {item.label}
            </span>
            <span style={{
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              fontStyle: 'italic',
              textAlign: 'right',
            }}>
              {item.sub} →
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────── */
export function PwaHome() {
  const role = useRole();
  const { entries } = useTapestryEntries();
  const prompt  = useListener();
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
      backdropOpacity={0.45}
    >
      {!wizardDone && <PwaWizard onDone={() => setWizardDone(true)} />}

      {/* First-run experience — shown when the user has no entries yet */}
      {!isNewUserLoading && isNewUser && (
          <div style={{
            padding: 'clamp(40px, 9vw, 64px) clamp(20px, 5vw, 32px)',
            maxWidth: 520,
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
        <AuthHome role={role} entries={entries} prompt={prompt} stats={stats} />
      )}

    </ClothShell>
  );
}
