import { Link } from 'react-router-dom';
import { Frame } from '../components/Frame';
import { TapestryCanvas } from '../components/TapestryCanvas';
import { useListener } from '../../hooks/useListener';
import { useTapestryEntries } from '../../hooks/useTapestryEntries';

export function Today() {
  const prompt = useListener();
  const entries = useTapestryEntries();

  // Last 3 unique contributors from entries (most recent first)
  const contributors = [...new Map(
    [...entries].reverse().map(e => [e.author, e])
  ).values()].slice(0, 3);

  return (
    <Frame left="today">
      <div style={{ padding: '72px 56px 0', maxWidth: 720 }}>

        {/* eyebrow */}
        <div className="hl-eyebrow loom-today-eyebrow" style={{ marginBottom: 24 }}>
          tonight · 8 pm
        </div>

        {/* daily prompt — the Listener */}
        <h1
          className="hl-serif hl-tight loom-today-headline"
          style={{
            fontSize: 'clamp(26px, 4vw, 38px)',
            fontWeight: 300,
            lineHeight: 1.15,
            margin: 0,
            color: 'var(--bone)',
            fontVariationSettings: '"opsz" 36',
          }}
        >
          {prompt}
        </h1>

        {/* write now CTA */}
        <div className="loom-today-cta" style={{ marginTop: 40 }}>
          <Link to="/loom/compose" className="hl-btn">
            write now
          </Link>
        </div>

        {/* family strip — last 3 contributors */}
        {contributors.length > 0 && (
          <div className="loom-today-family" style={{ marginTop: 64, borderTop: '1px solid var(--rule)', paddingTop: 24 }}>
            <div className="hl-eyebrow" style={{ marginBottom: 16 }}>recent voices</div>
            <div style={{ display: 'flex', gap: 32 }}>
              {contributors.map((c, i) => (
                <span
                  key={i}
                  className="hl-mono"
                  style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                >
                  {String(c.author ?? '').slice(0, 6)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* animated cloth strip — full width, pinned to bottom */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 8 }}>
        <TapestryCanvas
          width={typeof window !== 'undefined' ? window.innerWidth : 1280}
          height={72}
          entries={entries}
          kind="full"
          animate
          opts={{
            tStart: new Date(2019, 0, 1),
            tEnd: new Date(2028, 0, 1),
            nowFrac: 0.88,
            background: '#0e0e0c',
            warpEvery: 10,
            showFraySelvedge: true,
          }}
        />
      </div>
    </Frame>
  );
}
