import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Check, Loader2 } from './Icons';
import { memoryCardsApi } from '../services/api';

interface ShareMemoryCardProps {
  memoryId: string;
  memoryTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

type CardStyle = 'classic' | 'modern' | 'vintage';

const styleOptions: { value: CardStyle; label: string; description: string }[] = [
  { value: 'classic', label: 'Classic', description: 'Elegant gold on dark' },
  { value: 'modern', label: 'Modern', description: 'Clean and minimal' },
  { value: 'vintage', label: 'Vintage', description: 'Warm sepia tones' },
];

export function ShareMemoryCard({ memoryId, memoryTitle, isOpen, onClose }: ShareMemoryCardProps) {
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>('classic');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const cardUrl = memoryCardsApi.getCardUrl(memoryId, selectedStyle);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await memoryCardsApi.getCard(memoryId, selectedStyle);
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heirloom-memory-${memoryId}.svg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = cardUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: memoryTitle,
          text: `Check out this memory from Heirloom`,
          url: cardUrl,
        });
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

              <div className="flex gap-3 mb-6">
                {styleOptions.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setSelectedStyle(style.value)}
                    className={`flex-1 p-4 rounded-lg border transition-all ${
                      selectedStyle === style.value
                        ? 'border-gold bg-gold/10'
                        : 'border-paper/20 hover:border-paper/40'
                    }`}
                  >
                    <p className="font-medium mb-1">{style.label}</p>
                    <p className="text-paper/50 text-sm">{style.description}</p>
                  </button>
                ))}
              </div>

              <div className="bg-void/50 rounded-lg p-4 mb-6">
                <p className="text-paper/50 text-sm mb-2">Preview</p>
                <div className="aspect-[1200/630] bg-void rounded-lg overflow-hidden">
                  <img
                    src={cardUrl}
                    alt="Memory card preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={isLoading}
                className="btn btn-secondary flex-1"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Download size={18} />
                    Download SVG
                  </>
                )}
              </button>

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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
