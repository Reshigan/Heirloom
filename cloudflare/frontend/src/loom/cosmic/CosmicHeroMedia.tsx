import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

/**
 * CosmicHeroMedia — the looping cosmic-loom video for hero surfaces, with a
 * still poster fallback. Muted + playsinline + loop; honours
 * prefers-reduced-motion (and any decode failure) by showing the static
 * Higgsfield hero plate instead. Sits behind hero copy at low presence so
 * type stays the hero (§1).
 */
export function CosmicHeroMedia({
  poster = '/og/cosmic-hero.png',
  src = '/video/cosmic-loom-hero.mp4',
  className = '',
  style,
}: {
  poster?: string;
  src?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const ok = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setMotion(ok);
  }, []);

  const common: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    ...style,
  };

  if (!motion) {
    return <img aria-hidden src={poster} alt="" className={className} style={common} />;
  }
  return (
    <video
      aria-hidden
      className={className}
      style={common}
      poster={poster}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}
