import type { Dye } from '../dye';

/**
 * Loom thread vocabulary — the shared types the weave speaks, plus the one
 * ritual that streaks a new filament across it.
 *
 * The old hand-woven 2D "cloth" renderer that once lived here (and its 3D
 * sibling, ClothCanvas3D) were retired when CosmicLoom became the single
 * canonical backdrop. Only the vocabulary they defined remains — CosmicLoom
 * and ClothBackdrop import these types; the composer + ceremonies fire the
 * weave ritual.
 */

export interface ClothWhisperEntry {
  /** First line of the whisper — the entry's title. */
  title: string;
  /** Year the entry belongs to (its lived date, not its row date). */
  year: number;
  dye: Dye;
  /** Where touching this thread takes you. */
  route?: string;
}

export interface ClothSealRef {
  /** The year the sealed letter opens. */
  year: number;
  /** Who sealed it — omitted when unknown. */
  from?: string;
  route?: string;
}

/** Composer save → the weave answers: a new filament of light streaks across it. */
export function weaveIntoCloth(dye?: Dye): void {
  window.dispatchEvent(new CustomEvent('heirloom:weave', { detail: { dye } }));
}
