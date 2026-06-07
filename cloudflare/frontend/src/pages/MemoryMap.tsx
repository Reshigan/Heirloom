import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProgressHair } from '../components/ui/ProgressHair';
import { ClothShell } from '../loom/components/ClothShell';
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

/** Group memories by location_name, return sorted by count desc */
function groupByLocation(memories: MapMemory[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const m of memories) {
    const k = m.location_name || 'Unknown';
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function MemoryMap() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedMemory, setSelectedMemory] = useState<MapMemory | null>(null);

  const { data: mapData, isLoading } = useQuery({
    queryKey: ['memory-map', filter],
    queryFn: () =>
      memoriesApi
        .getMapMemories({ type: filter !== 'all' ? filter : undefined })
        .then((r) => r.data),
  });

  const memories: MapMemory[] = mapData?.memories || [];

  const typeLabels: Record<string, string> = {
    memory: 'Memory',
    voice: 'Voice',
    letter: 'Letter',
  };

  const locations = groupByLocation(memories);

  const backLink = (
    <Link
      to="/loom"
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.16em',
        color: 'var(--bone-faint)',
        textDecoration: 'none',
        textTransform: 'uppercase',
      }}
    >
      ← heirloom
    </Link>
  );

  return (
    <ClothShell topbarLeft={backLink} topbarCenter="memory map">
      {/* content wrapper */}
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '48px 32px 80px',
        }}
      >
        {/* H1 */}
        <h1
          className="hl-serif"
          style={{
            fontSize: 36,
            fontWeight: 300,
            color: 'var(--bone)',
            margin: '0 0 28px',
            lineHeight: 1.15,
          }}
        >
          Where the stories live.
        </h1>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                background: 'transparent',
                border: `1px solid ${filter === f ? 'var(--warm)' : 'var(--rule)'}`,
                borderRadius: 0,
                padding: '6px 14px',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: filter === f ? 'var(--warm)' : 'var(--bone-faint)',
                transition:
                  'color 180ms cubic-bezier(0.16,1,0.3,1), border-color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {f === 'all' ? 'All' : f === 'memory' ? 'Memories' : f + 's'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '64px 0', display: 'flex', justifyContent: 'center' }}>
            <ProgressHair label="loading…" width={200} />
          </div>
        ) : !memories.length ? (
          /* Empty state */
          <div
            style={{
              border: '1px solid var(--rule)',
              padding: '72px 32px',
              textAlign: 'center',
            }}
          >
            <p
              className="hl-serif"
              style={{ fontSize: 28, color: 'var(--warm)', marginBottom: 16 }}
            >
              ∞
            </p>
            <h3
              className="hl-serif"
              style={{
                fontSize: 22,
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'var(--bone)',
                margin: '0 0 12px',
              }}
            >
              No memories on the map yet.
            </h3>
            <p
              className="hl-serif"
              style={{
                fontSize: 15,
                color: 'var(--bone-dim)',
                margin: '0 auto 28px',
                maxWidth: 420,
              }}
            >
              Add locations to your memories, voice recordings, and letters to see them appear
              here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/loom/index')}
              className="hl-btn"
            >
              Add a memory
            </button>
          </div>
        ) : (
          <>
            {/* Section label */}
            <p
              className="hl-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
                margin: '0 0 24px',
              }}
            >
              memories by place
            </p>

            {/* Location list */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {locations.map(({ name, count }) => (
                <li
                  key={name}
                  style={{
                    borderBottom: '1px solid var(--rule)',
                    paddingTop: 14,
                    paddingBottom: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    className="hl-serif"
                    style={{ fontSize: 15, fontWeight: 300, color: 'var(--bone)' }}
                  >
                    {name}
                  </span>
                  <span
                    className="hl-mono"
                    style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.12em' }}
                  >
                    {count}
                  </span>
                </li>
              ))}
            </ul>

            {/* Detail sidebar (selected memory) — preserved from v1 */}
            {selectedMemory && (
              <div
                style={{
                  marginTop: 40,
                  border: '1px solid var(--rule)',
                  padding: '24px 28px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 12,
                  }}
                >
                  <span
                    className="hl-mono"
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'var(--warm)',
                    }}
                  >
                    {typeLabels[selectedMemory.type] || 'Memory'}
                  </span>
                  <span
                    className="hl-mono"
                    style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.04em' }}
                  >
                    {new Date(selectedMemory.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p
                  className="hl-serif"
                  style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone)', margin: '0 0 8px' }}
                >
                  {selectedMemory.title}
                </p>
                <p
                  className="hl-mono"
                  style={{ fontSize: 10, color: 'var(--bone-dim)', margin: 0, letterSpacing: '0.06em' }}
                >
                  {selectedMemory.location_name}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedMemory(null)}
                  style={{
                    marginTop: 16,
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    color: 'var(--bone-faint)',
                    textTransform: 'uppercase',
                  }}
                >
                  close
                </button>
              </div>
            )}

            {/* Hidden list (memory-level) for selectedMemory state mutations — API preserved */}
            <div style={{ display: 'none' }} aria-hidden>
              {memories.map((memory) => (
                <button
                  key={memory.id}
                  type="button"
                  onClick={() => setSelectedMemory(memory)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </ClothShell>
  );
}

export default MemoryMap;
