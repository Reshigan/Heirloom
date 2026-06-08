import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { emailVerificationApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

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

    const verifyEmail = async () => {
      try {
        const response = await emailVerificationApi.verifyEmail(token);
        if (response.data.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(response.data.error || 'Verification failed.');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed. The link may have expired.');
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendVerification = async () => {
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
      topbarLeft={<HLogo />}
      topbarCenter="verify email"
    >
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 'clamp(24px,5vw,48px)', textAlign: 'center' }}>

        {/* ── Pending ── */}
        {status === 'loading' && (
          <div role="status">
            <div
              className="hl-serif"
              style={{
                fontSize: 56,
                fontWeight: 300,
                color: 'var(--warm)',
                lineHeight: 1,
                marginBottom: 18,
              }}
            >
              ∞
            </div>
            <p
              className="hl-mono"
              style={{
                fontSize: 11,
                color: 'var(--bone-faint)',
                margin: 0,
                letterSpacing: '0.08em',
              }}
            >
              Verifying…
            </p>
          </div>
        )}

        {/* ── Success ── */}
        {status === 'success' && (
          <div role="status">
            <div
              className="hl-serif"
              style={{
                fontSize: 56,
                fontWeight: 300,
                color: 'var(--warm)',
                lineHeight: 1,
                marginBottom: 18,
              }}
            >
              ∞
            </div>
            <h1
              className="hl-serif"
              style={{
                fontSize: 36,
                fontWeight: 300,
                color: 'var(--bone)',
                margin: '0 0 0',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              Your account is confirmed.
            </h1>
            <div style={{ marginTop: 24 }}>
              <Link
                to="/loom"
                className="hl-mono"
                style={{
                  color: 'var(--warm)',
                  textDecoration: 'none',
                  fontSize: 13,
                  letterSpacing: '0.08em',
                  borderBottom: '1px solid var(--warm)',
                  paddingBottom: 1,
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                begin your thread →
              </Link>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <div role="status">
            <p
              className="hl-serif hl-italic"
              style={{
                fontSize: 17,
                color: 'var(--bone-dim)',
                margin: '0 0 24px',
                lineHeight: 1.5,
              }}
            >
              Something went wrong.
            </p>
            <p
              className="hl-mono"
              style={{
                fontSize: 11,
                color: 'var(--bone-faint)',
                margin: '0 0 32px',
                letterSpacing: '0.06em',
                lineHeight: 1.7,
              }}
            >
              {message}
            </p>

            <div style={{ display: 'grid', gap: 16 }}>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="hl-mono"
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: isResending ? 'default' : 'pointer',
                  color: 'var(--warm)',
                  fontSize: 13,
                  letterSpacing: '0.08em',
                  borderBottom: '1px solid var(--warm)',
                  paddingBottom: 1,
                  display: 'inline-block',
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
                    letterSpacing: '0.06em',
                    margin: 0,
                  }}
                >
                  ∞ &nbsp; verification email sent.
                </p>
              )}
              {resendStatus === 'error' && (
                <p
                  role="alert"
                  className="hl-serif hl-italic"
                  style={{ fontSize: 14, color: 'var(--bone-dim)', margin: 0 }}
                >
                  Failed to send email. Please try again.
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
                  marginTop: 8,
                  display: 'inline-block',
                }}
              >
                ← back to sign in
              </Link>
            </div>
          </div>
        )}

        {/* ── No token ── */}
        {status === 'no-token' && (
          <div role="status">
            <div
              className="hl-serif"
              style={{
                fontSize: 56,
                fontWeight: 300,
                color: 'var(--warm)',
                lineHeight: 1,
                marginBottom: 18,
              }}
            >
              ∞
            </div>
            <h1
              className="hl-serif"
              style={{
                fontSize: 36,
                fontWeight: 300,
                color: 'var(--bone)',
                margin: '0 0 20px',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              Verify your email.
            </h1>
            <p
              className="hl-mono"
              style={{
                fontSize: 11,
                color: 'var(--bone-faint)',
                margin: '0 0 32px',
                letterSpacing: '0.06em',
                lineHeight: 1.7,
              }}
            >
              Check your inbox for a verification link, or request a new one below.
            </p>

            <div style={{ display: 'grid', gap: 16 }}>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="hl-mono"
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: isResending ? 'default' : 'pointer',
                  color: 'var(--warm)',
                  fontSize: 13,
                  letterSpacing: '0.08em',
                  borderBottom: '1px solid var(--warm)',
                  paddingBottom: 1,
                  display: 'inline-block',
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
                    letterSpacing: '0.06em',
                    margin: 0,
                  }}
                >
                  ∞ &nbsp; verification email sent.
                </p>
              )}
              {resendStatus === 'error' && (
                <p
                  role="alert"
                  className="hl-serif hl-italic"
                  style={{ fontSize: 14, color: 'var(--bone-dim)', margin: 0 }}
                >
                  Failed to send email. Please log in first.
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
                  marginTop: 8,
                  display: 'inline-block',
                }}
              >
                ← back to sign in
              </Link>
            </div>
          </div>
        )}

        {/* Footer mark */}
        <div
          className="hl-mono"
          style={{
            marginTop: 72,
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}
        >
          ∞ &nbsp; encrypted in browser · since 2026
        </div>
      </div>
    </ClothShell>
  );
}
