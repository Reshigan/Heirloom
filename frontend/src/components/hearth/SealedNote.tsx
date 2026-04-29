/**
 * SealedNote — a time-locked entry, set as type.
 *
 * Replaces Bundle.tsx and the cloth/wax/cord/unfold animation. A
 * sealed entry appears in the margin as a single ∞ glyph in warmth
 * above one line of typography:
 *
 *         ∞
 *   2055 — for Maya, when she turns 18
 *
 * On unlock: the ∞ and the date both fade out; the entry's title
 * fades in in their place. A single 720ms cross-fade. No burning, no
 * unfolding. Restraint is the moment.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
  /** Short, plain-English label of the unlock condition. */
  label: string;
  /** Title revealed when unlocked. */
  title?: string;
  /** Force the unlock animation for demo. */
  forceUnlock?: boolean;
  onSelect?: () => void;
}

export function SealedNote({ label, title, forceUnlock, onSelect }: Props) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!forceUnlock) return;
    const t = setTimeout(() => setUnlocked(true), 0);
    return () => clearTimeout(t);
  }, [forceUnlock]);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={unlocked ? `Open entry: ${title}` : `Sealed: ${label}`}
      className="block group text-left focus:outline-none focus-visible:underline underline-offset-4"
    >
      <div className="flex flex-col items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {unlocked ? (
            <motion.div
              key="opened"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <p
                className="font-serif italic text-[rgba(244,236,216,0.9)] text-base md:text-lg max-w-[28ch] leading-snug"
                style={{ fontVariationSettings: '"opsz" 18' }}
              >
                {title ?? '—'}
              </p>
              <p className="mt-1.5 font-mono text-[0.65rem] tracking-[0.18em] uppercase text-[rgba(176,122,74,0.7)]">
                opened
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="sealed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <span
                aria-hidden
                className="block font-serif text-[1.6rem] leading-none"
                style={{ color: '#b07a4a' }}
              >
                ∞
              </span>
              <p
                className="mt-2.5 font-mono text-[0.78rem] tracking-[0.04em] text-[rgba(244,236,216,0.55)] group-hover:text-[rgba(244,236,216,0.85)] transition-colors duration-[180ms] max-w-[26ch]"
              >
                {label}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}
