import type { Dye } from '../dye';

/**
 * Loom thread vocabulary — the shared types the weave speaks, plus the one
 * ritual that streaks a new filament across it.
 *
 * The old hand-woven 2D "cloth" renderer that once lived here (and its 3D
 * sibling, ClothCanvas3D) were retired when CosmicLoom became the single
 * canonical backdrop. Only the weave ritual remains.
 */

/** Composer save → the weave answers: a new filament of light streaks across it. */
export function weaveIntoCloth(dye?: Dye): void {
  window.dispatchEvent(new CustomEvent('heirloom:weave', { detail: { dye } }));
}
