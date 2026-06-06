import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { TapestryCanvas } from './TapestryCanvas';
import type { CanvasEntry } from './TapestryCanvas';

/**
 * WeaveCeremony — the single "a new point activates in the cloth" celebration.
 *
 * Every authored entry (memory, letter, voice) ends here: one weft thread flashes
 * into the tapestry, then the eyebrow + headline rise. Unifying the three save paths
 * keeps invariant (A) — the Tapestry is the interface — true at the moment of authorship.
 */
export function WeaveCeremony({
  dye,
  entryDate,
  seed,
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
  const wovenAtRef = useRef<number>(performance.now());
  const date = entryDate instanceof Date ? entryDate : new Date(entryDate);
  const safeDate = isNaN(date.getTime()) ? new Date() : date;

  // Set the weave-in flash timestamp once, on mount.
  useEffect(() => {
    wovenAtRef.current = performance.now();
  }, []);

  const entry: CanvasEntry = {
    date: safeDate,
    n: Math.abs(seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) || 42,
    dye,
    tier: 'family',
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        zIndex: 100,
        animation: 'hl-fade 360ms var(--ease) both',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <TapestryCanvas
          height={72}
          entries={[entry]}
          kind="specimen"
          animate
          newEntryAt={wovenAtRef.current}
          opts={{
            tStart: new Date(+safeDate - 86400000 * 180),
            tEnd: new Date(+safeDate + 86400000 * 180),
            background: '#0e0e0c',
            warpEvery: 9,
            showDecadeMarks: false,
            showFraySelvedge: false,
            showWarpHair: false,
          }}
        />
      </div>

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
