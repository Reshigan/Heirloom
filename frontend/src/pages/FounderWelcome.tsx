import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/api';

interface PledgeStatus {
  ok: boolean;
  pledge_number?: number | null;
  status?: string;
  family_name?: string | null;
}

/**
 * /founder/welcome — landing after Stripe Checkout success.
 *
 * Stripe redirects with ?session_id=... — we poll the API briefly to
 * give the webhook time to mark PAID + assign the pledge number, then
 * surface the Founder number.
 */
export function FounderWelcome() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [status, setStatus] = useState<PledgeStatus | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus({ ok: false });
      return;
    }
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await api.get<PledgeStatus>('/founders/by-session', { params: { session_id: sessionId } });
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
    <main className="min-h-screen bg-void text-paper px-6 py-24 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-prose text-center"
      >
        <div className="seal mx-auto mb-12" aria-hidden>∞</div>

        {isPaid ? (
          <>
            <p className="eyebrow mb-4">
              Founder {padded ? ` · ${padded} of 100` : ''}
            </p>
            <h1 className="font-serif font-light text-display-md mb-6 leading-tight">
              Welcome.
            </h1>
            <p className="text-body-lg text-paper/70 leading-relaxed mb-10">
              {status?.family_name ? `The ${status.family_name} family is now ` : 'Your family is now '}
              part of the first hundred. Lifetime access. Your name will appear in the continuity record we file with the successor non-profit at incorporation.
            </p>
            <p className="text-paper/55 mb-12 leading-relaxed">
              We've sent you a welcome letter with the next steps and the date of your first quarterly Founder call.
            </p>
            <Link to="/threads" className="btn btn-primary text-base px-7 py-4">
              open your family's first thread <ArrowRight size={18} />
            </Link>
          </>
        ) : (
          <>
            <p className="eyebrow mb-4">Confirming your pledge</p>
            <h1 className="font-serif font-light text-display-sm mb-6 leading-tight">
              Just a moment.
            </h1>
            <p className="text-paper/65 leading-relaxed">
              Stripe has us. We're waiting for the confirmation to land — usually a few seconds. If this page hasn't updated in a minute, your card is fine; check your email for the receipt and we'll be in touch.
            </p>
            <Loader2 size={18} className="animate-spin text-paper/40 mx-auto mt-10" />
          </>
        )}
      </motion.div>
    </main>
  );
}
