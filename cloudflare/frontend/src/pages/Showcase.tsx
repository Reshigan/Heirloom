import { Link } from 'react-router-dom';
import { TapestryCanvas } from '../loom/components/TapestryCanvas';
import type { CanvasEntry } from '../loom/components/TapestryCanvas';

const FAMILIES = [
  { name: 'The Okonkwo Thread', year: 1948, entries: 4318 },
  { name: 'The Lindqvist Thread', year: 1961, entries: 2104 },
  { name: 'The Mehta Thread', year: 1975, entries: 891 },
];

function makeEntries(seed: number, count: number): CanvasEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(1960 + seed * 10 + Math.floor(i * 0.5), (i * 4) % 12, 1),
    n: seed * 1000 + i,
    dye: ['madder', 'indigo', 'weld', 'saffron', 'woad'][((seed + i) % 5)],
    tier: 'family' as const,
  }));
}

export function Showcase() {
  return (
    <div className="hl-screen" style={{ overflowY: 'auto', minHeight: '100vh' }}>
      <div style={{ padding: '64px 56px 0' }}>
        <div className="hl-eyebrow" style={{ marginBottom: 24 }}>Public showcase</div>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 48, fontWeight: 300, margin: '0 0 16px', color: 'var(--bone)' }}>
          Threads in the open.
        </h1>
        <p className="hl-serif" style={{ fontSize: 17, color: 'var(--bone-dim)', maxWidth: '52ch', lineHeight: 1.6, margin: '0 0 64px' }}>
          These families have chosen to share their cloth publicly. Entry content stays private — only the pattern is visible.
        </p>
      </div>

      {FAMILIES.map((family, fi) => (
        <div key={fi} style={{ marginBottom: 64 }}>
          <div style={{ padding: '0 56px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="hl-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone)' }}>{family.name}</span>
            <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              since {family.year} · {family.entries.toLocaleString()} entries
            </span>
          </div>
          <TapestryCanvas
            width={typeof window !== 'undefined' ? window.innerWidth : 1280}
            height={120}
            entries={makeEntries(fi, Math.min(family.entries, 200))}
            kind="specimen"
            animate
            opts={{ tStart: new Date(family.year, 0, 1), tEnd: new Date(2026, 0, 1), background: '#0e0e0c', warpEvery: 10 }}
          />
        </div>
      ))}

      <div style={{ padding: '64px 56px 96px', borderTop: '1px solid var(--rule)' }}>
        <Link to="/signup" className="hl-btn">Start your thread — free</Link>
      </div>
    </div>
  );
}
