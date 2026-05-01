import type { ReactNode, AnchorHTMLAttributes } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Drawline — a link whose underline draws itself on hover.
 *
 * Uses the .sanctuary-drawline pseudo-element so the underline scales
 * from the left rather than appearing all at once. The active page
 * keeps the underline on (.is-active class).
 */
interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to?: string;
  href?: string;
  children: ReactNode;
  /** When true, the underline stays visible (active page state). */
  active?: boolean;
  className?: string;
}

export function Drawline({ to, href, children, active, className = '', ...rest }: Props) {
  const { pathname } = useLocation();
  const isActive = active ?? (to ? pathname === to : false);
  const cls = `sanctuary-drawline ${isActive ? 'is-active' : ''} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} {...rest}>
      {children}
    </a>
  );
}
