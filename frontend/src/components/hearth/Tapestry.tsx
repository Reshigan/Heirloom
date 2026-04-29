/**
 * Tapestry — the woven artifact illuminated by the fire.
 *
 * Per the 2035 research synthesis: the Hearth alone gives you ritual and
 * presence, but no artifact. A fire is consumed; a tapestry accumulates.
 * The Tapestry is the family's woven record — every entry is a single
 * weft pick (a horizontal thread). Generations contribute weft on top of
 * the same warp. Hover a thread to see whose hand wove it.
 *
 * Visual:
 *   - Dim ground of vertical warp threads (the structural lattice).
 *   - Horizontal weft threads stack from oldest (top) to newest (bottom).
 *   - Each weft is colored by author — derived from a stable hash of
 *     member id, sampled from a hand-tuned ten-color natural-dye palette.
 *   - Newer threads are crisp; older threads are slightly faded to
 *     simulate age + lamp/firelight viewing.
 *   - The right edge frays — that's where the next thread will be added.
 *   - The whole canvas is barely lit, as if hanging behind/beside the
 *     fire. Looking AT the cloth, not THROUGH a screen.
 *
 * Performance: SVG, render is O(threads). Up to ~5,000 threads is fine.
 * Beyond, we paginate. Real families won't hit that for decades.
 *
 * Spatial-readiness: the Tapestry is naturally a hanging volumetric
 * object. The component returns a container with logical dimensions so
 * a future RealityKit port can map them to physical metres.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';

export interface WovenEntry {
  id: string;
  authorId: string;
  authorName: string;
  authorRelation?: string;
  dateLabel: string;
  /** Optional title — shown in tooltip if present. */
  title?: string;
  /** Optional era year for a subtle "year line" mark every decade. */
  yearValue?: number;
}

interface Props {
  entries: WovenEntry[];
  onPickEntry?: (id: string) => void;
  /** Width budget; the Tapestry is fluid. */
  maxWidth?: number;
}

// Hand-tuned natural-dye palette. Madder root, walnut hull, indigo,
// weld, pomegranate, oak gall, logwood, henna, woad, saffron. Slightly
// muted because we're viewing them in firelight.
const DYE_PALETTE = [
  '#a05438', // madder
  '#5a3a22', // walnut
  '#3a4a64', // indigo
  '#a89048', // weld
  '#8a3a3e', // pomegranate
  '#3a3a32', // oak gall
  '#5a2a3e', // logwood
  '#9a5a30', // henna
  '#48586a', // woad
  '#a07a3e', // saffron muted
];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function colorFor(authorId: string): string {
  return DYE_PALETTE[hashCode(authorId) % DYE_PALETTE.length];
}

const WARP_SPACING = 6; // px between vertical warp threads
const WEFT_HEIGHT = 4; // px per weft (entry)
const WEFT_GAP = 1.5;

