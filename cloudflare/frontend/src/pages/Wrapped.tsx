import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi, lettersApi, voiceApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const EASE = 'cubic-bezier(0.16,1,0.3,1)';

function parseDate(entry: any): Date {
  const iso = entry.metadata?.entryDate || entry.createdAt || entry.created_at;
  return new Date(iso);
}

interface Entry { kind: 'memory' | 'letter' | 'voice'; date: Date; emotion?: string | null }

const EMOTION_COPY: Record<string, string> = {
  joy: 'joy', love: 'love', nostalgia: 'nostalgia', gratitude: 'gratitude',
  pride: 'pride', hope: 'hope', peace: 'peace', excitement: 'excitement',
  sadness: 'tenderness', reflection: 'reflection',
};

function buildStats(entries: Entry[], year: number) {
  const thisYear = entries.filter((e) => e.date.getFullYear() === year);

  // Monthly counts
  const monthlyCounts = Array.from({ length: 12 }, (_, i) =>
    thisYear.filter((e) => e.date.getMonth() === i).length,
  );
  const maxMonthly = thisYear.length > 0 ? Math.max(...monthlyCounts) : 0;
  const peakMonthIdx = maxMonthly > 0 ? monthlyCounts.indexOf(maxMonthly) : 0;
  const activeMonths = monthlyCounts.filter((c) => c > 0).length;

  // Weekday distribution
  const weekdayCounts = Array.from({ length: 7 }, (_, i) =>
    thisYear.filter((e) => e.date.getDay() === i).length,
  );
  const maxWeekday = thisYear.length > 0 ? Math.max(...weekdayCounts) : 0;
  const peakWeekday = maxWeekday > 0 ? weekdayCounts.indexOf(maxWeekday) : 0;

  // Kind breakdown
  const kindCounts = {
    memory: thisYear.filter((e) => e.kind === 'memory').length,
    letter: thisYear.filter((e) => e.kind === 'letter').length,
    voice:  thisYear.filter((e) => e.kind === 'voice').length,
  };
  const dominantKind = Object.entries(kindCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as string;

  // Streak (days with at least one entry)
  const daySet = new Set(thisYear.map((e) => e.date.toISOString().slice(0, 10)));
  let maxStreak = 0, streak = 0;
  const startOfYear = new Date(year, 0, 1);
  const today = new Date();
  const endDate = today.getFullYear() === year ? today : new Date(year, 11, 31);
  for (let d = new Date(startOfYear); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (daySet.has(d.toISOString().slice(0, 10))) {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      streak = 0;
    }
  }

  // Emotion distribution (memories only)
  const emotionMap: Record<string, number> = {};
  for (const e of thisYear) {
    if (e.emotion) emotionMap[e.emotion] = (emotionMap[e.emotion] ?? 0) + 1;
  }
  const emotionEntries = Object.entries(emotionMap).sort((a, b) => b[1] - a[1]);
  const topEmotions = emotionEntries.slice(0, 5);
  const dominantEmotion = topEmotions[0]?.[0] ?? null;

  // Highlights
  const sorted = [...thisYear].sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstEntry = sorted[0] ?? null;
  // Day with most entries
  const dayCounts: Record<string, number> = {};
  for (const e of thisYear) {
    const key = e.date.toISOString().slice(0, 10);
    dayCounts[key] = (dayCounts[key] ?? 0) + 1;
  }
  const busiestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0] ?? null;

  return { thisYear, monthlyCounts, peakMonthIdx, activeMonths, weekdayCounts, peakWeekday, kindCounts, dominantKind, maxStreak, topEmotions, dominantEmotion, firstEntry, busiestDay };
}

// ── Chapter components ────────────────────────────────────────────────────────

function ChapterOverview({ total, year, name }: { total: number; year: number; name: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '0 clamp(32px,8vw,120px)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 24 }}>
        {year} · heirloom wrapped
      </div>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(52px,9vw,104px)', fontWeight: 300, fontStyle: 'italic', color: 'var(--bone)', margin: 0, lineHeight: 1.02 }}>
        {name
          ? <>{name}<br />wove {total}<br />threads.</>
          : <>You wove<br />{total} threads.</>
        }
      </h1>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginTop: 40 }}>
        scroll to see your year →
      </p>
    </div>
  );
}

