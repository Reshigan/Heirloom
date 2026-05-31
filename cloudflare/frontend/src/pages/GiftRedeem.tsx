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

const FEATURES = [
  'preserve threads with photographs, recordings & stories',
  'voice messages for those you love',
  'letters for future delivery',
  'posthumous delivery',
  'zero-knowledge encryption',
];

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
        setError(data.error || 'Invalid voucher code.');
      }
    } catch (err) {
      setError('Failed to validate voucher code.');
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
        setError(data.error || 'Failed to redeem voucher.');
      }
    } catch (err) {
      setError('Failed to redeem voucher.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const formatTier = (tier: string) => tier.charAt(0) + tier.slice(1).toLowerCase();

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
          <p className="loom-eyebrow" style={{ marginBottom: 14 }}>redeem your gift</p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 16px' }}
          >
            Begin your thread.
          </h1>
          <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', fontSize: 15, margin: 0, lineHeight: 1.7 }}>
            enter your gift code to activate your place on the family thread.
          </p>
        </header>

        <hr className="loom-hairline" style={{ marginBottom: 40 }} />

        {/* Success */}
        {redeemSuccess ? (
          <div style={{ textAlign: 'center', paddingTop: 16 }} role="status">
            <p className="loom-eyebrow" style={{ marginBottom: 20 }}>activated</p>
            <h2
              className="loom-h2"
              style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 16px' }}
            >
              Your thread is live.
            </h2>
            <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', fontSize: 15, margin: '0 0 40px', lineHeight: 1.7 }}>
              Your {formatTier(voucherInfo?.tier || '')} thread is now active.
              {voucherInfo?.durationMonths
                ? ` ${voucherInfo.durationMonths} month${voucherInfo.durationMonths > 1 ? 's' : ''} to fill it.`
                : ''}
            </p>
            <button onClick={() => navigate('/dashboard')} className="loom-btn">
              open the thread
            </button>
          </div>
        ) : (
          <>
            {/* Code Input */}
            <div style={{ marginBottom: 28 }}>
              <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
                voucher code
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="HRLM-XXXX-XXXX-XXXX"
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

            {/* Voucher Info */}
            {voucherInfo && (
              <div style={{ borderTop: '1px solid var(--loom-rule)', paddingTop: 32, marginBottom: 32 }}>
                <p className="loom-eyebrow" style={{ marginBottom: 16, color: 'var(--loom-warm)' }}>
                  valid gift
                </p>
                {voucherInfo.fromName && (
                  <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', marginBottom: 16 }}>
                    from <span style={{ color: 'var(--loom-bone)' }}>{voucherInfo.fromName}</span>
                  </p>
                )}
                {voucherInfo.recipientMessage && (
                  <div
                    style={{
                      borderLeft: '1px solid var(--loom-rule-warm)',
                      paddingLeft: 16,
                      marginBottom: 24,
                    }}
                  >
                    <p
                      className="loom-body"
                      style={{ fontStyle: 'italic', color: 'var(--loom-bone-dim)', fontSize: 14, lineHeight: 1.7, margin: 0 }}
                    >
                      &ldquo;{voucherInfo.recipientMessage}&rdquo;
                    </p>
                  </div>
                )}

                <div style={{ display: 'grid', gap: 0, marginBottom: 28 }}>
                  {[
                    { label: 'plan', value: formatTier(voucherInfo.tier) },
                    { label: 'duration', value: `${voucherInfo.durationMonths} month${voucherInfo.durationMonths > 1 ? 's' : ''}` },
                    { label: 'expires', value: new Date(voucherInfo.expiresAt).toLocaleDateString() },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: '1px solid var(--loom-rule)',
                      }}
                    >
                      <span className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}>
                        {label}
                      </span>
                      <span className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)' }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {isAuthenticated ? (
                  <button
                    onClick={handleRedeem}
                    disabled={isRedeeming}
                    className="loom-btn"
                    style={{ width: '100%', opacity: isRedeeming ? 0.5 : 1 }}
                  >
                    {isRedeeming ? 'activating…' : 'redeem gift'}
                  </button>
                ) : (
                  <div>
                    <p className="loom-body" style={{ textAlign: 'center', fontSize: 13, color: 'var(--loom-bone-faint)', marginBottom: 16 }}>
                      sign in or create an account to redeem
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Link
                        to={`/login?redirect=/gift/redeem?code=${code}`}
                        className="loom-btn-ghost"
                        style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                      >
                        sign in
                      </Link>
                      <Link
                        to={`/signup?redirect=/gift/redeem?code=${code}`}
                        className="loom-btn"
                        style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                      >
                        begin a thread
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Features (pre-validation) */}
            {!voucherInfo && (
              <div style={{ marginTop: 12 }}>
                <p className="loom-eyebrow" style={{ marginBottom: 16 }}>what you'll receive</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                  {FEATURES.map((f, i) => (
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
      </div>
    </div>
  );
}

export default GiftRedeem;
