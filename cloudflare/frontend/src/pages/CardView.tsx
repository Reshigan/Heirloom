import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2, Heart, Loader2 } from '../components/Icons';
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
        <Loader2 size={48} className="text-gold animate-spin" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-void text-paper p-6">
        <h1 className="text-2xl font-light mb-4">Card Not Found</h1>
        <p className="text-paper/60 mb-8">This memory card may have been removed or the link is invalid.</p>
        <Link to="/" className="btn btn-primary">
          Discover Heirloom
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Card Display */}
          <div 
            className="rounded-2xl p-8 shadow-2xl mb-8"
            style={{
              background: card.styleConfig.bgColor,
              color: card.styleConfig.textColor,
            }}
          >
            {card.photoUrl && (
              <img 
                src={card.photoUrl} 
                alt="Memory" 
                className="w-full h-48 object-cover rounded-lg mb-6"
              />
            )}
            
            <blockquote className="text-2xl italic leading-relaxed mb-6">
              "{card.quote}"
            </blockquote>
            
            <div className="text-sm opacity-70">
              <div className="font-medium">- {card.authorName}</div>
              {card.memoryDate && (
                <div className="mt-1">{card.memoryDate}</div>
              )}
            </div>
            
            <div 
              className="mt-6 pt-4 border-t text-xs opacity-50 flex items-center gap-2"
              style={{ borderColor: `${card.styleConfig.textColor}20` }}
            >
              <Heart size={14} className="text-gold" />
              <span>Made with Heirloom</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleShare}
              className="btn btn-primary flex-1"
            >
              <Share2 size={18} />
              {copied ? 'Link Copied!' : 'Share'}
            </button>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-paper/60 mb-4">
              Preserve your own memories for future generations
            </p>
            <Link 
              to="/signup" 
              className="text-gold hover:underline font-medium"
            >
              Start Your Legacy on Heirloom
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default CardView;
