import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Play, Trash2, Share2, Film, Image, Mic, Check, X, Eye
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { FeatureOnboarding, useFeatureOnboarding, OnboardingHelpButton } from '../components/FeatureOnboarding';
import api, { memoriesApi, voiceApi } from '../services/api';

interface Memory {
  id: string;
  title: string;
  description: string;
  file_url: string;
  type: string;
}

interface VoiceRecording {
  id: string;
  title: string;
  description: string;
  file_url: string;
  duration: number;
}

interface StoryArtifact {
  id: string;
  title: string;
  description: string;
  selected_memories: string;
  selected_voice: string | null;
  captions: string;
  music_track: string | null;
  theme: string;
  share_token: string;
  status: string;
  view_count: number;
  created_at: string;
}

const THEMES = [
  { id: 'classic', name: 'Classic', description: 'Elegant gold and black' },
  { id: 'warm', name: 'Warm Memories', description: 'Soft sepia tones' },
  { id: 'modern', name: 'Modern', description: 'Clean and minimal' },
  { id: 'vintage', name: 'Vintage', description: 'Nostalgic film look' },
];

const MUSIC_TRACKS = [
  { id: null, name: 'No Music', description: 'Silent slideshow' },
  { id: 'gentle-piano', name: 'Gentle Piano', description: 'Soft, emotional piano' },
  { id: 'acoustic-warmth', name: 'Acoustic Warmth', description: 'Warm guitar melody' },
  { id: 'orchestral-memories', name: 'Orchestral Memories', description: 'Cinematic strings' },
];

