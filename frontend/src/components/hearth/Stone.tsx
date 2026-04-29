/**
 * Stone — a single family member's place at the hearth.
 *
 * Each stone has three live states:
 *   - dim:    member exists, no recent activity
 *   - warm:   member contributed in the last ~30 days
 *   - lit:    member is the author of the entry currently being read
 *
 * Stones are circles, not avatars. Identity is conveyed by position around
 * the fire (each member has a stable seat) and by typographic name on
 * hover. We deliberately resist photo-avatars — stones outlast photos.
 *
 * Hover/focus → soft warming + name reveal.
 * Click → sets the active member, parent surfaces their entries.
 */

import { motion, useReducedMotion } from 'framer-motion';

export type StoneState = 'dim' | 'warm' | 'lit';

interface Props {
  name: string;
  relation?: string;
  state: StoneState;
  active: boolean;
  onClick?: () => void;
  /** Stable hash 0..1 used to vary stone shape so siblings don't look cloned. */
  variant?: number;
}

const SIZE = 44;

function shapeForVariant(variant: number) {
  // Three subtly different stone shapes — same recognized form, different hand.
  const v = Math.floor(variant * 3);
  switch (v) {
    case 0:
      return { rx: 22, ry: 18, rotate: -3 };
    case 1:
      return { rx: 20, ry: 19, rotate: 5 };
    default:
      return { rx: 23, ry: 17, rotate: -7 };
  }
}

export function Stone({ name, relation, state, active, onClick, variant = 0.5 }: Props) {
  const reduceMotion = useReducedMotion();
  const shape = shapeForVariant(variant);

  // Color is derived from state. Warm tones, never bright — a stone is a
  // stone, not a button.
  const fill = state === 'lit' ? '#3b1f0e' : state === 'warm' ? '#2a160a' : '#1a0e06';
  const innerGlow = state === 'lit' ? 0.95 : state === 'warm' ? 0.55 : 0.18;
  const ringOpacity = active ? 1 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${name}${relation ? ` (${relation})` : ''} — ${state} at the hearth`}
      className="relative inline-flex items-center justify-center group focus:outline-none focus-visible:ring-0"
      style={{ width: SIZE * 1.4, height: SIZE * 1.4 }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`-${SIZE / 2} -${SIZE / 2} ${SIZE} ${SIZE}`}
        className="overflow-visible"
        aria-hidden
      >
        <defs>
          <radialGradient id={`stone-${name}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#5a3a1f" stopOpacity={innerGlow} />
            <stop offset="60%" stopColor={fill} stopOpacity={1} />
            <stop offset="100%" stopColor="#0a0604" stopOpacity={1} />
          </radialGradient>
          <radialGradient id={`stone-glow-${name}`} cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#ffb066" stopOpacity={innerGlow * 0.85} />
            <stop offset="100%" stopColor="#ff6c1c" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Outer warmth — only when warm/lit. */}
        {state !== 'dim' ? (
          <motion.ellipse
            cx="0"
            cy="0"
            rx={shape.rx * 1.7}
            ry={shape.ry * 1.7}
            fill={`url(#stone-glow-${name})`}
            animate={
              reduceMotion
                ? undefined
                : { opacity: [innerGlow * 0.6, innerGlow * 1.0, innerGlow * 0.7] }
            }
            transition={{ duration: 4 + variant * 2, ease: 'easeInOut', repeat: Infinity }}
          />
        ) : null}

        {/* The stone itself */}
        <ellipse
          cx="0"
          cy="0"
          rx={shape.rx}
          ry={shape.ry}
          transform={`rotate(${shape.rotate})`}
          fill={`url(#stone-${name})`}
          stroke="#241408"
          strokeWidth="0.5"
        />

        {/* Active ring — thin, warm, only when this stone's entry is being read */}
        <motion.ellipse
          cx="0"
          cy="0"
          rx={shape.rx + 4}
          ry={shape.ry + 4}
          transform={`rotate(${shape.rotate})`}
          fill="none"
          stroke="#c9a05c"
          strokeWidth="0.8"
          animate={{ opacity: ringOpacity }}
          transition={{ duration: 0.5 }}
        />
      </svg>

      {/* Name plate — appears on hover/focus only */}
      <span
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] tracking-wide text-paper/0 group-hover:text-paper/70 group-focus-visible:text-paper/70 transition-colors duration-300 font-serif"
        aria-hidden
      >
        {name}
      </span>
    </button>
  );
}
