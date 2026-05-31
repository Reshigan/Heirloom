import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProgressHair } from '../components/ui/ProgressHair';
import { AppFrame } from '../loom/components/AppFrame';
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

const FILTERS = ['all', 'memory', 'voice', 'letter'] as const;
type Filter = typeof FILTERS[number];

export function MemoryMap() {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>('all');
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
    <AppFrame width="wide">
      {/* Header strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 40,
        }}
      >
        <div>
          <p className="loom-eyebrow" style={{ marginBottom: 12 }}>Memory Map</p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
          >
            Threads across the world.
          </h1>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 8 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                background: 'transparent',
                border: `1px solid ${filter === f ? 'var(--loom-rule-warm)' : 'var(--loom-rule)'}`,
                borderRadius: 1,
                padding: '6px 14px',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: filter === f ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
                transition: 'color 180ms cubic-bezier(0.16,1,0.3,1), border-color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {f === 'all' ? 'All' : f + 's'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '64px 0', display: 'flex', justifyContent: 'center' }}>
          <ProgressHair label="loading…" width={200} />
        </div>
      ) : !memories.length ? (
        <div style={{ border: '1px solid var(--loom-rule)', padding: '72px 32px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, color: 'var(--loom-warm)', marginBottom: 16 }}>∞</p>
          <h3 className="loom-serif" style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 12px' }}>
            No memories on the map yet.
          </h3>
          <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: '0 auto 28px', maxWidth: 420 }}>
            Add locations to your memories, voice recordings, and letters to see them appear here.
          </p>
          <button type="button" onClick={() => navigate('/memories')} className="loom-btn">
            Add a memory
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: 1,
            border: '1px solid var(--loom-rule)',
            minHeight: 560,
          }}
        >
          {/* Map canvas */}
          <div
            ref={mapContainerRef}
            style={{ position: 'relative', background: 'var(--loom-ink)', minHeight: 560 }}
          >
            {/* Mapbox GL JS container — key integration point */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: 32, color: 'var(--loom-warm)', marginBottom: 12 }}>∞</p>
                <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: '0 0 6px' }}>
                  {memories.length} {memories.length === 1 ? 'memory' : 'memories'} across{' '}
                  {new Set(memories.map((m) => m.location_name)).size} locations
                </p>
                <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.14em' }}>
                  Map view requires Mapbox API key
                </p>
              </div>
            </div>
          </div>

          {/* Memory list sidebar */}
          <div
            style={{
              borderLeft: '1px solid var(--loom-rule)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Sidebar header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--loom-rule)',
                position: 'sticky',
                top: 0,
                background: 'var(--loom-ink)',
                zIndex: 1,
              }}
            >
              <p className="loom-eyebrow">{memories.length} {memories.length === 1 ? 'memory' : 'memories'}</p>
            </div>

            {/* Scrollable list */}
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {memories.map((memory) => (
                <li key={memory.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedMemory(memory)}
                    style={{
                      width: '100%',
                      background: selectedMemory?.id === memory.id ? 'rgba(176,122,74,0.06)' : 'transparent',
                      border: 0,
                      borderBottom: '1px solid var(--loom-rule)',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'grid',
                      gap: 4,
                      transition: 'background 180ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    {/* Type + date rail */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span
                        className="loom-mono"
                        style={{
                          fontSize: 9,
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          color: selectedMemory?.id === memory.id ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
                        }}
                      >
                        {typeLabels[memory.type] || 'Memory'}
                      </span>
                      <span
                        className="loom-mono"
                        style={{ fontSize: 9, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}
                      >
                        {new Date(memory.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {/* Title */}
                    <p
                      className="loom-serif"
                      style={{
                        fontSize: 15,
                        fontWeight: 300,
                        color: selectedMemory?.id === memory.id ? 'var(--loom-warm)' : 'var(--loom-bone)',
                        margin: 0,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      {memory.title}
                    </p>
                    {/* Location */}
                    <p
                      className="loom-mono"
                      style={{ fontSize: 10, color: 'var(--loom-bone-dim)', margin: 0, letterSpacing: '0.06em' }}
                    >
                      {memory.location_name}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </AppFrame>
  );
}

export default MemoryMap;
