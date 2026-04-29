/** @type {import('tailwindcss').Config} */
//
// Heirloom design system — sculpted, not templated. See /THREAD.md UI section.
//
// Token names (void / paper / gold / blood) are kept for backwards compat
// with existing components, but the values have been reworked toward the
// new editorial palette: warm near-black, warm cream, sealing-wax accent,
// muted blood.

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Page surfaces. Warm near-black, not pure black — feels like an
        // actual object rather than a UI.
        void: {
          DEFAULT: '#0e0e0c',
          deep: '#0a0a08',
          light: '#15151a',
        },
        // Text + cream accent. Slightly warmer than the prior palette.
        paper: {
          DEFAULT: '#f4ecd8',
          warm: '#faf3e3',
          aged: '#e6dcc4',
        },
        // Single hot accent. Sealing-wax terra-cotta, replaces the old
        // bright gold. Used SPARINGLY — at most 3% of any surface.
        gold: {
          DEFAULT: '#b07a4a',
          bright: '#cf935a',
          dim: '#8c5a30',
        },
        // Muted blood. Used only for destructive intent (errors, delete
        // confirmations). Should appear once or twice in the whole app.
        blood: {
          DEFAULT: '#7a3038',
          light: '#94404a',
        },
        // Hairline borders + dividers.
        rule: {
          DEFAULT: 'rgba(244,236,216,0.10)',
          strong: 'rgba(244,236,216,0.22)',
        },
        sanctuary: {
          blue: '#1a2a3a',
          teal: '#1a3a3a',
        },
        ink: '#0e0e0c',

        status: {
          success: {
            DEFAULT: '#62a36a',
            light: 'rgba(98,163,106,0.10)',
            border: 'rgba(98,163,106,0.28)',
          },
          warning: {
            DEFAULT: '#c19248',
            light: 'rgba(193,146,72,0.10)',
            border: 'rgba(193,146,72,0.28)',
          },
          error: {
            DEFAULT: '#a3414a',
            light: 'rgba(163,65,74,0.10)',
            border: 'rgba(163,65,74,0.28)',
          },
          info: {
            DEFAULT: '#5b7d99',
            light: 'rgba(91,125,153,0.10)',
            border: 'rgba(91,125,153,0.28)',
          },
        },

        glass: {
          bg: 'rgba(15,15,13,0.7)',
          border: 'rgba(244,236,216,0.10)',
          highlight: 'rgba(244,236,216,0.04)',
        },
      },
      fontFamily: {
        // Single editorial serif system. Newsreader has optical sizes
        // 6..72 — no separate display family needed.
        serif: ['Newsreader', 'Source Serif Pro', 'Georgia', 'serif'],
        display: ['Newsreader', 'Source Serif Pro', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        // Legacy: Caveat removed. If a leaf component still references
        // font-handwritten it'll fall back to serif.
        handwritten: ['Newsreader', 'Georgia', 'serif'],
      },
      fontSize: {
        // Editorial scale — bigger headlines, more comfortable body.
        'display-2xl': ['clamp(3.5rem, 7vw, 5.5rem)', { lineHeight: '1.04', letterSpacing: '-0.025em' }],
        'display-xl': ['clamp(2.75rem, 5.5vw, 4.25rem)', { lineHeight: '1.06', letterSpacing: '-0.022em' }],
        'display-lg': ['clamp(2.25rem, 4vw, 3.25rem)', { lineHeight: '1.1', letterSpacing: '-0.018em' }],
        'display-md': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.012em' }],
        'display-sm': ['1.625rem', { lineHeight: '1.25', letterSpacing: '-0.008em' }],
        'body-xl': ['1.25rem', { lineHeight: '1.65' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7' }],
        'body-md': ['1rem', { lineHeight: '1.7' }],
        'body-sm': ['0.875rem', { lineHeight: '1.55' }],
        'body-xs': ['0.78rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],
        // Eyebrow / signature marks.
        'mark': ['0.7rem', { lineHeight: '1', letterSpacing: '0.32em' }],
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.23, 1, 0.32, 1)',
        ceremonial: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        // Used by the time-lock seal — soft inhale/exhale at 8s, much
        // calmer than the old 2s glow.
        'breathe': 'breathe 8s ease-in-out infinite',
        // Used when an entry first appears on the timeline.
        'rise': 'rise 800ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        // Editorial measure for prose readability.
        'prose': '64ch',
        'measure': '76ch',
      },
      maxWidth: {
        'prose': '64ch',
        'measure': '76ch',
      },
      minWidth: {
        'touch': '44px',
      },
      minHeight: {
        'touch': '44px',
      },
      backdropBlur: {
        'glass': '12px',
      },
      boxShadow: {
        'glass': 'none',
        'glass-sm': 'none',
        'glow-gold': 'none',
        'glow-blood': 'none',
        'rule': 'inset 0 -1px 0 rgba(244,236,216,0.10)',
        'seal': '0 0 0 1px rgba(176,122,74,0.4), 0 12px 32px -16px rgba(176,122,74,0.5)',
      },
      borderRadius: {
        // Tighter, more architectural. Cards sit on the page; they don't
        // float in space.
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
};
