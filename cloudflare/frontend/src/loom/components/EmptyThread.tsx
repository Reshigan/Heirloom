import { Loom } from './Loom';

/**
 * EmptyThread — the first-session state of the cloth.
 *
 * Before a single weft thread exists, the loom is warp only: the bare
 * vertical threads waiting to be crossed. The composition is mostly
 * empty (the constitution's negative space), centred on one quiet
 * invitation and one warm CTA. The ∞ mark stands in for the thread
 * that hasn't been woven yet.
 *
 * Rendered by Weft when `entries.length === 0`. It reuses the canonical
 * Loom primitive with an empty `entries` array — same warp, same year
 * ticks, no picks — so the empty state is the same cloth, not a parallel
 * one.
 */
interface EmptyThreadProps {
  /** the year the thread is founded — the warp begins here */
  startYear?: number;
  endYear?: number;
  onWeave?: () => void;
}

export function EmptyThread({
  startYear = 2026,
  endYear = 2032,
  onWeave,
}: EmptyThreadProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '44px 80px 0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="loom-eyebrow" style={{ marginBottom: 16 }}>
        <span style={{ color: 'var(--loom-warm)' }}>·</span> the loom &nbsp;·&nbsp; founded today
      </div>

      {/* warp only — no weft yet */}
      <div style={{ position: 'relative', opacity: 0.5 }}>
        <Loom
          entries={[]}
          startYear={startYear}
          endYear={endYear}
          height={220}
          showLigatures={false}
          ambientShuttle={false}
        />
      </div>

      {/* the centred invitation — most of the surface stays empty */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          paddingBottom: '8vh',
        }}
      >
        <div
          className="loom-serif"
          style={{
            fontSize: 30,
            color: 'var(--loom-warm)',
            lineHeight: 1,
            marginBottom: 22,
          }}
        >
          ∞
        </div>
        <div
          className="loom-mono"
          style={{
            fontSize: 10,
            color: 'var(--loom-bone-faint)',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            marginBottom: 22,
          }}
        >
          nothing is woven yet
        </div>
        <h2
          className="loom-h2"
          style={{
            fontSize: 40,
            fontStyle: 'italic',
            margin: 0,
            maxWidth: '20ch',
            color: 'var(--loom-bone)',
          }}
        >
          Your cloth is waiting.
          <br />
          The first thread is the hardest.
        </h2>
        <div
          style={{
            marginTop: 34,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <button type="button" className="loom-btn" onClick={onWeave}>
            weave the first thread →
          </button>
          <span
            className="loom-mono"
            style={{
              fontSize: 10,
              color: 'var(--loom-bone-dim)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            or record your voice instead
          </span>
        </div>
      </div>
    </div>
  );
}
