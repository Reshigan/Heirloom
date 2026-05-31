import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { streaksApi, challengesApi } from '../services/api';

export function Streaks() {
  const queryClient = useQueryClient();
  const [showFreezeModal, setShowFreezeModal] = useState(false);

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
    },
  });

  // Plain continuity markers — no trophy/badge labels
  const continuityMarks = [
    { days: 7, label: '7 days running' },
    { days: 14, label: '14 days running' },
    { days: 30, label: '30 days running' },
    { days: 60, label: '60 days running' },
    { days: 100, label: '100 days running' },
    { days: 365, label: 'one year running' },
  ];

  const currentStreak: number = streak?.currentStreak || 0;
  const longestStreak: number = streak?.longestStreak || 0;
  const totalMemories: number = streak?.totalMemoriesCreated || 0;

  return (
    <AppFrame>
      <header style={{ marginBottom: 48 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Thread continuity</p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          The thread keeps going.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 640, lineHeight: 1.6 }}
        >
          Every day you add to the thread, the cloth grows. Here is a quiet record of that continuity.
        </p>
      </header>

      {streakLoading ? (
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 48 }}>

          {/* Main count */}
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32 }}>
              <p className="loom-eyebrow">Consecutive days</p>
              <hr className="loom-hairline" style={{ flex: 1 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
              {/* Count block */}
              <div>
                <p
                  className="loom-mono"
                  style={{ fontSize: 64, letterSpacing: '-0.02em', color: 'var(--loom-bone)', margin: '0 0 4px', lineHeight: 1 }}
                >
                  {currentStreak}
                </p>
                <p className="loom-body" style={{ fontSize: 16, color: 'var(--loom-bone-dim)', margin: '0 0 20px' }}>
                  {currentStreak === 1
                    ? 'day in the thread'
                    : currentStreak === 0
                    ? 'days — thread resting'
                    : 'days in the thread'}
                </p>

                {streak?.isStreakActive ? (
                  <p className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-warm)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                    active
                  </p>
                ) : streak?.canExtendStreak ? (
                  <p className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em', margin: 0 }}>
                    Add an entry today to continue the thread.
                  </p>
                ) : (
                  <p className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em', margin: 0 }}>
                    Begin a new thread today.
                  </p>
                )}

                {streak?.streakFrozenUntil && (
                  <p className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-dim)', letterSpacing: '0.04em', margin: '12px 0 0' }}>
                    Thread held until {new Date(streak.streakFrozenUntil).toLocaleDateString()}.
                  </p>
                )}
              </div>

              {/* Supporting counts */}
              <div style={{ borderLeft: '1px solid var(--loom-rule)', paddingLeft: 32 }}>
                <div style={{ marginBottom: 28 }}>
                  <p className="loom-mono" style={{ fontSize: 28, color: 'var(--loom-bone)', margin: '0 0 4px', lineHeight: 1 }}>
                    {longestStreak}
                  </p>
                  <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)', margin: 0 }}>
                    longest run
                  </p>
                </div>
                <div style={{ marginBottom: 28 }}>
                  <p className="loom-mono" style={{ fontSize: 28, color: 'var(--loom-bone)', margin: '0 0 4px', lineHeight: 1 }}>
                    {totalMemories}
                  </p>
                  <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)', margin: 0 }}>
                    total entries
                  </p>
                </div>
                {streak?.streakStartedAt && (
                  <div>
                    <p className="loom-mono" style={{ fontSize: 28, color: 'var(--loom-bone)', margin: '0 0 4px', lineHeight: 1 }}>
                      {Math.ceil((Date.now() - new Date(streak.streakStartedAt).getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                    <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)', margin: 0 }}>
                      days since first entry
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Hold the thread option */}
            {streak?.isStreakActive && !streak?.streakFrozenUntil && (
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--loom-rule)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <p className="loom-serif" style={{ fontSize: 16, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 4px' }}>
                    Hold the thread for one day.
                  </p>
                  <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)', margin: 0 }}>
                    Rest without losing continuity. Once per week.
                  </p>
                </div>
                <button onClick={() => setShowFreezeModal(true)} className="loom-btn-ghost">
                  hold thread
                </button>
              </div>
            )}
          </section>

          {/* Continuity marks */}
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
              <p className="loom-eyebrow">Continuity marks</p>
              <hr className="loom-hairline" style={{ flex: 1 }} />
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {continuityMarks.map((mark) => {
                const reached = longestStreak >= mark.days;
                const progress = Math.min(100, (currentStreak / mark.days) * 100);
                return (
                  <li
                    key={mark.days}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '200px 1fr 80px',
                      gap: 24,
                      alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: '1px solid var(--loom-rule)',
                    }}
                  >
                    <p
                      className="loom-mono"
                      style={{ margin: 0, fontSize: 12, letterSpacing: '0.06em', color: reached ? 'var(--loom-warm)' : 'var(--loom-bone-faint)' }}
                    >
                      {reached ? '∞ ' : ''}{mark.label}
                    </p>
                    <div style={{ height: 1, background: 'var(--loom-rule)', position: 'relative', overflow: 'hidden' }}>
                      {!reached && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0, top: 0, bottom: 0,
                            width: `${progress}%`,
                            background: 'var(--loom-warm)',
                            transition: 'width 360ms cubic-bezier(0.16,1,0.3,1)',
                          }}
                        />
                      )}
                    </div>
                    <p
                      className="loom-mono"
                      style={{ margin: 0, fontSize: 10, color: 'var(--loom-bone-faint)', textAlign: 'right', letterSpacing: '0.04em' }}
                    >
                      {mark.days}d
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Current challenge cross-link */}
          {currentChallenge && (
            <section style={{ borderTop: '1px solid var(--loom-rule)', paddingTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <p className="loom-eyebrow" style={{ marginBottom: 6 }}>This week's theme</p>
                  <h3
                    className="loom-serif"
                    style={{ fontSize: 20, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 6px' }}
                  >
                    {currentChallenge.title}
                  </h3>
                  <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: '0 0 6px', lineHeight: 1.6 }}>
                    {currentChallenge.description}
                  </p>
                  <p className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)' }}>
                    {currentChallenge.hashtag} · {currentChallenge.submissionCount || 0} entries
                  </p>
                </div>
                <a
                  href="/challenges"
                  className="loom-btn"
                  style={{ textDecoration: 'none', flexShrink: 0, marginLeft: 32 }}
                >
                  join theme
                </a>
              </div>
            </section>
          )}

          {/* Upcoming themes */}
          {challenges && (challenges as any[]).length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
                <p className="loom-eyebrow">Coming themes</p>
                <hr className="loom-hairline" style={{ flex: 1 }} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(challenges as any[]).slice(0, 4).map((challenge: any) => (
                  <li
                    key={challenge.id}
                    style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 24, padding: '14px 0', borderBottom: '1px solid var(--loom-rule)', alignItems: 'baseline' }}
                  >
                    <p className="loom-mono" style={{ margin: 0, fontSize: 11, color: 'var(--loom-warm)', letterSpacing: '0.04em' }}>
                      {new Date(challenge.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                    <div>
                      <p className="loom-serif" style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 300, color: 'var(--loom-bone)' }}>
                        {challenge.title}
                      </p>
                      <p className="loom-mono" style={{ margin: 0, fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.06em' }}>
                        {challenge.theme}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* Hold thread overlay */}
      {showFreezeModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(14,14,12,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24,
          }}
          onClick={() => setShowFreezeModal(false)}
        >
          <div
            style={{
              background: 'var(--loom-ink-card)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
              maxWidth: 400,
              width: '100%',
              textAlign: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="loom-mono" style={{ fontSize: 22, color: 'var(--loom-warm)', marginBottom: 16 }}>∞</p>
            <h3
              className="loom-serif"
              style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 10px' }}
            >
              Hold the thread?
            </h3>
            <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: '0 0 28px', lineHeight: 1.7 }}>
              Your continuity is preserved for 24 hours. You may hold the thread once per week.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setShowFreezeModal(false)} className="loom-btn-ghost">
                cancel
              </button>
              <button
                onClick={() => freezeMutation.mutate()}
                disabled={freezeMutation.isPending}
                className="loom-btn"
              >
                {freezeMutation.isPending ? 'holding…' : 'hold thread'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppFrame>
  );
}
