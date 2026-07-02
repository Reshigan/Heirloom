// useOpenWaterBloom — the public-page water: visibly moving, and filling with
// color from near-dark as if a family's memories were settling in while the
// visitor reads. Dyes are randomized per arrival, so no two visits share a
// palette. Energy returns to the resting pace on unmount.
import { useEffect } from 'react';
import { DYES } from '../dye';

export function useOpenWaterBloom(speed = 2) {
  useEffect(() => {
    const dyes = [...DYES].sort(() => Math.random() - 0.5).slice(0, 5 + Math.floor(Math.random() * 2));
    window.dispatchEvent(new CustomEvent('deep:bloom', { detail: { dyes } }));
    window.dispatchEvent(new CustomEvent('deep:energy', { detail: { speed } }));
    return () => { window.dispatchEvent(new CustomEvent('deep:energy', { detail: { speed: 1 } })); };
  }, [speed]);
}
