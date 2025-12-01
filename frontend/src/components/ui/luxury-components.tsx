'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, type LucideIcon } from 'lucide-react';
import React from 'react';

// ============================================================================
// ============================================================================

interface LuxuryButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function LuxuryButton({ 
  variant = 'primary', 
  size = 'md', 
  loading, 
  children, 
  className = '',
  onClick,
  disabled,
  type = 'button',
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
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {variant === 'primary' && (
        <motion.span 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}
      
      <span className="relative flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </span>
    </motion.button>
  );
}

// ============================================================================
// ============================================================================

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
      <div className="absolute -inset-px rounded-2xl bg-gold-500/0 
                      hover:bg-gold-500/5 transition-colors duration-500 -z-10" />
      {children}
    </Component>
  );
}

// ============================================================================
// ============================================================================

interface LuxuryInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export function LuxuryInput({ label, icon, className = '', ...props }: LuxuryInputProps) {
  return (
    <div className="relative">
      {label && (
        <label className="block text-[11px] tracking-[0.2em] uppercase text-gold-400/50 mb-3">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400/50">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`
            w-full px-5 py-4 rounded-xl
            ${icon ? 'pl-12' : ''}
            bg-obsidian-900/60 border border-gold-500/20
            text-pearl placeholder-gold-400/30
            focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/10
            transition-all duration-300
            ${className}
          `}
        />
      </div>
    </div>
  );
}

// ============================================================================
// ============================================================================

interface LuxuryTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function LuxuryTextarea({ label, className = '', ...props }: LuxuryTextareaProps) {
  return (
    <div className="relative">
      {label && (
        <label className="block text-[11px] tracking-[0.2em] uppercase text-gold-400/50 mb-3">
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`
          w-full px-5 py-4 rounded-xl resize-none
          bg-obsidian-900/60 border border-gold-500/20
          text-pearl placeholder-gold-400/30
          focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/10
          transition-all duration-300
          ${className}
        `}
      />
    </div>
  );
}

// ============================================================================
// ============================================================================

interface LuxuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function LuxuryModal({ isOpen, onClose, title, subtitle, size = 'md', children }: LuxuryModalProps) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-obsidian-900/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className={`relative w-full ${sizes[size]} max-h-[90vh] overflow-hidden
                        bg-charcoal/95 backdrop-blur-2xl
                        border border-gold-500/20 rounded-3xl
                        shadow-2xl shadow-black/50`}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r 
                         from-transparent via-gold-500/50 to-transparent"
            />

            {(title || subtitle) && (
              <div className="px-8 pt-8 pb-6 border-b border-gold-500/10">
                {title && (
                  <h2 className="font-serif text-2xl text-pearl tracking-wide">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-[12px] tracking-[0.15em] uppercase text-gold-400/50 mt-2">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            <motion.button
              onClick={onClose}
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-6 right-6 w-10 h-10 rounded-full
                         border border-gold-500/20 flex items-center justify-center
                         text-gold-400/60 hover:text-gold-500 hover:border-gold-500/40
                         transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </motion.button>

            <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// ============================================================================

interface LuxuryLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function LuxuryLabel({ children, className = '' }: LuxuryLabelProps) {
  return (
    <div className={`text-[11px] tracking-[0.2em] uppercase text-gold-400/50 ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// ============================================================================

interface LuxuryDetailItemProps {
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

export function LuxuryDetailItem({ label, value, className = '' }: LuxuryDetailItemProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <LuxuryLabel>{label}</LuxuryLabel>
      <div className="text-pearl text-base font-light mt-2">
        {value}
      </div>
    </div>
  );
}

// ============================================================================
// ============================================================================

interface LuxuryDividerProps {
  className?: string;
}

export function LuxuryDivider({ className = '' }: LuxuryDividerProps) {
  return (
    <div className={`h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent ${className}`} />
  );
}

// ============================================================================
// ============================================================================

interface LuxuryEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function LuxuryEmptyState({ icon: Icon, title, description, action }: LuxuryEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 rounded-full bg-gold-500/10 blur-xl" />
        <div className="relative w-20 h-20 rounded-full border border-gold-500/30 
                        flex items-center justify-center bg-obsidian-900/60">
          <Icon className="w-10 h-10 text-gold-400/60" />
        </div>
      </motion.div>
      
      <h3 className="font-serif text-xl text-pearl mb-2">{title}</h3>
      <p className="text-gold-400/60 text-sm max-w-md mb-6">{description}</p>
      
      {action && (
        <LuxuryButton variant="primary" onClick={action.onClick}>
          {action.label}
        </LuxuryButton>
      )}
    </motion.div>
  );
}

// ============================================================================
// ============================================================================

interface LuxuryLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LuxuryLoader({ size = 'md', className = '' }: LuxuryLoaderProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`${sizes[size]} ${className}`}>
      <div className="w-full h-full border border-gold-500/20 border-t-gold-500 
                      rounded-full animate-spin" />
    </div>
  );
}

// ============================================================================
// ============================================================================

interface LuxuryBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function LuxuryBadge({ children, variant = 'default', className = '' }: LuxuryBadgeProps) {
  const variants = {
    default: 'bg-gold-500/10 text-gold-400 border-gold-500/30',
    success: 'bg-green-500/10 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <span className={`
      inline-flex items-center px-3 py-1 rounded-full
      text-[10px] tracking-[0.15em] uppercase font-medium
      border ${variants[variant]} ${className}
    `}>
      {children}
    </span>
  );
}

// ============================================================================
// ============================================================================

interface LuxuryIconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LuxuryIconButton({ icon: Icon, onClick, className = '', size = 'md' }: LuxuryIconButtonProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        ${sizes[size]} rounded-full
        border border-gold-500/20 
        flex items-center justify-center
        text-gold-400/60 hover:text-gold-500 hover:border-gold-500/40
        transition-colors bg-obsidian-900/60
        ${className}
      `}
    >
      <Icon className="w-4 h-4" />
    </motion.button>
  );
}

