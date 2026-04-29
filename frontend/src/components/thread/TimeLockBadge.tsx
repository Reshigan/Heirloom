import type { LockType } from '../../services/api';

const LABELS: Record<LockType, string> = {
  DATE: 'Sealed until a date',
  AGE: 'Sealed until a milestone age',
  AUTHOR_DEATH: 'Sealed until verified passing',
  RECIPIENT_EVENT: 'Sealed for a life event',
  GENERATION: 'Sealed for a future generation',
};

interface Props {
  lockType: LockType;
  detail?: string;
  pulse?: boolean;
}

/**
 * Inline mark for a time-locked entry. The seal is the canonical visual
 * primitive (defined in globals.css); this component just frames it with
 * the lock label + optional detail line.
 */
export function TimeLockBadge({ lockType, detail }: Props) {
  const label = LABELS[lockType];
  return (
    <span
      role="status"
      aria-label={`${label}${detail ? `: ${detail}` : ''}`}
      className="inline-flex items-baseline gap-3 text-paper/65 text-sm"
    >
      <span className="inline-flex items-center justify-center seal" style={{ width: 18, height: 18, fontSize: 10 }} aria-hidden>∞</span>
      <span>{label}</span>
      {detail ? <span className="text-paper/40">— {detail}</span> : null}
    </span>
  );
}
