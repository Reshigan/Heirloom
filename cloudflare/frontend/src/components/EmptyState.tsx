import { motion } from 'framer-motion';

interface EmptyStateProps {
  /** Deprecated — icons are retired (§2.6). Accepted for back-compat; ignored. */
  icon?: unknown;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  emotional?: boolean;
}

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  emotional = true,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <span className="font-body text-4xl text-gold block mb-7" aria-hidden>∞</span>

      {emotional ? (
        <>
          <h3 className="font-body font-light text-2xl text-paper mb-2 tracking-[-0.014em]">{title}</h3>
          <p className="text-paper-65 text-lg max-w-md leading-relaxed">
            {subtitle}
          </p>
        </>
      ) : (
        <>
          <h3 className="font-body text-lg text-paper mb-1">{title}</h3>
          <p className="text-paper-65 text-sm max-w-md">{subtitle}</p>
        </>
      )}

      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary mt-8">
          {actionLabel}
          <span aria-hidden>→</span>
        </button>
      )}
    </motion.div>
  );
}
