'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GlassButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
}

export function GlassButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}: GlassButtonProps) {
  const baseClasses = 'relative font-sans tracking-[0.15em] uppercase transition-all duration-300 cursor-pointer'
  
  const variantClasses = {
    primary: 'bg-gradient-to-br from-gold-dark to-gold text-obsidian border-none shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.5)]',
    secondary: 'bg-charcoal/90 backdrop-blur-[20px] text-gold border border-gold/30 hover:border-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]',
    ghost: 'bg-transparent text-gold-light border border-gold/20 hover:bg-gold/10 hover:border-gold/40',
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-[10px] rounded-lg',
    md: 'px-6 py-3 text-xs rounded-xl',
    lg: 'px-8 py-4 text-sm rounded-2xl',
  }

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}
