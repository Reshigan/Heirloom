import { Loom, type LoomEntry } from './Loom';

/**
 * WeftCentury — the "century" view-mode of the tapestry home.
 *
 * The whole archive compressed to a century scale (1912 → 2068), so a
 * lifetime of threads reads as a single dense band and the sealed,
 * past-a-lifetime entries become visible at the far edge. Decades are
 * the rhythm; generations are labelled beneath.
 *
 * It reuses the canonical Loom primitive at a wide year span and folds
 * the kin's own picks (from the entries prop) into the same cloth as
 * faint memory-weight threads — no parallel data model, just a wider window.
 */

const C_START = 1912;
const C_END = 2068;

export interface WeftCenturyProps {
  entries: LoomEntry[];
  kin: Array<{ name: string; born: number; died: number | null; you: boolean }>;
}

export function WeftCentury({ entries, kin }: WeftCenturyProps) {
  // kin picks become faint weft on the compressed cloth, lane by generation
  const kinEntries: LoomEntry[] = kin.map((k, i) => ({
    year: k.born,
    lane: i % 5,
    kind: k.you ? ('milestone' as const) : ('memory' as const),
    title: k.name,
  }));

  const combinedEntries: LoomEntry[] = [...kinEntries, ...entries];
  const WOVEN_COUNT = combinedEntries.filter((e) => !e.locked).length;

  const generations = kin.map((k, i) => ({
    gen: i,
    names: k.name,
    label: k.you ? 'you' : `gen ${i}`,
    align: (i === 0 ? 'left' : i === kin.length - 1 ? 'right' : 'center') as 'left' | 'center' | 'right',
    warm: k.you,
  }));

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
          <span style={{ color: 'var(--warm)' }}>·</span> century view &nbsp;·&nbsp; {C_START} — {C_END} &nbsp;·&nbsp; {C_END - C_START} yrs
        </span>
        <span className="loom-mono" style={{ fontSize: 9, letterSpacing: '0.18em' }}>
          entries sealed past a lifetime become visible here
        </span>
      </div>

      {/* the compressed cloth */}
      <div style={{ position: 'relative', marginTop: 12 }}>
        <Loom
          entries={combinedEntries}
          startYear={C_START}
          endYear={C_END}
          height={360}
          showLigatures={false}
          ambientShuttle={false}
          nowYear={2026}
          appendCount={WOVEN_COUNT}
        />
      </div>

      {/* generations bar */}
      <div
        style={{
          marginTop: 64,
          paddingTop: 18,
          borderTop: '1px solid var(--rule)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 40,
        }}
      >
        {generations.length === 0 ? (
          <div
            className="loom-mono"
            style={{
              fontSize: 10,
              color: 'var(--bone-faint)',
              letterSpacing: '0.18em',
              fontStyle: 'italic',
            }}
          >
            invite family to see their threads here
          </div>
        ) : (
          generations.map((g) => (
            <div key={g.gen} style={{ textAlign: g.align }}>
              <div
                className="loom-serif"
                style={{
                  fontSize: 15,
                  color: g.warm ? 'var(--warm)' : 'var(--bone-dim)',
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
                  color: 'var(--bone-faint)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginTop: 4,
                }}
              >
                {g.label}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
