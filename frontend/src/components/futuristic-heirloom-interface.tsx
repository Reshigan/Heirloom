'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from './auth-modal'
import { apiClient } from '@/lib/api'
import { LogOut, User, CreditCard } from 'lucide-react'

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
  const [showWisdomQuote, setShowWisdomQuote] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [memories, setMemories] = useState<Memory[]>([])
  const [currentEra, setCurrentEra] = useState('Present')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const fetchMemories = async () => {
      if (!isAuthenticated) {
        setIsLoading(false)
        return
      }

      try {
        const data = await apiClient.getMemories()
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
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth >= 1024) {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleOrbHover = (memory: Memory) => {
    setSelectedMemory(memory)
    setShowDetailPanel(true)
    setShowWisdomQuote(true)
  }

  const handleOrbLeave = () => {
    setShowDetailPanel(false)
    setShowWisdomQuote(false)
  }

  const handleEraClick = (era: string) => {
    if (!isAuthenticated) return
    setCurrentEra(era)
  }

  const getParallaxTransform = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return 'none'
    const x = (mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1920) / 2) / (typeof window !== 'undefined' ? window.innerWidth : 1920) * 5
    const y = (mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 1080) / 2) / (typeof window !== 'undefined' ? window.innerHeight : 1080) * 5
    return `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`
  }

  const displayMemories = memories.slice(0, 6)
  const familyName = user?.family_name || 'Your Family'
  const familyCrest = familyName.charAt(0).toUpperCase()

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
    <>
      {/* Refined Background */}
      <div className="luxury-bg"></div>
      <div className="elegant-grid"></div>

      {/* Sophisticated Navigation */}
      <nav className="luxury-nav">
        <div className="logo">HEIRLOOM</div>
        <ul className="nav-menu">
          <li className="nav-item">Memories</li>
          <li className="nav-item">Timeline</li>
          <li className="nav-item">Heritage</li>
          <li className="nav-item">Wisdom</li>
          <li className="nav-item">Family</li>
        </ul>
        
        {/* Auth Section */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <a
                href="/billing"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  background: 'linear-gradient(to right, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.1))',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#D4AF37',
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}
              >
                <CreditCard style={{ width: '0.75rem', height: '0.75rem' }} />
                Billing
              </a>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 248, 231, 0.7)' }}>
                {user?.name} • {user?.family_name}
              </div>
              <button
                onClick={() => {}}
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D4AF37',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                <User style={{ width: '1rem', height: '1rem' }} />
              </button>
              <button
                onClick={logout}
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D4AF37',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
                title="Logout"
              >
                <LogOut style={{ width: '1rem', height: '1rem' }} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#D4AF37',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Main Heritage Container */}
      <div className="heritage-container">
        {/* Wisdom Quote */}
        {showWisdomQuote && selectedMemory && (
          <div className="wisdom-quote active">
            <div className="quote-mark">"</div>
            <div className="quote-text">{selectedMemory.description || 'A precious family memory'}</div>
            <div className="quote-author">— {selectedMemory.title}</div>
          </div>
        )}

        {/* Memory Gallery */}
        <div className="memory-gallery">
          <div 
            className="memory-showcase"
            style={{ transform: getParallaxTransform() }}
          >
            {/* Rotating Frame */}
            <div className="showcase-frame"></div>
            
            {/* Memory Orbs */}
            {displayMemories.map((memory, index) => (
              <div 
                key={memory.id}
                className="memory-orb"
                onMouseEnter={() => handleOrbHover(memory)}
                onMouseLeave={handleOrbLeave}
                onClick={() => {
                  setSelectedMemory(memory);
                  setShowDetailPanel(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="orb-container">
                  <div className="orb-content">
                    {memory.thumbnail_url ? (
                      <img 
                        src={memory.thumbnail_url} 
                        alt={memory.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
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
                  <div className="family-crest">{familyCrest}</div>
                  <div className="family-name">The {familyName} Legacy</div>
                  <div className="family-tagline">Connecting Generations • One Story</div>
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
      {showDetailPanel && selectedMemory && (
        <div className="detail-panel active">
          <div className="detail-header">
            <div className="detail-title">{selectedMemory.title}</div>
            <div className="detail-subtitle">{selectedMemory.description}</div>
          </div>
          <div className="detail-content">
            <div className="detail-item">
              <div className="detail-label">Captured</div>
              <div className="detail-value">{new Date(selectedMemory.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            {selectedMemory.location && (
              <div className="detail-item">
                <div className="detail-label">Location</div>
                <div className="detail-value">{selectedMemory.location}</div>
              </div>
            )}
            {selectedMemory.participants && selectedMemory.participants.length > 0 && (
              <div className="detail-item">
                <div className="detail-label">Present</div>
                <div className="detail-value">{selectedMemory.participants.join(', ')}</div>
              </div>
            )}
            <div className="detail-item">
              <div className="detail-label">Preserved By</div>
              <div className="detail-value">{user?.name || 'Family Member'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="action-bar">
        <div className="luxury-fab">
          <span>🎙️</span>
        </div>
        <div className="luxury-fab">
          <span>✨</span>
        </div>
        <div className="luxury-fab primary">
          <span>+</span>
        </div>
      </div>

      {/* Golden Dust Particles */}
      <div id="particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="golden-dust"
            style={{
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 15 + 's',
              animationDuration: (15 + Math.random() * 10) + 's'
            }}
          />
        ))}
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}
