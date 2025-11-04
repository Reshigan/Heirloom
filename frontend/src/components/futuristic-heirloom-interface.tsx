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
  Video
} from 'lucide-react'
import FamilyTree from './family-tree'
import MemoryGallery from './memory-gallery'
import TimelineView from './timeline-view'
import UserProfile from './user-profile'
import LegacyTokenManager from './legacy-token-manager'
import PricingManager from './pricing-manager'
import StorageOptimizer from './storage-optimizer'
import ShareInviteSystem from './share-invite-system'
import PlatformTour from './platform-tour'
import NotificationCenter from './notification-center'
import TokenRedemptionModal from './token-redemption-modal'
import VaultHealthMonitor from './vault-health-monitor'
import MultiVaultManager from './multi-vault-manager'
import ExecutorGuardianManager from './executor-guardian-manager'
import AIFeaturesPanel from './ai-features-panel'
import LegacyVideoRecorder from './legacy-video-recorder'
import { mockFamilyMembers, mockMemories, mockTimelineEvents, FamilyMember, Memory, TimelineEvent } from '../data/mock-family-data'

type ViewMode = 'memories' | 'timeline' | 'heritage' | 'wisdom' | 'family' | 'tokens' | 'pricing' | 'storage' | 'share' | 'vault-health' | 'multi-vault' | 'executors' | 'ai-features'

interface MemoryOrb {
  id: string
  memory: Memory
  position: { x: number; y: number }
  size: number
}

