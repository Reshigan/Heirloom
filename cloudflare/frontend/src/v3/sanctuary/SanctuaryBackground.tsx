import { useEffect } from 'react';
import './sanctuary.css';

/**
 * SanctuaryBackground — the atmosphere beneath every v3 surface.
 *
 * Four fixed layers, in z-order:
 *   1. paper colour (provided by the body via .sanctuary-paper)
 *   2. time-of-day warm wash  (.sanctuary-warm)
 *   3. lamplight drift        (.sanctuary-lamp — 32s ease-in-out)
 *   4. paper grain            (.sanctuary-grain — 90s linear drift)
 *   5. vignette               (.sanctuary-vignette)
 *
 * The warm wash colour and intensity comes from the actual local hour
 * via CSS custom properties set on :root once on mount and re-set every
 * minute. There's no realtime sun model — just a small look-up table
 * matched to daylight, dusk, and lamplight readings of the same paper.
 */

interface Warmth {
  warmRGB: string;          // e.g. "248, 226, 188"
  warmth: number;           // 0–1 opacity of the warm wash
  vignette: number;         // 0–1 corner darkness
}

function warmthForHour(h: number): Warmth {
  // Linear-ish phases. Numbers were tuned by eye against #F4EFE6 paper.
  if (h < 5)  return { warmRGB: '212, 158, 92',  warmth: 0.05, vignette: 0.22 }; // deep night, low amber
  if (h < 8)  return { warmRGB: '244, 198, 132', warmth: 0.07, vignette: 0.16 }; // first light
  if (h < 11) return { warmRGB: '250, 222, 168', warmth: 0.06, vignette: 0.10 }; // morning gold
  if (h < 16) return { warmRGB: '252, 240, 210', warmth: 0.03, vignette: 0.10 }; // midday
  if (h < 19) return { warmRGB: '244, 192, 130', warmth: 0.07, vignette: 0.14 }; // afternoon peach
  if (h < 22) return { warmRGB: '232, 168, 100', warmth: 0.09, vignette: 0.20 }; // dusk lamplight
  return         { warmRGB: '212, 158, 92',  warmth: 0.07, vignette: 0.24 };     // late evening
}

export function SanctuaryBackground() {
  useEffect(() => {
    const apply = () => {
      const w = warmthForHour(new Date().getHours());
      const root = document.documentElement;
      root.style.setProperty('--sanctuary-warm-color', w.warmRGB);
      root.style.setProperty('--sanctuary-warmth', String(w.warmth));
      root.style.setProperty('--sanctuary-vignette', String(w.vignette));
    };
    apply();
    // Re-evaluate every minute so the hour boundary actually crosses.
    const id = setInterval(apply, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Paper base — sits at the bottom of the stack; bone color */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#F4EFE6',
          zIndex: 0,
        }}
      />
      <div className="sanctuary-warm" aria-hidden />
      <div className="sanctuary-lamp" aria-hidden />
      <div className="sanctuary-grain" aria-hidden />
      <div className="sanctuary-vignette" aria-hidden />
    </>
  );
}
