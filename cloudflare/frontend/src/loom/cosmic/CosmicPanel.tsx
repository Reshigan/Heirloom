import type { CSSProperties, ElementType, ReactNode } from 'react';

/**
 * CosmicPanel — the floating container of the Cosmic Loom. A translucent-ink
 * surface with a 1px luminous edge and an outer warm glow, so it reads as
 * adrift in the filament web behind it. NEVER backdrop-filter / frosted glass
 * (ART_DIRECTION §2.6) — the float is built from edge + glow alone.
 *
 * The replacement for ad-hoc `bg-*` card divs across the app.
 */
export function CosmicPanel({
  as: Tag = 'div',
  interactive = false,
  solid = false,
  padded = true,
  className = '',
  style,
  children,
  ...rest
}: {
  as?: ElementType;
  /** edge + glow warm on hover (use for clickable panels) */
  interactive?: boolean;
  /** opaque reading surface for dense prose/forms */
  solid?: boolean;
  /** default inner padding (clamped, generous negative space) */
  padded?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  [key: string]: unknown;
}) {
  const cls = [
    'cosmic-panel',
    solid && 'cosmic-panel--solid',
    interactive && 'cosmic-panel--interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag
      className={cls}
      style={{ padding: padded ? 'clamp(20px, 4vw, 36px)' : undefined, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
