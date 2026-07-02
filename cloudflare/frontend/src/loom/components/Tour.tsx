import { useState } from 'react';

/**
 * Tour — the product tour. A sequence of full-bleed typographic panels that
 * teach the five world-first invariants of Heirloom (STITCH_BRIEF §1.5): the
 * cloth IS the interface, the append-only counter, the Listener, the sealed
 * letter, the bloodline. No icons, no cards — type is the hero, the global
 * cloth backdrop shows through. Reusable: the onboarding embeds it, and Help
 * re-runs it. Calls onDone when the reader finishes or skips.
 */

import { EASE } from '../motion';

interface Panel {
  eyebrow: string;
  line: string;      // the hero line (Source Serif 4, large)
  body: string;      // one quiet supporting sentence
}

const PANELS: Panel[] = [
  {
    eyebrow: 'the Deep is the interface',
    line: 'This is not a feed. It is the Deep.',
    body: 'Every memory, letter, and voice your family adds settles as its own point of dye. The whole becomes a water you read by hand.',
  },
  {
    eyebrow: 'append-only',
    line: 'Nothing here is ever deleted.',
    body: 'Threads are only ever added. The counter at the edge of the Deep only climbs — a family record that cannot be quietly unwound.',
  },
  {
    eyebrow: 'the listener',
    line: 'A quiet line reads alongside you.',
    body: 'The Listener offers a single prompt when words are hard to find. It is never a chatbot, never in the way — one sentence, then silence.',
  },
  {
    eyebrow: 'the sealed letter',
    line: 'Write now. Delivered when it matters.',
    body: 'Seal a letter to a person and a moment — a birthday, a wedding, the day after you are gone. It waits in the Deep until then.',
  },
  {
    eyebrow: 'the bloodline',
    line: 'Owned by your family. For a thousand years.',
    body: 'Invite the people who tend this Deep with you. Private, encrypted, inherited — never a platform, always yours.',
  },
];

export function Tour({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const panel = PANELS[i];
  const last = i === PANELS.length - 1;

  function next() {
    if (last) onDone();
    else setI((n) => n + 1);
  }

  return (
    <div
      style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        zIndex: 1,
      }}
    >
      {/* progress: one hairline tick per panel */}
      <div style={{ display: 'flex', gap: 6, padding: 'calc(24px + env(safe-area-inset-top,0px)) clamp(24px,8vw,96px) 0' }}>
        {PANELS.map((_, n) => (
          <div
            key={n}
            style={{
              height: 1, flex: 1,
              background: n <= i ? 'var(--bone-dim)' : 'var(--rule)',
              transition: `background 360ms ${EASE}`,
            }}
          />
        ))}
      </div>

      {/* panel body */}
      <div
        key={i}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'clamp(32px,8vw,96px)', maxWidth: 720,
          animation: `hl-fade 720ms ${EASE}`,
        }}
      >
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em',
          textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 28,
        }}>
          {panel.eyebrow}
        </div>
        <h1 style={{
          fontFamily: 'var(--serif-display)', fontWeight: 300,
          fontSize: 'clamp(30px,6.5vw,52px)', lineHeight: 1.1,
          letterSpacing: '-0.018em', color: 'var(--bone)', margin: '0 0 22px',
        }}>
          {panel.line}
        </h1>
        <p style={{
          fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 17,
          lineHeight: 1.75, color: 'var(--bone-dim)', margin: 0, maxWidth: '46ch',
        }}>
          {panel.body}
        </p>
      </div>

      {/* actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24,
        padding: '0 clamp(24px,8vw,96px) calc(40px + env(safe-area-inset-bottom,0px))',
      }}>
        <button type="button" className="hl-btn" onClick={next}>
          {last ? 'begin →' : 'next →'}
        </button>
        {!last && (
          <button
            type="button"
            onClick={onDone}
            style={{
              background: 'transparent', border: 0, padding: '10px 0', cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'var(--bone-faint)', touchAction: 'manipulation',
            }}
          >
            skip the tour
          </button>
        )}
      </div>
    </div>
  );
}
