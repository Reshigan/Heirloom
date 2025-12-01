'use client';

import { motion } from 'framer-motion';

interface LuxuryCardProps {
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export function LuxuryCard({ children, hover = true, className = '', onClick }: LuxuryCardProps) {
  const Component = hover ? motion.div : 'div';
  
  return (
    <Component
      onClick={onClick}
      whileHover={hover ? { y: -4 } : undefined}
      className={`
        relative p-6 rounded-2xl
        bg-charcoal/60 backdrop-blur-xl
        border border-gold-500/15
        hover:border-gold-500/30
        transition-all duration-500
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Subtle glow on hover */}
      <div className="absolute -inset-px rounded-2xl bg-gold-500/0 
                      group-hover:bg-gold-500/5 transition-colors duration-500 -z-10" />
      {children}
    </Component>
  );
}
