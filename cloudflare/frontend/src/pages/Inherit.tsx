import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressHair } from '../components/ui/ProgressHair';

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
    { type: 'THANK_YOU', label: 'Thank You', description: 'Let them know this meant something to you' },
    { type: 'LOVE_THIS', label: 'I Love This', description: 'Share how much this touched your heart' },
    { type: 'REMEMBER_THIS', label: 'I Remember This Too', description: 'You have your own memory of this moment' },
    { type: 'CUSTOM', label: 'Write a Note', description: 'Share your own thoughts and feelings' },
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

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

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
      <div className="min-h-screen bg-void flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            <ProgressHair label="unlocking…" width={180} />
          </div>
          <p className="text-paper-70">Unlocking memories...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <h1 className="text-2xl font-body font-light text-paper mb-4">{error}</h1>
          <p className="text-paper-70 mb-8">
            This link may have expired or is no longer valid. Please contact the person who shared this with you.
          </p>
          <Link to="/" className="btn btn-ghost">
            Return Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-paper">
      {/* Header */}
      <header className="pt-8 pb-6 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <span className="text-3xl text-gold leading-none">∞</span>
            <span className="text-[0.7rem] tracking-[0.34em] uppercase text-paper-70">Heirloom</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-4xl font-body font-light mb-2 tracking-[-0.014em]">
              Memories from <span className="text-gold">{ownerName}</span>
            </h1>
            <p className="text-paper-70">
              Shared with you, {recipientName} ({relationship})
            </p>
          </motion.div>
        </div>
            </header>

            {/* AI Search Bar */}
            <div className="px-6 mb-6">
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ask about memories... e.g., 'When did dad buy his first car?'"
                      className="w-full pl-4 pr-28 py-4 rounded-[2px] bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper placeholder:text-paper-30 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        aria-label="Clear search"
                        className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-paper-50 hover:text-paper transition-colors"
                      >
                        <span aria-hidden>×</span>
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={searchLoading || searchQuery.trim().length < 3}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-[2px] bg-gold text-void font-mono text-xs uppercase tracking-[0.18em] disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-gold-bright"
                    >
                      Ask
                    </button>
                  </div>
                  <p className="text-xs text-paper-50 mt-2 text-center">
                    Ask questions about {ownerName}'s memories, letters, and recordings
                  </p>
                </form>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 mb-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-center gap-2 flex-wrap">
                  {[
                    { id: 'letters' as TabType, label: 'Letters', count: content?.letters.length || 0 },
                    { id: 'memories' as TabType, label: 'Photos', count: content?.memories.length || 0 },
                    { id: 'voice' as TabType, label: 'Voice', count: content?.voiceRecordings.length || 0 },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-[2px] transition-colors ${
                        activeTab === tab.id
                          ? 'bg-gold text-void'
                          : 'bg-void-surface border border-paper-15 text-paper-70 hover:text-paper'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-[2px] ${
                          activeTab === tab.id ? 'bg-void/20' : 'bg-gold/10 text-gold'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                  {searchResponse && (
                    <button
                      onClick={() => setActiveTab('search')}
                      className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-[2px] transition-colors ${
                        activeTab === 'search'
                          ? 'bg-gold text-void'
                          : 'bg-void-surface border border-paper-15 text-paper-70 hover:text-paper'
                      }`}
                    >
                      <span>Search Results</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

      {/* Content */}
      <main className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Letters Tab */}
            {activeTab === 'letters' && (
              <motion.div
                key="letters"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {selectedLetter ? (
                  <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6">
                    <button
                      onClick={() => setSelectedLetter(null)}
                      className="text-paper-70 hover:text-gold transition-colors mb-6 flex items-center gap-2"
                    >
                      <span aria-hidden>←</span>
                      Back to letters
                    </button>
                    <div className="max-w-none">
                      <h2 className="text-2xl font-body font-light text-gold mb-2">{selectedLetter.title}</h2>
                      <p className="text-paper-70 text-sm mb-6">
                        Written on {formatDate(selectedLetter.createdAt)}
                      </p>
                      {selectedLetter.salutation && (
                        <p className="text-lg italic text-paper-70 mb-4">{selectedLetter.salutation}</p>
                      )}
                      <div className="whitespace-pre-wrap text-paper leading-relaxed">
                        {selectedLetter.body}
                      </div>
                      {selectedLetter.signature && (
                        <p className="text-lg italic text-paper-70 mt-6">{selectedLetter.signature}</p>
                      )}
                    </div>
                  </div>
                ) : content?.letters.length === 0 ? (
                  <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6 text-center py-12">
                    <p className="text-paper-70">No letters have been shared yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content?.letters.map((letter) => (
                      <button
                        key={letter.id}
                        onClick={() => setSelectedLetter(letter)}
                        className="bg-void-surface border border-paper-15 rounded-[2px] p-6 w-full text-left hover:border-gold-40 transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium group-hover:text-gold transition-colors">
                              {letter.title || 'Untitled Letter'}
                            </h3>
                            <p className="text-paper-70 text-sm mt-1">
                              {formatDate(letter.createdAt)}
                            </p>
                            <p className="text-paper-70 mt-2 line-clamp-2">
                              {letter.body.substring(0, 150)}...
                            </p>
                          </div>
                          <span aria-hidden className="text-paper-50 group-hover:text-gold transition-colors text-xl">→</span>
                        </div>
                        {letter.emotion && (
                          <span className="inline-block mt-3 px-3 py-1 rounded-[2px] bg-gold/10 text-gold text-xs">
                            {letter.emotion}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Memories Tab */}
            {activeTab === 'memories' && (
              <motion.div
                key="memories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {content?.memories.length === 0 ? (
                  <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6 text-center py-12">
                    <p className="text-paper-70">No photos have been shared yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {content?.memories.map((memory) => (
                      <div
                        key={memory.id}
                        className="bg-void-surface border border-paper-15 rounded-[2px] overflow-hidden group cursor-pointer"
                      >
                        <div className="aspect-square relative">
                          <img
                            src={memory.fileUrl}
                            alt={memory.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-void/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <div>
                              <h3 className="font-medium">{memory.title}</h3>
                              {memory.description && (
                                <p className="text-sm text-paper-70 line-clamp-2">{memory.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Voice Tab */}
            {activeTab === 'voice' && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {content?.voiceRecordings.length === 0 ? (
                  <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6 text-center py-12">
                    <p className="text-paper-70">No voice recordings have been shared yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content?.voiceRecordings.map((recording) => (
                      <div
                        key={recording.id}
                        className="bg-void-surface border border-paper-15 rounded-[2px] p-6 flex items-center gap-4"
                      >
                        <button
                          onClick={() => playVoice(recording)}
                          aria-label={playingVoiceId === recording.id ? 'Pause' : 'Play'}
                          className={`w-14 h-14 rounded-[2px] flex items-center justify-center flex-shrink-0 text-sm font-mono uppercase tracking-[0.12em] transition-colors ${
                            playingVoiceId === recording.id
                              ? 'bg-gold text-void'
                              : 'bg-void border border-gold-40 text-gold hover:bg-void-elevated'
                          }`}
                        >
                          <span aria-hidden>{playingVoiceId === recording.id ? '⏸' : '▶'}</span>
                        </button>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{recording.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-paper-50 mt-1">
                            <span>{formatDuration(recording.duration)}</span>
                            <span>{formatDate(recording.createdAt)}</span>
                          </div>
                          {recording.transcript && (
                            <p className="text-paper-70 text-sm mt-2 line-clamp-2">
                              {recording.transcript}
                            </p>
                          )}
                        </div>
                        {recording.emotion && (
                          <span className="px-3 py-1 rounded-[2px] bg-gold/10 text-gold text-xs">
                            {recording.emotion}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                      )}
                    </motion.div>
                  )}

                  {/* Search Results Tab */}
                  {activeTab === 'search' && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      {searchLoading ? (
                        <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6 text-center py-12">
                          <div className="flex justify-center mb-4">
                            <ProgressHair label="searching…" width={180} />
                          </div>
                          <p className="text-paper-70">Searching through memories...</p>
                        </div>
                      ) : searchError ? (
                        <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6 text-center py-12">
                          <p className="text-blood">{searchError}</p>
                          <button
                            onClick={clearSearch}
                            className="mt-4 text-gold hover:text-gold-bright transition-colors"
                          >
                            Try again
                          </button>
                        </div>
                      ) : searchResponse ? (
                        <div className="space-y-6">
                          {/* AI Answer */}
                          <div className="bg-void-surface border border-gold-40 rounded-[2px] p-6">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <p className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-gold mb-2">AI Response</p>
                                <p className="text-paper leading-relaxed">{searchResponse.answer}</p>
                              </div>
                            </div>
                          </div>

                          {/* Related Items */}
                          {searchResponse.results.length > 0 && (
                            <div>
                              <h3 className="text-lg font-body font-light mb-4 text-paper-70">Related Memories</h3>
                              <div className="space-y-3">
                                {searchResponse.results.map((result) => (
                                  <div
                                    key={`${result.type}-${result.id}`}
                                    className="bg-void-surface border border-paper-15 rounded-[2px] p-6 hover:border-gold-40 transition-colors"
                                  >
                                    <div className="flex items-start gap-4">
                                      <span className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-gold pt-1 flex-shrink-0">
                                        {result.type}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs text-paper-50">
                                            {formatDate(result.date)}
                                          </span>
                                        </div>
                                        <h4 className="font-medium text-paper truncate">{result.title}</h4>
                                        <p className="text-sm text-paper-50 mt-1 line-clamp-2">{result.snippet}</p>
                                        {result.emotion && (
                                          <span className="inline-block mt-2 px-2 py-0.5 rounded-[2px] bg-gold/10 text-gold text-xs">
                                            {result.emotion}
                                          </span>
                                        )}
                                      </div>
                                      {result.type === 'memory' && result.fileUrl && (
                                        <img
                                          src={result.fileUrl}
                                          alt={result.title}
                                          className="w-16 h-16 rounded-[2px] object-cover flex-shrink-0"
                                        />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Search Info */}
                          <p className="text-center text-paper-50 text-sm">
                            Searched through {searchResponse.totalItems} memories for "{searchResponse.query}"
                          </p>
                        </div>
                      ) : (
                        <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6 text-center py-12">
                          <p className="text-paper-70">Enter a question above to search through memories</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </main>

            {/* Floating "Send a Note" Button */}
            <motion.button
              onClick={() => setShowReactionModal(true)}
              className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-[2px] bg-gold text-void font-medium hover:bg-gold-bright transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <span>Send a Note to {ownerName.split(' ')[0]}</span>
            </motion.button>

            {/* Reaction Modal */}
            <AnimatePresence>
              {showReactionModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80"
                  onClick={() => !sendingReaction && setShowReactionModal(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="w-full max-w-md bg-void-surface border border-paper-15 rounded-[2px] p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {reactionSent ? (
                      <div className="text-center py-8">
                        <span className="font-body text-4xl text-gold block mb-4" aria-hidden>∞</span>
                        <h3 className="text-xl font-body font-light mb-2">Message Sent</h3>
                        <p className="text-paper-70">{ownerName} will receive your note</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-body font-light">Send a Note to {ownerName.split(' ')[0]}</h3>
                          <button
                            onClick={() => setShowReactionModal(false)}
                            aria-label="Close"
                            className="p-2 rounded-[2px] text-paper-50 hover:text-paper transition-colors text-xl"
                          >
                            <span aria-hidden>×</span>
                          </button>
                        </div>

                        <p className="text-paper-70 mb-6">
                          Let {ownerName.split(' ')[0]} know these memories mean something to you.
                        </p>

                        {/* Reaction Options */}
                        <div className="space-y-3 mb-6">
                          {reactionOptions.map((option) => (
                            <button
                              key={option.type}
                              onClick={() => setSelectedReaction(selectedReaction === option.type ? null : option.type)}
                              className={`w-full p-4 rounded-[2px] text-left transition-colors ${
                                selectedReaction === option.type
                                  ? 'bg-void border border-gold-40'
                                  : 'bg-void border border-paper-15 hover:border-paper-15'
                              }`}
                            >
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-paper-50">{option.description}</div>
                            </button>
                          ))}
                        </div>

                        {/* Custom Message */}
                        {(selectedReaction === 'CUSTOM' || selectedReaction === 'REMEMBER_THIS') && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6"
                          >
                            <textarea
                              value={reactionMessage}
                              onChange={(e) => setReactionMessage(e.target.value)}
                              placeholder={selectedReaction === 'REMEMBER_THIS'
                                ? "Share your own memory of this moment..."
                                : "Write your message..."
                              }
                              className="w-full p-4 rounded-[2px] bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper placeholder:text-paper-30 resize-y font-body text-base leading-[1.7] transition-colors"
                              rows={4}
                            />
                          </motion.div>
                        )}

                        {/* Send Button */}
                        <button
                          onClick={sendReaction}
                          disabled={sendingReaction || (!selectedReaction && !reactionMessage.trim())}
                          className="btn btn-primary w-full"
                        >
                          {sendingReaction ? 'Sending…' : 'Send Note'}
                          {!sendingReaction ? <span aria-hidden>→</span> : null}
                        </button>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
      <footer className="py-8 text-center text-paper-50 text-sm">
        <p className="mb-2">Secured by Heirloom</p>
        <p>These memories were shared with love</p>
      </footer>
    </div>
  );
}
