import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import api from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── GiftRedeem ────────────────────────────────────────────────────────────────
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
    if (!codeFromUrl) return;
    const controller = new AbortController();
    setCode(codeFromUrl);
    validateCode(codeFromUrl, controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  const validateCode = async (voucherCode: string, signal?: AbortSignal) => {
    if (!voucherCode || voucherCode.length < 10) return;
    setIsValidating(true);
    setError(null);
    setVoucherInfo(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/validate/${voucherCode.toUpperCase()}`,
        { signal },
      );
      const data = await res.json();
      if (!signal?.aborted) {
        if (data.valid) {
          setVoucherInfo(data.voucher);
        } else {
          setError(data.error || 'Invalid voucher code.');
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Failed to validate voucher code.');
      }
    } finally {
      if (!signal?.aborted) setIsValidating(false);
    }
  };

  const handleRedeem = async () => {
    if (!isAuthenticated) {
      const redirectPath = encodeURIComponent(`/gift/redeem?code=${code}`);
      navigate(`/login?redirect=${redirectPath}`);
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
      } else {
        setError(data.error || 'Failed to redeem voucher.');
      }
    } catch {
      setError('Failed to redeem voucher.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const formatTier = (tier: string) =>
    tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();

  return (
    <ClothShell topbarLeft={<HLogo />} topbarCenter="redeem">
      {/* centered content area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100% - 73px)',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 'var(--page-max-focus)', width: '100%' }}>

          {redeemSuccess ? (
            // ── Success state ──────────────────────────────────────────────
            <div role="status">
              <p
                className="hl-eyebrow dark"
                style={{ marginBottom: 20, textAlign: 'center' }}
              >
                activated
              </p>
              <h1
                className="hl-serif hl-tight"
                style={{
                  fontSize: 'var(--type-display)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  color: 'var(--bone)',
                  margin: '0 0 20px',
                  lineHeight: 1.06,
                }}
              >
                Your thread is live.
              </h1>
              <p
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 15,
                  color: 'var(--bone-dim)',
                  margin: '0 0 40px',
                  lineHeight: 1.7,
                  fontWeight: 300,
                }}
              >
                Your {formatTier(voucherInfo?.tier || '')} thread is now active.
                {voucherInfo?.durationMonths
                  ? ` ${voucherInfo.durationMonths} month${voucherInfo.durationMonths > 1 ? 's' : ''} to fill it.`
                  : ''}
              </p>
              <button
                onClick={() => navigate('/loom/today')}
                className="hl-btn"
                style={{ cursor: 'pointer' }}
              >
                open the thread
              </button>
            </div>
          ) : (
            // ── Redeem form ────────────────────────────────────────────────
            <>
              <h1
                className="hl-serif hl-tight"
                style={{
                  fontSize: 'var(--type-display)',
                  fontWeight: 300,
                  color: 'var(--bone)',
                  margin: '0 0 28px',
                  lineHeight: 1.06,
                }}
              >
                Your gift is here.
              </h1>

              {/* Code input */}
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                  setVoucherInfo(null);
                }}
                onBlur={() => validateCode(code)}
                placeholder="HRLM-XXXX-XXXX-XXXX"
                className="hl-mono"
                style={{
                  fontSize: 24,
                  letterSpacing: '0.16em',
                  textAlign: 'center',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--rule)',
                  outline: 'none',
                  padding: '8px 0',
                  marginBottom: 24,
                  color: 'var(--bone)',
                  fontFamily: 'var(--mono)',
                }}
                autoComplete="off"
                spellCheck={false}
              />

              {/* Error */}
              {error && (
                <p
                  role="alert"
                  className="hl-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    color: 'var(--danger)',
                    margin: '0 0 20px',
                    textAlign: 'center',
                  }}
                >
                  {error}
                </p>
              )}

              {/* Voucher detail */}
              {voucherInfo && (
                <div
                  style={{
                    textAlign: 'left',
                    borderTop: '1px solid var(--rule)',
                    paddingTop: 28,
                    marginBottom: 28,
                  }}
                >
                  <p
                    className="hl-eyebrow dark"
                    style={{ marginBottom: 16, color: 'var(--warm)' }}
                  >
                    valid gift
                  </p>

                  {voucherInfo.fromName && (
                    <p
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize: 15,
                        color: 'var(--bone-dim)',
                        marginBottom: 16,
                        fontWeight: 300,
                      }}
                    >
                      from{' '}
                      <span style={{ color: 'var(--bone)' }}>
                        {voucherInfo.fromName}
                      </span>
                    </p>
                  )}

                  {voucherInfo.recipientMessage && (
                    <div
                      style={{
                        borderLeft: '1px solid var(--warm)',
                        paddingLeft: 16,
                        marginBottom: 24,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: 'var(--serif)',
                          fontStyle: 'italic',
                          color: 'var(--bone-dim)',
                          fontSize: 14,
                          lineHeight: 1.7,
                          margin: 0,
                          fontWeight: 300,
                        }}
                      >
                        &ldquo;{voucherInfo.recipientMessage}&rdquo;
                      </p>
                    </div>
                  )}

                  <div style={{ marginBottom: 28 }}>
                    {[
                      { label: 'plan',     value: formatTier(voucherInfo.tier) },
                      { label: 'duration', value: `${voucherInfo.durationMonths} month${voucherInfo.durationMonths > 1 ? 's' : ''}` },
                      { label: 'expires',  value: new Date(voucherInfo.expiresAt).toLocaleDateString() },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '10px 0',
                          borderBottom: '1px solid var(--rule)',
                        }}
                      >
                        <span
                          className="hl-mono"
                          style={{
                            fontSize: 10,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: 'var(--bone-faint)',
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--serif)',
                            fontSize: 14,
                            color: 'var(--bone-dim)',
                            fontWeight: 300,
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {isAuthenticated ? (
                    <button
                      onClick={handleRedeem}
                      disabled={isRedeeming}
                      className="hl-btn"
                      style={{
                        width: '100%',
                        opacity: isRedeeming ? 0.5 : 1,
                        cursor: isRedeeming ? 'default' : 'pointer',
                      }}
                    >
                      {isRedeeming ? 'activating…' : 'Redeem →'}
                    </button>
                  ) : (
                    <div>
                      <p
                        style={{
                          textAlign: 'center',
                          fontFamily: 'var(--mono)',
                          fontSize: 10,
                          letterSpacing: '0.08em',
                          color: 'var(--bone-faint)',
                          marginBottom: 16,
                        }}
                      >
                        sign in or create an account to redeem
                      </p>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <Link
                          to={`/login?redirect=${encodeURIComponent(`/gift/redeem?code=${code}`)}`}
                          className="hl-btn ghost"
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            textDecoration: 'none',
                            color: 'var(--bone)',
                          }}
                        >
                          sign in
                        </Link>
                        <Link
                          to={`/signup?redirect=${encodeURIComponent(`/gift/redeem?code=${code}`)}`}
                          className="hl-btn"
                          style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                        >
                          begin a thread
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Redeem button (pre-validation or after entry) */}
              {!voucherInfo && (
                <button
                  onClick={() => validateCode(code)}
                  disabled={isValidating || code.length < 10}
                  className="hl-btn"
                  style={{
                    opacity: isValidating || code.length < 10 ? 0.45 : 1,
                    cursor: isValidating || code.length < 10 ? 'default' : 'pointer',
                  }}
                >
                  {isValidating ? 'checking…' : 'Redeem →'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </ClothShell>
  );
}

export default GiftRedeem;
