import { Loom, type LoomEntry } from './Loom';
import { ELEANOR_ENTRIES, ELEANOR_KIN } from '../data/mock';

/**
 * WeftCentury — the "century" view-mode of the tapestry home.
 *
 * The whole archive compressed to a century scale (1912 → 2068), so a
 * lifetime of threads reads as a single dense band and the sealed,
 * past-a-lifetime entries become visible at the far edge. Decades are
 * the rhythm; generations are labelled beneath.
 *
 * It reuses the canonical Loom primitive at a wide year span and folds
 * the kin's own picks (from ELEANOR_KIN) into the same cloth as faint
 * memory-weight threads — no parallel data model, just a wider window.
 */

const C_START = 1912;
const C_END = 2068;

// kin picks become faint weft on the compressed cloth, lane by generation
const KIN_PICKS: LoomEntry[] = ELEANOR_KIN.flatMap((k, gen) =>
  k.picks.map((year) => ({
    year,
    lane: gen % 5,
    kind: k.you ? ('milestone' as const) : ('memory' as const),
    title: k.name,
  })),
);

const CENTURY_ENTRIES: LoomEntry[] = [...KIN_PICKS, ...ELEANOR_ENTRIES];

export function WeftCentury() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '40px 80px 0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="loom-eyebrow"
        style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}
      >
        <span>
          <span style={{ color: 'var(--loom-warm)' }}>·</span> century view &nbsp;·&nbsp; {C_START} — {C_END} &nbsp;·&nbsp; {C_END - C_START} yrs
        </span>
        <span className="loom-mono" style={{ fontSize: 9, letterSpacing: '0.18em' }}>
          entries sealed past a lifetime become visible here
        </span>
      </div>

      {/* the compressed cloth */}
      <div style={{ position: 'relative', marginTop: 12 }}>
        <Loom
          entries={CENTURY_ENTRIES}
          startYear={C_START}
          endYear={C_END}
          height={360}
          showLigatures={false}
          ambientShuttle={false}
        />
      </div>

      {/* generations bar */}
      <div
        style={{
          marginTop: 64,
          paddingTop: 18,
          borderTop: '1px solid var(--loom-rule)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 40,
        }}
      >
        {GENERATIONS.map((g) => (
          <div key={g.gen} style={{ textAlign: g.align }}>
            <div
              className="loom-serif"
              style={{
                fontSize: 15,
                color: g.warm ? 'var(--loom-warm)' : 'var(--loom-bone-dim)',
                fontStyle: g.warm ? 'italic' : 'normal',
                lineHeight: 1.4,
              }}
            >
              {g.names}
            </div>
            <div
              className="loom-mono"
              style={{
                fontSize: 9,
                color: 'var(--loom-bone-faint)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                marginTop: 4,
              }}
            >
              {g.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const GENERATIONS: {
  gen: number;
  names: string;
  label: string;
  align: 'left' | 'center' | 'right';
  warm?: boolean;
}[] = [
  { gen: 0, names: 'August · Margaret', label: 'gen 0 · the elders', align: 'left' },
  { gen: 1, names: 'Eleanor', label: 'gen 1 · the keeper', align: 'center', warm: true },
  { gen: 2, names: 'Maya', label: 'gen 2 · the author', align: 'center' },
  { gen: 3, names: '∞ Iris', label: 'gen 3 · the inheritor', align: 'right', warm: true },
];
