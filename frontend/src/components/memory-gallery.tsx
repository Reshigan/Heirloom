'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Image, 
  Video, 
  FileText, 
  Music, 
  Heart, 
  Calendar, 
  MapPin, 
  Users, 
  Tag, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Upload,
  X,
  Play,
  Pause,
  Volume2,
  Download,
  Share2,
  Star,
  Eye,
  MessageCircle,
  Loader2
} from 'lucide-react'
import { mockFamilyMembers, Memory } from '../data/mock-family-data'
import { apiClient } from '../lib/api-client'
import { useVault } from '../contexts/VaultContext'
import toast from 'react-hot-toast'
import { SkeletonGallery } from './ui/skeleton'

interface MemoryGalleryProps {
  selectedMemberId?: string
  onMemorySelect?: (memory: Memory) => void
}

const MemoryGallery: React.FC<MemoryGalleryProps> = ({ selectedMemberId, onMemorySelect }) => {
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterSignificance, setFilterSignificance] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'date' | 'significance' | 'title'>('date')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { vaultEncryption } = useVault()

  useEffect(() => {
    fetchMemories()
  }, [])

  const fetchMemories = async () => {
    try {
      setIsLoading(true)
      const items = await apiClient.getMemories()
      const formattedMemories: Memory[] = items.map((item: any) => ({
        id: item.id,
        title: item.title || 'Untitled',
        description: item.description || '',
        content: item.content || item.description || '',
        date: item.date || item.createdAt,
        location: item.location || 'Unknown',
        type: item.type || 'photo',
        thumbnail: item.thumbnail_url || item.thumbnailUrl || '/placeholder.jpg',
        participants: item.participants || [],
        tags: item.tags || [],
        significance: item.importance >= 8 ? 'milestone' : item.importance >= 6 ? 'high' : item.importance >= 4 ? 'medium' : 'low',
        aiEnhanced: item.aiEnhanced || false,
        emotions: item.emotions || []
      }))
      setMemories(formattedMemories)
    } catch (error) {
      console.error('Failed to fetch memories:', error)
      toast.error('Failed to load memories')
      setMemories([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort memories
  const filteredMemories = memories
    .filter(memory => {
      const matchesSearch = memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           memory.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           memory.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesType = !filterType || memory.type === filterType
      const matchesSignificance = !filterSignificance || memory.significance === filterSignificance
      const matchesMember = !selectedMemberId || memory.participants.includes(selectedMemberId)
      
      return matchesSearch && matchesType && matchesSignificance && matchesMember
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'significance':
          const significanceOrder = { 'milestone': 4, 'high': 3, 'medium': 2, 'low': 1 }
          return significanceOrder[b.significance] - significanceOrder[a.significance]
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

  const handleMemoryClick = (memory: Memory) => {
    setSelectedMemory(memory)
    onMemorySelect?.(memory)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'document': return <FileText className="w-4 h-4" />
      case 'audio': return <Music className="w-4 h-4" />
      case 'story': return <FileText className="w-4 h-4" />
      default: return <Image className="w-4 h-4" />
    }
  }

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'milestone': return 'text-gold-400 bg-gold-400/20'
      case 'high': return 'text-orange-400 bg-orange-400/20'
      case 'medium': return 'text-blue-400 bg-blue-400/20'
      case 'low': return 'text-gold-400 bg-gray-400/20'
      default: return 'text-gold-400 bg-gray-400/20'
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (!vaultEncryption) {
      toast.error('Vault encryption not initialized')
      return
    }

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader()
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const { encryptedData, encryptedDek } = await vaultEncryption.encryptData(fileData)

        const fileType = file.type.startsWith('image/') ? 'photo' : 
                        file.type.startsWith('video/') ? 'video' :
                        file.type.startsWith('audio/') ? 'audio' : 'document'

        await apiClient.uploadItem({
          type: fileType,
          title: file.name,
          encryptedData,
          encryptedDek,
          thumbnailUrl: fileType === 'photo' ? fileData : undefined,
          fileSizeBytes: file.size,
          importanceScore: 5
        })
      }

      toast.success(`Successfully uploaded ${files.length} file(s)`)
      setShowUploadModal(false)
      await fetchMemories()
    } catch (error) {
      console.error('Failed to upload files:', error)
      toast.error('Failed to upload files')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gold-500/20">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gold-100">Memory Gallery</h2>
          {selectedMemberId && (
            <span className="text-gold-400/80 text-sm">
              Showing memories for {mockFamilyMembers.find(m => m.id === selectedMemberId)?.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 hover:border-gold-400/40 transition-colors"
            aria-label={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={isUploading}
            className="px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Upload new memory"
            aria-busy={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Memory
              </>
            )}
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
            aria-label="Search memories"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40"
          aria-label="Filter by type"
        >
          <option value="">All Types</option>
          <option value="photo">Photos</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
          <option value="audio">Audio</option>
          <option value="story">Stories</option>
        </select>
        
        <select
          value={filterSignificance}
          onChange={(e) => setFilterSignificance(e.target.value)}
          className="px-3 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40"
          aria-label="Filter by significance"
        >
          <option value="">All Significance</option>
          <option value="milestone">Milestone</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'significance' | 'title')}
          className="px-3 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40"
          aria-label="Sort memories"
        >
          <option value="date">Sort by Date</option>
          <option value="significance">Sort by Significance</option>
          <option value="title">Sort by Title</option>
        </select>
      </div>

      {/* Memory Grid/List */}
      <div className="flex-1 overflow-y-auto p-4" role="region" aria-label="Memory gallery">
        {isLoading ? (
          <SkeletonGallery />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMemories.map((memory, index) => (
              <motion.div
                key={memory.id}
                className="group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => handleMemoryClick(memory)}
                role="button"
                tabIndex={0}
                aria-label={`View memory: ${memory.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleMemoryClick(memory)
                  }
                }}
              >
                <div className="relative bg-gradient-to-br from-obsidian-800/60 to-obsidian-900/80 border border-gold-500/20 rounded-xl overflow-hidden hover:border-gold-400/40 transition-all duration-300 group-hover:scale-105">
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={memory.thumbnail}
                      alt={memory.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    
                    {/* Type Icon */}
                    <div className="absolute top-2 left-2 p-1.5 bg-obsidian-900/80 backdrop-blur-sm rounded-lg text-gold-400">
                      {getTypeIcon(memory.type)}
                    </div>
                    
                    {/* AI Enhanced Badge */}
                    {memory.aiEnhanced && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs rounded-lg font-semibold">
                        AI Enhanced
                      </div>
                    )}
                    
                    {/* Significance Badge */}
                    <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg text-xs font-semibold ${getSignificanceColor(memory.significance)}`}>
                      {memory.significance}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-gold-100 font-semibold text-sm mb-2 line-clamp-2">
                      {memory.title}
                    </h3>
                    
                    <p className="text-gold-400/80 text-xs mb-3 line-clamp-2">
                      {memory.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-gold-500/80 mb-2">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(memory.date).toLocaleDateString()}</span>
                      <MapPin className="w-3 h-3 ml-2" />
                      <span className="truncate">{memory.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gold-500/80">
                      <Users className="w-3 h-3" />
                      <span>{memory.participants.length} people</span>
                      <Tag className="w-3 h-3 ml-2" />
                      <span>{memory.tags.length} tags</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMemories.map((memory, index) => (
              <motion.div
                key={memory.id}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-obsidian-800/60 to-obsidian-900/80 border border-gold-500/20 rounded-xl hover:border-gold-400/40 transition-all duration-300 cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => handleMemoryClick(memory)}
              >
                <img
                  src={memory.thumbnail}
                  alt={memory.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeIcon(memory.type)}
                    <h3 className="text-gold-100 font-semibold">{memory.title}</h3>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${getSignificanceColor(memory.significance)}`}>
                      {memory.significance}
                    </div>
                  </div>
                  
                  <p className="text-gold-400/80 text-sm mb-2 line-clamp-1">
                    {memory.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gold-500/80">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(memory.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{memory.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{memory.participants.length} people</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {memory.aiEnhanced && (
                    <div className="px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs rounded font-semibold">
                      AI
                    </div>
                  )}
                  <button className="p-2 text-gold-400 hover:text-gold-300 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {filteredMemories.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gold-400/60">
            <Image className="w-16 h-16 mb-4" />
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
              className="relative max-w-4xl max-h-[90vh] bg-obsidian-900/95 border border-gold-500/30 rounded-2xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gold-500/20">
                <div className="flex items-center gap-3">
                  {getTypeIcon(selectedMemory.type)}
                  <h2 className="text-xl font-bold text-gold-100">{selectedMemory.title}</h2>
                  <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${getSignificanceColor(selectedMemory.significance)}`}>
                    {selectedMemory.significance}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gold-400 hover:text-gold-300 transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gold-400 hover:text-gold-300 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gold-400 hover:text-gold-300 transition-colors">
                    <Star className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedMemory(null)}
                    className="p-2 text-gold-400 hover:text-gold-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex max-h-[calc(90vh-120px)]">
                {/* Media */}
                <div className="flex-1 flex items-center justify-center bg-black/50">
                  <img
                    src={selectedMemory.thumbnail}
                    alt={selectedMemory.title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                
                {/* Details */}
                <div className="w-80 p-6 overflow-y-auto border-l border-gold-500/20">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-gold-100 font-semibold mb-2">Description</h3>
                      <p className="text-gold-300/80 text-sm">{selectedMemory.description}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-gold-100 font-semibold mb-2">Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gold-400" />
                          <span className="text-gold-300">{new Date(selectedMemory.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gold-400" />
                          <span className="text-gold-300">{selectedMemory.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gold-400" />
                          <span className="text-gold-300">{selectedMemory.participants.length} participants</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-gold-100 font-semibold mb-2">Participants</h3>
                      <div className="space-y-1">
                        {selectedMemory.participants.map(participantId => {
                          const participant = mockFamilyMembers.find(m => m.id === participantId)
                          return participant ? (
                            <div key={participantId} className="text-gold-300/80 text-sm">
                              • {participant.name}
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-gold-100 font-semibold mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedMemory.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gold-500/20 text-gold-300 text-xs rounded-lg"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-gold-100 font-semibold mb-2">Emotions</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedMemory.emotions.map(emotion => (
                          <span
                            key={emotion}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-lg"
                          >
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {selectedMemory.aiEnhanced && (
                      <div className="p-3 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-300 font-semibold text-sm">AI Enhanced</span>
                        </div>
                        <p className="text-purple-200/80 text-xs">
                          This memory has been enhanced with AI technology for better quality and detail.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              className="relative max-w-md w-full mx-4 bg-obsidian-900/95 border border-gold-500/30 rounded-2xl p-6 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gold-100">Upload Memory</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gold-400 hover:text-gold-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div
                className="border-2 border-dashed border-gold-500/30 rounded-xl p-8 text-center hover:border-gold-400/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gold-400 mx-auto mb-4" />
                <p className="text-gold-100 font-semibold mb-2">Drop files here or click to browse</p>
                <p className="text-gold-400/80 text-sm">Support for photos, videos, documents, and audio files</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gold-500/30 text-gold-100 rounded-lg hover:border-gold-400/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-semibold"
                >
                  Browse Files
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MemoryGallery
