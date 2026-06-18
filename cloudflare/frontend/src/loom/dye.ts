/**
 * The single source of truth for dye → colour resolution across the loom.
 *
 * Dyes are the family's identity signal (§2.7). They are NEVER literal hex
 * here — every consumer reads the CSS custom properties in globals.css, so a
 * dye renders correctly in BOTH ink (dark) and parchment (light) themes. The
 * old per-room DYE_HEX tables drifted from these tokens, which is why a weft
 * pick never matched the dye the composer suggested. This module ends that.
 *
 * Resolution order for an entry:
 *   1. an explicit, known `metadata.dye` (what the composer saved)
 *   2. otherwise a deterministic dye hashed off the id, so the same entry is
 *      always the same colour — but still a real palette token, not stray hex.
 */

export type Dye =
  | 'madder' | 'cochineal' | 'kermes' | 'saffron' | 'weld'
  | 'walnut' | 'oakgall' | 'woad' | 'indigo' | 'iron';

export const DYES: Dye[] = [
  'madder', 'cochineal', 'kermes', 'saffron', 'weld',
  'walnut', 'oakgall', 'woad', 'indigo', 'iron',
];

const DYE_SET = new Set<string>(DYES);

/**
 * Each dye carries a mood (§2.7 motif). The composer's dye picker labels the
 * thread by this word, so it is the canonical "mood" a reader groups by.
 */
export const DYE_MOTIF: Record<Dye, string> = {
  weld: 'daily',
  walnut: 'travel',
  saffron: 'achievement',
  woad: 'contemplation',
  madder: 'joy',
  kermes: 'love',
  cochineal: 'grief',
  indigo: 'reflection',
  oakgall: 'record',
  iron: 'ending',
};

/** The mood word for a dye. */
export function moodForDye(dye: Dye): string {
  return DYE_MOTIF[dye];
}

/** A known dye name from saved metadata, or undefined. */
export function dyeFromMetadata(metadata: unknown): Dye | undefined {
  const d = (metadata as { dye?: unknown } | null | undefined)?.dye;
  return typeof d === 'string' && DYE_SET.has(d) ? (d as Dye) : undefined;
}

/** Deterministic dye for an id, so an entry without metadata is stable. */
export function dyeForId(id: string): Dye {
  const h = id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
  return DYES[Math.abs(h) % DYES.length];
}

/** The CSS variable reference for a dye — the only sanctioned colour value.
 *  This is the VIVID thread token (3px left-margin identity signal). Do NOT use
 *  it to render NAME TEXT — at small sizes several hues fail WCAG AA (4.5:1).
 *  Use `dyeTextVar()` for text. */
export function dyeVar(dye: Dye): string {
  return `var(--dye-${dye})`;
}

/** The CSS variable for rendering a member's NAME in their dye hue. Resolves to
 *  the AA-tuned `--dye-*-text` tokens (same hue as the thread, lightness
 *  mordanted so the name clears 4.5:1 in both themes). Keep threads on
 *  `dyeVar()`; put any dye-coloured TEXT on this. */
export function dyeTextVar(dye: Dye): string {
  return `var(--dye-${dye}-text)`;
}

/**
 * Resolve an entry to a CSS colour string, honouring saved metadata first
 * and falling back to the id hash. Always returns a palette token.
 */
export function dyeColor(id: string, metadata?: unknown): string {
  return dyeVar(dyeFromMetadata(metadata) ?? dyeForId(id));
}

/**
 * The dye colour for rendering NAME / dye-coloured TEXT — same resolution as
 * `dyeColor` but lands on the AA-tuned `--dye-*-text` tokens. Use this anywhere
 * a member's name (or other dye-hued text) is painted; keep threads, dots and
 * fills on `dyeColor`/`dyeVar` (the vivid signal).
 */
export function dyeTextColor(id: string, metadata?: unknown): string {
  return dyeTextVar(dyeFromMetadata(metadata) ?? dyeForId(id));
}
