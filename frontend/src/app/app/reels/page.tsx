'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Film } from 'lucide-react'
import { GoldCard } from '@/components/gold-card'

export default function ReelsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-serif font-light text-gold-primary mb-4 tracking-wide">
          Story Reels
        </h1>
        <p className="text-xl text-pearl/70">
          AI-generated story compilations
        </p>
      </motion.div>

      <GoldCard>
        <div className="text-center py-16">
          <Film className="mx-auto mb-4 text-gold-primary/50" size={64} />
          <p className="text-xl text-pearl/70 mb-2">Story Reels Coming Soon</p>
          <p className="text-sm text-pearl/50">
            Watch AI-curated compilations of your memories
          </p>
        </div>
      </GoldCard>
    </div>
  )
}
