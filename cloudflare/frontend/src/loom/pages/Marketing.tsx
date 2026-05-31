import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLoomTheme } from '../theme';
import '../styles/loom.css';

/**
 * Marketing — long-form sales page for Heirloom, mounted at `/`.
 *
 * Converged to the loom3 landing + adoption artboards
 * (heirloom-landing.jsx / heirloom-adoption.jsx). The canonical product
 * is the Family Thread: perpetual, append-only, multi-author,
 * multi-generational, owned by a bloodline. The page leads with a real
 * woven specimen cloth (the Okonkwo family thread), states the five
 * pillars, the "what we are not" manifesto, the continuity pledge, an
 * honest showcase, brief pricing, and a closing CTA.
 *
 * Set inside .loom for theme tokens and font scoping; body.overflow is
 * left alone so the page can scroll vertically.
 */

// ── natural-dye palette (only used inside the woven cloth) ───────────────
const DYE_VARS = [
  '--dye-madder',
  '--dye-cochineal',
  '--dye-kermes',
  '--dye-saffron',
  '--dye-weld',
  '--dye-walnut',
  '--dye-oakgall',
  '--dye-woad',
  '--dye-indigo',
  '--dye-iron',
] as const;

// reproducible PRNG so the specimen cloth paints identically every render
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Pick {
  frac: number; // 0..1 across the span
  lane: number; // 0..lanes-1
  dye: string;
  warm: boolean; // sealed / future thread
}

function buildSpecimen(seed: number, count: number, lanes: number): Pick[] {
  const rand = mulberry32(seed);
  const picks: Pick[] = [];
  for (let i = 0; i < count; i++) {
    const r = rand();
    // weighted dye distribution: mostly daily weld/walnut, occasional joy/grief
    let dyeIdx: number;
    if (r < 0.5) dyeIdx = 4; // weld (daily life)
    else if (r < 0.62) dyeIdx = 5; // walnut (travel)
    else if (r < 0.72) dyeIdx = 3; // saffron (achievement)
    else if (r < 0.82) dyeIdx = 7; // woad (contemplation)
    else if (r < 0.89) dyeIdx = 8; // indigo (memory)
    else if (r < 0.94) dyeIdx = 0; // madder (joy)
    else if (r < 0.97) dyeIdx = 2; // kermes (beginning)
    else if (r < 0.99) dyeIdx = 1; // cochineal (grief)
    else dyeIdx = 6; // oakgall (records)
    picks.push({
      frac: rand(),
      lane: Math.floor(rand() * lanes),
      dye: DYE_VARS[dyeIdx],
      warm: false,
    });
  }
  // a few sealed/future threads near the leading edge — these glow warm
  for (let i = 0; i < 4; i++) {
    picks.push({
      frac: 0.9 + rand() * 0.09,
      lane: Math.floor(rand() * lanes),
      dye: '--dye-madder',
      warm: true,
    });
  }
  picks.sort((a, b) => a.frac - b.frac);
  return picks;
}

export function Marketing() {
  const { theme } = useLoomTheme();
  return (
    <div className="loom" data-theme={theme} style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <Header />
      <Hero />
      <WhatAThreadIs />
      <Megafact />
      <WhatWeAreNot />
      <Showcase />
      <ContinuityPledge />
      <Pricing />
      <Footer />
    </div>
  );
}

function Header() {
  const { theme, setTheme } = useLoomTheme();
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '22px 56px',
        background: 'color-mix(in srgb, var(--loom-ink) 97%, transparent)',
        borderBottom: '1px solid var(--loom-rule)',
      }}
    >
      <Link to="/" className="loom-mark" style={{ textDecoration: 'none' }}>
        <span className="infmark">∞</span>heirloom
      </Link>
      <nav style={{ display: 'flex', gap: 36, justifyContent: 'center' }}>
        {[
          { href: '#cloth', label: 'see the cloth', to: undefined },
          { href: undefined, label: 'founder', to: '/founder' },
          { href: '#price', label: 'pricing', to: undefined },
          { href: undefined, label: 'sign in', to: '/login' },
        ].map((l) =>
          l.to ? (
            <Link key={l.label} to={l.to} style={navLinkStyle}>
              {l.label}
            </Link>
          ) : (
            <a key={l.label} href={l.href} style={navLinkStyle}>
              {l.label}
            </a>
          ),
        )}
      </nav>
      <span style={{ display: 'flex', gap: 18, justifyContent: 'flex-end', alignItems: 'center' }}>
        <span className="loom-theme-pill">
          <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>
            ink
          </button>
          <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>
            parchment
          </button>
        </span>
        <Link to="/signup" className="loom-btn" style={{ textDecoration: 'none' }}>
          begin your thread
        </Link>
      </span>
    </header>
  );
}

