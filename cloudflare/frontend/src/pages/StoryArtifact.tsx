import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Play, Trash2, Share2, Film, Image, Mic, Check, X, Eye, Upload, ArrowRight, Sparkles, ChevronRight, Heart, Users, Clock, Star
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { FeatureOnboarding, useFeatureOnboarding, OnboardingHelpButton } from '../components/FeatureOnboarding';
import api, { memoriesApi, voiceApi } from '../services/api';

// Quick Create wizard templates
const STORY_TEMPLATES = [
  { 
    id: 'family-moments', 
    icon: Users, 
    title: 'Family Moments',
    description: 'A collection of cherished family memories',
    suggestedTitle: 'Our Family Story',
    theme: 'warm',
  },
  { 
    id: 'love-story', 
    icon: Heart, 
    title: 'Love Story',
    description: 'Your journey together',
    suggestedTitle: 'Our Love Story',
    theme: 'classic',
  },
  { 
    id: 'life-journey', 
    icon: Clock, 
    title: 'Life Journey',
    description: 'Highlights from through the years',
    suggestedTitle: 'A Life Well Lived',
    theme: 'vintage',
  },
  { 
    id: 'special-moments', 
    icon: Star, 
    title: 'Special Moments',
    description: 'Your most treasured memories',
    suggestedTitle: 'Moments to Remember',
    theme: 'modern',
  },
];

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

// Theme options - kept for future advanced customization
const _THEMES = [
  { id: 'classic', name: 'Classic', description: 'Elegant gold and black' },
  { id: 'warm', name: 'Warm Memories', description: 'Soft sepia tones' },
  { id: 'modern', name: 'Modern', description: 'Clean and minimal' },
  { id: 'vintage', name: 'Vintage', description: 'Nostalgic film look' },
];
void _THEMES;

// Music track options - kept for future advanced customization
const _MUSIC_TRACKS = [
  { id: null, name: 'No Music', description: 'Silent slideshow' },
  { id: 'gentle-piano', name: 'Gentle Piano', description: 'Soft, emotional piano' },
  { id: 'acoustic-warmth', name: 'Acoustic Warmth', description: 'Warm guitar melody' },
  { id: 'orchestral-memories', name: 'Orchestral Memories', description: 'Cinematic strings' },
];
void _MUSIC_TRACKS;

