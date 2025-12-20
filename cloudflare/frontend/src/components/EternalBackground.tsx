/**
 * EternalBackground - The living, breathing void
 * A sacred background that creates an ethereal atmosphere
 */

import { useMemo } from 'react';

interface ParticleConfig {
  id: number;
  left: string;
  size: string;
  duration: string;
  delay: string;
  opacity: number;
}

export function EternalBackground() {
  // Generate random particles for the ascending memories effect
  const particles = useMemo<ParticleConfig[]>(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${1 + Math.random() * 2}px`,
      duration: `${15 + Math.random() * 20}s`,
      delay: `${Math.random() * 15}s`,
      opacity: 0.3 + Math.random() * 0.4,
    }));
  }, []);

  return (
    <div className="eternal-bg" aria-hidden="true">
      {/* The Aura - Sacred light from above */}
      <div className="eternal-aura" />
      
      {/* Constellation - Subtle star field */}
      <div className="eternal-stars" />
      
      {/* Mist - Ethereal atmosphere */}
      <div className="eternal-mist" />
      
      {/* Floating Particles - Ascending memories */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="eternal-particle"
          style={{
            left: particle.left,
            '--size': particle.size,
            '--dur': particle.duration,
            '--delay': particle.delay,
            '--opacity': particle.opacity,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default EternalBackground;
