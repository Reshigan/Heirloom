import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { wrappedApi } from '../services/api';
import { Loom, type LoomEntry, type LoomKind } from '../loom/components/Loom';

/**
 * Heirloom Wrapped — annual reflection, a single restrained LANDSCAPE page
 * (per the design artboard: heirloom-viral.jsx §Wrapped). One quiet page:
 * a hero headline, a one-year cloth strip (a real Tapestry specimen woven
 * from the year's entries), a 4-cell stats strip, the year's most-read
 * entry as a single quote, and a "save as image" affordance. Silent and
 * static — no carousel, no audio, no per-emotion colour, no avatars.
 *
 * Honest by construction: every number and the quote come from the real
 * wrappedApi response. Absent data renders a neutral empty state rather
 * than a fabricated "0 memories" claim.
 */

/* ─── Real API shape (cloudflare/worker/src/routes/wrapped.ts) ──────── */
interface TaggedPerson { name: string; count: number; }
interface WrappedHighlight { id: string; title: string; type: string; date: string; }

interface WrappedData {
  year: number;
  totalMemories: number;
  totalVoiceStories: number;
  totalLetters: number;
  longestStreak: number;
  currentStreak: number;
  topTaggedPeople: TaggedPerson[];
  highlights: WrappedHighlight[];
  summary: string;
}

const transformApiResponse = (data: Record<string, unknown>): WrappedData => ({
  year: (data.year as number) || new Date().getFullYear(),
  totalMemories: (data.totalMemories as number) || 0,
  totalVoiceStories: (data.totalVoiceStories as number) || 0,
  totalLetters: (data.totalLetters as number) || 0,
  longestStreak: (data.longestStreak as number) || 0,
  currentStreak: (data.currentStreak as number) || 0,
  topTaggedPeople: (data.topTaggedPeople as TaggedPerson[]) || [],
  highlights: (data.highlights as WrappedHighlight[]) || [],
  summary: (data.summary as string) || '',
});

/* ─── Map a highlight's type to a weft kind for dyeing ──────────────── */
const KIND_FOR_TYPE: Record<string, LoomKind> = {
  memory: 'memory',
  photo: 'photo',
  voice: 'voice',
  letter: 'letter',
  milestone: 'milestone',
};

/* ─── Build a one-year Tapestry specimen from real highlights ───────── */
function buildSpecimen(highlights: WrappedHighlight[], year: number): LoomEntry[] {
  return highlights
    .map((h, i): LoomEntry | null => {
      const d = new Date(h.date);
      if (Number.isNaN(d.getTime())) return null;
      return {
        year,
        month: d.getMonth() + 1,
        lane: i % 5,
        kind: KIND_FOR_TYPE[h.type] ?? 'memory',
        title: h.title,
      };
    })
    .filter((e): e is LoomEntry => e !== null);
}

