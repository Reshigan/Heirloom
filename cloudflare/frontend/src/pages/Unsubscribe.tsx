import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { usePageMeta } from '../lib/usePageMeta';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api';

type Status = 'idle' | 'working' | 'done' | 'error';

/**
 * Public opt-out page. Email footers link here (`/unsubscribe`); marketing
 * campaigns add `?email=&tracking=`. When a recipient is identifiable from the
 * query we suppress immediately; otherwise we fall back to an email-entry form
 * so the link is never a dead end. Calls GET /api/marketing/unsubscribe, which
 * writes marketing_suppression + clears users.marketing_consent + email_preferences.
 */
export function Unsubscribe() {
  usePageMeta('Unsubscribe', 'Stop receiving emails from Heirloom.');
  const [params] = useSearchParams();
  const tracking = params.get('tracking') || '';
  const token = params.get('token') || '';
  const emailParam = params.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  const submit = async (addr: string, tok?: string) => {
    if (inFlight.current) return;
    setError('');
    if (!tok && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      setError('please enter a valid email address');
      return;
    }
    inFlight.current = true;
    setStatus('working');
    try {
      const qs = new URLSearchParams();
      if (tok) qs.set('token', tok);
      else qs.set('email', addr);
      if (tracking) qs.set('tracking', tracking);
      const res = await fetch(`${API_BASE}/marketing/unsubscribe?${qs.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setStatus('done');
      } else {
        setStatus('error');
        setError('Could not complete the request. Please try again.');
      }
    } catch {
      setStatus('error');
      setError('Could not complete the request. Please try again.');
    } finally {
      inFlight.current = false;
    }
  };

  // One-click path: a recipient identifiable from the link is suppressed on load.
  useEffect(() => {
    if (emailParam || token) void submit(emailParam, token || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 8,
    fontFamily: 'var(--mono)',
    fontSize: 10,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--bone-dim)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--rule)',
    borderRadius: 0,
    color: 'var(--bone)',
    caretColor: 'var(--warm)',
    fontFamily: 'var(--serif)',
    fontSize: 18,
    lineHeight: 1.7,
    padding: '12px 0',
    outline: 'none',
    boxSizing: 'border-box',
    display: 'block',
  };

  return (
    <ClothShell topbarLeft={<HLogo href="/" />} topbarCenter="unsubscribe">
      <div
        style={{
          maxWidth: 'var(--page-max-prose)',
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        {status === 'done' ? (
          /* ── Confirmed ── */
          <div role="status" style={{ paddingTop: 40 }}>
            <WaxSeal size={36} />
            <h1
              className="hl-serif hl-tight"
              style={{
                fontFamily: 'var(--serif-display)',
                fontSize: 'clamp(34px,7vw,58px)',
                fontWeight: 500,
                lineHeight: 1.04,
                color: 'var(--bone)',
                margin: '28px 0 20px',
              }}
            >
              You've been unsubscribed.
            </h1>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 17,
                color: 'var(--bone-dim)',
                margin: '0 0 40px',
                lineHeight: 1.7,
              }}
            >
              You will no longer receive marketing emails from Heirloom. Your thread, and the
              people you've woven into it, remain exactly as you left them.
            </p>
            <Link
              to="/"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                textDecoration: 'none',
              }}
            >
              Return home →
            </Link>
          </div>
        ) : (
          /* ── Idle / working / error ── */
          <>
            <CosmicHeader
              eyebrow="unsubscribe"
              title="Leaving the mailing list."
              sub="Confirm the address to stop receiving marketing emails."
            />

            {status === 'working' ? (
              <p
                role="status"
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: 17,
                  color: 'var(--bone-dim)',
                  marginTop: 32,
                }}
              >
                Removing you from the list…
              </p>
            ) : (
              <>
                <SectionLabel>Email address</SectionLabel>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit(email);
                  }}
                  aria-label="Unsubscribe form"
                  noValidate
                  style={{ marginTop: 8 }}
                >
                  <div style={{ marginBottom: 28 }}>
                    <label htmlFor="u-email" style={labelStyle}>
                      The address that received our emails
                    </label>
                    <input
                      id="u-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                      style={inputStyle}
                    />
                  </div>

                  {error ? (
                    <p
                      role="alert"
                      style={{
                        fontFamily: 'var(--mono)',
                        fontStyle: 'italic',
                        fontSize: 12,
                        letterSpacing: '0.08em',
                        color: 'var(--warm)',
                        margin: '0 0 20px',
                      }}
                    >
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '12px 0',
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'var(--warm)',
                      cursor: 'pointer',
                      minHeight: 44,
                      display: 'inline-flex',
                      alignItems: 'center',
                      transition: 'opacity 180ms var(--ease)',
                    }}
                  >
                    Unsubscribe →
                  </button>
                </form>
              </>
            )}

            <div style={{ marginTop: 72 }}>
              <WaxSeal size={28} />
            </div>
          </>
        )}
      </div>
    </ClothShell>
  );
}

export default Unsubscribe;
