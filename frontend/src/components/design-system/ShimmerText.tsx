'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ShimmerTextProps {
  children: ReactNode
  className?: string
}

export function ShimmerText({ children, className = '' }: ShimmerTextProps) {
  return (
    <motion.div
      className={`relative inline-block ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <span className="relative z-10">{children}</span>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/30 to-transparent"
        animate={{
          x: ['-200%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  )
}
