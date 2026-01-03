import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Check, Loader2, Sparkles } from './Icons';
import { memoryCardsApi } from '../services/api';

interface ShareMemoryCardProps {
  memoryId: string;
  memoryTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

type CardStyle = 'quote' | 'polaroid' | 'vintage' | 'modern' | 'holiday';

const styleOptions: { value: CardStyle; label: string; description: string }[] = [
  { value: 'quote', label: 'Quote', description: 'Elegant gold on dark' },
  { value: 'polaroid', label: 'Polaroid', description: 'Classic instant photo' },
  { value: 'vintage', label: 'Vintage', description: 'Warm sepia tones' },
  { value: 'modern', label: 'Modern', description: 'Contemporary gradient' },
  { value: 'holiday', label: 'Holiday', description: 'Festive seasonal' },
];

interface GeneratedCard {
  id: string;
  shareUrl: string;
  quote: string;
}

export function ShareMemoryCard({ memoryId, memoryTitle, isOpen, onClose }: ShareMemoryCardProps) {
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>('quote');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedCard, setGeneratedCard] = useState<GeneratedCard | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await memoryCardsApi.generate({
        memoryId,
        style: selectedStyle,
      });
      setGeneratedCard({
        id: response.data.id,
        shareUrl: response.data.shareUrl,
        quote: response.data.quote,
      });
    } catch (error) {
      console.error('Failed to generate card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedCard) return;
    try {
      await navigator.clipboard.writeText(generatedCard.shareUrl);
      setCopied(true);
      memoryCardsApi.recordShare(generatedCard.id, 'copy');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = generatedCard.shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      memoryCardsApi.recordShare(generatedCard.id, 'copy');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!generatedCard) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: memoryTitle,
          text: `Check out this memory from Heirloom`,
          url: generatedCard.shareUrl,
        });
        memoryCardsApi.recordShare(generatedCard.id, 'native');
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="card glass-strong w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium">Share Memory Card</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-void/50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-paper/60 mb-4">
                Create a beautiful shareable card for "{memoryTitle}"
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {styleOptions.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setSelectedStyle(style.value)}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedStyle === style.value
                        ? 'border-gold bg-gold/10'
                        : 'border-paper/20 hover:border-paper/40'
                    }`}
                  >
                    <p className="font-medium text-sm mb-1">{style.label}</p>
                    <p className="text-paper/50 text-xs">{style.description}</p>
                  </button>
                ))}
              </div>

              {generatedCard && (
                <div className="bg-void/50 rounded-lg p-4 mb-6">
                  <p className="text-paper/50 text-sm mb-2">Generated Quote</p>
                  <blockquote className="text-paper/80 italic">
                    "{generatedCard.quote}"
                  </blockquote>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!generatedCard ? (
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="btn btn-primary flex-1"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate Card
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCopyLink}
                    className="btn btn-secondary flex-1"
                  >
                    {copied ? (
                      <>
                        <Check size={18} className="text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share2 size={18} />
                        Copy Link
                      </>
                    )}
                  </button>

                  {'share' in navigator && (
                    <button
                      onClick={handleShare}
                      className="btn btn-primary flex-1"
                    >
                      <Share2 size={18} />
                      Share
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
