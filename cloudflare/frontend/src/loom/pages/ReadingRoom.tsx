import { useState, useEffect, lazy, Suspense, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ClothPage } from '../components/ClothPage';
import { threadsApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const ClothCanvas3D = lazy(() =>
  import('../components/ClothCanvas3D').then(m => ({ default: m.ClothCanvas3D }))
);

/**
 * Screen 07 — The Reading Room (world-first 3D rebuild)
 *
 * Three.js ClothCanvas3D backdrop, selvedge nav, ClothPage artifact reader,
 * AI margin annotations, full-screen BookView on cloth.
 */

// ── Dye palette ───────────────────────────────────────────────────────────────
const DYE_HEX: Record<string, string> = {
  madder:   '#c0614a', indigo:  '#3d5a8a', weld:    '#d4a843',
  saffron:  '#e8a825', kermes:  '#9e3a5a', walnut:  '#7a5c3a',
  oakgall:  '#5a4a3a', woad:    '#5b7fa6', cochineal:'#b84060', iron: '#4a4a4a',
};

// ── Deterministic hash (no Math.random) ───────────────────────────────────────
function sineHash(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ── CLOTH_BG_ENTRIES — 48 deterministic entries ───────────────────────────────
const DYE_KEYS = ['madder','cochineal','kermes','saffron','weld','walnut','oakgall','woad','indigo','iron'] as const;
type DyeKey = typeof DYE_KEYS[number];

const CLOTH_BG_ENTRIES = Array.from({ length: 48 }, (_, i) => ({
  date: new Date(1960 + Math.floor(sineHash(i * 17 + 1) * 66), 0, 1),
  dye: DYE_KEYS[i % DYE_KEYS.length] as DyeKey,
  locked: i % 4 === 0,
}));

// ── AI_ANNOTATIONS ────────────────────────────────────────────────────────────
const AI_ANNOTATIONS: Record<number, { text: string; passage: string }> = {
  0: { text: 'Eleanor wrote this · 2026', passage: 'slanted, low' },
  1: { text: 'Maya hums this · 2013',     passage: 'six notes' },
  2: { text: 'Margaret · 1986',           passage: 'kitchen window' },
  3: { text: 'same hum · 1992',           passage: 'six notes' },
  4: { text: 'Margaret sat here · 1986',  passage: 'windowsill' },
};

// ── THREADS data ──────────────────────────────────────────────────────────────
const THREADS = [
  { kind: 'photo'  as const, date: '1986·05·14', title: 'the kitchen window, daffodils',   who: 'Margaret', dye: 'weld' },
  { kind: 'voice'  as const, date: '1992·01·07', title: 'humming, sunday',                 who: 'Margaret', dye: 'weld',    duration: '0:38' },
  { kind: 'letter' as const, date: '2026·05·04', title: 'the kitchen window, in late may', who: 'Eleanor',  dye: 'madder' },
  { kind: 'voice'  as const, date: '2013·07·22', title: 'Maya, calling from Berlin',       who: 'Maya',     dye: 'indigo',  duration: '2:14' },
  { kind: 'photo'  as const, date: '2024·06·02', title: 'Iris asleep on the windowsill',   who: 'Eleanor',  dye: 'madder' },
];
type Thread = typeof THREADS[number];
type Kind = Thread['kind'];

// ── API entry → Thread mapper ─────────────────────────────────────────────────
function hashStr(s: string): number {
  return s.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
}

function mapThreadEntry(e: {
  id: string;
  title: string | null;
  created_at: string;
  visibility: string;
  author_member_id: string;
  pending_lock: string | null;
  era_year?: number | null;
}): Thread {
  return {
    kind: 'letter' as const,
    date: new Date(e.created_at).toISOString().slice(0, 10).replace(/-/g, '·'),
    title: e.title ?? '(untitled)',
    who: 'author',
    dye: DYE_KEYS[Math.abs(hashStr(e.author_member_id ?? '')) % DYE_KEYS.length],
  };
}

// ── ∞ is the only mark ────────────────────────────────────────────────────────
const GLYPH: Record<Kind, string> = { photo: '∞', voice: '∞', letter: '∞' };

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

// ── ReadingContent ────────────────────────────────────────────────────────────
function ReadingContent({
  t, dye, annotation, onPrev, onNext, activeIndex, total,
}: {
  t: Thread;
  dye: string;
  annotation?: { text: string; passage: string };
  onPrev?: () => void;
  onNext?: () => void;
  activeIndex: number;
  total: number;
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '52px 24px 40px',
    }}>
      <div style={{ maxWidth: 660, width: '100%', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* AI margin annotation */}
        {annotation && (
          <div style={{
            position: 'absolute',
            right: 'calc(100% + 32px)',
            top: 180,
            width: 110,
            textAlign: 'right',
            fontFamily: 'var(--mono)',
            fontSize: 9,
            lineHeight: 1.55,
            color: 'var(--warm)',
            opacity: 0.5,
          }}>
            <div>∞ {annotation.text}</div>
            <div style={{ borderTop: '1px solid rgba(176,122,74,0.3)', marginTop: 6, paddingTop: 6, fontSize: 8, fontStyle: 'italic' }}>
              re: "{annotation.passage}"
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: dye,
          letterSpacing: '0.04em',
          marginBottom: 12,
        }}>
          ∞ &nbsp; {t.kind} · written by {t.who}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: 'var(--serif)',
          fontSize: 'clamp(24px, 3.5vw, 34px)',
          fontWeight: 300,
          fontStyle: 'italic',
          fontVariationSettings: '"opsz" 36',
          margin: '0 0 8px',
          color: 'var(--bone)',
          lineHeight: 1.2,
        }}>
          {t.title}
        </div>

        {/* Dateline */}
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 9,
          color: 'var(--bone-faint)',
          letterSpacing: '0.12em',
          marginBottom: 40,
        }}>
          {t.date} · oak street · thread n°148 of 312
        </div>

        {/* Content with dye border */}
        <div style={{ borderLeft: `3px solid ${dye}`, paddingLeft: 28 }}>
          {t.kind === 'photo'  && <PhotoView title={t.title} />}
          {t.kind === 'voice'  && <VoiceView duration={'duration' in t ? (t.duration ?? '') : ''} />}
          {t.kind === 'letter' && <LetterView />}
        </div>

        {/* Listener line */}
        <div style={{
          marginTop: 32, paddingTop: 16,
          borderTop: '1px solid rgba(244,236,216,0.07)',
          fontFamily: 'var(--serif)',
          fontSize: 13,
          fontStyle: 'italic',
          color: 'rgba(176,122,74,0.55)',
          lineHeight: 1.6,
        }}>
          ∞ {annotation
            ? `the loom connects this to ${annotation.text.toLowerCase()}`
            : 'the loom is listening across this thread.'}
        </div>

        <div style={{ flex: 1 }} />

        {/* Time navigation */}
        <div style={{
          width: '100%', maxWidth: 660,
          paddingTop: 24,
          borderTop: '1px solid rgba(244,236,216,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            style={{
              background: 'transparent', border: 0, padding: 0,
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: onPrev ? 'var(--bone-faint)' : 'rgba(244,236,216,0.15)',
              cursor: onPrev ? 'pointer' : 'default',
            }}
          >
            ← earlier
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {Array.from({ length: total }, (_, i) => (
              <div key={i} style={{
                width: i === activeIndex ? 20 : 6,
                height: 2,
                background: i === activeIndex ? dye : 'rgba(244,236,216,0.18)',
                transition: `width 360ms ${EASE}, background 360ms ${EASE}`,
              }} />
            ))}
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            style={{
              background: 'transparent', border: 0, padding: 0,
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: onNext ? dye : 'rgba(244,236,216,0.15)',
              cursor: onNext ? 'pointer' : 'default',
            }}
          >
            later →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ReadingRoom ───────────────────────────────────────────────────────────────