export function StoryArtifact() {
  const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Feature onboarding
  const { isOpen: isOnboardingOpen, completeOnboarding, dismissOnboarding, openOnboarding } = useFeatureOnboarding('story-artifacts');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [theme, setTheme] = useState('classic');
  const [musicTrack, setMusicTrack] = useState<string | null>(null);

    const { data: artifacts, isLoading } = useQuery<{ artifacts: StoryArtifact[] }>({
      queryKey: ['story-artifacts'],
      queryFn: () => api.get('/api/story-artifacts').then((r: { data: { artifacts: StoryArtifact[] } }) => r.data),
    });

  const { data: memoriesData } = useQuery({
    queryKey: ['memories-for-artifact'],
    queryFn: () => memoriesApi.getAll().then(r => r.data),
    enabled: showCreate,
  });

  const { data: voiceData } = useQuery({
    queryKey: ['voice-for-artifact'],
    queryFn: () => voiceApi.getAll().then(r => r.data),
    enabled: showCreate,
  });

  const memories: Memory[] = Array.isArray(memoriesData) ? memoriesData : memoriesData?.memories || [];
  const voiceRecordings: VoiceRecording[] = Array.isArray(voiceData) ? voiceData : voiceData?.recordings || [];

  const createMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; selectedMemories: string[]; selectedVoice?: string; theme: string; musicTrack?: string }) =>
      api.post('/api/story-artifacts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-artifacts'] });
      resetForm();
    },
  });

  const generateMutation = useMutation({
    mutationFn: (artifactId: string) => api.post(`/api/story-artifacts/${artifactId}/generate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['story-artifacts'] }),
  });

    const shareMutation = useMutation({
      mutationFn: (artifactId: string) => api.post(`/api/story-artifacts/${artifactId}/share`, { expiryDays: 7 }),
      onSuccess: (response: { data: { shareToken: string } }) => {
        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}/story/${response.data.shareToken}`);
      },
    });

  const deleteMutation = useMutation({
    mutationFn: (artifactId: string) => api.delete(`/api/story-artifacts/${artifactId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['story-artifacts'] }),
  });

  const resetForm = () => {
    setShowCreate(false);
    setTitle('');
    setDescription('');
    setSelectedMemories([]);
    setSelectedVoice(null);
    setTheme('classic');
    setMusicTrack(null);
  };

  const handleCreate = () => {
    if (!title.trim() || selectedMemories.length === 0) return;
    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      selectedMemories,
      selectedVoice: selectedVoice || undefined,
      theme,
      musicTrack: musicTrack || undefined,
    });
  };

  const toggleMemory = (memoryId: string) => {
    if (selectedMemories.includes(memoryId)) {
      setSelectedMemories(selectedMemories.filter(id => id !== memoryId));
    } else if (selectedMemories.length < 10) {
      setSelectedMemories([...selectedMemories, memoryId]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="eternal-bg">
          <div className="eternal-aura" />
          <div className="eternal-stars" />
        </div>
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="eternal-bg">
        <div className="eternal-aura" />
        <div className="eternal-stars" />
        <div className="eternal-mist" />
      </div>

      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-16 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h1 className="font-display text-4xl md:text-5xl mb-2">Story Artifacts</h1>
            <p className="text-paper/60">
              Create beautiful micro-documentaries from your memories
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Create Story
          </button>
        </motion.div>

        {/* Artifacts Grid */}
        {artifacts?.artifacts && artifacts.artifacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artifacts.artifacts.map((artifact, index) => (
              <motion.div
                key={artifact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl overflow-hidden group"
              >
                <div className="aspect-video bg-gradient-to-br from-gold/20 to-void flex items-center justify-center relative">
                  <Film size={48} className="text-gold/50" />
                                    {artifact.status === 'READY' && (
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                          onClick={() => shareMutation.mutate(artifact.id)}
                                          className="w-16 h-16 rounded-full bg-gold/90 flex items-center justify-center"
                                          title="Share this story"
                                        >
                                          <Play size={24} className="text-void ml-1" />
                                        </button>
                                      </div>
                                    )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      artifact.status === 'READY' ? 'bg-green-500/20 text-green-400' :
                      artifact.status === 'PROCESSING' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-paper/20 text-paper/60'
                    }`}>
                      {artifact.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-1 truncate">{artifact.title}</h3>
                  {artifact.description && (
                    <p className="text-sm text-paper/50 mb-3 line-clamp-2">{artifact.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-paper/40">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Image size={14} />
                        {JSON.parse(artifact.selected_memories || '[]').length}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {artifact.view_count}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {artifact.status === 'DRAFT' && (
                        <button
                          onClick={() => generateMutation.mutate(artifact.id)}
                          disabled={generateMutation.isPending}
                          className="p-2 hover:bg-paper/10 rounded-lg transition-colors text-gold"
                          title="Generate"
                        >
                          <Play size={16} />
                        </button>
                      )}
                      {artifact.status === 'READY' && (
                        <button
                          onClick={() => shareMutation.mutate(artifact.id)}
                          className="p-2 hover:bg-paper/10 rounded-lg transition-colors"
                          title="Share"
                        >
                          <Share2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(artifact.id)}
                        className="p-2 hover:bg-paper/10 rounded-lg transition-colors text-red-400"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Film size={64} className="mx-auto text-paper/20 mb-4" />
            <h3 className="text-xl font-medium mb-2">No stories yet</h3>
            <p className="text-paper/50 mb-6">Create your first micro-documentary from your memories</p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary"
            >
              Create Your First Story
            </button>
          </motion.div>
        )}

        {/* Share URL Modal */}
        <AnimatePresence>
          {shareUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShareUrl(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass rounded-2xl p-6 max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-xl font-medium mb-4">Share Your Story</h3>
                <p className="text-paper/60 mb-4">Anyone with this link can view your story for 7 days.</p>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-void/50 border border-paper/10 rounded-lg px-4 py-2 text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    className="btn btn-primary btn-sm"
                  >
                    Copy
                  </button>
                </div>
                <button
                  onClick={() => setShareUrl(null)}
                  className="w-full btn btn-ghost"
                >
                  Done
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto"
              onClick={() => resetForm()}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass rounded-2xl p-6 max-w-2xl w-full my-8"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-medium">Create Story Artifact</h3>
                  <button onClick={() => resetForm()} className="text-paper/50 hover:text-paper">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Title & Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="My Family Story"
                      className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description (optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="A collection of our favorite moments..."
                      rows={2}
                      className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50 resize-none"
                    />
                  </div>

                  {/* Select Memories */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Photos ({selectedMemories.length}/10)
                    </label>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-void/30 rounded-lg">
                      {memories.filter(m => m.type === 'PHOTO').map((memory) => (
                        <button
                          key={memory.id}
                          onClick={() => toggleMemory(memory.id)}
                          className={`aspect-square rounded-lg overflow-hidden relative ${
                            selectedMemories.includes(memory.id) ? 'ring-2 ring-gold' : ''
                          }`}
                        >
                          <img
                            src={memory.file_url}
                            alt={memory.title}
                            className="w-full h-full object-cover"
                          />
                          {selectedMemories.includes(memory.id) && (
                            <div className="absolute inset-0 bg-gold/30 flex items-center justify-center">
                              <Check size={24} className="text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                      {memories.filter(m => m.type === 'PHOTO').length === 0 && (
                        <p className="col-span-4 text-center text-paper/50 py-8">
                          No photos yet. Add some memories first!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Select Voice */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Add Voice Recording (optional)</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {voiceRecordings.map((recording) => (
                        <button
                          key={recording.id}
                          onClick={() => setSelectedVoice(selectedVoice === recording.id ? null : recording.id)}
                          className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                            selectedVoice === recording.id 
                              ? 'bg-gold/20 border border-gold/30' 
                              : 'bg-void/30 hover:bg-void/50'
                          }`}
                        >
                          <Mic size={16} className={selectedVoice === recording.id ? 'text-gold' : 'text-paper/50'} />
                          <span className="flex-1 text-left truncate">{recording.title}</span>
                          <span className="text-sm text-paper/50">
                            {Math.floor(recording.duration / 60)}:{String(recording.duration % 60).padStart(2, '0')}
                          </span>
                        </button>
                      ))}
                      {voiceRecordings.length === 0 && (
                        <p className="text-center text-paper/50 py-4">No voice recordings yet</p>
                      )}
                    </div>
                  </div>

                  {/* Theme Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Theme</label>
                    <div className="grid grid-cols-2 gap-2">
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`p-3 rounded-lg text-left transition-all ${
                            theme === t.id 
                              ? 'bg-gold/20 border border-gold/30' 
                              : 'bg-void/30 hover:bg-void/50'
                          }`}
                        >
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-paper/50">{t.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Music Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Background Music</label>
                    <div className="grid grid-cols-2 gap-2">
                      {MUSIC_TRACKS.map((track) => (
                        <button
                          key={track.id || 'none'}
                          onClick={() => setMusicTrack(track.id)}
                          className={`p-3 rounded-lg text-left transition-all ${
                            musicTrack === track.id 
                              ? 'bg-gold/20 border border-gold/30' 
                              : 'bg-void/30 hover:bg-void/50'
                          }`}
                        >
                          <p className="font-medium">{track.name}</p>
                          <p className="text-xs text-paper/50">{track.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCreate}
                      disabled={!title.trim() || selectedMemories.length === 0 || createMutation.isPending}
                      className="flex-1 btn btn-primary"
                    >
                      {createMutation.isPending ? 'Creating...' : 'Create Story'}
                    </button>
                    <button onClick={() => resetForm()} className="btn btn-ghost">
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Help Button */}
      <OnboardingHelpButton onClick={openOnboarding} />

      {/* Feature Onboarding */}
      <FeatureOnboarding
        featureKey="story-artifacts"
        isOpen={isOnboardingOpen}
        onComplete={completeOnboarding}
        onDismiss={dismissOnboarding}
      />
    </div>
  );
}

export default StoryArtifact;
