'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from './auth-modal'
import { apiClient } from '@/lib/api'
import { LogOut, User, CreditCard } from 'lucide-react'
import { CosmicBackground, CustomCursor, GlassNavBar } from './design-system'
import { MemoryConstellation } from './MemoryConstellation'
import { TimelineRiver } from './TimelineRiver'
import { MemoryDetailPanel } from './MemoryDetailPanel'
import { UploadCeremony } from './UploadCeremony'
import { LoadingExperience } from './LoadingExperience'
import { AnimatePresence } from 'framer-motion'

interface Memory {
  id: string
  title: string
  description: string
  date: string
  media_url?: string
  thumbnail_url?: string
  location?: string
  participants?: string[]
  sentiment_score?: number
  sentiment_label?: string
}

export default function FuturisticHeirloomInterface() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [memories, setMemories] = useState<Memory[]>([])
  const [currentEra, setCurrentEra] = useState('Present')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUploadCeremony, setShowUploadCeremony] = useState(false)

  useEffect(() => {
    const fetchMemories = async () => {
      if (!isAuthenticated) {
        console.log('Not authenticated, skipping memory fetch')
        setIsLoading(false)
        return
      }

      console.log('Fetching memories...')
      try {
        const data = await apiClient.getMemories()
        console.log('Fetched memories:', data.length, data)
        setMemories(data)
      } catch (error) {
        console.error('Failed to fetch memories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMemories()
  }, [isAuthenticated])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleMemoryClick = (memory: Memory) => {
    setSelectedMemory(memory)
    setShowDetailPanel(true)
  }

  const handleEraClick = (era: string) => {
    if (!isAuthenticated) return
    setCurrentEra(era)
  }

  const handleUpload = async (files: File[]) => {
    console.log('Uploading files:', files)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const data = await apiClient.getMemories()
    setMemories(data)
  }

  const familyName = user?.family_name || 'Your Family'
  const familyCrest = familyName.charAt(0).toUpperCase()

  const navItems = [
    { label: 'Memories', href: '/app', onClick: () => {} },
    { label: 'Timeline', href: '/app', onClick: () => {} },
    { label: 'Heritage', href: '/app', onClick: () => {} },
    { label: 'Billing', href: '/billing', onClick: () => {} },
  ]

  return (
    <>
      <AnimatePresence>
        {isLoading && <LoadingExperience />}
      </AnimatePresence>

      <CosmicBackground />
      <CustomCursor />

      <GlassNavBar
        logo="HEIRLOOM"
        items={navItems}
        onLogoClick={() => window.location.href = '/app'}
      />

      <div className="fixed top-6 right-6 z-[1001] flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <a
              href="/billing"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/30 text-gold text-xs uppercase tracking-wider hover:bg-gold/20 transition-colors"
            >
              <CreditCard className="w-3 h-3" />
              Billing
            </a>
            <div className="text-xs text-pearl/70">
              {user?.name} • {user?.family_name}
            </div>
            <button
              onClick={logout}
              className="w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 rounded-lg border border-gold/30 text-gold text-xs uppercase tracking-wider hover:bg-gold/10 transition-colors"
          >
            Sign In
          </button>
        )}
      </div>

      {isAuthenticated && memories.length > 0 ? (
        <>
          <MemoryConstellation
            memories={memories}
            onMemoryClick={handleMemoryClick}
            onUploadClick={() => setShowUploadCeremony(true)}
            familyName={familyName}
            familyCrest={familyCrest}
          />

          <TimelineRiver
            memories={memories}
            onEraClick={handleEraClick}
            currentEra={currentEra}
          />

          <MemoryDetailPanel
            memory={selectedMemory}
            isOpen={showDetailPanel}
            onClose={() => setShowDetailPanel(false)}
            userName={user?.name}
          />
        </>
      ) : isAuthenticated ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-2xl px-4">
            <h2 className="font-serif text-4xl md:text-6xl font-light text-gold mb-6">
              Your Constellation Awaits
            </h2>
            <p className="text-xl text-pearl/70 mb-12">
              Begin your journey by preserving your first memory
            </p>
            <button
              onClick={() => setShowUploadCeremony(true)}
              className="px-8 py-4 bg-gradient-to-br from-gold-dark to-gold text-obsidian rounded-xl text-sm uppercase tracking-wider hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] transition-all"
            >
              Add Your First Memory
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-2xl px-4">
            <h2 className="font-serif text-4xl md:text-6xl font-light text-gold mb-6">
              Welcome to Heirloom
            </h2>
            <p className="text-xl text-pearl/70 mb-12">
              Preserve your family's precious memories in a constellation of moments
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-4 bg-gradient-to-br from-gold-dark to-gold text-obsidian rounded-xl text-sm uppercase tracking-wider hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      <UploadCeremony
        isOpen={showUploadCeremony}
        onClose={() => setShowUploadCeremony(false)}
        onUpload={handleUpload}
      />
    </>
  )
}