// ============================================================================
// ============================================================================

interface LuxurySectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function LuxurySectionHeader({ title, subtitle, action, className = '' }: LuxurySectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-8 ${className}`}>
      <div>
        <h2 className="font-serif text-2xl text-pearl tracking-wide mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] tracking-[0.15em] uppercase text-gold-400/50">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ============================================================================
// ============================================================================

interface LuxuryStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function LuxuryStatCard({ icon: Icon, label, value, trend, className = '' }: LuxuryStatCardProps) {
  return (
    <LuxuryCard hover={false} className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <LuxuryLabel>{label}</LuxuryLabel>
          <div className="text-3xl font-serif text-pearl mt-3 mb-2">
            {value}
          </div>
          {trend && (
            <div className={`text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-full border border-gold-500/20 
                        flex items-center justify-center bg-gold-500/5">
          <Icon className="w-6 h-6 text-gold-400" />
        </div>
      </div>
    </LuxuryCard>
  );
}

// ============================================================================
// ============================================================================

interface LuxuryTabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function LuxuryTabs({ tabs, activeTab, onChange, className = '' }: LuxuryTabsProps) {
  return (
    <div className={`flex gap-2 border-b border-gold-500/10 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            px-6 py-3 text-[11px] tracking-[0.15em] uppercase font-medium
            transition-all duration-300 relative
            ${activeTab === tab.id 
              ? 'text-gold-400' 
              : 'text-gold-400/50 hover:text-gold-400/70'
            }
          `}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500"
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// ============================================================================

interface LuxuryTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function LuxuryTooltip({ content, children, position = 'top' }: LuxuryTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute ${positions[position]} z-50
              px-3 py-2 rounded-lg
              bg-charcoal/95 backdrop-blur-xl
              border border-gold-500/20
              text-pearl text-xs whitespace-nowrap
              pointer-events-none
            `}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// ============================================================================

export function GoldenDust() {
  const particles = React.useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      delay: Math.random() * 15,
      duration: 15 + Math.random() * 10
    })), []
  );

  return (
    <>
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="golden-dust"
          style={{ left: particle.left }}
          animate={{
            y: ['-100vh', '100vh'],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </>
  );
}
