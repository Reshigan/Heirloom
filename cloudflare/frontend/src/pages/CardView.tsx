import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProgressHair } from '../components/ui/ProgressHair';
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

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--loom-ink)',
    color: 'var(--loom-bone)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <ProgressHair label="loading…" width={200} />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div style={{ ...pageStyle, flexDirection: 'column', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: 32, color: 'var(--loom-warm)', marginBottom: 20 }}>∞</p>
        <h1 className="loom-h2" style={{ fontSize: 28, fontWeight: 300, fontStyle: 'italic', margin: '0 0 16px' }}>
          Card not found.
        </h1>
        <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: '0 0 32px', maxWidth: 380 }}>
          This memory card may have been removed or the link is invalid.
        </p>
        <Link to="/" className="loom-btn" style={{ textDecoration: 'none' }}>
          Discover Heirloom
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--loom-ink)',
        color: 'var(--loom-bone)',
      }}
    >
      {/* Ambient glow */}
      <div className="loom-horizon" style={{ pointerEvents: 'none' }} />
      <div className="loom-grain" style={{ pointerEvents: 'none' }} />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 520 }}>
          {/* Card display */}
          <div
            style={{
              border: '1px solid rgba(244,236,216,0.14)',
              padding: 40,
              marginBottom: 28,
              background: card.styleConfig.bgColor,
              color: card.styleConfig.textColor,
            }}
          >
            {card.photoUrl && (
              <div
                style={{
                  border: '1px solid rgba(244,236,216,0.14)',
                  marginBottom: 24,
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

            <blockquote
              style={{
                fontFamily: "'Source Serif 4', serif",
                fontStyle: 'italic',
                fontSize: 21,
                lineHeight: 1.65,
                margin: '0 0 20px',
                borderLeft: '2px solid var(--loom-warm)',
                paddingLeft: 18,
              }}
            >
              "{card.quote}"
            </blockquote>

            <div style={{ fontSize: 14, opacity: 0.7 }}>
              <p style={{ margin: 0, fontWeight: 500 }}>— {card.authorName}</p>
              {card.memoryDate && (
                <p style={{ margin: '4px 0 0', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.06em' }}>
                  {card.memoryDate}
                </p>
              )}
            </div>

            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: `1px solid ${card.styleConfig.textColor}18`,
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <span style={{ color: 'var(--loom-warm)' }}>∞</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  opacity: 0.5,
                }}
              >
                Made with Heirloom
              </span>
            </div>
          </div>

          {/* Actions */}
          <button type="button" onClick={handleShare} className="loom-btn" style={{ width: '100%', marginBottom: 36 }}>
            {copied ? 'Link copied' : 'Share'}
          </button>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: '0 0 16px' }}>
              Preserve your own memories for future generations.
            </p>
            <Link
              to="/signup"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--loom-warm)',
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
