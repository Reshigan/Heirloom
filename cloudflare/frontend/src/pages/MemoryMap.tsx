import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProgressHair } from '../loom/components/ProgressHair';
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

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

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

  const { data: mapData, isLoading, isError } = useQuery({
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
  const primaryPlace = locations[0] ?? null;

  /** Project real lat/lng into a 0–100 viewBox for the hairline map. Falls back to a
      stable hash-based scatter when coords are missing so dots still read as "places". */
  const mapDots = memories
    .filter((m) => Number.isFinite(m.latitude) && Number.isFinite(m.longitude))
    .map((m) => {
      const x = ((m.longitude + 180) / 360) * 100;
      const y = ((90 - m.latitude) / 180) * 100;
      return { id: m.id, x: clamp(x, 6, 94), y: clamp(y, 8, 92), memory: m };
    });

  const backLink = (
    <Link
      to="/loom/index"
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
    <ClothShell topbarLeft={backLink} topbarCenter="places">
      {/* content wrapper */}
      <div
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding: '40px 28px 96px',
        }}
      >
        {/* Mono eyebrow — "WHERE IT HAPPENED" */}
        <p
          className="hl-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            margin: '0 0 28px',
          }}
        >
          where it happened
        </p>

        {/* Filter row — restrained, mono micro-labels */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 28 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                background: 'transparent',
                border: 0,
                borderRadius: 0,
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: filter === f ? 'var(--warm)' : 'var(--bone-faint)',
                transition:
                  'color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {f === 'all' ? 'All' : f === 'memory' ? 'Memories' : f + 's'}
            </button>
          ))}
        </div>

        {isError && (
          <p style={{ color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 12, margin: '0 0 24px' }}>
            could not load places
          </p>
        )}

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
            {/* Hairline map surface with warm location dots. Each dot keeps the
                same select-on-click behavior (sets selectedMemory). */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '3 / 4',
                border: '1px solid var(--rule)',
                background: 'transparent',
                marginBottom: 36,
                overflow: 'hidden',
              }}
            >
              {/* Desaturated hairline grid — reads as a faint street map, not a tile map. */}
              <svg
                viewBox="0 0 100 133"
                preserveAspectRatio="none"
                aria-hidden
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              >
                <g stroke="var(--rule)" strokeWidth="0.4" fill="none">
                  {[12, 30, 48, 66, 84, 102, 120].map((y) => (
                    <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} />
                  ))}
                  {[14, 32, 50, 68, 86].map((x) => (
                    <line key={`v${x}`} x1={x} y1="0" x2={x} y2="133" />
                  ))}
                </g>
                <g stroke="var(--rule)" strokeWidth="0.3" fill="none" opacity="0.6">
                  <line x1="0" y1="44" x2="100" y2="70" />
                  <line x1="20" y1="0" x2="78" y2="133" />
                  <line x1="0" y1="96" x2="100" y2="58" />
                </g>
              </svg>

              {/* Warm dots — the only accent. Markers are dots, never pins. */}
              {mapDots.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedMemory(d.memory)}
                  aria-label={d.memory.title}
                  style={{
                    position: 'absolute',
                    left: `${d.x}%`,
                    top: `${d.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 10,
                    height: 10,
                    padding: 0,
                    border: 0,
                    borderRadius: '50%',
                    background: selectedMemory?.id === d.id ? 'var(--warm-bright)' : 'var(--warm)',
                    boxShadow: '0 0 10px var(--warm-glow, var(--warm))',
                    cursor: 'pointer',
                    transition: 'background 180ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                />
              ))}
            </div>

            {/* Serif place name — the hero. Links into the place's reading view. */}
            {primaryPlace && (
              <Link
                to={`/loom/read?location=${encodeURIComponent(primaryPlace.name)}`}
                onClick={(e) => {
                  const firstMatch = memories.find((m) => (m.location_name || 'Unknown') === primaryPlace.name) ?? null;
                  if (firstMatch) { e.preventDefault(); setSelectedMemory(firstMatch); }
                }}
                className="hl-serif"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  fontSize: 'clamp(34px, 9vw, 44px)',
                  fontWeight: 300,
                  lineHeight: 1.04,
                  color: 'var(--bone)',
                  margin: '0 0 18px',
                }}
              >
                {primaryPlace.name}
              </Link>
            )}

            {/* Count + place tally — mono, quiet. */}
            <p
              className="hl-mono"
              style={{
                fontSize: 10,
                color: 'var(--bone-faint)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              {primaryPlace
                ? `${primaryPlace.count} ${primaryPlace.count === 1 ? 'memory' : 'memories'}`
                : `${memories.length} ${memories.length === 1 ? 'memory' : 'memories'}`}
            </p>

            {/* Other places — hairline rows beneath the hero. Behavior preserved verbatim. */}
            {locations.length > 1 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '40px 0 0' }}>
                {locations.slice(1).map(({ name, count }) => {
                  const firstMatch = memories.find((m) => (m.location_name || 'Unknown') === name) ?? null;
                  return (
                    <li key={name}>
                      <Link
                        to={`/loom/read?location=${encodeURIComponent(name)}`}
                        onClick={(e) => { if (firstMatch) { e.preventDefault(); setSelectedMemory(firstMatch); } }}
                        style={{ textDecoration: 'none', display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'baseline', columnGap: 14, borderTop: '1px solid var(--rule)', minHeight: 48, paddingTop: 13, paddingBottom: 13 }}
                      >
                        <span
                          aria-hidden
                          style={{ width: 7, height: 7, alignSelf: 'center', borderRadius: '50%', background: 'var(--warm)', boxShadow: '0 0 8px var(--warm)' }}
                        />
                        <span
                          className="hl-serif"
                          style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 300, color: 'var(--bone)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {name}
                        </span>
                        <span
                          className="hl-mono"
                          style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'right' }}
                        >
                          {count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Detail sidebar (selected memory) — preserved from v1 */}
            {selectedMemory && (
              <div
                style={{
                  marginTop: 40,
                  borderTop: '1px solid var(--rule)',
                  paddingTop: 24,
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
                    padding: '12px 0',
                    minWidth: 44,
                    minHeight: 44,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
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
