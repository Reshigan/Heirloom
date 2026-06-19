import { useState } from 'react';
import { Loom, type LoomEntry } from './Loom';

/**
 * WeftCentury — the "century" view-mode of the tapestry home.
 *
 * The archive compressed to a century scale starting from the user's
 * birth year, so a lifetime of threads reads as a single dense band.
 * Hover a thread to see its details; click to open it.
 */

export interface WeftCenturyProps {
  entries: LoomEntry[];
  kin: Array<{ name: string; born: number; died: number | null; you: boolean }>;
  userBornYear?: number;
  onSelectEntry?: (entry: LoomEntry) => void;
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return ''; }
}

export function WeftCentury({ entries, kin, userBornYear, onSelectEntry }: WeftCenturyProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Century window: anchored to the user's birth year (or fallback), spanning
  // ~120 yrs — but the window must be widened to enclose every real marker, or
  // older relatives / out-of-range entries project to a negative (or >100%)
  // left% and clip off the edge, unreachable. Loom.yearToX has no internal
  // clamp, so we clamp the window to the data here before projecting.
  const youKin = kin.find((k) => k.you);
  const anchor = userBornYear ?? youKin?.born ?? new Date().getFullYear() - 50;

  // Every year a marker will project at: kin births + entry years (with the
  // same month fraction the Loom adds, so an end-of-window entry can't spill
  // past 100%). Guard against undefined / NaN before they poison min/max.
  const markerYears = [
    ...kin.map((k) => k.born),
    ...entries.map((e) => e.year + (e.month ?? 0) / 12),
  ].filter((y): y is number => typeof y === 'number' && Number.isFinite(y));

  const C_START = Math.floor(Math.min(anchor, ...markerYears));
  const C_END = Math.ceil(Math.max(anchor + 120, ...markerYears));

  // kin birth markers become faint milestone picks on the compressed cloth.
  const kinEntries: LoomEntry[] = kin.map((k, i) => ({
    year: k.born,
    lane: i % 5,
    kind: k.you ? ('milestone' as const) : ('memory' as const),
    title: k.name,
  }));

  const combinedEntries: LoomEntry[] = [...kinEntries, ...entries];
  const WOVEN_COUNT = combinedEntries.filter((e) => !e.locked).length;

  const generations = kin.map((k, i) => ({
    gen: i,
    names: k.name,
    label: k.you ? 'you' : `gen ${i}`,
    align: (i === 0 ? 'left' : i === kin.length - 1 ? 'right' : 'center') as 'left' | 'center' | 'right',
    warm: k.you,
  }));

  // Resolve hovered entry (skip pure kin-marker entries that have no id).
  const rawHovered = hoveredIdx != null ? combinedEntries[hoveredIdx] : null;
  const hoveredEntry = rawHovered?.id ? rawHovered : null;

  const handleClick = (i: number) => {
    const e = combinedEntries[i];
    if (e?.id && onSelectEntry) onSelectEntry(e);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '40px 80px 0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="loom-eyebrow"
        style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}
      >
        <span>
          <span style={{ color: 'var(--warm)' }}>·</span> century view &nbsp;·&nbsp; {C_START} — {C_END} &nbsp;·&nbsp; {C_END - C_START} yrs
        </span>
        <span className="loom-mono" style={{ fontSize: 9, letterSpacing: '0.18em' }}>
          entries sealed past a lifetime become visible here
        </span>
      </div>

      {/* hover detail strip — shows above the cloth when a real entry is hovered */}
      <div
        style={{
          height: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 8,
          opacity: hoveredEntry ? 1 : 0,
          transition: 'opacity 180ms var(--ease)',
          pointerEvents: hoveredEntry ? 'auto' : 'none',
        }}
      >
        {hoveredEntry && (
          <>
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: 18,
                ...(hoveredEntry.kind === 'milestone'
                  ? { background: 'transparent', borderLeft: '1px solid var(--warm)' }
                  : { background: `var(--dye-${hoveredEntry.dye ?? (hoveredEntry.kind === 'letter' ? 'walnut' : hoveredEntry.kind === 'voice' ? 'woad' : 'indigo')})` }),
                flexShrink: 0,
              }}
            />
            <span
              className="loom-serif"
              style={{
                fontSize: 15,
                fontStyle: 'italic',
                color: 'var(--bone)',
                fontWeight: 400,
              }}
            >
              {hoveredEntry.title ?? '—'}
            </span>
            <span className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-dim)', letterSpacing: '0.12em' }}>
              {hoveredEntry.kind} · {fmtDate(hoveredEntry.date) || hoveredEntry.year}
            </span>
            {onSelectEntry && (
              <button
                type="button"
                onClick={() => onSelectEntry(hoveredEntry)}
                className="loom-mono"
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 10,
                  color: 'var(--warm)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginLeft: 4,
                }}
              >
                open →
              </button>
            )}
          </>
        )}
      </div>

      {/* the compressed cloth */}
      <div style={{ position: 'relative', marginTop: 4 }}>
        <Loom
          entries={combinedEntries}
          startYear={C_START}
          endYear={C_END}
          height={360}
          showLigatures={false}
          ambientShuttle={false}
          nowYear={new Date().getFullYear()}
          appendCount={WOVEN_COUNT}
          onHover={setHoveredIdx}
          onClick={handleClick}
        />
      </div>

      {/* generations bar */}
      <div
        style={{
          marginTop: 64,
          paddingTop: 18,
          borderTop: '1px solid var(--rule)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 40,
        }}
      >
        {generations.length === 0 ? (
          <div
            className="loom-mono"
            style={{
              fontSize: 10,
              color: 'var(--bone-faint)',
              letterSpacing: '0.18em',
              fontStyle: 'italic',
            }}
          >
            invite family to see their threads here
          </div>
        ) : (
          generations.map((g) => (
            <div key={g.gen} style={{ textAlign: g.align }}>
              <div
                className="loom-serif"
                style={{
                  fontSize: 15,
                  color: g.warm ? 'var(--warm)' : 'var(--bone-dim)',
                  fontStyle: g.warm ? 'italic' : 'normal',
                  lineHeight: 1.4,
                }}
              >
                {g.names}
              </div>
              <div
                className="loom-mono"
                style={{
                  fontSize: 9,
                  color: 'var(--bone-faint)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginTop: 4,
                }}
              >
                {g.label}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
