/**
 * SkipToContent Component
 * Accessibility component for keyboard navigation
 * Allows users to skip directly to main content
 */

import React from 'react';

interface SkipToContentProps {
  targetId?: string;
  label?: string;
}

export const SkipToContent: React.FC<SkipToContentProps> = ({
  targetId = 'main-content',
  label = 'Skip to main content',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="skip-to-content"
      aria-label={label}
    >
      {label}
    </a>
  );
};

/**
 * MainContent Component
 * Wrapper for main content area with proper accessibility attributes
 */
interface MainContentProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export const MainContent: React.FC<MainContentProps> = ({
  children,
  id = 'main-content',
  className = '',
}) => {
  return (
    <main
      id={id}
      tabIndex={-1}
      className={`outline-none ${className}`}
      role="main"
      aria-label="Main content"
    >
      {children}
    </main>
  );
};

export default SkipToContent;
