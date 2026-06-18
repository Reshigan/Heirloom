import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { RoomHeader } from '../loom/components/room';
import { CosmicHeader, EntryRow, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { dyeColor } from '../loom/dye';
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
  const [openId, setOpenId] = useState<string | null>(null);
  const contributeRef = useRef<HTMLDivElement>(null);

  // Contribute overlay = a modal: trap focus, close on Escape, focus first field.
  useEffect(() => {
    if (!showContribute) return;
    const el = contributeRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'input, textarea, button, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length) focusable[0].focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowContribute(false); return; }
      if (e.key !== 'Tab') return;
      const nodes = Array.from(focusable);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [showContribute]);

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
            style={{ fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}
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
            <WaxSeal size={28} />
            <h1
              className="hl-serif hl-tight"
              style={{ fontSize: 28, fontWeight: 500, fontStyle: 'italic', margin: '16px 0 12px', color: 'var(--bone)' }}
            >
              Room not found.
            </h1>
            <p
              className="hl-prose dark"
              style={{ fontSize: 15, color: 'var(--bone-dim)', margin: 0 }}
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
  const count = contributions.length;
  const ledgerEyebrow = `${count} ${count === 1 ? 'MEMORY' : 'MEMORIES'} SHARED`;

  const roomTitle = room.name || 'A room in the cloth';
  const metaDescription = (
    room.description || `A memory room by ${room.ownerName} — share your memories on Heirloom.`
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);

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
      <Helmet>
        <title>{`${roomTitle} · Heirloom`}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={roomTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content="https://heirloom.blue/woven/seal.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      {/* Content area — ClothShell already offsets topbar height */}
      <div style={{
        padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        maxWidth: 'var(--page-max-prose)',
        margin: '0 auto',
      }}>

        {/* Room header — the reading-room anchor (chrome preserved) */}
        <RoomHeader
          eyebrow={<>MEMORY ROOM <span style={{ color: 'var(--warm)' }}>·</span> {room.ownerName}</>}
          title={room.name || 'A room in the cloth.'}
          lede={room.description || undefined}
        />

        {/* Inline success status — mono, warm, never red */}
        {submitted && (
          <div
            role="status"
            style={{ marginTop: 32, borderLeft: '3px solid var(--warm)', paddingLeft: 18 }}
          >
            <p
              className="hl-mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                margin: 0,
              }}
            >
              Thank you — your memory is woven in.
            </p>
          </div>
        )}

        {/* The ledger — count + kind eyebrow over the entry rows */}
        <div style={{ marginTop: 64 }}>
          <CosmicHeader
            eyebrow={ledgerEyebrow}
            title="The memories."
          />

          {/* Quiet mono control bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <SectionLabel>{count === 0 ? 'NONE YET' : `${count} ${count === 1 ? 'ENTRY' : 'ENTRIES'}`}</SectionLabel>
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
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
              }}
            >
              + share a memory
            </button>
          </div>

          {count > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {contributions.map((c) => {
                const dye = dyeColor(c.id);
                const date = new Date(c.created_at);
                const year = date.getFullYear();
                const dateLine = date.toLocaleDateString(undefined, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                });
                const isOpen = openId === c.id;
                const author = `${c.contributor_name}${c.contributor_relationship ? `, ${c.contributor_relationship}` : ''}`;
                return (
                  <li key={c.id}>
                    <EntryRow
                      title={c.title || c.contributor_name}
                      sub={`${contentTypeLabel(c.content_type)} · ${dateLine}`}
                      year={year}
                      author={c.contributor_name}
                      dye={undefined}
                      italic={!c.title}
                      onClick={() => setOpenId(isOpen ? null : c.id)}
                    />
                    {/* Click-through read view — expands inline below the row */}
                    {isOpen && (
                      <div
                        style={{
                          padding: '20px 0 28px',
                          borderBottom: '1px solid var(--rule)',
                          maxWidth: '64ch',
                        }}
                      >
                        <p
                          className="hl-serif hl-prose dark"
                          style={{
                            fontSize: 'var(--type-body-lg)',
                            color: 'var(--bone-dim)',
                            lineHeight: 1.85,
                            margin: 0,
                            paddingLeft: 22,
                            borderLeft: `3px solid ${dye}`,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {c.content}
                        </p>
                        <p
                          className="hl-mono"
                          style={{
                            fontSize: 10,
                            color: 'var(--bone-faint)',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            margin: '18px 0 0',
                            paddingLeft: 22,
                          }}
                        >
                          {dateLine} <span style={{ color: 'var(--warm)' }}>·</span> {author}
                          {` · ${contentTypeLabel(c.content_type)}`}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p
                className="hl-serif"
                style={{
                  fontSize: 'var(--type-body-lg)',
                  color: 'var(--bone-dim)',
                  fontStyle: 'italic',
                  margin: '0 0 12px',
                }}
              >
                No memories shared yet.
              </p>
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
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                }}
              >
                be the first to contribute →
              </button>
            </div>
          )}

          {/* Wax seal foot + provenance */}
          <div style={{ marginTop: 80 }}>
            <WaxSeal size={28} />
            <p
              className="hl-mono"
              style={{
                fontSize: 10,
                color: 'var(--bone-faint)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textAlign: 'center',
                marginTop: 20,
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
          </div>
        </div>
      </div>

      {/* Contribute overlay */}
      {showContribute && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--ink-translucent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
          onClick={() => setShowContribute(false)}
        >
          <div
            ref={contributeRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contribute-title"
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
                id="contribute-title"
                className="hl-serif hl-tight"
                style={{ fontSize: 25, fontWeight: 500, margin: 0, color: 'var(--parchment-ink)' }}
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
                        borderBottom: contentType === 'TEXT' ? '2px solid var(--warm)' : '1px solid var(--parchment-rule)',
                        borderRadius: 0,
                        cursor: 'pointer',
                        background: 'transparent',
                        color: contentType === 'TEXT' ? 'var(--warm)' : 'var(--parchment-faint)',
                        transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      Story
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
                    color: 'var(--warm)',
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
