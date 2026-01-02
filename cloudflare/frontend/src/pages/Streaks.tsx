import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Calendar, Star, Zap, Cloud } from '../components/Icons';
import { Navigation } from '../components/Navigation';
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

  const getStreakColor = (days: number) => {
    if (days >= 100) return 'from-purple-500 to-pink-500';
    if (days >= 30) return 'from-gold to-amber-400';
    if (days >= 7) return 'from-orange-500 to-red-500';
    return 'from-blue-500 to-cyan-500';
  };

  const getStreakEmoji = (days: number) => {
    if (days >= 365) return '👑';
    if (days >= 100) return '💎';
    if (days >= 30) return '🔥';
    if (days >= 7) return '⭐';
    return '🌱';
  };

  const milestones = [
    { days: 7, label: '1 Week', reward: 'Badge unlocked' },
    { days: 14, label: '2 Weeks', reward: '+50MB storage' },
    { days: 30, label: '1 Month', reward: 'Gold badge' },
    { days: 60, label: '2 Months', reward: '+100MB storage' },
    { days: 100, label: '100 Days', reward: 'Diamond badge' },
    { days: 365, label: '1 Year', reward: 'Crown badge + 1GB' },
  ];

  return (
    <div className="min-h-screen bg-void">
      <Navigation />
      
      <main id="main-content" className="pt-24 pb-12 px-6 md:px-12 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-light mb-2">Memory Streaks</h1>
          <p className="text-paper/60">Build your legacy one day at a time</p>
        </motion.div>

        {streakLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Streak Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 card"
            >
              <div className="text-center py-8">
                <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${getStreakColor(streak?.currentStreak || 0)} flex items-center justify-center mb-6 shadow-lg`}>
                  <span className="text-6xl">{getStreakEmoji(streak?.currentStreak || 0)}</span>
                </div>
                
                <div className="text-6xl font-light mb-2">
                  {streak?.currentStreak || 0}
                </div>
                <div className="text-paper/60 text-lg mb-6">
                  {streak?.currentStreak === 1 ? 'Day Streak' : 'Day Streak'}
                </div>

                {streak?.isStreakActive ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400">
                    <Zap size={18} />
                    <span>Streak Active</span>
                  </div>
                ) : streak?.canExtendStreak ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400">
                    <Zap size={18} />
                    <span>Add a memory to extend your streak!</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-400">
                    <span>Start a new streak today!</span>
                  </div>
                )}

                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-light text-gold">{streak?.longestStreak || 0}</div>
                    <div className="text-paper/50 text-sm">Longest Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light text-gold">{streak?.totalMemoriesCreated || 0}</div>
                    <div className="text-paper/50 text-sm">Total Memories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light text-gold">
                      {streak?.streakStartedAt ? Math.ceil((Date.now() - new Date(streak.streakStartedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                    </div>
                    <div className="text-paper/50 text-sm">Days Active</div>
                  </div>
                </div>
              </div>

              {/* Freeze Streak Option */}
              {streak?.isStreakActive && !streak?.streakFrozenUntil && (
                <div className="border-t border-paper/10 pt-6 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Cloud className="text-blue-400" size={20} />
                      <div>
                        <div className="font-medium">Freeze Your Streak</div>
                        <div className="text-paper/50 text-sm">Take a day off without losing progress</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFreezeModal(true)}
                      className="btn btn-secondary text-sm"
                    >
                      Freeze (1 day)
                    </button>
                  </div>
                </div>
              )}

              {streak?.streakFrozenUntil && (
                <div className="border-t border-paper/10 pt-6 mt-6">
                  <div className="flex items-center gap-3 text-blue-400">
                    <Cloud size={20} />
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
              className="card"
            >
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Trophy className="text-gold" size={20} />
                Milestones
              </h3>
              
              <div className="space-y-3">
                {milestones.map((milestone) => {
                  const achieved = (streak?.longestStreak || 0) >= milestone.days;
                  const progress = Math.min(100, ((streak?.currentStreak || 0) / milestone.days) * 100);
                  
                  return (
                    <div
                      key={milestone.days}
                      className={`p-3 rounded-lg ${achieved ? 'bg-gold/10 border border-gold/30' : 'bg-paper/5'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {achieved ? (
                            <Star className="text-gold" size={16} />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-paper/30" />
                          )}
                          <span className={achieved ? 'text-gold' : 'text-paper/70'}>{milestone.label}</span>
                        </div>
                        <span className="text-xs text-paper/50">{milestone.days} days</span>
                      </div>
                      {!achieved && (
                        <div className="h-1 bg-paper/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold/50 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                      <div className="text-xs text-paper/50 mt-1">{milestone.reward}</div>
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
                className="lg:col-span-3 card bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">This Week's Challenge</div>
                    <h3 className="text-xl font-medium mb-2">{currentChallenge.title}</h3>
                    <p className="text-paper/70 mb-4">{currentChallenge.description}</p>
                    <div className="flex items-center gap-4 text-sm text-paper/50">
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
                className="lg:col-span-3 card"
              >
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Calendar className="text-gold" size={20} />
                  Upcoming Challenges
                </h3>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {challenges.slice(0, 4).map((challenge: any) => (
                    <div key={challenge.id} className="p-4 rounded-lg bg-paper/5">
                      <div className="text-sm font-medium mb-1">{challenge.title}</div>
                      <div className="text-xs text-paper/50 mb-2">{challenge.theme}</div>
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
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <Cloud className="text-blue-400" size={32} />
                </div>
                <h3 className="text-xl font-medium mb-2">Freeze Your Streak?</h3>
                <p className="text-paper/60 mb-6">
                  This will protect your streak for 24 hours. You can only freeze once per week.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowFreezeModal(false)}
                    className="btn btn-secondary"
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
