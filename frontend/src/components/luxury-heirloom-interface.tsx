'use client'

import React, { useEffect, useState } from 'react'
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
  Plus
} from 'lucide-react'
import FamilyTree from './family-tree'
import MemoryGallery from './memory-gallery'
import TimelineView from './timeline-view'
import UserProfile from './user-profile'
import { mockFamilyMembers, mockMemories, mockTimelineEvents, FamilyMember, Memory, TimelineEvent } from '../data/mock-family-data'

type ViewMode = 'dashboard' | 'family-tree' | 'memories' | 'timeline' | 'profile'

interface QuickStat {
  label: string
  value: number
  icon: React.ComponentType<any>
  color: string
}

export default function LuxuryHeirloomInterface() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard')
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [particles, setParticles] = useState<Array<{ id: number; left: string; delay: number; duration: number }>>([])

  useEffect(() => {
    // Generate golden dust particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      delay: Math.random() * 15,
      duration: 15 + Math.random() * 10
    }))
    setParticles(newParticles)

    // Remove loading screen
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Quick stats for dashboard
  const quickStats: QuickStat[] = [
    { label: 'Family Members', value: mockFamilyMembers.length, icon: Users, color: 'from-blue-600 to-blue-500' },
    { label: 'Memories', value: mockMemories.length, icon: Image, color: 'from-green-600 to-green-500' },
    { label: 'Timeline Events', value: mockTimelineEvents.length, icon: Clock, color: 'from-purple-600 to-purple-500' },
    { label: 'Generations', value: 5, icon: TreePine, color: 'from-gold-600 to-gold-500' }
  ]

  // Recent memories for dashboard
  const recentMemories = mockMemories.slice(0, 6)
  const recentEvents = mockTimelineEvents.slice(0, 4)

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'family-tree', label: 'Family Tree', icon: TreePine },
    { id: 'memories', label: 'Memories', icon: Camera },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
  ]

  const handleMemberSelect = (member: FamilyMember) => {
    setSelectedMember(member)
  }

  const handleMemorySelect = (memory: Memory) => {
    setSelectedMemory(memory)
  }

  const handleEventSelect = (event: TimelineEvent) => {
    setSelectedEvent(event)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-obsidian-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated particles */}
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-gold-400 rounded-full opacity-60"
            style={{ left: particle.left }}
            animate={{
              y: ['-100vh', '100vh'],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}
        
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="w-24 h-24 border-4 border-gold-500/30 border-t-gold-400 rounded-full mx-auto mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <h1 className="text-4xl font-bold text-gold-100 mb-4">Heirloom</h1>
          <p className="text-gold-400/80 text-lg">Preserving your family legacy...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-obsidian-900 relative overflow-hidden">
      {/* Animated background particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute w-0.5 h-0.5 bg-gold-400/20 rounded-full"
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

      {/* Header */}
      <header className="relative z-10 border-b border-gold-500/20 backdrop-blur-sm bg-obsidian-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
                <TreePine className="w-6 h-6 text-obsidian-900" />
              </div>
              <h1 className="text-2xl font-bold text-gold-100">Heirloom</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as ViewMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    currentView === item.id
                      ? 'bg-gradient-to-r from-gold-600/20 to-gold-500/20 border border-gold-500/30 text-gold-100'
                      : 'text-gold-400/80 hover:text-gold-100 hover:bg-obsidian-800/40'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Search and Actions */}
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search family..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 placeholder-gold-400/60 focus:outline-none focus:border-gold-400/40 w-64"
                />
              </div>
              
              <button className="p-2 text-gold-400 hover:text-gold-300 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              
              <button
                onClick={() => setShowProfile(true)}
                className="p-2 text-gold-400 hover:text-gold-300 transition-colors"
              >
                <User className="w-5 h-5" />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gold-400 hover:text-gold-300 transition-colors"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              className="md:hidden border-t border-gold-500/20 bg-obsidian-900/95 backdrop-blur-sm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="px-4 py-3 space-y-2">
                {navigationItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id as ViewMode)
                      setShowMobileMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                      currentView === item.id
                        ? 'bg-gradient-to-r from-gold-600/20 to-gold-500/20 border border-gold-500/30 text-gold-100'
                        : 'text-gold-400/80 hover:text-gold-100 hover:bg-obsidian-800/40'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="relative z-10 h-[calc(100vh-64px)]">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gold-100 mb-2">Welcome to Your Family Legacy</h2>
                  <p className="text-gold-400/80 text-lg">Explore your family history, memories, and connections</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {quickStats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      className="bg-gradient-to-br from-obsidian-800/60 to-obsidian-900/80 border border-gold-500/20 rounded-xl p-6 hover:border-gold-400/40 transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white mb-4`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div className="text-2xl font-bold text-gold-100 mb-1">{stat.value}</div>
                      <div className="text-gold-400/80">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Recent Memories */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gold-100">Recent Memories</h3>
                    <button
                      onClick={() => setCurrentView('memories')}
                      className="flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors"
                    >
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentMemories.map((memory, index) => (
                      <motion.div
                        key={memory.id}
                        className="group cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleMemorySelect(memory)}
                      >
                        <div className="bg-gradient-to-br from-obsidian-800/60 to-obsidian-900/80 border border-gold-500/20 rounded-xl overflow-hidden hover:border-gold-400/40 transition-all duration-300 group-hover:scale-105">
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={memory.thumbnail}
                              alt={memory.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                              <h4 className="text-white font-semibold mb-1">{memory.title}</h4>
                              <p className="text-white/80 text-sm">{new Date(memory.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recent Timeline Events */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gold-100">Recent Timeline Events</h3>
                    <button
                      onClick={() => setCurrentView('timeline')}
                      className="flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors"
                    >
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {recentEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-obsidian-800/60 to-obsidian-900/80 border border-gold-500/20 rounded-xl hover:border-gold-400/40 transition-all duration-300 cursor-pointer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleEventSelect(event)}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-gold-600 to-gold-500 rounded-lg flex items-center justify-center text-white">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-gold-100 font-semibold">{event.title}</h4>
                          <p className="text-gold-400/80 text-sm">{event.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gold-500/80 mt-1">
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'family-tree' && (
            <motion.div
              key="family-tree"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full"
            >
              <FamilyTree onMemberSelect={handleMemberSelect} />
            </motion.div>
          )}

          {currentView === 'memories' && (
            <motion.div
              key="memories"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full"
            >
              <MemoryGallery 
                selectedMemberId={selectedMember?.id}
                onMemorySelect={handleMemorySelect}
              />
            </motion.div>
          )}

          {currentView === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full"
            >
              <TimelineView 
                selectedMemberId={selectedMember?.id}
                onEventSelect={handleEventSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* User Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <UserProfile onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>

      {/* Quick Action Button */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-gold-600 to-gold-500 rounded-full shadow-lg flex items-center justify-center text-obsidian-900 hover:from-gold-500 hover:to-gold-400 transition-all duration-300 z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCurrentView('memories')}
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  )
}