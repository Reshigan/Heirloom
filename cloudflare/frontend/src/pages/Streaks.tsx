import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { CosmicHeader, EntryRow, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { streaksApi, challengesApi } from '../services/api';

// Dye names in rotation for activity grid cells
const DYE_NAMES = [
  'madder', 'cochineal', 'kermes', 'saffron', 'weld',
  'walnut', 'oakgall', 'woad', 'indigo', 'iron',
] as const;

function dyeForDate(dateStr: string): string {
  // deterministic dye from date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return DYE_NAMES[hash % DYE_NAMES.length];
}

interface ActivityDay {
  date: string;   // YYYY-MM-DD
  hasEntry: boolean;
}

export function Streaks() {
  const queryClient = useQueryClient();
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeError, setFreezeError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ date: string; x: number; y: number } | null>(null);

  const { data: streak, isLoading: streakLoading } = useQuery({
    queryKey: ['streak'],
    queryFn: () => streaksApi.getStatus().then(r => r.data),
  });

  const { data: currentChallenge } = useQuery({
    queryKey: ['currentChallenge'],
    queryFn: () => challengesApi.getCurrent().then(r => r.data).catch(() => null),
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => challengesApi.getAll().then(r => r.data),
  });

  const freezeMutation = useMutation({
    mutationFn: () => streaksApi.freezeStreak(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      setShowFreezeModal(false);
      setFreezeError(null);
    },
    onError: () => setFreezeError('could not freeze streak'),
  });

  // Continuity marks — plain labels, no trophy/badge language
  const continuityMarks = [
    { days: 7,   label: '7 days running' },
    { days: 14,  label: '14 days running' },
    { days: 30,  label: '30 days running' },
    { days: 60,  label: '60 days running' },
    { days: 100, label: '100 days running' },
    { days: 365, label: 'one year running' },
  ];

  const currentStreak: number = streak?.currentStreak || 0;
  const longestStreak: number = streak?.longestStreak || 0;
  const totalMemories: number = streak?.totalMemoriesCreated || 0;

  // Build last 91 days (13 weeks × 7) for activity grid
  const activityDays: ActivityDay[] = (() => {
    const days: ActivityDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeDatesSet = new Set<string>(
      (streak?.activeDates as string[] | undefined) ?? [],
    );
    for (let i = 90; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({ date: iso, hasEntry: activeDatesSet.has(iso) });
    }
    return days;
  })();

  const backLink = (
    <Link
      to="/loom/index"
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.16em',
        color: 'var(--bone-faint)',
        textDecoration: 'none',
        textTransform: 'uppercase',
      }}
    >
      ← heirloom
    </Link>
  );

  return (
    <ClothShell topbarLeft={backLink} topbarCenter="streaks">
      <div
        style={{
          maxWidth: 'var(--page-max-wide)',
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        {/* ── CosmicHeader: mono eyebrow states the current streak count ── */}
        <CosmicHeader
          eyebrow={`${currentStreak} ${currentStreak === 1 ? 'day' : 'days'} unbroken`}
          title="The thread unbroken."
        />

        {streakLoading ? (
          <p
            className="hl-serif hl-italic"
            style={{ color: 'var(--bone-faint)', fontSize: 16 }}
          >
            Reading the thread…
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 64 }}>

            {/* ── Current streak — quiet serif numeral, mono label ── */}
            <section>
              {/* Current streak number */}
              <div style={{ marginBottom: 4 }}>
                <span
                  className="hl-serif"
                  style={{
                    fontSize: 'clamp(56px, 9vw, 96px)',
                    fontWeight: 200,
                    letterSpacing: '-0.022em',
                    color: 'var(--bone)',
                    lineHeight: 1,
                    display: 'block',
                  }}
                >
                  {currentStreak}
                </span>
                <span
                  className="hl-mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--bone-faint)',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginTop: 8,
                  }}
                >
                  days running
                </span>
              </div>

              {/* Status line */}
              <div style={{ marginTop: 20 }}>
                {streak?.isStreakActive ? (
                  <span
                    className="hl-mono"
                    style={{ fontSize: 11, color: 'var(--warm)', letterSpacing: '0.18em', textTransform: 'uppercase' }}
                  >
                    active
                  </span>
                ) : streak?.canExtendStreak ? (
                  <span
                    className="hl-mono"
                    style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.06em' }}
                  >
                    Add an entry today to continue the thread.
                    <Link
                      to="/compose"
                      style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)', textDecoration: 'none', marginLeft: 10 }}
                    >
                      write now →
                    </Link>
                  </span>
                ) : (
                  <span
                    className="hl-mono"
                    style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.06em' }}
                  >
                    Begin a new thread today.
                    <Link
                      to="/compose"
                      style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)', textDecoration: 'none', marginLeft: 10 }}
                    >
                      write now →
                    </Link>
                  </span>
                )}
                {streak?.streakFrozenUntil && (
                  <span
                    className="hl-mono"
                    style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.06em', display: 'block', marginTop: 10 }}
                  >
                    Thread held until {new Date(streak.streakFrozenUntil).toLocaleDateString()}.
                  </span>
                )}
              </div>

              {/* ── Stat figures — quiet serif numerals, mono labels ── */}
              <div
                style={{
                  marginTop: 36,
                  paddingTop: 28,
                  borderTop: '1px solid var(--rule)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'clamp(36px, 8vw, 72px)',
                  alignItems: 'flex-end',
                }}
              >
                <div>
                  <span
                    className="hl-serif"
                    style={{ fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 200, color: 'var(--bone)', lineHeight: 1, display: 'block', letterSpacing: '-0.02em' }}
                  >
                    {longestStreak}
                  </span>
                  <span
                    className="hl-mono"
                    style={{ fontSize: 9.5, color: 'var(--bone-faint)', letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginTop: 8 }}
                  >
                    longest run
                  </span>
                </div>
                <div>
                  <span
                    className="hl-serif"
                    style={{ fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 200, color: 'var(--bone)', lineHeight: 1, display: 'block', letterSpacing: '-0.02em' }}
                  >
                    {totalMemories}
                  </span>
                  <span
                    className="hl-mono"
                    style={{ fontSize: 9.5, color: 'var(--bone-faint)', letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginTop: 8 }}
                  >
                    entries total
                  </span>
                </div>
                {streak?.streakStartedAt && (
                  <div>
                    <span
                      className="hl-serif hl-italic"
                      style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: 300, color: 'var(--bone-dim)', lineHeight: 1.1, display: 'block' }}
                    >
                      {new Date(streak.streakStartedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </span>
                    <span
                      className="hl-mono"
                      style={{ fontSize: 9.5, color: 'var(--bone-faint)', letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginTop: 8 }}
                    >
                      since
                    </span>
                  </div>
                )}
              </div>

              {/* Hold thread option */}
              {streak?.isStreakActive && !streak?.streakFrozenUntil && (
                <div
                  style={{
                    marginTop: 32,
                    paddingTop: 24,
                    borderTop: '1px solid var(--rule)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 24,
                  }}
                >
                  <div>
                    <p
                      className="hl-serif"
                      style={{ fontSize: 16, fontWeight: 300, color: 'var(--bone)', margin: '0 0 4px' }}
                    >
                      Hold the thread for one day.
                    </p>
                    <p
                      className="hl-mono"
                      style={{ fontSize: 10, color: 'var(--bone-faint)', margin: 0, letterSpacing: '0.06em' }}
                    >
                      Rest without losing continuity. Once per week.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFreezeModal(true)}
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: 'var(--bone-dim)',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      padding: '8px 0',
                      cursor: 'pointer',
                      borderRadius: 0,
                      flexShrink: 0,
                      transition: 'color 180ms var(--ease)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'var(--warm)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--bone-dim)';
                    }}
                  >
                    hold thread →
                  </button>
                </div>
              )}
            </section>

            {/* ── Activity grid — last 91 days ── */}
            <section>
              <SectionLabel>91 Days</SectionLabel>

              {/* Tooltip */}
              <div style={{ position: 'relative', overflowX: 'auto' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 4,
                    marginTop: 20,
                    minWidth: 340,
                  }}
                >
                  {activityDays.map(day => (
                    <button
                      key={day.date}
                      type="button"
                      onMouseEnter={e => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setTooltip({ date: day.date, x: r.left + r.width / 2, y: r.top - 8 });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      aria-label={day.date}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 0,
                        background: day.hasEntry ? 'var(--rule)' : 'var(--ink)',
                        borderLeft: day.hasEntry ? `3px solid var(--dye-${dyeForDate(day.date)})` : '3px solid transparent',
                        cursor: 'default',
                        transition: 'opacity 180ms var(--ease)',
                        padding: 0,
                        display: 'block',
                      }}
                      onMouseOver={e => { e.currentTarget.style.opacity = '0.8'; }}
                      onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
                    />
                  ))}
                </div>

                {/* Tooltip overlay */}
                {tooltip && (
                  <div
                    style={{
                      position: 'fixed',
                      left: tooltip.x,
                      top: tooltip.y,
                      transform: 'translate(-50%, -100%)',
                      background: 'var(--ink)',
                      border: '1px solid var(--rule)',
                      padding: '4px 8px',
                      pointerEvents: 'none',
                      zIndex: 100,
                    }}
                  >
                    <span
                      className="hl-mono"
                      style={{ fontSize: 10, color: 'var(--bone-dim)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
                    >
                      {tooltip.date}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* ── Continuity marks — hairline ledger rows ── */}
            <section>
              <SectionLabel>Continuity Marks</SectionLabel>
              <div style={{ borderTop: '1px solid var(--rule)' }}>
                {continuityMarks.map(mark => {
                  const reached = longestStreak >= mark.days;
                  return (
                    <EntryRow
                      key={mark.days}
                      title={mark.label}
                      italic={!reached}
                      year={`${mark.days}D`}
                      meta={reached ? 'REACHED' : '—'}
                    />
                  );
                })}
              </div>
            </section>

            {/* ── Current challenge cross-link ── */}
            {currentChallenge && (
              <section>
                <SectionLabel>This Week's Theme</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, paddingTop: 8 }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <h3
                      className="hl-serif"
                      style={{ fontSize: 22, fontWeight: 400, color: 'var(--bone)', margin: '0 0 8px', lineHeight: 1.2 }}
                    >
                      {currentChallenge.title}
                    </h3>
                    <p
                      className="hl-serif"
                      style={{ fontSize: 15, color: 'var(--bone-dim)', margin: '0 0 12px', lineHeight: 1.6, fontWeight: 300 }}
                    >
                      {currentChallenge.description}
                    </p>
                    <span
                      className="hl-mono"
                      style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}
                    >
                      {currentChallenge.hashtag} · {currentChallenge.submissionCount || 0} entries
                    </span>
                  </div>
                  <Link
                    to="/challenges"
                    style={{
                      fontFamily: 'var(--mono)',
                      textDecoration: 'none',
                      flexShrink: 0,
                      color: 'var(--warm)',
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      paddingTop: 6,
                    }}
                  >
                    join theme →
                  </Link>
                </div>
              </section>
            )}

            {/* ── Upcoming themes — hairline ledger rows ── */}
            {challenges && (challenges as any[]).length > 0 && (
              <section>
                <SectionLabel>Coming Themes</SectionLabel>
                <div style={{ borderTop: '1px solid var(--rule)' }}>
                  {(challenges as any[]).slice(0, 4).map((challenge: any) => (
                    <EntryRow
                      key={challenge.id}
                      title={challenge.title}
                      sub={challenge.theme}
                      meta={new Date(challenge.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Wax seal foot ── */}
            <div style={{ paddingTop: 8 }}>
              <WaxSeal />
            </div>
          </div>
        )}
      </div>

      {/* ── Hold thread overlay ── */}

      {showFreezeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--ink-translucent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: 24,
          }}
          onClick={() => setShowFreezeModal(false)}
        >
          <div
            className="cosmic-panel cosmic-panel--solid"
            style={{
              padding: '40px 36px',
              maxWidth: 400,
              width: '100%',
              textAlign: 'center',
              borderRadius: 0,
            }}
            onClick={e => e.stopPropagation()}
          >
            <p
              className="hl-mono"
              style={{ fontSize: 20, color: 'var(--warm)', marginBottom: 14, letterSpacing: '0.02em' }}
            >
              ∞
            </p>
            <h3
              className="hl-serif hl-italic"
              style={{ fontSize: 20, fontWeight: 300, color: 'var(--bone)', margin: '0 0 10px' }}
            >
              Hold the thread?
            </h3>
            <p
              className="hl-serif"
              style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 28px', lineHeight: 1.7, fontWeight: 300 }}
            >
              Your continuity is preserved for 24 hours. You may hold the thread once per week.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => { setShowFreezeModal(false); setFreezeError(null); }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--rule)',
                  color: 'var(--bone-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  borderRadius: 0,
                }}
              >
                cancel
              </button>
              <button
                type="button"
                onClick={() => freezeMutation.mutate()}
                disabled={freezeMutation.isPending}
                className="hl-btn"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '8px 16px',
                  borderRadius: 0,
                  opacity: freezeMutation.isPending ? 0.5 : 1,
                  cursor: freezeMutation.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {freezeMutation.isPending ? 'holding…' : 'hold thread'}
              </button>
            </div>
            {freezeError && (
              <p
                className="hl-mono"
                style={{ fontSize: 11, color: 'var(--warm)', marginTop: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                {freezeError}
              </p>
            )}
          </div>
        </div>
      )}
    </ClothShell>
  );
}
