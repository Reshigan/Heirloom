import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ProgressHair } from '../loom/components/ProgressHair';
import { ClothShell } from '../loom/components/ClothShell';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
import api from '../services/api';

interface CardData {
  id: string;
  style: string;
  styleConfig: {
    name: string;
    bgColor: string;
    textColor: string;
    accentColor: string;
  };
  quote: string;
  photoUrl: string | null;
  authorName: string;
  memoryDate: string | null;
  memoryTitle: string;
  shareUrl: string;
}

export function CardView() {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchCard = async () => {
      try {
        const response = await api.get(`/memory-cards/${id}`);
        if (!cancelled) setCard(response.data);
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.error || 'Card not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (id) fetchCard();
    return () => { cancelled = true; };
  }, [id]);

  const handleShare = async () => {
    if (!card) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: card.memoryTitle || 'A Memory from Heirloom',
          text: `"${card.quote}" - Preserved on Heirloom`,
          url: card.shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(card.shareUrl);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = card.shareUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <ClothShell topbarCenter="card">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ProgressHair label="loading…" width={200} />
        </div>
      </ClothShell>
    );
  }

  if (error || !card) {
    return (
      <ClothShell topbarCenter="card">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 24px',
          }}
        >
          <WaxSeal size={32} />
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 'clamp(22px,5vw,28px)',
              fontWeight: 300,
              margin: '24px 0 16px',
              color: 'var(--bone)',
            }}
          >
            Card not found.
          </h1>
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 15,
              color: 'var(--bone-dim)',
              margin: '0 0 32px',
              maxWidth: 380,
              lineHeight: 1.65,
            }}
          >
            This memory card may have been removed or the link is invalid.
          </p>
          <Link
            to="/"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--copper-label)',
              textDecoration: 'none',
            }}
          >
            Discover Heirloom →
          </Link>
        </div>
      </ClothShell>
    );
  }

  // Resolve dye color from styleConfig for the margin thread
  const marginColor = card.styleConfig.accentColor || card.styleConfig.bgColor || 'var(--rule)';

  // Extract year from memoryDate for the mono subline
  const year = card.memoryDate
    ? new Date(card.memoryDate).getFullYear()
    : null;
  const subline = year
    ? `A MEMORY BY ${card.authorName.toUpperCase()} · ${year}`
    : `A MEMORY BY ${card.authorName.toUpperCase()}`;

  const cardTitle = card.memoryTitle || 'A Memory';
  const metaDescription = (card.quote || `A memory by ${card.authorName}, preserved on Heirloom.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  // Default 1200x630 social card — the safe fallback for any non-conforming image.
  const DEFAULT_SHARE_IMAGE = 'https://heirloom.blue/og/milestone.png';
  // og:image must be an absolute https URL and a format scrapers decode (no avif/webp).
  const isShareSafe = (url?: string | null): url is string =>
    !!url && url.startsWith('https://') && !/\.(avif|webp)(\?|$)/i.test(url);
  const metaImage = isShareSafe(card.photoUrl) ? card.photoUrl : DEFAULT_SHARE_IMAGE;
  const usingDefaultImage = metaImage === DEFAULT_SHARE_IMAGE;

  return (
    <ClothShell topbarCenter="card">
      <Helmet>
        <title>{`${cardTitle} · Heirloom`}</title>
        <meta name="description" content={metaDescription} />
        {/*
         * PRIVACY-SAFE share meta. A shared card link is reachable by anyone
         * holding it, so the scraper-facing og:* / twitter:* tags name no entry
         * and reveal no content — they reuse the static "card" share copy.
         * The real title/quote still render on-page below; the image stays
         * guarded by isShareSafe above.
         */}
        <meta property="og:title" content="A keepsake from a family thread." />
        <meta
          property="og:description"
          content="Someone made you a card from their family’s archive — a single thread, set aside to be passed on."
        />
        <meta name="twitter:title" content="A keepsake from a family thread." />
        <meta
          name="twitter:description"
          content="Someone made you a card from their family’s archive — a single thread, set aside to be passed on."
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={metaImage} />
        {usingDefaultImage && <meta property="og:image:width" content="1200" />}
        {usingDefaultImage && <meta property="og:image:height" content="630" />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={metaImage} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          padding: 'clamp(48px,8vh,96px) clamp(20px,6vw,64px)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {/* READING column — left dye margin thread */}
        <div
          style={{
            maxWidth: '62ch',
            width: '100%',
            borderLeft: `3px solid ${marginColor}`,
            paddingLeft: 'clamp(18px,4vw,28px)',
          }}
        >
          {/* Display headline title — ceremonial hero (always ≥30px) */}
          <h1
            style={{
              fontFamily: 'var(--serif-display)',
              fontSize: 'clamp(30px,6vw,44px)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: 'var(--bone)',
              margin: '0 0 14px',
            }}
          >
            {card.memoryTitle || 'A Memory'}
          </h1>

          {/* Mono copper eyebrow subline */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--copper-label)',
              marginBottom: 36,
            }}
          >
            {subline}
          </div>

          {/* Photo if present */}
          {card.photoUrl && (
            <div
              style={{
                border: '1px solid var(--rule)',
                marginBottom: 32,
                overflow: 'hidden',
              }}
            >
              <img
                src={card.photoUrl}
                alt="Memory"
                loading="lazy"
                style={{
                  width: '100%',
                  height: 'clamp(160px,30vw,260px)',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          )}

          {/* Body quote — serif 18px / 1.75 / justified */}
          <blockquote
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 18,
              lineHeight: 1.75,
              color: 'var(--bone)',
              textAlign: 'justify',
              margin: '0 0 40px',
              padding: 0,
            }}
          >
            &#8220;{card.quote}&#8221;
          </blockquote>

          {/* Hairline rule */}
          <div
            aria-hidden
            style={{
              height: 1,
              background: 'var(--rule)',
              marginBottom: 32,
            }}
          />

          {/* Mono affordances: share + CTA */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <button
              type="button"
              onClick={handleShare}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: copied ? 'var(--muted-3)' : 'var(--copper-label)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'color 180ms var(--ease)',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {copied ? 'LINK COPIED' : 'SHARE THIS MEMORY →'}
            </button>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--bone-dim)',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Preserve your own memories for future generations.
              </p>
              <Link
                to="/signup"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--copper-label)',
                  textDecoration: 'none',
                  display: 'inline-block',
                  minHeight: 44,
                  lineHeight: '44px',
                }}
              >
                START YOUR THREAD ON HEIRLOOM →
              </Link>
            </div>
          </div>

          {/* WaxSeal foot */}
          <div style={{ marginTop: 56, paddingBottom: 24 }}>
            <WaxSeal size={28} />
          </div>
        </div>
      </div>
    </ClothShell>
  );
}

export default CardView;
