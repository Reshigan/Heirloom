/**
 * Embers — small drifting particles that rise from the fire and fade.
 *
 * Each ember has its own delay and slight horizontal drift so the upward
 * motion doesn't read as a column. We keep ember count low (8) so the
 * animation stays quiet rather than busy. Honors prefers-reduced-motion.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

interface Ember {
  x: number;
  delay: number;
  drift: number;
  size: number;
  duration: number;
  hue: number;
}

const COUNT = 8;

function makeEmber(seed: number): Ember {
  // Deterministic pseudo-random based on seed so re-renders don't relayout.
  const r = (s: number) => {
    const x = Math.sin(s * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  return {
    x: -50 + r(seed * 1.7) * 100,
    delay: r(seed * 3.1) * 6,
    drift: -16 + r(seed * 5.3) * 32,
    size: 1.2 + r(seed * 7.7) * 1.6,
    duration: 5.5 + r(seed * 9.1) * 4,
    hue: 22 + r(seed * 11.3) * 14,
  };
}

export function Embers({ baseY = 0 }: { baseY?: number }) {
  const reduceMotion = useReducedMotion();
  const embers = useMemo(() => Array.from({ length: COUNT }, (_, i) => makeEmber(i + 1)), []);

  if (reduceMotion) return null;

  return (
    <div className="absolute inset-x-0" style={{ bottom: baseY }} aria-hidden>
      {embers.map((e, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 rounded-full"
          style={{
            width: e.size,
            height: e.size,
            background: `hsl(${e.hue}, 95%, 70%)`,
            boxShadow: `0 0 ${e.size * 3}px hsl(${e.hue}, 95%, 60%)`,
            translate: `${e.x}px 0`,
          }}
          animate={{
            y: [0, -180 - e.drift],
            x: [0, e.drift],
            opacity: [0, 0.85, 0.6, 0],
            scale: [1, 1, 0.7, 0.4],
          }}
          transition={{
            duration: e.duration,
            ease: 'easeOut',
            repeat: Infinity,
            delay: e.delay,
          }}
        />
      ))}
    </div>
  );
}
