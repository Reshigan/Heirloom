import { Fragment } from 'react';
import { type Dye } from '../dye';

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

/**
 * The 10-stop natural-dye palette is the ONLY sanctioned chroma in the
 * app, and ONLY inside woven threads. Each entry's weft pick is dyed by
 * its kind (or by an explicit `dye` override) so the cloth reads as
 * coloured cloth, not bone-on-ink hairlines. Tokens live in globals.css.
 */
export type LoomDye = Dye;

export interface LoomEntry {
  id?: string;           // entity id, so a tapped thread can open its room
  year: number;
  month?: number;        // 1–12
  lane: number;          // 0–4 typical
  kind: LoomKind;
  locked?: boolean;      // sealed / tied off — renders as a tethered ∞ peg
  title?: string;
  date?: string;         // full ISO lived-date, for the highlight readout
  recipient?: string;    // who it's addressed to (letters/voice), for the readout
  width?: number;        // px override for the pick
  dye?: Dye;             // explicit dye override; otherwise keyed off kind
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
  onClick?: (i: number) => void;
  height?: number;
  showLigatures?: boolean;
  showYears?: boolean;
  ambientShuttle?: boolean;
  /** warm "where we are now" hairline at this year (e.g. the present). */
  nowYear?: number;
  /**
   * The always-visible append-only count (invariant B). When supplied,
   * the woven-entry count rides the selvedge as a mono label. Pass the
   * real count of woven (un-sealed) entries.
   */
  appendCount?: number;
}

/**
 * Dye a weft pick by kind. The cloth carries dye chroma (the palette's
 * only sanctioned home); milestones carry a neutral cream pick. An explicit `entry.dye`
 * overrides the kind default.
 */
const DYE_FOR_KIND: Record<LoomKind, string> = {
  letter:    'var(--dye-walnut)',
  photo:     'var(--dye-saffron)',
  voice:     'var(--dye-woad)',
  memory:    'var(--dye-indigo)',
  milestone: 'var(--bone-dim)',
};

// Single source of truth for an entry's dye chroma — used by the cloth itself
// AND by the century-view hover swatch, so the swatch can never drift from the
// thread it points at (e.g. paint a photo saffron on the cloth but indigo in
// the swatch). An explicit `entry.dye` overrides the kind default.
export function colorFor(e: LoomEntry): string {
  if (e.dye) return `var(--dye-${e.dye})`;
  return DYE_FOR_KIND[e.kind];
}

/** Deterministic 0..1 jitter so the same thread renders identically. */
function jitter(seed: number): number {
  const t = Math.sin(seed * 12.9898) * 43758.5453;
  return t - Math.floor(t);
}

