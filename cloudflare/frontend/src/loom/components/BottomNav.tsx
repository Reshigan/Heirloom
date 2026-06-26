import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * BottomNav — the persistent 4-item typographic bar at the foot of the
 * authenticated loom PWA shell.
 *
 * Four destinations: the deep · capture · family · you.
 * Every item is a plain typographic word — no icons (§2.6), no bare mark.
 * "capture" is the center anchor (the voice-first cockpit): warm when active
 * so it reads as the heart of the bar without an icon. The page WaxSeal ∞
 * stays the singular ∞ per surface (Rule 5) — the nav stamps no second mark.
 * Anchored above the iPhone home indicator via env(safe-area-inset-bottom).
 * Active route: bone (capture: warm). Inactive: bone-dim.
 *
 * Only renders for authenticated users on app surfaces — never on the
 * marketing site, auth screens, onboarding, or admin (it used to leak a
 * bar over the logged-out landing/login pages).
 */

const NAV = [
  { label: 'the deep', href: '/loom/weft' },
  { label: 'capture',  href: '/capture', center: true },
  { label: 'family',   href: '/family' },
  { label: 'you',      href: '/loom/profile' },
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
      aria-label="The Deep navigation"
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
        // Plain pathname match for every item; the center anchor matches /capture.
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            aria-label={isCenter ? 'Capture' : item.label}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              textDecoration: 'none',
              // Active indicator is a 1px copper hairline (>1px copper = defect);
              // the inactive fallback is a 1px transparent border so the box model
              // is identical and the bar never shifts on selection.
              borderTop: isActive ? '1px solid var(--warm)' : '1px solid transparent',
              paddingTop: 1,
              // Capture is the warm anchor (warm when active); every tab is a plain
              // legible mono label — no bare unlabelled mark, so the bar reads as
              // four named destinations.
              color: isCenter
                ? isActive ? 'var(--warm)' : 'var(--bone-dim)'
                : isActive ? 'var(--bone)' : 'var(--bone-dim)',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              transition: 'color 180ms var(--ease), border-color 180ms var(--ease)',
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;
