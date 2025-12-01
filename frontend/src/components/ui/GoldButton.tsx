'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface GoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-obsidian-900 shadow-lg shadow-gold-500/20 hover:shadow-xl hover:shadow-gold-500/30',
  secondary: 'bg-transparent text-gold-400 border border-gold-500/30 hover:bg-gold-500/5 hover:border-gold-500/50',
  ghost: 'text-gold-400/70 hover:text-gold-500 hover:bg-gold-500/5 border border-transparent'
}

const sizeClasses = {
  sm: 'px-6 py-2 text-[10px]',
  md: 'px-8 py-3 text-[11px]',
  lg: 'px-10 py-4 text-[12px]'
}

export const GoldButton: React.FC<GoldButtonProps> = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ y: disabled || loading ? 0 : -2 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'relative overflow-hidden rounded-full font-medium tracking-[0.15em] uppercase',
        'transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center justify-center gap-2',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      type="button"
      {...(props as any)}
    >
      {/* Shimmer effect */}
      {variant === 'primary' && !disabled && !loading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      )}
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {loading ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : icon}
        {children}
      </span>
    </motion.button>
  )
}
