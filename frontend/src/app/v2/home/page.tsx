'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Plus, Sparkles } from 'lucide-react'
import { PrivacyGate } from '@/components/privacy/PrivacyGate'
import { LockedImage } from '@/components/privacy/LockedPlaceholder'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { apiClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

type EmotionalCategory = 'all' | 'joy' | 'lesson' | 'truth' | 'advice'

interface Memory {
  id: string
  type: 'photo' | 'video' | 'text' | 'audio'
  title: string
  description: string
  category: EmotionalCategory
  timestamp: string
  thumbnailUrl?: string
  isFavorite: boolean
}

/**
 * Home Feed - Private chronological feed of memories
 * World-first UX: Social media polish for personal legacy content
 */
export default function HomePage() {
  const { isUnlocked } = usePrivacy()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<EmotionalCategory>('all')
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isUnlocked) {
      setMemories([])
      setLoading(false)
      return
    }

    const fetchMemories = async () => {
      try {
        setLoading(true)
        const items = await apiClient.getMemories()
        
        const transformedMemories: Memory[] = items.map(item => ({
          id: item.id,
          type: item.type || 'photo',
          title: item.title || 'Untitled Memory',
          description: item.description || '',
          category: (item.emotion || 'joy') as EmotionalCategory,
          timestamp: item.date || new Date().toISOString(),
          thumbnailUrl: item.thumbnail_url,
          isFavorite: item.importance > 7,
        }))
        
        setMemories(transformedMemories)
      } catch (error) {
        console.error('Failed to fetch memories:', error)
        setMemories([])
      } finally {
        setLoading(false)
      }
    }

    fetchMemories()
  }, [isUnlocked])

  const categories: { value: EmotionalCategory; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'joy', label: 'Joy' },
    { value: 'lesson', label: 'Lessons' },
    { value: 'truth', label: 'Truths' },
    { value: 'advice', label: 'Advice' },
  ]

  const filteredMemories = selectedCategory === 'all' 
    ? memories 
    : memories.filter(m => m.category === selectedCategory)

  const handleCreateMemory = () => {
    router.push('/app')
  }

  return (
    <div className="min-h-screen bg-obsidian-900 pb-24">
      {/* Header with filters */}
      <div className="sticky top-16 z-40 bg-gradient-to-b from-obsidian-900 via-obsidian-900/95 to-transparent backdrop-blur-xl pb-4">
        <div className="max-w-[700px] mx-auto px-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-4xl text-gold-400 tracking-tight leading-tight">Your Story</h2>
            <button 
              onClick={handleCreateMemory}
              className="p-2.5 bg-gold-400/10 rounded-full text-gold-400 hover:bg-gold-400/15 transition-all duration-200 shadow-inner"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Emotional category filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full backdrop-blur-md border whitespace-nowrap transition-all duration-200 text-sm font-medium ${
                  selectedCategory === cat.value
                    ? 'bg-gold-400/10 border-gold-500/30 text-gold-400 shadow-inner'
                    : 'bg-obsidian-900/60 border-gold-500/15 text-gold-200/80 hover:text-gold-400 hover:border-gold-500/30'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Memory Feed */}
      <PrivacyGate>
        <div className="max-w-[700px] mx-auto px-4 py-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gold-200/70 text-sm">Loading your memories...</p>
            </div>
          ) : filteredMemories.length > 0 ? (
            filteredMemories.map((memory, index) => (
              <MemoryCard key={memory.id} memory={memory} index={index} />
            ))
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-gold-400/50 mx-auto mb-4" />
              <p className="text-gold-200/70 text-sm">
                {selectedCategory === 'all' 
                  ? 'No memories yet' 
                  : 'No memories in this category yet'}
              </p>
              <p className="text-xs text-gold-200/50 mt-2">Start creating your legacy</p>
            </div>
          )}
        </div>
      </PrivacyGate>
    </div>
  )
}

function MemoryCard({ memory, index }: { memory: Memory; index: number }) {
  const [isLiked, setIsLiked] = useState(memory.isFavorite)

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.08,
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
      whileHover={{ y: -4 }}
      className="bg-obsidian-800/40 backdrop-blur-xl rounded-2xl overflow-hidden shadow-[0_8px_24px_-12px_rgba(212,175,55,0.15)] hover:shadow-[0_12px_32px_-12px_rgba(212,175,55,0.25)] transition-all duration-200"
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-gold-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-400/10 rounded-full flex items-center justify-center text-gold-400 font-serif font-semibold text-sm shadow-inner">
            Y
          </div>
          <div>
            <p className="text-sm font-medium text-gold-100">Your Memory</p>
            <p className="text-xs text-gold-200/50">
              {new Date(memory.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 bg-gold-400/10 backdrop-blur-md rounded-full text-gold-400 capitalize font-medium shadow-inner">
          {memory.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-serif text-xl text-gold-400 mb-2 leading-tight">{memory.title}</h3>
        <p className="text-gold-200/70 leading-relaxed text-[15px] mb-4">{memory.description}</p>

        {/* Media placeholder */}
        {memory.type === 'photo' || memory.type === 'video' ? (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
            <LockedImage className="w-full h-full" />
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-gold-500/5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <motion.button
            onClick={() => setIsLiked(!isLiked)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-gold-200/60 hover:text-gold-400 transition-colors duration-150"
          >
            <Heart
              className={`w-5 h-5 transition-all duration-150 ${isLiked ? 'fill-gold-400 text-gold-400' : ''}`}
            />
            <span className="text-sm font-medium">Favorite</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-gold-200/60 hover:text-gold-400 transition-colors duration-150"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Reflect</span>
          </motion.button>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-gold-200/60 hover:text-gold-400 transition-colors duration-150"
        >
          <Share2 className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.article>
  )
}
