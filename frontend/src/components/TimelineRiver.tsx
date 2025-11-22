'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface TimelineRiverProps {
  memories: Array<{ id: string; date: string; title: string }>
  onEraClick: (era: string) => void
  currentEra: string
}

export function TimelineRiver({ memories, onEraClick, currentEra }: TimelineRiverProps) {
  const [hoveredEra, setHoveredEra] = useState<string | null>(null)

  const eras = [
    { label: '1920s', year: 1920, color: 'rgba(212, 175, 55, 0.6)' },
    { label: '1950s', year: 1950, color: 'rgba(212, 175, 55, 0.7)' },
    { label: '1980s', year: 1980, color: 'rgba(212, 175, 55, 0.8)' },
    { label: '2000s', year: 2000, color: 'rgba(212, 175, 55, 0.9)' },
    { label: 'Present', year: 2024, color: 'rgba(212, 175, 55, 1)' },
  ]

  const memoriesByEra = memories.reduce((acc, memory) => {
    const year = new Date(memory.date).getFullYear()
    const era = eras.find((e, i) => {
      const nextEra = eras[i + 1]
      return year >= e.year && (!nextEra || year < nextEra.year)
    })
    if (era) {
      if (!acc[era.label]) acc[era.label] = []
      acc[era.label].push(memory)
    }
    return acc
  }, {} as Record<string, typeof memories>)

  return (
    <motion.div
      className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-[1000px] z-[100]"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
    >
      <div className="relative p-6 md:p-8 bg-charcoal/80 backdrop-blur-[20px] border border-gold/20 rounded-2xl">
        <div className="relative h-0.5 bg-gold/10 my-5">
          <motion.div
            className="absolute h-full w-3/5 bg-gradient-to-r from-transparent via-gold to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />

          {eras.map((era, index) => {
            const position = (index / (eras.length - 1)) * 100
            const memoryCount = memoriesByEra[era.label]?.length || 0

            return (
              <motion.div
                key={era.label}
                className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${position}%` }}
                onHoverStart={() => setHoveredEra(era.label)}
                onHoverEnd={() => setHoveredEra(null)}
                onClick={() => onEraClick(era.label)}
                whileHover={{ scale: 1.3 }}
              >
                <div
                  className="w-3 h-3 rounded-full border-2 border-gold bg-charcoal transition-all duration-300"
                  style={{
                    boxShadow:
                      hoveredEra === era.label || currentEra === era.label
                        ? '0 0 20px rgba(212, 175, 55, 0.6)'
                        : 'none',
                    borderColor: currentEra === era.label ? '#D4AF37' : 'rgba(212, 175, 55, 0.5)',
                  }}
                />

                <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div className="text-[10px] tracking-[0.1em] text-gold-light/60 group-hover:text-gold transition-colors">
                    {era.label}
                  </div>
                  {memoryCount > 0 && (
                    <div className="text-[8px] text-gold/40 text-center mt-1">
                      {memoryCount} {memoryCount === 1 ? 'memory' : 'memories'}
                    </div>
                  )}
                </div>

                {(hoveredEra === era.label || currentEra === era.label) && (
                  <motion.div
                    className="absolute -top-8 left-1/2 -translate-x-1/2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="px-3 py-1 bg-gold/20 backdrop-blur-sm border border-gold/30 rounded-lg">
                      <div className="text-[10px] text-gold font-light whitespace-nowrap">
                        {memoriesByEra[era.label]?.[0]?.title || 'No memories yet'}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>

        <div className="text-center mt-6">
          <div className="text-xs tracking-[0.15em] uppercase text-gold-light/50">
            Journey Through Time
          </div>
        </div>
      </div>
    </motion.div>
  )
}
