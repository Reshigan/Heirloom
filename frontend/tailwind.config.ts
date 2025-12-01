import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Emotional Color Palette from Heirloom Specification
      colors: {
        // Warmth palette - comfort and nostalgia
        warmth: {
          cream: '#FAF7F0',      // Comfort of old paper
          gold: '#D4A574',       // Precious memories
          amber: '#FFA500',      // Sunset nostalgia
          rose: '#E8B4B8',       // Gentle love
        },
        
        // Depth palette - rich history and reflection
        depth: {
          mahogany: '#4B2F20',   // Rich history
          navy: '#2C3E50',       // Deep reflection
          forest: '#2D5016',     // Growth and life
          plum: '#5D3A6B',       // Mystery of time
        },
        
        // Emotion palette - specific feelings
        emotion: {
          joy: '#FFD700',        // Bright celebrations
          love: '#FF69B4',       // Tender moments
          peace: '#E6E6FA',      // Quiet reflection
          hope: '#98FB98',       // Future growth
        },
        
        // Modern palette - contemporary brand colors
        modern: {
          white: '#FFFFFF',      // Pure white background
          blue: '#2563EB',       // Modern blue primary
          coral: '#F97316',      // Warm coral accent
          emerald: '#10B981',    // Fresh emerald
          purple: '#7C3AED',     // Modern purple
          pink: '#EC4899',       // Contemporary pink
          amber: '#F59E0B',      // Modern amber
          gray: {
            50: '#F8FAFC',       // Very light
            100: '#F1F5F9',      // Light
            200: '#E2E8F0',      // Lighter
            300: '#CBD5E1',      // Light medium
            400: '#94A3B8',      // Medium
            500: '#64748B',      // Base
            600: '#475569',      // Dark
            700: '#334155',      // Darker
            800: '#1E293B',      // Very dark
            900: '#0F172A',      // Almost black
          },
        },
        
        // Cosmic palette - updated to modern colors
        cosmic: {
          blue: '#2563EB',       // Modern blue
          silver: '#EC4899',     // Modern pink
          nebula: '#7C3AED',     // Modern purple
          starlight: '#F8FAFC',  // Light gray
          gold: '#F59E0B',       // Modern amber
          coral: '#F97316',      // Modern coral
          green: '#10B981',      // Modern emerald
        },
        
        // Context-specific palettes
        memorial: {
          primary: '#6B5B73',    // Gentle purple-gray
          secondary: '#A8A5A0',  // Warm gray
          accent: '#D4AF37',     // Soft gold
          background: '#FAF7F2', // Warm white
          text: '#3A3A3A',       // Soft black
        },
        
        celebration: {
          primary: '#FFD700',    // Bright gold
          secondary: '#FF69B4',  // Happy pink
          accent: '#00CED1',     // Turquoise
          background: '#FFFEF7', // Bright cream
          text: '#2C3E50',       // Rich navy
        },
        
        nostalgic: {
          primary: '#D2691E',    // Chocolate
          secondary: '#DEB887',  // Burlywood
          accent: '#CD853F',     // Peru
          background: '#FDF5E6', // Old lace
          text: '#5D4E37',       // Coffee
        },
        
        everyday: {
          primary: '#7FB069',    // Sage green
          secondary: '#E4B7A0',  // Warm sand
          accent: '#A45C40',     // Terra cotta
          background: '#FEFEFE', // Pure white
          text: '#4A4A4A',       // Balanced gray
        },
        
        // Futuristic luxury palette
        obsidian: {
          900: '#0A0A0A',        // Pure obsidian
          800: '#0F0F0F',        // Dark obsidian
          700: '#1A1A1A',        // Charcoal
          600: '#2A2A2A',        // Smoke
        },
        
        gold: {
          600: '#B8941F',        // Dark gold
          500: '#D4AF37',        // Primary gold
          400: '#F4E5C2',        // Light gold
          300: '#FFF8E7',        // Pearl
        },
        
        charcoal: '#1A1A1A',
        smoke: '#2A2A2A',
        pearl: '#FFF8E7',
      },
      
      // Typography from specification
      fontFamily: {
        'serif': ['Bodoni Moda', 'serif'],          // Elegant, timeless headlines (futuristic luxury)
        'sans': ['Montserrat', 'sans-serif'],       // Clean, modern UI (futuristic luxury)
        'story': ['Crimson Pro', 'serif'],          // Readable, warm stories
        'handwritten': ['Kalam', 'cursive'],        // Personal notes
        'timestamp': ['IBM Plex Mono', 'monospace'], // Precision of time
      },
      
      // Custom shadows for emotional depth
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'memory': '0 4px 15px rgba(212, 165, 116, 0.2)',
        'warm': '0 8px 30px rgba(212, 165, 116, 0.3)',
        'memorial': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'celebration': '0 4px 15px rgba(255, 215, 0, 0.2)',
        'nostalgic': '0 3px 12px rgba(139, 69, 19, 0.15)',
        'everyday': '0 2px 10px rgba(0, 0, 0, 0.1)',
      },
      
      // Animation durations for emotional pacing
      transitionDuration: {
        'slow': '2000ms',      // Memorial content
        'gentle': '1500ms',    // First memory reveals
        'measured': '1200ms',  // Nostalgic content
        'lively': '600ms',     // Joyful content
        'respectful': '800ms', // Between memories
      },
      
      // Custom spacing for comfortable layouts
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Border radius for organic, warm feeling
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      
      // Background patterns and gradients
      backgroundImage: {
        'warm-gradient': 'linear-gradient(135deg, #FAF7F0 0%, #FEFEFE 100%)',
        'memory-gradient': 'linear-gradient(135deg, #D4A574 0%, #FFA500 100%)',
        'time-gradient': 'linear-gradient(135deg, #2C3E50 0%, #5D3A6B 100%)',
      },
      
      // Futuristic animations
      keyframes: {
        'rotate-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'timeline-flow': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'dust-float': {
          '0%': { transform: 'translateY(100vh) translateX(0)', opacity: '0' },
          '10%': { opacity: '0.6' },
          '90%': { opacity: '0.6' },
          '100%': { transform: 'translateY(-100vh) translateX(50px)', opacity: '0' },
        },
        'fadeOut': {
          'to': { opacity: '0', pointerEvents: 'none' },
        },
        'spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        // New warp and transition animations
        'warp-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)', filter: 'blur(10px)' },
          '100%': { opacity: '1', transform: 'scale(1)', filter: 'blur(0)' },
        },
        'warp-out': {
          '0%': { opacity: '1', transform: 'scale(1)', filter: 'blur(0)' },
          '100%': { opacity: '0', transform: 'scale(1.1)', filter: 'blur(10px)' },
        },
        'warp-flash': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
          '100%': { opacity: '0', transform: 'scale(1.5)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'blur-in': {
          '0%': { opacity: '0', filter: 'blur(10px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        'ring-pulse': {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0.5' },
        },
        'glow-pulse': {
          '0%, 100%': { 
            textShadow: '0 0 20px rgba(212, 175, 55, 0.3), 0 0 40px rgba(212, 175, 55, 0.1)' 
          },
          '50%': { 
            textShadow: '0 0 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.2)' 
          },
        },
      },
      animation: {
        'rotate-slow': 'rotate-slow 60s linear infinite',
        'timeline-flow': 'timeline-flow 10s linear infinite',
        'dust-float': 'dust-float 15s infinite',
        'fadeOut': 'fadeOut 1s ease 2s forwards',
        'spin': 'spin 1.5s linear infinite',
        'pulse': 'pulse 1.5s ease infinite',
        // New animations
        'warp-in': 'warp-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'warp-out': 'warp-out 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'warp-flash': 'warp-flash 0.3s ease-out forwards',
        'float': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-up': 'fade-up 0.5s ease-out forwards',
        'fade-down': 'fade-down 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.4s ease-out forwards',
        'blur-in': 'blur-in 0.5s ease-out forwards',
        'ring-pulse': 'ring-pulse 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
