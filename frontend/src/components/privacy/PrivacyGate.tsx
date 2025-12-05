'use client'

import React, { ReactNode } from 'react'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { LockedPlaceholder } from './LockedPlaceholder'

interface PrivacyGateProps {
  children: ReactNode
  fallback?: ReactNode
  showUnlockPrompt?: boolean
}

/**
 * PrivacyGate component - gates sensitive content behind vault unlock
 * 
 * IMPORTANT: This component NEVER renders children when locked.
 * Children are not mounted at all, so no useEffect/fetch will run.
 * 
 * Usage:
 * <PrivacyGate>
 *   <SensitiveContent />
 * </PrivacyGate>
 */
export function PrivacyGate({ 
  children, 
  fallback,
  showUnlockPrompt = true 
}: PrivacyGateProps) {
  const { isUnlocked } = usePrivacy()

  if (!isUnlocked) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    if (showUnlockPrompt) {
      return <LockedPlaceholder />
    }
    
    return null
  }

  return <>{children}</>
}
