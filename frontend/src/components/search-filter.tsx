'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, Tag, User, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { LuxuryInput, LuxuryButton, LuxuryLabel, LuxuryBadge } from '@/components/ui/luxury-components';

interface SearchFilterProps {
  onSearch?: (query: string) => void;
  onFilter?: (filters: FilterOptions) => void;
}

interface FilterOptions {
  dateRange: { start: string; end: string };
  tags: string[];
  people: string[];
  locations: string[];
  mediaType: string[];
}

export default function SearchFilter({ onSearch, onFilter }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: { start: '', end: '' },
    tags: [],
    people: [],
    locations: [],
    mediaType: []
  });

  const [tempTag, setTempTag] = useState('');
  const [tempPerson, setTempPerson] = useState('');
  const [tempLocation, setTempLocation] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const addToFilter = (type: keyof FilterOptions, value: string) => {
    if (type === 'dateRange') return;
    
    setFilters(prev => ({
      ...prev,
      [type]: [...(prev[type] as string[]), value]
    }));
  };

  const removeFromFilter = (type: keyof FilterOptions, value: string) => {
    if (type === 'dateRange') return;
    
    setFilters(prev => ({
      ...prev,
      [type]: (prev[type] as string[]).filter(item => item !== value)
    }));
  };

  const updateDateRange = (start: string, end: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end }
    }));
  };

  const toggleMediaType = (type: string) => {
    if (filters.mediaType.includes(type)) {
      removeFromFilter('mediaType', type);
    } else {
      addToFilter('mediaType', type);
    }
  };

  const clearAllFilters = () => {
    setFilters({
      dateRange: { start: '', end: '' },
      tags: [],
      people: [],
      locations: [],
      mediaType: []
    });
    setTempTag('');
    setTempPerson('');
    setTempLocation('');
  };

  const applyFilters = () => {
    if (onFilter) {
      onFilter(filters);
    }
    setShowFilters(false);
  };

  const mediaTypes = [
    { id: 'photo', label: 'Photos', icon: '📷' },
    { id: 'video', label: 'Videos', icon: '🎥' },
    { id: 'document', label: 'Documents', icon: '📄' },
    { id: 'audio', label: 'Audio', icon: '🎵' }
  ];

  const hasActiveFilters = 
    filters.dateRange.start || 
    filters.dateRange.end || 
    filters.tags.length > 0 || 
    filters.people.length > 0 || 
    filters.locations.length > 0 || 
    filters.mediaType.length > 0;

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold-400/60 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search memories, people, places..."
            className="w-full bg-charcoal/60 backdrop-blur-xl border border-gold-500/15 rounded-2xl pl-12 pr-16 py-4 text-pearl placeholder-pearl/40 focus:border-gold-500/30 focus:outline-none transition-all duration-300 font-light"
          />
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-300 ${
              showFilters || hasActiveFilters 
                ? 'bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-obsidian-900' 
                : 'text-gold-400/60 hover:text-gold-400 hover:bg-gold-500/10'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </motion.button>
        </div>
        
        {hasActiveFilters && (
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-2 right-16 w-3 h-3 bg-gold-400 rounded-full"
          />
        )}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="bg-charcoal/60 backdrop-blur-xl border border-gold-500/15 rounded-2xl p-6 mb-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-light text-pearl tracking-wide">Advanced Filters</h3>
              <motion.button
                onClick={() => setShowFilters(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-gold-400/60 hover:text-gold-400 transition-colors p-2 rounded-lg hover:bg-gold-500/10"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Range */}
            <div>
              <LuxuryLabel className="flex items-center mb-3">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </LuxuryLabel>
              <div className="space-y-3">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => updateDateRange(e.target.value, filters.dateRange.end)}
                  className="w-full bg-obsidian-900/60 border border-gold-500/20 rounded-lg px-3 py-2 text-pearl focus:border-gold-500/40 focus:outline-none transition-colors font-light"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => updateDateRange(filters.dateRange.start, e.target.value)}
                  className="w-full bg-obsidian-900/60 border border-gold-500/20 rounded-lg px-3 py-2 text-pearl focus:border-gold-500/40 focus:outline-none transition-colors font-light"
                />
              </div>
            </div>

            {/* Media Type */}
            <div>
              <LuxuryLabel className="flex items-center mb-3">
                <Filter className="w-4 h-4 mr-2" />
                Media Type
              </LuxuryLabel>
              <div className="grid grid-cols-2 gap-2">
                {mediaTypes.map((type) => (
                  <motion.button
                    key={type.id}
                    onClick={() => toggleMediaType(type.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-300 ${
                      filters.mediaType.includes(type.id)
                        ? 'bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-obsidian-900 border-gold-500/30'
                        : 'bg-obsidian-900/60 border-gold-500/20 text-pearl hover:border-gold-500/40'
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span className="text-sm font-light">{type.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <LuxuryLabel className="flex items-center mb-3">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </LuxuryLabel>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <LuxuryInput
                    type="text"
                    value={tempTag}
                    onChange={(e) => setTempTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && tempTag.trim()) {
                        addToFilter('tags', tempTag.trim());
                        setTempTag('');
                      }
                    }}
                    placeholder="Add tag..."
                    className="flex-1"
                  />
                  <LuxuryButton
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (tempTag.trim()) {
                        addToFilter('tags', tempTag.trim());
                        setTempTag('');
                      }
                    }}
                  >
                    Add
                  </LuxuryButton>
                </div>
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.tags.map((tag, index) => (
                      <LuxuryBadge
                        key={index}
                        variant="default"
                        onRemove={() => removeFromFilter('tags', tag)}
                      >
                        {tag}
                      </LuxuryBadge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* People */}
            <div>
              <LuxuryLabel className="flex items-center mb-3">
                <User className="w-4 h-4 mr-2" />
                People
              </LuxuryLabel>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <LuxuryInput
                    type="text"
                    value={tempPerson}
                    onChange={(e) => setTempPerson(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && tempPerson.trim()) {
                        addToFilter('people', tempPerson.trim());
                        setTempPerson('');
                      }
                    }}
                    placeholder="Add person..."
                    className="flex-1"
                  />
                  <LuxuryButton
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (tempPerson.trim()) {
                        addToFilter('people', tempPerson.trim());
                        setTempPerson('');
                      }
                    }}
                  >
                    Add
                  </LuxuryButton>
                </div>
                {filters.people.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.people.map((person, index) => (
                      <LuxuryBadge
                        key={index}
                        variant="default"
                        onRemove={() => removeFromFilter('people', person)}
                      >
                        {person}
                      </LuxuryBadge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gold-500/10">
            <LuxuryButton
              variant="ghost"
              onClick={clearAllFilters}
            >
              Clear All Filters
            </LuxuryButton>
            <div className="flex space-x-3">
              <LuxuryButton
                variant="secondary"
                onClick={() => setShowFilters(false)}
              >
                Cancel
              </LuxuryButton>
              <LuxuryButton
                variant="primary"
                onClick={applyFilters}
              >
                Apply Filters
              </LuxuryButton>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {hasActiveFilters && !showFilters && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-4"
        >
          {filters.dateRange.start && (
            <LuxuryBadge
              variant="default"
              onRemove={() => updateDateRange('', filters.dateRange.end)}
            >
              <Calendar className="w-3 h-3 mr-1" />
              From: {filters.dateRange.start}
            </LuxuryBadge>
          )}
          {filters.dateRange.end && (
            <LuxuryBadge
              variant="default"
              onRemove={() => updateDateRange(filters.dateRange.start, '')}
            >
              <Calendar className="w-3 h-3 mr-1" />
              To: {filters.dateRange.end}
            </LuxuryBadge>
          )}
          {filters.mediaType.map((type) => (
            <LuxuryBadge
              key={type}
              variant="default"
              onRemove={() => removeFromFilter('mediaType', type)}
            >
              {mediaTypes.find(mt => mt.id === type)?.label}
            </LuxuryBadge>
          ))}
          {[...filters.tags, ...filters.people, ...filters.locations].map((item, index) => (
            <LuxuryBadge
              key={index}
              variant="default"
              onRemove={() => {
                if (filters.tags.includes(item)) removeFromFilter('tags', item);
                if (filters.people.includes(item)) removeFromFilter('people', item);
                if (filters.locations.includes(item)) removeFromFilter('locations', item);
              }}
            >
              {item}
            </LuxuryBadge>
          ))}
        </motion.div>
      )}
    </div>
  );
}
