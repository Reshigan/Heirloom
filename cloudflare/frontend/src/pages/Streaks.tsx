import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { RoomHeader } from '../loom/components/room';
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
        {/* ── Kicker + H1 ── */}
        <div style={{ marginBottom: 28 }}>
          <RoomHeader eyebrow="Continuity" title="The thread unbroken." />
        </div>

        {streakLoading ? (
          <p
            className="hl-serif hl-italic"
            style={{ color: 'var(--bone-faint)', fontSize: 16 }}
          >
            Reading the thread…
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 56 }}>

            {/* ── Current streak ── */}
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
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginTop: 4,
                  }}
                >
                  days
                </span>
              </div>

              {/* Status line */}
              <div style={{ marginTop: 16 }}>
                {streak?.isStreakActive ? (
                  <span
                    className="hl-mono"
                    style={{ fontSize: 11, color: 'var(--warm)', letterSpacing: '0.12em', textTransform: 'uppercase' }}
                  >
                    active
                  </span>
                ) : streak?.canExtendStreak ? (
                  <span
                    className="hl-mono"
                    style={{ fontSize: 11, color: 'var(--bone-faint)', letterSpacing: '0.04em' }}
                  >
                    Add an entry today to continue the thread.
                    <Link
                      to="/compose"
                      style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--warm)', textDecoration: 'none', marginLeft: 8 }}
                    >
                      write now →
                    </Link>
                  </span>
                ) : (
                  <span
                    className="hl-mono"
                    style={{ fontSize: 11, color: 'var(--bone-faint)', letterSpacing: '0.04em' }}
                  >
                    Begin a new thread today.
                    <Link
                      to="/compose"
                      style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--warm)', textDecoration: 'none', marginLeft: 8 }}
                    >
                      write now →
                    </Link>
                  </span>
                )}
                {streak?.streakFrozenUntil && (
                  <span
                    className="hl-mono"
                    style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.04em', display: 'block', marginTop: 8 }}
                  >
                    Thread held until {new Date(streak.streakFrozenUntil).toLocaleDateString()}.
                  </span>
                )}
              </div>

              {/* Longest + total — secondary row */}
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  gap: 40,
                  alignItems: 'baseline',
                }}
              >
                <span
                  className="hl-mono"
                  style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.04em' }}
                >
                  longest {longestStreak}d
                </span>
                <span
                  className="hl-mono"
                  style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.04em' }}
                >
                  {totalMemories} entries total
                </span>
                {streak?.streakStartedAt && (
                  <span
                    className="hl-mono"
                    style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.04em' }}
                  >
                    since {new Date(streak.streakStartedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Hold thread option */}
              {streak?.isStreakActive && !streak?.streakFrozenUntil && (
                <div
                  style={{
                    marginTop: 28,
                    paddingTop: 20,
                    borderTop: '1px solid var(--rule)',
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 24,
                  }}
                >
                  <div>
                    <p
                      className="hl-serif"
                      style={{ fontSize: 15, fontWeight: 300, color: 'var(--bone)', margin: '0 0 3px' }}
                    >
                      Hold the thread for one day.
                    </p>
                    <p
                      className="hl-mono"
                      style={{ fontSize: 10, color: 'var(--bone-faint)', margin: 0, letterSpacing: '0.04em' }}
                    >
                      Rest without losing continuity. Once per week.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFreezeModal(true)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--rule)',
                      color: 'var(--bone-dim)',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      borderRadius: 0,
                      flexShrink: 0,
                      transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1), color 180ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--warm)';
                      e.currentTarget.style.color = 'var(--warm)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--rule)';
                      e.currentTarget.style.color = 'var(--bone-dim)';
                    }}
                  >
                    hold thread
                  </button>
                </div>
              )}
            </section>

            {/* ── Activity grid ── */}
            <section>
              <p
                className="hl-eyebrow"
                style={{ marginBottom: 16 }}
              >
                91 days
              </p>

              {/* Tooltip */}
              <div style={{ position: 'relative', overflowX: 'auto' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 4,
                    marginTop: 40,
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
                        transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
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

            {/* ── Continuity marks ── */}
            <section>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
                <p className="hl-eyebrow">Continuity marks</p>
                <hr
                  style={{
                    flex: 1,
                    border: 0,
                    borderTop: '1px solid var(--rule)',
                    margin: 0,
                  }}
                />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: '1px solid var(--rule)' }}>
                {continuityMarks.map(mark => {
                  const reached = longestStreak >= mark.days;
                  return (
                    <li
                      key={mark.days}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '14px 64px 1fr 64px',
                        gap: 18,
                        alignItems: 'baseline',
                        padding: '14px 0',
                        borderBottom: '1px solid var(--rule)',
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 0,
                          background: reached ? 'var(--warm)' : 'transparent',
                          border: reached ? 'none' : '1px solid var(--rule)',
                          alignSelf: 'center',
                          justifySelf: 'center',
                        }}
                      />
                      <span
                        className="hl-mono"
                        style={{
                          fontSize: 11,
                          letterSpacing: '0.04em',
                          color: 'var(--bone-faint)',
                          margin: 0,
                        }}
                      >
                        {mark.days}d
                      </span>
                      <span
                        className="hl-serif"
                        style={{
                          fontSize: 16,
                          fontWeight: 300,
                          color: reached ? 'var(--bone)' : 'var(--bone-dim)',
                          margin: 0,
                        }}
                      >
                        {mark.label}
                      </span>
                      <span
                        className="hl-mono"
                        style={{
                          fontSize: 9.5,
                          color: 'var(--bone-faint)',
                          textAlign: 'right',
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          margin: 0,
                        }}
                      >
                        {reached ? 'reached' : '—'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* ── Current challenge cross-link ── */}
            {currentChallenge && (
              <section style={{ borderTop: '1px solid var(--rule)', paddingTop: 28 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32 }}>
                  <div>
                    <p className="hl-eyebrow" style={{ marginBottom: 8 }}>This week's theme</p>
                    <h3
                      className="hl-serif"
                      style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone)', margin: '0 0 6px' }}
                    >
                      {currentChallenge.title}
                    </h3>
                    <p
                      className="hl-serif"
                      style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 8px', lineHeight: 1.6, fontWeight: 300 }}
                    >
                      {currentChallenge.description}
                    </p>
                    <span
                      className="hl-mono"
                      style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.04em' }}
                    >
                      {currentChallenge.hashtag} · {currentChallenge.submissionCount || 0} entries
                    </span>
                  </div>
                  <Link
                    to="/challenges"
                    className="hl-btn"
                    style={{
                      textDecoration: 'none',
                      flexShrink: 0,
                      padding: '8px 16px',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    join theme
                  </Link>
                </div>
              </section>
            )}

            {/* ── Upcoming themes ── */}
            {challenges && (challenges as any[]).length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16 }}>
                  <p className="hl-eyebrow">Coming themes</p>
                  <hr
                    style={{
                      flex: 1,
                      border: 0,
                      borderTop: '1px solid var(--rule)',
                      margin: 0,
                    }}
                  />
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {(challenges as any[]).slice(0, 4).map((challenge: any) => (
                    <li
                      key={challenge.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '100px 1fr',
                        gap: 20,
                        padding: '12px 0',
                        borderBottom: '1px solid var(--rule)',
                        alignItems: 'baseline',
                      }}
                    >
                      <span
                        className="hl-mono"
                        style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.04em' }}
                      >
                        {new Date(challenge.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <div>
                        <p
                          className="hl-serif"
                          style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 300, color: 'var(--bone)' }}
                        >
                          {challenge.title}
                        </p>
                        <span
                          className="hl-mono"
                          style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.06em' }}
                        >
                          {challenge.theme}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
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
                style={{ fontSize: 11, color: 'var(--danger)', marginTop: 12, letterSpacing: '0.04em' }}
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