export function ReadingRoom() {
  const [active, setActive]     = useState(0);
  const [clothOpen, setClothOpen] = useState(true);
  const [view, setView]         = useState<'wall' | 'book'>('wall');
  const [navOpen, setNavOpen]   = useState(false);
  const [entries, setEntries]   = useState<Thread[]>(THREADS);
  const [loading, setLoading]   = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user?.defaultThreadId) return;
    setLoading(true);
    threadsApi.listEntries(user.defaultThreadId, { limit: 50 })
      .then((res) => {
        const raw = res.data?.entries ?? [];
        if (raw.length > 0) {
          setEntries(raw.map(mapThreadEntry));
          setActive(0);
        }
      })
      .catch(() => { /* fall back to THREADS mock */ })
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.defaultThreadId]);

  const t   = entries[active] ?? entries[0];
  const dye = DYE_HEX[t.dye] ?? '#b07a4a';

  const handleSelect = (i: number) => {
    if (i === active) return;
    setNavOpen(false);
    setClothOpen(false);
    setTimeout(() => { setActive(i); setClothOpen(true); }, 380);
  };

  // book view
  if (view === 'book') {
    return (
      <div className="loom" data-theme="dark" style={{ position: 'fixed', inset: 0, background: '#0e0e0c' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }}>
          <Suspense fallback={null}>
            <ClothCanvas3D entries={CLOTH_BG_ENTRIES} />
          </Suspense>
        </div>
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          <BookView />
        </div>
        <button
          onClick={() => setView('wall')}
          style={{
            position: 'fixed', top: 20, left: 28, zIndex: 20,
            background: 'transparent', border: 0,
            fontFamily: 'var(--mono)', fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--bone-faint)', cursor: 'pointer',
          }}
        >
          ← wall
        </button>
      </div>
    );
  }

  // wall view
  return (
    <div
      className="loom"
      data-theme="dark"
      style={{ position: 'fixed', inset: 0, background: '#0e0e0c' }}
    >
      {/* Hairline loading bar */}
      <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--warm)', opacity: loading ? 0.6 : 0, transition: 'opacity 360ms', zIndex: 30, pointerEvents: 'none' }} />

      {/* Layer 0: ClothCanvas3D backdrop */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.45, pointerEvents: 'none', zIndex: 0 }}>
        <Suspense fallback={<div style={{ position: 'absolute', inset: 0, background: '#0e0e0c' }} />}>
          <ClothCanvas3D entries={CLOTH_BG_ENTRIES} />
        </Suspense>
      </div>

      {/* Layer 1: Topbar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 56, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(14,14,12,0.75)',
        borderBottom: '1px solid rgba(244,236,216,0.08)',
      }}>
        {/* Left */}
        <Link
          to="/loom/weft"
          style={{
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'var(--bone-faint)',
            textDecoration: 'none',
          }}
        >
          ← cloth
        </Link>

        {/* Centre */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 15 }}>∞</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: dye, letterSpacing: '0.08em' }}>
            {t.kind}
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(244,236,216,0.3)' }}>·</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: dye, letterSpacing: '0.08em' }}>
            {t.who}
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(244,236,216,0.3)' }}>·</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(244,236,216,0.35)', letterSpacing: '0.08em' }}>
            {t.date}
          </span>
        </span>

        {/* Right */}
        <button
          type="button"
          onClick={() => setView('book')}
          style={{
            background: 'transparent', border: '1px solid rgba(244,236,216,0.15)', padding: '3px 12px',
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'var(--bone-faint)', cursor: 'pointer',
          }}
        >
          book view
        </button>
      </div>

      {/* Layer 2: Selvedge nav */}
      <div
        onMouseEnter={() => setNavOpen(true)}
        onMouseLeave={() => setNavOpen(false)}
        style={{
          position: 'absolute', top: 56, bottom: 0, left: 0, zIndex: 15,
          width: navOpen ? 260 : 6,
          background: navOpen ? 'rgba(14,14,12,0.94)' : 'transparent',
          borderRight: navOpen ? '1px solid rgba(244,236,216,0.08)' : '1px solid transparent',
          transition: `width 360ms ${EASE}, background 360ms ${EASE}, border-color 360ms ${EASE}`,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Dye strips */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {entries.map((th, i) => (
            <div
              key={th.date + th.title}
              onClick={() => handleSelect(i)}
              style={{
                flex: 1,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                overflow: 'hidden',
                borderLeft: `3px solid ${DYE_HEX[th.dye] ?? '#b07a4a'}`,
                opacity: i === active ? 1 : 0.28,
                transition: `opacity 180ms ${EASE}`,
              }}
            >
              {/* Thread label — only visible when nav is open */}
              <div style={{
                paddingLeft: 14,
                opacity: navOpen ? 1 : 0,
                transition: `opacity 220ms ${EASE}`,
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}>
                <div style={{
                  fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic',
                  color: 'var(--bone)', fontWeight: 300, lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {th.title}
                </div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--bone-faint)',
                  letterSpacing: '0.08em', marginTop: 2,
                }}>
                  {th.kind} · {th.who} · {th.date.slice(0, 4)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Layer 3: ClothPage */}
      <div style={{ position: 'absolute', inset: 0, top: 56, zIndex: 10 }}>
        <ClothPage
          isOpen={clothOpen}
          page={
            <ReadingContent
              t={t}
              dye={dye}
              annotation={AI_ANNOTATIONS[active]}
              onPrev={active > 0 ? () => handleSelect(active - 1) : undefined}
              onNext={active < entries.length - 1 ? () => handleSelect(active + 1) : undefined}
              activeIndex={active}
              total={entries.length}
            />
          }
        >
          {/* Cloth face cover — visible during fold transition */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 14, padding: 44,
            background: 'var(--ink)',
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--warm)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              ∞ &nbsp; {t.kind} · {t.date}
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 300, fontStyle: 'italic', textAlign: 'center', maxWidth: '18ch', lineHeight: 1.25, color: 'var(--bone)' }}>
              {t.title}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              {t.who}
            </div>
          </div>
        </ClothPage>
      </div>
    </div>
  );
}

// ── Inner components (unchanged) ──────────────────────────────────────────────

function PhotoView({ title }: { title: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
      <div
        style={{
          position: 'relative',
          aspectRatio: '4 / 3',
          background: 'var(--ink-card)',
          border: '1px solid var(--rule)',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: 'var(--bone-faint)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
            fontFamily: 'var(--mono)',
          }}
        >
          [ photograph ]
          <br />
          <span
            style={{
              color: 'var(--warm)',
              fontStyle: 'italic',
              textTransform: 'none',
              letterSpacing: 0,
              fontFamily: 'var(--serif)',
            }}
          >
            {title}
          </span>
          <br />
          <span style={{ fontSize: 9 }}>4×3 · 35mm · 1.4MB</span>
        </div>
      </div>

      <div
        style={{
          fontSize: 15,
          fontStyle: 'italic',
          color: 'var(--bone-dim)',
          lineHeight: 1.7,
          fontFamily: 'var(--serif)',
        }}
      >
        <span style={{ color: 'var(--warm)' }}>∞ </span>
        the loom hears:{' '}
        <span style={{ color: 'var(--bone)' }}>
          "slanted late-may light, the color of a strong tea. daffodils on the sill. the
          photographer is half-in the frame, holding the camera and looking out."
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          paddingTop: 14,
          borderTop: '1px solid var(--rule)',
        }}
      >
        <Tag>kitchen window</Tag>
        <Tag>daffodils</Tag>
        <Tag>late may</Tag>
        <Tag warm>shared with iris · 2042</Tag>
      </div>
    </div>
  );
}

