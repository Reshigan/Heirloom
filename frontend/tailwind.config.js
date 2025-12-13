/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#050505',
          light: '#080808',
          lighter: '#0a0a0a',
          deep: '#020202',
        },
        paper: {
          DEFAULT: '#f8f5ef',
          dim: '#f4f1eb',
          aged: '#e8e2d6',
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
        ink: '#1a1510',
        sanctuary: {
          blue: '#1a2a3a',
          teal: '#1a3a3a',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        handwritten: ['Caveat', 'cursive'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
  plugins: [],
};
