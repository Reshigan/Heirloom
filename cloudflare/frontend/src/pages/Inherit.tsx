import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Image, Mic, Play, Pause, Clock, Calendar, AlertCircle, Loader2, ChevronRight, Lock, Search, MessageCircle, Send, X, Heart, Sparkles } from '../components/Icons';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="sanctuary-bg">
          <div className="sanctuary-orb sanctuary-orb-1" />
          <div className="sanctuary-orb sanctuary-orb-2" />
          <div className="sanctuary-stars" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center relative z-10"
        >
          <Loader2 size={48} className="animate-spin text-gold mx-auto mb-4" />
          <p className="text-paper/60">Unlocking memories...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="sanctuary-bg">
          <div className="sanctuary-orb sanctuary-orb-1" />
          <div className="sanctuary-orb sanctuary-orb-2" />
          <div className="sanctuary-stars" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md relative z-10"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-light mb-4">{error}</h1>
          <p className="text-paper/60 mb-8">
            This link may have expired or is no longer valid. Please contact the person who shared this with you.
          </p>
          <Link to="/" className="btn btn-secondary">
            Return Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-8 pb-6 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <motion.span 
              className="text-3xl text-gold"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              ∞
            </motion.span>
            <span className="text-lg tracking-[0.2em] text-paper/80">HEIRLOOM</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-4xl font-light mb-2">
              Memories from <span className="text-gold">{ownerName}</span>
            </h1>
            <p className="text-paper/60">
              Shared with you, {recipientName} ({relationship})
            </p>
          </motion.div>
        </div>
            </header>

            {/* AI Search Bar */}
            <div className="relative z-10 px-6 mb-6">
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ask about memories... e.g., 'When did dad buy his first car?'"
                      className="w-full pl-12 pr-24 py-4 rounded-xl glass border border-paper/10 focus:border-gold/50 focus:outline-none text-paper placeholder:text-paper/40 transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-16 top-1/2 -translate-y-1/2 p-1 text-paper/40 hover:text-paper transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={searchLoading || searchQuery.trim().length < 3}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-gold text-void font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gold/90"
                    >
                      {searchLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-paper/40 mt-2 text-center">
                    <MessageCircle size={12} className="inline mr-1" />
                    Ask questions about {ownerName}'s memories, letters, and recordings
                  </p>
                </form>
              </div>
            </div>

            {/* Tabs */}
            <div className="relative z-10 px-6 mb-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-center gap-2 flex-wrap">
                  {[
                    { id: 'letters' as TabType, label: 'Letters', icon: FileText, count: content?.letters.length || 0 },
                    { id: 'memories' as TabType, label: 'Photos', icon: Image, count: content?.memories.length || 0 },
                    { id: 'voice' as TabType, label: 'Voice', icon: Mic, count: content?.voiceRecordings.length || 0 },
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-gold text-void'
                          : 'glass text-paper/60 hover:text-paper'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <tab.icon size={18} />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          activeTab === tab.id ? 'bg-void/20' : 'bg-gold/20 text-gold'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </motion.button>
                  ))}
                  {searchResponse && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => setActiveTab('search')}
                      className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl transition-all ${
                        activeTab === 'search'
                          ? 'bg-gold text-void'
                          : 'glass text-paper/60 hover:text-paper'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Search size={18} />
                      <span className="hidden sm:inline">Search Results</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

      {/* Content */}
      <main className="relative z-10 px-6 pb-12">
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
                  <div className="card">
                    <button
                      onClick={() => setSelectedLetter(null)}
                      className="text-paper/60 hover:text-gold transition-colors mb-6 flex items-center gap-2"
                    >
                      <ChevronRight size={16} className="rotate-180" />
                      Back to letters
                    </button>
                    <div className="prose prose-invert max-w-none">
                      <h2 className="text-2xl font-light text-gold mb-2">{selectedLetter.title}</h2>
                      <p className="text-paper/40 text-sm mb-6">
                        Written on {formatDate(selectedLetter.createdAt)}
                      </p>
                      {selectedLetter.salutation && (
                        <p className="text-lg italic text-paper/80 mb-4">{selectedLetter.salutation}</p>
                      )}
                      <div className="whitespace-pre-wrap text-paper/90 leading-relaxed">
                        {selectedLetter.body}
                      </div>
                      {selectedLetter.signature && (
                        <p className="text-lg italic text-paper/80 mt-6">{selectedLetter.signature}</p>
                      )}
                    </div>
                  </div>
                ) : content?.letters.length === 0 ? (
                  <div className="card text-center py-12">
                    <FileText size={48} className="mx-auto mb-4 text-paper/20" />
                    <p className="text-paper/40">No letters have been shared yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content?.letters.map((letter) => (
                      <motion.button
                        key={letter.id}
                        onClick={() => setSelectedLetter(letter)}
                        className="card w-full text-left hover:border-gold/30 transition-all group"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium group-hover:text-gold transition-colors">
                              {letter.title || 'Untitled Letter'}
                            </h3>
                            <p className="text-paper/40 text-sm mt-1">
                              {formatDate(letter.createdAt)}
                            </p>
                            <p className="text-paper/60 mt-2 line-clamp-2">
                              {letter.body.substring(0, 150)}...
                            </p>
                          </div>
                          <ChevronRight size={20} className="text-paper/30 group-hover:text-gold transition-colors" />
                        </div>
                        {letter.emotion && (
                          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-gold/10 text-gold text-xs">
                            {letter.emotion}
                          </span>
                        )}
                      </motion.button>
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
                  <div className="card text-center py-12">
                    <Image size={48} className="mx-auto mb-4 text-paper/20" />
                    <p className="text-paper/40">No photos have been shared yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {content?.memories.map((memory) => (
                      <motion.div
                        key={memory.id}
                        className="card p-0 overflow-hidden group cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="aspect-square relative">
                          <img
                            src={memory.fileUrl}
                            alt={memory.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-void/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <div>
                              <h3 className="font-medium">{memory.title}</h3>
                              {memory.description && (
                                <p className="text-sm text-paper/60 line-clamp-2">{memory.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
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
                  <div className="card text-center py-12">
                    <Mic size={48} className="mx-auto mb-4 text-paper/20" />
                    <p className="text-paper/40">No voice recordings have been shared yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content?.voiceRecordings.map((recording) => (
                      <motion.div
                        key={recording.id}
                        className="card flex items-center gap-4"
                        whileHover={{ scale: 1.01 }}
                      >
                        <motion.button
                          onClick={() => playVoice(recording)}
                          className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            playingVoiceId === recording.id
                              ? 'bg-gold text-void'
                              : 'bg-gold/20 text-gold hover:bg-gold/30'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {playingVoiceId === recording.id ? (
                            <Pause size={24} fill="currentColor" />
                          ) : (
                            <Play size={24} fill="currentColor" className="ml-1" />
                          )}
                        </motion.button>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{recording.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-paper/50 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatDuration(recording.duration)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(recording.createdAt)}
                            </span>
                          </div>
                          {recording.transcript && (
                            <p className="text-paper/40 text-sm mt-2 line-clamp-2">
                              {recording.transcript}
                            </p>
                          )}
                        </div>
                        {recording.emotion && (
                          <span className="px-3 py-1 rounded-full bg-gold/10 text-gold text-xs">
                            {recording.emotion}
                          </span>
                        )}
                      </motion.div>
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
                        <div className="card text-center py-12">
                          <Loader2 size={48} className="animate-spin text-gold mx-auto mb-4" />
                          <p className="text-paper/60">Searching through memories...</p>
                        </div>
                      ) : searchError ? (
                        <div className="card text-center py-12">
                          <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
                          <p className="text-paper/60">{searchError}</p>
                          <button
                            onClick={clearSearch}
                            className="mt-4 text-gold hover:underline"
                          >
                            Try again
                          </button>
                        </div>
                      ) : searchResponse ? (
                        <div className="space-y-6">
                          {/* AI Answer */}
                          <div className="card bg-gold/5 border-gold/20">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                                <MessageCircle size={20} className="text-gold" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gold mb-1">AI Response</p>
                                <p className="text-paper/90 leading-relaxed">{searchResponse.answer}</p>
                              </div>
                            </div>
                          </div>

                          {/* Related Items */}
                          {searchResponse.results.length > 0 && (
                            <div>
                              <h3 className="text-lg font-light mb-4 text-paper/80">Related Memories</h3>
                              <div className="space-y-3">
                                {searchResponse.results.map((result) => (
                                  <motion.div
                                    key={`${result.type}-${result.id}`}
                                    className="card hover:border-gold/30 transition-all"
                                    whileHover={{ scale: 1.01 }}
                                  >
                                    <div className="flex items-start gap-4">
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        result.type === 'letter' ? 'bg-blue-500/20' :
                                        result.type === 'memory' ? 'bg-green-500/20' :
                                        'bg-purple-500/20'
                                      }`}>
                                        {result.type === 'letter' && <FileText size={18} className="text-blue-400" />}
                                        {result.type === 'memory' && <Image size={18} className="text-green-400" />}
                                        {result.type === 'voice' && <Mic size={18} className="text-purple-400" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs uppercase tracking-wider text-paper/40">
                                            {result.type}
                                          </span>
                                          <span className="text-xs text-paper/30">•</span>
                                          <span className="text-xs text-paper/40">
                                            {formatDate(result.date)}
                                          </span>
                                        </div>
                                        <h4 className="font-medium text-paper/90 truncate">{result.title}</h4>
                                        <p className="text-sm text-paper/50 mt-1 line-clamp-2">{result.snippet}</p>
                                        {result.emotion && (
                                          <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-gold/10 text-gold text-xs">
                                            {result.emotion}
                                          </span>
                                        )}
                                      </div>
                                      {result.type === 'memory' && result.fileUrl && (
                                        <img
                                          src={result.fileUrl}
                                          alt={result.title}
                                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                        />
                                      )}
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Search Info */}
                          <p className="text-center text-paper/40 text-sm">
                            Searched through {searchResponse.totalItems} memories for "{searchResponse.query}"
                          </p>
                        </div>
                      ) : (
                        <div className="card text-center py-12">
                          <Search size={48} className="mx-auto mb-4 text-paper/20" />
                          <p className="text-paper/40">Enter a question above to search through memories</p>
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
              className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-gold text-void font-medium shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <Heart size={20} />
              <span>Send a Note to {ownerName.split(' ')[0]}</span>
            </motion.button>
            
            {/* Reaction Modal */}
            <AnimatePresence>
              {showReactionModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm"
                  onClick={() => !sendingReaction && setShowReactionModal(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-md card"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {reactionSent ? (
                      <div className="text-center py-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
                        >
                          <Sparkles size={32} className="text-green-400" />
                        </motion.div>
                        <h3 className="text-xl font-medium mb-2">Message Sent!</h3>
                        <p className="text-paper/60">{ownerName} will receive your note</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-medium">Send a Note to {ownerName.split(' ')[0]}</h3>
                          <button
                            onClick={() => setShowReactionModal(false)}
                            className="p-2 rounded-lg hover:bg-paper/10 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        
                        <p className="text-paper/60 mb-6">
                          Let {ownerName.split(' ')[0]} know these memories mean something to you.
                        </p>
                        
                        {/* Reaction Options */}
                        <div className="space-y-3 mb-6">
                          {reactionOptions.map((option) => (
                            <button
                              key={option.type}
                              onClick={() => setSelectedReaction(selectedReaction === option.type ? null : option.type)}
                              className={`w-full p-4 rounded-xl text-left transition-all ${
                                selectedReaction === option.type
                                  ? 'bg-gold/20 border-2 border-gold'
                                  : 'glass border-2 border-transparent hover:border-paper/20'
                              }`}
                            >
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-paper/50">{option.description}</div>
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
                              className="w-full p-4 rounded-xl glass border border-paper/10 focus:border-gold/50 focus:outline-none resize-none"
                              rows={4}
                            />
                          </motion.div>
                        )}
                        
                        {/* Send Button */}
                        <button
                          onClick={sendReaction}
                          disabled={sendingReaction || (!selectedReaction && !reactionMessage.trim())}
                          className="w-full py-3 rounded-xl bg-gold text-void font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gold/90 flex items-center justify-center gap-2"
                        >
                          {sendingReaction ? (
                            <>
                              <Loader2 size={20} className="animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send size={20} />
                              Send Note
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-paper/40 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lock size={14} />
          <span>Secured by Heirloom</span>
        </div>
        <p>These memories were shared with love</p>
      </footer>
    </div>
  );
}
