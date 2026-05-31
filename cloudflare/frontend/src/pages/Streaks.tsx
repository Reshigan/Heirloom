import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from '../components/Navigation';
import { ProgressHair } from '../components/ui/ProgressHair';
import { streaksApi, challengesApi } from '../services/api';

export function Streaks() {
  const queryClient = useQueryClient();
  const [showFreezeModal, setShowFreezeModal] = useState(false);

  const { data: streak, isLoading: streakLoading } = useQuery({
    queryKey: ['streak'],
    queryFn: () => streaksApi.getStatus().then(r => r.data),
  });

  const { data: currentChallenge } = useQuery({
    queryKey: ['currentChallenge'],
    queryFn: () => challengesApi.getCurrent().then(r => r.data).catch(() => null),
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => challengesApi.getAll().then(r => r.data),
  });

  const freezeMutation = useMutation({
    mutationFn: () => streaksApi.freezeStreak(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      setShowFreezeModal(false);
    },
  });

  const milestones = [
    { days: 7, label: '1 Week', reward: 'Badge unlocked' },
    { days: 14, label: '2 Weeks', reward: '+50MB storage' },
    { days: 30, label: '1 Month', reward: 'Gold badge' },
    { days: 60, label: '2 Months', reward: '+100MB storage' },
    { days: 100, label: '100 Days', reward: 'Diamond badge' },
    { days: 365, label: '1 Year', reward: 'Crown badge + 1GB' },
  ];

  return (
    <div className="min-h-screen bg-void text-paper">
      <Navigation />

      <main id="main-content" className="pt-24 pb-12 px-6 md:px-12 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-body font-light text-3xl md:text-4xl mb-2 tracking-[-0.014em]">Thread Streaks</h1>
          <p className="text-paper-70">One entry at a time, your family thread keeps going</p>
        </motion.div>

        {streakLoading ? (
          <div className="flex items-center justify-center py-20">
            <ProgressHair label="loading…" width={180} />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Streak Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-void-surface border border-paper-15 p-6"
            >
              <div className="text-center py-8">
                <div className="text-6xl font-body font-light text-gold mb-6">∞</div>

                <div className="text-6xl font-body font-light mb-2">
                  {streak?.currentStreak || 0}
                </div>
                <div className="text-paper-70 text-lg mb-6">
                  {streak?.currentStreak === 1 ? 'Day Streak' : 'Day Streak'}
                </div>

                {streak?.isStreakActive ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[2px] border border-gold-40 text-gold">
                    <span>Streak Active</span>
                  </div>
                ) : streak?.canExtendStreak ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[2px] border border-paper-15 text-paper-70">
                    <span>Add a memory to extend your streak!</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[2px] border border-paper-15 text-paper-70">
                    <span>Start a new streak today!</span>
                  </div>
                )}

                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-body font-light text-gold">{streak?.longestStreak || 0}</div>
                    <div className="text-paper-65 text-sm">Longest Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-body font-light text-gold">{streak?.totalMemoriesCreated || 0}</div>
                    <div className="text-paper-65 text-sm">Total Memories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-body font-light text-gold">
                      {streak?.streakStartedAt ? Math.ceil((Date.now() - new Date(streak.streakStartedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                    </div>
                    <div className="text-paper-65 text-sm">Days Active</div>
                  </div>
                </div>
              </div>

              {/* Freeze Streak Option */}
              {streak?.isStreakActive && !streak?.streakFrozenUntil && (
                <div className="border-t border-paper-15 pt-6 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Freeze Your Streak</div>
                      <div className="text-paper-65 text-sm">Take a day off without losing progress</div>
                    </div>
                    <button
                      onClick={() => setShowFreezeModal(true)}
                      className="btn btn-ghost text-sm"
                    >
                      Freeze (1 day)
                    </button>
                  </div>
                </div>
              )}

              {streak?.streakFrozenUntil && (
                <div className="border-t border-paper-15 pt-6 mt-6">
                  <div className="text-gold">
                    <span>Streak frozen until {new Date(streak.streakFrozenUntil).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Milestones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-void-surface border border-paper-15 p-6"
            >
              <h3 className="text-lg font-medium mb-4">Milestones</h3>

              <div className="space-y-3">
                {milestones.map((milestone) => {
                  const achieved = (streak?.longestStreak || 0) >= milestone.days;
                  const progress = Math.min(100, ((streak?.currentStreak || 0) / milestone.days) * 100);

                  return (
                    <div
                      key={milestone.days}
                      className={`p-3 rounded-[2px] ${achieved ? 'bg-gold/10 border border-gold-40' : 'border border-paper-15'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={achieved ? 'text-gold' : 'text-paper-30'} aria-hidden>{achieved ? '∞' : '·'}</span>
                          <span className={achieved ? 'text-gold' : 'text-paper-70'}>{milestone.label}</span>
                        </div>
                        <span className="text-xs text-paper-65">{milestone.days} days</span>
                      </div>
                      {!achieved && (
                        <div className="h-px bg-paper-15 overflow-hidden">
                          <div
                            className="h-full bg-gold transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                      <div className="text-xs text-paper-65 mt-1">{milestone.reward}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Current Challenge */}
            {currentChallenge && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-3 bg-void-surface border border-paper-15 p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-1">This Week's Challenge</div>
                    <h3 className="text-xl font-medium mb-2">{currentChallenge.title}</h3>
                    <p className="text-paper-70 mb-4">{currentChallenge.description}</p>
                    <div className="flex items-center gap-4 text-sm text-paper-65">
                      <span>{currentChallenge.hashtag}</span>
                      <span>{currentChallenge.submissionCount || 0} submissions</span>
                    </div>
                  </div>
                  <a href="/challenges" className="btn btn-primary">
                    Join Challenge
                  </a>
                </div>
              </motion.div>
            )}

            {/* Upcoming Challenges */}
            {challenges && challenges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-3 bg-void-surface border border-paper-15 p-6"
              >
                <h3 className="text-lg font-medium mb-4">Upcoming Challenges</h3>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {challenges.slice(0, 4).map((challenge: any) => (
                    <div key={challenge.id} className="p-4 rounded-[2px] border border-paper-15">
                      <div className="text-sm font-medium mb-1">{challenge.title}</div>
                      <div className="text-xs text-paper-65 mb-2">{challenge.theme}</div>
                      <div className="text-xs text-gold">
                        {new Date(challenge.start_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>

      {/* Freeze Modal */}
      <AnimatePresence>
        {showFreezeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowFreezeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-4xl text-gold mb-4" aria-hidden>∞</div>
                <h3 className="text-xl font-medium mb-2">Freeze Your Streak?</h3>
                <p className="text-paper-70 mb-6">
                  This will protect your streak for 24 hours. You can only freeze once per week.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowFreezeModal(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => freezeMutation.mutate()}
                    disabled={freezeMutation.isPending}
                    className="btn btn-primary"
                  >
                    {freezeMutation.isPending ? 'Freezing...' : 'Freeze Streak'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
