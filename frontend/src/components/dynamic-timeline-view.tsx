'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  Award, 
  Star,
  Search,
  ChevronRight,
  Maximize2,
  Minimize2,
  Clock,
  ArrowUp,
  ArrowDown,
  ZoomIn,
  ZoomOut,
  Sparkles
} from 'lucide-react'

type TimelineZoomLevel = 'day' | 'week' | 'month' | 'year' | 'decade'

interface Memory {
  id: string
  title: string
  description?: string
  date: string
  thumbnailUrl?: string
  location?: string
  participants?: string[]
  sentimentLabel?: string
  emotionCategory?: string
  importanceScore?: number
}

interface DynamicTimelineViewProps {
  memories: Memory[]
  onMemorySelect?: (memory: Memory) => void
}

const DynamicTimelineView: React.FC<DynamicTimelineViewProps> = ({ memories, onMemorySelect }) => {
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSentiment, setFilterSentiment] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState<TimelineZoomLevel>('year')
  const [selectedPeriod, setSelectedPeriod] = useState<Date | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const timelineRef = useRef<HTMLDivElement>(null)

  const filteredMemories = memories
    .filter(memory => {
      const matchesSearch = memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           memory.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           memory.location?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSentiment = !filterSentiment || memory.sentimentLabel === filterSentiment
      
      return matchesSearch && matchesSentiment
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

  const sentiments = [...new Set(memories.map(m => m.sentimentLabel).filter(Boolean))]

  const groupMemoriesByPeriod = () => {
    const groups: { [key: string]: Memory[] } = {}
    
    filteredMemories.forEach(memory => {
      const date = new Date(memory.date)
      let key: string
      
      switch (zoomLevel) {
        case 'day':
          key = date.toISOString().split('T')[0] // YYYY-MM-DD
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'year':
          key = String(date.getFullYear())
          break
        case 'decade':
          key = String(Math.floor(date.getFullYear() / 10) * 10)
          break
      }
      
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(memory)
    })
    
    return groups
  }

  const memoryGroups = groupMemoriesByPeriod()
  const sortedPeriods = Object.keys(memoryGroups).sort((a, b) => 
    sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
  )

  const handleMemoryClick = (memory: Memory) => {
    setSelectedMemory(memory)
    onMemorySelect?.(memory)
  }

  const handlePeriodClick = (period: string) => {
    const zoomLevels: TimelineZoomLevel[] = ['decade', 'year', 'month', 'week', 'day']
    const currentIndex = zoomLevels.indexOf(zoomLevel)
    
    if (currentIndex < zoomLevels.length - 1) {
      setZoomLevel(zoomLevels[currentIndex + 1])
      setSelectedPeriod(new Date(period))
    }
  }

  const handleZoomOut = () => {
    const zoomLevels: TimelineZoomLevel[] = ['day', 'week', 'month', 'year', 'decade']
    const currentIndex = zoomLevels.indexOf(zoomLevel)
    
    if (currentIndex < zoomLevels.length - 1) {
      setZoomLevel(zoomLevels[currentIndex + 1])
      setSelectedPeriod(null)
    }
  }

  const handleZoomIn = () => {
    const zoomLevels: TimelineZoomLevel[] = ['decade', 'year', 'month', 'week', 'day']
    const currentIndex = zoomLevels.indexOf(zoomLevel)
    
    if (currentIndex < zoomLevels.length - 1) {
      setZoomLevel(zoomLevels[currentIndex + 1])
    }
  }

  const formatPeriodLabel = (period: string): string => {
    switch (zoomLevel) {
      case 'day':
        return new Date(period).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      case 'week':
        const weekStart = new Date(period)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      case 'month':
        const [year, month] = period.split('-')
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        })
      case 'year':
        return period
      case 'decade':
        return `${period}s`
    }
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'joyful': return 'from-yellow-500 to-amber-400'
      case 'nostalgic': return 'from-purple-500 to-indigo-400'
      case 'loving': return 'from-pink-500 to-rose-400'
      case 'hopeful': return 'from-blue-500 to-cyan-400'
      case 'reflective': return 'from-gray-500 to-slate-400'
      case 'grateful': return 'from-green-500 to-emerald-400'
      case 'peaceful': return 'from-teal-500 to-cyan-400'
      case 'excited': return 'from-orange-500 to-yellow-400'
      default: return 'from-gold-500 to-amber-400'
    }
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-obsidian-900' : 'h-full'} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gold-500/20">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gold-100">Dynamic Timeline</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-obsidian-800/60 border border-gold-500/20 rounded-lg">
            <Clock className="w-4 h-4 text-gold-400" />
            <span className="text-gold-300 text-sm capitalize">{zoomLevel} View</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel === 'decade'}
            className="p-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 hover:border-gold-400/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel === 'day'}
            className="p-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 hover:border-gold-400/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 hover:border-gold-400/40 transition-colors"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 hover:border-gold-400/40 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 border-b border-gold-500/20">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search memories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 placeholder-gold-400/60 focus:outline-none focus:border-gold-400/40"
          />
        </div>
        
        <select
          value={filterSentiment}
          onChange={(e) => setFilterSentiment(e.target.value)}
          className="px-3 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40"
        >
          <option value="">All Sentiments</option>
          {sentiments.map(sentiment => (
            <option key={sentiment} value={sentiment} className="capitalize">{sentiment}</option>
          ))}
        </select>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto p-6" ref={timelineRef}>
        <div className="space-y-6">
          {sortedPeriods.map((period, periodIndex) => {
            const periodMemories = memoryGroups[period]
            const canDrillDown = zoomLevel !== 'day'
            
            return (
              <motion.div
                key={period}
                className="bg-gradient-to-br from-obsidian-800/40 to-obsidian-900/60 border border-gold-500/20 rounded-xl overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: periodIndex * 0.05 }}
              >
                {/* Period Header */}
                <div 
                  className={`p-4 bg-gradient-to-r from-gold-600/20 to-gold-500/10 border-b border-gold-500/20 ${canDrillDown ? 'cursor-pointer hover:from-gold-600/30 hover:to-gold-500/20' : ''} transition-all duration-300`}
                  onClick={() => canDrillDown && handlePeriodClick(period)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-gold-600 to-gold-500 rounded-lg">
                        <Calendar className="w-5 h-5 text-obsidian-900" />
                      </div>
                      <div>
                        <h3 className="text-gold-100 font-semibold text-lg">{formatPeriodLabel(period)}</h3>
                        <p className="text-gold-400/80 text-sm">{periodMemories.length} memories</p>
                      </div>
                    </div>
                    {canDrillDown && (
                      <div className="flex items-center gap-2 text-gold-400 text-sm">
                        <span>Click to drill down</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Memories Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {periodMemories.map((memory, memoryIndex) => (
                    <motion.div
                      key={memory.id}
                      className="group cursor-pointer"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: memoryIndex * 0.02 }}
                      onClick={() => handleMemoryClick(memory)}
                    >
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-obsidian-800/60 border border-gold-500/20 group-hover:border-gold-400/40 transition-all duration-300">
                        {memory.thumbnailUrl && (
                          <img 
                            src={memory.thumbnailUrl} 
                            alt={memory.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        )}
                        
                        {/* AI Classification Badge */}
                        {memory.sentimentLabel && (
                          <div className={`absolute top-2 right-2 px-2 py-1 bg-gradient-to-r ${getSentimentColor(memory.sentimentLabel)} rounded-full text-white text-xs font-semibold flex items-center gap-1 shadow-lg`}>
                            <Sparkles className="w-3 h-3" />
                            <span className="capitalize">{memory.sentimentLabel}</span>
                          </div>
                        )}
                        
                        {/* Importance Score */}
                        {memory.importanceScore && memory.importanceScore >= 8 && (
                          <div className="absolute top-2 left-2 p-1.5 bg-gold-500 rounded-full shadow-lg">
                            <Star className="w-3 h-3 text-obsidian-900 fill-obsidian-900" />
                          </div>
                        )}
                        
                        {/* Memory Info Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900/90 via-obsidian-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                          <h4 className="text-gold-100 font-semibold text-sm mb-1 line-clamp-2">{memory.title}</h4>
                          <p className="text-gold-400/80 text-xs">
                            {new Date(memory.date).toLocaleDateString()}
                          </p>
                          {memory.location && (
                            <div className="flex items-center gap-1 text-gold-400/80 text-xs mt-1">
                              <MapPin className="w-3 h-3" />
                              <span className="line-clamp-1">{memory.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
        
        {sortedPeriods.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gold-400/60">
            <Calendar className="w-16 h-16 mb-4" />
            <p className="text-lg font-semibold mb-2">No memories found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Memory Detail Modal */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMemory(null)}
          >
            <motion.div
              className="relative max-w-4xl w-full mx-4 bg-obsidian-900/95 border border-gold-500/30 rounded-2xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              {selectedMemory.thumbnailUrl && (
                <div className="relative h-96 bg-obsidian-800">
                  <img 
                    src={selectedMemory.thumbnailUrl} 
                    alt={selectedMemory.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900 to-transparent"></div>
                </div>
              )}
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gold-100 mb-2">{selectedMemory.title}</h2>
                    <p className="text-gold-400/80 text-sm">
                      {new Date(selectedMemory.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  {selectedMemory.sentimentLabel && (
                    <div className={`px-4 py-2 bg-gradient-to-r ${getSentimentColor(selectedMemory.sentimentLabel)} rounded-full text-white text-sm font-semibold flex items-center gap-2`}>
                      <Sparkles className="w-4 h-4" />
                      <span className="capitalize">{selectedMemory.sentimentLabel}</span>
                    </div>
                  )}
                </div>
                
                {selectedMemory.description && (
                  <p className="text-gold-300/90 mb-4">{selectedMemory.description}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm">
                  {selectedMemory.location && (
                    <div className="flex items-center gap-2 text-gold-400/80">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedMemory.location}</span>
                    </div>
                  )}
                  
                  {selectedMemory.emotionCategory && (
                    <div className="flex items-center gap-2 text-gold-400/80">
                      <Heart className="w-4 h-4" />
                      <span className="capitalize">{selectedMemory.emotionCategory}</span>
                    </div>
                  )}
                  
                  {selectedMemory.importanceScore && (
                    <div className="flex items-center gap-2 text-gold-400/80">
                      <Star className="w-4 h-4" />
                      <span>Importance: {selectedMemory.importanceScore}/10</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DynamicTimelineView
