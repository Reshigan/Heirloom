'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { VaultEncryption } from '@/lib/encryption'
import { useAuth } from './AuthContext'

interface VaultContextType {
  vaultEncryption: VaultEncryption | null
  isInitialized: boolean
  initializeVault: (password: string, salt: string) => Promise<void>
  clearVault: () => void
}

const VaultContext = createContext<VaultContextType | undefined>(undefined)

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [vaultEncryption, setVaultEncryption] = useState<VaultEncryption | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      clearVault()
    }
  }, [isAuthenticated])

  const initializeVault = async (password: string, salt: string) => {
    const vault = new VaultEncryption()
    await vault.initialize(password, salt)
    setVaultEncryption(vault)
    setIsInitialized(true)
  }

  const clearVault = () => {
    if (vaultEncryption) {
      vaultEncryption.clear()
    }
    setVaultEncryption(null)
    setIsInitialized(false)
  }

  return (
    <VaultContext.Provider value={{ vaultEncryption, isInitialized, initializeVault, clearVault }}>
      {children}
    </VaultContext.Provider>
  )
}

export function useVault() {
  const context = useContext(VaultContext)
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider')
  }
  return context
}
