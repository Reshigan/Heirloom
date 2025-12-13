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
        
        {/* Infinity symbol */}
        <svg
          viewBox="0 0 24 12"
          className="absolute"
          style={{ inset: mark * 0.2 }}
        >
          <motion.path
            d="M6 6c0-2.5 1.5-4 3.5-4S13 3.5 12 6s-2 4-5 4-4-1.5-3-4m6 0c0-2.5 1.5-4 3.5-4S19 3.5 18 6s-2 4-5 4-4-1.5-3-4"
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
