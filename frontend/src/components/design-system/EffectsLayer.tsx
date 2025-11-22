'use client'

import { useEffect, useRef, useState } from 'react'
import { useDeviceProfile, shouldUse3D } from '@/hooks/useDeviceProfile'
import dynamic from 'next/dynamic'

const WebGLRenderer = dynamic(() => import('./WebGLRenderer').then(mod => mod.WebGLRenderer), {
  ssr: false,
  loading: () => null,
})

const Canvas2DRenderer = dynamic(() => import('./Canvas2DRenderer').then(mod => mod.Canvas2DRenderer), {
  ssr: false,
  loading: () => null,
})

export interface EffectsScene {
  type: 'constellation' | 'vortex' | 'particles' | 'none'
  data?: any
}

interface EffectsLayerProps {
  scene: EffectsScene
}

export function EffectsLayer({ scene }: EffectsLayerProps) {
  const profile = useDeviceProfile()
  const use3D = shouldUse3D(profile)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[0] pointer-events-none">
      {use3D ? (
        <WebGLRenderer scene={scene} profile={profile} />
      ) : (
        <Canvas2DRenderer scene={scene} profile={profile} />
      )}
    </div>
  )
}
