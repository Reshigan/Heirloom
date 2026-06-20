import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { HLogo } from '../loom/components/HLogo';
import { TapestryEdge } from '../loom/components/Frame';
import { ClothShell } from '../loom/components/ClothShell';
import { SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import api from '../services/api';
import { PLAN_PRICE } from '../lib/plans';

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
  '500 GB thread storage',
  'priority support',
  'gold legacy member designation',
  'early access to new features',
];

import { EASE } from '../loom/motion';

/** The ceremonial glowing warm ∞ at the head of the ritual. */
function GlowMark() {
  return (
    <div
      aria-hidden
      style={{
        fontFamily: 'var(--serif-display)',
        fontSize: 'clamp(40px, 10vw, 64px)',
        fontWeight: 200,
        color: 'var(--warm)',
        lineHeight: 1,
        marginBottom: 28,
      }}
    >
      ∞
    </div>
  );
}

/** A serif-bullet benefit line, used in both the success scroll and the pre-validation list. */
function BenefitLine({ children, size = 14 }: { children: React.ReactNode; size?: number }) {
  return (
    <li
      className="hl-serif"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        fontSize: size,
        color: 'var(--bone-dim)',
      }}
    >
      <span style={{ color: 'var(--warm)', flexShrink: 0 }}>·</span>
      {children}
    </li>
  );
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
    <ClothShell topbarLeft={<HLogo href="/" />} topbarCenter="gold thread">
      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        {/* The ceremony frame — vast air, one faint rounded-rect */}
        <div
          style={{
            width: '100%',
            maxWidth: 'var(--page-max-focus)',
            textAlign: 'center',
            border: '1px solid var(--rule)',
            borderRadius: 0,
            padding: 'clamp(32px, 7vw, 56px) clamp(24px, 6vw, 48px)',
            boxSizing: 'border-box',
          }}
        >

          {redeemSuccess ? (
            /* ── Success state ── */
            <div role="status">
              <GlowMark />

              <h1
                className="hl-tight"
                style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 500, margin: '0 0 24px', color: 'var(--bone)' }}
              >
                Your lifetime access.
              </h1>

              <p
                className="hl-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
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
                  <BenefitLine key={i}>{b}</BenefitLine>
                ))}
              </ul>

              <button
                onClick={() => navigate('/loom')}
                className="hl-mono"
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  fontSize: 11,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  cursor: 'pointer',
                }}
              >
                open the thread →
              </button>
            </div>
          ) : (
            /* ── Entry state ── */
            <>
              <GlowMark />

              <h1
                className="hl-tight"
                style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 500, margin: '0 0 12px', color: 'var(--bone)' }}
              >
                Your lifetime access.
              </h1>

              <p
                className="hl-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  margin: '0 0 28px',
                }}
              >
                {`gold legacy · ${PLAN_PRICE.FOUNDER.amount} lifetime`}
              </p>

              {/* Code input */}
              <input
                id="gold-code"
                aria-label="Gold Legacy code"
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
                  style={{ fontSize: 10, color: 'var(--warm)', margin: '0 0 16px', letterSpacing: '0.04em' }}
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
                      <SectionLabel>a note</SectionLabel>
                      <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 16, marginTop: 4 }}>
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
                    <SectionLabel>lifetime benefits</SectionLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                      {['Lifetime Access', '500 GB Storage', 'Priority Support', 'Gold Designation'].map(
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
                        className="hl-mono"
                        style={{
                          background: 'transparent',
                          border: 0,
                          padding: 0,
                          fontSize: 11,
                          letterSpacing: '0.26em',
                          textTransform: 'uppercase',
                          color: 'var(--warm)',
                          opacity: isRedeeming ? 0.5 : 1,
                          cursor: isRedeeming ? 'default' : 'pointer',
                          transition: `opacity 180ms ${EASE}`,
                        }}
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
                            className="hl-btn ghost"
                            style={{
                              flex: 1,
                              textAlign: 'center',
                              textDecoration: 'none',
                              color: 'var(--bone)',
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
                  className="hl-mono"
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    fontSize: 11,
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    color: 'var(--warm)',
                    opacity: isValidating ? 0.5 : 1,
                    cursor: isValidating ? 'default' : 'pointer',
                    transition: `opacity 180ms ${EASE}`,
                  }}
                >
                  {isValidating ? 'checking…' : 'activate →'}
                </button>
              )}

              {!voucherInfo && !error && code.length < 10 && (
                <>
                  <button
                    className="hl-mono"
                    style={{
                      background: 'transparent',
                      border: 0,
                      padding: 0,
                      fontSize: 11,
                      letterSpacing: '0.26em',
                      textTransform: 'uppercase',
                      color: 'var(--warm)',
                      opacity: 0.35,
                      pointerEvents: 'none',
                    }}
                  >
                    activate →
                  </button>

                  <div style={{ marginTop: 32 }}>
                    <SectionLabel>gold legacy grants you</SectionLabel>
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
                        <BenefitLine key={i}>{f}</BenefitLine>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* The ∞ wax seal resting at the foot of the ceremony */}
              <div style={{ marginTop: 40 }}>
                <WaxSeal size={24} />
              </div>
            </>
          )}
        </div>
      </div>

      <TapestryEdge />
    </ClothShell>
  );
}

export default GoldLegacyRedeem;
