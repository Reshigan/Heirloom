import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';

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
    fetch(
      `${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/pricing`,
    )
      .then((res) => res.json())
      .then((data) => setPricing(data))
      .catch(console.error);
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

  return (
    <ClothShell
      topbarLeft={<HLogo />}
      topbarCenter="gift a thread"
      topbarRight={<Link to="/login">sign in →</Link>}
    >
      {/* Content */}
      <div style={{ padding: '64px 56px' }}>
        <form onSubmit={(e) => { e.preventDefault(); handlePurchase(); }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* H1 */}
          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 48,
              fontWeight: 300,
              color: 'var(--bone)',
              margin: '0 0 32px',
              letterSpacing: '-0.022em',
              lineHeight: 1.08,
            }}
          >
            Give a thread to someone.
          </h1>

          {/* Billing cycle toggle */}
          <div
            style={{
              display: 'flex',
              gap: 0,
              marginBottom: 28,
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
                  storage: '25 GB',
                  quarterly: { amount: 0, display: '—' },
                  yearly: { amount: 0, display: '—' },
                },
              ]
            ).map((tier, idx) => {
              const isSelected = selectedTier === tier.id;
              const isFirst = idx === 0;
              return (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
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
                    {tier.name}
                    {tier.popular && (
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
                    {tier.description}
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
                    {tier[billingCycle].display}
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
                    {tier.storage} storage
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
                color: 'var(--danger)',
                marginTop: 12,
                marginBottom: 0,
              }}
            >
              {formError}
            </p>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={isLoading || !formData.purchaserEmail}
            className="hl-btn"
            style={{
              marginTop: 24,
              width: '100%',
              opacity: isLoading || !formData.purchaserEmail ? 0.45 : 1,
            }}
          >
            {isLoading ? 'preparing checkout…' : 'Purchase →'}
          </button>

          <p
            className="hl-mono"
            style={{
              textAlign: 'center',
              fontSize: 9,
              letterSpacing: '0.18em',
              color: 'var(--bone-faint)',
              marginTop: 16,
            }}
          >
            secure payment via stripe · voucher valid 1 year
          </p>

        </div>
        </form>
      </div>
    </ClothShell>
  );
}

export default GiftPurchase;
