'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface VortexSceneProps {
  data?: any
}

export function VortexScene({ data }: VortexSceneProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.5
    }
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: 5 }).map((_, i) => {
        const radius = 1 + i * 0.5
        const segments = 64
        const points: THREE.Vector3[] = []

        for (let j = 0; j <= segments; j++) {
          const angle = (j / segments) * Math.PI * 2
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          const z = (j / segments) * 2 - 1
          points.push(new THREE.Vector3(x, y, z))
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points)

        return (
          <line key={i} geometry={geometry}>
            <lineBasicMaterial
              color="#D4AF37"
              transparent
              opacity={0.3 - i * 0.05}
            />
          </line>
        )
      })}
    </group>
  )
}
