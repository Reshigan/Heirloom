import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from '../components/Navigation';
import { ProgressHair } from '../components/ui/ProgressHair';
import { FeatureOnboarding, useFeatureOnboarding, OnboardingHelpButton } from '../components/FeatureOnboarding';
import api from '../services/api';

const CATEGORY_CONFIG: Record<string, { label: string }> = {
  PEOPLE: { label: 'People to Remember' },
  STORIES: { label: 'Stories to Tell' },
  GRATITUDE: { label: 'Gratitude & Love' },
  PRACTICAL: { label: 'Practical Matters' },
  WISDOM: { label: 'Wisdom to Share' },
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
      <div className="min-h-screen relative bg-void">
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <ProgressHair label="loading…" width={180} />
        </div>
      </div>
    );
  }

  const plan = data?.plan;
  const itemsByCategory = data?.itemsByCategory || {};

  return (
    <div className="min-h-screen relative bg-void text-paper antialiased">
      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-16 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-4">Thread Plan</p>
          <h1 className="font-display font-light text-4xl md:text-5xl mb-4 tracking-[-0.018em]">Thread Plan</h1>
          <p className="text-paper-70 max-w-xl mx-auto leading-relaxed font-light">
            A structured guide for what to write into your family thread first. Work through these so the people who come after you have something to read.
          </p>
        </motion.div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-void-surface border border-paper-15 rounded-[2px] p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-body text-xl">Your Progress</h2>
              <p className="text-paper-65 text-sm">
                {plan?.completedItems || 0} of {plan?.totalItems || 0} items completed
              </p>
            </div>
            <div className="text-4xl font-display text-gold">{plan?.progressPercent || 0}%</div>
          </div>

          <div className="h-px bg-paper-15 overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gold"
              initial={{ width: 0 }}
              animate={{ width: `${plan?.progressPercent || 0}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleShareMutation.mutate(!(plan?.share_progress === 1))}
              className={`px-4 py-2 rounded-[2px] text-sm transition-colors border ${
                plan?.share_progress === 1
                  ? 'border-gold-40 text-gold'
                  : 'border-paper-15 text-paper-70 hover:text-paper'
              }`}
            >
              {plan?.share_progress === 1 ? 'Sharing Enabled' : 'Share Progress'}
            </button>

            {shareUrl && (
              <div className="flex items-center gap-2 text-sm text-paper-70">
                <span className="truncate max-w-[200px] font-mono">{shareUrl}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="text-gold hover:text-gold-bright transition-colors"
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
            const items = itemsByCategory[category] || [];
            const completedCount = items.filter(i => i.completed === 1).length;
            const isExpanded = expandedCategories.has(category);

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-void-surface border border-paper-15 rounded-[2px] overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-4 flex items-center justify-between hover:bg-void-elevated transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <h3 className="font-body">{config.label}</h3>
                      <p className="text-sm text-paper-65">{completedCount} of {items.length} completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-px bg-paper-15 overflow-hidden">
                      <div
                        className="h-full bg-gold"
                        style={{ width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span aria-hidden className="text-paper-50">{isExpanded ? '−' : '+'}</span>
                  </div>
                </button>

                {/* Items */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-paper-15"
                    >
                      <div className="p-4 space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-start gap-3 p-3 rounded-[2px] transition-colors ${
                              item.completed === 1 ? 'bg-void-elevated' : 'bg-void hover:bg-void-elevated'
                            }`}
                          >
                            <button
                              onClick={() => toggleItemMutation.mutate({
                                itemId: item.id,
                                completed: item.completed !== 1
                              })}
                              aria-label={item.completed === 1 ? 'Mark incomplete' : 'Mark complete'}
                              className={`w-6 h-6 rounded-[2px] border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                                item.completed === 1
                                  ? 'border-gold-40 text-gold'
                                  : 'border-paper-15 hover:border-gold'
                              }`}
                            >
                              {item.completed === 1 && <span aria-hidden>✓</span>}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`font-body ${item.completed === 1 ? 'line-through text-paper-65' : ''}`}>
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-sm text-paper-65 mt-1">{item.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => deleteItemMutation.mutate(item.id)}
                              aria-label="Delete item"
                              className="text-paper-50 hover:text-blood transition-colors p-1 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}

                        {/* Add Item Form */}
                        {showAddItem === category ? (
                          <div className="p-3 bg-void rounded-[2px] space-y-3">
                            <input
                              type="text"
                              value={newItemTitle}
                              onChange={(e) => setNewItemTitle(e.target.value)}
                              placeholder="What do you want to accomplish?"
                              className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper rounded-[2px] px-4 py-2 placeholder:text-paper-30 transition-colors"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={newItemDescription}
                              onChange={(e) => setNewItemDescription(e.target.value)}
                              placeholder="Add a description (optional)"
                              className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper rounded-[2px] px-4 py-2 placeholder:text-paper-30 transition-colors"
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
                            className="w-full p-3 border border-dashed border-paper-15 rounded-[2px] text-paper-65 hover:text-paper hover:border-paper-15 transition-colors flex items-center justify-center gap-2"
                          >
                            <span aria-hidden>+</span>
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
          className="mt-8 bg-void-surface border border-paper-15 rounded-[2px] p-6"
        >
          <h3 className="font-body mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/record" className="p-4 bg-void border border-paper-15 rounded-[2px] hover:bg-void-elevated transition-colors text-center">
              <p className="text-sm">Record a Story</p>
            </a>
            <a href="/compose" className="p-4 bg-void border border-paper-15 rounded-[2px] hover:bg-void-elevated transition-colors text-center">
              <p className="text-sm">Write a Letter</p>
            </a>
            <a href="/memories" className="p-4 bg-void border border-paper-15 rounded-[2px] hover:bg-void-elevated transition-colors text-center">
              <p className="text-sm">Add Photos</p>
            </a>
            <a href="/family" className="p-4 bg-void border border-paper-15 rounded-[2px] hover:bg-void-elevated transition-colors text-center">
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
