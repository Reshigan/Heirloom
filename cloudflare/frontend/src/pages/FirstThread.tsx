import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useIsNewUser } from '../hooks/useIsNewUser';

/**
 * The First Thread — the first-run ceremony.
 *
 * A live, tappable wow-moment, faithfully ported from the Claude Design
 * handoff ("Heirloom — First Thread"). Six paced beats:
 *   0 Threshold → 1 Ignition → 2 Listener → 3 Record → 4 Woven → 5 Seal
 *
 * It is the emotional overture, not the product chrome: a fixed, full-viewport
 * takeover that runs above the cloth, then hands off into the real onboarding
 * (authed) or signup (anonymous). The animations live in globals.css as the
 * `hl-*` keyframes; the waveform is a setInterval-driven canvas (rAF pauses on
 * a hidden tab — the design used setInterval and we keep that).
 */

const ASSET_BAND = '/ceremony/thread-band.png';
const ASSET_SEAL = '/ceremony/seal.png';

// The single permitted curve. Every motion in the ceremony rides this one
// easing — the ignition sweep and woven hairline included.
import { EASE } from '../loom/motion';

const DOT_ON = 'var(--warm)';
const DOT_OFF = 'var(--bone-ghost)';

// Years a sealed letter waits before opening. Used by both the seal header
// and the "Sealed until …" confirmation — one source so they cannot drift.
const SEAL_YEARS_AHEAD = 19;

