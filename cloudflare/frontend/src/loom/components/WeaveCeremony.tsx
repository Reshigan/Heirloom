import type { ReactNode } from 'react';

/**
 * WeaveCeremony — the single "a new point activates in the cloth" celebration.
 *
 * Every authored entry (memory, letter, voice) ends here: one weft thread flashes
 * into the tapestry, then the eyebrow + headline rise. Unifying the three save paths
 * keeps invariant (A) — the Tapestry is the interface — true at the moment of authorship.
 */
export function WeaveCeremony({
  dye: _dye,
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
