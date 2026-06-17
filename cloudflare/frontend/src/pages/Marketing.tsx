import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HLogo } from '../loom/components/HLogo';
import { SecurityDot } from '../loom/components/Frame';
import { CosmicHeader, SectionLabel, EntryRow, WaxSeal } from '../loom/cosmic/CosmicUI';
import {
  getDeferredPrompt, isIOS, isStandalone,
  onInstallStateChange, promptInstall, wasInstalled,
} from '../lib/pwa';

// ── Permanence answers ────────────────────────────────────────────────
const PERMANENCE = [
  ['If you stop paying.', 'Your sealed letters survive subscription changes. Once sealed, a letter holds regardless of account status.'],
  ['If Heirloom folds.', 'Your archive exports at any time in open formats. IPFS pinning and a succession commitment ensure delivery. The letters find their people.'],
  ['If you die first.', 'Designate a letter guardian — someone who inherits delivery when you\'re gone. Set this in Settings. They ensure your letters reach exactly who you wrote them for.'],
  ['If they have no account.', 'Letters arrive as a direct link. No signup. No app. A notification, a link, a letter.'],
] as const;

// ── Install state ─────────────────────────────────────────────────────
function useInstallState() {
  const [tick, setTick] = useState(0);
  useEffect(() => onInstallStateChange(() => setTick(t => t + 1)), []);
  if (typeof window === 'undefined') return { mode: 'none' as const };
  if (isStandalone() || wasInstalled()) return { mode: 'none' as const };
  if (getDeferredPrompt()) return { mode: 'prompt' as const, tick };
  if (isIOS()) return { mode: 'ios' as const, tick };
  return { mode: 'none' as const, tick };
}

// ── Scroll-reveal ─────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

