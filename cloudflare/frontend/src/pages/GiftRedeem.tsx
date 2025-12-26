import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Gift, Check, ArrowLeft, Sparkles, AlertCircle } from '../components/Icons';
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-paper/50 hover:text-gold mb-8 transition-colors">
            <ArrowLeft size={18} />
            Back to Heirloom
          </Link>
          
          <div className="w-20 h-20 bg-gradient-to-br from-gold/30 to-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/30">
            <Gift className="w-10 h-10 text-gold" />
          </div>
          
          <h1 className="text-3xl font-light text-paper mb-2">
            Redeem Your <span className="text-gold">Gift</span>
          </h1>
          <p className="text-paper/60">
            Enter your gift voucher code to activate your Heirloom subscription
          </p>
        </div>

        {/* Success State */}
        {redeemSuccess ? (
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl text-paper mb-2">Gift Redeemed!</h2>
            <p className="text-paper/60 mb-6">
              Your {formatTier(voucherInfo?.tier || '')} subscription is now active.
              {voucherInfo?.durationMonths && ` Enjoy ${voucherInfo.durationMonths} month${voucherInfo.durationMonths > 1 ? 's' : ''} of Heirloom!`}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Code Input */}
            <div className="card mb-6">
              <label className="block text-paper/50 text-sm mb-2">Voucher Code</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-4 py-3 text-paper font-mono text-lg tracking-wider focus:border-gold/50 focus:outline-none"
                  placeholder="HRLM-XXXX-XXXX-XXXX"
                />
                <button
                  onClick={() => validateCode(code)}
                  disabled={isValidating || code.length < 10}
                  className="btn btn-secondary px-6"
                >
                  {isValidating ? 'Checking...' : 'Validate'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="card bg-red-500/10 border-red-500/30 mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Voucher Info */}
            {voucherInfo && (
              <div className="card mb-6">
                <div className="text-center mb-6">
                  <Sparkles className="w-8 h-8 text-gold mx-auto mb-3" />
                  <h3 className="text-xl text-paper mb-1">Valid Gift Voucher!</h3>
                  {voucherInfo.fromName && (
                    <p className="text-paper/60">
                      From: <span className="text-gold">{voucherInfo.fromName}</span>
                    </p>
                  )}
                </div>

                {/* Personal Message */}
                {voucherInfo.recipientMessage && (
                  <div className="bg-white/5 border-l-2 border-gold p-4 mb-6 italic text-paper/80">
                    "{voucherInfo.recipientMessage}"
                  </div>
                )}

                {/* Gift Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-paper/50">Plan</span>
                    <span className="text-gold font-medium">{formatTier(voucherInfo.tier)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-paper/50">Duration</span>
                    <span className="text-paper">{voucherInfo.durationMonths} month{voucherInfo.durationMonths > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-paper/50">Expires</span>
                    <span className="text-paper/70">{new Date(voucherInfo.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Redeem Button */}
                {isAuthenticated ? (
                  <button
                    onClick={handleRedeem}
                    disabled={isRedeeming}
                    className="w-full btn btn-primary py-3 text-lg flex items-center justify-center gap-2"
                  >
                    {isRedeeming ? (
                      'Redeeming...'
                    ) : (
                      <>
                        <Gift size={20} />
                        Redeem Gift
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-paper/60 text-sm">
                      Sign in or create an account to redeem your gift
                    </p>
                    <div className="flex gap-3">
                      <Link
                        to={`/login?redirect=/gift/redeem?code=${code}`}
                        className="flex-1 btn btn-secondary text-center"
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
              <div className="card">
                <h3 className="text-sm text-paper/50 mb-3">What you'll get:</h3>
                <ul className="space-y-2 text-sm">
                  {[
                    'Preserve memories with photos, videos & stories',
                    'Record voice messages for loved ones',
                    'Write letters for future delivery',
                    'Set up posthumous delivery',
                    'Military-grade encryption',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-paper/70">
                      <Sparkles className="w-4 h-4 text-gold" />
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
