'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface GlassModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showWarpEffect?: boolean
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[95vw]'
}

// Warp flash component
const WarpFlash = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.3 }}
        exit={{ opacity: 0, scale: 1.5 }}
        transition={{ duration: 0.12, ease: "easeOut" as const }}
        className="absolute inset-0 pointer-events-none z-[60]"
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.3) 0%, transparent 60%)'
        }}
      />
    )}
  </AnimatePresence>
)

export const GlassModal: React.FC<GlassModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className,
  size = 'md',
  showWarpEffect = true
}) => {
  const [showFlash, setShowFlash] = useState(false)

  useEffect(() => {
    if (isOpen && showWarpEffect) {
      const timer = setTimeout(() => {
        setShowFlash(true)
        setTimeout(() => setShowFlash(false), 120)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen, showWarpEffect])

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" as const }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2, ease: "easeIn" as const }
    }
  }

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.92,
      y: 20,
      filter: showWarpEffect ? 'blur(8px)' : 'blur(0px)'
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { 
        duration: 0.4, 
        ease: [0.16, 1, 0.3, 1] as const,
        delay: 0.05
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: 10,
      filter: showWarpEffect ? 'blur(4px)' : 'blur(0px)',
      transition: { duration: 0.25, ease: "easeIn" as const }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-obsidian-900/80 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Warp flash effect */}
          {showWarpEffect && <WarpFlash show={showFlash} />}
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'relative w-full pointer-events-auto',
                'bg-gradient-to-br from-charcoal/95 via-charcoal/90 to-obsidian-900/95',
                'backdrop-blur-2xl',
                'border border-gold-500/25',
                'rounded-3xl',
                'shadow-2xl shadow-obsidian-900/80',
                'max-h-[90vh] overflow-hidden',
                sizeClasses[size],
                className
              )}
            >
              {/* Gold shimmer on top edge */}
              <motion.div 
                className="absolute top-0 left-0 right-0 h-px overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-400/60 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1, delay: 0.4, ease: "easeInOut" }}
                />
              </motion.div>

              {/* Animated border glow */}
              <motion.div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, transparent 40%, rgba(212, 175, 55, 0.15) 50%, transparent 60%)",
                  backgroundSize: "200% 200%"
                }}
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              {/* Header */}
              {title && (
                <motion.div 
                  className="flex items-center justify-between p-6 border-b border-gold-500/15"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <h2 className="text-2xl font-serif font-bold text-pearl tracking-wide">
                    {title}
                  </h2>
                  <motion.button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-pearl/60 hover:text-pearl hover:border-gold-400 hover:bg-gold-500/10 transition-all"
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={20} />
                  </motion.button>
                </motion.div>
              )}
              
              {/* Close button (if no title) */}
              {!title && (
                <motion.button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-pearl/60 hover:text-pearl hover:border-gold-400 hover:bg-gold-500/10 transition-all"
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <X size={20} />
                </motion.button>
              )}
              
              {/* Content */}
              <motion.div 
                className="overflow-y-auto max-h-[calc(90vh-8rem)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {children}
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