export function Marketing() {
  const install = useInstallState();
  const [vpH, setVpH] = useState(typeof window !== 'undefined' ? window.innerHeight : 900);
  const [vpW, setVpW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);
  const [taglineIn, setTaglineIn] = useState(false);
  const pillars  = useReveal(0.08);
  const arc      = useReveal(0.06);
  const permSect = useReveal(0.06);
  const bookSect = useReveal(0.08);
  const finalCta = useReveal(0.1);
  const ease = 'cubic-bezier(0.16,1,0.3,1)';
  const narrow = vpW < 680;

  useEffect(() => {
    const sync = () => { setVpH(window.innerHeight); setVpW(window.innerWidth); };
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  // Tagline arrives 800ms after first paint
  useEffect(() => {
    const t = setTimeout(() => setTaglineIn(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <main style={{ color: 'var(--bone)', overflowX: 'hidden' }}>

      {/* ════════════════════════════════════════════════════════════
          HERO — serif hero set high, mono eyebrow + serif-italic sub +
          mono warm CTA. The global ClothBackdrop filament shows through
          (transparent section). Headline arrives at 800ms.
          ════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', height: vpH, minHeight: 560, overflow: 'hidden',
        background: 'transparent',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Woven hero backdrop — thread-swoosh behind everything, vignette to ink */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'url(/woven/thread-swoosh.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          opacity: 0.35,
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 42%, transparent 0%, transparent 38%, var(--ink) 92%)',
        }} />

        {/* Nav — minimal, barely there */}
        <nav style={{
          position: 'relative', zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'calc(clamp(14px, 2.5vh, 20px) + env(safe-area-inset-top, 0px)) clamp(20px, 5vw, 56px) clamp(14px, 2.5vh, 20px)',
        }}>
          <HLogo size="md" wordmark />
          <span style={{
            display: 'flex', gap: 'clamp(18px, 3vw, 32px)', alignItems: 'center',
            fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'var(--bone-dim)',
          }}>
            <Link to="/pricing"  style={{ color: 'inherit', textDecoration: 'none' }} className="mkt-nav-hide-sm">pricing</Link>
            <Link to="/founder"  style={{ color: 'inherit', textDecoration: 'none' }}>founder</Link>
            <Link to="/login"    style={{ color: 'inherit', textDecoration: 'none' }}>sign in</Link>
            <SecurityDot size={6} />
          </span>
        </nav>

        {/* ── The intention — serif hero set high, top-aligned ── */}
        <div style={{
          position: 'relative', zIndex: 10,
          padding: 'clamp(20px, 5vh, 64px) clamp(24px, 6vw, 80px) 0',
        }}>
          <h1 style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(40px, 8vw, 64px)',
            fontWeight: 500,
            lineHeight: 1.04,
            letterSpacing: '-0.012em',
            color: 'var(--bone)',
            margin: '0 0 clamp(22px, 3.5vh, 36px)',
            maxWidth: '16ch',
            opacity: taglineIn ? 1 : 0,
            transform: taglineIn ? 'translateY(0)' : 'translateY(24px)',
            transition: `opacity 1400ms ${ease}, transform 1400ms ${ease}`,
          }}>
            Start your family's thousand-year thread.
          </h1>

          <p style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 'clamp(16px, 2vw, 21px)',
            fontWeight: 300,
            lineHeight: 1.6,
            margin: '0 0 clamp(30px, 4.5vh, 44px)',
            maxWidth: '32ch',
            color: 'var(--bone-dim)',
            opacity: taglineIn ? 1 : 0,
            transition: `opacity 1400ms ${ease}`,
            transitionDelay: '220ms',
          }}>
            A journal of shared history, preserved for generations.
          </p>

          <div style={{
            display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
            opacity: taglineIn ? 1 : 0,
            transition: `opacity 1400ms ${ease}`,
            transitionDelay: '360ms',
          }}>
            <Link
              to="/signup"
              className="mkt-begin-cta"
              style={{
                display: 'inline-block', padding: '13px 38px', minHeight: 44, boxSizing: 'border-box',
                border: '1px solid var(--warm)',
                borderRadius: 999,
                color: 'var(--warm-bright, var(--warm))',
                background: 'transparent',
                fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.30em',
                textTransform: 'uppercase', textDecoration: 'none',
                transition: `background 360ms ${ease}, color 360ms ${ease}`,
              }}
            >
              begin
            </Link>

            {install.mode === 'prompt' && (
              <button
                type="button"
                onClick={() => promptInstall()}
                style={{
                  background: 'transparent', border: '1px solid var(--rule)',
                  borderRadius: 999,
                  color: 'var(--bone-dim)', fontFamily: 'var(--mono)', fontSize: 10,
                  letterSpacing: '0.24em', textTransform: 'uppercase',
                  cursor: 'pointer', padding: '12px 26px', minHeight: 44, boxSizing: 'border-box',
                }}
              >
                ↓ install
              </button>
            )}
            {install.mode === 'ios' && (
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--bone-faint)',
                borderBottom: '1px dashed var(--rule)',
              }}>
                Share → Add to Home Screen
              </span>
            )}
          </div>
        </div>

        {/* Negative space — the filament resolves below, via the global
            ClothBackdrop. The hero rests in vast emptiness above the waves. */}
        <div style={{ flex: 1 }} />
      </section>

      {/* Below the fold rests on solid ink — the filament is the hero only. */}
      <div style={{ position: 'relative', zIndex: 2, background: 'var(--ink)' }}>

      {/* ════════════════════════════════════════════════════════════
          THREE EDITORIAL PILLARS — SectionLabel + ledger-ruled rows
          ════════════════════════════════════════════════════════════ */}
      <section
        ref={pillars.ref}
        style={{
          padding: 'clamp(72px, 10vh, 120px) clamp(24px, 6vw, 80px)',
          borderTop: '1px solid var(--rule)',
        }}
      >
        <SectionLabel>the design</SectionLabel>
        <div style={{ marginTop: 'clamp(24px, 4vh, 44px)', borderTop: '1px solid var(--rule)' }}>
          {([
            ['Write now. Let it arrive then.',
             'Seal a letter for a date, a milestone, or a death. Time-locked by design — cryptographic commitment, permanent delivery. It holds safe and finds them exactly when you intended.'],
            ['A thousand-year horizon.',
             'Not a season. Not a subscription cycle. An archive that outlives its founders and holds the record of a bloodline — perpetually, structurally, by design.'],
            ['Entries only append.',
             'No silent edits. No deletion. Future generations read exactly what you wrote, exactly when you wrote it. The past is sealed the moment you weave it in.'],
          ] as const).map(([title, body], i) => (
            <div key={i} style={{
              borderBottom: '1px solid var(--rule)',
              padding: 'clamp(36px, 5.5vh, 60px) 0',
              display: 'grid',
              gridTemplateColumns: narrow ? '1fr' : '5fr 4fr',
              gap: narrow ? '18px' : 'clamp(40px, 8vw, 120px)',
              opacity: pillars.visible ? 1 : 0,
              transform: pillars.visible ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
              transitionDelay: `${i * 160}ms`,
            }}>
              <h2 style={{
                fontFamily: 'var(--serif-display)',
                fontSize: 'clamp(26px, 3.4vw, 48px)',
                fontWeight: 500, lineHeight: 1.08, margin: 0,
                color: 'var(--bone)',
              }}>{title}</h2>
              <p style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(16px, 1.5vw, 19px)',
                lineHeight: 1.74, margin: 0,
                color: 'var(--bone-dim)',
                paddingTop: narrow ? 0 : 'clamp(4px, 0.6vh, 8px)',
              }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          THE ARC — write → seal → read. Three editorial plates.
          ════════════════════════════════════════════════════════════ */}
      <section
        ref={arc.ref}
        style={{
          padding: 'clamp(72px, 10vh, 120px) clamp(24px, 6vw, 80px)',
          borderTop: '1px solid var(--rule)',
        }}
      >
        <SectionLabel>the arc</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(28px, 5vh, 56px)', marginTop: 'clamp(24px, 4vh, 44px)' }}>
          {([
            ['/marketing/write.png',  'Write today — the story begins when you decide to.'],
            ['/marketing/sealed.png', 'Sealed for descendants — locked until they are ready to read it.'],
            ['/marketing/read.png',   'Read what came before — the voices that wrote before you.'],
          ] as const).map(([src, alt], i) => (
            <figure key={i} style={{
              margin: 0,
              opacity: arc.visible ? 1 : 0,
              transform: arc.visible ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
              transitionDelay: `${i * 160}ms`,
            }}>
              <img
                src={src}
                alt={alt}
                loading="lazy"
                style={{
                  width: '100%', height: 'auto', display: 'block',
                  border: '1px solid var(--rule)',
                }}
              />
            </figure>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          PERMANENCE — what happens when things go wrong
          ════════════════════════════════════════════════════════════ */}
      <section
        ref={permSect.ref}
        style={{
          padding: 'clamp(72px, 10vh, 120px) clamp(24px, 6vw, 80px)',
          borderTop: '1px solid var(--rule)',
          opacity: permSect.visible ? 1 : 0,
          transform: permSect.visible ? 'translateY(0)' : 'translateY(24px)',
          transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
        }}
      >
        <SectionLabel>permanence</SectionLabel>
        <div style={{
          marginTop: 'clamp(24px, 4vh, 44px)',
          display: 'grid',
          gridTemplateColumns: narrow ? '1fr' : 'repeat(2, 1fr)',
          gap: 'clamp(32px, 5vh, 52px) clamp(40px, 6vw, 80px)',
        }}>
          {PERMANENCE.map(([q, a], i) => (
            <div key={i}>
              <p style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(16px, 1.8vw, 22px)',
                fontWeight: 380, lineHeight: 1.2,
                margin: '0 0 14px',
                fontVariationSettings: '"opsz" 24',
                color: 'var(--bone)',
              }}>{q}</p>
              <p style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(15px, 1.4vw, 17px)',
                lineHeight: 1.74, margin: 0,
                color: 'var(--bone-dim)',
              }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          THE BOOK — proof of permanence. Left prose, right ledger rows.
          ════════════════════════════════════════════════════════════ */}
      <section
        ref={bookSect.ref}
        style={{
          padding: 'clamp(72px, 10vh, 120px) clamp(24px, 6vw, 80px)',
          borderTop: '1px solid var(--rule)',
          opacity: bookSect.visible ? 1 : 0,
          transform: bookSect.visible ? 'translateY(0)' : 'translateY(24px)',
          transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
          display: 'grid',
          gridTemplateColumns: narrow ? '1fr' : '1fr 1fr',
          gap: 'clamp(40px, 6vw, 80px)',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.3em',
            textTransform: 'uppercase', color: 'var(--copper-label)',
            marginBottom: 28,
          }}>
            proof of permanence
          </div>
          <h2 style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(26px, 2.8vw, 40px)',
            fontWeight: 500, lineHeight: 1.15,
            margin: '0 0 20px',
            letterSpacing: '-0.016em',
            color: 'var(--bone)',
          }}>
            The thread becomes a book.
          </h2>
          <p style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(15px, 1.5vw, 18px)',
            lineHeight: 1.74, margin: '0 0 32px',
            color: 'var(--bone-dim)',
            maxWidth: '44ch',
          }}>
            Every entry your family has ever written — memories, letters, voice transcripts, milestones — bound into a letterpress-quality heirloom book. Not a photo album. Not a scrapbook. A record. Physical. Permanent. Something to hold.
          </p>
          <p style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(13px, 1.2vw, 15px)',
            fontStyle: 'italic',
            lineHeight: 1.65, margin: '0 0 36px',
            color: 'var(--bone-faint)',
          }}>
            Digital is ephemeral. Servers go down. Platforms close. A book outlasts all of it.
          </p>
          <Link
            to="/book-builder"
            className="hl-btn ghost"
            style={{
              display: 'inline-block', padding: '11px 28px', minHeight: 44, boxSizing: 'border-box',
              color: 'var(--warm)',
              fontFamily: 'var(--mono)', fontSize: 10,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            build the book →
          </Link>
        </div>
        <div>
          {[
            ['letterpress quality', 'Archival paper. Sewn binding. The same craft used for family bibles.'],
            ['every entry included', 'Memories, letters, voice transcripts, milestones. The complete record.'],
            ['ordered by thread', 'Not chronological. Ordered by the cloth — the way your family wove it.'],
            ['ships anywhere', 'Printed and bound. Arrives in four to six weeks.'],
          ].map(([label, detail]) => (
            <EntryRow
              key={label}
              title={detail}
              meta={label}
            />
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FINAL CTA — the cloth waits. WaxSeal + serif hero + mono warm CTA.
          ════════════════════════════════════════════════════════════ */}
      <section
        ref={finalCta.ref}
        style={{
          padding: 'clamp(80px, 12vh, 140px) clamp(24px, 6vw, 80px)',
          borderTop: '1px solid var(--rule)',
          opacity: finalCta.visible ? 1 : 0,
          transform: finalCta.visible ? 'translateY(0)' : 'translateY(24px)',
          transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
        }}
      >
        <div style={{ marginBottom: 'clamp(28px, 4.5vh, 44px)' }}>
          <WaxSeal size={36} />
        </div>
        <CosmicHeader
          align="center"
          title={<>The cloth waits.<br />Start your thread.</>}
          sub="For the ones who come after."
        />
        <div style={{ textAlign: 'center', marginTop: 'clamp(28px, 4.5vh, 44px)' }}>
          <Link
            to="/signup"
            className="hl-btn"
            style={{
              display: 'inline-block', padding: '14px 36px', minHeight: 44, boxSizing: 'border-box',
              fontFamily: 'var(--mono)', fontSize: 11,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            begin the thousand-year thread →
          </Link>
          <p style={{
            marginTop: 24,
            fontFamily: 'var(--mono)', fontSize: 9.5,
            letterSpacing: '0.20em', textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}>
            free to start ·{' '}
            <Link to="/pricing" style={{ color: 'var(--warm)', textDecoration: 'none', borderBottom: '1px solid var(--rule)' }}>
              see pricing
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: 'clamp(32px, 4vh, 48px) clamp(24px, 6vw, 80px)',
        borderTop: '1px solid var(--rule)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
        fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'var(--bone-faint)',
      }}>
        <HLogo size="sm" wordmark />
        <span style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[['privacy','/privacy'],['terms','/terms'],['contact','/contact']].map(([l, to]) => (
            <Link key={l} to={to} style={{ color: 'inherit', textDecoration: 'none' }}>{l}</Link>
          ))}
        </span>
        <span>heirloom.blue · est. 2025 · running until ∞</span>
      </footer>

      </div>

      <style>{`
        .mkt-nav-hide-sm { display: inline; }
        @media (max-width: 520px) { .mkt-nav-hide-sm { display: none; } }
        .loom[data-theme="light"] .mkt-begin-cta { color: var(--warm-dim); }
      `}</style>
    </main>
  );
}
