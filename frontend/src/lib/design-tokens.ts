/**
 * Design Tokens for World-First UX/UI
 * Constellation Gold Theme with Social Media Polish
 */

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
} as const

export const typography = {
  fontSerif: '"Bodoni Moda", serif',
  fontSans: '"Montserrat", sans-serif',
  
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
    loose: '2',
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

export const motion = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 700,
  },
  
  easing: {
    linear: [0, 0, 1, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    
    smooth: [0.25, 0.1, 0.25, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
    elegant: [0.33, 1, 0.68, 1],
  },
  
  spring: {
    gentle: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
    bouncy: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
    snappy: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  
  transition: {
    fade: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
    slide: {
      duration: 0.4,
      ease: [0.33, 1, 0.68, 1],
    },
    scale: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
} as const

export const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  
  staggerItem: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  },
} as const

export const elevation = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(212, 175, 55, 0.05)',
  md: '0 4px 6px -1px rgba(212, 175, 55, 0.1), 0 2px 4px -1px rgba(212, 175, 55, 0.06)',
  lg: '0 10px 15px -3px rgba(212, 175, 55, 0.1), 0 4px 6px -2px rgba(212, 175, 55, 0.05)',
  xl: '0 20px 25px -5px rgba(212, 175, 55, 0.1), 0 10px 10px -5px rgba(212, 175, 55, 0.04)',
  '2xl': '0 25px 50px -12px rgba(212, 175, 55, 0.25)',
  glow: '0 0 20px rgba(212, 175, 55, 0.3)',
} as const

export const radius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
} as const

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

export const gestures = {
  swipeVelocity: 500,
  
  swipeDistance: 50,
  
  dragResistance: 0.5,
  
  snapThreshold: 0.5,
} as const

export const performance = {
  targetFPS: 60,
  
  maxAnimationDuration: 16.67, // ms
  
  intersectionThreshold: [0, 0.25, 0.5, 0.75, 1],
  
  lazyLoadOffset: '100px',
} as const

export const colors = {
  gold: {
    50: '#FFF8E7',
    100: '#FFEFC7',
    200: '#FFE5A0',
    300: '#FFD978',
    400: '#D4AF37',  // Primary gold
    500: '#C19A2E',
    600: '#A88526',
    700: '#8F701F',
    800: '#765B18',
    900: '#5D4612',
  },
  
  obsidian: {
    50: '#2A2A2A',
    100: '#1F1F1F',
    200: '#1A1A1A',
    300: '#151515',
    400: '#121212',
    500: '#0F0F0F',
    600: '#0D0D0D',
    700: '#0B0B0B',
    800: '#0A0A0A',  // Primary obsidian
    900: '#080808',
  },
  
  charcoal: '#1A1A1A',
  pearl: '#FFF8E7',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const

export const designTokens = {
  spacing,
  typography,
  motion,
  variants,
  elevation,
  radius,
  zIndex,
  breakpoints,
  gestures,
  performance,
  colors,
} as const

export default designTokens
