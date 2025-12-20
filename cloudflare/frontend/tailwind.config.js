/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // THE VOID - Deep blacks (Eternal Premium)
        void: {
          abyss: '#030305',
          deep: '#050508',
          DEFAULT: '#08080c',
          surface: '#0c0c12',
          elevated: '#101018',
          hover: '#14141e',
        },
        // PAPER - Aged warm whites
        paper: {
          DEFAULT: '#ebe6dc',
          bright: '#f5f2eb',
          dim: '#d4cfc4',
          muted: '#a8a49c',
          90: 'rgba(235, 230, 220, 0.9)',
          70: 'rgba(235, 230, 220, 0.7)',
          50: 'rgba(235, 230, 220, 0.5)',
          30: 'rgba(235, 230, 220, 0.3)',
          15: 'rgba(235, 230, 220, 0.15)',
          '08': 'rgba(235, 230, 220, 0.08)',
          '04': 'rgba(235, 230, 220, 0.04)',
          '02': 'rgba(235, 230, 220, 0.02)',
        },
        // GOLD - Legacy, permanence
        gold: {
          DEFAULT: '#d4a853',
          light: '#e8c878',
          bright: '#f4dda0',
          dim: '#9c7a3c',
          deep: '#6b5228',
          40: 'rgba(212, 168, 83, 0.4)',
          20: 'rgba(212, 168, 83, 0.2)',
          10: 'rgba(212, 168, 83, 0.1)',
          '05': 'rgba(212, 168, 83, 0.05)',
        },
        // BLOOD - Life, recording, urgency
        blood: {
          DEFAULT: '#8c2f3d',
          light: '#a84455',
          glow: 'rgba(140, 47, 61, 0.4)',
        },
        // STATUS COLORS
        emerald: '#5ab88a',
        sapphire: '#64a0dc',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Cormorant', 'Georgia', 'serif'],
        hand: ['Caveat', 'cursive'],
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
        'gold-gradient': 'linear-gradient(135deg, #d4a853, #9c7a3c)',
        'blood-gradient': 'linear-gradient(135deg, #8c2f3d, #6b2430)',
      },
      boxShadow: {
        'gold': '0 8px 32px -4px rgba(212, 168, 83, 0.4)',
        'gold-hover': '0 12px 40px -4px rgba(212, 168, 83, 0.5)',
        'blood': '0 8px 32px -4px rgba(140, 47, 61, 0.4)',
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
