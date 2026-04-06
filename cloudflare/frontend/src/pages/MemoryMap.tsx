import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// MemoryMap page
import { useQuery } from '@tanstack/react-query';
import { Loader2, Image, Mic, Pen } from '../components/Icons';
import { Navigation } from '../components/Navigation';
import { EmptyState } from '../components/EmptyState';
import { memoriesApi } from '../services/api';

interface MapMemory {
  id: string;
  type: 'memory' | 'voice' | 'letter';
  title: string;
  latitude: number;
  longitude: number;
  location_name: string;
  created_at: string;
  thumbnail_url?: string;
}

export function MemoryMap() {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<string>('all');
  const [selectedMemory, setSelectedMemory] = useState<MapMemory | null>(null);

  const { data: mapData, isLoading } = useQuery({
    queryKey: ['memory-map', filter],
    queryFn: () => memoriesApi.getMapMemories({ type: filter !== 'all' ? filter : undefined }).then((r) => r.data),
  });

  const memories: MapMemory[] = mapData?.memories || [];

  const typeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    memory: Image,
    voice: Mic,
    letter: Pen,
  };

  const typeColors: Record<string, string> = {
    memory: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    voice: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    letter: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="eternal-bg">
        <div className="eternal-aura" />
        <div className="eternal-stars" />
        <div className="eternal-mist" />
      </div>
      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-32 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-paper mb-2">Memory Map</h1>
            <p className="text-paper/50 font-serif">Your memories, mapped across the world</p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {['all', 'memory', 'voice', 'letter'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === type
                    ? 'bg-gold/20 text-gold border border-gold/30'
                    : 'bg-paper/5 text-paper/40 border border-paper/10 hover:border-paper/20'
                }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="text-gold animate-spin" />
          </div>
        ) : !memories.length ? (
          <EmptyState
            icon={Image}
            title="No memories on the map yet"
            subtitle="Add locations to your memories, voice recordings, and letters to see them appear on your personal memory map."
            actionLabel="Add a Memory"
            onAction={() => navigate('/memories')}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Map placeholder - Mapbox would be integrated here */}
            <div className="lg:col-span-2 rounded-2xl glass border border-paper/10 overflow-hidden" style={{ minHeight: '500px' }}>
              <div ref={mapContainerRef} className="w-full h-full min-h-[500px] relative">
                {/* Mapbox GL JS container */}
                <div className="absolute inset-0 flex items-center justify-center bg-void/50">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                      <Image size={28} className="text-gold/60" />
                    </div>
                    <p className="text-paper/40 text-sm">
                      {memories.length} memories across {new Set(memories.map((m) => m.location_name)).size} locations
                    </p>
                    <p className="text-paper/30 text-xs mt-1">Map view requires Mapbox API key</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Memory list sidebar */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              <h3 className="font-serif text-lg text-paper mb-3 sticky top-0 bg-void/80 backdrop-blur-sm py-2">
                {memories.length} Memories
              </h3>
              {memories.map((memory) => {
                const Icon = typeIcons[memory.type] || Image;
                return (
                  <button
                    key={memory.id}
                    onClick={() => setSelectedMemory(memory)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedMemory?.id === memory.id
                        ? 'border-gold/30 bg-gold/5'
                        : 'border-paper/10 bg-paper/5 hover:border-paper/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${typeColors[memory.type]}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-paper/80 text-sm font-medium truncate">{memory.title}</p>
                        <p className="text-paper/40 text-xs mt-0.5">{memory.location_name}</p>
                        <p className="text-paper/30 text-xs mt-1">
                          {new Date(memory.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default MemoryMap;
