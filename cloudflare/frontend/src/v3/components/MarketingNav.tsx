import { Link, useLocation } from 'react-router-dom';

/**
 * Marketing-side nav: visible on the public pages (landing, founder,
 * sign-in/up). Quiet, single-line, no logo glyph other than the wordmark.
 * The "HEIRLOOM" wordmark is set in mono caps with letterspacing — it
 * looks like a colophon, not a logo.
 */
export function MarketingNav() {
  const { pathname } = useLocation();
  const links: { to: string; label: string }[] = [
    { to: '/v3', label: 'Heirloom' },
    { to: '/v3/founder', label: 'Founder' },
    { to: '/v3/login', label: 'Sign in' },
  ];
  return (
    <nav className="border-b border-edge">
      <div className="max-w-[1120px] mx-auto px-6 md:px-10 h-[68px] flex items-center justify-between">
        <Link to="/v3" className="font-v3mono text-[0.7rem] tracking-[0.34em] uppercase text-ink hover:text-mark transition-colors">
          Heirloom
        </Link>
        <div className="flex items-center gap-8">
          {links.slice(1).map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`font-news text-[0.9375rem] transition-colors ${
                pathname === l.to ? 'text-mark' : 'text-ink hover:text-mark'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
