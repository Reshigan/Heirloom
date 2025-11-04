import React from 'react';

interface LuxPanelProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  side?: 'left' | 'right';
  className?: string;
}

export function LuxPanel({ 
  children, 
  isOpen, 
  onClose,
  title,
  subtitle,
  side = 'right',
  className = ''
}: LuxPanelProps) {
  const sideStyles = side === 'right' 
    ? `${isOpen ? 'right-10' : '-right-[400px]'}`
    : `${isOpen ? 'left-10' : '-left-[400px]'}`;
  
  return (
    <div 
      className={`fixed top-1/2 -translate-y-1/2 w-[380px] bg-charcoal/95 backdrop-blur-[30px] border border-gold-primary/20 rounded-[20px] p-10 transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] z-[500] ${sideStyles} ${className}`}
    >
      {(title || subtitle) && (
        <div className="border-b border-gold-primary/20 pb-5 mb-8">
          {title && (
            <h2 className="font-serif text-[28px] font-light text-gold-primary mb-2.5">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xs tracking-[0.15em] uppercase text-gold-light opacity-70">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className="space-y-6">
        {children}
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-gold-light hover:text-gold-primary transition-colors duration-300"
          aria-label="Close panel"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export function LuxPanelItem({ 
  label, 
  value 
}: { 
  label: string; 
  value: string | React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="text-[11px] tracking-[0.2em] uppercase text-gold-light opacity-60 mb-2">
        {label}
      </div>
      <div className="text-base text-pearl font-light">
        {value}
      </div>
    </div>
  );
}
