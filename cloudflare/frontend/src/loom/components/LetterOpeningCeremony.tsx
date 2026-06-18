import { useEffect, useRef, useState } from 'react';
import { weaveIntoCloth } from './ClothWeave';
import { DYES, type Dye } from '../dye';
import { useFocusTrap } from '../../lib/useFocusTrap';

/**
 * LetterOpeningCeremony — the Unlock, for a letter received from another hand.
 *
 * Invariant (D): the Unlock is the only ceremony. Opening a letter someone left
 * you is the single moment that earns motion. It runs in three measured beats on
 * the one curve, in the sanctioned durations (360 / 720 / 1400):
 *
 *   1. THE SEAL HELD     — ink, a breathing ∞, whose letter this is, the moment
 *                          it waited for. A held quiet (1400ms).
 *   2. THE SEAL PARTS    — a single warm hairline draws apart beneath the mark.
 *   3. THE THREAD WOVEN  — the seal lifts; one weft thread weaves into the cloth
 *                          above; the words rise in sequence; the cloth claims it.
 *
 * No spinner, no card, no chrome. Type and a single thread. The reader closes it
 * themselves — the words are not snatched back.
 */

interface OpenedLetter {
  id: string;
  title?: string | null;
  salutation?: string | null;
  body?: string | null;
  signature?: string | null;
  milestoneLabel?: string | null;
}

export function LetterOpeningCeremony({
  letter,
  from,
  dye,
  entryDate,
  onClose,
}: {
  letter: OpenedLetter;
  from: string;
  dye: string;
  entryDate?: string | null;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<'seal' | 'reveal'>('seal');
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onClose);

  const date = entryDate ? new Date(entryDate) : new Date();
  const safeDate = isNaN(date.getTime()) ? new Date() : date;

  // Beat 1 → 3: hold the seal for 1400ms, then part it and weave the thread —
  // the global cloth runs the weave ritual in the sender's dye and surges to
  // full presence behind the words, so the letter is *seen* joining the cloth.
  useEffect(() => {
    const t = window.setTimeout(() => {
      weaveIntoCloth((DYES as readonly string[]).includes(dye) ? (dye as Dye) : undefined);
      setPhase('reveal');
    }, 1400);
    return () => window.clearTimeout(t);
  }, [dye]);

  const dateStr = safeDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Opening a letter from ${from}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        // Near-ink, but not opaque — the global cloth survives faintly behind the
        // held seal and blooms through as the thread weaves at beat 3. A flat
        // ink fill would hide the very cloth the letter is joining.
        background: 'color-mix(in srgb, var(--ink) 88%, transparent)',
        overflowY: 'auto',
        animation: 'hl-fade 360ms var(--ease) both',
      }}
    >
      <style>{`
        @keyframes hl-breathe {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.06); }
        }
        @keyframes hl-part {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
        @keyframes hl-lift {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-12px); }
        }
      `}</style>

      {phase === 'seal' ? (
        /* ── Beat 1–2 · the seal held, then parting ── */
        <div
          style={{
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            animation: 'hl-lift 360ms var(--ease) 1040ms both',
          }}
        >
          <div
            aria-hidden
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(76px, 12vw, 108px)',
              lineHeight: 1,
              color: 'var(--warm-bright)',
              animation: 'hl-breathe 1400ms var(--ease) both',
            }}
          >
            ∞
          </div>
          <div
            aria-hidden
            style={{
              width: 120,
              height: 1,
              background: 'var(--warm)',
              margin: '28px 0',
              transformOrigin: 'center',
              animation: 'hl-part 720ms var(--ease) 720ms both',
            }}
          />
          <p
            className="hl-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              margin: 0,
              animation: 'hl-rise 720ms var(--ease) 180ms both',
            }}
          >
            a letter from {from}
          </p>
          {letter.milestoneLabel && (
            <p
              className="hl-serif"
              style={{
                fontSize: 'clamp(20px, 4vw, 30px)',
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'var(--bone)',
                marginTop: 18,
                textAlign: 'center',
                maxWidth: 420,
                animation: 'hl-rise 720ms var(--ease) 360ms both',
              }}
            >
              for {letter.milestoneLabel}
            </p>
          )}
        </div>
      ) : (
        /* ── Beat 3 · the thread woven, the words risen ── */
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 'clamp(32px, 6vw, 72px) clamp(24px, 5vw, 48px) 96px' }}>
          <p
            className="hl-mono"
            style={{
              fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase',
              color: 'var(--warm)', margin: '0 0 24px',
              animation: 'hl-rise 720ms var(--ease) 200ms both',
            }}
          >
            ∞ a letter from {from}
          </p>

          {letter.salutation && (
            <p
              className="hl-serif"
              style={{
                fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: 300, fontStyle: 'italic',
                color: 'var(--bone)', margin: '0 0 24px', lineHeight: 1.3,
                animation: 'hl-rise 720ms var(--ease) 380ms both',
              }}
            >
              {letter.salutation}
            </p>
          )}

          <p
            className="hl-serif"
            style={{
              fontSize: 18, lineHeight: 1.85, color: 'var(--bone-dim)', margin: '0 0 28px',
              whiteSpace: 'pre-wrap',
              animation: 'hl-rise 720ms var(--ease) 560ms both',
            }}
          >
            {letter.body}
          </p>

          {letter.signature && (
            <p
              className="hl-serif"
              style={{
                fontSize: 18, color: 'var(--bone)', margin: '0 0 40px',
                animation: 'hl-rise 720ms var(--ease) 740ms both',
              }}
            >
              {letter.signature}
            </p>
          )}

          <div
            style={{
              borderTop: '1px solid var(--rule)', paddingTop: 24,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              animation: 'hl-rise 720ms var(--ease) 920ms both',
            }}
          >
            <span className="hl-mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
              <span style={{ color: 'var(--warm)' }}>∞</span>&nbsp; now woven into your cloth &nbsp;·&nbsp; {dateStr}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="hl-mono"
              style={{
                background: 'transparent', border: '1px solid var(--warm)', borderRadius: 0,
                padding: '8px 18px', cursor: 'pointer', fontSize: 10, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: 'var(--warm)',
              }}
            >
              return to your cloth →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LetterOpeningCeremony;
