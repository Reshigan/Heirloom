import { Heart, Sparkles, Gift, Star, Cloud, Droplet, Eye, Trophy, Leaf, Sun } from 'lucide-react';

type EmotionLabel = 'joyful' | 'nostalgic' | 'grateful' | 'loving' | 'bittersweet' | 'sad' | 'reflective' | 'proud' | 'peaceful' | 'hopeful';

interface EmotionBadgeProps {
  emotion: EmotionLabel | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const EMOTION_CONFIG: Record<EmotionLabel, { color: string; bgColor: string; icon: React.ElementType }> = {
  joyful: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/20', icon: Sparkles },
  nostalgic: { color: 'text-amber-400', bgColor: 'bg-amber-400/20', icon: Cloud },
  grateful: { color: 'text-emerald-400', bgColor: 'bg-emerald-400/20', icon: Gift },
  loving: { color: 'text-rose-400', bgColor: 'bg-rose-400/20', icon: Heart },
  bittersweet: { color: 'text-purple-400', bgColor: 'bg-purple-400/20', icon: Droplet },
  sad: { color: 'text-blue-400', bgColor: 'bg-blue-400/20', icon: Droplet },
  reflective: { color: 'text-indigo-400', bgColor: 'bg-indigo-400/20', icon: Eye },
  proud: { color: 'text-orange-400', bgColor: 'bg-orange-400/20', icon: Trophy },
  peaceful: { color: 'text-teal-400', bgColor: 'bg-teal-400/20', icon: Leaf },
  hopeful: { color: 'text-sky-400', bgColor: 'bg-sky-400/20', icon: Sun },
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const ICON_SIZES = {
  sm: 10,
  md: 12,
  lg: 14,
};

export function EmotionBadge({ emotion, size = 'sm', showIcon = true }: EmotionBadgeProps) {
  const config = EMOTION_CONFIG[emotion as EmotionLabel] || EMOTION_CONFIG.reflective;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium capitalize ${config.color} ${config.bgColor} ${SIZE_CLASSES[size]}`}>
      {showIcon && <Icon size={ICON_SIZES[size]} />}
      {emotion}
    </span>
  );
}

export type { EmotionLabel };
