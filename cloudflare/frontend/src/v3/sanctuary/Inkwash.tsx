import type { ReactNode } from 'react';

/**
 * Inkwash — line-by-line text reveal on mount.
 *
 * Wraps each line in an animated span. Lines fade up with a small
 * vertical translate and a brief blur, like ink soaking through paper.
 *
 * The component accepts either:
 *   - children: ReactNode[]                    (each child = one line)
 *   - text: string with " · " or "\n" separators (for one-line headlines
 *     that should stage as a single fade)
 *
 * The animation runs once on mount; it's set in CSS so it honours
 * prefers-reduced-motion automatically (see sanctuary.css).
 */
interface Props {
  children?: ReactNode;
  /** Plain string content — split on \n into lines. */
  text?: string;
  /** Stagger delay multiplier per line. Defaults to one stagger step (80ms). */
  delay?: number;
  className?: string;
}

export function Inkwash({ children, text, delay = 0, className = '' }: Props) {
  if (text) {
    const lines = text.split('\n');
    return (
      <span className={`sanctuary-inkwash ${className}`}>
        {lines.map((line, i) => (
          <span
            key={i}
            className="sanctuary-inkwash-line"
            style={{ ['--i' as string]: i + delay } as React.CSSProperties}
          >
            {line}
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className={`sanctuary-inkwash ${className}`}>
      <span
        className="sanctuary-inkwash-line"
        style={{ ['--i' as string]: delay } as React.CSSProperties}
      >
        {children}
      </span>
    </span>
  );
}