function ChapterMonths({ monthlyCounts, peakMonthIdx }: { monthlyCounts: number[]; peakMonthIdx: number }) {
  const max = Math.max(...monthlyCounts, 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '0 clamp(32px,8vw,120px)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 24 }}>
        activity by month
      </div>
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px,5vw,58px)', fontWeight: 300, fontStyle: 'italic', color: 'var(--bone)', margin: '0 0 48px', lineHeight: 1.1 }}>
        You wove the most<br />in {MONTH_ABBR[peakMonthIdx]}.
      </h2>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
        {monthlyCounts.map((count, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: '100%', maxWidth: 28,
              height: count === 0 ? 2 : Math.max(4, (count / max) * 112),
              background: i === peakMonthIdx ? 'var(--warm)' : count > 0 ? 'rgba(244,236,216,0.35)' : 'rgba(244,236,216,0.08)',
              transition: `height 720ms ${EASE}`,
            }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.08em', color: i === peakMonthIdx ? 'var(--warm)' : 'var(--bone-faint)', textTransform: 'uppercase' }}>
              {MONTH_ABBR[i].slice(0,1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChapterKinds({ kindCounts, dominantKind }: { kindCounts: { memory: number; letter: number; voice: number }; dominantKind: string }) {
  const total = kindCounts.memory + kindCounts.letter + kindCounts.voice;
  const labels: { key: keyof typeof kindCounts; label: string; desc: string }[] = [
    { key: 'memory', label: 'memories', desc: 'written threads' },
    { key: 'letter', label: 'letters', desc: 'sealed messages' },
    { key: 'voice',  label: 'voice',   desc: 'spoken threads' },
  ];
  const kindLabels: Record<string, string> = { memory: 'memories', letter: 'letters', voice: 'voice recordings' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '0 clamp(32px,8vw,120px)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 24 }}>
        what you wove
      </div>
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px,5vw,58px)', fontWeight: 300, fontStyle: 'italic', color: 'var(--bone)', margin: '0 0 48px', lineHeight: 1.1 }}>
        Mostly {kindLabels[dominantKind] ?? dominantKind}.
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {labels.map(({ key, label }) => {
          const count = kindCounts[key];
          const pct = total ? (count / total) * 100 : 0;
          const active = key === dominantKind;
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: active ? 'var(--warm)' : 'var(--bone-faint)' }}>
                  {label}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', color: active ? 'var(--warm)' : 'var(--bone-faint)' }}>
                  {count}
                </span>
              </div>
              <div style={{ height: 1, background: 'var(--rule)', position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: 1,
                  width: `${pct}%`,
                  background: active ? 'var(--warm)' : 'rgba(244,236,216,0.35)',
                  transition: `width 720ms ${EASE}`,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChapterEmotions({ topEmotions, dominantEmotion }: { topEmotions: [string, number][]; dominantEmotion: string | null }) {
  const max = topEmotions[0]?.[1] ?? 1;
  if (!dominantEmotion || topEmotions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '0 clamp(32px,8vw,120px)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 24 }}>
          the feeling
        </div>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px,5vw,58px)', fontWeight: 300, fontStyle: 'italic', color: 'var(--bone)', margin: 0, lineHeight: 1.1 }}>
          No emotion data yet.
        </h2>
      </div>
    );
  }
  const label = EMOTION_COPY[dominantEmotion] ?? dominantEmotion;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '0 clamp(32px,8vw,120px)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 24 }}>
        the feeling
      </div>
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px,5vw,58px)', fontWeight: 300, fontStyle: 'italic', color: 'var(--bone)', margin: '0 0 48px', lineHeight: 1.1 }}>
        Your year was carried<br />by {label}.
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 380 }}>
        {topEmotions.map(([em, count]) => {
          const pct = (count / max) * 100;
          const active = em === dominantEmotion;
          const copy = EMOTION_COPY[em] ?? em;
          return (
            <div key={em}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: active ? 'var(--warm)' : 'var(--bone-faint)' }}>
                  {copy}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', color: active ? 'var(--warm)' : 'var(--bone-faint)' }}>
                  {count}
                </span>
              </div>
              <div style={{ height: 1, background: 'var(--rule)', position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: 1,
                  width: `${pct}%`,
                  background: active ? 'var(--warm)' : 'rgba(244,236,216,0.35)',
                  transition: `width 720ms ${EASE}`,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChapterHighlights({ firstEntry, busiestDay, total }: {
  firstEntry: Entry | null;
  busiestDay: [string, number] | null;
  total: number;
}) {
  const firstDate = firstEntry
    ? firstEntry.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
    : null;
  const busiestDate = busiestDay
    ? new Date(`${busiestDay[0]}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '0 clamp(32px,8vw,120px)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 24 }}>
        highlights
      </div>
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px,5vw,58px)', fontWeight: 300, fontStyle: 'italic', color: 'var(--bone)', margin: '0 0 48px', lineHeight: 1.1 }}>
        {total === 0 ? <>No entries yet<br />this year.</> : <>{total} moments<br />kept forever.</>}
      </h2>
      {(firstDate || busiestDate) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {firstDate && (
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 6 }}>
                first entry
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 300, color: 'var(--bone)', fontStyle: 'italic' }}>
                {firstDate}
              </div>
            </div>
          )}
          {busiestDate && busiestDay && busiestDay[1] > 1 && (
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 6 }}>
                most active day
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 300, color: 'var(--bone)', fontStyle: 'italic' }}>
                {busiestDate} — {busiestDay[1]} entries
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChapterRhythm({ weekdayCounts, peakWeekday, activeMonths }: { weekdayCounts: number[]; peakWeekday: number; activeMonths: number }) {
  const max = Math.max(...weekdayCounts, 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '0 clamp(32px,8vw,120px)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 24 }}>
        your rhythm
      </div>
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px,5vw,58px)', fontWeight: 300, fontStyle: 'italic', color: 'var(--bone)', margin: '0 0 12px', lineHeight: 1.1 }}>
        {WEEKDAYS[peakWeekday]}s are your<br />day to weave.
      </h2>
      <p style={{ fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic', color: 'var(--bone-faint)', lineHeight: 1.7, margin: '0 0 48px' }}>
        You were active across {activeMonths} {activeMonths === 1 ? 'month' : 'months'} this year.
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
        {weekdayCounts.map((count, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: '100%', maxWidth: 22,
              height: count === 0 ? 2 : Math.max(4, (count / max) * 72),
              background: i === peakWeekday ? 'var(--warm)' : count > 0 ? 'rgba(244,236,216,0.3)' : 'rgba(244,236,216,0.07)',
            }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.06em', color: i === peakWeekday ? 'var(--warm)' : 'var(--bone-faint)', textTransform: 'uppercase' }}>
              {WEEKDAYS[i].slice(0,2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChapterStreak({ maxStreak, total, year }: { maxStreak: number; total: number; year: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '0 clamp(32px,8vw,120px)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 24 }}>
        consistency
      </div>
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px,5vw,58px)', fontWeight: 300, fontStyle: 'italic', color: 'var(--bone)', margin: '0 0 48px', lineHeight: 1.1 }}>
        {maxStreak === 0
          ? <>Start your streak<br />in {year}.</>
          : maxStreak === 1
            ? <>You wove every<br />entry with intention.</>
            : <>{maxStreak}-day<br />longest streak.</>
        }
      </h2>
      <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 32 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 10 }}>
          total this year
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 'clamp(48px,8vw,96px)', fontWeight: 300, color: 'var(--bone)', lineHeight: 1 }}>
          {total}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginTop: 8 }}>
          entries woven into the cloth
        </div>
      </div>
    </div>
  );
}

function ChapterShare({ year, total, activeMonths, onShare, copied }: { year: number; total: number; activeMonths: number; onShare: () => void; copied: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '0 clamp(32px,8vw,120px)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 24 }}>
        the thread continues
      </div>
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, fontStyle: 'italic', color: 'var(--bone)', margin: '0 0 48px', lineHeight: 1.05 }}>
        {total} threads this year.<br />
        {activeMonths} months of woven time.
      </h2>
      <p style={{ fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic', color: 'var(--bone-dim)', lineHeight: 1.7, margin: '0 0 48px', maxWidth: '42ch' }}>
        Every thread you wove this year is part of something that outlasts you.
        The cloth grows. The bloodline remembers.
      </p>
      <button
        type="button"
        onClick={onShare}
        style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 0, textAlign: 'left' }}
      >
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)', letterSpacing: '0.22em', textTransform: 'uppercase', borderBottom: '1px solid rgba(176,122,74,0.4)', paddingBottom: 2 }}>
          {copied ? 'link copied →' : `share your ${year} →`}
        </span>
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const CHAPTERS = ['overview','highlights','months','emotions','kinds','rhythm','streak','share'] as const;
type Chapter = typeof CHAPTERS[number];

export default function Wrapped() {
  const { year: yearParam } = useParams<{ year?: string }>();
  const YEAR = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  const { user, isAuthenticated } = useAuthStore();
  const [chapter, setChapter] = useState<Chapter>('overview');
  const [copied, setCopied] = useState(false);

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
      ...mems.map((m: any) => ({ kind: 'memory' as const, date: parseDate(m), emotion: m.emotion ?? null })),
      ...lets.map((l: any) => ({ kind: 'letter' as const, date: parseDate(l), emotion: null })),
      ...vox.map((v: any)  => ({ kind: 'voice'  as const, date: parseDate(v), emotion: null })),
    ].filter((e) => !isNaN(e.date.getTime()));
  }, [memoriesData, lettersData, voiceData]);

  const stats = useMemo(() => buildStats(allEntries, YEAR), [allEntries, YEAR]);
  const firstName = user?.firstName?.trim() || '';
  const chapterIdx = CHAPTERS.indexOf(chapter);

  const go = (dir: 1 | -1) => {
    let idx = chapterIdx + dir;
    while (idx >= 0 && idx < CHAPTERS.length) {
      const candidate = CHAPTERS[idx];
      // Skip data-dependent chapters when there are no entries for this year
      if (
        (stats.thisYear.length === 0 && (candidate === 'kinds' || candidate === 'rhythm' || candidate === 'highlights')) ||
        (stats.topEmotions.length === 0 && candidate === 'emotions')
      ) {
        idx += dir;
        continue;
      }
      setChapter(candidate);
      return;
    }
  };

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

  const content = (() => {
    switch (chapter) {
      case 'overview':   return <ChapterOverview total={stats.thisYear.length} year={YEAR} name={firstName} />;
      case 'highlights': return <ChapterHighlights firstEntry={stats.firstEntry} busiestDay={stats.busiestDay} total={stats.thisYear.length} />;
      case 'months':     return <ChapterMonths monthlyCounts={stats.monthlyCounts} peakMonthIdx={stats.peakMonthIdx} />;
      case 'emotions':   return stats.topEmotions.length > 0 ? <ChapterEmotions topEmotions={stats.topEmotions} dominantEmotion={stats.dominantEmotion} /> : null;
      case 'kinds':      return stats.thisYear.length > 0 ? <ChapterKinds kindCounts={stats.kindCounts} dominantKind={stats.dominantKind} /> : null;
      case 'rhythm':     return stats.thisYear.length > 0 ? <ChapterRhythm weekdayCounts={stats.weekdayCounts} peakWeekday={stats.peakWeekday} activeMonths={stats.activeMonths} /> : null;
      case 'streak':     return <ChapterStreak maxStreak={stats.maxStreak} total={stats.thisYear.length} year={YEAR} />;
      case 'share':      return <ChapterShare year={YEAR} total={stats.thisYear.length} activeMonths={stats.activeMonths} onShare={handleShare} copied={copied} />;
      default: return null;
    }
  })();

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'wrapped' }]} />}
      topbarCenter={`${YEAR}`}
      topbarRight={<UserMenu />}
    >
      <style>{`
        .wrapped-chapter {
          position: absolute; inset: 0;
          animation: wrapped-in 360ms ${EASE};
        }
        @keyframes wrapped-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wrapped-chapter { animation: none; }
        }
      `}</style>

      {/* Progress hairline */}
      <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--rule)', zIndex: 5, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: 1,
          background: 'var(--warm)',
          width: `${((chapterIdx + 1) / CHAPTERS.length) * 100}%`,
          transition: `width 360ms ${EASE}`,
        }} />
      </div>

      {/* Chapter content */}
      <div
        key={chapter}
        className="wrapped-chapter"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1);
          if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   go(-1);
        }}
        tabIndex={0}
        style={{ outline: 'none' }}
        onWheel={(e) => { if (Math.abs(e.deltaY) > 40) go(e.deltaY > 0 ? 1 : -1); }}
      >
        {content}
      </div>

      {/* Dot pager — right edge */}
      <div style={{
        position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 10, zIndex: 10,
      }}>
        {CHAPTERS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChapter(c)}
            aria-label={c}
            aria-current={c === chapter}
            style={{
              width: 1.5, height: c === chapter ? 18 : 5, padding: 0, border: 0,
              background: c === chapter ? 'var(--warm)' : 'var(--bone-faint)',
              cursor: 'pointer',
              transition: `height 180ms ${EASE}, background 180ms ${EASE}`,
            }}
          />
        ))}
      </div>

      {/* Prev / next */}
      {chapterIdx > 0 && (
        <button
          type="button"
          onClick={() => go(-1)}
          style={{
            position: 'absolute', bottom: 40, left: 'clamp(32px,8vw,120px)',
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'var(--bone-faint)', zIndex: 10,
          }}
        >
          ← back
        </button>
      )}
      {chapterIdx < CHAPTERS.length - 1 && (
        <button
          type="button"
          onClick={() => go(1)}
          style={{
            position: 'absolute', bottom: 40, right: 50,
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'var(--warm)', zIndex: 10,
          }}
        >
          next →
        </button>
      )}
    </ClothShell>
  );
}
