import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { ClothPage } from '../loom/components/ClothPage';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
import { ProgressHair } from '../loom/components/ProgressHair';
import { memoriesApi, lettersApi, voiceApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { dyeVar, dyeTextVar, dyeFromMetadata, dyeForId, type Dye } from '../loom/dye';

/**
 * Screen 07 — The Reading Room
 *
 * The author's own thread, read as artifacts. The global route-aware backdrop
 * (mounted once in App.tsx) paints this room's filament gesture behind the
 * reader; the page itself carries only a selvedge nav, the ClothPage artifact
 * reader, and a full-screen BookView as a dark gilt volume.
 * Reads REAL entries (memories, letters, voice) for the signed-in user — no
 * mock content. Falls back to the EmptyThread prompt when the cloth has no
 * picks yet.
 */

import { EASE } from '../loom/motion';

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

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// Museum date stamp from the entry's epoch ord: "TUE 14 JAN 1987".
function stampDate(ord: number): string {
  const d = new Date(ord);
  if (isNaN(d.getTime()) || ord === 0) return '';
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ── SelvedgeHistory ───────────────────────────────────────────────────────────
// The selvedge edge of an entry: its append-only revision log. Every edit,
// amendment, and unweaving is kept forever (legacy_revisions); this folds the
// prior versions in below the entry, mono and quiet, hidden entirely when the
// entry has never been rewoven.
type Revision = {
  id: string;
  reason: string;
  createdAt: string;
  snapshot: {
    title?: string | null;
    description?: string | null;
    body?: string | null;
    transcript?: string | null;
    encrypted?: unknown;
  };
};

const REASON_LABEL: Record<string, string> = {
  edit: 'rewoven',
  amendment: 'amended',
  revoke: 'unwoven',
};

function SelvedgeHistory({ t }: { t: Thread }) {
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setRevisions(null);
    setOpen(false);
    const apiFor = t.kind === 'letter' ? lettersApi : t.kind === 'voice' ? voiceApi : memoriesApi;
    apiFor.getRevisions(t.id)
      .then((res) => { if (alive) setRevisions(res.data?.revisions ?? []); })
      .catch(() => { if (alive) setRevisions([]); });
    return () => { alive = false; };
  }, [t.kind, t.id]);

  if (!revisions || revisions.length === 0) return null;

  return (
    <div style={{
      marginTop: 28, paddingTop: 14,
      borderTop: '1px solid var(--rule)',
    }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'var(--bone-faint)',
        }}
      >
        selvedge · woven over — {revisions.length} earlier version{revisions.length === 1 ? '' : 's'} {open ? '−' : '+'}
      </button>

      {open && (
        <div style={{ marginTop: 18, display: 'grid', gap: 18 }}>
          {revisions.map((r) => {
            const sealed = Boolean(r.snapshot.encrypted);
            const text = sealed
              ? ''
              : (r.snapshot.description ?? r.snapshot.body ?? r.snapshot.transcript ?? '');
            const when = (r.createdAt || '').slice(0, 10).replace(/-/g, '·');
            return (
              <div key={r.id} style={{ borderLeft: '1px solid var(--rule-strong)', paddingLeft: 16 }}>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em',
                  color: 'var(--bone-faint)', marginBottom: 6,
                }}>
                  {when} · {REASON_LABEL[r.reason] ?? r.reason}
                </div>
                {r.snapshot.title ? (
                  <div style={{
                    fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic',
                    color: 'var(--bone-dim)', marginBottom: text ? 6 : 0, lineHeight: 1.4,
                  }}>
                    {r.snapshot.title}
                  </div>
                ) : null}
                {sealed ? (
                  <p style={{
                    fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic',
                    color: 'var(--bone-faint)', margin: 0, lineHeight: 1.7,
                  }}>
                    sealed at the writing — this version stays encrypted.
                  </p>
                ) : text ? (
                  <p style={{
                    fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--bone-dim)',
                    margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                    display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {text}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
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
  // Eyebrow — mono museum stamp above the title: "<DAY DATE> · WOVEN BY <AUTHOR>"
  const eyebrow = useMemo(() => {
    const stamp = stampDate(t.ord) || t.date;
    const verb = t.kind === 'voice' ? 'RECORDED BY' : t.kind === 'photo' ? 'KEPT BY' : 'WOVEN BY';
    return `${stamp} · ${verb} ${t.who.toUpperCase()}`;
  }, [t.ord, t.date, t.kind, t.who]);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      // Bottom padding must clear the global BottomNav (76px + safe-area) so the
      // in-page time pager never renders behind the tab bar (the ghost-pager bug).
      padding: 'clamp(72px, 14vh, 132px) 28px calc(104px + env(safe-area-inset-bottom, 0px))',
    }}>
      {/* Reading column — a left dye thread runs its full height; prose clears it */}
      <div style={{
        maxWidth: '62ch', width: '100%', position: 'relative', flex: 1,
        display: 'flex', flexDirection: 'column',
        borderLeft: `3px solid ${dye}`, paddingLeft: 24,
      }}>

        {/* Eyebrow — mono museum stamp above the title */}
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'var(--copper-label)', lineHeight: 1.6,
          marginBottom: 14,
        }}>
          {eyebrow}
        </div>

        {/* Title — the hero */}
        <h1 className="hl-serif" style={{
          fontFamily: 'var(--serif)', fontWeight: 400,
          fontSize: 'clamp(30px, 6vw, 44px)', lineHeight: 1.1,
          letterSpacing: '-0.01em', color: 'var(--bone)',
          margin: '0 0 clamp(32px, 6vh, 56px)',
        }}>
          {t.title}
        </h1>

        {/* Body — justified serif prose at a comfortable reading measure */}
        <div>
          {t.photoUrl && (
            <div style={{
              aspectRatio: '4 / 3', marginBottom: 30,
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
              letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 24,
            }}>
              voice{t.duration ? ` · ${t.duration}` : ''}
            </div>
          )}

          {paras.length > 0 ? (
            paras.map((p, i) => (
              <p key={i} style={{
                fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.75,
                color: 'var(--text-warm)', margin: '0 0 24px', fontWeight: 400,
                textAlign: 'justify', textJustify: 'inter-word', hyphens: 'auto',
              }}>
                {p}
              </p>
            ))
          ) : (
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.75,
              color: 'var(--bone-dim)', fontStyle: 'italic', margin: 0, fontWeight: 400,
            }}>
              {t.kind === 'voice'
                ? 'A recording with no transcript yet.'
                : t.photoUrl ? 'A photograph, kept without words.' : 'No words yet.'}
            </p>
          )}
        </div>

        {/* Closing mark — the ∞ wax seal at rest, the product's only mark */}
        <div style={{
          marginTop: 'clamp(40px, 9vh, 72px)',
          display: 'flex', justifyContent: 'center',
        }}>
          <WaxSeal size={26} />
        </div>

        {/* Selvedge — the entry's append-only revision history */}
        <SelvedgeHistory t={t} />

        <div style={{ flex: 1, minHeight: 48 }} />

        {/* Time navigation */}
        <div style={{
          width: '100%', paddingTop: 24,
          borderTop: '1px solid var(--rule)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button
            type="button" onClick={onPrev} disabled={!onPrev}
            style={{
              background: 'transparent', border: 0, padding: 0,
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: onPrev ? 'var(--bone-faint)' : 'var(--bone-ghost)',
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
                aria-current={i === activeIndex ? 'true' : undefined}
                style={{
                  background: 'transparent',
                  border: 'none', padding: '21px 8px', cursor: 'pointer',
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span style={{
                  display: 'block',
                  width: i === activeIndex ? 20 : 6, height: 2,
                  background: i === activeIndex ? dye : 'var(--bone-ghost)',
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
              color: onNext ? dye : 'var(--bone-ghost)',
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
    setSelvedgeOpen(false);
    setClothOpen(false);
    setTimeout(() => { setActive(i); setClothOpen(true); }, 360);
  };

  // book view
  if (view === 'book') {
    return (
      <div className="loom" data-theme="dark" style={{ position: 'fixed', inset: 0, background: 'var(--ink)' }}>
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
      {/* Loading: the canonical sweeping hairline (ProgressHair), pinned to
          the top of the wall view — not a static bar, not a spinner. */}
      {loading && (
        <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, pointerEvents: 'none' }}>
          <ProgressHair />
        </div>
      )}

      {/* Layer 1: Topbar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 56, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'var(--ink-translucent)',
        borderBottom: '1px solid var(--rule)',
      }}>
        <Breadcrumbs trail={[{ label: 'cloth', to: '/loom/weft' }, { label: 'reading' }]} />

        <span className="reading-topmeta" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 15 }}>∞</span>
          {t ? (
            <>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: dyeTextVar(t.dye), letterSpacing: '0.08em' }}>{t.kind}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)' }}>·</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: dyeTextVar(t.dye), letterSpacing: '0.08em' }}>{t.who}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)' }}>·</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-dim)', letterSpacing: '0.08em' }}>{t.date}</span>
            </>
          ) : (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.08em' }}>
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
                  if (t.kind === 'voice') navigate(`/loom/voice?id=${t.id}&edit=1`);
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
                  textTransform: 'uppercase', color: 'var(--bone-faint)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-faint)'; }}
              >
                unweave
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
                  textTransform: 'uppercase', color: 'var(--warm)',
                }}
              >
                {deleteEntry.isPending ? 'unweaving…' : 'yes, unweave →'}
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
              background: 'transparent', border: '1px solid var(--rule-strong)', padding: '3px 12px',
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: entries.length === 0 ? 'var(--bone-ghost)' : 'var(--bone-faint)',
              cursor: entries.length === 0 ? 'default' : 'pointer',
            }}
          >
            book view
          </button>
        </div>
      </div>

      {/* Layer 2: Selvedge nav — mobile toggle. Gated on entries: an empty
          manifesto state has nothing to navigate, so no orphan "ENTRIES" tab. */}
      {entries.length > 0 && (
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
      )}
      <style>{`.selvedge-toggle { display: none !important; } @media (max-width: 640px) { .selvedge-toggle { display: block !important; } .reading-topmeta { display: none !important; } }`}</style>

      {/* Backdrop scrim for the mobile selvedge drawer. The drawer only
          covers the left 260px of a phone viewport, so without this the
          ClothPage bled through the uncovered right half. Tap to close.
          Gated on selvedgeOpen (toggle-only) so desktop hover stays scrimless. */}
      {selvedgeOpen && (
        <div
          onClick={() => setSelvedgeOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 14,
            background: 'var(--ink-translucent)',
            transition: `opacity 360ms ${EASE}`,
          }}
        />
      )}

      {/* Layer 2: Selvedge nav */}
      {entries.length > 0 && (
      <div
        onMouseEnter={() => setNavOpen(true)}
        onMouseLeave={() => setNavOpen(false)}
        style={{
          position: 'absolute', top: 56, bottom: 0, left: 0, zIndex: 15,
          width: (navOpen || selvedgeOpen) ? 260 : 6,
          background: (navOpen || selvedgeOpen) ? 'var(--ink-translucent)' : 'transparent',
          borderRight: (navOpen || selvedgeOpen) ? '1px solid var(--rule)' : '1px solid transparent',
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
              aria-current={i === active ? 'true' : undefined}
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
                transition: `opacity 180ms ${EASE}`, whiteSpace: 'nowrap', minWidth: 0,
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
      )}

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
                borderLeft: '1px solid var(--warm)', paddingLeft: 14, display: 'inline-block',
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
 * prose set generously in Spectral. Page turns step through real
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
        background: 'linear-gradient(160deg, var(--letter-bg-top), var(--letter-bg-bottom))',
        color: 'var(--letter-body)',
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
      // Dark gilt volume card — the descendant opens a bound, gilded book.
      background: 'linear-gradient(160deg, var(--letter-bg-top), var(--letter-bg-bottom))',
      border: '1px solid var(--rule)', borderRadius: 0,
      boxShadow: '0 1px 0 rgba(242,230,208,0.04) inset, inset 0 0 40px rgba(0,0,0,0.6)',
      color: 'var(--letter-body)', overflow: 'hidden',
    }}>
      {/* gilt corner cues — top-right + bottom-left, hairline gilt rules (no filled wedge) */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, right: 0, width: 46, height: 46,
        borderTop: '1px solid var(--letter-edge)', borderRight: '1px solid var(--letter-edge)',
        opacity: 0.55, pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute', bottom: 0, left: 0, width: 46, height: 46,
        borderBottom: '1px solid var(--letter-edge)', borderLeft: '1px solid var(--letter-edge)',
        opacity: 0.55, pointerEvents: 'none',
      }} />

      {/* running heads */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', padding: '22px 64px 0',
        fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'var(--letter-body)', fontFamily: 'var(--mono)',
      }}>
        <span>book mode · {threadName}</span>
        <span style={{ color: 'var(--letter-gold)' }}>
          ∞ &nbsp; {numeral(ch)} · {c.title.replace(/\.$/, '')}
        </span>
      </div>

      {/* two-page spread */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* left page — entry intro */}
        <div style={{
          flex: 1, padding: '56px 64px 56px 88px',
          borderRight: '1px solid rgba(var(--letter-copper-rgb), 0.25)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            fontSize: 10, color: 'var(--letter-eyebrow)', letterSpacing: '0.32em',
            textTransform: 'uppercase', marginBottom: 36, fontFamily: 'var(--mono)',
          }}>
            {numeral(ch)} · {c.kind} · {c.year}
          </div>
          <h2 className="hl-serif" style={{
            fontSize: 46, fontStyle: 'italic', margin: 0, maxWidth: '14ch',
            color: 'var(--letter-gold)', fontFamily: 'var(--serif)', fontWeight: 300,
          }}>
            {c.title}
          </h2>
          <div style={{
            fontStyle: 'italic', fontSize: 17, color: 'var(--letter-body)',
            marginTop: 32, maxWidth: '38ch', lineHeight: 1.7, fontFamily: 'var(--serif)',
          }}>
            Written by {c.who} · {c.date}.
          </div>
          <div style={{ flex: 1 }} />
          {/* page number — bare mono numeral */}
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--letter-gold)',
            letterSpacing: '0.08em',
          }}>{ch * 2 + 1}</span>
        </div>

        {/* right page — body set in two justified columns with a center gutter rule */}
        <div style={{ flex: 1, padding: '56px 80px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ maxWidth: '52ch' }}>
            {body.length > 0 ? (
              <div style={{
                columnCount: 2, columnGap: 40,
                columnRule: '1px solid rgba(var(--letter-copper-rgb), 0.25)',
              }}>
                {body.map((p, i) => (
                  <p key={i} style={{
                    fontSize: 19, lineHeight: 1.9, color: 'var(--letter-body)',
                    margin: '0 0 18px', fontFamily: 'var(--serif)',
                    textAlign: 'justify', textJustify: 'inter-word', hyphens: 'auto',
                  }}>
                    {/* drop-cap on the very first paragraph */}
                    {i === 0 && p ? (
                      <>
                        <span style={{
                          float: 'left', fontFamily: 'var(--serif-display)',
                          fontSize: 36, lineHeight: 0.9, color: 'var(--letter-gold)',
                          paddingRight: 6, marginTop: 2,
                        }}>
                          {p.charAt(0)}
                        </span>
                        {p.slice(1)}
                      </>
                    ) : (
                      p
                    )}
                  </p>
                ))}
              </div>
            ) : (
              <p style={{
                fontSize: 18, lineHeight: 1.9, color: 'var(--letter-body)',
                fontStyle: 'italic', margin: 0, fontFamily: 'var(--serif)',
              }}>
                {c.kind === 'voice' ? 'A recording with no transcript yet.' : 'No words yet.'}
              </p>
            )}
          </div>
          <div style={{ flex: 1 }} />
          {/* page number — bare mono numeral */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--warm)',
              letterSpacing: '0.08em',
            }}>{ch * 2 + 2}</span>
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
            color: ch === 0 ? 'rgba(var(--letter-copper-rgb), 0.3)' : 'var(--letter-body)',
            fontFamily: 'var(--mono)',
          }}
        >
          ← earlier
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {entries.map((e, i) => (
            <button
              key={e.id}
              type="button"
              aria-label={`entry ${i + 1}`}
              aria-current={i === ch}
              onClick={() => setCh(i)}
              style={{
                background: 'transparent', border: 0, padding: '8px 0', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center',
              }}
            >
              {/* a single neutral reading marker — ∞ is reserved for the seal/foot,
                  never repeated as pagination. Active widens + warms. */}
              <span
                aria-hidden
                style={{
                  display: 'block', height: 1,
                  width: i === ch ? 20 : 6,
                  background: i === ch ? 'var(--letter-gold)' : 'rgba(var(--letter-copper-rgb), 0.3)',
                  transition: `width 360ms ${EASE}, background 360ms ${EASE}`,
                }}
              />
            </button>
          ))}
        </div>

        <button
          type="button" onClick={() => turn(1)} disabled={ch === entries.length - 1}
          style={{
            background: 'transparent', border: 0, padding: 0,
            cursor: ch === entries.length - 1 ? 'default' : 'pointer',
            fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: ch === entries.length - 1 ? 'rgba(var(--letter-copper-rgb), 0.3)' : 'var(--letter-gold)',
            fontFamily: 'var(--mono)',
          }}
        >
          later →
        </button>
      </div>

      {/* gilt page edge — a hairline gilt cue, a stroke not a copper fill band */}
      <div aria-hidden style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
        background: 'var(--letter-edge)', opacity: 0.6,
        pointerEvents: 'none',
      }} />
    </div>
  );
}
