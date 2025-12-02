'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useVault } from './VaultContext'
import { useAuth } from './AuthContext'

interface PrivacyContextType {
  isUnlocked: boolean
  lastActivityAt: number
  ttlMinutes: number
  lockVault: () => void
  resetActivity: () => void
  getRemainingTime: () => number
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined)

const DEFAULT_TTL_MINUTES = 30

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const { vaultEncryption, isInitialized, clearVault } = useVault()
  const { isAuthenticated } = useAuth()
  const [lastActivityAt, setLastActivityAt] = useState(Date.now())
  const [ttlMinutes] = useState(DEFAULT_TTL_MINUTES)
  const abortControllersRef = useRef<Set<AbortController>>(new Set())

  const isUnlocked = isInitialized && isAuthenticated

  const lockVault = useCallback(() => {
    abortControllersRef.current.forEach(controller => {
      try {
        controller.abort()
      } catch (e) {
      }
    })
    abortControllersRef.current.clear()

    clearVault()

    setLastActivityAt(Date.now())
  }, [clearVault])

  const resetActivity = useCallback(() => {
    if (isUnlocked) {
      setLastActivityAt(Date.now())
    }
  }, [isUnlocked])

  const getRemainingTime = useCallback(() => {
    if (!isUnlocked) return 0
    const elapsed = Date.now() - lastActivityAt
    const ttlMs = ttlMinutes * 60 * 1000
    return Math.max(0, ttlMs - elapsed)
  }, [isUnlocked, lastActivityAt, ttlMinutes])

  useEffect(() => {
    if (!isUnlocked) return

    const checkInterval = setInterval(() => {
      const remaining = getRemainingTime()
      if (remaining === 0) {
        console.log('[PrivacyProvider] TTL expired, auto-locking vault')
        lockVault()
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(checkInterval)
  }, [isUnlocked, getRemainingTime, lockVault])

  useEffect(() => {
    if (!isUnlocked) return

    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'mousemove']
    
    const handleActivity = () => {
      resetActivity()
    }

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [isUnlocked, resetActivity])

  useEffect(() => {
    if (!isUnlocked) return

    let hiddenAt: number | null = null

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now()
      } else {
        if (hiddenAt) {
          const hiddenDuration = Date.now() - hiddenAt
          const maxHiddenTime = 5 * 60 * 1000 // 5 minutes
          
          if (hiddenDuration > maxHiddenTime) {
            console.log('[PrivacyProvider] Tab was hidden too long, auto-locking vault')
            lockVault()
          } else {
            resetActivity()
          }
          hiddenAt = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isUnlocked, lockVault, resetActivity])

  useEffect(() => {
    if (!isAuthenticated && isInitialized) {
      lockVault()
    }
  }, [isAuthenticated, isInitialized, lockVault])

  return (
    <PrivacyContext.Provider
      value={{
        isUnlocked,
        lastActivityAt,
        ttlMinutes,
        lockVault,
        resetActivity,
        getRemainingTime,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  const context = useContext(PrivacyContext)
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider')
  }
  return context
}

export function usePrivacyAbortController() {
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    controllerRef.current = new AbortController()
    
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [])

  return controllerRef.current
}
