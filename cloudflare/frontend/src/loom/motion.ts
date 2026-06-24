/**
 * Canonical motion constants — the single source of truth for Heirloom motion.
 *
 * Design law (BRAND.md "The Deep", §motion): ONE easing curve; one calm
 * physics spring (stiffness ~170, damping ~26) for entrances and layout;
 * micro-states reduce to a 220ms ease; durations cluster at 180 / 360 / 720 /
 * 1400ms (ambient tier ≥6s is a documented exemption). Things settle; they
 * never bounce. Import these instead of re-declaring the literals per file.
 */

/** The one easing curve. Used everywhere motion carries information. */
export const EASE = 'cubic-bezier(0.16,1,0.3,1)';

/** The same curve as a cubic-bezier tuple, for framer-motion's `ease` prop.
 *  Keeps JS-driven motion bound to the one-curve law instead of inline arrays. */
export const EASE_ARRAY: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** The one calm spring for entrances and layout — settles, never bounces. */
export const SPRING = { stiffness: 170, damping: 26 } as const;

/** Micro-state transition (hover/press/toggle) — a single 220ms ease string. */
export const MICRO = `220ms ${EASE}`;

/** The four sanctioned durations, in milliseconds. */
export const DUR = {
  fast: 180,
  mid: 360,
  slow: 720,
  ceremony: 1400,
} as const;

/** True when the user has asked the OS to reduce motion. SSR-safe (false when
 *  matchMedia is unavailable). Gate rising/spring entrances on this. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
