import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ProgressHair } from '../components/ui/ProgressHair';
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
        <ProgressHair label="loading…" width={180} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-void text-paper antialiased flex items-center justify-center px-6">
        <div className="text-center">
          <span className="font-body text-4xl text-gold block mb-6" aria-hidden>∞</span>
          <h1 className="font-body font-light text-2xl text-paper mb-2 tracking-[-0.014em]">Gift not found.</h1>
          <p className="text-paper-65 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Go to Heirloom <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-void text-paper antialiased flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-md"
          role="status"
        >
          <span className="font-body text-4xl text-gold block mb-7" aria-hidden>∞</span>
          <h1 className="font-body font-light text-3xl text-paper mb-3 tracking-[-0.014em]">Gift claimed.</h1>
          <p className="text-paper-65 font-body text-lg mb-8 leading-relaxed">
            This memory is now part of your collection. Create a free account to keep it safe forever.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="btn btn-primary"
          >
            Create your free account <span aria-hidden>→</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-paper antialiased flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-md w-full"
      >
        <span className="font-body text-4xl text-gold block mb-7" aria-hidden>∞</span>

        <h1 className="font-body font-light text-3xl text-paper mb-2 tracking-[-0.014em]">You&apos;ve received a gift.</h1>
        {gift?.sender_name && (
          <p className="text-paper-65 font-body text-lg mb-2">
            From <span className="text-gold">{gift.sender_name}</span>
          </p>
        )}

        {gift?.personal_message && (
          <div className="bg-void-surface border border-paper-15 p-5 my-6 text-left">
            <p className="text-paper-70 font-body italic">&ldquo;{gift.personal_message}&rdquo;</p>
          </div>
        )}

        {gift?.content && (
          <div className="bg-void-surface border border-gold-40 p-5 my-6 text-left">
            <div className="mb-2">
              <span className="text-gold text-xs uppercase tracking-[0.22em] font-mono">
                {gift.memory_type === 'memory' ? 'Photo Memory' : gift.memory_type === 'voice' ? 'Voice Recording' : 'Letter'}
              </span>
            </div>
            <h3 className="font-body text-xl text-paper">{gift.content.title}</h3>
            {gift.content.preview && (
              <p className="text-paper-70 text-sm mt-1 line-clamp-2">{gift.content.preview}</p>
            )}
          </div>
        )}

        <button
          onClick={handleClaim}
          disabled={claiming}
          className="btn btn-primary w-full mt-4"
        >
          {claiming ? 'Unwrapping…' : 'Unwrap your gift'}
          {!claiming ? <span aria-hidden>→</span> : null}
        </button>

        <p className="text-paper-50 text-xs mt-6 font-mono">
          Powered by Heirloom &mdash; preserving what matters most
        </p>
      </motion.div>
    </div>
  );
}

export default GiftReceive;