function VoiceView({ duration }: { duration: string }) {
  const bars = Array.from({ length: 96 }, (_, i) => {
    const v =
      0.2 +
      0.8 * Math.abs(Math.sin(i * 0.32) * Math.cos(i * 0.13)) *
        (1 - Math.abs(i - 48) / 60);
    return v;
  });
  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div
        style={{
          padding: '32px 28px',
          border: '1px solid var(--rule)',
          background: 'var(--ink-deep)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: 'var(--warm)',
              letterSpacing: '0.04em',
              fontFamily: 'var(--mono)',
            }}
          >
            voice &nbsp;·&nbsp; {duration} &nbsp;·&nbsp; recorded on a sunday morning
          </div>
          <div
            style={{ fontSize: 10, color: 'var(--bone-faint)', fontFamily: 'var(--mono)' }}
          >
            0:14 / {duration}
          </div>
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: 1.5, height: 80, marginBottom: 18 }}
        >
          {bars.map((v, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${v * 100}%`,
                background: i < 17 ? 'var(--warm)' : 'var(--bone-dim)',
                opacity: i < 17 ? 1 : 0.6,
                minHeight: 2,
              }}
            />
          ))}
        </div>

        <div
          style={{
            fontSize: 16,
            color: 'var(--bone)',
            lineHeight: 1.85,
            fontStyle: 'italic',
            fontFamily: 'var(--serif)',
            fontVariationSettings: '"opsz" 14',
          }}
        >
          <span style={{ color: 'var(--bone-dim)' }}>
            [soft humming] [a kettle in the background] [breath]
          </span>
          <span style={{ color: 'var(--warm)', marginLeft: 8 }}>la la la—</span>
          <span style={{ color: 'var(--bone-dim)' }}> [pause]</span>
          <span> oh, I forgot you were on. </span>
          <span style={{ color: 'var(--bone-dim)' }}>[laughs] </span>
          <span> well — eleanor. the daffodils are out. </span>
        </div>
      </div>

      <div
        style={{
          fontSize: 14,
          fontStyle: 'italic',
          color: 'var(--bone-dim)',
          lineHeight: 1.7,
          fontFamily: 'var(--serif)',
        }}
      >
        <span style={{ color: 'var(--warm)' }}>∞ </span>
        the loom recognized this hum. it appears in{' '}
        <span
          style={{
            color: 'var(--warm)',
            textDecoration: 'underline dotted',
            textUnderlineOffset: 3,
            cursor: 'pointer',
          }}
        >
          maya's voice memo, 2013
        </span>{' '}
        — same six notes. she learned it without knowing she had.
      </div>

      <div
        style={{
          display: 'flex',
          gap: 14,
          paddingTop: 14,
          borderTop: '1px solid var(--rule)',
        }}
      >
        <Tag>humming</Tag>
        <Tag>kettle</Tag>
        <Tag>sunday morning</Tag>
        <Tag warm>passed to maya · audibly</Tag>
      </div>
    </div>
  );
}

function LetterView() {
  return (
    <div
      style={{
        padding: '28px 32px',
        background: 'var(--ink-card)',
        border: '1px solid var(--rule)',
        maxHeight: 460,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          fontSize: 16,
          lineHeight: 1.9,
          color: 'var(--bone)',
          fontFamily: 'var(--serif)',
        }}
      >
        <p style={{ margin: '0 0 12px' }}>
          Tonight I sat at the kitchen window. The light came through the daffodils the way it
          used to when my mother was alive — slanted, low, the color of a strong tea. I thought I
          should write this down before it goes.
        </p>
        <p style={{ margin: '0 0 12px' }}>
          I do not know who will read it. Maybe Iris, in some year I will not see.{' '}
          <span style={{ color: 'var(--warm)', fontStyle: 'italic' }}>
            I want you to know — here, hold this —
          </span>{' '}
          we don't get to keep each other for as long as we want. But we get the window. We get
          the late-may light. We get this.
        </p>
        <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--bone-dim)' }}>
          — Eleanor
        </p>
      </div>
    </div>
  );
}

function RhymeCard({
  kind,
  date,
  who,
  note,
  onClick,
}: {
  kind: Kind;
  date: string;
  who: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 12,
        border: '1px solid var(--rule)',
        cursor: 'pointer',
        display: 'grid',
        gap: 4,
        transition: `border-color 180ms ${EASE}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: 'var(--warm)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: 'var(--mono)',
          }}
        >
          {GLYPH[kind]} {kind} · {who}
        </span>
        <span
          style={{ fontSize: 9, color: 'var(--bone-faint)', fontFamily: 'var(--mono)' }}
        >
          {date}
        </span>
      </div>
      <div
        style={{
          fontSize: 13,
          fontStyle: 'italic',
          color: 'var(--bone-dim)',
          lineHeight: 1.4,
          fontFamily: 'var(--serif)',
        }}
      >
        {note}
      </div>
    </div>
  );
}

