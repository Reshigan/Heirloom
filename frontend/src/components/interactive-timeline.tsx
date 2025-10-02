'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, PanInfo } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Search,
  Camera,
  Video,
  Music,
  FileText,
  Heart,
  MapPin,
  Users,
  Zap,
  Star,
  Baby,
  GraduationCap,
  Home,
  Briefcase,
  // Ring, // Not available in lucide-react
  Cake,
  Plane,
  Gift
} from 'lucide-react'

interface TimelineEvent {
  id: string
  title: string
  description: string
  date: string
  type: 'milestone' | 'memory' | 'achievement' | 'celebration' | 'travel' | 'family'
  category: 'photo' | 'video' | 'audio' | 'text'
  thumbnail?: string
  location?: string
  participants: string[]
  importance: 1 | 2 | 3 | 4 | 5
  tags: string[]
  color: string
}

interface InteractiveTimelineProps {
  isOpen: boolean
  onClose: () => void
  events: TimelineEvent[]
}

export default function InteractiveTimeline({ isOpen, onClose, events: initialEvents }: InteractiveTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents || [])
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<'year' | 'decade' | 'lifetime'>('year')
  const [filterType, setFilterType] = useState<'all' | 'milestone' | 'memory' | 'achievement' | 'celebration' | 'travel' | 'family'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 })
  
  const timelineRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollX } = useScroll({ container: timelineRef, axis: 'x' })
  
  // Mock data for demonstration
  useEffect(() => {
    if (!initialEvents || initialEvents.length === 0) {
      setEvents([
        {
          id: '1',
          title: 'Born',
          description: 'Welcome to the world!',
          date: '1990-05-15',
          type: 'milestone',
          category: 'photo',
          participants: ['Mom', 'Dad'],
          importance: 5,
          tags: ['birth', 'family', 'milestone'],
          color: '#EC4899'
        },
        {
          id: '2',
          title: 'First Steps',
          description: 'Took my very first steps in the living room',
          date: '1991-08-22',
          type: 'milestone',
          category: 'video',
          participants: ['Mom', 'Dad'],
          importance: 4,
          tags: ['milestone', 'baby', 'development'],
          color: '#10B981'
        },
        {
          id: '3',
          title: 'Started School',
          description: 'First day of kindergarten at Sunny Elementary',
          date: '1995-09-01',
          type: 'milestone',
          category: 'photo',
          location: 'Sunny Elementary School',
          participants: ['Mom', 'Teacher'],
          importance: 4,
          tags: ['school', 'education', 'milestone'],
          color: '#2563EB'
        },
        {
          id: '4',
          title: 'Family Vacation',
          description: 'Amazing trip to Disney World with the whole family',
          date: '1998-07-10',
          type: 'travel',
          category: 'photo',
          location: 'Disney World, Florida',
          participants: ['Mom', 'Dad', 'Sister', 'Brother'],
          importance: 4,
          tags: ['vacation', 'family', 'disney', 'travel'],
          color: '#F59E0B'
        },
        {
          id: '5',
          title: 'High School Graduation',
          description: 'Graduated with honors from Central High School',
          date: '2008-06-15',
          type: 'achievement',
          category: 'photo',
          location: 'Central High School',
          participants: ['Family', 'Friends', 'Teachers'],
          importance: 5,
          tags: ['graduation', 'achievement', 'education'],
          color: '#7C3AED'
        },
        {
          id: '6',
          title: 'College Years',
          description: 'Started studying Computer Science at State University',
          date: '2008-08-25',
          type: 'milestone',
          category: 'photo',
          location: 'State University',
          participants: ['Roommates', 'New Friends'],
          importance: 4,
          tags: ['college', 'education', 'independence'],
          color: '#2563EB'
        },
        {
          id: '7',
          title: 'First Job',
          description: 'Started my career as a Software Developer',
          date: '2012-09-01',
          type: 'achievement',
          category: 'photo',
          location: 'Tech Corp',
          participants: ['Colleagues'],
          importance: 4,
          tags: ['career', 'job', 'achievement'],
          color: '#059669'
        },
        {
          id: '8',
          title: 'Wedding Day',
          description: 'Married the love of my life in a beautiful ceremony',
          date: '2015-06-20',
          type: 'celebration',
          category: 'photo',
          location: 'Garden Chapel',
          participants: ['Spouse', 'Family', 'Friends'],
          importance: 5,
          tags: ['wedding', 'love', 'celebration', 'milestone'],
          color: '#EC4899'
        },
        {
          id: '9',
          title: 'First Child Born',
          description: 'Our beautiful daughter came into the world',
          date: '2018-03-12',
          type: 'milestone',
          category: 'photo',
          location: 'City Hospital',
          participants: ['Spouse', 'Daughter'],
          importance: 5,
          tags: ['birth', 'family', 'milestone', 'daughter'],
          color: '#F97316'
        },
        {
          id: '10',
          title: 'Bought First House',
          description: 'Finally got the keys to our dream home',
          date: '2020-11-05',
          type: 'milestone',
          category: 'photo',
          location: '123 Dream Street',
          participants: ['Spouse', 'Daughter'],
          importance: 4,
          tags: ['house', 'milestone', 'achievement', 'family'],
          color: '#0891B2'
        }
      ])
    }
  }, [initialEvents])

  // Calculate timeline constraints
  useEffect(() => {
    if (timelineRef.current && containerRef.current) {
      const timelineWidth = timelineRef.current.scrollWidth
      const containerWidth = containerRef.current.clientWidth
      setDragConstraints({
        left: -(timelineWidth - containerWidth),
        right: 0
      })
    }
  }, [events, viewMode])

  const filteredEvents = events
    .filter(event => filterType === 'all' || event.type === filterType)
    .filter(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'milestone':
        if (event.tags.includes('birth')) return <Baby className="w-4 h-4" />
        if (event.tags.includes('graduation')) return <GraduationCap className="w-4 h-4" />
        if (event.tags.includes('house')) return <Home className="w-4 h-4" />
        if (event.tags.includes('job')) return <Briefcase className="w-4 h-4" />
        return <Star className="w-4 h-4" />
      case 'celebration':
        if (event.tags.includes('wedding')) return <Heart className="w-4 h-4" />
        if (event.tags.includes('birthday')) return <Cake className="w-4 h-4" />
        return <Gift className="w-4 h-4" />
      case 'travel':
        return <Plane className="w-4 h-4" />
      case 'achievement':
        return <Zap className="w-4 h-4" />
      case 'family':
        return <Users className="w-4 h-4" />
      default:
        return <Heart className="w-4 h-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'photo': return <Camera className="w-3 h-3" />
      case 'video': return <Video className="w-3 h-3" />
      case 'audio': return <Music className="w-3 h-3" />
      case 'text': return <FileText className="w-3 h-3" />
      default: return <Camera className="w-3 h-3" />
    }
  }

  const getYearRange = () => {
    if (filteredEvents.length === 0) return { start: currentYear, end: currentYear }
    
    const dates = filteredEvents.map(event => new Date(event.date).getFullYear())
    const minYear = Math.min(...dates)
    const maxYear = Math.max(...dates)
    
    switch (viewMode) {
      case 'year':
        return { start: currentYear, end: currentYear }
      case 'decade':
        const decadeStart = Math.floor(currentYear / 10) * 10
        return { start: decadeStart, end: decadeStart + 9 }
      case 'lifetime':
        return { start: minYear, end: maxYear }
      default:
        return { start: minYear, end: maxYear }
    }
  }

  const navigateYear = (direction: 'prev' | 'next') => {
    const increment = viewMode === 'decade' ? 10 : 1
    setCurrentYear(prev => direction === 'next' ? prev + increment : prev - increment)
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-modern-blue via-modern-purple to-modern-coral p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Clock className="w-6 h-6" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold">Life Timeline</h2>
                <p className="text-white/80">{filteredEvents.length} life events</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search timeline events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-modern-blue focus:border-transparent"
              />
            </div>

            {/* View Mode */}
            <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
              {['year', 'decade', 'lifetime'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`px-3 py-2 text-sm font-medium capitalize transition-colors ${
                    viewMode === mode
                      ? 'bg-modern-blue text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-modern-blue focus:border-transparent"
            >
              <option value="all">All Events</option>
              <option value="milestone">Milestones</option>
              <option value="achievement">Achievements</option>
              <option value="celebration">Celebrations</option>
              <option value="travel">Travel</option>
              <option value="family">Family</option>
            </select>
          </div>

          {/* Year Navigation */}
          {viewMode !== 'lifetime' && (
            <div className="flex items-center justify-center space-x-4 mt-4">
              <motion.button
                onClick={() => navigateYear('prev')}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              
              <div className="text-lg font-semibold text-gray-900">
                {viewMode === 'year' ? currentYear : `${Math.floor(currentYear / 10) * 10}s`}
              </div>
              
              <motion.button
                onClick={() => navigateYear('next')}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div ref={containerRef} className="flex-1 overflow-hidden p-6">
          <motion.div
            ref={timelineRef}
            className="relative"
            drag="x"
            dragConstraints={dragConstraints}
            dragElastic={0.1}
            dragMomentum={false}
          >
            {/* Timeline Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-modern-blue via-modern-purple to-modern-coral rounded-full transform -translate-y-1/2" />
            
            {/* Timeline Events */}
            <div className="flex items-center space-x-8 min-w-max py-8">
              {filteredEvents.map((event, index) => {
                const eventDate = new Date(event.date)
                const yearRange = getYearRange()
                
                // Skip events outside current view range
                if (viewMode !== 'lifetime' && 
                    (eventDate.getFullYear() < yearRange.start || eventDate.getFullYear() > yearRange.end)) {
                  return null
                }

                return (
                  <motion.div
                    key={event.id}
                    className="relative flex flex-col items-center cursor-pointer group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    {/* Event Node */}
                    <motion.div
                      className="relative z-10 w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: event.color }}
                      whileHover={{ scale: 1.2, y: -5 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {getEventIcon(event)}
                      
                      {/* Importance Indicator */}
                      {event.importance >= 4 && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Star className="w-2 h-2 text-yellow-800" />
                        </motion.div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                        {getCategoryIcon(event.category)}
                      </div>
                    </motion.div>

                    {/* Event Info */}
                    <motion.div
                      className="mt-4 text-center max-w-32 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ y: 10 }}
                      whileHover={{ y: 0 }}
                    >
                      <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-1">
                        {eventDate.toLocaleDateString()}
                      </p>
                      {event.location && (
                        <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </motion.div>

                    {/* Hover Details */}
                    <motion.div
                      className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-4 min-w-64 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-20"
                      initial={{ y: 10, opacity: 0 }}
                      whileHover={{ y: 0, opacity: 1 }}
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{eventDate.toLocaleDateString()}</span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span>{event.participants.join(', ')}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3">
                        {event.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-modern-blue/10 text-modern-blue text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Event Detail Modal */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
            >
              <motion.div
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div 
                  className="p-6 text-white"
                  style={{ background: `linear-gradient(135deg, ${selectedEvent.color}, ${selectedEvent.color}CC)` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        {getEventIcon(selectedEvent)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
                        <p className="text-white/80">
                          {new Date(selectedEvent.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 max-h-[50vh] overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-600">{selectedEvent.description}</p>
                    </div>

                    {selectedEvent.location && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedEvent.location}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Participants</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.participants.map((participant) => (
                          <span
                            key={participant}
                            className="px-3 py-1 bg-modern-purple/10 text-modern-purple rounded-full text-sm"
                          >
                            {participant}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-modern-blue/10 text-modern-blue rounded-full text-sm"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < selectedEvent.importance
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">Importance</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {getCategoryIcon(selectedEvent.category)}
                        <span className="capitalize">{selectedEvent.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}