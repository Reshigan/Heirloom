import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail } from '../components/Icons';
import { emailVerificationApi } from '../services/api';

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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="absolute -inset-4 bg-gold/5 blur-3xl rounded-full" />
        
        <div className="card glass-strong relative text-center">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/[0.08] to-transparent rounded-t-2xl pointer-events-none" />
          
          <div className="relative">
            <Link to="/" className="inline-block mb-8">
              <motion.div
                className="text-5xl text-gold mb-2"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              >
                ∞
              </motion.div>
              <span className="text-lg tracking-[0.2em] text-paper/60">HEIRLOOM</span>
            </Link>

            {status === 'loading' && (
              <div className="py-8">
                <Loader2 size={48} className="animate-spin text-gold mx-auto mb-4" />
                <p className="text-paper/70">Verifying your email...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="py-8">
                <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                <h1 className="text-2xl font-light mb-2">Email Verified!</h1>
                <p className="text-paper/70 mb-6">{message}</p>
                <Link to="/dashboard" className="btn btn-primary">
                  Go to Dashboard
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="py-8">
                <XCircle size={48} className="text-blood mx-auto mb-4" />
                <h1 className="text-2xl font-light mb-2">Verification Failed</h1>
                <p className="text-paper/70 mb-6">{message}</p>
                
                <div className="space-y-4">
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="btn btn-secondary w-full"
                  >
                    {isResending ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Mail size={20} />
                        Resend Verification Email
                      </>
                    )}
                  </button>
                  
                  {resendStatus === 'success' && (
                    <p className="text-emerald-500 text-sm">Verification email sent!</p>
                  )}
                  {resendStatus === 'error' && (
                    <p className="text-blood text-sm">Failed to send email. Please try again.</p>
                  )}
                  
                  <Link to="/login" className="block text-gold hover:text-gold-bright transition-colors">
                    Back to Login
                  </Link>
                </div>
              </div>
            )}

            {status === 'no-token' && (
              <div className="py-8">
                <Mail size={48} className="text-paper/50 mx-auto mb-4" />
                <h1 className="text-2xl font-light mb-2">Verify Your Email</h1>
                <p className="text-paper/70 mb-6">
                  Check your inbox for a verification link, or request a new one below.
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="btn btn-primary w-full"
                  >
                    {isResending ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Mail size={20} />
                        Send Verification Email
                      </>
                    )}
                  </button>
                  
                  {resendStatus === 'success' && (
                    <p className="text-emerald-500 text-sm">Verification email sent!</p>
                  )}
                  {resendStatus === 'error' && (
                    <p className="text-blood text-sm">Failed to send email. Please log in first.</p>
                  )}
                  
                  <Link to="/login" className="block text-gold hover:text-gold-bright transition-colors">
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
