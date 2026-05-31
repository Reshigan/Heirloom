import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// MemoryMap page
import { useQuery } from '@tanstack/react-query';
import { ProgressHair } from '../components/ui/ProgressHair';
import { Navigation } from '../components/Navigation';
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

  const typeLabels: Record<string, string> = {
    memory: 'Memory',
    voice: 'Voice',
    letter: 'Letter',
  };

  return (
    <div className="min-h-screen bg-void text-paper antialiased">
      <Navigation />

      <main className="px-6 md:px-12 pt-24 pb-32 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-3">Memory Map</p>
            <h1 className="font-body font-light text-3xl md:text-4xl text-paper tracking-[-0.014em]">Your memories, mapped across the world</h1>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {['all', 'memory', 'voice', 'letter'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-[2px] text-xs font-mono uppercase tracking-[0.12em] border transition-colors ${
                  filter === type
                    ? 'bg-void-surface text-gold border-gold-40'
                    : 'bg-void-surface text-paper-70 border-paper-15 hover:text-paper'
                }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <ProgressHair label="loading…" width={180} />
          </div>
        ) : !memories.length ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <span className="font-body text-4xl text-gold block mb-7" aria-hidden>∞</span>
            <h3 className="font-body font-light text-2xl text-paper mb-3 tracking-[-0.014em]">No memories on the map yet</h3>
            <p className="text-paper-70 max-w-md leading-relaxed mb-8">
              Add locations to your memories, voice recordings, and letters to see them appear on your personal memory map.
            </p>
            <button onClick={() => navigate('/memories')} className="btn btn-primary">
              Add a memory <span aria-hidden>→</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Map placeholder - Mapbox would be integrated here */}
            <div className="lg:col-span-2 bg-void-surface border border-paper-15 overflow-hidden rounded-[2px]" style={{ minHeight: '500px' }}>
              <div ref={mapContainerRef} className="w-full h-full min-h-[500px] relative">
                {/* Mapbox GL JS container */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="font-body text-4xl text-gold block mb-4" aria-hidden>∞</span>
                    <p className="text-paper-70 text-sm">
                      {memories.length} memories across {new Set(memories.map((m) => m.location_name)).size} locations
                    </p>
                    <p className="text-paper-50 text-xs mt-1">Map view requires Mapbox API key</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Memory list sidebar */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              <h3 className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-3 sticky top-0 bg-void py-2">
                {memories.length} Memories
              </h3>
              {memories.map((memory) => {
                return (
                  <button
                    key={memory.id}
                    onClick={() => setSelectedMemory(memory)}
                    className={`w-full text-left p-4 rounded-[2px] border transition-colors ${
                      selectedMemory?.id === memory.id
                        ? 'border-gold-40 bg-void-surface'
                        : 'border-paper-15 bg-void-surface hover:border-gold-40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-[2px] flex items-center justify-center flex-shrink-0 border border-paper-15">
                        <span className="font-mono text-[0.6rem] uppercase text-gold" aria-hidden>{(typeLabels[memory.type] || 'M').charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-paper text-sm font-medium truncate">{memory.title}</p>
                        <p className="text-paper-70 text-xs mt-0.5">{memory.location_name}</p>
                        <p className="text-paper-50 text-xs mt-1">
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
