import { LoomShell } from '../components/LoomShell';
import { Frame } from '../components/Frame';
import { ELEANOR_TIED } from '../data/mock';

/**
 * Screen 04 — Tied Off
 *
 * All time-locked entries arranged on the future horizon. The strip
 * across the top is a 50-year ribbon; each ∞ glyph marks one tied
 * thread, positioned at when it'll come back into the cloth.
 *
 * Below: a four-up grid of cards with date / recipient / kind /
 * remaining time. Each card has a single ∞ glyph in the top right
 * corner — the only icon the product uses.
 */
export function TiedOff() {
  return (
    <LoomShell>
      <Frame active="tied">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '44px 80px 0',
            display: 'grid',
            gridTemplateRows: 'auto auto 1fr',
            gap: 32,
          }}
        >
          <div>
            <div className="loom-eyebrow">tied off · {ELEANOR_TIED.length * 2} threads waiting</div>
            <div
              className="loom-h2"
              style={{ fontSize: 44, marginTop: 12, fontStyle: 'italic', fontWeight: 300 }}
            >
              sealed against time
            </div>
            <div
              className="loom-body loom-dim"
              style={{ fontSize: 15, fontStyle: 'italic', marginTop: 8, maxWidth: 620 }}
            >
              each is a thread tied off at the loom's edge. when its date arrives, the loom unties
              it and weaves it back into the cloth — for whoever is reading then.
            </div>
          </div>

          {/* horizon ribbon */}
          <div
            style={{
              position: 'relative',
              height: 64,
              borderTop: '1px solid var(--loom-rule)',
              borderBottom: '1px solid var(--loom-rule)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: '26%',
                background: 'linear-gradient(to right, rgba(244,236,216,0.06), rgba(244,236,216,0.02))',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '26%',
                top: 0,
                bottom: 0,
                width: 1,
                background: 'var(--loom-warm)',
                opacity: 0.5,
              }}
            />
            <div
              className="loom-mono"
              style={{
                position: 'absolute',
                left: '26%',
                top: -16,
                transform: 'translateX(-50%)',
                fontSize: 10,
                color: 'var(--loom-warm)',
              }}
            >
              today
            </div>
            {ELEANOR_TIED.map((it, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `calc(26% + ${it.weft * 70}%)`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'grid',
                  justifyItems: 'center',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    color: 'var(--loom-warm)',
                    fontFamily: "'Source Serif 4', serif",
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                >
                  ∞
                </div>
                <div className="loom-mono" style={{ fontSize: 9, color: 'var(--loom-bone-faint)' }}>
                  {it.date.slice(0, 4)}
                </div>
              </div>
            ))}
            <div
              className="loom-mono"
              style={{
                position: 'absolute',
                right: 0,
                top: -16,
                fontSize: 10,
                color: 'var(--loom-bone-faint)',
              }}
            >
              +50 yrs
            </div>
          </div>

          {/* card grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 24,
              alignContent: 'start',
              overflowY: 'auto',
              paddingBottom: 80,
            }}
          >
            {ELEANOR_TIED.map((it, i) => (
              <TiedCard key={i} {...it} />
            ))}
          </div>
        </div>
      </Frame>
    </LoomShell>
  );
}

interface TiedCardProps {
  date: string;
  recip: string;
  years: string;
  kind: string;
}

function TiedCard({ date, recip, years, kind }: TiedCardProps) {
  return (
    <div
      style={{
        border: '1px solid var(--loom-rule)',
        padding: '26px 22px',
        background: 'rgba(8,8,6,0.35)',
        position: 'relative',
        display: 'grid',
        gap: 14,
        minHeight: 168,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -10,
          right: 18,
          background: 'var(--loom-ink)',
          padding: '0 8px',
          color: 'var(--loom-warm)',
          fontFamily: "'Source Serif 4', serif",
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ∞
      </div>
      <div className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-warm)' }}>
        {date}
      </div>
      <div
        className="loom-serif"
        style={{
          fontVariationSettings: "'opsz' 28",
          fontSize: 19,
          fontStyle: 'italic',
          fontWeight: 400,
          lineHeight: 1.3,
        }}
      >
        {recip}
      </div>
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span className="loom-eyebrow" style={{ fontSize: 9 }}>
          {kind}
        </span>
        <span className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)' }}>
          {years}
        </span>
      </div>
    </div>
  );
}
