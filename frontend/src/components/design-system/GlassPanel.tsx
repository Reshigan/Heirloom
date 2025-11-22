'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  blur?: 'sm' | 'md' | 'lg'
  glow?: boolean
  animate?: boolean
}

export function GlassPanel({
  children,
  className = '',
  blur = 'md',
  glow = false,
  animate = true,
}: GlassPanelProps) {
  const blurClasses = {
    sm: 'backdrop-blur-[10px]',
    md: 'backdrop-blur-[20px]',
    lg: 'backdrop-blur-[30px]',
  }

  const baseClasses = `relative bg-charcoal/80 ${blurClasses[blur]} border border-gold/20 rounded-2xl ${
    glow ? 'shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
  }`

  if (!animate) {
    return <div className={`${baseClasses} ${className}`}>{children}</div>
  }

  return (
    <motion.div
      className={`${baseClasses} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
