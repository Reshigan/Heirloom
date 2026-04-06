import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Crown } from './Icons';

interface ContentLockProps {
  children: React.ReactNode;
  isLocked: boolean;
  type?: 'photo' | 'voice' | 'letter' | 'default';
}

export function ContentLock({ children, isLocked, type = 'default' }: ContentLockProps) {
  const navigate = useNavigate();

  if (!isLocked) return <>{children}</>;

  const messages: Record<string, { title: string; subtitle: string }> = {
    photo: {
      title: 'These memories are waiting',
      subtitle: 'Upgrade to keep viewing your photos forever',
    },
    voice: {
      title: 'Your voice recordings are preserved',
      subtitle: 'Upgrade to continue listening to these precious moments',
    },
    letter: {
      title: 'Your letters are safe',
      subtitle: 'Upgrade to keep reading and writing forever',
    },
    default: {
      title: 'Your legacy is preserved',
      subtitle: 'Upgrade to continue building your digital legacy',
    },
  };

  const { title, subtitle } = messages[type];

  return (
    <div className="relative">
      {/* Blurred content underneath */}
      <div className="blur-md opacity-50 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Lock overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center bg-void/60 backdrop-blur-sm rounded-xl z-10"
      >
        <div className="text-center px-6 max-w-sm">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center"
          >
            <Lock size={28} className="text-gold" />
          </motion.div>

          <h3 className="font-serif text-xl text-paper mb-2">{title}</h3>
          <p className="text-paper/50 text-sm mb-6">{subtitle}</p>

          <motion.button
            onClick={() => navigate('/billing')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-void font-medium text-sm hover:shadow-lg hover:shadow-gold/20 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Crown size={16} />
            Upgrade Now
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
