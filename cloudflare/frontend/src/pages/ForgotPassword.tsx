import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-void text-paper antialiased px-6 md:px-12 py-12 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-block font-body text-3xl text-gold mb-10" aria-label="Heirloom home">
          ∞
        </Link>

        {success ? (
          <div role="status">
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Check your email</p>
            <h1
              className="font-body font-light leading-[1.1] tracking-[-0.018em]"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
            >
              On its way.
            </h1>
            <p className="mt-6 text-paper-70 leading-relaxed font-light">
              If an account exists with <span className="text-gold">{email}</span>, you'll receive a password reset link
              shortly.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-bright transition-colors mt-10"
            >
              <span aria-hidden>←</span> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Reset password</p>
            <h1
              className="font-body font-light leading-[1.1] tracking-[-0.018em]"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
            >
              Forgot your password?
            </h1>
            <p className="mt-6 text-paper-70 leading-relaxed font-light">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="mt-12 space-y-6" aria-label="Forgot password form">
              <div>
                <label htmlFor="fp-email" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">
                  Email
                </label>
                <input
                  id="fp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                  required
                />
              </div>

              {error ? <p role="alert" className="text-blood text-sm">{error}</p> : null}

              <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                {isLoading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-paper-50 hover:text-gold transition-colors text-sm mt-10"
            >
              <span aria-hidden>←</span> Back to sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
