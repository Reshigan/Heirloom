/**
 * Bundle — a time-locked entry sitting near the fire.
 *
 * Visually: a small cloth-wrapped parcel tied with cord, sealed with wax
 * bearing the ∞ mark. Stays sealed until its unlock condition is met. On
 * unlock (the moment when its date arrives or its target reaches their
 * milestone), the cord burns away in the firelight and the cloth unfolds
 * — a 4-second sequence that's the visual signature of the product.
 *
 * Three states:
 *   - sealed:   waiting, breathing softly with the fire's rhythm
 *   - opening:  cord burning, cloth unfolding (transient state)
 *   - opened:   cloth lying open, the entry's title visible
 *
 * Hover reveals the unlock condition ("opens 2055-09-04", "when Maya turns 18", etc.)
 */

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export type BundleState = 'sealed' | 'opening' | 'opened';

interface Props {
  /** Short label — what unlocks it. */
  unlockLabel: string;
  /** Optional title that becomes visible when opened. */
  title?: string;
  /** Click handler — fires only when sealed (preview unlock condition) or opened (read entry). */
  onSelect?: () => void;
  /** Force the opening sequence for demo. */
  forceOpening?: boolean;
}

export function Bundle({ unlockLabel, title, onSelect, forceOpening }: Props) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<BundleState>('sealed');

  useEffect(() => {
    if (!forceOpening) return;
    setState('opening');
    const t = setTimeout(() => setState('opened'), 3800);
    return () => clearTimeout(t);
  }, [forceOpening]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="relative inline-flex items-end justify-center group focus:outline-none focus-visible:ring-0"
      style={{ width: 110, height: 110 }}
      aria-label={`Time-locked entry — ${unlockLabel}${title && state === 'opened' ? `: ${title}` : ''}`}
    >
      <svg
        viewBox="-55 -55 110 110"
        className="overflow-visible w-full h-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="cloth" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3a2510" />
            <stop offset="50%" stopColor="#2a190a" />
            <stop offset="100%" stopColor="#1f1208" />
          </linearGradient>
          <linearGradient id="cloth-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="wax-seal" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#f0a86c" />
            <stop offset="60%" stopColor="#b8722e" />
            <stop offset="100%" stopColor="#7a3812" />
          </radialGradient>
          <filter id="glow-warm">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Slight ground-shadow under the bundle */}
        <ellipse cx="0" cy="38" rx="32" ry="4" fill="#000" opacity="0.4" />

        <AnimatePresence mode="wait">
          {state !== 'opened' ? (
            // SEALED / OPENING — bundle still folded
            <motion.g
              key="folded"
              initial={false}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.6 } }}
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, -1.2, 0, -0.6, 0] }
              }
              transition={
                reduceMotion ? undefined : { duration: 5, ease: 'easeInOut', repeat: Infinity }
              }
            >
              {/* Cloth body */}
              <rect x="-32" y="-30" width="64" height="60" rx="3" fill="url(#cloth)" />
              {/* Soft fold lines */}
              <path
                d="M -28 -15 L 28 -15 M -28 0 L 28 0 M -28 14 L 28 14"
                stroke="#0d0703"
                strokeWidth="0.5"
                opacity="0.6"
              />
              <rect x="-32" y="-30" width="64" height="60" rx="3" fill="url(#cloth-shadow)" opacity="0.4" />

              {/* Cord — vertical and horizontal — burns away during opening */}
              <motion.g
                animate={
                  state === 'opening'
                    ? { opacity: [1, 1, 0], pathLength: [1, 1, 0] }
                    : undefined
                }
                transition={state === 'opening' ? { duration: 2.4, ease: 'easeInOut' } : undefined}
              >
                <line x1="0" y1="-32" x2="0" y2="32" stroke="#7a4a1e" strokeWidth="1.6" />
                <line x1="-34" y1="0" x2="34" y2="0" stroke="#7a4a1e" strokeWidth="1.6" />
              </motion.g>

              {/* Wax seal at center — breathing softly when sealed, melts when opening */}
              <motion.g
                animate={
                  state === 'opening'
                    ? { scale: [1, 1.15, 0.7, 0], opacity: [1, 1, 0.7, 0] }
                    : reduceMotion
                      ? undefined
                      : { scale: [1, 1.04, 1] }
                }
                transition={
                  state === 'opening'
                    ? { duration: 2.4, delay: 0.6, ease: 'easeInOut' }
                    : reduceMotion
                      ? undefined
                      : { duration: 6, ease: 'easeInOut', repeat: Infinity }
                }
              >
                <circle cx="0" cy="0" r="9" fill="url(#wax-seal)" filter="url(#glow-warm)" />
                <text
                  x="0"
                  y="0"
                  fontFamily="serif"
                  fontSize="10"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#2a1408"
                >
                  ∞
                </text>
              </motion.g>

              {/* Spark flicker as cord burns */}
              {state === 'opening' && !reduceMotion ? (
                <motion.circle
                  cx="0"
                  cy="-30"
                  r="2.5"
                  fill="#ffd28e"
                  animate={{
                    cy: [-30, 0, 30],
                    cx: [0, 4, -3],
                    opacity: [0, 1, 0],
                  }}
                  transition={{ duration: 2.4, ease: 'easeInOut' }}
                />
              ) : null}
            </motion.g>
          ) : (
            // OPENED — cloth lies open, title visible
            <motion.g
              key="opened"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <path
                d="M -42 30 L -28 -25 L 28 -25 L 42 30 Z"
                fill="url(#cloth)"
                opacity="0.9"
              />
              <path
                d="M -42 30 L -28 -25 L 28 -25 L 42 30 Z"
                fill="url(#cloth-shadow)"
                opacity="0.3"
              />
              {title ? (
                <text
                  x="0"
                  y="2"
                  fontFamily="Newsreader, Georgia, serif"
                  fontStyle="italic"
                  fontSize="9"
                  textAnchor="middle"
                  fill="#f4ecd8"
                  opacity="0.85"
                >
                  {title.length > 22 ? title.slice(0, 21) + '…' : title}
                </text>
              ) : null}
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* Hover label — unlock condition for sealed, title for opened */}
      <span
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] tracking-wide text-paper/0 group-hover:text-paper/65 group-focus-visible:text-paper/65 transition-colors duration-300 font-mono"
        aria-hidden
      >
        {state === 'opened' ? 'opened' : unlockLabel}
      </span>
    </button>
  );
}
