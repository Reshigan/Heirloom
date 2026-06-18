/**
 * Canonical motion constants — the single source of truth for Heirloom motion.
 *
 * Design law (ART_DIRECTION.md, rule 4): ONE easing curve, durations restricted
 * to 180 / 360 / 720 / 1400ms (ambient tier ≥6s is a documented exemption).
 * Import these instead of re-declaring the literals per file.
 */

/** The one easing curve. Used everywhere motion carries information. */
export const EASE = 'cubic-bezier(0.16,1,0.3,1)';

/** The four sanctioned durations, in milliseconds. */
export const DUR = {
  fast: 180,
  mid: 360,
  slow: 720,
  ceremony: 1400,
} as const;
