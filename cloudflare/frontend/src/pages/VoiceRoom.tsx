import { useRef, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { voiceApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { dyeColor } from '../loom/dye';
import { VoiceRefine } from '../loom/components/VoiceRefine';
import { CosmicHeader, WarmDot, WaxSeal } from '../loom/cosmic/CosmicUI';

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

// A deterministic warm-filament waveform derived from the recording id, scrubbed
// by playback progress. This IS the audio's content (not backdrop) — amber bars
// that the elapsed portion lights to warm-bright as the recording plays.
function VoiceWaveform({ seed, progress }: { seed: string; progress: number }) {
  const bars = 56;
  // Hash the id into a stable pseudo-random sequence so each recording owns its
  // own silhouette, steady across renders.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const heights: number[] = [];
  for (let i = 0; i < bars; i++) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    const n = ((h >>> 0) % 1000) / 1000;
    // Centre-weighted envelope so the waveform swells toward the middle.
    const env = Math.sin((i / (bars - 1)) * Math.PI);
    heights.push(0.18 + (0.2 + n * 0.8) * env);
  }
  return (
    <div
      aria-hidden
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 2, height: 72, margin: '0 auto', maxWidth: 320,
      }}
    >
      {heights.map((ratio, i) => {
        const lit = i / bars <= progress;
        return (
          <span
            key={i}
            style={{
              flex: '1 1 0', height: `${Math.round(ratio * 100)}%`,
              minWidth: 1, borderRadius: 1,
              background: lit ? 'var(--warm)' : 'var(--copper-label)',
              opacity: lit ? 0.95 : 0.55,
              transition: `opacity 180ms ${EASE}, background 180ms ${EASE}`,
            }}
          />
        );
      })}
    </div>
  );
}

// The circular outlined play/pause control — a ring with a ▷ glyph, in the ∞ idiom.
function PlayRing({ playing }: { playing: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 64, height: 64, borderRadius: '50%',
        border: '1px solid var(--warm)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
        color: 'var(--warm)', transition: `border-color 180ms ${EASE}, color 180ms ${EASE}`,
      }}
    >
      {playing ? (
        <span style={{ display: 'flex', gap: 4 }}>
          <span style={{ width: 3, height: 16, background: 'currentColor' }} />
          <span style={{ width: 3, height: 16, background: 'currentColor' }} />
        </span>
      ) : (
        <span
          style={{
            width: 0, height: 0, marginLeft: 3,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderLeft: '13px solid currentColor',
          }}
        />
      )}
    </span>
  );
}