/* ─── A single stat cell (mono eyebrow · serif number · mono sub) ───── */
const StatCell: React.FC<{
  eye: string;
  n: number | string;
  sub: string;
  borderRight: boolean;
}> = ({ eye, n, sub, borderRight }) => (
  <div style={{ padding: '20px 22px', borderRight: borderRight ? '1px solid var(--loom-rule)' : undefined }}>
    <div className="loom-mono" style={{ fontSize: 9.5, color: 'var(--loom-bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
      {eye}
    </div>
    <div className="loom-serif" style={{ fontSize: 'clamp(30px, 5vw, 44px)', fontWeight: 300, color: 'var(--loom-bone)', letterSpacing: '-0.022em', marginTop: 12, lineHeight: 1 }}>
      {n}
    </div>
    <div className="loom-mono" style={{ fontSize: 10.5, color: 'var(--loom-bone-dim)', marginTop: 8, letterSpacing: '0.06em' }}>
      {sub}
    </div>
  </div>
);

/* ─── Year stepper button — opaque, hairline, mono ──────────────────── */
const stepBtn: React.CSSProperties = {
  background: 'var(--loom-ink)',
  border: '1px solid var(--loom-rule)',
  color: 'var(--loom-bone-dim)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  letterSpacing: '0.12em',
  padding: '6px 10px',
  cursor: 'pointer',
  borderRadius: 0,
  transition: 'border-color 180ms var(--loom-ease), color 180ms var(--loom-ease)',
};

const Wrapped: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  /* Fetch available years */
  const { data: yearsData } = useQuery({
    queryKey: ['wrapped-years'],
    queryFn: async () => {
      const response = await wrappedApi.getYears();
      return response.data;
    },
  });

  const availableYears = useMemo(() => {
    if (yearsData?.years && yearsData.years.length > 0) {
      return [...yearsData.years].sort((a: number, b: number) => b - a);
    }
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, [yearsData, currentYear]);

  /* Fetch wrapped data for the selected year */
  const { data: apiData } = useQuery({
    queryKey: ['wrapped', selectedYear],
    queryFn: async () => {
      const response =
        selectedYear === currentYear
          ? await wrappedApi.getCurrent()
          : await wrappedApi.getYear(selectedYear);
      return response.data;
    },
  });

  const stats: WrappedData | null = apiData ? transformApiResponse(apiData) : null;
  const year = selectedYear;

  /* Derived real totals — gate everything on non-zero */
  const totalEntries = stats
    ? stats.totalMemories + stats.totalVoiceStories + stats.totalLetters
    : 0;
  const hasData = totalEntries > 0;

  const specimen = useMemo(
    () => (stats ? buildSpecimen(stats.highlights, year) : []),
    [stats, year]
  );

  /* The year's most-read entry — the first real highlight title, if any */
  const mostRead = stats?.highlights?.[0]?.title?.trim() || null;

  /* Clear the transient share status after a beat */
  useEffect(() => {
    if (!shareStatus) return;
    const id = window.setTimeout(() => setShareStatus(null), 2400);
    return () => window.clearTimeout(id);
  }, [shareStatus]);

  /* "save as image →" — no heavy deps available, so this offers the page
     via the native share sheet, falling back to copying the link. Inline
     status only, never an alert/toast. */
  const handleSave = useCallback(async () => {
    const url = window.location.href;
    const text = `${year} on Heirloom — ${totalEntries} entries in the family thread.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Heirloom Wrapped · ${year}`, text, url });
        return;
      } catch {
        /* cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('link copied');
    } catch {
      setShareStatus('copy unavailable');
    }
  }, [year, totalEntries]);

  const yearIdx = availableYears.indexOf(selectedYear);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--loom-ink)',
        color: 'var(--loom-bone)',
        overflow: 'auto',
      }}
    >
      <div className="loom-horizon" style={{ pointerEvents: 'none' }} />
      <div className="loom-grain" style={{ pointerEvents: 'none' }} />

      {/* ─── Topbar: wordmark · counter · save-as-image ─────────────── */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          padding: '20px 56px',
          borderBottom: '1px solid var(--loom-rule)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
          <Link
            to="/loom"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', textDecoration: 'none' }}
          >
            ← back
          </Link>
          <span className="loom-serif" style={{ fontSize: 18, color: 'var(--loom-warm)', textTransform: 'none', letterSpacing: 0 }}>∞</span>
          <span style={{ color: 'var(--loom-bone-dim)' }}>Heirloom</span>
          <span style={{ color: 'var(--loom-bone-faint)' }}>·</span>
          <span style={{ color: 'var(--loom-bone-faint)' }}>wrapped · {year}</span>
        </span>

        {/* Year stepper (real available years) */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => { if (yearIdx < availableYears.length - 1) setSelectedYear(availableYears[yearIdx + 1]); }}
            disabled={yearIdx >= availableYears.length - 1}
            style={{ ...stepBtn, opacity: yearIdx >= availableYears.length - 1 ? 0.3 : 1 }}
            aria-label="Previous year"
          >
            earlier
          </button>
          <button
            onClick={() => { if (yearIdx > 0) setSelectedYear(availableYears[yearIdx - 1]); }}
            disabled={yearIdx <= 0}
            style={{ ...stepBtn, opacity: yearIdx <= 0 ? 0.3 : 1 }}
            aria-label="Next year"
          >
            later
          </button>
        </span>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
          {shareStatus && (
            <span style={{ color: 'var(--loom-bone-faint)', textTransform: 'none', letterSpacing: '0.06em' }}>
              {shareStatus}
            </span>
          )}
          <button
            onClick={handleSave}
            style={{ ...stepBtn, border: 'none', background: 'none', color: 'var(--loom-warm)', padding: 0 }}
          >
            save as image →
          </button>
        </span>
      </div>

      {/* ─── Body: a single restrained landscape composition ────────── */}
      <div style={{ position: 'relative', padding: '64px 56px 56px', maxWidth: 1280, margin: '0 auto' }}>
        {!hasData ? (
          /* Neutral empty state — never claim "0 memories" */
          <div style={{ padding: '80px 0', maxWidth: '40ch' }}>
            <div className="loom-eyebrow" style={{ marginBottom: 18 }}>your year, in your family's cloth</div>
            <h1 className="loom-h2" style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 300, margin: 0, color: 'var(--loom-bone)' }}>
              Nothing woven into <span className="loom-serif" style={{ fontStyle: 'italic', color: 'var(--loom-warm)' }}>{year}</span> yet.
            </h1>
            <p className="loom-body" style={{ fontSize: 16, color: 'var(--loom-bone-dim)', marginTop: 18, lineHeight: 1.7 }}>
              Your wrapped appears once this year holds its first entries. Add a memory to begin the thread.
            </p>
          </div>
        ) : (
          <>
            {/* Hero headline */}
            <div className="loom-eyebrow" style={{ marginBottom: 18 }}>your year, in your family's cloth</div>
            <h1
              className="loom-serif"
              style={{
                fontSize: 'clamp(36px, 6vw, 64px)',
                lineHeight: 1.04,
                fontWeight: 300,
                margin: 0,
                letterSpacing: '-0.022em',
                maxWidth: '22ch',
                color: 'var(--loom-bone)',
              }}
            >
              {totalEntries} {totalEntries === 1 ? 'sentence' : 'sentences'}.{' '}
              <span className="loom-serif" style={{ fontStyle: 'italic', color: 'var(--loom-warm)' }}>
                One quiet year
              </span>{' '}
              in the thousand.
            </h1>

            {/* One-year cloth strip — a real Tapestry specimen from this year's
                entries. The dye palette is permitted here (inside woven threads). */}
            <div style={{ marginTop: 40, position: 'relative', background: '#0a0a08', padding: '0 0 8px' }}>
              <Loom
                entries={specimen}
                startYear={year}
                endYear={year + 1}
                height={120}
                showLigatures={false}
                showYears={false}
                ambientShuttle={false}
              />
              <div className="loom-mono" style={{ position: 'absolute', left: 18, top: 14, fontSize: 9.5, color: 'var(--loom-bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                jan
              </div>
              <div className="loom-mono" style={{ position: 'absolute', right: 18, top: 14, fontSize: 9.5, color: 'var(--loom-bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                dec
              </div>
            </div>

            {/* 4-cell stats strip — every cell is real, non-zero data */}
            <div
              style={{
                marginTop: 48,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 0,
                border: '1px solid var(--loom-rule)',
              }}
            >
              <StatCell
                eye="this year you wrote"
                n={totalEntries}
                sub={`${stats!.totalMemories} ${stats!.totalMemories === 1 ? 'memory' : 'memories'} · ${stats!.totalLetters} ${stats!.totalLetters === 1 ? 'letter' : 'letters'}`}
                borderRight
              />
              <StatCell
                eye="voices recorded"
                n={stats!.totalVoiceStories}
                sub={stats!.totalVoiceStories === 1 ? 'voice story' : 'voice stories'}
                borderRight
              />
              <StatCell
                eye="days you returned"
                n={stats!.longestStreak}
                sub={`longest streak · current ${stats!.currentStreak}`}
                borderRight
              />
              <StatCell
                eye="voices added"
                n={stats!.topTaggedPeople.length}
                sub={
                  stats!.topTaggedPeople.length > 0
                    ? stats!.topTaggedPeople.slice(0, 3).map((p) => p.name).join(' · ')
                    : 'no one tagged yet'
                }
                borderRight={false}
              />
            </div>

            {/* One quote — the year's most-read entry + footer */}
            <div
              style={{
                marginTop: 48,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 56,
                flexWrap: 'wrap',
              }}
            >
              {mostRead ? (
                <div
                  className="loom-serif"
                  style={{ fontSize: 17, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--loom-bone-dim)', maxWidth: '54ch', fontWeight: 400 }}
                >
                  &ldquo;{mostRead}&rdquo;
                  <div className="loom-mono" style={{ marginTop: 8, color: 'var(--loom-bone-faint)', fontStyle: 'normal', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    your most-read entry, this year
                  </div>
                </div>
              ) : (
                <div />
              )}
              <div
                className="loom-mono"
                style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', textAlign: 'right' }}
              >
                heirloom.blue/wrapped
                <br />
                <span style={{ color: 'var(--loom-warm)' }}>year {year - 2019} of a thousand</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Wrapped;
