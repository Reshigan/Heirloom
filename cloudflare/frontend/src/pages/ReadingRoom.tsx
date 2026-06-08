import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { ClothPage } from '../loom/components/ClothPage';
import { ClothBackdrop } from '../loom/components/ClothBackdrop';
import { memoriesApi, lettersApi, voiceApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { dyeVar, dyeFromMetadata, dyeForId, type Dye } from '../loom/dye';

/**
 * Screen 07 — The Reading Room
 *
 * The author's own thread, read as artifacts. The same living-cloth backdrop
 * every loom room shows (ClothBackdrop — shared 3D weave + theme-aware scrim,
 * so the reader tracks light/dark like the letter and voice rooms), a selvedge
 * nav, the ClothPage artifact reader, and a full-screen BookView on parchment.
 * Reads REAL entries (memories, letters, voice) for the signed-in user — no
 * mock content. Falls back to the EmptyThread prompt when the cloth has no
 * picks yet.
 */

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
  dye: Dye;
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

function dyeFor(kind: Kind, metadataDye: unknown, seed: string): Dye {
  // Honour the composer's saved dye first; otherwise a stable per-entry dye so
  // the selvedge reads as a varied weave, not one colour.
  return dyeFromMetadata({ dye: metadataDye }) ?? dyeForId(seed || kind);
}

function paragraphs(body: string): string[] {
  return body
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// ── ReadingContent ────────────────────────────────────────────────────────────
function ReadingContent({
  t, dye, onPrev, onNext, onJump, activeIndex, total,
}: {
  t: Thread;
  dye: string;
  onPrev?: () => void;
  onNext?: () => void;
  onJump: (i: number) => void;
  activeIndex: number;
  total: number;
}) {
  const paras = paragraphs(t.body);
  const isLastEntry = activeIndex === total - 1;
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
              <button
                key={i}
                type="button"
                onClick={() => onJump(i)}
                aria-label={`Go to entry ${i + 1}`}
                style={{
                  background: 'transparent',
                  border: 'none', padding: '21px 8px', cursor: 'pointer',
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span style={{
                  display: 'block',
                  width: i === activeIndex ? 20 : 6, height: 2,
                  background: i === activeIndex ? dye : 'rgba(244,236,216,0.18)',
                  transition: `width 360ms ${EASE}, background 360ms ${EASE}`,
                  flexShrink: 0,
                }} />
              </button>
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

        {isLastEntry && (
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--rule)', textAlign: 'center' }}>
            <Link to="/compose" style={{
              fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'var(--bone-faint)',
              textDecoration: 'none', borderBottom: '1px solid var(--rule)', paddingBottom: 2,
            }}>
              add to the cloth →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ReadingRoom ───────────────────────────────────────────────────────────────
export function ReadingRoom() {
  const [active, setActive]         = useState(0);
  const [clothOpen, setClothOpen]   = useState(true);
  const [view, setView]             = useState<'wall' | 'book'>('wall');
  const [navOpen, setNavOpen]       = useState(false);
  const [selvedgeOpen, setSelvedgeOpen] = useState(false);
  const [entries, setEntries]       = useState<Thread[]>([]);
  const [loading, setLoading]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const [searchParams]            = useSearchParams();
  const wantEntry                 = searchParams.get('entry');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteEntry = useMutation({
    mutationFn: async (thread: Thread) => {
      if (thread.kind === 'memory' || thread.kind === 'photo') return memoriesApi.delete(thread.id);
      if (thread.kind === 'letter') return lettersApi.delete(thread.id);
      if (thread.kind === 'voice') return voiceApi.delete(thread.id);
    },
    onSuccess: (_data, thread) => {
      queryClient.invalidateQueries({ queryKey: ['weft-memories'] });
      queryClient.invalidateQueries({ queryKey: ['weft-letters'] });
      queryClient.invalidateQueries({ queryKey: ['weft-voice'] });
      const deletedIdx = entries.findIndex((e) => e.id === thread.id);
      setEntries((prev) => prev.filter((e) => e.id !== thread.id));
      setActive((a) => {
        const newLen = entries.length - 1;
        if (newLen <= 0) return 0;
        if (deletedIdx < a) return a - 1;
        if (deletedIdx === a) return Math.min(a, newLen - 1);
        return a;
      });
      setDeleteConfirm(false);
    },
  });

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
          const { date, year, ord } = fmtDate(l.metadata?.entryDate || l.createdAt || l.created_at);
          list.push({
            id: l.id, kind: 'letter', date, year, ord,
            title: l.title?.trim() || l.salutation?.trim() || 'A letter',
            who, dye: dyeFor('letter', l.metadata?.dye, l.id),
            body: l.body || '',
          });
        }

        const voxs = Array.isArray((vox as any)?.data) ? (vox as any).data : [];
        for (const v of voxs) {
          const { date, year, ord } = fmtDate(v.metadata?.entryDate || v.createdAt || v.created_at);
          const secs = Number(v.duration) || 0;
          const duration = secs ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : undefined;
          list.push({
            id: v.id, kind: 'voice', date, year, ord,
            title: v.title?.trim() || 'A recording',
            who, dye: dyeFor('voice', v.metadata?.dye, v.id),
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

  // A thread tapped on the cloth arrives as ?entry=<id> — open it directly
  // once the thread list has loaded.
  useEffect(() => {
    if (!wantEntry || entries.length === 0) return;
    const i = entries.findIndex((e) => e.id === wantEntry);
    if (i >= 0) setActive(i);
  }, [wantEntry, entries]);

  const t   = entries[active] ?? entries[0] ?? null;
  const dye = t ? dyeVar(t.dye) : 'var(--warm)';

  const handleSelect = (i: number) => {
    if (i === active) return;
    setNavOpen(false);
    setClothOpen(false);
    setTimeout(() => { setActive(i); setClothOpen(true); }, 380);
  };

  // book view
  if (view === 'book') {
    return (
      <div className="loom" style={{ position: 'fixed', inset: 0, background: 'var(--ink)' }}>
        <ClothBackdrop opacity={0.35} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          <BookView entries={entries} threadName={user?.firstName ? `${who}'s thread` : 'your thread'} />
        </div>
        <button
          type="button"
          onClick={() => setView('wall')}
          aria-label="Back to wall view"
          style={{
            position: 'fixed', top: 20, left: 28, zIndex: 20,
            background: 'transparent', border: 0,
            fontFamily: 'var(--mono)', fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--bone-faint)', cursor: 'pointer',
            minHeight: 44, display: 'flex', alignItems: 'center',
          }}
        >
          ← wall
        </button>
      </div>
    );
  }

  // wall view
  return (
    <div className="loom" style={{ position: 'fixed', inset: 0, background: 'var(--ink)' }}>
      {/* Hairline loading bar */}
      <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--warm)', opacity: loading ? 0.6 : 0, transition: 'opacity 360ms', zIndex: 30, pointerEvents: 'none' }} />

      {/* Layer 0: the shared living cloth (theme-aware, same as every room) */}
      <ClothBackdrop opacity={0.45} />

      {/* Layer 1: Topbar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 56, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'var(--ink-translucent, rgba(14,14,12,0.75))',
        borderBottom: '1px solid var(--rule)',
      }}>
        <Breadcrumbs trail={[{ label: 'cloth', to: '/loom/weft' }, { label: 'reading' }]} />

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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {t && !deleteConfirm && (
            <>
              {/* edit — navigate to composer pre-filled */}
              <button
                type="button"
                onClick={() => {
                  if (t.kind === 'voice') navigate(`/record?id=${t.id}`);
                  else if (t.kind === 'letter') navigate(`/compose?id=${t.id}`);
                  else navigate(`/compose?entry=${t.id}`);
                }}
                style={{
                  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: 'var(--bone-faint)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-faint)'; }}
              >
                edit →
              </button>
              {/* delete — confirm step */}
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                style={{
                  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: 'rgba(244,236,216,0.25)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(244,236,216,0.25)'; }}
              >
                delete
              </button>
            </>
          )}
          {t && deleteConfirm && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--bone-faint)' }}>
                remove this thread?
              </span>
              <button
                type="button"
                onClick={() => deleteEntry.mutate(t)}
                disabled={deleteEntry.isPending}
                style={{
                  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: 'var(--danger)',
                }}
              >
                {deleteEntry.isPending ? 'removing…' : 'yes, remove →'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                style={{
                  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: 'var(--bone-faint)',
                }}
              >
                cancel
              </button>
            </div>
          )}
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
      </div>

      {/* Layer 2: Selvedge nav — mobile toggle */}
      <button
        type="button"
        onClick={() => setSelvedgeOpen(o => !o)}
        className="selvedge-toggle"
        style={{
          position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)',
          background: 'var(--rule)', border: 'none', color: 'var(--bone-faint)',
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.15em',
          padding: '8px 4px', cursor: 'pointer', writingMode: 'vertical-rl',
          textTransform: 'uppercase', zIndex: 16, display: 'none',
        }}
      >
        entries
      </button>
      <style>{`.selvedge-toggle { display: none !important; } @media (max-width: 640px) { .selvedge-toggle { display: block !important; } }`}</style>

      {/* Layer 2: Selvedge nav */}
      <div
        onMouseEnter={() => setNavOpen(true)}
        onMouseLeave={() => setNavOpen(false)}
        style={{
          position: 'absolute', top: 56, bottom: 0, left: 0, zIndex: 15,
          width: (navOpen || selvedgeOpen) ? 260 : 6,
          background: (navOpen || selvedgeOpen) ? 'rgba(14,14,12,0.94)' : 'transparent',
          borderRight: (navOpen || selvedgeOpen) ? '1px solid rgba(244,236,216,0.08)' : '1px solid transparent',
          transition: `width 360ms ${EASE}, background 360ms ${EASE}, border-color 360ms ${EASE}`,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {entries.map((th, i) => (
            <button
              key={th.id}
              type="button"
              onClick={() => handleSelect(i)}
              style={{
                flex: 1, cursor: 'pointer', background: 'transparent', border: 0,
                display: 'flex', alignItems: 'center', overflow: 'hidden',
                borderLeft: `3px solid ${dyeVar(th.dye)}`,
                opacity: i === active ? 1 : 0.28,
                transition: `opacity 180ms ${EASE}`,
                textAlign: 'left', width: '100%', padding: 0,
              }}
            >
              <div style={{
                paddingLeft: 14, opacity: (navOpen || selvedgeOpen) ? 1 : 0,
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
            </button>
          ))}
        </div>
      </div>

      {/* Layer 3: ClothPage or empty state */}
      <div style={{ position: 'absolute', inset: 0, top: 56, zIndex: 10 }}>
        {entries.length === 0 && !loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', overflowY: 'auto',
          }}>
            <div style={{ maxWidth: 540, width: '100%' }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 22,
              }}>
                why heirloom exists
              </div>
              <p style={{
                fontFamily: 'var(--serif)', fontSize: 'clamp(19px, 2.6vw, 24px)', fontWeight: 300,
                fontStyle: 'italic', color: 'var(--bone)', lineHeight: 1.6, margin: '0 0 22px',
              }}>
                Every family loses its stories twice — first when they go unspoken,
                then when the ones who remember are gone.
              </p>
              <p style={{
                fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 300,
                color: 'var(--bone-dim)', lineHeight: 1.85, margin: '0 0 16px',
              }}>
                Heirloom is the thread that outlives that. Not a feed to scroll and forget,
                but a single woven cloth your bloodline keeps adding to: a letter sealed for
                a birthday decades away, a grandparent's voice, the ordinary days that turn
                out to matter most.
              </p>
              <p style={{
                fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 300,
                color: 'var(--bone-dim)', lineHeight: 1.85, margin: '0 0 30px',
              }}>
                Append-only. Encrypted. Owned by your family, never a platform. Begin one
                thread today and it can still be read a thousand years from now.
              </p>
              <Link to="/compose" style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: 'var(--warm)', textDecoration: 'none',
                borderLeft: '3px solid var(--warm)', paddingLeft: 14, display: 'inline-block',
              }}>
                weave the first thread →
              </Link>
            </div>
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
                onJump={handleSelect}
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
