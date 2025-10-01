import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Emotional context utilities
export type EmotionalContext = 'memorial' | 'celebration' | 'nostalgic' | 'everyday' | 'discovery'

export function getContextualColors(context: EmotionalContext) {
  const colorMaps = {
    memorial: {
      primary: 'memorial-primary',
      secondary: 'memorial-secondary',
      accent: 'memorial-accent',
      background: 'memorial-background',
      text: 'memorial-text',
    },
    celebration: {
      primary: 'celebration-primary',
      secondary: 'celebration-secondary',
      accent: 'celebration-accent',
      background: 'celebration-background',
      text: 'celebration-text',
    },
    nostalgic: {
      primary: 'nostalgic-primary',
      secondary: 'nostalgic-secondary',
      accent: 'nostalgic-accent',
      background: 'nostalgic-background',
      text: 'nostalgic-text',
    },
    everyday: {
      primary: 'everyday-primary',
      secondary: 'everyday-secondary',
      accent: 'everyday-accent',
      background: 'everyday-background',
      text: 'everyday-text',
    },
    discovery: {
      primary: 'warmth-gold',
      secondary: 'warmth-amber',
      accent: 'emotion-joy',
      background: 'warmth-cream',
      text: 'depth-navy',
    },
  }
  
  return colorMaps[context]
}

export function getContextualTransition(context: EmotionalContext) {
  const transitionMaps = {
    memorial: 'duration-slow ease-out',
    celebration: 'duration-lively ease-out',
    nostalgic: 'duration-measured ease-in-out',
    everyday: 'duration-300 ease-in-out',
    discovery: 'duration-gentle ease-out',
  }
  
  return transitionMaps[context]
}

export function getContextualShadow(context: EmotionalContext) {
  const shadowMaps = {
    memorial: 'shadow-memorial',
    celebration: 'shadow-celebration',
    nostalgic: 'shadow-nostalgic',
    everyday: 'shadow-everyday',
    discovery: 'shadow-warm',
  }
  
  return shadowMaps[context]
}

// Time and date utilities for emotional context
export function formatDateHumanFriendly(date: Date): string {
  const now = new Date()
  const diffInYears = now.getFullYear() - date.getFullYear()
  
  if (diffInYears === 0) {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    })
  } else if (diffInYears === 1) {
    return `Last year, ${date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    })}`
  } else {
    return `${diffInYears} years ago, ${date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })}`
  }
}

export function getSeasonFromDate(date: Date): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = date.getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

export function getEmotionalWeightFromAge(ageInYears: number): 'light' | 'medium' | 'heavy' | 'profound' {
  if (ageInYears < 1) return 'light'
  if (ageInYears < 5) return 'medium'
  if (ageInYears < 20) return 'heavy'
  return 'profound'
}

// Animation utilities
export function createGentleReveal(delay: number = 0) {
  return {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { 
      duration: 1.5, 
      delay,
      ease: [0.4, 0, 0.2, 1] as const // Custom cubic-bezier for gentle feel
    }
  }
}

export function createMemoryBloom(delay: number = 0) {
  return {
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    transition: { 
      duration: 1.2, 
      delay,
      ease: "easeOut" as const // Spring-like bloom
    }
  }
}

export function createTimeTravel(direction: 'forward' | 'backward' = 'forward') {
  const x = direction === 'forward' ? 100 : -100
  return {
    initial: { opacity: 0, x },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -x },
    transition: { 
      duration: 0.8,
      ease: "easeInOut" as const
    }
  }
}