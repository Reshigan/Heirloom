'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { GoldCard } from '@/components/gold-card'

export default function LettersPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-serif font-light text-gold-primary mb-4 tracking-wide">
          After I'm Gone Letters
        </h1>
        <p className="text-xl text-pearl/70">
          Messages for your loved ones
        </p>
      </motion.div>

      <GoldCard>
        <div className="text-center py-16">
          <Mail className="mx-auto mb-4 text-gold-primary/50" size={64} />
          <p className="text-xl text-pearl/70 mb-2">Letters Coming Soon</p>
          <p className="text-sm text-pearl/50">
            Write heartfelt messages to be delivered after you're gone
          </p>
        </div>
      </GoldCard>
    </div>
  )
}
