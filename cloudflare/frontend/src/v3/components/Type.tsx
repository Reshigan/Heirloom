import type { ReactNode, CSSProperties } from 'react';

/**
 * Eyebrow — uppercase, mono, locked tracking. The marker for "what
 * kind of section this is." Use sparingly; one per section, never more.
 */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`font-v3mono text-[0.6875rem] tracking-[0.32em] uppercase text-mark ${className}`}
    >
      {children}
    </p>
  );
}

/** Rule — a single hairline. The default divider in v3. */
export function Rule({ className = '' }: { className?: string }) {
  return <hr className={`border-0 border-t border-edge ${className}`} />;
}

/**
 * Display headline. Render at the size the page calls for; the component
 * just enforces the type face, leading, kerning, and balance.
 */
export function Display({
  children,
  size = 2,
  className = '',
  style,
}: {
  children: ReactNode;
  size?: 1 | 2 | 3;
  className?: string;
  style?: CSSProperties;
}) {
  const sizeClass =
    size === 1
      ? 'text-[clamp(3rem,7vw,5.5rem)] leading-[1.0] tracking-[-0.022em]'
      : size === 2
        ? 'text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] tracking-[-0.018em]'
        : 'text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] tracking-[-0.014em]';
  return (
    <h1 className={`font-news font-light text-ink ${sizeClass} ${className}`} style={{ textWrap: 'balance', ...style }}>
      {children}
    </h1>
  );
}

/** Body copy at reading-column size. Italics work; bold doesn't. */
export function Body({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-news text-[1.0625rem] leading-[1.65] text-ink ${className}`}>
      {children}
    </p>
  );
}

/** Reading column body — the larger comfortable size for long-form prose. */
export function ReadingBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-news text-[1.375rem] leading-[1.65] text-ink ${className}`} style={{ hyphens: 'auto' }}>
      {children}
    </p>
  );
}

/** Caption — italics, char color, used for picture credits, dates, marginalia. */
export function Caption({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-news italic text-[0.9375rem] leading-[1.5] text-char ${className}`}>{children}</p>
  );
}
