import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';

interface GoldLegacyVoucherInfo {
  code: string;
  tier: string;
  billingCycle: string;
  durationMonths: string | number;
  recipientName?: string;
  recipientMessage?: string;
  fromName?: string;
  expiresAt: string;
  isGoldLegacy: boolean;
  memberNumber?: string;
}

export function GoldLegacyRedeem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const [code, setCode] = useState(searchParams.get('code') || '');
  const [voucherInfo, setVoucherInfo] = useState<GoldLegacyVoucherInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [memberNumber, setMemberNumber] = useState<string | null>(null);

  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setCode(codeFromUrl);
      validateCode(codeFromUrl);
    }
  }, [searchParams]);

  const validateCode = async (voucherCode: string) => {
    if (!voucherCode || voucherCode.length < 10) return;

    setIsValidating(true);
    setError(null);
    setVoucherInfo(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/validate/${voucherCode.toUpperCase()}`);
      const data = await res.json();

      if (data.valid) {
        if (!data.voucher.isGoldLegacy) {
          setError('This is not a Gold Legacy voucher. Please use the regular gift redemption page.');
          return;
        }
        setVoucherInfo(data.voucher);
        setMemberNumber(data.voucher.memberNumber);
      } else {
        setError(data.error || 'Invalid voucher code');
      }
    } catch (error) {
      console.error('Voucher validation error:', error);
      setError('Failed to validate voucher code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRedeem = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/gold/redeem?code=${code}`);
      return;
    }

    setIsRedeeming(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      const data = await res.json();

      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['limits'] });
        setRedeemSuccess(true);
        if (data.subscription?.memberNumber) {
          setMemberNumber(data.subscription.memberNumber);
        }
      } else {
        setError(data.error || 'Failed to redeem voucher');
      }
    } catch (error) {
      console.error('Voucher redemption error:', error);
      setError('Failed to redeem voucher');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <main className="min-h-screen bg-void text-paper antialiased">
      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-paper-50 hover:text-gold transition-colors text-sm mb-12">
            <span aria-hidden>←</span> Back to Heirloom
          </Link>

          <p className="font-body text-5xl text-gold leading-none mb-6" aria-hidden>∞</p>

          <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-3">
            Exclusive lifetime membership
          </p>
          <h1
            className="font-body font-light tracking-[-0.018em]"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
          >
            Gold Legacy
          </h1>
        </div>

        {/* Success State */}
        {redeemSuccess ? (
          <div className="text-center py-12 px-8 bg-void-surface border border-gold-40 rounded-[2px]">
            <p className="font-body text-4xl text-gold mb-6" aria-hidden>∞</p>

            <h2 className="font-body font-light text-2xl mb-2 tracking-[-0.012em]">Welcome to Gold Legacy</h2>
            <p className="text-paper-70 mb-8 leading-relaxed">Your lifetime membership is now active.</p>

            {memberNumber && (
              <div className="inline-block px-6 py-3 mb-8 border border-paper-15 rounded-[2px]">
                <p className="text-paper-50 text-[0.65rem] tracking-[0.28em] uppercase mb-1">Member number</p>
                <p className="font-mono text-xl text-gold">{memberNumber}</p>
              </div>
            )}

            <div className="space-y-3 text-left max-w-sm mx-auto mb-10">
              <p className="text-paper-50 text-[0.65rem] tracking-[0.28em] uppercase text-center mb-4">Your Gold Legacy benefits</p>
              {[
                'Lifetime access to all features',
                'Unlimited memory storage',
                'Priority support',
                'Exclusive Gold Legacy badge',
                'Early access to new features',
              ].map((benefit, i) => (
                <div key={i} className="flex items-baseline gap-3">
                  <span className="text-gold font-mono text-sm" aria-hidden>·</span>
                  <span className="text-paper-70 text-sm leading-relaxed">{benefit}</span>
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
              Start your legacy <span aria-hidden>→</span>
            </button>
          </div>
        ) : (
          <>
            {/* Code Input */}
            <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6 mb-6">
              <label htmlFor="gold-code" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">
                Invitation Code
              </label>
              <div className="flex gap-3">
                <input
                  id="gold-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper font-mono text-lg tracking-wider px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                  placeholder="GOLD-XXXX-XXXX-XXXX"
                />
                <button
                  onClick={() => validateCode(code)}
                  disabled={isValidating || code.length < 10}
                  className="btn btn-ghost"
                >
                  {isValidating ? 'Validating…' : 'Validate'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-void-surface border border-paper-15 rounded-[2px] p-4 mb-6" role="alert">
                <p className="text-blood text-sm">{error}</p>
              </div>
            )}

            {/* Voucher Info — Certificate */}
            {voucherInfo && (
              <div className="bg-void-surface border border-gold-40 rounded-[2px] overflow-hidden mb-6">
                {/* Certificate Header */}
                <div className="text-center py-6 px-6 border-b border-paper-15">
                  <p className="font-mono text-[0.65rem] tracking-[0.28em] uppercase text-paper-50 mb-2">
                    Certificate of membership
                  </p>
                  <h3 className="font-body font-light text-xl text-gold tracking-[-0.012em]">Gold Legacy Circle</h3>
                  {memberNumber && (
                    <p className="text-paper-50 text-sm mt-2 font-mono">Member #{memberNumber}</p>
                  )}
                </div>

                {/* Personal Message */}
                {voucherInfo.recipientMessage && (
                  <div className="p-6 border-b border-paper-15">
                    <p className="font-mono text-[0.65rem] tracking-[0.28em] uppercase text-paper-50 mb-3">
                      A note from Heirloom
                    </p>
                    <div className="pl-4 border-l border-gold-40">
                      <p className="text-paper-70 text-sm leading-[1.7] whitespace-pre-line font-body italic">
                        {voucherInfo.recipientMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Benefits */}
                <div className="p-6 border-b border-paper-15">
                  <p className="font-mono text-[0.65rem] tracking-[0.28em] uppercase text-paper-50 mb-4">
                    Your lifetime benefits
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'Lifetime Access',
                      'Unlimited Storage',
                      'Priority Support',
                      'Gold Badge',
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-baseline gap-2">
                        <span className="text-gold font-mono text-sm" aria-hidden>·</span>
                        <span className="text-paper-70 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accept Button */}
                <div className="p-6">
                  {isAuthenticated ? (
                    <button
                      onClick={handleRedeem}
                      disabled={isRedeeming}
                      className="btn btn-primary w-full"
                    >
                      {isRedeeming ? (
                        'Activating membership…'
                      ) : (
                        <>
                          <span aria-hidden>∞</span>
                          Accept invitation
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-center text-paper-70 text-sm">
                        Sign in or create an account to accept your invitation
                      </p>
                      <div className="flex gap-3">
                        <Link
                          to={`/login?redirect=/gold/redeem?code=${code}`}
                          className="btn btn-ghost flex-1 justify-center"
                        >
                          Sign In
                        </Link>
                        <Link
                          to={`/signup?redirect=/gold/redeem?code=${code}`}
                          className="btn btn-primary flex-1 justify-center"
                        >
                          Create Account
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info when no voucher validated */}
            {!voucherInfo && !error && (
              <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6">
                <p className="text-center text-paper-50 text-[0.65rem] tracking-[0.28em] uppercase mb-5">
                  Gold Legacy membership grants you
                </p>
                <div className="space-y-3">
                  {[
                    'Lifetime access to all Heirloom features',
                    'Unlimited memory and recording storage',
                    'Priority customer support',
                    'Exclusive Gold Legacy member badge',
                    'Early access to new features',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-baseline gap-3">
                      <span className="text-gold font-mono text-sm" aria-hidden>·</span>
                      <span className="text-paper-70 text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="font-mono text-[0.65rem] tracking-[0.28em] uppercase text-paper-30">
            Heirloom — your memories, forever
          </p>
        </div>
      </div>
    </main>
  );
}

export default GoldLegacyRedeem;
