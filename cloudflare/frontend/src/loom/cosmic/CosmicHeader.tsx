import type { CSSProperties, ReactNode } from 'react';

/**
 * CosmicHeader — the page header chrome. A mono uppercase eyebrow, a
 * Source Serif 4 display title (the hero, §1), and an optional one-line italic
 * subhead. Replaces the bespoke per-page headers so every room opens the same.
 */
export function CosmicHeader({
  eyebrow,
  title,
  sub,
  align = 'left',
  className = '',
  style,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  style?: CSSProperties;
  /** trailing slot (actions) rendered under the subhead */
  children?: ReactNode;
}) {
  return (
    <header
      className={className}
      style={{ textAlign: align, marginBottom: 'clamp(28px, 5vw, 52px)', ...style }}
    >
      {eyebrow && <div className="cosmic-eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>}
      <h1 className="cosmic-title" style={{ fontSize: 'clamp(28px, 5vw, 44px)' }}>{title}</h1>
      {sub && (
        <p
          className="cosmic-sub"
          style={{ fontSize: 'clamp(15px, 2.4vw, 18px)', marginTop: 12, maxWidth: '52ch', marginInline: align === 'center' ? 'auto' : undefined }}
        >
          {sub}
        </p>
      )}
      {children}
    </header>
  );
}
