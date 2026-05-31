import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { emailVerificationApi } from '../services/api';
import { ProgressHair } from '../components/ui/ProgressHair';

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
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateRows: '68px 1fr' }}>
      <header
        style={{
          borderBottom: '1px solid var(--loom-rule)',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Link to="/" className="loom-mark" style={{ textDecoration: 'none' }}>
          <span className="infmark">∞</span>heirloom
        </Link>
      </header>

      <main
        style={{
          display: 'grid',
          placeItems: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>

          {status === 'loading' && (
            <div role="status">
              <div className="loom-eyebrow" style={{ marginBottom: 24 }}>
                verify email
              </div>
              <h1
                className="loom-h2"
                style={{
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  margin: '0 0 32px',
                }}
              >
                Verifying…
              </h1>
              <ProgressHair label="confirming your thread…" width={240} />
            </div>
          )}

          {status === 'success' && (
            <div role="status">
              <div className="loom-eyebrow" style={{ marginBottom: 24 }}>
                verify email
              </div>
              <h1
                className="loom-h2"
                style={{
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  margin: '0 0 24px',
                }}
              >
                Email verified.
              </h1>
              <p
                className="loom-body"
                style={{ fontSize: 16, color: 'var(--loom-bone-dim)', lineHeight: 1.7, margin: '0 0 36px' }}
              >
                {message}
              </p>
              <Link to="/dashboard" className="loom-btn" style={{ textDecoration: 'none' }}>
                enter the tapestry
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div role="status">
              <div className="loom-eyebrow" style={{ marginBottom: 24 }}>
                verify email
              </div>
              <h1
                className="loom-h2"
                style={{
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  margin: '0 0 24px',
                }}
              >
                Verification failed.
              </h1>
              <p
                className="loom-body"
                style={{ fontSize: 16, color: 'var(--loom-bone-dim)', lineHeight: 1.7, margin: '0 0 32px' }}
              >
                {message}
              </p>

              <div style={{ display: 'grid', gap: 16 }}>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="loom-btn-ghost"
                  style={{ opacity: isResending ? 0.5 : 1 }}
                >
                  {isResending ? 'sending…' : 'resend verification email'}
                </button>

                {resendStatus === 'success' && (
                  <p
                    role="status"
                    className="loom-mono"
                    style={{ fontSize: 11, color: 'var(--loom-warm)', letterSpacing: '0.04em', margin: 0 }}
                  >
                    ∞ &nbsp; verification email sent.
                  </p>
                )}
                {resendStatus === 'error' && (
                  <p
                    role="alert"
                    className="loom-body"
                    style={{ fontStyle: 'italic', color: '#c25a5a', fontSize: 14, margin: 0 }}
                  >
                    Failed to send email. Please try again.
                  </p>
                )}

                <Link
                  to="/login"
                  className="loom-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--loom-bone-faint)',
                    textDecoration: 'none',
                    marginTop: 8,
                  }}
                >
                  ← back to sign in
                </Link>
              </div>
            </div>
          )}

          {status === 'no-token' && (
            <div role="status">
              <div className="loom-eyebrow" style={{ marginBottom: 24 }}>
                verify email
              </div>
              <h1
                className="loom-h2"
                style={{
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  margin: '0 0 24px',
                }}
              >
                Verify your email.
              </h1>
              <p
                className="loom-body"
                style={{ fontSize: 16, color: 'var(--loom-bone-dim)', lineHeight: 1.7, margin: '0 0 32px' }}
              >
                Check your inbox for a verification link, or request a new one below.
              </p>

              <div style={{ display: 'grid', gap: 16 }}>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="loom-btn"
                  style={{ opacity: isResending ? 0.5 : 1 }}
                >
                  {isResending ? 'sending…' : 'send verification email'}
                </button>

                {resendStatus === 'success' && (
                  <p
                    role="status"
                    className="loom-mono"
                    style={{ fontSize: 11, color: 'var(--loom-warm)', letterSpacing: '0.04em', margin: 0 }}
                  >
                    ∞ &nbsp; verification email sent.
                  </p>
                )}
                {resendStatus === 'error' && (
                  <p
                    role="alert"
                    className="loom-body"
                    style={{ fontStyle: 'italic', color: '#c25a5a', fontSize: 14, margin: 0 }}
                  >
                    Failed to send email. Please log in first.
                  </p>
                )}

                <Link
                  to="/login"
                  className="loom-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--loom-bone-faint)',
                    textDecoration: 'none',
                    marginTop: 8,
                  }}
                >
                  ← back to sign in
                </Link>
              </div>
            </div>
          )}

          <div
            className="loom-mono"
            style={{
              marginTop: 64,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
              textAlign: 'center',
            }}
          >
            ∞ &nbsp; encrypted in browser · since 2026
          </div>
        </div>
      </main>
    </div>
  );
}
