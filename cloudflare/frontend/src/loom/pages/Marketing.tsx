import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TapestryCanvas } from '../components/TapestryCanvas';
import { HLogo } from '../components/HLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { SecurityDot } from '../components/Frame';
import { useListener } from '../../hooks/useListener';
import {
  getDeferredPrompt, isIOS, isStandalone,
  onInstallStateChange, promptInstall, wasInstalled,
} from '../../lib/pwa';

// ── Demo cloth (120 entries, 1948 → today) ───────────────────────────────────
const DEMO_ENTRIES = Array.from({ length: 120 }, (_, i) => ({
  date: new Date(1948 + Math.floor(i * 0.65), (i * 3) % 12, 1),
  n: i,
  dye: (['madder','indigo','saffron','weld','woad','cochineal'] as const)[i % 6],
  tier: 'family' as const,
}));

// ── Three editorial pillars (replaces the 5-bullet grid) ────────────────────
const PILLARS = [
  [
    'A thousand-year horizon.',
    'Not a season. Not a subscription cycle. An archive that outlives its founders and holds the record of a bloodline — perpetually, structurally, by design.',
  ],
  [
    'Entries only append.',
    'No silent edits. No deletion. Future generations read exactly what you wrote, exactly when you wrote it. The past is sealed the moment you weave it in.',
  ],
  [
    'Write now. Let it arrive then.',
    'Lock an entry to open on a date, an age, or a death. A letter to someone not yet born. A voice note for the next century. Time-locked by cryptographic seal.',
  ],
] as const;

// ── Nav ───────────────────────────────────────────────────────────────────────
function MktTopbar({ dark }: { dark?: boolean }) {
  const color = dark ? 'rgba(244,236,216,0.55)' : 'var(--parchment-dim)';
  const borderColor = dark ? 'rgba(244,236,216,0.10)' : 'var(--parchment-rule)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'calc(clamp(16px, 2.5vh, 22px) + env(safe-area-inset-top, 0px)) clamp(20px, 5vw, 56px) clamp(16px, 2.5vh, 22px)',
      borderBottom: `1px solid ${borderColor}`,
      fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.28em', textTransform: 'uppercase',
    }}>
      <HLogo size={20} wordmark wordColor={dark ? 'rgba(244,236,216,0.85)' : 'var(--parchment-ink)'} />
      <span style={{ display: 'flex', gap: 'clamp(14px, 3vw, 28px)', alignItems: 'center', color }}>
        <Link to="/loom/weft" className="mkt-nav-hide-sm" style={{ color: 'inherit', textDecoration: 'none' }}>see the cloth</Link>
        <Link to="/founder"   className="mkt-nav-hide-sm" style={{ color: 'inherit', textDecoration: 'none' }}>founder</Link>
        <Link to="/pricing"   style={{ color: 'inherit', textDecoration: 'none' }}>pricing</Link>
        <Link to="/login"     style={{ color: 'inherit', textDecoration: 'none' }}>sign in</Link>
        <span className="mkt-nav-hide-sm"><ThemeToggle /></span>
        <SecurityDot size={7} />
      </span>
    </div>
  );
}

// ── Install state ─────────────────────────────────────────────────────────────
function useInstallState() {
  const [tick, setTick] = useState(0);
  useEffect(() => onInstallStateChange(() => setTick((t) => t + 1)), []);
  if (typeof window === 'undefined') return { mode: 'none' as const };
  if (isStandalone() || wasInstalled()) return { mode: 'none' as const };
  if (getDeferredPrompt()) return { mode: 'prompt' as const, tick };
  if (isIOS()) return { mode: 'ios' as const, tick };
  return { mode: 'none' as const, tick };
}

