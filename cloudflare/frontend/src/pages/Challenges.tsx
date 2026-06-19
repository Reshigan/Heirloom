import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { challengesApi } from '../services/api';
import { CosmicHeader, EntryRow, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { useFocusTrap } from '../lib/useFocusTrap';

export function Challenges() {
  const queryClient = useQueryClient();
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Modal overlays: canonical focus trap + Escape close, focus first field on open.
  const submitRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  useFocusTrap(submitRef, () => setShowSubmitModal(false), showSubmitModal);
  useFocusTrap(detailRef, () => setSelectedChallenge(null), !!selectedChallenge);

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: '1px solid var(--rule)',
    borderRadius: 0,
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

  // A quiet mono text affordance — the only kind of action this ledger carries.
  const affordance: React.CSSProperties = {
    fontFamily: 'var(--mono)',
    fontSize: 11,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--copper-label)',
    background: 'none',
    border: 0,
    padding: 0,
    cursor: 'pointer',
  };
  const affordanceQuiet: React.CSSProperties = {
    ...affordance,
    color: 'var(--bone-dim)',
  };

  const metaText: React.CSSProperties = {
    fontFamily: 'var(--mono)',
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
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

  const upcoming = challenges
    ? (challenges as any[]).filter((c: any) => new Date(c.start_date) > new Date())
    : [];

  // Ledger eyebrow states the count + kind, like "47 WOVEN".
  const eyebrow = isLoading
    ? 'CHALLENGES'
    : currentChallenge
    ? `1 ACTIVE · ${upcoming.length} COMING`
    : upcoming.length > 0
    ? `${upcoming.length} COMING`
    : 'NO ACTIVE THREAD';

  return (
    <ClothShell topbarLeft={backLink} topbarCenter="challenges">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px clamp(16px, 4vw, 40px) 80px' }}>

        <CosmicHeader eyebrow={eyebrow} title="The weaving challenges." />

        {isLoading ? (
          <p
            className="hl-serif hl-italic"
            style={{ color: 'var(--bone-faint)', fontSize: 16 }}
          >
            Loading…
          </p>
        ) : (
          <>
            {/* Active challenge — the prompt as a ledger entry, its meta on the right */}
            {currentChallenge ? (
              <section>
                <SectionLabel>This week's thread</SectionLabel>

                <div style={{ borderBottom: '1px solid var(--rule)', padding: '15px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, flexWrap: 'wrap' }}>
                    <h2
                      className="hl-serif"
                      style={{ flex: 1, minWidth: 0, fontSize: 25, fontWeight: 500, margin: 0, lineHeight: 1.2, color: 'var(--bone)' }}
                    >
                      {currentChallenge.title}
                    </h2>
                    {(currentChallenge.submissionCount || 0) > 0 && (
                      <span style={{ ...metaText, color: 'var(--bone-faint)', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
                        {currentChallenge.submissionCount} woven
                      </span>
                    )}
                  </div>

                  <p
                    className="hl-prose"
                    style={{ fontSize: 15, color: 'var(--bone-dim)', margin: '10px 0 0', lineHeight: 1.7 }}
                  >
                    {currentChallenge.description}
                  </p>

                  <p
                    className="hl-serif hl-italic"
                    style={{ fontSize: 16, color: 'var(--bone)', margin: '16px 0 0', lineHeight: 1.5 }}
                  >
                    "{currentChallenge.prompt}"
                  </p>

                  <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginTop: 20, alignItems: 'baseline' }}>
                    <button type="button" onClick={() => setShowSubmitModal(true)} style={affordance}>
                      add to thread →
                    </button>
                  </div>
                </div>

                {/* Recent entries — a quiet sub-ledger */}
                <SectionLabel>Recent entries</SectionLabel>
                {submissions && (submissions as any[]).length > 0 ? (
                  <div>
                    {(submissions as any[]).slice(0, 5).map((sub: any) => (
                      <div key={sub.id} style={{ borderBottom: '1px solid var(--rule)', padding: '14px 0' }}>
                        <span style={{ ...metaText, color: 'var(--gold-text)' }}>
                          {sub.first_name}{sub.last_name ? ` ${sub.last_name[0]}.` : ''}
                        </span>
                        <p
                          className="hl-serif hl-italic"
                          style={{
                            fontSize: 15,
                            color: 'var(--bone-dim)',
                            margin: '6px 0 0',
                            lineHeight: 1.55,
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
                  <p
                    className="hl-serif hl-italic"
                    style={{ fontSize: 15, color: 'var(--bone-dim)', textAlign: 'center', padding: '24px 0', margin: 0 }}
                  >
                    No entries yet. Be the first to weave this thread.
                  </p>
                )}
              </section>
            ) : (
              <p
                className="hl-serif hl-italic"
                style={{ fontSize: 17, color: 'var(--bone-dim)', textAlign: 'center', padding: '40px 0', margin: 0, lineHeight: 1.6 }}
              >
                No active challenge.<br />
                <span style={{ fontSize: 15, color: 'var(--bone-faint)' }}>Check back soon for the next weekly theme.</span>
              </p>
            )}

            {/* Coming threads — EntryRow list, prompt left, start date right */}
            {upcoming.length > 0 && (
              <section>
                <SectionLabel>Coming threads</SectionLabel>
                {upcoming.slice(0, 6).map((challenge: any) => (
                  <EntryRow
                    key={challenge.id}
                    title={challenge.title}
                    sub={challenge.description}
                    meta={new Date(challenge.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    onClick={() => setSelectedChallenge(challenge)}
                  />
                ))}
              </section>
            )}

            {/* How it works — numbered ledger rows */}
            <section>
              <SectionLabel>How challenges work</SectionLabel>
              {[
                { n: '01', h: 'A theme arrives.', b: 'Each week a new prompt surfaces — something to bring from memory into the thread.' },
                { n: '02', h: 'You write into it.', b: 'Add an entry, a voice note, or a letter. The prompt is the door; what you bring is the thread.' },
                { n: '03', h: 'It joins the bloodline.', b: 'What you weave stays in your family’s thread — kept for the generations who come after.' },
              ].map(({ n, h, b }) => (
                <div
                  key={n}
                  style={{ display: 'flex', alignItems: 'baseline', gap: 20, borderBottom: '1px solid var(--rule)', padding: '15px 0' }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="hl-prose" style={{ fontSize: 17, fontWeight: 500, color: 'var(--bone)', display: 'block', lineHeight: 1.3 }}>
                      {h}
                    </span>
                    <span className="hl-prose" style={{ fontSize: 14, color: 'var(--bone-faint)', display: 'block', marginTop: 4, lineHeight: 1.6 }}>
                      {b}
                    </span>
                  </span>
                  <span style={{ ...metaText, color: 'var(--copper-label)', flex: '0 0 auto' }}>{n}</span>
                </div>
              ))}
            </section>

            <div style={{ marginTop: 64 }}>
              <WaxSeal />
            </div>
          </>
        )}
      </div>

      {/* Submit overlay */}
      {showSubmitModal && currentChallenge && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'var(--ink-translucent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24,
          }}
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            ref={submitRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="challenge-submit-title"
            className="cosmic-panel cosmic-panel--solid"
            style={{
              padding: 40,
              maxWidth: 520,
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ ...metaText, color: 'var(--bone-faint)', margin: '0 0 12px' }}>
              {currentChallenge.title}
            </p>
            <h3
              id="challenge-submit-title"
              className="hl-serif hl-italic"
              style={{ fontSize: 22, fontWeight: 400, color: 'var(--bone)', margin: '0 0 6px' }}
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
                htmlFor="challenge-submission"
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
                id="challenge-submission"
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Write here…"
                rows={5}
                style={inputStyle}
              />
            </div>

            {submitError && (
              <p style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em', margin: '0 0 12px' }}>
                {submitError}
              </p>
            )}

            <div style={{ display: 'flex', gap: 28, justifyContent: 'flex-end', alignItems: 'baseline' }}>
              <button type="button" onClick={() => setShowSubmitModal(false)} style={affordanceQuiet}>
                cancel
              </button>
              <button
                type="button"
                onClick={() => submitMutation.mutate({ challengeId: currentChallenge.id, content: submissionContent })}
                disabled={!submissionContent.trim() || submitMutation.isPending}
                style={{
                  ...affordance,
                  opacity: (!submissionContent.trim() || submitMutation.isPending) ? 0.4 : 1,
                  cursor: (!submissionContent.trim() || submitMutation.isPending) ? 'default' : 'pointer',
                }}
              >
                {submitMutation.isPending ? 'weaving…' : 'add to thread →'}
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
            background: 'var(--ink-translucent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24,
          }}
          onClick={() => setSelectedChallenge(null)}
        >
          <div
            ref={detailRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="challenge-detail-title"
            className="cosmic-panel cosmic-panel--solid"
            style={{
              padding: 40,
              maxWidth: 480,
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ ...metaText, color: 'var(--copper-label)', margin: '0 0 10px' }}>
              starts {new Date(selectedChallenge.start_date).toLocaleDateString()}
            </p>
            <h3
              id="challenge-detail-title"
              className="hl-serif"
              style={{ fontSize: 24, fontWeight: 400, color: 'var(--bone)', margin: '0 0 10px' }}
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
              <p style={{ ...metaText, fontSize: 10, letterSpacing: '0.22em', color: 'var(--bone-faint)', margin: '0 0 6px' }}>Prompt</p>
              <p
                className="hl-serif hl-italic"
                style={{ fontSize: 15, color: 'var(--bone)', margin: 0 }}
              >
                "{selectedChallenge.prompt}"
              </p>
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button type="button" onClick={() => setSelectedChallenge(null)} style={affordanceQuiet}>close</button>
            </div>
          </div>
        </div>
      )}
    </ClothShell>
  );
}
