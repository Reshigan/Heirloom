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

  /** Project real lat/lng into a 0–100 equirectangular field. Each point carries a tiny
      serif label + mono year, placed beside the warm point as in the mockup. */
  const mapDots = memories
    .filter((m) => Number.isFinite(m.latitude) && Number.isFinite(m.longitude))
    .map((m) => {
      const x = ((m.longitude + 180) / 360) * 100;
      const y = ((90 - m.latitude) / 180) * 100;
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

  const placeCount = locations.length;
  const eyebrow = `${memories.length} ${memories.length === 1 ? 'PLACE WOVEN' : 'MEMORIES'}${
    placeCount ? ` · ${placeCount} ${placeCount === 1 ? 'PLACE' : 'PLACES'}` : ''
  }`;

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
            Carries the live count when memories exist; falls back to the place phrase. */}
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textAlign: 'center',
            margin: '12px 0 56px',
          }}
        >
          {memories.length ? eyebrow : 'WHERE IT HAPPENED'}
        </div>

        {/* Filter row — restrained, mono micro-labels (text affordances, not icons),
            centred beneath the eyebrow so the map field carries the composition. */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
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
                transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {f === 'all' ? 'All' : f === 'memory' ? 'Memories' : f + 's'}
            </button>
          ))}
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
            <h3
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
            </h3>
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
            {/* The Map — a vast dark field with a faint continent outline. Memories sit
                as restrained warm points placed by lat/lng, each tagged with a tiny serif
                label + mono year, exactly as the mockup reads. Select-on-click preserved.
                PRESERVED VERBATIM — this is the real spatial rendering. */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '5 / 4',
                background: 'transparent',
                marginBottom: 44,
                overflow: 'visible',
              }}
            >
              {/* Faint world outline — a coordinate field, never a styled map tile. */}
              <svg
                viewBox="0 0 100 80"
                preserveAspectRatio="none"
                aria-hidden
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              >
                {/* coastline-ish hairlines: schematic, low-contrast, no fills */}
                <g stroke="var(--rule)" strokeWidth="0.35" fill="none">
                  {/* North America */}
                  <path d="M3 22 L14 19 L22 24 L26 34 L20 42 L12 40 L8 31 Z" />
                  {/* South America */}
                  <path d="M24 50 L30 49 L33 58 L29 70 L25 64 Z" />
                  {/* Europe / Africa */}
                  <path d="M48 22 L56 21 L60 30 L58 46 L52 60 L47 50 L46 34 Z" />
                  {/* Asia */}
                  <path d="M60 18 L80 17 L92 24 L88 36 L74 38 L64 30 Z" />
                  {/* Australia */}
                  <path d="M82 52 L92 51 L94 60 L86 62 Z" />
                </g>
                {/* equator + a meridian, the faintest possible */}
                <g stroke="var(--rule)" strokeWidth="0.25" fill="none" opacity="0.5">
                  <line x1="0" y1="40" x2="100" y2="40" />
                  <line x1="50" y1="0" x2="50" y2="80" />
                </g>
              </svg>

              {/* Warm points — the only accent, glow restrained via box-shadow. */}
              {mapDots.map((d) => {
                const active = selectedMemory?.id === d.id;
                const year = new Date(d.memory.created_at).getFullYear();
                const right = d.x > 70; // flip label to the left near the edge
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedMemory(d.memory)}
                    aria-label={d.memory.title}
                    style={{
                      position: 'absolute',
                      left: `${d.x}%`,
                      top: `${(d.y / 94) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      padding: 0,
                      border: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: right ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: 6,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: active ? 7 : 5,
                        height: active ? 7 : 5,
                        flex: '0 0 auto',
                        borderRadius: '50%',
                        background: active ? 'var(--warm-bright)' : 'var(--warm)',
                        boxShadow: active
                          ? '0 0 14px rgba(176,122,74,0.7)'
                          : '0 0 8px rgba(176,122,74,0.45)',
                        transition: 'all 360ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    />
                    <span
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: right ? 'right' : 'left',
                        lineHeight: 1.1,
                      }}
                    >
                      <span
                        className="hl-mono"
                        style={{
                          fontSize: 9,
                          letterSpacing: '0.04em',
                          color: active ? 'var(--bone)' : 'var(--bone-dim)',
                          transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                        }}
                      >
                        {d.memory.location_name || d.memory.title}
                      </span>
                      <span
                        className="hl-mono"
                        style={{
                          fontSize: 9,
                          letterSpacing: '0.08em',
                          color: 'var(--bone-faint)',
                        }}
                      >
                        {Number.isFinite(year) ? year : ''}
                      </span>
                    </span>
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

            {/* The places ledger — every located place as a hairline-ruled EntryRow.
                Serif place name left; mono right cluster = memory count. Click-through
                preserved verbatim (selects the first memory at that place; href intact
                for middle-click / open-in-new). */}
            <SectionLabel>The places</SectionLabel>
            <div>
              {locations.map(({ name, count }) => {
                const firstMatch = memories.find((m) => (m.location_name || 'Unknown') === name) ?? null;
                const href = `/loom/read?location=${encodeURIComponent(name)}`;
                return (
                  <Link
                    key={name}
                    to={href}
                    onClick={(e) => {
                      if (firstMatch) {
                        e.preventDefault();
                        setSelectedMemory(firstMatch);
                      }
                    }}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <EntryRow
                      title={name}
                      year={`${count} ${count === 1 ? 'memory' : 'memories'}`}
                      onClick={() => {
                        if (firstMatch) setSelectedMemory(firstMatch);
                      }}
                    />
                  </Link>
                );
              })}
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