function Tag({ children, warm }: { children: ReactNode; warm?: boolean }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: warm ? 'var(--warm)' : 'var(--bone-faint)',
        padding: '3px 10px',
        border: warm ? '1px solid var(--warm)' : '1px solid var(--rule)',
      }}
    >
      {children}
    </span>
  );
}

function DeliverRow({ name, status, warm }: { name: string; status: string; warm?: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'baseline',
        padding: '6px 0',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <span
        style={{
          fontSize: 14,
          color: warm ? 'var(--warm)' : 'var(--bone)',
          fontStyle: warm ? 'italic' : 'normal',
          fontFamily: 'var(--serif)',
        }}
      >
        {name}
      </span>
      <span
        style={{ fontSize: 9, color: 'var(--bone-faint)', fontFamily: 'var(--mono)' }}
      >
        {status}
      </span>
    </div>
  );
}

/**
 * BookView — the descendant's reader.
 *
 * A book-spread large-type reading surface: the left page carries the
 * chapter intro (∞ chapter mark, the title set huge, the byline), the
 * right page carries the prose set generously in Source Serif 4. Page
 * turns are a quiet left/right pager, marked with ∞; the running heads
 * name the thread and the chapter.
 */
interface Chapter {
  numeral: string;
  eyebrow: string;
  title: string;
  byline: string;
  body: string[];
  closing: string;
  leftPage: number;
  rightPage: number;
}

