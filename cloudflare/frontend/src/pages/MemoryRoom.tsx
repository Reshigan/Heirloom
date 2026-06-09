import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
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

export function MemoryRoom() {
  const { token } = useParams<{ token: string }>();
  const [showContribute, setShowContribute] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    onError: (e: any) => setSubmitError(e?.response?.data?.error ?? 'could not share your memory'),
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
    border: '1px solid var(--parchment-rule)',
    borderRadius: 0,
    padding: '10px 14px',
    color: 'var(--parchment-ink)',
    fontFamily: 'var(--serif)',
    fontSize: 15,
    lineHeight: 1.7,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
  };

  if (isLoading) {
    return (
      <ClothShell topbarCenter="memory room">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <p
            className="hl-mono"
            style={{ fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--parchment-dim)' }}
          >
            loading the room…
          </p>
        </div>
      </ClothShell>
    );
  }

  if (error || !data) {
    return (
      <ClothShell topbarCenter="memory room">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, height: '100%' }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <p
              className="hl-serif"
              style={{ fontSize: 28, color: 'var(--warm)', marginBottom: 16 }}
            >
              ∞
            </p>
            <h1
              className="hl-serif hl-tight"
              style={{ fontSize: 28, fontWeight: 300, fontStyle: 'italic', margin: '0 0 12px', color: 'var(--parchment-ink)' }}
            >
              Room not found.
            </h1>
            <p
              className="hl-prose dark"
              style={{ fontSize: 15, color: 'var(--parchment-dim)', margin: 0 }}
            >
              This memory room may not be active or the link may be invalid.
            </p>
          </div>
        </div>
      </ClothShell>
    );
  }

  const { room, contributions } = data;
  const contentTypeLabel = (t: string) => t === 'PHOTO' ? 'Photo' : t === 'VOICE' ? 'Voice' : 'Story';

  return (
    <ClothShell
      topbarCenter="memory room"
      topbarRight={
        <button
          type="button"
          onClick={() => setShowContribute(true)}
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'var(--warm)',
          }}
        >
          share a memory →
        </button>
      }
    >
      {/* Content area — ClothShell already offsets topbar height */}
      <div>

        {/* H1 */}
        <h1
          className="hl-serif hl-tight"
          style={{
            fontSize: 48,
            fontWeight: 300,
            color: 'var(--parchment-ink)',
            marginTop: 80,
            marginLeft: 56,
            marginBottom: 0,
            lineHeight: 1.06,
          }}
        >
          A room in the cloth.
        </h1>

        {/* Room meta */}
        <div style={{ marginLeft: 56, marginTop: 24, marginRight: 56 }}>
          <p
            className="hl-eyebrow dark"
            style={{ marginBottom: 8 }}
          >
            {room.ownerName}
            {room.name ? ` · ${room.name}` : ''}
          </p>
          {room.description && (
            <p
              className="hl-prose dark"
              style={{ fontSize: 16, color: 'var(--parchment-dim)', margin: '12px 0 0', maxWidth: 540 }}
            >
              {room.description}
            </p>
          )}
        </div>

        {/* Inline success status */}
        {submitted && (
          <div
            role="status"
            style={{
              marginLeft: 56,
              marginRight: 56,
              marginTop: 32,
              padding: '14px 20px',
              border: '1px solid var(--warm)',
            }}
          >
            <p
              className="hl-prose dark"
              style={{ fontSize: 14, color: 'var(--warm)', margin: 0, fontStyle: 'italic' }}
            >
              Thank you for sharing your memory. It means so much.
            </p>
          </div>
        )}

        {/* Memory list */}
        <div style={{ marginLeft: 56, marginRight: 56, marginTop: 56, paddingBottom: 96 }}>
          {contributions.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {contributions.map((c) => (
                <li
                  key={c.id}
                  style={{
                    borderTop: '1px solid var(--parchment-rule)',
                    paddingTop: 28,
                    marginBottom: 28,
                  }}
                >
                  {/* Title */}
                  <p
                    className="hl-serif"
                    style={{
                      fontSize: 20,
                      fontWeight: 400,
                      color: 'var(--parchment-ink)',
                      margin: 0,
                    }}
                  >
                    {c.title || c.contributor_name}
                    {!c.title && c.contributor_relationship && (
                      <span
                        className="hl-mono"
                        style={{ fontSize: 10, color: 'var(--parchment-faint)', marginLeft: 12, letterSpacing: '0.18em', textTransform: 'uppercase' }}
                      >
                        {c.contributor_relationship}
                      </span>
                    )}
                  </p>
                  {/* If title shown separately, show contributor below */}
                  {c.title && (
                    <p
                      className="hl-mono"
                      style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--parchment-faint)', margin: '6px 0 0' }}
                    >
                      {c.contributor_name}
                      {c.contributor_relationship ? ` · ${c.contributor_relationship}` : ''}
                      {` · ${contentTypeLabel(c.content_type)}`}
                    </p>
                  )}
                  {/* Body */}
                  <p
                    className="hl-prose dark"
                    style={{
                      fontSize: 17,
                      color: 'var(--parchment-dim)',
                      marginTop: 12,
                      marginBottom: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {c.content}
                  </p>
                  {/* Date */}
                  <p
                    className="hl-mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--parchment-faint)',
                      marginTop: 8,
                      letterSpacing: '0.18em',
                    }}
                  >
                    {new Date(c.created_at).toLocaleDateString(undefined, {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p
              className="hl-prose dark"
              style={{ fontSize: 15, color: 'var(--parchment-dim)', fontStyle: 'italic' }}
            >
              No memories shared yet. Be the first to contribute.
            </p>
          )}

          {/* Footer */}
          <footer style={{ marginTop: 80 }}>
            <hr className="hl-rule parchment" />
            <p
              className="hl-mono"
              style={{
                fontSize: 10,
                color: 'var(--parchment-faint)',
                letterSpacing: '0.18em',
                marginTop: 18,
              }}
            >
              Powered by{' '}
              <a
                href="https://heirloom.blue"
                style={{ color: 'var(--warm)', textDecoration: 'none' }}
              >
                Heirloom
              </a>
            </p>
          </footer>
        </div>
      </div>

      {/* Contribute overlay */}
      {showContribute && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(250,246,238,0.72)',
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
              background: 'var(--parchment)',
              border: '1px solid var(--parchment-rule)',
              padding: 40,
              maxWidth: 540,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
              <h3
                className="hl-serif hl-tight"
                style={{ fontSize: 22, fontWeight: 300, margin: 0, color: 'var(--parchment-ink)' }}
              >
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
                  color: 'var(--parchment-faint)',
                  fontSize: 20,
                  lineHeight: 1,
                  padding: 4,
                  fontFamily: 'var(--mono)',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: 18 }}>
              {/* Name */}
              <div>
                <label
                  htmlFor="mr-name"
                  className="hl-eyebrow dark"
                  style={{ display: 'block', marginBottom: 10 }}
                >
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
                <label
                  htmlFor="mr-email"
                  className="hl-eyebrow dark"
                  style={{ display: 'block', marginBottom: 10 }}
                >
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
                <label
                  htmlFor="mr-rel"
                  className="hl-eyebrow dark"
                  style={{ display: 'block', marginBottom: 10 }}
                >
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
                <label
                  className="hl-eyebrow dark"
                  style={{ display: 'block', marginBottom: 10 }}
                >
                  Type of Memory
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {room.allowText && (
                    <button
                      type="button"
                      onClick={() => setContentType('TEXT')}
                      style={{
                        flex: 1,
                        fontSize: 11,
                        padding: '10px 0',
                        fontFamily: 'var(--mono)',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        border: '1px solid var(--parchment-rule)',
                        borderRadius: 0,
                        cursor: 'pointer',
                        background: contentType === 'TEXT' ? 'var(--warm)' : 'transparent',
                        color: contentType === 'TEXT' ? 'var(--bone)' : 'var(--parchment-ink)',
                        transition: 'background 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      Story
                    </button>
                  )}
                  {room.allowPhotos && (
                    <button
                      type="button"
                      disabled
                      title="Coming soon"
                      style={{
                        flex: 1,
                        fontSize: 11,
                        padding: '10px 0',
                        fontFamily: 'var(--mono)',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        border: '1px solid var(--parchment-rule)',
                        borderRadius: 0,
                        cursor: 'not-allowed',
                        background: 'transparent',
                        color: 'var(--parchment-ink)',
                        opacity: 0.35,
                        transition: 'background 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      Photo
                    </button>
                  )}
                  {room.allowVoice && (
                    <button
                      type="button"
                      disabled
                      title="Coming soon"
                      style={{
                        flex: 1,
                        fontSize: 11,
                        padding: '10px 0',
                        fontFamily: 'var(--mono)',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        border: '1px solid var(--parchment-rule)',
                        borderRadius: 0,
                        cursor: 'not-allowed',
                        background: 'transparent',
                        color: 'var(--parchment-ink)',
                        opacity: 0.35,
                        transition: 'background 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      Voice
                    </button>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="mr-title"
                  className="hl-eyebrow dark"
                  style={{ display: 'block', marginBottom: 10 }}
                >
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
                <label
                  htmlFor="mr-content"
                  className="hl-eyebrow dark"
                  style={{ display: 'block', marginBottom: 10 }}
                >
                  Your Memory *
                </label>
                <textarea
                  id="mr-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your story, memory, or message…"
                  rows={5}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              {submitError && (
                <p
                  role="alert"
                  style={{
                    margin: 0,
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    color: 'var(--danger)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {submitError}
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!contributorName.trim() || !content.trim() || contributeMutation.isPending}
                className="hl-btn"
                style={{
                  opacity: !contributorName.trim() || !content.trim() || contributeMutation.isPending ? 0.45 : 1,
                }}
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
    </ClothShell>
  );
}

export default MemoryRoom;
