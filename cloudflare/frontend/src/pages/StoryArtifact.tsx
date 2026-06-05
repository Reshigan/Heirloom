import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Frame } from '../loom/components/Frame';
import api, { memoriesApi, voiceApi } from '../services/api';

// Quick Create wizard templates
const STORY_TEMPLATES = [
  { id: 'family-moments', title: 'Family Moments', description: 'A collection of cherished family memories', suggestedTitle: 'Our Family Story', theme: 'warm' },
  { id: 'love-story', title: 'Love Story', description: 'Your journey together', suggestedTitle: 'Our Love Story', theme: 'classic' },
  { id: 'life-journey', title: 'Life Journey', description: 'Highlights from through the years', suggestedTitle: 'A Life Well Lived', theme: 'vintage' },
  { id: 'special-moments', title: 'Special Moments', description: 'Your most treasured memories', suggestedTitle: 'Moments to Remember', theme: 'modern' },
];

// Natural-dye swatches — one per template slot + default
interface DyeSwatches {
  warm: string;
  classic: string;
  vintage: string;
  modern: string;
  default: string;
}

const DYE_SWATCHES: DyeSwatches = {
  warm:    'var(--dye-madder)',
  classic: 'var(--dye-walnut)',
  vintage: 'var(--dye-oakgall)',
  modern:  'var(--dye-woad)',
  default: 'var(--dye-iron)',
};

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
  border: '1px solid var(--rule)',
  borderRadius: 2,
  padding: '10px 14px',
  color: 'var(--bone)',
  fontFamily: 'var(--serif)',
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [theme, setTheme] = useState('classic');
  const [musicTrack, setMusicTrack] = useState<string | null>(null);

  const { data: artifacts, isLoading } = useQuery<{ artifacts: StoryArtifactItem[] }>({
    queryKey: ['story-artifacts'],
    queryFn: () => api.get('/story-artifacts').then((r: { data: { artifacts: StoryArtifactItem[] } }) => r.data),
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
      api.post('/story-artifacts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-artifacts'] });
      resetForm();
    },
  });

  const generateMutation = useMutation({
    mutationFn: (artifactId: string) => api.post(`/story-artifacts/${artifactId}/generate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['story-artifacts'] }),
  });

  const shareMutation = useMutation({
    mutationFn: (artifactId: string) => api.post(`/story-artifacts/${artifactId}/share`, { expiryDays: 7 }),
    onSuccess: (response: { data: { shareToken: string } }) => {
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/story/${response.data.shareToken}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (artifactId: string) => api.delete(`/story-artifacts/${artifactId}`),
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

  const artifactList = artifacts?.artifacts ?? [];

  return (
    <Frame left="story artifact">
      {/* Loading bar */}
      {isLoading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--warm)', opacity: 0.6 }} />
      )}

      {/* Content container */}
      <div
        style={{
          background: '#0a0a08',
          padding: '40px 48px',
          maxWidth: 640,
          margin: '0 auto',
          minHeight: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Page header */}
        <header style={{ marginBottom: 48 }}>
          <h1
            className="hl-serif"
            style={{ fontSize: 36, fontWeight: 300, margin: '0 0 28px', lineHeight: 1.15 }}
          >
            A piece of the cloth.
          </h1>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <p
              className="hl-prose"
              style={{ fontSize: 15, color: 'var(--bone-dim)', margin: 0, maxWidth: 400, lineHeight: 1.6 }}
            >
              A story artifact takes the cloth you've woven and plays it forward — a micro-documentary
              from your thread.
            </p>
            <button type="button" onClick={() => setShowCreate(true)} className="hl-btn">
              Create story
            </button>
          </div>
        </header>

        <hr className="hl-rule" style={{ margin: '0 0 36px' }} />

        {/* Artifacts list */}
        {artifactList.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {artifactList.map((artifact) => {
              const dyeColor = (DYE_SWATCHES as unknown as Record<string, string>)[artifact.theme] ?? DYE_SWATCHES['default'];
              return (
                <li key={artifact.id} style={{ padding: '28px 0', borderBottom: '1px solid var(--rule)' }}>
                  {/* Dye swatch */}
                  <div
                    aria-hidden
                    style={{
                      width: 24,
                      height: 3,
                      background: dyeColor,
                      marginBottom: 16,
                    }}
                  />
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
                          className="hl-mono"
                          style={{
                            fontSize: 10,
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: artifact.status === 'READY' ? 'var(--warm)' : 'var(--bone-faint)',
                          }}
                        >
                          {artifact.status.toLowerCase()}
                        </span>
                        <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.06em' }}>
                          {JSON.parse(artifact.selected_memories || '[]').length} photos · {artifact.view_count} views
                        </span>
                      </div>
                      <h3
                        className="hl-serif"
                        style={{ fontSize: 28, fontWeight: 400, color: 'var(--bone)', margin: '0 0 6px', lineHeight: 1.2 }}
                      >
                        {artifact.title}
                      </h3>
                      {artifact.description && (
                        <p
                          className="hl-prose"
                          style={{ fontSize: 18, color: 'var(--bone-dim)', margin: '16px 0 0', lineHeight: 1.65, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                        >
                          {artifact.description}
                        </p>
                      )}
                      {/* Author / date lines */}
                      <p
                        className="hl-serif hl-italic"
                        style={{ fontSize: 16, color: 'var(--bone-dim)', margin: '20px 0 0', fontStyle: 'italic' }}
                      >
                        your bloodline
                      </p>
                      <p
                        className="hl-mono"
                        style={{ fontSize: 10, color: 'var(--bone-faint)', margin: '8px 0 0', letterSpacing: '0.06em' }}
                      >
                        {new Date(artifact.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      {/* Download / share */}
                      <div style={{ marginTop: 28, display: 'flex', gap: 24, alignItems: 'baseline' }}>
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
                              fontFamily: 'var(--mono)',
                              fontSize: 10,
                              letterSpacing: '0.32em',
                              textTransform: 'uppercase',
                              color: 'var(--warm)',
                              opacity: generateMutation.isPending ? 0.45 : 1,
                            }}
                          >
                            generate →
                          </button>
                        )}
                        {artifact.status === 'READY' && (
                          <button
                            type="button"
                            onClick={() => shareMutation.mutate(artifact.id)}
                            className="hl-link warm"
                            style={{
                              background: 'transparent',
                              border: 0,
                              padding: 0,
                              cursor: 'pointer',
                              fontFamily: 'var(--mono)',
                              fontSize: 10,
                              letterSpacing: '0.32em',
                              textTransform: 'uppercase',
                            }}
                          >
                            share →
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
                            fontFamily: 'var(--mono)',
                            fontSize: 10,
                            letterSpacing: '0.32em',
                            textTransform: 'uppercase',
                            color: 'var(--bone-faint)',
                          }}
                        >
                          delete
                        </button>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : !isLoading ? (
          <div style={{ border: '1px solid var(--rule)', padding: '72px 36px', textAlign: 'center' }}>
            <p className="hl-serif" style={{ fontSize: 28, color: 'var(--bone-faint)', marginBottom: 20 }}>∞</p>
            <h3 className="hl-serif" style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'var(--bone)', margin: '0 0 12px' }}>
              No stories yet.
            </h3>
            <p className="hl-prose" style={{ fontSize: 15, color: 'var(--bone-dim)', margin: '0 auto 28px', maxWidth: 400 }}>
              Create your first micro-documentary from your memories.
            </p>
            <button type="button" onClick={() => setShowCreate(true)} className="hl-btn">
              Create your first story
            </button>
          </div>
        ) : null}
      </div>

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
              background: 'var(--ink)',
              border: '1px solid var(--rule)',
              padding: 40,
              maxWidth: 500,
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="hl-serif" style={{ fontSize: 22, fontWeight: 300, margin: '0 0 8px' }}>
              Share your story
            </h3>
            <p className="hl-prose" style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 20px' }}>
              Anyone with this link can view your story for 7 days.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                value={shareUrl}
                readOnly
                style={{ ...inputStyle, flex: 1, fontFamily: 'var(--mono)', fontSize: 12 }}
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="hl-btn"
                style={{ padding: '10px 18px', flexShrink: 0 }}
              >
                Copy
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShareUrl(null)}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid var(--rule)',
                padding: '10px 0',
                color: 'var(--bone-dim)',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
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
              background: 'var(--ink)',
              border: '1px solid var(--rule)',
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
                      color: 'var(--bone-faint)',
                      fontSize: 16,
                      padding: 0,
                    }}
                    aria-label="Back"
                  >
                    ←
                  </button>
                )}
                <div>
                  <h3 className="hl-serif" style={{ fontSize: 22, fontWeight: 300, margin: 0 }}>
                    {wizardStep === 1 && 'What kind of story?'}
                    {wizardStep === 2 && 'Select your photos'}
                    {wizardStep === 3 && 'Review and create'}
                  </h3>
                  <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', marginTop: 4 }}>
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
                  color: 'var(--bone-faint)',
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
                      borderBottom: '1px solid var(--rule)',
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
                      <p className="hl-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone)', margin: '0 0 4px' }}>
                        {template.title}
                      </p>
                      <p className="hl-prose" style={{ fontSize: 13, color: 'var(--bone-dim)', margin: 0 }}>
                        {template.description}
                      </p>
                    </div>
                    <span style={{ color: 'var(--bone-faint)', fontSize: 16 }}>→</span>
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
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--bone-faint)',
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
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: '1px solid var(--rule)',
                      padding: '9px 14px',
                      color: 'var(--bone-dim)',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      opacity: memories.filter(m => m.type === 'PHOTO').length === 0 ? 0.4 : 1,
                    }}
                  >
                    Auto-select recent
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--rule)',
                      padding: '9px 14px',
                      color: 'var(--bone-dim)',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      opacity: isUploading ? 0.4 : 1,
                    }}
                  >
                    {isUploading ? 'Uploading…' : 'Upload'}
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

                <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em' }}>
                  {selectedMemories.length}/10 photos selected
                </p>

                {/* Photo grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
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
                        border: `1px solid ${selectedMemories.includes(memory.id) ? 'var(--warm)' : 'transparent'}`,
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
                          <span style={{ color: 'var(--bone)', fontSize: 16 }}>✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                  {memories.filter(m => m.type === 'PHOTO').length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px 0' }}>
                      <p className="hl-prose" style={{ fontSize: 14, color: 'var(--bone-faint)', fontStyle: 'italic', marginBottom: 14 }}>
                        No photos yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="hl-btn"
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
                  className="hl-btn"
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
                <div style={{ padding: '14px 18px', border: '1px solid var(--rule)', borderLeft: '3px solid var(--warm)' }}>
                  <p className="hl-serif" style={{ fontSize: 15, fontWeight: 300, color: 'var(--bone)', margin: '0 0 4px' }}>
                    Ready to create
                  </p>
                  <p className="hl-mono" style={{ fontSize: 11, color: 'var(--warm)', margin: 0, letterSpacing: '0.1em' }}>
                    {selectedTemplate ? `"${selectedTemplate.title}"` : 'Custom story'} · {selectedMemories.length} photos
                  </p>
                </div>

                {/* Title */}
                <div>
                  <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
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
                  <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
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
                    <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
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
                            border: `1px solid ${selectedVoice === recording.id ? 'var(--warm)' : 'var(--rule)'}`,
                            padding: '8px 12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: selectedVoice === recording.id ? 'var(--warm)' : 'var(--bone-dim)',
                            fontFamily: 'var(--serif)',
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
                  className="hl-btn"
                  style={{ opacity: !title.trim() || selectedMemories.length === 0 || createMutation.isPending ? 0.45 : 1 }}
                >
                  {createMutation.isPending ? 'Creating…' : 'Create story'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Frame>
  );
}

export default StoryArtifact;
