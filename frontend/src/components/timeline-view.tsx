'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  Award, 
  Baby, 
  GraduationCap, 
  Briefcase, 
  Home, 
  Star,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Clock,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { mockTimelineEvents, mockFamilyMembers, mockMemories, TimelineEvent } from '../data/mock-family-data'

interface TimelineViewProps {
  selectedMemberId?: string
  onEventSelect?: (event: TimelineEvent) => void
}

const TimelineView: React.FC<TimelineViewProps> = ({ selectedMemberId, onEventSelect }) => {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterEra, setFilterEra] = useState<string>('')
  const [filterSignificance, setFilterSignificance] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const timelineRef = useRef<HTMLDivElement>(null)

  // Filter and sort events
  const filteredEvents = mockTimelineEvents
    .filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = !filterType || event.type === filterType
      const matchesEra = !filterEra || event.era === filterEra
      const matchesSignificance = !filterSignificance || event.significance === filterSignificance
      const matchesMember = !selectedMemberId || event.participants.includes(selectedMemberId)
      
      return matchesSearch && matchesType && matchesEra && matchesSignificance && matchesMember
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

  // Get unique eras and types for filters
  const eras = [...new Set(mockTimelineEvents.map(e => e.era))].sort()
  const types = [...new Set(mockTimelineEvents.map(e => e.type))]

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event)
    onEventSelect?.(event)
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'birth': return <Baby className="w-5 h-5" />
      case 'marriage': return <Heart className="w-5 h-5" />
      case 'death': return <Star className="w-5 h-5" />
      case 'achievement': return <Award className="w-5 h-5" />
      case 'career': return <Briefcase className="w-5 h-5" />
      case 'family': return <Users className="w-5 h-5" />
      case 'milestone': return <GraduationCap className="w-5 h-5" />
      default: return <Calendar className="w-5 h-5" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'birth': return 'from-gold-500 to-amber-400'
      case 'marriage': return 'from-gold-600 to-gold-400'
      case 'death': return 'from-gold-700 to-amber-600'
      case 'achievement': return 'from-amber-500 to-yellow-400'
      case 'career': return 'from-gold-600 to-amber-500'
      case 'family': return 'from-amber-600 to-gold-500'
      case 'milestone': return 'from-yellow-500 to-gold-400'
      default: return 'from-gold-500 to-amber-400'
    }
  }

  const getSignificanceSize = (significance: string) => {
    switch (significance) {
      case 'high': return 'w-4 h-4'
      case 'medium': return 'w-3 h-3'
      case 'low': return 'w-2 h-2'
      default: return 'w-3 h-3'
    }
  }

  const scrollToYear = (year: number) => {
    const element = document.getElementById(`year-${year}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-obsidian-900' : 'h-full'} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gold-500/20">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gold-100">Family Timeline</h2>
          {selectedMemberId && (
            <span className="text-gold-400/80 text-sm">
              Events for {mockFamilyMembers.find(m => m.id === selectedMemberId)?.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 hover:border-gold-400/40 transition-colors"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setViewMode(viewMode === 'timeline' ? 'list' : 'timeline')}
            className="p-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 hover:border-gold-400/40 transition-colors"
          >
            <Clock className="w-4 h-4" />
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
            placeholder="Search timeline events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 placeholder-gold-400/60 focus:outline-none focus:border-gold-400/40"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40"
        >
          <option value="">All Types</option>
          {types.map(type => (
            <option key={type} value={type} className="capitalize">{type}</option>
          ))}
        </select>
        
        <select
          value={filterEra}
          onChange={(e) => setFilterEra(e.target.value)}
          className="px-3 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40"
        >
          <option value="">All Eras</option>
          {eras.map(era => (
            <option key={era} value={era}>{era}</option>
          ))}
        </select>
        
        <select
          value={filterSignificance}
          onChange={(e) => setFilterSignificance(e.target.value)}
          className="px-3 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40"
        >
          <option value="">All Significance</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'timeline' ? (
          <div className="h-full overflow-y-auto" ref={timelineRef}>
            <div className="relative p-8">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold-600 via-gold-500 to-gold-400"></div>
              
              {/* Events */}
              <div className="space-y-8">
                {filteredEvents.map((event, index) => {
                  const eventYear = new Date(event.date).getFullYear()
                  const isNewYear = index === 0 || new Date(filteredEvents[index - 1].date).getFullYear() !== eventYear
                  
                  return (
                    <div key={event.id}>
                      {/* Year Marker */}
                      {isNewYear && (
                        <div id={`year-${eventYear}`} className="flex items-center gap-4 mb-6">
                          <div className="relative z-10 px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-full font-bold text-lg">
                            {eventYear}
                          </div>
                          <div className="flex-1 h-0.5 bg-gradient-to-r from-gold-500 to-transparent"></div>
                        </div>
                      )}
                      
                      {/* Event */}
                      <motion.div
                        className="relative flex items-start gap-6 cursor-pointer group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onClick={() => handleEventClick(event)}
                      >
                        {/* Event Icon */}
                        <div className={`relative z-10 p-3 bg-gradient-to-br ${getEventColor(event.type)} rounded-full text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          {getEventIcon(event.type)}
                          
                          {/* Significance Indicator */}
                          <div className={`absolute -top-1 -right-1 ${getSignificanceSize(event.significance)} bg-white rounded-full border-2 border-obsidian-900`}></div>
                        </div>
                        
                        {/* Event Content */}
                        <div className="flex-1 bg-gradient-to-br from-obsidian-800/60 to-obsidian-900/80 border border-gold-500/20 rounded-xl p-4 hover:border-gold-400/40 transition-all duration-300 group-hover:scale-[1.02]">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-gold-100 font-semibold text-lg">{event.title}</h3>
                            <span className="text-gold-400/80 text-sm whitespace-nowrap ml-4">
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-gold-300/80 text-sm mb-3">{event.description}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-gold-500/80">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{event.participants.length} people</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              <span className="capitalize">{event.significance}</span>
                            </div>
                          </div>
                          
                          {event.memories.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gold-500/20">
                              <span className="text-gold-400 text-xs">
                                {event.memories.length} related memories
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-3">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  className="flex items-center gap-6 p-6 bg-gradient-to-r from-obsidian-800/80 to-obsidian-900/90 border border-gold-500/30 rounded-xl hover:border-gold-400/60 transition-all duration-300 cursor-pointer shadow-lg shadow-gold-500/10 backdrop-blur-sm group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleEventClick(event)}
                >
                  <div className={`p-3 bg-gradient-to-br ${getEventColor(event.type)} rounded-lg text-obsidian-900 shadow-lg shadow-gold-500/20 border border-gold-300/50 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-gold-200/20 to-transparent rounded-lg"></div>
                    <div className="relative">
                      {getEventIcon(event.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-gold-200 font-semibold text-lg">{event.title}</h3>
                      <span className="px-3 py-1 bg-gold-500/20 text-gold-300 text-xs rounded-full border border-gold-500/30 capitalize">
                        {event.type}
                      </span>
                    </div>
                    
                    <p className="text-gold-300/90 text-sm mb-3 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gold-400/80">
                      <div className="flex items-center gap-2 bg-gold-500/10 px-2 py-1 rounded-full border border-gold-500/20">
                        <Calendar className="w-3 h-3 text-gold-400" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gold-500/10 px-2 py-1 rounded-full border border-gold-500/20">
                        <MapPin className="w-3 h-3 text-gold-400" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gold-500/10 px-2 py-1 rounded-full border border-gold-500/20">
                        <Users className="w-3 h-3 text-gold-400" />
                        <span>{event.participants.length} people</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-gold-200 font-bold text-lg bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/30 mb-2">
                      {new Date(event.date).getFullYear()}
                    </div>
                    <div className="text-gold-400 text-xs capitalize bg-gold-500/10 px-2 py-1 rounded-full border border-gold-500/20">
                      {event.significance}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gold-400/60">
            <Calendar className="w-16 h-16 mb-4" />
            <p className="text-lg font-semibold mb-2">No events found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              className="relative max-w-2xl w-full mx-4 bg-obsidian-900/95 border border-gold-500/30 rounded-2xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-4 p-6 border-b border-gold-500/20">
                <div className={`p-3 bg-gradient-to-br ${getEventColor(selectedEvent.type)} rounded-full text-white`}>
                  {getEventIcon(selectedEvent.type)}
                </div>
                
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gold-100 mb-1">{selectedEvent.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gold-400/80">
                    <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                    <span className="capitalize">{selectedEvent.type}</span>
                    <span className="capitalize">{selectedEvent.significance} significance</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gold-400 hover:text-gold-300 transition-colors"
                >
                  ×
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-gold-100 font-semibold mb-2">Description</h3>
                  <p className="text-gold-300/80">{selectedEvent.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-gold-100 font-semibold mb-2">Location</h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gold-400" />
                      <span className="text-gold-300">{selectedEvent.location}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-gold-100 font-semibold mb-2">Era</h3>
                    <span className="text-gold-300">{selectedEvent.era}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-gold-100 font-semibold mb-2">Participants</h3>
                  <div className="space-y-1">
                    {selectedEvent.participants.map(participantId => {
                      const participant = mockFamilyMembers.find(m => m.id === participantId)
                      return participant ? (
                        <div key={participantId} className="text-gold-300/80">
                          • {participant.name}
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
                
                {selectedEvent.memories.length > 0 && (
                  <div>
                    <h3 className="text-gold-100 font-semibold mb-2">Related Memories</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedEvent.memories.map(memoryId => {
                        const memory = mockMemories.find(m => m.id === memoryId)
                        return memory ? (
                          <div
                            key={memoryId}
                            className="flex items-center gap-2 p-2 bg-obsidian-800/60 rounded-lg border border-gold-500/20 hover:border-gold-400/40 transition-colors cursor-pointer"
                          >
                            <img
                              src={memory.thumbnail}
                              alt={memory.title}
                              className="w-8 h-8 object-cover rounded"
                            />
                            <span className="text-gold-300 text-sm truncate">{memory.title}</span>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Year Navigation */}
      {viewMode === 'timeline' && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-obsidian-800/80 backdrop-blur-sm border border-gold-500/20 rounded-lg p-2">
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {[...new Set(filteredEvents.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a).map(year => (
              <button
                key={year}
                onClick={() => scrollToYear(year)}
                className="px-2 py-1 text-xs text-gold-300 hover:text-gold-100 hover:bg-gold-500/20 rounded transition-colors"
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TimelineView