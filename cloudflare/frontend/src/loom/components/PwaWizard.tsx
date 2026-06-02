import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TapestryCanvas } from './TapestryCanvas';
import type { CanvasEntry } from './TapestryCanvas';

const WIZARD_KEY = 'hl-pwa-onboarded-v1';

// Sample cloth entries to animate in the cloth step
const DEMO_ENTRIES: CanvasEntry[] = [
  { date: new Date(2021, 3, 12), n: 1,  dye: 'madder',    tier: 'family' },
  { date: new Date(2021, 7, 5),  n: 2,  dye: 'woad',      tier: 'family' },
  { date: new Date(2022, 0, 18), n: 3,  dye: 'saffron',   tier: 'family' },
  { date: new Date(2022, 5, 3),  n: 4,  dye: 'indigo',    tier: 'family' },
  { date: new Date(2022, 10, 25),n: 5,  dye: 'cochineal', tier: 'family' },
  { date: new Date(2023, 2, 8),  n: 6,  dye: 'weld',      tier: 'family' },
  { date: new Date(2023, 8, 14), n: 7,  dye: 'kermes',    tier: 'family' },
  { date: new Date(2024, 1, 22), n: 8,  dye: 'madder',    tier: 'family' },
  { date: new Date(2024, 6, 9),  n: 9,  dye: 'walnut',    tier: 'descendants' },
  { date: new Date(2025, 4, 30), n: 10, dye: 'indigo',    tier: 'family' },
];

interface Step {
  eyebrow: string;
  heading: string;
  body: string;
  visual?: 'cloth' | 'write' | 'seal';
  cta?: string;
  ctaTo?: string;
}

const STEPS: Step[] = [
  {
    eyebrow: 'welcome',
    heading: 'Your family’s thousand-year thread starts here.',
    body: 'Heirloom is a perpetual, append-only archive owned by your bloodline — not a platform. Every word you write today is a permanent thread in your family’s cloth.',
    visual: 'write',
  },
  {
    eyebrow: 'write',
    heading: 'Leave a piece of yourself behind, daily.',
    body: 'A memory. A letter. A voice note. Write for yourself, for family, for a friend — or for someone not yet born. Each entry is woven into the cloth and can never be deleted.',
    visual: 'write',
  },
  {
    eyebrow: 'the cloth',
    heading: 'Every entry becomes a thread in an infinite tapestry.',
    body: 'As you and your family write, the cloth grows richer. Each coloured line is a real entry — a story, a thought, a day worth keeping. Your descendants will read this cloth long after you.',
    visual: 'cloth',
  },
  {
    eyebrow: 'family',
    heading: 'Invite your bloodline.',
    body: 'Add family members — each weaves their own voice into the same cloth. Everyone writes from their own perspective. The thread belongs to no one person.',
    visual: 'write',
  },
  {
    eyebrow: 'sealed time',
    heading: 'Lock entries for the future.',
    body: 'Write something today and seal it — to open in ten years, on a grandchild’s eighteenth birthday, or a date you choose. The Listener holds it safe until then.',
    visual: 'seal',
    cta: 'begin weaving →',
    ctaTo: '/compose',
  },
];

function WizardVisual({ kind }: { kind: 'cloth' | 'write' | 'seal' | undefined }) {
  const w = typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 420) : 360;

  if (kind === 'cloth') {
    return (
      <div style={{ margin: '24px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', overflow: 'hidden' }}>
        <TapestryCanvas
          width={w}
          height={88}
          entries={DEMO_ENTRIES}
          kind="specimen"
          animate
          opts={{ background: 'var(--ink, #0e0e0c)', warpEvery: 7 }}
        />
      </div>
    );
  }

  if (kind === 'seal') {
    return (
      <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 300, color: 'var(--warm)' }}>∞</span>
        </div>
        <div>
          <div className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>sealed · opens 2044</div>
          <div className="hl-serif" style={{ fontSize: 13, color: 'var(--bone-dim)', marginTop: 4, fontWeight: 300, fontStyle: 'italic' }}>
            a letter to my grandchildren
          </div>
        </div>
      </div>
    );
  }

  // write visual — a faint paper/entry mockup
  return (
    <div style={{ margin: '24px 0', padding: '16px 20px', border: '1px solid var(--rule)', opacity: 0.7 }}>
      <div className="hl-mono" style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 10 }}>for myself · today</div>
      <div className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)', lineHeight: 1.65, fontWeight: 300, fontStyle: 'italic' }}>
        "Today I learned that the fig tree we planted in 2012 is still standing in the backyard. I thought about my father every time I walked past it…"
      </div>
      <div style={{ marginTop: 10, height: 1, background: 'var(--rule)', opacity: 0.4 }} />
      <div className="hl-mono" style={{ fontSize: 9, color: 'var(--warm)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 8, opacity: 0.8 }}>
        weave into cloth →
      </div>
    </div>
  );
}

