'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Plus, Filter, Sparkles } from 'lucide-react'
import { PrivacyGate } from '@/components/privacy/PrivacyGate'
import { LockedImage } from '@/components/privacy/LockedPlaceholder'
import { usePrivacy } from '@/contexts/PrivacyContext'

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

// Mock data for demonstration
const mockMemories: Memory[] = [
  {
    id: '1',
    type: 'photo',
    title: 'Family Reunion 2024',
    description: 'An unforgettable day with everyone together',
    category: 'joy',
    timestamp: '2024-11-15T10:30:00Z',
    isFavorite: true,
  },
  {
    id: '2',
    type: 'text',
    title: 'Life Lesson: Patience',
    description: 'What I learned about patience through difficult times',
    category: 'lesson',
    timestamp: '2024-11-10T14:20:00Z',
    isFavorite: false,
  },
  {
    id: '3',
    type: 'video',
    title: 'Grandma\'s Recipe',
    description: 'Recording the secret family recipe for future generations',
    category: 'advice',
    timestamp: '2024-11-05T16:45:00Z',
    isFavorite: true,
  },
]

/**
 * Home Feed - Private chronological feed of memories
 * World-first UX: Social media polish for personal legacy content
 */
export default function HomePage() {
  const { isUnlocked } = usePrivacy()
  const [selectedCategory, setSelectedCategory] = useState<EmotionalCategory>('all')

  const categories: { value: EmotionalCategory; label: string; emoji: string }[] = [
    { value: 'all', label: 'All', emoji: '✨' },
    { value: 'joy', label: 'Joy', emoji: '😊' },
    { value: 'lesson', label: 'Lessons', emoji: '📚' },
    { value: 'truth', label: 'Truths', emoji: '💭' },
    { value: 'advice', label: 'Advice', emoji: '💡' },
  ]

  const filteredMemories = selectedCategory === 'all' 
    ? mockMemories 
    : mockMemories.filter(m => m.category === selectedCategory)

  return (
    <div className="min-h-screen bg-obsidian-900">
      {/* Header with filters */}
      <div className="sticky top-16 z-40 bg-gradient-to-b from-obsidian-900 via-obsidian-900/95 to-transparent backdrop-blur-xl border-b border-gold-500/10 pb-4">
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl text-gold-400">Your Story</h2>
            <button className="p-2 bg-gradient-to-r from-gold-400 to-gold-500 rounded-full text-obsidian-900 hover:from-gold-500 hover:to-gold-600 transition-all shadow-lg shadow-gold-400/20">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Emotional category filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-gold-400/20 border-2 border-gold-500/50 text-gold-400'
                    : 'bg-obsidian-800/40 border border-gold-500/20 text-gold-200/70 hover:border-gold-500/40'
                }`}
              >
                <span>{cat.emoji}</span>
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Memory Feed */}
      <PrivacyGate>
        <div className="px-4 py-6 space-y-6">
          {filteredMemories.map((memory, index) => (
            <MemoryCard key={memory.id} memory={memory} index={index} />
          ))}

          {filteredMemories.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-gold-400/50 mx-auto mb-4" />
              <p className="text-gold-200/70">No memories in this category yet</p>
              <p className="text-sm text-gold-200/50 mt-2">Start creating your legacy</p>
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
      transition={{ delay: index * 0.1 }}
      className="bg-gradient-to-br from-charcoal/50 to-obsidian-800/50 backdrop-blur-xl border border-gold-500/20 rounded-2xl overflow-hidden shadow-xl"
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gold-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-500 rounded-full flex items-center justify-center text-obsidian-900 font-serif font-bold">
            You
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
        <span className="text-xs px-2 py-1 bg-gold-400/10 border border-gold-500/30 rounded-full text-gold-400 capitalize">
          {memory.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-serif text-xl text-gold-400 mb-2">{memory.title}</h3>
        <p className="text-gold-200/80 leading-relaxed mb-4">{memory.description}</p>

        {/* Media placeholder */}
        {memory.type === 'photo' || memory.type === 'video' ? (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
            <LockedImage className="w-full h-full" />
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gold-500/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="flex items-center gap-2 text-gold-200/70 hover:text-gold-400 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${isLiked ? 'fill-gold-400 text-gold-400' : ''}`}
            />
            <span className="text-sm">Favorite</span>
          </button>
          <button className="flex items-center gap-2 text-gold-200/70 hover:text-gold-400 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">Reflect</span>
          </button>
        </div>
        <button className="text-gold-200/70 hover:text-gold-400 transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </motion.article>
  )
}
