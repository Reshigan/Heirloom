import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ArrowLeft, AlertCircle } from '../components/Icons';
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0a0a0f' }}>
      {/* Premium Gold Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ 
          background: 'radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.15) 0%, transparent 50%)',
        }} />
        <div className="absolute inset-0" style={{ 
          background: 'radial-gradient(ellipse at 50% 100%, rgba(212, 175, 55, 0.08) 0%, transparent 40%)',
        }} />
        {/* Subtle animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: 'rgba(212, 175, 55, 0.3)',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.3); }
          50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.5); }
        }
      `}</style>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-paper/50 hover:text-gold mb-8 transition-colors">
            <ArrowLeft size={18} />
            Back to Heirloom
          </Link>
          
          {/* Gold Infinity Logo */}
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ 
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.1) 100%)',
              border: '2px solid rgba(212, 175, 55, 0.5)',
              animation: 'pulse-gold 3s ease-in-out infinite',
            }}
          >
            <span className="text-5xl" style={{ color: '#D4AF37' }}>∞</span>
          </div>
          
          <h1 className="text-3xl font-light mb-2" style={{ color: '#D4AF37', letterSpacing: '0.1em' }}>
            GOLD LEGACY
          </h1>
          <p className="text-sm tracking-widest" style={{ color: 'rgba(212, 175, 55, 0.7)' }}>
            EXCLUSIVE LIFETIME MEMBERSHIP
          </p>
        </div>

        {/* Success State */}
        {redeemSuccess ? (
          <div className="text-center py-12 rounded-lg" style={{ 
            background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}>
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ 
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.4) 0%, rgba(212, 175, 55, 0.2) 100%)',
                border: '2px solid #D4AF37',
              }}
            >
              <span style={{ color: '#D4AF37' }}><Check className="w-12 h-12" /></span>
            </div>
            
            <h2 className="text-2xl mb-2" style={{ color: '#D4AF37' }}>Welcome to Gold Legacy</h2>
            <p className="text-paper/60 mb-6">Your lifetime membership is now active</p>
            
            {memberNumber && (
              <div className="inline-block px-6 py-3 rounded mb-6" style={{ 
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}>
                <p className="text-paper/50 text-xs tracking-widest mb-1">MEMBER NUMBER</p>
                <p className="font-mono text-xl" style={{ color: '#D4AF37' }}>{memberNumber}</p>
              </div>
            )}
            
            <div className="space-y-3 text-left max-w-sm mx-auto mb-8 px-4">
              <p className="text-paper/50 text-sm text-center mb-4">Your Gold Legacy benefits:</p>
              {[
                'Lifetime access to all features',
                'Unlimited memory storage',
                'Priority support',
                'Exclusive Gold Legacy badge',
                'Early access to new features',
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
                    <span style={{ color: '#D4AF37' }}><Check className="w-3 h-3" /></span>
                  </div>
                  <span className="text-paper/70 text-sm">{benefit}</span>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 rounded font-medium transition-all"
              style={{ 
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                color: '#0a0a0f',
              }}
            >
              Start Your Legacy
            </button>
          </div>
        ) : (
          <>
            {/* Code Input */}
            <div className="rounded-lg p-6 mb-6" style={{ 
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
            }}>
              <label className="block text-sm mb-2" style={{ color: 'rgba(212, 175, 55, 0.7)' }}>
                Invitation Code
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-white/5 rounded px-4 py-3 text-paper font-mono text-lg tracking-wider focus:outline-none"
                  style={{ border: '1px solid rgba(212, 175, 55, 0.3)' }}
                  placeholder="GOLD-XXXX-XXXX-XXXX"
                />
                <button
                  onClick={() => validateCode(code)}
                  disabled={isValidating || code.length < 10}
                  className="px-6 py-3 rounded transition-all"
                  style={{ 
                    background: 'rgba(212, 175, 55, 0.2)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: '#D4AF37',
                  }}
                >
                  {isValidating ? 'Validating...' : 'Validate'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg p-4 mb-6" style={{ 
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
              }}>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Voucher Info - Premium Certificate Style */}
            {voucherInfo && (
              <div className="rounded-lg overflow-hidden mb-6" style={{ 
                background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}>
                {/* Certificate Header */}
                <div className="text-center py-6" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <p className="text-xs tracking-widest mb-2" style={{ color: 'rgba(212, 175, 55, 0.6)' }}>
                    CERTIFICATE OF MEMBERSHIP
                  </p>
                  <h3 className="text-xl" style={{ color: '#D4AF37' }}>Gold Legacy Circle</h3>
                  {memberNumber && (
                    <p className="text-paper/50 text-sm mt-2">Member #{memberNumber}</p>
                  )}
                </div>

                {/* Personal Message */}
                {voucherInfo.recipientMessage && (
                  <div className="p-6" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
                    <p className="text-xs tracking-widest mb-3" style={{ color: 'rgba(212, 175, 55, 0.5)' }}>
                      A NOTE FROM HEIRLOOM
                    </p>
                    <div className="pl-4" style={{ borderLeft: '2px solid rgba(212, 175, 55, 0.3)' }}>
                      <p className="text-paper/80 text-sm leading-relaxed whitespace-pre-line italic">
                        {voucherInfo.recipientMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Benefits */}
                <div className="p-6" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
                  <p className="text-xs tracking-widest mb-4" style={{ color: 'rgba(212, 175, 55, 0.5)' }}>
                    YOUR LIFETIME BENEFITS
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'Lifetime Access',
                      'Unlimited Storage',
                      'Priority Support',
                      'Gold Badge',
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
                          <span style={{ color: '#D4AF37' }}><Check className="w-2.5 h-2.5" /></span>
                        </div>
                        <span className="text-paper/70 text-sm">{benefit}</span>
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
                      className="w-full py-4 rounded font-medium text-lg transition-all flex items-center justify-center gap-2"
                      style={{ 
                        background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                        color: '#0a0a0f',
                      }}
                    >
                      {isRedeeming ? (
                        'Activating Membership...'
                      ) : (
                        <>
                          <span className="text-xl">∞</span>
                          Accept Invitation
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-center text-paper/60 text-sm">
                        Sign in or create an account to accept your invitation
                      </p>
                      <div className="flex gap-3">
                        <Link
                          to={`/login?redirect=/gold/redeem?code=${code}`}
                          className="flex-1 py-3 rounded text-center transition-all"
                          style={{ 
                            background: 'rgba(212, 175, 55, 0.1)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            color: '#D4AF37',
                          }}
                        >
                          Sign In
                        </Link>
                        <Link
                          to={`/signup?redirect=/gold/redeem?code=${code}`}
                          className="flex-1 py-3 rounded text-center font-medium transition-all"
                          style={{ 
                            background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                            color: '#0a0a0f',
                          }}
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
              <div className="rounded-lg p-6" style={{ 
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(212, 175, 55, 0.1)',
              }}>
                <p className="text-center text-paper/50 text-sm mb-4">
                  Gold Legacy membership grants you:
                </p>
                <div className="space-y-3">
                  {[
                    'Lifetime access to all Heirloom features',
                    'Unlimited memory and recording storage',
                    'Priority customer support',
                    'Exclusive Gold Legacy member badge',
                    'Early access to new features',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.15)' }}>
                        <span style={{ color: '#D4AF37', fontSize: '10px' }}>∞</span>
                      </div>
                      <span className="text-paper/60 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs tracking-widest" style={{ color: 'rgba(212, 175, 55, 0.4)' }}>
            HEIRLOOM — YOUR MEMORIES, FOREVER
          </p>
        </div>
      </div>
    </div>
  );
}

export default GoldLegacyRedeem;
