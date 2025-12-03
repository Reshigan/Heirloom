'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Image, Video, Mail, Search } from 'lucide-react'
import { PrivacyGate } from '@/components/privacy/PrivacyGate'
import { apiClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

/**
 * V3 Vault Page - Letters & Media browser
 */

interface VaultItem {
  id: string
  type: 'photo' | 'video' | 'letter' | 'text'
  title: string
  date: string
  preview?: string
}

export default function VaultPage() {
  const router = useRouter()
  const [items, setItems] = useState<VaultItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'photo' | 'video' | 'letter'>('all')

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        const memories = await apiClient.getMemories()
        
        const transformedItems: VaultItem[] = memories.map(m => ({
          id: m.id,
          type: m.type as 'photo' | 'video' | 'letter' | 'text',
          title: m.title || 'Untitled',
          date: m.date || new Date().toISOString(),
          preview: m.description,
        }))
        
        setItems(transformedItems)
      } catch (error) {
        console.error('Failed to fetch vault items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  const filteredItems = filter === 'all' ? items : items.filter(i => i.type === filter)

  const getIcon = (type: string) => {
    switch (type) {
      case 'photo': return Image
      case 'video': return Video
      case 'letter': return Mail
      default: return FileText
    }
  }

  return (
    <PrivacyGate>
      <div className="min-h-screen bg-paper">
        {/* Header */}
        <div className="border-b border-divider bg-white">
          <div className="max-w-wide mx-auto px-6 py-8">
            <h1 className="font-serif text-3xl text-navy-500 mb-2">Letters & Media</h1>
            <p className="text-ink/60">Your stored memories, letters, and media files</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="border-b border-divider bg-white">
          <div className="max-w-wide mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
                <input
                  type="text"
                  placeholder="Search your vault..."
                  className="w-full pl-10 pr-4 py-2 border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                {(['all', 'letter', 'photo', 'video'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-navy-500 text-white'
                        : 'bg-paper text-ink/60 hover:bg-navy-50 hover:text-navy-500'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-wide mx-auto px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-500 rounded-full animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-lg border border-divider p-12 text-center">
              <FileText className="w-16 h-16 text-navy-500/20 mx-auto mb-4" strokeWidth={1} />
              <h3 className="font-serif text-2xl text-navy-500 mb-2">No Items Yet</h3>
              <p className="text-ink/60 mb-6">
                Start composing letters or uploading media to build your vault.
              </p>
              <button
                onClick={() => router.push('/v3/compose')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-navy-500 text-white rounded-lg hover:bg-navy-600 transition-colors"
              >
                Compose Your First Letter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item, index) => {
                const Icon = getIcon(item.type)
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-lg border border-divider p-6 hover:border-navy-500 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-2 bg-navy-50 rounded-lg">
                        <Icon className="w-5 h-5 text-navy-500" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-ink mb-1 line-clamp-1">{item.title}</h3>
                        <p className="text-xs text-ink/60">
                          {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {item.preview && (
                      <p className="text-sm text-ink/70 line-clamp-2">{item.preview}</p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PrivacyGate>
  )
}
