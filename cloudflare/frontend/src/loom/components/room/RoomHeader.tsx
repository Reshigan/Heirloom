import type { ReactNode } from 'react';

/**
 * RoomHeader — the single header pattern for every screen.
 * Mono uppercase eyebrow → Cormorant title → optional dim lede.
 * Left-aligned, uses the page-pad tokens. No icons, no rules of its own.
 */
export interface RoomHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  /** Tint the eyebrow warm (e.g. role/state emphasis). Default faint bone. */
  warmEyebrow?: boolean;
  className?: string;
}

export function RoomHeader({ eyebrow, title, lede, warmEyebrow, className }: RoomHeaderProps) {
  return (
    <header className={className} style={{ display: 'grid', gap: 14 }}>
      {eyebrow != null && (
        <span
          className="hl-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: warmEyebrow ? 'var(--warm)' : 'var(--bone-faint)',
          }}
        >
          {eyebrow}
        </span>
      )}
      <h1
        className="hl-serif hl-tight"
        style={{
          margin: 0,
          fontWeight: 300,
          fontSize: 'clamp(24px, 6vw, 34px)',
          lineHeight: 1.15,
          color: 'var(--bone)',
        }}
      >
        {title}
      </h1>
      {lede != null && (
        <p
          className="hl-serif"
          style={{
            margin: 0,
            fontWeight: 300,
            fontSize: 'clamp(14px, 4vw, 16px)',
            lineHeight: 1.68,
            color: 'var(--bone-dim)',
            maxWidth: '46ch',
          }}
        >
          {lede}
        </p>
      )}
    </header>
  );
}

export default RoomHeader;
