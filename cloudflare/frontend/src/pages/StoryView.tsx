import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProgressHair } from '../components/ui/ProgressHair';
import api from '../services/api';

interface StoryData {
  artifact: {
    title: string;
    description: string;
    theme: string;
    backgroundMusic: string | null;
    outputUrl: string | null;
    creatorName: string;
  };
  memories: Array<{
    id: string;
    title: string;
    fileUrl: string;
    thumbnailUrl: string | null;
  }>;
}

export function StoryView() {
  const { token } = useParams<{ token: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data, isLoading, error } = useQuery<StoryData>({
    queryKey: ['story-view', token],
    queryFn: () => api.get(`/api/story-artifacts/view/${token}`).then((r: { data: StoryData }) => r.data),
    enabled: !!token,
  });

  const pageBase: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--loom-ink)',
    color: 'var(--loom-bone)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  };

  if (isLoading) {
    return (
      <div style={pageBase}>
        <ProgressHair label="loading…" width={200} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ ...pageBase, flexDirection: 'column', textAlign: 'center' }}>
        <h1 className="loom-h2" style={{ fontSize: 28, fontWeight: 300, fontStyle: 'italic', margin: '0 0 12px' }}>
          Story not found.
        </h1>
        <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)' }}>
          This story may have expired or the link may be invalid.
        </p>
      </div>
    );
  }

  const { artifact, memories } = data;
  const currentMemory = memories[currentIndex];

  const goToPrevious = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const goToNext = () => setCurrentIndex((prev) => Math.min(memories.length - 1, prev + 1));
  const atStart = currentIndex === 0;
  const atEnd = currentIndex === memories.length - 1;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--loom-ink)',
        color: 'var(--loom-bone)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Paper grain — no radial glow (a §2.6 anti-pattern) */}
      <div className="loom-grain" style={{ pointerEvents: 'none' }} />

      {/* Header */}
      <header
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '48px 24px 32px',
          textAlign: 'center',
        }}
      >
        <h1
          className="loom-h2"
          style={{
            fontSize: 'clamp(28px,4vw,44px)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'var(--loom-bone)',
            margin: '0 0 12px',
          }}
        >
          {artifact.title}
        </h1>
        {artifact.description && (
          <p className="loom-body" style={{ fontSize: 16, color: 'var(--loom-bone-dim)', margin: '0 auto 8px', maxWidth: 520 }}>
            {artifact.description}
          </p>
        )}
        <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Created by {artifact.creatorName}
        </p>
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px 48px',
        }}
      >
        {memories.length > 0 ? (
          <>
            {/* Image frame */}
            <div
              style={{
                width: '100%',
                maxWidth: 900,
                position: 'relative',
                border: '1px solid var(--loom-rule)',
                overflow: 'hidden',
                aspectRatio: '16/9',
                background: 'var(--loom-ink)',
              }}
            >
              {/* Current image */}
              <div
                key={currentIndex}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transition: 'opacity 360ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <img
                  src={currentMemory?.fileUrl}
                  alt={currentMemory?.title || 'Memory'}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: 'var(--loom-ink)' }}
                />
              </div>
            </div>

            {/* Caption — flat ink bar, hairline-separated (no scrim gradient) */}
            {currentMemory?.title && (
              <div
                style={{
                  width: '100%',
                  maxWidth: 900,
                  marginTop: -1,
                  padding: '12px 4px',
                  borderTop: '1px solid var(--loom-rule)',
                }}
              >
                <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: 0, textAlign: 'center' }}>
                  {currentMemory.title}
                </p>
              </div>
            )}

            {/* Page-turn pager — loom-mono word labels (manual reading, no media-player) */}
            <div
              style={{
                width: '100%',
                maxWidth: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={goToPrevious}
                disabled={atStart}
                className="loom-mono"
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: atStart ? 'default' : 'pointer',
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: atStart ? 'var(--loom-rule)' : 'var(--loom-bone-dim)',
                }}
              >
                ← earlier
              </button>

              {/* ∞ chapter-dot row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {memories.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to photo ${index + 1}`}
                    aria-current={index === currentIndex}
                    onClick={() => setCurrentIndex(index)}
                    className="loom-serif"
                    style={{
                      background: 'transparent',
                      border: 0,
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: 13,
                      lineHeight: 1,
                      color: index === currentIndex ? 'var(--loom-warm)' : 'var(--loom-rule)',
                      transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    ∞
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={goToNext}
                disabled={atEnd}
                className="loom-mono"
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: atEnd ? 'default' : 'pointer',
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: atEnd ? 'var(--loom-rule)' : 'var(--loom-warm)',
                }}
              >
                later →
              </button>
            </div>

            {/* Hairline progress indicators — passive position marks */}
            <div aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
              {memories.map((_, index) => (
                <span
                  key={index}
                  style={{
                    height: 1,
                    width: index === currentIndex ? 24 : 8,
                    background: index === currentIndex ? 'var(--loom-warm)' : 'var(--loom-rule)',
                    transition: 'width 360ms cubic-bezier(0.16,1,0.3,1), background 180ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                />
              ))}
            </div>

            <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.14em', marginTop: 12 }}>
              {currentIndex + 1} of {memories.length}
            </p>
          </>
        ) : (
          <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-faint)', fontStyle: 'italic' }}>
            No photos in this story yet.
          </p>
        )}
      </main>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '24px', textAlign: 'center' }}>
        <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.18em' }}>
          Powered by{' '}
          <a href="https://heirloom.blue" style={{ color: 'var(--loom-warm)', textDecoration: 'none' }}>
            Heirloom
          </a>
        </p>
      </footer>
    </div>
  );
}

export default StoryView;
