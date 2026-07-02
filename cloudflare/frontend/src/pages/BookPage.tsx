import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { CosmicHeader, WaxSeal } from '../loom/cosmic/CosmicUI';
import { captureWater } from '../loom/water/capture';

// The binding configuration the volume carries into the builder. Display-only
// here — the live selection, pricing and checkout live in /book-builder. These
// quiet rows are the threshold to that flow (the reference's Copies / Order /
// Chapters ledger), kept as the page's standing summary of how it'll be bound.
const bindConfig: { label: string; value: string }[] = [
  { label: 'Copies', value: '1' },
  { label: 'Order', value: 'Chronological' },
  { label: 'Chapters', value: 'By decade' },
];

export function BookPage() {
  const navigate = useNavigate();

  // The cover IS the colour the family's water was the day it was printed —
  // grab a still of the live dye-bath on mount. '' when no water is live
  // (light theme / reduced-motion), so the hairline-rule cover stands in.
  const [cover, setCover] = useState('');
  useEffect(() => {
    setCover(captureWater());
  }, []);

  // PREVIEW — step into the live binding flow (preserves the page's only wired
  // navigation, the route to /book-builder).
  const preview = () => navigate('/book-builder');

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'the book' }]} />}
     
    >
      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'var(--page-max-focus)',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* mono eyebrow → serif title (centred ceremony) */}
        <CosmicHeader eyebrow="The Book" title="Bind your thread" align="center" />

        {/* glowing book illustration — warm-outline volume.
            content, not backdrop (the bound-book glow that IS the data). */}
        <div
          aria-hidden
          style={{
            position: 'relative',
            width: 168,
            height: 196,
            margin: '8px 0 64px',
          }}
        >
          {/* spine — the bound edge */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 6,
              bottom: 6,
              width: 14,
              border: '1px solid var(--warm)',
              borderRight: 'none',
              background: 'transparent',
            }}
          />
          {/* cover face — printed with the colour the water was on mount */}
          <div
            style={{
              position: 'absolute',
              left: 14,
              top: 0,
              right: 0,
              bottom: 0,
              border: '1px solid var(--warm)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              padding: 18,
              backgroundImage: cover ? `url(${cover})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* ponytail: cover cue is a hairline rule, not a 2nd ∞ — WaxSeal at the foot is the sole infinity mark */}
            <span
              aria-hidden
              style={{
                width: 30,
                height: 1,
                background: 'var(--rule)',
              }}
            />
          </div>
        </div>

        {/* binding config — hairline ledger rows: mono label left, warm value right */}
        <div style={{ width: '100%', maxWidth: 360, borderTop: '1px solid var(--rule)', marginBottom: 56 }}>
          {bindConfig.map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 20,
                padding: '17px 0',
                borderBottom: '1px solid var(--rule)',
              }}
            >
              <span
                className="hl-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  textTransform: 'lowercase',
                  color: 'var(--bone-faint)',
                }}
              >
                {label}
              </span>
              <span
                className="hl-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  color: 'var(--gold-text)',
                  whiteSpace: 'nowrap',
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* outlined PREVIEW pill — steps into the live builder */}
        <button
          type="button"
          onClick={preview}
          className="hl-mono hl-cta-warm"
          style={{
            background: 'transparent',
            border: '1px solid var(--warm)',
            borderRadius: 0,
            padding: '15px 56px',
            cursor: 'pointer',
            fontSize: 11,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'var(--warm)',
          }}
        >
          Preview
        </button>

        {/* quiet foot link — the full binding flow */}
        <Link
          to="/book-builder"
          className="hl-mono"
          style={{
            marginTop: 28,
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 44,
            padding: '12px 0',
          }}
        >
          build your book
        </Link>

        {/* wax seal foot */}
        <div style={{ marginTop: 64 }}>
          <WaxSeal size={22} />
        </div>
      </div>
    </ClothShell>
  );
}
