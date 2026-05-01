import type { ReactNode } from 'react';

/**
 * v3 page wrapper. Establishes the bone background, ink text color,
 * Newsreader as the default face, and a 24px (mobile) / 48px (desktop)
 * gutter. No decorative backgrounds — light comes from outside the page.
 */
export function Surface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`min-h-screen bg-bone text-ink font-news antialiased ${className}`}
      style={{ fontFeatureSettings: '"liga", "kern", "onum"' }}
    >
      {children}
    </div>
  );
}

/** Reading column. 640px for prose, 800px for prose-with-marginalia, 920px for headers. */
export function Column({
  children,
  width = 'reading',
  className = '',
}: {
  children: ReactNode;
  width?: 'reading' | 'wide' | 'header';
  className?: string;
}) {
  const max = width === 'reading' ? 'max-w-[640px]' : width === 'wide' ? 'max-w-[800px]' : 'max-w-[920px]';
  return <div className={`${max} mx-auto px-6 md:px-10 ${className}`}>{children}</div>;
}
