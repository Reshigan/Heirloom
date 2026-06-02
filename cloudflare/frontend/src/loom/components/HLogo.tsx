import type { CSSProperties } from 'react';

// Heirloom logo mark — tapestry cloth with ∞ cutout (matches favicon/PWA icon).
// The icon.svg is used for the mark on all surfaces for pixel-perfect consistency.
//
// Usage:
//   <HLogo />                   — mark only, 22px
//   <HLogo wordmark />          — mark + "Heirloom" in Source Serif 4
//   <HLogo size={56} />         — large mark (hero/splash)
//
// Legacy props (glow, mono, color) are accepted but no longer applied to the
// mark — the tapestry icon is self-contained. wordColor still controls the
// wordmark text colour.

interface HLogoProps {
  size?: number;
  wordmark?: boolean;
  tagline?: boolean;
  /** @deprecated mark colour is built into the icon */
  glow?: boolean;
  /** @deprecated mark colour is built into the icon */
  mono?: boolean;
  /** @deprecated mark colour is built into the icon */
  color?: string;
  wordColor?: string;
  style?: CSSProperties;
}

export function HLogo({
  size = 22,
  wordmark = false,
  tagline = false,
  wordColor,
  style = {},
}: HLogoProps) {
  const fontSize  = Math.round(size * 0.95);
  const textColor = wordColor ?? '#d4b86a';

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
      <img
        src="/icon.svg"
        alt="Heirloom"
        width={size}
        height={size}
        style={{ display: 'block', flexShrink: 0, borderRadius: 0 }}
      />

      {wordmark && (
        <span
          style={{
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize,
            letterSpacing: '0.18em',
            color: textColor,
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
