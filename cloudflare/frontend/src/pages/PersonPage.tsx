import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { familyApi } from '../services/api';
import { Navigation } from '../components/Navigation';
import { ProgressHair } from '../components/ui/ProgressHair';

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
      const audio = new Audio(recording.fileUrl);
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
      <div className="min-h-screen bg-void flex items-center justify-center">
        <ProgressHair label="loading…" width={180} />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <p className="text-paper-70 mb-4">Person not found</p>
          <Link to="/family" className="btn btn-ghost">Back to Family</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-paper antialiased">
      <Navigation />

      <div className="relative z-10 px-6 md:px-12 py-12">
        <button
          onClick={() => navigate('/family')}
          className="inline-flex items-center gap-2 text-paper-70 hover:text-gold transition-colors mb-8"
        >
          <span aria-hidden>←</span>
          Back to Family
        </button>

        <div className="max-w-4xl mx-auto">
          {/* Person Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-32 h-32 rounded-[2px] mx-auto mb-6 overflow-hidden border border-paper-15">
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-void-surface flex items-center justify-center text-gold text-4xl font-body">
                  {member.name[0]}
                </div>
              )}
            </div>

            <h1 className="font-body font-light text-3xl md:text-4xl mb-2 tracking-[-0.014em]">
              What You've Left for <span className="text-gold">{member.name}</span>
            </h1>
            <p className="text-paper-65">{member.relationship}</p>

            {/* Why I'm doing this note */}
            <div className="mt-6">
              {member.notes ? (
                <button
                  onClick={() => {
                    setWhyNote(member.notes || '');
                    setShowWhyNote(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-void-surface border border-paper-15 rounded-[2px] text-paper-70 hover:text-gold hover:border-gold-40 transition-colors"
                >
                  <span className="italic text-sm">"{member.notes}"</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowWhyNote(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-void-surface border border-paper-15 rounded-[2px] text-paper-70 hover:text-gold hover:border-gold-40 transition-colors"
                >
                  <span aria-hidden>+</span>
                  <span className="text-sm">Add a note: "Why I'm doing this for {member.name}"</span>
                </button>
              )}
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-4 mb-12"
          >
            <div className="bg-void-surface border border-paper-15 text-center py-6">
              <div className="text-2xl font-light text-gold">{member.recentLetters?.length || 0}</div>
              <div className="text-paper-65 text-sm">Letters</div>
            </div>
            <div className="bg-void-surface border border-paper-15 text-center py-6">
              <div className="text-2xl font-light text-paper">{member.recentMemories?.length || 0}</div>
              <div className="text-paper-65 text-sm">Memories</div>
            </div>
            <div className="bg-void-surface border border-paper-15 text-center py-6">
              <div className="text-2xl font-light text-paper">{member.recentVoiceRecordings?.length || 0}</div>
              <div className="text-paper-65 text-sm">Voice</div>
            </div>
          </motion.div>

          {/* AI Suggested Prompts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-void-surface border border-paper-15 p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-body text-paper">Next Message for {member.name}</h3>
                <p className="text-paper-65 text-sm">Suggested prompts just for {member.relationship.toLowerCase()}</p>
              </div>
              <button
                onClick={() => refetchPrompts()}
                disabled={promptsLoading}
                aria-label={promptsLoading ? 'Finding new suggestions' : 'Get new suggestions'}
                title={promptsLoading ? 'Finding new suggestions…' : 'Get new suggestions'}
                className="px-3 py-2 bg-void border border-paper-15 rounded-[2px] text-paper-65 hover:text-gold hover:border-gold-40 transition-colors disabled:opacity-40 text-xs font-mono tracking-[0.18em] uppercase"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {promptsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <ProgressHair label="loading…" width={160} />
                </div>
              ) : prompts?.prompts?.length ? (
                prompts.prompts.slice(0, 3).map((prompt, index) => (
                  <motion.button
                    key={prompt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    onClick={() => navigate(`/record?prompt=${encodeURIComponent(prompt.prompt)}&for=${id}`)}
                    className="w-full p-4 bg-void border border-paper-15 rounded-[2px] text-left hover:border-gold-40 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-paper-70 group-hover:text-paper transition-colors">
                        "{prompt.prompt}"
                      </p>
                      <span aria-hidden className="text-paper-65 group-hover:text-gold transition-colors">→</span>
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="text-center py-6 text-paper-70">
                  <p>No prompts available. Click refresh to generate some.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-paper-15">
              <Link
                to={`/record?for=${id}`}
                className="btn btn-primary w-full justify-center"
              >
                Record a Message for {member.name}
                <span aria-hidden>→</span>
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
              className="bg-void-surface border border-paper-15 p-6 text-center hover:border-gold-40 transition-colors group"
            >
              <p className="font-body group-hover:text-gold transition-colors">Write a Letter</p>
              <p className="text-paper-65 text-sm mt-1">Express your feelings in words</p>
            </Link>
            <Link
              to={`/memories?for=${id}`}
              className="bg-void-surface border border-paper-15 p-6 text-center hover:border-gold-40 transition-colors group"
            >
              <p className="font-body group-hover:text-gold transition-colors">Add a Memory</p>
              <p className="text-paper-65 text-sm mt-1">Share a photo or moment</p>
            </Link>
          </motion.div>

          {/* Recent Content */}
          {totalContent > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="font-body font-light text-xl mb-4 tracking-[-0.014em]">What {member.name} Will Receive</h3>

              {/* Letters */}
              {member.recentLetters?.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-mono text-[0.65rem] tracking-[0.24em] uppercase text-paper-50 mb-3">Letters</h4>
                  <div className="space-y-2">
                    {member.recentLetters.map((letter: any) => (
                      <Link
                        key={letter.id}
                        to={`/letters/${letter.id}`}
                        className="block p-4 bg-void-surface border border-paper-15 rounded-[2px] hover:border-gold-40 transition-colors group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-body">{letter.title || 'Untitled Letter'}</p>
                            <p className="text-paper-70 text-sm">
                              {new Date(letter.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span aria-hidden className="text-paper-65 group-hover:text-gold transition-colors">→</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Voice Recordings */}
              {member.recentVoiceRecordings?.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-mono text-[0.65rem] tracking-[0.24em] uppercase text-paper-50 mb-3">Voice Recordings</h4>
                  <div className="space-y-2">
                    {member.recentVoiceRecordings.map((recording: any) => (
                      <div
                        key={recording.id}
                        className="p-4 bg-void-surface border border-paper-15 rounded-[2px] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => playVoice(recording)}
                            aria-label={playingVoiceId === recording.id ? 'Pause' : 'Play'}
                            className="w-10 h-10 rounded-[2px] bg-void border border-paper-15 flex items-center justify-center text-gold hover:border-gold-40 transition-colors"
                          >
                            <span aria-hidden>{playingVoiceId === recording.id ? '❚❚' : '▶'}</span>
                          </button>
                          <div>
                            <p className="font-body">{recording.title}</p>
                            <p className="text-paper-70 text-sm">
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
                  <h4 className="font-mono text-[0.65rem] tracking-[0.24em] uppercase text-paper-50 mb-3">Memories</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {member.recentMemories.map((memory: any) => (
                      <Link
                        key={memory.id}
                        to={`/memories/${memory.id}`}
                        className="aspect-square rounded-[2px] overflow-hidden relative group border border-paper-15"
                      >
                        {memory.fileUrl ? (
                          <img
                            src={memory.fileUrl}
                            alt={memory.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-void-surface flex items-center justify-center">
                            <span className="font-mono text-[0.55rem] tracking-[0.18em] uppercase text-paper-50">Memory</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-void/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <p className="text-sm truncate text-paper">{memory.title}</p>
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
              className="bg-void-surface border border-paper-15 text-center py-12"
            >
              <h3 className="font-body font-light text-xl mb-2 tracking-[-0.014em]">Start Creating for {member.name}</h3>
              <p className="text-paper-65 mb-6 max-w-md mx-auto">
                You haven't created any content for {member.name} yet.
                Use the prompts above or record your first message.
              </p>
              <Link
                to={`/record?for=${id}`}
                className="btn btn-primary"
              >
                Record Your First Message
                <span aria-hidden>→</span>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-6"
            onClick={() => setShowWhyNote(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-md bg-void-surface border border-paper-15 p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-body font-light text-xl mb-2 tracking-[-0.014em]">Why I'm Doing This</h3>
              <p className="text-paper-65 text-sm mb-4">
                A personal note to remind yourself why you're creating this legacy for {member.name}
              </p>

              <textarea
                value={whyNote}
                onChange={(e) => setWhyNote(e.target.value)}
                placeholder={`e.g., "I want ${member.name} to know how much they mean to me, even when I can't say it in person..."`}
                className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 min-h-[120px] resize-none mb-4 font-body text-base leading-[1.7] transition-colors"
                maxLength={500}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWhyNote(false)}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveWhyNoteMutation.mutate(whyNote)}
                  disabled={saveWhyNoteMutation.isPending || whyNoteSaved}
                  className="btn btn-primary flex-1"
                >
                  {whyNoteSaved ? 'Saved' : saveWhyNoteMutation.isPending ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
