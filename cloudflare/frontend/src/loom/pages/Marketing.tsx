import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLoomTheme } from '../theme';
import '../styles/loom.css';

/**
 * Marketing — long-form sales page for the Loom.
 *
 * Unlike the in-app screens, this page scrolls. It mirrors the
 * design-handoff marketing.html: hero with a living-loom canvas,
 * the thesis, the megafact, three primitives, the unlock spotlight,
 * a quote, four-tier pricing, and a CTA footer.
 *
 * Set inside .loom for theme tokens and font scoping; body.overflow
 * is left alone so the page can scroll vertically.
 */
const HERO_PICKS = [
  { y: 1962, m: 4, l: 1, k: 'photo' },
  { y: 1968, m: 9, l: 2, k: 'letter' },
  { y: 1971, m: 6, l: 0, k: 'milestone' },
  { y: 1974, m: 3, l: 3, k: 'voice' },
  { y: 1978, m: 11, l: 2, k: 'photo' },
  { y: 1981, m: 7, l: 1, k: 'letter' },
  { y: 1983, m: 5, l: 0, k: 'milestone' },
  { y: 1986, m: 2, l: 3, k: 'photo' },
  { y: 1989, m: 8, l: 2, k: 'letter' },
  { y: 1992, m: 1, l: 4, k: 'voice' },
  { y: 1995, m: 10, l: 1, k: 'photo' },
  { y: 1998, m: 6, l: 2, k: 'letter' },
  { y: 2001, m: 3, l: 3, k: 'memory' },
  { y: 2004, m: 9, l: 0, k: 'milestone' },
  { y: 2007, m: 4, l: 1, k: 'letter' },
  { y: 2010, m: 11, l: 2, k: 'photo' },
  { y: 2013, m: 7, l: 3, k: 'voice' },
  { y: 2016, m: 5, l: 1, k: 'letter' },
  { y: 2019, m: 8, l: 4, k: 'memory' },
  { y: 2022, m: 2, l: 2, k: 'photo' },
  { y: 2024, m: 6, l: 1, k: 'letter' },
  { y: 2026, m: 5, l: 0, k: 'milestone', warm: true },
  { y: 2031, m: 6, l: 2, k: 'letter', warm: true },
  { y: 2042, m: 8, l: 1, k: 'letter', warm: true },
  { y: 2055, m: 11, l: 3, k: 'letter', warm: true },
  { y: 2068, m: 4, l: 2, k: 'letter', warm: true },
];

const HERO_RESONANCES: [number, number][] = [
  [1, 8],
  [3, 16],
  [4, 18],
  [11, 21],
];

export function Marketing() {
  const { theme } = useLoomTheme();
  return (
    <div className="loom" data-theme={theme} style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <Header />
      <Hero />
      <Thesis />
      <Megafact />
      <ThreePrimitives />
      <UnlockSpotlight />
      <Quote />
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
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: 'color-mix(in srgb, var(--loom-ink) 72%, transparent)',
        borderBottom: '1px solid var(--loom-rule)',
      }}
    >
      <Link to="/loom" className="loom-mark" style={{ textDecoration: 'none' }}>
        <span className="infmark">∞</span>heirloom
      </Link>
      <nav style={{ display: 'flex', gap: 36, justifyContent: 'center' }}>
        {[
          { href: '#how', label: 'how it works' },
          { href: '#unlock', label: 'the unlock' },
          { href: '#kin', label: 'for families' },
          { href: '#price', label: 'keeping' },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            style={{
              color: 'var(--loom-bone-dim)',
              textDecoration: 'none',
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              fontWeight: 500,
              transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {l.label}
          </a>
        ))}
      </nav>
      <span style={{ display: 'flex', gap: 18, justifyContent: 'flex-end', alignItems: 'center' }}>
        <span className="loom-theme-pill">
          <button
            className={theme === 'dark' ? 'on' : ''}
            onClick={() => setTheme('dark')}
          >
            vault
          </button>
          <button
            className={theme === 'light' ? 'on' : ''}
            onClick={() => setTheme('light')}
          >
            paper
          </button>
        </span>
        <Link to="/signup" className="loom-btn" style={{ textDecoration: 'none' }}>
          begin a thread
        </Link>
      </span>
    </header>
  );
}

