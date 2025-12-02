'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * V2 Root - Redirect to home
 */
export default function V2Root() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/v2/home')
  }, [router])

  return null
}
