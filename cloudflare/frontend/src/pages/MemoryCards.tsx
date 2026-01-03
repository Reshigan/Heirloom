import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Check, Loader2, Image, Sparkles, Calendar, Clock } from '../components/Icons';
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
    <div className="min-h-screen relative overflow-hidden">
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      <Navigation />

      <div className="relative z-10 px-6 md:px-12 py-12">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8">
          <ArrowLeft size={20} />
          Back to Vault
        </button>

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Image size={32} className="text-gold" />
              <h1 className="text-4xl font-light">Memory Cards</h1>
            </div>
            <p className="text-paper/60 max-w-2xl mx-auto">
              Transform your memories into beautiful, shareable cards. Perfect for Instagram, 
              Facebook, or sending to loved ones.
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 rounded-lg transition-all ${
                activeTab === 'create' 
                  ? 'bg-gold text-void' 
                  : 'bg-white/5 text-paper/70 hover:bg-white/10'
              }`}
            >
              <Sparkles size={18} className="inline mr-2" />
              Create Card
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-6 py-3 rounded-lg transition-all ${
                activeTab === 'gallery' 
                  ? 'bg-gold text-void' 
                  : 'bg-white/5 text-paper/70 hover:bg-white/10'
              }`}
            >
              <Image size={18} className="inline mr-2" />
              My Cards
            </button>
            <button
              onClick={() => setActiveTab('onthisday')}
              className={`px-6 py-3 rounded-lg transition-all ${
                activeTab === 'onthisday' 
                  ? 'bg-gold text-void' 
                  : 'bg-white/5 text-paper/70 hover:bg-white/10'
              }`}
            >
              <Calendar size={18} className="inline mr-2" />
              On This Day
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
                <div className="card">
                  <h2 className="text-xl font-medium mb-4">1. Select a Memory</h2>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {memories.length === 0 ? (
                      <p className="text-paper/50 text-center py-8">
                        No memories yet. Create some memories first!
                      </p>
                    ) : (
                      memories.map((memory: any) => (
                        <button
                          key={memory.id}
                          onClick={() => setSelectedMemory(memory.id)}
                          className={`w-full text-left p-4 rounded-lg transition-all ${
                            selectedMemory === memory.id
                              ? 'bg-gold/20 border border-gold'
                              : 'bg-white/5 hover:bg-white/10 border border-transparent'
                          }`}
                        >
                          <div className="font-medium">{memory.title || 'Untitled Memory'}</div>
                          <div className="text-sm text-paper/50 line-clamp-2">
                            {memory.description?.substring(0, 100) || 'No description'}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Style Selection */}
                <div className="card">
                  <h2 className="text-xl font-medium mb-4">2. Choose a Style</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {styles.map((style: CardStyle) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-4 rounded-lg transition-all text-left ${
                          selectedStyle === style.id
                            ? 'ring-2 ring-gold'
                            : 'hover:bg-white/5'
                        }`}
                        style={{
                          background: style.bgColor.includes('gradient') ? style.bgColor : style.bgColor,
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
                <div className="card">
                  <h2 className="text-xl font-medium mb-4">3. Customize</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-paper/50 mb-2">
                        Custom Quote (optional)
                      </label>
                      <textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Leave empty to auto-extract from memory..."
                        className="input min-h-[80px]"
                        maxLength={200}
                      />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePhoto}
                        onChange={(e) => setIncludePhoto(e.target.checked)}
                        className="w-5 h-5 rounded border-paper/30 bg-void text-gold focus:ring-gold"
                      />
                      <span>Include photo if available</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!selectedMemory || generateMutation.isPending}
                  className="btn btn-primary w-full py-4"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generate Card
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
                  <div className="card">
                    <h2 className="text-xl font-medium mb-4">Your Card</h2>
                    
                    {/* Card Preview */}
                    <div 
                      className="rounded-lg p-8 mb-6 min-h-[300px] flex flex-col justify-center"
                      style={{
                        background: generatedCard.styleConfig.bgColor,
                        color: generatedCard.styleConfig.textColor,
                      }}
                    >
                      {generatedCard.photoUrl && (
                        <img 
                          src={generatedCard.photoUrl} 
                          alt="Memory" 
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                      <blockquote className="text-xl italic mb-4">
                        "{generatedCard.quote}"
                      </blockquote>
                      <div className="text-sm opacity-70">
                        <div>- {generatedCard.authorName}</div>
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
                        className="btn btn-secondary w-full"
                      >
                        {copied ? (
                          <>
                            <Check size={18} className="text-emerald-500" />
                            Link Copied!
                          </>
                        ) : (
                          <>
                            <Share2 size={18} />
                            Copy Share Link
                          </>
                        )}
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleSocialShare('twitter', generatedCard.socialShareUrls.twitter)}
                          className="btn bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
                        >
                          Twitter
                        </button>
                        <button
                          onClick={() => handleSocialShare('facebook', generatedCard.socialShareUrls.facebook)}
                          className="btn bg-[#4267B2] hover:bg-[#365899] text-white"
                        >
                          Facebook
                        </button>
                        <button
                          onClick={() => handleSocialShare('whatsapp', generatedCard.socialShareUrls.whatsapp)}
                          className="btn bg-[#25D366] hover:bg-[#20bd5a] text-white"
                        >
                          WhatsApp
                        </button>
                        <button
                          onClick={() => handleSocialShare('linkedin', generatedCard.socialShareUrls.linkedin)}
                          className="btn bg-[#0077B5] hover:bg-[#006699] text-white"
                        >
                          LinkedIn
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card text-center py-16">
                    <Image size={64} className="text-paper/20 mx-auto mb-4" />
                    <p className="text-paper/50">
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
                <div className="card text-center py-16">
                  <Image size={64} className="text-paper/20 mx-auto mb-4" />
                  <p className="text-paper/50 mb-4">
                    You haven't created any cards yet
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="btn btn-primary"
                  >
                    Create Your First Card
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.map((card: any) => (
                    <div key={card.id} className="card">
                      <div className="text-sm text-paper/50 mb-2">
                        {card.memoryTitle || 'Untitled'}
                      </div>
                      <blockquote className="text-paper/80 italic mb-4 line-clamp-3">
                        "{card.quote}"
                      </blockquote>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-paper/50">
                          {card.shareCount || 0} shares
                        </span>
                        <a
                          href={card.shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold hover:underline"
                        >
                          View Card
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
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 rounded-full text-gold">
                  <Calendar size={18} />
                  {onThisDay.displayDate}
                </div>
              </div>

              {!onThisDay.hasMemories ? (
                <div className="card text-center py-16">
                  <Clock size={64} className="text-paper/20 mx-auto mb-4" />
                  <p className="text-paper/50 mb-2">
                    No memories from this day in previous years
                  </p>
                  <p className="text-paper/30 text-sm">
                    Keep capturing memories and they'll appear here on their anniversaries!
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {onThisDay.memoriesFromThisDay.length > 0 && (
                    <div>
                      <h3 className="text-xl font-medium mb-4">Memories from this day</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {onThisDay.memoriesFromThisDay.map((memory: OnThisDayMemory) => (
                          <div key={memory.id} className="card">
                            <div className="flex items-center gap-2 text-gold text-sm mb-3">
                              <Calendar size={16} />
                              {memory.yearsAgo} year{memory.yearsAgo !== 1 ? 's' : ''} ago ({memory.year})
                            </div>
                            {memory.photoUrl && (
                              <img 
                                src={memory.photoUrl} 
                                alt={memory.title} 
                                className="w-full h-40 object-cover rounded-lg mb-4"
                              />
                            )}
                            <h4 className="font-medium mb-2">{memory.title || 'Untitled Memory'}</h4>
                            <p className="text-paper/60 text-sm">{memory.description}</p>
                            <div className="mt-4 flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedMemory(memory.id);
                                  setActiveTab('create');
                                }}
                                className="btn btn-secondary text-sm"
                              >
                                Create Card
                              </button>
                              <button
                                onClick={() => navigate(`/memories/${memory.id}`)}
                                className="btn btn-ghost text-sm"
                              >
                                View Memory
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {onThisDay.createdOnThisDay.length > 0 && (
                    <div>
                      <h3 className="text-xl font-medium mb-4">Created on this day</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {onThisDay.createdOnThisDay.map((memory: OnThisDayMemory) => (
                          <div key={memory.id} className="card bg-white/[0.02]">
                            <div className="flex items-center gap-2 text-paper/50 text-sm mb-3">
                              <Clock size={16} />
                              Created {memory.yearsAgo} year{memory.yearsAgo !== 1 ? 's' : ''} ago
                            </div>
                            <h4 className="font-medium mb-2">{memory.title || 'Untitled Memory'}</h4>
                            <p className="text-paper/60 text-sm">{memory.description}</p>
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
