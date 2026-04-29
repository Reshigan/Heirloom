/**
 * EntryReader — the reading veil.
 *
 * Type is the hero. The entry reads as a printed page, not a dialog.
 * Newsreader 18px / 1.85 leading at opscale 14, max measure 60ch,
 * warm-on-warm color (bone-90 over a near-ink veil that warms toward
 * the bottom).
 *
 * No backdrop blur. No frosted glass. The veil is a flat warm
 * darkness that lets the body type carry the eye.
 */

import { motion, AnimatePresence } from 'framer-motion';

export interface ReadableEntry {
  id: string;
  title?: string;
  body: string;
  authorName: string;
  authorRelation?: string;
  dateLabel: string;
  eraLabel?: string;
}

interface Props {
  entry: ReadableEntry | null;
  onClose: () => void;
}

export function EntryReader({ entry, onClose }: Props) {
  return (
    <AnimatePresence>
      {entry ? (
        <motion.div
          key={entry.id}
          className="fixed inset-0 z-30 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Veil — a flat warm darkness, never blurred. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="step back"
            className="fixed inset-0 cursor-default focus:outline-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(10,8,6,0.96) 0%, rgba(20,12,6,0.94) 70%, rgba(40,22,10,0.92) 100%)',
            }}
          />

          <motion.article
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            exit={{ y: 8 }}
            transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-[60ch] w-full mx-auto px-6 sm:px-10 md:px-14 py-24 sm:py-32"
          >
            <header className="mb-10 sm:mb-14">
              <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-[rgba(176,122,74,0.75)] mb-4">
                {entry.dateLabel}
                {entry.eraLabel ? ` · ${entry.eraLabel}` : ''}
              </p>
              {entry.title ? (
                <h2
                  className="font-serif text-[2rem] sm:text-[2.5rem] md:text-[3rem] text-[rgba(244,236,216,0.95)] leading-[1.08] tracking-[-0.014em]"
                  style={{ fontVariationSettings: '"opsz" 56', fontWeight: 400 }}
                >
                  {entry.title}
                </h2>
              ) : null}
            </header>

            <div
              className="font-serif text-[rgba(244,236,216,0.86)] text-[18px] sm:text-[19px] leading-[1.85] whitespace-pre-wrap"
              style={{ fontVariationSettings: '"opsz" 14', fontWeight: 400 }}
            >
              {entry.body}
            </div>

            <footer className="mt-14 pt-7 border-t border-[rgba(244,236,216,0.08)]">
              <p className="font-serif italic text-[rgba(244,236,216,0.55)] text-[15px]">
                — {entry.authorName}
                {entry.authorRelation ? ` · ${entry.authorRelation}` : ''}
              </p>
            </footer>

            <button
              type="button"
              onClick={onClose}
              className="block mx-auto mt-16 text-[rgba(244,236,216,0.4)] hover:text-[rgba(244,236,216,0.85)] transition-colors duration-[180ms] text-[13px] tracking-[0.04em] focus:outline-none focus-visible:underline underline-offset-4"
            >
              step back
            </button>
          </motion.article>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
