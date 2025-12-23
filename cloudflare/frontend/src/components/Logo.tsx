import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../stores/authStore';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

// SVG Infinity symbol to prevent font-loading flash (Unicode ∞ renders as "8" before fonts load)
export function InfinityMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ display: 'block' }}
    >
      <path
        d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const { isAuthenticated } = useAuthStore();
  const sizes = {
    sm: { mark: 28, text: 16 },
    md: { mark: 36, text: 20 },
    lg: { mark: 48, text: 28 },
  };
  
  const { mark, text } = sizes[size];
  
  return (
    <Link
      to={isAuthenticated ? '/dashboard' : '/'}
      className={clsx('flex items-center gap-3 no-underline group', className)}
    >
      {/* Logo mark - SVG infinity to prevent font-loading flash */}
      <motion.div
        className="text-gold"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <InfinityMark size={mark} />
      </motion.div>
      
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
