import { motion } from 'framer-motion';
import { Lock, Calendar, Cake, Heart, Users, GitBranch } from 'lucide-react';
import type { LockType } from '../../services/api';

const LABELS: Record<LockType, string> = {
  DATE: 'Locked until a specific date',
  AGE: 'Unlocks at a milestone age',
  AUTHOR_DEATH: 'Sealed until verified passing',
  RECIPIENT_EVENT: 'Locked to a life event',
  GENERATION: 'For a future generation',
};

const ICONS: Record<LockType, typeof Lock> = {
  DATE: Calendar,
  AGE: Cake,
  AUTHOR_DEATH: Heart,
  RECIPIENT_EVENT: Users,
  GENERATION: GitBranch,
};

interface Props {
  lockType: LockType;
  /** Optional resolution date or label, e.g. "opens 2050-01-01" or "when she turns 18" */
  detail?: string;
  /** Pulse softly to signal "still locked" */
  pulse?: boolean;
}

export function TimeLockBadge({ lockType, detail, pulse = true }: Props) {
  const Icon = ICONS[lockType];
  const label = LABELS[lockType];

  return (
    <motion.span
      role="status"
      aria-label={`${label}${detail ? `: ${detail}` : ''}`}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/25 bg-gold/[0.04] text-gold/80 text-xs tracking-wide"
      animate={
        pulse
          ? { boxShadow: ['0 0 0 0 rgba(201,169,89,0)', '0 0 0 6px rgba(201,169,89,0.08)', '0 0 0 0 rgba(201,169,89,0)'] }
          : undefined
      }
      transition={pulse ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      <Icon size={14} strokeWidth={1.6} aria-hidden="true" />
      <span>{label}</span>
      {detail ? <span className="text-gold/50">— {detail}</span> : null}
    </motion.span>
  );
}
