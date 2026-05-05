import { Fragment } from 'react';

/**
 * Loom (the Weft) — the central novel primitive.
 *
 * A horizontal woven band where each entry is a single "pick" — a
 * short coloured thread positioned at (year × month, lane). The lane
 * carries kind: letter / photo / voice / memory / milestone. Locked
 * entries (tied off) glow warm.
 *
 * The AI's only on-canvas voice is the "ligature" — a warm vertical
 * hairline drawn between two picks the AI has decided rhyme. Each
 * ligature also gets a subtle horizontal bridge across the gap so the
 * eye reads it as one device, not two pillars.
 *
 * An ambient horizontal glint ("shuttle") drifts left-to-right at 11s
 * per cycle if `ambientShuttle` is on — this is the AI threading,
 * silently, while the user is doing something else.
 */

export type LoomKind = 'letter' | 'photo' | 'voice' | 'memory' | 'milestone';

export interface LoomEntry {
  year: number;
  month?: number;        // 1–12
  lane: number;          // 0–4 typical
  kind: LoomKind;
  locked?: boolean;
  title?: string;
  width?: number;        // px override for the pick
}

export interface LoomLigature {
  from: number;          // index into entries
  to: number;            // index into entries
  show?: boolean;        // gates the reveal animation
}

interface LoomProps {
  entries: LoomEntry[];
  ligatures?: LoomLigature[];
  startYear: number;
  endYear: number;
  highlight?: number | null;
  onHover?: (i: number | null) => void;
  height?: number;
  showLigatures?: boolean;
  showYears?: boolean;
  ambientShuttle?: boolean;
}

function colorFor(kind: LoomKind): string {
  switch (kind) {
    case 'letter':    return 'var(--loom-bone)';
    case 'photo':     return 'rgba(244,236,216,0.78)';
    case 'voice':     return 'rgba(244,236,216,0.62)';
    case 'memory':    return 'rgba(244,236,216,0.50)';
    case 'milestone': return 'var(--loom-warm-bright)';
  }
}

export function Loom({
  entries,
  ligatures = [],
  startYear,
  endYear,
  highlight,
  onHover,
  height = 240,
  showLigatures = true,
  showYears = true,
  ambientShuttle = true,
}: LoomProps) {
  const span = endYear - startYear;
  const yearToX = (y: number) => ((y - startYear) / span) * 100;
  const laneToY = (lane: number) => 12 + (lane * (height - 36)) / 5;

  const yearTicks: number[] = [];
  for (let y = startYear; y <= endYear; y += 1) {
    if (y % 5 === 0) yearTicks.push(y);
  }

  return (
    <div className="loom-weft" style={{ width: '100%', height }}>
      <div className="loom-weft__warp" />

      {entries.map((e, i) => {
        const x = yearToX(e.year + (e.month ?? 0) / 12);
        const y = laneToY(e.lane);
        const w = e.width ?? (e.kind === 'milestone' ? 18 : 28);
        const lit = highlight === i;
        return (
          <div
            key={i}
            className={'loom-weft__pick' + (e.locked ? ' is-locked' : '')}
            onMouseEnter={() => onHover?.(i)}
            onMouseLeave={() => onHover?.(null)}
            style={{
              left: `${x}%`,
              top: `${y}px`,
              width: `${w}px`,
              background: e.locked ? undefined : colorFor(e.kind),
              opacity: lit ? 1 : e.kind === 'memory' ? 0.6 : 0.85,
              height: lit ? 4 : 2,
            }}
            title={e.title}
          />
        );
      })}

      {showLigatures &&
        ligatures.map((lg, i) => {
          const a = entries[lg.from];
          const b = entries[lg.to];
          if (!a || !b) return null;
          const ax = yearToX(a.year + (a.month ?? 0) / 12);
          const bx = yearToX(b.year + (b.month ?? 0) / 12);
          const ay = laneToY(a.lane);
          const by = laneToY(b.lane);
          const top = Math.min(ay, by);
          const h = Math.abs(by - ay) + 16;
          return (
            <Fragment key={i}>
              <div
                className={'loom-weft__ligature ' + (lg.show ? 'show' : '')}
                style={{ left: `${ax}%`, top: `${top - 8}px`, height: `${h}px` }}
              >
                <div className="dot" style={{ top: ay - top + 8 }} />
              </div>
              <div
                className={'loom-weft__ligature ' + (lg.show ? 'show' : '')}
                style={{ left: `${bx}%`, top: `${top - 8}px`, height: `${h}px` }}
              >
                <div className="dot" style={{ top: by - top + 8 }} />
              </div>
              <div
                className="loom-weft__bridge"
                style={{
                  left: `${Math.min(ax, bx)}%`,
                  width: `${Math.abs(bx - ax)}%`,
                  top: `${(ay + by) / 2}px`,
                  opacity: lg.show ? 0.85 : 0,
                }}
              />
            </Fragment>
          );
        })}

      {showYears &&
        yearTicks.map((y) => (
          <span key={y} className="loom-weft__year" style={{ left: `${yearToX(y)}%` }}>
            {y}
          </span>
        ))}

      {ambientShuttle ? <div className="loom-shuttle" style={{ top: '44%' }} /> : null}
    </div>
  );
}
