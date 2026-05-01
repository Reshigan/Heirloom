import type { ReactNode } from 'react';
import { PageTransition } from '../sanctuary/PageTransition';
import '../sanctuary/sanctuary.css';

/**
 * v3 page wrapper.
 *
 * The atmosphere (AmbientField canvas, paper grain) is hoisted above
 * Surface — see RouteChrome in src/App.tsx — so it persists across
 * route changes instead of remounting per page. Surface itself is
 * transparent: the canvas IS the paper.
 *
 * Each Surface wraps its children in PageTransition so navigations
 * settle over 600ms.
 */
export function Surface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`sanctuary-surface relative min-h-screen text-ink font-news antialiased ${className}`}
      style={{ fontFeatureSettings: '"liga", "kern", "onum"', zIndex: 10 }}
    >
      <PageTransition>{children}</PageTransition>
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
