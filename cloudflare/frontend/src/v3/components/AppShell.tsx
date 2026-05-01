import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BreathingMark } from '../sanctuary/BreathingMark';

/**
 * App shell — the chrome around every authenticated v3 surface.
 *
 * Layout: fixed left rail with capability groups, content column to its
 * right. The rail is intentionally text-only — no icons, no avatars, no
 * gradient. This is a workspace, not a dashboard.
 *
 * On mobile the rail collapses to a thin top bar with a single
 * "navigate" link to a full sitemap (/v3/sitemap).
 */
const groups: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: 'Read',
    links: [
      { to: '/v3/home', label: 'Today' },
      { to: '/v3/thread', label: 'The thread' },
      { to: '/v3/memories', label: 'Memories' },
      { to: '/v3/letters', label: 'Letters' },
      { to: '/v3/voice', label: 'Voice' },
      { to: '/v3/feed', label: 'Family feed' },
      { to: '/v3/onthisday', label: 'On this day' },
    ],
  },
  {
    title: 'Write',
    links: [
      { to: '/v3/write', label: 'New entry' },
      { to: '/v3/record', label: 'Record voice' },
      { to: '/v3/letter', label: 'Write a letter' },
      { to: '/v3/capsule', label: 'Time capsule' },
    ],
  },
  {
    title: 'People',
    links: [
      { to: '/v3/family', label: 'Family' },
      { to: '/v3/threads', label: 'Threads' },
    ],
  },
  {
    title: 'Records',
    links: [
      { to: '/v3/lifeevents', label: 'Life events' },
      { to: '/v3/milestones', label: 'Milestones' },
      { to: '/v3/memorials', label: 'Memorials' },
      { to: '/v3/artifacts', label: 'Story artifacts' },
      { to: '/v3/book', label: 'Living book' },
    ],
  },
  {
    title: 'Send',
    links: [
      { to: '/v3/gift', label: 'Gift a memory' },
      { to: '/v3/cards', label: 'Memory cards' },
      { to: '/v3/recipient', label: 'Recipient experience' },
    ],
  },
  {
    title: 'Reflect',
    links: [
      { to: '/v3/plan', label: 'Thread plan' },
      { to: '/v3/streaks', label: 'Streaks' },
      { to: '/v3/wrapped', label: 'Wrapped' },
      { to: '/v3/future', label: 'Future letter' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/v3/settings', label: 'Settings' },
      { to: '/v3/billing', label: 'Billing' },
      { to: '/v3/archive', label: 'Archive audit' },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen text-ink font-news antialiased">
      <div className="flex">
        {/* Left rail (desktop) */}
        <aside className="hidden md:flex md:flex-col md:w-[240px] md:shrink-0 md:h-screen md:sticky md:top-0 border-r border-edge px-6 py-8 overflow-y-auto bg-bone/30 backdrop-blur-[2px]">
          <div className="mb-10">
            <BreathingMark />
          </div>
          <nav className="flex-1 space-y-7">
            {groups.map((g) => (
              <div key={g.title}>
                <p className="font-v3mono text-[0.625rem] tracking-[0.3em] uppercase text-mark/80 mb-2">{g.title}</p>
                <ul className="space-y-1.5">
                  {g.links.map((l) => {
                    const active = pathname === l.to;
                    return (
                      <li key={l.to}>
                        <Link
                          to={l.to}
                          className={`block font-news text-[0.9375rem] transition-colors duration-300 ${
                            active ? 'text-mark' : 'text-ink hover:text-mark'
                          }`}
                          style={
                            active
                              ? { borderLeft: '1px solid currentColor', paddingLeft: '8px', marginLeft: '-9px' }
                              : undefined
                          }
                        >
                          {l.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="pt-8 mt-8 border-t border-edge">
            <Link
              to="/v3/sitemap"
              className="sanctuary-drawline font-v3mono text-[0.625rem] tracking-[0.3em] uppercase text-char hover:text-mark transition-colors"
            >
              All surfaces
            </Link>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between border-b border-edge px-6 h-[60px] w-full sticky top-0 bg-bone/85 backdrop-blur-[3px] z-20">
          <BreathingMark />
          <Link to="/v3/sitemap" className="sanctuary-drawline font-v3mono text-[0.625rem] tracking-[0.3em] uppercase text-mark">
            Navigate
          </Link>
        </div>

        {/* Main column */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
