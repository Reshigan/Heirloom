import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressHair } from '../components/ui/ProgressHair';
import api from '../services/api';

interface RoomData {
  room: {
    name: string;
    description: string;
    ownerName: string;
    allowPhotos: boolean;
    allowVoice: boolean;
    allowText: boolean;
  };
  contributions: Array<{
    id: string;
    contributor_name: string;
    contributor_relationship: string;
    content_type: string;
    title: string;
    content: string;
    created_at: string;
  }>;
}

export function MemoryRoom() {
  const { token } = useParams<{ token: string }>();
  const [showContribute, setShowContribute] = useState(false);
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [contributorRelationship, setContributorRelationship] = useState('');
  const [contentType, setContentType] = useState<'TEXT' | 'PHOTO' | 'VOICE'>('TEXT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<RoomData>({
    queryKey: ['memory-room', token],
    queryFn: () => api.get(`/api/recipient-experience/room/${token}`).then((r: { data: RoomData }) => r.data),
    enabled: !!token,
  });

  const contributeMutation = useMutation({
    mutationFn: (contribution: {
      contributorName: string;
      contributorEmail?: string;
      contributorRelationship?: string;
      contentType: string;
      title?: string;
      content: string;
    }) => api.post(`/api/recipient-experience/room/${token}/contribute`, contribution),
    onSuccess: () => {
      setSubmitted(true);
      setShowContribute(false);
      setContributorName('');
      setContributorEmail('');
      setContributorRelationship('');
      setTitle('');
      setContent('');
      refetch();
    },
  });

  const handleSubmit = () => {
    if (!contributorName.trim() || !content.trim()) return;
    contributeMutation.mutate({
      contributorName: contributorName.trim(),
      contributorEmail: contributorEmail.trim() || undefined,
      contributorRelationship: contributorRelationship.trim() || undefined,
      contentType,
      title: title.trim() || undefined,
      content: content.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <ProgressHair label="loading…" width={180} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-body font-light text-paper mb-2">Room Not Found</h1>
          <p className="text-paper-60">This memory room may not be active or the link may be invalid.</p>
        </div>
      </div>
    );
  }

  const { room, contributions } = data;

  const contentTypeLabel = (t: string) =>
    t === 'PHOTO' ? 'Photo' : t === 'VOICE' ? 'Voice' : 'Story';

  return (
    <div className="min-h-screen bg-void text-paper">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-body font-light text-4xl text-paper mb-2 tracking-[-0.014em]">{room.name || `${room.ownerName}'s Memory Room`}</h1>
          {room.description && (
            <p className="text-paper-60 max-w-xl mx-auto">{room.description}</p>
          )}
          <p className="text-paper-50 text-sm mt-4">
            A space to share memories and stories about {room.ownerName}
          </p>
        </motion.div>

        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-void-surface border border-gold-40 rounded-[2px] text-center"
            role="status"
          >
            <p className="text-gold">Thank you for sharing your memory. It means so much.</p>
          </motion.div>
        )}

        <button
          onClick={() => setShowContribute(true)}
          className="w-full mb-8 p-6 bg-void-surface border border-paper-15 rounded-[2px] hover:border-gold-40 transition-colors text-center"
        >
          <p className="text-paper font-body text-lg">Share a Memory</p>
          <p className="text-paper-50 text-sm mt-1">Add your own story, photo, or message</p>
        </button>

        {contributions.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-body font-light text-paper mb-4">Shared Memories</h2>
            {contributions.map((contribution, index) => (
              <motion.div
                key={contribution.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-void-surface rounded-[2px] border border-paper-15"
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-gold pt-1 flex-shrink-0">
                    {contentTypeLabel(contribution.content_type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-paper">{contribution.contributor_name}</span>
                      {contribution.contributor_relationship && (
                        <span className="text-paper-50 text-sm">({contribution.contributor_relationship})</span>
                      )}
                    </div>
                    {contribution.title && (
                      <h3 className="font-medium text-gold mb-2">{contribution.title}</h3>
                    )}
                    <p className="text-paper-70 whitespace-pre-wrap">{contribution.content}</p>
                    <p className="text-paper-30 text-sm mt-3">
                      {new Date(contribution.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-paper-50">No memories shared yet. Be the first to contribute.</p>
          </div>
        )}

        <AnimatePresence>
          {showContribute && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShowContribute(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-void-surface rounded-[2px] p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-paper-15"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-body font-light text-paper">Share a Memory</h3>
                  <button onClick={() => setShowContribute(false)} aria-label="Close" className="text-paper-50 hover:text-paper transition-colors text-xl">
                    <span aria-hidden>×</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="mr-name" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Your Name *</label>
                    <input
                      id="mr-name"
                      type="text"
                      value={contributorName}
                      onChange={(e) => setContributorName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-void border border-paper-15 rounded-[2px] px-4 py-3 text-paper focus:outline-none focus:border-gold placeholder:text-paper-30 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="mr-email" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Your Email (optional)</label>
                    <input
                      id="mr-email"
                      type="email"
                      value={contributorEmail}
                      onChange={(e) => setContributorEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-void border border-paper-15 rounded-[2px] px-4 py-3 text-paper focus:outline-none focus:border-gold placeholder:text-paper-30 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="mr-rel" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Your Relationship (optional)</label>
                    <input
                      id="mr-rel"
                      type="text"
                      value={contributorRelationship}
                      onChange={(e) => setContributorRelationship(e.target.value)}
                      placeholder="e.g., Friend, Colleague, Neighbor"
                      className="w-full bg-void border border-paper-15 rounded-[2px] px-4 py-3 text-paper focus:outline-none focus:border-gold placeholder:text-paper-30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Type of Memory</label>
                    <div className="flex gap-2">
                      {room.allowText && (
                        <button
                          onClick={() => setContentType('TEXT')}
                          className={`flex-1 p-3 rounded-[2px] flex items-center justify-center transition-colors ${
                            contentType === 'TEXT' ? 'bg-void border border-gold-40 text-gold' : 'bg-void border border-paper-15 text-paper-50 hover:text-paper'
                          }`}
                        >
                          <span className="text-sm">Story</span>
                        </button>
                      )}
                      {room.allowPhotos && (
                        <button
                          onClick={() => setContentType('PHOTO')}
                          className={`flex-1 p-3 rounded-[2px] flex items-center justify-center transition-colors ${
                            contentType === 'PHOTO' ? 'bg-void border border-gold-40 text-gold' : 'bg-void border border-paper-15 text-paper-50 hover:text-paper'
                          }`}
                        >
                          <span className="text-sm">Photo</span>
                        </button>
                      )}
                      {room.allowVoice && (
                        <button
                          onClick={() => setContentType('VOICE')}
                          className={`flex-1 p-3 rounded-[2px] flex items-center justify-center transition-colors ${
                            contentType === 'VOICE' ? 'bg-void border border-gold-40 text-gold' : 'bg-void border border-paper-15 text-paper-50 hover:text-paper'
                          }`}
                        >
                          <span className="text-sm">Voice</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mr-title" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Title (optional)</label>
                    <input
                      id="mr-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Give your memory a title"
                      className="w-full bg-void border border-paper-15 rounded-[2px] px-4 py-3 text-paper focus:outline-none focus:border-gold placeholder:text-paper-30 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="mr-content" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Your Memory *</label>
                    <textarea
                      id="mr-content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Share your story, memory, or message..."
                      rows={5}
                      className="w-full bg-void border border-paper-15 rounded-[2px] px-4 py-3 text-paper focus:outline-none focus:border-gold placeholder:text-paper-30 transition-colors font-body text-base leading-[1.7] resize-y"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!contributorName.trim() || !content.trim() || contributeMutation.isPending}
                    className="btn btn-primary w-full"
                  >
                    {contributeMutation.isPending ? 'Sharing…' : 'Share Memory'}
                    {!contributeMutation.isPending ? <span aria-hidden>→</span> : null}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-16 text-center">
          <p className="text-paper-30 text-sm">
            Powered by <a href="https://heirloom.blue" className="text-gold hover:text-gold-bright transition-colors">Heirloom</a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default MemoryRoom;
