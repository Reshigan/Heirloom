'use client'

import { useEffect, useState } from 'react'

export interface PointerPosition {
  x: number
  y: number
  normalizedX: number // -1 to 1
  normalizedY: number // -1 to 1
}

export function usePointerPosition(): PointerPosition {
  const [position, setPosition] = useState<PointerPosition>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
  })

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const x = e.clientX
      const y = e.clientY
      const normalizedX = (x / window.innerWidth) * 2 - 1
      const normalizedY = (y / window.innerHeight) * 2 - 1

      setPosition({ x, y, normalizedX, normalizedY })
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  return position
}
