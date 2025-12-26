import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Image, Mic, FileText, Send, Users, X } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-[#0a0c10] to-[#12151c] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#c9a959] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0c10] to-[#12151c] flex items-center justify-center p-6">
        <div className="text-center">
          <Heart size={64} className="mx-auto text-[#f5f0e8]/20 mb-4" />
          <h1 className="text-2xl font-serif text-[#f5f0e8] mb-2">Room Not Found</h1>
          <p className="text-[#f5f0e8]/60">This memory room may not be active or the link may be invalid.</p>
        </div>
      </div>
    );
  }

  const { room, contributions } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0c10] to-[#12151c]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#c9a959]/20 flex items-center justify-center">
            <Users size={40} className="text-[#c9a959]" />
          </div>
          <h1 className="font-serif text-4xl text-[#f5f0e8] mb-2">{room.name || `${room.ownerName}'s Memory Room`}</h1>
          {room.description && (
            <p className="text-[#f5f0e8]/60 max-w-xl mx-auto">{room.description}</p>
          )}
          <p className="text-[#f5f0e8]/40 text-sm mt-4">
            A space to share memories and stories about {room.ownerName}
          </p>
        </motion.div>

        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-center"
          >
            <p className="text-green-400">Thank you for sharing your memory. It means so much.</p>
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => setShowContribute(true)}
          className="w-full mb-8 p-6 bg-[#c9a959]/10 border border-[#c9a959]/30 rounded-xl hover:bg-[#c9a959]/20 transition-all text-center group"
        >
          <Heart size={32} className="mx-auto mb-3 text-[#c9a959] group-hover:scale-110 transition-transform" />
          <p className="text-[#f5f0e8] font-medium text-lg">Share a Memory</p>
          <p className="text-[#f5f0e8]/50 text-sm mt-1">Add your own story, photo, or message</p>
        </motion.button>

        {contributions.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-serif text-[#f5f0e8] mb-4">Shared Memories</h2>
            {contributions.map((contribution, index) => (
              <motion.div
                key={contribution.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-[#f5f0e8]/5 rounded-xl border border-[#f5f0e8]/10"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    contribution.content_type === 'PHOTO' ? 'bg-blue-500/20 text-blue-400' :
                    contribution.content_type === 'VOICE' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {contribution.content_type === 'PHOTO' ? <Image size={20} /> :
                     contribution.content_type === 'VOICE' ? <Mic size={20} /> :
                     <FileText size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-[#f5f0e8]">{contribution.contributor_name}</span>
                      {contribution.contributor_relationship && (
                        <span className="text-[#f5f0e8]/40 text-sm">({contribution.contributor_relationship})</span>
                      )}
                    </div>
                    {contribution.title && (
                      <h3 className="font-medium text-[#c9a959] mb-2">{contribution.title}</h3>
                    )}
                    <p className="text-[#f5f0e8]/70 whitespace-pre-wrap">{contribution.content}</p>
                    <p className="text-[#f5f0e8]/30 text-sm mt-3">
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
            <Heart size={48} className="mx-auto text-[#f5f0e8]/20 mb-4" />
            <p className="text-[#f5f0e8]/50">No memories shared yet. Be the first to contribute.</p>
          </div>
        )}

        <AnimatePresence>
          {showContribute && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShowContribute(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#12151c] rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#f5f0e8]/10"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-serif text-[#f5f0e8]">Share a Memory</h3>
                  <button onClick={() => setShowContribute(false)} className="text-[#f5f0e8]/50 hover:text-[#f5f0e8]">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#f5f0e8]/70 mb-2">Your Name *</label>
                    <input
                      type="text"
                      value={contributorName}
                      onChange={(e) => setContributorName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-[#0a0c10] border border-[#f5f0e8]/10 rounded-lg px-4 py-3 text-[#f5f0e8] focus:outline-none focus:border-[#c9a959]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#f5f0e8]/70 mb-2">Your Email (optional)</label>
                    <input
                      type="email"
                      value={contributorEmail}
                      onChange={(e) => setContributorEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-[#0a0c10] border border-[#f5f0e8]/10 rounded-lg px-4 py-3 text-[#f5f0e8] focus:outline-none focus:border-[#c9a959]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#f5f0e8]/70 mb-2">Your Relationship (optional)</label>
                    <input
                      type="text"
                      value={contributorRelationship}
                      onChange={(e) => setContributorRelationship(e.target.value)}
                      placeholder="e.g., Friend, Colleague, Neighbor"
                      className="w-full bg-[#0a0c10] border border-[#f5f0e8]/10 rounded-lg px-4 py-3 text-[#f5f0e8] focus:outline-none focus:border-[#c9a959]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#f5f0e8]/70 mb-2">Type of Memory</label>
                    <div className="flex gap-2">
                      {room.allowText && (
                        <button
                          onClick={() => setContentType('TEXT')}
                          className={`flex-1 p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${
                            contentType === 'TEXT' ? 'bg-[#c9a959]/20 border border-[#c9a959]/30' : 'bg-[#0a0c10] border border-[#f5f0e8]/10'
                          }`}
                        >
                          <FileText size={20} className={contentType === 'TEXT' ? 'text-[#c9a959]' : 'text-[#f5f0e8]/50'} />
                          <span className="text-sm text-[#f5f0e8]">Story</span>
                        </button>
                      )}
                      {room.allowPhotos && (
                        <button
                          onClick={() => setContentType('PHOTO')}
                          className={`flex-1 p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${
                            contentType === 'PHOTO' ? 'bg-[#c9a959]/20 border border-[#c9a959]/30' : 'bg-[#0a0c10] border border-[#f5f0e8]/10'
                          }`}
                        >
                          <Image size={20} className={contentType === 'PHOTO' ? 'text-[#c9a959]' : 'text-[#f5f0e8]/50'} />
                          <span className="text-sm text-[#f5f0e8]">Photo</span>
                        </button>
                      )}
                      {room.allowVoice && (
                        <button
                          onClick={() => setContentType('VOICE')}
                          className={`flex-1 p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${
                            contentType === 'VOICE' ? 'bg-[#c9a959]/20 border border-[#c9a959]/30' : 'bg-[#0a0c10] border border-[#f5f0e8]/10'
                          }`}
                        >
                          <Mic size={20} className={contentType === 'VOICE' ? 'text-[#c9a959]' : 'text-[#f5f0e8]/50'} />
                          <span className="text-sm text-[#f5f0e8]">Voice</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#f5f0e8]/70 mb-2">Title (optional)</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Give your memory a title"
                      className="w-full bg-[#0a0c10] border border-[#f5f0e8]/10 rounded-lg px-4 py-3 text-[#f5f0e8] focus:outline-none focus:border-[#c9a959]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#f5f0e8]/70 mb-2">Your Memory *</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Share your story, memory, or message..."
                      rows={5}
                      className="w-full bg-[#0a0c10] border border-[#f5f0e8]/10 rounded-lg px-4 py-3 text-[#f5f0e8] focus:outline-none focus:border-[#c9a959]/50 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!contributorName.trim() || !content.trim() || contributeMutation.isPending}
                    className="w-full py-3 bg-gradient-to-r from-[#c9a959] to-[#a08335] text-[#0a0c10] font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {contributeMutation.isPending ? (
                      <div className="animate-spin w-5 h-5 border-2 border-[#0a0c10] border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Send size={18} />
                        Share Memory
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-16 text-center">
          <p className="text-[#f5f0e8]/30 text-sm">
            Powered by <a href="https://heirloom.blue" className="text-[#c9a959] hover:underline">Heirloom</a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default MemoryRoom;
