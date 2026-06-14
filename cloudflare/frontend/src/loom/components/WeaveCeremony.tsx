import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { weaveIntoCloth } from './ClothWeave';
import { DYES, type Dye } from '../dye';

/**
 * WeaveCeremony — the single "a new point activates in the cloth" celebration.
 *
 * Every authored entry (memory, letter, voice) ends here: the global cloth
 * runs the weave ritual — a shuttle carries the new weft across the fell in
 * the author's dye — while the eyebrow + headline rise over a translucent
 * scrim so the weaving is visible. Unifying the three save paths keeps
 * invariant (A) — the Cloth is the interface — true at the moment of authorship.
 */
export function WeaveCeremony({
  dye,
  entryDate: _entryDate,
  seed: _seed,
  eyebrow,
  headline,
  footer,
}: {
  dye: string;
  /** The entry's own date — centers the woven thread in the specimen view. */
  entryDate: Date | string;
  /** Stable string used to seed the thread's position (usually the title). */
  seed: string;
  eyebrow: string;
  headline: string;
  footer?: ReactNode;
}) {
  useEffect(() => {
    weaveIntoCloth((DYES as readonly string[]).includes(dye) ? (dye as Dye) : undefined);
  }, [dye]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        // A base-anchored vignette — clear at the top where the shuttle streaks
        // its new filament across the (now fully present) cloth, deepening to ink
        // at the foot so the words read. The weave is the hero; the type rests
        // beneath it. Never a flat scrim — that would smother the one motion.
        background:
          'linear-gradient(to bottom, transparent 0%, transparent 42%, color-mix(in srgb, var(--ink) 78%, transparent) 78%, color-mix(in srgb, var(--ink) 92%, transparent) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: 'clamp(40px, 9vh, 96px) 40px',
        zIndex: 100,
        animation: 'hl-fade 360ms var(--ease) both',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'var(--warm)',
          margin: '0 0 20px',
          animation: 'hl-rise 720ms var(--ease) 180ms both',
        }}
      >
        {eyebrow}
      </p>
      <p
        className="hl-serif"
        style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: 300,
          color: 'var(--bone)',
          textAlign: 'center',
          lineHeight: 1.3,
          margin: 0,
          maxWidth: 480,
          animation: 'hl-rise 720ms var(--ease) 360ms both',
        }}
      >
        {headline}
      </p>

      {footer && (
        <div
          style={{
            borderTop: '1px solid var(--rule)',
            paddingTop: 28,
            marginTop: 40,
            textAlign: 'center',
            maxWidth: 400,
            animation: 'hl-rise 720ms var(--ease) 540ms both',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
