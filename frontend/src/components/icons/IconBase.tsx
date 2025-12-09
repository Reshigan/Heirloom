'use client';

import React, { useId } from 'react';

export interface IconBaseProps {
  size?: number;
  className?: string;
  title?: string;
  strokeWidth?: number;
  children: (gradientId: string) => React.ReactNode;
}

export const IconBase: React.FC<IconBaseProps> = ({
  size = 24,
  className = '',
  title,
  strokeWidth = 1.75,
  children,
}) => {
  const id = useId();
  const gradientId = `gold-gradient-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
      style={{ strokeWidth }}
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E9C86B" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8A6B1F" />
        </linearGradient>
        <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {children(gradientId)}
    </svg>
  );
};
