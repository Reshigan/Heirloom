'use client'

import React from 'react'
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
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[95vw]'
}

export const GlassModal: React.FC<GlassModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className,
  size = 'md'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-obsidian/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'relative w-full pointer-events-auto',
                'bg-gradient-to-br from-charcoal/95 via-charcoal/90 to-obsidian/95',
                'backdrop-blur-2xl',
                'border border-gold/20',
                'rounded-3xl',
                'shadow-2xl shadow-obsidian/80',
                'max-h-[90vh] overflow-hidden',
                sizeClasses[size],
                className
              )}
            >
              {/* Gold shimmer on top edge */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between p-6 border-b border-gold/10">
                  <h2 className="text-2xl font-serif font-bold text-pearl tracking-wide">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gold/10 transition-colors duration-200 text-pearl/60 hover:text-pearl"
                  >
                    <X size={24} />
                  </button>
                </div>
              )}
              
              {/* Close button (if no title) */}
              {!title && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gold/10 transition-colors duration-200 text-pearl/60 hover:text-pearl"
                >
                  <X size={24} />
                </button>
              )}
              
              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
