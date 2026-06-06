import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ClothPage } from '../loom/components/ClothPage';
import { memoriesApi, lettersApi, voiceApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const ClothCanvas3D = lazy(() =>
  import('../loom/components/ClothCanvas3D').then(m => ({ default: m.ClothCanvas3D }))
);

/**
 * Screen 07 — The Reading Room
 *
 * The author's own thread, read as artifacts. Three.js ClothCanvas3D backdrop,
 * selvedge nav, ClothPage artifact reader, and a full-screen BookView on
 * parchment. Reads REAL entries (memories, letters, voice) for the signed-in
 * user — no mock content. Falls back to the EmptyThread prompt when the cloth
 * has no picks yet.
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

function hashStr(s: string): number {
  return s.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
}

// ── CLOTH_BG_ENTRIES — 48 deterministic picks for the woven backdrop texture ───
const DYE_KEYS = ['madder','cochineal','kermes','saffron','weld','walnut','oakgall','woad','indigo','iron'] as const;
type DyeKey = typeof DYE_KEYS[number];

const CLOTH_BG_ENTRIES = Array.from({ length: 48 }, (_, i) => ({
  date: new Date(1960 + Math.floor(sineHash(i * 17 + 1) * 66), 0, 1),
  dye: DYE_KEYS[i % DYE_KEYS.length] as DyeKey,
  locked: i % 4 === 0,
}));

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

// ── Thread type ───────────────────────────────────────────────────────────────
type Thread = {
  id: string;
  kind: 'photo' | 'voice' | 'letter' | 'memory';
  date: string;        // display form: YYYY·MM·DD
  year: string;
  ord: number;         // sort key (epoch ms)
  title: string;
  who: string;
  dye: string;
  body: string;
  photoUrl?: string | null;
  duration?: string;
};
type Kind = Thread['kind'];

function fmtDate(iso: string): { date: string; year: string; ord: number } {
  const d = new Date(iso);
  const ord = isNaN(d.getTime()) ? 0 : d.getTime();
  const ymd = (isNaN(d.getTime()) ? new Date() : d).toISOString().slice(0, 10);
  return { date: ymd.replace(/-/g, '·'), year: ymd.slice(0, 4), ord };
}

function dyeFor(kind: Kind, metadataDye: unknown, seed: string): string {
  if (typeof metadataDye === 'string' && metadataDye in DYE_HEX) return metadataDye;
  // Stable per-entry dye so the selvedge reads as a varied weave, not one colour.
  return DYE_KEYS[Math.abs(hashStr(seed || kind)) % DYE_KEYS.length];
}

function paragraphs(body: string): string[] {
  return body
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// ── ReadingContent ────────────────────────────────────────────────────────────
function ReadingContent({
  t, dye, onPrev, onNext, activeIndex, total,
}: {
  t: Thread;
  dye: string;
  onPrev?: () => void;
  onNext?: () => void;
  activeIndex: number;
  total: number;
}) {
  const paras = paragraphs(t.body);
  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '52px 24px 40px',
    }}>
      <div style={{ maxWidth: 660, width: '100%', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: dye,
          letterSpacing: '0.04em', marginBottom: 12,
        }}>
          ∞ &nbsp; {t.kind} · written by {t.who}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: 'var(--serif)', fontSize: 'clamp(24px, 3.5vw, 34px)',
          fontWeight: 300, fontStyle: 'italic', fontVariationSettings: '"opsz" 36',
          margin: '0 0 8px', color: 'var(--bone)', lineHeight: 1.2,
        }}>
          {t.title}
        </div>

        {/* Dateline */}
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--bone-faint)',
          letterSpacing: '0.12em', marginBottom: 40,
        }}>
          {t.date} · thread n°{activeIndex + 1} of {total}
        </div>

        {/* Content with dye border */}
        <div style={{ borderLeft: `3px solid ${dye}`, paddingLeft: 28 }}>
          {t.photoUrl && (
            <div style={{
              aspectRatio: '4 / 3', marginBottom: 22,
              background: 'var(--ink-card)', border: '1px solid var(--rule)',
              overflow: 'hidden',
            }}>
              <img
                src={t.photoUrl}
                alt={t.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          {t.kind === 'voice' && (
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)',
              letterSpacing: '0.04em', marginBottom: 18,
            }}>
              voice{t.duration ? ` · ${t.duration}` : ''}
            </div>
          )}

          {paras.length > 0 ? (
            paras.map((p, i) => (
              <p key={i} style={{
                fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.9,
                color: 'var(--bone)', margin: '0 0 16px',
              }}>
                {p}
              </p>
            ))
          ) : (
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.9,
              color: 'var(--bone-dim)', fontStyle: 'italic', margin: 0,
            }}>
              {t.kind === 'voice'
                ? 'A recording with no transcript yet.'
                : t.photoUrl ? 'A photograph, kept without words.' : 'No words yet.'}
            </p>
          )}
        </div>

        {/* Listener line */}
        <div style={{
          marginTop: 32, paddingTop: 16,
          borderTop: '1px solid rgba(244,236,216,0.07)',
          fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic',
          color: 'rgba(176,122,74,0.55)', lineHeight: 1.6,
        }}>
          ∞ the loom is listening across this thread.
        </div>

        <div style={{ flex: 1 }} />

        {/* Time navigation */}
        <div style={{
          width: '100%', maxWidth: 660, paddingTop: 24,
          borderTop: '1px solid rgba(244,236,216,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button
            type="button" onClick={onPrev} disabled={!onPrev}
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
                width: i === activeIndex ? 20 : 6, height: 2,
                background: i === activeIndex ? dye : 'rgba(244,236,216,0.18)',
                transition: `width 360ms ${EASE}, background 360ms ${EASE}`,
              }} />
            ))}
          </div>

          <button
            type="button" onClick={onNext} disabled={!onNext}
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
  const [active, setActive]       = useState(0);
  const [clothOpen, setClothOpen] = useState(true);
  const [view, setView]           = useState<'wall' | 'book'>('wall');
  const [navOpen, setNavOpen]     = useState(false);
  const [entries, setEntries]     = useState<Thread[]>([]);
  const [loading, setLoading]     = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  const who = useMemo(
    () => (user?.firstName?.trim() || user?.lastName?.trim() || 'you'),
    [user?.firstName, user?.lastName],
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    let ignored = false;
    setLoading(true);
    Promise.all([
      memoriesApi.getAll({ limit: 500 }).then((r) => r.data).catch(() => null),
      lettersApi.getAll({ limit: 500 }).then((r) => r.data).catch(() => null),
      voiceApi.getAll({ limit: 500 }).then((r) => r.data).catch(() => null),
    ])
      .then(([mem, let_, vox]) => {
        if (ignored) return;
        const list: Thread[] = [];

        const mems = Array.isArray((mem as any)?.data) ? (mem as any).data : [];
        for (const m of mems) {
          const photoUrl = m.fileUrl || m.metadata?.images?.[0] || null;
          const kind: Kind = photoUrl ? 'photo' : 'memory';
          const { date, year, ord } = fmtDate(m.metadata?.entryDate || m.createdAt || m.created_at);
          list.push({
            id: m.id, kind, date, year, ord,
            title: m.title?.trim() || (photoUrl ? 'A photograph' : 'A memory'),
            who, dye: dyeFor(kind, m.metadata?.dye, m.id),
            body: m.description || '', photoUrl,
          });
        }

        const lets = Array.isArray((let_ as any)?.data) ? (let_ as any).data : [];
        for (const l of lets) {
          const { date, year, ord } = fmtDate(l.createdAt || l.created_at);
          list.push({
            id: l.id, kind: 'letter', date, year, ord,
            title: l.title?.trim() || l.salutation?.trim() || 'A letter',
            who, dye: dyeFor('letter', l.metadata?.dye, l.id),
            body: l.body || '',
          });
        }

        const voxs = Array.isArray((vox as any)?.data) ? (vox as any).data : [];
        for (const v of voxs) {
          const { date, year, ord } = fmtDate(v.createdAt || v.created_at);
          const secs = Number(v.duration) || 0;
          const duration = secs ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : undefined;
          list.push({
            id: v.id, kind: 'voice', date, year, ord,
            title: v.title?.trim() || 'A recording',
            who, dye: dyeFor('voice', null, v.id),
            body: v.transcript || '', duration,
          });
        }

        list.sort((a, b) => a.ord - b.ord);
        setEntries(list);
        setActive(0);
      })
      .finally(() => { if (!ignored) setLoading(false); });
    return () => { ignored = true; };
  }, [isAuthenticated, who]);

  const t   = entries[active] ?? entries[0] ?? null;
  const dye = t ? (DYE_HEX[t.dye] ?? '#b07a4a') : '#b07a4a';

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
          <BookView entries={entries} threadName={user?.firstName ? `${who}'s thread` : 'your thread'} />
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
    <div className="loom" data-theme="dark" style={{ position: 'fixed', inset: 0, background: '#0e0e0c' }}>
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
        <Link
          to="/loom/weft"
          style={{
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none',
          }}
        >
          ← cloth
        </Link>

        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 15 }}>∞</span>
          {t ? (
            <>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: dye, letterSpacing: '0.08em' }}>{t.kind}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(244,236,216,0.3)' }}>·</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: dye, letterSpacing: '0.08em' }}>{t.who}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(244,236,216,0.3)' }}>·</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(244,236,216,0.35)', letterSpacing: '0.08em' }}>{t.date}</span>
            </>
          ) : (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(244,236,216,0.3)', letterSpacing: '0.08em' }}>
              the wall
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={() => setView('book')}
          disabled={entries.length === 0}
          style={{
            background: 'transparent', border: '1px solid rgba(244,236,216,0.15)', padding: '3px 12px',
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: entries.length === 0 ? 'rgba(244,236,216,0.2)' : 'var(--bone-faint)',
            cursor: entries.length === 0 ? 'default' : 'pointer',
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
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {entries.map((th, i) => (
            <div
              key={th.id}
              onClick={() => handleSelect(i)}
              style={{
                flex: 1, cursor: 'pointer',
                display: 'flex', alignItems: 'center', overflow: 'hidden',
                borderLeft: `3px solid ${DYE_HEX[th.dye] ?? '#b07a4a'}`,
                opacity: i === active ? 1 : 0.28,
                transition: `opacity 180ms ${EASE}`,
              }}
            >
              <div style={{
                paddingLeft: 14, opacity: navOpen ? 1 : 0,
                transition: `opacity 220ms ${EASE}`, whiteSpace: 'nowrap', minWidth: 0,
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
                  {th.kind} · {th.who} · {th.year}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Layer 3: ClothPage or empty state */}
      <div style={{ position: 'absolute', inset: 0, top: 56, zIndex: 10 }}>
        {entries.length === 0 && !loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 14,
          }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontStyle: 'italic', color: 'var(--bone-faint)' }}>
              the cloth is bare.
            </div>
            <Link to="/compose" style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'var(--warm)', textDecoration: 'none',
            }}>
              begin writing →
            </Link>
          </div>
        )}
        {t && (
          <ClothPage
            isOpen={clothOpen}
            page={
              <ReadingContent
                t={t}
                dye={dye}
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
              gap: 14, padding: 44, background: 'var(--ink)',
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
        )}
      </div>
    </div>
  );
}

