import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Image, Mic, Play, Pause, Clock, Calendar, AlertCircle, Loader2, ChevronRight, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// @ts-ignore - Vite env types
const API_URL = import.meta.env?.VITE_API_URL || 'https://api.heirloom.blue';

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

type TabType = 'letters' | 'memories' | 'voice';

export function Inherit() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
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
          <p className="text-paper/60">{t('common.loading')}</p>
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
                      {t('common.returnHome')}
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

      {/* Tabs */}
      <div className="relative z-10 px-6 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center gap-2">
            {[
              { id: 'letters' as TabType, label: 'Letters', icon: FileText, count: content?.letters.length || 0 },
              { id: 'memories' as TabType, label: 'Photos', icon: Image, count: content?.memories.length || 0 },
              { id: 'voice' as TabType, label: 'Voice', icon: Mic, count: content?.voiceRecordings.length || 0 },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-gold text-void'
                    : 'glass text-paper/60 hover:text-paper'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-void/20' : 'bg-gold/20 text-gold'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </motion.button>
            ))}
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
          </AnimatePresence>
        </div>
      </main>

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
