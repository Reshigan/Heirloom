import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
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

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

// The glowing warm ∞ — the ceremony mark at the top of the rite.
function CeremonyMark() {
  return (
    <div
      aria-hidden
      className="hl-serif"
      style={{
        fontSize: 'clamp(40px, 10vw, 64px)',
        fontWeight: 200,
        lineHeight: 1,
        color: 'var(--warm)',
        textShadow: '0 0 32px var(--warm-glow), 0 0 12px var(--warm-glow)',
        marginBottom: 30,
      }}
    >
      ∞
    </div>
  );
}

// Mono warm meta line — uppercase 0.26em, the ceremony's voice.
function CeremonyMeta({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="hl-mono"
      style={{
        fontSize: 11,
        letterSpacing: '0.26em',
        textTransform: 'uppercase',
        color: 'var(--warm)',
        margin: '0 0 22px',
      }}
    >
      {children}
    </p>
  );
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

  // mono warm uppercase CTA — the ceremony's primary verb
  const ctaStyle = (enabled: boolean): React.CSSProperties => ({
    background: 'transparent',
    border: 0,
    padding: 0,
    fontFamily: 'var(--mono)',
    fontSize: 12,
    letterSpacing: '0.26em',
    textTransform: 'uppercase',
    color: 'var(--warm)',
    opacity: enabled ? 1 : 0.45,
    cursor: enabled ? 'pointer' : 'default',
    minHeight: 44,
    transition: `opacity 180ms ${EASE}`,
  });

  return (
    <ClothShell topbarLeft={<HLogo href="/" />} topbarCenter="redeem">
      {/* centered ceremony field — vast air */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100% - 73px)',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: 'var(--page-max-focus)',
            width: '100%',
            border: '1px solid var(--rule)',
            borderRadius: 0,
            padding: 'clamp(32px, 6vw, 56px) clamp(24px, 5vw, 48px)',
          }}
        >

          {redeemSuccess ? (
            // ── Success state — the rite completed ─────────────────────────
            <div role="status">
              <CeremonyMark />
              <CeremonyMeta>activated</CeremonyMeta>
              <h1
                className="hl-serif hl-tight"
                style={{
                  fontSize: 'clamp(24px, 5vw, 34px)',
                  fontWeight: 500,
                  color: 'var(--bone)',
                  margin: '0 0 18px',
                }}
              >
                Your thread is live.
              </h1>
              <p
                className="hl-serif"
                style={{
                  fontStyle: 'italic',
                  fontSize: 'var(--type-body)',
                  color: 'var(--bone-dim)',
                  margin: '0 0 36px',
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
                style={ctaStyle(true)}
              >
                open the thread →
              </button>
            </div>
          ) : (
            // ── Redeem ceremony ────────────────────────────────────────────
            <>
              <CeremonyMark />
              <CeremonyMeta>
                {voucherInfo?.recipientName
                  ? `a gift for ${voucherInfo.recipientName}`
                  : 'a gift for you'}
              </CeremonyMeta>
              <h1
                className="hl-serif hl-tight"
                style={{
                  fontSize: 'clamp(24px, 5vw, 34px)',
                  fontWeight: 500,
                  color: 'var(--bone)',
                  margin: '0 0 32px',
                }}
              >
                Your gift is here.
              </h1>

              {/* Code input — underline-only, centered, warm caret */}
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
                  padding: '10px 0',
                  marginBottom: 24,
                  color: 'var(--bone)',
                  caretColor: 'var(--warm)',
                  fontFamily: 'var(--mono)',
                }}
                autoComplete="off"
                spellCheck={false}
              />

              {/* Error — inline mono warm, never a toast */}
              {error && (
                <p
                  role="alert"
                  className="hl-mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--warm)',
                    margin: '0 0 20px',
                    textAlign: 'center',
                  }}
                >
                  {error}
                </p>
              )}

              {/* Voucher detail — the gift's particulars */}
              {voucherInfo && (
                <div
                  style={{
                    textAlign: 'left',
                    borderTop: '1px solid var(--rule)',
                    paddingTop: 28,
                    marginBottom: 28,
                  }}
                >
                  <SectionLabel>the gift</SectionLabel>

                  {voucherInfo.fromName && (
                    <p
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize: 15,
                        color: 'var(--bone-dim)',
                        margin: '8px 0 16px',
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
                        borderLeft: '3px solid var(--warm)',
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
                          alignItems: 'center',
                          padding: '12px 0',
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
                      style={ctaStyle(!isRedeeming)}
                    >
                      {isRedeeming ? 'activating…' : 'open the gift →'}
                    </button>
                  ) : (
                    <div>
                      <p
                        className="hl-mono"
                        style={{
                          textAlign: 'center',
                          fontSize: 10,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: 'var(--bone-faint)',
                          marginBottom: 16,
                        }}
                      >
                        sign in or create an account to open
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

              {/* Validate CTA — shown before a gift resolves */}
              {!voucherInfo && (
                <button
                  onClick={() => validateCode(code)}
                  disabled={isValidating || code.length < 10}
                  style={ctaStyle(!(isValidating || code.length < 10))}
                >
                  {isValidating ? 'checking…' : 'open →'}
                </button>
              )}

              <div style={{ marginTop: 44 }}>
                <WaxSeal size={26} />
              </div>
            </>
          )}
        </div>
      </div>
    </ClothShell>
  );
}

export default GiftRedeem;
