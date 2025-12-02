'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Heart, Image as ImageIcon, Video, FileText, Settings, Lock } from 'lucide-react'
import { PrivacyGate } from '@/components/privacy/PrivacyGate'
import { useAuth } from '@/contexts/AuthContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { apiClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

/**
 * Profile Page - Modern profile with stats and legacy intent
 * World-first UX: Social media-grade profile for private legacy
 */
export default function ProfilePage() {
  const { user } = useAuth()
  const { isUnlocked, getRemainingTime } = usePrivacy()
  const router = useRouter()
  const [stats, setStats] = useState([
    { label: 'Memories', value: '0', icon: ImageIcon },
    { label: 'Videos', value: '0', icon: Video },
    { label: 'Letters', value: '0', icon: FileText },
    { label: 'Favorites', value: '0', icon: Heart },
  ])
  const [loading, setLoading] = useState(true)

  const remainingMinutes = Math.floor(getRemainingTime() / 1000 / 60)

  useEffect(() => {
    if (!isUnlocked) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        setLoading(true)
        const vaultStats = await apiClient.getVaultStats()
        
        const totalItems = vaultStats.items.total
        const videoCount = vaultStats.items.byType.video || 0
        const textCount = vaultStats.items.byType.text || 0
        
        const memories = await apiClient.getMemories()
        const favoriteCount = memories.filter(m => m.importance > 7).length
        
        setStats([
          { label: 'Memories', value: totalItems.toString(), icon: ImageIcon },
          { label: 'Videos', value: videoCount.toString(), icon: Video },
          { label: 'Letters', value: textCount.toString(), icon: FileText },
          { label: 'Favorites', value: favoriteCount.toString(), icon: Heart },
        ])
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isUnlocked])

  const handleSettings = () => {
    router.push('/app')
  }

  return (
    <div className="min-h-screen bg-obsidian-900">
      {/* Header */}
      <div className="relative h-48 bg-gradient-to-br from-gold-400/20 via-gold-500/10 to-transparent border-b border-gold-500/20">
        <div className="absolute inset-0 bg-[url('/constellation-pattern.svg')] opacity-10" />
      </div>

      {/* Profile Content */}
      <div className="relative px-4 -mt-16">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative inline-block"
        >
          <div className="w-32 h-32 bg-gold-400/10 border-2 border-gold-500/30 rounded-full flex items-center justify-center">
            <User className="w-16 h-16 text-gold-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500/10 border-2 border-green-500/40 rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5 text-green-400" />
          </div>
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-4 mb-6"
        >
          <h1 className="font-serif text-3xl text-gold-400 mb-1">
            {user?.name || 'Your Name'}
          </h1>
          <p className="text-gold-200/70 mb-2">{user?.email || 'your.email@example.com'}</p>
          
          {isUnlocked && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">
                Vault unlocked • {remainingMinutes}m remaining
              </span>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <PrivacyGate>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            {loading ? (
              <div className="col-span-2 text-center py-8">
                <div className="w-8 h-8 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gold-200/70">Loading stats...</p>
              </div>
            ) : (
              stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-gradient-to-br from-charcoal/50 to-obsidian-800/50 backdrop-blur-xl border border-gold-500/20 rounded-2xl p-4 text-center"
                  >
                    <Icon className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                    <div className="text-2xl font-serif text-gold-400 mb-1">{stat.value}</div>
                    <div className="text-xs text-gold-200/70">{stat.label}</div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        </PrivacyGate>

        {/* Legacy Intent Section */}
        <PrivacyGate>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="font-serif text-xl text-gold-400 mb-4">Legacy Intent</h2>
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-charcoal/50 to-obsidian-800/50 backdrop-blur-xl border border-gold-500/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gold-200/70">Letters to Future Generations</span>
                  <span className="text-lg font-serif text-gold-400">8</span>
                </div>
                <div className="w-full bg-obsidian-800/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-gold-400 to-gold-500 h-2 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-charcoal/50 to-obsidian-800/50 backdrop-blur-xl border border-gold-500/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gold-200/70">Life Lessons Documented</span>
                  <span className="text-lg font-serif text-gold-400">15</span>
                </div>
                <div className="w-full bg-obsidian-800/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-gold-400 to-gold-500 h-2 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-charcoal/50 to-obsidian-800/50 backdrop-blur-xl border border-gold-500/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gold-200/70">Family Stories Preserved</span>
                  <span className="text-lg font-serif text-gold-400">32</span>
                </div>
                <div className="w-full bg-obsidian-800/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-gold-400 to-gold-500 h-2 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
            </div>
          </motion.div>
        </PrivacyGate>

        {/* Settings Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={handleSettings}
          className="w-full bg-gold-400/10 border border-gold-500/30 text-gold-400 font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gold-400/15 hover:border-gold-500/40 transition-all duration-200 mb-8"
        >
          <Settings className="w-5 h-5" />
          <span>Account Settings</span>
        </motion.button>
      </div>
    </div>
  )
}
