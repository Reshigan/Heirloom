// HLogo — the Cosmic Loom mark.
// A web of bone filaments converging on one warm node: the smallest honest
// picture of the product — a family's many threads, held by one warm point.
// Beside it the wordmark sits in archival mono, letterspaced like a spine
// label. The ∞ stays the only glyph elsewhere; this mark is thread, not type.
//
// Size API: size='sm'|'md'|'lg' (sm=topbar, md=page, lg=splash).
// Legacy numeric sizes and deprecated props (glow, mono, color, wordColor,
// tagline, style) are accepted but silently ignored; the mark is
// self-contained and theme-aware through the --bone/--warm tokens.

import type React from 'react';
import { Link } from 'react-router-dom';

type SizeToken = 'sm' | 'md' | 'lg';

interface HLogoProps {
  size?: SizeToken | number;
  wordmark?: boolean;
  // When set, the whole mark becomes a router link to this path (e.g. "/").
  // The Link is styled to be visually identical to the bare mark (inline-flex,
  // no underline, inherited color) so the only change is that it's clickable.
  // When absent, the mark renders exactly as before — so callers that wrap
  // HLogo in their own <Link> (Join, Frame) stay unaffected and never double-wrap.
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
  const dims: Record<SizeToken, [number, number]> = { sm: [17, 20], md: [22, 26], lg: [34, 40] };
  const [w, h] = dims[token];
  const fs: Record<SizeToken, number> = { sm: 10, md: 11, lg: 13 };
  const gap: Record<SizeToken, number> = { sm: 10, md: 12, lg: 16 };

  const mark = (
    <>
      <svg viewBox="0 0 24 28" width={w} height={h} fill="none" aria-hidden>
        {/* Eight bone filaments — the family's threads, converging on the node */}
        <g stroke="var(--bone)" strokeOpacity="0.5" strokeWidth="1.3" strokeLinecap="round">
          <line x1="12" y1="3"   x2="12" y2="25" />
          <line x1="2.5" y1="14" x2="21.5" y2="14" />
          <line x1="5" y1="7"    x2="19" y2="21" />
          <line x1="19" y1="7"   x2="5" y2="21" />
        </g>
        {/* The convergence node — the one warm point: glow halo then core */}
        <circle cx="12" cy="14" r="4.4" fill="var(--warm)" fillOpacity="0.22" />
        <circle cx="12" cy="14" r="2.1" fill="var(--warm)" />
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
    </>
  );

  const rowBase = { alignItems: 'center', gap: gap[token], userSelect: 'none' } as const;

  // With href: the whole mark is a router link home. inline-flex + inherited
  // color + no underline keeps it visually identical to the bare mark — this
  // matches how Frame already styles its external <Link> wrapper.
  if (href) {
    return (
      <Link to={href} style={{ display: 'inline-flex', textDecoration: 'none', color: 'inherit', ...rowBase }}>
        {mark}
      </Link>
    );
  }

  // No href: render exactly as before (display:flex), so callers that wrap
  // externally (Join, Frame) are byte-for-byte unaffected.
  return <div style={{ display: 'flex', ...rowBase }}>{mark}</div>;
}