export function PwaWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const advance = useCallback(() => {
    if (isLast) {
      localStorage.setItem(WIZARD_KEY, '1');
      onDone();
    } else {
      setStep(s => s + 1);
    }
  }, [isLast, onDone]);

  const skip = useCallback(() => {
    localStorage.setItem(WIZARD_KEY, '1');
    onDone();
  }, [onDone]);

  // swipe-to-advance (touch)
  useEffect(() => {
    let startX = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx < -50) advance();
      if (dx > 50 && step > 0) setStep(s => s - 1);
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd); };
  }, [advance, step]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'var(--ink)',
        display: 'flex', flexDirection: 'column',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--warm)' }}>
          heirloom
        </span>
        <button
          type="button"
          onClick={skip}
          style={{ background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)', padding: '8px 0', minHeight: 36 }}
        >
          skip
        </button>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              height: 1,
              flex: 1,
              background: i <= step ? 'var(--warm)' : 'var(--rule)',
              transition: 'background 360ms var(--ease)',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflowY: 'auto' }}>
        <div className="hl-eyebrow" style={{ marginBottom: 14, color: 'var(--warm)' }}>{current.eyebrow}</div>

        <h2
          className="hl-serif hl-tight"
          style={{
            fontSize: 'clamp(22px, 6vw, 30px)',
            fontWeight: 300,
            color: 'var(--bone)',
            margin: '0 0 16px',
            letterSpacing: '-0.016em',
            lineHeight: 1.25,
          }}
        >
          {current.heading}
        </h2>

        <WizardVisual kind={current.visual} />

        <p
          className="hl-serif"
          style={{
            fontSize: 'clamp(14px, 4vw, 16px)',
            fontWeight: 300,
            color: 'var(--bone-dim)',
            lineHeight: 1.7,
            margin: '0 0 28px',
          }}
        >
          {current.body}
        </p>
      </div>

      {/* Bottom navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
        <button
          type="button"
          onClick={() => step > 0 && setStep(s => s - 1)}
          style={{
            background: 'transparent', border: 0, cursor: step > 0 ? 'pointer' : 'default',
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: step > 0 ? 'var(--bone-dim)' : 'transparent',
            padding: '12px 0', minHeight: 44,
            transition: 'color 180ms var(--ease)',
          }}
        >
          ← back
        </button>

        <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.1em' }}>
          {step + 1} of {STEPS.length}
        </span>

        {isLast && current.ctaTo ? (
          <Link
            to={current.ctaTo}
            onClick={() => { localStorage.setItem(WIZARD_KEY, '1'); onDone(); }}
            className="hl-btn"
            style={{ fontSize: 12, padding: '12px 20px' }}
          >
            {current.cta ?? 'begin →'}
          </Link>
        ) : (
          <button
            type="button"
            onClick={advance}
            style={{
              background: 'transparent', border: 0, cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--warm)', padding: '12px 0', minHeight: 44,
            }}
          >
            next →
          </button>
        )}
      </div>
    </div>
  );
}

/** Returns true if this is the user's first PWA session */
export function shouldShowWizard(): boolean {
  if (typeof localStorage === 'undefined') return false;
  const standalone =
    (navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  return standalone && !localStorage.getItem(WIZARD_KEY);
}
