'use client'

import { useEffect, useRef } from 'react'
import { EffectsScene } from './EffectsLayer'
import { DeviceProfile } from '@/hooks/useDeviceProfile'

interface Canvas2DRendererProps {
  scene: EffectsScene
  profile: DeviceProfile
}

export function Canvas2DRenderer({ scene, profile }: Canvas2DRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (scene.type === 'constellation' && scene.data) {
        drawConstellation2D(ctx, canvas, scene.data)
      } else if (scene.type === 'vortex' && scene.data) {
        drawVortex2D(ctx, canvas, scene.data)
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [scene])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

function drawConstellation2D(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: any
) {
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const time = Date.now() * 0.001

  if (data.nodes) {
    data.nodes.forEach((node: any, i: number) => {
      const angle = (i / data.nodes.length) * Math.PI * 2 + time * 0.1
      const radius = 200
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      ctx.fillStyle = 'rgba(212, 175, 55, 0.8)'
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y, 12, 0, Math.PI * 2)
      ctx.stroke()
    })
  }
}

function drawVortex2D(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: any
) {
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const time = Date.now() * 0.001

  for (let i = 0; i < 5; i++) {
    const radius = 50 + i * 30
    const rotation = time + i * 0.5

    ctx.strokeStyle = `rgba(212, 175, 55, ${0.3 - i * 0.05})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, rotation, rotation + Math.PI * 1.5)
    ctx.stroke()
  }
}