export function FirstThread() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  // The ceremony is the FIRST-run overture. An authenticated visitor who has
  // already woven entries is not a first-run user — bounce them to their home
  // surface rather than letting them replay the ceremony into /onboarding.
  // Anonymous visitors (isNewUser false because unauthenticated) are never
  // bounced — for them /begin is the public showcase.
  const { isNewUser, isLoading: checkingNew } = useIsNewUser();

  const [step, setStep] = useState(0);
  const [sec, setSec] = useState(0);
  const [burst, setBurst] = useState(false);
  const [sealed, setSealed] = useState(false);

  const advanceRef = useRef<number | null>(null); // 2700ms ignition → listener
  const sealRef = useRef<number | null>(null); // 850ms burst → sealed
  const tickRef = useRef<number | null>(null); // 1s recording clock
  const drawRef = useRef<number | null>(null); // 40ms waveform frame
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduce = useRef(false);

  const stopRecInternal = useCallback(() => {
    if (tickRef.current != null) { clearInterval(tickRef.current); tickRef.current = null; }
    if (drawRef.current != null) { clearInterval(drawRef.current); drawRef.current = null; }
  }, []);

  const clearTimers = useCallback(() => {
    if (advanceRef.current != null) { clearTimeout(advanceRef.current); advanceRef.current = null; }
    if (sealRef.current != null) { clearTimeout(sealRef.current); sealRef.current = null; }
    stopRecInternal();
  }, [stopRecInternal]);

  useEffect(() => {
    reduce.current =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    return () => clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    if (isAuthenticated && !checkingNew && !isNewUser) {
      navigate('/loom/today', { replace: true });
    }
  }, [isAuthenticated, checkingNew, isNewUser, navigate]);

  // The waveform — 42 envelope-shaped bars, copper gradient, animated by time.
  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const x = c.getContext('2d');
    if (!x) return;
    const W = c.width, H = c.height, N = 42;
    const t = reduce.current ? 0.6 : performance.now() / 1000;
    // Canvas fillStyle cannot resolve var() — read the canonical copper tokens
    // at draw time (document is mounted by now) so the waveform tracks the brand
    // palette and theme rather than hardcoded bespoke copper.
    const cs = getComputedStyle(document.documentElement);
    const warmTop = cs.getPropertyValue('--warm-bright').trim() || '#f0c074';
    const warmBottom = cs.getPropertyValue('--warm-dim').trim() || '#b07a3e';
    x.clearRect(0, 0, W, H);
    x.lineCap = 'round';
    for (let i = 0; i < N; i++) {
      const env = Math.sin((i / N) * Math.PI);
      const h = (0.12 + 0.88 * Math.abs(Math.sin(i * 0.7 + t * 6) * Math.cos(i * 0.3 + t * 2.1))) * env * H * 0.92;
      const px = (W * (i + 0.5)) / N;
      const g = x.createLinearGradient(0, (H - h) / 2, 0, (H + h) / 2);
      g.addColorStop(0, warmTop);
      g.addColorStop(1, warmBottom);
      x.strokeStyle = g;
      x.lineWidth = Math.max(2.4, (W / N) * 0.42);
      x.beginPath();
      x.moveTo(px, (H - h) / 2);
      x.lineTo(px, (H + h) / 2);
      x.stroke();
    }
  }, []);

  // Recording lifecycle is driven by the step, so the canvas is guaranteed
  // mounted before the first frame draws.
  useEffect(() => {
    if (step !== 3) return;
    setSec(0);
    tickRef.current = window.setInterval(() => setSec((s) => s + 1), 1000);
    draw(); // paint immediately so the canvas is never blank
    if (!reduce.current) drawRef.current = window.setInterval(draw, 40);
    return () => stopRecInternal();
  }, [step, draw, stopRecInternal]);

  const begin = useCallback(() => {
    setStep(1);
    if (advanceRef.current != null) clearTimeout(advanceRef.current);
    advanceRef.current = window.setTimeout(() => setStep(2), 2700);
  }, []);
  const toListener = useCallback(() => {
    if (advanceRef.current != null) { clearTimeout(advanceRef.current); advanceRef.current = null; }
    setStep(2);
  }, []);
  const record = useCallback(() => setStep(3), []);
  const stopRec = useCallback(() => setStep(4), []);
  const toSeal = useCallback(() => setStep(5), []);
  const stamp = useCallback(() => {
    if (burst || sealed) return;
    setBurst(true);
    sealRef.current = window.setTimeout(() => setSealed(true), 850);
  }, [burst, sealed]);
  const replay = useCallback(() => {
    clearTimers();
    setStep(0);
    setSec(0);
    setBurst(false);
    setSealed(false);
  }, [clearTimers]);
  const enterThread = useCallback(() => {
    navigate(isAuthenticated ? '/onboarding' : '/signup');
  }, [navigate, isAuthenticated]);

  const mm = Math.floor(sec / 60);
  const ss = String(sec % 60).padStart(2, '0');
  const clock = `${mm}:${ss}`;

  return (
    <div
      className="hl-first-thread"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'var(--ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 430,
          height: '100%',
          overflow: 'hidden',
          background: 'var(--ink)',
          fontFamily: "var(--mono)",
        }}
      >
        {/* STEP 0 · THRESHOLD */}
        {step === 0 && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Press to begin the ceremony"
            onClick={begin}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); begin(); } }}
            style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              background: 'var(--ink)',
              animation: `hl-fadein 720ms ${EASE} both`,
            }}
          >
            <div style={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: "var(--serif-display)", fontSize: 74, color: 'var(--warm-bright)' }}>∞</div>
            </div>
            <div role="heading" aria-level={1} style={{ fontFamily: 'var(--serif-display)', fontSize: 30, color: 'var(--bone)', marginTop: 30 }}>The Threshold</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--bone-dim)', marginTop: 8 }}>Every thread begins with a touch.</div>
            <div style={{ position: 'absolute', bottom: 46, fontSize: 10, letterSpacing: '0.32em', color: 'var(--bone-faint)', animation: 'hl-pulse 1400ms var(--ease) infinite' }}>PRESS TO BEGIN</div>
          </div>
        )}

        {/* STEP 1 · IGNITION */}
        {step === 1 && (
          <div
            onClick={toListener}
            style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', background: 'var(--ink-deep)', cursor: 'pointer',
            }}
          >
            <div style={{ position: 'relative', width: 290, height: 200, overflow: 'hidden' }}>
              <img src={ASSET_BAND} alt="" style={{ position: 'absolute', top: 0, left: '-5%', width: '110%', height: '100%', objectFit: 'cover', animation: `hl-wipe 1400ms ${EASE} forwards` }} />
              {/* Ignition reveal — a single travelling hairline of cream light
                  feathered at its edges. Rule-2 safe: no copper disc/bloom,
                  the brightness is var(--bone) so it theme-flips on paper. */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg,transparent,var(--bone),transparent)', animation: `hl-sweep 1400ms ${EASE} forwards` }} />
            </div>
            <div style={{ fontFamily: 'var(--serif-display)', fontSize: 34, color: 'var(--bone)', marginTop: 18, animation: `hl-fadeup 720ms ${EASE} 1400ms both` }}>Your thread begins.</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--bone-faint)', marginTop: 10, textAlign: 'center', padding: '0 28px', animation: `hl-fadeup 720ms ${EASE} 1400ms both` }}>A line your family will follow for a thousand years.</div>
          </div>
        )}

        {/* STEP 2 · LISTENER */}
        {step === 2 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '0 30px', background: 'var(--ink)' }}>
            <div style={{ position: 'relative', height: 170, margin: '0 -30px', overflow: 'hidden' }}>
              <img src={ASSET_BAND} alt="" style={{ position: 'absolute', top: -20, left: '-5%', width: '110%', animation: `hl-fadein 1400ms ${EASE} both` }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 50%,var(--ink))' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginTop: -20 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.34em', color: 'var(--warm-dim)', marginBottom: 18, animation: `hl-fadeup 720ms ${EASE} both` }}>THE LISTENER ASKS</div>
              <div style={{ fontFamily: 'var(--serif-display)', fontSize: 31, lineHeight: 1.16, color: 'var(--bone)', animation: `hl-fadeup 720ms ${EASE} 180ms both` }}>What did you almost forget to write down today?</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 30, animation: `hl-fadeup 720ms ${EASE} 360ms both` }}>
                <button type="button" onClick={record} style={{ border: '1px solid var(--warm)', borderRadius: 0, padding: '13px 30px', color: 'var(--warm)', background: 'transparent', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.22em', cursor: 'pointer' }}>SPEAK</button>
                <button type="button" onClick={record} style={{ border: '1px solid var(--warm)', background: 'transparent', borderRadius: 0, padding: '13px 30px', color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.22em', cursor: 'pointer' }}>WRITE</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 · RECORD */}
        {step === 3 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 30px 40px', background: 'var(--ink)', animation: `hl-fadein 720ms ${EASE} both` }}>
            <div style={{ fontSize: 11, letterSpacing: '0.34em', color: 'var(--warm-dim)' }}>LISTENING…</div>
            <div style={{ flex: 1 }} />
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 66, color: 'var(--bone)', letterSpacing: '0.04em' }}>{clock}</div>
            <canvas ref={canvasRef} width={500} height={180} style={{ width: 230, height: 84, margin: '26px 0' }} />
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--bone-dim)', textAlign: 'center', minHeight: 40 }}>“…the scent of rain on dry earth carried us back to that summer.”</div>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={stopRec} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--copper-border)', background: 'transparent', borderRadius: 0, padding: '13px 26px', color: 'var(--warm-bright)', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.24em', cursor: 'pointer' }}>
              <span style={{ width: 11, height: 11, background: 'var(--warm)', borderRadius: 0, display: 'inline-block' }} />
              STOP &amp; WEAVE
            </button>
          </div>
        )}

        {/* STEP 4 · WOVEN */}
        {step === 4 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 34px', background: 'var(--ink)', animation: `hl-fadein 720ms ${EASE} both` }}>
            <div style={{ position: 'relative', width: '100%', height: 60, display: 'flex', alignItems: 'center' }}>
              <div style={{ height: 1, width: '100%', background: 'linear-gradient(90deg,transparent,var(--copper-border),transparent)', transformOrigin: 'left', animation: `hl-grow 1400ms ${EASE} both` }} />
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--mono)', fontSize: 18, lineHeight: 1, color: 'var(--warm)', animation: `hl-node 720ms ${EASE} 720ms both` }}>∞</div>
            </div>
            <div style={{ fontFamily: 'var(--serif-display)', fontSize: 34, color: 'var(--bone)', marginTop: 30, textAlign: 'center', animation: `hl-fadeup 720ms ${EASE} 1400ms both` }}>Woven into the thread.</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone-faint)', marginTop: 10, textAlign: 'center', animation: `hl-fadeup 720ms ${EASE} 1400ms both` }}>Now part of your family's story.</div>
            <button type="button" onClick={toSeal} style={{ marginTop: 34, border: '1px solid var(--copper-border)', background: 'transparent', borderRadius: 0, padding: '13px 30px', color: 'var(--warm-bright)', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.24em', cursor: 'pointer', animation: `hl-fadeup 720ms ${EASE} 1400ms both` }}>SEAL ONE FOR THE FUTURE</button>
          </div>
        )}

        {/* STEP 5 · SEAL CEREMONY */}
        {step === 5 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '54px 30px 40px', background: 'var(--ink)', animation: `hl-fadein 720ms ${EASE} both` }}>
            {!sealed && (
              <>
                <div style={{ fontSize: 11, letterSpacing: '0.32em', color: 'var(--warm-dim)' }}>A LETTER TO ELI · {new Date().getFullYear() + SEAL_YEARS_AHEAD}</div>
                <div style={{ position: 'relative', marginTop: 24, width: '100%', flex: 1, borderRadius: 0, background: 'var(--bg-letter)', border: '1px solid var(--copper-border)', padding: '24px 22px' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.8, color: 'var(--bone-dim)' }}>
                    My dearest Eli,
                    <br />
                    <br />
                    By the time this opens, you'll be grown. I hope you still know the sound of rain on the old porch…
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--bone-faint)', marginTop: 18 }}>Press the seal to close it across time.</div>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Press the seal to close the letter"
                  onClick={stamp}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stamp(); } }}
                  style={{ position: 'relative', marginTop: 14, width: 96, height: 96, cursor: 'pointer' }}
                >
                  <img src={ASSET_SEAL} alt="" style={{ width: 96, height: 96, display: 'block' }} />
                  {burst && (
                    <>
                      {/* Seal burst — expanding SQUARE hairline strokes, radius 0,
                          in var(--rule) (cream hairline). No copper rings/auras;
                          the impact reads as the cloth's own grid flexing out. */}
                      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 96, height: 96, borderRadius: 0, border: '1px solid var(--rule-strong)', animation: `hl-ring 720ms ${EASE} forwards` }} />
                      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 96, height: 96, borderRadius: 0, border: '1px solid var(--rule)', animation: `hl-ring 720ms ${EASE} 180ms forwards` }} />
                    </>
                  )}
                </div>
              </>
            )}
            {sealed && (
              <>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={ASSET_SEAL} alt="" style={{ width: 108, height: 108, animation: `hl-stamp 720ms ${EASE} both` }} />
                  </div>
                  <div style={{ fontFamily: 'var(--serif-display)', fontSize: 32, color: 'var(--bone)', marginTop: 26, animation: `hl-fadeup 720ms ${EASE} 360ms both` }}>Sealed until {new Date().getFullYear() + SEAL_YEARS_AHEAD}.</div>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--bone-faint)', marginTop: 10, animation: `hl-fadeup 720ms ${EASE} 360ms both` }}>For generations to come.</div>
                  <button type="button" onClick={enterThread} style={{ marginTop: 32, border: '1px solid var(--warm)', background: 'transparent', borderRadius: 0, padding: '13px 32px', color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.22em', cursor: 'pointer', animation: `hl-fadeup 720ms ${EASE} 720ms both` }}>ENTER YOUR THREAD</button>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={replay}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replay(); } }}
                  style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--bone-faint)', cursor: 'pointer', borderTop: '1px solid var(--hairline-3)', paddingTop: 18, width: '100%', textAlign: 'center' }}
                >
                  ↺ &nbsp;BEGIN THE CEREMONY AGAIN
                </div>
              </>
            )}
          </div>
        )}

        {/* progress dots */}
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} style={{ width: 6, height: 6, background: step >= n ? DOT_ON : DOT_OFF }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default FirstThread;