export function StoryArtifact() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Wizard state - simplified 3-step flow
  const [wizardStep, setWizardStep] = useState(1); // 1: Pick template, 2: Select photos, 3: Review
  const [selectedTemplate, setSelectedTemplate] = useState<typeof STORY_TEMPLATES[0] | null>(null);

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

  // Normalize API responses - handle multiple response shapes
  const memories: Memory[] = (() => {
    if (!memoriesData) return [];
    if (Array.isArray(memoriesData)) return memoriesData;
    if (memoriesData.data && Array.isArray(memoriesData.data)) return memoriesData.data;
    if (memoriesData.memories && Array.isArray(memoriesData.memories)) return memoriesData.memories;
    return [];
  })();
  const voiceRecordings: VoiceRecording[] = (() => {
    if (!voiceData) return [];
    if (Array.isArray(voiceData)) return voiceData;
    if (voiceData.data && Array.isArray(voiceData.data)) return voiceData.data;
    if (voiceData.recordings && Array.isArray(voiceData.recordings)) return voiceData.recordings;
    return [];
  })();

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
    setWizardStep(1);
    setSelectedTemplate(null);
    setTitle('');
    setDescription('');
    setSelectedMemories([]);
    setSelectedVoice(null);
    setTheme('classic');
    setMusicTrack(null);
  };

  const handleTemplateSelect = (template: typeof STORY_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setTitle(template.suggestedTitle);
    setTheme(template.theme);
    setWizardStep(2);
  };

  const handleAutoSelectPhotos = () => {
    // Auto-select up to 10 most recent photos
    const photoMemories = memories.filter(m => m.type === 'PHOTO').slice(0, 10);
    setSelectedMemories(photoMemories.map(m => m.id));
  };

  const handleQuickCreate = () => {
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

  // Legacy create handler - kept for advanced mode
  const _handleCreate = () => {
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
  void _handleCreate;

  const toggleMemory = (memoryId: string) => {
    if (selectedMemories.includes(memoryId)) {
      setSelectedMemories(selectedMemories.filter(id => id !== memoryId));
    } else if (selectedMemories.length < 10) {
      setSelectedMemories([...selectedMemories, memoryId]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Get presigned upload URL
        const { data: uploadData } = await memoriesApi.getUploadUrl({
          filename: file.name,
          contentType: file.type,
        });
        
        // Upload file to presigned URL
        await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        
        // Create memory record
        await memoriesApi.create({
          title: file.name.replace(/\.[^/.]+$/, ''),
          type: 'PHOTO',
          fileUrl: uploadData.fileUrl,
          fileSize: file.size,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['memories-for-artifact'] });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

        {/* Create Modal - Simplified Wizard */}
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
                className="glass rounded-2xl p-6 max-w-xl w-full my-8"
                onClick={e => e.stopPropagation()}
              >
                {/* Wizard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {wizardStep > 1 && (
                      <button 
                        onClick={() => setWizardStep(wizardStep - 1)} 
                        className="text-paper/50 hover:text-paper"
                      >
                        <ArrowRight size={20} className="rotate-180" />
                      </button>
                    )}
                    <div>
                      <h3 className="text-xl font-medium">
                        {wizardStep === 1 && 'What kind of story?'}
                        {wizardStep === 2 && 'Select your photos'}
                        {wizardStep === 3 && 'Review & Create'}
                      </h3>
                      <p className="text-sm text-paper/50">Step {wizardStep} of 3</p>
                    </div>
                  </div>
                  <button onClick={() => resetForm()} className="text-paper/50 hover:text-paper">
                    <X size={24} />
                  </button>
                </div>

                {/* Step 1: Pick Template */}
                {wizardStep === 1 && (
                  <div className="space-y-3">
                    {STORY_TEMPLATES.map((template) => {
                      const TemplateIcon = template.icon;
                      return (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className="w-full p-4 rounded-xl bg-paper/5 hover:bg-paper/10 transition-all flex items-center gap-4 text-left group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
                            <TemplateIcon size={24} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{template.title}</h4>
                            <p className="text-sm text-paper/50">{template.description}</p>
                          </div>
                          <ChevronRight size={20} className="text-paper/30 group-hover:text-gold transition-colors" />
                        </button>
                      );
                    })}
                    <div className="pt-4 border-t border-paper/10">
                      <button
                        onClick={() => {
                          setWizardStep(2);
                          setSelectedTemplate(null);
                        }}
                        className="w-full p-3 text-center text-paper/50 hover:text-paper transition-colors"
                      >
                        Or create a custom story...
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Select Photos */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    {/* Quick Actions */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={handleAutoSelectPhotos}
                        disabled={memories.filter(m => m.type === 'PHOTO').length === 0}
                        className="flex-1 p-3 bg-gold/10 border border-gold/20 rounded-lg text-gold hover:bg-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Sparkles size={16} />
                        Auto-select recent photos
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-3 bg-paper/5 border border-paper/10 rounded-lg hover:bg-paper/10 transition-colors flex items-center gap-2"
                      >
                        <Upload size={16} />
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    <p className="text-sm text-paper/60">
                      Selected: {selectedMemories.length}/10 photos
                    </p>

                    {/* Photo Grid */}
                    <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 bg-void/30 rounded-lg">
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
                        <div className="col-span-4 text-center py-8">
                          <Image size={32} className="mx-auto text-paper/30 mb-2" />
                          <p className="text-paper/50 mb-3">No photos yet</p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-primary btn-sm"
                          >
                            <Upload size={14} className="mr-1" />
                            Upload Your First Photo
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Continue Button */}
                    <button
                      onClick={() => setWizardStep(3)}
                      disabled={selectedMemories.length === 0}
                      className="w-full btn btn-primary mt-4"
                    >
                      Continue with {selectedMemories.length} photos
                    </button>
                  </div>
                )}

                {/* Step 3: Review & Create */}
                {wizardStep === 3 && (
                  <div className="space-y-5">
                    {/* Summary */}
                    <div className="p-4 rounded-xl bg-gold/10 border border-gold/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Sparkles size={20} className="text-gold" />
                        <span className="font-medium">Ready to create</span>
                      </div>
                      <p className="text-sm text-paper/70">
                        {selectedTemplate ? `"${selectedTemplate.title}"` : 'Custom story'} with {selectedMemories.length} photos
                      </p>
                    </div>

                    {/* Editable Title */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Story Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Give your story a name..."
                        className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50"
                      />
                    </div>

                    {/* Optional Description */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Description (optional)</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a description..."
                        rows={2}
                        className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50 resize-none"
                      />
                    </div>

                    {/* Voice Recording (collapsed by default) */}
                    {voiceRecordings.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Add Voice Narration (optional)</label>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {voiceRecordings.slice(0, 3).map((recording) => (
                            <button
                              key={recording.id}
                              onClick={() => setSelectedVoice(selectedVoice === recording.id ? null : recording.id)}
                              className={`w-full p-2 rounded-lg flex items-center gap-2 text-sm transition-all ${
                                selectedVoice === recording.id 
                                  ? 'bg-gold/20 border border-gold/30' 
                                  : 'bg-void/30 hover:bg-void/50'
                              }`}
                            >
                              <Mic size={14} className={selectedVoice === recording.id ? 'text-gold' : 'text-paper/50'} />
                              <span className="flex-1 text-left truncate">{recording.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Create Button */}
                    <button
                      onClick={handleQuickCreate}
                      disabled={!title.trim() || selectedMemories.length === 0 || createMutation.isPending}
                      className="w-full py-4 bg-gradient-to-r from-gold to-gold/80 text-void font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {createMutation.isPending ? (
                        <div className="animate-spin w-5 h-5 border-2 border-void border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Create Story
                        </>
                      )}
                    </button>
                  </div>
                )}
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
