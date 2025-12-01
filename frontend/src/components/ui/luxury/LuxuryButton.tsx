'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LuxuryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function LuxuryButton({ 
  variant = 'primary', 
  size = 'md', 
  loading, 
  children, 
  className = '',
  ...props
}: LuxuryButtonProps) {
  
  const baseStyles = `
    relative overflow-hidden font-medium tracking-[0.15em] uppercase
    transition-all duration-300 rounded-full
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600
      text-obsidian-900 shadow-lg shadow-gold-500/20
      hover:shadow-xl hover:shadow-gold-500/30
    `,
    secondary: `
      border border-gold-500/30 text-gold-400
      hover:border-gold-500/50 hover:bg-gold-500/5
    `,
    ghost: `
      text-gold-400/70 hover:text-gold-500 hover:bg-gold-500/5
    `,
  };

  const sizes = {
    sm: 'px-6 py-2 text-[10px]',
    md: 'px-8 py-3 text-[11px]',
    lg: 'px-10 py-4 text-[12px]',
  };

  return (
    <motion.button
      {...props}
      disabled={loading || props.disabled}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {/* Shimmer effect for primary */}
      {variant === 'primary' && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                         translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      )}
      
      <span className="relative flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </span>
    </motion.button>
  );
}
