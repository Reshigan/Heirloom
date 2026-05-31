import { useEffect, useState } from 'react';
import { LoomShell } from '../components/LoomShell';
import { Frame } from '../components/Frame';
import { Loom, type LoomLigature } from '../components/Loom';
import { ViewToggle } from '../components/ViewToggle';
import { EmptyThread } from '../components/EmptyThread';
import { WeftPull } from '../components/WeftPull';
import { WeftCentury } from '../components/WeftCentury';
import { ELEANOR_ENTRIES, ELEANOR_RESONANCES } from '../data/mock';

/**
 * Screen 02 — The Weft
 *
 * The user's life as a horizontal woven band, 1958 → 2068. Hovering
 * any thread shows the AI's resonances against it. The right rail is
 * the AI's quiet observations — never named, never asking, just
 * noticing.
 *
 * The cloth has four view-modes, switched by the loom-mono ViewToggle
 * in the top bar:
 *   canon   — the canonical horizontal band (default, below)
 *   pull    — one thread at a time, vertical paging  (WeftPull)
 *   century — the whole archive compressed to a century (WeftCentury)
 *   empty   — the first-session warp-only state       (EmptyThread)
 * The empty state is what the cloth shows when entries.length === 0;
 * it is also reachable as a mode so reviewers can see it against the
 * seeded mock family.
 */
type WeftMode = 'canon' | 'pull' | 'century' | 'empty';

export function Weft() {
  const [hover, setHover] = useState<number | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [mode, setMode] = useState<WeftMode>('canon');

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

  // The cloth's entries — the first session has none, which renders the
  // EmptyThread warp-only state. The 'empty' mode forces that view.
  const entries = mode === 'empty' ? [] : ELEANOR_ENTRIES;

  // The append-only count (invariant B) — woven = un-sealed entries; it
  // rides the selvedge in every mode. Derived from real data, never typed.
  const wovenCount = ELEANOR_ENTRIES.filter((e) => !e.locked).length;
  const sealedCount = ELEANOR_ENTRIES.length - wovenCount;

  const toggle = (
    <ViewToggle<WeftMode>
      value={mode}
      onChange={setMode}
      options={[
        { value: 'canon', label: 'canon' },
        { value: 'pull', label: 'pull' },
        { value: 'century', label: 'century' },
        { value: 'empty', label: 'empty' },
      ]}
    />
  );

  if (mode === 'empty' || entries.length === 0) {
    return (
      <LoomShell>
        <Frame active="weft" right={toggle}>
          <EmptyThread onWeave={() => setMode('canon')} />
        </Frame>
      </LoomShell>
    );
  }

  if (mode === 'pull') {
    return (
      <LoomShell>
        <Frame active="weft" right={toggle}>
          <WeftPull />
        </Frame>
      </LoomShell>
    );
  }

  if (mode === 'century') {
    return (
      <LoomShell>
        <Frame active="weft" right={toggle}>
          <WeftCentury />
        </Frame>
      </LoomShell>
    );
  }

  // The canonical home is the full-bleed cloth itself (invariant A) — no
  // dashboard, no nav-rail, no grid columns. The meta (whose weft this is,
  // the woven count, the resonance the AI is noticing) lives as ambient
  // hairline captions over the cloth, not as a column beside it.
  return (
    <LoomShell>
      <Frame active="weft" right={toggle}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {/* the full-bleed cloth — the interface IS the Tapestry */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              top: 64,
              bottom: 96,
              padding: '0 56px',
            }}
          >
            <Loom
              entries={ELEANOR_ENTRIES}
              ligatures={ligatures}
              startYear={1958}
              endYear={2068}
              highlight={hover}
              onHover={setHover}
              height={typeof window !== 'undefined' ? Math.max(420, window.innerHeight - 320) : 480}
              nowYear={2026}
              appendCount={wovenCount}
              ambientShuttle
            />
          </div>

          {/* ambient caption, top-left — whose cloth this is, who is noticing */}
          <div style={{ position: 'absolute', top: 28, left: 56, maxWidth: 360 }}>
            <div className="loom-eyebrow">
              <span style={{ color: 'var(--loom-warm)' }}>·</span> the weft &nbsp;·&nbsp; Eleanor
              Hartshorn &nbsp;·&nbsp; 1958 — 2068
            </div>
            <div
              className="loom-mono"
              style={{ fontSize: 10, color: 'var(--loom-bone-faint)', marginTop: 8, letterSpacing: '0.18em' }}
            >
              ∞ {wovenCount} woven &nbsp;·&nbsp; {sealedCount} sealed
            </div>
          </div>

          {/* ambient resonance caption, top-right — the Listener's one line */}
          <div style={{ position: 'absolute', top: 28, right: 56, maxWidth: 320, textAlign: 'right' }}>
            <div
              className="loom-serif"
              style={{
                fontSize: 13,
                color: 'var(--loom-bone-dim)',
                fontStyle: 'italic',
                lineHeight: 1.6,
                transition: 'opacity 360ms var(--loom-ease)',
                opacity: showAI ? 1 : 0,
              }}
            >
              {focusedLig ? (
                <>
                  <span className="loom-warm-text">resonance · </span>
                  {focusedLig.label}
                </>
              ) : (
                'five of your threads rhyme with five others — shown as warm hairlines across the cloth.'
              )}
            </div>
          </div>

          {/* the focused thread — a single hairline caption along the bottom */}
          <div
            style={{
              position: 'absolute',
              left: 56,
              right: 56,
              bottom: 28,
              paddingTop: 16,
              borderTop: '1px solid var(--loom-rule)',
              transition: 'opacity 360ms var(--loom-ease)',
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
                  {focusedEntry.locked ? 'sealed' : focusedEntry.kind}
                </div>
              </div>
            ) : (
              <div className="loom-body loom-dim" style={{ fontStyle: 'italic', fontSize: 16 }}>
                Hover any thread. The loom remembers what rhymes.
              </div>
            )}
          </div>
        </div>
      </Frame>
    </LoomShell>
  );
}
