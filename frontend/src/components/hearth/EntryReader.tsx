/**
 * EntryReader — the lean-in view.
 *
 * When the user picks a stone or an opened bundle, the fire dims, the canvas
 * leans in, and the entry's text appears in firelit serif. The chrome stays
 * minimal — a date, the author's name, and the body. No nav, no buttons
 * other than "step back."
 *
 * Visual: warm-on-warm, not white-on-black. The page reads as something
 * being held close to the fire, not a dialog.
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
          className="fixed inset-0 z-30 flex items-center justify-center px-6 md:px-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Backdrop dim — not pure black; warm, like turning toward firelight */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Step back from the fire"
            className="absolute inset-0 cursor-default focus:outline-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(15,8,4,0.65) 0%, rgba(8,4,2,0.92) 70%)',
            }}
          />

          {/* The page held to the firelight */}
          <motion.article
            initial={{ y: 12, scale: 0.985 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 8, scale: 0.99 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-[60ch] w-full"
          >
            <header className="mb-8 text-center">
              <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold/70 mb-3">
                {entry.dateLabel}
                {entry.eraLabel ? ` · ${entry.eraLabel}` : ''}
              </p>
              {entry.title ? (
                <h2
                  className="font-serif font-light text-3xl md:text-4xl text-paper/95 leading-tight"
                  style={{
                    fontVariationSettings: '"opsz" 36',
                    textShadow: '0 0 30px rgba(255,168,80,0.18)',
                  }}
                >
                  {entry.title}
                </h2>
              ) : null}
            </header>

            <div
              className="font-serif text-paper/85 text-[18px] leading-[1.85] whitespace-pre-wrap"
              style={{
                fontVariationSettings: '"opsz" 14',
              }}
            >
              {entry.body}
            </div>

            <footer className="mt-10 pt-6 border-t border-rule text-center">
              <p className="font-serif italic text-paper/55">
                — {entry.authorName}
                {entry.authorRelation ? ` · ${entry.authorRelation}` : ''}
              </p>
            </footer>

            <button
              type="button"
              onClick={onClose}
              className="block mx-auto mt-12 text-paper/40 hover:text-paper/75 transition-colors text-sm tracking-wide focus:outline-none focus-visible:underline"
            >
              step back from the fire
            </button>
          </motion.article>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
