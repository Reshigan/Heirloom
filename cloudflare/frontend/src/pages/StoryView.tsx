import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { ProgressHair } from '../loom/components/ProgressHair';
import { TapestryEdge } from '../loom/components/Frame';
import { ClothShell } from '../loom/components/ClothShell';
import { WaxSeal, WarmDot } from '../loom/cosmic/CosmicUI';
import { dyeColor } from '../loom/dye';
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

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

export function StoryView() {
  const { token } = useParams<{ token: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // ── Error / not found ──────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <ClothShell topbarCenter="story">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 40px',
            height: '100%',
          }}
        >
          <WaxSeal size={26} />
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(30px, 6vw, 44px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--bone)',
              margin: '24px 0 14px',
              lineHeight: 1.1,
            }}
          >
            Story not found.
          </h1>
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-dim)',
              margin: 0,
            }}
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

  // Dye margin thread for the reading column — keyed off the story token so the
  // same story always wears the same thread.
  const thread = dyeColor(token ?? artifact.title);

  // ── Share / SEO metadata ──────────────────────────────────────────────────
  const metaTitle = `${artifact.title} · Heirloom`;
  const metaDescription = (artifact.description || `A story by ${artifact.creatorName}, woven into the family thread.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  // Default 1200x630 social card — the safe fallback for any non-conforming image.
  const DEFAULT_SHARE_IMAGE = 'https://heirloom.blue/woven/seal.png';
  // og:image must be an absolute https URL and a format scrapers decode (no avif/webp).
  const isShareSafe = (url?: string | null): url is string =>
    !!url && url.startsWith('https://') && !/\.(avif|webp)(\?|$)/i.test(url);
  const candidateImage =
    memories.find((m) => isShareSafe(m.thumbnailUrl))?.thumbnailUrl ||
    memories.find((m) => isShareSafe(m.fileUrl))?.fileUrl ||
    null;
  const metaImage = candidateImage || DEFAULT_SHARE_IMAGE;
  const usingDefaultImage = metaImage === DEFAULT_SHARE_IMAGE;
  const canonical = window.location.href;

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <ClothShell topbarCenter="story">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={artifact.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={metaImage} />
        {usingDefaultImage && <meta property="og:image:width" content="1200" />}
        {usingDefaultImage && <meta property="og:image:height" content="630" />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={metaImage} />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <div
        style={{
          position: 'absolute',
          top: 'calc(56px + env(safe-area-inset-top, 0px))',
          bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
          left: 0,
          right: 0,
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {/* The reading column — dye margin thread, centred, ~62ch */}
        <article
          style={{
            width: '100%',
            maxWidth: 720,
            borderLeft: `3px solid ${thread}`,
            paddingLeft: isMobile ? 20 : 24,
            paddingRight: isMobile ? 20 : 24,
            paddingTop: isMobile ? 40 : 64,
            paddingBottom: 56,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Headline */}
          <h1
            style={{
              fontFamily: 'var(--serif-display)',
              fontSize: 'clamp(30px, 6vw, 44px)',
              fontWeight: 500,
              lineHeight: 1.08,
              letterSpacing: '-0.012em',
              color: 'var(--bone)',
              margin: 0,
            }}
          >
            {artifact.title}
          </h1>

          {/* Subline — A STORY BY <CREATOR> */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              marginTop: 18,
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--copper-label)',
            }}
          >
            <WarmDot color={thread} size={5} />
            <span>A STORY BY {artifact.creatorName}</span>
          </div>

          {/* Description body — serif prose */}
          {artifact.description && (
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 18,
                lineHeight: 1.75,
                color: 'var(--bone)',
                textAlign: 'justify',
                marginTop: 36,
                marginBottom: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {artifact.description}
            </p>
          )}

          {memories.length > 0 ? (
            <>
              {/* Photograph frame */}
              <div
                style={{
                  width: '100%',
                  marginTop: 44,
                  aspectRatio: '4/3',
                  border: '1px solid var(--rule)',
                  overflow: 'hidden',
                  background: 'var(--ink)',
                  position: 'relative',
                  flex: '0 0 auto',
                }}
              >
                <img
                  key={currentIndex}
                  src={currentMemory?.fileUrl}
                  alt={currentMemory?.title || 'Memory'}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    background: 'var(--ink)',
                    transition: `opacity 360ms ${EASE}`,
                  }}
                />
              </div>

              {/* Caption */}
              {currentMemory?.title && (
                <p
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 16,
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                    color: 'var(--bone-dim)',
                    marginTop: 18,
                    marginBottom: 0,
                  }}
                >
                  {currentMemory.title}
                </p>
              )}

              {/* Pager — earlier / chapter ∞ marks / later */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 28,
                  borderTop: '1px solid var(--rule)',
                  paddingTop: 16,
                }}
              >
                <button
                  type="button"
                  onClick={goToPrevious}
                  disabled={atStart}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: atStart ? 'default' : 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 10.5,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: atStart ? 'var(--rule)' : 'var(--bone-dim)',
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
                      style={{
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: 'var(--serif)',
                        fontSize: 13,
                        lineHeight: 1,
                        color: index === currentIndex ? 'var(--warm)' : 'var(--rule)',
                        textShadow: index === currentIndex ? '0 0 12px var(--warm-glow)' : 'none',
                        transition: `color 180ms ${EASE}`,
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
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: atEnd ? 'default' : 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 10.5,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: atEnd ? 'var(--rule)' : 'var(--copper-label)',
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
                      background: index === currentIndex ? 'var(--warm)' : 'var(--rule)',
                      transition: `width 360ms ${EASE}, background 180ms ${EASE}`,
                    }}
                  />
                ))}
              </div>

              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--bone-faint)',
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
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 18,
                lineHeight: 1.75,
                color: 'var(--bone-dim)',
                marginTop: 40,
              }}
            >
              No photos in this story yet.
            </p>
          )}

          {/* Foot */}
          <div style={{ marginTop: 56 }}>
            <WaxSeal size={28} />
            <p
              style={{
                textAlign: 'center',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
                marginTop: 16,
                marginBottom: 0,
              }}
            >
              Heirloom — the family thread
            </p>
          </div>
        </article>
      </div>

      {/* TapestryEdge woven border at absolute bottom */}
      <TapestryEdge nowFrac={memories.length > 0 ? (currentIndex + 1) / memories.length : 0.5} />
    </ClothShell>
  );
}

export default StoryView;
