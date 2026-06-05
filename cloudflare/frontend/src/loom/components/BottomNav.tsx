import { Link, useLocation } from 'react-router-dom';

/**
 * BottomNav — the persistent 5-item typographic bar at the foot of the
 * authenticated loom PWA shell.
 *
 * Five destinations: cloth · compose · ∞ (home) · letters · listen.
 * The ∞ center item is the only mark — no icons, per §2.6.
 * Anchored above the iPhone home indicator via env(safe-area-inset-bottom).
 * Active route: bone. Inactive: bone at 32% opacity.
 * Center ∞: warm when active, warm at 50% opacity when inactive.
 */

const NAV = [
  { label: 'cloth',   href: '/loom/weft' },
  { label: 'compose', href: '/loom/compose' },
  { label: '∞',       href: '/loom/pwa',    center: true },
  { label: 'letters', href: '/loom/read' },
  { label: 'listen',  href: '/loom/echo' },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        zIndex: 30,
        background: 'rgba(14,14,12,0.92)',
        borderTop: '1px solid rgba(244,236,216,0.07)',
        display: 'flex',
        alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {NAV.map((item) => {
        const isCenter = 'center' in item && item.center;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              textDecoration: 'none',
              color: isCenter
                ? isActive ? 'var(--warm)' : 'rgba(176,122,74,0.5)'
                : isActive ? 'var(--bone)' : 'rgba(244,236,216,0.32)',
              fontFamily: isCenter ? 'var(--serif)' : 'var(--mono)',
              fontSize: isCenter ? 18 : 9,
              letterSpacing: isCenter ? undefined : '0.18em',
              textTransform: isCenter ? undefined : 'uppercase',
              transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export default BottomNav;
