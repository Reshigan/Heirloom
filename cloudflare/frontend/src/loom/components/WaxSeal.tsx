import { useId } from 'react';

/**
 * The matte oxblood wax seal with an embossed infinity mark — the mark of a
 * sealed / time-locked heirloom. Ported from NewUI/heirloom-dyebath. Colours
 * resolve from the --wax / --wax-hi / --wax-deep tokens (globals.css, .loom
 * scope), so it sits correctly in both themes.
 */
export default function WaxSeal({ size = 48 }: { size?: number }) {
  const raw = useId();
  const id = 'w' + raw.replace(/[:]/g, '');
  const blob =
    'M50 6 C66 4 78 12 86 26 C94 40 96 54 90 68 C84 82 70 94 50 94 C32 95 18 86 11 70 C4 55 5 39 14 26 C22 14 34 8 50 6 Z';
  const loop =
    'M-19 0 C-19 -10 -7 -10 0 0 C7 10 19 10 19 0 C19 -10 7 -10 0 0 C-7 10 -19 10 -19 0 Z';
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}b`} cx="41%" cy="35%" r="78%">
          <stop offset="0" stopColor="var(--wax)" />
          <stop offset="0.68" stopColor="var(--wax)" />
          <stop offset="1" stopColor="var(--wax-deep)" />
        </radialGradient>
        <radialGradient id={`${id}p`} cx="52%" cy="64%" r="60%">
          <stop offset="0.45" stopColor="var(--wax-deep)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--wax-deep)" stopOpacity="0.5" />
        </radialGradient>
        <radialGradient id={`${id}s`} cx="37%" cy="29%" r="26%">
          <stop offset="0" stopColor="var(--wax-hi)" stopOpacity="0.26" />
          <stop offset="1" stopColor="var(--wax-hi)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={blob} fill={`url(#${id}b)`} stroke="var(--wax-deep)" strokeWidth="1.1" />
      <path d={blob} fill={`url(#${id}p)`} />
      <path d={blob} fill={`url(#${id}s)`} />
      <path
        d="M33 21 C25 25 19 33 18 43"
        stroke="var(--wax-hi)"
        strokeWidth="1.6"
        fill="none"
        opacity="0.32"
        strokeLinecap="round"
      />
      <g transform="translate(50 52)">
        <path d={loop} transform="translate(0 1.3)" fill="none" stroke="var(--wax-hi)" strokeWidth="3" opacity="0.35" />
        <path d={loop} fill="none" stroke="var(--wax-deep)" strokeWidth="3" opacity="0.9" />
      </g>
    </svg>
  );
}