export default function FuturisticHeirloomInterface() {
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
  const [showTour, setShowTour] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(3)
  const [userPlan] = useState<'essential' | 'premium' | 'unlimited' | 'dynasty'>('premium')
  const [showTokenRedemption, setShowTokenRedemption] = useState(false)
  const [showLegacyVideoRecorder, setShowLegacyVideoRecorder] = useState(false)
  
  const showcaseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tourCompleted = localStorage.getItem('heirloom-tour-completed')
    if (!tourCompleted) {
      // Show tour after loading screen
      setTimeout(() => setShowTour(true), 3500)
    }
  }, [])

  useEffect(() => {
    // Generate golden dust particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      delay: Math.random() * 15,
      duration: 15 + Math.random() * 10
    }))
    setParticles(newParticles)

    // Create memory orbs from our data
    const orbs: MemoryOrb[] = mockMemories.slice(0, 6).map((memory, index) => ({
      id: memory.id,
      memory,
      position: getOrbPosition(index),
      size: memory.significance === 'milestone' ? 140 : memory.significance === 'high' ? 120 : 100
    }))
    setMemoryOrbs(orbs)

    // Remove loading screen
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // Handle mouse movement for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
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

  const handleEraClick = (era: string) => {
    setCurrentEra(era)
    // Filter memories by era
    const filteredMemories = mockMemories.filter(memory => {
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
      size: memory.significance === 'milestone' ? 140 : memory.significance === 'high' ? 120 : 100
    }))
    setMemoryOrbs(newOrbs)
  }

  const handleRecordStory = () => {
    setIsRecording(!isRecording)
    // In a real app, this would start/stop audio recording
  }

  const handleAIEnhance = () => {
    // In a real app, this would trigger AI enhancement
    console.log('AI Enhancement triggered')
  }

  const handleAddMemory = () => {
    setCurrentView('memories')
    // This would open the memory upload modal
  }

  // Calculate parallax transform
  const getParallaxTransform = () => {
    const x = (mousePosition.x - window.innerWidth / 2) / window.innerWidth * 5
    const y = (mousePosition.y - window.innerHeight / 2) / window.innerHeight * 5
    return `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-obsidian-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-20 h-20 border border-gold-500/20 border-t-gold-400 rounded-full mx-auto mb-8 animate-spin"></div>
          <div className="font-serif text-xl text-gold-400 tracking-[0.3em] animate-pulse mb-4">HEIRLOOM</div>
          <div className="font-light text-sm text-gold-300/80 tracking-[0.2em] animate-pulse">Connecting Generations</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-obsidian-900 relative overflow-hidden font-light tracking-wide">
      {/* Enhanced Background with Radial Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-obsidian-900 z-[-3]" />
      <div className="fixed inset-0 bg-gradient-radial from-gold-500/5 via-transparent to-transparent z-[-2]" />
      <div 
        className="fixed inset-0 opacity-30 z-[-1]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212, 175, 55, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212, 175, 55, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Enhanced Golden Dust Particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="fixed w-1 h-1 bg-gold-400 rounded-full pointer-events-none z-[-1] blur-[0.5px]"
          style={{ left: particle.left }}
          animate={{
            y: ['-100vh', '100vh'],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}

      {/* Enhanced Sophisticated Navigation */}
      <nav className="fixed top-0 left-0 right-0 p-8 z-50 flex justify-between items-center bg-gradient-to-b from-obsidian-900/95 via-obsidian-900/80 to-transparent backdrop-blur-2xl border-b border-gold-500/10" data-tour="navigation">
        <div className="flex items-center gap-4" data-tour="logo">
          <motion.div 
            className="w-12 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <h1 className="font-serif text-2xl text-gold-400 tracking-[0.3em] drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">HEIRLOOM</h1>
        </div>
        
        <ul className="hidden md:flex gap-8 text-xs uppercase tracking-[0.2em] text-gold-200/70">
          {[
            { id: 'memories', label: 'Memories', tourId: '' },
            { id: 'timeline', label: 'Timeline', tourId: 'timeline-nav' },
            { id: 'family', label: 'Family', tourId: 'family-nav' },
            { id: 'tokens', label: 'Legacy', tourId: 'legacy-nav' },
            { id: 'vault-health', label: 'Health', tourId: '' },
            { id: 'executors', label: 'Executors', tourId: '' },
            { id: 'ai-features', label: 'AI', tourId: '' },
            { id: 'pricing', label: 'Plans', tourId: '' }
          ].map(item => (
            <motion.li
              key={item.id}
              className={`cursor-pointer transition-all duration-500 relative ${
                currentView === item.id ? 'text-gold-400 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : 'hover:text-gold-300'
              }`}
              onClick={() => setCurrentView(item.id as ViewMode)}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              data-tour={item.tourId}
            >
              {item.label}
              {currentView === item.id && (
                <motion.div
                  className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent shadow-[0_0_8px_rgba(212,175,55,0.6)]"
                  layoutId="nav-indicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <motion.button
            onClick={() => setShowTokenRedemption(true)}
            className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-300 backdrop-blur-sm bg-obsidian-800/30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Redeem Legacy Token"
          >
            <Key className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            onClick={() => setShowNotifications(true)}
            className="relative w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-300 backdrop-blur-sm bg-obsidian-800/30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 text-obsidian-900 text-xs font-bold rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </motion.button>
          
          <motion.button
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-300 backdrop-blur-sm bg-obsidian-800/30"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
          >
            <User className="w-4 h-4" />
          </motion.button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-20">
        <AnimatePresence mode="wait">
          {currentView === 'memories' && (
            <motion.div
              key="memories-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen flex items-center justify-center relative"
            >
              {/* Wisdom Quote */}
              <AnimatePresence>
                {showWisdomQuote && selectedMemory && (
                  <motion.div
                    className="fixed left-16 top-1/2 transform -translate-y-1/2 w-72 z-40"
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

              {/* Memory Gallery */}
              <div className="relative w-full max-w-6xl h-[70vh] flex items-center justify-center" data-tour="constellation">
                <div 
                  ref={showcaseRef}
                  className="relative w-[500px] h-[500px]"
                  style={{ transform: getParallaxTransform() }}
                >
                  {/* Enhanced Rotating Frame with Glow */}
                  <div className="absolute inset-0 border border-gold-500/40 rounded-full animate-spin-slow shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                    <div className="absolute inset-0 border border-gold-500/25 rounded-full scale-120 shadow-[0_0_20px_rgba(212,175,55,0.15)]"></div>
                    <div className="absolute inset-0 border border-gold-500/25 rounded-full scale-80 shadow-[0_0_15px_rgba(212,175,55,0.15)]"></div>
                  </div>

                  {/* Memory Orbs */}
                  {memoryOrbs.map((orb, index) => (
                    <motion.div
                      key={orb.id}
                      className="absolute cursor-pointer"
                      style={{
                        left: `${orb.position.x}%`,
                        top: `${orb.position.y}%`,
                        width: `${orb.size}px`,
                        height: `${orb.size}px`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        y: Math.sin(Date.now() * 0.001 + index) * 3
                      }}
                      transition={{ delay: index * 0.2 }}
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                      onMouseEnter={() => handleOrbHover(orb)}
                      onMouseLeave={handleOrbLeave}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-gold-500/40 hover:border-gold-400 transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                        <img
                          src={orb.memory.thumbnail}
                          alt={orb.memory.title}
                          className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-all duration-500 hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-gold-400/0 hover:bg-gold-400/10 transition-all duration-500 pointer-events-none" />
                      </div>
                    </motion.div>
                  ))}

                  {/* Enhanced Central Focus */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 z-10">
                    <motion.div 
                      className="w-full h-full rounded-full border-2 border-gold-400 overflow-hidden bg-gradient-to-br from-gold-400/10 via-gold-500/5 to-transparent backdrop-blur-md shadow-[0_0_50px_rgba(212,175,55,0.3)]"
                      animate={{ 
                        boxShadow: [
                          '0 0 50px rgba(212,175,55,0.3)',
                          '0 0 70px rgba(212,175,55,0.4)',
                          '0 0 50px rgba(212,175,55,0.3)'
                        ]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                        <motion.div 
                          className="w-14 h-14 border-2 border-gold-400 rounded-full flex items-center justify-center font-serif text-xl text-gold-400 mb-4 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                          H
                        </motion.div>
                        <div className="font-serif text-xl text-gold-400 mb-2 tracking-wide drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">The Hamilton Legacy</div>
                        <div className="text-xs uppercase tracking-[0.2em] text-gold-200/80">Five Generations • One Story</div>
                      </div>
                    </motion.div>
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

          {currentView === 'vault-health' && (
            <motion.div
              key="vault-health-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-8 max-w-4xl py-8"
            >
              <VaultHealthMonitor
                lastUpdated={new Date()}
                missingMetadataCount={12}
                completionPercentage={73}
                suggestions={[
                  'Add emotion tags to 8 memories from the 1950s era',
                  'Include location information for 4 wedding photos',
                  'Add dates to 3 family reunion memories'
                ]}
                totalMemories={47}
                memoriesWithEmotions={35}
                memoriesWithLocations={40}
                memoriesWithDates={44}
              />
            </motion.div>
          )}

          {currentView === 'multi-vault' && (
            <motion.div
              key="multi-vault-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-8 max-w-4xl py-8"
            >
              <MultiVaultManager
                vaults={[
                  {
                    id: 'vault1',
                    name: 'My Children\'s Vault',
                    tokenId: 'HLM_LEG_ABC123XYZ',
                    audienceType: 'immediate',
                    memoryCount: 47,
                    createdAt: new Date('2024-01-15')
                  }
                ]}
                onCreateVault={(vault) => console.log('Create vault:', vault)}
                onDeleteVault={(id) => console.log('Delete vault:', id)}
                onEditVault={(id, updates) => console.log('Edit vault:', id, updates)}
              />
            </motion.div>
          )}

          {currentView === 'executors' && (
            <motion.div
              key="executors-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-8 max-w-4xl py-8"
            >
              <ExecutorGuardianManager
                executors={[
                  {
                    id: 'exec1',
                    name: 'Sarah Hamilton',
                    email: 'sarah@example.com',
                    relationship: 'Daughter',
                    status: 'accepted',
                    invitedAt: new Date('2024-01-10')
                  }
                ]}
                guardians={[]}
                onAddExecutor={(executor) => console.log('Add executor:', executor)}
                onAddGuardian={(guardian) => console.log('Add guardian:', guardian)}
                onRemove={(id, type) => console.log('Remove:', id, type)}
              />
            </motion.div>
          )}

          {currentView === 'ai-features' && (
            <motion.div
              key="ai-features-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-8 max-w-4xl py-8"
            >
              <AIFeaturesPanel
                onGenerateEmotions={async () => [
                  { emotion: 'Joy', confidence: 0.92 },
                  { emotion: 'Love', confidence: 0.88 },
                  { emotion: 'Nostalgia', confidence: 0.75 }
                ]}
                onGenerateMemoryBook={async () => ({
                  title: 'Hamilton Family Legacy',
                  pages: 47,
                  url: '/downloads/memory-book.pdf'
                })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Elegant Timeline */}
      <div className="glass-panel fixed bottom-10 left-1/2 transform -translate-x-1/2 w-4/5 max-w-4xl p-8 z-30 backdrop-blur-2xl">
        <div className="relative h-1 bg-gold-500/20 my-5 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.2)]">
          <motion.div 
            className="absolute h-full w-3/5 bg-gradient-to-r from-transparent via-gold-400 to-transparent rounded-full"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {['1920s', '1950s', '1980s', '2000s', 'Present'].map((era, index) => (
            <motion.button
              key={era}
              className={`absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                currentEra === era 
                  ? 'bg-gold-400 border-gold-400 shadow-[0_0_20px_rgba(212,175,55,0.6)]' 
                  : 'bg-obsidian-800 border-gold-500/50 hover:border-gold-400 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]'
              }`}
              style={{ left: `${10 + index * 20}%` }}
              onClick={() => handleEraClick(era)}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className={`absolute top-6 left-1/2 transform -translate-x-1/2 text-xs tracking-wide whitespace-nowrap transition-all duration-300 ${
                currentEra === era ? 'text-gold-300 font-semibold' : 'text-gold-200/60'
              }`}>
                {era}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Enhanced Detail Panel */}
      <AnimatePresence>
        {showDetailPanel && selectedMemory && (
          <motion.div
            className="glass-modal fixed right-10 top-1/2 transform -translate-y-1/2 w-96 p-10 z-40"
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <div className="border-b border-gold-500/20 pb-5 mb-8">
              <h3 className="font-serif text-3xl text-gold-400 mb-2">{selectedMemory.title}</h3>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Floating Action Bar */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-4 z-50">
        <motion.button
          className="glass-icon-button w-14 h-14 text-gold-400"
          whileHover={{ scale: 1.15, y: -3, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRecordStory}
          title="Record Audio Story"
        >
          {isRecording ? <Pause className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </motion.button>
        
        <motion.button
          className="glass-icon-button w-14 h-14 text-gold-400"
          whileHover={{ scale: 1.15, y: -3, rotate: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowLegacyVideoRecorder(true)}
          title="Record Legacy Video"
        >
          <Video className="w-5 h-5" />
        </motion.button>
        
        <motion.button
          className="glass-icon-button w-14 h-14 text-gold-400"
          whileHover={{ scale: 1.15, y: -3, rotate: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleAIEnhance}
          title="AI Enhance"
        >
          <Sparkles className="w-5 h-5" />
        </motion.button>
        
        <motion.button
          className="glass-button-primary w-16 h-16 rounded-full flex items-center justify-center"
          whileHover={{ scale: 1.2, y: -4, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleAddMemory}
          animate={{ 
            boxShadow: [
              '0 0 30px rgba(212,175,55,0.5)',
              '0 0 40px rgba(212,175,55,0.6)',
              '0 0 30px rgba(212,175,55,0.5)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          title="Add Memory"
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

      {/* Platform Tour */}
      {showTour && (
        <PlatformTour
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}

      {/* Notification Center */}
      <AnimatePresence>
        {showNotifications && (
          <NotificationCenter
            userPlan={userPlan}
            onClose={() => setShowNotifications(false)}
          />
        )}
      </AnimatePresence>

      {/* Token Redemption Modal */}
      <AnimatePresence>
        {showTokenRedemption && (
          <TokenRedemptionModal
            onClose={() => setShowTokenRedemption(false)}
            onRedeem={async (token) => {
              if (token.startsWith('HLM_LEG_')) {
                return {
                  success: true,
                  owner: {
                    name: 'William Hamilton',
                    avatar: '👴',
                    birthDate: '1895-03-15',
                    deathDate: '1978-11-22'
                  }
                }
              }
              return { success: false, error: 'Invalid token format' }
            }}
          />
        )}
      </AnimatePresence>

      {/* Legacy Video Recorder */}
      <AnimatePresence>
        {showLegacyVideoRecorder && (
          <LegacyVideoRecorder
            onClose={() => setShowLegacyVideoRecorder(false)}
            onSave={(video) => {
              console.log('Legacy video saved:', video)
              setShowLegacyVideoRecorder(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
