/**
 * V3 Design Tokens - Privacy Vault with Dead Man's Switch
 * 
 * Design Philosophy:
 * - Secure, trustworthy, professional (not entertainment)
 * - Light, editorial theme (paper/ink, not gold/obsidian)
 * - Estate planning patterns (checklists, not social feeds)
 * - Minimal motion, high contrast, reading-focused
 */

export const v3Colors = {
  paper: '#F7F5F2',
  ink: '#0B0D13',
  divider: '#E8E5E1',
  
  navy: {
    50: '#F0F2F5',
    100: '#D9DEE6',
    200: '#B3BDD3',
    300: '#8C9CBF',
    400: '#667BAC',
    500: '#1E2A44', // Primary
    600: '#182238',
    700: '#12192C',
    800: '#0C1120',
    900: '#060914',
  },
  
  sage: {
    50: '#F4F6F5',
    100: '#E3E8E5',
    200: '#C7D1CB',
    300: '#ABBAB1',
    400: '#8FA397',
    500: '#6E8B7E',
    600: '#586F65',
    700: '#42534C',
    800: '#2C3733',
    900: '#161B19',
  },
  
  gold: {
    base: '#B29762',
    light: 'rgba(178, 151, 98, 0.15)',
    lighter: 'rgba(178, 151, 98, 0.10)',
  },
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  status: {
    alive: '#10B981',
    missedOne: '#F59E0B',
    missedTwo: '#F97316',
    escalation: '#EF4444',
    pendingUnlock: '#8B5CF6',
    unlocked: '#6366F1',
  },
} as const

export const v3Typography = {
  fonts: {
    serif: '"Playfair Display", "Georgia", serif', // Headings only
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", "Courier New", monospace',
  },
  
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    md: '1.125rem',   // 18px - body text
    lg: '1.25rem',    // 20px - h3
    xl: '1.5rem',     // 24px - h2
    '2xl': '2rem',    // 32px - h1
    '3xl': '2.5rem',  // 40px - hero
  },
  
  leading: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.6',
    loose: '1.7',
  },
  
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const

export const v3Spacing = {
  rhythm: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    base: '1rem',   // 16px
    md: '1.5rem',   // 24px
    lg: '2rem',     // 32px
    xl: '3rem',     // 48px
    '2xl': '4rem',  // 64px
  },
  
  containers: {
    reading: '960px',  // Editorial content
    narrow: '640px',   // Forms and wizards
    wide: '1280px',    // Dashboard
  },
} as const

export const v3Motion = {
  durations: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  },
  
  easings: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
  },
} as const

export const v3Shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
  base: '0 1px 3px rgba(0, 0, 0, 0.06)',
  md: '0 2px 4px rgba(0, 0, 0, 0.08)',
  lg: '0 4px 8px rgba(0, 0, 0, 0.10)',
} as const

export const v3Borders = {
  width: '1px',
  color: v3Colors.divider,
  radius: {
    sm: '0.25rem',  // 4px
    base: '0.5rem', // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
  },
} as const

export const v3TailwindExtension = {
  colors: {
    paper: v3Colors.paper,
    ink: v3Colors.ink,
    divider: v3Colors.divider,
    navy: v3Colors.navy,
    sage: v3Colors.sage,
    'gold-accent': v3Colors.gold.base,
  },
  fontFamily: {
    serif: v3Typography.fonts.serif,
    body: v3Typography.fonts.body,
    mono: v3Typography.fonts.mono,
  },
  fontSize: v3Typography.sizes,
  lineHeight: v3Typography.leading,
  spacing: v3Spacing.rhythm,
  maxWidth: v3Spacing.containers,
  boxShadow: v3Shadows,
  borderRadius: v3Borders.radius,
}
