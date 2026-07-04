// FirstDescent — onboarding as the founding ceremony, not a slide deck.
// A brand-new Deep is empty black water. Instead of explaining the product,
// the first descent has the newcomer PERFORM its founding act: the listener
// asks one question, they answer in a line, and it truly settles — the real
// water ripples (deep:settled), blooms with their first dye (deep:bloom),
// and the entry is genuinely written to the Deep. Then the truths surface
// one by one as they dive, and the descent ends at the bed with the invite.
//
// No progress dots, no cards, no "next". Scroll is the descent.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { memoriesApi } from '../../services/api';
import { Verb } from './Verb';
import { SurfaceRing } from '../cosmic/CosmicUI';
import { EASE } from '../motion';

const KEY = 'hl-first-descent-v1';

export function shouldShowFirstDescent(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try { return !localStorage.getItem(KEY) && !localStorage.getItem('hl-pwa-onboarded-v1'); }
  catch { return false; }
}

const QUESTIONS = [
  'What is a smell that brings someone back?',
  'What did your mother always say?',
  'Where did your family feel most alive?',
  'What sound do you never want to forget?',
];

// A section that fades up as it enters the viewport of the descent scroller.
function Depth({ children, root }: { children: React.ReactNode; root: React.RefObject<HTMLDivElement> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { root: root.current, threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [root]);
  return (
    <div ref={ref} style={{
      minHeight: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '10vh 9vw', boxSizing: 'border-box',
      opacity: seen ? 1 : 0, transform: seen ? 'none' : 'translateY(26px)',
      transition: `opacity 1400ms ${EASE}, transform 1400ms ${EASE}`,
    }}>
      {children}
    </div>
  );
}

export function FirstDescent({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const scroller = useRef<HTMLDivElement>(null);
  const question = useMemo(() => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)], []);
  const [answer, setAnswer] = useState('');
  const [settled, setSettled] = useState(false);
  const [settling, setSettling] = useState(false);

  const finish = (to?: string) => {
    try { localStorage.setItem(KEY, '1'); } catch { /* private mode */ }
    onDone();
    if (to) navigate(to);
  };

  const settle = async () => {
    const body = answer.trim();
    if (!body || settling) return;
    setSettling(true);
    try {
      await memoriesApi.create({ title: body.length > 64 ? `${body.slice(0, 63)}…` : body, content: body, type: 'memory' });
    } catch { /* the ceremony continues even if the write must retry later */ }
    // the real water answers: ripple + first bloom
    window.dispatchEvent(new CustomEvent('deep:settled'));
    window.dispatchEvent(new CustomEvent('deep:bloom', { detail: { from: 0.3 } }));
    setSettled(true);
    setSettling(false);
    // carry them down to the next depth after the ripple breathes
    setTimeout(() => {
      const el = scroller.current;
      if (el) el.scrollTo({ top: el.clientHeight * 2, behavior: 'smooth' });
    }, 1800);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your first descent"
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(7,13,20,0.6)' }}
    >
      {/* a quiet way out, always */}
      <button
        type="button"
        onClick={() => finish()}
        style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 14px)', right: 18, zIndex: 2,
          background: 'transparent', border: 0, cursor: 'pointer', padding: '10px 4px', minHeight: 44,
          fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 14, color: 'var(--bone-faint)',
        }}
      >
        skip the descent
      </button>

      <div
        ref={scroller}
        style={{ position: 'absolute', inset: 0, overflowY: 'auto', scrollSnapType: 'y mandatory' }}
      >
        {/* I · the empty water */}
        <section style={{ height: '100%', scrollSnapAlign: 'start' }}>
          <Depth root={scroller}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 22 }}>
              your family's deep
            </div>
            <h1 style={{ fontFamily: 'var(--serif-display)', fontWeight: 340, fontSize: 'clamp(32px, 7.5vw, 52px)', lineHeight: 1.12, color: 'var(--bone)', margin: 0, maxWidth: '13em' }}>
              This water is <span style={{ color: 'var(--bone-dim)' }}>empty.</span>
            </h1>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 17, lineHeight: 1.65, color: 'var(--bone-dim)', margin: '20px 0 0', maxWidth: '27em' }}>
              The backdrop is the Deep itself — living water that stirs and takes
              on your family's colours as they speak into it. No one has yet. It
              begins with a single drop — yours.
            </p>
            <div style={{ marginTop: 48 }}>
              <Verb onClick={() => scroller.current?.scrollTo({ top: scroller.current.clientHeight, behavior: 'smooth' })} drop>
                lower the first drop
              </Verb>
            </div>
          </Depth>
        </section>

        {/* II · the founding act */}
        <section style={{ height: '100%', scrollSnapAlign: 'start' }}>
          <Depth root={scroller}>
            {!settled ? (
              <>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 22 }}>
                  the listener asks
                </div>
                <h2 style={{ fontFamily: 'var(--serif-display)', fontWeight: 340, fontSize: 'clamp(26px, 6.4vw, 40px)', lineHeight: 1.18, color: 'var(--bone)', margin: 0, maxWidth: '17em' }}>
                  {question}
                </h2>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={2}
                  placeholder="one line is enough…"
                  aria-label={question}
                  style={{
                    marginTop: 36, width: 'min(30em, 84vw)',
                    background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)',
                    outline: 'none', resize: 'none', textAlign: 'center',
                    fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
                    fontSize: 19, lineHeight: 1.6, color: 'var(--bone)', caretColor: 'var(--warm)',
                    padding: '6px 2px 12px',
                  }}
                />
                <div style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 26 }}>
                  <Verb onClick={settle} drop disabled={!answer.trim() || settling}>
                    {settling ? 'settling…' : 'let it settle'}
                  </Verb>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--warm)' }}>
                  <SurfaceRing size={16} />
                  <span style={{ fontFamily: 'var(--serif-display)', fontStyle: 'italic', fontWeight: 360, fontSize: 24 }}>settled</span>
                </div>
                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 17, lineHeight: 1.7, color: 'var(--bone-dim)', margin: '22px 0 0', maxWidth: '27em' }}>
                  Watch the water — it just took your colour. From now on the
                  backdrop carries your family's hues, deepening as more is
                  lowered in. That line will still be here in a hundred years,
                  exactly as you wrote it.
                </p>
              </>
            )}
          </Depth>
        </section>

        {/* III · the truths, at depth */}
        <section style={{ height: '100%', scrollSnapAlign: 'start' }}>
          <Depth root={scroller}>
            <div style={{ display: 'grid', gap: '7vh', maxWidth: '30em' }}>
              {[
                ['seal letters across time', 'For a wedding day, an eighteenth birthday, or after you are gone. They surface exactly when you meant them to.'],
                ['keep the voices', 'A voice is the part of a person that outlives the rest. Record them while you can.'],
                ['owned by your bloodline', 'Not a platform, not a feed. The Deep passes down — your descendants will draw these words back up.'],
              ].map(([h, b]) => (
                <div key={h}>
                  <div style={{ fontFamily: 'var(--serif-display)', fontStyle: 'italic', fontWeight: 360, fontSize: 22, color: 'var(--warm)', marginBottom: 10 }}>{h}</div>
                  <p style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 15.5, lineHeight: 1.7, color: 'var(--bone-dim)', margin: 0 }}>{b}</p>
                </div>
              ))}
            </div>
          </Depth>
        </section>

        {/* IV · the bed */}
        <section style={{ height: '100%', scrollSnapAlign: 'start' }}>
          <Depth root={scroller}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 22 }}>
              the bed
            </div>
            <h2 style={{ fontFamily: 'var(--serif-display)', fontWeight: 340, fontSize: 'clamp(30px, 7vw, 48px)', lineHeight: 1.14, color: 'var(--bone)', margin: 0, maxWidth: '13em' }}>
              Some things <span style={{ color: 'var(--bone-dim)' }}>only get deeper.</span>
            </h2>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 16.5, lineHeight: 1.65, color: 'var(--bone-dim)', margin: '20px 0 0', maxWidth: '26em' }}>
              The water grows as your family speaks into it. Call them in.
            </p>
            <div style={{ marginTop: 44, display: 'flex', alignItems: 'center', gap: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Verb onClick={() => finish('/family')} drop>invite your family</Verb>
              <Verb onClick={() => finish()} quiet>rise to the surface</Verb>
            </div>
          </Depth>
        </section>
      </div>
    </div>,
    document.body,
  );
}
