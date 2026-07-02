// Verb — the Open-Water action language (the Descent's handwriting), shared.
// An action is not a boxed control on the water: it is a verb written in the
// hand voice — italic display serif, copper for the primary act, faint bone
// for the quiet alternative — optionally led by the breathing drop-point.
// 44px min target; focus ring comes from the global .loom button rule.
import type { ReactNode, CSSProperties } from 'react';
import { Link } from 'react-router-dom';

interface VerbProps {
  children: ReactNode;
  onClick?: () => void;
  to?: string;
  /** Lead with the breathing drop-point (the capture/primary act). */
  drop?: boolean;
  /** The quiet alternative: faint bone, body-serif size. */
  quiet?: boolean;
  size?: number;
  style?: CSSProperties;
}

export function Verb({ children, onClick, to, drop, quiet, size, style }: VerbProps) {
  const fs = size ?? (quiet ? 16 : 21);
  const inner = (
    <>
      {drop && (
        <span aria-hidden className="hl-drop-breathe" style={{
          width: 10, height: 10, borderRadius: '50%', background: 'var(--warm)', flex: 'none',
        }} />
      )}
      <span style={{
        fontFamily: quiet ? 'var(--serif)' : 'var(--serif-display)',
        fontStyle: 'italic',
        fontWeight: quiet ? 300 : 360,
        fontSize: fs,
        lineHeight: 1.2,
        color: quiet ? 'var(--bone-faint)' : 'var(--warm)',
        transition: 'color 180ms var(--ease)',
      }}>
        {children}
      </span>
    </>
  );
  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 14,
    background: 'transparent', border: 0, padding: '8px 0', minHeight: 44,
    cursor: 'pointer', textDecoration: 'none', ...style,
  };
  const warmUp = (e: React.MouseEvent<HTMLElement>) => {
    const t = e.currentTarget.querySelector('span:last-child') as HTMLElement | null;
    if (t) t.style.color = quiet ? 'var(--bone-dim)' : 'var(--warm-bright, var(--warm))';
  };
  const warmDown = (e: React.MouseEvent<HTMLElement>) => {
    const t = e.currentTarget.querySelector('span:last-child') as HTMLElement | null;
    if (t) t.style.color = quiet ? 'var(--bone-faint)' : 'var(--warm)';
  };
  if (to) {
    return <Link to={to} style={base} onMouseEnter={warmUp} onMouseLeave={warmDown}>{inner}</Link>;
  }
  return (
    <button type="button" onClick={onClick} style={base} onMouseEnter={warmUp} onMouseLeave={warmDown}>
      {inner}
    </button>
  );
}
