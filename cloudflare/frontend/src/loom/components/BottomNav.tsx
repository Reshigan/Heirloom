import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { threadsApi, type ThreadRole } from '../../services/api';

/**
 * BottomNav — the persistent typographic row at the foot of the
 * authenticated PWA, matching the design artboards' role-keyed bottom
 * chrome (heirloom-pwa.jsx / heirloom-mobile.jsx).
 *
 * It is a TYPOGRAPHIC mono nav, never an icon tab bar: 10px JetBrains
 * Mono, uppercase, warm on the active route, a 1px hairline top, ink
 * surface, anchored above the home indicator via
 * `env(safe-area-inset-bottom)`. `∞` is the only mark — no icons.
 *
 * Role-keyed (the only thing that changes is the order + the set of
 * destinations, surfaced typographically, never with iconography):
 *   FOUNDER / SUCCESSOR-as-keeper / AUTHOR / TRIAL → write · speak · cloth · family
 *   READER (read-only)                              → cloth · read · family · q&a
 *   SUCCESSOR (post-trigger admin)                  → inbox · family · archive
 *
 * Role is read honestly from the user's threads (threadsApi.list →
 * the membership role on the default thread, falling back to the first
 * thread). While roles load, or with no thread yet, it shows the
 * default keeper row. No fabricated counts — the inbox badge only
 * shows if the API gives us one (it doesn't yet, so it's omitted).
 *
 * Mobile-only: hidden at ≥ the `sm` breakpoint (640px) via a media
 * query injected once, so the desktop top-bar Navigation is untouched.
 *
 * Mount once inside the authenticated shell (see App.tsx wiring note).
 */

type Item = { label: string; to: string };

const KEEPER: Item[] = [
  { label: 'write', to: '/compose' },
  { label: 'speak', to: '/record' },
  { label: 'cloth', to: '/loom/weft' },
  { label: 'family', to: '/family' },
];

const READER: Item[] = [
  { label: 'cloth', to: '/loom/weft' },
  { label: 'read', to: '/loom/read' },
  { label: 'family', to: '/family' },
  { label: 'q&a', to: '/ask' },
];

const SUCCESSOR: Item[] = [
  { label: 'inbox', to: '/inbox' },
  { label: 'family', to: '/family' },
  { label: 'archive', to: '/loom/weft' },
];

function rowFor(role: ThreadRole | undefined): Item[] {
  switch (role) {
    case 'READER':
      return READER;
    case 'SUCCESSOR':
      return SUCCESSOR;
    // FOUNDER, AUTHOR, PLACEHOLDER, or unknown → the keeper row.
    default:
      return KEEPER;
  }
}

const STYLE_ID = 'loom-bottom-nav-style';
const CSS = `
@media (min-width: 640px) {
  .loom-bottom-nav { display: none !important; }
}
.loom-bottom-nav-link {
  transition: color var(--loom-dur-fast) var(--loom-ease),
              opacity var(--loom-dur-fast) var(--loom-ease),
              transform var(--loom-dur-fast) var(--loom-ease);
  touch-action: manipulation;
}
.loom-bottom-nav-link:active { opacity: 0.6; transform: scale(0.93); }
`;

function ensureStyle() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function BottomNav() {
  ensureStyle();
  const { isAuthenticated, user } = useAuthStore();
  const { pathname } = useLocation();

  // Role is derived honestly from the user's threads. `enabled` keeps
  // this from firing for signed-out viewers (the nav isn't rendered
  // for them anyway, but belt-and-suspenders).
  const { data } = useQuery({
    queryKey: ['threads'],
    queryFn: () => threadsApi.list().then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const role = useMemo<ThreadRole | undefined>(() => {
    const threads = data?.threads ?? [];
    if (threads.length === 0) return undefined;
    const preferred = user?.defaultThreadId
      ? threads.find((t) => t.id === user.defaultThreadId)
      : undefined;
    return (preferred ?? threads[0]).role;
  }, [data, user?.defaultThreadId]);

  if (!isAuthenticated) return null;
  // Hide on the public marketing pages — they have their own CTAs.
  if (pathname === '/' || pathname === '/loom/marketing') return null;

  const items = rowFor(role);

  return (
    <nav
      className="loom-bottom-nav"
      aria-label="Primary"
      style={{
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        zIndex: 50,
        background: 'var(--ink)',
        borderTop: '1px solid var(--rule)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul
        style={{
          margin: 0,
          listStyle: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 26px',
        }}
      >
        {items.map((item) => {
          const active =
            pathname === item.to || pathname.startsWith(item.to + '/');
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className="loom-mono loom-bottom-nav-link"
                style={{
                  textDecoration: 'none',
                  fontSize: 13,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--warm)' : 'var(--bone-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 44,
                  padding: '0 4px',
                }}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomNav;
