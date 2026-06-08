import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProgressHair } from '../loom/components/ProgressHair';
import { TapestryEdge } from '../loom/components/Frame';
import { ClothShell } from '../loom/components/ClothShell';
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

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <ClothShell topbarCenter="story">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <ProgressHair label="loading…" width={200} />
        </div>
      </ClothShell>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <ClothShell topbarCenter="story">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 40px', height: '100%' }}>
          <h1
            className="hl-serif hl-tight"
            style={{ fontSize: 36, fontWeight: 300, fontStyle: 'italic', color: 'var(--parchment-ink)', margin: '0 0 16px' }}
          >
            Story not found.
          </h1>
          <p
            className="hl-prose dark"
            style={{ fontSize: 15 }}
          >
            This story may have expired or the link may be invalid.
          </p>
        </div>
      </ClothShell>
    );
  }

  const { artifact, memories } = data;
  const currentMemory = memories[currentIndex];

  const goToPrevious = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const goToNext = () => setCurrentIndex((prev) => Math.min(memories.length - 1, prev + 1));
  const atStart = currentIndex === 0;
  const atEnd = currentIndex === memories.length - 1;

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <ClothShell topbarCenter="story">
      {/* Two-page spread */}
      <div
        style={{
          position: 'absolute',
          top: 56,
          bottom: 56,
          left: 0,
          right: 0,
          display: 'flex',
        }}
      >
        {/* Left page — title + meta */}
        <div
          style={{
            flex: 1,
            padding: '56px 64px 56px 88px',
            borderRight: '1px solid var(--parchment-rule)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--parchment-faint)',
              marginBottom: 36,
            }}
          >
            family story
          </span>

          <h2
            className="hl-serif hl-tight"
            style={{
              fontSize: 44,
              fontWeight: 300,
              color: 'var(--parchment-ink)',
              margin: 0,
            }}
          >
            {artifact.title}
          </h2>

          {artifact.description && (
            <p
              className="hl-italic"
              style={{
                fontSize: 15,
                color: 'var(--parchment-dim)',
                marginTop: 32,
                marginBottom: 0,
              }}
            >
              {artifact.description}
            </p>
          )}

          <div style={{ flex: 1 }} />

          {/* Creator byline */}
          <span
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--parchment-faint)',
            }}
          >
            {artifact.creatorName}
          </span>
        </div>

        {/* Right page — memory body */}
        <div
          style={{
            flex: 1,
            padding: '56px 88px 56px 64px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {memories.length > 0 ? (
            <>
              {/* Image frame */}
              <div
                style={{
                  width: '100%',
                  flex: '0 0 auto',
                  aspectRatio: '4/3',
                  border: '1px solid var(--parchment-rule)',
                  overflow: 'hidden',
                  background: 'var(--parchment-deep)',
                  position: 'relative',
                }}
              >
                <img
                  key={currentIndex}
                  src={currentMemory?.fileUrl}
                  alt={currentMemory?.title || 'Memory'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    background: 'var(--parchment-deep)',
                    transition: 'opacity 360ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                />
              </div>

              {/* Caption */}
              {currentMemory?.title && (
                <p
                  className="hl-prose dark"
                  style={{
                    fontSize: 18,
                    lineHeight: 1.9,
                    color: 'var(--parchment-ink)',
                    marginTop: 24,
                    marginBottom: 0,
                  }}
                >
                  {currentMemory.title}
                </p>
              )}

              <div style={{ flex: 1 }} />

              {/* Pager */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 20,
                  borderTop: '1px solid var(--parchment-rule)',
                  paddingTop: 16,
                }}
              >
                <button
                  type="button"
                  onClick={goToPrevious}
                  disabled={atStart}
                  className="hl-mono"
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: atStart ? 'default' : 'pointer',
                    fontSize: 10.5,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: atStart ? 'var(--parchment-rule)' : 'var(--parchment-dim)',
                  }}
                >
                  earlier
                </button>

                {/* ∞ chapter marks */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {memories.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-label={`Go to photo ${index + 1}`}
                      aria-current={index === currentIndex}
                      onClick={() => setCurrentIndex(index)}
                      className="hl-serif"
                      style={{
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: 13,
                        lineHeight: 1,
                        color: index === currentIndex ? 'var(--warm)' : 'var(--parchment-rule)',
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
                  className="hl-mono"
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: atEnd ? 'default' : 'pointer',
                    fontSize: 10.5,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: atEnd ? 'var(--parchment-rule)' : 'var(--warm)',
                  }}
                >
                  later
                </button>
              </div>

              {/* Hairline progress marks */}
              <div aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                {memories.map((_, index) => (
                  <span
                    key={index}
                    style={{
                      height: 1,
                      width: index === currentIndex ? 24 : 8,
                      background: index === currentIndex ? 'var(--warm)' : 'var(--parchment-rule)',
                      transition: 'width 360ms cubic-bezier(0.16,1,0.3,1), background 180ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  />
                ))}
              </div>

              <p
                className="hl-mono"
                style={{
                  fontSize: 10,
                  color: 'var(--parchment-faint)',
                  letterSpacing: '0.14em',
                  marginTop: 10,
                  marginBottom: 0,
                }}
              >
                {currentIndex + 1} of {memories.length}
              </p>
            </>
          ) : (
            <p
              className="hl-prose dark hl-italic"
              style={{ fontSize: 18, lineHeight: 1.9, color: 'var(--parchment-dim)' }}
            >
              No photos in this story yet.
            </p>
          )}
        </div>
      </div>

      {/* Bottom edge bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: 'var(--parchment)',
          borderTop: '1px solid var(--parchment-rule)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <span
          className="hl-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--parchment-faint)',
          }}
        >
          Heirloom — the family thread
        </span>
      </div>

      {/* TapestryEdge woven border at absolute bottom */}
      <TapestryEdge nowFrac={memories.length > 0 ? (currentIndex + 1) / memories.length : 0.5} />
    </ClothShell>
  );
}

export default StoryView;
