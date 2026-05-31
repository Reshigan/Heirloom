import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigation } from '../components/Navigation';
import { ProgressHair } from '../components/ui/ProgressHair';
import { capsulesApi, threadsApi } from '../services/api';

type CapsuleStatus = 'open' | 'sealed' | 'unlocked';

function ThreadComposeBanner() {
  const { data } = useQuery({
    queryKey: ['threads', 'list'],
    queryFn: () => threadsApi.list().then((r) => r.data).catch(() => null),
  });
  const featured = data?.threads?.[0];
  if (!featured) return null;
  return (
    <div className="mb-8 border border-gold-40 px-5 py-4 bg-void-surface flex items-start gap-4 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[0.65rem] tracking-[0.28em] uppercase text-gold mb-1">
          Now part of your family thread
        </p>
        <p className="text-paper text-sm leading-relaxed">
          Time-locked entries are now first-class on the thread. New writes go there alongside everything else; existing capsules keep working below.
        </p>
      </div>
      <Link
        to={`/threads/${featured.id}/compose`}
        className="inline-flex items-center gap-2 text-gold hover:text-gold-bright text-sm whitespace-nowrap"
      >
        Write a locked entry <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

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

  const statusLabel =
    status === 'unlocked' ? 'Opened' : status === 'sealed' ? 'Sealed' : 'Open';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-6 bg-void-surface border transition-colors group ${isSelected ? 'border-gold-40' : 'border-paper-15 hover:border-gold-40'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="font-mono text-[0.6rem] tracking-[0.24em] uppercase text-paper-50">
          {statusLabel}
        </span>
        <span className={`text-xs px-2 py-1 rounded-[2px] border ${
          canOpen ? 'border-gold-40 text-gold' :
          status === 'sealed' ? 'border-paper-15 text-paper-70' :
          status === 'unlocked' ? 'border-paper-15 text-paper-65' :
          'border-paper-15 text-paper-65'
        }`}>
          {canOpen ? 'Ready to open' :
           status === 'sealed' ? `Opens in ${daysUntilUnlock} days` :
           status === 'unlocked' ? 'Opened' :
           'Collecting memories'}
        </span>
      </div>

      <h3 className="font-body text-xl text-paper mb-1 group-hover:text-gold transition-colors">
        {capsule.title}
      </h3>
      {capsule.description && (
        <p className="text-paper-70 text-sm mb-4 line-clamp-2">{capsule.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-paper-65">
        <span>{capsule.contributor_count} contributors</span>
        <span>{capsule.item_count} items</span>
        <span>Opens {unlockDate.toLocaleDateString()}</span>
      </div>
    </button>
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
    { id: 'classic', label: 'Classic Gold' },
    { id: 'midnight', label: 'Midnight Blue' },
    { id: 'rose', label: 'Rose Garden' },
    { id: 'emerald', label: 'Emerald' },
  ];

  return (
    <div className="min-h-screen bg-void text-paper antialiased">
      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-32 max-w-5xl mx-auto">
        {/* Time-locked entries are now first-class on the family thread.
            Capsules remain functional but new flows route through there. */}
        <ThreadComposeBanner />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-4">Time Capsules</p>
            <h1 className="font-body font-light text-3xl md:text-4xl text-paper mb-2 tracking-[-0.014em]">Time Capsules</h1>
            <p className="text-paper-65 font-body">Seal memories today, open them when the time is right</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary text-sm"
          >
            New Capsule
            <span aria-hidden>→</span>
          </button>
        </div>

        {/* Capsule list */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <ProgressHair label="loading…" width={180} />
          </div>
        ) : !capsules?.length ? (
          <div className="border border-paper-15 bg-void-surface p-10 text-center">
            <h3 className="font-body font-light text-2xl text-paper mb-2 tracking-[-0.014em]">No time capsules yet</h3>
            <p className="text-paper-65 max-w-prose mx-auto leading-relaxed mb-8">
              Create your first time capsule and fill it with memories, messages, and photos for your loved ones to open in the future.
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              Create Time Capsule
              <span aria-hidden>→</span>
            </button>
          </div>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-6"
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="w-full max-w-lg bg-void-surface border border-paper-15 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-body font-light text-2xl text-paper tracking-[-0.014em]">Create Time Capsule</h2>
                <button onClick={() => setShowCreateModal(false)} aria-label="Close" className="text-paper-70 hover:text-paper transition-colors">
                  <span aria-hidden>✕</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Capsule Name</label>
                  <input
                    type="text"
                    value={newCapsule.title}
                    onChange={(e) => setNewCapsule((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                    placeholder="Family Christmas 2025"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Description (optional)</label>
                  <textarea
                    value={newCapsule.description}
                    onChange={(e) => setNewCapsule((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 resize-none h-20 transition-colors"
                    placeholder="A collection of memories from this special year..."
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Unlock Date</label>
                  <input
                    type="date"
                    value={newCapsule.unlock_date}
                    onChange={(e) => setNewCapsule((prev) => ({ ...prev, unlock_date: e.target.value }))}
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] transition-colors"
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Cover Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {coverStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setNewCapsule((prev) => ({ ...prev, cover_style: style.id }))}
                        className={`p-3 rounded-[2px] bg-void-surface border transition-colors text-sm ${
                          newCapsule.cover_style === style.id
                            ? 'border-gold-40 text-gold'
                            : 'border-paper-15 text-paper-70'
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
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate(newCapsule)}
                  disabled={!newCapsule.title || !newCapsule.unlock_date || createMutation.isPending}
                  className="btn btn-primary"
                >
                  Create Capsule
                  {!createMutation.isPending ? <span aria-hidden>→</span> : null}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TimeCapsule;
