/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // GROUND — the dark surface (remapped from the legacy "void" tokens so
        // every bg-void/text-void utility across the app now resolves to the
        // Heirloom reference ground ramp). ground #070d14 on cream #f2e6d0.
        void: {
          abyss: '#04080d',
          deep: '#04080d',
          DEFAULT: '#070d14',
          surface: '#0c151f',
          elevated: '#122031',
          hover: '#182a40',
        },
        // CREAM — the page (remapped from legacy "paper"). #f2e6d0.
        paper: {
          DEFAULT: '#f2e6d0',
          bright: '#faf3e4',
          dim: 'rgba(242, 230, 208, 0.55)',
          muted: 'rgba(242, 230, 208, 0.40)',
          90: 'rgba(242, 230, 208, 0.9)',
          70: 'rgba(242, 230, 208, 0.7)',
          65: 'rgba(242, 230, 208, 0.65)',
          60: 'rgba(242, 230, 208, 0.6)',
          50: 'rgba(242, 230, 208, 0.5)',
          30: 'rgba(242, 230, 208, 0.32)',
          15: 'rgba(242, 230, 208, 0.18)',
          '08': 'rgba(242, 230, 208, 0.08)',
          '04': 'rgba(242, 230, 208, 0.05)',
          '02': 'rgba(242, 230, 208, 0.03)',
        },
        // COPPER — the single emotional accent. Remapped from the legacy bright
        // "gold" to copper #e0a062 so the whole app speaks the one accent color.
        // Used sparingly per the constitution.
        gold: {
          DEFAULT: '#cf8248',
          light: '#eaa964',
          bright: '#eaa964',
          dim: '#b07138',
          deep: '#8a5320',
          40: 'rgba(207, 130, 72, 0.4)',
          20: 'rgba(207, 130, 72, 0.2)',
          10: 'rgba(207, 130, 72, 0.1)',
          '05': 'rgba(207, 130, 72, 0.05)',
        },
        // BLOOD — retained only for destructive/record states, retuned to the
        // dye-madder family so it sits inside the natural-dye world.
        // Mirror of globals.css `--blood` (keep both in sync).
        blood: {
          DEFAULT: '#9f3a2a',
          light: '#b14a4a',
        },

        // ── v3 design tokens (light-mode-first; library, not vault) ──
        // See cloudflare/frontend/src/v3/DESIGN.md for rationale.
        bone: {
          DEFAULT: '#f2e6d0',
          2: '#ecdfc9',
        },
        ink: '#070d14',
        char: 'rgba(242, 230, 208, 0.55)',
        edge: 'rgba(242, 230, 208, 0.14)',
        mark: {
          DEFAULT: '#cf8248',
          deep: '#b07138',
          tint: '#eaa964',
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
        },
      },
      fontFamily: {
        // BRAND §6.2. Fraunces is DISPLAY ONLY (never below its ~24px optical
        // floor, never running body) — only `display` maps to it. Source Serif 4
        // is the reading workhorse; legacy `body`/`news`/`hand`/`loom-serif`
        // inherit it. JetBrains Mono carries archival labels/metadata.
        display: ['"Fraunces Variable"', '"Fraunces"', 'Charter', 'Georgia', 'serif'],
        body: ['"Source Serif 4 Variable"', '"Source Serif 4"', 'Charter', 'Georgia', 'serif'],
        hand: ['"Source Serif 4 Variable"', '"Source Serif 4"', 'Georgia', 'serif'],
        news: ['"Source Serif 4 Variable"', '"Source Serif 4"', 'ui-serif', 'Georgia', 'serif'],
        v3mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        'loom-serif': ['"Source Serif 4 Variable"', '"Source Serif 4"', 'Charter', 'Georgia', 'serif'],
        'loom-mono': ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: {
        // ONE easing only (design law). The off-spec ease-in-out
        // cubic-bezier(0.65,0,0.35,1) was unused in src and is removed.
        'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        // Spec ladder only: 180 / 360 / 720 / 1400. The prior 200/400/800/1600
        // values were off-spec and unreferenced in src — re-pointed to the ladder.
        'fast': '180ms',
        'normal': '360ms',
        'slow': '720ms',
        'glacial': '1400ms',
      },
      animation: {
        // Off-spec animations float/glow/aura-breathe/record-ring/page-in were
        // unreferenced in src (zero `animate-*` usage) and used the off-spec
        // ease-in-out — removed. particle-ascend was likewise unreferenced AND
        // carried an off-spec cubic-bezier(0.65,0,0.35,1) — removed too.
        // stars-drift was a dead token too (zero `animate-stars-drift` usage in
        // src) — removed along with its keyframes.
      },
      keyframes: {},
      letterSpacing: {
        'display': '0.35em',
        'wide': '0.14em',
        'normal': '0.05em',
      },
    },
  },
  plugins: [],
};
