'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useVault } from '@/contexts/VaultContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { AuthModal } from './auth-modal'
import VaultUploadModal from './vault-upload-modal'
import { VaultUnlockModal } from './vault-unlock-modal'
import { apiClient } from '@/lib/api-client'
import type { Memory } from '@/types/domain'

interface MemoryOrb {
  id: string
  memory: Memory
  position: { x: number; y: number }
  size: number
}

export default function ConstellationInterface() {
  const { user, isAuthenticated, isLoading: authLoading, token, hasCheckedAuth, logout, vmkSalt } = useAuth()
  const { unreadCount } = useNotifications()
  const { vaultEncryption, isInitialized: vaultInitialized, initializeVault } = useVault()
  
  const [currentView, setCurrentView] = useState<'memories' | 'timeline' | 'heritage' | 'wisdom' | 'family'>('memories')
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [showWisdomQuote, setShowWisdomQuote] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [particles, setParticles] = useState<Array<{ id: number; left: string; delay: number; duration: number }>>([])
  const [memoryOrbs, setMemoryOrbs] = useState<MemoryOrb[]>([])
  const [currentEra, setCurrentEra] = useState('Present')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showVaultUnlock, setShowVaultUnlock] = useState(false)
  const [memories, setMemories] = useState<Memory[]>([])
  
  const showcaseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isAuthenticated && vmkSalt && !vaultInitialized) {
      setShowVaultUnlock(true)
    }
  }, [isAuthenticated, vmkSalt, vaultInitialized])

  const handleVaultUnlock = async (password: string) => {
    if (!vmkSalt) {
      throw new Error('Vault salt not found')
    }
    
    await initializeVault(password, vmkSalt)
    
    try {
      const status = await apiClient.getVaultStatus()
      
      if (!status.hasEncryptedVmk) {
        const { EncryptionUtils } = await import('@/lib/encryption')
        const passwordKey = await EncryptionUtils.deriveVMK(password, vmkSalt)
        
        const vmk = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        )
        
        const vmkBytes = await crypto.subtle.exportKey('raw', vmk)
        const iv = crypto.getRandomValues(new Uint8Array(12))
        const encryptedVmkBuffer = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          passwordKey,
          vmkBytes
        )
        
        const bufferToHex = (buffer: ArrayBuffer) => {
          return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        }
        
        const encryptedVmk = `${bufferToHex(encryptedVmkBuffer)}:${bufferToHex(iv.buffer)}`
        await apiClient.initializeVault(encryptedVmk)
      }
    } catch (error) {
      console.error('Failed to initialize vault on backend:', error)
      throw error
    }
    
    setShowVaultUnlock(false)
  }

  useEffect(() => {
    const fetchMemories = async () => {
      if (!isAuthenticated) {
        if (hasCheckedAuth && !token) {
          setIsLoading(false)
          setShowAuthModal(true)
        }
        return
      }

      try {
        const data = await apiClient.getMemories()
        setMemories(data)
        
        const orbs: MemoryOrb[] = data.slice(0, 6).map((memory, index) => ({
          id: memory.id,
          memory,
          position: getOrbPosition(index),
          size: 120
        }))
        setMemoryOrbs(orbs)
      } catch (error) {
        console.error('Failed to fetch memories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMemories()
  }, [isAuthenticated, authLoading, token, hasCheckedAuth])

  // Generate golden dust particles
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      delay: Math.random() * 15,
      duration: 15 + Math.random() * 10
    }))
    setParticles(newParticles)

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        setIsLoading(false)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [isAuthenticated])

  // Handle mouse movement for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth >= 1024) {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const getOrbPosition = (index: number): { x: number; y: number } => {
    const positions = [
      { x: 10, y: 10 },
      { x: 85, y: 5 },
      { x: 85, y: 85 },
      { x: 10, y: 85 },
      { x: -5, y: 50 },
      { x: 95, y: 50 }
    ]
    return positions[index] || { x: 50, y: 50 }
  }

  const handleOrbHover = (orb: MemoryOrb) => {
    setSelectedMemory(orb.memory)
    setShowDetailPanel(true)
    setShowWisdomQuote(true)
  }

  const handleOrbLeave = () => {
    setShowDetailPanel(false)
    setShowWisdomQuote(false)
  }

  const handleEraClick = (era: string) => {
    setCurrentEra(era)
    
    const filteredMemories = memories.filter(memory => {
      const year = new Date(memory.date).getFullYear()
      switch (era) {
        case '1920s': return year >= 1920 && year < 1950
        case '1950s': return year >= 1950 && year < 1980
        case '1980s': return year >= 1980 && year < 2000
        case '2000s': return year >= 2000 && year < 2020
        case 'Present': return year >= 2020
        default: return true
      }
    })
    
    const newOrbs: MemoryOrb[] = filteredMemories.slice(0, 6).map((memory, index) => ({
      id: memory.id,
      memory,
      position: getOrbPosition(index),
      size: 120
    }))
    
    setMemoryOrbs(newOrbs)
  }

  const handleAddMemory = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }
    
    if (!vaultEncryption && vmkSalt) {
      try {
        const storedPassword = typeof window !== 'undefined' ? sessionStorage.getItem('heirloom:vault:password') : null
        if (storedPassword) {
          await initializeVault(storedPassword, vmkSalt)
        } else {
          console.error('Cannot initialize vault: password not found')
          return
        }
      } catch (error) {
        console.error('Failed to initialize vault encryption:', error)
        return
      }
    }
    
    setShowUploadModal(true)
  }

  const handleUploadSuccess = async () => {
    const data = await apiClient.getMemories()
    setMemories(data)
    
    const orbs: MemoryOrb[] = data.slice(0, 6).map((memory, index) => ({
      id: memory.id,
      memory,
      position: getOrbPosition(index),
      size: 120
    }))
    setMemoryOrbs(orbs)
  }

  const getParallaxTransform = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return 'none'
    const x = (mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1920) / 2) / (typeof window !== 'undefined' ? window.innerWidth : 1920) * 5
    const y = (mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 1080) / 2) / (typeof window !== 'undefined' ? window.innerHeight : 1080) * 5
    return `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`
  }

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="loading-ring"></div>
          <div className="loading-text">HEIRLOOM</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Refined Background */}
      <div className="luxury-bg" />
      <div className="elegant-grid" />

      {/* Golden Dust Particles */}
      <div id="particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="golden-dust"
            style={{
              left: particle.left,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>

      {/* Sophisticated Navigation */}
      <nav className="luxury-nav">
        <div className="logo">HEIRLOOM</div>
        <ul className="nav-menu">
          <li className="nav-item" onClick={() => setCurrentView('memories')}>Memories</li>
          <li className="nav-item" onClick={() => setCurrentView('timeline')}>Timeline</li>
          <li className="nav-item" onClick={() => setCurrentView('heritage')}>Heritage</li>
          <li className="nav-item" onClick={() => setCurrentView('wisdom')}>Wisdom</li>
          <li className="nav-item" onClick={() => setCurrentView('family')}>Family</li>
        </ul>
      </nav>

      {/* Main Heritage Container */}
      <div className="heritage-container">
        {/* Wisdom Quote */}
        <div className={`wisdom-quote ${showWisdomQuote ? 'active' : ''}`}>
          <div className="quote-mark">"</div>
          <div className="quote-text">
            {selectedMemory?.description || 'The stories we tell about our past shape our children\'s future'}
          </div>
          <div className="quote-author">
            {selectedMemory ? `— ${new Date(selectedMemory.date).toLocaleDateString()}` : '— Grandmother Elizabeth, 1952'}
          </div>
        </div>

        {/* Memory Gallery */}
        <div className="memory-gallery">
          <div className="memory-showcase" ref={showcaseRef} style={{ transform: getParallaxTransform() }}>
            {/* Rotating Frame */}
            <div className="showcase-frame"></div>
            
            {/* Memory Orbs */}
            {memoryOrbs.map((orb, index) => (
              <div
                key={orb.id}
                className="memory-orb"
                style={{
                  top: `${orb.position.y}%`,
                  left: `${orb.position.x}%`
                }}
                onMouseEnter={() => handleOrbHover(orb)}
                onMouseLeave={handleOrbLeave}
              >
                <div className="orb-container">
                  <div className="orb-content">
                    {orb.memory.thumbnailUrl ? (
                      <img src={orb.memory.thumbnailUrl} alt={orb.memory.title} className="orb-image" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)' }}></div>
                    )}
                    <div className="orb-overlay"></div>
                  </div>
                </div>
              </div>
            ))}

            {/* Central Focus */}
            <div className="central-memory">
              <div className="central-frame">
                <div className="central-content">
                  <div className="family-crest">{user?.name?.[0]?.toUpperCase() || 'H'}</div>
                  <div className="family-name">{user?.name ? `${user.name}'s Legacy` : 'The Hamilton Legacy'}</div>
                  <div className="family-tagline">{memoryOrbs.length} Memories • One Story</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Timeline */}
      <div className="timeline-elegant">
        <div className="timeline-track">
          <div className="timeline-progress"></div>
          <div className="era-marker" data-year="1920s" onClick={() => handleEraClick('1920s')}></div>
          <div className="era-marker" data-year="1950s" onClick={() => handleEraClick('1950s')}></div>
          <div className="era-marker" data-year="1980s" onClick={() => handleEraClick('1980s')}></div>
          <div className="era-marker" data-year="2000s" onClick={() => handleEraClick('2000s')}></div>
          <div className="era-marker" data-year="Present" onClick={() => handleEraClick('Present')}></div>
        </div>
      </div>

      {/* Detail Panel */}
      <div className={`detail-panel ${showDetailPanel ? 'active' : ''}`}>
        {selectedMemory && (
          <>
            <div className="detail-header">
              <div className="detail-title">{selectedMemory.title}</div>
              <div className="detail-subtitle">{selectedMemory.description}</div>
            </div>
            <div className="detail-content">
              <div className="detail-item">
                <div className="detail-label">Captured</div>
                <div className="detail-value">{new Date(selectedMemory.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Type</div>
                <div className="detail-value">{selectedMemory.type}</div>
              </div>
              {selectedMemory.tags && selectedMemory.tags.length > 0 && (
                <div className="detail-item">
                  <div className="detail-label">Tags</div>
                  <div className="detail-value">{selectedMemory.tags.join(', ')}</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="action-bar">
        <div className="luxury-fab" title="Record Story">
          <span>🎙️</span>
        </div>
        <div className="luxury-fab" title="AI Enhance">
          <span>✨</span>
        </div>
        <div className="luxury-fab primary" onClick={handleAddMemory} title="Add Memory">
          <span>+</span>
        </div>
      </div>

      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      {showVaultUnlock && (
        <VaultUnlockModal
          isOpen={showVaultUnlock}
          onClose={() => setShowVaultUnlock(false)}
          onUnlock={handleVaultUnlock}
        />
      )}
      
      {showUploadModal && (
        <VaultUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  )
}
