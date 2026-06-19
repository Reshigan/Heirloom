import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProgressHair } from '../loom/components/ProgressHair';
import { ClothShell } from '../loom/components/ClothShell';
import { EntryRow, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
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

  /** Project real lat/lng onto the woven worldmap. The base PNG is an equirectangular-ish
      plate; x = (lon+180)/360, y = (82-lat)/138 aligns the warm dots to its landmasses. */
  const mapDots = memories
    .filter((m) => Number.isFinite(m.latitude) && Number.isFinite(m.longitude))
    .map((m) => {
      const x = ((m.longitude + 180) / 360) * 100;
      const y = ((82 - m.latitude) / 138) * 100;
      return { id: m.id, x: clamp(x, 4, 96), y: clamp(y, 6, 94), memory: m };
    });

  /** Year span across all placed memories — drives the quiet mono year-scale legend. */
  const years = memories
    .map((m) => new Date(m.created_at).getFullYear())
    .filter((y) => Number.isFinite(y));
  const minYear = years.length ? Math.min(...years) : null;
  const maxYear = years.length ? Math.max(...years) : null;

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
        {/* Quiet mono eyebrow — the only line above the map field, per the reference.
            The standing phrase in both states; never a count. */}
        <div
          role="heading"
          aria-level={1}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textAlign: 'center',
            margin: '12px 0 12px',
          }}
        >
          {'WHERE IT HAPPENED'}
        </div>

        {/* Second eyebrow subline — the standing interaction hint, quietest mono. */}
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'var(--muted-3)',
            textAlign: 'center',
            margin: '0 0 56px',
          }}
        >
          {'DRAG TO EXPLORE · TAP A PLACE'}
        </div>

        {isError && (
          <p style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 24px' }}>
            could not load places
          </p>
        )}

        {isLoading ? (
          <div style={{ padding: '64px 0', display: 'flex', justifyContent: 'center' }}>
            <ProgressHair label="loading…" width={200} />
          </div>
        ) : !memories.length ? (
          /* Empty state — centered serif-italic line + a quiet prompt */
          <div
            style={{
              padding: '72px 8px',
              textAlign: 'center',
            }}
          >
            <p
              className="hl-serif"
              style={{
                fontSize: 22,
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'var(--bone-dim)',
                margin: '0 0 14px',
              }}
            >
              No memories on the map yet.
            </p>
            <p
              className="hl-serif"
              style={{
                fontSize: 15,
                fontStyle: 'italic',
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
              style={{
                background: 'transparent',
                border: 0,
                padding: '12px 0',
                minHeight: 44,
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
              }}
            >
              Add a memory →
            </button>
          </div>
        ) : (
          <>
            {/* The Map — a vast dark field over the woven worldmap plate. Memories sit
                as restrained warm glow points placed by lat/lng. Select-on-click preserved. */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1120 / 620',
                background: 'transparent',
                marginBottom: 44,
                overflow: 'visible',
              }}
            >
              {/* Woven worldmap — the base coordinate plate, quiet behind the points. */}
              <picture style={{ display: 'contents' }}>
                <source type="image/avif" srcSet="/woven/worldmap.avif" />
                <source type="image/webp" srcSet="/woven/worldmap.webp" />
                <img
                  src="/woven/worldmap.png"
                  alt=""
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: 0.32,
                    pointerEvents: 'none',
                  }}
                />
              </picture>

              {/* Bone hairline point markers — copper reserved for a ≤1px active stroke only. */}
              {mapDots.map((d) => {
                const active = selectedMemory?.id === d.id;
                return (
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
                      padding: 0,
                      border: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                      lineHeight: 0,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: 'block',
                        width: active ? 4 : 3,
                        height: active ? 4 : 3,
                        borderRadius: 0,
                        background: 'var(--bone-faint)',
                        border: active ? '1px solid var(--warm)' : '1px solid var(--rule)',
                        transition: 'width 360ms var(--ease), height 360ms var(--ease), border-color 360ms var(--ease)',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Quiet year-scale legend — mono, at the edge of the field. */}
            {minYear !== null && maxYear !== null && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  borderTop: '1px solid var(--rule)',
                  paddingTop: 10,
                  marginBottom: 24,
                }}
              >
                <span
                  className="hl-mono"
                  style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}
                >
                  {minYear}
                </span>
                <span
                  className="hl-mono"
                  style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}
                >
                  the years
                </span>
                <span
                  className="hl-mono"
                  style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}
                >
                  {maxYear}
                </span>
              </div>
            )}

            {/* Filter row — restrained, mono micro-labels (text affordances, not icons),
                centred above the places ledger so the eyebrow→map band stays empty.
                Only renders when memories exist. */}
            {memories.length > 0 && (
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    style={{
                      background: 'transparent',
                      border: 0,
                      borderRadius: 0,
                      padding: '4px 0',
                      minHeight: 44,
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                      fontSize: 9,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: filter === f ? 'var(--warm)' : 'var(--bone-faint)',
                      transition: 'color 180ms var(--ease)',
                    }}
                  >
                    {f === 'all' ? 'All' : f === 'memory' ? 'Memories' : f + 's'}
                  </button>
                ))}
              </div>
            )}

            {/* The places ledger — every located place as a hairline-ruled EntryRow.
                Serif place name left; mono right cluster = memory count. Each row is a
                single interactive element (EntryRow's own <button>, accessible name = the
                place); clicking selects the first memory at that place in-place. */}
            <SectionLabel>The places</SectionLabel>
            <div>
              {locations.map(({ name, count }) => {
                const firstMatch = memories.find((m) => (m.location_name || 'Unknown') === name) ?? null;
                return (
                  <EntryRow
                    key={name}
                    title={name}
                    year={`${count} ${count === 1 ? 'memory' : 'memories'}`}
                    onClick={() => {
                      if (firstMatch) setSelectedMemory(firstMatch);
                    }}
                  />
                );
              })}
            </div>

            {/* Footer tally — places + mapped memories, quietest mono, computed from data. */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 10,
                borderTop: '1px solid var(--hairline)',
                fontFamily: 'var(--mono)',
                fontSize: 9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--muted-3)',
                textAlign: 'center',
              }}
            >
              {`${locations.length} ${locations.length === 1 ? 'PLACE' : 'PLACES'} · ${mapDots.length} ${mapDots.length === 1 ? 'MEMORY' : 'MEMORIES'} MAPPED`}
            </div>

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

            {/* The ∞ wax seal — rests warm at the foot of the ledger. */}
            <div style={{ marginTop: 64 }}>
              <WaxSeal />
            </div>
          </>
        )}
      </div>
    </ClothShell>
  );
}

export default MemoryMap;
