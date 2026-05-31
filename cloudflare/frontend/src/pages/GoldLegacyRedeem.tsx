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

const BENEFITS = [
  'lifetime access to every feature',
  'unlimited thread storage',
  'priority support',
  'gold legacy member designation',
  'early access to new features',
];

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
          setError('This is not a Gold Legacy invitation. Please use the regular gift redemption page.');
          return;
        }
        setVoucherInfo(data.voucher);
        setMemberNumber(data.voucher.memberNumber);
      } else {
        setError(data.error || 'Invalid invitation code.');
      }
    } catch (error) {
      console.error('Voucher validation error:', error);
      setError('Failed to validate invitation code.');
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
        setError(data.error || 'Failed to redeem invitation.');
      }
    } catch (error) {
      console.error('Voucher redemption error:', error);
      setError('Failed to redeem invitation.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const wrapStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--loom-ink)',
    color: 'var(--loom-bone)',
    padding: '48px 24px 96px',
  };

  return (
    <div style={wrapStyle}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Back */}
        <div style={{ marginBottom: 48 }}>
          <Link
            to="/"
            className="loom-mono"
            style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', textDecoration: 'none' }}
          >
            heirloom
          </Link>
        </div>

        {/* Header */}
        <header style={{ marginBottom: 48 }}>
          <p className="loom-eyebrow" style={{ marginBottom: 14, color: 'var(--loom-warm)' }}>
            exclusive lifetime membership
          </p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 16px' }}
          >
            Gold Legacy.
          </h1>
          <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', fontSize: 15, margin: 0, lineHeight: 1.7 }}>
            a permanent place on the thread, held for a lifetime.
          </p>
        </header>

        <hr className="loom-hairline" style={{ marginBottom: 40 }} />

        {/* Success */}
        {redeemSuccess ? (
          <div style={{ textAlign: 'center', paddingTop: 8 }} role="status">
            <p className="loom-eyebrow" style={{ marginBottom: 20, color: 'var(--loom-warm)' }}>
              membership active
            </p>
            <h2
              className="loom-h2"
              style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 16px' }}
            >
              Welcome to Gold Legacy.
            </h2>
            <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', fontSize: 15, margin: '0 0 32px', lineHeight: 1.7 }}>
              Your lifetime membership is now active.
            </p>

            {memberNumber && (
              <div
                style={{
                  display: 'inline-block',
                  borderTop: '1px solid var(--loom-rule)',
                  borderBottom: '1px solid var(--loom-rule)',
                  padding: '14px 32px',
                  marginBottom: 32,
                  textAlign: 'center',
                }}
              >
                <p className="loom-eyebrow" style={{ marginBottom: 6, fontSize: 9 }}>member number</p>
                <p className="loom-mono" style={{ fontSize: 18, letterSpacing: '0.1em', color: 'var(--loom-warm)', margin: 0 }}>
                  {memberNumber}
                </p>
              </div>
            )}

            <div style={{ marginBottom: 40, textAlign: 'left' }}>
              <p className="loom-eyebrow" style={{ marginBottom: 16, fontSize: 9 }}>your benefits</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                {BENEFITS.map((b, i) => (
                  <li
                    key={i}
                    className="loom-body"
                    style={{ display: 'flex', alignItems: 'baseline', gap: 12, fontSize: 14, color: 'var(--loom-bone-dim)' }}
                  >
                    <span style={{ color: 'var(--loom-warm)', flexShrink: 0 }}>·</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={() => navigate('/dashboard')} className="loom-btn">
              open the thread
            </button>
          </div>
        ) : (
          <>
            {/* Code Input */}
            <div style={{ marginBottom: 28 }}>
              <label
                htmlFor="gold-code"
                className="loom-eyebrow"
                style={{ display: 'block', marginBottom: 8, fontSize: 10 }}
              >
                invitation code
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  id="gold-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="GOLD-XXXX-XXXX-XXXX"
                  className="loom-mono"
                  style={{ flex: 1, fontSize: 16, letterSpacing: '0.08em' }}
                />
                <button
                  onClick={() => validateCode(code)}
                  disabled={isValidating || code.length < 10}
                  className="loom-btn-ghost"
                  style={{ opacity: (isValidating || code.length < 10) ? 0.5 : 1 }}
                >
                  {isValidating ? 'checking…' : 'validate'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="loom-body"
                style={{ fontStyle: 'italic', color: '#c25a5a', fontSize: 13, margin: '0 0 24px' }}
              >
                {error}
              </p>
            )}

            {/* Certificate */}
            {voucherInfo && (
              <div
                style={{
                  border: '1px solid var(--loom-rule-warm)',
                  marginBottom: 28,
                }}
              >
                {/* Certificate header */}
                <div
                  style={{
                    textAlign: 'center',
                    padding: '28px 24px',
                    borderBottom: '1px solid var(--loom-rule)',
                  }}
                >
                  <p className="loom-eyebrow" style={{ marginBottom: 8, fontSize: 9 }}>
                    certificate of membership
                  </p>
                  <p
                    className="loom-h2"
                    style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'var(--loom-warm)', margin: '0 0 8px' }}
                  >
                    Gold Legacy Circle
                  </p>
                  {memberNumber && (
                    <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', margin: 0 }}>
                      member #{memberNumber}
                    </p>
                  )}
                </div>

                {/* Personal message */}
                {voucherInfo.recipientMessage && (
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--loom-rule)' }}>
                    <p className="loom-eyebrow" style={{ marginBottom: 10, fontSize: 9 }}>a note</p>
                    <div style={{ borderLeft: '1px solid var(--loom-rule-warm)', paddingLeft: 16 }}>
                      <p
                        className="loom-body"
                        style={{ fontStyle: 'italic', color: 'var(--loom-bone-dim)', fontSize: 14, lineHeight: 1.7, margin: 0 }}
                      >
                        {voucherInfo.recipientMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Benefits grid */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--loom-rule)' }}>
                  <p className="loom-eyebrow" style={{ marginBottom: 16, fontSize: 9 }}>lifetime benefits</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {['Lifetime Access', 'Unlimited Storage', 'Priority Support', 'Gold Designation'].map((b, i) => (
                      <div
                        key={i}
                        className="loom-body"
                        style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13, color: 'var(--loom-bone-dim)' }}
                      >
                        <span style={{ color: 'var(--loom-warm)', flexShrink: 0 }}>·</span>
                        {b}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accept */}
                <div style={{ padding: '20px 24px' }}>
                  {isAuthenticated ? (
                    <button
                      onClick={handleRedeem}
                      disabled={isRedeeming}
                      className="loom-btn"
                      style={{ width: '100%', opacity: isRedeeming ? 0.5 : 1 }}
                    >
                      {isRedeeming ? 'activating membership…' : '∞  accept invitation'}
                    </button>
                  ) : (
                    <div>
                      <p className="loom-body" style={{ textAlign: 'center', fontSize: 13, color: 'var(--loom-bone-faint)', marginBottom: 16 }}>
                        sign in or create an account to accept your invitation
                      </p>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <Link
                          to={`/login?redirect=/gold/redeem?code=${code}`}
                          className="loom-btn-ghost"
                          style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                        >
                          sign in
                        </Link>
                        <Link
                          to={`/signup?redirect=/gold/redeem?code=${code}`}
                          className="loom-btn"
                          style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                        >
                          begin a thread
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pre-validation info */}
            {!voucherInfo && !error && (
              <div style={{ marginTop: 8 }}>
                <p className="loom-eyebrow" style={{ marginBottom: 16, fontSize: 9 }}>
                  gold legacy grants you
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                  {BENEFITS.map((f, i) => (
                    <li
                      key={i}
                      className="loom-body"
                      style={{ display: 'flex', alignItems: 'baseline', gap: 12, fontSize: 14, color: 'var(--loom-bone-dim)' }}
                    >
                      <span style={{ color: 'var(--loom-warm)', flexShrink: 0 }}>·</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 56 }}>
          <p
            className="loom-mono"
            style={{ fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}
          >
            heirloom · your memories, forever
          </p>
        </div>
      </div>
    </div>
  );
}

export default GoldLegacyRedeem;
