'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, 
  X, 
  HardDrive, 
  Upload, 
  Image, 
  Video, 
  Music, 
  FileText,
  Heart,
  Smile,
  Clock,
  Sparkles,
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface VaultStatsDashboardProps {
  onClose: () => void
}

interface VaultStats {
  storage: { used: string; limit: string; percentUsed: number }
  uploads: { thisWeek: number; limit: number; remaining: number; nextReset: string }
  items: { total: number; byType: Record<string, number>; byEmotion: Record<string, number> }
  recipients: { total: number }
  tier: string
}

const EMOTION_ICONS: Record<string, any> = {
  joy: Smile,
  love: Heart,
  nostalgia: Clock,
  gratitude: Sparkles,
  wisdom: FileText,
}

const TYPE_ICONS: Record<string, any> = {
  photo: Image,
  video: Video,
  audio: Music,
  document: FileText,
}

export default function VaultStatsDashboard({ onClose }: VaultStatsDashboardProps) {
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiClient.getVaultStats()
      setStats(data)
    } catch (error: any) {
      console.error('Failed to fetch vault stats:', error)
      setError(error.message || 'Failed to load vault statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const formatBytes = (bytes: string) => {
    const num = parseFloat(bytes)
    if (num === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(num) / Math.log(k))
    return Math.round((num / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-gradient-to-br from-charcoal/95 via-obsidian/95 to-charcoal/95 backdrop-blur-2xl border border-gold-500/30 rounded-2xl shadow-2xl shadow-gold-400/10 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gold-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-gold-400 tracking-wide">Vault Statistics</h2>
                <p className="text-sm text-gold-200/70 mt-1">
                  Overview of your vault usage and contents
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-400 font-medium">Error Loading Statistics</p>
                <p className="text-xs text-red-300/70 mt-1">{error}</p>
              </div>
              <button
                onClick={fetchStats}
                className="px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:border-red-400 hover:bg-red/10 transition-all text-xs uppercase tracking-[0.15em]"
              >
                Retry
              </button>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Top Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Storage */}
                <div className="p-6 bg-obsidian-800/60 border border-gold-500/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <HardDrive className="w-6 h-6 text-gold-400" />
                    <h3 className="font-medium text-gold-400">Storage</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gold-400">
                        {formatBytes(stats.storage.used)}
                      </span>
                      <span className="text-sm text-gold-200/50">
                        / {formatBytes(stats.storage.limit)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-obsidian-900/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold-400 to-gold-500 transition-all duration-500"
                        style={{ width: `${Math.min(stats.storage.percentUsed, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gold-200/50">
                      {stats.storage.percentUsed.toFixed(1)}% used
                    </p>
                  </div>
                </div>

                {/* Uploads This Week */}
                <div className="p-6 bg-obsidian-800/60 border border-gold-500/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Upload className="w-6 h-6 text-gold-400" />
                    <h3 className="font-medium text-gold-400">Uploads</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gold-400">
                        {stats.uploads.thisWeek}
                      </span>
                      <span className="text-sm text-gold-200/50">
                        / {stats.uploads.limit} this week
                      </span>
                    </div>
                    <div className="w-full h-2 bg-obsidian-900/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                        style={{ width: `${(stats.uploads.thisWeek / stats.uploads.limit) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gold-200/50">
                      {stats.uploads.remaining} remaining
                    </p>
                  </div>
                </div>

                {/* Total Items */}
                <div className="p-6 bg-obsidian-800/60 border border-gold-500/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-gold-400" />
                    <h3 className="font-medium text-gold-400">Total Items</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-gold-400">
                      {stats.items.total}
                    </div>
                    <p className="text-xs text-gold-200/50">
                      Memories preserved
                    </p>
                  </div>
                </div>

                {/* Recipients */}
                <div className="p-6 bg-obsidian-800/60 border border-gold-500/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-gold-400" />
                    <h3 className="font-medium text-gold-400">Recipients</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-gold-400">
                      {stats.recipients.total}
                    </div>
                    <p className="text-xs text-gold-200/50">
                      Will receive vault
                    </p>
                  </div>
                </div>
              </div>

              {/* Items by Type */}
              <div className="p-6 bg-obsidian-800/60 border border-gold-500/20 rounded-xl">
                <h3 className="font-medium text-gold-400 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Items by Type
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.items.byType).map(([type, count]) => {
                    const Icon = TYPE_ICONS[type] || FileText
                    return (
                      <div key={type} className="p-4 bg-obsidian-900/60 border border-gold-500/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-gold-400/70" />
                          <p className="text-xs uppercase tracking-[0.15em] text-gold-200/50">
                            {type}
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-gold-400">{count}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Items by Emotion */}
              <div className="p-6 bg-obsidian-800/60 border border-gold-500/20 rounded-xl">
                <h3 className="font-medium text-gold-400 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Items by Emotion
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(stats.items.byEmotion).map(([emotion, count]) => {
                    const Icon = EMOTION_ICONS[emotion] || Heart
                    return (
                      <div key={emotion} className="p-4 bg-obsidian-900/60 border border-gold-500/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-gold-400/70" />
                          <p className="text-xs uppercase tracking-[0.15em] text-gold-200/50">
                            {emotion}
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-gold-400">{count}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Subscription Tier */}
              <div className="p-6 bg-gradient-to-br from-gold-400/10 to-gold-500/5 border border-gold-500/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gold-400 mb-1">Current Plan</h3>
                    <p className="text-2xl font-bold text-gold-400 uppercase tracking-[0.15em]">
                      {stats.tier}
                    </p>
                  </div>
                  {stats.tier.toLowerCase() === 'free' && (
                    <a
                      href="/billing"
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-900 font-medium hover:from-gold-500 hover:to-gold-600 transition-all text-sm uppercase tracking-[0.15em] shadow-lg shadow-gold-400/20"
                    >
                      Upgrade
                    </a>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gold-200/70">
                    <HardDrive className="w-4 h-4" />
                    <span>Storage: {formatBytes(stats.storage.limit)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gold-200/70">
                    <Upload className="w-4 h-4" />
                    <span>Uploads: {stats.uploads.limit}/week</span>
                  </div>
                  <div className="flex items-center gap-2 text-gold-200/70">
                    <Clock className="w-4 h-4" />
                    <span>Resets: {new Date(stats.uploads.nextReset).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gold-400/30 mx-auto mb-4" />
              <p className="text-gold-400/70 mb-2">No statistics available</p>
              <p className="text-sm text-gold-200/50">Start uploading to see your vault statistics</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gold-500/20">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gold-200/50">
              Statistics update in real-time
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gold-500/30 text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all text-sm uppercase tracking-[0.15em]"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
