import { useLocation } from 'react-router-dom';
import { BreathingMark } from '../sanctuary/BreathingMark';
import { Drawline } from '../sanctuary/Drawline';

/**
 * Marketing-side nav: visible on the public pages (landing, founder,
 * sign-in/up). Quiet, single-line, breathing-wordmark left, drawn
 * underlines right.
 */
export function MarketingNav() {
  const { pathname } = useLocation();
  const links = [
    { to: '/v3/founder', label: 'Founder' },
    { to: '/v3/login', label: 'Sign in' },
  ];
  return (
    <nav className="border-b border-edge">
      <div className="max-w-[1120px] mx-auto px-6 md:px-10 h-[68px] flex items-center justify-between">
        <BreathingMark to="/v3" />
        <div className="flex items-center gap-8">
          {links.map((l) => (
            <Drawline
              key={l.to}
              to={l.to}
              className={`font-news text-[0.9375rem] ${
                pathname === l.to ? 'text-mark' : 'text-ink hover:text-mark'
              } transition-colors`}
            >
              {l.label}
            </Drawline>
          ))}
        </div>
      </div>
    </nav>
  );
}
