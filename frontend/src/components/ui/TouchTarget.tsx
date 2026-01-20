/**
 * TouchTarget Component
 * Wrapper ensuring minimum 44x44px touch target size for accessibility
 */

import React from 'react';

interface TouchTargetProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const TouchTarget: React.FC<TouchTargetProps> = ({
  children,
  className = '',
  as: Component = 'div',
}) => {
  return (
    <Component
      className={`relative min-h-[44px] min-w-[44px] flex items-center justify-center ${className}`}
    >
      {children}
    </Component>
  );
};

/**
 * TouchTargetButton - Button with guaranteed minimum touch target
 */
interface TouchTargetButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const TouchTargetButton: React.FC<TouchTargetButtonProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`relative min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * TouchTargetLink - Link with guaranteed minimum touch target
 */
interface TouchTargetLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
}

export const TouchTargetLink: React.FC<TouchTargetLinkProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <a
      className={`relative min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation ${className}`}
      {...props}
    >
      {children}
    </a>
  );
};

export default TouchTarget;
