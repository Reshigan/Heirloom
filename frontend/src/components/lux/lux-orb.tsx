import React from 'react';
import Image from 'next/image';

interface LuxOrbProps {
  image?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function LuxOrb({ 
  image, 
  size = 'md',
  className = '',
  onClick,
  children
}: LuxOrbProps) {
  const sizeStyles = {
    sm: 'w-20 h-20',
    md: 'w-[120px] h-[120px]',
    lg: 'w-[200px] h-[200px]',
    xl: 'w-[280px] h-[280px]'
  };
  
  const baseStyles = 'rounded-full border border-gold-primary/30 overflow-hidden relative bg-charcoal transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]';
  const hoverStyles = 'hover:scale-110 hover:border-gold-primary hover:shadow-[0_20px_60px_rgba(212,175,55,0.3),inset_0_0_30px_rgba(212,175,55,0.2)] hover:z-10';
  const shadowStyles = 'shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(212,175,55,0.1)]';
  
  return (
    <div 
      className={`${baseStyles} ${sizeStyles[size]} ${shadowStyles} ${onClick ? `${hoverStyles} cursor-pointer` : ''} ${className}`}
      onClick={onClick}
    >
      {image ? (
        <>
          <Image 
            src={image} 
            alt="Memory" 
            fill
            className="object-cover opacity-90 transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(10,10,10,0.4)_100%)] pointer-events-none" />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
