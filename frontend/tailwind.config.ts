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
        'serif': ['Playfair Display', 'serif'],     // Elegant, timeless headlines
        'story': ['Crimson Pro', 'serif'],          // Readable, warm stories
        'ui': ['Inter', 'sans-serif'],              // Clean, modern UI
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
    },
  },
  plugins: [],
};

export default config;