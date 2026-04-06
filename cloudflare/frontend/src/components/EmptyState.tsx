import { motion } from 'framer-motion';
import { type IconProps } from './Icons';

interface EmptyStateProps {
  icon: React.ComponentType<IconProps>;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  emotional?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  emotional = true,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/10 flex items-center justify-center"
      >
        <Icon size={36} className="text-gold/60" />
      </motion.div>

      {emotional ? (
        <>
          <h3 className="font-serif text-2xl text-paper mb-2">{title}</h3>
          <p className="font-serif text-paper/40 text-lg max-w-md leading-relaxed">
            {subtitle}
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium text-paper mb-1">{title}</h3>
          <p className="text-paper/50 text-sm max-w-md">{subtitle}</p>
        </>
      )}

      {actionLabel && onAction && (
        <motion.button
          onClick={onAction}
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/20 text-gold font-medium text-sm hover:from-gold/30 hover:to-gold/15 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
