/**
 * EmptyState Component
 * Emotional empty states with custom SVG illustrations for each content type
 */

import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  type: 'memories' | 'letters' | 'voice' | 'family' | 'generic';
  title: string;
  subtitle: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  testimonial?: {
    quote: string;
    author: string;
  };
}

// Custom SVG Illustrations for each empty state type

const MemoriesIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Floating photo frames fading into stars */}
    <defs>
      <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c9a959" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#c9a959" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e8d5a3" />
        <stop offset="100%" stopColor="#c9a959" />
      </linearGradient>
    </defs>
    
    {/* Main photo frame */}
    <motion.g
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <rect x="60" y="40" width="80" height="60" rx="4" stroke="url(#frameGradient)" strokeWidth="2" fill="none" />
      <rect x="68" y="48" width="64" height="44" rx="2" fill="rgba(201, 169, 89, 0.1)" />
      <circle cx="85" cy="62" r="6" fill="rgba(201, 169, 89, 0.3)" />
      <path d="M68 85 L90 70 L105 80 L132 60 L132 92 L68 92 Z" fill="rgba(201, 169, 89, 0.2)" />
    </motion.g>
    
    {/* Smaller floating frames */}
    <motion.rect
      x="20" y="60" width="30" height="24" rx="2"
      stroke="url(#frameGradient)" strokeWidth="1.5" fill="none"
      animate={{ y: [0, -8, 0], opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
    />
    <motion.rect
      x="150" y="50" width="35" height="28" rx="2"
      stroke="url(#frameGradient)" strokeWidth="1.5" fill="none"
      animate={{ y: [0, -6, 0], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
    />
    
    {/* Stars emerging from frames */}
    {[
      { cx: 45, cy: 30, r: 2, delay: 0 },
      { cx: 155, cy: 25, r: 1.5, delay: 0.3 },
      { cx: 100, cy: 15, r: 2.5, delay: 0.6 },
      { cx: 30, cy: 45, r: 1.5, delay: 0.9 },
      { cx: 170, cy: 40, r: 2, delay: 1.2 },
      { cx: 80, cy: 25, r: 1.5, delay: 1.5 },
      { cx: 120, cy: 20, r: 2, delay: 1.8 },
    ].map((star, i) => (
      <motion.circle
        key={i}
        cx={star.cx}
        cy={star.cy}
        r={star.r}
        fill="url(#starGradient)"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: star.delay }}
      />
    ))}
    
    {/* Sparkle particles */}
    <motion.path
      d="M100 130 L102 135 L107 137 L102 139 L100 144 L98 139 L93 137 L98 135 Z"
      fill="#c9a959"
      animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </svg>
);

const LettersIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sealed envelope with wax seal */}
    <defs>
      <linearGradient id="envelopeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5f3ee" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#e8e4db" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="sealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b2942" />
        <stop offset="100%" stopColor="#a83250" />
      </linearGradient>
    </defs>
    
    {/* Envelope body */}
    <motion.g
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <rect x="40" y="50" width="120" height="80" rx="4" fill="url(#envelopeGradient)" stroke="rgba(201, 169, 89, 0.4)" strokeWidth="1.5" />
      
      {/* Envelope flap */}
      <path d="M40 50 L100 90 L160 50" stroke="rgba(201, 169, 89, 0.4)" strokeWidth="1.5" fill="none" />
      
      {/* Inner fold lines */}
      <path d="M40 130 L100 95 L160 130" stroke="rgba(201, 169, 89, 0.2)" strokeWidth="1" fill="none" />
      
      {/* Wax seal */}
      <motion.g
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="100" cy="90" r="18" fill="url(#sealGradient)" />
        <circle cx="100" cy="90" r="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        {/* Infinity symbol on seal */}
        <path d="M108 90c3 0 3 5 0 5-3 0-4-5-7-5-2.5 0-2.5 5 0 5 3 0 4-5 7-5z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" />
      </motion.g>
    </motion.g>
    
    {/* Floating smaller envelopes */}
    <motion.rect
      x="15" y="70" width="20" height="14" rx="2"
      fill="none" stroke="rgba(201, 169, 89, 0.3)" strokeWidth="1"
      animate={{ y: [0, -6, 0], opacity: [0.3, 0.6, 0.3], rotate: [-5, 5, -5] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.rect
      x="165" y="65" width="22" height="16" rx="2"
      fill="none" stroke="rgba(201, 169, 89, 0.3)" strokeWidth="1"
      animate={{ y: [0, -8, 0], opacity: [0.4, 0.7, 0.4], rotate: [5, -5, 5] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
    />
    
    {/* Decorative hearts */}
    <motion.path
      d="M30 40 C30 35 38 35 38 40 C38 45 30 50 30 50 C30 50 22 45 22 40 C22 35 30 35 30 40"
      fill="rgba(139, 41, 66, 0.4)"
      animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.path
      d="M170 35 C170 31 176 31 176 35 C176 39 170 43 170 43 C170 43 164 39 164 35 C164 31 170 31 170 35"
      fill="rgba(139, 41, 66, 0.3)"
      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
    />
  </svg>
);

const VoiceIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sound waves forming a heart */}
    <defs>
      <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#c9a959" stopOpacity="0.3" />
        <stop offset="50%" stopColor="#c9a959" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#c9a959" stopOpacity="0.3" />
      </linearGradient>
    </defs>
    
    {/* Central microphone */}
    <motion.g
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <rect x="90" y="50" width="20" height="35" rx="10" fill="none" stroke="#c9a959" strokeWidth="2" />
      <path d="M80 75 L80 85 C80 100 90 110 100 110 C110 110 120 100 120 85 L120 75" stroke="#c9a959" strokeWidth="2" fill="none" />
      <line x1="100" y1="110" x2="100" y2="125" stroke="#c9a959" strokeWidth="2" />
      <line x1="88" y1="125" x2="112" y2="125" stroke="#c9a959" strokeWidth="2" />
    </motion.g>
    
    {/* Sound waves emanating outward */}
    {[1, 2, 3].map((i) => (
      <motion.path
        key={`left-${i}`}
        d={`M${75 - i * 15} ${60 + i * 5} Q${70 - i * 15} 80 ${75 - i * 15} ${100 - i * 5}`}
        stroke="url(#waveGradient)"
        strokeWidth="2"
        fill="none"
        animate={{ opacity: [0.2, 0.6, 0.2], pathLength: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
      />
    ))}
    {[1, 2, 3].map((i) => (
      <motion.path
        key={`right-${i}`}
        d={`M${125 + i * 15} ${60 + i * 5} Q${130 + i * 15} 80 ${125 + i * 15} ${100 - i * 5}`}
        stroke="url(#waveGradient)"
        strokeWidth="2"
        fill="none"
        animate={{ opacity: [0.2, 0.6, 0.2], pathLength: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
      />
    ))}
    
    {/* Heart shape formed by outer waves */}
    <motion.path
      d="M100 20 C85 20 70 35 70 50 C70 75 100 95 100 95 C100 95 130 75 130 50 C130 35 115 20 100 20"
      stroke="rgba(139, 41, 66, 0.4)"
      strokeWidth="1.5"
      fill="none"
      strokeDasharray="4 4"
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    
    {/* Floating music notes */}
    <motion.g
      animate={{ y: [0, -10, 0], x: [0, 3, 0] }}
      transition={{ duration: 4, repeat: Infinity }}
    >
      <circle cx="35" cy="45" r="4" fill="rgba(201, 169, 89, 0.5)" />
      <line x1="39" y1="45" x2="39" y2="30" stroke="rgba(201, 169, 89, 0.5)" strokeWidth="1.5" />
      <path d="M39 30 Q45 28 45 35" stroke="rgba(201, 169, 89, 0.5)" strokeWidth="1.5" fill="none" />
    </motion.g>
    <motion.g
      animate={{ y: [0, -8, 0], x: [0, -3, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
    >
      <circle cx="165" cy="40" r="3.5" fill="rgba(201, 169, 89, 0.4)" />
      <line x1="168.5" y1="40" x2="168.5" y2="27" stroke="rgba(201, 169, 89, 0.4)" strokeWidth="1.5" />
    </motion.g>
  </svg>
);

const FamilyIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Connected silhouettes forming a tree */}
    <defs>
      <linearGradient id="treeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#8b7355" />
        <stop offset="100%" stopColor="#c9a959" />
      </linearGradient>
      <linearGradient id="personGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c9a959" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#c9a959" stopOpacity="0.4" />
      </linearGradient>
    </defs>
    
    {/* Tree trunk and branches */}
    <motion.path
      d="M100 140 L100 100 M100 100 L70 70 M100 100 L130 70 M70 70 L50 50 M70 70 L90 50 M130 70 L110 50 M130 70 L150 50"
      stroke="url(#treeGradient)"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      animate={{ pathLength: [0.9, 1, 0.9] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
    
    {/* Root person (bottom) */}
    <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity }}>
      <circle cx="100" cy="100" r="12" fill="url(#personGradient)" />
    </motion.g>
    
    {/* Second generation */}
    <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.3 }}>
      <circle cx="70" cy="70" r="10" fill="url(#personGradient)" />
    </motion.g>
    <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}>
      <circle cx="130" cy="70" r="10" fill="url(#personGradient)" />
    </motion.g>
    
    {/* Third generation */}
    {[
      { cx: 50, cy: 50, delay: 0.7 },
      { cx: 90, cy: 50, delay: 0.9 },
      { cx: 110, cy: 50, delay: 1.1 },
      { cx: 150, cy: 50, delay: 1.3 },
    ].map((person, i) => (
      <motion.circle
        key={i}
        cx={person.cx}
        cy={person.cy}
        r="8"
        fill="url(#personGradient)"
        animate={{ y: [0, -4, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, delay: person.delay }}
      />
    ))}
    
    {/* Connecting hearts */}
    <motion.path
      d="M85 85 C85 82 89 82 89 85 C89 88 85 91 85 91 C85 91 81 88 81 85 C81 82 85 82 85 85"
      fill="rgba(139, 41, 66, 0.5)"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.path
      d="M115 85 C115 82 119 82 119 85 C119 88 115 91 115 91 C115 91 111 88 111 85 C111 82 115 82 115 85"
      fill="rgba(139, 41, 66, 0.5)"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
    />
    
    {/* Leaves/growth */}
    {[
      { x: 40, y: 35, rotate: -30 },
      { x: 160, y: 35, rotate: 30 },
      { x: 75, y: 40, rotate: -15 },
      { x: 125, y: 40, rotate: 15 },
    ].map((leaf, i) => (
      <motion.ellipse
        key={i}
        cx={leaf.x}
        cy={leaf.y}
        rx="6"
        ry="3"
        fill="rgba(90, 184, 138, 0.4)"
        transform={`rotate(${leaf.rotate} ${leaf.x} ${leaf.y})`}
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
      />
    ))}
  </svg>
);

const GenericIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Infinity symbol with sparkles */}
    <defs>
      <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c9a959" />
        <stop offset="100%" stopColor="#e8d5a3" />
      </linearGradient>
    </defs>
    
    <motion.path
      d="M130 80c20 0 20 30 0 30-20 0-28-30-48-30-18 0-18 30 0 30 20 0 28-30 48-30z"
      stroke="url(#infinityGradient)"
      strokeWidth="3"
      fill="none"
      animate={{ pathLength: [0, 1], opacity: [0.5, 1] }}
      transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
    />
    
    {/* Sparkles around */}
    {[
      { x: 50, y: 50 },
      { x: 150, y: 50 },
      { x: 100, y: 40 },
      { x: 70, y: 120 },
      { x: 130, y: 120 },
    ].map((pos, i) => (
      <motion.g key={i} animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}>
        <path d={`M${pos.x} ${pos.y - 5} L${pos.x + 2} ${pos.y} L${pos.x} ${pos.y + 5} L${pos.x - 2} ${pos.y} Z`} fill="#c9a959" />
      </motion.g>
    ))}
  </svg>
);

const illustrations = {
  memories: MemoriesIllustration,
  letters: LettersIllustration,
  voice: VoiceIllustration,
  family: FamilyIllustration,
  generic: GenericIllustration,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  testimonial,
}) => {
  const Illustration = illustrations[type] || illustrations.generic;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Illustration */}
      <div className="mb-8">
        <Illustration />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-display text-paper mb-3 max-w-md">
        {title}
      </h3>

      {/* Subtitle */}
      <p className="text-paper/70 text-lg max-w-lg mb-8 leading-relaxed">
        {subtitle}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {primaryAction && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={primaryAction.onClick}
            className="btn btn-primary min-h-[44px] min-w-[44px] px-6"
          >
            {primaryAction.label}
          </motion.button>
        )}
        {secondaryAction && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={secondaryAction.onClick}
            className="btn btn-secondary min-h-[44px] min-w-[44px] px-6"
          >
            {secondaryAction.label}
          </motion.button>
        )}
      </div>

      {/* Testimonial */}
      {testimonial && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-md p-6 rounded-xl bg-void-light/50 border border-glass-border"
        >
          <p className="text-paper/60 italic text-base mb-3">
            "{testimonial.quote}"
          </p>
          <p className="text-gold text-sm">
            - {testimonial.author}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
