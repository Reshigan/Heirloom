'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  hover = true,
  onClick 
}) => {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-charcoal/40 via-charcoal/30 to-obsidian/40',
        'backdrop-blur-xl',
        'border border-gold/10',
        'shadow-lg shadow-obsidian/50',
        hover && 'transition-all duration-300 hover:border-gold/30 hover:shadow-gold/20 hover:shadow-xl',
        onClick && 'cursor-pointer',
        className
      )}
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
    >
      {/* Subtle gold shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}
