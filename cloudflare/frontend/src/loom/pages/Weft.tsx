import { useEffect, useState } from 'react';
import { LoomShell } from '../components/LoomShell';
import { Frame } from '../components/Frame';
import { Loom, type LoomLigature } from '../components/Loom';
import { ELEANOR_ENTRIES, ELEANOR_RESONANCES } from '../data/mock';

/**
 * Screen 02 — The Weft
 *
 * The user's life as a horizontal woven band, 1958 → 2068. Hovering
 * any thread shows the AI's resonances against it. The right rail is
 * the AI's quiet observations — never named, never asking, just
 * noticing.
 */
export function Weft() {
  const [hover, setHover] = useState<number | null>(null);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowAI(true), 900);
    return () => clearTimeout(t);
  }, []);

  const ligatures: LoomLigature[] = ELEANOR_RESONANCES.map((l) => ({
    ...l,
    show: showAI,
  }));

  const focusedLig =
    hover != null
      ? ELEANOR_RESONANCES.find((l) => l.from === hover || l.to === hover) ?? null
      : null;
  const focusedEntry = hover != null ? ELEANOR_ENTRIES[hover] : null;

  return (
    <LoomShell>
      <Frame active="weft">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '44px 80px 0',
            display: 'grid',
            gridTemplateColumns: '260px 1fr 280px',
            gap: 56,
          }}
        >
          {/* LEFT — meta */}
          <div>
            <div className="loom-eyebrow">your weft</div>
            <div
              className="loom-h2"
              style={{ fontSize: 38, marginTop: 12, marginBottom: 18 }}
            >
              Eleanor
              <br />
              Hartshorn
            </div>
            <div
              className="loom-mono"
              style={{ fontSize: 11, color: 'var(--loom-bone-faint)', marginBottom: 24 }}
            >
              1958 · jul · 14&nbsp;&nbsp;—&nbsp;&nbsp;∞
            </div>
            <hr className="loom-hairline" style={{ margin: '20px 0' }} />
            <div style={{ display: 'grid', gap: 14 }}>
              <Stat label="threads" value="312" />
              <Stat label="tied off" value="14" warm />
              <Stat label="resonances" value="48" />
              <Stat label="kept since" value="2026" />
            </div>
          </div>

          {/* CENTER — the loom */}
          <div style={{ position: 'relative', paddingTop: 8 }}>
            <div className="loom-eyebrow" style={{ marginBottom: 16 }}>
              <span style={{ color: 'var(--loom-warm)' }}>·</span> the loom &nbsp;·&nbsp; 1958 — 2068
            </div>
            <Loom
              entries={ELEANOR_ENTRIES}
              ligatures={ligatures}
              startYear={1958}
              endYear={2068}
              highlight={hover}
              onHover={setHover}
              height={300}
              ambientShuttle
            />

            <div
              style={{
                marginTop: 56,
                minHeight: 88,
                paddingTop: 18,
                borderTop: '1px solid var(--loom-rule)',
                transition: 'opacity 360ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {focusedEntry ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: 24,
                    alignItems: 'baseline',
                  }}
                >
                  <div className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-warm)' }}>
                    {focusedEntry.year}·{String(focusedEntry.month ?? 1).padStart(2, '0')}
                  </div>
                  <div className="loom-body" style={{ fontSize: 18 }}>
                    {focusedEntry.title}
                  </div>
                  <div className="loom-eyebrow" style={{ fontSize: 10 }}>
                    {focusedEntry.locked ? 'tied off' : focusedEntry.kind}
                  </div>
                  {focusedLig ? (
                    <div
                      style={{ gridColumn: '1 / -1', marginTop: 10, color: 'var(--loom-bone-dim)' }}
                      className="loom-body"
                    >
                      <span className="loom-warm-text" style={{ fontStyle: 'italic' }}>
                        resonance ·{' '}
                      </span>
                      <em>{focusedLig.label}</em>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div
                  className="loom-body loom-dim"
                  style={{ fontStyle: 'italic', fontSize: 16 }}
                >
                  Hover any thread. The loom remembers what rhymes.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — resonances list */}
          <div>
            <div className="loom-eyebrow">resonances</div>
            <div
              className="loom-serif"
              style={{
                fontSize: 13,
                color: 'var(--loom-bone-dim)',
                marginTop: 8,
                fontStyle: 'italic',
                lineHeight: 1.6,
              }}
            >
              five threads of yours seem to rhyme with five others. shown above as warm vertical hairlines.
            </div>
            <hr className="loom-hairline" style={{ margin: '18px 0' }} />
            <div style={{ display: 'grid', gap: 14 }}>
              {ELEANOR_RESONANCES.map((l, i) => (
                <div
                  key={i}
                  style={{
                    opacity: focusedLig === l ? 1 : 0.6,
                    transition: 'opacity 360ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  <div className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-warm)' }}>
                    {ELEANOR_ENTRIES[l.from].year} — {ELEANOR_ENTRIES[l.to].year}
                  </div>
                  <div
                    className="loom-serif"
                    style={{
                      fontSize: 13,
                      color: 'var(--loom-bone)',
                      fontStyle: 'italic',
                      marginTop: 2,
                      lineHeight: 1.45,
                    }}
                  >
                    {l.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Frame>
    </LoomShell>
  );
}

function Stat({ label, value, warm }: { label: string; value: string; warm?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline' }}>
      <div className="loom-eyebrow" style={{ fontSize: 10 }}>
        {label}
      </div>
      <div
        className="loom-serif"
        style={{
          fontSize: 24,
          color: warm ? 'var(--loom-warm)' : 'var(--loom-bone)',
          fontWeight: 300,
        }}
      >
        {value}
      </div>
    </div>
  );
}