function Hero() {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '140px 56px 100px',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: 1280, width: '100%', textAlign: 'center' }}>
        <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)', marginBottom: 32 }}>
          ∞ &nbsp; a perpetual family loom · est. 2026
        </div>
        <h1
          className="loom-display"
          style={{
            fontSize: 'clamp(56px, 9vw, 144px)',
            margin: '0 0 28px',
            color: 'var(--loom-bone)',
          }}
        >
          Every life is a single thread.
          <br />
          <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--loom-warm)' }}>
            Yours runs through them all.
          </em>
        </h1>
        <p
          className="loom-serif"
          style={{
            fontVariationSettings: "'opsz' 28",
            fontStyle: 'italic',
            fontSize: 'clamp(20px, 1.8vw, 26px)',
            color: 'var(--loom-bone-dim)',
            maxWidth: 640,
            margin: '0 auto',
            lineHeight: 1.55,
            fontWeight: 300,
          }}
        >
          Heirloom is a family archive that lasts fifty years. You write into it. Quietly, an
          intelligence beneath the surface notices what your words rhyme with — across decades,
          across kin — and weaves them in.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 56 }}>
          <Link to="/signup" className="loom-btn" style={{ textDecoration: 'none' }}>
            begin your weft
          </Link>
          <Link to="/loom" className="loom-btn-ghost" style={{ textDecoration: 'none' }}>
            walk the demo →
          </Link>
        </div>
        <LivingLoom />
      </div>
    </section>
  );
}

/**
 * The headline canvas. Same picks + resonances as the in-app loom but
 * laid out for the marketing page (taller, centred, with a caption).
 */
