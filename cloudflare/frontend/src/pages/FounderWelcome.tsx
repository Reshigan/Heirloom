import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ProgressHair } from '../components/ui/ProgressHair';
import { foundersApi, type FounderPledgeStatus } from '../services/api';

/**
 * /founder/welcome — landing after Stripe Checkout success.
 *
 * Polls /api/founders/by-session every 2s until the webhook flips
 * the row to PAID, then surfaces the Founder number.
 */
export function FounderWelcome() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [status, setStatus] = useState<FounderPledgeStatus | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus({ ok: false });
      return;
    }
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await foundersApi.bySession(sessionId);
        if (cancelled) return;
        if (res.data.status === 'PAID' || res.data.status === 'ENGRAVED') {
          setStatus(res.data);
          return;
        }
      } catch {
        /* keep polling */
      }
      setTries((t) => t + 1);
    };
    tick();
    const interval = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId, tries]);

  const isPaid = status && (status.status === 'PAID' || status.status === 'ENGRAVED');
  const padded = status?.pledge_number ? String(status.pledge_number).padStart(3, '0') : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--loom-ink)',
        color: 'var(--loom-bone)',
        display: 'grid',
        placeItems: 'center',
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        <p
          className="loom-serif"
          style={{ fontSize: 48, color: 'var(--loom-warm)', margin: '0 0 40px', lineHeight: 1 }}
          aria-hidden
        >
          ∞
        </p>

        {isPaid ? (
          <>
            <p className="loom-eyebrow" style={{ marginBottom: 16 }}>
              Founder{padded ? ` · ${padded} of 100` : ''}
            </p>
            <h1
              className="loom-h2"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 24px' }}
            >
              Welcome.
            </h1>
            <p
              className="loom-body"
              style={{ fontSize: 18, color: 'var(--loom-bone-dim)', margin: '0 auto 18px', maxWidth: 460, lineHeight: 1.7 }}
            >
              {status?.family_name ? `The ${status.family_name} family is now ` : 'Your family is now '}
              part of the first hundred. Lifetime access. Your name will appear in the continuity record
              we file with the successor non-profit at incorporation.
            </p>
            <p
              className="loom-body"
              style={{ color: 'var(--loom-bone-faint)', margin: '0 auto 40px', maxWidth: 460, lineHeight: 1.7 }}
            >
              We've sent you a welcome letter with the next steps and the date of your first quarterly
              Founder call.
            </p>
            <Link to="/dashboard" className="loom-btn" style={{ textDecoration: 'none' }}>
              open your family's first thread
            </Link>
          </>
        ) : (
          <>
            <p className="loom-eyebrow" style={{ marginBottom: 16 }}>
              Confirming your pledge
            </p>
            <h1
              className="loom-h2"
              style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 20px' }}
            >
              Just a moment.
            </h1>
            <p
              className="loom-body"
              style={{ color: 'var(--loom-bone-dim)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}
            >
              Stripe has us. We're waiting for the confirmation to land — usually a few seconds. If this
              page hasn't updated in a minute, your card is fine; check your email for the receipt and
              we'll be in touch.
            </p>
            <ProgressHair label="confirming…" width={180} className="mx-auto" />
          </>
        )}
      </div>
    </div>
  );
}
