'use client'

import React, { useEffect, useState, useRef, Suspense, lazy } from 'react'
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
  LogOut,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useVault } from '@/contexts/VaultContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { AuthModal } from './auth-modal'
import VaultUploadModal from './vault-upload-modal'
import RecipientManagement from './recipient-management'
import CheckInManagement from './check-in-management'
import TrustedContacts from './trusted-contacts'
import { NotificationCenter } from './notification-center'
import { AdvancedSearch } from './advanced-search'
import VaultStatsDashboard from './vault-stats-dashboard'
import { VaultUnlockModal } from './vault-unlock-modal'
import FamilyTree from './family-tree'
import MemoryGallery from './memory-gallery'
import TimelineView from './timeline-view'
import DynamicTimelineView from './dynamic-timeline-view'
import SentimentWelcome from './sentiment-welcome'
import UserProfile from './user-profile'
import LegacyTokenManager from './legacy-token-manager'
import PricingManager from './pricing-manager'
import StorageOptimizer from './storage-optimizer'
import ShareInviteSystem from './share-invite-system'
import StoryRecorder from './story-recorder'
import MemoryComments from './memory-comments'
import ImportWizard from './import-wizard'
import WeeklyDigest from './weekly-digest'
import AICurator from './ai-curator'
import PlatformTour from './platform-tour'
import { apiClient } from '@/lib/api-client'

const StoryReels = lazy(() => import('./story-reels'))
const AfterImGoneLetters = lazy(() => import('./after-im-gone-letters'))
const MemorialPages = lazy(() => import('./memorial-pages'))
const HighlightsTimeCapsules = lazy(() => import('./highlights-time-capsules'))

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader2 className="w-12 h-12 text-gold-400 animate-spin mx-auto mb-4" />
      <p className="text-gold-300 font-serif">Loading...</p>
    </div>
  </div>
)

type ViewMode = 'memories' | 'timeline' | 'heritage' | 'wisdom' | 'family' | 'highlights' | 'digest' | 'curator'

interface Memory {
  id: string
  title: string
  description: string
  date: string
  media_url?: string
  thumbnail_url?: string
  thumbnailUrl?: string
  location?: string
  participants?: string[]
  sentimentLabel?: string
  sentimentScore?: number
  emotionCategory?: string
  keywords?: string[]
  importanceScore?: number
}

interface MemoryOrb {
  id: string
  memory: Memory
  position: { x: number; y: number }
  size: number
}

