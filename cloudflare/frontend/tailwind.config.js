/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // INK — the ground (remapped from the legacy "void" tokens so every
        // bg-void/text-void utility across the app now resolves to the
        // Claude Design ink ramp). ink #0e0e0c on bone #f4ecd8.
        void: {
          abyss: '#0a0a08',
          deep: '#0a0a08',
          DEFAULT: '#0e0e0c',
          surface: '#141412',
          elevated: '#1a1a17',
          hover: '#201f1c',
        },
        // BONE — the cloth (remapped from legacy "paper"). #f4ecd8.
        paper: {
          DEFAULT: '#f4ecd8',
          bright: '#faf6ee',
          dim: 'rgba(244, 236, 216, 0.55)',
          muted: 'rgba(244, 236, 216, 0.40)',
          90: 'rgba(244, 236, 216, 0.9)',
          70: 'rgba(244, 236, 216, 0.7)',
          65: 'rgba(244, 236, 216, 0.65)',
          60: 'rgba(244, 236, 216, 0.6)',
          50: 'rgba(244, 236, 216, 0.5)',
          30: 'rgba(244, 236, 216, 0.32)',
          15: 'rgba(244, 236, 216, 0.18)',
          '08': 'rgba(244, 236, 216, 0.08)',
          '04': 'rgba(244, 236, 216, 0.05)',
          '02': 'rgba(244, 236, 216, 0.03)',
        },
        // WARM — the single emotional accent (sealing-wax). Remapped from the
        // legacy bright "gold" to warm #b07a4a so the whole app speaks the
        // one accent color. Used at <3% surface area per the constitution.
        gold: {
          DEFAULT: '#b07a4a',
          light: '#cf935a',
          bright: '#cf935a',
          dim: '#8c5a30',
          deep: '#6b4524',
          40: 'rgba(176, 122, 74, 0.4)',
          20: 'rgba(176, 122, 74, 0.2)',
          10: 'rgba(176, 122, 74, 0.1)',
          '05': 'rgba(176, 122, 74, 0.05)',
        },
        // BLOOD — retained only for destructive/record states, retuned to the
        // dye-madder family so it sits inside the natural-dye world.
        blood: {
          DEFAULT: '#9f3a2a',
          light: '#b14a4a',
          glow: 'rgba(159, 58, 42, 0.4)',
        },
        // STATUS COLORS
        emerald: '#5ab88a',
        sapphire: '#64a0dc',

        // ── v3 design tokens (light-mode-first; library, not vault) ──
        // See cloudflare/frontend/src/v3/DESIGN.md for rationale.
        bone: {
          DEFAULT: '#f4ecd8',
          2: '#f0e8d4',
        },
        ink: '#0e0e0c',
        char: 'rgba(244, 236, 216, 0.55)',
        edge: 'rgba(244, 236, 216, 0.14)',
        mark: {
          DEFAULT: '#b07a4a',
          deep: '#8c5a30',
          tint: '#cf935a',
        },
        'blood-v3': '#9f3a2a',

        // ── Loom design tokens (vault dark + paper light, theme-driven) ──
        // The product is a perpetual family loom. The AI is the invisible
        // shuttle. The single accent is warm — the warmth of a sealed letter
        // by lamplight. See cloudflare/frontend/src/loom/DESIGN.md.
        // We deliberately use CSS variables (set per-theme in loom.css) so
        // a single set of utility classes covers both vault and paper.
        loom: {
          ink: 'var(--loom-ink)',
          'ink-card': 'var(--loom-ink-card)',
          bone: 'var(--loom-bone)',
          'bone-dim': 'var(--loom-bone-dim)',
          'bone-faint': 'var(--loom-bone-faint)',
          'bone-ghost': 'var(--loom-bone-ghost)',
          rule: 'var(--loom-rule)',
          'rule-warm': 'var(--loom-rule-warm)',
          warm: 'var(--loom-warm)',
          'warm-bright': 'var(--loom-warm-bright)',
          'warm-dim': 'var(--loom-warm-dim)',
          'warm-glow': 'var(--loom-warm-glow)',
        },
      },
      fontFamily: {
        // One serif across the whole product: Source Serif 4 (variable optical
        // sizes), per the Claude Design bundle. The legacy display/body/hand
        // families all collapse onto it so un-migrated pages inherit the
        // correct type. "hand" maps to the serif italic — there is no
        // handwriting face in the system.
        display: ['"Source Serif 4"', '"Source Serif Pro"', 'Charter', 'Georgia', 'serif'],
        body: ['"Source Serif 4"', '"Source Serif Pro"', 'Charter', 'Georgia', 'serif'],
        hand: ['"Source Serif 4"', 'Georgia', 'serif'],
        news: ['"Source Serif 4"', 'ui-serif', 'Georgia', 'serif'],
        v3mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        'loom-serif': ['"Source Serif 4"', '"Source Serif Pro"', 'Charter', 'Georgia', 'serif'],
        'loom-ui': ['Inter', 'system-ui', 'sans-serif'],
        'loom-mono': ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        'fast': '200ms',
        'normal': '400ms',
        'slow': '800ms',
        'glacial': '1600ms',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gold-gradient': 'linear-gradient(135deg, #cf935a, #8c5a30)',
        'blood-gradient': 'linear-gradient(135deg, #9f3a2a, #7a1f2b)',
      },
      boxShadow: {
        'gold': '0 8px 32px -4px rgba(176, 122, 74, 0.4)',
        'gold-hover': '0 12px 40px -4px rgba(176, 122, 74, 0.5)',
        'blood': '0 8px 32px -4px rgba(159, 58, 42, 0.4)',
        'glass': '0 4px 24px -4px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'aura-breathe': 'aura-breathe 12s ease-in-out infinite',
        'stars-drift': 'stars-drift 120s linear infinite',
        'particle-ascend': 'particle-ascend var(--dur, 20s) cubic-bezier(0.65, 0, 0.35, 1) infinite',
        'record-ring': 'record-ring 1.5s ease-out infinite',
        'page-in': 'page-in 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'aura-breathe': {
          '0%, 100%': { opacity: '0.6', transform: 'translateX(-50%) scale(1)' },
          '50%': { opacity: '1', transform: 'translateX(-50%) scale(1.05)' },
        },
        'stars-drift': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-5%)' },
        },
        'particle-ascend': {
          '0%': { opacity: '0', transform: 'translateY(100vh) scale(0.5)' },
          '10%': { opacity: 'var(--opacity, 0.6)' },
          '90%': { opacity: 'var(--opacity, 0.6)' },
          '100%': { opacity: '0', transform: 'translateY(-10vh) scale(1)' },
        },
        'record-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        'page-in': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        'pill': '100px',
      },
      letterSpacing: {
        'display': '0.35em',
        'wide': '0.14em',
        'normal': '0.05em',
      },
    },
  },
  plugins: [],
};
