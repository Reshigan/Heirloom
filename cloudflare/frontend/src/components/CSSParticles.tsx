import { useMemo } from 'react';

interface CSSParticlesProps {
  count?: number;
  className?: string;
}

export function CSSParticles({ count = 20, className = '' }: CSSParticlesProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 20}s`,
        animationDuration: `${15 + Math.random() * 15}s`,
        opacity: 0.2 + Math.random() * 0.4,
        size: 1 + Math.random() * 2,
      })),
    [count]
  );

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-gold animate-particle-ascend"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration,
            '--opacity': p.opacity,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
