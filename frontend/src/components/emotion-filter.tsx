'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Smile, Sparkles, Star, Sun, Cloud, Droplet, Flame } from 'lucide-react'
import { LuxCard, LuxButton } from './lux'

export type Emotion = 'joy' | 'love' | 'nostalgia' | 'pride' | 'gratitude' | 'peace' | 'hope' | 'awe'

interface EmotionFilterProps {
  selectedEmotions: Emotion[]
  onEmotionToggle: (emotion: Emotion) => void
  onClear: () => void
}

const emotionConfig: Record<Emotion, { label: string; icon: React.ReactNode; color: string }> = {
  joy: { label: 'Joy', icon: <Smile className="w-4 h-4" />, color: 'from-yellow-500 to-amber-500' },
  love: { label: 'Love', icon: <Heart className="w-4 h-4" />, color: 'from-red-500 to-pink-500' },
  nostalgia: { label: 'Nostalgia', icon: <Cloud className="w-4 h-4" />, color: 'from-purple-500 to-indigo-500' },
  pride: { label: 'Pride', icon: <Star className="w-4 h-4" />, color: 'from-gold-500 to-amber-600' },
  gratitude: { label: 'Gratitude', icon: <Sparkles className="w-4 h-4" />, color: 'from-green-500 to-emerald-500' },
  peace: { label: 'Peace', icon: <Droplet className="w-4 h-4" />, color: 'from-blue-400 to-cyan-400' },
  hope: { label: 'Hope', icon: <Sun className="w-4 h-4" />, color: 'from-orange-400 to-yellow-400' },
  awe: { label: 'Awe', icon: <Flame className="w-4 h-4" />, color: 'from-violet-500 to-purple-600' }
}

export default function EmotionFilter({ selectedEmotions, onEmotionToggle, onClear }: EmotionFilterProps) {
  return (
    <LuxCard variant="default" padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider">
          Filter by Emotion
        </h3>
        {selectedEmotions.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-gold-400/70 hover:text-gold-400 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(emotionConfig) as Emotion[]).map((emotion) => {
          const config = emotionConfig[emotion]
          const isSelected = selectedEmotions.includes(emotion)

          return (
            <motion.button
              key={emotion}
              onClick={() => onEmotionToggle(emotion)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isSelected
                  ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                  : 'bg-charcoal-900/50 border border-gold-500/20 text-pearl/70 hover:text-pearl hover:border-gold-500/40 backdrop-blur-md'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {config.icon}
              <span className="text-xs font-medium">{config.label}</span>
            </motion.button>
          )
        })}
      </div>

      {selectedEmotions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gold-500/20">
          <p className="text-xs text-pearl/60">
            Showing memories with: <span className="text-gold-400 font-medium">
              {selectedEmotions.map(e => emotionConfig[e].label).join(', ')}
            </span>
          </p>
        </div>
      )}
    </LuxCard>
  )
}