export function VoiceRoom() {
  const { isAuthenticated, user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const wantId = searchParams.get('id');
  const wantEdit = searchParams.get('edit') === '1';
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
    const el = document.getElementById(`voice-${wantId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Arriving with ?edit=1 (e.g. "edit" from the Reading Room) opens the
    // inline refine form pre-filled, instead of just the player.
    if (wantEdit) {
      const entry = recordings.find((r) => r.id === wantId);
      if (entry) {
        setEditingId(entry.id);
        setEditTitle(entry.title ?? '');
        setEditDesc(entry.description ?? entry.transcript ?? '');
        setEditError(null);
        return;
      }
    }
    setPlayingId(wantId);
  }, [wantId, wantEdit, recordings.length]);

  const topbarLeft = (
    <Breadcrumbs trail={[{ label: 'cloth', to: '/loom/weft' }, { label: 'voice' }]} />
  );

  const author = (user?.firstName ?? '').trim();
  const count = recordings.length;
  const eyebrow = isLoading
    ? 'voices'
    : `${count} ${count === 1 ? 'voice' : 'voices'}`;

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
        <CosmicHeader
          eyebrow={eyebrow}
          title="Voices waiting to be heard."
        />
        <style>{`
          @media (hover:hover){
            .hl-voice-play:hover{ color: var(--warm-bright) !important; }
            .hl-voice-row:hover .hl-voice-title{ color: var(--warm-bright) !important; }
          }
        `}</style>

        {/* CTA */}
        <Link
          to="/record"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderLeft: '3px solid var(--warm)', padding: '12px 16px',
            marginBottom: 48, textDecoration: 'none',
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
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24 }}>
            could not load recordings — try refreshing
          </p>
        )}

        {/* Empty state */}
        {!isLoading && !isError && recordings.length === 0 && (
          <div style={{ paddingTop: 24, textAlign: 'center' }}>
            <p className="hl-serif hl-italic" style={{
              fontFamily: 'var(--serif)', fontStyle: 'italic',
              fontSize: 'var(--type-body-lg)',
              fontWeight: 300, color: 'var(--bone-dim)', lineHeight: 1.7, margin: '0 0 4px',
            }}>
              Record your voice.
            </p>
            <p className="hl-serif hl-italic" style={{
              fontFamily: 'var(--serif)', fontStyle: 'italic',
              fontSize: 'var(--type-body-lg)',
              fontWeight: 300, color: 'var(--bone-dim)', lineHeight: 1.7, margin: 0,
            }}>
              Your family will hear it long after you're gone.
            </p>
            <Link
              to="/record"
              style={{
                textDecoration: 'none', display: 'inline-block', marginTop: 24,
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.24em',
                textTransform: 'uppercase', color: 'var(--warm)',
              }}
            >
              record →
            </Link>
          </div>
        )}

        {/* Voice ledger — recordings as a vertical row list */}
        {recordings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recordings.map((entry) => {
              const dye = dyeColor(entry.id, entry.metadata);
              const isPlaying = playingId === entry.id;
              const duration = formatDuration(entry.duration);
              const isEditing = editingId === entry.id;
              const year = new Date(entry.createdAt).getFullYear();
              const titleText = entry.title || 'Untitled recording';

              return (
                <article
                  key={entry.id}
                  id={`voice-${entry.id}`}
                  className="hl-voice-row"
                  style={{
                    borderLeft: `3px solid ${dye}`,
                    paddingLeft: 18,
                    borderBottom: '1px solid var(--rule)',
                  }}
                >
                  {/* Ledger row — serif title left; mono right cluster */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap',
                      padding: '16px 0',
                    }}
                  >
                    {/* Title — serif, click-through toggles playback */}
                    <button
                      type="button"
                      aria-label={isPlaying ? 'Stop voice recording' : 'Play voice recording'}
                      aria-expanded={isPlaying}
                      aria-controls={`audio-${entry.id}`}
                      onClick={() => handlePlay(entry.id)}
                      style={{
                        flex: '1 1 240px', minWidth: 0, textAlign: 'left',
                        background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                      }}
                    >
                      <span
                        className="hl-voice-title"
                        style={{
                          fontFamily: 'var(--serif)',
                          fontStyle: entry.title ? 'normal' : 'italic',
                          fontWeight: 400, fontSize: 19, lineHeight: 1.3,
                          color: 'var(--bone)', display: 'block',
                          transition: `color 180ms ${EASE}`,
                        }}
                      >
                        {titleText}
                      </span>
                    </button>

                    {/* Right cluster — year · dye dot · author · duration */}
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 9, whiteSpace: 'nowrap',
                      fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em',
                      flex: '0 0 auto',
                    }}>
                      <span style={{ color: 'var(--bone-faint)' }}>{year}</span>
                      <WarmDot color={dye} size={5} />
                      {author && (
                        <span style={{ color: dye, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                          {author}
                        </span>
                      )}
                      {duration && <span style={{ color: 'var(--bone-faint)' }}>{duration}</span>}
                    </span>
                  </div>

                  {/* Quiet mono affordance row — PLAY/PAUSE + edit / delete */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
                    paddingBottom: 16,
                  }}>
                    {!isPlaying && (
                      <button
                        type="button"
                        aria-label="Play voice recording"
                        aria-expanded={isPlaying}
                        aria-controls={`audio-${entry.id}`}
                        onClick={() => handlePlay(entry.id)}
                        className="hl-voice-play"
                        disabled={!entry.fileUrl}
                        style={{
                          background: 'transparent', border: 0, padding: 0,
                          cursor: entry.fileUrl ? 'pointer' : 'default',
                          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em',
                          textTransform: 'uppercase',
                          color: 'var(--warm)',
                          opacity: entry.fileUrl ? 1 : 0.4,
                          transition: `color 180ms ${EASE}`,
                        }}
                      >
                        play
                      </button>
                    )}

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
                          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                          textTransform: 'uppercase', color: 'var(--bone-dim)',
                        }}
                      >
                        edit
                      </button>
                    )}

                    {confirmDeleteId === entry.id ? (
                      <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => deleteVoice.mutate(entry.id)}
                          disabled={deleteVoice.isPending}
                          style={{
                            background: 'transparent', border: 0, padding: 0,
                            cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 9,
                            letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)',
                          }}
                        >
                          {deleteVoice.isPending ? '…' : 'yes →'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          style={{
                            background: 'transparent', border: 0, padding: 0,
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
                          background: 'transparent', border: 0, padding: 0,
                          cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 9,
                          letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-dim)',
                        }}
                      >
                        delete
                      </button>
                    )}
                  </div>

                  {/* Playing — the focused player: WHAT YOU SAID eyebrow, big serif
                      timer, the warm content waveform, a circular play/pause ring. */}
                  {isPlaying && entry.fileUrl && (
                    <div id={`audio-${entry.id}`} style={{ animation: `hl-fade 360ms ${EASE}`, paddingBottom: 28, textAlign: 'center' }}>
                      <div style={{
                        fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.28em',
                        textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 22,
                      }}>
                        what you said
                      </div>
                      <div style={{
                        fontFamily: 'var(--serif)', fontWeight: 300, fontVariationSettings: '"opsz" 40',
                        fontSize: 'clamp(40px, 11vw, 66px)', lineHeight: 1, letterSpacing: '-0.01em',
                        color: 'var(--bone)', marginBottom: 28,
                      }}>
                        {formatTime(currentTime)}
                      </div>
                      <VoiceWaveform seed={entry.id} progress={audioDuration ? currentTime / audioDuration : 0} />
                      <button
                        type="button"
                        aria-label="Stop voice recording"
                        onClick={() => handlePlay(entry.id)}
                        className="hl-voice-play"
                        style={{
                          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                          margin: '32px auto 0', display: 'block',
                        }}
                      >
                        <PlayRing playing />
                      </button>
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

                  {/* Transcript — serif prose */}
                  {!isEditing && entry.transcript && (
                    <div style={{ paddingBottom: 18, maxWidth: '52ch' }}>
                      <div style={{
                        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.24em',
                        textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 12,
                      }}>
                        what you said
                      </div>
                      <p className="hl-serif" style={{
                        fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 300,
                        color: 'var(--bone-dim)', lineHeight: 1.72, margin: 0,
                      }}>
                        {entry.transcript}
                      </p>
                    </div>
                  )}

                  {/* FIND BETTER WORDS — refine entry point. Centred + underlined
                      under the focused player; quiet inline link otherwise. */}
                  {!isEditing && (
                    <div style={{ textAlign: isPlaying ? 'center' : 'left' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(entry.id);
                          setEditTitle(entry.title ?? '');
                          setEditDesc(entry.description ?? entry.transcript ?? '');
                          setEditError(null);
                        }}
                        style={{
                          background: 'transparent', border: 0, padding: 0,
                          marginBottom: 18,
                          cursor: 'pointer',
                          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em',
                          textTransform: 'uppercase', color: 'var(--warm)',
                          textDecoration: 'underline', textUnderlineOffset: 4,
                          textDecorationColor: 'var(--warm-dim)',
                        }}
                      >
                        find better words
                      </button>
                    </div>
                  )}

                  {/* Inline edit / refine form */}
                  {isEditing && (
                    <div style={{ paddingBottom: 24 }}>
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
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)', margin: '4px 0 0', letterSpacing: '0.1em' }}>
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
        )}

        {/* The ∞ resting warm at the foot of the ledger */}
        {!isLoading && !isError && recordings.length > 0 && (
          <div style={{ marginTop: 72 }}>
            <WaxSeal />
          </div>
        )}
      </div>
    </ClothShell>
  );
}
