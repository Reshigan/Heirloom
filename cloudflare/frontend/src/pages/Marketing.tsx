import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HLogo } from '../loom/components/HLogo';
import { SecurityDot } from '../loom/components/Frame';
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
          HERO — type is the hero, set high. The global ClothBackdrop
          filament shows through (transparent section) and resolves at
          the bottom, exactly as the specimen. Headline arrives at 800ms.
          ════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', height: vpH, minHeight: 560, overflow: 'hidden',
        background: 'transparent',
        display: 'flex', flexDirection: 'column',
      }}>

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
            textTransform: 'uppercase', color: 'rgba(244,236,216,0.52)',
          }}>
            <Link to="/pricing"  style={{ color: 'inherit', textDecoration: 'none' }} className="mkt-nav-hide-sm">pricing</Link>
            <Link to="/founder"  style={{ color: 'inherit', textDecoration: 'none' }} className="mkt-nav-hide-sm">founder</Link>
            <Link to="/login"    style={{ color: 'inherit', textDecoration: 'none' }}>sign in</Link>
            <SecurityDot size={6} />
          </span>
        </nav>

        {/* ── The intention — set high, top-aligned per the specimen ── */}
        <div style={{
          position: 'relative', zIndex: 10,
          padding: 'clamp(20px, 5vh, 64px) clamp(24px, 6vw, 80px) 0',
        }}>
          <h1 style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(38px, 8.5vw, 84px)',
            fontWeight: 300,
            lineHeight: 1.04,
            letterSpacing: '-0.012em',
            fontVariationSettings: '"opsz" 72',
            color: 'rgba(244,236,216,0.95)',
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
            fontSize: 'clamp(16px, 2vw, 21px)',
            fontWeight: 300,
            lineHeight: 1.6,
            margin: '0 0 clamp(30px, 4.5vh, 44px)',
            maxWidth: '32ch',
            color: 'rgba(244,236,216,0.55)',
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
              style={{
                display: 'inline-block', padding: '13px 38px',
                border: '1px solid var(--warm)',
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
                  background: 'transparent', border: '1px solid rgba(244,236,216,0.20)',
                  color: 'rgba(244,236,216,0.55)', fontFamily: 'var(--mono)', fontSize: 10,
                  letterSpacing: '0.24em', textTransform: 'uppercase',
                  cursor: 'pointer', padding: '12px 26px',
                }}
              >
                ↓ install
              </button>
            )}
            {install.mode === 'ios' && (
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'rgba(244,236,216,0.35)',
                borderBottom: '1px dashed rgba(244,236,216,0.20)',
              }}>
                Share → Add to Home Screen
              </span>
            )}
          </div>
        </div>

        {/* Negative space — the filament resolves below, via the global
            ClothBackdrop. Scroll cue sits at the foot of the specimen. */}
        <div style={{ flex: 1 }} />

        <p style={{
          position: 'relative', zIndex: 10,
          padding: '0 clamp(24px, 6vw, 80px) clamp(28px, 5vh, 44px)',
          margin: 0,
          fontFamily: 'var(--mono)', fontSize: 9,
          letterSpacing: '0.24em', textTransform: 'uppercase',
          color: 'rgba(244,236,216,0.20)',
          opacity: taglineIn ? 1 : 0,
          transition: `opacity 1400ms ${ease}`,
          transitionDelay: '600ms',
        }}>
          scroll ↓
        </p>

        {/* Specimen label — vertical, far right */}
        <div style={{
          position: 'absolute',
          top: 'calc(clamp(14px, 2.5vh, 20px) + env(safe-area-inset-top, 0px) + 56px)',
          right: 'clamp(20px, 5vw, 56px)',
          zIndex: 5,
          fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.26em',
          textTransform: 'uppercase', color: 'rgba(244,236,216,0.15)',
          writingMode: 'vertical-rl',
          opacity: taglineIn ? 1 : 0,
          transition: `opacity 1400ms ${ease}`,
          transitionDelay: '720ms',
        }}>
          specimen · the Okonkwo thread · 1952 – today
        </div>
      </section>

      {/* Below the fold rests on solid ink — the filament is the hero only. */}
      <div style={{ position: 'relative', zIndex: 2, background: 'var(--ink)' }}>

      {/* ════════════════════════════════════════════════════════════
          THREE EDITORIAL PILLARS
          ════════════════════════════════════════════════════════════ */}
      <section
        ref={pillars.ref}
        style={{
          padding: 'clamp(72px, 10vh, 120px) clamp(24px, 6vw, 80px)',
          borderTop: '1px solid rgba(244,236,216,0.07)',
        }}
      >
        {([
          ['Write now. Let it arrive then.',
           'Seal a letter for a date, a milestone, or a death. Time-locked by design — cryptographic commitment, permanent delivery. It holds safe and finds them exactly when you intended.'],
          ['A thousand-year horizon.',
           'Not a season. Not a subscription cycle. An archive that outlives its founders and holds the record of a bloodline — perpetually, structurally, by design.'],
          ['Entries only append.',
           'No silent edits. No deletion. Future generations read exactly what you wrote, exactly when you wrote it. The past is sealed the moment you weave it in.'],
        ] as const).map(([title, body], i) => (
          <div key={i} style={{
            borderTop: '1px solid rgba(244,236,216,0.10)',
            padding: 'clamp(36px, 5.5vh, 60px) 0',
            display: 'grid',
            gridTemplateColumns: vpW < 680 ? '1fr' : '5fr 4fr',
            gap: vpW < 680 ? '18px' : 'clamp(40px, 8vw, 120px)',
            opacity: pillars.visible ? 1 : 0,
            transform: pillars.visible ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
            transitionDelay: `${i * 160}ms`,
          }}>
            <h2 style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(22px, 3.4vw, 48px)',
              fontWeight: 300, lineHeight: 1.08, margin: 0,
              fontVariationSettings: '"opsz" 48',
              color: 'rgba(244,236,216,0.92)',
            }}>{title}</h2>
            <p style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(16px, 1.5vw, 19px)',
              lineHeight: 1.74, margin: 0,
              color: 'rgba(244,236,216,0.62)',
              paddingTop: vpW < 680 ? 0 : 'clamp(4px, 0.6vh, 8px)',
            }}>{body}</p>
          </div>
        ))}
        <div style={{ borderTop: '1px solid rgba(244,236,216,0.10)' }} />
      </section>

      {/* ════════════════════════════════════════════════════════════
          THE ARC — write → seal → read. Three editorial plates. The
          headline type is set inside each plate (same serif/mono), so
          no caption is repeated — the image IS the specimen.
          ════════════════════════════════════════════════════════════ */}
      <section
        ref={arc.ref}
        style={{
          padding: 'clamp(72px, 10vh, 120px) clamp(24px, 6vw, 80px)',
          borderTop: '1px solid rgba(244,236,216,0.07)',
        }}
      >
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.32em',
          textTransform: 'uppercase', color: 'rgba(244,236,216,0.26)',
          marginBottom: 'clamp(40px, 6vh, 60px)',
        }}>
          the arc
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(28px, 5vh, 56px)' }}>
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
                  border: '1px solid rgba(244,236,216,0.07)',
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
          borderTop: '1px solid rgba(244,236,216,0.07)',
          opacity: permSect.visible ? 1 : 0,
          transform: permSect.visible ? 'translateY(0)' : 'translateY(24px)',
          transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
        }}
      >
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.32em',
          textTransform: 'uppercase', color: 'rgba(244,236,216,0.26)',
          marginBottom: 'clamp(40px, 6vh, 60px)',
        }}>
          permanence
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: vpW < 680 ? '1fr' : 'repeat(2, 1fr)',
          gap: 'clamp(32px, 5vh, 52px) clamp(40px, 6vw, 80px)',
        }}>
          {PERMANENCE.map(([q, a], i) => (
            <div key={i}>
              <p style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(16px, 1.8vw, 22px)',
                fontWeight: 300, lineHeight: 1.2,
                margin: '0 0 14px',
                fontVariationSettings: '"opsz" 24',
                color: 'rgba(244,236,216,0.88)',
              }}>{q}</p>
              <p style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(15px, 1.4vw, 17px)',
                lineHeight: 1.74, margin: 0,
                color: 'rgba(244,236,216,0.58)',
              }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          THE BOOK — proof of permanence
          ════════════════════════════════════════════════════════════ */}
      <section
        ref={bookSect.ref}
        style={{
          padding: 'clamp(72px, 10vh, 120px) clamp(24px, 6vw, 80px)',
          borderTop: '1px solid rgba(244,236,216,0.07)',
          opacity: bookSect.visible ? 1 : 0,
          transform: bookSect.visible ? 'translateY(0)' : 'translateY(24px)',
          transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
          display: 'grid',
          gridTemplateColumns: vpW < 680 ? '1fr' : '1fr 1fr',
          gap: 'clamp(40px, 6vw, 80px)',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.32em',
            textTransform: 'uppercase', color: 'rgba(176,122,74,0.7)',
            marginBottom: 28,
          }}>
            proof of permanence
          </div>
          <h2 style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(22px, 2.8vw, 40px)',
            fontWeight: 300, lineHeight: 1.15,
            margin: '0 0 20px',
            fontVariationSettings: '"opsz" 44',
            letterSpacing: '-0.016em',
            color: 'rgba(244,236,216,0.92)',
          }}>
            The thread becomes a book.
          </h2>
          <p style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(15px, 1.5vw, 18px)',
            lineHeight: 1.74, margin: '0 0 32px',
            color: 'rgba(244,236,216,0.58)',
            maxWidth: '44ch',
          }}>
            Every entry your family has ever written — memories, letters, voice transcripts, milestones — bound into a letterpress-quality heirloom book. Not a photo album. Not a scrapbook. A record. Physical. Permanent. Something to hold.
          </p>
          <p style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(13px, 1.2vw, 15px)',
            fontStyle: 'italic',
            lineHeight: 1.65, margin: '0 0 36px',
            color: 'rgba(244,236,216,0.30)',
          }}>
            Digital is ephemeral. Servers go down. Platforms close. A book outlasts all of it.
          </p>
          <Link
            to="/book-builder"
            className="hl-btn ghost"
            style={{
              display: 'inline-block', padding: '11px 28px',
              color: 'var(--warm)',
              fontFamily: 'var(--mono)', fontSize: 10,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            build the book →
          </Link>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          borderLeft: '3px solid rgba(176,122,74,0.22)',
          paddingLeft: 'clamp(20px, 3vw, 40px)',
        }}>
          {[
            ['letterpress quality', 'Archival paper. Sewn binding. The same craft used for family bibles.'],
            ['every entry included', 'Memories, letters, voice transcripts, milestones. The complete record.'],
            ['ordered by thread', 'Not chronological. Ordered by the cloth — the way your family wove it.'],
            ['ships anywhere', 'Printed and bound. Arrives in four to six weeks.'],
          ].map(([label, detail], i, arr) => (
            <div key={i} style={{
              padding: 'clamp(16px, 2.5vh, 22px) 0',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(244,236,216,0.07)' : 'none',
            }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 9,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgba(176,122,74,0.55)', marginBottom: 8,
              }}>{label}</div>
              <p style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(13px, 1.2vw, 15px)',
                lineHeight: 1.65, margin: 0,
                color: 'rgba(244,236,216,0.38)',
              }}>{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FINAL CTA — the cloth waits
          ════════════════════════════════════════════════════════════ */}
      <section
        ref={finalCta.ref}
        style={{
          padding: 'clamp(80px, 12vh, 140px) clamp(24px, 6vw, 80px)',
          borderTop: '1px solid rgba(244,236,216,0.07)',
          textAlign: 'center',
          opacity: finalCta.visible ? 1 : 0,
          transform: finalCta.visible ? 'translateY(0)' : 'translateY(24px)',
          transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
        }}
      >
        <p style={{
          fontFamily: 'var(--serif)',
          fontSize: 'clamp(24px, 3.5vw, 52px)',
          fontWeight: 300, lineHeight: 1.1,
          margin: '0 0 clamp(32px, 5vh, 48px)',
          fontVariationSettings: '"opsz" 48',
          color: 'rgba(244,236,216,0.90)',
          maxWidth: '18ch', marginLeft: 'auto', marginRight: 'auto',
        }}>
          The cloth waits.<br />Start your thread.
        </p>
        <p
          aria-hidden
          style={{
            fontFamily: 'var(--font-hand)',
            fontSize: 'clamp(30px, 4vw, 46px)',
            lineHeight: 1,
            color: 'var(--warm)',
            margin: '0 0 clamp(32px, 5vh, 48px)',
          }}
        >
          — for the ones who come after
        </p>
        <Link
          to="/signup"
          className="hl-btn"
          style={{
            display: 'inline-block', padding: '14px 36px',
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
          color: 'rgba(244,236,216,0.20)',
        }}>
          free to start ·{' '}
          <Link to="/pricing" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px solid rgba(244,236,216,0.18)' }}>
            see pricing
          </Link>
        </p>
      </section>

      {/* Footer */}
      <footer style={{
        padding: 'clamp(32px, 4vh, 48px) clamp(24px, 6vw, 80px)',
        borderTop: '1px solid rgba(244,236,216,0.07)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
        fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'rgba(244,236,216,0.20)',
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
      `}</style>
    </main>
  );
}

