import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../stores/authStore';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
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
      {/* Logo mark - simple rotating infinity like marketing site */}
      <motion.span 
        className="text-gold"
        style={{ fontSize: mark }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        ∞
      </motion.span>
      
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
