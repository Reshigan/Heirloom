// HLogo — Woven-H Thread Mark
// The mark is two vertical warp threads (bone) with one weft thread (warm)
// crossing over the left warp and under the right warp — the over/under
// weaving effect implied by SVG draw order.
//
// New size API: size='sm'|'md'|'lg' (sm=topbar, md=page, lg=splash)
// Legacy size API: size={number} — still accepted for backward compatibility.
// Deprecated props (glow, mono, color, wordColor, tagline, style) are
// accepted but silently ignored; the new mark is self-contained.

type SizeToken = 'sm' | 'md' | 'lg';

interface HLogoProps {
  size?: SizeToken | number;
  wordmark?: boolean;
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

import type React from 'react';

export function HLogo({ size = 'sm', wordmark = true }: HLogoProps) {
  const token = resolveToken(size);
  const dims: Record<SizeToken, [number, number]> = { sm: [16, 19], md: [20, 24], lg: [32, 38] };
  const [w, h] = dims[token];
  const fs: Record<SizeToken, number> = { sm: 16, md: 20, lg: 28 };
  const gap: Record<SizeToken, number> = { sm: 8, md: 10, lg: 14 };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: gap[token], userSelect: 'none' }}>
      <svg
        viewBox="0 0 24 28"
        width={w}
        height={h}
        fill="none"
        aria-hidden
      >
        {/* Left warp */}
        <line x1="4" y1="2" x2="4" y2="26" stroke="rgba(244,236,216,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Right warp */}
        <line x1="20" y1="2" x2="20" y2="26" stroke="rgba(244,236,216,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Weft thread (over left, under right) */}
        <line x1="0" y1="14" x2="24" y2="14" stroke="#b07a4a" strokeWidth="2" strokeLinecap="round"/>
        {/* Overdraw right warp at crossing → weft goes under */}
        <line x1="20" y1="11" x2="20" y2="17" stroke="rgba(244,236,216,0.5)" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      {wordmark && (
        <span style={{
          fontFamily: '"Source Serif 4", Georgia, serif',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: fs[token],
          color: '#b07a4a',
          lineHeight: 1,
          letterSpacing: '-0.01em',
        }}>
          Heirloom
        </span>
      )}
    </div>
  );
}
