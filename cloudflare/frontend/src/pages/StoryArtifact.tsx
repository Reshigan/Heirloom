import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { ProgressHair } from '../loom/components/ProgressHair';
import api, { memoriesApi, voiceApi } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';
import { type Memory, type VoiceRecording } from '../types';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
import { dyeForId } from '../loom/dye';
import { useFocusTrap } from '../lib/useFocusTrap';

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

// Underline-only flat input — no box, warm caret, bone text
const flatInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 0,
  borderBottom: '1px solid var(--rule)',
  padding: '10px 0',
  color: 'var(--bone)',
  fontFamily: 'var(--serif)',
  fontSize: 17,
  lineHeight: 1.7,
  outline: 'none',
  boxSizing: 'border-box',
  caretColor: 'var(--warm)',
  transition: 'border-color 180ms var(--ease)',
};

// Mono affordance button — quiet text, no border, no background
const monoAffordance: React.CSSProperties = {
  background: 'transparent',
  border: 0,
  padding: '12px 0',
  minHeight: 44,
  cursor: 'pointer',
  fontFamily: 'var(--mono)',
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  lineHeight: 1,
};

export function StoryArtifact() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const [wizardStep, setWizardStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof STORY_TEMPLATES[0] | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [theme, setTheme] = useState('classic');
  const [musicTrack, setMusicTrack] = useState<string | null>(null);

  // Modal overlays: canonical focus trap + Escape close, focus first field on open.
  const shareRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);
  useFocusTrap(shareRef, () => setShareUrl(null), !!shareUrl);
  useFocusTrap(createRef, () => resetForm(), showCreate);

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
    onError: (err: any) => setMutationError(err?.response?.data?.error ?? 'something went wrong'),
  });

  const generateMutation = useMutation({
    mutationFn: (artifactId: string) => api.post(`/story-artifacts/${artifactId}/generate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['story-artifacts'] }),
    onError: (err: any) => setMutationError(err?.response?.data?.error ?? 'something went wrong'),
  });

  const shareMutation = useMutation({
    mutationFn: (artifactId: string) => api.post(`/story-artifacts/${artifactId}/share`, { expiryDays: 7 }),
    onSuccess: (response: { data: { shareToken: string } }) => {
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/story/${response.data.shareToken}`);
    },
    onError: (err: any) => setMutationError(err?.response?.data?.error ?? 'something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (artifactId: string) => api.delete(`/story-artifacts/${artifactId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['story-artifacts'] }),
    onError: (err: any) => setMutationError(err?.response?.data?.error ?? 'something went wrong'),
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
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const artifactList = artifacts?.artifacts ?? [];

  return (
    <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'story artifacts' }]} />}>
      {/* ProgressHair — 1px hairline while loading, no spinner */}
      {isLoading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, width: '100%' }}>
          <ProgressHair />
        </div>
      )}

      {/* Reading column */}
      <div
        style={{
          background: 'var(--ink)',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'var(--page-max-prose)',
          margin: '0 auto',
          minHeight: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Page header — READING eyebrow + serif headline */}
        <header style={{ marginBottom: 56 }}>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              marginBottom: 20,
            }}
          >
            Story Artifacts
          </div>
          <h1
            style={{
              fontFamily: 'var(--serif-display)',
              fontSize: 'clamp(30px, 6vw, 44px)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: 'var(--bone)',
              margin: '0 0 14px',
            }}
          >
            A piece of the Deep.
          </h1>
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 17,
              lineHeight: 1.6,
              color: 'var(--bone-dim)',
              margin: '0 0 32px',
              maxWidth: '38em',
            }}
          >
            A story artifact takes the Deep you've gathered and plays it forward — a micro-documentary from your thread.
          </p>
          {/* Create affordance — quiet mono warm text */}
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            style={{ ...monoAffordance, color: 'var(--warm)', fontSize: 10 }}
          >
            Create story →
          </button>
        </header>

        <hr style={{ border: 0, borderTop: '1px solid var(--rule)', margin: '0 0 40px' }} />

        {/* Artifact list — READING archetype: each story as a reading article with dye margin thread */}
        {artifactList.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {artifactList.map((artifact) => {
              // Resolve dye from theme mapping, fall back to id-hash dye
              const themeDye = (DYE_SWATCHES as unknown as Record<string, string>)[artifact.theme] ?? DYE_SWATCHES['default'];
              const idDyeColor = `var(--dye-${dyeForId(artifact.id)})`;
              const marginColor = themeDye || idDyeColor;
              const year = new Date(artifact.created_at).getFullYear();
              let memCount = 0;
              try { memCount = (JSON.parse(artifact.selected_memories || '[]') as unknown[]).length; } catch { memCount = 0; }

              return (
                <li key={artifact.id} style={{ marginBottom: 56 }}>
                  {/* READING dye margin thread — 3px left border, paddingLeft 24 */}
                  <article
                    style={{
                      borderLeft: `3px solid ${marginColor}`,
                      paddingLeft: 24,
                    }}
                  >
                    {/* Mono warm subline: "A STORY BY YOUR BLOODLINE · <YEAR>" */}
                    <p
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: 'var(--warm)',
                        margin: '0 0 14px',
                      }}
                    >
                      A Story by Your Bloodline · {year}
                    </p>

                    {/* Serif headline — clamp(30,6vw,44) */}
                    <h2
                      style={{
                        fontFamily: 'var(--serif-display)',
                        fontSize: 'clamp(30px, 6vw, 44px)',
                        fontWeight: 500,
                        lineHeight: 1.1,
                        letterSpacing: '-0.01em',
                        color: 'var(--bone)',
                        margin: '0 0 10px',
                      }}
                    >
                      {artifact.title}
                    </h2>

                    {/* Status meta rail */}
                    <p
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: artifact.status === 'READY' ? 'var(--warm)' : 'var(--bone-faint)',
                        margin: '0 0 18px',
                      }}
                    >
                      {artifact.status.toLowerCase()}
                      <span style={{ color: 'var(--bone-faint)', marginLeft: 16 }}>
                        {memCount} photos · {artifact.view_count} views
                      </span>
                    </p>

                    {/* Body — serif 18px/1.75 justified ~62ch — shows description as reading body */}
                    {artifact.description && (
                      <p
                        style={{
                          fontFamily: 'var(--serif)',
                          fontSize: 18,
                          lineHeight: 1.75,
                          color: 'var(--bone)',
                          textAlign: 'justify',
                          maxWidth: '62ch',
                          margin: '0 0 24px',
                        }}
                      >
                        {artifact.description}
                      </p>
                    )}

                    {/* Date as italic serif dim byline */}
                    <p
                      style={{
                        fontFamily: 'var(--serif)',
                        fontStyle: 'italic',
                        fontSize: 15,
                        color: 'var(--bone-dim)',
                        margin: '0 0 24px',
                      }}
                    >
                      {new Date(artifact.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>

                    {/* Quiet mono affordances below — same onClick wired */}
                    <div style={{ display: 'flex', gap: 28, alignItems: 'baseline' }}>
                      {artifact.status === 'DRAFT' && (
                        <button
                          type="button"
                          onClick={() => generateMutation.mutate(artifact.id)}
                          disabled={generateMutation.isPending}
                          style={{ ...monoAffordance, color: 'var(--warm)', opacity: generateMutation.isPending ? 0.45 : 1 }}
                        >
                          generate →
                        </button>
                      )}
                      {artifact.status === 'READY' && (
                        <button
                          type="button"
                          onClick={() => shareMutation.mutate(artifact.id)}
                          style={{ ...monoAffordance, color: 'var(--warm)' }}
                        >
                          share →
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(artifact.id)}
                        style={{ ...monoAffordance, color: 'var(--bone-faint)' }}
                      >
                        delete
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : !isLoading ? (
          /* Empty state — centered serif italic + mono create prompt */
          <div style={{ paddingTop: 72, paddingBottom: 72, textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 22,
                fontWeight: 300,
                color: 'var(--bone-dim)',
                margin: '0 0 28px',
              }}
            >
              No stories yet.
            </p>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 16,
                color: 'var(--bone-faint)',
                fontStyle: 'italic',
                margin: '0 0 32px',
              }}
            >
              Create your first micro-documentary from your memories.
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              style={{ ...monoAffordance, color: 'var(--warm)', fontSize: 10 }}
            >
              Create your first story →
            </button>
          </div>
        ) : null}

        {/* WaxSeal foot */}
        <div style={{ marginTop: 80, marginBottom: 24 }}>
          <WaxSeal size={28} />
        </div>
      </div>

      {/* ── Share URL overlay ── */}
      {shareUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--ink-translucent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
          onClick={() => setShareUrl(null)}
        >
          <div
            ref={shareRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-story-title"
            style={{
              background: 'var(--ink)',
              border: '1px solid var(--rule)',
              padding: '48px 40px',
              maxWidth: 500,
              width: '100%',
              boxSizing: 'border-box',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Mono eyebrow */}
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--warm)', margin: '0 0 16px' }}>
              Share your story
            </p>
            {/* Serif headline */}
            <h3 id="share-story-title" style={{ fontFamily: 'var(--serif-display)', fontSize: 26, fontWeight: 500, color: 'var(--bone)', margin: '0 0 8px' }}>
              Live for 7 days.
            </h3>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--bone-dim)', margin: '0 0 28px' }}>
              Anyone with this link can view your story.
            </p>
            {/* Share URL — mono read-only input + copy affordance */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'baseline' }}>
              <input
                type="text"
                value={shareUrl}
                readOnly
                aria-label="Share link"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 0,
                  borderBottom: '1px solid var(--rule)',
                  padding: '8px 0',
                  color: 'var(--bone-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.04em',
                  outline: 'none',
                  minWidth: 0,
                }}
              />
              <button
                type="button"
                onClick={() => copyToClipboard(shareUrl).catch(() => {})}
                style={{ ...monoAffordance, color: 'var(--warm)', flexShrink: 0 }}
              >
                copy →
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShareUrl(null)}
              style={{ ...monoAffordance, color: 'var(--bone-faint)', fontSize: 10 }}
            >
              done
            </button>
          </div>
        </div>
      )}

      {/* ── Create wizard overlay ── */}
      {showCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--ink-translucent)',
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
            ref={createRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-wizard-title"
            style={{
              background: 'var(--ink)',
              border: '1px solid var(--rule)',
              padding: '48px 40px',
              maxWidth: 580,
              width: '100%',
              margin: '32px auto',
              boxSizing: 'border-box',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Wizard header — mono eyebrow + step label + close */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep - 1)}
                    aria-label="Back"
                    style={{ ...monoAffordance, color: 'var(--bone-faint)', fontSize: 14 }}
                  >
                    ←
                  </button>
                )}
                <div>
                  <h3 id="create-wizard-title" className="hl-serif" style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, color: 'var(--bone)', margin: '0 0 6px', lineHeight: 1.1 }}>
                    {wizardStep === 1 && 'What kind of story?'}
                    {wizardStep === 2 && 'Select your photos'}
                    {wizardStep === 3 && 'Review and create'}
                  </h3>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
                    Step {wizardStep} of 3
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => resetForm()}
                aria-label="Close"
                style={{ ...monoAffordance, color: 'var(--bone-faint)', fontSize: 10 }}
              >
                close
              </button>
            </div>

            {/* Step 1 — template selection */}
            {wizardStep === 1 && (
              <div>
                {STORY_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 16,
                      width: '100%',
                      background: 'transparent',
                      border: 0,
                      borderBottom: '1px solid var(--rule)',
                      padding: '18px 0',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <p style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, color: 'var(--bone)', margin: '0 0 4px' }}>
                        {template.title}
                      </p>
                      <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--bone-dim)', margin: 0 }}>
                        {template.description}
                      </p>
                    </div>
                    <span style={{ color: 'var(--bone-faint)', fontFamily: 'var(--mono)', fontSize: 12 }}>→</span>
                  </button>
                ))}
                <div style={{ paddingTop: 18 }}>
                  <button
                    type="button"
                    onClick={() => { setWizardStep(2); setSelectedTemplate(null); }}
                    style={{ ...monoAffordance, color: 'var(--bone-faint)', fontSize: 10, padding: '10px 0' }}
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
                <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                  <button
                    type="button"
                    onClick={handleAutoSelectPhotos}
                    disabled={memories.filter(m => m.type === 'PHOTO').length === 0}
                    style={{
                      ...monoAffordance,
                      color: memories.filter(m => m.type === 'PHOTO').length === 0 ? 'var(--bone-faint)' : 'var(--bone-dim)',
                      opacity: memories.filter(m => m.type === 'PHOTO').length === 0 ? 0.4 : 1,
                    }}
                  >
                    Auto-select recent
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{ ...monoAffordance, color: 'var(--bone-dim)', opacity: isUploading ? 0.4 : 1 }}
                  >
                    {isUploading ? 'Settling…' : 'Attach'}
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

                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', margin: 0 }}>
                  {selectedMemories.length}/10 photos selected
                </p>

                {uploadError && (
                  <p
                    role="alert"
                    style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--warm)', letterSpacing: '0.06em' }}
                  >
                    {uploadError}
                  </p>
                )}

                {/* Photo grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
                    gap: 4,
                    maxHeight: 240,
                    overflowY: 'auto',
                    background: 'var(--ink-card)',
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
                        src={memory.fileUrl ?? undefined}
                        alt={memory.title ?? 'memory photo'}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      {selectedMemories.includes(memory.id) && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--ink)',
                            border: '1px solid var(--warm)',
                            color: 'var(--warm)',
                            fontFamily: 'var(--mono)',
                            fontSize: 10,
                            lineHeight: 1,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            padding: '4px 6px',
                          }}
                        >
                          done
                        </span>
                      )}
                    </button>
                  ))}
                  {memories.filter(m => m.type === 'PHOTO').length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px 0' }}>
                      <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--bone-faint)', marginBottom: 18 }}>
                        No photos yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ ...monoAffordance, color: 'var(--warm)', fontSize: 10 }}
                      >
                        Upload your first photo →
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  disabled={selectedMemories.length === 0}
                  style={{
                    ...monoAffordance,
                    color: 'var(--warm)',
                    fontSize: 10,
                    opacity: selectedMemories.length === 0 ? 0.45 : 1,
                    paddingTop: 12,
                    paddingBottom: 12,
                    borderTop: '1px solid var(--rule)',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  Continue with {selectedMemories.length} photos →
                </button>
              </div>
            )}

            {/* Step 3 — review and create */}
            {wizardStep === 3 && (
              <div style={{ display: 'grid', gap: 24 }}>
                {/* Summary — left dye border note */}
                <div style={{ borderLeft: '3px solid var(--warm)', paddingLeft: 16 }}>
                  <p style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 400, color: 'var(--bone)', margin: '0 0 4px' }}>
                    Ready to create
                  </p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--warm)', margin: 0 }}>
                    {selectedTemplate ? `"${selectedTemplate.title}"` : 'Custom story'} · {selectedMemories.length} photos
                  </p>
                </div>

                {/* Title — flat underline input */}
                <div>
                  <label style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-faint)', display: 'block', marginBottom: 10 }}>
                    Story title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your story a name…"
                    style={{ ...flatInputStyle }}
                  />
                </div>

                {/* Description — flat underline textarea */}
                <div>
                  <label style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-faint)', display: 'block', marginBottom: 10 }}>
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description…"
                    rows={2}
                    style={{ ...flatInputStyle, resize: 'none' }}
                  />
                </div>

                {/* Voice narration — shown only when voiceRecordings exist */}
                {voiceRecordings.length > 0 && (
                  <div>
                    <label style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-faint)', display: 'block', marginBottom: 10 }}>
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
                            border: 0,
                            borderBottom: `1px solid ${selectedVoice === recording.id ? 'var(--warm)' : 'var(--rule)'}`,
                            padding: '10px 0',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: selectedVoice === recording.id ? 'var(--warm)' : 'var(--bone-dim)',
                            fontFamily: 'var(--serif)',
                            fontSize: 15,
                          }}
                        >
                          {recording.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mutation error — inline mono, warm (not danger/red) */}
                {mutationError && (
                  <p
                    role="alert"
                    style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--warm)', letterSpacing: '0.06em' }}
                  >
                    {mutationError}
                  </p>
                )}

                {/* Primary create affordance */}
                <button
                  type="button"
                  onClick={handleQuickCreate}
                  disabled={!title.trim() || selectedMemories.length === 0 || createMutation.isPending}
                  style={{
                    ...monoAffordance,
                    color: 'var(--warm)',
                    fontSize: 11,
                    paddingTop: 14,
                    paddingBottom: 14,
                    borderTop: '1px solid var(--rule)',
                    width: '100%',
                    textAlign: 'left',
                    opacity: !title.trim() || selectedMemories.length === 0 || createMutation.isPending ? 0.45 : 1,
                  }}
                >
                  {createMutation.isPending ? 'Creating…' : 'Create story →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </ClothShell>
  );
}

export default StoryArtifact;