export function Tapestry({ entries, onPickEntry, maxWidth = 1100 }: Props) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<WovenEntry | null>(null);

  const sorted = useMemo(() => [...entries].sort((a, b) => a.id.localeCompare(b.id)), [entries]);
  const tapestryHeight = Math.max(180, sorted.length * (WEFT_HEIGHT + WEFT_GAP) + 40);
  const warpCount = Math.floor(maxWidth / WARP_SPACING);

  return (
    <div className="relative" style={{ maxWidth }}>
      <p className="font-mono text-[0.65rem] tracking-[0.32em] uppercase text-paper/40 mb-3">
        the family weaving · {sorted.length} {sorted.length === 1 ? 'thread' : 'threads'}
      </p>

      <div
        className="relative w-full rounded-sm overflow-hidden"
        style={{
          height: tapestryHeight,
          background:
            'linear-gradient(180deg, rgba(26,15,8,0.95) 0%, rgba(20,11,6,0.98) 100%)',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6), 0 0 30px rgba(176,122,74,0.08)',
        }}
        onMouseLeave={() => setHovered(null)}
      >
        <svg
          viewBox={`0 0 ${maxWidth} ${tapestryHeight}`}
          width="100%"
          height={tapestryHeight}
          preserveAspectRatio="none"
          aria-label="The family tapestry — a thread per entry, coloured by author"
        >
          <defs>
            <linearGradient id="tapestry-fade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#000" stopOpacity="0.6" />
              <stop offset="20%" stopColor="#000" stopOpacity="0" />
              <stop offset="80%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
            </linearGradient>
            <filter id="tapestry-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
              <feColorMatrix
                values="0 0 0 0 0.04  0 0 0 0 0.03  0 0 0 0 0.02  0 0 0 0.32 0"
              />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
            <pattern id="warp-pattern" x="0" y="0" width={WARP_SPACING} height={tapestryHeight} patternUnits="userSpaceOnUse">
              <line
                x1={WARP_SPACING / 2}
                y1="0"
                x2={WARP_SPACING / 2}
                y2={tapestryHeight}
                stroke="rgba(244,236,216,0.045)"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          {/* Warp ground */}
          <rect width={maxWidth} height={tapestryHeight} fill="url(#warp-pattern)" />

          {/* Weft threads — each entry */}
          {sorted.map((entry, i) => {
            const y = 20 + i * (WEFT_HEIGHT + WEFT_GAP);
            const fade = Math.max(0.45, 1 - (sorted.length - i) / (sorted.length * 1.6));
            const color = colorFor(entry.authorId);
            return (
              <g key={entry.id} className="cursor-pointer" onClick={() => onPickEntry?.(entry.id)}>
                <rect
                  x="0"
                  y={y}
                  width={maxWidth}
                  height={WEFT_HEIGHT}
                  fill={color}
                  opacity={fade}
                  onMouseEnter={() => setHovered(entry)}
                />
                {/* Tiny slubs / variations across the thread length */}
                {Array.from({ length: 6 }, (_, j) => {
                  const spotX = ((hashCode(entry.id) * (j + 1)) % maxWidth);
                  return (
                    <rect
                      key={j}
                      x={spotX}
                      y={y - 0.3}
                      width={3 + (j % 3)}
                      height={WEFT_HEIGHT + 0.6}
                      fill={color}
                      opacity={Math.min(1, fade + 0.15)}
                      pointerEvents="none"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Edge frayed strands on the right — the next thread waits here */}
          {Array.from({ length: 8 }, (_, i) => {
            const y = 20 + Math.min(sorted.length, 60) * (WEFT_HEIGHT + WEFT_GAP) + i * 3;
            return (
              <line
                key={`fray-${i}`}
                x1={maxWidth - 6 - i * 3}
                y1={y}
                x2={maxWidth - 1}
                y2={y + 2 + i * 0.6}
                stroke="rgba(244,236,216,0.18)"
                strokeWidth="0.6"
              />
            );
          })}

          {/* Top + bottom edge fade */}
          <rect width={maxWidth} height={tapestryHeight} fill="url(#tapestry-fade)" />

          {/* Texture grain overlay */}
          <rect width={maxWidth} height={tapestryHeight} filter="url(#tapestry-grain)" opacity="0.6" />
        </svg>

        {/* Floating tooltip on thread hover */}
        {hovered ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute top-3 left-3 right-3 sm:top-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:max-w-[42ch] pointer-events-none px-4 py-3 rounded-md text-[13px] font-serif italic"
            style={{ background: 'rgba(15,8,4,0.85)', border: '1px solid rgba(244,236,216,0.10)', backdropFilter: 'blur(6px)' }}
          >
            <span className="text-paper/85">{hovered.title ?? 'untitled'}</span>
            <span className="text-paper/45 not-italic ml-2 font-mono text-[11px] tracking-wide">
              · {hovered.authorName}
              {hovered.authorRelation ? ` (${hovered.authorRelation})` : ''}
              {' · '}
              {hovered.dateLabel}
            </span>
          </motion.div>
        ) : null}
      </div>

      <p className="mt-3 font-serif italic text-paper/45 text-[13px]">
        {sorted.length === 0
          ? 'the loom is set, the warp is waiting. the first thread is yours.'
          : 'each entry is one weft thread. older threads sit at the top. the frayed edge is where the next thread will be tied.'}
      </p>
    </div>
  );
}
