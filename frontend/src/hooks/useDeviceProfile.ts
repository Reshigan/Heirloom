'use client'

import { useEffect, useState } from 'react'

export type DeviceProfile = 'desktop-high' | 'desktop-mid' | 'mobile'

export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>('desktop-mid')

  useEffect(() => {
    const detectProfile = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const dpr = window.devicePixelRatio || 1
      
      // @ts-ignore - deviceMemory is not in TypeScript types but exists in Chrome
      const deviceMemory = (navigator as any).deviceMemory || 4

      if (isMobile || hasReducedMotion) {
        setProfile('mobile')
      } else if (deviceMemory >= 8 && dpr >= 2) {
        setProfile('desktop-high')
      } else {
        setProfile('desktop-mid')
      }
    }

    detectProfile()

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => detectProfile()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return profile
}

export function getParticleCount(profile: DeviceProfile): number {
  switch (profile) {
    case 'desktop-high':
      return 5000
    case 'desktop-mid':
      return 2000
    case 'mobile':
      return 500
  }
}

export function shouldUse3D(profile: DeviceProfile): boolean {
  return profile !== 'mobile'
}
