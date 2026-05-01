import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { foundersApi, type FounderPledgeStatus } from '../../services/api';
import { Surface, Column } from '../components/Surface';
import { MarketingNav } from '../components/MarketingNav';
import { Eyebrow, Display, Body, Caption } from '../components/Type';

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
    <Surface>
      <MarketingNav />
      <Column width="header" className="py-32 md:py-40">
        {isPaid ? (
          <>
            <Eyebrow className="mb-7">Founder · {padded ? `${padded} of 100` : 'in record'}</Eyebrow>
            <Display size={2}>Welcome.</Display>
            <Body className="mt-9 max-w-[560px] text-char">
              {status?.family_name ? `The ${status.family_name} family is now ` : 'Your family is now '}
              part of the first hundred. Lifetime access. Your name will appear in the continuity
              record we file with the successor non-profit at incorporation.
            </Body>
            <Caption className="mt-7">
              We've sent a welcome letter with the next steps and the date of your first quarterly Founder call.
            </Caption>
            <div className="mt-12">
              <Link
                to="/v3/home"
                className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors"
              >
                Open your family's first thread →
              </Link>
            </div>
          </>
        ) : (
          <>
            <Eyebrow className="mb-7">Confirming your pledge</Eyebrow>
            <Display size={2}>Just a moment.</Display>
            <Body className="mt-9 max-w-[560px] text-char">
              Stripe has us. We're waiting for the confirmation to land — usually a few seconds. If
              this page hasn't updated in a minute, your card is fine; check your email for the
              receipt and we will be in touch.
            </Body>
          </>
        )}
      </Column>
    </Surface>
  );
}
