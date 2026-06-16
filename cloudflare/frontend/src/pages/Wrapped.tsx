import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi, lettersApi, voiceApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';
import { CosmicHeader, WaxSeal } from '../loom/cosmic/CosmicUI';

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
          fontSize: 'clamp(72px,18vw,128px)',
          lineHeight: 0.92,
          letterSpacing: '-0.02em',
          color: accent ? 'var(--warm)' : 'var(--bone)',
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
          color: 'var(--bone-dim)',
          marginTop: 'clamp(14px,2.4vh,24px)',
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
  const YEAR = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  const { isAuthenticated } = useAuthStore();
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

  const stats = useMemo(() => buildStats(allEntries, YEAR), [allEntries, YEAR]);

  // Gentle staggered fade-in on mount.
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
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

  // Real, derived figures — illustrative mockup numbers replaced by live data.
  const bands: { value: string; caption: string; accent?: boolean }[] = [
    { value: stats.kindCounts.memory.toLocaleString(), caption: 'memories woven', accent: true },
    { value: stats.kindCounts.voice.toLocaleString(),  caption: 'voices kept' },
    { value: stats.kindCounts.letter.toLocaleString(), caption: 'notes sealed' },
    { value: stats.totalWords.toLocaleString(),        caption: 'words on the old oak' },
  ];

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'wrapped' }]} />}
      topbarCenter={`${YEAR}`}
      topbarRight={<UserMenu />}
    >
      <div
        style={{
          minHeight: '100%',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 'clamp(40px,9vh,96px) clamp(24px,7vw,80px) clamp(64px,12vh,128px)',
          boxSizing: 'border-box',
        }}
      >
        {/* HERO statement — mono eyebrow + giant serif title + serif-italic sub */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: `opacity 720ms ${EASE}`,
          }}
        >
          <CosmicHeader
            align="center"
            eyebrow={`The Year Woven · ${YEAR}`}
            title="A thread of one year"
            sub={
              stats.thisYear.length > 0
                ? `In ${YEAR} the family wove ${stats.thisYear.length.toLocaleString()} entries across ${stats.activeMonths} ${stats.activeMonths === 1 ? 'month' : 'months'} of the thread.`
                : `${YEAR} waits to be woven — no entries on the cloth yet.`
            }
          />
        </div>

        {/* the stack of stat moments */}
        <div style={{ width: '100%', maxWidth: 520, marginTop: 'clamp(28px,6vh,64px)' }}>
          {bands.map((b, i) => (
            <StatBand key={b.caption} value={b.value} caption={b.caption} accent={b.accent} index={i} visible={visible} />
          ))}
        </div>

        {/* single warm ∞ accent */}
        <div
          style={{
            marginTop: 'clamp(24px,5vh,56px)',
            opacity: visible ? 0.9 : 0,
            transition: `opacity 1400ms ${EASE} 720ms`,
          }}
        >
          <WaxSeal size={26} />
        </div>

        {/* quiet share — mono, warm underline */}
        <button
          type="button"
          onClick={handleShare}
          style={{
            marginTop: 'clamp(28px,5vh,56px)',
            background: 'transparent', border: 0, padding: '6px 2px', cursor: 'pointer',
            opacity: visible ? 1 : 0,
            transition: `opacity 1400ms ${EASE} 1400ms`,
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
      </div>
    </ClothShell>
  );
}
