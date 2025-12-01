'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface LuxuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function LuxuryModal({ isOpen, onClose, title, subtitle, size = 'md', children }: LuxuryModalProps) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-obsidian-900/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className={`relative w-full ${sizes[size]} max-h-[90vh] overflow-hidden
                        bg-charcoal/95 backdrop-blur-2xl
                        border border-gold-500/20 rounded-3xl
                        shadow-2xl shadow-black/50`}
          >
            {/* Top shimmer line */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r 
                         from-transparent via-gold-500/50 to-transparent"
            />

            {/* Header */}
            {(title || subtitle) && (
              <div className="px-8 pt-8 pb-6 border-b border-gold-500/10">
                {title && (
                  <h2 className="font-serif text-2xl text-pearl tracking-wide">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-[12px] tracking-[0.15em] uppercase text-gold-400/50 mt-2">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Close button */}
            <motion.button
              onClick={onClose}
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-6 right-6 w-10 h-10 rounded-full
                         border border-gold-500/20 flex items-center justify-center
                         text-gold-400/60 hover:text-gold-500 hover:border-gold-500/40
                         transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </motion.button>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
