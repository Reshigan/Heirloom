import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Plus, Trash2, Share2, Users, BookOpen, Heart, FileText, Lightbulb, ChevronDown, ChevronUp, Link2
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Mic, Mail, Image, Family } from '../components/Icons';
import { FeatureOnboarding, useFeatureOnboarding, OnboardingHelpButton } from '../components/FeatureOnboarding';
import api from '../services/api';

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  PEOPLE: { icon: Users, label: 'People to Remember', color: 'text-blue-400' },
  STORIES: { icon: BookOpen, label: 'Stories to Tell', color: 'text-purple-400' },
  GRATITUDE: { icon: Heart, label: 'Gratitude & Love', color: 'text-pink-400' },
  PRACTICAL: { icon: FileText, label: 'Practical Matters', color: 'text-green-400' },
  WISDOM: { icon: Lightbulb, label: 'Wisdom to Share', color: 'text-yellow-400' },
};

interface PlanItem {
  id: string;
  category: string;
  title: string;
  description: string;
  completed: number;
  completed_at: string | null;
  linked_type: string | null;
  linked_id: string | null;
}

interface LegacyPlan {
  plan: {
    id: string;
    share_token: string;
    share_progress: number;
    totalItems: number;
    completedItems: number;
    progressPercent: number;
  };
  items: PlanItem[];
  itemsByCategory: Record<string, PlanItem[]>;
}

