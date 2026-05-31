import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';

interface VoucherInfo {
  code: string;
  tier: string;
  billingCycle: string;
  durationMonths: number;
  recipientName?: string;
  recipientMessage?: string;
  fromName?: string;
  expiresAt: string;
}

export function GiftRedeem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const [code, setCode] = useState(searchParams.get('code') || '');
  const [voucherInfo, setVoucherInfo] = useState<VoucherInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

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
        setVoucherInfo(data.voucher);
      } else {
        setError(data.error || 'Invalid voucher code');
      }
    } catch (err) {
      setError('Failed to validate voucher code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRedeem = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/gift/redeem?code=${code}`);
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
      } else {
        setError(data.error || 'Failed to redeem voucher');
      }
    } catch (err) {
      setError('Failed to redeem voucher');
    } finally {
      setIsRedeeming(false);
    }
  };

  const formatTier = (tier: string) => {
    return tier.charAt(0) + tier.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-screen bg-void text-paper antialiased">
      <div className="max-w-lg mx-auto px-6 md:px-12 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-paper-50 hover:text-gold mb-10 transition-colors text-sm">
            <span aria-hidden>←</span> Back to Heirloom
          </Link>

          <span className="font-body text-4xl text-gold block mb-6" aria-hidden>∞</span>

          <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Redeem your gift</p>
          <h1
            className="font-body font-light leading-[1.1] tracking-[-0.018em]"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Redeem your gift.
          </h1>
          <p className="mt-6 text-paper-70 leading-relaxed font-light">
            Enter your gift voucher code to activate your Heirloom subscription
          </p>
        </div>

        {/* Success State */}
        {redeemSuccess ? (
          <div className="bg-void-surface border border-gold-40 p-10 text-center" role="status">
            <span className="font-body text-4xl text-gold block mb-7" aria-hidden>∞</span>
            <h2 className="font-body text-2xl text-paper mb-2">Gift redeemed.</h2>
            <p className="text-paper-65 mb-8 leading-relaxed">
              Your {formatTier(voucherInfo?.tier || '')} subscription is now active.
              {voucherInfo?.durationMonths && ` Enjoy ${voucherInfo.durationMonths} month${voucherInfo.durationMonths > 1 ? 's' : ''} of Heirloom.`}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary"
            >
              Go to dashboard <span aria-hidden>→</span>
            </button>
          </div>
        ) : (
          <>
            {/* Code Input */}
            <div className="bg-void-surface border border-paper-15 p-6 mb-6">
              <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Voucher code</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper font-mono text-lg tracking-wider px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                  placeholder="HRLM-XXXX-XXXX-XXXX"
                />
                <button
                  onClick={() => validateCode(code)}
                  disabled={isValidating || code.length < 10}
                  className="btn btn-ghost px-6"
                >
                  {isValidating ? 'Checking…' : 'Validate'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-void-surface border border-blood/40 p-4 mb-6">
                <p role="alert" className="text-blood text-sm">{error}</p>
              </div>
            )}

            {/* Voucher Info */}
            {voucherInfo && (
              <div className="bg-void-surface border border-paper-15 p-6 mb-6">
                <div className="text-center mb-6">
                  <span className="font-body text-3xl text-gold block mb-3" aria-hidden>∞</span>
                  <h3 className="font-body text-xl text-paper mb-1">Valid gift voucher.</h3>
                  {voucherInfo.fromName && (
                    <p className="text-paper-70">
                      From: <span className="text-gold">{voucherInfo.fromName}</span>
                    </p>
                  )}
                </div>

                {/* Personal Message */}
                {voucherInfo.recipientMessage && (
                  <div className="bg-void border-l-2 border-gold p-4 mb-6 italic text-paper-70 font-body">
                    "{voucherInfo.recipientMessage}"
                  </div>
                )}

                {/* Gift Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between py-2 border-b border-paper-15">
                    <span className="text-paper-50">Plan</span>
                    <span className="text-gold">{formatTier(voucherInfo.tier)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-paper-15">
                    <span className="text-paper-50">Duration</span>
                    <span className="text-paper">{voucherInfo.durationMonths} month{voucherInfo.durationMonths > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-paper-15">
                    <span className="text-paper-50">Expires</span>
                    <span className="text-paper-70">{new Date(voucherInfo.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Redeem Button */}
                {isAuthenticated ? (
                  <button
                    onClick={handleRedeem}
                    disabled={isRedeeming}
                    className="btn btn-primary w-full"
                  >
                    {isRedeeming ? 'Redeeming…' : 'Redeem gift'}
                    {!isRedeeming ? <span aria-hidden>→</span> : null}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-paper-50 text-sm">
                      Sign in or create an account to redeem your gift
                    </p>
                    <div className="flex gap-3">
                      <Link
                        to={`/login?redirect=/gift/redeem?code=${code}`}
                        className="flex-1 btn btn-ghost text-center"
                      >
                        Sign In
                      </Link>
                      <Link
                        to={`/signup?redirect=/gift/redeem?code=${code}`}
                        className="flex-1 btn btn-primary text-center"
                      >
                        Create Account
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Features */}
            {!voucherInfo && (
              <div className="bg-void-surface border border-paper-15 p-6">
                <h3 className="text-sm text-paper-50 mb-3 uppercase tracking-[0.22em]">What you'll get</h3>
                <ul className="space-y-2 text-sm">
                  {[
                    'Preserve memories with photos, videos & stories',
                    'Record voice messages for loved ones',
                    'Write letters for future delivery',
                    'Set up posthumous delivery',
                    'Military-grade encryption',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-baseline gap-3 text-paper-70">
                      <span className="text-gold font-mono text-sm" aria-hidden>·</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default GiftRedeem;
