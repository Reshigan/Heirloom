import { useMemo } from 'react';

// Exact port of heirloom-logo.jsx from the Claude Design handoff.
// Gold gradient + soft glow filter on the infinity path.
// Usage:
//   <HLogo />                   — glyph only, 22px default
//   <HLogo wordmark />          — glyph + "Heirloom" in Source Serif 4
//   <HLogo mono color="..." />  — solid colour, no gradient

interface HLogoProps {
  size?: number;
  wordmark?: boolean;
  tagline?: boolean;
  glow?: boolean;
  mono?: boolean;
  color?: string;
  wordColor?: string;
  style?: React.CSSProperties;
}

export function HLogo({
  size = 22,
  wordmark = false,
  tagline = false,
  glow = true,
  mono = false,
  color,
  wordColor,
  style = {},
}: HLogoProps) {
  // Unique IDs so multiple lockups on the same page don't share defs.
  const gid = useMemo(() => 'hl-g-' + Math.random().toString(36).slice(2, 9), []);
  const fid = useMemo(() => 'hl-f-' + Math.random().toString(36).slice(2, 9), []);

  const fill = mono ? (color ?? 'currentColor') : `url(#${gid})`;
  const wc = wordColor ?? (mono ? 'currentColor' : '#d4b86a');
  const fontSize = Math.round(size * 0.95);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.max(8, size * 0.45),
        lineHeight: 1,
        ...style,
      }}
    >
      <svg
        width={size * 1.6}
        height={size}
        viewBox="0 0 480 280"
        style={{ display: 'block', overflow: 'visible' }}
        aria-hidden
      >
        <defs>
          {!mono && (
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#f0d78c" />
              <stop offset="50%"  stopColor="#c9a959" />
              <stop offset="100%" stopColor="#a08335" />
            </linearGradient>
          )}
          {glow && !mono && (
            <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={4} result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>
        <g filter={glow && !mono ? `url(#${fid})` : undefined}>
          <path
            d="M50 140 C50 90 90 50 150 50 C190 50 220 70 240 100 C260 70 290 50 330 50
               C390 50 430 90 430 140 C430 190 390 230 330 230 C290 230 260 210 240 180
               C220 210 190 230 150 230 C90 230 50 190 50 140 Z"
            fill="none"
            stroke={fill}
            strokeWidth={mono ? 22 : 30}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {wordmark && (
        <span
          style={{
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize,
            letterSpacing: '0.18em',
            color: wc,
            textTransform: 'none',
            fontVariationSettings: '"opsz" 24',
          }}
        >
          Heirloom
        </span>
      )}

      {tagline && (
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: Math.max(9, fontSize * 0.42),
            color: 'var(--bone-faint)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            paddingLeft: 12,
            borderLeft: '1px solid var(--rule)',
          }}
        >
          the family thread
        </span>
      )}
    </span>
  );
}
