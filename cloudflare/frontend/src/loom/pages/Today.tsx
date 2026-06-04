import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Frame } from '../components/Frame';
import { TapestryCanvas } from '../components/TapestryCanvas';
import { useListener } from '../../hooks/useListener';
import { useTapestryEntries } from '../../hooks/useTapestryEntries';

export function Today() {
  const prompt = useListener();
  const entries = useTapestryEntries();
  const [revealed, setRevealed] = useState(false);
  const [vpW, setVpW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const sync = () => setVpW(window.innerWidth);
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  // Last 3 unique contributors from entries (most recent first)
  const contributors = [...new Map(
    [...entries].reverse().map(e => [e.author, e])
  ).values()].slice(0, 3);

  const ease = 'cubic-bezier(0.16,1,0.3,1)';
  const nowFrac = (() => {
    const now = new Date();
    const start = new Date(2019, 0, 1);
    const end   = new Date(2028, 0, 1);
    return Math.max(0, Math.min(1, (+now - +start) / (+end - +start)));
  })();

  return (
    <Frame left="today">
      {/* ── Content: top third of screen ── */}
      <div style={{
        padding: 'clamp(36px, 7vw, 64px) clamp(20px, 6vw, 56px) 0',
        maxWidth: 680,
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
      }}>
        {/* eyebrow: tonight's prompt time */}
        <div
          className="hl-eyebrow loom-today-eyebrow"
          style={{ marginBottom: 22 }}
        >
          tonight · 8 pm
        </div>

        {/* The Listener's daily question */}
        <h1
          className="hl-serif hl-tight loom-today-headline"
          style={{
            fontSize: 'clamp(24px, 3.6vw, 40px)',
            fontWeight: 300,
            lineHeight: 1.14,
            margin: 0,
            color: 'var(--bone)',
            fontVariationSettings: '"opsz" 40',
          }}
        >
          {prompt}
        </h1>

        {/* CTA */}
        <div className="loom-today-cta" style={{ marginTop: 36, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/compose" className="hl-btn">write now</Link>
          <Link
            to="/record"
            style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.20em', textTransform: 'uppercase',
              color: 'var(--bone-dim)', textDecoration: 'none',
              borderBottom: '1px solid var(--rule)', paddingBottom: 1,
            }}
          >
            or speak →
          </Link>
        </div>

        {/* Recent voices */}
        {contributors.length > 0 && (
          <div
            className="loom-today-family"
            style={{ marginTop: 52, borderTop: '1px solid var(--rule)', paddingTop: 20,
              opacity: revealed ? 1 : 0, transition: `opacity 1400ms ${ease}`, transitionDelay: '360ms' }}
          >
            <div className="hl-eyebrow" style={{ marginBottom: 12 }}>recent voices</div>
            <div style={{ display: 'flex', gap: 28 }}>
              {contributors.map((c) => (
                <span key={c.author} className="hl-mono" style={{ fontSize: 12, color: 'var(--bone-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {String(c.author ?? '').slice(0, 8)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Cloth: fills the bottom portion of the screen ── */}
      {/* Outer container pinned bottom; cloth height = 200px so it breathes */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 8,
          opacity: revealed ? 1 : 0,
          transition: `opacity 1400ms ${ease}`,
          transitionDelay: '720ms',
        }}
      >
        <TapestryCanvas
          width={vpW}
          height={200}
          entries={entries}
          kind="full"
          animate
          opts={{
            tStart: new Date(2019, 0, 1),
            tEnd:   new Date(2028, 0, 1),
            nowFrac,
            background: '#0e0e0c',
            warpEvery: 10,
            showFraySelvedge: true,
            showWarpHair: true,
            showDecadeMarks: true,
          }}
        />
      </div>
    </Frame>
  );
}
