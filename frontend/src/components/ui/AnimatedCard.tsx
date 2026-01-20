/**
 * AnimatedCard Component
 * Card with hover/tap micro-interactions and glassmorphism
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive' | 'highlight';
  hoverScale?: number;
  tapScale?: number;
  glowOnHover?: boolean;
  className?: string;
}

const variantStyles = {
  default: 'bg-glass-bg backdrop-blur-glass border border-glass-border',
  elevated: 'bg-glass-bg backdrop-blur-glass border border-glass-border shadow-glass',
  interactive: 'bg-glass-bg backdrop-blur-glass border border-glass-border hover:border-gold/30 cursor-pointer',
  highlight: 'bg-gold/5 backdrop-blur-glass border border-gold/20',
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  variant = 'default',
  hoverScale = 1.02,
  tapScale = 0.98,
  glowOnHover = false,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      className={`
        relative rounded-xl overflow-hidden transition-colors duration-300
        ${variantStyles[variant]}
        ${className}
      `}
      whileHover={{ 
        scale: hoverScale,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }}
      whileTap={{ 
        scale: tapScale,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      {...props}
    >
      {/* Glow effect on hover */}
      {glowOnHover && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'radial-gradient(circle at center, rgba(201, 169, 89, 0.1) 0%, transparent 70%)',
          }}
        />
      )}
      {children}
    </motion.div>
  );
};

/**
 * AnimatedCardHeader - Header section for AnimatedCard
 */
interface AnimatedCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedCardHeader: React.FC<AnimatedCardHeaderProps> = ({
  children,
  className = '',
}) => (
  <div className={`p-4 border-b border-glass-border ${className}`}>
    {children}
  </div>
);

/**
 * AnimatedCardContent - Content section for AnimatedCard
 */
interface AnimatedCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedCardContent: React.FC<AnimatedCardContentProps> = ({
  children,
  className = '',
}) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

/**
 * AnimatedCardFooter - Footer section for AnimatedCard
 */
interface AnimatedCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedCardFooter: React.FC<AnimatedCardFooterProps> = ({
  children,
  className = '',
}) => (
  <div className={`p-4 border-t border-glass-border ${className}`}>
    {children}
  </div>
);

export default AnimatedCard;
