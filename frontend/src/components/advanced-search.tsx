'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Calendar, Tag, Heart, Star } from 'lucide-react';

interface SearchFilters {
  q: string;
  type?: string;
  emotionCategory?: string;
  minImportance?: number;
  maxImportance?: number;
  startDate?: string;
  endDate?: string;
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  thumbnailUrl?: string;
  emotionCategory?: string;
  importanceScore: number;
  sentimentScore?: number;
  keywords?: string[];
  aiSummary?: string;
  createdAt: string;
}

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResultClick: (itemId: string) => void;
}

export function AdvancedSearch({ isOpen, onClose, onResultClick }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({ q: '' });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('vault_token');
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`https://loom.vantax.co.za/api/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.items || []);
        setTotal(data.total || 0);
      } else {
        setError('Search failed. Please try again.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-4xl bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl border border-amber-500/30 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            data-testid="search-modal"
          >
            <div className="p-6 border-b border-amber-500/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-amber-400">Advanced Search</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-amber-400" />
                </button>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/50" />
                  <input
                    type="text"
                    value={filters.q}
                    onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                    onKeyPress={handleKeyPress}
                    placeholder="Search memories, keywords..."
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-amber-500/30 rounded-lg text-amber-100 placeholder-amber-400/30 focus:outline-none focus:border-amber-500/50"
                    data-testid="search-input"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 rounded-lg border transition-colors ${
                    showFilters
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                      : 'bg-black/50 border-amber-500/30 text-amber-400/70 hover:border-amber-500/50'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 grid grid-cols-2 gap-4 overflow-hidden"
                  >
                    <div>
                      <label className="block text-sm text-amber-400/70 mb-2">Type</label>
                      <select
                        value={filters.type || ''}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
                        className="w-full px-3 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-amber-100 focus:outline-none focus:border-amber-500/50"
                      >
                        <option value="">All Types</option>
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="document">Document</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-amber-400/70 mb-2">Emotion</label>
                      <select
                        value={filters.emotionCategory || ''}
                        onChange={(e) => setFilters({ ...filters, emotionCategory: e.target.value || undefined })}
                        className="w-full px-3 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-amber-100 focus:outline-none focus:border-amber-500/50"
                      >
                        <option value="">All Emotions</option>
                        <option value="joyful">Joyful</option>
                        <option value="happy">Happy</option>
                        <option value="neutral">Neutral</option>
                        <option value="sad">Sad</option>
                        <option value="distressed">Distressed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-amber-400/70 mb-2">Min Importance</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={filters.minImportance || ''}
                        onChange={(e) => setFilters({ ...filters, minImportance: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-amber-100 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-amber-400/70 mb-2">Max Importance</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={filters.maxImportance || ''}
                        onChange={(e) => setFilters({ ...filters, maxImportance: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-amber-100 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-amber-400/70 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={filters.startDate || ''}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                        className="w-full px-3 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-amber-100 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-amber-400/70 mb-2">End Date</label>
                      <input
                        type="date"
                        value={filters.endDate || ''}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                        className="w-full px-3 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-amber-100 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {total > 0 && (
                <p className="text-sm text-amber-400/70 mb-4">
                  Found {total} {total === 1 ? 'memory' : 'memories'}
                </p>
              )}

              <div className="space-y-3">
                {results.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-black/30 border border-amber-500/20 rounded-lg hover:border-amber-500/40 transition-colors cursor-pointer"
                    onClick={() => {
                      onResultClick(result.id);
                      onClose();
                    }}
                    data-testid={`search-result-${result.id}`}
                  >
                    <div className="flex items-start gap-4">
                      {result.thumbnailUrl && (
                        <img
                          src={result.thumbnailUrl}
                          alt={result.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-amber-100 mb-1">
                          {result.title || 'Untitled Memory'}
                        </h3>
                        {result.aiSummary && (
                          <p className="text-sm text-amber-400/60 mb-2">{result.aiSummary}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-amber-400/50">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {result.importanceScore}/10
                          </span>
                          {result.emotionCategory && (
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {result.emotionCategory}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(result.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {result.keywords && result.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {result.keywords.slice(0, 5).map((keyword, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-400"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {results.length === 0 && !loading && filters.q && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-amber-400/30 mx-auto mb-3" />
                    <p className="text-amber-400/50">No memories found matching your search</p>
                  </div>
                )}

                {results.length === 0 && !loading && !filters.q && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-amber-400/30 mx-auto mb-3" />
                    <p className="text-amber-400/50">Enter a search query to find memories</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
