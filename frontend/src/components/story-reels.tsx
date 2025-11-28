'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Plus, Film, Sparkles, Download, Eye, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface StoryReel {
  id: string
  title: string
  description?: string
  memoryIds: string[]
  duration: number
  musicTrack?: string
  style: string
  videoUrl?: string
  thumbnailUrl?: string
  status: 'draft' | 'generating' | 'ready' | 'failed'
  viewCount: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

interface Memory {
  id: string
  title: string
  thumbnailUrl?: string
}

interface StoryReelsProps {
  onClose: () => void
}

export default function StoryReels({ onClose }: StoryReelsProps) {
  const [reels, setReels] = useState<StoryReel[]>([])
  const [selectedReel, setSelectedReel] = useState<StoryReel | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [memories, setMemories] = useState<Memory[]>([])
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([])
  const [style, setStyle] = useState('elegant')
  const [duration, setDuration] = useState(30)

  useEffect(() => {
    fetchReels()
    fetchMemories()
  }, [])

  const fetchReels = async () => {
    try {
      const data = await apiClient.get('/api/story-reels')
      setReels(data)
    } catch (error) {
      console.error('Failed to fetch story reels:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMemories = async () => {
    try {
      const data = await apiClient.getMemories()
      setMemories(data)
    } catch (error) {
      console.error('Failed to fetch memories:', error)
    }
  }

  const handleCreateReel = async () => {
    if (!title || selectedMemoryIds.length === 0) {
      alert('Please provide a title and select at least one memory')
      return
    }

    try {
      const newReel = await apiClient.post('/api/story-reels', {
        title,
        description,
        memoryIds: selectedMemoryIds,
        duration,
        style
      })

      setReels([newReel, ...reels])
      setIsCreating(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create story reel:', error)
      alert('Failed to create story reel')
    }
  }

  const handleGenerateVideo = async (reelId: string) => {
    try {
      await apiClient.post(`/api/story-reels/${reelId}/generate`, {})
      
      setReels(reels.map(r => 
        r.id === reelId ? { ...r, status: 'generating' } : r
      ))

      const pollInterval = setInterval(async () => {
        try {
          const updatedReel = await apiClient.get(`/api/story-reels/${reelId}`)
          
          if (updatedReel.status === 'ready' || updatedReel.status === 'failed') {
            clearInterval(pollInterval)
            setReels(reels.map(r => r.id === reelId ? updatedReel : r))
          }
        } catch (error) {
          clearInterval(pollInterval)
        }
      }, 3000)
    } catch (error) {
      console.error('Failed to generate video:', error)
      alert('Failed to generate video')
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setSelectedMemoryIds([])
    setStyle('elegant')
    setDuration(30)
  }

  const toggleMemorySelection = (memoryId: string) => {
    if (selectedMemoryIds.includes(memoryId)) {
      setSelectedMemoryIds(selectedMemoryIds.filter(id => id !== memoryId))
    } else {
      setSelectedMemoryIds([...selectedMemoryIds, memoryId])
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-obsidian-800 to-obsidian-900 rounded-2xl border border-gold-500/20 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gold-500/20">
          <div className="flex items-center gap-3">
            <Film className="w-6 h-6 text-gold-400" />
            <h2 className="text-2xl font-serif text-gold-400">AI Story Reels</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {isCreating ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gold-200 mb-2">
                  Reel Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-500/30 focus:outline-none focus:border-gold-400"
                  placeholder="Our Family Summer 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gold-200 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-500/30 focus:outline-none focus:border-gold-400"
                  placeholder="A beautiful collection of our summer memories..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gold-200 mb-2">
                  Select Memories ({selectedMemoryIds.length} selected)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {memories.slice(0, 12).map((memory) => (
                    <div
                      key={memory.id}
                      onClick={() => toggleMemorySelection(memory.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedMemoryIds.includes(memory.id)
                          ? 'ring-2 ring-gold-400 scale-95'
                          : 'hover:scale-105'
                      }`}
                    >
                      {memory.thumbnailUrl ? (
                        <img
                          src={memory.thumbnailUrl}
                          alt={memory.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gold-500/20 to-gold-500/5 flex items-center justify-center">
                          <Film className="w-8 h-8 text-gold-400/50" />
                        </div>
                      )}
                      {selectedMemoryIds.includes(memory.id) && (
                        <div className="absolute inset-0 bg-gold-400/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-gold-400 flex items-center justify-center">
                            <span className="text-obsidian-900 font-bold">
                              {selectedMemoryIds.indexOf(memory.id) + 1}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gold-200 mb-2">
                    Style
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400"
                  >
                    <option value="elegant">Elegant</option>
                    <option value="modern">Modern</option>
                    <option value="vintage">Vintage</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gold-200 mb-2">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    min={15}
                    max={60}
                    className="w-full px-4 py-3 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateReel}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-900 rounded-lg font-medium hover:from-gold-400 hover:to-gold-500 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Create Reel
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    resetForm()
                  }}
                  className="px-6 py-3 border border-gold-500/30 text-gold-400 rounded-lg font-medium hover:border-gold-400 hover:bg-gold/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-gold-200/70">
                  Create beautiful video reels from your memories with AI
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-900 rounded-lg font-medium hover:from-gold-400 hover:to-gold-500 transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Reel
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
                </div>
              ) : reels.length === 0 ? (
                <div className="text-center py-12">
                  <Film className="w-16 h-16 text-gold-400/30 mx-auto mb-4" />
                  <p className="text-gold-200/50">No story reels yet</p>
                  <p className="text-gold-200/30 text-sm mt-2">
                    Create your first AI-generated video reel
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reels.map((reel) => (
                    <div
                      key={reel.id}
                      className="bg-obsidian-900/50 border border-gold-500/20 rounded-lg overflow-hidden hover:border-gold-400/40 transition-all"
                    >
                      <div className="aspect-video bg-gradient-to-br from-gold-500/20 to-gold-500/5 flex items-center justify-center relative">
                        {reel.thumbnailUrl ? (
                          <img
                            src={reel.thumbnailUrl}
                            alt={reel.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Film className="w-12 h-12 text-gold-400/50" />
                        )}
                        
                        {reel.status === 'generating' && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-medium text-gold-100">{reel.title}</h3>
                          {reel.description && (
                            <p className="text-sm text-gold-200/50 mt-1 line-clamp-2">
                              {reel.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gold-200/50">
                          <Eye className="w-4 h-4" />
                          <span>{reel.viewCount} views</span>
                          <span>•</span>
                          <span>{reel.memoryIds.length} memories</span>
                          <span>•</span>
                          <span>{reel.duration}s</span>
                        </div>

                        <div className="flex gap-2">
                          {reel.status === 'draft' && (
                            <button
                              onClick={() => handleGenerateVideo(reel.id)}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-900 rounded-lg text-sm font-medium hover:from-gold-400 hover:to-gold-500 transition-all flex items-center justify-center gap-2"
                            >
                              <Sparkles className="w-4 h-4" />
                              Generate Video
                            </button>
                          )}
                          
                          {reel.status === 'ready' && (
                            <button
                              onClick={() => setSelectedReel(reel)}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-900 rounded-lg text-sm font-medium hover:from-gold-400 hover:to-gold-500 transition-all flex items-center justify-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Watch
                            </button>
                          )}

                          {reel.status === 'generating' && (
                            <div className="flex-1 px-4 py-2 bg-obsidian-800 text-gold-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
