import { useRef, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { RoomHeader } from '../loom/components/room';
import { voiceApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { dyeColor } from '../loom/dye';
import { VoiceRefine } from '../loom/components/VoiceRefine';

const FIELD_STYLE: React.CSSProperties = {
  display: 'block', width: '100%', background: 'transparent',
  border: 0, borderBottom: '1px solid var(--rule)', outline: 'none',
  color: 'var(--bone)', padding: '6px 0 4px', boxSizing: 'border-box',
  fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.5,
};

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function getWaveformHeights(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return Array.from({ length: 56 }, (_, i) => {
    h = (Math.imul(31, h) + i) | 0;
    return 4 + Math.abs(h % 40);
  });
}

interface VoiceEntry {
  id: string;
  title: string | null;
  description: string | null;
  fileUrl: string | null;
  duration: number | null;
  transcript: string | null;
  createdAt: string;
  metadata?: { dye?: string } | null;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

export function VoiceRoom() {
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const wantId = searchParams.get('id');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const deleteVoice = useMutation({
    mutationFn: (id: string) => voiceApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['voice'] });
      queryClient.invalidateQueries({ queryKey: ['weft-voice'] });
      if (playingId === id) { audioRef.current?.pause(); setPlayingId(null); }
      setConfirmDeleteId(null);
    },
  });

  const updateVoice = useMutation({
    mutationFn: ({ id, title, description }: { id: string; title: string; description: string }) =>
      voiceApi.update(id, { title: title.trim() || null, description: description.trim() || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice'] });
      setEditingId(null);
      setEditError(null);
    },
    onError: (err: any) => setEditError(err?.response?.data?.error ?? 'could not save'),
  });

  function handlePlay(entryId: string) {
    if (playingId === entryId) {
      // stop
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingId(null);
      setCurrentTime(0);
      setAudioDuration(0);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentTime(0);
      setAudioDuration(0);
      setPlayingId(entryId);
    }
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['voice'],
    queryFn: () => voiceApi.getAll({ limit: 200 }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const recordings: VoiceEntry[] = (data as { data: VoiceEntry[] } | null)?.data ?? [];

  // Pause audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // A recording tapped on the cloth arrives as ?id=<id> — open its player and
  // bring it into view once the list has rendered.
  useEffect(() => {
    if (!wantId || recordings.length === 0) return;
    setPlayingId(wantId);
    const el = document.getElementById(`voice-${wantId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [wantId, recordings.length]);

  const topbarLeft = (
    <Breadcrumbs trail={[{ label: 'cloth', to: '/loom/weft' }, { label: 'voice' }]} />
  );

  return (
    <ClothShell topbarLeft={topbarLeft} topbarRight={<UserMenu />}>
      {/* Hairline loading bar */}
      <div
        aria-hidden
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 1,
          background: 'var(--warm)', opacity: isLoading ? 0.6 : 0,
          transition: `opacity 360ms ${EASE}`, zIndex: 30, pointerEvents: 'none',
        }}
      />

      <div style={{ padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)', maxWidth: 'var(--page-max-prose)', margin: '0 auto' }}>
        <RoomHeader
          eyebrow="speak it"
          title="Voices waiting to be heard."
          className="hl-room-header"
        />
        <style>{`.hl-room-header { margin-bottom: 40px; } @media (hover:hover){ .hl-voice-stop:hover{ border-color: var(--warm) !important; color: var(--warm-bright) !important; } }`}</style>

        {/* CTA */}
        <Link
          to="/record"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderLeft: '3px solid var(--warm)', padding: '12px 16px',
            marginBottom: 56, textDecoration: 'none',
          }}
        >
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: 'var(--warm)',
          }}>
            record a voice thread
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)' }}>→</span>
        </Link>

        {/* Error state */}
        {isError && (
          <p className="hl-mono" style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24 }}>
            could not load recordings — try refreshing
          </p>
        )}

        {/* Empty state */}
        {!isLoading && !isError && recordings.length === 0 && (
          <div style={{ paddingTop: 40 }}>
            <p className="hl-serif hl-italic" style={{
              fontSize: 'var(--type-body-lg)',
              fontWeight: 300, color: 'var(--bone-faint)', lineHeight: 1.7, margin: '0 0 4px',
            }}>
              Record your voice.
            </p>
            <p className="hl-serif hl-italic" style={{
              fontSize: 'var(--type-body-lg)',
              fontWeight: 300, color: 'var(--bone-faint)', lineHeight: 1.7, margin: 0,
            }}>
              Your family will hear it long after you're gone.
            </p>
            <Link
              to="/record"
              className="hl-btn"
              style={{ textDecoration: 'none', display: 'inline-block', marginTop: 20 }}
            >
              record →
            </Link>
          </div>
        )}

        {/* Voice list — each recording as a focused "speak it" panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 72 }}>
          {recordings.map((entry) => {
            const dye = dyeColor(entry.id, entry.metadata);
            const isPlaying = playingId === entry.id;
            const duration = formatDuration(entry.duration);
            const waveformHeights = getWaveformHeights(entry.id);
            const isEditing = editingId === entry.id;

            return (
              <article
                key={entry.id}
                id={`voice-${entry.id}`}
                className="hl-voice-card"
                style={{
                  borderLeft: `3px solid ${dye}`,
                  paddingLeft: 20,
                }}
              >
                {/* Eyebrow row — VOICE · 0:42 + edit/delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em',
                    textTransform: 'uppercase', color: 'var(--bone-faint)',
                  }}>
                    {duration ? `voice · ${duration}` : 'voice'}
                  </span>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(entry.id);
                          setEditTitle(entry.title ?? '');
                          setEditDesc(entry.description ?? '');
                          setEditError(null);
                        }}
                        style={{
                          background: 'transparent', border: 0,
                          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                          textTransform: 'uppercase', color: 'var(--bone-low)',
                          padding: '4px 0', cursor: 'pointer',
                        }}
                      >
                        edit
                      </button>
                    )}
                    {confirmDeleteId === entry.id ? (
                      <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => deleteVoice.mutate(entry.id)}
                          disabled={deleteVoice.isPending}
                          style={{
                            background: 'transparent', border: 0, padding: '4px 0',
                            cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 9,
                            letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--danger)',
                          }}
                        >
                          {deleteVoice.isPending ? '…' : 'yes →'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          style={{
                            background: 'transparent', border: 0, padding: '4px 0',
                            cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 9,
                            letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)',
                          }}
                        >
                          no
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(entry.id)}
                        style={{
                          background: 'transparent', border: 0, padding: '4px 0',
                          cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 9,
                          letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-low)',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-low)'; }}
                      >
                        delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Optional title — serif, italic */}
                {!isEditing && entry.title && (
                  <p className="hl-serif hl-italic" style={{
                    fontSize: 16,
                    fontWeight: 300, color: 'var(--bone)', lineHeight: 1.4, margin: '0 0 24px',
                  }}>
                    {entry.title}
                  </p>
                )}

                {/* Waveform — the one warm gesture, full-width row of thin bars */}
                <div
                  aria-hidden
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    height: 64, marginBottom: 28,
                  }}
                >
                  {waveformHeights.map((h, i) => {
                    // When playing, light the bars up to the current playback position.
                    const progress = isPlaying && audioDuration > 0 ? currentTime / audioDuration : 0;
                    const played = isPlaying && i / waveformHeights.length <= progress;
                    return (
                      <div
                        key={i}
                        style={{
                          width: 2, height: h,
                          background: 'var(--warm)',
                          opacity: played ? 0.95 : isPlaying ? 0.5 : 0.55,
                          flexShrink: 0,
                          transition: `opacity 360ms ${EASE}`,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Timecode — mono, centered, large */}
                <div style={{
                  textAlign: 'center',
                  fontFamily: 'var(--mono)', fontSize: 22, letterSpacing: '0.08em',
                  color: 'var(--bone)', marginBottom: 28,
                }}>
                  {isPlaying && audioDuration > 0 ? formatTime(currentTime) : (duration || '0:00')}
                </div>

                {/* Play / stop control — warm circular, centered */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
                  <button
                    type="button"
                    aria-label={isPlaying ? 'Stop voice recording' : 'Play voice recording'}
                    aria-expanded={isPlaying}
                    aria-controls={`audio-${entry.id}`}
                    onClick={() => handlePlay(entry.id)}
                    className="hl-voice-stop"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${isPlaying ? 'var(--warm)' : 'var(--warm-dim)'}`,
                      borderRadius: '50%',
                      width: 60, height: 60,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)', fontSize: 15,
                      color: 'var(--warm)',
                      lineHeight: 1,
                      transition: `color 180ms ${EASE}, border-color 180ms ${EASE}`,
                    }}
                  >
                    {isPlaying ? '■' : '▶'}
                  </button>
                </div>

                {/* Hidden audio element + scrub progress when playing */}
                {isPlaying && entry.fileUrl && (
                  <div id={`audio-${entry.id}`} style={{ animation: `hl-fade 360ms ${EASE}`, marginBottom: 36 }}>
                    <div style={{ height: 1, background: 'var(--rule)', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: 1, background: 'var(--warm)', width: `${audioDuration ? (currentTime / audioDuration) * 100 : 0}%`, transition: `width 360ms ${EASE}` }} />
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 8, fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--bone-faint)' }}>
                      {formatTime(currentTime)} / {formatTime(audioDuration)}
                    </div>
                    <audio
                      ref={(el) => { audioRef.current = el; }}
                      src={entry.fileUrl}
                      autoPlay
                      style={{ display: 'none' }}
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
                      onEnded={() => {
                        setPlayingId(null);
                        setCurrentTime(0);
                        setAudioDuration(0);
                      }}
                    />
                  </div>
                )}

                {/* WHAT YOU SAID — serif heading + transcript prose */}
                {!isEditing && entry.transcript && (
                  <div>
                    <h2 className="hl-serif" style={{
                      fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      color: 'var(--bone)', lineHeight: 1.1, margin: '0 0 22px',
                    }}>
                      What you said
                    </h2>
                    <p className="hl-serif" style={{
                      fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 300,
                      color: 'var(--bone-dim)', lineHeight: 1.72, margin: 0,
                    }}>
                      {entry.transcript}
                    </p>
                  </div>
                )}

                {/* FIND BETTER WORDS — refine entry point */}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(entry.id);
                      setEditTitle(entry.title ?? '');
                      setEditDesc(entry.description ?? entry.transcript ?? '');
                      setEditError(null);
                    }}
                    style={{
                      background: 'transparent', border: 0, padding: '4px 0',
                      marginTop: entry.transcript ? 28 : 0,
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em',
                      textTransform: 'uppercase', color: 'var(--warm)',
                    }}
                  >
                    find better words
                  </button>
                )}

                {/* Inline edit / refine form */}
                {isEditing && (
                  <div style={{ marginTop: 8 }}>
                    <input
                      value={editTitle}
                      onChange={(e) => { setEditTitle(e.target.value); setEditError(null); }}
                      placeholder="title — optional"
                      aria-label="Title"
                      autoFocus
                      style={{ ...FIELD_STYLE, marginBottom: 12 }}
                    />
                    <textarea
                      value={editDesc}
                      onChange={(e) => { setEditDesc(e.target.value); setEditError(null); }}
                      placeholder="description — optional"
                      aria-label="Description"
                      rows={3}
                      style={{ ...FIELD_STYLE, resize: 'none' }}
                    />
                    {editError && (
                      <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--danger)', margin: '4px 0 0', letterSpacing: '0.1em' }}>
                        {editError}
                      </p>
                    )}
                    <div style={{ marginTop: 16 }}>
                      <VoiceRefine
                        kind="memory"
                        onPick={(text) => { setEditDesc((prev) => (prev.trim() ? `${prev.trim()}\n\n${text}` : text)); setEditError(null); }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 20, alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => updateVoice.mutate({ id: entry.id, title: editTitle, description: editDesc })}
                        disabled={updateVoice.isPending}
                        style={{
                          background: 'transparent', border: '1px solid var(--warm)', padding: '8px 16px',
                          cursor: updateVoice.isPending ? 'wait' : 'pointer',
                          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
                          textTransform: 'uppercase', color: 'var(--warm)',
                          opacity: updateVoice.isPending ? 0.6 : 1,
                        }}
                      >
                        {updateVoice.isPending ? 'saving…' : 'save →'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingId(null); setEditError(null); }}
                        style={{
                          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
                          textTransform: 'uppercase', color: 'var(--bone-faint)',
                        }}
                      >
                        cancel
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </ClothShell>
  );
}
