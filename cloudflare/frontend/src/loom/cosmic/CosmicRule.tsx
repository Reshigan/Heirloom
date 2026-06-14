import type { CSSProperties } from 'react';

/**
 * CosmicRule — a filament divider. A single bone hairline; with `node`, a faint
 * wax knot rests at its centre, the way a sealed thread ties off in the web.
 */
export function CosmicRule({
  node = false,
  className = '',
  style,
}: {
  node?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const cls = ['cosmic-rule', node && 'cosmic-rule--node', className].filter(Boolean).join(' ');
  return <hr aria-hidden className={cls} style={{ margin: '28px 0', ...style }} />;
}
