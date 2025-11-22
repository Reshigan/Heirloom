'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { EffectsScene } from './EffectsLayer'
import { DeviceProfile } from '@/hooks/useDeviceProfile'
import { ConstellationScene } from './scenes/ConstellationScene'
import { VortexScene } from './scenes/VortexScene'

interface WebGLRendererProps {
  scene: EffectsScene
  profile: DeviceProfile
}

export function WebGLRenderer({ scene, profile }: WebGLRendererProps) {
  const dpr = profile === 'desktop-high' ? [1, 2] : [1, 1.5]

  return (
    <Canvas
      dpr={dpr as [number, number]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#D4AF37" />
      
      {scene.type === 'constellation' && <ConstellationScene data={scene.data} />}
      {scene.type === 'vortex' && <VortexScene data={scene.data} />}
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={scene.type === 'constellation'}
        autoRotate={scene.type === 'constellation'}
        autoRotateSpeed={0.5}
      />
    </Canvas>
  )
}
