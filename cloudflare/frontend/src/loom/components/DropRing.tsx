// DropRing — the voice act wearing the brand mark. A thin accent ring holding
// the Drop's own geometry (the swelling waterline, the drop, the tapered
// ripple crescent) with the verb beneath — the capture buttons and the icon
// become one design. Colors ride the accent; the crescent stays bone.
import type { CSSProperties } from 'react';

export function DropRing({
  label,
  onClick,
  size = 148,
  ariaLabel,
  style,
}: {
  label: string;
  onClick: () => void;
  size?: number;
  ariaLabel?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className="hl-drop-breathe--soft"
      style={{
        width: size, height: size, borderRadius: '50%',
        border: '1px solid var(--warm)', background: 'transparent',
        color: 'var(--warm)', cursor: 'pointer',
        display: 'inline-flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: size * 0.04,
        transition: 'border-color 360ms var(--ease), color 360ms var(--ease)',
        ...style,
      }}
    >
      <svg viewBox="0 0 48 48" width={size * 0.42} height={size * 0.42} fill="none" aria-hidden>
        <path d="M4 13.9 C 15 11.9, 29 15.3, 44 13 C 30 16.3, 15 14, 4 15 Z" fill="currentColor" />
        <path d="M23.6 24.9 C 26.8 24.8, 28.7 27.2, 28.2 30 C 27.8 32.6, 25.2 34.1, 22.8 33.4 C 20.5 32.7, 19.5 30.3, 20.3 27.9 C 21 26, 22.2 25.1, 23.6 24.9 Z" fill="currentColor" />
        <path d="M10 31.4 C 14.5 41.2, 33.5 41.9, 38.4 30.7 C 33.5 40.2, 14.5 40.2, 10 31.4 Z" fill="rgba(242,230,208,0.55)" />
      </svg>
      <span style={{ fontFamily: 'var(--serif)', fontSize: Math.round(size * 0.115), fontStyle: 'italic', lineHeight: 1 }}>
        {label}
      </span>
    </button>
  );
}
