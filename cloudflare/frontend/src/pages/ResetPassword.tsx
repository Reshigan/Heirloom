import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({ token: token!, password });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
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

        {!token ? (
          <div role="status">
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Reset password</p>
            <h1
              className="font-body font-light leading-[1.1] tracking-[-0.018em]"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
            >
              Invalid reset link.
            </h1>
            <p className="mt-6 text-paper-70 leading-relaxed font-light">
              This password reset link is invalid or has expired.
            </p>
            <Link to="/forgot-password" className="btn btn-primary mt-10">
              Request new link
            </Link>
          </div>
        ) : success ? (
          <div role="status">
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Reset password</p>
            <h1
              className="font-body font-light leading-[1.1] tracking-[-0.018em]"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
            >
              Password reset.
            </h1>
            <p className="mt-6 text-paper-70 leading-relaxed font-light">
              Your password has been successfully reset. Redirecting you to sign in…
            </p>
            <Link to="/login" className="btn btn-primary mt-10">
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Reset password</p>
            <h1
              className="font-body font-light leading-[1.1] tracking-[-0.018em]"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
            >
              Reset your password.
            </h1>
            <p className="mt-6 text-paper-70 leading-relaxed font-light">
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit} className="mt-12 space-y-6" aria-label="Reset password form">
              <div>
                <label htmlFor="rp-password" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="rp-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 pr-20 rounded-[2px] placeholder:text-paper-30 transition-colors"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[0.7rem] tracking-[0.18em] uppercase text-paper-50 hover:text-gold transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-xs text-paper-50 mt-2 font-mono">Must be at least 8 characters</p>
              </div>

              <div>
                <label htmlFor="rp-confirm" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="rp-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 pr-20 rounded-[2px] placeholder:text-paper-30 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[0.7rem] tracking-[0.18em] uppercase text-paper-50 hover:text-gold transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error ? <p role="alert" className="text-blood text-sm">{error}</p> : null}

              <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                {isLoading ? 'Resetting…' : 'Reset password'}
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
