import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { HLogo } from '../loom/components/HLogo';
import { TapestryEdge } from '../loom/components/Frame';
import { ClothShell } from '../loom/components/ClothShell';
import api from '../services/api';

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
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/validate/${voucherCode.toUpperCase()}`
      );
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
    } catch (err) {
      console.error('Voucher validation error:', err);
      setError('Failed to validate invitation code.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRedeem = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/gold/redeem?code=${code}`)}`);
      return;
    }
    setIsRedeeming(true);
    setError(null);
    try {
      // Use the axios api instance so the auth interceptor handles token
      // refresh automatically — raw fetch bypasses the 401→refresh→retry logic.
      const res = await api.post('/gift-vouchers/redeem', { code: code.toUpperCase() });
      const data = res.data;
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
    } catch (err) {
      console.error('Voucher redemption error:', err);
      setError('Failed to redeem invitation.');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <ClothShell topbarLeft={<HLogo />} topbarCenter="gold thread">
      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: '72px 24px 32px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>

          {redeemSuccess ? (
            /* ── Success state ── */
            <div role="status">
              {/* ∞ mark */}
              <div
                className="hl-serif"
                style={{
                  fontSize: 56,
                  fontWeight: 300,
                  color: 'var(--warm)',
                  marginBottom: 18,
                  lineHeight: 1,
                }}
              >
                ∞
              </div>

              <h1
                className="hl-serif hl-tight"
                style={{ fontSize: 40, fontWeight: 300, margin: '0 0 28px' }}
              >
                Your lifetime access.
              </h1>

              <p
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-dim)',
                  margin: '0 0 24px',
                }}
              >
                membership active
              </p>

              {memberNumber && (
                <div
                  style={{
                    display: 'inline-block',
                    borderTop: '1px solid var(--rule)',
                    borderBottom: '1px solid var(--rule)',
                    padding: '14px 32px',
                    marginBottom: 32,
                  }}
                >
                  <p
                    className="hl-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.32em',
                      textTransform: 'uppercase',
                      color: 'var(--bone-dim)',
                      margin: '0 0 6px',
                    }}
                  >
                    member number
                  </p>
                  <p
                    className="hl-mono"
                    style={{ fontSize: 18, letterSpacing: '0.14em', color: 'var(--warm)', margin: 0 }}
                  >
                    {memberNumber}
                  </p>
                </div>
              )}

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 32px',
                  display: 'grid',
                  gap: 10,
                  textAlign: 'left',
                }}
              >
                {BENEFITS.map((b, i) => (
                  <li
                    key={i}
                    className="hl-serif"
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 12,
                      fontSize: 14,
                      color: 'var(--bone-dim)',
                    }}
                  >
                    <span style={{ color: 'var(--warm)', flexShrink: 0 }}>·</span>
                    {b}
                  </li>
                ))}
              </ul>

              <button onClick={() => navigate('/loom')} className="hl-btn">
                open the thread →
              </button>
            </div>
          ) : (
            /* ── Entry state ── */
            <>
              {/* ∞ mark */}
              <div
                className="hl-serif"
                style={{
                  fontSize: 56,
                  fontWeight: 300,
                  color: 'var(--warm)',
                  marginBottom: 18,
                  lineHeight: 1,
                }}
              >
                ∞
              </div>

              <h1
                className="hl-serif hl-tight"
                style={{ fontSize: 40, fontWeight: 300, margin: '0 0 28px' }}
              >
                Your lifetime access.
              </h1>

              {/* Code input */}
              <input
                id="gold-code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                  setVoucherInfo(null);
                }}
                onBlur={() => validateCode(code)}
                placeholder="GOLD-XXXX-XXXX-XXXX"
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: '100%',
                  fontFamily: 'var(--mono)',
                  fontSize: 22,
                  color: 'var(--warm)',
                  letterSpacing: '0.14em',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--rule)',
                  borderRadius: 0,
                  textAlign: 'center',
                  padding: '8px 0',
                  marginBottom: 24,
                  caretColor: 'var(--warm)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* Error */}
              {error && (
                <p
                  role="alert"
                  className="hl-mono"
                  style={{ fontSize: 10, color: 'var(--danger)', margin: '0 0 16px', letterSpacing: '0.04em' }}
                >
                  {error}
                </p>
              )}

              {/* Voucher info — certificate strip */}
              {voucherInfo && (
                <div
                  style={{
                    border: '1px solid var(--rule)',
                    marginBottom: 24,
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '20px 24px',
                      borderBottom: '1px solid var(--rule)',
                    }}
                  >
                    <p
                      className="hl-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.32em',
                        textTransform: 'uppercase',
                        color: 'var(--bone-dim)',
                        margin: '0 0 8px',
                      }}
                    >
                      certificate of membership
                    </p>
                    <p
                      className="hl-serif hl-italic"
                      style={{ fontSize: 20, fontWeight: 300, color: 'var(--warm)', margin: '0 0 6px' }}
                    >
                      Gold Legacy Circle
                    </p>
                    {memberNumber && (
                      <p
                        className="hl-mono"
                        style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.1em', margin: 0 }}
                      >
                        member #{memberNumber}
                      </p>
                    )}
                  </div>

                  {voucherInfo.recipientMessage && (
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--rule)' }}>
                      <p
                        className="hl-mono"
                        style={{
                          fontSize: 9,
                          letterSpacing: '0.32em',
                          textTransform: 'uppercase',
                          color: 'var(--bone-dim)',
                          margin: '0 0 10px',
                        }}
                      >
                        a note
                      </p>
                      <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 16 }}>
                        <p
                          className="hl-serif hl-italic"
                          style={{ fontSize: 14, color: 'var(--bone-dim)', lineHeight: 1.7, margin: 0 }}
                        >
                          {voucherInfo.recipientMessage}
                        </p>
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--rule)' }}>
                    <p
                      className="hl-mono"
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.32em',
                        textTransform: 'uppercase',
                        color: 'var(--bone-dim)',
                        margin: '0 0 12px',
                      }}
                    >
                      lifetime benefits
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {['Lifetime Access', 'Unlimited Storage', 'Priority Support', 'Gold Designation'].map(
                        (b, i) => (
                          <div
                            key={i}
                            className="hl-serif"
                            style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13, color: 'var(--bone-dim)' }}
                          >
                            <span style={{ color: 'var(--warm)', flexShrink: 0 }}>·</span>
                            {b}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '16px 24px' }}>
                    {isAuthenticated ? (
                      <button
                        onClick={handleRedeem}
                        disabled={isRedeeming}
                        className="hl-btn"
                        style={{ width: '100%', opacity: isRedeeming ? 0.5 : 1 }}
                      >
                        {isRedeeming ? 'activating…' : 'activate →'}
                      </button>
                    ) : (
                      <div>
                        <p
                          className="hl-mono"
                          style={{
                            fontSize: 10,
                            letterSpacing: '0.04em',
                            color: 'var(--bone-faint)',
                            textAlign: 'center',
                            marginBottom: 16,
                          }}
                        >
                          sign in to accept your invitation
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <Link
                            to={`/login?redirect=${encodeURIComponent(`/gold/redeem?code=${code}`)}`}
                            style={{
                              flex: 1,
                              textAlign: 'center',
                              textDecoration: 'none',
                              fontFamily: 'var(--mono)',
                              fontSize: 11,
                              letterSpacing: '0.1em',
                              color: 'var(--bone-dim)',
                              border: '1px solid var(--rule)',
                              padding: '10px 0',
                              display: 'block',
                            }}
                          >
                            sign in
                          </Link>
                          <Link
                            to={`/signup?redirect=${encodeURIComponent(`/gold/redeem?code=${code}`)}`}
                            className="hl-btn"
                            style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'block' }}
                          >
                            begin a thread
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pre-validation: activate button or benefits list */}
              {!voucherInfo && !error && code.length >= 10 && (
                <button
                  onClick={() => validateCode(code)}
                  disabled={isValidating}
                  className="hl-btn"
                  style={{ opacity: isValidating ? 0.5 : 1 }}
                >
                  {isValidating ? 'checking…' : 'activate →'}
                </button>
              )}

              {!voucherInfo && !error && code.length < 10 && (
                <>
                  <button className="hl-btn" style={{ opacity: 0.35, pointerEvents: 'none' }}>
                    activate →
                  </button>

                  <div style={{ marginTop: 32 }}>
                    <p
                      className="hl-mono"
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.32em',
                        textTransform: 'uppercase',
                        color: 'var(--bone-dim)',
                        margin: '0 0 14px',
                      }}
                    >
                      gold legacy grants you
                    </p>
                    <ul
                      style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        display: 'grid',
                        gap: 10,
                        textAlign: 'left',
                      }}
                    >
                      {BENEFITS.map((f, i) => (
                        <li
                          key={i}
                          className="hl-serif"
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 12,
                            fontSize: 14,
                            color: 'var(--bone-dim)',
                          }}
                        >
                          <span style={{ color: 'var(--warm)', flexShrink: 0 }}>·</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <TapestryEdge />
    </ClothShell>
  );
}

export default GoldLegacyRedeem;
