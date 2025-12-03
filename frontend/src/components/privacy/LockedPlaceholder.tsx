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
      transition={{ 
        duration: 0.4,
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
      className={`flex flex-col items-center justify-center p-12 ${className}`}
    >
      {/* Constellation ring with animated lock */}
      <div className="relative mb-8">
        {/* Outer ring with rotation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0 w-24 h-24 -left-2 -top-2"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="url(#goldGradient)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              opacity="0.3"
            />
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Pulsing glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gold-400/20 rounded-full blur-xl"
        />

        {/* Lock icon container */}
        <div className="relative w-20 h-20 bg-obsidian-800/60 border border-gold-500/25 rounded-full flex items-center justify-center backdrop-blur-sm">
          <motion.div
            animate={{ 
              y: [0, -2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Lock className="w-9 h-9 text-gold-400" strokeWidth={1.5} />
          </motion.div>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-serif text-2xl text-gold-400 mb-2 tracking-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gold-200/60 text-center max-w-md mb-6 text-sm leading-relaxed">
        {description}
      </p>

      {/* Security badge */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gold-400/5 border border-gold-500/20 rounded-full">
        <Shield className="w-4 h-4 text-gold-400" strokeWidth={1.5} />
        <span className="text-xs text-gold-200/60 uppercase tracking-wider font-medium">
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
    <div className={`relative bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 ${className}`}>
      {/* Subtle constellation pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-400/30 via-transparent to-gold-400/20"></div>
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-gold-400/40 rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-gold-400/30 rounded-full"></div>
        <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-gold-400/40 rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-gold-400/30 rounded-full"></div>
      </div>
      
      {/* Lock icon with subtle animation */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-12 h-12 bg-obsidian-900/60 border border-gold-500/25 rounded-full flex items-center justify-center backdrop-blur-sm">
          <Lock className="w-6 h-6 text-gold-400/80" strokeWidth={1.5} />
        </div>
      </motion.div>
    </div>
  )
}
