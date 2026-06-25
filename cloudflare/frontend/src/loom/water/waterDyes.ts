import { DYES, dyeForId, type Dye } from '../dye';

/**
 * The water palette — each of the 10 natural dyes as a 0–1 RGB tuned for the
 * living-water shader's tone pipeline (NOT the display tokens in globals.css;
 * those are picked for type contrast, these for how dye looks diffusing in lit
 * water). The per-dye RGBs are kept VERBATIM from the ported NewUI shader so a
 * family's own colour is unchanged; only the family-less DEFAULT ramp below was
 * re-tuned to The Deep's cold deep-water ground.
 */
export const DYE_WATER_RGB: Record<Dye, [number, number, number]> = {
  // ── the original six, verbatim from fragmentShader's dye() ──
  weld: [0.92, 0.72, 0.30],
  madder: [0.78, 0.31, 0.21],
  woad: [0.32, 0.54, 0.60],
  indigo: [0.15, 0.27, 0.43],
  walnut: [0.50, 0.38, 0.24],
  cochineal: [0.56, 0.23, 0.35],
  // ── the remaining four, tuned in the same muted register ──
  saffron: [0.88, 0.66, 0.24],
  kermes: [0.72, 0.38, 0.44],
  oakgall: [0.42, 0.52, 0.34],
  iron: [0.30, 0.40, 0.45],
};

// The default ramp (surface → deep) for family-less water — public, auth and
// marketing screens. Tuned to The Deep: cold teal at the surface descending to
// deep indigo, no warm plumes. A signed-in family overrides this entirely with
// its own dyes (waterRamp), so family identity is untouched — this only sets
// the deep-water ground a visitor sees before any family colour is known.
export const DEFAULT_WATER_DYES: Dye[] = [
  'woad', 'woad', 'iron', 'iron', 'indigo', 'indigo',
];

const lum = ([r, g, b]: [number, number, number]) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Resolve a roster member to its dye: a chosen key wins, else a stable hue. */
export function memberWaterDye(m: { id: string; dye?: string | null }): Dye {
  const raw = m.dye?.toLowerCase();
  return raw && (DYES as readonly string[]).includes(raw) ? (raw as Dye) : dyeForId(m.id);
}

/**
 * Build the six ramp colours the shader needs from a family's dyes. The
 * distinct dyes are ordered light→deep and resampled into exactly six slots,
 * so the water IS the family's collective colour: one author → a single hue
 * throughout; many authors → a gradient through all their dyes. No family →
 * the approved default ground.
 */
export function waterRamp(dyes: Dye[]): [number, number, number][] {
  const distinct = [...new Set(dyes)];
  // No family → the deep-water default ground (original order, never re-sorted).
  if (!distinct.length) return DEFAULT_WATER_DYES.map((d) => DYE_WATER_RGB[d]);
  const ordered = distinct.slice().sort((a, b) => lum(DYE_WATER_RGB[b]) - lum(DYE_WATER_RGB[a]));
  const n = ordered.length;
  return Array.from({ length: 6 }, (_, i) => DYE_WATER_RGB[ordered[Math.round((i * (n - 1)) / 5)]]);
}
