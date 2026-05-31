import { useState, useEffect } from 'react';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const { data, isLoading, error } = useQuery<StoryData>({
    queryKey: ['story-view', token],
    queryFn: () => api.get(`/api/story-artifacts/view/${token}`).then((r: { data: StoryData }) => r.data),
    enabled: !!token,
  });

  useEffect(() => {
    if (!isPlaying || !data?.memories.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= data.memories.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, data?.memories.length]);

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
  const togglePlayback = () => {
    if (currentIndex >= memories.length - 1) setCurrentIndex(0);
    setIsPlaying(!isPlaying);
  };

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
      {/* Ambient glow */}
      <div className="loom-horizon" style={{ pointerEvents: 'none' }} />
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
                {currentMemory?.title && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '12px 20px',
                      background: 'linear-gradient(to top, rgba(14,14,12,0.82), transparent)',
                    }}
                  >
                    <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone)', margin: 0 }}>
                      {currentMemory.title}
                    </p>
                  </div>
                )}
              </div>

              {/* Prev button */}
              <button
                type="button"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                aria-label="Previous"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 40,
                  height: 40,
                  background: 'rgba(14,14,12,0.65)',
                  border: '1px solid var(--loom-rule)',
                  cursor: currentIndex === 0 ? 'default' : 'pointer',
                  opacity: currentIndex === 0 ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--loom-bone)',
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                ‹
              </button>

              {/* Next button */}
              <button
                type="button"
                onClick={goToNext}
                disabled={currentIndex === memories.length - 1}
                aria-label="Next"
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 40,
                  height: 40,
                  background: 'rgba(14,14,12,0.65)',
                  border: '1px solid var(--loom-rule)',
                  cursor: currentIndex === memories.length - 1 ? 'default' : 'pointer',
                  opacity: currentIndex === memories.length - 1 ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--loom-bone)',
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                ›
              </button>
            </div>

            {/* Controls row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <button type="button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause' : 'Play'} className="loom-btn">
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="loom-btn-ghost"
                style={{ fontSize: 11, padding: '10px 18px' }}
              >
                {isMuted ? 'Muted' : 'Sound'}
              </button>
            </div>

            {/* Dot indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
              {memories.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to photo ${index + 1}`}
                  style={{
                    height: 1,
                    width: index === currentIndex ? 24 : 8,
                    background: index === currentIndex ? 'var(--loom-warm)' : 'var(--loom-rule)',
                    border: 0,
                    cursor: 'pointer',
                    padding: 0,
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
