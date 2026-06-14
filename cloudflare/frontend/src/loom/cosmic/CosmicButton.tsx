import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'ghost' | 'text';

/**
 * CosmicButton — primary is a warm hairline outline that fills with warm-glow
 * on hover (keeps warm < 3% surface, §2; never a solid warm slab). Ghost is a
 * bone hairline; text is a bare bone link. Renders as a router Link when `to`
 * is given, else a native button.
 */
export function CosmicButton({
  variant = 'ghost',
  to,
  className = '',
  style,
  children,
  ...rest
}: {
  variant?: Variant;
  to?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = ['cosmic-btn', `cosmic-btn--${variant}`, className].filter(Boolean).join(' ');
  if (to) {
    return (
      <Link to={to} className={cls} style={{ display: 'inline-block', textDecoration: 'none', ...style }}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} style={style} {...rest}>
      {children}
    </button>
  );
}
