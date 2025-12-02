'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Lock, Shield } from 'lucide-react'

interface LockedPlaceholderProps {
  title?: string
  description?: string
  className?: string
}

/**
 * LockedPlaceholder - Beautiful locked state UI
 * Shows when content is gated by PrivacyGate
 * 
 * IMPORTANT: This component is 100% static.
 * No images, no data fetching, no private content.
 */
export function LockedPlaceholder({ 
  title = 'Vault Locked',
  description = 'Unlock your vault to view this content',
  className = ''
}: LockedPlaceholderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center p-12 ${className}`}
    >
      {/* Lock icon with glow effect */}
      <div className="relative mb-6">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gold-400/20 rounded-full blur-2xl"
        />
        <div className="relative w-20 h-20 bg-gradient-to-br from-obsidian-800 to-charcoal border-2 border-gold-500/30 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-gold-400" />
        </div>
      </div>

      {/* Title */}
      <h3 className="font-serif text-2xl text-gold-400 mb-2 tracking-wide">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gold-200/70 text-center max-w-md mb-6">
        {description}
      </p>

      {/* Security badge */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gold-400/5 border border-gold-500/20 rounded-full">
        <Shield className="w-4 h-4 text-gold-400" />
        <span className="text-xs text-gold-200/70 uppercase tracking-wider">
          End-to-End Encrypted
        </span>
      </div>
    </motion.div>
  )
}

/**
 * LockedSkeleton - Skeleton loader for locked content
 * Use this for cards, lists, etc. that need a skeleton state
 */
export function LockedSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-4">
        <div className="h-4 bg-gold-500/10 rounded w-3/4"></div>
        <div className="h-4 bg-gold-500/10 rounded w-1/2"></div>
        <div className="h-32 bg-gold-500/10 rounded"></div>
      </div>
      
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-obsidian-900/50 backdrop-blur-sm rounded">
        <Lock className="w-8 h-8 text-gold-400/50" />
      </div>
    </div>
  )
}

/**
 * LockedImage - Placeholder for locked images
 * IMPORTANT: No src attribute, no actual image loading
 */
export function LockedImage({ className = '' }: { className?: string }) {
  return (
    <div className={`relative bg-gradient-to-br from-obsidian-800 to-charcoal ${className}`}>
      {/* Abstract gradient pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-400/20 via-transparent to-gold-400/10"></div>
      </div>
      
      {/* Lock icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 bg-obsidian-900/80 border border-gold-500/30 rounded-full flex items-center justify-center backdrop-blur-sm">
          <Lock className="w-6 h-6 text-gold-400" />
        </div>
      </div>
    </div>
  )
}