export function Loom({
  entries,
  ligatures = [],
  startYear,
  endYear,
  highlight,
  onHover,
  onClick,
  height = 240,
  showLigatures = true,
  showYears = true,
  ambientShuttle = false,
  nowYear,
  appendCount,
}: LoomProps) {
  const span = endYear - startYear;
  const yearToX = (y: number) => ((y - startYear) / span) * 100;
  const laneToY = (lane: number) => 12 + (lane * (height - 36)) / 5;

  // Span-relative tick density: aim for ~8–12 labels whatever the window
  // width, so a 6-year cloth shows yearly ticks and a 150-year archive thins
  // to decades/quarter-centuries instead of cramming 30 labels together.
  const yearTicks: number[] = [];
  const tickStep = [1, 2, 5, 10, 25, 50, 100].find((s) => span / s <= 12) ?? 100;
  const firstTick = Math.ceil(startYear / tickStep) * tickStep;
  for (let y = firstTick; y <= endYear; y += tickStep) {
    yearTicks.push(y);
  }

  // irregular hand-woven warp — a stack of vertical hairlines, each with
  // its own jittered position and alpha, so the warp doesn't read as a
  // flat repeating CSS fill.
  const warpEvery = 7; // px
  const warpCount = 180; // capped; the band scales to 100% width regardless
  const warps: { left: number; alpha: number }[] = [];
  for (let k = 0; k < warpCount; k += 1) {
    const base = (k * warpEvery) / (warpCount * warpEvery);
    const j = jitter(k * 1.7 + 3);
    warps.push({
      left: (base + (j - 0.5) * 0.0008) * 100,
      alpha: 0.1 + jitter(k * 2.3 + 1) * 0.14,
    });
  }

  // the warm "now" hairline position (invariant where-am-I marker)
  const nowFrac =
    nowYear != null ? Math.max(0, Math.min(1, (nowYear - startYear) / span)) : null;

  // the selvedge sits at the present (or the far edge of the window)
  const selvedgeLeft = (nowFrac ?? 1) * 100;

  return (
    <div className="loom-weft" style={{ width: '100%', height }}>
      {/* irregular warp — jittered vertical hairlines, not a flat fill */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {warps.map((wp, k) => (
          <div
            key={k}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${wp.left}%`,
              width: 1,
              background: `rgba(var(--loom-warp-rgb), ${wp.alpha.toFixed(3)})`,
            }}
          />
        ))}
      </div>

      {entries.map((e, i) => {
        const x = yearToX(e.year + (e.month ?? 0) / 12);
        const y = laneToY(e.lane);
        const lit = highlight === i;

        // sealed / tied-off entries are NOT a flat weft pick — they hover
        // above their future seal position as a tethered ∞ peg (artboard).
        if (e.locked) {
          const pegTop = 4;
          return (
            <div
              key={i}
              role={onClick ? 'button' : undefined}
              tabIndex={onClick ? 0 : undefined}
              aria-label={`Sealed ${e.kind}${e.title ? `: ${e.title}` : ''}, ${e.year}`}
              onMouseEnter={() => onHover?.(i)}
              onMouseLeave={() => onHover?.(null)}
              onFocus={() => onHover?.(i)}
              onBlur={() => onHover?.(null)}
              onClick={() => onClick?.(i)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  if (ev.key === ' ') ev.preventDefault();
                  onClick?.(i);
                }
              }}
              title={e.title}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: pegTop,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: onClick ? 'pointer' : 'default',
                zIndex: 2,
              }}
            >
              <span
                className="loom-serif"
                style={{
                  fontSize: 14,
                  lineHeight: 1,
                  color: 'var(--warm)',
                  opacity: lit ? 1 : 0.85,
                  transition: 'opacity var(--loom-dur-fast) var(--loom-ease)',
                }}
              >
                ∞
              </span>
              {/* dashed tether down to the seal's lane position */}
              <span
                style={{
                  width: 1,
                  height: Math.max(8, y - pegTop - 6),
                  background:
                    'repeating-linear-gradient(to bottom, var(--rule-warm) 0, var(--rule-warm) 2px, transparent 2px, transparent 6px)',
                  opacity: lit ? 0.9 : 0.5,
                }}
              />
            </div>
          );
        }

        const w = e.width ?? (e.kind === 'milestone' ? 18 : 28);
        return (
          <div
            key={i}
            className="loom-weft__pick"
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={`${e.kind}${e.title ? `: ${e.title}` : ''}, ${e.year}`}
            onMouseEnter={() => onHover?.(i)}
            onMouseLeave={() => onHover?.(null)}
            onFocus={() => onHover?.(i)}
            onBlur={() => onHover?.(null)}
            onClick={() => onClick?.(i)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                if (ev.key === ' ') ev.preventDefault();
                onClick?.(i);
              }
            }}
            style={{
              left: `${x}%`,
              top: `${y}px`,
              width: `${w}px`,
              background: colorFor(e),
              opacity: lit ? 1 : e.kind === 'memory' ? 0.6 : 0.85,
              height: lit ? 4 : 2,
              cursor: onClick ? 'pointer' : 'default',
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

      {/* the warm "now" hairline — where the present sits on the cloth */}
      {nowFrac != null ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${nowFrac * 100}%`,
            width: 1,
            background: 'var(--warm)',
            opacity: 0.9,
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {/* the selvedge + the always-visible append-only count (invariant B) */}
      {appendCount != null ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -2,
            bottom: -2,
            left: `${selvedgeLeft}%`,
            width: 1,
            background: 'var(--rule)',
            pointerEvents: 'none',
          }}
        >
          <span
            className="loom-mono"
            style={{
              position: 'absolute',
              top: 0,
              left: 6,
              fontSize: 9,
              letterSpacing: '0.18em',
              whiteSpace: 'nowrap',
              color: 'var(--warm)',
            }}
          >
            ∞ {String(appendCount).padStart(3, '0')} woven
          </span>
        </div>
      ) : null}

      {ambientShuttle ? <div className="loom-shuttle" style={{ top: '44%' }} /> : null}
    </div>
  );
}
