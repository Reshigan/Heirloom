'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search as SearchIcon, Filter } from 'lucide-react'
import { GoldCard, GoldCardHeader, GoldCardTitle, GoldCardContent, GoldInput, GoldButton } from '@/components/gold-card'
import { apiClient } from '@/lib/api-client'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    try {
      setLoading(true)
      setSearched(true)
      const data = await apiClient.search({ q: query })
      setResults(data.items || [])
    } catch (error) {
      console.error('Failed to search:', error)
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
          Search
        </h1>
        <p className="text-xl text-pearl/70">
          Find your memories
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8"
      >
        <GoldCard>
          <div className="flex gap-4">
            <div className="flex-1">
              <div onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}>
                <GoldInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search your memories..."
                />
              </div>
            </div>
            <GoldButton
              onClick={handleSearch}
              variant="primary"
              disabled={loading || !query.trim()}
            >
              <SearchIcon className="inline-block mr-2" size={20} />
              Search
            </GoldButton>
          </div>
        </GoldCard>
      </motion.div>

      {/* Results */}
      {loading ? (
        <GoldCard>
          <div className="text-center py-12 text-pearl/50">Searching...</div>
        </GoldCard>
      ) : searched && results.length === 0 ? (
        <GoldCard>
          <div className="text-center py-16">
            <SearchIcon className="mx-auto mb-4 text-gold-primary/50" size={64} />
            <p className="text-xl text-pearl/70 mb-2">No results found</p>
            <p className="text-sm text-pearl/50">
              Try different keywords or filters
            </p>
          </div>
        </GoldCard>
      ) : results.length > 0 ? (
        <div className="grid gap-6">
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
            >
              <GoldCard hover>
                <div className="flex items-center gap-4">
                  {result.thumbnailUrl && (
                    <img
                      src={result.thumbnailUrl}
                      alt={result.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-serif text-gold-primary mb-1">
                      {result.title || 'Untitled'}
                    </h3>
                    <p className="text-sm text-pearl/60">
                      {result.type} • {new Date(result.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </GoldCard>
            </motion.div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
