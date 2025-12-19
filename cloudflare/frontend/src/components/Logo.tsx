import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { mark: 28, text: 16 },
    md: { mark: 36, text: 20 },
    lg: { mark: 48, text: 28 },
  };
  
  const { mark, text } = sizes[size];
  
  return (
    <Link
      to="/"
      className={clsx('flex items-center gap-3 no-underline group', className)}
    >
      {/* Logo mark */}
      <div
        className="relative"
        style={{ width: mark, height: mark }}
      >
        {/* Rotating ring */}
        <motion.div
          className="absolute inset-0 border border-gold rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {/* Dot on ring */}
          <div
            className="absolute w-1 h-1 bg-gold-bright rounded-full"
            style={{ top: -2, left: '50%', transform: 'translateX(-50%)' }}
          />
        </motion.div>
        
        {/* Infinity symbol - using canonical path from Icons.tsx */}
        <svg
          viewBox="0 0 24 24"
          className="absolute"
          style={{ inset: mark * 0.2 }}
        >
          <motion.path
            d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.873 0-4.873 8 0 8 5.606 0 7.644-8 12.74-8z"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <span
          className="text-paper tracking-[0.15em] font-light group-hover:text-gold transition-colors"
          style={{ fontSize: text }}
        >
          Heirloom
        </span>
      )}
    </Link>
  );
}
