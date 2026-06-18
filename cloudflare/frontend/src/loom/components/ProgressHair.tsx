/**
 * ProgressHair — the product's only loading affordance.
 *
 * STITCH_BRIEF §2.6 / §8.1: "No spinners. Ever." Loading is a 1px bone-on-ink
 * hairline with a single warm segment that sweeps left→right on the 1400ms loom
 * cadence. Use it anywhere a spinner or `Loader2` would have gone. Styling +
 * reduced-motion fallback live in styles/globals.css (`.progress-hair`).
 */
interface ProgressHairProps {
  /** Optional mono caption rendered above the hairline (e.g. "unlocking…"). */
  label?: string;
  /** Constrain the hairline width; defaults to filling its container. */
  width?: number | string;
  className?: string;
}

export function ProgressHair({ label, width, className }: ProgressHairProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading'}
      className={className}
      style={{ width: width ?? '100%', display: 'grid', gap: 10, justifyItems: 'start' }}
    >
      {label ? (
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            color: 'var(--bone-faint)',
          }}
        >
          {label}
        </span>
      ) : null}
      <div className="progress-hair" style={{ width: '100%' }} />
    </div>
  );
}

export default ProgressHair;
