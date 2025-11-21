'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface ShimmerDividerProps {
  className?: string
}

export const ShimmerDivider: React.FC<ShimmerDividerProps> = ({ className }) => {
  return (
    <div className={cn('relative h-px w-full overflow-hidden', className)}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      
      {/* Animated shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </div>
  )
}
