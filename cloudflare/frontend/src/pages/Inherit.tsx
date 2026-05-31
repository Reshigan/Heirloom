import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

// @ts-ignore - Vite env types
const API_URL = import.meta.env?.VITE_API_URL || 'https://api.heirloom.blue';

type ReactionType = 'THANK_YOU' | 'REMEMBER_THIS' | 'LOVE_THIS' | 'CUSTOM';

interface ReactionOption {
  type: ReactionType;
  label: string;
  description: string;
}

interface Letter {
  id: string;
  title: string;
  salutation: string;
  body: string;
  signature: string;
  emotion?: string;
  sealedAt: string;
  createdAt: string;
}

interface Memory {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  emotion?: string;
  createdAt: string;
}

interface VoiceRecording {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  duration: number;
  emotion?: string;
  transcript?: string;
  createdAt: string;
}

interface InheritContent {
  letters: Letter[];
  memories: Memory[];
  voiceRecordings: VoiceRecording[];
}

type TabType = 'letters' | 'memories' | 'voice' | 'search';

interface SearchResult {
  type: 'letter' | 'memory' | 'voice';
  id: string;
  title: string;
  snippet: string;
  date: string;
  emotion?: string;
  fileUrl?: string;
  duration?: number;
}

interface SearchResponse {
  answer: string;
  results: SearchResult[];
  query: string;
  totalItems: number;
}

/* ── Hairline loading bar ──────────────────────────────────────── */
function ShuttleBar() {
  return (
    <div
      style={{
        width: 180,
        height: 1,
        background: 'var(--loom-rule)',
        position: 'relative',
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '40%',
          background: 'var(--loom-warm)',
          animation: 'loom-shuttle 1.4s var(--loom-ease) infinite',
        }}
      />
    </div>
  );
}

