import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi, lettersApi, voiceApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

// Sanctioned stagger ladder — only the four allowed motion durations, used as
// the reveal delays so each stat moment lands on a legal beat.
const REVEAL_DELAY = [0, 180, 360, 720];

function parseDate(entry: any): Date {
  const iso = entry.metadata?.entryDate || entry.createdAt || entry.created_at;
  return new Date(iso);
}

interface Entry { kind: 'memory' | 'letter' | 'voice'; date: Date; words?: number; durationSec?: number }

function countWords(raw: any): number {
  const text: string =
    raw?.content ?? raw?.body ?? raw?.text ?? raw?.description ?? raw?.metadata?.description ?? '';
  if (typeof text !== 'string' || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function durationSeconds(raw: any): number {
  const d = raw?.duration ?? raw?.durationSec ?? raw?.duration_seconds ?? raw?.metadata?.duration ?? 0;
  const n = typeof d === 'number' ? d : parseFloat(d);
  return isNaN(n) ? 0 : n;
}

function buildStats(entries: Entry[], year: number) {
  const thisYear = entries.filter((e) => e.date.getFullYear() === year);

  const monthlyCounts = Array.from({ length: 12 }, (_, i) =>
    thisYear.filter((e) => e.date.getMonth() === i).length,
  );
  const maxMonthly = thisYear.length > 0 ? Math.max(...monthlyCounts) : 0;
  const activeMonths = monthlyCounts.filter((c) => c > 0).length;

  const kindCounts = {
    memory: thisYear.filter((e) => e.kind === 'memory').length,
    letter: thisYear.filter((e) => e.kind === 'letter').length,
    voice:  thisYear.filter((e) => e.kind === 'voice').length,
  };

  const totalWords = thisYear.reduce((s, e) => s + (e.words ?? 0), 0);

  return { thisYear, activeMonths, kindCounts, totalWords, maxMonthly };
}

// ── A single stat band — huge serif number + dim mono caption ──────────────────

function StatBand({
  value, caption, accent, index, visible,
}: {
  value: string;
  caption: string;
  accent?: boolean;
  index: number;
  visible: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: 'clamp(28px,6vh,64px) 0',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 720ms ${EASE} ${REVEAL_DELAY[index] ?? 720}ms, transform 720ms ${EASE} ${REVEAL_DELAY[index] ?? 720}ms`,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--serif)',
          fontWeight: 300,
          fontSize: 'clamp(54px,9vw,84px)',
          lineHeight: 0.86,
          letterSpacing: '-0.03em',
          fontVariationSettings: '"opsz" 48',
          color: accent ? '#c8884f' : 'var(--bone)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--muted-2)',
          marginTop: 'clamp(12px,2vh,20px)',
        }}
      >
        {caption}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Wrapped() {
  const { year: yearParam } = useParams<{ year?: string }>();
  // An explicit /wrapped/:year is honoured verbatim; otherwise we pick the year
  // to review below, once entries have loaded (see YEAR).
  const explicitYear = yearParam ? parseInt(yearParam, 10) : null;
  const { isAuthenticated, user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  // Wrapped stats are historical — stale for 24h to avoid redundant API fetches on revisit.
  const WRAPPED_STALE = 1000 * 60 * 60 * 24;

  const { data: memoriesData } = useQuery({
    queryKey: ['wrapped-memories'],
    queryFn: () => memoriesApi.getAll({ limit: 500 }).then((r) => (r.data as any)?.data ?? []),
    enabled: isAuthenticated,
    staleTime: WRAPPED_STALE,
  });
  const { data: lettersData } = useQuery({
    queryKey: ['wrapped-letters'],
    queryFn: () => lettersApi.getAll({ limit: 500 }).then((r) => (r.data as any)?.data ?? []),
    enabled: isAuthenticated,
    staleTime: WRAPPED_STALE,
  });
  const { data: voiceData } = useQuery({
    queryKey: ['wrapped-voice'],
    queryFn: () => voiceApi.getAll({ limit: 500 }).then((r) => (r.data as any)?.data ?? []),
    enabled: isAuthenticated,
    staleTime: WRAPPED_STALE,
  });

  const allEntries: Entry[] = useMemo(() => {
    const mems = Array.isArray(memoriesData) ? memoriesData : [];
    const lets = Array.isArray(lettersData) ? lettersData : [];
    const vox  = Array.isArray(voiceData)   ? voiceData   : [];
    return [
      ...mems.map((m: any) => ({ kind: 'memory' as const, date: parseDate(m), words: countWords(m) })),
      ...lets.map((l: any) => ({ kind: 'letter' as const, date: parseDate(l), words: countWords(l) })),
      ...vox.map((v: any)  => ({ kind: 'voice'  as const, date: parseDate(v), durationSec: durationSeconds(v) })),
    ].filter((e) => !isNaN(e.date.getTime()));
  }, [memoriesData, lettersData, voiceData]);

  // A year-in-review should land on a year worth reviewing. With no explicit
  // year we prefer the current calendar year, but if nothing was woven this
  // year (a family importing only historical memories, or a December joiner)
  // we fall back to the most recent year that actually has entries — so the
  // page shows real figures instead of four giant zeros.
  const YEAR = useMemo(() => {
    if (explicitYear != null) return explicitYear;
    const currentYear = new Date().getFullYear();
    const years = new Set<number>();
    for (const e of allEntries) years.add(e.date.getFullYear());
    if (years.has(currentYear) || years.size === 0) return currentYear;
    return Math.max(...years);
  }, [explicitYear, allEntries]);

  const stats = useMemo(() => buildStats(allEntries, YEAR), [allEntries, YEAR]);
  // Truly nothing for the chosen year (only reachable for an empty archive or an
  // explicit year with no entries) — show a quiet first-thread state, not zeros.
  const isEmpty = stats.thisYear.length === 0;

  // Gentle staggered fade-in on mount. No mounted-ref guard: the `[]` deps
  // already run this once per mount, and a guard would defeat StrictMode's
  // dev double-invoke (mount→cleanup→mount), leaving `visible` false forever
  // and the whole page rendered at opacity 0.
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleShare = async () => {
    const url = `${window.location.origin}/wrapped/${YEAR}`;
    const text = `In ${YEAR}, I wove ${stats.thisYear.length} entries across ${stats.activeMonths} months.`;
    if (navigator.share) {
      await navigator.share({ title: `${YEAR} — Heirloom`, text, url }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(url).catch(() => null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  // The family's most-woven thread — caption echoes the reference's "WORDS ON <top thread>".
  const topThread = user?.lastName || user?.firstName || 'the thread';

  // Real, derived figures — illustrative mockup numbers replaced by live data.
  // Numerals alternate warm / bone down the stack (constitution: one colour has emotion).
  const bands: { value: string; caption: string; accent?: boolean }[] = [
    { value: stats.kindCounts.memory.toLocaleString(), caption: 'memories woven',                accent: true },
    { value: stats.kindCounts.voice.toLocaleString(),  caption: 'voices kept' },
    { value: stats.kindCounts.letter.toLocaleString(), caption: 'notes sealed',                  accent: true },
    { value: stats.totalWords.toLocaleString(),        caption: `words on ${topThread}` },
  ];

  return (
    <ClothShell noTopbar>
      <div
        style={{
          minHeight: '100%',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 'clamp(32px,7vh,72px) clamp(24px,7vw,80px) clamp(64px,12vh,128px)',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* woven thread-swoosh — decorative backdrop behind the figures */}
        <picture style={{ display: 'contents' }}>
          <source type="image/avif" srcSet="/woven/thread-swoosh.avif" />
          <source type="image/webp" srcSet="/woven/thread-swoosh.webp" />
          <img
            src="/woven/thread-swoosh.png"
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              top: 0, left: '50%',
              height: '100%',
              transform: 'translateX(-50%)',
              objectFit: 'cover',
              opacity: 0.38,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        </picture>
        {/* radial vignette — focuses the eye on the centred numerals */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(58% 64% at 50% 50%, rgba(11,9,7,0.82), rgba(11,9,7,0.3) 68%, transparent)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* mono eyebrow — the only line of chrome above the figures */}
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--muted-2)',
            textAlign: 'center',
            opacity: visible ? 1 : 0,
            transition: `opacity 720ms ${EASE}`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          The Year Woven · {YEAR}
        </div>

        {isEmpty ? (
          // First-thread state — a single quiet serif line, no zeros.
          <div
            style={{
              width: '100%', maxWidth: 520, marginTop: 'clamp(40px,10vh,96px)',
              textAlign: 'center',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 720ms ${EASE} 180ms, transform 720ms ${EASE} 180ms`,
              position: 'relative', zIndex: 1,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--serif)', fontWeight: 300,
                fontSize: 'clamp(28px,5vw,40px)', lineHeight: 1.2,
                letterSpacing: '-0.01em', color: 'var(--bone)',
              }}
            >
              This year is still being woven.
            </div>
            <div
              style={{
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.26em',
                textTransform: 'uppercase', color: 'var(--bone-dim)',
                marginTop: 'clamp(16px,3vh,28px)',
              }}
            >
              Add a memory to begin your {YEAR}
            </div>
          </div>
        ) : (
          /* the four giant stat moments — the page IS the figures */
          <div style={{ width: '100%', maxWidth: 560, marginTop: 'clamp(20px,4vh,48px)', position: 'relative', zIndex: 1 }}>
            {bands.map((b, i) => (
              <StatBand key={b.caption} value={b.value} caption={b.caption} accent={b.accent} index={i} visible={visible} />
            ))}
          </div>
        )}

        {/* single warm ∞ accent */}
        <div
          style={{
            marginTop: 'clamp(24px,5vh,56px)',
            opacity: visible ? 0.9 : 0,
            transition: `opacity 1400ms ${EASE} 720ms`,
            position: 'relative', zIndex: 1,
          }}
        >
          <WaxSeal size={26} />
        </div>

        {/* quiet share — mono, warm underline (hidden until there's a year to share) */}
        {!isEmpty && (
          <button
            type="button"
            onClick={handleShare}
            style={{
              marginTop: 'clamp(28px,5vh,56px)',
              background: 'transparent', border: 0, padding: '6px 2px', cursor: 'pointer',
              opacity: visible ? 1 : 0,
              transition: `opacity 1400ms ${EASE} 1400ms`,
              position: 'relative', zIndex: 1,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.26em',
                textTransform: 'uppercase', color: 'var(--warm)',
                borderBottom: '1px solid var(--warm-dim)', paddingBottom: 3,
              }}
            >
              {copied ? 'link copied' : `share your ${YEAR}`}
            </span>
          </button>
        )}
      </div>
    </ClothShell>
  );
}
