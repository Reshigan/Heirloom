import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFocusTrap } from '../../lib/useFocusTrap';
const WIZARD_KEY = 'hl-pwa-onboarded-v1';

interface Step {
  eyebrow: string;
  heading: string;
  body: string;
  visual?: 'cloth' | 'write' | 'seal' | 'trigger';
  cta?: string;
  ctaTo?: string;
}

const STEPS: Step[] = [
  {
    eyebrow: 'the sealed letter',
    heading: 'There is someone who needs to read this. Just not yet.',
    body: "Write a letter today — for your daughter's wedding, your son's eighteenth birthday, the grandchild not yet born. Heirloom holds it safe and delivers it exactly when you choose.",
    visual: 'seal',
  },
  {
    eyebrow: 'choose the moment',
    heading: 'A date. A milestone. Your death. Their eighteenth birthday.',
    body: 'Every sealed letter has a trigger. Set it once and forget it. When the moment arrives — years or decades from now — the letter finds them. No account required on their end.',
    visual: 'trigger',
  },
  {
    eyebrow: 'the cloth',
    heading: 'Every word you write becomes a permanent thread.',
    body: 'As your family writes, the cloth grows — a living record that belongs to your bloodline, not a platform. Your descendants will read this long after you. The thread never ends.',
    visual: 'cloth',
    cta: 'Write your first sealed letter →',
    ctaTo: '/compose',
  },
];

function WizardVisual({ kind }: { kind: 'cloth' | 'write' | 'seal' | 'trigger' | undefined }) {
  if (kind === 'cloth') {
    return null;
  }

  if (kind === 'seal') {
    return (
      <div style={{ margin: '24px 0', padding: '16px 18px', borderLeft: '2px solid var(--warm)', border: '1px solid var(--rule)', borderLeftWidth: 2, borderLeftColor: 'var(--warm)' }}>
        <div className="hl-mono" style={{ fontSize: 8.5, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 10 }}>
          sealed · for Clara · opens: her wedding day
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="hl-serif" style={{ fontSize: 22, fontWeight: 300, color: 'var(--warm)', lineHeight: 1 }}>∞</span>
          <span className="hl-serif" style={{ fontSize: 13, fontWeight: 300, fontStyle: 'italic', color: 'var(--bone-dim)' }}>
            a letter from Margaret — written today
          </span>
        </div>
        <div className="hl-mono" style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm-dim)', marginTop: 10 }}>
          awaiting · est. {new Date().getFullYear() + 18}
        </div>
      </div>
    );
  }

  if (kind === 'trigger') {
    const triggers = [
      { label: 'on a specific date', hint: `14 June ${new Date().getFullYear() + 18}`, active: false },
      { label: 'on their 18th birthday', hint: 'milestone', active: true },
      { label: 'on my death', hint: 'testament', active: false },
      { label: 'on a named event', hint: 'their wedding', active: false },
    ];
    return (
      <div style={{ margin: '24px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {triggers.map(t => (
          <div key={t.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px',
            border: `1px solid ${t.active ? 'var(--rule-warm)' : 'var(--rule)'}`,
            borderLeft: `2px solid ${t.active ? 'var(--warm)' : 'transparent'}`,
          }}>
            <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.active ? 'var(--warm)' : 'var(--bone-faint)' }}>
              {t.label}
            </span>
            <span className="hl-mono" style={{ fontSize: 9, letterSpacing: '0.12em', color: t.active ? 'var(--warm-dim)' : 'var(--bone-faint)', opacity: 0.7 }}>
              {t.hint}
            </span>
          </div>
        ))}
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
  const dialogRef = useRef<HTMLDivElement>(null);
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

  // focus trap + Escape-to-skip (keyboard)
  useFocusTrap(dialogRef, skip, true);

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
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, [advance, step]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-wizard-heading"
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
              background: i <= step ? 'var(--bone-dim)' : 'var(--rule)',
              transition: 'background 360ms var(--ease)',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflowY: 'auto' }}>
        <div className="hl-eyebrow" style={{ marginBottom: 14, color: 'var(--warm)' }}>{current.eyebrow}</div>

        <h2
          id="pwa-wizard-heading"
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
