import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressHair } from '../components/ui/ProgressHair';
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
    <div className="min-h-screen bg-void text-paper">
      <Navigation />

      <main id="main-content" className="pt-24 pb-12 px-6 md:px-12 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-body font-light text-3xl md:text-4xl mb-2 tracking-[-0.014em]">Weekly Challenges</h1>
          <p className="text-paper-70">Join themed memory challenges and share with your community</p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <ProgressHair label="loading…" width={180} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Current Challenge */}
            {currentChallenge ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-void-surface border border-paper-15 p-6"
              >
                <div className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-4">
                  This Week's Challenge
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-body font-light mb-3 tracking-[-0.014em]">{currentChallenge.title}</h2>
                    <p className="text-paper-70 mb-4">{currentChallenge.description}</p>

                    <div className="border border-paper-15 rounded-[2px] p-4 mb-6">
                      <div className="text-sm text-paper-65 mb-2">This week's prompt:</div>
                      <p className="text-paper font-body italic">"{currentChallenge.prompt}"</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-paper-70 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-gold">{currentChallenge.hashtag}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{getDaysRemaining(currentChallenge.end_date)} days left</span>
                      </div>
                      <div className="flex items-center gap-2">
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
                          className="btn btn-ghost"
                          aria-label="Share to Instagram"
                        >
                          Instagram
                        </button>
                        <button
                          onClick={() => handleShare('tiktok')}
                          className="btn btn-ghost"
                          aria-label="Share to TikTok"
                        >
                          TikTok
                        </button>
                        <button
                          onClick={() => handleShare('twitter')}
                          className="btn btn-ghost"
                          aria-label="Share to Twitter"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border border-paper-15 rounded-[2px] p-6">
                    <h3 className="font-medium mb-4">Recent Submissions</h3>
                    {submissions && submissions.length > 0 ? (
                      <div className="space-y-4 max-h-64 overflow-y-auto">
                        {submissions.slice(0, 5).map((sub: any) => (
                          <div key={sub.id} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-[2px] border border-paper-15 flex items-center justify-center text-sm text-gold">
                              {sub.first_name?.[0] || '?'}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{sub.first_name} {sub.last_name?.[0]}.</div>
                              <div className="text-xs text-paper-65 line-clamp-2">{sub.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-paper-65">
                        <div className="text-2xl text-gold/50 mb-2" aria-hidden>∞</div>
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
                className="bg-void-surface border border-paper-15 p-6 text-center py-12"
              >
                <div className="text-4xl text-gold/50 mb-4" aria-hidden>∞</div>
                <h2 className="text-xl font-body font-light mb-2">No Active Challenge</h2>
                <p className="text-paper-70">Check back soon for the next weekly challenge!</p>
              </motion.div>
            )}

            {/* Upcoming Challenges */}
            {challenges && challenges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xl font-body font-light mb-4">Upcoming Challenges</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {challenges.filter((c: any) => new Date(c.start_date) > new Date()).slice(0, 6).map((challenge: any, index: number) => (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="bg-void-surface border border-paper-15 p-6 hover:border-gold-40 transition-colors cursor-pointer"
                      onClick={() => setSelectedChallenge(challenge)}
                    >
                      <div className="text-xs text-gold mb-2">
                        {new Date(challenge.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <h3 className="font-medium mb-2">{challenge.title}</h3>
                      <p className="text-sm text-paper-70 line-clamp-2">{challenge.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-paper-65">
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
              className="bg-void-surface border border-paper-15 p-6"
            >
              <h2 className="text-xl font-body font-light mb-6">How Challenges Work</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-[2px] border border-gold-40 flex items-center justify-center mx-auto mb-3">
                    <span className="text-gold font-medium">1</span>
                  </div>
                  <h3 className="font-medium mb-2">Join the Challenge</h3>
                  <p className="text-sm text-paper-70">Each week features a new theme and prompt to inspire your memories</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-[2px] border border-gold-40 flex items-center justify-center mx-auto mb-3">
                    <span className="text-gold font-medium">2</span>
                  </div>
                  <h3 className="font-medium mb-2">Share Your Story</h3>
                  <p className="text-sm text-paper-70">Submit a memory, voice recording, or written story that fits the theme</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-[2px] border border-gold-40 flex items-center justify-center mx-auto mb-3">
                    <span className="text-gold font-medium">3</span>
                  </div>
                  <h3 className="font-medium mb-2">Go Viral</h3>
                  <p className="text-sm text-paper-70">Share to social media with the hashtag and connect with others</p>
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
                className="absolute top-4 right-4 text-paper-65 hover:text-paper"
                aria-label="Close"
              >
                <span aria-hidden>×</span>
              </button>

              <h3 className="text-xl font-medium mb-2">Submit to {currentChallenge.title}</h3>
              <p className="text-paper-70 text-sm mb-6">{currentChallenge.prompt}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-paper-70 mb-2">Your Memory</label>
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
                    className="btn btn-ghost"
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
                className="absolute top-4 right-4 text-paper-65 hover:text-paper"
                aria-label="Close"
              >
                <span aria-hidden>×</span>
              </button>

              <div className="text-xs text-gold mb-2">
                Starts {new Date(selectedChallenge.start_date).toLocaleDateString()}
              </div>
              <h3 className="text-xl font-medium mb-2">{selectedChallenge.title}</h3>
              <p className="text-paper-70 mb-4">{selectedChallenge.description}</p>

              <div className="border border-paper-15 rounded-[2px] p-4 mb-4">
                <div className="text-sm text-paper-65 mb-2">Prompt:</div>
                <p className="text-paper font-body italic">"{selectedChallenge.prompt}"</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-paper-70">
                <div className="flex items-center gap-2">
                  <span>{selectedChallenge.hashtag}</span>
                </div>
                <div className="flex items-center gap-2">
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
