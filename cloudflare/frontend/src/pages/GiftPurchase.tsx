import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
import { usePageMeta } from '../lib/usePageMeta';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PricingTier {
  id: string;
  name: string;
  description: string;
  storage: string;
  popular?: boolean;
  quarterly: { amount: number; display: string };
  yearly: { amount: number; display: string; savings?: string };
}

interface PricingData {
  currency: string;
  symbol: string;
  tiers: PricingTier[];
}

// ── GiftPurchase ──────────────────────────────────────────────────────────────

export function GiftPurchase() {
  usePageMeta('Give Heirloom', 'Give someone the gift of a family thread.');
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('FAMILY');
  const [billingCycle, setBillingCycle] = useState<'quarterly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    purchaserEmail: '',
    purchaserName: '',
    recipientEmail: '',
    recipientName: '',
    recipientMessage: '',
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/pricing`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((data) => { if (!controller.signal.aborted) setPricing(data); })
      .catch((err) => { if (err.name !== 'AbortError') console.error(err); });
    return () => controller.abort();
  }, []);

  const handlePurchase = async () => {
    if (!formData.purchaserEmail) {
      setFormError('your email address is required.');
      return;
    }
    if (!formData.recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail)) {
      setFormError('valid recipient email required');
      return;
    }
    setFormError(null);
    setIsLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: selectedTier,
            billingCycle,
            currency: pricing?.currency || 'USD',
            ...formData,
          }),
        },
      );
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setFormError(data.error || 'Failed to create checkout session.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setFormError('Failed to start checkout.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPricing = pricing?.tiers.find((t) => t.id === selectedTier);
  const price = selectedPricing?.[billingCycle];

  // Ceremony meta: a gift addressed to the recipient (name → email → the unnamed).
  const giftFor = formData.recipientName.trim() || formData.recipientEmail.trim();

  return (
    <ClothShell
      topbarLeft={<HLogo href="/" />}
      topbarCenter="gift a thread"
      topbarRight={<Link to="/login">sign in →</Link>}
    >
      {/* Content */}
      <div style={{ padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)' }}>
        <form onSubmit={(e) => { e.preventDefault(); handlePurchase(); }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>

          {/* Ceremony header — glowing ∞, serif title, mono warm address */}
          <header style={{ textAlign: 'center', marginBottom: 48 }}>
            <div
              aria-hidden
              style={{
                color: 'var(--warm)',
                fontSize: 'clamp(40px, 10vw, 64px)',
                lineHeight: 1,
                textShadow: '0 0 32px var(--warm-glow), 0 0 12px var(--warm-glow)',
                marginBottom: 24,
              }}
            >
              ∞
            </div>
            <h1
              className="hl-serif hl-tight"
              style={{
                fontSize: 'clamp(24px, 5vw, 34px)',
                fontWeight: 400,
                lineHeight: 1.12,
                color: 'var(--bone)',
                margin: 0,
              }}
            >
              Give a thread that outlives you.
            </h1>
            <div
              className="hl-mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                marginTop: 18,
              }}
            >
              {giftFor ? `A GIFT FOR ${giftFor}` : 'A GIFT OF A FAMILY THREAD'}
            </div>
            <p
              className="hl-serif"
              style={{
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 16,
                lineHeight: 1.55,
                color: 'var(--bone-dim)',
                margin: '16px auto 0',
                maxWidth: '28em',
              }}
            >
              Give someone the gift of a family thread.
            </p>
          </header>

          {/* Billing cycle toggle */}
          <div
            style={{
              display: 'flex',
              gap: 0,
              justifyContent: 'center',
              margin: '0 0 28px',
              borderBottom: '1px solid var(--rule)',
            }}
          >
            {(['quarterly', 'yearly'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className="hl-mono"
                style={{
                  background: 'transparent',
                  border: 0,
                  borderBottom:
                    billingCycle === cycle
                      ? '1px solid var(--warm)'
                      : '1px solid transparent',
                  marginBottom: -1,
                  padding: '10px 20px 10px 0',
                  fontSize: 10,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color:
                    billingCycle === cycle
                      ? 'var(--bone)'
                      : 'var(--bone-faint)',
                  cursor: 'pointer',
                  transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                {cycle === 'quarterly' ? '3 months' : 'annual'}
                {cycle === 'yearly' && (
                  <span
                    style={{
                      marginLeft: 8,
                      color: 'var(--warm)',
                      fontSize: 9,
                    }}
                  >
                    save 2 months
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tier selection: 2-column grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              marginBottom: 36,
            }}
          >
            {(
              pricing?.tiers ?? [
                {
                  id: 'FAMILY',
                  name: 'Family',
                  description: '1 year of Family plan',
                  storage: '50 GB',
                  quarterly: { amount: 0, display: '—' },
                  yearly: { amount: 0, display: '—' },
                },
              ]
            ).map((tier, idx) => {
              const isSelected = selectedTier === tier?.id;
              const isFirst = idx === 0;
              return (
                <button
                  key={tier?.id ?? idx}
                  onClick={() => tier?.id && setSelectedTier(tier.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'left',
                    padding: '16px 18px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--ink)' : 'transparent',
                    color: isSelected ? 'var(--bone)' : 'var(--bone)',
                    border: '1px solid var(--rule)',
                    borderLeft: isFirst ? '1px solid var(--rule)' : 'none',
                    outline: 'none',
                    transition:
                      'background 180ms cubic-bezier(0.16,1,0.3,1), color 180ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  <span
                    className="hl-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.28em',
                      textTransform: 'uppercase',
                      color: isSelected ? 'var(--bone-dim)' : 'var(--bone-dim)',
                      marginBottom: 8,
                    }}
                  >
                    {tier?.name ?? '—'}
                    {tier?.popular && (
                      <span
                        style={{
                          marginLeft: 8,
                          color: 'var(--warm)',
                          fontSize: 9,
                        }}
                      >
                        popular
                      </span>
                    )}
                  </span>
                  <span
                    className="hl-serif"
                    style={{
                      fontStyle: 'italic',
                      fontSize: 14,
                      color: isSelected ? 'var(--bone-dim)' : 'var(--bone-dim)',
                      marginBottom: 10,
                    }}
                  >
                    {tier?.description ?? '—'}
                  </span>
                  <span
                    className="hl-serif hl-tight"
                    style={{
                      fontSize: 28,
                      fontWeight: 300,
                      lineHeight: 1,
                      color: isSelected ? 'var(--bone)' : 'var(--bone)',
                    }}
                  >
                    {tier?.[billingCycle]?.display ?? '—'}
                  </span>
                  <span
                    className="hl-mono"
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: isSelected ? 'var(--bone-faint)' : 'var(--bone-faint)',
                      marginTop: 4,
                    }}
                  >
                    {billingCycle === 'yearly' ? '/ year' : '/ 3 months'}
                    {' · '}
                    {tier?.storage ?? '—'} storage
                  </span>
                </button>
              );
            })}
          </div>

          {/* Hairline rule */}
          <hr
            style={{
              height: 1,
              border: 0,
              background: 'var(--rule)',
              margin: '0 0 28px',
            }}
          />

          {/* Recipient email */}
          <div style={{ marginBottom: 18 }}>
            <label
              className="hl-mono"
              style={{
                display: 'block',
                fontSize: 10,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
                marginBottom: 8,
              }}
            >
              recipient email
            </label>
            <input
              type="email"
              value={formData.recipientEmail}
              onChange={(e) =>
                setFormData({ ...formData, recipientEmail: e.target.value })
              }
              placeholder="recipient@example.com"
              style={{
                width: '100%',
                background: 'transparent',
                border: 0,
                borderBottom: '1px solid var(--rule)',
                padding: '10px 0',
                fontFamily: 'var(--serif)',
                fontSize: 17,
                color: 'var(--bone)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Recipient name */}
          <div style={{ marginBottom: 18 }}>
            <label
              className="hl-mono"
              style={{
                display: 'block',
                fontSize: 10,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
                marginBottom: 8,
              }}
            >
              recipient name
            </label>
            <input
              type="text"
              value={formData.recipientName}
              onChange={(e) =>
                setFormData({ ...formData, recipientName: e.target.value })
              }
              placeholder="their name"
              style={{
                width: '100%',
                background: 'transparent',
                border: 0,
                borderBottom: '1px solid var(--rule)',
                padding: '10px 0',
                fontFamily: 'var(--serif)',
                fontSize: 17,
                color: 'var(--bone)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Personal note */}
          <div style={{ marginBottom: 18 }}>
            <label
              className="hl-mono"
              style={{
                display: 'block',
                fontSize: 10,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
                marginBottom: 8,
              }}
            >
              personal note
            </label>
            <textarea
              value={formData.recipientMessage}
              onChange={(e) =>
                setFormData({ ...formData, recipientMessage: e.target.value })
              }
              placeholder="a few quiet words…"
              style={{
                width: '100%',
                background: 'transparent',
                border: 0,
                borderBottom: '1px solid var(--rule)',
                padding: '10px 0',
                fontFamily: 'var(--serif)',
                fontSize: 17,
                color: 'var(--bone)',
                outline: 'none',
                resize: 'none',
                minHeight: 100,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Purchaser section */}
          <hr
            style={{
              height: 1,
              border: 0,
              background: 'var(--rule)',
              margin: '10px 0 28px',
            }}
          />

          <div style={{ marginBottom: 18 }}>
            <label
              className="hl-mono"
              style={{
                display: 'block',
                fontSize: 10,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
                marginBottom: 8,
              }}
            >
              your email <span style={{ color: 'var(--warm)' }}>*</span>
            </label>
            <input
              type="email"
              value={formData.purchaserEmail}
              onChange={(e) =>
                setFormData({ ...formData, purchaserEmail: e.target.value })
              }
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                background: 'transparent',
                border: 0,
                borderBottom: '1px solid var(--rule)',
                padding: '10px 0',
                fontFamily: 'var(--serif)',
                fontSize: 17,
                color: 'var(--bone)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              className="hl-mono"
              style={{
                display: 'block',
                fontSize: 10,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
                marginBottom: 8,
              }}
            >
              your name
            </label>
            <input
              type="text"
              value={formData.purchaserName}
              onChange={(e) =>
                setFormData({ ...formData, purchaserName: e.target.value })
              }
              placeholder="shown to recipient"
              style={{
                width: '100%',
                background: 'transparent',
                border: 0,
                borderBottom: '1px solid var(--rule)',
                padding: '10px 0',
                fontFamily: 'var(--serif)',
                fontSize: 17,
                color: 'var(--bone)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Summary line */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingTop: 20,
              borderTop: '1px solid var(--rule)',
              marginTop: 8,
            }}
          >
            <span
              className="hl-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
              }}
            >
              {selectedPricing?.name ?? '—'} &middot;{' '}
              {billingCycle === 'yearly' ? '1 year' : '3 months'}
            </span>
            <span
              className="hl-serif"
              style={{ fontSize: 22, color: 'var(--warm)' }}
            >
              {price?.display ?? '—'}
            </span>
          </div>

          {/* Error */}
          {formError && (
            <p
              role="alert"
              className="hl-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                color: 'var(--warm)',
                marginTop: 12,
                marginBottom: 0,
              }}
            >
              {formError}
            </p>
          )}

          {/* CTA — amber mono ceremony verb, centered */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button
              type="submit"
              disabled={isLoading || !formData.purchaserEmail || !price}
              className="hl-mono"
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                opacity: isLoading || !formData.purchaserEmail || !price ? 0.45 : 1,
                cursor: isLoading || !formData.purchaserEmail || !price ? 'default' : 'pointer',
                transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {isLoading ? 'preparing checkout…' : 'seal the gift →'}
            </button>

            <p
              className="hl-mono"
              style={{
                fontSize: 9,
                letterSpacing: '0.18em',
                color: 'var(--bone-faint)',
                margin: '16px 0 36px',
              }}
            >
              secure payment via stripe · voucher valid 1 year
            </p>

            <WaxSeal size={26} />
          </div>

        </div>
        </form>
      </div>
    </ClothShell>
  );
}

export default GiftPurchase;
