'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-gold-500/10 via-gold-400/20 to-gold-500/10'
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  }

  const animationVariants = {
    pulse: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    },
    wave: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }
    },
    none: {}
  }

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '100%')
  }

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      animate={animationVariants[animation]}
      aria-label="Loading..."
      role="status"
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="p-6 bg-obsidian-800/60 border border-gold-500/20 rounded-xl space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="rounded" height={120} />
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
      </div>
    </div>
  )
}

export function SkeletonMemoryCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <div className="aspect-square rounded-2xl overflow-hidden bg-obsidian-800/60 border border-gold-500/20">
        <Skeleton variant="rectangular" height="100%" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
      </div>
    </motion.div>
  )
}

export function SkeletonTimeline() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton variant="circular" width={12} height={12} />
            <div className="w-px h-full bg-gold-500/20 mt-2" />
          </div>
          <div className="flex-1 pb-8">
            <Skeleton variant="text" width="30%" className="mb-2" />
            <SkeletonCard />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonNotification() {
  return (
    <div className="p-4 border-b border-gold-500/10 hover:bg-gold-500/5 transition-colors">
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonGallery() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <SkeletonMemoryCard key={i} />
      ))}
    </div>
  )
}
