/**
 * ClothPage — cloth-fold → page-reveal transition.
 *
 * The world-first reading UX: the cloth folds back (perspective rotateX)
 * and a page reveals from beneath it, as if you are unfolding a letter
 * that was always woven into the cloth.
 *
 * isOpen=false → cloth face visible
 * isOpen=true  → cloth folds back, page reveals (360ms)
 */
import type { ReactNode } from 'react';

interface Props {
  isOpen: boolean;
  page: ReactNode;
  children: ReactNode;
  onClose?: () => void;
}

const DUR  = '360ms';
const EASE = 'cubic-bezier(0.16,1,0.3,1)';

export function ClothPage({ isOpen, page, children, onClose }: Props) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* ── Cloth face ── folds away when open */}
      <div
        aria-hidden={isOpen}
        style={{
          position: 'absolute', inset: 0,
          transform: isOpen
            ? 'perspective(1400px) rotateX(-18deg) translateZ(-60px) scale(0.97)'
            : 'perspective(1400px) rotateX(0deg) translateZ(0px) scale(1)',
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? 'none' : 'auto',
          transition: `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
          transformOrigin: 'center top',
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </div>

      {/* ── Page face ── reveals beneath cloth */}
      <div
        aria-hidden={!isOpen}
        style={{
          position: 'absolute', inset: 0,
          transform: isOpen
            ? 'perspective(1400px) rotateX(0deg) translateZ(0px) scale(1)'
            : 'perspective(1400px) rotateX(12deg) translateZ(-40px) scale(0.98)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
          transformOrigin: 'center top',
          willChange: 'transform, opacity',
          overflowY: 'auto',
        }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to cloth"
            style={{
              position: 'fixed',
              top: 'calc(20px + env(safe-area-inset-top, 0px))',
              left: 'clamp(16px, 4vw, 40px)',
              zIndex: 50,
              background: 'transparent',
              border: 'none',
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              cursor: 'pointer',
              padding: '8px 0',
              transition: `color 180ms ${EASE}`,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--bone)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone-faint)')}
          >
            ← cloth
          </button>
        )}
        {page}
      </div>
    </div>
  );
}
