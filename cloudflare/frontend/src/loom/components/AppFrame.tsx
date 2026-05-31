import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Frame } from './Frame';
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
          color: 'var(--loom-bone)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.04em',
          cursor: 'pointer',
        }}
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
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--loom-rule)',
              marginBottom: 6,
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "'Source Serif 4', serif",
                fontSize: 14,
                color: 'var(--loom-bone)',
              }}
            >
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
          <Link to="/settings" style={menuItemStyle} onClick={() => setOpen(false)}>
            Settings
          </Link>
          <Link to="/billing" style={menuItemStyle} onClick={() => setOpen(false)}>
            Billing
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
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
  );
}

/**
 * AppFrame — layout shell for authenticated pages that are not yet
 * Loom-native (i.e. pages in src/pages/ that manage real data).
 *
 * Wraps the page in the canonical Loom Frame (TapestryEdge warp
 * pattern, clean 4-link nav, theme toggle) with a scrollable content
 * column and a user menu on the right. This is the upgrade path that
 * gives every data page the Loom visual language without a full rewrite.
 *
 * Set nav=false for pages that render their own top chrome (e.g.
 * Wrapped, which is a full-screen landscape layout).
 */
export function AppFrame({
  children,
  width = 'reading',
  nav = true,
}: {
  children: ReactNode;
  width?: 'reading' | 'wide';
  nav?: boolean;
}) {
  if (!nav) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative', background: 'var(--loom-ink)' }}>
        <div className="loom-grain" style={{ pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </div>
    );
  }

  return (
    <Frame right={<UserMenu />}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: width === 'wide' ? '100%' : 1180,
            margin: '0 auto',
            padding: '40px 32px 96px',
          }}
        >
          {children}
        </div>
      </div>
    </Frame>
  );
}
