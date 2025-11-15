'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Sparkles,
  Users,
  MapPin,
  Calendar,
  Tag,
  Image as ImageIcon,
  Video,
  FileText,
  Mic,
  Filter,
  TrendingUp,
  Heart,
  Star,
  Zap,
  Brain,
  Eye,
  Grid3X3,
  List,
  SlidersHorizontal
} from 'lucide-react'
import { mockMemories, mockFamilyMembers, Memory } from '../data/mock-family-data'

interface SearchFilter {
  people: string[]
  locations: string[]
  dateRange: { start: string; end: string }
  types: string[]
  tags: string[]
  significance: string[]
}

const AICurator: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Memory[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [groupBy, setGroupBy] = useState<'none' | 'person' | 'location' | 'date' | 'theme'>('none')
  const [filters, setFilters] = useState<SearchFilter>({
    people: [],
    locations: [],
    dateRange: { start: '', end: '' },
    types: [],
    tags: [],
    significance: []
  })

  const suggestedSearches = [
    { query: 'family gatherings with grandma', icon: Users, color: 'from-gold-600 to-gold-500' },
    { query: 'photos from Boston', icon: MapPin, color: 'from-gold-600/90 to-gold-500/90' },
    { query: 'wedding celebrations', icon: Heart, color: 'from-gold-600/80 to-gold-500/80' },
    { query: 'childhood memories from the 1980s', icon: Calendar, color: 'from-gold-600/70 to-gold-500/70' },
    { query: 'milestone achievements', icon: Star, color: 'from-gold-600/60 to-gold-500/60' },
    { query: 'summer vacations at the beach', icon: MapPin, color: 'from-gold-600/50 to-gold-500/50' }
  ]

  const personGroups = [
    { name: 'William Hamilton', count: 15, avatar: 'WH' },
    { name: 'Margaret Hamilton', count: 18, avatar: 'MH' },
    { name: 'Robert Hamilton', count: 23, avatar: 'RH' },
    { name: 'Eleanor Hamilton', count: 21, avatar: 'EH' },
    { name: 'James Hamilton', count: 34, avatar: 'JH' },
    { name: 'Linda Hamilton', count: 29, avatar: 'LH' }
  ]

  const locationGroups = [
    { name: 'Boston, Massachusetts', count: 45, icon: MapPin },
    { name: 'San Francisco, California', count: 23, icon: MapPin },
    { name: 'Portland, Oregon', count: 18, icon: MapPin },
    { name: 'Chicago, Illinois', count: 12, icon: MapPin }
  ]

  const themeGroups = [
    { name: 'Family Gatherings', count: 38, icon: Users, color: 'text-gold-400' },
    { name: 'Celebrations', count: 29, icon: Star, color: 'text-gold-300' },
    { name: 'Travel & Adventures', count: 24, icon: MapPin, color: 'text-gold-400/80' },
    { name: 'Milestones', count: 19, icon: TrendingUp, color: 'text-gold-400/70' },
    { name: 'Everyday Moments', count: 52, icon: Heart, color: 'text-gold-400/60' }
  ]

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearching(true)
    
    setTimeout(() => {
      const results = mockMemories.filter(memory => {
        const searchLower = query.toLowerCase()
        return (
          memory.title.toLowerCase().includes(searchLower) ||
          memory.description.toLowerCase().includes(searchLower) ||
          memory.location.toLowerCase().includes(searchLower) ||
          memory.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )
      })
      
      setSearchResults(results.length > 0 ? results : mockMemories.slice(0, 8))
      setIsSearching(false)
    }, 800)
  }

  const handleSuggestedSearch = (query: string) => {
    handleSearch(query)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-charcoal text-pearl p-8">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-gold-600 to-gold-500 rounded-xl">
              <Brain className="w-6 h-6 text-obsidian-900" />
            </div>
            <div>
              <h1 className="text-3xl font-serif bg-gradient-to-r from-gold-400 to-gold-300 bg-clip-text text-transparent">
                AI Curator
              </h1>
              <p className="text-gold-400/70 mt-1">
                Intelligent search and organization for your memories
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder="Search memories with natural language... (e.g., 'photos of grandma in the red dress')"
                className="w-full pl-12 pr-32 py-4 bg-obsidian-800/60 border border-gold-500/20 rounded-xl text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-400/40 text-lg"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg transition-all ${
                    showFilters ? 'bg-gold-600 text-obsidian-900' : 'bg-obsidian-900 text-gold-400 hover:text-gold-300'
                  }`}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="px-6 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-semibold flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-obsidian-800/60 border border-gold-500/20 rounded-xl p-6 space-y-4"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gold-100 font-semibold mb-2 text-sm">Date Range</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="flex-1 px-3 py-2 bg-obsidian-900/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40 text-sm"
                        />
                        <input
                          type="date"
                          className="flex-1 px-3 py-2 bg-obsidian-900/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gold-100 font-semibold mb-2 text-sm">Content Type</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { type: 'photo', icon: ImageIcon, label: 'Photos' },
                          { type: 'video', icon: Video, label: 'Videos' },
                          { type: 'document', icon: FileText, label: 'Documents' },
                          { type: 'audio', icon: Mic, label: 'Audio' }
                        ].map(({ type, icon: Icon, label }) => (
                          <button
                            key={type}
                            className="px-3 py-1.5 bg-obsidian-900/60 border border-gold-500/20 rounded-lg text-gold-400 hover:border-gold-400 transition-all text-sm flex items-center gap-1.5"
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {!searchQuery && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gold-300 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Suggested Searches
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedSearches.map((search, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSuggestedSearch(search.query)}
                    className="flex items-center gap-3 p-4 bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-xl border border-gold-500/20 hover:border-gold-500/40 transition-all duration-300 text-left group"
                  >
                    <div className={`p-3 bg-gradient-to-r ${search.color} rounded-lg flex-shrink-0`}>
                      <search.icon className="w-5 h-5 text-obsidian-900" />
                    </div>
                    <span className="text-gold-300 group-hover:text-gold-100 transition-colors">
                      {search.query}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Browse by Person
                </h3>
                <div className="space-y-3">
                  {personGroups.map((person, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="w-full flex items-center justify-between p-3 bg-obsidian-900/50 rounded-lg hover:bg-obsidian-900/70 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-obsidian-900 font-bold text-sm">
                          {person.avatar}
                        </div>
                        <span className="text-gold-300 group-hover:text-gold-100 transition-colors">
                          {person.name}
                        </span>
                      </div>
                      <span className="text-gold-400/70 text-sm">{person.count}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Browse by Location
                </h3>
                <div className="space-y-3">
                  {locationGroups.map((location, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="w-full flex items-center justify-between p-3 bg-obsidian-900/50 rounded-lg hover:bg-obsidian-900/70 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <location.icon className="w-5 h-5 text-gold-400" />
                        <span className="text-gold-300 group-hover:text-gold-100 transition-colors text-sm">
                          {location.name}
                        </span>
                      </div>
                      <span className="text-gold-400/70 text-sm">{location.count}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Browse by Theme
                </h3>
                <div className="space-y-3">
                  {themeGroups.map((theme, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="w-full flex items-center justify-between p-3 bg-obsidian-900/50 rounded-lg hover:bg-obsidian-900/70 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <theme.icon className={`w-5 h-5 ${theme.color}`} />
                        <span className="text-gold-300 group-hover:text-gold-100 transition-colors">
                          {theme.name}
                        </span>
                      </div>
                      <span className="text-gold-400/70 text-sm">{theme.count}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {searchQuery && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gold-300">
                  {isSearching ? 'Searching...' : `Found ${searchResults.length} results`}
                </h3>
                <p className="text-gold-400/70 text-sm mt-1">
                  for "{searchQuery}"
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' ? 'bg-gold-600 text-obsidian-900' : 'bg-obsidian-800 text-gold-400'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' ? 'bg-gold-600 text-obsidian-900' : 'bg-obsidian-800 text-gold-400'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isSearching ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-gold-400 animate-pulse mx-auto mb-4" />
                  <p className="text-gold-400/70">AI is searching your memories...</p>
                </div>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-4 gap-6' : 'space-y-4'}>
                {searchResults.map((memory, index) => (
                  <motion.div
                    key={memory.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-xl overflow-hidden border border-gold-500/20 hover:border-gold-500/40 transition-all duration-300 group cursor-pointer ${
                      viewMode === 'list' ? 'flex gap-4' : ''
                    }`}
                  >
                    <div className={`relative ${viewMode === 'grid' ? 'h-48' : 'w-48 h-32'} overflow-hidden flex-shrink-0`}>
                      <img
                        src={memory.thumbnail}
                        alt={memory.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {memory.aiEnhanced && (
                        <div className="absolute top-2 right-2 p-1.5 bg-gold-600 rounded-lg">
                          <Sparkles className="w-3 h-3 text-obsidian-900" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1">
                      <h4 className="text-gold-100 font-semibold mb-1 group-hover:text-gold-300 transition-colors">
                        {memory.title}
                      </h4>
                      <p className="text-gold-400/70 text-sm mb-2 line-clamp-2">
                        {memory.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gold-400/60">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(memory.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{memory.location}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AICurator
