// HLogo — the Drop.
// A swelling waterline, the heirloom just beneath it, ripples opening below:
// something precious just went in. The brand's one mark (brand/mark/
// heirloom-drop-*.svg); the ripple on every page foot is this mark come alive.
//
// Size API: size='sm'|'md'|'lg' (sm=topbar, md=page, lg=splash).
// `href` renders the mark as the always-present way home — floating bare on
// the water (the tile border was retired; nothing on the surface is boxed).
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
      <svg viewBox="0 0 48 48" width={d} height={d} fill="none" aria-hidden>
        {/* The Drop: swelling waterline, the heirloom beneath, ripples opening */}
        <path d="M4 13.9 C 15 11.9, 29 15.3, 44 13 C 30 16.3, 15 14, 4 15 Z" fill="var(--warm)" />
        <path d="M23.6 24.9 C 26.8 24.8, 28.7 27.2, 28.2 30 C 27.8 32.6, 25.2 34.1, 22.8 33.4 C 20.5 32.7, 19.5 30.3, 20.3 27.9 C 21 26, 22.2 25.1, 23.6 24.9 Z" fill="var(--warm)" />
        <path d="M10 31.4 C 14.5 41.2, 33.5 41.9, 38.4 30.7 C 33.5 40.2, 14.5 40.2, 10 31.4 Z" fill="var(--bone)" fillOpacity="0.55" />
        <path d="M5 32.4 C 10 45.4, 38 46.2, 43.3 31.6 C 38 43.7, 11 44.2, 5 32.4 Z" fill="var(--bone)" fillOpacity="0.2" />
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
          // the mark floats bare on the water — no tile, no box; hover warms
          // the wordmark instead of a border
          padding: token === 'sm' ? '7px 2px' : '9px 4px',
          minHeight: 44,
          boxSizing: 'border-box',
          ...rowBase,
        }}
      >
        {mark}
      </Link>
    );
  }

  // No href: render exactly as before (display:flex), so callers that wrap
  // externally (Join, Frame) are byte-for-byte unaffected.
  return <div style={{ display: 'flex', ...rowBase }}>{mark}</div>;
}
