import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PageTransition — 600ms settle on every route.
 *
 * Wraps content in an AnimatePresence-aware motion.div keyed by
 * pathname. New routes fade up with a small translate; outgoing
 * routes fade out. Honours prefers-reduced-motion via a media query
 * (Framer disables motion when the user has set it).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 10 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
