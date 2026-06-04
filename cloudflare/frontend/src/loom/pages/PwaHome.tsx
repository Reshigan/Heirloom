import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { useTapestryEntries } from '../../hooks/useTapestryEntries';
import { useListener } from '../../hooks/useListener';
import { useAuthStore } from '../../stores/authStore';
import { useLoomTheme } from '../theme';
import { TapestryCanvas } from '../components/TapestryCanvas';
import { PwaWizard, shouldShowWizard } from '../components/PwaWizard';
import type { UserRole } from '../../hooks/useRole';
import type { CanvasEntry } from '../components/TapestryCanvas';

/* ─── PWA profile menu — shows on the home screen top bar ────────────── */
function PwaMenu() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useLoomTheme();
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
          width: 36,
          height: 36,
          background: 'transparent',
          border: '1px solid var(--rule)',
          borderRadius: 0,
          color: 'var(--bone)',
          fontFamily: 'var(--mono)',
          fontSize: 12,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'manipulation',
          transition: 'border-color 180ms var(--ease)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--warm)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
      >
        {initials}
      </button>

      {/* dropdown */}
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
          boxShadow: '0 16px 48px rgba(10,10,8,0.45)',
          opacity: open ? 1 : 0,
          transform: open ? 'scale(1)' : 'scale(0.97) translateY(-4px)',
          pointerEvents: open ? 'auto' : 'none',
          visibility: open ? 'visible' : 'hidden',
          transition:
            'opacity 180ms var(--ease), transform 180ms var(--ease), visibility 0ms linear ' +
            (open ? '0ms' : '180ms'),
        }}
      >
        {/* Identity */}
        <div style={{ padding: '6px 8px 12px', borderBottom: '1px solid var(--rule)', marginBottom: 10 }}>
          <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)', fontWeight: 400 }}>
            {user.firstName} {user.lastName}
          </p>
          <p style={{ margin: '2px 0 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.04em' }}>
            {user.email}
          </p>
        </div>

        {/* Theme — paper · vault · system */}
        <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--rule)', marginBottom: 8 }}>
          <p style={{ margin: '0 0 8px', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
            appearance
          </p>
          <div style={{ display: 'flex', gap: 0 }}>
            {(['light', 'dark', 'system'] as const).map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid var(--rule)',
                  borderLeft: i === 0 ? '1px solid var(--rule)' : 'none',
                  padding: '6px 4px',
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: theme === t ? 'var(--warm)' : 'var(--bone-dim)',
                  transition: 'color 180ms var(--ease)',
                  minHeight: 32,
                }}
              >
                {t === 'light' ? 'paper' : t === 'dark' ? 'vault' : 'system'}
              </button>
            ))}
          </div>
        </div>

        {/* Nav links */}
        {[
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

        {/* Sign out */}
        <button
          type="button"
          onClick={() => { logout(); setOpen(false); }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '9px 8px',
            marginTop: 4,
            paddingTop: 10,
            borderTop: '1px solid var(--rule)',
            background: 'transparent',
            border: 0,
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

const QUICK_LINKS = [
  { label: 'family',   to: '/family' },
  { label: 'gift',     to: '/gift-subscriptions' },
  { label: 'wrapped',  to: '/wrapped' },
  { label: 'book',     to: '/book-builder' },
  { label: 'letters',  to: '/letters' },
  { label: 'memories', to: '/memories' },
];

function QuickLinks() {
  const P = 'clamp(20px, 5vw, 28px)';
  return (
    <div style={{ marginTop: 32, borderTop: '1px solid var(--rule)', paddingTop: 20, paddingLeft: P, paddingRight: P }}>
      <div className="hl-mono" style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-dim)', marginBottom: 12 }}>
        more
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'var(--mono)',
              fontSize: 13,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-dim)',
              textDecoration: 'none',
              padding: '12px 0',
              minHeight: 44,
              borderBottom: '1px solid var(--rule)',
            }}
          >
            {item.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}

function MiniCloth({ entries }: { entries: CanvasEntry[] }) {
  return (
    <TapestryCanvas
      width={typeof window !== 'undefined' ? window.innerWidth : 390}
      height={180}
      entries={entries}
      kind="specimen"
      animate
      opts={{ tStart: new Date(2019, 0, 1), tEnd: new Date(2027, 0, 1), background: '#0a0a08', warpEvery: 7 }}
    />
  );
}

function RoleContent({ role, entries, prompt, paperFirst }: { role: UserRole; entries: CanvasEntry[]; prompt: string; paperFirst?: boolean }) {
  const P = 'clamp(20px, 5vw, 28px)';

  const WriteBlock = ({ eyebrow, cta, ctaTo, secondary, secondaryTo }: {
    eyebrow: string; cta: string; ctaTo: string;
    secondary?: string; secondaryTo?: string;
  }) => (
    <div style={{ padding: `24px ${P}`, flex: 1 }}>
      <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 12 }}>{eyebrow}</span>
      <h2 className="hl-serif hl-tight" style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 20px', lineHeight: 1.3 }}>
        {prompt}
      </h2>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <Link to={ctaTo} className="hl-btn" style={{ fontSize: 13, padding: '11px 20px' }}>{cta}</Link>
        {secondary && secondaryTo && (
          <Link to={secondaryTo} className="hl-btn text" style={{ fontSize: 12 }}>{secondary}</Link>
        )}
      </div>
    </div>
  );

  switch (role) {
    case 'visitor':
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: `24px ${P} 0` }}>
            <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 12 }}>preview</span>
            <h2 className="hl-serif hl-tight" style={{ fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 20px' }}>
              Start your family&#39;s thousand-year thread.
            </h2>
            <Link to="/signup" className="hl-btn" style={{ fontSize: 13, padding: '11px 20px' }}>Begin free →</Link>
          </div>
          <div style={{ paddingTop: 32 }}>
            <MiniCloth entries={entries} />
          </div>
        </div>
      );

    case 'trial':
      if (paperFirst) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <WriteBlock eyebrow="trial" cta="write now" ctaTo="/compose" secondary="upgrade →" secondaryTo="/billing" />
            <QuickLinks />
            <div style={{ paddingTop: 8 }}><MiniCloth entries={entries} /></div>
          </div>
        );
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: `24px ${P} 0` }}>
            <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 12 }}>trial</span>
            <h2 className="hl-serif hl-tight" style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 20px', lineHeight: 1.3 }}>
              {prompt}
            </h2>
          </div>
          <MiniCloth entries={entries} />
          <div style={{ padding: `16px ${P} 0` }}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link to="/compose" className="hl-btn" style={{ fontSize: 13 }}>write now</Link>
              <Link to="/billing" className="hl-btn text" style={{ fontSize: 12 }}>upgrade →</Link>
            </div>
          </div>
          <QuickLinks />
        </div>
      );

    case 'family':
    case 'founder':
      if (paperFirst) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <WriteBlock eyebrow={role === 'founder' ? 'founder' : 'today'} cta="write now" ctaTo="/compose" />
            <QuickLinks />
            <div style={{ paddingTop: 8 }}><MiniCloth entries={entries} /></div>
          </div>
        );
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: `24px ${P} 0` }}>
            <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 12 }}>{role === 'founder' ? 'founder' : 'today'}</span>
            <h2 className="hl-serif hl-tight" style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 20px', lineHeight: 1.3 }}>
              {prompt}
            </h2>
          </div>
          <MiniCloth entries={entries} />
          <div style={{ padding: `16px ${P} 0` }}>
            <Link to="/compose" className="hl-btn" style={{ fontSize: 13 }}>write now</Link>
          </div>
          <QuickLinks />
        </div>
      );

    case 'author':
      if (paperFirst) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <WriteBlock eyebrow="author" cta="write now" ctaTo="/compose" />
            <QuickLinks />
            <div style={{ paddingTop: 8 }}><MiniCloth entries={entries} /></div>
          </div>
        );
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: `24px ${P} 0` }}>
            <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 12 }}>author</span>
            <h2 className="hl-serif hl-tight" style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 20px', lineHeight: 1.3 }}>
              {prompt}
            </h2>
          </div>
          <MiniCloth entries={entries} />
          <div style={{ padding: `16px ${P} 0` }}>
            <Link to="/compose" className="hl-btn" style={{ fontSize: 13 }}>write now</Link>
          </div>
          <QuickLinks />
        </div>
      );

    case 'reader':
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: `24px ${P} 0` }}>
            <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 12 }}>reading</span>
            <Link to="/loom/read" className="hl-btn" style={{ fontSize: 13 }}>open the thread →</Link>
          </div>
          <div style={{ paddingTop: 32 }}><MiniCloth entries={entries} /></div>
        </div>
      );

    case 'successor':
      return (
        <div style={{ padding: `24px ${P}` }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 12 }}>inheritance</span>
          <h2 className="hl-serif hl-tight" style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 20px' }}>
            A thread has been passed to you.
          </h2>
          <Link to="/loom/weft" className="hl-btn" style={{ fontSize: 13 }}>Open the cloth →</Link>
        </div>
      );

    case 'future_member':
      return (
        <div style={{ padding: `24px ${P}` }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 12 }}>awaiting</span>
          <p className="hl-serif" style={{ fontSize: 16, fontWeight: 300, color: 'var(--bone-dim)', lineHeight: 1.6 }}>
            A thread is being prepared for you.
          </p>
        </div>
      );

    case 'legacy':
      return (
        <div style={{ padding: `24px ${P}` }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 12 }}>legacy access</span>
          <p className="hl-serif" style={{ fontSize: 15, color: 'var(--bone-dim)', lineHeight: 1.6 }}>
            Verify your identity to access the archive.
          </p>
          <Link to="/inherit" className="hl-btn ghost" style={{ marginTop: 20, display: 'inline-block', fontSize: 13 }}>
            Verify →
          </Link>
        </div>
      );

    case 'admin':
      return (
        <div style={{ padding: `24px ${P}` }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 12 }}>support</span>
          <Link to="/admin" className="hl-btn" style={{ fontSize: 13 }}>Open admin console →</Link>
        </div>
      );

    default:
      return null;
  }
}

export function PwaHome() {
  const role = useRole();
  const entries = useTapestryEntries();
  const prompt = useListener();
  const { theme } = useLoomTheme();
  const [wizardDone, setWizardDone] = useState(() => !shouldShowWizard());

  return (
    <div className="hl-screen" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* First-time onboarding wizard */}
      {!wizardDone && <PwaWizard onDone={() => setWizardDone(true)} />}

      {/* Topbar — profile menu + wordmark on mobile PWA home */}
      <div className="hl-topbar" style={{ borderBottom: '1px solid var(--rule)', zIndex: 10 }}>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 13,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--warm)',
            fontWeight: 400,
          }}
        >
          heirloom
        </span>
        <PwaMenu />
      </div>

      {/* Content — paper (light) mode shows actions first, cloth below */}
      <div
        className="hl-frame-scroll"
        style={{
          position: 'absolute',
          top: 'calc(56px + env(safe-area-inset-top, 0px))',
          bottom: 0,
          left: 0,
          right: 0,
          overflowY: 'auto',
        }}
      >
        <RoleContent role={role} entries={entries} prompt={prompt} paperFirst={theme === 'light'} />
      </div>
    </div>
  );
}