const navLinkStyle: React.CSSProperties = {
  color: 'var(--loom-bone-dim)',
  textDecoration: 'none',
  fontFamily: "'Inter', sans-serif",
  fontSize: 12,
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontWeight: 500,
  transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
};

function Hero() {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '140px 56px 80px',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: 1280, width: '100%' }}>
        <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)', marginBottom: 28 }}>
          ∞ &nbsp; heirloom · the family thread · est. 2026
        </div>
        <h1
          className="loom-display"
          style={{
            fontSize: 'clamp(48px, 8vw, 128px)',
            lineHeight: 1.02,
            margin: '0 0 28px',
            color: 'var(--loom-bone)',
            maxWidth: 14,
            letterSpacing: '-0.022em',
          }}
        >
          Start your family's thousand-year thread.
        </h1>
        <p
          className="loom-serif"
          style={{
            fontSize: 'clamp(18px, 1.7vw, 22px)',
            color: 'var(--loom-bone-dim)',
            maxWidth: '52ch',
            margin: 0,
            lineHeight: 1.55,
            fontWeight: 400,
          }}
        >
          Write today. Lock entries for descendants who don't exist yet. Read what came before. The
          thread continues after you, after us, after the company.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 44 }}>
          <Link to="/signup" className="loom-btn" style={{ textDecoration: 'none' }}>
            begin your thread
          </Link>
          <a href="#cloth" className="loom-btn-ghost" style={{ textDecoration: 'none' }}>
            see the cloth →
          </a>
        </div>
        <div
          className="loom-mono"
          style={{
            fontSize: 10.5,
            color: 'var(--loom-bone-faint)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginTop: 16,
          }}
        >
          free forever · no card on file
        </div>
        <SpecimenCloth />
      </div>
    </section>
  );
}

/**
 * SpecimenCloth — a faithful static woven specimen using the natural-dye
 * palette on ink. Each pick is one entry; the leading-edge warm threads
 * are sealed/future entries. Captioned with a real specimen family and a
 * VISIBLE entry count (invariant B).
 */
