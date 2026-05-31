import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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

const FEATURES = [
  'unlimited threads with full stories',
  'voice recordings with transcription',
  'letters to loved ones',
  'posthumous delivery',
  'family sharing',
  'zero-knowledge encryption',
];

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
    fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/pricing`)
      .then(res => res.json())
      .then(data => setPricing(data))
      .catch(console.error);
  }, []);

  const handlePurchase = async () => {
    if (!formData.purchaserEmail) {
      setFormError('your email address is required.');
      return;
    }
    setFormError(null);
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          billingCycle,
          currency: pricing?.currency || 'USD',
          ...formData,
        }),
      });
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

  const selectedPricing = pricing?.tiers.find(t => t.id === selectedTier);
  const price = selectedPricing?.[billingCycle];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--loom-ink)',
        color: 'var(--loom-bone)',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 32px 96px' }}>

        {/* Back link */}
        <div style={{ marginBottom: 48 }}>
          <Link
            to="/"
            className="loom-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
              textDecoration: 'none',
            }}
          >
            heirloom
          </Link>
        </div>

        {/* Header */}
        <header style={{ marginBottom: 56 }}>
          <p className="loom-eyebrow" style={{ marginBottom: 14 }}>give a thread</p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
          >
            Gift a thread.
          </h1>
          <p
            className="loom-body"
            style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 560, lineHeight: 1.6 }}
          >
            Give someone the gift of a place on the family thread — a thousand-year archive,
            preserved and passed down.
          </p>
        </header>

        <hr className="loom-hairline" style={{ marginBottom: 56 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

          {/* Left: Plan Selection */}
          <div>
            <p className="loom-eyebrow" style={{ marginBottom: 24 }}>choose a plan</p>

            {/* Billing Toggle */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: '1px solid var(--loom-rule)' }}>
              {(['quarterly', 'yearly'] as const).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className="loom-mono"
                  style={{
                    background: 'transparent',
                    border: 0,
                    borderBottom: billingCycle === cycle ? '1px solid var(--loom-warm)' : '1px solid transparent',
                    marginBottom: -1,
                    padding: '10px 20px 10px 0',
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: billingCycle === cycle ? 'var(--loom-bone)' : 'var(--loom-bone-faint)',
                    cursor: 'pointer',
                    transition: 'color 180ms var(--loom-ease)',
                  }}
                >
                  {cycle === 'quarterly' ? '3 months' : 'annual'}
                  {cycle === 'yearly' && (
                    <span style={{ marginLeft: 8, color: 'var(--loom-warm)', fontSize: 9 }}>save 2 months</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tier Selection */}
            <div style={{ display: 'grid', gap: 1 }}>
              {pricing?.tiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'center',
                    width: '100%',
                    textAlign: 'left',
                    padding: '18px 0',
                    background: 'transparent',
                    border: 0,
                    borderBottom: '1px solid var(--loom-rule)',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <p
                      className="loom-body"
                      style={{
                        fontSize: 16,
                        fontStyle: 'italic',
                        color: selectedTier === tier.id ? 'var(--loom-bone)' : 'var(--loom-bone-dim)',
                        margin: '0 0 2px',
                        transition: 'color 180ms var(--loom-ease)',
                      }}
                    >
                      {tier.name}
                      {tier.popular && (
                        <span
                          className="loom-mono"
                          style={{ marginLeft: 10, fontSize: 9, letterSpacing: '0.16em', color: 'var(--loom-warm)', textTransform: 'uppercase', fontStyle: 'normal' }}
                        >
                          popular
                        </span>
                      )}
                    </p>
                    <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', margin: 0 }}>
                      {tier.storage} storage
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      className="loom-body"
                      style={{
                        fontSize: 18,
                        color: selectedTier === tier.id ? 'var(--loom-warm)' : 'var(--loom-bone-dim)',
                        margin: 0,
                        transition: 'color 180ms var(--loom-ease)',
                      }}
                    >
                      {tier[billingCycle].display}
                    </p>
                    <p className="loom-mono" style={{ fontSize: 9, color: 'var(--loom-bone-faint)', margin: 0 }}>
                      {billingCycle === 'yearly' ? '/year' : '/3 months'}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Features */}
            <div style={{ marginTop: 40 }}>
              <p className="loom-eyebrow" style={{ marginBottom: 16 }}>what's included</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                {FEATURES.map((feature, i) => (
                  <li
                    key={i}
                    className="loom-body"
                    style={{ display: 'flex', alignItems: 'baseline', gap: 12, fontSize: 14, color: 'var(--loom-bone-dim)' }}
                  >
                    <span style={{ color: 'var(--loom-warm)', flexShrink: 0 }}>·</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Form + Purchase */}
          <div>
            <p className="loom-eyebrow" style={{ marginBottom: 24 }}>your details</p>
            <div style={{ display: 'grid', gap: 24, marginBottom: 40 }}>
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
                  your email <span style={{ color: '#c25a5a' }}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.purchaserEmail}
                  onChange={(e) => setFormData({ ...formData, purchaserEmail: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
                  your name
                </label>
                <input
                  type="text"
                  value={formData.purchaserName}
                  onChange={(e) => setFormData({ ...formData, purchaserName: e.target.value })}
                  placeholder="shown to recipient"
                />
              </div>
            </div>

            <hr className="loom-hairline" style={{ marginBottom: 32 }} />

            <p className="loom-eyebrow" style={{ marginBottom: 8 }}>recipient (optional)</p>
            <p className="loom-body" style={{ fontSize: 13, color: 'var(--loom-bone-faint)', margin: '0 0 24px' }}>
              send directly, or leave blank to receive the voucher code yourself.
            </p>
            <div style={{ display: 'grid', gap: 24, marginBottom: 40 }}>
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
                  recipient email
                </label>
                <input
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  placeholder="recipient@example.com"
                />
              </div>
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
                  recipient name
                </label>
                <input
                  type="text"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="their name"
                />
              </div>
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
                  personal note
                </label>
                <textarea
                  value={formData.recipientMessage}
                  onChange={(e) => setFormData({ ...formData, recipientMessage: e.target.value })}
                  placeholder="a few quiet words…"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <hr className="loom-hairline" style={{ marginBottom: 28 }} />

            {/* Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)' }}>
                {selectedPricing?.name} — {billingCycle === 'yearly' ? '1 year' : '3 months'}
              </span>
              <span className="loom-body" style={{ fontSize: 22, color: 'var(--loom-warm)' }}>
                {price?.display}
              </span>
            </div>

            {formError && (
              <p
                role="alert"
                className="loom-body"
                style={{ fontStyle: 'italic', color: '#c25a5a', fontSize: 13, margin: '0 0 16px' }}
              >
                {formError}
              </p>
            )}

            <button
              onClick={handlePurchase}
              disabled={isLoading || !formData.purchaserEmail}
              className="loom-btn"
              style={{ width: '100%', opacity: (isLoading || !formData.purchaserEmail) ? 0.5 : 1 }}
            >
              {isLoading ? 'preparing checkout…' : 'purchase gift'}
            </button>

            <p className="loom-mono" style={{ textAlign: 'center', fontSize: 9, letterSpacing: '0.18em', color: 'var(--loom-bone-faint)', marginTop: 16 }}>
              secure payment via stripe · voucher valid 1 year
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GiftPurchase;
