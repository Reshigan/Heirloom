import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface BaseProps {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'link';
  className?: string;
}

/**
 * v3 button — three variants:
 *   primary  Solid ink on bone. The single canonical action per surface.
 *   ghost    Hairline ink border. Secondary action.
 *   link     Underlined inline text. Tertiary; treat as prose.
 *
 * Buttons are small and quiet. Type stays the same as body.
 */
export function ButtonV3({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cls(variant) + ' ' + className} {...rest}>
      {children}
    </button>
  );
}

export function LinkV3({
  children,
  to,
  variant = 'link',
  className = '',
}: BaseProps & { to: string }) {
  return (
    <Link to={to} className={cls(variant) + ' ' + className}>
      {children}
    </Link>
  );
}

function cls(variant: 'primary' | 'ghost' | 'link'): string {
  if (variant === 'primary') {
    return 'inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-ink text-bone font-news text-[0.95rem] tracking-[0.005em] hover:bg-mark-deep transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed';
  }
  if (variant === 'ghost') {
    return 'inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-ink text-ink font-news text-[0.95rem] tracking-[0.005em] hover:bg-ink hover:text-bone transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed';
  }
  // link — uses sanctuary-drawline (underline draws in on hover)
  return 'sanctuary-drawline font-news text-mark hover:text-mark-deep transition-colors';
}
