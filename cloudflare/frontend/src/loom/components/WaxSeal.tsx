/**
 * WaxSeal — the opening ceremony for sealed letters.
 *
 * The most emotionally important interaction in the product.
 * A 1400ms ceremony: the seal cracks, fragments fall, letter reveals.
 *
 * States:
 *   sealed   — full wax disc, warm glow, ∞ mark pressed in, glows on hover
 *   cracking — SVG hairlines radiate from center, fragments fall
 *   open     — seal gone, onOpened() fires
 */
import { useState, useEffect, useRef } from 'react';

type SealState = 'sealed' | 'cracking' | 'open';

interface Props {
  onOpened?: () => void;
  alreadyOpened?: boolean;
  label?: string;
  size?: number;
}

// Six crack angles in radians
const CRACK_ANGLES = [
  0,
  Math.PI / 3,
  (2 * Math.PI) / 3,
  Math.PI,
  (4 * Math.PI) / 3,
  (5 * Math.PI) / 3,
];

// Fragment drift vectors and rotations
const FRAGMENTS = [
  { tx: -7,  ty: -11, r:  -9  },
  { tx:  9,  ty:  -7, r:  13  },
  { tx: 11,  ty:   5, r:  -6  },
  { tx:  5,  ty:  11, r: -15  },
  { tx: -9,  ty:   9, r:   7  },
  { tx: -7,  ty:  -5, r:  11  },
];

// Wedge points for SVG clipPath (6 equal segments)
function wedgePts(i: number, cx: number, cy: number, r: number): string {
  const step = (Math.PI * 2) / 6;
  const a0 = (i - 0.5) * step - Math.PI / 2;
  const a1 = (i + 0.5) * step - Math.PI / 2;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  return `${cx},${cy} ${x0.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
}

export function WaxSeal({ onOpened, alreadyOpened = false, label, size = 120 }: Props) {
  const [state, setState] = useState<SealState>(alreadyOpened ? 'open' : 'sealed');
  const [crackProg, setCrackProg] = useState(0);
  const [fragVisible, setFragVisible] = useState(false);
  const rafRef = useRef<number>(0);

  const beginCeremony = () => {
    if (state !== 'sealed') return;
    setState('cracking');
    setFragVisible(true);

    // Animate crack lines 0→1 over 400ms
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 400, 1);
      setCrackProg(p);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    // Fragments fall, seal vanishes at 720ms; ceremony completes at 1400ms
    setTimeout(() => {
      setFragVisible(false);
    }, 720);
    setTimeout(() => {
      setState('open');
      onOpened?.();
    }, 1400);
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  if (state === 'open') return null;

  const ease = 'cubic-bezier(0.16,1,0.3,1)';
  const cracking = state === 'cracking';
  const s = size;
  const cx = s / 2, cy = s / 2, r = s * 0.475;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, userSelect: 'none' }}>
      <button
        type="button"
        onClick={beginCeremony}
        aria-label="Open sealed letter"
        style={{
          position: 'relative',
          width: s, height: s,
          border: 'none', background: 'transparent',
          cursor: cracking ? 'default' : 'pointer',
          padding: 0, outline: 'none',
        }}
      >
        {/* ── Fragments (during crack) ── */}
        {cracking && fragVisible && FRAGMENTS.map((_f, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 34%, #cf935a 0%, #b07a4a 35%, #8c5a30 68%, #6b3a1a 100%)',
              clipPath: `polygon(${wedgePts(i, 50, 50, 50).split(',').map(p => p + '%').join(', ').replace(/(\d+\.?\d*)%,(\d+\.?\d*)%/g, '$1% $2%')})`,
              animation: `hl-frag-${i} 720ms ${i * 60}ms ${ease} forwards`,
              transformOrigin: '50% 50%',
            }}
          />
        ))}

        {/* ── Crack SVG (during crack) ── */}
        {cracking && (
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 4, pointerEvents: 'none' }}
            viewBox={`0 0 ${s} ${s}`}
          >
            {CRACK_ANGLES.map((angle, i) => {
              const x2 = cx + Math.cos(angle) * r * crackProg;
              const y2 = cy + Math.sin(angle) * r * crackProg;
              return (
                <line
                  key={i}
                  x1={cx} y1={cy}
                  x2={x2.toFixed(1)} y2={y2.toFixed(1)}
                  stroke="#3a1a08"
                  strokeWidth="0.7"
                  opacity="0.85"
                />
              );
            })}
          </svg>
        )}

        {/* ── Static disc (sealed state) ── */}
        {!cracking && (
          <span
            className="hl-seal-disc"
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 34%, #cf935a 0%, #b07a4a 35%, #8c5a30 68%, #6b3a1a 100%)',
              boxShadow: '0 2px 0 rgba(255,255,255,0.08) inset, 0 4px 24px rgba(156,101,53,0.35), 0 1px 0 rgba(0,0,0,0.4) inset',
              transition: `transform 180ms ${ease}, box-shadow 180ms ${ease}`,
            }}
          />
        )}

        {/* ── ∞ mark ── */}
        {!cracking && (
          <span style={{
            position: 'absolute', inset: 0, zIndex: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--serif)',
            fontSize: s * 0.30,
            fontWeight: 200,
            fontVariationSettings: '"opsz" 72, "wght" 200',
            color: 'rgba(107,58,26,0.72)',
            textShadow: '0 1px 0 rgba(255,255,255,0.14)',
            pointerEvents: 'none',
          }}>
            ∞
          </span>
        )}

        {/* Fragment keyframe styles + hover */}
        <style>{`
          ${FRAGMENTS.map((f, i) => `
            @keyframes hl-frag-${i} {
              0%   { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
              40%  { transform: translate(${f.tx}px, ${f.ty}px) rotate(${f.r}deg) scale(1.04); opacity: 0.85; }
              100% { transform: translate(${f.tx * 2.4}px, ${f.ty * 2.4 + 10}px) rotate(${f.r * 1.8}deg) scale(0.7); opacity: 0; }
            }
          `).join('')}
          button:hover .hl-seal-disc {
            transform: scale(1.04);
            box-shadow: 0 2px 0 rgba(255,255,255,0.10) inset, 0 6px 32px rgba(156,101,53,0.50), 0 1px 0 rgba(0,0,0,0.4) inset;
          }
        `}</style>
      </button>

      {label && state === 'sealed' && (
        <p style={{
          margin: 0,
          fontFamily: 'var(--mono)', fontSize: 10,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--bone-faint)', textAlign: 'center',
        }}>{label}</p>
      )}

      {state === 'sealed' && (
        <p style={{
          margin: 0,
          fontFamily: 'var(--mono)', fontSize: 9,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--bone-ghost)',
        }}>press to open</p>
      )}
    </div>
  );
}
