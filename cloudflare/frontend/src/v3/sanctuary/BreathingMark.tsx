import { Link } from 'react-router-dom';

/**
 * BreathingMark — the wordmark with an 8-second breath cycle.
 *
 * A single span styled as the colophon (mono caps, 0.34em tracking)
 * with a gentle scale + opacity loop. The motion is small enough not
 * to be distracting; large enough to register as alive.
 */
export function BreathingMark({ to = '/v3', className = '' }: { to?: string; className?: string }) {
  return (
    <Link
      to={to}
      className={`font-v3mono text-[0.7rem] tracking-[0.34em] uppercase text-ink hover:text-mark transition-colors ${className}`}
    >
      <span className="sanctuary-breath inline-block">Heirloom</span>
    </Link>
  );
}
