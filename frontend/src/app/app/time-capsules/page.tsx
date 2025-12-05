'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Calendar } from 'lucide-react'
import { GoldCard, GoldCardHeader, GoldCardTitle, GoldCardContent } from '@/components/gold-card'
import { apiClient } from '@/lib/api-client'

export default function TimeCapsulesPage() {
  const [capsules, setCapsules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCapsules()
  }, [])

  const loadCapsules = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getTimeCapsules()
      setCapsules(data)
    } catch (error) {
      console.error('Failed to load time capsules:', error)
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
          Time Capsules
        </h1>
        <p className="text-xl text-pearl/70">
          Memories scheduled for future delivery
        </p>
      </motion.div>

      {loading ? (
        <GoldCard>
          <div className="text-center py-12 text-pearl/50">Loading time capsules...</div>
        </GoldCard>
      ) : capsules.length === 0 ? (
        <GoldCard>
          <div className="text-center py-16">
            <Clock className="mx-auto mb-4 text-gold-primary/50" size={64} />
            <p className="text-xl text-pearl/70 mb-2">No time capsules yet</p>
            <p className="text-sm text-pearl/50">
              Schedule memories to be delivered in the future
            </p>
          </div>
        </GoldCard>
      ) : (
        <div className="grid gap-6">
          {capsules.map((capsule, index) => (
            <motion.div
              key={capsule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
            >
              <GoldCard hover>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gold-primary/20 flex items-center justify-center">
                      <Clock className="text-gold-primary" size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif text-gold-primary mb-1">
                        {capsule.title || 'Untitled Capsule'}
                      </h3>
                      <p className="text-sm text-pearl/60 flex items-center gap-2">
                        <Calendar size={14} />
                        Opens: {capsule.unlockDate ? new Date(capsule.unlockDate).toLocaleDateString() : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-pearl/50">
                      {capsule.itemCount || 0} items
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
