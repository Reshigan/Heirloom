import React from 'react';

interface LuxButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function LuxButton({ 
  children, 
  onClick, 
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button'
}: LuxButtonProps) {
  const baseStyles = 'font-sans font-light tracking-[0.05em] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer';
  
  const variantStyles = {
    primary: 'bg-gradient-to-br from-gold-dark to-gold-primary text-obsidian border-none hover:shadow-[0_10px_40px_rgba(212,175,55,0.3)] hover:-translate-y-0.5',
    secondary: 'bg-charcoal/90 backdrop-blur-[20px] border border-gold-primary/30 text-gold-primary hover:border-gold-primary hover:shadow-[0_10px_40px_rgba(212,175,55,0.3)] hover:-translate-y-0.5',
    ghost: 'bg-transparent border-none text-gold-light hover:text-gold-primary'
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-xs rounded-lg uppercase tracking-[0.2em]',
    md: 'px-6 py-3 text-sm rounded-xl uppercase tracking-[0.2em]',
    lg: 'px-8 py-4 text-base rounded-2xl uppercase tracking-[0.15em]'
  };
  
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  );
}
