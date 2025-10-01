"use client"

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function ParticleField() {
  const ref = useRef<THREE.Points>(null!)
  
  // Generate random particle positions
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(2000 * 3)
    
    for (let i = 0; i < 2000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100
    }
    
    return positions
  }, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.1
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.05
    }
  })

  return (
    <Points ref={ref} positions={particlesPosition} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#667eea"
        size={0.8}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  )
}

function FloatingGeometry() {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 2
    }
  })

  return (
    <mesh ref={meshRef} position={[10, 0, -20]}>
      <torusKnotGeometry args={[3, 1, 128, 16]} />
      <meshStandardMaterial
        color="#764ba2"
        transparent
        opacity={0.3}
        wireframe
      />
    </mesh>
  )
}

function WaveGeometry() {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.2
      meshRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.2) * 5
    }
  })

  return (
    <mesh ref={meshRef} position={[-15, 5, -25]}>
      <sphereGeometry args={[4, 32, 32]} />
      <meshStandardMaterial
        color="#4facfe"
        transparent
        opacity={0.2}
        wireframe
      />
    </mesh>
  )
}

export function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 30], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#f093fb" />
        
        <ParticleField />
        <FloatingGeometry />
        <WaveGeometry />
      </Canvas>
    </div>
  )
}