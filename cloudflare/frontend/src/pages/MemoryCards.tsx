import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memoryCardsApi, memoriesApi } from '../services/api';
import { Navigation } from '../components/Navigation';

interface CardStyle {
  id: string;
  name: string;
  description: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

interface GeneratedCard {
  id: string;
  style: string;
  styleConfig: CardStyle;
  quote: string;
  photoUrl: string | null;
  authorName: string;
  memoryDate: string | null;
  memoryTitle: string;
  shareUrl: string;
  shareText: string;
  socialShareUrls: {
    twitter: string;
    facebook: string;
    linkedin: string;
    whatsapp: string;
  };
}

interface OnThisDayMemory {
  id: string;
  title: string;
  description: string;
  photoUrl: string | null;
  yearsAgo: number;
  year: string;
  type: 'memory_date' | 'created';
  date: string;
}

export function MemoryCards() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('quote');
  const [customText, setCustomText] = useState('');
  const [includePhoto, setIncludePhoto] = useState(true);
  const [generatedCard, setGeneratedCard] = useState<GeneratedCard | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'gallery' | 'onthisday'>('create');

  // Fetch card styles
  const { data: stylesData } = useQuery({
    queryKey: ['memory-card-styles'],
    queryFn: () => memoryCardsApi.getStyles().then(r => r.data),
  });

  // Fetch user's memories
  const { data: memoriesData } = useQuery({
    queryKey: ['memories-for-cards'],
    queryFn: () => memoriesApi.getAll({ limit: 50 }).then(r => r.data),
  });

  // Fetch user's generated cards
  const { data: cardsData } = useQuery({
    queryKey: ['my-memory-cards'],
    queryFn: () => memoryCardsApi.getAll().then(r => r.data),
    enabled: activeTab === 'gallery',
  });

  // Fetch On This Day memories
  const { data: onThisDayData } = useQuery({
    queryKey: ['on-this-day'],
    queryFn: () => memoryCardsApi.getOnThisDay().then(r => r.data),
    enabled: activeTab === 'onthisday',
  });

  // Generate card mutation
  const generateMutation = useMutation({
    mutationFn: () => memoryCardsApi.generate({
      memoryId: selectedMemory!,
      style: selectedStyle,
      customText: customText || undefined,
      includePhoto,
    }),
    onSuccess: (response) => {
      setGeneratedCard(response.data);
      queryClient.invalidateQueries({ queryKey: ['my-memory-cards'] });
    },
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: (platform: string) => memoryCardsApi.recordShare(generatedCard!.id, platform),
  });

  const handleGenerate = () => {
    if (selectedMemory) {
      generateMutation.mutate();
    }
  };

