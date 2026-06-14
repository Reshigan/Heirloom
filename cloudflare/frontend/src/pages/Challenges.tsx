import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { challengesApi } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';

export function Challenges() {
  const queryClient = useQueryClient();
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

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
      setSubmitError(null);
    },
    onError: () => {
      setSubmitError('Submission failed. Please try again.');
    },
  });

  const handleShare = (platform: string) => {
    const challenge = currentChallenge;
    if (!challenge) return;
    const text = `I just shared a memory for the ${challenge.title} challenge on Heirloom! ${challenge.hashtag}`;
    const url = `${window.location.origin}/challenges`;
    let shareUrl = '';
    switch (platform) {
      case 'instagram':
        copyToClipboard(`${text}\n\n${url}`).then(() => {
          setCopiedPlatform('instagram');
          setTimeout(() => setCopiedPlatform(null), 2000);
        }).catch(() => {});
        break;
      case 'tiktok':
        copyToClipboard(`${text}\n\n${url}`).then(() => {
          setCopiedPlatform('tiktok');
          setTimeout(() => setCopiedPlatform(null), 2000);
        }).catch(() => {});
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
    border: '1px solid var(--rule)',
    borderRadius: 2,
    color: 'var(--bone)',
    caretColor: 'var(--warm)',
    fontFamily: 'var(--serif)',
    fontSize: 16,
    lineHeight: 1.7,
    padding: '12px 14px',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'none',
  };

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
    <ClothShell topbarLeft={backLink} topbarCenter="challenges">
      <div style={{ padding: '40px 0' }}>

        {/* Page header */}
        <header style={{ marginBottom: 40, padding: '0 clamp(16px, 4vw, 40px)' }}>
          <h1
            className="hl-serif hl-tight"
            style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 300, margin: '0 0 28px', color: 'var(--bone)' }}
          >
            Your challenges.
          </h1>
        </header>

        {isLoading ? (
          <p
            className="hl-serif hl-italic"
            style={{ color: 'var(--bone-faint)', padding: '0 clamp(16px, 4vw, 40px)' }}
          >
            Loading…
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 0 }}>

            {/* Current challenge */}
            {currentChallenge ? (
              <section
                style={{
                  borderTop: '1px solid var(--rule)',
                  padding: '20px clamp(16px, 4vw, 40px)',
                }}
              >
                <p className="hl-eyebrow" style={{ marginBottom: 20 }}>This week</p>

                <style>{`
                  .challenges-current { grid-template-columns: 1fr 1fr; }
                  .challenges-how { grid-template-columns: repeat(3, 1fr); }
                  .challenges-upcoming { grid-template-columns: 140px 1fr; }
                  @media (max-width: 680px) {
                    .challenges-current { grid-template-columns: 1fr; }
                    .challenges-how { grid-template-columns: 1fr; }
                    .challenges-upcoming { grid-template-columns: 1fr; }
                    .challenges-upcoming-date { margin-bottom: 4px; }
                  }
                `}</style>
                <div className="challenges-current" style={{ display: 'grid', gap: 48 }}>
                  <div>
                    <h2
                      className="hl-serif"
                      style={{ fontSize: 28, fontWeight: 300, margin: '0 0 12px', lineHeight: 1.2, color: 'var(--bone)' }}
                    >
                      {currentChallenge.title}
                    </h2>
                    <p
                      className="hl-prose"
                      style={{ fontSize: 15, color: 'var(--bone-dim)', margin: '0 0 20px', lineHeight: 1.7 }}
                    >
                      {currentChallenge.description}
                    </p>

                    <div
                      style={{
                        borderLeft: '1px solid var(--rule)',
                        paddingLeft: 16,
                        marginBottom: 24,
                      }}
                    >
                      <p className="hl-eyebrow" style={{ marginBottom: 6 }}>This week's prompt</p>
                      <p
                        className="hl-serif hl-italic"
                        style={{ fontSize: 15, color: 'var(--bone)', margin: 0 }}
                      >
                        "{currentChallenge.prompt}"
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                      <span
                        className="hl-mono"
                        style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.06em' }}
                      >
                        {currentChallenge.hashtag}
                      </span>
                      <span
                        className="hl-mono"
                        style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.04em' }}
                      >
                        {getDaysRemaining(currentChallenge.end_date)} days remaining
                      </span>
                      <span
                        className="hl-mono"
                        style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.04em' }}
                      >
                        {currentChallenge.submissionCount || 0} entries
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setShowSubmitModal(true)}
                        className="hl-btn"
                      >
                        add to thread
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShare('twitter')}
                        className="hl-btn ghost"
                      >
                        share · X
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShare('instagram')}
                        className="hl-btn ghost"
                      >
                        {copiedPlatform === 'instagram' ? 'copied' : 'share · Instagram'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShare('facebook')}
                        className="hl-btn ghost"
                      >
                        share · Facebook
                      </button>
                    </div>
                  </div>

                  <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 32 }}>
                    <p className="hl-eyebrow" style={{ marginBottom: 16 }}>Recent entries</p>
                    {submissions && (submissions as any[]).length > 0 ? (
                      <div style={{ display: 'grid', gap: 16 }}>
                        {(submissions as any[]).slice(0, 5).map((sub: any) => (
                          <div key={sub.id} style={{ paddingBottom: 16, borderBottom: '1px solid var(--rule)' }}>
                            <p
                              className="hl-mono"
                              style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.06em', margin: '0 0 4px' }}
                            >
                              {sub.first_name}{sub.last_name ? ` ${sub.last_name[0]}.` : ''}
                            </p>
                            <p
                              className="hl-prose"
                              style={{
                                fontSize: 14,
                                color: 'var(--bone-dim)',
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
                        <p className="hl-mono" style={{ fontSize: 22, color: 'var(--warm)', marginBottom: 8 }}>∞</p>
                        <p
                          className="hl-serif hl-italic"
                          style={{ fontSize: 14, color: 'var(--bone-faint)', margin: 0 }}
                        >
                          No entries yet. Be the first to weave this thread.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <div
                style={{
                  borderTop: '1px solid var(--rule)',
                  padding: 'clamp(24px, 5vw, 60px) clamp(16px, 4vw, 40px)',
                  textAlign: 'center',
                }}
              >
                <p className="hl-mono" style={{ fontSize: 22, color: 'var(--warm)', marginBottom: 12 }}>∞</p>
                <h2
                  className="hl-serif hl-italic"
                  style={{ fontSize: 24, fontWeight: 300, margin: '0 0 8px', color: 'var(--bone)' }}
                >
                  No active challenge.
                </h2>
                <p
                  className="hl-serif hl-italic"
                  style={{ fontSize: 15, color: 'var(--bone-faint)', margin: 0 }}
                >
                  Check back soon for the next weekly theme.
                </p>
              </div>
            )}

            {/* Upcoming challenges */}
            {challenges && (challenges as any[]).filter((c: any) => new Date(c.start_date) > new Date()).length > 0 && (
              <section style={{ borderTop: '1px solid var(--rule)', padding: '20px clamp(16px, 4vw, 40px)' }}>
                <p className="hl-eyebrow" style={{ marginBottom: 20 }}>Coming threads</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {(challenges as any[])
                    .filter((c: any) => new Date(c.start_date) > new Date())
                    .slice(0, 6)
                    .map((challenge: any) => (
                      <li
                        key={challenge.id}
                        role="button"
                        tabIndex={0}
                        style={{
                          borderTop: '1px solid var(--rule)',
                          padding: '20px 0',
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedChallenge(challenge)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedChallenge(challenge); } }}
                      >
                        <article className="challenges-upcoming" style={{ display: 'grid', gap: 32, alignItems: 'baseline' }}>
                          <p
                            className="hl-mono"
                            style={{ margin: 0, fontSize: 10, letterSpacing: '0.04em', color: 'var(--warm)' }}
                          >
                            {new Date(challenge.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                          <div>
                            <h3
                              className="hl-serif"
                              style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone)', margin: '0 0 8px', lineHeight: 1.3 }}
                            >
                              {challenge.title}
                            </h3>
                            <p
                              className="hl-prose"
                              style={{ fontSize: 15, color: 'var(--bone-dim)', margin: 0, lineHeight: 1.6 }}
                            >
                              {challenge.description}
                            </p>
                            <p
                              className="hl-mono"
                              style={{ margin: '8px 0 0', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.12em' }}
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
            <section style={{ borderTop: '1px solid var(--rule)', padding: '20px clamp(16px, 4vw, 40px)' }}>
              <p className="hl-eyebrow" style={{ marginBottom: 32 }}>How challenges work</p>
              <div className="challenges-how" style={{ display: 'grid', gap: 40 }}>
                {[
                  { n: '01', h: 'A theme arrives.', b: 'Each week a new prompt surfaces — something to bring from memory into the thread.' },
                  { n: '02', h: 'You write into it.', b: 'Add an entry, a voice note, or a letter. The prompt is the door; what you bring is the thread.' },
                  { n: '03', h: 'The thread continues.', b: 'Share with your bloodline or across platforms. The weaving never stops.' },
                ].map(({ n, h, b }) => (
                  <div key={n}>
                    <p
                      className="hl-mono"
                      style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.06em', margin: '0 0 10px' }}
                    >
                      {n}
                    </p>
                    <h3
                      className="hl-serif"
                      style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone)', margin: '0 0 8px' }}
                    >
                      {h}
                    </h3>
                    <p
                      className="hl-prose"
                      style={{ fontSize: 14, color: 'var(--bone-faint)', margin: 0, lineHeight: 1.7 }}
                    >
                      {b}
                    </p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}
      </div>

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
            className="cosmic-panel cosmic-panel--solid"
            style={{
              padding: 40,
              maxWidth: 520,
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="hl-eyebrow" style={{ marginBottom: 12 }}>
              {currentChallenge.title}
            </p>
            <h3
              className="hl-serif hl-italic"
              style={{ fontSize: 22, fontWeight: 300, color: 'var(--bone)', margin: '0 0 6px' }}
            >
              Add your entry.
            </h3>
            <p
              className="hl-prose"
              style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 24px', lineHeight: 1.6 }}
            >
              {currentChallenge.prompt}
            </p>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  marginBottom: 10,
                }}
              >
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

            {submitError && (
              <p style={{ color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 11, margin: '0 0 12px' }}>
                {submitError}
              </p>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowSubmitModal(false)} className="hl-btn ghost">
                cancel
              </button>
              <button
                type="button"
                onClick={() => submitMutation.mutate({ challengeId: currentChallenge.id, content: submissionContent })}
                disabled={!submissionContent.trim() || submitMutation.isPending}
                className="hl-btn"
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
            className="cosmic-panel cosmic-panel--solid"
            style={{
              padding: 40,
              maxWidth: 480,
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p
              className="hl-mono"
              style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.06em', margin: '0 0 10px' }}
            >
              starts {new Date(selectedChallenge.start_date).toLocaleDateString()}
            </p>
            <h3
              className="hl-serif"
              style={{ fontSize: 24, fontWeight: 300, color: 'var(--bone)', margin: '0 0 10px' }}
            >
              {selectedChallenge.title}
            </h3>
            <p
              className="hl-prose"
              style={{ fontSize: 15, color: 'var(--bone-dim)', margin: '0 0 20px', lineHeight: 1.7 }}
            >
              {selectedChallenge.description}
            </p>

            <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 16, marginBottom: 20 }}>
              <p className="hl-eyebrow" style={{ marginBottom: 6 }}>Prompt</p>
              <p
                className="hl-serif hl-italic"
                style={{ fontSize: 15, color: 'var(--bone)', margin: 0 }}
              >
                "{selectedChallenge.prompt}"
              </p>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>{selectedChallenge.hashtag}</span>
              <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>
                {selectedChallenge.duration_days
                  ? `${selectedChallenge.duration_days} days`
                  : selectedChallenge.start_date && selectedChallenge.end_date
                  ? `${Math.max(1, Math.round((new Date(selectedChallenge.end_date).getTime() - new Date(selectedChallenge.start_date).getTime()) / (1000 * 60 * 60 * 24)))} days`
                  : '7 days'}
              </span>
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button type="button" onClick={() => setSelectedChallenge(null)} className="hl-btn ghost">close</button>
            </div>
          </div>
        </div>
      )}
    </ClothShell>
  );
}
