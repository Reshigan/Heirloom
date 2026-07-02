import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * BottomNav — the persistent 4-item typographic bar at the foot of the
 * authenticated loom PWA shell.
 *
 * Four destinations: the deep · ∞ · family · you.
 * The three side items are plain typographic words — no icons (§2.6). The
 * center is the singular ∞ mark (the voice-first capture cockpit): the one
 * bare glyph the product allows, warm when active so it reads as the heart of
 * the bar — "this is how you add."
 * Anchored above the iPhone home indicator via env(safe-area-inset-bottom).
 * Active route: bone (capture: warm). Inactive: bone-dim.
 *
 * Only renders for authenticated users on app surfaces — never on the
 * marketing site, auth screens, onboarding, or admin (it used to leak a
 * bar over the logged-out landing/login pages).
 */

const NAV = [
  { label: 'the deep', href: '/loom/pwa' },
  { label: '∞',        href: '/capture', center: true },
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
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Centered group: on a phone this fills the bar; on web the four
          destinations hold together as one centered composition instead of
          stretching edge-to-edge. */}
      <div style={{
        maxWidth: 560,
        width: '100%',
        height: '100%',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'stretch',
      }}>
      {NAV.map((item) => {
        const isCenter = 'center' in item && item.center;
        // Plain pathname match for every item; the center anchor matches /capture.
        const isActive = pathname === item.href;

        // The center is the singular ∞ — the "how you add" anchor. It rises
        // out of the bar as a hairline-bordered ink tile crossing the rule
        // line: the one raised element, so the eye lands on it first.
        if (isCenter) {
          return (
            <Link
              key={item.href}
              to={item.href}
              aria-label="Capture"
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <span style={{
                width: 54,
                height: 54,
                marginTop: -16,
                background: 'var(--ink)',
                border: `1px solid ${isActive ? 'var(--warm)' : 'var(--copper-border, var(--warm-dim))'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--mono)',
                fontSize: 26,
                lineHeight: 1,
                color: 'var(--warm)',
                transition: 'border-color 180ms var(--ease)',
              }}>
                ∞
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            to={item.href}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              textDecoration: 'none',
              color: isActive ? 'var(--bone)' : 'var(--bone-faint)',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              lineHeight: 1,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              transition: 'color 180ms var(--ease)',
            }}
          >
            {item.label}
            {/* Active = a single copper underdot (the brand's activity signal),
                reserved space when idle so the bar never shifts. */}
            <span aria-hidden style={{
              width: 3,
              height: 3,
              background: isActive ? 'var(--warm)' : 'transparent',
              transition: 'background 180ms var(--ease)',
            }} />
          </Link>
        );
      })}
      </div>
    </nav>
  );
}

export default BottomNav;
