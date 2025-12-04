'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, Sparkles } from 'lucide-react'
import { GoldCard, GoldCardHeader, GoldCardTitle, GoldCardContent } from '@/components/gold-card'
import { apiClient } from '@/lib/api-client'

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHighlights()
  }, [])

  const loadHighlights = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getHighlights()
      setHighlights(data)
    } catch (error) {
      console.error('Failed to load highlights:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-serif font-light text-gold-primary mb-4 tracking-wide">
          Highlights
        </h1>
        <p className="text-xl text-pearl/70">
          Your most important memories
        </p>
      </motion.div>

      {loading ? (
        <GoldCard>
          <div className="text-center py-12 text-pearl/50">Loading highlights...</div>
        </GoldCard>
      ) : highlights.length === 0 ? (
        <GoldCard>
          <div className="text-center py-16">
            <Star className="mx-auto mb-4 text-gold-primary/50" size={64} />
            <p className="text-xl text-pearl/70 mb-2">No highlights yet</p>
            <p className="text-sm text-pearl/50">
              Your most important memories will appear here
            </p>
          </div>
        </GoldCard>
      ) : (
        <div className="grid gap-6">
          {highlights.map((highlight, index) => (
            <motion.div
              key={highlight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
            >
              <GoldCard hover>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gold-primary/20 flex items-center justify-center">
                    <Sparkles className="text-gold-primary" size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-serif text-gold-primary mb-1">
                      {highlight.title || 'Untitled Highlight'}
                    </h3>
                    <p className="text-sm text-pearl/60">
                      {highlight.description || 'No description'}
                    </p>
                  </div>
                </div>
              </GoldCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
