'use client'

import { useEffect, useRef } from 'react'
import { useDeviceProfile, getParticleCount } from '@/hooks/useDeviceProfile'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const profile = useDeviceProfile()
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particleCount = reducedMotion ? 100 : getParticleCount(profile)
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
    }> = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -Math.random() * 0.5 - 0.1,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      })
    }

    let animationId: number

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.y < 0) {
          particle.y = canvas.height
          particle.x = Math.random() * canvas.width
        }
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0

        ctx.fillStyle = `rgba(212, 175, 55, ${particle.opacity})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [profile, reducedMotion])

  return (
    <>
      <div className="fixed inset-0 z-[-3] bg-gradient-to-b from-obsidian via-[#0F0F0F] to-obsidian" />
      
      <div
        className="fixed inset-0 z-[-2] opacity-50 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212, 175, 55, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212, 175, 55, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />
      
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[-1] pointer-events-none"
      />
    </>
  )
}
