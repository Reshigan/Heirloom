'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Line } from '@react-three/drei'
import * as THREE from 'three'

interface ConstellationSceneProps {
  data?: {
    nodes?: Array<{ id: string; position: [number, number, number] }>
    edges?: Array<{ from: string; to: string }>
  }
}

export function ConstellationScene({ data }: ConstellationSceneProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  if (!data || !data.nodes) {
    return (
      <group ref={groupRef}>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const radius = 5
          const x = Math.cos(angle) * radius
          const z = Math.sin(angle) * radius
          const y = (Math.random() - 0.5) * 2

          return (
            <Sphere key={i} args={[0.2, 16, 16]} position={[x, y, z]}>
              <meshStandardMaterial
                color="#D4AF37"
                emissive="#D4AF37"
                emissiveIntensity={0.5}
              />
            </Sphere>
          )
        })}
      </group>
    )
  }

  return (
    <group ref={groupRef}>
      {data.nodes.map((node) => (
        <Sphere key={node.id} args={[0.2, 16, 16]} position={node.position}>
          <meshStandardMaterial
            color="#D4AF37"
            emissive="#D4AF37"
            emissiveIntensity={0.5}
          />
        </Sphere>
      ))}
      
      {data.edges?.map((edge, i) => {
        const fromNode = data.nodes?.find((n) => n.id === edge.from)
        const toNode = data.nodes?.find((n) => n.id === edge.to)
        
        if (!fromNode || !toNode) return null
        
        return (
          <Line
            key={i}
            points={[fromNode.position, toNode.position]}
            color="#D4AF37"
            lineWidth={1}
            opacity={0.3}
            transparent
          />
        )
      })}
    </group>
  )
}
