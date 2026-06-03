import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProgressHair } from '../components/ui/ProgressHair';
import { HLogo } from '../loom/components/HLogo';
import axios from 'axios';

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

// ── Parchment topbar — logo left, label right ────────────────────────────
function CardTopbar() {
  return (
    <div
      className="hl-topbar"
      style={{ color: 'var(--parchment-dim)', borderBottom: '1px solid var(--parchment-rule)' }}
    >
      <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
        <HLogo size={18} wordmark mono color="var(--parchment-ink)" wordColor="var(--parchment-ink)" />
      </Link>
      <span
        className="hl-eyebrow dark"
        style={{ color: 'var(--parchment-dim)' }}
      >
        a card from the cloth
      </span>
    </div>
  );
}

export function CardView() {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api';
        const response = await axios.get(`${API_URL}/memory-cards/${id}`);
        setCard(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Card not found');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCard();
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
      <div
        className="hl-screen parchment"
        style={{ position: 'absolute', inset: 0 }}
      >
        <CardTopbar />
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
      </div>
    );
  }

  if (error || !card) {
    return (
      <div
        className="hl-screen parchment"
        style={{ position: 'absolute', inset: 0 }}
      >
        <CardTopbar />
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
          <p
            className="hl-serif"
            style={{ fontSize: 32, color: 'var(--warm)', marginBottom: 20 }}
          >
            ∞
          </p>
          <h1
            className="hl-serif hl-italic hl-tight"
            style={{ fontSize: 28, fontWeight: 300, margin: '0 0 16px', color: 'var(--parchment-ink)' }}
          >
            Card not found.
          </h1>
          <p
            className="hl-prose dark"
            style={{ fontSize: 15, color: 'var(--parchment-dim)', margin: '0 0 32px', maxWidth: 380 }}
          >
            This memory card may have been removed or the link is invalid.
          </p>
          <Link to="/" className="hl-btn" style={{ textDecoration: 'none' }}>
            Discover Heirloom
          </Link>
        </div>
      </div>
    );
  }

  // resolve dye swatch from styleConfig accent or bgColor
  const dyeColor = card.styleConfig.accentColor || card.styleConfig.bgColor || null;

  return (
    <div
      className="hl-screen parchment"
      style={{ position: 'absolute', inset: 0 }}
    >
      <CardTopbar />

      {/* content — centered in the remaining viewport */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '72px 24px 32px',
        }}
      >
        <div
          style={{
            background: 'var(--parchment-deep)',
            padding: '52px 56px',
            maxWidth: 600,
            width: '100%',
          }}
        >
          {/* Logo centered */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <HLogo size={22} mono color="var(--parchment-ink)" />
          </div>

          <hr className="hl-rule parchment" style={{ marginBottom: 20 }} />

          {/* Dye swatch — only if a color is present */}
          {dyeColor && (
            <div
              aria-hidden
              style={{
                width: 12,
                height: 12,
                background: dyeColor,
                marginBottom: 20,
              }}
            />
          )}

          {/* Photo if present */}
          {card.photoUrl && (
            <div
              style={{
                border: '1px solid var(--parchment-rule)',
                marginBottom: 28,
                overflow: 'hidden',
              }}
            >
              <img
                src={card.photoUrl}
                alt="Memory"
                style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          {/* Quote content */}
          <blockquote
            className="hl-prose dark"
            style={{
              fontStyle: 'italic',
              fontSize: 18,
              lineHeight: 1.7,
              margin: '0 0 24px',
              padding: 0,
              borderLeft: '1px solid var(--warm)',
              paddingLeft: 18,
              color: 'var(--parchment-ink)',
            }}
          >
            &#8220;{card.quote}&#8221;
          </blockquote>

          <hr className="hl-rule parchment" style={{ marginBottom: 20 }} />

          {/* Author */}
          <p
            className="hl-italic"
            style={{
              fontSize: 14,
              color: 'var(--parchment-dim)',
              margin: '0 0 6px',
            }}
          >
            — {card.authorName}
          </p>

          {/* Date */}
          {card.memoryDate && (
            <p
              className="hl-mono"
              style={{
                fontSize: 10,
                color: 'var(--parchment-faint)',
                margin: '0 0 28px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              {card.memoryDate}
            </p>
          )}

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="hl-btn"
            style={{ width: '100%', marginBottom: 20 }}
          >
            {copied ? 'Link copied' : 'Share'}
          </button>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <p
              className="hl-prose dark"
              style={{ fontSize: 13, color: 'var(--parchment-dim)', margin: '0 0 10px' }}
            >
              Preserve your own memories for future generations.
            </p>
            <Link
              to="/signup"
              className="hl-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                textDecoration: 'none',
              }}
            >
              Start your thread on Heirloom →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardView;