function LivingLoom() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(900);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(() => {
      setW(ref.current?.clientWidth ?? 900);
    });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const startY = 1958;
  const endY = 2068;
  const xOf = (y: number) => ((y - startY) / (endY - startY)) * 100;
  const laneY = (l: number) => 36 + l * 56;

  return (
    <div style={{ margin: '80px auto 0', maxWidth: 1280, padding: '0 24px' }}>
      <div
        ref={ref}
        style={{
          position: 'relative',
          height: 360,
          borderTop: '1px solid var(--loom-rule)',
          borderBottom: '1px solid var(--loom-rule)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(to right, var(--loom-bone-ghost) 0, var(--loom-bone-ghost) 1px, transparent 1px, transparent 7px)`,
            opacity: 0.42,
            pointerEvents: 'none',
          }}
        />
        <div className="loom-shuttle" style={{ top: '50%' }} />

        {HERO_PICKS.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${xOf(p.y + (p.m ?? 0) / 12)}%`,
              top: `${laneY(p.l)}px`,
              width: p.k === 'milestone' ? 16 : 24,
              height: 2,
              borderRadius: 1,
              background: p.warm
                ? 'var(--loom-warm)'
                : p.k === 'memory'
                  ? 'rgba(244,236,216,0.5)'
                  : 'var(--loom-bone-dim)',
              boxShadow: p.warm ? '0 0 8px var(--loom-warm-glow)' : 'none',
            }}
          />
        ))}

        {HERO_RESONANCES.map(([a, b], i) => {
          const A = HERO_PICKS[a];
          const B = HERO_PICKS[b];
          const ax = xOf(A.y + (A.m ?? 0) / 12);
          const bx = xOf(B.y + (B.m ?? 0) / 12);
          const ay = laneY(A.l);
          const by = laneY(B.l);
          const top = Math.min(ay, by);
          const h = Math.abs(by - ay) + 16;
          return (
            <Fragment key={i}>
              <div
                style={{
                  position: 'absolute',
                  left: `${ax}%`,
                  top: `${top - 8}px`,
                  height: `${h}px`,
                  width: 1,
                  background: 'var(--loom-warm)',
                  opacity: 0.4,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: `${bx}%`,
                  top: `${top - 8}px`,
                  height: `${h}px`,
                  width: 1,
                  background: 'var(--loom-warm)',
                  opacity: 0.4,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: `${Math.min(ax, bx)}%`,
                  width: `${Math.abs(bx - ax)}%`,
                  top: `${(ay + by) / 2}px`,
                  height: 1,
                  background:
                    'linear-gradient(to right, transparent, var(--loom-warm), transparent)',
                  opacity: 0.55,
                }}
              />
            </Fragment>
          );
        })}

        {[1960, 1980, 2000, 2020, 2040, 2060].map((y) => (
          <div
            key={y}
            style={{
              position: 'absolute',
              left: `${xOf(y)}%`,
              transform: 'translateX(-50%)',
              bottom: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.06em',
              color: 'var(--loom-bone-faint)',
            }}
          >
            {y}
          </div>
        ))}

        {/* keep w referenced so the ResizeObserver isn't dead code */}
        <div style={{ display: 'none' }}>{w}</div>
      </div>
      <div
        style={{
          textAlign: 'center',
          marginTop: 28,
          fontFamily: "'Newsreader', serif",
          fontStyle: 'italic',
          fontSize: 16,
          color: 'var(--loom-bone-dim)',
        }}
      >
        a fragment of one woman's loom · 1958 — 2068 · five resonances
      </div>
    </div>
  );
}

function Thesis() {
  return (
    <section
      id="how"
      style={{ padding: '140px 56px', borderTop: '1px solid var(--loom-rule)' }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div
          className="loom-eyebrow"
          style={{ color: 'var(--loom-warm)', marginBottom: 32 }}
        >
          i. the thesis
        </div>
        <h2
          className="loom-h2"
          style={{
            fontSize: 'clamp(40px, 5vw, 72px)',
            color: 'var(--loom-bone)',
            margin: '0 0 32px',
            maxWidth: 920,
          }}
        >
          A vault doesn't remember.
          <br />
          <em style={{ fontStyle: 'italic', color: 'var(--loom-warm)' }}>A loom does.</em>
        </h2>
        <p
          className="loom-body"
          style={{
            fontSize: 22,
            lineHeight: 1.7,
            color: 'var(--loom-bone-dim)',
            maxWidth: 720,
          }}
        >
          Other archives are folders, feeds, timelines. They remember <em>that</em> you wrote, but
          not <em>what your words touched.</em> Heirloom does. Beneath every entry runs a quiet
          thread-finder — invisible, never named, never asking — that links the kitchen window you
          wrote about tonight to the kitchen window your mother wrote about in 1962, the year
          before you were born.
        </p>
      </div>
    </section>
  );
}

function Megafact() {
  return (
    <section style={{ padding: '100px 24px' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <div
          style={{
            fontFamily: "'Newsreader', serif",
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
          style={{
            fontFamily: "'Newsreader', serif",
            fontStyle: 'italic',
            fontSize: 22,
            color: 'var(--loom-bone-dim)',
            maxWidth: 560,
            margin: '24px auto 0',
            lineHeight: 1.55,
          }}
        >
          the only icon in the entire product. it marks every thread tied off against time.
        </div>
      </div>
    </section>
  );
}

function ThreePrimitives() {
  const cells = [
    {
      n: '01 · the weft',
      g: '〰',
      h: 'A horizontal band where every entry — letter, photo, voice, memory — is a single pick.',
      p: 'Time runs left to right across decades. Lanes hold kinds. Hover one, and the loom shows you what else it rhymes with.',
    },
    {
      n: '02 · the resonance',
      g: '∞',
      h: 'A warm vertical hairline, drawn between two threads the loom found rhyming across decades.',
      p: 'You wrote about patience tonight. Your father wrote about patience in 1989. The loom drew the line between them, quietly, while you slept.',
    },
    {
      n: '03 · the seal',
      g: '∞',
      h: 'A single typographic mark for every thread tied off against time.',
      p: 'When its date arrives — your granddaughter\'s eighteenth, your son\'s wedding morning — the cord burns, the seal dissolves, the cloth opens. Four seconds. The most-shared moment in the product.',
    },
  ];
  return (
    <section style={{ padding: '140px 56px', borderTop: '1px solid var(--loom-rule)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)', marginBottom: 32 }}>
          ii. three primitives
        </div>
        <h2
          className="loom-h2"
          style={{ fontSize: 'clamp(40px, 5vw, 72px)', margin: '0 0 32px' }}
        >
          The whole product is three things.
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'var(--loom-rule)',
            marginTop: 80,
            borderTop: '1px solid var(--loom-rule)',
            borderBottom: '1px solid var(--loom-rule)',
          }}
        >
          {cells.map((c, i) => (
            <div
              key={i}
              style={{
                background: 'var(--loom-ink)',
                padding: '56px 40px',
                minHeight: 380,
                display: 'grid',
                gridTemplateRows: 'auto 1fr auto',
                gap: 24,
              }}
            >
              <span
                className="loom-mono"
                style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--loom-warm)' }}
              >
                {c.n}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: "'Newsreader', serif",
                    fontSize: 36,
                    color: 'var(--loom-warm)',
                    lineHeight: 1,
                    fontWeight: 300,
                  }}
                >
                  {c.g}
                </div>
                <h3
                  style={{
                    fontFamily: "'Newsreader', serif",
                    fontVariationSettings: "'opsz' 28",
                    fontWeight: 400,
                    fontSize: 28,
                    lineHeight: 1.2,
                    margin: '24px 0 0',
                    color: 'var(--loom-bone)',
                  }}
                >
                  {c.h}
                </h3>
              </div>
              <p
                className="loom-body"
                style={{
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: 'var(--loom-bone-dim)',
                  margin: 0,
                }}
              >
                {c.p}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UnlockSpotlight() {
  return (
    <section
      id="unlock"
      style={{ padding: '160px 56px', borderTop: '1px solid var(--loom-rule)' }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 100,
          alignItems: 'center',
        }}
      >
        <div>
          <div
            className="loom-eyebrow"
            style={{ color: 'var(--loom-warm)', marginBottom: 32 }}
          >
            iii. the unlock
          </div>
          <h2 className="loom-h2" style={{ fontSize: 'clamp(40px, 5vw, 72px)', margin: '0 0 32px' }}>
            The most shareable
            <br />
            four seconds
            <br />
            in software.
          </h2>
          <p
            className="loom-body"
            style={{
              fontSize: 22,
              lineHeight: 1.7,
              color: 'var(--loom-bone-dim)',
              maxWidth: 720,
            }}
          >
            When a sealed thread reaches its date, it doesn't <em>open</em> — it <em>weaves</em>{' '}
            back in. The cord burns. The seal dissolves. The cloth unfolds. Whoever is reading at
            that moment is the recipient. Often, they share it.
          </p>
          <div style={{ marginTop: 40 }}>
            <Link to="/loom/unlock" className="loom-btn-ghost" style={{ textDecoration: 'none' }}>
              watch the unlock →
            </Link>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div
            style={{
              fontFamily: "'Newsreader', serif",
              fontSize: 64,
              color: 'var(--loom-warm)',
              lineHeight: 1,
              fontWeight: 300,
              marginBottom: 20,
            }}
          >
            ∞
          </div>
          <div
            className="loom-mono"
            style={{
              fontSize: 13,
              color: 'var(--loom-bone-faint)',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            2055 · 11 · 08
          </div>
          <div
            className="loom-serif"
            style={{ fontStyle: 'italic', fontSize: 24, color: 'var(--loom-bone)' }}
          >
            <em>for iris, on her thirty-first</em>
          </div>
          <div
            style={{
              marginTop: 32,
              height: 1,
              width: 80,
              background: 'var(--loom-warm)',
              margin: '32px auto 0',
              opacity: 0.4,
            }}
          />
          <div
            className="loom-mono"
            style={{
              fontSize: 13,
              color: 'var(--loom-bone-faint)',
              letterSpacing: '0.08em',
              marginTop: 32,
            }}
          >
            29 yrs · 6 mo · 4 days remaining
          </div>
        </div>
      </div>
    </section>
  );
}

function Quote() {
  return (
    <section
      style={{ padding: '140px 56px', borderTop: '1px solid var(--loom-rule)' }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 100,
          alignItems: 'center',
        }}
      >
        <div style={{ borderLeft: '1px solid var(--loom-warm)', paddingLeft: 36 }}>
          <blockquote
            style={{
              fontFamily: "'Newsreader', serif",
              fontVariationSettings: "'opsz' 56",
              fontWeight: 300,
              fontStyle: 'italic',
              fontSize: 32,
              lineHeight: 1.35,
              color: 'var(--loom-bone)',
              margin: 0,
              letterSpacing: '-0.012em',
            }}
          >
            "I wrote a letter to my granddaughter on a tuesday in May. Six months later, while I
            was making bread, the loom told me I'd been writing the same letter, in different
            words, for thirty years."
          </blockquote>
          <cite
            style={{
              display: 'block',
              marginTop: 28,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'var(--loom-bone-faint)',
              fontStyle: 'normal',
            }}
          >
            — Eleanor H., heirloom keeper since 2026
          </cite>
        </div>
        <div>
          <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)', marginBottom: 32 }}>
            iv. what people say
          </div>
          <h2
            className="loom-h2"
            style={{ fontSize: 'clamp(32px, 4vw, 56px)', margin: '0 0 32px' }}
          >
            It is not a feed. <em style={{ color: 'var(--loom-warm)' }}>It is a noticing.</em>
          </h2>
          <p
            className="loom-body"
            style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--loom-bone-dim)' }}
          >
            We have built archives for a hundred years. None of them noticed. The thing that's new
            in 2026 is the noticing — quiet, accurate, never in your way. The interface is what's
            left when you take everything else out.
          </p>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      eyebrow: 'trial',
      name: 'For the first fortnight',
      price: 'free',
      sub: '· 14 days',
      bullets: [
        '10 memories · 5 minutes voice · 3 letters',
        'everything encrypted in browser',
        'content removed if unkept',
      ],
      cta: 'begin',
      to: '/signup',
      featured: false,
    },
    {
      eyebrow: 'essential',
      name: 'For one keeper',
      price: '$2.99',
      sub: ' /mo',
      bullets: [
        '100 memories · 30 minutes voice · 20 letters',
        '1 GB · seven currencies',
        'full resonance engine',
      ],
      cta: 'choose',
      to: '/signup',
      featured: false,
    },
    {
      eyebrow: 'family · most chosen',
      name: 'For a household',
      price: '$11.99',
      sub: ' /mo',
      bullets: [
        'unlimited memories · 60 minutes voice',
        '10 GB · shared loom · cross-kin resonances',
        'up to 6 keepers, one weft',
      ],
      cta: 'choose family',
      to: '/signup',
      featured: true,
    },
    {
      eyebrow: 'legacy',
      name: 'For fifty years',
      price: '$299',
      sub: ' /yr',
      bullets: [
        'everything unlimited',
        '100 GB · perpetual archive',
        'printed yearly volume · vellum-bound',
      ],
      cta: 'choose legacy',
      to: '/founder',
      featured: false,
    },
  ];
  return (
    <section
      id="price"
      style={{ padding: '140px 56px', borderTop: '1px solid var(--loom-rule)' }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)', marginBottom: 32 }}>
          v. keeping
        </div>
        <h2
          className="loom-h2"
          style={{ fontSize: 'clamp(40px, 5vw, 72px)', margin: '0 0 32px' }}
        >
          The cost of being kept.
        </h2>
        <p
          className="loom-body"
          style={{ fontSize: 22, lineHeight: 1.7, color: 'var(--loom-bone-dim)' }}
        >
          A thread costs almost nothing. A loom that lasts fifty years costs a little more.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 1,
            background: 'var(--loom-rule)',
            marginTop: 80,
          }}
        >
          {tiers.map((t, i) => (
            <div
              key={i}
              style={{
                background: t.featured ? 'var(--loom-ink-card)' : 'var(--loom-ink)',
                padding: '44px 32px',
                minHeight: 460,
                display: 'grid',
                gridTemplateRows: 'auto auto auto 1fr auto',
                gap: 18,
              }}
            >
              <span
                className="loom-eyebrow"
                style={{ fontSize: 10, color: t.featured ? 'var(--loom-warm)' : undefined }}
              >
                {t.eyebrow}
              </span>
              <div
                style={{
                  fontFamily: "'Newsreader', serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 22,
                  color: 'var(--loom-bone)',
                }}
              >
                {t.name}
              </div>
              <div
                style={{
                  fontFamily: "'Newsreader', serif",
                  fontVariationSettings: "'opsz' 56",
                  fontWeight: 200,
                  fontSize: 56,
                  lineHeight: 1,
                  color: 'var(--loom-bone)',
                  letterSpacing: '-0.02em',
                }}
              >
                {t.price}
                <small
                  style={{
                    fontSize: 14,
                    color: 'var(--loom-bone-faint)',
                    marginLeft: 4,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.04em',
                  }}
                >
                  {t.sub}
                </small>
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'grid',
                  gap: 10,
                }}
              >
                {t.bullets.map((b, j) => (
                  <li
                    key={j}
                    style={{
                      fontFamily: "'Newsreader', serif",
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
                        left: 4,
                        top: -2,
                        color: 'var(--loom-warm)',
                        fontSize: 18,
                      }}
                    >
                      ·
                    </span>
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
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--loom-rule)',
        padding: '80px 56px 56px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 56,
        alignItems: 'end',
      }}
    >
      <div>
        <h4
          style={{
            fontFamily: "'Newsreader', serif",
            fontVariationSettings: "'opsz' 56",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 56,
            color: 'var(--loom-bone)',
            margin: '0 0 24px',
            letterSpacing: '-0.014em',
          }}
        >
          Begin a thread.
          <br />
          <em style={{ fontStyle: 'italic' }}>Today is a good day for it.</em>
        </h4>
        <Link to="/signup" className="loom-btn" style={{ textDecoration: 'none' }}>
          begin your weft &nbsp; →
        </Link>
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.08em',
          color: 'var(--loom-bone-faint)',
          textAlign: 'right',
          lineHeight: 2,
        }}
      >
        heirloom · est. 2026
        <br />
        end-to-end encrypted in browser
        <br />
        key escrow · two-of-three contacts
        <br />
        48-hour cooldown · WCAG 2.2 AA
        <br />© 2026 heirloom · all threads reserved
      </div>
    </footer>
  );
}