const CHAPTERS: Chapter[] = [
  {
    numeral: 'i',
    eyebrow: 'i · the kitchen window · 1986',
    title: 'The late-may light.',
    byline:
      'Written by Eleanor Hartshorn on the 14th of May, 1986. The daffodils were out for the last spring her mother saw them.',
    body: [
      'Tonight I sat at the kitchen window. The light came through the daffodils the way it used to when my mother was alive — slanted, low, the colour of a strong tea. I thought I should write this down before it goes.',
      "I do not know who will read it. Maybe Iris, in some year I will not see. We don't get to keep each other for as long as we want. But we get the window. We get the late-may light. We get this.",
    ],
    closing: 'She kept the daffodils on the sill every May after.',
    leftPage: 148,
    rightPage: 149,
  },
  {
    numeral: 'ii',
    eyebrow: 'ii · humming, sunday · 1992',
    title: 'The same six notes.',
    byline:
      'Recorded by Margaret on a Sunday morning in 1992. A kettle in the background, and a tune she never knew she taught.',
    body: [
      'A kettle, a Sunday, six notes I have hummed my whole life without knowing where I learned them. The recorder was on and I had forgotten it. Oh, I forgot you were on — well, Eleanor. The daffodils are out.',
      'Maya hums them now, thirty years on, calling from a city I have never been to. She learned it without knowing she had. That is how the smallest things travel: under the words, in the breath between them.',
    ],
    closing: 'The loom heard the same hum, two generations apart.',
    leftPage: 150,
    rightPage: 151,
  },
  {
    numeral: 'iii',
    eyebrow: 'iii · to my granddaughter · 2024',
    title: 'For the day you are ready.',
    byline:
      'Written by Eleanor Hartshorn on the 2nd of June, 2024. Iris was asleep on the windowsill where Margaret used to sit.',
    body: [
      'To my granddaughter, today: you are asleep on the windowsill where my mother used to sit. I do not know who you will become. I am writing so that you will know who we were.',
      'You do not have to read all of this at once. The thread cannot be deleted, and it will wait. Read it on the day you are ready, and then put it down, and then come back. That is what it is for.',
    ],
    closing: 'She didn\'t wake her. She just wrote.',
    leftPage: 152,
    rightPage: 153,
  },
];