// ── Scroll reveal hook ────────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── Main component ────────────────────────────────────────────────────────────
export function Marketing() {
  const prompt = useListener();
  const install = useInstallState();
  const [vpH, setVpH] = useState(typeof window !== 'undefined' ? window.innerHeight : 900);
  const [vpW, setVpW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);
  const [heroRevealed, setHeroRevealed] = useState(false);
  const pillarsReveal = useReveal(0.1);
  const ctaReveal = useReveal(0.1);

  useEffect(() => {
    const sync = () => { setVpH(window.innerHeight); setVpW(window.innerWidth); };
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHeroRevealed(true), 180);
    return () => clearTimeout(t);
  }, []);

  const ease = 'cubic-bezier(0.16,1,0.3,1)';

  return (
    <div className="hl-screen parchment" style={{ overflowY: 'auto', minHeight: '100vh' }}>

      {/* ── HERO: full-viewport canvas with text overlaid ── */}
      <div style={{ position: 'relative', height: vpH, minHeight: 580, background: '#0e0e0c', overflow: 'hidden' }}>

        {/* Full-bleed animated cloth */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1 }}>
          <TapestryCanvas
            width={vpW}
            height={vpH}
            entries={DEMO_ENTRIES}
            kind="specimen"
            animate
            opts={{
              tStart: new Date(1948, 0, 1),
              tEnd:   new Date(2026, 0, 1),
              nowFrac: 0.93,
              background: '#0e0e0c',
              warpEvery: 9,
              showFraySelvedge: true,
              showWarpHair: true,
            }}
          />
        </div>

        {/* Nav on top of canvas */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
          <MktTopbar dark />
        </div>

        {/* Bottom gradient: canvas → text readable — strong enough to cover vivid threads */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(14,14,12,0.97) 0%, rgba(14,14,12,0.90) 20%, rgba(14,14,12,0.70) 42%, rgba(14,14,12,0.20) 62%, transparent 76%)',
          pointerEvents: 'none',
          zIndex: 2,
        }} />

        {/* Hero text — bottom-anchored, fades in */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 clamp(20px, 6vw, 80px) clamp(44px, 7vh, 72px)',
          zIndex: 20,
        }}>
          <div
            style={{
              fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.32em',
              textTransform: 'uppercase', color: 'rgba(244,236,216,0.38)',
              marginBottom: 20,
              opacity: heroRevealed ? 1 : 0,
              transition: `opacity 800ms ${ease}`,
            }}
          >
            heirloom · the family thread
          </div>

          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(34px, 5.2vw, 74px)',
              fontWeight: 300,
              lineHeight: 1.06,
              color: 'rgba(244,236,216,0.95)',
              fontVariationSettings: '"opsz" 72',
              maxWidth: '16ch',
              margin: 0,
              opacity: heroRevealed ? 1 : 0,
              transform: heroRevealed ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 1400ms ${ease}, transform 1400ms ${ease}`,
              transitionDelay: '80ms',
            }}
          >
            {prompt}
          </h1>

          <div style={{
            marginTop: 40, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
            opacity: heroRevealed ? 1 : 0,
            transform: heroRevealed ? 'translateY(0)' : 'translateY(12px)',
            transition: `opacity 1400ms ${ease}, transform 1400ms ${ease}`,
            transitionDelay: '220ms',
          }}>
            <Link
              to="/signup"
              style={{
                display: 'inline-block',
                padding: '11px 28px',
                background: 'var(--warm)',
                border: '1px solid var(--warm)',
                color: 'rgba(244,236,216,0.96)',
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Begin your thread — free
            </Link>

            {install.mode === 'prompt' && (
              <button
                type="button"
                onClick={async () => { await promptInstall(); }}
                style={{
                  display: 'inline-block', padding: '10px 24px', background: 'transparent',
                  border: '1px solid rgba(244,236,216,0.30)', color: 'rgba(244,236,216,0.70)',
                  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                ↓ Install app
              </button>
            )}
            {install.mode === 'ios' && (
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'rgba(244,236,216,0.38)', borderBottom: '1px dashed rgba(244,236,216,0.20)', paddingBottom: 1,
              }}>
                Share → Add to Home Screen
              </span>
            )}

            <Link
              to="/loom/weft"
              style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.20em', textTransform: 'uppercase',
                color: 'rgba(244,236,216,0.50)',
                textDecoration: 'none', borderBottom: '1px solid rgba(244,236,216,0.20)', paddingBottom: 1,
              }}
            >
              See the cloth →
            </Link>
          </div>
        </div>

        {/* Specimen label — top-right of canvas */}
        <div style={{
          position: 'absolute', top: 68, right: 'clamp(20px, 5vw, 56px)',
          fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(244,236,216,0.28)',
          letterSpacing: '0.24em', textTransform: 'uppercase',
          opacity: heroRevealed ? 1 : 0,
          transition: `opacity 2000ms ${ease}`,
          transitionDelay: '600ms',
        }}>
          specimen · the Okonkwo family thread · 1948 – today · entry 4,318
        </div>

        {/* Scroll nudge */}
        <div style={{
          position: 'absolute', bottom: 'clamp(44px, 7vh, 72px)', right: 'clamp(20px, 6vw, 80px)',
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase',
          color: 'rgba(244,236,216,0.22)', writingMode: 'vertical-rl',
          opacity: heroRevealed ? 1 : 0, transition: `opacity 2000ms ${ease}`, transitionDelay: '1000ms',
        }}>
          scroll
        </div>
      </div>

      {/* ── THREE EDITORIAL PILLARS ── */}
      <div
        ref={pillarsReveal.ref}
        style={{
          padding: 'clamp(64px, 9vh, 112px) clamp(20px, 6vw, 80px)',
          background: 'var(--bone-bg)',
          opacity: pillarsReveal.visible ? 1 : 0,
          transform: pillarsReveal.visible ? 'translateY(0)' : 'translateY(24px)',
          transition: `opacity 1000ms ${ease}, transform 1000ms ${ease}`,
        }}
      >
        {PILLARS.map(([title, body], i) => (
          <div
            key={i}
            style={{
              borderTop: '1px solid var(--parchment-rule)',
              paddingTop: 'clamp(32px, 5vh, 52px)',
              paddingBottom: 'clamp(32px, 5vh, 52px)',
              display: 'grid',
              gridTemplateColumns: vpW < 640 ? '1fr' : 'minmax(0, 5fr) minmax(0, 4fr)',
              gap: vpW < 640 ? '0' : '0 clamp(40px, 8vw, 120px)',
              alignItems: 'start',
              opacity: pillarsReveal.visible ? 1 : 0,
              transform: pillarsReveal.visible ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity 1000ms ${ease}, transform 1000ms ${ease}`,
              transitionDelay: `${i * 110}ms`,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(26px, 3.8vw, 52px)',
                fontWeight: 300, lineHeight: 1.08, margin: 0,
                fontVariationSettings: '"opsz" 48',
                color: 'var(--parchment-ink)',
              }}
            >
              {title}
            </h2>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontSize: vpW < 640 ? 16 : 'clamp(15px, 1.4vw, 18px)',
                lineHeight: 1.68, margin: 0,
                color: 'var(--parchment-dim)',
                paddingTop: vpW < 640 ? 18 : 'clamp(4px, 0.8vh, 10px)',
              }}
            >
              {body}
            </p>
          </div>
        ))}
        {/* final hairline */}
        <div style={{ borderTop: '1px solid var(--parchment-rule)' }} />
      </div>

      {/* ── PRIVACY STRIP ── */}
      <div style={{ padding: 'clamp(48px, 6vh, 80px) clamp(20px, 6vw, 80px)', borderTop: '1px solid var(--parchment-rule)', background: 'var(--bone-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div className="hl-eyebrow dark">Protected by design · globally compliant</div>
          <SecurityDot size={7} />
        </div>
        <p className="hl-prose dark" style={{ maxWidth: '56ch', marginTop: 0, marginBottom: 36, fontSize: 16, lineHeight: 1.65 }}>
          Your family's story is the most sensitive information there is. We treat it that way — by architecture, by law, and by principle. AES-256-GCM at rest. Zero-knowledge. We cannot read your entries.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 'clamp(16px, 2.5vh, 28px) clamp(20px, 4vw, 48px)' }}>
          {([
            ['GDPR · POPIA · CCPA', 'Right to access, right to erasure, right to portability. All three frameworks honored by architecture.'],
            ['No third-party tracking', 'No ad pixels. No social trackers. No analytics that share your data. Your family stays yours.'],
            ['Right to erasure', 'Delete your account and all data is permanently purged within 30 days. Export your full archive at any time.'],
            ['HTTPS everywhere', 'All traffic encrypted in transit via TLS 1.3. Cloudflare edge enforces HSTS. No plaintext, ever.'],
          ] as [string, string][]).map(([title, body]) => (
            <div key={title}>
              <div className="hl-eyebrow dark" style={{ marginBottom: 8 }}>{title}</div>
              <p className="hl-prose dark" style={{ marginTop: 0, fontSize: 13, lineHeight: 1.6 }}>{body}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--parchment-rule)', display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/privacy" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'var(--parchment-dim)', textDecoration: 'none', borderBottom: '1px solid var(--parchment-rule)', paddingBottom: 2 }}>Privacy policy →</Link>
          <Link to="/terms"   style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'var(--parchment-dim)', textDecoration: 'none', borderBottom: '1px solid var(--parchment-rule)', paddingBottom: 2 }}>Terms of service →</Link>
        </div>
      </div>

      {/* ── CTA FOOTER ── */}
      <div
        ref={ctaReveal.ref}
        style={{
          padding: 'clamp(64px, 9vh, 104px) clamp(20px, 6vw, 80px)',
          borderTop: '1px solid var(--parchment-rule)',
          background: 'var(--bone-bg)',
          opacity: ctaReveal.visible ? 1 : 0,
          transform: ctaReveal.visible ? 'translateY(0)' : 'translateY(16px)',
          transition: `opacity 900ms ${ease}, transform 900ms ${ease}`,
        }}
      >
        <div className="hl-eyebrow dark" style={{ marginBottom: 20 }}>Start free. No credit card. No limit on time.</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/signup"
            style={{
              display: 'inline-block', padding: '11px 28px',
              background: 'var(--ink)', border: '1px solid var(--ink)',
              color: 'var(--bone)', fontFamily: 'var(--mono)', fontSize: 10,
              letterSpacing: '0.24em', textTransform: 'uppercase', textDecoration: 'none',
            }}
          >
            Begin your thread →
          </Link>
          <Link
            to="/pricing"
            style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.20em', textTransform: 'uppercase',
              color: 'var(--parchment-dim)', textDecoration: 'none',
              borderBottom: '1px solid var(--parchment-rule)', paddingBottom: 2,
            }}
          >
            See all plans →
          </Link>
        </div>
      </div>
    </div>
  );
}