/* ── Standalone page shell (matches Login.tsx pattern) ─────────── */
function StandalonePage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--loom-ink)',
        color: 'var(--loom-bone)',
        display: 'grid',
        gridTemplateRows: '68px 1fr',
      }}
    >
      <header
        style={{
          borderBottom: '1px solid var(--loom-rule)',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Link
          to="/"
          className="loom-mark"
          style={{ textDecoration: 'none' }}
        >
          <span className="infmark">∞</span>heirloom
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function Inherit() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('');
  const [content, setContent] = useState<InheritContent | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('letters');
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Reaction state (Family Echo)
  const [showReactionModal, setShowReactionModal] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<ReactionType | null>(null);
  const [reactionMessage, setReactionMessage] = useState('');
  const [sendingReaction, setSendingReaction] = useState(false);
  const [reactionSent, setReactionSent] = useState(false);

  const reactionOptions: ReactionOption[] = [
    { type: 'THANK_YOU', label: 'Thank you', description: 'Let them know this meant something to you' },
    { type: 'LOVE_THIS', label: 'I love this', description: 'Share how much this touched your heart' },
    { type: 'REMEMBER_THIS', label: 'I remember this too', description: 'You have your own memory of this moment' },
    { type: 'CUSTOM', label: 'Write a note', description: 'Share your own thoughts and feelings' },
  ];

  useEffect(() => {
    validateToken();
  }, [token]);

  useEffect(() => {
    if (sessionToken) {
      fetchContent();
    }
  }, [sessionToken]);

  const validateToken = async () => {
    if (!token) {
      setError('No access token provided');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/inherit/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid or expired access link');
        setLoading(false);
        return;
      }

      setSessionToken(data.sessionToken);
      setOwnerName(data.owner.name);
      setRecipientName(data.recipient.name);
      setRelationship(data.recipient.relationship);
    } catch (err) {
      setError('Failed to validate access link');
      setLoading(false);
    }
  };

  const fetchContent = async () => {
    if (!sessionToken) return;

    try {
      const response = await fetch(`${API_URL}/api/inherit/content/all`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load content');
        setLoading(false);
        return;
      }

      setContent(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load content');
      setLoading(false);
    }
  };

  const playVoice = (recording: VoiceRecording) => {
    if (playingVoiceId === recording.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoiceId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(recording.fileUrl);
      audio.onended = () => setPlayingVoiceId(null);
      audio.onerror = () => setPlayingVoiceId(null);
      audio.play().catch(() => setPlayingVoiceId(null));
      audioRef.current = audio;
      setPlayingVoiceId(recording.id);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 3 || !sessionToken) return;

    setSearchLoading(true);
    setSearchError(null);
    setActiveTab('search');

    try {
      const response = await fetch(`${API_URL}/api/inherit/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSearchError(data.error || 'Search failed');
        setSearchLoading(false);
        return;
      }

      setSearchResponse(data);
      setSearchLoading(false);
    } catch (err) {
      setSearchError('Failed to search memories');
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResponse(null);
    setSearchError(null);
    setActiveTab('letters');
  };

  const sendReaction = async () => {
    if (!sessionToken || (!selectedReaction && !reactionMessage.trim())) return;

    setSendingReaction(true);

    try {
      const response = await fetch(`${API_URL}/api/inherit/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          reactionType: selectedReaction || 'CUSTOM',
          message: reactionMessage.trim() || null,
          contentType: 'GENERAL',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setReactionSent(true);
      setTimeout(() => {
        setShowReactionModal(false);
        setSelectedReaction(null);
        setReactionMessage('');
        setReactionSent(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to send reaction:', err);
    } finally {
      setSendingReaction(false);
    }
  };

  if (loading) {
    return (
      <StandalonePage>
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            padding: '40px 24px',
          }}
        >
          <div>
            <ShuttleBar />
            <p
              className="loom-mono"
              style={{
                marginTop: 20,
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--loom-bone-faint)',
              }}
            >
              unlocking…
            </p>
          </div>
        </div>
      </StandalonePage>
    );
  }

  if (error) {
    return (
      <StandalonePage>
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            minHeight: '60vh',
            padding: '40px 24px',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <p className="loom-eyebrow" style={{ marginBottom: 16 }}>access denied</p>
            <h1
              className="loom-h2"
              style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 20px' }}
            >
              {error}
            </h1>
            <p
              className="loom-body"
              style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: '0 0 32px', lineHeight: 1.7 }}
            >
              This link may have expired or is no longer valid. Please contact the person who
              shared this with you.
            </p>
            <Link to="/" className="loom-btn-ghost" style={{ textDecoration: 'none', display: 'inline-block' }}>
              return home
            </Link>
          </div>
        </div>
      </StandalonePage>
    );
  }

  /* ── Tab helpers ──────────────────────────────────────────── */
  const tabs: Array<{ id: TabType; label: string; count: number }> = [
    { id: 'letters', label: 'letters', count: content?.letters.length ?? 0 },
    { id: 'memories', label: 'memories', count: content?.memories.length ?? 0 },
    { id: 'voice', label: 'voice', count: content?.voiceRecordings.length ?? 0 },
    ...(searchResponse ? [{ id: 'search' as TabType, label: 'search results', count: searchResponse.results.length }] : []),
  ];

  const tabStyle = (id: TabType): React.CSSProperties => ({
    background: 'transparent',
    border: 0,
    padding: '8px 0',
    marginRight: 28,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color: activeTab === id ? 'var(--loom-bone)' : 'var(--loom-bone-faint)',
    borderBottom: activeTab === id ? '1px solid var(--loom-warm)' : '1px solid transparent',
    transition: 'color 180ms var(--loom-ease), border-color 180ms var(--loom-ease)',
  });

  return (
    <StandalonePage>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 28px 120px' }}>

        {/* Page header */}
        <header style={{ marginBottom: 48, textAlign: 'center' }}>
          <span
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: 24,
              color: 'var(--loom-warm)',
              display: 'block',
              marginBottom: 16,
            }}
          >
            ∞
          </span>
          <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
            a thread left for you
          </p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 14px' }}
          >
            From{' '}
            <span style={{ color: 'var(--loom-warm)' }}>{ownerName}</span>.
          </h1>
          <p
            className="loom-body"
            style={{ fontSize: 15, color: 'var(--loom-bone-dim)', lineHeight: 1.7 }}
          >
            Shared with{' '}
            <span
              className="loom-serif"
              style={{ fontStyle: 'italic', color: 'var(--loom-bone)' }}
            >
              {recipientName}
            </span>
            {relationship ? (
              <span
                className="loom-mono"
                style={{ fontSize: 11, color: 'var(--loom-bone-faint)', marginLeft: 8, letterSpacing: '0.04em' }}
              >
                {relationship}
              </span>
            ) : null}
          </p>
        </header>

        {/* Listener search */}
        <form onSubmit={handleSearch} style={{ marginBottom: 36 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Ask about ${ownerName}'s memories…`}
              style={{ paddingRight: 88 }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: 56,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  color: 'var(--loom-bone-faint)',
                  fontSize: 16,
                  lineHeight: 1,
                  padding: '4px 6px',
                }}
              >
                ×
              </button>
            ) : null}
            <button
              type="submit"
              disabled={searchLoading || searchQuery.trim().length < 3}
              style={{
                position: 'absolute',
                right: 1,
                top: 1,
                bottom: 1,
                padding: '0 14px',
                background: 'var(--loom-warm)',
                border: 0,
                cursor: searchLoading || searchQuery.trim().length < 3 ? 'not-allowed' : 'pointer',
                opacity: searchLoading || searchQuery.trim().length < 3 ? 0.4 : 1,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--loom-ink)',
                transition: 'opacity 180ms var(--loom-ease)',
              }}
            >
              ask
            </button>
          </div>
        </form>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            borderBottom: '1px solid var(--loom-rule)',
            marginBottom: 36,
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={tabStyle(t.id)}
            >
              {t.label}
              {t.count > 0 ? (
                <span
                  className="loom-mono"
                  style={{ marginLeft: 6, fontSize: 9, color: 'var(--loom-bone-faint)' }}
                >
                  {t.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── Letters ─────────────────────────────────────────── */}
        {activeTab === 'letters' && (
          selectedLetter ? (
            <div>
              <button
                type="button"
                onClick={() => setSelectedLetter(null)}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--loom-bone-faint)',
                  marginBottom: 32,
                }}
              >
                ← back to letters
              </button>
              <article>
                <header style={{ marginBottom: 28 }}>
                  <h2
                    className="loom-h2"
                    style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 8px', color: 'var(--loom-warm)' }}
                  >
                    {selectedLetter.title}
                  </h2>
                  <p
                    className="loom-mono"
                    style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}
                  >
                    {formatDate(selectedLetter.createdAt)}
                  </p>
                </header>
                <hr className="loom-hairline" style={{ marginBottom: 28 }} />
                {selectedLetter.salutation ? (
                  <p
                    className="loom-body"
                    style={{ fontStyle: 'italic', color: 'var(--loom-bone-dim)', fontSize: 16, marginBottom: 20 }}
                  >
                    {selectedLetter.salutation}
                  </p>
                ) : null}
                <div
                  className="loom-body"
                  style={{ whiteSpace: 'pre-wrap', fontSize: 16, lineHeight: 1.85, color: 'var(--loom-bone)' }}
                >
                  {selectedLetter.body}
                </div>
                {selectedLetter.signature ? (
                  <p
                    className="loom-body"
                    style={{ fontStyle: 'italic', color: 'var(--loom-bone-dim)', fontSize: 16, marginTop: 28 }}
                  >
                    {selectedLetter.signature}
                  </p>
                ) : null}
              </article>
            </div>
          ) : content?.letters.length === 0 ? (
            <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
              No letters have been shared yet.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {content?.letters.map((letter) => (
                <li key={letter.id} style={{ borderBottom: '1px solid var(--loom-rule)' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedLetter(letter)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 0,
                      padding: '20px 0',
                      cursor: 'pointer',
                    }}
                  >
                    <p
                      className="loom-serif"
                      style={{ fontSize: 18, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 6px' }}
                    >
                      {letter.title || 'Untitled letter'}
                    </p>
                    <p
                      className="loom-mono"
                      style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em', margin: '0 0 8px' }}
                    >
                      {formatDate(letter.createdAt)}
                    </p>
                    <p
                      className="loom-body"
                      style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: 0, lineHeight: 1.6 }}
                    >
                      {letter.body.substring(0, 150)}…
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )
        )}

        {/* ── Memories ────────────────────────────────────────── */}
        {activeTab === 'memories' && (
          content?.memories.length === 0 ? (
            <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
              No memories have been shared yet.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 2,
              }}
            >
              {content?.memories.map((memory) => (
                <div
                  key={memory.id}
                  style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}
                >
                  <img
                    src={memory.fileUrl}
                    alt={memory.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(14,14,12,0.72)',
                      opacity: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: 14,
                      transition: 'opacity 180ms var(--loom-ease)',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0'; }}
                  >
                    <p
                      className="loom-serif"
                      style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--loom-bone)', margin: 0 }}
                    >
                      {memory.title}
                    </p>
                    {memory.description ? (
                      <p
                        className="loom-body"
                        style={{ fontSize: 12, color: 'var(--loom-bone-dim)', margin: '4px 0 0', lineHeight: 1.4 }}
                      >
                        {memory.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Voice ───────────────────────────────────────────── */}
        {activeTab === 'voice' && (
          content?.voiceRecordings.length === 0 ? (
            <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
              No voice recordings have been shared yet.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {content?.voiceRecordings.map((recording) => (
                <li
                  key={recording.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '56px 1fr',
                    gap: 20,
                    alignItems: 'center',
                    padding: '18px 0',
                    borderBottom: '1px solid var(--loom-rule)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => playVoice(recording)}
                    aria-label={playingVoiceId === recording.id ? 'Pause' : 'Play'}
                    style={{
                      width: 44,
                      height: 44,
                      background: playingVoiceId === recording.id ? 'var(--loom-warm)' : 'transparent',
                      border: '1px solid var(--loom-rule-warm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      color: playingVoiceId === recording.id ? 'var(--loom-ink)' : 'var(--loom-warm)',
                      transition: 'background 180ms var(--loom-ease), color 180ms var(--loom-ease)',
                      flexShrink: 0,
                    }}
                  >
                    {playingVoiceId === recording.id ? 'pause' : 'play'}
                  </button>
                  <div>
                    <p
                      className="loom-serif"
                      style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 4px' }}
                    >
                      {recording.title}
                    </p>
                    <p
                      className="loom-mono"
                      style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em', margin: 0 }}
                    >
                      {formatDuration(recording.duration)} · {formatDate(recording.createdAt)}
                    </p>
                    {recording.transcript ? (
                      <p
                        className="loom-body"
                        style={{ fontSize: 13, color: 'var(--loom-bone-dim)', margin: '6px 0 0', lineHeight: 1.6 }}
                      >
                        {recording.transcript}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {/* ── Search results ──────────────────────────────────── */}
        {activeTab === 'search' && (
          searchLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <ShuttleBar />
              <p
                className="loom-mono"
                style={{ marginTop: 16, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}
              >
                searching…
              </p>
            </div>
          ) : searchError ? (
            <div style={{ padding: '20px 0' }}>
              <p
                className="loom-body"
                style={{ fontStyle: 'italic', color: '#c25a5a', marginBottom: 16 }}
              >
                {searchError}
              </p>
              <button type="button" onClick={clearSearch} className="loom-btn-ghost">
                try again
              </button>
            </div>
          ) : searchResponse ? (
            <div>
              {/* AI answer */}
              <div
                style={{
                  padding: '20px 24px',
                  border: '1px solid var(--loom-rule-warm)',
                  background: 'rgba(176,122,74,0.04)',
                  marginBottom: 32,
                }}
              >
                <p
                  className="loom-mono"
                  style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--loom-warm)', marginBottom: 10 }}
                >
                  the listener
                </p>
                <p className="loom-body" style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--loom-bone)' }}>
                  {searchResponse.answer}
                </p>
              </div>

              {searchResponse.results.length > 0 ? (
                <>
                  <p className="loom-eyebrow" style={{ marginBottom: 16 }}>related entries</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {searchResponse.results.map((result) => (
                      <li
                        key={`${result.type}-${result.id}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '60px 1fr',
                          gap: 16,
                          padding: '16px 0',
                          borderBottom: '1px solid var(--loom-rule)',
                          alignItems: 'baseline',
                        }}
                      >
                        <span
                          className="loom-mono"
                          style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}
                        >
                          {result.type}
                        </span>
                        <div>
                          <p
                            className="loom-serif"
                            style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 4px' }}
                          >
                            {result.title}
                          </p>
                          <p
                            className="loom-mono"
                            style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em', margin: '0 0 6px' }}
                          >
                            {formatDate(result.date)}
                          </p>
                          <p
                            className="loom-body"
                            style={{ fontSize: 13, color: 'var(--loom-bone-dim)', margin: 0, lineHeight: 1.6 }}
                          >
                            {result.snippet}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              <p
                className="loom-mono"
                style={{ fontSize: 9, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em', marginTop: 28, textAlign: 'center' }}
              >
                searched {searchResponse.totalItems} entries · "{searchResponse.query}"
              </p>
            </div>
          ) : (
            <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
              Enter a question above to search through the thread.
            </p>
          )
        )}
      </div>

      {/* Floating "Send a note" */}
      <div
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 50,
        }}
      >
        <button
          type="button"
          onClick={() => setShowReactionModal(true)}
          className="loom-btn"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
        >
          send a note to {ownerName.split(' ')[0]}
        </button>
      </div>

      {/* Reaction modal */}
      {showReactionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'rgba(14,14,12,0.80)',
          }}
          onClick={() => !sendingReaction && setShowReactionModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--loom-ink-card)',
              border: '1px solid var(--loom-rule)',
              padding: '32px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {reactionSent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <span
                  style={{
                    fontFamily: "'Source Serif 4', serif",
                    fontSize: 28,
                    color: 'var(--loom-warm)',
                    display: 'block',
                    marginBottom: 16,
                  }}
                >
                  ∞
                </span>
                <h3
                  className="loom-serif"
                  style={{ fontSize: 20, fontWeight: 300, fontStyle: 'italic', margin: '0 0 8px' }}
                >
                  Note sent.
                </h3>
                <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)' }}>
                  {ownerName} will receive your note.
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginBottom: 24,
                  }}
                >
                  <h3
                    className="loom-serif"
                    style={{ fontSize: 20, fontWeight: 300, fontStyle: 'italic', margin: 0 }}
                  >
                    Send a note to {ownerName.split(' ')[0]}.
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowReactionModal(false)}
                    aria-label="Close"
                    style={{
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      color: 'var(--loom-bone-faint)',
                      fontSize: 18,
                      lineHeight: 1,
                      padding: '4px 6px',
                    }}
                  >
                    ×
                  </button>
                </div>
                <p
                  className="loom-body"
                  style={{ fontSize: 14, color: 'var(--loom-bone-dim)', marginBottom: 24, lineHeight: 1.7 }}
                >
                  Let {ownerName.split(' ')[0]} know these memories mean something to you.
                </p>

                <div style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
                  {reactionOptions.map((option) => (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() =>
                        setSelectedReaction(selectedReaction === option.type ? null : option.type)
                      }
                      style={{
                        textAlign: 'left',
                        background: 'transparent',
                        border: `1px solid ${selectedReaction === option.type ? 'var(--loom-rule-warm)' : 'var(--loom-rule)'}`,
                        padding: '14px 16px',
                        cursor: 'pointer',
                        transition: 'border-color 180ms var(--loom-ease)',
                      }}
                    >
                      <p
                        className="loom-serif"
                        style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 2px' }}
                      >
                        {option.label}
                      </p>
                      <p
                        className="loom-body"
                        style={{ fontSize: 12, color: 'var(--loom-bone-faint)', margin: 0, lineHeight: 1.5 }}
                      >
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>

                {(selectedReaction === 'CUSTOM' || selectedReaction === 'REMEMBER_THIS') ? (
                  <div style={{ marginBottom: 24 }}>
                    <textarea
                      value={reactionMessage}
                      onChange={(e) => setReactionMessage(e.target.value)}
                      placeholder={
                        selectedReaction === 'REMEMBER_THIS'
                          ? 'Share your own memory of this moment…'
                          : 'Write your message…'
                      }
                      rows={4}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: '1px solid var(--loom-rule)',
                        padding: '12px 14px',
                        color: 'var(--loom-bone)',
                        fontFamily: "'Source Serif 4', serif",
                        fontSize: 15,
                        lineHeight: 1.7,
                        resize: 'vertical',
                        outline: 0,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={sendReaction}
                  disabled={sendingReaction || (!selectedReaction && !reactionMessage.trim())}
                  className="loom-btn"
                  style={{
                    width: '100%',
                    opacity: sendingReaction || (!selectedReaction && !reactionMessage.trim()) ? 0.45 : 1,
                  }}
                >
                  {sendingReaction ? 'sending…' : 'send note'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '28px 0 48px',
          borderTop: '1px solid var(--loom-rule)',
        }}
      >
        <p
          className="loom-mono"
          style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}
        >
          ∞ &nbsp; sealed by heirloom · shared with care
        </p>
      </footer>
    </StandalonePage>
  );
}
