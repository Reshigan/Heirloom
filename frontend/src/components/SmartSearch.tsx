

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, X, Clock, Users, Heart, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Memory = {
  id: string;
  title: string;
  description?: string;
  type: 'PHOTO' | 'VIDEO';
  fileUrl?: string;
  emotion?: string;
  recipients: { familyMember: { id: string; name: string } }[];
  createdAt: string;
};

interface SmartSearchProps {
  memories: Memory[];
  onSearchResults: (results: Memory[]) => void;
  onMemorySelect: (memory: Memory) => void;
}

const SUGGESTED_SEARCHES = [
  'Family vacations',
  'Birthday celebrations',
  'Wedding photos',
  'Travel memories',
  'Childhood moments',
  'Holiday gatherings',
  'Special occasions',
  'Happy moments',
  'Group photos',
  'Video clips'
];

const FILTER_CATEGORIES = {
  type: [
    { value: 'all', label: 'All Types' },
    { value: 'PHOTO', label: 'Photos' },
    { value: 'VIDEO', label: 'Videos' }
  ],
  emotion: [
    { value: 'all', label: 'All Emotions' },
    { value: 'joyful', label: 'Joyful' },
    { value: 'nostalgic', label: 'Nostalgic' },
    { value: 'grateful', label: 'Grateful' },
    { value: 'loving', label: 'Loving' },
    { value: 'bittersweet', label: 'Bittersweet' }
  ],
  shared: [
    { value: 'all', label: 'All Memories' },
    { value: 'shared', label: 'Shared Only' },
    { value: 'private', label: 'Private Only' }
  ],
  timeRange: [
    { value: 'all', label: 'All Time' },
    { value: 'year', label: 'This Year' },
    { value: 'month', label: 'This Month' },
    { value: 'week', label: 'This Week' }
  ]
};

export function SmartSearch({ memories, onSearchResults, onMemorySelect }: SmartSearchProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    emotion: 'all',
    shared: 'all',
    timeRange: 'all'
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // AI-powered search function
  const searchMemories = (query: string, currentFilters = filters) => {
    if (!query.trim()) {
      onSearchResults(memories);
      return;
    }

    setIsSearching(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const results = memories.filter(memory => {
        // Text search across title and description
        const textMatch = memory.title.toLowerCase().includes(query.toLowerCase()) ||
                         (memory.description?.toLowerCase().includes(query.toLowerCase()) ?? false);
        
        // Filter by type
        const typeMatch = currentFilters.type === 'all' || memory.type === currentFilters.type;
        
        // Filter by emotion
        const emotionMatch = currentFilters.emotion === 'all' || memory.emotion === currentFilters.emotion;
        
        // Filter by sharing status
        const sharedMatch = currentFilters.shared === 'all' || 
                           (currentFilters.shared === 'shared' && memory.recipients.length > 0) ||
                           (currentFilters.shared === 'private' && memory.recipients.length === 0);
        
        // Filter by time range
        const now = new Date();
        const memoryDate = new Date(memory.createdAt);
        let timeMatch = true;
        
        switch (currentFilters.timeRange) {
          case 'year':
            timeMatch = memoryDate.getFullYear() === now.getFullYear();
            break;
          case 'month':
            timeMatch = memoryDate.getMonth() === now.getMonth() && 
                       memoryDate.getFullYear() === now.getFullYear();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            timeMatch = memoryDate >= weekAgo;
            break;
        }
        
        return textMatch && typeMatch && emotionMatch && sharedMatch && timeMatch;
      });
      
      onSearchResults(results);
      setIsSearching(false);
      
      // Add to search history
      if (query.trim() && !searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev.slice(0, 4)]);
      }
    }, 300);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchMemories(query);
  };

  const handleFilterChange = (category: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [category]: value };
    setFilters(newFilters);
    searchMemories(searchQuery, newFilters);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearchResults(memories);
    setFilters({
      type: 'all',
      emotion: 'all',
      shared: 'all',
      timeRange: 'all'
    });
  };

  const analyzeSearchPattern = (query: string) => {
    const patterns = {
      family: ['family', 'mom', 'dad', 'parent', 'child', 'sibling', 'brother', 'sister'],
      travel: ['travel', 'vacation', 'trip', 'beach', 'mountains', 'city', 'flight'],
      celebration: ['birthday', 'wedding', 'anniversary', 'celebration', 'party'],
      nature: ['nature', 'sunset', 'sunrise', 'landscape', 'outdoor'],
      emotion: ['happy', 'joyful', 'sad', 'excited', 'love', 'grateful']
    };

    for (const [category, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => query.toLowerCase().includes(keyword))) {
        return category;
      }
    }
    return 'general';
  };

  const getSearchInsights = (query: string, results: Memory[]) => {
    const pattern = analyzeSearchPattern(query);
    const insights = {
      family: `Found ${results.length} family-related memories`,
      travel: `Discovered ${results.length} travel photos and videos`,
      celebration: `Located ${results.length} celebration moments`,
      nature: `Found ${results.length} nature memories`,
      emotion: `Discovered ${results.length} emotional moments`,
      general: `Found ${results.length} memories matching your search`
    };

    return insights[pattern as keyof typeof insights] || insights.general;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-paper/50" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('search.placeholder') || "Search memories by description, emotion, or people..."}
              className="flex-1 bg-transparent text-paper placeholder-paper/50 focus:outline-none"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={clearSearch}
                  className="text-paper/50 hover:text-paper transition-colors"
                >
                  <X size={16} />
                </motion.button>
              )}
            </AnimatePresence>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-gold/20 text-gold' : 'text-paper/50 hover:text-paper'
              }`}
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Search Insights */}
        <AnimatePresence>
          {searchQuery && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 glass rounded-xl p-3"
            >
              <div className="flex items-center gap-2 text-gold text-sm">
                <Sparkles size={14} />
                <span>{getSearchInsights(searchQuery, memories)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl p-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(FILTER_CATEGORIES).map(([category, options]) => (
                <div key={category}>
                  <label className="block text-sm text-paper/50 mb-2 capitalize">
                    {category}
                  </label>
                  <select
                    value={filters[category as keyof typeof filters]}
                    onChange={(e) => handleFilterChange(category as keyof typeof filters, e.target.value)}
                    className="w-full glass rounded-lg p-2 text-paper text-sm focus:outline-none"
                  >
                    {options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested Searches */}
      {!searchQuery && (
        <div className="space-y-3">
          <div className="text-paper/50 text-sm flex items-center gap-2">
            <Sparkles size={14} />
            {t('search.suggestedSearches') || 'Try these searches:'}
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_SEARCHES.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSearch(suggestion)}
                className="glass px-3 py-1.5 rounded-full text-sm text-paper/70 hover:text-paper transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && !searchQuery && (
        <div className="space-y-3">
          <div className="text-paper/50 text-sm flex items-center gap-2">
            <Clock size={14} />
            {t('search.recentSearches') || 'Recent searches:'}
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((historyItem) => (
              <button
                key={historyItem}
                onClick={() => handleSearch(historyItem)}
                className="glass px-3 py-1.5 rounded-full text-sm text-paper/70 hover:text-paper transition-colors flex items-center gap-2"
              >
                {historyItem}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchHistory(prev => prev.filter(item => item !== historyItem));
                  }}
                  className="text-paper/40 hover:text-paper"
                >
                  <X size={12} />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <div className="inline-flex items-center gap-2 text-paper/50">
              <div className="spinner w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              <span>{t('search.analyzing') || 'Analyzing memories with AI...'}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

