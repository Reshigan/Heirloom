import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { type Letter, type Memory, type VoiceRecording } from '../types';
import { formatDate, formatDuration } from '../utils/date';
import { CosmicHeader, EntryRow, SectionLabel, WaxSeal, WarmDot } from '../loom/cosmic/CosmicUI';
import { dyeColor } from '../loom/dye';
import { useFocusTrap } from '../lib/useFocusTrap';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api';

type ReactionType = 'THANK_YOU' | 'REMEMBER_THIS' | 'LOVE_THIS' | 'CUSTOM';

interface ReactionOption {
  type: ReactionType;
  label: string;
  description: string;
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

import { EASE } from '../loom/motion';

/* ── Hairline loading bar ──────────────────────────────────────────────────── */
function ShuttleBar() {
  return (
    <div
      style={{
        width: 180,
        height: 1,
        background: 'var(--rule)',
        position: 'relative',
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      {/* Local keyframes — distinct from the global 11s ambient `loom-shuttle`.
          This is a contained 1.4s sweep across the 180px hairline loader. */}
      <style>{`
        @keyframes loom-shuttle-quick {
          0%   { transform: translateX(-100%); opacity: 0; }
          10%  { opacity: 0.6; }
          85%  { opacity: 0.6; }
          100% { transform: translateX(250%); opacity: 0; }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '40%',
          background: 'var(--warm)',
          animation: `loom-shuttle-quick 1400ms ${EASE} infinite`,
        }}
      />
    </div>
  );
}

/* ── Mono uppercase eyebrow / label ─────────────────────────────────────────── */
const monoEyebrow = (extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--bone-faint)',
  ...extra,
});

/* ── Mono uppercase warm text affordance ────────────────────────────────────── */
const monoAction = (active = true, extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'transparent',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: active ? 'var(--warm)' : 'var(--bone-faint)',
  transition: `color 180ms ${EASE}`,
  ...extra,
});

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
  const reactionRef = useRef<HTMLDivElement>(null);

  // Reaction modal: canonical focus trap + Escape close (Escape is ignored mid-send, mirroring the backdrop guard).
  useFocusTrap(
    reactionRef,
    () => { if (!sendingReaction) setShowReactionModal(false); },
    showReactionModal,
  );

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
      const audio = new Audio(recording.fileUrl ?? undefined);
      audio.onended = () => setPlayingVoiceId(null);
      audio.onerror = () => setPlayingVoiceId(null);
      audio.play().catch(() => setPlayingVoiceId(null));
      audioRef.current = audio;
      setPlayingVoiceId(recording.id);
    }
  };


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

  /* ── Shared shell wrapper ─────────────────────────────────────────── */
  const shellPadding = isMobile ? '0 20px' : '0 56px';

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div
        className="hl-screen"
        style={{ position: 'absolute', inset: 0, background: 'var(--ink)', overflow: 'auto' }}
      >
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: shellPadding }}>
          <div style={{ textAlign: 'center' }}>
            <ShuttleBar />
            <p style={monoEyebrow({ marginTop: 22 })}>unlocking…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div
        className="hl-screen"
        style={{ position: 'absolute', inset: 0, background: 'var(--ink)', overflow: 'auto' }}
      >
        {/* Minimal default Helmet for the error state — no OG/share tags leak to scrapers */}
        <Helmet>
          <title>Inherit · Heirloom</title>
        </Helmet>
        {/* Topbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: isMobile ? '20px' : '24px 56px',
            ...monoEyebrow({ marginBottom: 0, letterSpacing: '0.22em', fontSize: 10.5 }),
          }}
        >
          <span>inherit</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <WarmDot size={6} />
            <span>the {threadName} thread</span>
          </span>
          <Link to="/signup" style={monoAction(true, { textDecoration: 'none', letterSpacing: '0.22em', fontSize: 10.5 })}>
            create an account →
          </Link>
        </div>

        <div style={{ display: 'grid', placeItems: 'center', minHeight: '70vh', padding: shellPadding }}>
          <div style={{ textAlign: 'center', maxWidth: 440 }}>
            <WaxSeal size={40} />
            <div style={{ marginTop: 28 }}>
              <CosmicHeader eyebrow="access denied" title={error} align="center" />
            </div>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 16,
                lineHeight: 1.7,
                color: 'var(--bone-dim)',
                margin: '0 0 32px',
              }}
            >
              This link may have expired or is no longer valid. Please contact the person who shared
              this with you.
            </p>
            <Link to="/" style={monoAction(true, { textDecoration: 'none' })}>
              return home →
            </Link>
          </div>
        </div>
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
    color: activeTab === id ? 'var(--bone)' : 'var(--bone-faint)',
    transition: `color 180ms ${EASE}, border-color 180ms ${EASE}`,
  });

  /* ── Brief / contents for label-value column ─────────────────────── */
  const contentRows: Array<{ label: string; value: string }> = [
    { label: 'Letters', value: String(content?.letters.length ?? 0) },
    { label: 'Memories', value: String(content?.memories.length ?? 0) },
    { label: 'Voice recordings', value: String(content?.voiceRecordings.length ?? 0) },
  ];

  /* ── First letter preview for right column ──────────────────────── */
  const firstLetter = content?.letters[0] ?? null;

  // Functional on-tab title stays generic — names no sender or recipient.
  const inheritTitle = 'You have inherited a thread · Heirloom';

  return (
    <div
      className="hl-screen"
      style={{ position: 'absolute', inset: 0, background: 'var(--ink)', overflow: 'auto' }}
    >
      {!error && content && (
        <Helmet>
          <title>{inheritTitle}</title>
          <meta name="description" content="A thread was set aside for you on Heirloom." />
          {/*
           * PRIVACY-SAFE share meta. An inherit link is reachable by anyone
           * holding it, so the scraper-facing og:* / twitter:* tags name no
           * sender or recipient and reveal no content — they reuse the static
           * "inherit" share card copy (functions/_shared/og.ts).
           */}
          <meta property="og:title" content="Someone has been writing to you." />
          <meta
            property="og:description"
            content="A thread was set aside for you to read when the time came. Open it when you are ready - it has been waiting."
          />
          <meta name="twitter:title" content="Someone has been writing to you." />
          <meta
            name="twitter:description"
            content="A thread was set aside for you to read when the time came. Open it when you are ready - it has been waiting."
          />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={window.location.href} />
          <meta property="og:image" content="https://heirloom.blue/og/inherit.png" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="https://heirloom.blue/og/inherit.png" />
          <link rel="canonical" href={window.location.href} />
        </Helmet>
      )}

      {/* ── Topbar ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          padding: isMobile ? '20px' : '24px 56px',
          ...monoEyebrow({ marginBottom: 0, letterSpacing: '0.22em', fontSize: 10.5 }),
        }}
      >
        <span>inherit</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <WarmDot size={6} />
          <span>the {threadName} thread</span>
        </span>
        <Link to="/signup" style={monoAction(true, { textDecoration: 'none', letterSpacing: '0.22em', fontSize: 10.5 })}>
          create an account →
        </Link>
      </div>

      {/* ── Hero — the ceremonial seal ───────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          padding: shellPadding,
          marginTop: isMobile ? 56 : 112,
          marginBottom: isMobile ? 24 : 64,
        }}
      >
        {/* Woven inheritance seal — behind, ambient, decorative only */}
        <picture style={{ display: 'contents' }}>
          <source type="image/avif" srcSet="/woven/seal.avif" />
          <source type="image/webp" srcSet="/woven/seal.webp" />
          <img
            src="/woven/seal.png"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: isMobile ? 280 : 380,
              height: 'auto',
              opacity: 0.12,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        </picture>
        <div style={{ position: 'relative', textAlign: 'center', animation: `hl-fadeup 1400ms ${EASE} both` }}>
          <CosmicHeader
            align="center"
            eyebrow="Someone in your line left this for you"
            title={
              <>
                You have inherited a thread.
                <br />
                <span style={{ color: 'var(--bone-dim)', fontStyle: 'italic', fontWeight: 300 }}>
                  Read it on the day you're ready.
                </span>
              </>
            }
          />
        </div>
      </div>

      {/* ── Two-column main layout ───────────────────────────────────── */}
      <div
        style={{
          padding: isMobile ? '0 20px 96px' : '0 56px 96px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '320px 1fr',
          gap: isMobile ? 48 : 72,
          alignItems: 'start',
        }}
      >
        {/* ── Left column — the bloodline brief, label/value contents ── */}
        <div>
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 17,
              color: 'var(--bone)',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {ownerName
              ? `${ownerName} prepared this thread for ${recipientName || 'you'}${relationship ? `, their ${relationship}` : ''}.`
              : `This thread was prepared for ${recipientName || 'you'}.`}
          </p>

          <SectionLabel>What was left</SectionLabel>
          {contentRows.every((r) => r.value === '0') ? (
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 15,
                color: 'var(--bone-dim)',
                margin: '12px 0 0',
              }}
            >
              No content yet.
            </p>
          ) : (
            contentRows.map((row) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                <span style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--bone)' }}>{row.label}</span>
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    letterSpacing: '0.14em',
                    color: row.value === '0' ? 'var(--bone-faint)' : 'var(--bone-dim)',
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))
          )}

          <p
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 14.5,
              color: 'var(--bone-dim)',
              margin: '28px 0 0',
              lineHeight: 1.7,
            }}
          >
            This thread is sealed to its bloodline — no one outside it can read it. Within the
            bloodline, entries are added — never overwritten by those who love you.
          </p>
        </div>

        {/* ── Right column — the archive ────────────────────────────── */}
        <div>
          {/* Section eyebrow */}
          <p style={monoEyebrow({ marginBottom: 16 })}>
            {activeTab === 'search' && searchResponse
              ? `search · ${searchResponse.totalItems} entries`
              : activeTab}
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} style={{ marginBottom: 28 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={ownerName ? `Ask about ${ownerName}'s memories…` : 'Search the thread…'}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 0,
                  borderBottom: '1px solid var(--rule)',
                  borderRadius: 0,
                  padding: '10px 96px 10px 0',
                  fontFamily: 'var(--serif)',
                  fontSize: 16,
                  color: 'var(--bone)',
                  caretColor: 'var(--warm)',
                  outline: 0,
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  style={monoAction(false, {
                    position: 'absolute',
                    right: 56,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                  })}
                >
                  clear
                </button>
              ) : null}
              <button
                type="submit"
                disabled={searchLoading || searchQuery.trim().length < 3}
                style={monoAction(true, {
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  cursor: searchLoading || searchQuery.trim().length < 3 ? 'not-allowed' : 'pointer',
                  opacity: searchLoading || searchQuery.trim().length < 3 ? 0.4 : 1,
                })}
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
              flexWrap: 'wrap',
              borderBottom: '1px solid var(--rule)',
              marginBottom: 8,
            }}
          >
            {tabs.map((t) => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} style={tabBtnStyle(t.id)}>
                {t.label}
                {t.count > 0 ? (
                  <span style={{ fontFamily: 'var(--mono)', marginLeft: 6, fontSize: 9, color: 'var(--bone-faint)' }}>
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
                  style={monoAction(false, { margin: '28px 0', fontSize: 10, letterSpacing: '0.18em' })}
                >
                  ← back to letters
                </button>
                <article
                  style={{
                    borderLeft: `3px solid ${dyeColor(selectedLetter.id)}`,
                    paddingLeft: 24,
                  }}
                >
                  <header style={{ marginBottom: 20 }}>
                    <h2
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize: 'clamp(26px,5vw,34px)',
                        fontWeight: 400,
                        lineHeight: 1.1,
                        color: 'var(--bone)',
                        margin: '0 0 12px',
                      }}
                    >
                      {selectedLetter.title}
                    </h2>
                    <p style={monoEyebrow({ color: 'var(--warm)', fontSize: 10, letterSpacing: '0.26em', margin: 0 })}>
                      A letter · {formatDate(selectedLetter.createdAt)}
                    </p>
                    {(() => {
                      // Bequest read-time line — only if the entry already carries "left to" recipients.
                      const bequest = selectedLetter.legacyRecipients?.length
                        ? selectedLetter.legacyRecipients
                        : selectedLetter.recipients;
                      const names = (bequest ?? []).map((r) => r.name).filter(Boolean);
                      return names.length ? (
                        <p style={monoEyebrow({ fontSize: 10, letterSpacing: '0.22em', margin: '8px 0 0' })}>
                          Left to: {names.join(', ')}
                        </p>
                      ) : null;
                    })()}
                  </header>
                  {selectedLetter.salutation ? (
                    <p
                      style={{
                        fontFamily: 'var(--serif)',
                        fontStyle: 'italic',
                        fontSize: 17,
                        color: 'var(--bone-dim)',
                        marginBottom: 18,
                      }}
                    >
                      {selectedLetter.salutation}
                    </p>
                  ) : null}
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'var(--serif)',
                      fontSize: 18,
                      lineHeight: 1.75,
                      color: 'var(--bone)',
                      textAlign: 'justify',
                      maxWidth: '62ch',
                    }}
                  >
                    {selectedLetter.body}
                  </div>
                  {selectedLetter.signature ? (
                    <p
                      style={{
                        fontFamily: 'var(--serif)',
                        fontStyle: 'italic',
                        fontSize: 17,
                        color: 'var(--bone-dim)',
                        marginTop: 24,
                      }}
                    >
                      {selectedLetter.signature}
                    </p>
                  ) : null}
                </article>
              </div>
            ) : content?.letters.length === 0 ? (
              <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--bone-dim)', marginTop: 24 }}>
                No letters have been shared yet.
              </p>
            ) : (
              <>
                {/* Letter preview (first letter) */}
                {firstLetter && (
                  <div style={{ margin: '28px 0', paddingBottom: 4 }}>
                    <p
                      style={{
                        fontFamily: 'var(--serif)',
                        fontStyle: 'italic',
                        fontSize: 16,
                        color: 'var(--bone-dim)',
                        marginBottom: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      {firstLetter.salutation || `Dear ${recipientName || 'you'},`}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize: 17,
                        lineHeight: 1.7,
                        color: 'var(--bone)',
                        margin: 0,
                      }}
                    >
                      {(firstLetter.body ?? '').substring(0, 220)}{(firstLetter.body ?? '').length > 220 ? '…' : ''}
                    </p>
                  </div>
                )}
                <SectionLabel>The letters</SectionLabel>
                <div>
                  {content?.letters.map((letter) => (
                    <EntryRow
                      key={letter.id}
                      title={letter.title || 'Untitled letter'}
                      italic
                      year={formatDate(letter.createdAt)}
                      author={ownerName ? ownerName.split(' ')[0] : undefined}
                      dye={undefined}
                      onClick={() => setSelectedLetter(letter)}
                    />
                  ))}
                </div>
              </>
            )
          )}

          {/* ── Memories tab ────────────────────────────────────── */}
          {activeTab === 'memories' && (
            content?.memories.length === 0 ? (
              <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--bone-dim)', marginTop: 24 }}>
                No memories have been shared yet.
              </p>
            ) : (
              <>
                <SectionLabel>The memories</SectionLabel>
                <div>
                  {content?.memories.map((memory) => (
                    <div
                      key={memory.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '72px 1fr',
                        gap: 20,
                        alignItems: 'start',
                        padding: '16px 0',
                        borderBottom: '1px solid var(--rule)',
                      }}
                    >
                      {memory.fileUrl ? (
                        <img
                          src={memory.fileUrl ?? undefined}
                          alt={memory.title ?? 'Memory photo'}
                          loading="lazy"
                          style={{ width: 72, height: 72, objectFit: 'cover', display: 'block', borderRadius: 0 }}
                        />
                      ) : (
                        <span
                          style={{
                            width: 72,
                            height: 72,
                            border: '1px solid var(--rule)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--mono)',
                            fontSize: 9,
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: 'var(--bone-faint)',
                          }}
                        >
                          photo
                        </span>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontFamily: 'var(--serif)',
                            fontStyle: 'italic',
                            fontSize: 17,
                            color: 'var(--bone)',
                            margin: '0 0 4px',
                          }}
                        >
                          {memory.title}
                        </p>
                        {memory.description ? (
                          <p
                            style={{
                              fontFamily: 'var(--serif)',
                              fontSize: 14,
                              color: 'var(--bone-dim)',
                              margin: 0,
                              lineHeight: 1.5,
                            }}
                          >
                            {memory.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          )}

          {/* ── Voice tab ───────────────────────────────────────── */}
          {activeTab === 'voice' && (
            content?.voiceRecordings.length === 0 ? (
              <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--bone-dim)', marginTop: 24 }}>
                No voice recordings have been shared yet.
              </p>
            ) : (
              <>
                <SectionLabel>The voices</SectionLabel>
                <div>
                  {content?.voiceRecordings.map((recording) => (
                    <div
                      key={recording.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '64px 1fr',
                        gap: 20,
                        alignItems: 'start',
                        padding: '16px 0',
                        borderBottom: '1px solid var(--rule)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => playVoice(recording)}
                        aria-label={playingVoiceId === recording.id ? 'Pause' : 'Play'}
                        style={{
                          width: 44,
                          height: 44,
                          background: 'transparent',
                          border: playingVoiceId === recording.id ? '1px solid var(--warm)' : '1px solid var(--rule)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--mono)',
                          fontSize: 9,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--warm)',
                          transition: `border-color 180ms ${EASE}, color 180ms ${EASE}`,
                          flexShrink: 0,
                        }}
                      >
                        {playingVoiceId === recording.id ? 'pause' : 'play'}
                      </button>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontFamily: 'var(--serif)',
                            fontStyle: 'italic',
                            fontSize: 17,
                            color: 'var(--bone)',
                            margin: '0 0 4px',
                          }}
                        >
                          {recording.title}
                        </p>
                        <p style={monoEyebrow({ fontSize: 10, letterSpacing: '0.14em', margin: 0 })}>
                          {formatDuration(recording.duration ?? 0)} · {formatDate(recording.createdAt)}
                        </p>
                        {recording.transcript ? (
                          <p
                            style={{
                              fontFamily: 'var(--serif)',
                              fontSize: 14,
                              color: 'var(--bone-dim)',
                              margin: '6px 0 0',
                              lineHeight: 1.6,
                            }}
                          >
                            {recording.transcript}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          )}

          {/* ── Search results tab ──────────────────────────────── */}
          {activeTab === 'search' && (
            searchLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <ShuttleBar />
                <p style={monoEyebrow({ marginTop: 18 })}>searching…</p>
              </div>
            ) : searchError ? (
              <div style={{ padding: '24px 0' }}>
                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--bone-dim)', marginBottom: 18 }}>
                  {searchError}
                </p>
                <button type="button" onClick={clearSearch} style={monoAction(true)}>
                  try again →
                </button>
              </div>
            ) : searchResponse ? (
              <div>
                {/* The Listener AI answer */}
                <div
                  style={{
                    borderLeft: '3px solid var(--warm)',
                    paddingLeft: 24,
                    margin: '8px 0 32px',
                  }}
                >
                  <p style={monoEyebrow({ color: 'var(--warm)', letterSpacing: '0.26em', marginBottom: 12 })}>
                    the listener
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: 17,
                      lineHeight: 1.75,
                      color: 'var(--bone)',
                      margin: 0,
                      maxWidth: '62ch',
                    }}
                  >
                    {searchResponse.answer}
                  </p>
                </div>

                {searchResponse.results.length > 0 ? (
                  <>
                    <SectionLabel>Related entries</SectionLabel>
                    <div>
                      {searchResponse.results.map((result) => (
                        <EntryRow
                          key={`${result.type}-${result.id}`}
                          title={result.title}
                          sub={result.snippet}
                          italic
                          year={formatDate(result.date)}
                          author={result.type.toUpperCase()}
                          dye={undefined}
                        />
                      ))}
                    </div>
                  </>
                ) : null}

                <p style={monoEyebrow({ fontSize: 9, letterSpacing: '0.14em', marginTop: 28, textAlign: 'center' })}>
                  searched {searchResponse.totalItems} entries · "{searchResponse.query}"
                </p>
              </div>
            ) : (
              <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--bone-dim)', marginTop: 24 }}>
                Enter a question above to search through the thread.
              </p>
            )
          )}

          {/* Send a note */}
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--rule)' }}>
            <button type="button" onClick={() => setShowReactionModal(true)} style={monoAction(true)}>
              send a note to {ownerName.split(' ')[0] || 'the author'} →
            </button>
          </div>
        </div>
      </div>

      {/* ── Wax seal foot ────────────────────────────────────────────── */}
      <div style={{ padding: '0 0 56px' }}>
        <WaxSeal size={28} />
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
            background: 'var(--ink-translucent)',
          }}
          onClick={() => !sendingReaction && setShowReactionModal(false)}
        >
          <div
            ref={reactionRef}
            role="dialog"
            aria-modal="true"
            aria-label="Send a note"
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--ink)',
              border: '1px solid var(--rule)',
              padding: 32,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {reactionSent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <WaxSeal size={36} />
                <h3
                  style={{
                    fontFamily: 'var(--serif)',
                    fontStyle: 'italic',
                    fontSize: 22,
                    fontWeight: 400,
                    color: 'var(--bone)',
                    margin: '20px 0 8px',
                  }}
                >
                  Note sent.
                </h3>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone-dim)', margin: 0 }}>
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
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: 'clamp(20px,4vw,26px)',
                      fontWeight: 400,
                      color: 'var(--bone)',
                      margin: 0,
                      lineHeight: 1.15,
                    }}
                  >
                    Send a note to {ownerName.split(' ')[0] || 'the author'}.
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowReactionModal(false)}
                    aria-label="Close"
                    style={monoAction(false, { fontSize: 10, letterSpacing: '0.18em', flexShrink: 0 })}
                  >
                    close
                  </button>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--serif)',
                    fontStyle: 'italic',
                    fontSize: 15,
                    color: 'var(--bone-dim)',
                    marginBottom: 28,
                    lineHeight: 1.7,
                  }}
                >
                  Let {ownerName.split(' ')[0] || 'them'} know these memories mean something to you.
                </p>

                <div style={{ marginBottom: 24 }}>
                  {reactionOptions.map((option) => (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() =>
                        setSelectedReaction(selectedReaction === option.type ? null : option.type)
                      }
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16,
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 0,
                        borderBottom: '1px solid var(--rule)',
                        borderLeft: `3px solid ${selectedReaction === option.type ? 'var(--warm)' : 'transparent'}`,
                        padding: '14px 0 14px 14px',
                        cursor: 'pointer',
                        transition: `border-color 180ms ${EASE}`,
                      }}
                    >
                      <span style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: 'block',
                            fontFamily: 'var(--serif)',
                            fontStyle: 'italic',
                            fontSize: 16,
                            color: 'var(--bone)',
                            marginBottom: 2,
                          }}
                        >
                          {option.label}
                        </span>
                        <span
                          style={{
                            display: 'block',
                            fontFamily: 'var(--sans)',
                            fontSize: 12,
                            color: 'var(--bone-dim)',
                            lineHeight: 1.5,
                          }}
                        >
                          {option.description}
                        </span>
                      </span>
                      {selectedReaction === option.type ? <WarmDot size={6} /> : null}
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
                        border: 0,
                        borderBottom: '1px solid var(--rule)',
                        borderRadius: 0,
                        padding: '12px 0',
                        color: 'var(--bone)',
                        caretColor: 'var(--warm)',
                        fontFamily: 'var(--serif)',
                        fontSize: 16,
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
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: 'var(--warm)',
                      margin: '0 0 16px',
                      letterSpacing: '0.12em',
                    }}
                  >
                    {reactionError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => { setReactionError(null); sendReaction(); }}
                  disabled={sendingReaction || (!selectedReaction && !reactionMessage.trim())}
                  style={monoAction(true, {
                    width: '100%',
                    textAlign: 'center',
                    padding: '14px 0',
                    border: '1px solid var(--warm)',
                    cursor: sendingReaction || (!selectedReaction && !reactionMessage.trim()) ? 'not-allowed' : 'pointer',
                    opacity: sendingReaction || (!selectedReaction && !reactionMessage.trim()) ? 0.45 : 1,
                  })}
                >
                  {sendingReaction ? 'sending…' : 'send note'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
