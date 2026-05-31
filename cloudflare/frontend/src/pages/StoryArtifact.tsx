import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FeatureOnboarding, useFeatureOnboarding, OnboardingHelpButton } from '../components/FeatureOnboarding';
import { ProgressHair } from '../components/ui/ProgressHair';
import { AppFrame } from '../loom/components/AppFrame';
import api, { memoriesApi, voiceApi } from '../services/api';

// Quick Create wizard templates
const STORY_TEMPLATES = [
  { id: 'family-moments', title: 'Family Moments', description: 'A collection of cherished family memories', suggestedTitle: 'Our Family Story', theme: 'warm' },
  { id: 'love-story', title: 'Love Story', description: 'Your journey together', suggestedTitle: 'Our Love Story', theme: 'classic' },
  { id: 'life-journey', title: 'Life Journey', description: 'Highlights from through the years', suggestedTitle: 'A Life Well Lived', theme: 'vintage' },
  { id: 'special-moments', title: 'Special Moments', description: 'Your most treasured memories', suggestedTitle: 'Moments to Remember', theme: 'modern' },
];

interface Memory {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  type: string;
}

interface VoiceRecording {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  duration: number;
}

interface StoryArtifactItem {
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

// Theme options — kept for future advanced customization
const _THEMES = [
  { id: 'classic', name: 'Classic', description: 'Elegant gold and black' },
  { id: 'warm', name: 'Warm Memories', description: 'Soft sepia tones' },
  { id: 'modern', name: 'Modern', description: 'Clean and minimal' },
  { id: 'vintage', name: 'Vintage', description: 'Nostalgic film look' },
];
void _THEMES;

const _MUSIC_TRACKS = [
  { id: null, name: 'No Music', description: 'Silent slideshow' },
  { id: 'gentle-piano', name: 'Gentle Piano', description: 'Soft, emotional piano' },
  { id: 'acoustic-warmth', name: 'Acoustic Warmth', description: 'Warm guitar melody' },
  { id: 'orchestral-memories', name: 'Orchestral Memories', description: 'Cinematic strings' },
];
void _MUSIC_TRACKS;

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--loom-rule)',
  borderRadius: 2,
  padding: '10px 14px',
  color: 'var(--loom-bone)',
  fontFamily: "'Source Serif 4', serif",
  fontSize: 15,
  lineHeight: 1.7,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
};

