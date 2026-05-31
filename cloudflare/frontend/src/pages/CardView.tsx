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

    if (id) {
      fetchCard();
    }
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
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(card.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = card.shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <ProgressHair label="loading…" width={180} />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-void text-paper p-6">
        <span className="font-body text-4xl text-gold block mb-7" aria-hidden>∞</span>
        <h1 className="font-body font-light text-2xl mb-4 tracking-[-0.014em]">Card not found</h1>
        <p className="text-paper-70 mb-8 max-w-prose text-center leading-relaxed">This memory card may have been removed or the link is invalid.</p>
        <Link to="/" className="btn btn-primary">
          Discover Heirloom <span aria-hidden>→</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-paper antialiased">
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Card Display */}
          <div
            className="border border-paper-15 p-8 mb-8 rounded-[2px]"
            style={{
              background: card.styleConfig.bgColor,
              color: card.styleConfig.textColor,
            }}
          >
            {card.photoUrl && (
              <img
                src={card.photoUrl}
                alt="Memory"
                className="w-full h-48 object-cover rounded-[2px] mb-6"
              />
            )}

            <blockquote className="font-body text-2xl italic leading-relaxed mb-6">
              "{card.quote}"
            </blockquote>

            <div className="text-sm opacity-70">
              <div className="font-medium">— {card.authorName}</div>
              {card.memoryDate && (
                <div className="mt-1">{card.memoryDate}</div>
              )}
            </div>

            <div
              className="mt-6 pt-4 border-t text-xs opacity-50 flex items-baseline gap-2"
              style={{ borderColor: `${card.styleConfig.textColor}20` }}
            >
              <span className="text-gold" aria-hidden>∞</span>
              <span>Made with Heirloom</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleShare}
              className="btn btn-primary flex-1"
            >
              {copied ? 'Link copied' : 'Share'}
            </button>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-paper-70 mb-4">
              Preserve your own memories for future generations
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-bright transition-colors"
            >
              Start your thread on Heirloom <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardView;