  const handleCopyLink = async () => {
    if (generatedCard) {
      try {
        await navigator.clipboard.writeText(generatedCard.shareUrl);
        setCopied(true);
        shareMutation.mutate('copy');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        const textArea = document.createElement('textarea');
        textArea.value = generatedCard.shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        shareMutation.mutate('copy');
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleSocialShare = (platform: string, url: string) => {
    shareMutation.mutate(platform);
    window.open(url, '_blank', 'width=600,height=400');
  };

  const styles = stylesData?.styles || [];
  const memories = memoriesData?.memories || [];
  const cards = cardsData?.cards || [];
  const onThisDay = onThisDayData || { memoriesFromThisDay: [], createdOnThisDay: [], hasMemories: false, displayDate: '' };

  return (
    <div className="min-h-screen bg-void text-paper antialiased">
      <Navigation />

      <div className="px-6 md:px-12 py-12">
        <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 text-paper-70 hover:text-gold transition-colors mb-8 text-sm">
          <span aria-hidden>←</span> Back to Vault
        </button>

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-4">Memory Cards</p>
            <h1 className="font-body font-light text-4xl tracking-[-0.018em]">Memory Cards</h1>
            <p className="text-paper-70 max-w-2xl mx-auto mt-4 leading-relaxed">
              Transform your memories into beautiful, shareable cards. Perfect for Instagram,
              Facebook, or sending to loved ones.
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 rounded-[2px] text-sm border transition-colors ${
                activeTab === 'create'
                  ? 'bg-void-surface text-gold border-gold-40'
                  : 'bg-void-surface text-paper-70 border-paper-15 hover:text-paper'
              }`}
            >
              Create card
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-6 py-3 rounded-[2px] text-sm border transition-colors ${
                activeTab === 'gallery'
                  ? 'bg-void-surface text-gold border-gold-40'
                  : 'bg-void-surface text-paper-70 border-paper-15 hover:text-paper'
              }`}
            >
              My cards
            </button>
            <button
              onClick={() => setActiveTab('onthisday')}
              className={`px-6 py-3 rounded-[2px] text-sm border transition-colors ${
                activeTab === 'onthisday'
                  ? 'bg-void-surface text-gold border-gold-40'
                  : 'bg-void-surface text-paper-70 border-paper-15 hover:text-paper'
              }`}
            >
              On this day
            </button>
          </div>

          {/* Create Tab */}
          {activeTab === 'create' && (
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                {/* Memory Selection */}
                <div className="bg-void-surface border border-paper-15 p-6 rounded-[2px]">
                  <h2 className="font-body text-xl mb-4">1. Select a memory</h2>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {memories.length === 0 ? (
                      <p className="text-paper-60 text-center py-8">
                        No memories yet. Create some memories first.
                      </p>
                    ) : (
                      memories.map((memory: any) => (
                        <button
                          key={memory.id}
                          onClick={() => setSelectedMemory(memory.id)}
                          className={`w-full text-left p-4 rounded-[2px] border transition-colors ${
                            selectedMemory === memory.id
                              ? 'bg-void border-gold-40'
                              : 'bg-void border-paper-15 hover:border-gold-40'
                          }`}
                        >
                          <div className="font-medium text-paper">{memory.title || 'Untitled Memory'}</div>
                          <div className="text-sm text-paper-60 line-clamp-2">
                            {memory.description?.substring(0, 100) || 'No description'}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Style Selection */}
                <div className="bg-void-surface border border-paper-15 p-6 rounded-[2px]">
                  <h2 className="font-body text-xl mb-4">2. Choose a style</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {styles.map((style: CardStyle) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-4 rounded-[2px] text-left border transition-colors ${
                          selectedStyle === style.id
                            ? 'border-gold-40'
                            : 'border-paper-15 hover:border-gold-40'
                        }`}
                        style={{
                          background: style.bgColor,
                          color: style.textColor,
                        }}
                      >
                        <div className="font-medium text-sm">{style.name}</div>
                        <div className="text-xs opacity-70">{style.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="bg-void-surface border border-paper-15 p-6 rounded-[2px]">
                  <h2 className="font-body text-xl mb-4">3. Customize</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">
                        Custom quote — optional
                      </label>
                      <textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Leave empty to auto-extract from memory..."
                        className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors min-h-[80px] resize-y"
                        maxLength={200}
                      />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePhoto}
                        onChange={(e) => setIncludePhoto(e.target.checked)}
                        className="w-5 h-5 rounded-[2px] border-paper-15 bg-void text-gold"
                      />
                      <span className="text-paper-70 text-sm">Include photo if available</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!selectedMemory || generateMutation.isPending}
                  className="btn btn-primary w-full py-4"
                >
                  {generateMutation.isPending ? 'Generating…' : (
                    <>
                      Generate card <span aria-hidden>→</span>
                    </>
                  )}
                </button>
              </motion.div>

              {/* Preview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {generatedCard ? (
                  <div className="bg-void-surface border border-paper-15 p-6 rounded-[2px]">
                    <h2 className="font-body text-xl mb-4">Your card</h2>

                    {/* Card Preview */}
                    <div
                      className="rounded-[2px] p-8 mb-6 min-h-[300px] flex flex-col justify-center"
                      style={{
                        background: generatedCard.styleConfig.bgColor,
                        color: generatedCard.styleConfig.textColor,
                      }}
                    >
                      {generatedCard.photoUrl && (
                        <img
                          src={generatedCard.photoUrl}
                          alt="Memory"
                          className="w-full h-48 object-cover rounded-[2px] mb-4"
                        />
                      )}
                      <blockquote className="font-body text-xl italic mb-4">
                        "{generatedCard.quote}"
                      </blockquote>
                      <div className="text-sm opacity-70">
                        <div>— {generatedCard.authorName}</div>
                        {generatedCard.memoryDate && (
                          <div>{generatedCard.memoryDate}</div>
                        )}
                      </div>
                      <div
                        className="mt-4 text-xs opacity-50"
                        style={{ color: generatedCard.styleConfig.accentColor }}
                      >
                        Made with Heirloom
                      </div>
                    </div>

                    {/* Share Options */}
                    <div className="space-y-4">
                      <button
                        onClick={handleCopyLink}
                        className="btn btn-ghost w-full"
                      >
                        {copied ? 'Link copied' : 'Copy share link'}
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleSocialShare('twitter', generatedCard.socialShareUrls.twitter)}
                          className="btn btn-ghost"
                        >
                          Twitter
                        </button>
                        <button
                          onClick={() => handleSocialShare('facebook', generatedCard.socialShareUrls.facebook)}
                          className="btn btn-ghost"
                        >
                          Facebook
                        </button>
                        <button
                          onClick={() => handleSocialShare('whatsapp', generatedCard.socialShareUrls.whatsapp)}
                          className="btn btn-ghost"
                        >
                          WhatsApp
                        </button>
                        <button
                          onClick={() => handleSocialShare('linkedin', generatedCard.socialShareUrls.linkedin)}
                          className="btn btn-ghost"
                        >
                          LinkedIn
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-void-surface border border-paper-15 text-center py-16 px-6 rounded-[2px]">
                    <span className="font-body text-4xl text-gold block mb-4" aria-hidden>∞</span>
                    <p className="text-paper-60">
                      Select a memory and style to generate your card
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {cards.length === 0 ? (
                <div className="bg-void-surface border border-paper-15 text-center py-16 px-6 rounded-[2px]">
                  <span className="font-body text-4xl text-gold block mb-4" aria-hidden>∞</span>
                  <p className="text-paper-60 mb-6">
                    You haven't created any cards yet
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="btn btn-primary"
                  >
                    Create your first card <span aria-hidden>→</span>
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.map((card: any) => (
                    <div key={card.id} className="bg-void-surface border border-paper-15 p-6 rounded-[2px]">
                      <div className="text-sm text-paper-60 mb-2">
                        {card.memoryTitle || 'Untitled'}
                      </div>
                      <blockquote className="font-body text-paper italic mb-4 line-clamp-3">
                        "{card.quote}"
                      </blockquote>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-paper-60">
                          {card.shareCount || 0} shares
                        </span>
                        <a
                          href={card.shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-gold hover:text-gold-bright transition-colors"
                        >
                          View card <span aria-hidden>→</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* On This Day Tab */}
          {activeTab === 'onthisday' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-void-surface border border-gold-40 rounded-[2px] text-gold font-mono text-xs tracking-[0.12em] uppercase">
                  {onThisDay.displayDate}
                </div>
              </div>

              {!onThisDay.hasMemories ? (
                <div className="bg-void-surface border border-paper-15 text-center py-16 px-6 rounded-[2px]">
                  <span className="font-body text-4xl text-gold block mb-4" aria-hidden>∞</span>
                  <p className="text-paper-70 mb-2">
                    No memories from this day in previous years
                  </p>
                  <p className="text-paper-60 text-sm">
                    Keep capturing memories and they'll appear here on their anniversaries.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {onThisDay.memoriesFromThisDay.length > 0 && (
                    <div>
                      <h3 className="font-body text-xl mb-4">Memories from this day</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {onThisDay.memoriesFromThisDay.map((memory: OnThisDayMemory) => (
                          <div key={memory.id} className="bg-void-surface border border-paper-15 p-6 rounded-[2px]">
                            <div className="text-gold text-sm mb-3">
                              {memory.yearsAgo} year{memory.yearsAgo !== 1 ? 's' : ''} ago ({memory.year})
                            </div>
                            {memory.photoUrl && (
                              <img
                                src={memory.photoUrl}
                                alt={memory.title}
                                className="w-full h-40 object-cover rounded-[2px] mb-4"
                              />
                            )}
                            <h4 className="font-body text-paper mb-2">{memory.title || 'Untitled Memory'}</h4>
                            <p className="text-paper-70 text-sm">{memory.description}</p>
                            <div className="mt-4 flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedMemory(memory.id);
                                  setActiveTab('create');
                                }}
                                className="btn btn-ghost text-sm"
                              >
                                Create card
                              </button>
                              <button
                                onClick={() => navigate(`/memories/${memory.id}`)}
                                className="btn btn-ghost text-sm"
                              >
                                View memory
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {onThisDay.createdOnThisDay.length > 0 && (
                    <div>
                      <h3 className="font-body text-xl mb-4">Created on this day</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {onThisDay.createdOnThisDay.map((memory: OnThisDayMemory) => (
                          <div key={memory.id} className="bg-void-surface border border-paper-15 p-6 rounded-[2px]">
                            <div className="text-paper-60 text-sm mb-3">
                              Created {memory.yearsAgo} year{memory.yearsAgo !== 1 ? 's' : ''} ago
                            </div>
                            <h4 className="font-body text-paper mb-2">{memory.title || 'Untitled Memory'}</h4>
                            <p className="text-paper-70 text-sm">{memory.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MemoryCards;
