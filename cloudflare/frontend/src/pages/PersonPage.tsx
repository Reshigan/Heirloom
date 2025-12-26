import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Heart, FileText, Mic, Image, Plus, Sparkles, 
  ChevronRight, Clock, Play, Pause, RefreshCw, Send, Check
} from '../components/Icons';
import api, { familyApi } from '../services/api';
import { Navigation } from '../components/Navigation';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: string;
  notes?: string;
  recentMemories: any[];
  recentLetters: any[];
  recentVoiceRecordings: any[];
}

interface PersonPrompt {
  id: string;
  prompt: string;
  category: string;
}

export function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [showWhyNote, setShowWhyNote] = useState(false);
  const [whyNote, setWhyNote] = useState('');
  const [whyNoteSaved, setWhyNoteSaved] = useState(false);

  const { data: member, isLoading } = useQuery<FamilyMember>({
    queryKey: ['family', id],
    queryFn: () => familyApi.getOne(id!).then(r => r.data),
    enabled: !!id,
  });

  const { data: prompts, isLoading: promptsLoading, refetch: refetchPrompts } = useQuery<{ prompts: PersonPrompt[] }>({
    queryKey: ['person-prompts', id],
    queryFn: () => api.get(`/api/ai/person-prompts/${id}`).then((r: any) => r.data),
    enabled: !!id,
  });

  const saveWhyNoteMutation = useMutation({
    mutationFn: (note: string) => familyApi.update(id!, { notes: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', id] });
      setWhyNoteSaved(true);
      setTimeout(() => {
        setShowWhyNote(false);
        setWhyNoteSaved(false);
      }, 1500);
    },
  });

  const totalContent = (member?.recentLetters?.length || 0) + 
                       (member?.recentMemories?.length || 0) + 
                       (member?.recentVoiceRecordings?.length || 0);

  const playVoice = (recording: any) => {
    if (playingVoiceId === recording.id) {
      audioElement?.pause();
      setPlayingVoiceId(null);
      setAudioElement(null);
    } else {
      audioElement?.pause();
      const audio = new Audio(recording.file_url);
      audio.onended = () => {
        setPlayingVoiceId(null);
        setAudioElement(null);
      };
      audio.play();
      setPlayingVoiceId(recording.id);
      setAudioElement(audio);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="sanctuary-bg">
          <div className="sanctuary-orb sanctuary-orb-1" />
          <div className="sanctuary-orb sanctuary-orb-2" />
          <div className="sanctuary-stars" />
        </div>
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="sanctuary-bg">
          <div className="sanctuary-orb sanctuary-orb-1" />
          <div className="sanctuary-orb sanctuary-orb-2" />
          <div className="sanctuary-stars" />
        </div>
        <div className="text-center">
          <p className="text-paper/60 mb-4">Person not found</p>
          <Link to="/family" className="btn btn-secondary">Back to Family</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      <Navigation />

      <div className="relative z-10 px-6 md:px-12 py-12">
        <motion.button
          onClick={() => navigate('/family')}
          className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
        >
          <ArrowLeft size={20} />
          Back to Family
        </motion.button>

        <div className="max-w-4xl mx-auto">
          {/* Person Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              className="w-32 h-32 rounded-full mx-auto mb-6 overflow-hidden"
              style={{
                boxShadow: '0 8px 32px rgba(201,169,89,0.3), inset 0 2px 4px rgba(255,255,255,0.3)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
            >
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void text-4xl font-medium">
                  {member.name[0]}
                </div>
              )}
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-light mb-2">
              What You've Left for <span className="text-gold">{member.name}</span>
            </h1>
            <p className="text-paper/50">{member.relationship}</p>

            {/* Why I'm doing this note */}
            <motion.div 
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {member.notes ? (
                <button
                  onClick={() => {
                    setWhyNote(member.notes || '');
                    setShowWhyNote(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-paper/60 hover:text-gold transition-colors"
                >
                  <Heart size={16} className="text-gold" />
                  <span className="italic text-sm">"{member.notes}"</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowWhyNote(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-paper/40 hover:text-gold transition-colors"
                >
                  <Plus size={16} />
                  <span className="text-sm">Add a note: "Why I'm doing this for {member.name}"</span>
                </button>
              )}
            </motion.div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-4 mb-12"
          >
            <div className="card text-center py-6">
              <FileText size={24} className="mx-auto mb-2 text-gold" />
              <div className="text-2xl font-light text-gold">{member.recentLetters?.length || 0}</div>
              <div className="text-paper/50 text-sm">Letters</div>
            </div>
            <div className="card text-center py-6">
              <Image size={24} className="mx-auto mb-2 text-purple-400" />
              <div className="text-2xl font-light text-purple-400">{member.recentMemories?.length || 0}</div>
              <div className="text-paper/50 text-sm">Memories</div>
            </div>
            <div className="card text-center py-6">
              <Mic size={24} className="mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-light text-blue-400">{member.recentVoiceRecordings?.length || 0}</div>
              <div className="text-paper/50 text-sm">Voice</div>
            </div>
          </motion.div>

          {/* AI Suggested Prompts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Sparkles size={20} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium">Next Message for {member.name}</h3>
                  <p className="text-paper/50 text-sm">AI-suggested prompts just for {member.relationship.toLowerCase()}</p>
                </div>
              </div>
              <button
                onClick={() => refetchPrompts()}
                className="p-2 glass rounded-lg hover:bg-gold/10 transition-colors"
                title="Get new suggestions"
              >
                <RefreshCw size={18} className={`text-paper/50 ${promptsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-3">
              {promptsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="spinner w-6 h-6" />
                </div>
              ) : prompts?.prompts?.length ? (
                prompts.prompts.slice(0, 3).map((prompt, index) => (
                  <motion.button
                    key={prompt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    onClick={() => navigate(`/record?prompt=${encodeURIComponent(prompt.prompt)}&for=${id}`)}
                    className="w-full p-4 glass rounded-xl text-left hover:bg-gold/10 hover:border-gold/30 border border-transparent transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-paper/80 group-hover:text-paper transition-colors">
                        "{prompt.prompt}"
                      </p>
                      <ChevronRight size={18} className="text-paper/30 group-hover:text-gold transition-colors" />
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="text-center py-6 text-paper/40">
                  <p>No prompts available. Click refresh to generate some.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <Link
                to={`/record?for=${id}`}
                className="btn btn-primary w-full justify-center"
              >
                <Mic size={18} />
                Record a Message for {member.name}
              </Link>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            <Link
              to={`/compose?for=${id}`}
              className="card p-6 text-center hover:border-gold/30 transition-all group"
            >
              <FileText size={32} className="mx-auto mb-3 text-gold group-hover:scale-110 transition-transform" />
              <p className="font-medium">Write a Letter</p>
              <p className="text-paper/50 text-sm mt-1">Express your feelings in words</p>
            </Link>
            <Link
              to={`/memories?for=${id}`}
              className="card p-6 text-center hover:border-purple-400/30 transition-all group"
            >
              <Image size={32} className="mx-auto mb-3 text-purple-400 group-hover:scale-110 transition-transform" />
              <p className="font-medium">Add a Memory</p>
              <p className="text-paper/50 text-sm mt-1">Share a photo or moment</p>
            </Link>
          </motion.div>

          {/* Recent Content */}
          {totalContent > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-light mb-4">What {member.name} Will Receive</h3>
              
              {/* Letters */}
              {member.recentLetters?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-paper/50 text-sm mb-3 flex items-center gap-2">
                    <FileText size={14} /> Letters
                  </h4>
                  <div className="space-y-2">
                    {member.recentLetters.map((letter: any) => (
                      <Link
                        key={letter.id}
                        to={`/letters/${letter.id}`}
                        className="block p-4 glass rounded-xl hover:bg-gold/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{letter.title || 'Untitled Letter'}</p>
                            <p className="text-paper/40 text-sm">
                              {new Date(letter.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <ChevronRight size={18} className="text-paper/30" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Voice Recordings */}
              {member.recentVoiceRecordings?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-paper/50 text-sm mb-3 flex items-center gap-2">
                    <Mic size={14} /> Voice Recordings
                  </h4>
                  <div className="space-y-2">
                    {member.recentVoiceRecordings.map((recording: any) => (
                      <div
                        key={recording.id}
                        className="p-4 glass rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => playVoice(recording)}
                            className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
                          >
                            {playingVoiceId === recording.id ? (
                              <Pause size={18} className="text-blue-400" />
                            ) : (
                              <Play size={18} className="text-blue-400 ml-0.5" />
                            )}
                          </button>
                          <div>
                            <p className="font-medium">{recording.title}</p>
                            <p className="text-paper/40 text-sm flex items-center gap-2">
                              <Clock size={12} />
                              {formatDuration(recording.duration)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Memories */}
              {member.recentMemories?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-paper/50 text-sm mb-3 flex items-center gap-2">
                    <Image size={14} /> Memories
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {member.recentMemories.map((memory: any) => (
                      <Link
                        key={memory.id}
                        to={`/memories/${memory.id}`}
                        className="aspect-square rounded-xl overflow-hidden relative group"
                      >
                        {memory.file_url ? (
                          <img 
                            src={memory.file_url} 
                            alt={memory.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-purple-500/20 flex items-center justify-center">
                            <Image size={32} className="text-purple-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-void/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <p className="text-sm truncate">{memory.title}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Empty State */}
          {totalContent === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card text-center py-12"
            >
              <Heart size={48} className="mx-auto mb-4 text-paper/20" />
              <h3 className="text-xl font-light mb-2">Start Creating for {member.name}</h3>
              <p className="text-paper/50 mb-6 max-w-md mx-auto">
                You haven't created any content for {member.name} yet. 
                Use the prompts above or record your first message.
              </p>
              <Link
                to={`/record?for=${id}`}
                className="btn btn-primary"
              >
                <Mic size={18} />
                Record Your First Message
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Why Note Modal */}
      <AnimatePresence>
        {showWhyNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowWhyNote(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-light mb-2">Why I'm Doing This</h3>
              <p className="text-paper/50 text-sm mb-4">
                A personal note to remind yourself why you're creating this legacy for {member.name}
              </p>

              <textarea
                value={whyNote}
                onChange={(e) => setWhyNote(e.target.value)}
                placeholder={`e.g., "I want ${member.name} to know how much they mean to me, even when I can't say it in person..."`}
                className="input min-h-[120px] resize-none mb-4"
                maxLength={500}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWhyNote(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveWhyNoteMutation.mutate(whyNote)}
                  disabled={saveWhyNoteMutation.isPending || whyNoteSaved}
                  className="btn btn-primary flex-1"
                >
                  {whyNoteSaved ? (
                    <>
                      <Check size={18} />
                      Saved!
                    </>
                  ) : saveWhyNoteMutation.isPending ? (
                    <>
                      <div className="spinner w-4 h-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Save Note
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
