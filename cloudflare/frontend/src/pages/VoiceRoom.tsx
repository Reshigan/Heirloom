import { useRef, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { voiceApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { dyeColor } from '../loom/dye';

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
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
const WAVEFORM_HEIGHTS = [12, 20, 8, 24, 16, 10, 22, 14, 6, 18, 20, 10];

export function VoiceRoom() {
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const wantId = searchParams.get('id');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function handlePlay(entryId: string) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId((prev) => (prev === entryId ? null : entryId));
  }

  const { data, isLoading } = useQuery({
    queryKey: ['voice'],
    queryFn: () => voiceApi.getAll({ limit: 200 }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const recordings: VoiceEntry[] = (data as { data: VoiceEntry[] } | null)?.data ?? [];

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
    <ClothShell topbarLeft={topbarLeft}>
      {/* Hairline loading bar */}
      <div
        aria-hidden
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 1,
          background: 'var(--warm)', opacity: isLoading ? 0.6 : 0,
          transition: `opacity 360ms ${EASE}`, zIndex: 30, pointerEvents: 'none',
        }}
      />

      <div style={{ padding: 'clamp(24px, 5vw, 48px)', paddingBottom: 120, maxWidth: 680 }}>
        {/* CTA */}
        <Link
          to="/record"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderLeft: '3px solid var(--warm)', padding: '10px 14px',
            marginBottom: 28, textDecoration: 'none',
          }}
        >
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--warm)',
          }}>
            record a voice thread
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)' }}>→</span>
        </Link>

        {/* Empty state */}
        {!isLoading && recordings.length === 0 && (
          <div style={{ paddingTop: 40 }}>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic',
              fontWeight: 300, color: 'var(--bone-faint)', lineHeight: 1.7, margin: '0 0 4px',
            }}>
              Record your voice.
            </p>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic',
              fontWeight: 300, color: 'var(--bone-faint)', lineHeight: 1.7, margin: 0,
            }}>
              Your family will hear it long after you're gone.
            </p>
          </div>
        )}

        {/* Voice list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recordings.map((entry) => {
            const dye = dyeColor(entry.id, entry.metadata);
            const isPlaying = playingId === entry.id;
            const duration = formatDuration(entry.duration);

            return (
              <div
                key={entry.id}
                id={`voice-${entry.id}`}
                style={{
                  borderLeft: `3px solid ${dye}`,
                  borderBottom: '1px solid rgba(244,236,216,0.06)',
                  padding: '10px 14px',
                  transition: `background 180ms ${EASE}`,
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: 'rgba(244,236,216,0.35)',
                  }}>
                    {duration ? `voice · ${duration}` : 'voice'}
                  </span>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Link
                      to={`/record?id=${entry.id}`}
                      style={{
                        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                        textTransform: 'uppercase', color: 'rgba(176,122,74,0.7)',
                        textDecoration: 'none', borderBottom: '1px solid rgba(176,122,74,0.25)',
                        padding: '12px 6px', minHeight: 44,
                        display: 'inline-flex', alignItems: 'center',
                      }}
                    >
                      edit
                    </Link>
                    <button
                      type="button"
                      aria-label={isPlaying ? 'Stop voice recording' : 'Play voice recording'}
                      aria-expanded={isPlaying}
                      aria-controls={`audio-${entry.id}`}
                      onClick={() => handlePlay(entry.id)}
                      style={{
                        background: 'transparent', border: 0,
                        padding: '10px 8px', minHeight: 44,
                        display: 'inline-flex', alignItems: 'center',
                        cursor: 'pointer',
                        fontFamily: 'var(--mono)', fontSize: 13,
                        color: 'rgba(244,236,216,0.55)',
                        lineHeight: 1,
                      }}
                    >
                      {isPlaying ? '■' : '▶'}
                    </button>
                  </div>
                </div>

                {/* Title */}
                {entry.title && (
                  <p style={{
                    fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic',
                    fontWeight: 300, color: 'rgba(244,236,216,0.55)', lineHeight: 1.5, margin: '4px 0 0',
                  }}>
                    {entry.title}
                  </p>
                )}

                {/* Abstract waveform */}
                <div
                  aria-hidden
                  style={{
                    display: 'flex', alignItems: 'flex-end', gap: 2,
                    marginTop: 8, height: 28,
                  }}
                >
                  {WAVEFORM_HEIGHTS.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: 1, height: h,
                        background: 'rgba(244,236,216,0.15)',
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>

                {/* Expanded audio player */}
                {isPlaying && entry.fileUrl && (
                  <div
                    id={`audio-${entry.id}`}
                    style={{
                      marginTop: 8,
                      animation: `hl-fade 360ms ${EASE}`,
                    }}
                  >
                    <audio
                      ref={(el) => { audioRef.current = el; }}
                      src={entry.fileUrl}
                      autoPlay
                      controls
                      onEnded={() => setPlayingId(null)}
                      style={{ width: '100%', marginTop: 8, height: 32 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ClothShell>
  );
}