export function LegacyPlan() {
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['PEOPLE', 'STORIES']));
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Feature onboarding
  const { isOpen: isOnboardingOpen, completeOnboarding, dismissOnboarding, openOnboarding } = useFeatureOnboarding('legacy-plan');

    const { data, isLoading } = useQuery<LegacyPlan>({
      queryKey: ['legacy-plan'],
      queryFn: () => api.get('/api/legacy-plan').then((r: { data: LegacyPlan }) => r.data),
    });

  const toggleItemMutation = useMutation({
    mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) =>
      api.patch(`/api/legacy-plan/items/${itemId}`, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['legacy-plan'] }),
  });

  const addItemMutation = useMutation({
    mutationFn: (data: { category: string; title: string; description?: string }) =>
      api.post('/api/legacy-plan/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legacy-plan'] });
      setShowAddItem(null);
      setNewItemTitle('');
      setNewItemDescription('');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => api.delete(`/api/legacy-plan/items/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['legacy-plan'] }),
  });

    const toggleShareMutation = useMutation({
      mutationFn: (shareProgress: boolean) => api.patch('/api/legacy-plan/share', { shareProgress }),
      onSuccess: (response: { data: { shareUrl?: string } }) => {
        queryClient.invalidateQueries({ queryKey: ['legacy-plan'] });
        if (response.data.shareUrl) {
          setShareUrl(`${window.location.origin}${response.data.shareUrl}`);
        }
      },
    });

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddItem = (category: string) => {
    if (!newItemTitle.trim()) return;
    addItemMutation.mutate({
      category,
      title: newItemTitle.trim(),
      description: newItemDescription.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="eternal-bg">
          <div className="eternal-aura" />
          <div className="eternal-stars" />
        </div>
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const plan = data?.plan;
  const itemsByCategory = data?.itemsByCategory || {};

  return (
    <div className="min-h-screen relative">
      <div className="eternal-bg">
        <div className="eternal-aura" />
        <div className="eternal-stars" />
        <div className="eternal-mist" />
      </div>

      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-16 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-5xl mb-4">Legacy Playbook</h1>
          <p className="text-paper/60 max-w-xl mx-auto">
            Your personal guide to preserving what matters most. Complete these items to build a meaningful legacy.
          </p>
        </motion.div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-medium">Your Progress</h2>
              <p className="text-paper/50 text-sm">
                {plan?.completedItems || 0} of {plan?.totalItems || 0} items completed
              </p>
            </div>
            <div className="text-4xl font-display text-gold">{plan?.progressPercent || 0}%</div>
          </div>
          
          <div className="h-3 bg-void/50 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-gold to-gold/70 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${plan?.progressPercent || 0}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleShareMutation.mutate(!(plan?.share_progress === 1))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                plan?.share_progress === 1 
                  ? 'bg-gold/20 text-gold border border-gold/30' 
                  : 'glass hover:bg-paper/5'
              }`}
            >
              <Share2 size={16} />
              {plan?.share_progress === 1 ? 'Sharing Enabled' : 'Share Progress'}
            </button>
            
            {shareUrl && (
              <div className="flex items-center gap-2 text-sm text-paper/60">
                <Link2 size={14} />
                <span className="truncate max-w-[200px]">{shareUrl}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="text-gold hover:text-gold/80"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Categories */}
        <div className="space-y-4">
          {Object.entries(CATEGORY_CONFIG).map(([category, config], index) => {
            const Icon = config.icon;
            const items = itemsByCategory[category] || [];
            const completedCount = items.filter(i => i.completed === 1).length;
            const isExpanded = expandedCategories.has(category);

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="glass rounded-xl overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-4 flex items-center justify-between hover:bg-paper/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-paper/5 flex items-center justify-center ${config.color}`}>
                      <Icon size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">{config.label}</h3>
                      <p className="text-sm text-paper/50">{completedCount} of {items.length} completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-void/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${config.color.replace('text-', 'bg-')}`}
                        style={{ width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` }}
                      />
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {/* Items */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-paper/10"
                    >
                      <div className="p-4 space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                              item.completed === 1 ? 'bg-green-500/10' : 'bg-paper/5 hover:bg-paper/10'
                            }`}
                          >
                            <button
                              onClick={() => toggleItemMutation.mutate({ 
                                itemId: item.id, 
                                completed: item.completed !== 1 
                              })}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                item.completed === 1 
                                  ? 'bg-green-500 border-green-500 text-white' 
                                  : 'border-paper/30 hover:border-gold'
                              }`}
                            >
                              {item.completed === 1 && <Check size={14} />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${item.completed === 1 ? 'line-through text-paper/50' : ''}`}>
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-sm text-paper/50 mt-1">{item.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => deleteItemMutation.mutate(item.id)}
                              className="text-paper/30 hover:text-red-400 transition-colors p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}

                        {/* Add Item Form */}
                        {showAddItem === category ? (
                          <div className="p-3 bg-paper/5 rounded-lg space-y-3">
                            <input
                              type="text"
                              value={newItemTitle}
                              onChange={(e) => setNewItemTitle(e.target.value)}
                              placeholder="What do you want to accomplish?"
                              className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-2 focus:outline-none focus:border-gold/50"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={newItemDescription}
                              onChange={(e) => setNewItemDescription(e.target.value)}
                              placeholder="Add a description (optional)"
                              className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-2 focus:outline-none focus:border-gold/50"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddItem(category)}
                                disabled={!newItemTitle.trim() || addItemMutation.isPending}
                                className="btn btn-primary btn-sm"
                              >
                                Add Item
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddItem(null);
                                  setNewItemTitle('');
                                  setNewItemDescription('');
                                }}
                                className="btn btn-ghost btn-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowAddItem(category)}
                            className="w-full p-3 border border-dashed border-paper/20 rounded-lg text-paper/50 hover:text-paper hover:border-paper/40 transition-all flex items-center justify-center gap-2"
                          >
                            <Plus size={16} />
                            Add custom item
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 glass rounded-xl p-6"
        >
          <h3 className="font-medium mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/record" className="p-4 bg-paper/5 rounded-lg hover:bg-paper/10 transition-all text-center group">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Mic size={20} />
              </div>
              <p className="text-sm">Record a Story</p>
            </a>
            <a href="/compose" className="p-4 bg-paper/5 rounded-lg hover:bg-paper/10 transition-all text-center group">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Mail size={20} />
              </div>
              <p className="text-sm">Write a Letter</p>
            </a>
            <a href="/memories" className="p-4 bg-paper/5 rounded-lg hover:bg-paper/10 transition-all text-center group">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                <Image size={20} />
              </div>
              <p className="text-sm">Add Photos</p>
            </a>
            <a href="/family" className="p-4 bg-paper/5 rounded-lg hover:bg-paper/10 transition-all text-center group">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                <Family size={20} />
              </div>
              <p className="text-sm">Add Family</p>
            </a>
          </div>
        </motion.div>
      </main>

      {/* Help Button */}
      <OnboardingHelpButton onClick={openOnboarding} />

      {/* Feature Onboarding */}
      <FeatureOnboarding
        featureKey="legacy-plan"
        isOpen={isOnboardingOpen}
        onComplete={completeOnboarding}
        onDismiss={dismissOnboarding}
      />
    </div>
  );
}

export default LegacyPlan;
