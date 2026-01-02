import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Users, Share2, Tag, X } from '../components/Icons';
import { Navigation } from '../components/Navigation';
import { challengesApi } from '../services/api';

export function Challenges() {
  const queryClient = useQueryClient();
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');

  const { data: currentChallenge, isLoading } = useQuery({
    queryKey: ['currentChallenge'],
    queryFn: () => challengesApi.getCurrent().then(r => r.data).catch(() => null),
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => challengesApi.getAll().then(r => r.data),
  });

  const { data: submissions } = useQuery({
    queryKey: ['submissions', currentChallenge?.id],
    queryFn: () => currentChallenge ? challengesApi.getSubmissions(currentChallenge.id).then(r => r.data) : [],
    enabled: !!currentChallenge?.id,
  });

  const submitMutation = useMutation({
    mutationFn: (data: { challengeId: string; content: string }) =>
      challengesApi.submit(data.challengeId, { content: data.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['currentChallenge'] });
      setShowSubmitModal(false);
      setSubmissionContent('');
    },
  });

    const handleShare= (platform: string) => {
    const challenge = currentChallenge;
    if (!challenge) return;

    const text = `I just shared a memory for the ${challenge.title} challenge on Heirloom! ${challenge.hashtag}`;
    const url = 'https://heirloom.blue/challenges';

    let shareUrl = '';
    switch (platform) {
      case 'instagram':
        navigator.clipboard.writeText(`${text}\n\n${url}`);
        alert('Caption copied! Open Instagram to share.');
        break;
      case 'tiktok':
        navigator.clipboard.writeText(`${text}\n\n${url}`);
        alert('Caption copied! Open TikTok to share.');
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
        break;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div className="min-h-screen bg-void">
      <Navigation />
      
      <main id="main-content" className="pt-24 pb-12 px-6 md:px-12 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-light mb-2">Weekly Challenges</h1>
          <p className="text-paper/60">Join themed memory challenges and share with your community</p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Current Challenge */}
            {currentChallenge ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 border-purple-500/30"
              >
                <div className="flex items-center gap-2 text-purple-400 text-sm mb-4">
                  <Trophy size={16} />
                  <span>THIS WEEK'S CHALLENGE</span>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-light mb-3">{currentChallenge.title}</h2>
                    <p className="text-paper/70 mb-4">{currentChallenge.description}</p>
                    
                    <div className="bg-paper/5 rounded-lg p-4 mb-6">
                      <div className="text-sm text-paper/50 mb-2">This week's prompt:</div>
                      <p className="text-paper italic">"{currentChallenge.prompt}"</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-paper/60 mb-6">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-gold" />
                        <span>{currentChallenge.hashtag}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gold" />
                        <span>{getDaysRemaining(currentChallenge.end_date)} days left</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gold" />
                        <span>{currentChallenge.submissionCount || 0} participants</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setShowSubmitModal(true)}
                        className="btn btn-primary"
                      >
                        Submit Your Memory
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShare('instagram')}
                          className="btn btn-ghost p-3"
                          title="Share to Instagram"
                        >
                          <Share2 size={20} />
                        </button>
                        <button
                          onClick={() => handleShare('tiktok')}
                          className="btn btn-ghost p-3"
                          title="Share to TikTok"
                        >
                          <Share2 size={20} />
                        </button>
                        <button
                          onClick={() => handleShare('twitter')}
                          className="btn btn-ghost p-3"
                          title="Share to Twitter"
                        >
                          <Share2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-paper/5 rounded-xl p-6">
                    <h3 className="font-medium mb-4">Recent Submissions</h3>
                    {submissions && submissions.length > 0 ? (
                      <div className="space-y-4 max-h-64 overflow-y-auto">
                        {submissions.slice(0, 5).map((sub: any) => (
                          <div key={sub.id} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-sm">
                              {sub.first_name?.[0] || '?'}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{sub.first_name} {sub.last_name?.[0]}.</div>
                              <div className="text-xs text-paper/50 line-clamp-2">{sub.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-paper/50">
                        <Trophy size={32} className="mx-auto mb-2 opacity-50" />
                        <p>Be the first to submit!</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card text-center py-12"
              >
                <Trophy size={48} className="mx-auto mb-4 text-paper/30" />
                <h2 className="text-xl font-light mb-2">No Active Challenge</h2>
                <p className="text-paper/60">Check back soon for the next weekly challenge!</p>
              </motion.div>
            )}

            {/* Upcoming Challenges */}
            {challenges && challenges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xl font-light mb-4">Upcoming Challenges</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {challenges.filter((c: any) => new Date(c.start_date) > new Date()).slice(0, 6).map((challenge: any, index: number) => (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="card hover:border-gold/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedChallenge(challenge)}
                    >
                      <div className="text-xs text-gold mb-2">
                        {new Date(challenge.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <h3 className="font-medium mb-2">{challenge.title}</h3>
                      <p className="text-sm text-paper/60 line-clamp-2">{challenge.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-paper/50">
                        <Tag size={12} />
                        <span>{challenge.hashtag}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* How It Works */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h2 className="text-xl font-light mb-6">How Challenges Work</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-3">
                    <span className="text-gold font-medium">1</span>
                  </div>
                  <h3 className="font-medium mb-2">Join the Challenge</h3>
                  <p className="text-sm text-paper/60">Each week features a new theme and prompt to inspire your memories</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-3">
                    <span className="text-gold font-medium">2</span>
                  </div>
                  <h3 className="font-medium mb-2">Share Your Story</h3>
                  <p className="text-sm text-paper/60">Submit a memory, voice recording, or written story that fits the theme</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-3">
                    <span className="text-gold font-medium">3</span>
                  </div>
                  <h3 className="font-medium mb-2">Go Viral</h3>
                  <p className="text-sm text-paper/60">Share to social media with the hashtag and connect with others</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && currentChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowSubmitModal(false)}
                className="absolute top-4 right-4 text-paper/50 hover:text-paper"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-medium mb-2">Submit to {currentChallenge.title}</h3>
              <p className="text-paper/60 text-sm mb-6">{currentChallenge.prompt}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-paper/70 mb-2">Your Memory</label>
                  <textarea
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder="Share your story..."
                    className="input w-full h-32 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => submitMutation.mutate({
                      challengeId: currentChallenge.id,
                      content: submissionContent,
                    })}
                    disabled={!submissionContent.trim() || submitMutation.isPending}
                    className="btn btn-primary"
                  >
                    {submitMutation.isPending ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge Detail Modal */}
      <AnimatePresence>
        {selectedChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setSelectedChallenge(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedChallenge(null)}
                className="absolute top-4 right-4 text-paper/50 hover:text-paper"
              >
                <X size={20} />
              </button>

              <div className="text-xs text-gold mb-2">
                Starts {new Date(selectedChallenge.start_date).toLocaleDateString()}
              </div>
              <h3 className="text-xl font-medium mb-2">{selectedChallenge.title}</h3>
              <p className="text-paper/70 mb-4">{selectedChallenge.description}</p>
              
              <div className="bg-paper/5 rounded-lg p-4 mb-4">
                <div className="text-sm text-paper/50 mb-2">Prompt:</div>
                <p className="text-paper italic">"{selectedChallenge.prompt}"</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-paper/60">
                <div className="flex items-center gap-2">
                  <Tag size={14} />
                  <span>{selectedChallenge.hashtag}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>7 days</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
