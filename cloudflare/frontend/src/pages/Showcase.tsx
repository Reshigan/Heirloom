import { Link } from 'react-router-dom';
import { TapestryCanvas } from '../loom/components/TapestryCanvas';
import type { CanvasEntry } from '../loom/components/TapestryCanvas';

// Illustrative archetypes — not real accounts. Each canvas is procedurally generated.
const ARCHETYPES = [
  { label: 'A grandmother in Johannesburg, writing since 2021', seed: 0, year: 2021 },
  { label: 'Three siblings in Osaka, keeping a shared record', seed: 1, year: 2019 },
  { label: 'A family scattered across five countries, one thread', seed: 2, year: 2022 },
];

function makeEntries(seed: number, year: number): CanvasEntry[] {
  const count = 80 + seed * 40;
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(year + Math.floor(i * 0.05), (i * 3) % 12, 1),
    n: seed * 1000 + i,
    dye: ['madder', 'indigo', 'weld', 'saffron', 'woad'][((seed + i) % 5)],
    tier: 'family' as const,
  }));
}

export function Showcase() {
  return (
    <div className="hl-screen" style={{ overflowY: 'auto', minHeight: '100vh' }}>
      <div style={{ padding: '64px 56px 0' }}>
        <div className="hl-eyebrow" style={{ marginBottom: 24 }}>What a thread looks like</div>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 48, fontWeight: 300, margin: '0 0 16px', color: 'var(--bone)' }}>
          The pattern of a life.
        </h1>
        <p className="hl-serif" style={{ fontSize: 17, color: 'var(--bone-dim)', maxWidth: '52ch', lineHeight: 1.6, margin: '0 0 64px' }}>
          Each entry becomes a weft thread. The cloth grows denser with every year. These patterns are illustrative — generated to show the form, not real account data.
        </p>
      </div>

      {ARCHETYPES.map((archetype, fi) => (
        <div key={fi} style={{ marginBottom: 64 }}>
          <div style={{ padding: '0 56px 16px' }}>
            <span
              className="hl-serif"
              style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--bone-faint)' }}
            >
              {archetype.label}
            </span>
          </div>
          <TapestryCanvas
            width={typeof window !== 'undefined' ? window.innerWidth : 1280}
            height={120}
            entries={makeEntries(archetype.seed, archetype.year)}
            kind="specimen"
            animate
            opts={{ tStart: new Date(archetype.year, 0, 1), tEnd: new Date(2026, 0, 1), background: '#0e0e0c', warpEvery: 10 }}
          />
        </div>
      ))}

      <div style={{ padding: '64px 56px 96px', borderTop: '1px solid var(--rule)' }}>
        <Link to="/signup" className="hl-btn">Start your thread — free</Link>
      </div>
    </div>
  );
}
