import React from 'react';

interface LuxFabProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
}

export function LuxFab({ 
  children, 
  onClick,
  variant = 'secondary',
  size = 'md',
  className = '',
  ariaLabel
}: LuxFabProps) {
  const baseStyles = 'rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]';
  
  const variantStyles = {
    primary: 'bg-gradient-to-br from-gold-dark to-gold-primary border-none text-obsidian text-2xl hover:shadow-[0_10px_40px_rgba(212,175,55,0.3)] hover:-translate-y-0.5',
    secondary: 'bg-charcoal/90 backdrop-blur-[20px] border border-gold-primary/30 text-gold-primary text-xl hover:border-gold-primary hover:shadow-[0_10px_40px_rgba(212,175,55,0.3)] hover:-translate-y-0.5'
  };
  
  const sizeStyles = {
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };
  
  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export function LuxFabGroup({ 
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`fixed bottom-10 right-10 flex flex-col gap-4 z-[900] ${className}`}>
      {children}
    </div>
  );
}
