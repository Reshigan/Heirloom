/**
 * The Fire — central element of the Hearth.
 *
 * Hand-tuned, not procedural. Three concentric flame layers (outer warmth,
 * mid-body, inner core) animate independently with different cycle times so
 * the motion never feels mechanical. We avoid keyframe loops that line up;
 * each layer has a prime-number-ish duration so the apparent flicker is
 * aperiodic across many seconds.
 *
 * No video. No realistic fire. This is the *memory* of a fire — the way you
 * remember sitting near one. Stylized, warm, calm.
 *
 * Embers drift upward independently in a sibling component (Embers.tsx).
 */

import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  /** 0..1, how brightly the fire is burning. Dimmed when an entry is open. */
  intensity?: number;
  size?: number;
}

export function Fire({ intensity = 1, size = 220 }: Props) {
  const reduceMotion = useReducedMotion();
  const baseScale = 0.92 + intensity * 0.18;

  // Three flame layers with non-aligned cycle durations so motion doesn't
  // synchronize. Reduced-motion users get a static rendering.
  const layerAnim = (duration: number, delay: number, intensityMod = 1) =>
    reduceMotion
      ? {}
      : {
          animate: {
            scaleY: [baseScale, baseScale * (1 + 0.08 * intensityMod), baseScale * (1 - 0.04 * intensityMod), baseScale],
            scaleX: [baseScale, baseScale * (1 - 0.03 * intensityMod), baseScale * (1 + 0.04 * intensityMod), baseScale],
            y: [0, -2 * intensityMod, 1 * intensityMod, 0],
          },
          transition: { duration, ease: 'easeInOut' as const, repeat: Infinity, delay },
        };

  return (
    <div
      style={{ width: size, height: size * 1.4 }}
      className="relative pointer-events-none select-none"
      aria-hidden
    >
      {/* Glow halo — a soft warmth that lights the area around the fire. */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          width: size * 2.2,
          height: size * 2.2,
          background: `radial-gradient(circle, rgba(255,168,80,${0.22 * intensity}) 0%, rgba(255,120,40,${0.12 * intensity}) 30%, transparent 70%)`,
        }}
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.85, 1, 0.92, 0.97, 0.85], scale: [1, 1.04, 0.99, 1.02, 1] }
        }
        transition={{ duration: 4.7, ease: 'easeInOut', repeat: Infinity }}
      />

      {/* Flame layers — bottom to top, outer to inner. */}
      <svg
        viewBox="-100 -200 200 280"
        preserveAspectRatio="xMidYMax meet"
        className="absolute inset-0 w-full h-full overflow-visible"
      >
        <defs>
          {/* Outer warm halo */}
          <radialGradient id="hearth-outer" cx="50%" cy="100%" r="80%">
            <stop offset="0%" stopColor="#ffb066" stopOpacity={0.6 * intensity} />
            <stop offset="60%" stopColor="#d96a25" stopOpacity={0.35 * intensity} />
            <stop offset="100%" stopColor="#7a2812" stopOpacity={0} />
          </radialGradient>
          {/* Mid body */}
          <radialGradient id="hearth-mid" cx="50%" cy="100%" r="70%">
            <stop offset="0%" stopColor="#ffd29a" stopOpacity={0.95 * intensity} />
            <stop offset="50%" stopColor="#ff9a3e" stopOpacity={0.75 * intensity} />
            <stop offset="100%" stopColor="#a83b14" stopOpacity={0} />
          </radialGradient>
          {/* Inner hot core */}
          <radialGradient id="hearth-core" cx="50%" cy="100%" r="60%">
            <stop offset="0%" stopColor="#fff7d8" stopOpacity={1 * intensity} />
            <stop offset="40%" stopColor="#ffe19a" stopOpacity={0.95 * intensity} />
            <stop offset="100%" stopColor="#ff9c3e" stopOpacity={0} />
          </radialGradient>
          {/* Log shadow */}
          <linearGradient id="hearth-log" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a2412" />
            <stop offset="100%" stopColor="#1a0e06" />
          </linearGradient>
        </defs>

        {/* The log — solid, warm, dark. The hearthstone the fire sits on. */}
        <ellipse cx="0" cy="56" rx="84" ry="14" fill="#0e0a06" />
        <path
          d="M -78 56 Q -60 40 -32 38 L 32 38 Q 60 40 78 56 Z"
          fill="url(#hearth-log)"
          opacity={0.95}
        />
        {/* Faint wood-grain hint */}
        <path
          d="M -55 47 L 55 47 M -42 51 L 42 51"
          stroke="#1f1308"
          strokeWidth="0.5"
          strokeLinecap="round"
          opacity={0.5}
        />

        {/* Outer flame layer — broad, soft, warm orange. */}
        <motion.path
          d="M -64 50 Q -78 -40 -28 -130 Q -10 -180 0 -180 Q 10 -180 28 -130 Q 78 -40 64 50 Z"
          fill="url(#hearth-outer)"
          style={{ transformOrigin: '50% 100%' }}
          {...layerAnim(3.7, 0, 1)}
        />

        {/* Mid flame — narrower, more orange, more motion. */}
        <motion.path
          d="M -38 45 Q -54 -30 -18 -110 Q -4 -150 0 -150 Q 4 -150 18 -110 Q 54 -30 38 45 Z"
          fill="url(#hearth-mid)"
          style={{ transformOrigin: '50% 100%' }}
          {...layerAnim(2.9, 0.4, 1.3)}
        />

        {/* Hot core — narrow, almost white, fastest motion. */}
        <motion.path
          d="M -16 40 Q -22 -10 -8 -85 Q -2 -120 0 -120 Q 2 -120 8 -85 Q 22 -10 16 40 Z"
          fill="url(#hearth-core)"
          style={{ transformOrigin: '50% 100%' }}
          {...layerAnim(2.1, 0.9, 1.6)}
        />
      </svg>
    </div>
  );
}
