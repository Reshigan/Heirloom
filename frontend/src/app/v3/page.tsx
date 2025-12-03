'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * V3 Root - Redirect to Dashboard
 */
export default function V3Page() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/v3/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-500 rounded-full animate-spin" />
    </div>
  )
}
