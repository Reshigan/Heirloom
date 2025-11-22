'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Image, 
  Clock, 
  User, 
  Search, 
  Settings, 
  Bell, 
  Menu, 
  X, 
  Home,
  TreePine,
  Camera,
  Calendar,
  Star,
  Heart,
  Share2,
  MessageCircle,
  Award,
  MapPin,
  Filter,
  Grid3X3,
  List,
  Maximize2,
  ChevronRight,
  Plus,
  Mic,
  Sparkles,
  Upload,
  Play,
  Pause,
  Volume2,
  Key,
  CreditCard,
  HardDrive,
  UserPlus,
  LogOut
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from './auth-modal'
import FamilyTree from './family-tree'
import MemoryGallery from './memory-gallery'
import TimelineView from './timeline-view'
import UserProfile from './user-profile'
import LegacyTokenManager from './legacy-token-manager'
import PricingManager from './pricing-manager'
import StorageOptimizer from './storage-optimizer'
import ShareInviteSystem from './share-invite-system'
import StoryRecorder from './story-recorder'
import MemoryComments from './memory-comments'
import HighlightsTimeCapsules from './highlights-time-capsules'
import ImportWizard from './import-wizard'
import WeeklyDigest from './weekly-digest'
import AICurator from './ai-curator'
import { apiClient } from '@/lib/api'

type ViewMode = 'memories' | 'timeline' | 'heritage' | 'wisdom' | 'family' | 'highlights' | 'digest' | 'curator'

interface Memory {
  id: string
  title: string
  description: string
  date: string
  media_url?: string
  thumbnail_url?: string
  location?: string
  participants?: string[]
}

interface MemoryOrb {
  id: string
  memory: Memory
  position: { x: number; y: number }
  size: number
}

