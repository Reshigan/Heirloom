import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { challengesApi } from '../services/api';

export function Challenges() {
  const queryClient = useQueryClient();
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');

  const { data: currentChallenge, isLoading } = useQuery({
    queryKey: ['currentChallenge'],
    queryFn: () => challengesApi.getCurrent().then(r => r.data).catch(() => null),
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => challengesApi.getAll().then(r => r.data),
  });

  const { data: submissions } = useQuery({
    queryKey: ['submissions', currentChallenge?.id],
    queryFn: () => currentChallenge ? challengesApi.getSubmissions(currentChallenge.id).then(r => r.data) : [],
    enabled: !!currentChallenge?.id,
  });

  const submitMutation = useMutation({
    mutationFn: (data: { challengeId: string; content: string }) =>
      challengesApi.submit(data.challengeId, { content: data.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['currentChallenge'] });
      setShowSubmitModal(false);
      setSubmissionContent('');
    },
  });

  const handleShare = (platform: string) => {
    const challenge = currentChallenge;
    if (!challenge) return;
    const text = `I just shared a memory for the ${challenge.title} challenge on Heirloom! ${challenge.hashtag}`;
    const url = 'https://heirloom.blue/challenges';
    let shareUrl = '';
    switch (platform) {
      case 'instagram':
        navigator.clipboard.writeText(`${text}\n\n${url}`);
        break;
      case 'tiktok':
        navigator.clipboard.writeText(`${text}\n\n${url}`);
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
        break;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: '1px solid var(--loom-rule)',
    borderRadius: 2,
    color: 'var(--loom-bone)',
    caretColor: 'var(--loom-warm)',
    fontFamily: "'Source Serif 4', serif",
    fontSize: 15,
    lineHeight: 1.7,
    padding: '12px 14px',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'none',
  };

  return (
    <AppFrame>
      <header style={{ marginBottom: 40 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
          Challenges
        </p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          Weekly themes for the thread.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 640, lineHeight: 1.6 }}
        >
          Each week a prompt surfaces — a theme to weave into your thread. Add an entry, share it with your bloodline.
        </p>
      </header>

      {isLoading ? (
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 48 }}>

          {/* Current challenge */}
          {currentChallenge ? (
            <section>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
                <p className="loom-eyebrow">This week</p>
                <hr className="loom-hairline" style={{ flex: 1 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
                <div>
                  <h2
                    className="loom-serif"
                    style={{ fontSize: 28, fontWeight: 300, margin: '0 0 12px', lineHeight: 1.2 }}
                  >
                    {currentChallenge.title}
                  </h2>
                  <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: '0 0 20px', lineHeight: 1.7 }}>
                    {currentChallenge.description}
                  </p>

                  <div
                    style={{
                      borderLeft: '1px solid var(--loom-rule)',
                      paddingLeft: 16,
                      marginBottom: 24,
                    }}
                  >
                    <p className="loom-eyebrow" style={{ marginBottom: 6 }}>This week's prompt</p>
                    <p className="loom-body" style={{ fontStyle: 'italic', fontSize: 15, color: 'var(--loom-bone)', margin: 0 }}>
                      "{currentChallenge.prompt}"
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                    <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-warm)', letterSpacing: '0.06em' }}>
                      {currentChallenge.hashtag}
                    </span>
                    <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}>
                      {getDaysRemaining(currentChallenge.end_date)} days remaining
                    </span>
                    <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}>
                      {currentChallenge.submissionCount || 0} entries
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="loom-btn"
                    >
                      add to thread
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="loom-btn-ghost"
                      aria-label="Share to X"
                    >
                      share · X
                    </button>
                    <button
                      onClick={() => handleShare('instagram')}
                      className="loom-btn-ghost"
                      aria-label="Copy for Instagram"
                    >
                      share · Instagram
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="loom-btn-ghost"
                      aria-label="Share to Facebook"
                    >
                      share · Facebook
                    </button>
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid var(--loom-rule)', paddingLeft: 32 }}>
                  <p className="loom-eyebrow" style={{ marginBottom: 16 }}>Recent entries</p>
                  {submissions && submissions.length > 0 ? (
                    <div style={{ display: 'grid', gap: 16 }}>
                      {(submissions as any[]).slice(0, 5).map((sub: any) => (
                        <div key={sub.id} style={{ paddingBottom: 16, borderBottom: '1px solid var(--loom-rule)' }}>
                          <p
                            className="loom-mono"
                            style={{ fontSize: 11, color: 'var(--loom-warm)', letterSpacing: '0.06em', margin: '0 0 4px' }}
                          >
                            {sub.first_name}{sub.last_name ? ` ${sub.last_name[0]}.` : ''}
                          </p>
                          <p
                            className="loom-body"
                            style={{
                              fontSize: 14,
                              color: 'var(--loom-bone-dim)',
                              margin: 0,
                              lineHeight: 1.6,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {sub.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ paddingTop: 24, textAlign: 'center' }}>
                      <p className="loom-mono" style={{ fontSize: 22, color: 'var(--loom-warm)', marginBottom: 8 }}>∞</p>
                      <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)', fontStyle: 'italic', margin: 0 }}>
                        No entries yet. Be the first to weave this thread.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <div style={{ padding: '60px 36px', border: '1px solid var(--loom-rule)', textAlign: 'center' }}>
              <p className="loom-mono" style={{ fontSize: 22, color: 'var(--loom-warm)', marginBottom: 12 }}>∞</p>
              <h2
                className="loom-serif"
                style={{ fontSize: 24, fontWeight: 300, fontStyle: 'italic', margin: '0 0 8px' }}
              >
                No active challenge.
              </h2>
              <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-faint)', margin: 0 }}>
                Check back soon for the next weekly theme.
              </p>
            </div>
          )}

          {/* Upcoming challenges */}
          {challenges && (challenges as any[]).filter((c: any) => new Date(c.start_date) > new Date()).length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
                <p className="loom-eyebrow">Coming threads</p>
                <hr className="loom-hairline" style={{ flex: 1 }} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(challenges as any[])
                  .filter((c: any) => new Date(c.start_date) > new Date())
                  .slice(0, 6)
                  .map((challenge: any) => (
                    <li
                      key={challenge.id}
                      style={{
                        padding: '20px 0',
                        borderBottom: '1px solid var(--loom-rule)',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedChallenge(challenge)}
                    >
                      <article style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 32, alignItems: 'baseline' }}>
                        <p
                          className="loom-mono"
                          style={{ margin: 0, fontSize: 11, letterSpacing: '0.04em', color: 'var(--loom-warm)' }}
                        >
                          {new Date(challenge.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                        <div>
                          <h3
                            className="loom-serif"
                            style={{ fontSize: 20, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 4px', lineHeight: 1.3 }}
                          >
                            {challenge.title}
                          </h3>
                          <p
                            className="loom-body"
                            style={{ fontSize: 14, color: 'var(--loom-bone-faint)', margin: 0, lineHeight: 1.6 }}
                          >
                            {challenge.description}
                          </p>
                          <p
                            className="loom-mono"
                            style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.12em' }}
                          >
                            {challenge.hashtag}
                          </p>
                        </div>
                      </article>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/* How it works */}
          <section style={{ borderTop: '1px solid var(--loom-rule)', paddingTop: 40 }}>
            <p className="loom-eyebrow" style={{ marginBottom: 32 }}>How challenges work</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
              {[
                { n: '01', h: 'A theme arrives.', b: 'Each week a new prompt surfaces — something to bring from memory into the thread.' },
                { n: '02', h: 'You write into it.', b: 'Add an entry, a voice note, or a letter. The prompt is the door; what you bring is the thread.' },
                { n: '03', h: 'The thread continues.', b: 'Share with your bloodline or across platforms. The weaving never stops.' },
              ].map(({ n, h, b }) => (
                <div key={n}>
                  <p className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-warm)', letterSpacing: '0.06em', margin: '0 0 10px' }}>{n}</p>
                  <h3 className="loom-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 8px' }}>{h}</h3>
                  <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)', margin: 0, lineHeight: 1.7 }}>{b}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Submit overlay */}
      {showSubmitModal && currentChallenge && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(14,14,12,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24,
          }}
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            style={{
              background: 'var(--loom-ink-card)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
              maxWidth: 520,
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="loom-eyebrow" style={{ marginBottom: 12 }}>
              {currentChallenge.title}
            </p>
            <h3
              className="loom-serif"
              style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 6px' }}
            >
              Add your entry.
            </h3>
            <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: '0 0 24px', lineHeight: 1.6 }}>
              {currentChallenge.prompt}
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', marginBottom: 10 }}>
                Your memory
              </label>
              <textarea
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Write here…"
                rows={5}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSubmitModal(false)} className="loom-btn-ghost">
                cancel
              </button>
              <button
                onClick={() => submitMutation.mutate({ challengeId: currentChallenge.id, content: submissionContent })}
                disabled={!submissionContent.trim() || submitMutation.isPending}
                className="loom-btn"
              >
                {submitMutation.isPending ? 'weaving…' : 'add to thread'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge detail overlay */}
      {selectedChallenge && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(14,14,12,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24,
          }}
          onClick={() => setSelectedChallenge(null)}
        >
          <div
            style={{
              background: 'var(--loom-ink-card)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
              maxWidth: 480,
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-warm)', letterSpacing: '0.06em', margin: '0 0 10px' }}>
              starts {new Date(selectedChallenge.start_date).toLocaleDateString()}
            </p>
            <h3
              className="loom-serif"
              style={{ fontSize: 24, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 10px' }}
            >
              {selectedChallenge.title}
            </h3>
            <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: '0 0 20px', lineHeight: 1.7 }}>
              {selectedChallenge.description}
            </p>

            <div style={{ borderLeft: '1px solid var(--loom-rule)', paddingLeft: 16, marginBottom: 20 }}>
              <p className="loom-eyebrow" style={{ marginBottom: 6 }}>Prompt</p>
              <p className="loom-body" style={{ fontStyle: 'italic', fontSize: 15, color: 'var(--loom-bone)', margin: 0 }}>
                "{selectedChallenge.prompt}"
              </p>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)' }}>{selectedChallenge.hashtag}</span>
              <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)' }}>7 days</span>
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button onClick={() => setSelectedChallenge(null)} className="loom-btn-ghost">close</button>
            </div>
          </div>
        </div>
      )}
    </AppFrame>
  );
}
