import { Link } from 'react-router-dom';

/**
 * CapturePills — the co-equal Write / Speak capture affordance.
 * Write is the warm-outline pill (`hl-btn`); Speak is the ghost pill
 * (`hl-btn text`). Either can be a route (href) or a handler (onClick).
 * Reused anywhere capture is offered — home, empty states, entity pages.
 */
export interface CapturePillsProps {
  writeHref?: string;
  speakHref?: string;
  onWrite?: () => void;
  onSpeak?: () => void;
  writeLabel?: string;
  speakLabel?: string;
  className?: string;
}

export function CapturePills({
  writeHref = '/compose',
  speakHref = '/record',
  onWrite,
  onSpeak,
  writeLabel = 'write →',
  speakLabel = 'speak →',
  className,
}: CapturePillsProps) {
  return (
    <div
      className={className}
      style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
    >
      {onWrite ? (
        <button type="button" onClick={onWrite} className="hl-btn" style={{ fontSize: 13, padding: '11px 20px' }}>
          {writeLabel}
        </button>
      ) : (
        <Link to={writeHref} className="hl-btn" style={{ fontSize: 13, padding: '11px 20px' }}>
          {writeLabel}
        </Link>
      )}
      {onSpeak ? (
        <button type="button" onClick={onSpeak} className="hl-btn text" style={{ fontSize: 13 }}>
          {speakLabel}
        </button>
      ) : (
        <Link to={speakHref} className="hl-btn text" style={{ fontSize: 13 }}>
          {speakLabel}
        </Link>
      )}
    </div>
  );
}

export default CapturePills;
