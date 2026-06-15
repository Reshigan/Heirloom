import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * RoomRow — the Thread/List atom. One hairline row: a 6px dye dot (glow),
 * a serif title, and mono meta on the right. The dye is signal only —
 * a `--dye-<key>` CSS var, never a background fill. 44px min touch target.
 */
export interface RoomRowProps {
  /** Dye key (e.g. 'madder'); resolves to `--dye-<dye>`, falls back to warm. */
  dye?: string;
  title: ReactNode;
  meta?: ReactNode;
  href: string;
  className?: string;
}

export function RoomRow({ dye, title, meta, href, className }: RoomRowProps) {
  const dot = dye ? `var(--dye-${dye}, var(--warm))` : 'var(--warm)';
  return (
    <Link
      to={href}
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'baseline',
        columnGap: 12,
        textDecoration: 'none',
        padding: '11px 0',
        minHeight: 44,
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          alignSelf: 'center',
          background: dot,
          boxShadow: `0 0 8px ${dot}`,
        }}
      />
      <span
        className="hl-serif"
        style={{
          fontSize: 'clamp(15px, 4vw, 17px)',
          fontWeight: 300,
          color: 'var(--bone)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </span>
      {meta != null && (
        <span
          className="hl-mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textAlign: 'right',
          }}
        >
          {meta}
        </span>
      )}
    </Link>
  );
}

export default RoomRow;
