'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Star,
  Heart,
  Share2,
  Download,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Film,
  Gift,
  Lock,
  Unlock,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Users,
  Image as ImageIcon,
  TrendingUp
} from 'lucide-react'
import { apiClient } from '../lib/api-client'
import toast from 'react-hot-toast'

interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  media_url?: string;
  thumbnail_url?: string;
}

interface ApiTimeCapsule {
  id: string;
  title: string;
  message: string;
  memoryIds: string[];
  unlockDate: string;
  isLocked: boolean;
  recipients: string[];
}

interface Highlight {
  id: string
  title: string
  description: string
  type: 'year-in-review' | 'this-week' | 'decade' | 'custom'
  memories: Memory[]
  createdAt: Date
  scheduledFor?: Date
  isPublic: boolean
  views: number
  shares: number
}

const HighlightsTimeCapsules: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'highlights' | 'capsules' | 'create'>('highlights')
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [timeCapsules, setTimeCapsules] = useState<ApiTimeCapsule[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [memoriesData, capsulesData] = await Promise.all([
        apiClient.getMemories(),
        apiClient.getTimeCapsules()
      ])
      
      setMemories(memoriesData)
      setTimeCapsules(capsulesData)
      
      const currentYear = new Date().getFullYear()
      const lastYear = currentYear - 1
      
      const yearInReview: Highlight = {
        id: '1',
        title: `${lastYear} Year in Review`,
        description: `A beautiful collection of your family's most precious moments from ${lastYear}`,
        type: 'year-in-review',
        memories: memoriesData.filter(m => new Date(m.date).getFullYear() === lastYear).slice(0, 12),
        createdAt: new Date(`${lastYear}-12-31`),
        isPublic: false,
        views: 247,
        shares: 18
      }

      const thisWeekHighlight: Highlight = {
        id: '2',
        title: 'This Week in Family History',
        description: 'Memories from this week across different years',
        type: 'this-week',
        memories: memoriesData.slice(0, 6),
        createdAt: new Date(),
        isPublic: true,
        views: 89,
        shares: 5
      }

      const decadeHighlight: Highlight = {
        id: '3',
        title: 'The 2010s: A Decade of Growth',
        description: 'Celebrating a decade of family milestones and memories',
        type: 'decade',
        memories: memoriesData.filter(m => {
          const year = new Date(m.date).getFullYear()
          return year >= 2010 && year < 2020
        }).slice(0, 15),
        createdAt: new Date('2020-01-01'),
        scheduledFor: new Date('2025-12-31'),
        isPublic: false,
        views: 156,
        shares: 12
      }

      setHighlights([yearInReview, thisWeekHighlight, decadeHighlight])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayHighlight = (highlight: Highlight) => {
    setSelectedHighlight(highlight)
    setCurrentSlide(0)
    setIsPlaying(true)
  }

  const handleNextSlide = () => {
    if (selectedHighlight && currentSlide < selectedHighlight.memories.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleShareHighlight = (highlightId: string) => {
    const highlight = highlights.find(h => h.id === highlightId)
    if (highlight) {
      const updatedHighlights = highlights.map(h => 
        h.id === highlightId ? { ...h, shares: h.shares + 1 } : h
      )
      setHighlights(updatedHighlights)
      toast.success('Highlight link copied to clipboard!')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'year-in-review': return Calendar
      case 'this-week': return Clock
      case 'decade': return TrendingUp
      default: return Sparkles
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'year-in-review': return 'from-gold-600 to-gold-500'
      case 'this-week': return 'from-gold-600/80 to-gold-500/80'
      case 'decade': return 'from-gold-600/60 to-gold-500/60'
      default: return 'from-gold-600 to-gold-500'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-charcoal text-pearl p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400 mx-auto mb-4"></div>
          <p className="text-gold-300">Loading highlights and time capsules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-charcoal text-pearl p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-gold-600 to-gold-500 rounded-xl">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-obsidian-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gold-400 to-gold-300 bg-clip-text text-transparent">
                Highlights & Time Capsules
              </h1>
              <p className="text-sm sm:text-base text-gold-400/70 mt-1 hidden sm:block">
                Auto-curated memories and future surprises
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 mb-6 sm:mb-8 bg-obsidian-800/50 p-1 rounded-xl backdrop-blur-sm">
          {[
            { id: 'highlights', label: 'Highlights', icon: Star },
            { id: 'capsules', label: 'Time Capsules', icon: Gift },
            { id: 'create', label: 'Create New', icon: Plus }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 shadow-lg'
                  : 'text-gold-400/70 hover:text-gold-400 hover:bg-obsidian-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'highlights' && (
            <motion.div
              key="highlights"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {highlights.map((highlight, index) => {
                  const TypeIcon = getTypeIcon(highlight.type)
                  return (
                    <motion.div
                      key={highlight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gold-500/20 hover:border-gold-500/40 transition-all duration-300 group"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={highlight.memories[0]?.thumbnail || 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=300&fit=crop'}
                          alt={highlight.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <div className={`absolute top-3 right-3 p-2 bg-gradient-to-r ${getTypeColor(highlight.type)} rounded-lg`}>
                          <TypeIcon className="w-4 h-4 text-obsidian-900" />
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-xl font-bold text-white mb-1">{highlight.title}</h3>
                          <p className="text-white/80 text-sm line-clamp-2">{highlight.description}</p>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm text-gold-400/70">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <ImageIcon className="w-4 h-4" />
                              <span>{highlight.memories.length}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{highlight.views}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Share2 className="w-4 h-4" />
                              <span>{highlight.shares}</span>
                            </div>
                          </div>
                          {highlight.isPublic ? (
                            <Unlock className="w-4 h-4 text-gold-300" />
                          ) : (
                            <Lock className="w-4 h-4 text-gold-400" />
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePlayHighlight(highlight)}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Play
                          </button>
                          <button
                            onClick={() => handleShareHighlight(highlight.id)}
                            className="px-4 py-2 bg-obsidian-800 border border-gold-500/30 text-gold-400 rounded-lg hover:border-gold-400 transition-all duration-300"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>

                        {highlight.scheduledFor && (
                          <div className="text-xs text-gold-400/60 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Scheduled for {highlight.scheduledFor.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'capsules' && (
            <motion.div
              key="capsules"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {timeCapsules.map((capsule, index) => (
                  <motion.div
                    key={capsule.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${capsule.is_locked ? 'bg-gradient-to-r from-gold-600/70 to-gold-500/70' : 'bg-gradient-to-r from-gold-600 to-gold-500'}`}>
                          {capsule.is_locked ? <Lock className="w-6 h-6 text-obsidian-900" /> : <Unlock className="w-6 h-6 text-obsidian-900" />}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gold-100">{capsule.title}</h3>
                          <p className="text-gold-400/70 text-sm">
                            {capsule.is_locked ? 'Locked' : 'Unlocked'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-gold-300/90 leading-relaxed mb-4">
                      {capsule.message}
                    </p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gold-400/70">Created</span>
                        <span className="text-gold-100">{new Date(capsule.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gold-400/70">Unlock Date</span>
                        <span className="text-gold-100 font-semibold">{new Date(capsule.unlock_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gold-400/70">Memories</span>
                        <span className="text-gold-100">{capsule.memory_ids.length} items</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gold-400/70">Recipients</span>
                        <span className="text-gold-100">{capsule.recipients.length} people</span>
                      </div>
                    </div>

                    {!capsule.is_locked && (
                      <button className="w-full px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-semibold flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" />
                        View Contents
                      </button>
                    )}

                    {capsule.is_locked && (
                      <div className="bg-gold-600/10 border border-gold-500/20 rounded-lg p-3 text-center">
                        <p className="text-gold-300 text-sm">
                          This capsule will unlock in {Math.ceil((new Date(capsule.unlock_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-8 border border-gold-500/20 text-center hover:border-gold-500/40 transition-all duration-300 cursor-pointer group"
                >
                  <div className="p-4 bg-gradient-to-r from-gold-600/20 to-gold-500/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-10 h-10 text-gold-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gold-100 mb-2">Create Highlight Reel</h3>
                  <p className="text-gold-400/70 mb-6">
                    Auto-generate a beautiful slideshow from selected memories
                  </p>
                  <button className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-semibold">
                    Start Creating
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-8 border border-gold-500/20 text-center hover:border-gold-500/40 transition-all duration-300 cursor-pointer group"
                >
                  <div className="p-4 bg-gradient-to-r from-gold-600/20 to-gold-500/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Gift className="w-10 h-10 text-gold-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gold-100 mb-2">Create Time Capsule</h3>
                  <p className="text-gold-400/70 mb-6">
                    Lock memories to be opened at a future date
                  </p>
                  <button className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-semibold">
                    Start Creating
                  </button>
                </motion.div>
              </div>

              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                <h3 className="text-xl font-bold text-gold-100 mb-4">Automatic Highlights</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Generate Year in Review (December)', enabled: true },
                    { label: 'Weekly "This Week in History" highlights', enabled: true },
                    { label: 'Birthday memory compilations', enabled: false },
                    { label: 'Anniversary celebrations', enabled: true },
                    { label: 'Decade retrospectives', enabled: false }
                  ].map((setting, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-obsidian-900/50 rounded-lg">
                      <span className="text-gold-300">{setting.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting.enabled}
                          className="sr-only peer"
                          readOnly
                        />
                        <div className="w-11 h-6 bg-obsidian-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-gold-600 peer-checked:to-gold-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedHighlight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedHighlight(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative w-full max-w-5xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedHighlight(null)}
                  className="absolute -top-12 right-0 p-2 text-white hover:text-gold-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="bg-obsidian-900 rounded-2xl overflow-hidden border border-gold-500/30">
                  <div className="relative aspect-video bg-black">
                    {selectedHighlight.memories[currentSlide] && (
                      <img
                        src={selectedHighlight.memories[currentSlide].thumbnail}
                        alt={selectedHighlight.memories[currentSlide].title}
                        className="w-full h-full object-contain"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {selectedHighlight.memories[currentSlide]?.title}
                      </h3>
                      <p className="text-white/80">
                        {selectedHighlight.memories[currentSlide]?.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-obsidian-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-gold-400 text-sm">
                        {currentSlide + 1} / {selectedHighlight.memories.length}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrevSlide}
                          disabled={currentSlide === 0}
                          className="p-2 bg-obsidian-900 border border-gold-500/30 text-gold-400 rounded-lg hover:border-gold-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <SkipBack className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="p-3 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300"
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={handleNextSlide}
                          disabled={currentSlide === selectedHighlight.memories.length - 1}
                          className="p-2 bg-obsidian-900 border border-gold-500/30 text-gold-400 rounded-lg hover:border-gold-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <SkipForward className="w-5 h-5" />
                        </button>
                      </div>
                      <button className="px-4 py-2 bg-obsidian-900 border border-gold-500/30 text-gold-400 rounded-lg hover:border-gold-400 transition-all duration-300 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {selectedHighlight.memories.map((memory, index) => (
                        <button
                          key={memory.id}
                          onClick={() => setCurrentSlide(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            index === currentSlide ? 'border-gold-400' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={memory.thumbnail}
                            alt={memory.title}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default HighlightsTimeCapsules
