/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#0a0c10',
          deep: '#050608',
          light: '#12151c',
        },
        paper: {
          DEFAULT: '#f5f3ee',
          warm: '#faf8f3',
          aged: '#e8e4db',
        },
        gold: {
          DEFAULT: '#c9a959',
          bright: '#e8d5a3',
          dim: '#8b7355',
        },
        blood: {
          DEFAULT: '#8b2942',
          light: '#a83250',
        },
        sanctuary: {
          blue: '#1a2a3a',
          teal: '#1a3a3a',
        },
        ink: '#1a1510',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        handwritten: ['Caveat', 'cursive'],
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
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
      },
    },
  },
  plugins: [],
};