export default function FuturisticHeirloomInterface() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [currentView, setCurrentView] = useState<ViewMode>('memories')
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [showWisdomQuote, setShowWisdomQuote] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [particles, setParticles] = useState<Array<{ id: number; left: string; delay: number; duration: number }>>([])
  const [memoryOrbs, setMemoryOrbs] = useState<MemoryOrb[]>([])
  const [currentEra, setCurrentEra] = useState('Present')
  const [isRecording, setIsRecording] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showStoryRecorder, setShowStoryRecorder] = useState(false)
  const [showImportWizard, setShowImportWizard] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isWarping, setIsWarping] = useState(false)
  const [outgoingOrbs, setOutgoingOrbs] = useState<MemoryOrb[]>([])
  const [showWarpFlash, setShowWarpFlash] = useState(false)
  const [memories, setMemories] = useState<Memory[]>([])
  
  const showcaseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMemories = async () => {
      if (!isAuthenticated) {
        setIsLoading(false)
        setShowAuthModal(true) // Auto-open auth modal when not authenticated
        return
      }

      try {
        const data = await apiClient.getMemories()
        setMemories(data)
        
        // Create memory orbs from real data
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
  }, [isAuthenticated])

  useEffect(() => {
    // Generate golden dust particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      delay: Math.random() * 15,
      duration: 15 + Math.random() * 10
    }))
    setParticles(newParticles)

    // Remove loading screen
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        setIsLoading(false)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [isAuthenticated])

  // Handle mouse movement for parallax effect (only on desktop)
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
      { x: 10, y: 10 },   // top-left
      { x: 85, y: 5 },    // top-right
      { x: 85, y: 85 },   // bottom-right
      { x: 10, y: 85 },   // bottom-left
      { x: -5, y: 50 },   // left-center
      { x: 95, y: 50 }    // right-center
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

  const handleEraClick = async (era: string) => {
    if (isWarping || !isAuthenticated) return
    
    setCurrentEra(era)
    setIsWarping(true)
    
    setOutgoingOrbs(memoryOrbs)
    
    // Filter memories by era
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
    
    await new Promise(resolve => setTimeout(resolve, 450))
    
    setShowWarpFlash(true)
    await new Promise(resolve => setTimeout(resolve, 150))
    setShowWarpFlash(false)
    
    setMemoryOrbs(newOrbs)
    setOutgoingOrbs([])
    
    await new Promise(resolve => setTimeout(resolve, 600))
    setIsWarping(false)
  }

  const handleAddMemory = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }
    setShowImportWizard(true)
  }

  // Calculate parallax transform (only on desktop)
  const getParallaxTransform = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return 'none'
    const x = (mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1920) / 2) / (typeof window !== 'undefined' ? window.innerWidth : 1920) * 5
    const y = (mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 1080) / 2) / (typeof window !== 'undefined' ? window.innerHeight : 1080) * 5
    return `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-obsidian-900 flex items-center justify-center z-[10000]">
        <div className="text-center">
          <div className="w-20 h-20 border border-gold-500/20 border-t-gold-400 rounded-full mx-auto mb-8 animate-spin"></div>
          <div className="font-serif text-xl text-gold-400 tracking-[0.3em] animate-pulse">HEIRLOOM</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-obsidian-900 relative overflow-hidden font-light tracking-wide">
      {/* Refined Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-obsidian-900 z-[-3]" />
      <div 
        className="fixed inset-0 opacity-50 z-[-2]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212, 175, 55, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212, 175, 55, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}
      />

      {/* Golden Dust Particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="fixed w-0.5 h-0.5 bg-gold-400 rounded-full pointer-events-none z-[-1]"
          style={{ left: particle.left }}
          animate={{
            y: ['-100vh', '100vh'],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}

      {/* Sophisticated Navigation with Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 z-50">
        <div className="bg-gradient-to-br from-charcoal/80 via-charcoal/70 to-obsidian/80 backdrop-blur-2xl border border-gold/20 rounded-2xl px-6 py-4 shadow-2xl shadow-obsidian/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-6 sm:w-10 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent"></div>
              <h1 className="font-serif text-lg sm:text-xl lg:text-2xl text-gold-400 tracking-[0.2em] sm:tracking-[0.3em]">HEIRLOOM</h1>
            </div>
            
            <ul className="hidden lg:flex gap-4 xl:gap-6 text-xs uppercase tracking-[0.2em] text-gold-200/70">
              {[
                { id: 'memories', label: 'Memories' },
                { id: 'highlights', label: 'Highlights' },
                { id: 'curator', label: 'Search' },
                { id: 'timeline', label: 'Timeline' },
                { id: 'family', label: 'Family' },
                { id: 'digest', label: 'Digest' },
                { id: 'share', label: 'Share' },
                { id: 'tokens', label: 'Legacy' },
                { id: 'storage', label: 'Storage' }
              ].map(item => (
                <li
                  key={item.id}
                  className={`cursor-pointer transition-all duration-300 relative px-2 py-1 rounded-lg ${
                    currentView === item.id ? 'text-gold-400 bg-gold/10' : 'hover:text-gold-400 hover:bg-gold/5'
                  }`}
                  onClick={() => setCurrentView(item.id as ViewMode)}
                >
                  {item.label}
                  {currentView === item.id && (
                    <motion.div
                      className="absolute -bottom-1 left-0 w-full h-px bg-gold-400"
                      layoutId="nav-indicator"
                    />
                  )}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 sm:gap-4">
              {isAuthenticated ? (
                <>
                  <a
                    href="/billing"
                    className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/30 text-gold-400 hover:from-gold/30 hover:to-gold/20 transition-all text-xs uppercase tracking-wider"
                  >
                    <CreditCard className="w-3 h-3" />
                    Billing
                  </a>
                  <div className="hidden sm:block text-xs text-gold-200/70">
                    {user?.name} • {user?.family_name}
                  </div>
                  <button
                    onClick={() => setShowProfile(true)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all"
                  >
                    <User className="w-4 h-4" />
                  </button>
                  <button
                    onClick={logout}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-2 sm:px-4 rounded-lg border border-gold-500/30 text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all text-xs uppercase tracking-wider"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 sm:pt-24 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {currentView === 'memories' && (
            <motion.div
              key="memories-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen flex items-center justify-center relative"
            >
              {/* Wisdom Quote - Hidden on mobile */}
              <AnimatePresence>
                {showWisdomQuote && selectedMemory && (
                  <motion.div
                    className="hidden lg:block fixed left-16 top-1/2 transform -translate-y-1/2 w-72 z-40"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                  >
                    <div className="text-6xl font-serif text-gold-400/30 leading-none">"</div>
                    <div className="font-serif text-xl text-pearl leading-relaxed italic my-5">
                      {selectedMemory.description}
                    </div>
                    <div className="text-xs uppercase tracking-[0.15em] text-gold-200/70">
                      — {mockFamilyMembers.find(m => selectedMemory.participants.includes(m.id))?.name || 'Family Member'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Memory Gallery - Circular on desktop, linear on mobile */}
              <div className="relative w-full max-w-6xl h-[60vh] sm:h-[70vh] flex items-center justify-center">
                {/* Desktop: Circular Timeline */}
                <div 
                  ref={showcaseRef}
                  className="hidden lg:block relative w-[300px] h-[300px] xl:w-[500px] xl:h-[500px]"
                  style={{ 
                    transform: getParallaxTransform(),
                    pointerEvents: isWarping ? 'none' : 'auto'
                  }}
                >
                  {/* Rotating Frame */}
                  <div className="absolute inset-0 border border-gold-500/30 rounded-full animate-spin-slow">
                    <div className="absolute inset-0 border border-gold-500/20 rounded-full scale-120"></div>
                    <div className="absolute inset-0 border border-gold-500/20 rounded-full scale-80"></div>
                  </div>

                  {/* Warp Flash Overlay */}
                  <AnimatePresence>
                    {showWarpFlash && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 rounded-full bg-gradient-radial from-gold-400/40 via-gold-400/20 to-transparent pointer-events-none z-20"
                        style={{
                          boxShadow: '0 0 80px rgba(212, 175, 55, 0.6), inset 0 0 80px rgba(212, 175, 55, 0.3)'
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Outgoing Memory Orbs (warping out) */}
                  <AnimatePresence>
                    {outgoingOrbs.map((orb, index) => {
                      // Calculate outward direction from center
                      const centerX = 50
                      const centerY = 50
                      const dx = orb.position.x - centerX
                      const dy = orb.position.y - centerY
                      const distance = Math.sqrt(dx * dx + dy * dy)
                      const outwardX = orb.position.x + (dx / distance) * 150
                      const outwardY = orb.position.y + (dy / distance) * 150
                      
                      return (
                        <motion.div
                          key={`${orb.id}-out`}
                          className="absolute"
                          style={{
                            left: `${orb.position.x}%`,
                            top: `${orb.position.y}%`,
                            width: `${orb.size}px`,
                            height: `${orb.size}px`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          initial={{ 
                            left: `${orb.position.x}%`,
                            top: `${orb.position.y}%`,
                            scale: 1,
                            opacity: 1,
                            filter: 'blur(0px)'
                          }}
                          exit={{ 
                            left: `${outwardX}%`,
                            top: `${outwardY}%`,
                            scale: 0.7,
                            opacity: 0,
                            filter: 'blur(6px)'
                          }}
                          transition={{ 
                            duration: 0.45,
                            delay: index * 0.03,
                            ease: [0.16, 1, 0.3, 1]
                          }}
                        >
                          <div className="w-full h-full rounded-full overflow-hidden border border-gold-500/30">
                            <img
                              src={orb.memory.thumbnail}
                              alt={orb.memory.title}
                              className="w-full h-full object-cover opacity-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                          </div>
                          {/* Light trail */}
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: `linear-gradient(${Math.atan2(dy, dx) * 180 / Math.PI}deg, transparent, rgba(212, 175, 55, 0.3), transparent)`,
                              filter: 'blur(8px)'
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>

                  {/* Incoming Memory Orbs (warping in from center) */}
                  {memoryOrbs.map((orb, index) => (
                    <motion.div
                      key={`${orb.id}-in`}
                      className="absolute cursor-pointer"
                      style={{
                        width: `${orb.size}px`,
                        height: `${orb.size}px`,
                      }}
                      initial={{ 
                        left: '50%',
                        top: '50%',
                        x: '-50%',
                        y: '-50%',
                        scale: 0.3,
                        opacity: 0.4,
                        filter: 'blur(8px)'
                      }}
                      animate={{ 
                        left: `${orb.position.x}%`,
                        top: `${orb.position.y}%`,
                        x: '-50%',
                        y: '-50%',
                        scale: [0.3, 1.04, 1],
                        opacity: 1,
                        filter: 'blur(0px)'
                      }}
                      transition={{ 
                        duration: 0.55,
                        delay: index * 0.03,
                        ease: [0.16, 1, 0.3, 1]
                      }}
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                      onMouseEnter={() => !isWarping && handleOrbHover(orb)}
                      onMouseLeave={handleOrbLeave}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden border border-gold-500/30 hover:border-gold-400 transition-all duration-500 hover:shadow-2xl hover:shadow-gold-400/30">
                        <img
                          src={orb.memory.thumbnail}
                          alt={orb.memory.title}
                          className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                      </div>
                      {/* Bloom particles */}
                      {isWarping && (
                        <>
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-gold-400 rounded-full"
                              style={{
                                left: '50%',
                                top: '50%',
                              }}
                              initial={{ 
                                x: 0,
                                y: 0,
                                opacity: 0.8,
                                scale: 1
                              }}
                              animate={{ 
                                x: Math.cos(i * 120 * Math.PI / 180) * 40,
                                y: Math.sin(i * 120 * Math.PI / 180) * 40,
                                opacity: 0,
                                scale: 0.3
                              }}
                              transition={{ 
                                duration: 0.4,
                                delay: index * 0.03 + 0.1,
                                ease: 'easeOut'
                              }}
                            />
                          ))}
                        </>
                      )}
                    </motion.div>
                  ))}

                  {/* Central Focus */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 z-10">
                    <div className="w-full h-full rounded-full border-2 border-gold-400 overflow-hidden bg-gradient-to-br from-gold-400/5 to-transparent backdrop-blur-sm shadow-2xl shadow-gold-400/20">
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-14 h-14 border border-gold-400 rounded-full flex items-center justify-center font-serif text-xl text-gold-400 mb-4">
                          H
                        </div>
                        <div className="font-serif text-xl text-gold-400 mb-2 tracking-wide">The Hamilton Legacy</div>
                        <div className="text-xs uppercase tracking-[0.2em] text-gold-200/70">Five Generations • One Story</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile/Tablet: Linear Timeline */}
                <div className="lg:hidden w-full max-w-2xl mx-auto">
                  <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] scroll-smooth snap-y snap-mandatory px-4">
                    {mockMemories.slice(0, 6).map((memory, index) => (
                      <motion.div
                        key={memory.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="snap-start flex-shrink-0"
                      >
                        <div className="bg-obsidian-800/60 border border-gold-500/20 rounded-xl p-4 hover:border-gold-400/40 transition-all">
                          <div className="flex gap-4">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 border border-gold-500/30">
                              <img
                                src={memory.thumbnail}
                                alt={memory.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-serif text-base sm:text-lg text-gold-400 mb-1 truncate">{memory.title}</h3>
                              <p className="text-xs sm:text-sm text-gold-200/70 mb-2 line-clamp-2">{memory.description}</p>
                              <div className="flex items-center gap-2 text-xs text-gold-200/50">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(memory.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'timeline' && (
            <motion.div
              key="timeline-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-screen"
            >
              <TimelineView 
                selectedMemberId={selectedMember?.id}
                onEventSelect={setSelectedEvent}
              />
            </motion.div>
          )}

          {currentView === 'heritage' && (
            <motion.div
              key="heritage-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-screen"
            >
              <MemoryGallery 
                selectedMemberId={selectedMember?.id}
                onMemorySelect={setSelectedMemory}
              />
            </motion.div>
          )}

          {currentView === 'wisdom' && (
            <motion.div
              key="wisdom-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="min-h-screen flex items-center justify-center"
            >
              <div className="text-center max-w-4xl px-8">
                <div className="text-8xl font-serif text-gold-400/30 mb-8">"</div>
                <div className="font-serif text-4xl text-pearl leading-relaxed italic mb-8">
                  The stories we tell about our past shape our children's future
                </div>
                <div className="text-sm uppercase tracking-[0.2em] text-gold-200/70">
                  — Grandmother Elizabeth Hamilton, 1952
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'family' && (
            <motion.div
              key="family-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-screen"
            >
              <FamilyTree onMemberSelect={setSelectedMember} />
            </motion.div>
          )}

          {currentView === 'tokens' && (
            <motion.div
              key="tokens-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-screen"
            >
              <LegacyTokenManager />
            </motion.div>
          )}

          {currentView === 'pricing' && (
            <motion.div
              key="pricing-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-screen"
            >
              <PricingManager />
            </motion.div>
          )}

          {currentView === 'storage' && (
            <motion.div
              key="storage-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-screen"
            >
              <StorageOptimizer />
            </motion.div>
          )}

          {currentView === 'share' && (
            <motion.div
              key="share-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-screen"
            >
              <ShareInviteSystem />
            </motion.div>
          )}

          {currentView === 'highlights' && (
            <motion.div
              key="highlights-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-screen"
            >
              <HighlightsTimeCapsules />
            </motion.div>
          )}

          {currentView === 'digest' && (
            <motion.div
              key="digest-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-screen"
            >
              <WeeklyDigest />
            </motion.div>
          )}

          {currentView === 'curator' && (
            <motion.div
              key="curator-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-screen"
            >
              <AICurator />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Elegant Timeline */}
      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 w-4/5 max-w-4xl p-8 bg-charcoal/80 backdrop-blur-xl border border-gold-500/20 rounded-2xl z-30">
        <div className="relative h-0.5 bg-gold-500/10 my-5">
          <div className="absolute h-full w-3/5 bg-gradient-to-r from-transparent via-gold-400 to-transparent animate-pulse"></div>
          
          {['1920s', '1950s', '1980s', '2000s', 'Present'].map((era, index) => (
            <button
              key={era}
              className={`absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all duration-300 hover:w-4 hover:h-4 ${
                currentEra === era 
                  ? 'bg-gold-400 border-gold-400 shadow-lg shadow-gold-400/50' 
                  : 'bg-charcoal border-gold-400 hover:shadow-lg hover:shadow-gold-400/30'
              }`}
              style={{ left: `${10 + index * 20}%` }}
              onClick={() => handleEraClick(era)}
            >
              <span className="absolute top-5 left-1/2 transform -translate-x-1/2 text-xs tracking-wide text-gold-200/60 whitespace-nowrap">
                {era}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {showDetailPanel && selectedMemory && (
          <motion.div
            className="fixed right-10 top-1/2 transform -translate-y-1/2 w-[480px] max-h-[80vh] overflow-y-auto bg-charcoal/95 backdrop-blur-xl border border-gold-500/20 rounded-2xl p-8 z-40"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <div className="border-b border-gold-500/20 pb-5 mb-6">
              <h3 className="font-serif text-2xl text-gold-400 mb-2">{selectedMemory.title}</h3>
              <p className="text-xs uppercase tracking-[0.15em] text-gold-200/70">A cherished family memory</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-gold-200/60 mb-2">Captured</div>
                <div className="text-pearl">{new Date(selectedMemory.date).toLocaleDateString()}</div>
              </div>
              
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-gold-200/60 mb-2">Location</div>
                <div className="text-pearl">{selectedMemory.location}</div>
              </div>
              
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-gold-200/60 mb-2">Present</div>
                <div className="text-pearl">
                  {selectedMemory.participants.map(id => 
                    mockFamilyMembers.find(m => m.id === id)?.name
                  ).filter(Boolean).join(', ')}
                </div>
              </div>
              
              {selectedMemory.aiEnhanced && (
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-gold-200/60 mb-2">AI Enhancement</div>
                  <div className="text-pearl">Restored • Colorized • Clarified</div>
                </div>
              )}

              <div className="border-t border-gold-500/20 pt-6">
                <MemoryComments memoryId={selectedMemory.id} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Bar */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-4 z-50">
        <motion.button
          className="w-14 h-14 rounded-full bg-charcoal/90 backdrop-blur-xl border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRecordStory}
        >
          {isRecording ? <Pause className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </motion.button>
        
        <motion.button
          className="w-14 h-14 rounded-full bg-charcoal/90 backdrop-blur-xl border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAIEnhance}
        >
          <Sparkles className="w-5 h-5" />
        </motion.button>
        
        <motion.button
          className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center text-obsidian-900 hover:from-gold-500 hover:to-gold-300 transition-all duration-300 shadow-lg shadow-gold-400/30"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddMemory}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>

      {/* User Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <UserProfile onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>

      {/* Story Recorder Modal */}
      <AnimatePresence>
        {showStoryRecorder && (
          <StoryRecorder 
            onClose={() => setShowStoryRecorder(false)}
            onSave={(story) => {
              console.log('Story saved:', story)
              setShowStoryRecorder(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Import Wizard Modal */}
      <AnimatePresence>
        {showImportWizard && (
          <ImportWizard 
            onClose={() => setShowImportWizard(false)}
            onComplete={(results) => {
              console.log('Import complete:', results)
              setShowImportWizard(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,300;6..96,400;6..96,600&family=Montserrat:wght@200;300;400;500&display=swap');
        
        .font-serif {
          font-family: 'Bodoni Moda', serif;
        }
        
        .animate-spin-slow {
          animation: spin 60s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .scale-120 {
          transform: scale(1.2);
        }
        
        .scale-80 {
          transform: scale(0.8);
        }
      `}</style>
    </div>
  )
}
