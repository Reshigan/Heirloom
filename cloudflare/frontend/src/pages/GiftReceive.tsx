import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Loader2, Heart, ArrowRight, Sparkles } from '../components/Icons';
import { giftsApi } from '../services/api';

interface GiftData {
  id: string;
  sender_name: string;
  memory_type: string;
  personal_message: string;
  unlock_date: string | null;
  claimed: boolean;
  content?: {
    title: string;
    preview: string;
    thumbnail_url?: string;
  };
}

export function GiftReceive() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [gift, setGift] = useState<GiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!token) return;
    giftsApi.receive(token)
      .then((r) => {
        setGift(r.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Gift not found or has expired');
        setLoading(false);
      });
  }, [token]);

  const handleClaim = async () => {
    if (!token) return;
    setClaiming(true);
    try {
      await giftsApi.claim(token);
      setClaimed(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to claim gift');
    }
    setClaiming(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <Loader2 size={40} className="text-gold animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blood/20 border border-blood/30 flex items-center justify-center">
            <Gift size={28} className="text-blood" />
          </div>
          <h1 className="font-serif text-2xl text-paper mb-2">Gift Not Found</h1>
          <p className="text-paper/65 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl bg-gold/20 text-gold text-sm"
          >
            Go to Heirloom
          </button>
        </div>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center"
          >
            <Heart size={36} className="text-gold" />
          </motion.div>
          <h1 className="font-serif text-3xl text-paper mb-3">Gift Claimed!</h1>
          <p className="text-paper/65 font-serif text-lg mb-8">
            This memory is now part of your collection. Create a free account to keep it safe forever.
          </p>
          <motion.button
            onClick={() => navigate('/signup')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-void font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Create Your Free Account
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring' }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gold/20 to-blood/20 border border-gold/20 flex items-center justify-center"
        >
          <Gift size={36} className="text-gold" />
        </motion.div>

        <h1 className="font-serif text-3xl text-paper mb-2">You&apos;ve Received a Gift</h1>
        {gift?.sender_name && (
          <p className="text-paper/65 font-serif text-lg mb-2">
            From <span className="text-gold">{gift.sender_name}</span>
          </p>
        )}

        {gift?.personal_message && (
          <div className="glass rounded-xl border border-paper/10 p-5 my-6 text-left">
            <p className="text-paper/70 font-serif italic">&ldquo;{gift.personal_message}&rdquo;</p>
          </div>
        )}

        {gift?.content && (
          <div className="glass rounded-xl border border-gold/20 p-5 my-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-gold" />
              <span className="text-gold text-xs uppercase tracking-wider">
                {gift.memory_type === 'memory' ? 'Photo Memory' : gift.memory_type === 'voice' ? 'Voice Recording' : 'Letter'}
              </span>
            </div>
            <h3 className="font-serif text-xl text-paper">{gift.content.title}</h3>
            {gift.content.preview && (
              <p className="text-paper/70 text-sm mt-1 line-clamp-2">{gift.content.preview}</p>
            )}
          </div>
        )}

        <motion.button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-void font-medium mt-4"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {claiming ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Heart size={18} />
          )}
          Unwrap Your Gift
        </motion.button>

        <p className="text-paper/65 text-xs mt-4">
          Powered by Heirloom &mdash; preserving what matters most
        </p>
      </motion.div>
    </div>
  );
}

export default GiftReceive;
