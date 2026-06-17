/**
 * RoomError — the in-voice read-error state for room pages.
 *
 * A failed read-path fetch must never collapse into the first-run empty state.
 * For an append-only permanence archive, telling a returning author "the cloth
 * has not yet been woven" is a trust-breaking lie. When a query errors, render
 * this instead: a quiet mono eyebrow, a serif-italic line in the family's voice,
 * and an inline warm "try again" text action — no spinner, no toast, no icon.
 */
interface RoomErrorProps {
  /** Re-run the failed query (e.g. the query's refetch). */
  onRetry?: () => void;
}

export function RoomError({ onRetry }: RoomErrorProps) {
  return (
    <div role="alert" style={{ padding: '24px 0' }}>
      <p
        className="hl-mono"
        style={{
          fontSize: 11,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
          margin: '0 0 12px',
        }}
      >
        the thread held
      </p>
      <p
        className="hl-serif"
        style={{
          fontStyle: 'italic',
          fontSize: 'clamp(18px, 3vw, 22px)',
          lineHeight: 1.6,
          color: 'var(--bone-dim)',
          margin: 0,
          maxWidth: '46ch',
        }}
      >
        the thread is here — it just could not be reached.
        {onRetry ? (
          <>
            {' '}
            <button
              type="button"
              onClick={onRetry}
              className="hl-mono"
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
              }}
            >
              try again →
            </button>
          </>
        ) : null}
      </p>
    </div>
  );
}

export default RoomError;
