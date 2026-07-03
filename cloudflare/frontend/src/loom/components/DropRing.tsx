// DropRing — the voice act drawn in the brand's hand. Not the logo pasted
// into a button: the same brushed gesture that made the mark, applied to the
// ring itself. Two circles with an offset centre (fill-rule evenodd) give one
// stroke that swells from a hairline at ten o'clock to a full brush at four —
// an ensō laid on the water, with the verb resting inside it.
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
        position: 'relative',
        width: size, height: size, borderRadius: '50%',
        border: 0, background: 'transparent',
        color: 'var(--warm)', cursor: 'pointer', padding: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'color 360ms var(--ease)',
        ...style,
      }}
    >
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden
        style={{ position: 'absolute', inset: 0 }}>
        <path fill="currentColor" fillRule="evenodd" d="
          M24 2.8 a21.2 21.2 0 1 0 0.02 0 Z
          M24.55 3.9 a20.05 20.05 0 1 1 -0.02 0 Z" />
      </svg>
      <span style={{ fontFamily: 'var(--serif)', fontSize: Math.round(size * 0.135), fontStyle: 'italic', fontWeight: 300, lineHeight: 1 }}>
        {label}
      </span>
    </button>
  );
}
