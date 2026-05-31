import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ProgressHair } from '../components/ui/ProgressHair';
import api from '../services/api';

interface RoomData {
  room: {
    name: string;
    description: string;
    ownerName: string;
    allowPhotos: boolean;
    allowVoice: boolean;
    allowText: boolean;
  };
  contributions: Array<{
    id: string;
    contributor_name: string;
    contributor_relationship: string;
    content_type: string;
    title: string;
    content: string;
    created_at: string;
  }>;
}

/** Hairline shuttle used as a loading bar for full-page states. */
function LoadingState({ label }: { label?: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--loom-ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ProgressHair label={label ?? 'Loading…'} width={200} />
    </div>
  );
}

export function MemoryRoom() {
  const { token } = useParams<{ token: string }>();
  const [showContribute, setShowContribute] = useState(false);
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [contributorRelationship, setContributorRelationship] = useState('');
  const [contentType, setContentType] = useState<'TEXT' | 'PHOTO' | 'VOICE'>('TEXT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<RoomData>({
    queryKey: ['memory-room', token],
    queryFn: () => api.get(`/api/recipient-experience/room/${token}`).then((r: { data: RoomData }) => r.data),
    enabled: !!token,
  });

  const contributeMutation = useMutation({
    mutationFn: (contribution: {
      contributorName: string;
      contributorEmail?: string;
      contributorRelationship?: string;
      contentType: string;
      title?: string;
      content: string;
    }) => api.post(`/api/recipient-experience/room/${token}/contribute`, contribution),
    onSuccess: () => {
      setSubmitted(true);
      setShowContribute(false);
      setContributorName('');
      setContributorEmail('');
      setContributorRelationship('');
      setTitle('');
      setContent('');
      refetch();
    },
  });

  const handleSubmit = () => {
    if (!contributorName.trim() || !content.trim()) return;
    contributeMutation.mutate({
      contributorName: contributorName.trim(),
      contributorEmail: contributorEmail.trim() || undefined,
      contributorRelationship: contributorRelationship.trim() || undefined,
      contentType,
      title: title.trim() || undefined,
      content: content.trim(),
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: '1px solid var(--loom-rule)',
    borderRadius: 2,
    padding: '10px 14px',
    color: 'var(--loom-bone)',
    fontFamily: "'Source Serif 4', serif",
    fontSize: 15,
    lineHeight: 1.7,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
  };

  if (isLoading) return <LoadingState label="loading the room…" />;

  if (error || !data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--loom-ink)',
          color: 'var(--loom-bone)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, color: 'var(--loom-warm)', marginBottom: 16 }}>∞</p>
          <h1 className="loom-h2" style={{ fontSize: 28, fontWeight: 300, fontStyle: 'italic', margin: '0 0 12px' }}>
            Room not found.
          </h1>
          <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)' }}>
            This memory room may not be active or the link may be invalid.
          </p>
        </div>
      </div>
    );
  }

  const { room, contributions } = data;
  const contentTypeLabel = (t: string) => t === 'PHOTO' ? 'Photo' : t === 'VOICE' ? 'Voice' : 'Story';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--loom-ink)',
        color: 'var(--loom-bone)',
        fontFamily: "'Source Serif 4', serif",
      }}
    >
      {/* Horizon ambient glow */}
      <div className="loom-horizon" style={{ pointerEvents: 'none' }} />
      <div className="loom-grain" style={{ pointerEvents: 'none' }} />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 740,
          margin: '0 auto',
          padding: '72px 32px 96px',
        }}
      >
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 56 }}>
          <p className="loom-eyebrow" style={{ marginBottom: 16 }}>
            Memory Room · {room.ownerName}
          </p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(30px,4vw,48px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
          >
            {room.name || `${room.ownerName}'s Memory Room`}
          </h1>
          {room.description && (
            <p
              className="loom-body"
              style={{ fontSize: 16, color: 'var(--loom-bone-dim)', margin: '16px auto 0', maxWidth: 540 }}
            >
              {room.description}
            </p>
          )}
          <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)', marginTop: 12 }}>
            A space to share memories and stories about {room.ownerName}.
          </p>
        </header>

        {/* Success inline status */}
        {submitted && (
          <div
            role="status"
            style={{
              marginBottom: 32,
              padding: '14px 20px',
              border: '1px solid var(--loom-rule-warm)',
              textAlign: 'center',
            }}
          >
            <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-warm)', margin: 0, fontStyle: 'italic' }}>
              Thank you for sharing your memory. It means so much.
            </p>
          </div>
        )}

        {/* Contribute CTA */}
        <button
          type="button"
          onClick={() => setShowContribute(true)}
          style={{
            width: '100%',
            marginBottom: 48,
            padding: '24px 32px',
            border: '1px solid var(--loom-rule)',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--loom-rule-warm)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--loom-rule)')}
        >
          <p className="loom-serif" style={{ fontSize: 19, fontWeight: 300, color: 'var(--loom-bone)', margin: 0 }}>
            Share a Memory
          </p>
          <p className="loom-body" style={{ fontSize: 13, color: 'var(--loom-bone-faint)', marginTop: 6 }}>
            Add your own story, photo, or message.
          </p>
        </button>

        {/* Contributions list */}
        {contributions.length > 0 ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
              <span className="loom-eyebrow">Shared memories</span>
              <hr className="loom-hairline" style={{ flex: 1 }} />
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {contributions.map((c) => (
                <li key={c.id} style={{ padding: '24px 0', borderBottom: '1px solid var(--loom-rule)' }}>
                  <article style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 28, alignItems: 'baseline' }}>
                    <div>
                      <p
                        className="loom-mono"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: 'var(--loom-warm)',
                          margin: 0,
                        }}
                      >
                        {contentTypeLabel(c.content_type)}
                      </p>
                      <p
                        className="loom-mono"
                        style={{ fontSize: 10, color: 'var(--loom-bone-faint)', margin: '6px 0 0' }}
                      >
                        {new Date(c.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="loom-serif" style={{ fontSize: 16, fontWeight: 400, color: 'var(--loom-bone)', margin: '0 0 2px' }}>
                        {c.contributor_name}
                        {c.contributor_relationship && (
                          <span className="loom-body" style={{ fontSize: 13, color: 'var(--loom-bone-faint)', marginLeft: 8 }}>
                            ({c.contributor_relationship})
                          </span>
                        )}
                      </p>
                      {c.title && (
                        <p className="loom-serif" style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--loom-warm)', margin: '4px 0 6px' }}>
                          {c.title}
                        </p>
                      )}
                      <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                        {c.content}
                      </p>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-faint)', fontStyle: 'italic' }}>
              No memories shared yet. Be the first to contribute.
            </p>
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: 80, textAlign: 'center' }}>
          <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.18em' }}>
            Powered by{' '}
            <a
              href="https://heirloom.blue"
              style={{ color: 'var(--loom-warm)', textDecoration: 'none' }}
            >
              Heirloom
            </a>
          </p>
        </footer>
      </div>

      {/* Contribute overlay */}
      {showContribute && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(14,14,12,0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
          onClick={() => setShowContribute(false)}
        >
          <div
            style={{
              background: 'var(--loom-ink)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
              maxWidth: 540,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
              <h3 className="loom-serif" style={{ fontSize: 22, fontWeight: 300, margin: 0 }}>
                Share a Memory
              </h3>
              <button
                type="button"
                onClick={() => setShowContribute(false)}
                aria-label="Close"
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  color: 'var(--loom-bone-faint)',
                  fontSize: 20,
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: 18 }}>
              {/* Name */}
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
                  Your Name *
                </label>
                <input
                  id="mr-name"
                  type="text"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="Enter your name"
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
                  Your Email (optional)
                </label>
                <input
                  id="mr-email"
                  type="email"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={inputStyle}
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
                  Your Relationship (optional)
                </label>
                <input
                  id="mr-rel"
                  type="text"
                  value={contributorRelationship}
                  onChange={(e) => setContributorRelationship(e.target.value)}
                  placeholder="e.g., Friend, Colleague, Neighbour"
                  style={inputStyle}
                />
              </div>

              {/* Content type */}
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
                  Type of Memory
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {room.allowText && (
                    <button
                      type="button"
                      onClick={() => setContentType('TEXT')}
                      className={contentType === 'TEXT' ? 'loom-btn' : 'loom-btn-ghost'}
                      style={{ flex: 1, fontSize: 11, padding: '10px 0' }}
                    >
                      Story
                    </button>
                  )}
                  {room.allowPhotos && (
                    <button
                      type="button"
                      onClick={() => setContentType('PHOTO')}
                      className={contentType === 'PHOTO' ? 'loom-btn' : 'loom-btn-ghost'}
                      style={{ flex: 1, fontSize: 11, padding: '10px 0' }}
                    >
                      Photo
                    </button>
                  )}
                  {room.allowVoice && (
                    <button
                      type="button"
                      onClick={() => setContentType('VOICE')}
                      className={contentType === 'VOICE' ? 'loom-btn' : 'loom-btn-ghost'}
                      style={{ flex: 1, fontSize: 11, padding: '10px 0' }}
                    >
                      Voice
                    </button>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
                  Title (optional)
                </label>
                <input
                  id="mr-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your memory a title"
                  style={inputStyle}
                />
              </div>

              {/* Content */}
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
                  Your Memory *
                </label>
                <textarea
                  id="mr-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your story, memory, or message…"
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!contributorName.trim() || !content.trim() || contributeMutation.isPending}
                className="loom-btn"
                style={{ opacity: !contributorName.trim() || !content.trim() || contributeMutation.isPending ? 0.45 : 1 }}
              >
                {contributeMutation.isPending ? (
                  <span style={{ fontStyle: 'italic' }}>Sharing…</span>
                ) : (
                  'Share Memory'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemoryRoom;
