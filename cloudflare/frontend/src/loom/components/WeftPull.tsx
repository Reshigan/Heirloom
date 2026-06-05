import { useState } from 'react';
import { Loom, type LoomEntry } from './Loom';
import { useAuthStore } from '../../stores/authStore';

/**
 * WeftPull — the "pull" view-mode of the tapestry home.
 *
 * A vertical paging hybrid onto one thread at a time. The full cloth
 * dims to wallpaper behind a flat ink veil; a single entry stands
 * large and centred. The only paging affordance is a thin dot rail on
 * the right edge — one mark per thread, the current one warm and tall.
 *
 * Reads from the entries prop (real data from Weft.tsx). Open (unlocked)
 * entries page; the visible body is derived from each entry's kind so
 * the mode shows real content rather than hardcoded prose.
 */

const bodyText = (e: LoomEntry): string => {
  if (e.kind === 'letter') return 'a letter sealed in this thread, waiting to be read.';
  if (e.kind === 'voice') return 'a voice memo — play to hear.';
  if (e.kind === 'milestone') return 'a milestone woven into the cloth.';
  return 'a memory in this thread.';
};

export function WeftPull({ entries }: { entries: LoomEntry[] }) {
  const { user } = useAuthStore();
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'you';

  const OPEN_ENTRIES = entries.filter((e) => !e.locked);
  const WOVEN_COUNT = OPEN_ENTRIES.length;

  const [pos, setPos] = useState(0);

  const go = (delta: number) => {
    setPos((p) => Math.min(OPEN_ENTRIES.length - 1, Math.max(0, p + delta)));
  };

  if (OPEN_ENTRIES.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p
          className="loom-body"
          style={{
            fontSize: 18,
            color: 'var(--bone-faint)',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          the cloth has no open threads yet · start writing
        </p>
      </div>
    );
  }

  const e = OPEN_ENTRIES[pos];
  // idx is the position in the full entries array for highlight
  const idx = entries.indexOf(e);

  return (
    <div
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
      onWheel={(ev) => {
        if (Math.abs(ev.deltaY) > 24) go(ev.deltaY > 0 ? 1 : -1);
      }}
    >
      {/* eased thread-to-thread transition (720ms, the one curve). The
          keyed content remounts on paging, so a mount animation carries
          the easing rather than a CSS transition (which can't fire on a
          fresh node). */}
      <style>{`
        .weftpull-thread {
          animation: weftpull-in var(--loom-dur-veil) var(--loom-ease);
        }
        @keyframes weftpull-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .weftpull-thread { animation: none; }
        }
      `}</style>
      {/* dim cloth as wallpaper */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
        <Loom
          entries={entries}
          startYear={1958}
          endYear={2068}
          height={680}
          showLigatures={false}
          showYears={false}
          ambientShuttle={false}
          highlight={idx >= 0 ? idx : undefined}
          nowYear={2026}
          appendCount={WOVEN_COUNT}
        />
      </div>
      {/* flat ink wash so the single thread reads above the cloth — a
          solid ink veil at reduced opacity, NOT a radial gradient (§2.6) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'var(--ink)',
          opacity: 0.82,
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
          color: 'var(--bone-dim)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        today's thread · {pos + 1} of {OPEN_ENTRIES.length}
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
        <div
          key={pos}
          className="weftpull-thread"
          style={{ width: 720, maxWidth: '60ch' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <span
              style={{
                display: 'inline-block',
                width: 28,
                height: 3,
                background: e.kind === 'milestone' ? 'var(--warm)' : 'var(--bone-dim)',
              }}
            />
            <span
              className="loom-mono"
              style={{
                fontSize: 10,
                color: 'var(--bone-faint)',
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
              color: 'var(--bone)',
            }}
          >
            {e.title ?? '—'}
          </h2>
          <div
            className="loom-mono"
            style={{
              fontSize: 11,
              color: 'var(--bone-dim)',
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
                color: 'var(--bone-dim)',
              }}
            >
              {displayName}
            </span>
            &nbsp;·&nbsp; thread n°{pos + 1} of {entries.length}
          </div>
          <p
            className="loom-body"
            style={{
              fontSize: 18,
              marginTop: 28,
              color: 'var(--bone-dim)',
              fontStyle: 'italic',
              maxWidth: '60ch',
            }}
          >
            {bodyText(e)}
          </p>
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
        {OPEN_ENTRIES.map((_, i) => (
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
              background: i === pos ? 'var(--warm)' : 'var(--bone-ghost)',
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
            color: 'var(--bone-faint)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          pull for the next
        </button>
        {/* hairline drop-cue — a short warm thread, not an arrow glyph */}
        <span
          aria-hidden
          style={{ width: 1, height: 14, background: 'var(--warm)', opacity: 0.7 }}
        />
      </div>
    </div>
  );
}