export function StoryArtifact() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [wizardStep, setWizardStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof STORY_TEMPLATES[0] | null>(null);

  const { isOpen: isOnboardingOpen, completeOnboarding, dismissOnboarding, openOnboarding } = useFeatureOnboarding('story-artifacts');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [theme, setTheme] = useState('classic');
  const [musicTrack, setMusicTrack] = useState<string | null>(null);

  const { data: artifacts, isLoading } = useQuery<{ artifacts: StoryArtifactItem[] }>({
    queryKey: ['story-artifacts'],
    queryFn: () => api.get('/api/story-artifacts').then((r: { data: { artifacts: StoryArtifactItem[] } }) => r.data),
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
        const { data: uploadData } = await memoriesApi.getUploadUrl({ filename: file.name, contentType: file.type });
        await fetch(uploadData.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        await memoriesApi.create({ title: file.name.replace(/\.[^/.]+$/, ''), type: 'PHOTO', fileUrl: uploadData.fileUrl, fileSize: file.size });
      }
      queryClient.invalidateQueries({ queryKey: ['memories-for-artifact'] });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <AppFrame>
        <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
          <ProgressHair label="loading…" width={200} />
        </div>
      </AppFrame>
    );
  }

  const artifactList = artifacts?.artifacts ?? [];

  return (
    <AppFrame>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 48,
        }}
      >
        <div>
          <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Story Artifacts</p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
          >
            Woven into motion.
          </h1>
          <p
            className="loom-body"
            style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 540, lineHeight: 1.6 }}
          >
            A story artifact takes the cloth you've woven and plays it forward — a micro-documentary
            from your thread.
          </p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="loom-btn">
          Create story
        </button>
      </header>

      {/* Artifacts list */}
      {artifactList.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {artifactList.map((artifact) => (
            <li key={artifact.id} style={{ padding: '24px 0', borderBottom: '1px solid var(--loom-rule)' }}>
              <article
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 24,
                  alignItems: 'baseline',
                }}
              >
                <div>
                  {/* Status + date rail */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 8, alignItems: 'baseline' }}>
                    <span
                      className="loom-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: artifact.status === 'READY' ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
                      }}
                    >
                      {artifact.status.toLowerCase()}
                    </span>
                    <span className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.06em' }}>
                      {JSON.parse(artifact.selected_memories || '[]').length} photos · {artifact.view_count} views
                    </span>
                  </div>
                  <h3 className="loom-serif" style={{ fontSize: 20, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 6px', lineHeight: 1.25 }}>
                    {artifact.title}
                  </h3>
                  {artifact.description && (
                    <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {artifact.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {artifact.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => generateMutation.mutate(artifact.id)}
                      disabled={generateMutation.isPending}
                      style={{
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--loom-warm)',
                        opacity: generateMutation.isPending ? 0.45 : 1,
                      }}
                    >
                      Generate
                    </button>
                  )}
                  {artifact.status === 'READY' && (
                    <button
                      type="button"
                      onClick={() => shareMutation.mutate(artifact.id)}
                      style={{
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--loom-bone-dim)',
                      }}
                    >
                      Share
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(artifact.id)}
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
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ border: '1px solid var(--loom-rule)', padding: '72px 36px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, color: 'var(--loom-bone-faint)', marginBottom: 20 }}>∞</p>
          <h3 className="loom-serif" style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 12px' }}>
            No stories yet.
          </h3>
          <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: '0 auto 28px', maxWidth: 400 }}>
            Create your first micro-documentary from your memories.
          </p>
          <button type="button" onClick={() => setShowCreate(true)} className="loom-btn">
            Create your first story
          </button>
        </div>
      )}

      {/* Share URL overlay */}
      {shareUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(14,14,12,0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
          onClick={() => setShareUrl(null)}
        >
          <div
            style={{
              background: 'var(--loom-ink)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
              maxWidth: 500,
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="loom-serif" style={{ fontSize: 22, fontWeight: 300, margin: '0 0 8px' }}>
              Share your story
            </h3>
            <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: '0 0 20px' }}>
              Anyone with this link can view your story for 7 days.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                value={shareUrl}
                readOnly
                style={{ ...inputStyle, flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="loom-btn"
                style={{ padding: '10px 18px', flexShrink: 0 }}
              >
                Copy
              </button>
            </div>
            <button type="button" onClick={() => setShareUrl(null)} className="loom-btn-ghost" style={{ width: '100%' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Create wizard overlay */}
      {showCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(14,14,12,0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
            overflowY: 'auto',
          }}
          onClick={() => resetForm()}
        >
          <div
            style={{
              background: 'var(--loom-ink)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
              maxWidth: 580,
              width: '100%',
              margin: '32px auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Wizard header */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep - 1)}
                    style={{
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      color: 'var(--loom-bone-faint)',
                      fontSize: 16,
                      padding: 0,
                    }}
                    aria-label="Back"
                  >
                    ←
                  </button>
                )}
                <div>
                  <h3 className="loom-serif" style={{ fontSize: 22, fontWeight: 300, margin: 0 }}>
                    {wizardStep === 1 && 'What kind of story?'}
                    {wizardStep === 2 && 'Select your photos'}
                    {wizardStep === 3 && 'Review and create'}
                  </h3>
                  <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.14em', marginTop: 4 }}>
                    Step {wizardStep} of 3
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => resetForm()}
                aria-label="Close"
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  color: 'var(--loom-bone-faint)',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {/* Step 1 — template selection */}
            {wizardStep === 1 && (
              <div style={{ display: 'grid', gap: 1 }}>
                {STORY_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    style={{
                      background: 'transparent',
                      border: 0,
                      borderBottom: '1px solid var(--loom-rule)',
                      padding: '16px 0',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 16,
                    }}
                  >
                    <div>
                      <p className="loom-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 4px' }}>
                        {template.title}
                      </p>
                      <p className="loom-body" style={{ fontSize: 13, color: 'var(--loom-bone-dim)', margin: 0 }}>
                        {template.description}
                      </p>
                    </div>
                    <span style={{ color: 'var(--loom-bone-faint)', fontSize: 16 }}>→</span>
                  </button>
                ))}
                <div style={{ paddingTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => { setWizardStep(2); setSelectedTemplate(null); }}
                    style={{
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--loom-bone-faint)',
                      padding: '10px 0',
                    }}
                  >
                    Or create a custom story…
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — select photos */}
            {wizardStep === 2 && (
              <div style={{ display: 'grid', gap: 20 }}>
                {/* Quick actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleAutoSelectPhotos}
                    disabled={memories.filter(m => m.type === 'PHOTO').length === 0}
                    className="loom-btn-ghost"
                    style={{ flex: 1, opacity: memories.filter(m => m.type === 'PHOTO').length === 0 ? 0.4 : 1 }}
                  >
                    Auto-select recent
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="loom-btn-ghost"
                    style={{ opacity: isUploading ? 0.4 : 1 }}
                  >
                    {isUploading ? (
                      <span style={{ fontStyle: 'italic' }}>Uploading…</span>
                    ) : (
                      'Upload'
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.14em' }}>
                  {selectedMemories.length}/10 photos selected
                </p>

                {/* Photo grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 4,
                    maxHeight: 240,
                    overflowY: 'auto',
                    background: 'rgba(14,14,12,0.4)',
                    padding: 4,
                  }}
                >
                  {memories.filter(m => m.type === 'PHOTO').map((memory) => (
                    <button
                      key={memory.id}
                      type="button"
                      onClick={() => toggleMemory(memory.id)}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        overflow: 'hidden',
                        border: `1px solid ${selectedMemories.includes(memory.id) ? 'var(--loom-warm)' : 'transparent'}`,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <img
                        src={memory.fileUrl}
                        alt={memory.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      {selectedMemories.includes(memory.id) && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(176,122,74,0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span style={{ color: 'var(--loom-bone)', fontSize: 16 }}>✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                  {memories.filter(m => m.type === 'PHOTO').length === 0 && (
                    <div
                      style={{
                        gridColumn: '1/-1',
                        textAlign: 'center',
                        padding: '32px 0',
                      }}
                    >
                      <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)', fontStyle: 'italic', marginBottom: 14 }}>
                        No photos yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="loom-btn"
                        style={{ fontSize: 11, padding: '8px 18px' }}
                      >
                        Upload your first photo
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  disabled={selectedMemories.length === 0}
                  className="loom-btn"
                  style={{ opacity: selectedMemories.length === 0 ? 0.45 : 1 }}
                >
                  Continue with {selectedMemories.length} photos
                </button>
              </div>
            )}

            {/* Step 3 — review and create */}
            {wizardStep === 3 && (
              <div style={{ display: 'grid', gap: 20 }}>
                {/* Summary */}
                <div style={{ padding: '14px 18px', border: '1px solid var(--loom-rule-warm)' }}>
                  <p className="loom-serif" style={{ fontSize: 15, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 4px' }}>
                    Ready to create
                  </p>
                  <p className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-warm)', margin: 0, letterSpacing: '0.1em' }}>
                    {selectedTemplate ? `"${selectedTemplate.title}"` : 'Custom story'} · {selectedMemories.length} photos
                  </p>
                </div>

                {/* Title */}
                <div>
                  <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
                    Story title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your story a name…"
                    style={inputStyle}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description…"
                    rows={2}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>

                {/* Voice narration */}
                {voiceRecordings.length > 0 && (
                  <div>
                    <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
                      Add voice narration (optional)
                    </label>
                    <div style={{ display: 'grid', gap: 4, maxHeight: 96, overflowY: 'auto' }}>
                      {voiceRecordings.slice(0, 3).map((recording) => (
                        <button
                          key={recording.id}
                          type="button"
                          onClick={() => setSelectedVoice(selectedVoice === recording.id ? null : recording.id)}
                          style={{
                            background: 'transparent',
                            border: `1px solid ${selectedVoice === recording.id ? 'var(--loom-rule-warm)' : 'var(--loom-rule)'}`,
                            padding: '8px 12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: selectedVoice === recording.id ? 'var(--loom-warm)' : 'var(--loom-bone-dim)',
                            fontFamily: "'Source Serif 4', serif",
                            fontSize: 14,
                          }}
                        >
                          {recording.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleQuickCreate}
                  disabled={!title.trim() || selectedMemories.length === 0 || createMutation.isPending}
                  className="loom-btn"
                  style={{ opacity: !title.trim() || selectedMemories.length === 0 || createMutation.isPending ? 0.45 : 1 }}
                >
                  {createMutation.isPending ? (
                    <span style={{ fontStyle: 'italic' }}>Creating…</span>
                  ) : (
                    'Create story'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help button */}
      <OnboardingHelpButton onClick={openOnboarding} />

      {/* Feature onboarding */}
      <FeatureOnboarding
        featureKey="story-artifacts"
        isOpen={isOnboardingOpen}
        onComplete={completeOnboarding}
        onDismiss={dismissOnboarding}
      />
    </AppFrame>
  );
}

export default StoryArtifact;
