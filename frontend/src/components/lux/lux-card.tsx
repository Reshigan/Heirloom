import React from 'react';

interface LuxCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function LuxCard({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md'
}: LuxCardProps) {
  const baseStyles = 'rounded-[20px] border border-gold-primary/20 backdrop-blur-[30px]';
  
  const variantStyles = {
    default: 'bg-charcoal/80',
    elevated: 'bg-charcoal/95 shadow-[0_20px_60px_rgba(212,175,55,0.3)]',
    glass: 'bg-charcoal/60'
  };
  
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-10'
  };
  
  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}
