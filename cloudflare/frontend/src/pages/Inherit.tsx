import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HLogo } from '../loom/components/HLogo';

// @ts-ignore - Vite env types
const API_URL = import.meta.env?.VITE_API_URL || 'https://api.heirloom.blue/api';

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

/* ── Hairline loading bar ──────────────────────────────────────────────────── */
function ShuttleBar() {
  return (
    <div
      style={{
        width: 180,
        height: 1,
        background: 'var(--parchment-rule)',
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
          background: 'var(--warm)',
          animation: 'loom-shuttle 1.4s cubic-bezier(0.16,1,0.3,1) infinite',
        }}
      />
    </div>
  );
}

/* ── Parchment bottom edge ─────────────────────────────────────────────────── */
function ParchmentEdge() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 6,
        opacity: 0.55,
        background: 'var(--parchment)',
        pointerEvents: 'none',
      }}
    />
  );
}

export function Inherit() {
  const { token } = useParams<{ token: string }>();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
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
  const [reactionError, setReactionError] = useState<string | null>(null);

  const reactionOptions: ReactionOption[] = [
    { type: 'THANK_YOU', label: 'Thank you', description: 'Let them know this meant something to you' },
    { type: 'LOVE_THIS', label: 'I love this', description: 'Share how much this touched your heart' },
    { type: 'REMEMBER_THIS', label: 'I remember this too', description: 'You have your own memory of this moment' },
    { type: 'CUSTOM', label: 'Write a note', description: 'Share your own thoughts and feelings' },
  ];

  /* ── Thread name derived from ownerName ─────────────────────────── */
  const threadName = ownerName
    ? ownerName.split(' ').slice(-1)[0].toLowerCase()
    : 'family';

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    validateToken(controller.signal);
    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    if (sessionToken) {
      const controller = new AbortController();
      fetchContent(controller.signal);
      return () => controller.abort();
    }
  }, [sessionToken]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const validateToken = async (signal?: AbortSignal) => {
    if (!token) {
      setError('No access token provided');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/inherit/${token}`, { signal });
      if (signal?.aborted) return;
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
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError('Failed to validate access link');
      setLoading(false);
    }
  };

  const fetchContent = async (signal?: AbortSignal) => {
    if (!sessionToken) return;

    try {
      const response = await fetch(`${API_URL}/inherit/content/all`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
        signal,
      });
      if (signal?.aborted) return;
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load content');
        setLoading(false);
        return;
      }

      setContent(data);
      setLoading(false);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
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
      const response = await fetch(`${API_URL}/inherit/search`, {
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
      const response = await fetch(`${API_URL}/inherit/reply`, {
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
      setReactionError('could not send note — please try again');
    } finally {
      setSendingReaction(false);
    }
  };

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div
        className="hl-screen parchment"
        style={{ position: 'absolute', inset: 0, background: 'var(--parchment)', overflow: 'auto' }}
      >
        <p
          className="hl-serif hl-italic"
          style={{
            color: 'var(--parchment-dim)',
            textAlign: 'center',
            marginTop: 80,
            fontSize: 16,
          }}
        >
          <ShuttleBar />
          <span
            style={{
              display: 'block',
              marginTop: 20,
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--parchment-faint)',
              fontStyle: 'normal',
            }}
          >
            unlocking…
          </span>
        </p>
        <ParchmentEdge />
      </div>
    );
  }

  /* ── Error ────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div
        className="hl-screen parchment"
        style={{ position: 'absolute', inset: 0, background: 'var(--parchment)', overflow: 'auto' }}
      >
        {/* Topbar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 56px',
            fontFamily: 'var(--mono)',
            fontSize: 10.5,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--parchment-faint)',
          }}
        >
          <span>inherit</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <HLogo size={14} mono color="var(--parchment-faint)" />
            <span>the {threadName} thread</span>
          </span>
          <Link
            to="/signup"
            style={{
              color: 'var(--warm)',
              textDecoration: 'none',
              fontFamily: 'var(--mono)',
              fontSize: 10.5,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            create an account →
          </Link>
        </div>
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            minHeight: '60vh',
            padding: '40px 56px',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <p
              className="hl-eyebrow dark"
              style={{ marginBottom: 16 }}
            >
              access denied
            </p>
            <h1
              className="hl-serif hl-tight"
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 300,
                color: 'var(--parchment-ink)',
                margin: '0 0 20px',
              }}
            >
              {error}
            </h1>
            <p
              className="hl-prose dark"
              style={{ fontSize: 15, margin: '0 0 32px' }}
            >
              This link may have expired or is no longer valid. Please contact the person who
              shared this with you.
            </p>
            <Link
              to="/"
              className="hl-btn ghost"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              return home
            </Link>
          </div>
        </div>
        <ParchmentEdge />
      </div>
    );
  }

  /* ── Tab helpers ──────────────────────────────────────────────────── */
  const tabs: Array<{ id: TabType; label: string; count: number }> = [
    { id: 'letters', label: 'letters', count: content?.letters.length ?? 0 },
    { id: 'memories', label: 'memories', count: content?.memories.length ?? 0 },
    { id: 'voice', label: 'voice', count: content?.voiceRecordings.length ?? 0 },
    ...(searchResponse ? [{ id: 'search' as TabType, label: 'search results', count: searchResponse.results.length }] : []),
  ];

  const tabBtnStyle = (id: TabType): React.CSSProperties => ({
    background: 'transparent',
    border: 0,
    borderBottom: activeTab === id ? '1px solid var(--warm)' : '1px solid transparent',
    padding: '8px 0',
    marginRight: 28,
    cursor: 'pointer',
    fontFamily: 'var(--mono)',
    fontSize: 10,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color: activeTab === id ? 'var(--parchment-ink)' : 'var(--parchment-faint)',
    transition: 'color 180ms cubic-bezier(0.16,1,0.3,1), border-color 180ms cubic-bezier(0.16,1,0.3,1)',
  });

  /* ── Brief / contents for left column ──────────────────────────── */
  const contentCounts = [
    content?.letters.length ? `${content.letters.length} letter${content.letters.length !== 1 ? 's' : ''}` : null,
    content?.memories.length ? `${content.memories.length} memor${content.memories.length !== 1 ? 'ies' : 'y'}` : null,
    content?.voiceRecordings.length ? `${content.voiceRecordings.length} voice recording${content.voiceRecordings.length !== 1 ? 's' : ''}` : null,
  ].filter(Boolean);

  /* ── First letter preview for right column ──────────────────────── */
  const firstLetter = content?.letters[0] ?? null;

  return (
    <div
      className="hl-screen parchment"
      style={{ position: 'absolute', inset: 0, background: 'var(--parchment)', overflow: 'auto' }}
    >
      {/* ── Parchment topbar ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '16px 20px' : '20px 56px',
          fontFamily: 'var(--mono)',
          fontSize: 10.5,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--parchment-faint)',
        }}
      >
        <span>inherit · token {token ? `${token.slice(0, 8)}…` : '—'}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <HLogo size={14} mono color="var(--parchment-faint)" />
          <span>the {threadName} thread</span>
        </span>
        <Link
          to="/signup"
          style={{
            color: 'var(--warm)',
            textDecoration: 'none',
            fontFamily: 'var(--mono)',
            fontSize: 10.5,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          create an account →
        </Link>
      </div>

      {/* ── Hero area ────────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: 84, left: isMobile ? 20 : 56, right: isMobile ? 20 : 56 }}>
        <p
          className="hl-eyebrow dark"
          style={{ color: 'var(--parchment-faint)', marginBottom: 18 }}
        >
          Someone in your line left this for you
        </p>
        <h1
          className="hl-serif hl-tight"
          style={{
            fontSize: 56,
            fontWeight: 300,
            color: 'var(--parchment-ink)',
            margin: 0,
            lineHeight: 1.06,
          }}
        >
          You have inherited a thread.
        </h1>
        <p
          className="hl-serif hl-italic"
          style={{
            fontSize: 36,
            color: 'var(--parchment-dim)',
            margin: '12px 0 0',
            lineHeight: 1.2,
          }}
        >
          Read it on the day you're ready.
        </p>
      </div>

      {/* ── Two-column main layout ───────────────────────────────────── */}
      <div
        style={{
          position: isMobile ? 'relative' : 'absolute',
          top: isMobile ? undefined : 248,
          bottom: isMobile ? undefined : 90,
          left: isMobile ? undefined : 56,
          right: isMobile ? undefined : 56,
          marginTop: isMobile ? 248 : undefined,
          padding: isMobile ? '0 20px 80px' : undefined,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '320px 1fr',
          gap: isMobile ? 40 : 64,
          overflowY: isMobile ? undefined : 'auto',
        }}
      >
        {/* ── Left column ───────────────────────────────────────────── */}
        <div>
          {/* Brief */}
          <p
            className="hl-serif"
            style={{ fontSize: 16, color: 'var(--parchment-ink)', lineHeight: 1.7, margin: 0 }}
          >
            {ownerName
              ? `${ownerName} prepared this thread for ${recipientName || 'you'}${relationship ? `, their ${relationship}` : ''}.`
              : `This thread was prepared for ${recipientName || 'you'}.`}
          </p>

          <hr
            className="hl-rule parchment"
            style={{ margin: '24px 0' }}
          />

          {/* Contents list */}
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 24px',
            }}
          >
            {contentCounts.length === 0 ? (
              <li
                className="hl-mono"
                style={{ fontSize: 12, color: 'var(--parchment-dim)', lineHeight: 2 }}
              >
                no content yet
              </li>
            ) : (
              contentCounts.map((item, i) => (
                <li
                  key={i}
                  className="hl-mono"
                  style={{ fontSize: 12, color: 'var(--parchment-dim)', lineHeight: 2 }}
                >
                  {item}
                </li>
              ))
            )}
          </ul>

          {/* Pledge note */}
          <p
            className="hl-serif hl-italic"
            style={{ fontSize: 14.5, color: 'var(--parchment-dim)', margin: 0, lineHeight: 1.7 }}
          >
            This thread is sealed. Only you can read it. No content can be removed — only added by
            those who love you.
          </p>
        </div>

        {/* ── Right column ──────────────────────────────────────────── */}
        <div style={{ background: 'var(--parchment-deep)', padding: '40px 48px' }}>

          {/* Tab eyebrow */}
          <p
            className="hl-eyebrow dark"
            style={{ marginBottom: 14 }}
          >
            {activeTab === 'search' && searchResponse
              ? `search · ${searchResponse.totalItems} entries`
              : activeTab}
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={ownerName ? `Ask about ${ownerName}'s memories…` : 'Search the thread…'}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid var(--parchment-rule)',
                  borderRadius: 0,
                  padding: '10px 80px 10px 14px',
                  fontFamily: 'var(--serif)',
                  fontSize: 14,
                  color: 'var(--parchment-ink)',
                  outline: 0,
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute',
                    right: 48,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                    color: 'var(--parchment-faint)',
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
                  background: 'var(--warm)',
                  border: 0,
                  cursor: searchLoading || searchQuery.trim().length < 3 ? 'not-allowed' : 'pointer',
                  opacity: searchLoading || searchQuery.trim().length < 3 ? 0.4 : 1,
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--ink)',
                  transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
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
              borderBottom: '1px solid var(--parchment-rule)',
              marginBottom: 28,
            }}
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={tabBtnStyle(t.id)}
              >
                {t.label}
                {t.count > 0 ? (
                  <span
                    className="hl-mono"
                    style={{ marginLeft: 6, fontSize: 9, color: 'var(--parchment-faint)' }}
                  >
                    {t.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* ── Letters tab ─────────────────────────────────────── */}
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
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--parchment-faint)',
                    marginBottom: 28,
                  }}
                >
                  ← back to letters
                </button>
                <article>
                  <header style={{ marginBottom: 24 }}>
                    <h2
                      className="hl-serif hl-italic"
                      style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 300, color: 'var(--warm)', margin: '0 0 6px' }}
                    >
                      {selectedLetter.title}
                    </h2>
                    <p
                      className="hl-mono"
                      style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.04em', margin: 0 }}
                    >
                      {formatDate(selectedLetter.createdAt)}
                    </p>
                  </header>
                  <hr className="hl-rule parchment" style={{ marginBottom: 24 }} />
                  {selectedLetter.salutation ? (
                    <p
                      className="hl-serif hl-italic"
                      style={{ fontSize: 16, color: 'var(--parchment-dim)', marginBottom: 18 }}
                    >
                      {selectedLetter.salutation}
                    </p>
                  ) : null}
                  <div
                    className="hl-prose dark"
                    style={{ whiteSpace: 'pre-wrap', fontSize: 17, lineHeight: 1.85, color: 'var(--parchment-ink)' }}
                  >
                    {selectedLetter.body}
                  </div>
                  {selectedLetter.signature ? (
                    <p
                      className="hl-serif hl-italic"
                      style={{ fontSize: 16, color: 'var(--parchment-dim)', marginTop: 24 }}
                    >
                      {selectedLetter.signature}
                    </p>
                  ) : null}
                </article>
              </div>
            ) : content?.letters.length === 0 ? (
              <p
                className="hl-serif hl-italic"
                style={{ color: 'var(--parchment-dim)', fontSize: 16 }}
              >
                No letters have been shared yet.
              </p>
            ) : (
              <>
                {/* Letter preview (first letter) */}
                {firstLetter && (
                  <div style={{ marginBottom: 28 }}>
                    <p
                      className="hl-serif hl-italic"
                      style={{ fontSize: 16, color: 'var(--parchment-dim)', marginBottom: 12, lineHeight: 1.6 }}
                    >
                      {firstLetter.salutation || `Dear ${recipientName || 'you'},`}
                    </p>
                    <p
                      className="hl-prose dark"
                      style={{ fontSize: 17, color: 'var(--parchment-ink)', margin: 0 }}
                    >
                      {firstLetter.body.substring(0, 220)}{firstLetter.body.length > 220 ? '…' : ''}
                    </p>
                  </div>
                )}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {content?.letters.map((letter) => (
                    <li
                      key={letter.id}
                      style={{ borderBottom: '1px solid var(--parchment-rule)' }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedLetter(letter)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 0,
                          padding: '18px 0',
                          cursor: 'pointer',
                        }}
                      >
                        <p
                          className="hl-serif hl-italic"
                          style={{ fontSize: 16, color: 'var(--parchment-ink)', margin: '0 0 4px' }}
                        >
                          {letter.title || 'Untitled letter'}
                        </p>
                        <p
                          className="hl-mono"
                          style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.04em', margin: 0 }}
                        >
                          {formatDate(letter.createdAt)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )
          )}

          {/* ── Memories tab ────────────────────────────────────── */}
          {activeTab === 'memories' && (
            content?.memories.length === 0 ? (
              <p
                className="hl-serif hl-italic"
                style={{ color: 'var(--parchment-dim)', fontSize: 16 }}
              >
                No memories have been shared yet.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
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
                        transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0'; }}
                    >
                      <p
                        className="hl-serif hl-italic"
                        style={{ fontSize: 13, color: 'var(--bone)', margin: 0 }}
                      >
                        {memory.title}
                      </p>
                      {memory.description ? (
                        <p
                          className="hl-prose"
                          style={{ fontSize: 11, color: 'var(--bone-dim)', margin: '4px 0 0', lineHeight: 1.4 }}
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

          {/* ── Voice tab ───────────────────────────────────────── */}
          {activeTab === 'voice' && (
            content?.voiceRecordings.length === 0 ? (
              <p
                className="hl-serif hl-italic"
                style={{ color: 'var(--parchment-dim)', fontSize: 16 }}
              >
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
                      borderBottom: '1px solid var(--parchment-rule)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => playVoice(recording)}
                      aria-label={playingVoiceId === recording.id ? 'Pause' : 'Play'}
                      style={{
                        width: 44,
                        height: 44,
                        background: playingVoiceId === recording.id ? 'var(--warm)' : 'transparent',
                        border: '1px solid var(--parchment-rule)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        color: playingVoiceId === recording.id ? 'var(--ink)' : 'var(--warm)',
                        transition: 'background 180ms cubic-bezier(0.16,1,0.3,1), color 180ms cubic-bezier(0.16,1,0.3,1)',
                        flexShrink: 0,
                      }}
                    >
                      {playingVoiceId === recording.id ? 'pause' : 'play'}
                    </button>
                    <div>
                      <p
                        className="hl-serif hl-italic"
                        style={{ fontSize: 16, color: 'var(--parchment-ink)', margin: '0 0 4px' }}
                      >
                        {recording.title}
                      </p>
                      <p
                        className="hl-mono"
                        style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.04em', margin: 0 }}
                      >
                        {formatDuration(recording.duration)} · {formatDate(recording.createdAt)}
                      </p>
                      {recording.transcript ? (
                        <p
                          className="hl-prose dark"
                          style={{ fontSize: 13, margin: '6px 0 0', lineHeight: 1.6 }}
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

          {/* ── Search results tab ──────────────────────────────── */}
          {activeTab === 'search' && (
            searchLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <ShuttleBar />
                <p
                  className="hl-mono"
                  style={{ marginTop: 16, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--parchment-faint)' }}
                >
                  searching…
                </p>
              </div>
            ) : searchError ? (
              <div style={{ padding: '20px 0' }}>
                <p
                  className="hl-serif hl-italic"
                  style={{ color: 'var(--parchment-dim)', marginBottom: 16 }}
                >
                  {searchError}
                </p>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="hl-btn ghost"
                >
                  try again
                </button>
              </div>
            ) : searchResponse ? (
              <div>
                {/* The Listener AI answer */}
                <div
                  style={{
                    padding: '20px 24px',
                    border: '1px solid var(--parchment-rule)',
                    marginBottom: 28,
                  }}
                >
                  <p
                    className="hl-eyebrow dark"
                    style={{ marginBottom: 10 }}
                  >
                    the listener
                  </p>
                  <p
                    className="hl-prose dark"
                    style={{ fontSize: 15, lineHeight: 1.8 }}
                  >
                    {searchResponse.answer}
                  </p>
                </div>

                {searchResponse.results.length > 0 ? (
                  <>
                    <p className="hl-eyebrow dark" style={{ marginBottom: 14 }}>related entries</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {searchResponse.results.map((result) => (
                        <li
                          key={`${result.type}-${result.id}`}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '60px 1fr',
                            gap: 16,
                            padding: '16px 0',
                            borderBottom: '1px solid var(--parchment-rule)',
                            alignItems: 'baseline',
                          }}
                        >
                          <span
                            className="hl-mono"
                            style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--parchment-faint)' }}
                          >
                            {result.type}
                          </span>
                          <div>
                            <p
                              className="hl-serif hl-italic"
                              style={{ fontSize: 16, color: 'var(--parchment-ink)', margin: '0 0 4px' }}
                            >
                              {result.title}
                            </p>
                            <p
                              className="hl-mono"
                              style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.04em', margin: '0 0 6px' }}
                            >
                              {formatDate(result.date)}
                            </p>
                            <p
                              className="hl-prose dark"
                              style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}
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
                  className="hl-mono"
                  style={{ fontSize: 9, color: 'var(--parchment-faint)', letterSpacing: '0.04em', marginTop: 24, textAlign: 'center' }}
                >
                  searched {searchResponse.totalItems} entries · "{searchResponse.query}"
                </p>
              </div>
            ) : (
              <p
                className="hl-serif hl-italic"
                style={{ color: 'var(--parchment-dim)', fontSize: 16 }}
              >
                Enter a question above to search through the thread.
              </p>
            )
          )}

          {/* Send a note */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--parchment-rule)' }}>
            <button
              type="button"
              onClick={() => setShowReactionModal(true)}
              className="hl-btn"
              style={{ fontSize: 11, letterSpacing: '0.18em' }}
            >
              send a note to {ownerName.split(' ')[0] || 'the author'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Reaction modal ───────────────────────────────────────────── */}
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
            background: 'rgba(250,246,238,0.80)',
          }}
          onClick={() => !sendingReaction && setShowReactionModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--parchment-deep)',
              border: '1px solid var(--parchment-rule)',
              padding: '32px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {reactionSent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <span
                  className="hl-serif"
                  style={{ fontSize: 28, color: 'var(--warm)', display: 'block', marginBottom: 16 }}
                >
                  ∞
                </span>
                <h3
                  className="hl-serif hl-italic"
                  style={{ fontSize: 20, fontWeight: 300, color: 'var(--parchment-ink)', margin: '0 0 8px' }}
                >
                  Note sent.
                </h3>
                <p
                  className="hl-prose dark"
                  style={{ fontSize: 14, margin: 0 }}
                >
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
                    marginBottom: 20,
                  }}
                >
                  <h3
                    className="hl-serif hl-italic"
                    style={{ fontSize: 20, fontWeight: 300, color: 'var(--parchment-ink)', margin: 0 }}
                  >
                    Send a note to {ownerName.split(' ')[0] || 'the author'}.
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowReactionModal(false)}
                    aria-label="Close"
                    style={{
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      color: 'var(--parchment-faint)',
                      fontSize: 18,
                      lineHeight: 1,
                      padding: '4px 6px',
                    }}
                  >
                    ×
                  </button>
                </div>
                <p
                  className="hl-prose dark"
                  style={{ fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}
                >
                  Let {ownerName.split(' ')[0] || 'them'} know these memories mean something to you.
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
                        border: `1px solid ${selectedReaction === option.type ? 'var(--warm)' : 'var(--parchment-rule)'}`,
                        padding: '14px 16px',
                        cursor: 'pointer',
                        transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      <p
                        className="hl-serif hl-italic"
                        style={{ fontSize: 15, color: 'var(--parchment-ink)', margin: '0 0 2px' }}
                      >
                        {option.label}
                      </p>
                      <p
                        className="hl-mono"
                        style={{ fontSize: 11, color: 'var(--parchment-faint)', margin: 0, lineHeight: 1.5 }}
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
                        border: '1px solid var(--parchment-rule)',
                        borderRadius: 0,
                        padding: '12px 14px',
                        color: 'var(--parchment-ink)',
                        fontFamily: 'var(--serif)',
                        fontSize: 15,
                        lineHeight: 1.7,
                        resize: 'none',
                        outline: 0,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ) : null}

                {reactionError && (
                  <p
                    className="hl-mono"
                    style={{ fontSize: 11, color: 'var(--danger)', margin: '0 0 12px', letterSpacing: '0.12em' }}
                  >
                    {reactionError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => { setReactionError(null); sendReaction(); }}
                  disabled={sendingReaction || (!selectedReaction && !reactionMessage.trim())}
                  className="hl-btn"
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

      {/* ── Parchment bottom edge ────────────────────────────────────── */}
      <ParchmentEdge />
    </div>
  );
}
