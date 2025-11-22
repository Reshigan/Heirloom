'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDeviceProfile, shouldUse3D } from '@/hooks/useDeviceProfile'
import { usePointerPosition } from '@/hooks/usePointerPosition'
import { EffectsLayer, EffectsScene } from './design-system'

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

interface MemoryConstellationProps {
  memories: Memory[]
  onMemoryClick: (memory: Memory) => void
  onUploadClick: () => void
  familyName: string
  familyCrest: string
}

export function MemoryConstellation({
  memories,
  onMemoryClick,
  onUploadClick,
  familyName,
  familyCrest,
}: MemoryConstellationProps) {
  const profile = useDeviceProfile()
  const use3D = shouldUse3D(profile)
  const pointer = usePointerPosition()
  const [hoveredMemory, setHoveredMemory] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (!use3D) return
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [use3D])

  const displayMemories = memories.slice(0, 12)

  const constellationScene: EffectsScene = {
    type: 'constellation',
    data: {
      nodes: displayMemories.map((memory, i) => ({
        id: memory.id,
        position: [
          Math.cos((i / displayMemories.length) * Math.PI * 2) * 5,
          (Math.random() - 0.5) * 2,
          Math.sin((i / displayMemories.length) * Math.PI * 2) * 5,
        ] as [number, number, number],
      })),
      edges: displayMemories.map((_, i) => ({
        from: displayMemories[i].id,
        to: displayMemories[(i + 1) % displayMemories.length].id,
      })),
    },
  }

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {use3D && <EffectsLayer scene={constellationScene} />}

      <div
        className="relative w-full max-w-[1400px] h-[70vh] flex items-center justify-center"
        style={{
          transform: use3D
            ? `perspective(1000px) rotateY(${pointer.normalizedX * 5}deg) rotateX(${-pointer.normalizedY * 5}deg)`
            : 'none',
          transition: 'transform 0.1s ease-out',
        }}
      >
        <div className="relative w-[500px] h-[500px] md:w-[600px] md:h-[600px]">
          <motion.div
            className="absolute inset-0 rounded-full border border-gold/30"
            style={{
              background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.05) 0%, transparent 40%, rgba(10, 10, 10, 0.5) 100%)',
              backdropFilter: 'blur(10px)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          />

          <div
            className="absolute inset-0 rounded-full border border-gold/20"
            style={{
              width: '120%',
              height: '120%',
              top: '-10%',
              left: '-10%',
            }}
          />

          <div
            className="absolute inset-0 rounded-full border border-gold/20"
            style={{
              width: '80%',
              height: '80%',
              top: '10%',
              left: '10%',
            }}
          />

          {displayMemories.map((memory, index) => {
            const angle = (index / displayMemories.length) * Math.PI * 2 + (rotation * Math.PI) / 180
            const radius = 250
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius

            return (
              <motion.div
                key={memory.id}
                className="absolute w-24 h-24 md:w-32 md:h-32 cursor-pointer"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
                whileHover={{ scale: 1.2, zIndex: 10 }}
                onClick={() => onMemoryClick(memory)}
                onHoverStart={() => setHoveredMemory(memory.id)}
                onHoverEnd={() => setHoveredMemory(null)}
              >
                <div className="relative w-full h-full">
                  <div
                    className="w-full h-full rounded-full overflow-hidden border-2 border-gold/30 bg-charcoal relative"
                    style={{
                      boxShadow:
                        hoveredMemory === memory.id
                          ? '0 20px 60px rgba(212, 175, 55, 0.4), inset 0 0 30px rgba(212, 175, 55, 0.2)'
                          : '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.1)',
                      borderColor: hoveredMemory === memory.id ? '#D4AF37' : 'rgba(212, 175, 55, 0.3)',
                    }}
                  >
                    {memory.thumbnail_url ? (
                      <img
                        src={memory.thumbnail_url}
                        alt={memory.title}
                        className="w-full h-full object-cover opacity-90"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-charcoal to-smoke" />
                    )}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle at center, transparent 40%, rgba(10, 10, 10, 0.4) 100%)',
                      }}
                    />
                    
                    {memory.sentiment_score && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          boxShadow: `inset 0 0 ${20 + (memory.sentiment_score * 30)}px rgba(212, 175, 55, ${0.1 + (memory.sentiment_score * 0.2)})`,
                        }}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}

          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 z-10 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={onUploadClick}
          >
            <div
              className="w-full h-full rounded-full border-2 border-gold overflow-hidden bg-charcoal/95 backdrop-blur-xl relative"
              style={{
                boxShadow: '0 30px 100px rgba(212, 175, 55, 0.2), inset 0 0 50px rgba(212, 175, 55, 0.1)',
              }}
            >
              <div
                className="w-full h-full flex flex-col items-center justify-center text-center p-8 md:p-12"
                style={{
                  background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.05) 0%, transparent 100%)',
                }}
              >
                <motion.div
                  className="w-12 h-12 md:w-16 md:h-16 mb-4 md:mb-6 rounded-full border border-gold flex items-center justify-center font-serif text-2xl md:text-3xl text-gold"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  {familyCrest}
                </motion.div>
                <h2 className="font-serif text-xl md:text-2xl font-light text-gold tracking-[0.1em] mb-2">
                  The {familyName} Legacy
                </h2>
                <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-gold-light/70">
                  Connecting Generations • One Story
                </p>
                
                <motion.div
                  className="mt-6 text-gold/60 text-sm"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Click to add memory
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
