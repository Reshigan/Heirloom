import { useState } from 'react';
import { Loom, type LoomEntry } from './Loom';
import { useAuthStore } from '../../stores/authStore';

/**
 * WeftPull (Threads) — one thread at a time, vertical paging.
 *
 * The full cloth dims to wallpaper. A single entry stands large and
 * centred. Hover any background thread to preview it; click the thread
 * or the "open →" link to navigate to the full entry.
 */

function fmtDate(iso: string | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return ''; }
}

export function WeftPull({
  entries,
  onSelectEntry,
}: {
  entries: LoomEntry[];
  onSelectEntry?: (entry: LoomEntry) => void;
}) {
  const { user } = useAuthStore();
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'you';

  const OPEN_ENTRIES = entries.filter((e) => !e.locked);
  const WOVEN_COUNT = OPEN_ENTRIES.length;

  const [pos, setPos] = useState(0);
  // hoveredIdx tracks which thread in the background cloth is hovered
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // If hovering a thread, show that entry's preview; otherwise show pos
  const displayIdx = hoveredIdx != null
    ? OPEN_ENTRIES.indexOf(entries[hoveredIdx] ?? OPEN_ENTRIES[0])
    : pos;
  const displayPos = displayIdx >= 0 ? displayIdx : pos;

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

  const e = OPEN_ENTRIES[displayPos] ?? OPEN_ENTRIES[pos];
  // idx is the position in the full entries array for highlight
  const idx = entries.indexOf(e);
  const dyeColor = e.dye
    ? `var(--dye-${e.dye})`
    : e.kind === 'letter' ? 'var(--dye-walnut)'
    : e.kind === 'voice' ? 'var(--dye-woad)'
    : 'var(--dye-indigo)';

  const handleLoomHover = (i: number | null) => {
    setHoveredIdx(i);
  };

  const handleLoomClick = (i: number) => {
    const clicked = entries[i];
    if (!clicked) return;
    const openIdx = OPEN_ENTRIES.indexOf(clicked);
    if (openIdx >= 0) {
      setPos(openIdx);
      setHoveredIdx(null);
    }
    if (clicked.id && onSelectEntry) onSelectEntry(clicked);
  };

  return (
    <div
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
      onWheel={(ev) => {
        if (Math.abs(ev.deltaY) > 24) go(ev.deltaY > 0 ? 1 : -1);
      }}
    >
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

      {/* dim cloth as wallpaper — hover threads to preview, click to open */}
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
          nowYear={new Date().getFullYear()}
          appendCount={WOVEN_COUNT}
          onHover={handleLoomHover}
          onClick={handleLoomClick}
        />
      </div>

      {/* flat ink wash */}
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
        {hoveredIdx != null ? 'hovering thread' : 'today\'s thread'} · {displayPos + 1} of {OPEN_ENTRIES.length}
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
          key={displayPos}
          className="weftpull-thread"
          style={{ width: 720, maxWidth: '60ch' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <span
              style={{
                display: 'inline-block',
                width: 28,
                height: 3,
                background: dyeColor,
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

          {e.date && (
            <p className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 10, letterSpacing: '0.12em' }}>
              {fmtDate(e.date)}
            </p>
          )}

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
              className="loom-body"
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
            &nbsp;·&nbsp; thread n°{displayPos + 1} of {entries.length}
          </div>

          {/* open link */}
          {e.id && onSelectEntry && (
            <button
              type="button"
              onClick={() => onSelectEntry(e)}
              className="loom-mono"
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                fontSize: 11,
                color: 'var(--warm)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                marginTop: 28,
                display: 'block',
              }}
            >
              open this thread →
            </button>
          )}
        </div>
      </div>

      {/* dot pager on the right edge */}
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
            aria-current={i === displayPos}
            onClick={() => { setPos(i); setHoveredIdx(null); }}
            style={{
              width: 1.5,
              height: i === displayPos ? 18 : 6,
              padding: 0,
              border: 0,
              background: i === displayPos ? 'var(--warm)' : 'var(--bone-ghost)',
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
          next thread
        </button>
        <span
          aria-hidden
          style={{ width: 1, height: 14, background: 'var(--warm)', opacity: 0.7 }}
        />
      </div>
    </div>
  );
}
