import { motion } from 'framer-motion';
import { CheckCircle, Plus, ArrowRight } from 'lucide-react';

interface SuccessStateProps {
  title: string;
  message?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: 'plus' | 'arrow';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function SuccessState({
  title,
  message,
  primaryAction,
  secondaryAction,
  className = '',
}: SuccessStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`text-center py-8 ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <CheckCircle size={32} className="text-green-400" />
        </motion.div>
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-medium mb-2"
      >
        {title}
      </motion.h3>
      
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-paper/60 mb-6"
        >
          {message}
        </motion.p>
      )}
      
      {(primaryAction || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="px-6 py-3 bg-gradient-to-r from-gold to-gold/80 text-void font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              {primaryAction.icon === 'plus' && <Plus size={18} />}
              {primaryAction.icon === 'arrow' && <ArrowRight size={18} />}
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-3 text-paper/60 hover:text-paper transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export function InlineSuccess({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
    >
      <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
      <span className="flex-1 text-sm">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-paper/40 hover:text-paper transition-colors text-sm"
        >
          Dismiss
        </button>
      )}
    </motion.div>
  );
}
