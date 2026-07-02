// DeepIntro — the marketing entrance: a drop falls into the water and the
// page opens through the ripple. Randomized per visitor (dye, drop path,
// waterline, timing) so no two arrivals are identical. The impact dispatches
// `deep:settled`, so the REAL WebGL water behind the veil ripples in sync.
//
// Choreography (≈2.3s, all on the one brand curve):
//   0ms      ink veil holds; HEIRLOOM rises letter-by-letter (rotateX flip)
//   ~120ms   the drop falls (accelerating, slight stretch)
//   ~780ms   impact — waterline swells, sounding rings expand, real water ripples
//   ~980ms   the veil dissolves; the page settles in from a 3D tilt
//
// Skips: prefers-reduced-motion, a same-session revisit, or any tap/keypress.
import { useEffect, useMemo, useState } from 'react';
import { DYES, dyeVar } from '../dye';
import { EASE } from '../motion';

const SEEN_KEY = 'hl-intro-done';

export function shouldPlayIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try { if (sessionStorage.getItem(SEEN_KEY)) return false; } catch { /* private mode */ }
  return true;
}

export function DeepIntro({ onDone }: { onDone: () => void }) {
  // One roll of the dice per arrival — different dye, entry point, and cadence
  // for every visitor.
  const rand = useMemo(() => {
    const dye = DYES[Math.floor(Math.random() * DYES.length)];
    return {
      tint: dyeVar(dye),
      dropX: 42 + Math.random() * 16,        // vw — where the drop enters
      lineY: 44 + Math.random() * 6,         // vh — where the surface rests
      fall: 620 + Math.random() * 180,       // ms — how long it falls
      jitter: Math.random() * 90,            // ms — letter-stagger seed
    };
  }, []);

  const [phase, setPhase] = useState<'falling' | 'rippling' | 'lifting'>('falling');

  const finish = useMemo(() => () => {
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode */ }
    onDone();
  }, [onDone]);

  useEffect(() => {
    const impact = window.setTimeout(() => {
      setPhase('rippling');
      // the intro's drop disturbs the real water behind the veil
      window.dispatchEvent(new CustomEvent('deep:settled'));
    }, rand.fall + 160);
    const lift = window.setTimeout(() => setPhase('lifting'), rand.fall + 360);
    const done = window.setTimeout(finish, rand.fall + 360 + 1400);
    return () => { clearTimeout(impact); clearTimeout(lift); clearTimeout(done); };
  }, [rand.fall, finish]);

  // any interaction opens the page immediately
  useEffect(() => {
    const skip = () => finish();
    window.addEventListener('pointerdown', skip);
    window.addEventListener('keydown', skip);
    return () => { window.removeEventListener('pointerdown', skip); window.removeEventListener('keydown', skip); };
  }, [finish]);

  const letters = 'heirloom'.split('');
  const rippling = phase !== 'falling';

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'var(--ink)',
        opacity: phase === 'lifting' ? 0 : 1,
        transition: `opacity 1400ms ${EASE}`,
        pointerEvents: phase === 'lifting' ? 'none' : 'auto',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes hl-intro-letter {
          from { opacity: 0; transform: translateY(0.9em) rotateX(-80deg); }
          to   { opacity: 1; transform: translateY(0) rotateX(0); }
        }
        @keyframes hl-intro-fall {
          0%   { transform: translateY(-46vh) scaleY(1); opacity: 0; }
          12%  { opacity: 1; }
          100% { transform: translateY(0) scaleY(1.45); opacity: 1; }
        }
        @keyframes hl-intro-ring {
          from { transform: translate(-50%, -50%) scale(0.12); opacity: 0.9; }
          to   { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
        @keyframes hl-intro-swell {
          0% { transform: scaleY(1); }
          30% { transform: scaleY(2.6); }
          100% { transform: scaleY(1); }
        }
      `}</style>

      {/* the name rises the way the vantax letters do — but in the family serif */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: `${rand.lineY - 22}vh`,
        display: 'flex', justifyContent: 'center', gap: '0.06em',
        perspective: 1000,
        opacity: rippling ? 0 : 1,
        transition: `opacity 720ms ${EASE}`,
      }}>
        {letters.map((ch, i) => (
          <span key={i} style={{
            fontFamily: 'var(--serif-display)', fontWeight: 340,
            fontSize: 'clamp(28px, 6vw, 44px)', color: 'var(--bone)',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            display: 'inline-block', transformOrigin: '50% 100%',
            opacity: 0,
            animation: `hl-intro-letter 700ms ${EASE} ${i * 55 + rand.jitter}ms both`,
          }}>{ch}</span>
        ))}
      </div>

      {/* the falling drop */}
      <span style={{
        position: 'absolute', left: `${rand.dropX}vw`, top: `calc(${rand.lineY}vh - 5px)`,
        width: 9, height: 9, marginLeft: -4.5, borderRadius: '50%',
        background: rand.tint,
        boxShadow: `0 0 18px color-mix(in srgb, ${rand.tint} 60%, transparent)`,
        animation: `hl-intro-fall ${rand.fall}ms cubic-bezier(0.5, 0, 0.9, 0.6) 160ms both`,
        opacity: rippling ? 0 : undefined,
        transition: 'opacity 180ms linear',
      }} />

      {/* the surface — one hairline that swells at impact */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: `${rand.lineY}vh`, height: 1,
        background: 'linear-gradient(90deg, transparent 4%, var(--rule) 22%, rgba(242,230,208,0.3) 50%, var(--rule) 78%, transparent 96%)',
        transformOrigin: `${rand.dropX}vw 50%`,
        animation: rippling ? `hl-intro-swell 1400ms ${EASE} both` : undefined,
      }} />

      {/* sounding rings at the point of entry */}
      {rippling && [0, 1, 2].map(i => (
        <span key={i} style={{
          position: 'absolute', left: `${rand.dropX}vw`, top: `${rand.lineY}vh`,
          width: '58vmin', height: '58vmin', borderRadius: '50%',
          border: `1px solid color-mix(in srgb, ${rand.tint} ${55 - i * 15}%, transparent)`,
          transform: 'translate(-50%, -50%) scale(0.12)',
          animation: `hl-intro-ring 1400ms ${EASE} ${i * 180}ms both`,
        }} />
      ))}
    </div>
  );
}
