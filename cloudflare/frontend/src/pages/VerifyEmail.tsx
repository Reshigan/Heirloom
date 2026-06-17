import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { emailVerificationApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';
import { ProgressHair } from '../loom/components/ProgressHair';
import { CosmicHeader, WaxSeal } from '../loom/cosmic/CosmicUI';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      setMessage('No verification token provided.');
      return;
    }

    const controller = new AbortController();

    const verifyEmail = async () => {
      try {
        const response = await emailVerificationApi.verifyEmail(token);
        if (controller.signal.aborted) return;
        if (response.data.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(response.data.error || 'Verification failed.');
        }
      } catch (error: any) {
        if (controller.signal.aborted) return;
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed. The link may have expired.');
      }
    };

    verifyEmail();
    return () => controller.abort();
  }, [token]);

  const handleResendVerification = async () => {
    if (!isAuthenticated) {
      setResendStatus('error');
      return;
    }
    setIsResending(true);
    setResendStatus('idle');
    try {
      await emailVerificationApi.resendVerification();
      setResendStatus('success');
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      setResendStatus('error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ClothShell
      topbarLeft={<HLogo href="/" />}
      topbarCenter="verify email"
    >
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >

        {/* ── Pending ── */}
        {status === 'loading' && (
          <div role="status" style={{ width: '100%' }}>
            <CosmicHeader
              align="center"
              eyebrow="verifying"
              title="Confirming your address."
              sub="One moment — checking your link."
            />
            <div style={{ maxWidth: 240, margin: '0 auto' }}>
              <ProgressHair label="verifying email address" />
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {status === 'success' && (
          <div role="status" style={{ width: '100%' }}>
            <CosmicHeader
              align="center"
              eyebrow="verified"
              title="Your account is confirmed."
              sub={message}
            />
            <div style={{ marginTop: 32 }}>
              <Link
                to="/loom"
                className="hl-mono"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 44,
                  color: 'var(--warm)',
                  textDecoration: 'none',
                  fontSize: 13,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid var(--warm)',
                  paddingBottom: 2,
                  transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                begin your thread →
              </Link>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <div role="status" style={{ width: '100%' }}>
            <CosmicHeader
              align="center"
              eyebrow="not verified"
              title="Something went wrong."
              sub={message}
            />

            <div style={{ display: 'grid', gap: 20, marginTop: 8 }}>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="hl-mono"
                style={{
                  background: 'transparent',
                  border: 0,
                  borderBottom: '1px solid var(--warm)',
                  paddingBottom: 2,
                  cursor: isResending ? 'default' : 'pointer',
                  color: 'var(--warm)',
                  fontSize: 13,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 44,
                  opacity: isResending ? 0.5 : 1,
                  transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={e => { if (!isResending) e.currentTarget.style.opacity = '0.7'; }}
                onMouseLeave={e => { if (!isResending) e.currentTarget.style.opacity = '1'; }}
              >
                {isResending ? 'sending…' : 'resend verification email →'}
              </button>

              {resendStatus === 'success' && (
                <p
                  role="status"
                  className="hl-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--warm)',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  ∞ &nbsp; verification email sent.
                </p>
              )}
              {resendStatus === 'error' && (
                <p
                  role="alert"
                  className="hl-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--warm)',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  Failed to send. Please try again.
                </p>
              )}

              <Link
                to="/login"
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 44,
                  justifyContent: 'center',
                }}
              >
                ← back to sign in
              </Link>
            </div>
          </div>
        )}

        {/* ── No token ── */}
        {status === 'no-token' && (
          <div role="status" style={{ width: '100%' }}>
            <CosmicHeader
              align="center"
              eyebrow="verify"
              title="Verify your email."
              sub="Check your inbox for a verification link, or request a new one below."
            />

            <div style={{ display: 'grid', gap: 20, marginTop: 8 }}>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="hl-mono"
                style={{
                  background: 'transparent',
                  border: 0,
                  borderBottom: '1px solid var(--warm)',
                  paddingBottom: 2,
                  cursor: isResending ? 'default' : 'pointer',
                  color: 'var(--warm)',
                  fontSize: 13,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 44,
                  opacity: isResending ? 0.5 : 1,
                  transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={e => { if (!isResending) e.currentTarget.style.opacity = '0.7'; }}
                onMouseLeave={e => { if (!isResending) e.currentTarget.style.opacity = '1'; }}
              >
                {isResending ? 'sending…' : 'send verification email →'}
              </button>

              {resendStatus === 'success' && (
                <p
                  role="status"
                  className="hl-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--warm)',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  ∞ &nbsp; verification email sent.
                </p>
              )}
              {resendStatus === 'error' && (
                <p
                  role="alert"
                  className="hl-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--warm)',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  Failed to send. Please log in first.
                </p>
              )}

              <Link
                to="/login"
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 44,
                  justifyContent: 'center',
                }}
              >
                ← back to sign in
              </Link>
            </div>
          </div>
        )}

        {/* Foot seal */}
        <div style={{ marginTop: 80 }}>
          <WaxSeal size={28} />
        </div>

      </div>
    </ClothShell>
  );
}
