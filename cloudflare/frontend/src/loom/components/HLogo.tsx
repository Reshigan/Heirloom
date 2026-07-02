// HLogo — the Sounding mark.
// Concentric depth-rings crossed by one warm surface-line: sounding the depth
// of the family's water. This is the brand's one mark (BRAND.md / favicon.svg);
// it replaces the retired filament-web ("cosmic loom") glyph. The ∞ stays the
// seal glyph on sealed notes; this mark is the identity.
//
// Size API: size='sm'|'md'|'lg' (sm=topbar, md=page, lg=splash).
// `href` renders the whole mark as a STANDOUT BUTTON — a hairline-bordered
// tile that warms on hover/focus — the one always-present way home.
// Legacy numeric sizes and deprecated props (glow, mono, color, wordColor,
// tagline, style) are accepted but silently ignored.

import type React from 'react';
import { Link } from 'react-router-dom';

type SizeToken = 'sm' | 'md' | 'lg';

interface HLogoProps {
  size?: SizeToken | number;
  wordmark?: boolean;
  // When set, the mark becomes the standout home button (hairline tile,
  // warm on hover). When absent, the bare mark renders inline — callers that
  // wrap HLogo in their own <Link> (Join, Frame) stay unaffected.
  href?: string;
  // legacy props — accepted but no longer applied
  tagline?: boolean;
  glow?: boolean;
  mono?: boolean;
  color?: string;
  wordColor?: string;
  style?: React.CSSProperties;
}

// Map legacy numeric sizes to the nearest token
function resolveToken(size: SizeToken | number): SizeToken {
  if (typeof size === 'string') return size;
  if (size <= 16) return 'sm';
  if (size <= 22) return 'md';
  return 'lg';
}

export function HLogo({ size = 'sm', wordmark = true, href }: HLogoProps) {
  const token = resolveToken(size);
  const dim: Record<SizeToken, number> = { sm: 18, md: 24, lg: 36 };
  const d = dim[token];
  const fs: Record<SizeToken, number> = { sm: 10, md: 11, lg: 13 };
  const gap: Record<SizeToken, number> = { sm: 10, md: 12, lg: 16 };

  const mark = (
    <>
      {/* The Sounding mark — geometry matches favicon.svg (rings 6/12/18 in a
          48-box, fading outward; one warm surface-line through the middle). */}
      <svg viewBox="0 0 48 48" width={d} height={d} fill="none" aria-hidden>
        <g stroke="var(--bone)" strokeWidth="3" strokeLinecap="round">
          <circle cx="24" cy="24" r="6" strokeOpacity="0.92" />
          <circle cx="24" cy="24" r="12" strokeOpacity="0.55" />
          <circle cx="24" cy="24" r="18" strokeOpacity="0.28" />
        </g>
        <line x1="4" y1="24" x2="44" y2="24" stroke="var(--warm)" strokeWidth="3.4" strokeLinecap="round" />
      </svg>
      {wordmark && (
        <span style={{
          fontFamily: 'var(--mono)',
          fontSize: fs[token],
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color: 'var(--bone-dim)',
          lineHeight: 1,
        }}>
          Heirloom
        </span>
      )}
    </>
  );

  const rowBase = { alignItems: 'center', gap: gap[token], userSelect: 'none' } as const;

  // With href: the standout home button — a hairline tile that warms on
  // hover/focus (border + wordmark lift). One curve, 180ms, per the motion spec.
  if (href) {
    return (
      <Link
        to={href}
        aria-label="Heirloom — home"
        className="hl-sounding-btn"
        style={{
          display: 'inline-flex',
          textDecoration: 'none',
          color: 'inherit',
          padding: token === 'sm' ? '7px 12px' : '9px 16px',
          border: '1px solid var(--rule)',
          borderRadius: 0,
          minHeight: 44,
          boxSizing: 'border-box',
          transition: 'border-color 180ms var(--ease), background 180ms var(--ease)',
          ...rowBase,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--copper-border, var(--warm))'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--rule)'; }}
      >
        {mark}
      </Link>
    );
  }

  // No href: render exactly as before (display:flex), so callers that wrap
  // externally (Join, Frame) are byte-for-byte unaffected.
  return <div style={{ display: 'flex', ...rowBase }}>{mark}</div>;
}