/**
 * BookView — the descendant's reader.
 *
 * A book-spread large-type reading surface over the real thread: the left page
 * carries the entry's eyebrow + title + byline, the right page carries the
 * prose set generously in Source Serif 4. Page turns step through real
 * entries, marked with ∞.
 */
function BookView({ entries, threadName }: { entries: Thread[]; threadName: string }) {
  const [ch, setCh] = useState(0);
  const c = entries[ch];
  const turn = (delta: number) =>
    setCh((p) => Math.min(entries.length - 1, Math.max(0, p + delta)));

  const ROMAN = ['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii'];
  const numeral = (n: number) => ROMAN[n] ?? String(n + 1);

  if (!c) {
    return (
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--parchment)', color: 'var(--parchment-dim)',
        fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18,
      }}>
        nothing has been woven yet.
      </div>
    );
  }

  const body = paragraphs(c.body);

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      background: 'var(--parchment)', color: 'var(--parchment-ink)',
    }}>
      {/* running heads */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', padding: '22px 64px 0',
        fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'var(--parchment-faint)', fontFamily: 'var(--mono)',
      }}>
        <span>book mode · {threadName}</span>
        <span style={{ color: 'var(--warm)' }}>
          ∞ &nbsp; {numeral(ch)} · {c.title.replace(/\.$/, '')}
        </span>
      </div>

      {/* two-page spread */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* left page — entry intro */}
        <div style={{
          flex: 1, padding: '56px 64px 56px 88px',
          borderRight: '1px solid var(--parchment-rule)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.32em',
            textTransform: 'uppercase', marginBottom: 36, fontFamily: 'var(--mono)',
          }}>
            {numeral(ch)} · {c.kind} · {c.year}
          </div>
          <h2 style={{
            fontSize: 46, fontStyle: 'italic', margin: 0, maxWidth: '14ch',
            color: 'var(--parchment-ink)', fontFamily: 'var(--display)', fontWeight: 300,
          }}>
            {c.title}
          </h2>
          <div style={{
            fontStyle: 'italic', fontSize: 17, color: 'var(--parchment-dim)',
            marginTop: 32, maxWidth: '38ch', lineHeight: 1.7, fontFamily: 'var(--serif)',
          }}>
            Written by {c.who} · {c.date}.
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.18em', fontFamily: 'var(--mono)' }}>
            p. {ch * 2 + 1}
          </div>
        </div>

        {/* right page — body */}
        <div style={{ flex: 1, padding: '56px 80px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ maxWidth: '52ch' }}>
            {body.length > 0 ? body.map((p, i) => (
              <p key={i} style={{
                fontSize: 19, lineHeight: 1.9, color: 'var(--parchment-ink)',
                margin: '0 0 18px', fontFamily: 'var(--serif)',
              }}>
                {p}
              </p>
            )) : (
              <p style={{
                fontSize: 18, lineHeight: 1.9, color: 'var(--parchment-dim)',
                fontStyle: 'italic', margin: 0, fontFamily: 'var(--serif)',
              }}>
                {c.kind === 'voice' ? 'A recording with no transcript yet.' : 'No words yet.'}
              </p>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.18em',
            textAlign: 'right', fontFamily: 'var(--mono)',
          }}>
            p. {ch * 2 + 2}
          </div>
        </div>
      </div>

      {/* page-turn pager */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 64px 24px',
      }}>
        <button
          type="button" onClick={() => turn(-1)} disabled={ch === 0}
          style={{
            background: 'transparent', border: 0, padding: 0,
            cursor: ch === 0 ? 'default' : 'pointer',
            fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: ch === 0 ? 'var(--parchment-faint)' : 'var(--parchment-dim)',
            fontFamily: 'var(--mono)',
          }}
        >
          ← earlier
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {entries.map((e, i) => (
            <button
              key={e.id}
              type="button"
              aria-label={`entry ${i + 1}`}
              aria-current={i === ch}
              onClick={() => setCh(i)}
              style={{
                background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                fontSize: 14, lineHeight: 1,
                color: i === ch ? 'var(--warm)' : 'var(--parchment-faint)',
                transition: `color 180ms ${EASE}`, fontFamily: 'var(--serif)',
              }}
            >
              ∞
            </button>
          ))}
        </div>

        <button
          type="button" onClick={() => turn(1)} disabled={ch === entries.length - 1}
          style={{
            background: 'transparent', border: 0, padding: 0,
            cursor: ch === entries.length - 1 ? 'default' : 'pointer',
            fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: ch === entries.length - 1 ? 'var(--parchment-faint)' : 'var(--warm)',
            fontFamily: 'var(--mono)',
          }}
        >
          later →
        </button>
      </div>

      {/* parchment edge */}
      <div aria-hidden style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 6,
        background: 'var(--parchment-edge, #e6dcc4)',
        borderTop: '1px solid var(--parchment-rule)', opacity: 0.6,
        overflow: 'hidden', pointerEvents: 'none',
      }}>
        {Array.from({ length: 144 }, (_, k) => (
          <span key={k} style={{
            position: 'absolute', top: 0, bottom: 0, left: `${(k / 144) * 100}%`,
            width: 1, background: 'var(--parchment-grain, rgba(26,25,22,0.06))',
          }} />
        ))}
      </div>
    </div>
  );
}