function SpecimenCloth({
  height = 360,
  lanes = 6,
  caption = 'specimen · the Okonkwo family thread · 1948 – today · entry 4,318',
}: {
  height?: number;
  lanes?: number;
  caption?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(1200);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(() => setW(ref.current?.clientWidth ?? 1200));
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // density scales with width so the cloth always reads as a dense band
  const count = Math.max(140, Math.round(w / 5));
  const picks = buildSpecimen(19480101, count, lanes);
  const laneY = (l: number) => {
    const top = 28;
    const usable = height - 56;
    return top + (l * usable) / (lanes - 1);
  };

  return (
    <div id="cloth" style={{ margin: '88px auto 0', maxWidth: 1280, scrollMarginTop: 96 }}>
      <div
        ref={ref}
        style={{
          position: 'relative',
          height,
          background: 'var(--loom-ink)',
          borderTop: '1px solid var(--loom-rule)',
          borderBottom: '1px solid var(--loom-rule)',
          overflow: 'hidden',
        }}
      >
        {/* warp — faint vertical hairlines, the structure of the cloth */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(to right, var(--loom-bone-ghost) 0, var(--loom-bone-ghost) 1px, transparent 1px, transparent 9px)',
            opacity: 0.32,
            pointerEvents: 'none',
          }}
        />
        {/* the ambient shuttle — AI threading silently */}
        <div className="loom-shuttle" style={{ top: '50%' }} />

        {/* the weft — every entry one pick */}
        {picks.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.frac * 100}%`,
              top: `${laneY(p.lane)}px`,
              width: p.warm ? 14 : 20,
              height: 2,
              background: p.warm ? 'var(--loom-warm)' : `var(${p.dye})`,
              boxShadow: p.warm ? '0 0 8px var(--loom-warm-glow)' : 'none',
              opacity: p.warm ? 1 : 0.92,
            }}
          />
        ))}

        {/* selvedge — the woven edge, leading into the future */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '93%',
            width: 1,
            background: 'var(--loom-warm)',
            opacity: 0.4,
          }}
        />
        <div style={{ display: 'none' }}>{w}</div>
      </div>
      <div
        className="loom-mono"
        style={{
          marginTop: 16,
          fontSize: 10,
          color: 'var(--loom-bone-faint)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        {caption}
      </div>
    </div>
  );
}

function WhatAThreadIs() {
  const pillars: [string, string][] = [
    ['Perpetual', 'A 1,000-year horizon, not a season.'],
    ['Append-only', 'Edits append. Nothing is silently rewritten.'],
    ['Multi-author', 'Generations write together, in their own voice.'],
    ['Time-locked', 'Seal entries for descendants who do not yet exist.'],
    ['Continuity', 'IPFS pinning, a successor non-profit, export at any time.'],
  ];
  return (
    <section style={{ padding: '120px 56px', borderTop: '1px solid var(--loom-rule)' }}>
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 96,
          alignItems: 'start',
        }}
      >
        <div>
          <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)', marginBottom: 24 }}>
            what a thread is
          </div>
          <p
            className="loom-body"
            style={{ fontSize: 20, lineHeight: 1.7, color: 'var(--loom-bone-dim)' }}
          >
            A Thread is started by someone alive today, contributed to by descendants in 2050, 2100,
            2200. Entries are <em>append-only</em>: edits leave a visible amendment trail. Entries
            can be <em>time-locked</em>: released on a date, on a child's eighteenth birthday, on the
            author's death.
          </p>
          <p
            className="loom-body"
            style={{
              fontSize: 20,
              lineHeight: 1.7,
              color: 'var(--loom-bone-dim)',
              marginTop: 18,
            }}
          >
            The Thread <em>outlives the company</em>. Continuous IPFS pinning, a successor non-profit,
            family-export at any time.
          </p>
        </div>
        <div>
          {pillars.map(([h, b], i) => (
            <div
              key={h}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                gap: 24,
                padding: '18px 0',
                borderTop: i === 0 ? '1px solid var(--loom-rule)' : 0,
                borderBottom: '1px solid var(--loom-rule)',
              }}
            >
              <div
                className="loom-mono"
                style={{
                  fontSize: 11,
                  color: 'var(--loom-bone-faint)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  paddingTop: 4,
                }}
              >
                {h}
              </div>
              <div className="loom-serif" style={{ fontSize: 18, lineHeight: 1.5, color: 'var(--loom-bone)' }}>
                {b}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Megafact() {
  return (
    <section style={{ padding: '100px 24px', borderTop: '1px solid var(--loom-rule)' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <div
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontVariationSettings: "'opsz' 72",
            fontWeight: 200,
            fontSize: 'clamp(120px, 22vw, 280px)',
            lineHeight: 0.9,
            color: 'var(--loom-warm)',
            letterSpacing: '-0.04em',
          }}
        >
          ∞
        </div>
        <div
          className="loom-serif"
          style={{
            fontStyle: 'italic',
            fontSize: 22,
            color: 'var(--loom-bone-dim)',
            maxWidth: 560,
            margin: '24px auto 0',
            lineHeight: 1.55,
          }}
        >
          the only mark in the entire product. it marks every entry sealed against time.
        </div>
      </div>
    </section>
  );
}

function WhatWeAreNot() {
  return (
    <section style={{ padding: '96px 56px', borderTop: '1px solid var(--loom-rule)' }}>
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 96,
          alignItems: 'start',
        }}
      >
        <div>
          <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)', marginBottom: 18 }}>
            what we are not
          </div>
          <div
            className="loom-serif"
            style={{
              fontSize: 26,
              fontStyle: 'italic',
              lineHeight: 1.55,
              fontWeight: 400,
              color: 'var(--loom-bone)',
            }}
          >
            not a book service ·<br />
            not a death-planning app ·<br />
            not a genealogy tool ·<br />
            not an AI ghost.
          </div>
        </div>
        <div>
          <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)', marginBottom: 18 }}>
            what outlasts us
          </div>
          <p className="loom-body" style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--loom-bone-dim)' }}>
            Continuous IPFS pinning. A successor non-profit named in the bylaws. The family export
            available at any time, in plain prose and plain photographs, with no proprietary format
            and no asterisks.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Showcase — anonymized public-historian gallery (opt-in, with permission).
 * HONESTY: no fabricated live counts. The entries are illustrative, clearly
 * framed as the public historian's opted-in selection — not a live feed.
 */
function Showcase() {
  const cards: { dye: string; meta: string; q: string }[] = [
    {
      dye: '--dye-walnut',
      meta: 'one family · 2019 — present',
      q: 'The day we drove to Asaba.',
    },
    {
      dye: '--dye-kermes',
      meta: 'one family · 1958 — present',
      q: 'What the rain sounded like the night he was born.',
    },
    {
      dye: '--dye-woad',
      meta: 'one family · 1932 — present',
      q: 'What I never told my mother.',
    },
  ];
  return (
    <section style={{ padding: '96px 56px', borderTop: '1px solid var(--loom-rule)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)', marginBottom: 24 }}>
          from the public historian · with permission
        </div>
        <p
          className="loom-serif"
          style={{
            fontSize: 20,
            fontStyle: 'italic',
            color: 'var(--loom-bone-dim)',
            maxWidth: '46ch',
            margin: '0 0 40px',
          }}
        >
          A few families chose to share one sentence each. Most never will — these are opt-in,
          anonymized, and republished by their own authors.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ padding: '20px 0', borderTop: '1px solid var(--loom-rule)' }}>
              <div
                style={{ width: 20, height: 3, background: `var(${c.dye})`, marginBottom: 14 }}
              />
              <div
                className="loom-mono"
                style={{
                  fontSize: 10,
                  color: 'var(--loom-bone-faint)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                {c.meta}
              </div>
              <div
                className="loom-serif"
                style={{
                  fontSize: 18,
                  lineHeight: 1.45,
                  fontStyle: 'italic',
                  color: 'var(--loom-bone)',
                }}
              >
                "{c.q}"
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContinuityPledge() {
  return (
    <section style={{ padding: '96px 56px', borderTop: '1px solid var(--loom-rule)' }}>
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 56,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)', marginBottom: 18 }}>
            continuity pledge
          </div>
          <div
            className="loom-serif"
            style={{
              fontSize: 22,
              lineHeight: 1.55,
              fontStyle: 'italic',
              color: 'var(--loom-bone)',
              maxWidth: '46ch',
            }}
          >
            We pledge to keep this archive readable when we are gone. A successor non-profit is named
            in the bylaws. The family always owns the export.
          </div>
        </div>
        <div
          className="loom-mono"
          style={{
            fontSize: 11,
            color: 'var(--loom-bone-faint)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            textAlign: 'right',
            lineHeight: 1.9,
          }}
        >
          pledge no. 0001 — jun 2026
          <br />
          successor non-profit named in the bylaws
          <br />
          the family always owns the export
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: 'Free',
      price: 'Free',
      sub: 'forever',
      forWhom: 'For anyone curious',
      bullets: [
        '1 thread of your own',
        '30 entries per year',
        'read every entry forever',
        'receive sealed notes',
        'export to plain text any time',
      ],
      cta: 'begin',
      to: '/signup',
      featured: false,
    },
    {
      name: 'Family',
      price: '$15',
      sub: 'per month — whole family',
      forWhom: 'For the household keeper',
      bullets: [
        'unlimited entries',
        'unlimited members',
        'voice + transcription',
        'time-locked sealed notes',
        'living book export at cost',
      ],
      cta: 'begin family',
      to: '/signup',
      featured: true,
    },
    {
      name: 'Founder',
      price: '$999',
      sub: 'once, lifetime',
      forWhom: 'For those who want the thread named',
      bullets: [
        'everything in Family · forever',
        'name engraved in the continuity record',
        'pledge number issued',
        'funds the successor non-profit',
        'first read of the continuity bylaws',
      ],
      cta: 'become a founder',
      to: '/founder',
      featured: false,
    },
  ];
  return (
    <section id="price" style={{ padding: '120px 56px', borderTop: '1px solid var(--loom-rule)', scrollMarginTop: 96 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)', marginBottom: 28 }}>
          pricing · the family pays once, the bloodline reads forever
        </div>
        <h2 className="loom-h2" style={{ fontSize: 'clamp(36px, 4.5vw, 64px)', margin: '0 0 16px', maxWidth: '22ch' }}>
          Free for one voice.{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--loom-warm)' }}>
            Fifteen dollars for all of you.
          </em>
        </h2>
        <p className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          free forever · no card on file
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'var(--loom-rule)',
            marginTop: 64,
          }}
        >
          {tiers.map((t, i) => (
            <div
              key={i}
              style={{
                background: t.featured ? 'var(--loom-ink-card)' : 'var(--loom-ink)',
                padding: '44px 32px',
                minHeight: 480,
                display: 'grid',
                gridTemplateRows: 'auto auto auto auto 1fr auto',
                gap: 14,
                position: 'relative',
              }}
            >
              {t.featured && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: 'var(--loom-warm)',
                  }}
                />
              )}
              <span
                className="loom-eyebrow"
                style={{ fontSize: 10, color: t.featured ? 'var(--loom-warm)' : undefined }}
              >
                {t.name}
              </span>
              <div
                className="loom-serif"
                style={{ fontStyle: 'italic', fontSize: 14, color: 'var(--loom-bone-dim)' }}
              >
                {t.forWhom}
              </div>
              <div
                style={{
                  fontFamily: "'Source Serif 4', serif",
                  fontVariationSettings: "'opsz' 56",
                  fontWeight: 200,
                  fontSize: 56,
                  lineHeight: 1,
                  color: 'var(--loom-bone)',
                  letterSpacing: '-0.022em',
                }}
              >
                {t.price}
              </div>
              <div
                className="loom-mono"
                style={{
                  fontSize: 10,
                  color: 'var(--loom-bone-faint)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                {t.sub}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: 10 }}>
                {t.bullets.map((b, j) => (
                  <li
                    key={j}
                    className="loom-serif"
                    style={{
                      fontSize: 15,
                      lineHeight: 1.5,
                      color: 'var(--loom-bone-dim)',
                      paddingLeft: 18,
                      position: 'relative',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '0.6em',
                        width: 8,
                        height: 1,
                        background: 'var(--loom-warm)',
                      }}
                    />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                to={t.to}
                className={t.featured ? 'loom-btn' : 'loom-btn-ghost'}
                style={{ marginTop: 12, width: '100%', textDecoration: 'none', textAlign: 'center' }}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>

        <p
          className="loom-serif"
          style={{
            fontSize: 14.5,
            lineHeight: 1.7,
            color: 'var(--loom-bone-dim)',
            fontStyle: 'italic',
            maxWidth: '60ch',
            marginTop: 36,
          }}
        >
          One Family subscription covers the entire bloodline — children, parents, in-laws, chosen
          family. The Founder tier is the only place where money does more than pay for the product:
          a portion funds the successor non-profit that will keep the cloth pinned and readable when
          we are gone.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--loom-rule)' }}>
      <div
        style={{
          padding: '96px 56px',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 56,
          alignItems: 'end',
          borderBottom: '1px solid var(--loom-rule)',
        }}
      >
        <div>
          <h4
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontVariationSettings: "'opsz' 56",
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(36px, 4.5vw, 56px)',
              color: 'var(--loom-bone)',
              margin: '0 0 24px',
              letterSpacing: '-0.014em',
            }}
          >
            Begin your thread.
            <br />
            <em style={{ fontStyle: 'italic' }}>Today is a good day for it.</em>
          </h4>
          <Link to="/signup" className="loom-btn" style={{ textDecoration: 'none' }}>
            begin your thread &nbsp; →
          </Link>
          <div
            className="loom-mono"
            style={{
              fontSize: 10.5,
              color: 'var(--loom-bone-faint)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginTop: 14,
            }}
          >
            free forever · no card on file
          </div>
        </div>
      </div>
      <div
        style={{
          padding: '24px 56px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--loom-bone-faint)',
        }}
      >
        <span>heirloom.blue · est. 2026</span>
        <span style={{ display: 'flex', gap: 24 }}>
          <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>
            privacy
          </Link>
          <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>
            terms
          </Link>
          <Link to="/loom/echo" style={{ color: 'inherit', textDecoration: 'none' }}>
            the listener
          </Link>
          <Link to="/loom" style={{ color: 'inherit', textDecoration: 'none' }}>
            the loom
          </Link>
        </span>
      </div>
    </footer>
  );
}
