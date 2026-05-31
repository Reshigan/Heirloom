import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useLoomTheme } from '../loom/theme';

/**
 * Navigation — Loom-native top bar for authenticated surfaces.
 *
 * Same component name + default export as the v1/v2 Navigation, so
 * any page that imports `<Navigation />` automatically picks up the
 * new chrome. Newer pages should use the AppFrame component (which
 * renders this nav inside a content column) instead of importing
 * Navigation directly.
 *
 * Layout: ∞heirloom mark on the left, six primary tabs in the middle,
 * a "More" dropdown for the long tail, vault/paper toggle and a user
 * menu on the right. No icons in the primary nav — type only, mono
 * caps with locked tracking.
 */
const PRIMARY: { to: string; label: string; matchPrefix?: boolean }[] = [
  { to: '/dashboard', label: 'Today' },
  { to: '/threads', label: 'Threads', matchPrefix: true },
  { to: '/memories', label: 'Memories' },
  { to: '/letters', label: 'Letters' },
  { to: '/record', label: 'Record' },
  { to: '/family', label: 'Family', matchPrefix: true },
];

const MORE: { to: string; label: string }[] = [
  { to: '/compose', label: 'Write a memory' },
  { to: '/quick', label: 'Quick wizard' },
  { to: '/time-capsules', label: 'Time capsules' },
  { to: '/family-feed', label: 'Family feed' },
  { to: '/on-this-day', label: 'On this day' },
  { to: '/streaks', label: 'Streaks' },
  { to: '/challenges', label: 'Challenges' },
  { to: '/wrapped', label: 'Wrapped' },
  { to: '/legacy-plan', label: 'Thread plan' },
  { to: '/life-events', label: 'Life events' },
  { to: '/milestones', label: 'Milestones' },
  { to: '/memorials', label: 'Memorials' },
  { to: '/story-artifacts', label: 'Story artifacts' },
  { to: '/book-builder', label: 'Living book' },
  { to: '/memory-cards', label: 'Memory cards' },
  { to: '/memory-map', label: 'Memory map' },
  { to: '/gift-a-memory', label: 'Gift a memory' },
  { to: '/gift-subscriptions', label: 'Gift a subscription' },
  { to: '/recipient-experience', label: 'Recipient preview' },
  { to: '/future-letter', label: 'Future letter' },
  { to: '/interview', label: 'Interview mode' },
  { to: '/referrals', label: 'Referrals' },
  { to: '/settings', label: 'Settings' },
  { to: '/billing', label: 'Billing' },
];

export function Navigation() {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useLoomTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '∞'
    : '∞';

  const isActive = (to: string, prefix?: boolean) =>
    pathname === to || (prefix === true && pathname.startsWith(to + '/'));

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: '0 24px',
        borderBottom: '1px solid var(--loom-rule)',
        background: 'color-mix(in srgb, var(--loom-ink) 98%, transparent)',
      }}
    >
      <Link to="/dashboard" className="loom-mark" style={{ textDecoration: 'none' }}>
        <span className="infmark">∞</span>heirloom
      </Link>

      {/* Desktop primary nav */}
      <nav
        style={{
          display: 'flex',
          gap: 24,
          marginLeft: 36,
          flex: 1,
        }}
        className="hidden md:flex"
      >
        {PRIMARY.map((p) => {
          const active = isActive(p.to, p.matchPrefix);
          return (
            <Link
              key={p.to}
              to={p.to}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: active ? 'var(--loom-bone)' : 'var(--loom-bone-faint)',
                textDecoration: 'none',
                padding: '4px 0',
                transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                whiteSpace: 'nowrap',
              }}
            >
              {p.label}
            </Link>
          );
        })}

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            onBlur={() => setTimeout(() => setMoreOpen(false), 200)}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            More ▾
          </button>
          {moreOpen ? (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 14px)',
                left: 0,
                minWidth: 240,
                background: 'var(--loom-ink-card)',
                border: '1px solid var(--loom-rule)',
                padding: '6px 0',
                zIndex: 50,
                boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
                maxHeight: 480,
                overflowY: 'auto',
              }}
            >
              {MORE.map((m) => (
                <Link
                  key={m.to}
                  to={m.to}
                  onClick={() => setMoreOpen(false)}
                  style={{
                    display: 'block',
                    padding: '9px 16px',
                    fontFamily: "'Source Serif 4', serif",
                    fontSize: 14,
                    color: pathname === m.to ? 'var(--loom-warm)' : 'var(--loom-bone-dim)',
                    fontStyle: pathname === m.to ? 'italic' : 'normal',
                    textDecoration: 'none',
                  }}
                >
                  {m.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </nav>

      {/* Mobile burger */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="md:hidden"
        style={{
          marginLeft: 'auto',
          marginRight: 12,
          background: 'transparent',
          border: 0,
          color: 'var(--loom-bone)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        {mobileOpen ? 'close' : 'menu'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginLeft: 'auto' }} className="hidden md:flex">
        <span className="loom-theme-pill">
          <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')} type="button">
            vault
          </button>
          <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')} type="button">
            paper
          </button>
        </span>

        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              onBlur={() => setTimeout(() => setUserOpen(false), 200)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'transparent',
                border: '1px solid var(--loom-rule)',
                color: 'var(--loom-bone)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.04em',
                cursor: 'pointer',
              }}
            >
              {initials}
            </button>
            {userOpen ? (
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
                  boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
                }}
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--loom-rule)', marginBottom: 6 }}>
                  <p style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 14, color: 'var(--loom-bone)' }}>
                    {user.firstName} {user.lastName}
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: 'var(--loom-bone-faint)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {user.email}
                  </p>
                </div>
                <Link to="/settings" style={menuItemStyle} onClick={() => setUserOpen(false)}>
                  Settings
                </Link>
                <Link to="/billing" style={menuItemStyle} onClick={() => setUserOpen(false)}>
                  Billing
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setUserOpen(false);
                    logout();
                  }}
                  style={{
                    ...menuItemStyle,
                    background: 'transparent',
                    border: 0,
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Mobile dropdown panel */}
      {mobileOpen ? (
        <div
          className="md:hidden"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--loom-ink-card)',
            borderBottom: '1px solid var(--loom-rule)',
            padding: '12px 24px 20px',
            zIndex: 40,
          }}
        >
          {[...PRIMARY, ...MORE].map((m) => (
            <Link
              key={m.to}
              to={m.to}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block',
                padding: '10px 0',
                fontFamily: "'Source Serif 4', serif",
                fontSize: 16,
                color: pathname === m.to ? 'var(--loom-warm)' : 'var(--loom-bone)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--loom-rule)',
              }}
            >
              {m.label}
            </Link>
          ))}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="loom-theme-pill">
              <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')} type="button">
                vault
              </button>
              <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')} type="button">
                paper
              </button>
            </span>
            {user ? (
              <button
                type="button"
                onClick={() => logout()}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--loom-rule)',
                  color: 'var(--loom-bone)',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  padding: '8px 14px',
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  padding: '8px 12px',
  fontFamily: "'Source Serif 4', serif",
  fontSize: 14,
  color: 'var(--loom-bone-dim)',
  textDecoration: 'none',
};