function BookView() {
  const [ch, setCh] = useState(0);
  const c = CHAPTERS[ch];
  const turn = (delta: number) =>
    setCh((p) => Math.min(CHAPTERS.length - 1, Math.max(0, p + delta)));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--parchment)',
        color: 'var(--parchment-ink)',
      }}
    >
      {/* running heads */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '22px 64px 0',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--parchment-faint)',
          fontFamily: 'var(--mono)',
        }}
      >
        <span>book mode · the Hartshorn thread</span>
        <span style={{ color: 'var(--warm)' }}>
          ∞ &nbsp; chapter {c.numeral} · {c.title.replace(/\.$/, '')}
        </span>
      </div>

      {/* two-page spread */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* left page — chapter intro */}
        <div
          style={{
            flex: 1,
            padding: '56px 64px 56px 88px',
            borderRight: '1px solid var(--parchment-rule)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: 'var(--parchment-faint)',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              marginBottom: 36,
              fontFamily: 'var(--mono)',
            }}
          >
            {c.eyebrow}
          </div>
          <h2
            style={{
              fontSize: 46,
              fontStyle: 'italic',
              margin: 0,
              maxWidth: '14ch',
              color: 'var(--parchment-ink)',
              fontFamily: 'var(--display)',
              fontWeight: 300,
            }}
          >
            {c.title}
          </h2>
          <div
            style={{
              fontStyle: 'italic',
              fontSize: 17,
              color: 'var(--parchment-dim)',
              marginTop: 32,
              maxWidth: '38ch',
              lineHeight: 1.7,
              fontFamily: 'var(--serif)',
            }}
          >
            {c.byline}
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.18em', fontFamily: 'var(--mono)' }}
          >
            p. {c.leftPage}
          </div>
        </div>

        {/* right page — body */}
        <div
          style={{
            flex: 1,
            padding: '56px 80px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ maxWidth: '52ch' }}>
            {c.body.map((p, i) => (
              <p
                key={i}
                style={{
                  fontSize: 19,
                  lineHeight: 1.9,
                  color: 'var(--parchment-ink)',
                  margin: '0 0 18px',
                  fontFamily: 'var(--serif)',
                }}
              >
                {p}
              </p>
            ))}
            <div
              style={{
                fontStyle: 'italic',
                fontSize: 16,
                color: 'var(--parchment-dim)',
                marginTop: 10,
                fontFamily: 'var(--serif)',
              }}
            >
              {c.closing}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              fontSize: 10,
              color: 'var(--parchment-faint)',
              letterSpacing: '0.18em',
              textAlign: 'right',
              fontFamily: 'var(--mono)',
            }}
          >
            p. {c.rightPage}
          </div>
        </div>
      </div>

      {/* page-turn pager */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 64px 24px',
        }}
      >
        <button
          type="button"
          onClick={() => turn(-1)}
          disabled={ch === 0}
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: ch === 0 ? 'default' : 'pointer',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: ch === 0 ? 'var(--parchment-faint)' : 'var(--parchment-dim)',
            fontFamily: 'var(--mono)',
          }}
        >
          ← earlier
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {CHAPTERS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`chapter ${i + 1}`}
              aria-current={i === ch}
              onClick={() => setCh(i)}
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
                color: i === ch ? 'var(--warm)' : 'var(--parchment-faint)',
                transition: `color 180ms ${EASE}`,
                fontFamily: 'var(--serif)',
              }}
            >
              ∞
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => turn(1)}
          disabled={ch === CHAPTERS.length - 1}
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: ch === CHAPTERS.length - 1 ? 'default' : 'pointer',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: ch === CHAPTERS.length - 1 ? 'var(--parchment-faint)' : 'var(--warm)',
            fontFamily: 'var(--mono)',
          }}
        >
          later →
        </button>
      </div>

      {/* parchment edge */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'var(--parchment-edge, #e6dcc4)',
          borderTop: '1px solid var(--parchment-rule)',
          opacity: 0.6,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: 144 }, (_, k) => (
          <span
            key={k}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${(k / 144) * 100}%`,
              width: 1,
              background: 'var(--parchment-grain, rgba(26,25,22,0.06))',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Keep RhymeCard, Tag, DeliverRow accessible from this module
// (used inside ReadingContent's rhyme panel if needed in future)
void (RhymeCard);
void (DeliverRow);
