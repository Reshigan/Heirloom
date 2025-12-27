import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StickyFooterProps {
  children: ReactNode;
  className?: string;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}

export function StickyFooter({
  children,
  className = '',
  showOnMobile = true,
  showOnDesktop = false,
}: StickyFooterProps) {
  const visibilityClasses = showOnDesktop 
    ? '' 
    : showOnMobile 
      ? 'md:hidden' 
      : 'hidden md:block';

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={`fixed bottom-0 left-0 right-0 z-40 ${visibilityClasses} ${className}`}
    >
      {/* Gradient fade effect */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-void to-transparent pointer-events-none" />
      
      {/* Content container */}
      <div className="bg-void/95 backdrop-blur-lg border-t border-paper/10 px-4 py-3 pb-safe">
        <div className="max-w-lg mx-auto">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

interface StickyActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function StickyActionButton({
  onClick,
  disabled = false,
  loading = false,
  children,
  variant = 'primary',
  className = '',
}: StickyActionButtonProps) {
  const baseClasses = 'w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 min-h-[56px]';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-gold to-gold/80 text-void hover:opacity-90 disabled:opacity-50',
    secondary: 'glass text-paper hover:text-gold disabled:opacity-50',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      whileTap={{ scale: 0.98 }}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  );
}

// Add safe area padding for iOS devices
// Add this to your globals.css:
// .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
