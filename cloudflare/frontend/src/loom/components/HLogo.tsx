// HLogo — the woven mark.
// Two warp threads (bone) crossed by one weft thread (warm): the smallest
// honest picture of the product — a family's threads, held by one warm one.
// Beside it the wordmark sits in archival mono, letterspaced like a spine
// label. The ∞ stays the only glyph elsewhere; this mark is thread, not type.
//
// Size API: size='sm'|'md'|'lg' (sm=topbar, md=page, lg=splash).
// Legacy numeric sizes and deprecated props (glow, mono, color, wordColor,
// tagline, style) are accepted but silently ignored; the mark is
// self-contained and theme-aware through the --bone/--warm tokens.

import type React from 'react';

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

export function HLogo({ size = 'sm', wordmark = true }: HLogoProps) {
  const token = resolveToken(size);
  const dims: Record<SizeToken, [number, number]> = { sm: [17, 20], md: [22, 26], lg: [34, 40] };
  const [w, h] = dims[token];
  const fs: Record<SizeToken, number> = { sm: 10, md: 11, lg: 13 };
  const gap: Record<SizeToken, number> = { sm: 10, md: 12, lg: 16 };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: gap[token], userSelect: 'none' }}>
      <svg viewBox="0 0 24 28" width={w} height={h} fill="none" aria-hidden>
        {/* Warp pair — the family's standing threads */}
        <line x1="8" y1="2" x2="8" y2="26" stroke="var(--bone)" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="2" x2="16" y2="26" stroke="var(--bone)" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
        {/* Weft — today's thread, over the left warp, under the right */}
        <line x1="1" y1="14" x2="23" y2="14" stroke="var(--warm)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Overdraw right warp at the crossing → the weft passes under */}
        <line x1="16" y1="10.5" x2="16" y2="17.5" stroke="var(--bone)" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {wordmark && (
        <span style={{
          fontFamily: 'var(--mono)',
          fontSize: fs[token],
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
          lineHeight: 1,
        }}>
          Heirloom
        </span>
      )}
    </div>
  );
}
