import type { ReactNode } from 'react';

/**
 * RoomSection — a vertical-rhythm block with a hairline top divider and an
 * optional mono micro-label. No cards, no boxes — structure by hairline only.
 */
export interface RoomSectionProps {
  label?: ReactNode;
  children: ReactNode;
  /** Omit the top hairline (first section under a RoomHeader). */
  flush?: boolean;
  className?: string;
}

export function RoomSection({ label, children, flush, className }: RoomSectionProps) {
  return (
    <section
      className={className}
      style={{
        borderTop: flush ? 'none' : '1px solid var(--rule)',
        paddingTop: flush ? 0 : 20,
        marginTop: flush ? 0 : 24,
        display: 'grid',
        gap: 14,
      }}
    >
      {label != null && (
        <span
          className="hl-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.30em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}
        >
          {label}
        </span>
      )}
      {children}
    </section>
  );
}

export default RoomSection;
