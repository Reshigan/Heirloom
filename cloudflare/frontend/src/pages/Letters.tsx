import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Filter, Mail, Clock, CheckCircle, AlertCircle,
  MoreVertical, Edit2, Trash2, Eye, Send, Calendar, Users, X
} from 'lucide-react';
import { lettersApi } from '../services/api';

type DeliveryTrigger = 'IMMEDIATE' | 'SCHEDULED' | 'POSTHUMOUS';
type FilterType = 'all' | 'drafts' | 'scheduled' | 'sent';

interface Letter {
  id: string;
  title: string;
  body: string;
  deliveryTrigger: DeliveryTrigger;
  scheduledDate?: string;
  sealedAt?: string;
  recipients: { id: string; name: string; relationship: string }[];
  createdAt: string;
  updatedAt: string;
}

const DELIVERY_LABELS: Record<DeliveryTrigger, { label: string; icon: typeof Clock; color: string }> = {
  IMMEDIATE: { label: 'Send Now', icon: Send, color: 'text-green-400' },
  SCHEDULED: { label: 'Scheduled', icon: Calendar, color: 'text-blue-400' },
  POSTHUMOUS: { label: 'After I\'m Gone', icon: Clock, color: 'text-gold' },
};

export function Letters() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [letterToDelete, setLetterToDelete] = useState<string | null>(null);

  const { data: letters, isLoading } = useQuery({
    queryKey: ['letters'],
    queryFn: () => lettersApi.getAll().then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => lettersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      setShowDeleteModal(false);
      setLetterToDelete(null);
    },
  });

  const filteredLetters = letters?.filter((letter: Letter) => {
    const matchesSearch = letter.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      letter.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'drafts') return matchesSearch && !letter.sealedAt;
    if (filter === 'scheduled') return matchesSearch && letter.deliveryTrigger === 'SCHEDULED';
    if (filter === 'sent') return matchesSearch && letter.sealedAt;
    
    return matchesSearch;
  }) || [];

  const handleDeleteClick = (id: string) => {
    setLetterToDelete(id);
    setShowDeleteModal(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -60, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-20 px-6 md:px-12 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.02 }}
          >
            <motion.span 
              className="text-3xl text-gold"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              ∞
            </motion.span>
            <span className="text-xl tracking-[0.15em] text-paper/80">HEIRLOOM</span>
          </motion.div>

          <motion.button
            onClick={() => navigate('/compose')}
            className="btn btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={18} />
            Write Letter
          </motion.button>
        </div>
      </header>

      <main className="relative z-10 px-6 md:px-12 py-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-light mb-2">Your Letters</h1>
          <p className="text-paper/60">Messages waiting to be delivered to your loved ones</p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/30" size={18} />
            <input
              type="text"
              placeholder="Search letters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12"
            />
          </div>
          
          <div className="flex gap-2">
            {(['all', 'drafts', 'scheduled', 'sent'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${
                  filter === f
                    ? 'bg-gold text-void-deep'
                    : 'glass text-paper/70 hover:text-paper'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Letters Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-paper/10 rounded w-3/4 mb-4" />
                <div className="h-3 bg-paper/10 rounded w-full mb-2" />
                <div className="h-3 bg-paper/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredLetters.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-paper/5 flex items-center justify-center mx-auto mb-6">
              <Mail className="text-paper/30" size={40} />
            </div>
            <h3 className="text-xl mb-2">No letters yet</h3>
            <p className="text-paper/50 mb-6">Start preserving your thoughts for loved ones</p>
            <button
              onClick={() => navigate('/compose')}
              className="btn btn-primary"
            >
              <Plus size={18} />
              Write Your First Letter
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredLetters.map((letter: Letter, index: number) => {
                const delivery = DELIVERY_LABELS[letter.deliveryTrigger];
                const DeliveryIcon = delivery.icon;
                
                return (
                  <motion.div
                    key={letter.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="card group cursor-pointer"
                    onClick={() => setSelectedLetter(letter)}
                  >
                    {/* Letter Preview */}
                    <div className="relative">
                      {/* Status Badge */}
                      <div className="absolute -top-2 -right-2">
                        {letter.sealedAt ? (
                          <span className="badge badge-success flex items-center gap-1">
                            <CheckCircle size={12} />
                            Sealed
                          </span>
                        ) : (
                          <span className="badge flex items-center gap-1">
                            <Edit2 size={12} />
                            Draft
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <h3 className="text-lg font-medium mb-1 group-hover:text-gold transition-colors">
                          {letter.title || 'Untitled Letter'}
                        </h3>
                        <p className="text-paper/50 text-sm line-clamp-2">
                          {letter.body.substring(0, 100)}...
                        </p>
                      </div>

                      {/* Recipients */}
                      {letter.recipients?.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          <Users size={14} className="text-paper/40" />
                          <span className="text-sm text-paper/60">
                            {letter.recipients.map(r => r.name).join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Delivery Info */}
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 text-sm ${delivery.color}`}>
                          <DeliveryIcon size={14} />
                          <span>{delivery.label}</span>
                        </div>
                        <span className="text-xs text-paper/40">
                          {formatDate(letter.updatedAt)}
                        </span>
                      </div>

                      {/* Scheduled Date */}
                      {letter.deliveryTrigger === 'SCHEDULED' && letter.scheduledDate && (
                        <div className="mt-2 text-xs text-paper/50">
                          Delivers: {formatDate(letter.scheduledDate)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/compose?edit=${letter.id}`);
                          }}
                          className="p-2 rounded-lg glass hover:bg-gold/20 transition-colors"
                        >
                          <Edit2 size={14} className="text-paper/70" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(letter.id);
                          }}
                          className="p-2 rounded-lg glass hover:bg-blood/20 transition-colors"
                        >
                          <Trash2 size={14} className="text-paper/70" />
                        </button>
                      </div>
                    </div>

                    {/* Hover glow */}
                    <div className="absolute -inset-4 rounded-3xl bg-gold/0 group-hover:bg-gold/5 transition-colors blur-xl pointer-events-none" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Letter Preview Modal */}
      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setSelectedLetter(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal max-w-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedLetter(null)}
                className="absolute top-4 right-4 text-paper/50 hover:text-paper transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-light mb-2">
                  {selectedLetter.title || 'Untitled Letter'}
                </h2>
                <div className="flex items-center gap-4 text-sm text-paper/50">
                  <span>Created {formatDate(selectedLetter.createdAt)}</span>
                  {selectedLetter.recipients?.length > 0 && (
                    <span>To: {selectedLetter.recipients.map(r => r.name).join(', ')}</span>
                  )}
                </div>
              </div>

              {/* Letter Content */}
              <div className="bg-paper-aged/5 rounded-xl p-6 mb-6 max-h-96 overflow-y-auto">
                <p className="text-paper/90 whitespace-pre-wrap font-serif leading-relaxed">
                  {selectedLetter.body}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setSelectedLetter(null);
                    navigate(`/compose?edit=${selectedLetter.id}`);
                  }}
                  className="btn btn-secondary"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                {!selectedLetter.sealedAt && (
                  <button className="btn btn-primary">
                    <Send size={16} />
                    Seal & Send
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blood/20 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="text-blood" size={32} />
                </div>
                <h3 className="text-2xl mb-2">Delete Letter?</h3>
                <p className="text-paper/60 mb-6">
                  This action cannot be undone. The letter will be permanently removed.
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => letterToDelete && deleteMutation.mutate(letterToDelete)}
                    disabled={deleteMutation.isPending}
                    className="btn btn-danger"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
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
