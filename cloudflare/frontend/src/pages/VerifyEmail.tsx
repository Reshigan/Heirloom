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
    <main className="min-h-screen bg-void text-paper antialiased px-6 md:px-12 py-12 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-block font-body text-3xl text-gold mb-10" aria-label="Heirloom home">
          ∞
        </Link>

        {status === 'loading' && (
          <div role="status">
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Verify email</p>
            <h1
              className="font-body font-light leading-[1.1] tracking-[-0.018em]"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
            >
              Verifying…
            </h1>
            <div className="mt-8">
              <ProgressHair label="verifying…" width={180} />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div role="status">
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Verify email</p>
            <h1
              className="font-body font-light leading-[1.1] tracking-[-0.018em]"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
            >
              Email verified.
            </h1>
            <p className="mt-6 text-paper-70 leading-relaxed font-light">{message}</p>
            <Link to="/dashboard" className="btn btn-primary mt-10">
              Go to dashboard <span aria-hidden>→</span>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div role="status">
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Verify email</p>
            <h1
              className="font-body font-light leading-[1.1] tracking-[-0.018em]"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
            >
              Verification failed.
            </h1>
            <p className="mt-6 text-paper-70 leading-relaxed font-light">{message}</p>

            <div className="mt-10 space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="btn btn-ghost w-full"
              >
                {isResending ? 'Sending…' : 'Resend verification email'}
              </button>

              {resendStatus === 'success' && (
                <p role="status" className="text-gold text-sm">Verification email sent.</p>
              )}
              {resendStatus === 'error' && (
                <p role="alert" className="text-blood text-sm">Failed to send email. Please try again.</p>
              )}

              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-paper-50 hover:text-gold transition-colors text-sm"
              >
                <span aria-hidden>←</span> Back to sign in
              </Link>
            </div>
          </div>
        )}

        {status === 'no-token' && (
          <div role="status">
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Verify email</p>
            <h1
              className="font-body font-light leading-[1.1] tracking-[-0.018em]"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
            >
              Verify your email.
            </h1>
            <p className="mt-6 text-paper-70 leading-relaxed font-light">
              Check your inbox for a verification link, or request a new one below.
            </p>

            <div className="mt-10 space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="btn btn-primary w-full"
              >
                {isResending ? 'Sending…' : 'Send verification email'}
              </button>

              {resendStatus === 'success' && (
                <p role="status" className="text-gold text-sm">Verification email sent.</p>
              )}
              {resendStatus === 'error' && (
                <p role="alert" className="text-blood text-sm">Failed to send email. Please log in first.</p>
              )}

              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-paper-50 hover:text-gold transition-colors text-sm"
              >
                <span aria-hidden>←</span> Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
