/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core brand colors
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
        
        // Semantic status colors
        status: {
          success: {
            DEFAULT: '#10b981',
            light: 'rgba(16, 185, 129, 0.1)',
            border: 'rgba(16, 185, 129, 0.3)',
          },
          warning: {
            DEFAULT: '#f59e0b',
            light: 'rgba(245, 158, 11, 0.1)',
            border: 'rgba(245, 158, 11, 0.3)',
          },
          error: {
            DEFAULT: '#ef4444',
            light: 'rgba(239, 68, 68, 0.1)',
            border: 'rgba(239, 68, 68, 0.3)',
          },
          info: {
            DEFAULT: '#3b82f6',
            light: 'rgba(59, 130, 246, 0.1)',
            border: 'rgba(59, 130, 246, 0.3)',
          },
        },
        
        // Glass effect colors
        glass: {
          bg: 'rgba(18, 21, 28, 0.8)',
          border: 'rgba(201, 169, 89, 0.1)',
          highlight: 'rgba(201, 169, 89, 0.05)',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        handwritten: ['Caveat', 'cursive'],
      },
      // Typography scale
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3' }],
        'body-xl': ['1.25rem', { lineHeight: '1.6' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'body-xs': ['0.75rem', { lineHeight: '1.5' }],
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
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
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
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      // Spacing for safe areas
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // Minimum touch target sizes
      minWidth: {
        'touch': '44px',
      },
      minHeight: {
        'touch': '44px',
      },
      // Backdrop blur for glassmorphism
      backdropBlur: {
        'glass': '12px',
      },
      // Box shadow for glass effects
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.2)',
        'glow-gold': '0 0 20px rgba(201, 169, 89, 0.3)',
        'glow-blood': '0 0 20px rgba(139, 41, 66, 0.3)',
      },
      // Border radius
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
};
