'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { 
  Camera, 
  Video, 
  Music, 
  FileText, 
  Heart, 
  Share2, 
  Download, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  ZoomIn,
  Filter,
  Calendar,
  MapPin,
  Users,
  Tag,
  Search,
  Grid3X3,
  List,
  Star,
  Clock
} from 'lucide-react'
import { LuxCard, LuxButton, LuxOrb } from './lux'

interface Memory {
  id: string
  type: 'photo' | 'video' | 'audio' | 'text'
  title: string
  description: string
  date: string
  location?: string
  tags: string[]
  thumbnail: string
  url: string
  duration?: number
  likes: number
  isLiked: boolean
  author: string
  familyMembers: string[]
}

interface AnimatedMemoryGalleryProps {
  isOpen: boolean
  onClose: () => void
  memories: Memory[]
}

export default function AnimatedMemoryGallery({ isOpen, onClose, memories: initialMemories }: AnimatedMemoryGalleryProps) {
  const [memories, setMemories] = useState<Memory[]>(initialMemories || [])
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video' | 'audio' | 'text'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'likes' | 'title'>('date')
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ container: containerRef })
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.8])

  // Mock data for demonstration
  useEffect(() => {
    if (!initialMemories || initialMemories.length === 0) {
      setMemories([
        {
          id: '1',
          type: 'photo',
          title: 'Family Reunion 2023',
          description: 'Amazing gathering with all family members at grandma\'s house',
          date: '2023-12-25',
          location: 'Grandma\'s House, Springfield',
          tags: ['family', 'reunion', 'christmas', 'grandma'],
          thumbnail: '/api/placeholder/300/200',
          url: '/api/placeholder/800/600',
          likes: 24,
          isLiked: true,
          author: 'Mom',
          familyMembers: ['Dad', 'Sister', 'Brother', 'Grandma']
        },
        {
          id: '2',
          type: 'video',
          title: 'First Steps',
          description: 'Baby\'s first steps captured on camera',
          date: '2023-08-15',
          location: 'Living Room',
          tags: ['baby', 'milestone', 'first-steps'],
          thumbnail: '/api/placeholder/300/200',
          url: '/api/placeholder/video',
          duration: 45,
          likes: 18,
          isLiked: false,
          author: 'Dad',
          familyMembers: ['Mom', 'Baby']
        },
        {
          id: '3',
          type: 'audio',
          title: 'Grandpa\'s Stories',
          description: 'Recording of grandpa telling war stories',
          date: '2023-06-10',
          tags: ['grandpa', 'stories', 'history', 'war'],
          thumbnail: '/api/placeholder/300/200',
          url: '/api/placeholder/audio',
          duration: 1200,
          likes: 32,
          isLiked: true,
          author: 'Uncle John',
          familyMembers: ['Grandpa', 'Family']
        },
        {
          id: '4',
          type: 'text',
          title: 'Mom\'s Recipe Collection',
          description: 'Handwritten recipes passed down through generations',
          date: '2023-03-20',
          tags: ['recipes', 'cooking', 'tradition', 'mom'],
          thumbnail: '/api/placeholder/300/200',
          url: '/api/placeholder/document',
          likes: 15,
          isLiked: false,
          author: 'Mom',
          familyMembers: ['Grandma', 'Mom']
        }
      ])
    }
  }, [initialMemories])

  const filteredMemories = memories
    .filter(memory => filterType === 'all' || memory.type === filterType)
    .filter(memory => 
      memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'likes':
          return b.likes - a.likes
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

  const toggleLike = (memoryId: string) => {
    setMemories(memories.map(memory => 
      memory.id === memoryId 
        ? { 
            ...memory, 
            isLiked: !memory.isLiked,
            likes: memory.isLiked ? memory.likes - 1 : memory.likes + 1
          }
        : memory
    ))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Camera className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'audio': return <Music className="w-4 h-4" />
      case 'text': return <FileText className="w-4 h-4" />
      default: return <Camera className="w-4 h-4" />
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
        {/* Animated Header */}
        <motion.div
          className="bg-gradient-to-r from-modern-blue via-modern-purple to-modern-coral p-6 text-white"
          style={{ opacity: headerOpacity }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Camera className="w-6 h-6" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold">Memory Gallery</h2>
                <p className="text-white/80">{filteredMemories.length} memories found</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
              </motion.button>
              
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>

        {/* Controls Bar */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-modern-blue focus:border-transparent"
              />
            </div>

            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-modern-blue focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="photo">Photos</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="text">Documents</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-modern-blue focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="likes">Sort by Likes</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>

        {/* Memory Grid/List */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div
                key="grid"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredMemories.map((memory, index) => (
                  <motion.div
                    key={memory.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedMemory(memory)}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gray-200 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-modern-blue/20 to-modern-purple/20" />
                      
                      {/* Type Icon */}
                      <div className="absolute top-2 left-2 bg-black/50 rounded-full p-1.5 text-white">
                        {getTypeIcon(memory.type)}
                      </div>

                      {/* Duration for video/audio */}
                      {memory.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(memory.duration)}
                        </div>
                      )}

                      {/* Play button for video/audio */}
                      {(memory.type === 'video' || memory.type === 'audio') && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          whileHover={{ scale: 1.1 }}
                        >
                          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-modern-blue ml-0.5" />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                        {memory.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {memory.description}
                      </p>
                      
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(memory.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{memory.familyMembers.length}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {memory.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-modern-blue/10 text-modern-blue text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {memory.tags.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{memory.tags.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleLike(memory.id)
                            }}
                            className={`flex items-center space-x-1 ${
                              memory.isLiked ? 'text-red-500' : 'text-gray-400'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Heart className={`w-4 h-4 ${memory.isLiked ? 'fill-current' : ''}`} />
                            <span className="text-xs">{memory.likes}</span>
                          </motion.button>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          by {memory.author}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredMemories.map((memory, index) => (
                  <motion.div
                    key={memory.id}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedMemory(memory)}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Thumbnail */}
                      <div className="w-24 h-16 bg-gray-200 rounded-lg flex-shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-modern-blue/20 to-modern-purple/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          {getTypeIcon(memory.type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {memory.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {memory.description}
                            </p>
                          </div>
                          
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleLike(memory.id)
                            }}
                            className={`flex items-center space-x-1 ${
                              memory.isLiked ? 'text-red-500' : 'text-gray-400'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Heart className={`w-4 h-4 ${memory.isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm">{memory.likes}</span>
                          </motion.button>
                        </div>

                        {/* Meta and Tags */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(memory.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{memory.familyMembers.length} family members</span>
                            </div>
                            <span>by {memory.author}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {memory.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-modern-blue/10 text-modern-blue text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Memory Detail Modal */}
        <AnimatePresence>
          {selectedMemory && (
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMemory(null)}
            >
              <motion.div
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-modern-blue to-modern-purple p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(selectedMemory.type)}
                      <div>
                        <h3 className="text-xl font-bold">{selectedMemory.title}</h3>
                        <p className="text-white/80">{selectedMemory.author} • {new Date(selectedMemory.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMemory(null)}
                      className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Media Preview */}
                    <div className="space-y-4">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          {getTypeIcon(selectedMemory.type)}
                          <p className="text-sm text-gray-600 mt-2">
                            {selectedMemory.type.charAt(0).toUpperCase() + selectedMemory.type.slice(1)} Preview
                          </p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-center space-x-4">
                        <motion.button
                          className="flex items-center space-x-2 px-4 py-2 bg-modern-blue text-white rounded-lg hover:bg-modern-blue/90 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </motion.button>
                        
                        <motion.button
                          className="flex items-center space-x-2 px-4 py-2 bg-modern-emerald text-white rounded-lg hover:bg-modern-emerald/90 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-600">{selectedMemory.description}</p>
                      </div>

                      {selectedMemory.location && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{selectedMemory.location}</span>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Family Members</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedMemory.familyMembers.map((member) => (
                            <span
                              key={member}
                              className="px-3 py-1 bg-modern-purple/10 text-modern-purple rounded-full text-sm"
                            >
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedMemory.tags.map((tag) => (
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
                        <motion.button
                          onClick={() => toggleLike(selectedMemory.id)}
                          className={`flex items-center space-x-2 ${
                            selectedMemory.isLiked ? 'text-red-500' : 'text-gray-400'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Heart className={`w-5 h-5 ${selectedMemory.isLiked ? 'fill-current' : ''}`} />
                          <span>{selectedMemory.likes} likes</span>
                        </motion.button>
                        
                        <div className="text-sm text-gray-500">
                          Added {new Date(selectedMemory.date).toLocaleDateString()}
                        </div>
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
