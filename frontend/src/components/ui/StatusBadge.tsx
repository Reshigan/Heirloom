/**
 * StatusBadge Component
 * Semantic status indicators with proper color tokens
 */

import React from 'react';
import { motion } from 'framer-motion';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'active';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  pulse?: boolean;
}

const statusStyles: Record<StatusType, { bg: string; text: string; border: string; dot: string }> = {
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  error: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  pending: {
    bg: 'bg-gold/10',
    text: 'text-gold',
    border: 'border-gold/30',
    dot: 'bg-gold',
  },
  active: {
    bg: 'bg-gold/15',
    text: 'text-gold',
    border: 'border-gold/40',
    dot: 'bg-gold',
  },
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showDot = true,
  pulse = false,
}) => {
  const styles = statusStyles[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${styles.bg} ${styles.text} ${styles.border} ${sizeStyles[size]}
      `}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {showDot && (
        <span className="relative flex">
          <span className={`${dotSizes[size]} rounded-full ${styles.dot}`} />
          {pulse && (
            <motion.span
              className={`absolute inset-0 rounded-full ${styles.dot}`}
              animate={{ scale: [1, 2], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </span>
      )}
      {label}
    </span>
  );
};

export default StatusBadge;
