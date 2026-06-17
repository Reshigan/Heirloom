import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * BottomNav — the persistent 5-item typographic bar at the foot of the
 * authenticated loom PWA shell.
 *
 * Five destinations: cloth · memory · ∞ (home) · letter · voice.
 * The ∞ center item is the only mark — no icons, per §2.6.
 * Anchored above the iPhone home indicator via env(safe-area-inset-bottom).
 * Active route: bone. Inactive: bone at 32% opacity.
 * Center ∞: warm when active, warm-dim when inactive.
 *
 * Only renders for authenticated users on app surfaces — never on the
 * marketing site, auth screens, onboarding, or admin (it used to leak a
 * "cloth · memory · ∞" bar over the logged-out landing/login pages).
 */

const NAV = [
  { label: 'cloth',  href: '/loom/weft' },
  { label: 'memory', href: '/compose' },
  { label: '∞',      href: '/loom/index',  center: true },
  { label: 'letter', href: '/loom/compose-letter' },
  { label: 'voice',  href: '/record' },
] as const;

// Public / chrome-free surfaces where the persistent nav must not appear.
const HIDE_EXACT = new Set(['/']);
const HIDE_PREFIXES = ['/login', '/signup', '/pricing', '/privacy', '/terms', '/admin', '/onboarding', '/loom/marketing'];

/** The shell reserves this much bottom space so content clears the nav. */
export const BOTTOM_NAV_CLEARANCE = 'calc(76px + env(safe-area-inset-bottom, 0px))';

export function BottomNav() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuthStore();

  const hidden =
    !isAuthenticated ||
    HIDE_EXACT.has(pathname) ||
    HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (hidden) return null;

  return (
    <nav
      aria-label="Loom navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(76px + env(safe-area-inset-bottom, 0px))',
        zIndex: 30,
        // Solid ink (not translucent) so scrolling content never bleeds through
        // the bar and reads as a collision — and no glass/blur, per §2.6.
        background: 'var(--ink)',
        backdropFilter: 'none',
        borderTop: '1px solid var(--rule)',
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
            aria-label={isCenter ? 'Home' : item.label}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              textDecoration: 'none',
              borderTop: isActive ? '2px solid var(--warm)' : '2px solid transparent',
              paddingTop: isActive ? 0 : 2,
              color: isCenter
                ? isActive ? 'var(--warm)' : 'var(--warm-dim)'
                : isActive ? 'var(--bone)' : 'var(--bone-faint)',
              fontFamily: isCenter ? 'var(--serif)' : 'var(--mono)',
              fontSize: isCenter ? 38 : 10.5,
              fontWeight: isCenter ? 300 : undefined,
              lineHeight: isCenter ? 0.8 : undefined,
              letterSpacing: isCenter ? undefined : '0.2em',
              textTransform: isCenter ? undefined : 'uppercase',
              transition: 'color 180ms cubic-bezier(0.16,1,0.3,1), border-color 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {isCenter ? <span aria-hidden="true">{item.label}</span> : item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;
