import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Lock, Users, Loader2, Check, X, Image, Sparkles } from '../components/Icons';
import { Navigation } from '../components/Navigation';
import { EmptyState } from '../components/EmptyState';
import { capsulesApi } from '../services/api';

type CapsuleStatus = 'open' | 'sealed' | 'unlocked';

interface Capsule {
  id: string;
  title: string;
  description: string;
  unlock_date: string;
  sealed_at: string | null;
  opened_at: string | null;
  cover_style: string;
  contributor_count: number;
  item_count: number;
  created_at: string;
}

function CapsuleCard({ capsule, onClick, isSelected }: { capsule: Capsule; onClick: () => void; isSelected?: boolean }) {
  const status: CapsuleStatus = capsule.opened_at ? 'unlocked' : capsule.sealed_at ? 'sealed' : 'open';
  const unlockDate = new Date(capsule.unlock_date);
  const now = new Date();
  const daysUntilUnlock = Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const canOpen = status === 'sealed' && daysUntilUnlock <= 0;

  return (
    <motion.button
      onClick={onClick}
      className={`w-full text-left p-6 rounded-2xl glass border transition-all group ${isSelected ? 'border-gold/50 ring-1 ring-gold/20' : 'border-paper/10 hover:border-gold/30'}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          status === 'unlocked' ? 'bg-green-500/20 text-green-400' :
          status === 'sealed' ? 'bg-gold/20 text-gold' :
          'bg-paper/10 text-paper/65'
        }`}>
          {status === 'unlocked' ? <Check size={24} /> :
           status === 'sealed' ? <Lock size={24} /> :
           <Clock size={24} />}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          canOpen ? 'bg-gold/20 text-gold' :
          status === 'sealed' ? 'bg-paper/10 text-paper/70' :
          status === 'unlocked' ? 'bg-green-500/10 text-green-400' :
          'bg-paper/5 text-paper/65'
        }`}>
          {canOpen ? 'Ready to open!' :
           status === 'sealed' ? `Opens in ${daysUntilUnlock} days` :
           status === 'unlocked' ? 'Opened' :
           'Collecting memories'}
        </span>
      </div>

      <h3 className="font-serif text-xl text-paper mb-1 group-hover:text-gold transition-colors">
        {capsule.title}
      </h3>
      {capsule.description && (
        <p className="text-paper/70 text-sm mb-4 line-clamp-2">{capsule.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-paper/65">
        <span className="flex items-center gap-1">
          <Users size={12} /> {capsule.contributor_count} contributors
        </span>
        <span className="flex items-center gap-1">
          <Image size={12} /> {capsule.item_count} items
        </span>
        <span>Opens {unlockDate.toLocaleDateString()}</span>
      </div>
    </motion.button>
  );
}

export function TimeCapsule() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<string | null>(null);
  const [newCapsule, setNewCapsule] = useState({
    title: '',
    description: '',
    unlock_date: '',
    cover_style: 'classic',
  });

  const { data: capsules, isLoading } = useQuery({
    queryKey: ['capsules'],
    queryFn: () => capsulesApi.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newCapsule) => capsulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capsules'] });
      setShowCreateModal(false);
      setNewCapsule({ title: '', description: '', unlock_date: '', cover_style: 'classic' });
    },
  });

  const coverStyles = [
    { id: 'classic', label: 'Classic Gold', bg: 'from-gold/20 to-amber-900/20' },
    { id: 'midnight', label: 'Midnight Blue', bg: 'from-blue-900/30 to-indigo-900/20' },
    { id: 'rose', label: 'Rose Garden', bg: 'from-pink-900/20 to-rose-900/20' },
    { id: 'emerald', label: 'Emerald', bg: 'from-emerald-900/20 to-green-900/20' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="eternal-bg">
        <div className="eternal-aura" />
        <div className="eternal-stars" />
        <div className="eternal-mist" />
      </div>
      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-32 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-paper mb-2">Time Capsules</h1>
            <p className="text-paper/65 font-serif">Seal memories today, open them when the time is right</p>
          </div>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-void font-medium text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={18} />
            New Capsule
          </motion.button>
        </div>

        {/* Capsule list */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="text-gold animate-spin" />
          </div>
        ) : !capsules?.length ? (
          <EmptyState
            icon={Clock}
            title="No time capsules yet"
            subtitle="Create your first time capsule and fill it with memories, messages, and photos for your loved ones to open in the future."
            actionLabel="Create Time Capsule"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {capsules.map((capsule: Capsule) => (
              <CapsuleCard
                key={capsule.id}
                capsule={capsule}
                isSelected={selectedCapsule === capsule.id}
                onClick={() => setSelectedCapsule(capsule.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass rounded-2xl border border-paper/10 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl text-paper">Create Time Capsule</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-paper/70 hover:text-paper">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-paper/65 mb-1">Capsule Name</label>
                  <input
                    type="text"
                    value={newCapsule.title}
                    onChange={(e) => setNewCapsule((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-paper/5 border border-paper/10 text-paper focus:border-gold/30 focus:outline-none"
                    placeholder="Family Christmas 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/65 mb-1">Description (optional)</label>
                  <textarea
                    value={newCapsule.description}
                    onChange={(e) => setNewCapsule((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-paper/5 border border-paper/10 text-paper focus:border-gold/30 focus:outline-none resize-none h-20"
                    placeholder="A collection of memories from this special year..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/65 mb-1">Unlock Date</label>
                  <input
                    type="date"
                    value={newCapsule.unlock_date}
                    onChange={(e) => setNewCapsule((prev) => ({ ...prev, unlock_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-paper/5 border border-paper/10 text-paper focus:border-gold/30 focus:outline-none"
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/65 mb-2">Cover Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {coverStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setNewCapsule((prev) => ({ ...prev, cover_style: style.id }))}
                        className={`p-3 rounded-xl bg-gradient-to-br ${style.bg} border transition-all text-sm ${
                          newCapsule.cover_style === style.id
                            ? 'border-gold/50 ring-1 ring-gold/20'
                            : 'border-paper/10'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl text-paper/65 hover:text-paper transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={() => createMutation.mutate(newCapsule)}
                  disabled={!newCapsule.title || !newCapsule.unlock_date || createMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-void font-medium text-sm disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Create Capsule
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TimeCapsule;