export default function FuturisticHeirloomInterface() {
  const { user, isAuthenticated, isLoading: authLoading, token, hasCheckedAuth, logout, vmkSalt } = useAuth()
  const { unreadCount } = useNotifications()
  const { vaultEncryption, isInitialized: vaultInitialized, initializeVault } = useVault()
  const [currentView, setCurrentView] = useState<ViewMode>('memories')
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
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
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showRecipientManagement, setShowRecipientManagement] = useState(false)
  const [showCheckInManagement, setShowCheckInManagement] = useState(false)
  const [showTrustedContacts, setShowTrustedContacts] = useState(false)
  const [showVaultStats, setShowVaultStats] = useState(false)
  const [isWarping, setIsWarping] = useState(false)
  const [outgoingOrbs, setOutgoingOrbs] = useState<MemoryOrb[]>([])
  const [showWarpFlash, setShowWarpFlash] = useState(false)
  const [memories, setMemories] = useState<Memory[]>([])
  const [showTour, setShowTour] = useState(false)
  const [showStoryReels, setShowStoryReels] = useState(false)
  const [showAfterImGoneLetters, setShowAfterImGoneLetters] = useState(false)
  const [showMemorialPages, setShowMemorialPages] = useState(false)
  const [showVaultUnlock, setShowVaultUnlock] = useState(false)
  
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
        
        // Create memory orbs from real data
        const orbs: MemoryOrb[] = data.slice(0, 6).map((memory, index) => ({
          id: memory.id,
          memory,
          position: getOrbPosition(index),
          size: 120
        }))
        setMemoryOrbs(orbs)
        
        const hasSeenTour = typeof window !== 'undefined' ? localStorage.getItem('heirloom:tour:completed') : null
        if (!hasSeenTour) {
          setTimeout(() => setShowTour(true), 1500)
        }
      } catch (error) {
        console.error('Failed to fetch memories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMemories()
  }, [isAuthenticated, authLoading, token, hasCheckedAuth])

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
          console.error('Cannot initialize vault: password not found in session storage')
          return
        }
      } catch (error) {
        console.error('Failed to initialize vault encryption:', error)
        return
      }
    }
    
    setShowUploadModal(true)
  }

  const handleRecordStory = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }
    setShowStoryRecorder(true)
  }

  const handleAIEnhance = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }
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

  const handleTourComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('heirloom:tour:completed', 'true')
    }
    setShowTour(false)
  }

  const handleTourSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('heirloom:tour:completed', 'true')
    }
    setShowTour(false)
  }

  const handleRestartTour = () => {
    setShowTour(true)
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
      <div className="fixed inset-0 bg-obsidian-900 flex items-center justify-center z-[10000]" data-testid="loading-screen">
        <div className="text-center">
          <div className="w-20 h-20 border border-gold-500/20 border-t-gold-400 rounded-full mx-auto mb-8 animate-spin" role="progressbar" aria-label="Loading"></div>
          <div className="font-serif text-xl text-gold-400 tracking-[0.3em] animate-pulse" data-testid="brand">HEIRLOOM</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Luxury Background Layers */}
      <div className="luxury-bg" />
      <div className="elegant-grid" />

      {/* Golden Dust Particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="golden-dust"
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

      {/* Luxury Navigation */}
      <nav className="luxury-nav">
        <div className="logo" data-testid="brand" aria-label="Heirloom">
          HEIRLOOM
        </div>
        
        <ul className="nav-menu">
              {[
                { id: 'memories', label: 'Memories' },
                { id: 'highlights', label: 'Highlights' },
                { id: 'curator', label: 'Search' },
                { id: 'timeline', label: 'Timeline' },
                { id: 'family', label: 'Family' },
                { id: 'recipients', label: 'Recipients', onClick: () => setShowRecipientManagement(true), testId: 'nav-recipients' },
                { id: 'checkin', label: 'Check-in', onClick: () => setShowCheckInManagement(true), testId: 'nav-checkin' },
                { id: 'contacts', label: 'Contacts', onClick: () => setShowTrustedContacts(true), testId: 'nav-contacts' },
                { id: 'stats', label: 'Stats', onClick: () => setShowVaultStats(true), testId: 'nav-stats' },
                { id: 'digest', label: 'Digest' },
                { id: 'reels', label: 'Story Reels', onClick: () => setShowStoryReels(true), testId: 'nav-reels' },
                { id: 'letters', label: 'Letters', onClick: () => setShowAfterImGoneLetters(true), testId: 'nav-letters' },
                { id: 'memorial', label: 'Memorial', onClick: () => setShowMemorialPages(true), testId: 'nav-memorial' },
                { id: 'tokens', label: 'Legacy' }
              ].map(item => (
                <li
                  key={item.id}
                  className="nav-item"
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick()
                    } else {
                      setCurrentView(item.id as ViewMode)
                    }
                  }}
                  data-testid={item.testId || `nav-${item.id}`}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (item.onClick) {
                        item.onClick()
                      } else {
                        setCurrentView(item.id as ViewMode)
                      }
                    }
                  }}
                >
                  {item.label}
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
                    onClick={() => setShowSearch(true)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                    aria-label="Search"
                    data-testid="search-button"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowNotifications(true)}
                    className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                    aria-label="Notifications"
                    data-testid="notification-bell"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 text-obsidian-900 text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowProfile(true)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                    aria-label="Profile"
                    data-testid="profile-button"
                  >
                    <User className="w-4 h-4" />
                  </button>
                  <button
                    onClick={logout}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                    title="Logout"
                    aria-label="Logout"
                    data-testid="logout-button"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-2 sm:px-4 rounded-lg border border-gold-500/30 text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all text-xs uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                  data-testid="sign-in-button"
                >
                  Sign In
                </button>
              )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="heritage-container">
        <AnimatePresence mode="wait">
          {currentView === 'memories' && (
            <motion.div
              key="memories-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Wisdom Quote */}
              <AnimatePresence>
                {showWisdomQuote && selectedMemory && (
                  <motion.div
                    className="wisdom-quote active"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                  >
                    <div className="quote-mark">"</div>
                    <div className="quote-text">
                      {selectedMemory.description}
                    </div>
                    <div className="quote-author">
                      — Family Member
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Memory Gallery */}
              <div className="memory-gallery">
                {/* Memory Showcase */}
                <div 
                  ref={showcaseRef}
                  className="memory-showcase"
                  style={{ 
                    transform: getParallaxTransform(),
                    pointerEvents: isWarping ? 'none' : 'auto'
                  }}
                >
                  {/* Rotating Frame */}
                  <div className="showcase-frame"></div>

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
                              src={orb.memory.thumbnailUrl || orb.memory.thumbnail_url}
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
                      className="memory-orb"
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
                      role="button"
                      tabIndex={0}
                      aria-label={`View memory: ${orb.memory.title}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleOrbHover(orb)
                        }
                      }}
                    >
                      <div className="orb-container">
                        <div className="orb-content">
                          <img
                            src={orb.memory.thumbnail}
                            alt={orb.memory.title}
                            className="orb-image"
                          />
                          <div className="orb-overlay" />
                        </div>
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
                  <div className="central-memory">
                    <div className="central-frame">
                      <div className="central-content">
                        <div className="family-crest">H</div>
                        <div className="family-name">Your Heritage</div>
                        <div className="family-tagline">Eternal Legacy</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile/Tablet: Linear Timeline */}
                <div className="lg:hidden w-full max-w-2xl mx-auto">
                  <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] scroll-smooth snap-y snap-mandatory px-4">
                    {memories.slice(0, 6).map((memory, index) => (
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
                                src={memory.thumbnailUrl || memory.thumbnail_url}
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
              className="h-screen overflow-y-auto"
            >
              <div className="container mx-auto px-4 py-8">
                <SentimentWelcome 
                  memories={memories.map(m => ({
                    id: m.id,
                    title: m.title,
                    createdAt: m.date,
                    sentimentLabel: (m as any).sentimentLabel,
                    emotionCategory: (m as any).emotionCategory,
                    sentimentScore: (m as any).sentimentScore,
                    keywords: (m as any).keywords
                  }))}
                />
                <DynamicTimelineView 
                  memories={memories.map(m => ({
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    date: m.date,
                    thumbnailUrl: m.thumbnailUrl || m.thumbnail_url,
                    location: m.location,
                    participants: m.participants,
                    sentimentLabel: (m as any).sentimentLabel,
                    emotionCategory: (m as any).emotionCategory,
                    importanceScore: (m as any).importanceScore
                  }))}
                  onMemorySelect={(memory) => setSelectedMemory(memories.find(m => m.id === memory.id) || null)}
                />
              </div>
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
      <div className="timeline-elegant">
        <div className="timeline-track">
          <div className="timeline-progress"></div>
          
          {['1920s', '1950s', '1980s', '2000s', 'Present'].map((era, index) => (
            <button
              key={era}
              className="era-marker"
              style={{ left: `${10 + index * 20}%` }}
              onClick={() => handleEraClick(era)}
              data-year={era}
            />
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {showDetailPanel && selectedMemory && (
          <motion.div
            className={`detail-panel ${showDetailPanel ? 'active' : ''}`}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <div className="detail-header">
              <h3 className="detail-title">{selectedMemory.title}</h3>
              <p className="detail-subtitle">A cherished family memory</p>
            </div>
            
            <div className="detail-content">
              <div className="detail-item">
                <div className="detail-label">Captured</div>
                <div className="detail-value">{new Date(selectedMemory.date).toLocaleDateString()}</div>
              </div>
              
              <div className="detail-item">
                <div className="detail-label">Location</div>
                <div className="detail-value">{selectedMemory.location}</div>
              </div>
              
              {selectedMemory.participants && selectedMemory.participants.length > 0 && (
                <div className="detail-item">
                  <div className="detail-label">Present</div>
                  <div className="detail-value">
                    {selectedMemory.participants.length} {selectedMemory.participants.length === 1 ? 'person' : 'people'}
                  </div>
                </div>
              )}
              
              {selectedMemory.aiEnhanced && (
                <div className="detail-item">
                  <div className="detail-label">AI Enhancement</div>
                  <div className="detail-value">Restored • Colorized • Clarified</div>
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
      <div className="action-bar">
        <motion.button
          className="luxury-fab primary"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddMemory}
          data-testid="add-memory-button"
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

      {/* Vault Unlock Modal */}
      {showVaultUnlock && (
        <VaultUnlockModal
          isOpen={showVaultUnlock}
          onClose={() => setShowVaultUnlock(false)}
          onUnlock={handleVaultUnlock}
        />
      )}

      {/* Vault Upload Modal */}
      {vaultEncryption && (
        <VaultUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
          vaultEncryption={vaultEncryption}
        />
      )}

      {/* Recipient Management Modal */}
      <AnimatePresence>
        {showRecipientManagement && (
          <RecipientManagement onClose={() => setShowRecipientManagement(false)} />
        )}
      </AnimatePresence>

      {/* Check-in Management Modal */}
      <AnimatePresence>
        {showCheckInManagement && (
          <CheckInManagement onClose={() => setShowCheckInManagement(false)} />
        )}
      </AnimatePresence>

      {/* Trusted Contacts Modal */}
      <AnimatePresence>
        {showTrustedContacts && (
          <TrustedContacts onClose={() => setShowTrustedContacts(false)} />
        )}
      </AnimatePresence>


      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      <AdvancedSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onResultClick={(itemId) => {
          // Handle memory selection
        }}
      />
      {/* Vault Stats Dashboard Modal */}
      <AnimatePresence>
        {showVaultStats && (
          <VaultStatsDashboard onClose={() => setShowVaultStats(false)} />
        )}
      </AnimatePresence>

      {/* Platform Tour */}
      {showTour && (
        <PlatformTour onComplete={handleTourComplete} onSkip={handleTourSkip} />
      )}

      {/* Viral Growth Features */}
      {showStoryReels && (
        <Suspense fallback={<LoadingSpinner />}>
          <StoryReels onClose={() => setShowStoryReels(false)} />
        </Suspense>
      )}

      {showAfterImGoneLetters && (
        <Suspense fallback={<LoadingSpinner />}>
          <AfterImGoneLetters onClose={() => setShowAfterImGoneLetters(false)} />
        </Suspense>
      )}

      {showMemorialPages && (
        <Suspense fallback={<LoadingSpinner />}>
          <MemorialPages onClose={() => setShowMemorialPages(false)} />
        </Suspense>
      )}
    </div>
  )
}
