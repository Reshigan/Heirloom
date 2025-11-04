'use client';

import React, { useState } from 'react';
import { Search, Filter, Calendar, Tag, User, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { LuxCard, LuxButton } from './lux';

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
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold/60 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search memories, people, places..."
            className="w-full bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl pl-12 pr-16 py-4 text-gold placeholder-gold/50 focus:border-gold focus:outline-none transition-all duration-300"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-300 ${
              showFilters || hasActiveFilters 
                ? 'bg-secondary-gradient text-black' 
                : 'text-gold/60 hover:text-gold hover:bg-gold/10'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
        
        {hasActiveFilters && (
          <div className="absolute top-2 right-16 w-3 h-3 bg-gold rounded-full animate-pulse"></div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl p-6 mb-4 animate-slideDown">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display font-bold text-gold">Advanced Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gold/60 hover:text-gold transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Range */}
            <div>
              <label className="flex items-center text-gold font-medium mb-3">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </label>
              <div className="space-y-3">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => updateDateRange(e.target.value, filters.dateRange.end)}
                  className="w-full bg-black-light border border-gold/30 rounded-lg px-3 py-2 text-gold focus:border-gold focus:outline-none transition-colors"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => updateDateRange(filters.dateRange.start, e.target.value)}
                  className="w-full bg-black-light border border-gold/30 rounded-lg px-3 py-2 text-gold focus:border-gold focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Media Type */}
            <div>
              <label className="flex items-center text-gold font-medium mb-3">
                <Filter className="w-4 h-4 mr-2" />
                Media Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {mediaTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleMediaType(type.id)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-300 ${
                      filters.mediaType.includes(type.id)
                        ? 'bg-secondary-gradient text-black border-gold'
                        : 'bg-black-light border-gold/30 text-gold hover:border-gold'
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center text-gold font-medium mb-3">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
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
                    className="flex-1 bg-black-light border border-gold/30 rounded-lg px-3 py-2 text-gold placeholder-gold/50 focus:border-gold focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => {
                      if (tempTag.trim()) {
                        addToFilter('tags', tempTag.trim());
                        setTempTag('');
                      }
                    }}
                    className="bg-secondary-gradient text-black px-4 py-2 rounded-lg hover:scale-105 transition-transform"
                  >
                    Add
                  </button>
                </div>
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gold/20 text-gold px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => removeFromFilter('tags', tag)}
                          className="text-gold/60 hover:text-gold"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* People */}
            <div>
              <label className="flex items-center text-gold font-medium mb-3">
                <User className="w-4 h-4 mr-2" />
                People
              </label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
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
                    className="flex-1 bg-black-light border border-gold/30 rounded-lg px-3 py-2 text-gold placeholder-gold/50 focus:border-gold focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => {
                      if (tempPerson.trim()) {
                        addToFilter('people', tempPerson.trim());
                        setTempPerson('');
                      }
                    }}
                    className="bg-secondary-gradient text-black px-4 py-2 rounded-lg hover:scale-105 transition-transform"
                  >
                    Add
                  </button>
                </div>
                {filters.people.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.people.map((person, index) => (
                      <span
                        key={index}
                        className="bg-gold/20 text-gold px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                      >
                        <span>{person}</span>
                        <button
                          onClick={() => removeFromFilter('people', person)}
                          className="text-gold/60 hover:text-gold"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gold/20">
            <button
              onClick={clearAllFilters}
              className="text-gold/60 hover:text-gold transition-colors"
            >
              Clear All Filters
            </button>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 border border-gold/30 text-gold rounded-lg hover:border-gold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyFilters}
                className="px-6 py-2 bg-secondary-gradient text-black rounded-lg hover:scale-105 transition-transform font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.dateRange.start && (
            <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-sm flex items-center space-x-2">
              <Calendar className="w-3 h-3" />
              <span>From: {filters.dateRange.start}</span>
              <button
                onClick={() => updateDateRange('', filters.dateRange.end)}
                className="text-gold/60 hover:text-gold"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.dateRange.end && (
            <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-sm flex items-center space-x-2">
              <Calendar className="w-3 h-3" />
              <span>To: {filters.dateRange.end}</span>
              <button
                onClick={() => updateDateRange(filters.dateRange.start, '')}
                className="text-gold/60 hover:text-gold"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.mediaType.map((type) => (
            <span key={type} className="bg-gold/20 text-gold px-3 py-1 rounded-full text-sm flex items-center space-x-2">
              <span>{mediaTypes.find(mt => mt.id === type)?.label}</span>
              <button
                onClick={() => removeFromFilter('mediaType', type)}
                className="text-gold/60 hover:text-gold"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {[...filters.tags, ...filters.people, ...filters.locations].map((item, index) => (
            <span key={index} className="bg-gold/20 text-gold px-3 py-1 rounded-full text-sm flex items-center space-x-2">
              <span>{item}</span>
              <button
                onClick={() => {
                  if (filters.tags.includes(item)) removeFromFilter('tags', item);
                  if (filters.people.includes(item)) removeFromFilter('people', item);
                  if (filters.locations.includes(item)) removeFromFilter('locations', item);
                }}
                className="text-gold/60 hover:text-gold"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
