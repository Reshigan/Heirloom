import { motion } from 'framer-motion';
import { Trophy, Star, TrendingUp, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { aiApi } from '../services/api';

interface LegacyScoreProps {
  className?: string;
  compact?: boolean;
}

const tierColors: Record<string, string> = {
  'Just Started': 'text-paper/50',
  'Beginning': 'text-blue-400',
  'Story Builder': 'text-emerald-400',
  'Memory Keeper': 'text-purple-400',
  'Legacy Guardian': 'text-gold',
};

const tierIcons: Record<string, string> = {
  'Just Started': '🌱',
  'Beginning': '📖',
  'Story Builder': '✨',
  'Memory Keeper': '💎',
  'Legacy Guardian': '👑',
};

export function LegacyScore({ className = '', compact = false }: LegacyScoreProps) {
  const { data: scoreData, isLoading } = useQuery({
    queryKey: ['legacy-score'],
    queryFn: () => aiApi.getLegacyScore().then(r => r.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return null;
  }

  const { score, maxScore, percentage, tier, breakdown, suggestions } = scoreData;
  const tierColor = tierColors[tier] || 'text-paper/50';
  const tierIcon = tierIcons[tier] || '🌱';

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`card glass-strong ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{tierIcon}</span>
            <div>
              <p className={`font-medium ${tierColor}`}>{tier}</p>
              <p className="text-paper/50 text-sm">{score} / {maxScore} points</p>
            </div>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-void-light"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${percentage * 1.76} 176`}
                className="text-gold"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
              {percentage}%
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={24} className="text-gold" />
        <h2 className="text-xl font-medium">Legacy Score</h2>
      </div>

      <div className="flex items-center gap-6 mb-8">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-void-light"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray="352"
              initial={{ strokeDashoffset: 352 }}
              animate={{ strokeDashoffset: 352 - (percentage * 3.52) }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="text-gold"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-light">{percentage}%</span>
            <span className="text-paper/50 text-sm">{score}/{maxScore}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">{tierIcon}</span>
            <span className={`text-2xl font-medium ${tierColor}`}>{tier}</span>
          </div>
          <p className="text-paper/60">
            Keep building your legacy to unlock higher tiers!
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Star size={18} className="text-gold" />
          Score Breakdown
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {breakdown && Object.entries(breakdown).map(([key, value]: [string, any]) => (
            <div key={key} className="p-3 bg-void/30 rounded-lg">
              <p className="text-paper/50 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-lg font-medium">
                {value.points} <span className="text-paper/40 text-sm">/ {value.max}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-gold" />
            Suggestions to Improve
          </h3>
          <ul className="space-y-2">
            {suggestions.map((suggestion: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-paper/70">
                <span className="text-gold mt-1">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
