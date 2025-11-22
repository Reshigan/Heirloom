'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { GlassPanel } from './design-system'

interface Memory {
  id: string
  title: string
  description: string
  date: string
  media_url?: string
  thumbnail_url?: string
  location?: string
  participants?: string[]
  sentiment_score?: number
  sentiment_label?: string
}

interface MemoryDetailPanelProps {
  memory: Memory | null
  isOpen: boolean
  onClose: () => void
  userName?: string
}

export function MemoryDetailPanel({ memory, isOpen, onClose, userName }: MemoryDetailPanelProps) {
  if (!memory) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed right-0 top-1/2 -translate-y-1/2 w-[90%] md:w-[400px] z-[500] p-4 md:p-0 md:pr-10"
          initial={{ x: 500, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 500, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <GlassPanel className="p-8 md:p-10" blur="lg" glow animate={false}>
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gold/20">
              <div className="flex-1">
                <h3 className="font-serif text-2xl md:text-3xl font-light text-gold mb-2">
                  {memory.title}
                </h3>
                <p className="text-xs tracking-[0.15em] uppercase text-gold-light/70">
                  {memory.description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-4 w-8 h-8 flex items-center justify-center rounded-full border border-gold/30 text-gold hover:bg-gold/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {memory.media_url && (
              <div className="mb-6 rounded-xl overflow-hidden border border-gold/20">
                <img
                  src={memory.media_url}
                  alt={memory.title}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <div className="space-y-6">
              <div>
                <div className="text-[11px] tracking-[0.2em] uppercase text-gold-light/60 mb-2">
                  Captured
                </div>
                <div className="text-base text-pearl font-light">
                  {new Date(memory.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              {memory.location && (
                <div>
                  <div className="text-[11px] tracking-[0.2em] uppercase text-gold-light/60 mb-2">
                    Location
                  </div>
                  <div className="text-base text-pearl font-light">{memory.location}</div>
                </div>
              )}

              {memory.participants && memory.participants.length > 0 && (
                <div>
                  <div className="text-[11px] tracking-[0.2em] uppercase text-gold-light/60 mb-2">
                    Present
                  </div>
                  <div className="text-base text-pearl font-light">
                    {memory.participants.join(', ')}
                  </div>
                </div>
              )}

              {memory.sentiment_label && (
                <div>
                  <div className="text-[11px] tracking-[0.2em] uppercase text-gold-light/60 mb-2">
                    Emotional Tone
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full bg-gold"
                      style={{
                        boxShadow: `0 0 ${10 + (memory.sentiment_score || 0) * 20}px rgba(212, 175, 55, ${0.5 + (memory.sentiment_score || 0) * 0.5})`,
                      }}
                    />
                    <div className="text-base text-pearl font-light capitalize">
                      {memory.sentiment_label}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="text-[11px] tracking-[0.2em] uppercase text-gold-light/60 mb-2">
                  Preserved By
                </div>
                <div className="text-base text-pearl font-light">{userName || 'Family Member'}</div>
              </div>
            </div>

            <motion.div
              className="mt-8 pt-6 border-t border-gold/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-xs text-gold-light/50 text-center italic">
                "Every memory is a star in your family's constellation"
              </div>
            </motion.div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
