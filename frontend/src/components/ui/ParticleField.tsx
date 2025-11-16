'use client'

import React, { useEffect, useState } from 'react'

interface ParticleFieldProps {
  density?: number
}

const ParticleField: React.FC<ParticleFieldProps> = ({ density = 20 }) => {
  const [particles, setParticles] = useState<Array<{ id: number; left: string; delay: string }>>([])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const newParticles = Array.from({ length: density }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 15}s`,
    }))
    setParticles(newParticles)
  }, [density])

  return (
    <>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="golden-dust motion-safe:animate-dust-float"
          style={{
            left: particle.left,
            animationDelay: particle.delay,
          }}
        />
      ))}
    </>
  )
}

export default ParticleField
