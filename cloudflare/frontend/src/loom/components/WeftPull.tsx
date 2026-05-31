import { useState } from 'react';
import { Loom } from './Loom';
import { ELEANOR_ENTRIES } from '../data/mock';

/**
 * WeftPull — the "pull" view-mode of the tapestry home.
 *
 * A vertical paging hybrid onto one thread at a time. The full cloth
 * dims to wallpaper behind a radial vignette; a single entry stands
 * large and centred. The only paging affordance is a thin dot rail on
 * the right edge — one mark per thread, the current one warm and tall.
 *
 * It reads from the same ELEANOR_ENTRIES as the canonical Weft — no
 * parallel data model. Open (unlocked) entries page; the visible body
 * is drawn from each entry's own metadata so the mode shows real
 * content rather than lorem.
 */

// A short reflective body per open entry, in the thread's own voice.
// Keyed by entry index into ELEANOR_ENTRIES. Sealed entries are skipped.
const BODIES: Record<number, string> = {
  7: 'Tonight the light came through the daffodils on the kitchen sill the way it used to when my mother was alive — slanted, low, the colour of a strong tea. I thought I should write it down before it goes.',
  9: 'A kettle, a sunday, six notes I have hummed my whole life without knowing where I learned them. Maya hums them now. She does not know she does.',
  16: 'She called from Berlin at an hour that was the middle of her night and the start of my morning. We did not say anything that mattered. That was the point of the call.',
  20: 'To my granddaughter, today: you are asleep on the windowsill where my mother used to sit. I do not know who you will become. I am writing so that you will know who we were.',
};

const OPEN_INDICES = ELEANOR_ENTRIES
  .map((e, i) => ({ e, i }))
  .filter(({ e }) => !e.locked)
  .map(({ i }) => i);

export function WeftPull() {
  // start on the daffodils thread if present, else the first open one
  const startAt = OPEN_INDICES.indexOf(7);
  const [pos, setPos] = useState(startAt >= 0 ? startAt : 0);
  const idx = OPEN_INDICES[pos];
  const e = ELEANOR_ENTRIES[idx];

  const go = (delta: number) => {
    setPos((p) => Math.min(OPEN_INDICES.length - 1, Math.max(0, p + delta)));
  };

  return (
    <div
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
      onWheel={(ev) => {
        if (Math.abs(ev.deltaY) > 24) go(ev.deltaY > 0 ? 1 : -1);
      }}
    >
      {/* dim cloth as wallpaper */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
        <Loom
          entries={ELEANOR_ENTRIES}
          startYear={1958}
          endYear={2068}
          height={680}
          showLigatures={false}
          showYears={false}
          ambientShuttle={false}
          highlight={idx}
        />
      </div>
      {/* vignette so the single thread reads above the cloth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at center, rgba(14,14,12,0.4) 0%, rgba(14,14,12,0.94) 70%)',
        }}
      />

      {/* micro-meta, top-left */}
      <div
        className="loom-mono"
        style={{
          position: 'absolute',
          top: 28,
          left: 80,
          fontSize: 10,
          color: 'var(--loom-bone-dim)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        today's thread · {pos + 1} of {OPEN_INDICES.length}
      </div>

      {/* the single thread, centred */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '96px 0 104px',
        }}
      >
        <div style={{ width: 720, maxWidth: '60ch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <span
              style={{
                display: 'inline-block',
                width: 28,
                height: 3,
                background: e.kind === 'milestone' ? 'var(--loom-warm)' : 'var(--loom-bone-dim)',
              }}
            />
            <span
              className="loom-mono"
              style={{
                fontSize: 10,
                color: 'var(--loom-bone-faint)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              {e.kind} · {e.year}·{String(e.month ?? 1).padStart(2, '0')}
            </span>
          </div>
          <h2
            className="loom-h2"
            style={{
              fontSize: 44,
              fontStyle: 'italic',
              margin: 0,
              color: 'var(--loom-bone)',
            }}
          >
            {e.title}
          </h2>
          <div
            className="loom-mono"
            style={{
              fontSize: 11,
              color: 'var(--loom-bone-dim)',
              marginTop: 18,
              letterSpacing: '0.06em',
            }}
          >
            <span
              className="loom-serif"
              style={{
                fontStyle: 'italic',
                textTransform: 'none',
                letterSpacing: 0,
                fontSize: 14,
                color: 'var(--loom-bone-dim)',
              }}
            >
              Eleanor Hartshorn
            </span>
            &nbsp;·&nbsp; thread n°{idx + 1} of {ELEANOR_ENTRIES.length}
          </div>
          {BODIES[idx] ? (
            <p
              className="loom-body"
              style={{
                fontSize: 19,
                marginTop: 28,
                color: 'var(--loom-bone)',
                maxWidth: '60ch',
              }}
            >
              {BODIES[idx]}
            </p>
          ) : (
            <p
              className="loom-body"
              style={{
                fontSize: 18,
                marginTop: 28,
                color: 'var(--loom-bone-dim)',
                fontStyle: 'italic',
                maxWidth: '60ch',
              }}
            >
              An entry on this thread. Pull to read the next one the loom has kept.
            </p>
          )}
        </div>
      </div>

      {/* dot pager on the right edge — one mark per open thread */}
      <div
        style={{
          position: 'absolute',
          right: 28,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          alignItems: 'center',
        }}
      >
        {OPEN_INDICES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`thread ${i + 1}`}
            aria-current={i === pos}
            onClick={() => setPos(i)}
            style={{
              width: 1.5,
              height: i === pos ? 18 : 6,
              padding: 0,
              border: 0,
              background: i === pos ? 'var(--loom-warm)' : 'var(--loom-bone-ghost)',
              cursor: 'pointer',
              transition: 'height 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        ))}
      </div>

      {/* swipe affordance */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <button
          type="button"
          onClick={() => go(1)}
          className="loom-mono"
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            fontSize: 10,
            color: 'var(--loom-bone-faint)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          pull for the next
        </button>
        <span className="loom-serif" style={{ color: 'var(--loom-warm)', fontSize: 16 }}>
          ↓
        </span>
      </div>
    </div>
  );
}
