'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { usePointerPosition } from '@/hooks/usePointerPosition'

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const position = usePointerPosition()

  useEffect(() => {
    const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    setIsVisible(hasHover)

    if (!hasHover) return

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  if (!isVisible) return null

  return (
    <motion.div
      className="fixed top-0 left-0 z-[3000] pointer-events-none mix-blend-screen"
      animate={{
        x: position.x - 16,
        y: position.y - 16,
        scale: isClicking ? 0.8 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 28,
        mass: 0.5,
      }}
    >
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-gold opacity-80" />
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border border-gold/40 animate-pulse" />
        </div>
        
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%)',
          }}
        />
      </div>
    </motion.div>
  )
}
