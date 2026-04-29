/**
 * Horizon — the warmth at the bottom of the canvas.
 *
 * Replaces every previous attempt at rendering fire. The hearth is
 * implied by a single warm light source occupying the bottom 18% of
 * the page. Looking at the Hearth is looking at a doorway with light
 * spilling under it.
 *
 * Composition reference: Vilhelm Hammershøi's interior windows.
 *
 * Motion: a single ±2% intensity breath on a 9-second cycle. Honors
 * prefers-reduced-motion (renders the static state).
 *
 * No fire, no particles, no flicker, no embers. The warmth is
 * understood, not depicted.
 */

import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  /** 0..1 — dimmed when an entry is open. */
  intensity?: number;
  /** Optional pulse — a single warmth pulse triggered by an event. */
  pulseKey?: string | number;
}

export function Horizon({ intensity = 1, pulseKey }: Props) {
  const reduceMotion = useReducedMotion();
  const baseAlpha = 0.42 * intensity;
  const peakAlpha = 0.48 * intensity;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-0"
      style={{ height: '38vh' }}
      aria-hidden
    >
      {/* The warm horizon — a wide elliptical glow rooted at the bottom edge. */}
      <motion.div
        key={pulseKey}
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 100% at 50% 110%, rgba(176,122,74,${peakAlpha}) 0%, rgba(140,90,48,${peakAlpha * 0.55}) 28%, rgba(60,30,12,${peakAlpha * 0.18}) 55%, transparent 78%)`,
          willChange: 'opacity',
        }}
        animate={
          reduceMotion
            ? undefined
            : { opacity: [baseAlpha / peakAlpha, 1, baseAlpha / peakAlpha + 0.05, 1, baseAlpha / peakAlpha] }
        }
        transition={
          reduceMotion ? undefined : { duration: 9, ease: 'easeInOut', repeat: Infinity }
        }
      />

      {/* A second, narrower warmth — the brightest point, just above the
          bottom edge. This is the "fire" without ever rendering one. */}
      <motion.div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '12vh',
          background: `radial-gradient(60% 100% at 50% 100%, rgba(255,168,80,${0.32 * intensity}) 0%, rgba(176,122,74,${0.12 * intensity}) 50%, transparent 100%)`,
          willChange: 'opacity',
        }}
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.85, 1, 0.92, 0.97, 0.85] }
        }
        transition={
          reduceMotion ? undefined : { duration: 7, ease: 'easeInOut', repeat: Infinity }
        }
      />

      {/* A single hairline at the horizon — the threshold between dark
          and warm. Almost imperceptible. Anchors the composition. */}
      <div
        className="absolute inset-x-0"
        style={{
          bottom: '12vh',
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(176,122,74,0.18) 30%, rgba(176,122,74,0.32) 50%, rgba(176,122,74,0.18) 70%, transparent 100%)',
        }}
      />
    </div>
  );
}
