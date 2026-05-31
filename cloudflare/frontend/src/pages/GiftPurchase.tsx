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

export function GiftPurchase() {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('FAMILY');
  const [billingCycle, setBillingCycle] = useState<'quarterly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);

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
      alert('Please enter your email address');
      return;
    }

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
        alert(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPricing = pricing?.tiers.find(t => t.id === selectedTier);
  const price = selectedPricing?.[billingCycle];

  return (
    <div className="min-h-screen bg-void text-paper antialiased">
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-paper-50 hover:text-gold mb-10 transition-colors text-sm">
            <span aria-hidden>←</span> Back to Heirloom
          </Link>

          <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Gift a subscription</p>
          <h1
            className="font-body font-light leading-[1.1] tracking-[-0.018em]"
            style={{ fontSize: 'clamp(2.25rem, 4vw, 3.25rem)' }}
          >
            Gift a legacy.
          </h1>
          <p className="mt-6 text-paper-70 max-w-xl mx-auto leading-relaxed font-light">
            Give someone special the gift of preserving their memories forever.
            A Heirloom subscription is a meaningful gift that lasts generations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Plan Selection */}
          <div className="space-y-6">
            <div className="bg-void-surface border border-paper-15 p-6">
              <h2 className="font-body text-lg mb-4">Choose a plan</h2>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-2 mb-6 p-1 bg-void border border-paper-15 rounded-[2px]">
                <button
                  onClick={() => setBillingCycle('quarterly')}
                  className={`flex-1 py-2 px-4 rounded-[2px] transition-colors ${
                    billingCycle === 'quarterly'
                      ? 'bg-gold/10 text-gold'
                      : 'text-paper-50 hover:text-paper'
                  }`}
                >
                  3 Months
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 py-2 px-4 rounded-[2px] transition-colors ${
                    billingCycle === 'yearly'
                      ? 'bg-gold/10 text-gold'
                      : 'text-paper-50 hover:text-paper'
                  }`}
                >
                  Annual
                  <span className="ml-2 text-xs text-gold">Save 2 months</span>
                </button>
              </div>

              {/* Tier Selection */}
              <div className="space-y-3">
                {pricing?.tiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`relative w-full p-4 rounded-[2px] border transition-colors text-left ${
                      selectedTier === tier.id
                        ? 'border-gold-40 bg-gold/5'
                        : 'border-paper-15 hover:border-paper-30 bg-void'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-body text-paper">{tier.name}</span>
                          {tier.popular && (
                            <span className="px-2 py-0.5 bg-gold/10 text-gold text-xs rounded-[2px]">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-paper-65 text-sm mt-1">{tier.description}</p>
                        <p className="text-paper-50 text-xs mt-1">{tier.storage} storage</p>
                      </div>
                      <div className="text-right">
                        <div className="font-body text-xl text-gold">
                          {tier[billingCycle].display}
                        </div>
                        <div className="text-paper-50 text-xs">
                          {billingCycle === 'yearly' ? '/year' : '/3 months'}
                        </div>
                      </div>
                    </div>
                    {selectedTier === tier.id && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gold" aria-hidden>·</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-void-surface border border-paper-15 p-6">
              <h3 className="text-sm text-paper-50 mb-3 uppercase tracking-[0.22em]">What's included</h3>
              <ul className="space-y-2 text-sm">
                {[
                  'Unlimited memories with stories',
                  'Voice recordings with AI transcription',
                  'Letters to loved ones',
                  'Posthumous delivery system',
                  'Family tree & sharing',
                  'Military-grade encryption',
                ].map((feature, i) => (
                  <li key={i} className="flex items-baseline gap-3 text-paper-70">
                    <span className="text-gold font-mono text-sm" aria-hidden>·</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Gift Details Form */}
          <div className="space-y-6">
            <div className="bg-void-surface border border-paper-15 p-6">
              <h2 className="font-body text-lg mb-4">Your details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Your email <span className="text-blood" aria-hidden>*</span></label>
                  <input
                    type="email"
                    value={formData.purchaserEmail}
                    onChange={(e) => setFormData({ ...formData, purchaserEmail: e.target.value })}
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Your name</label>
                  <input
                    type="text"
                    value={formData.purchaserName}
                    onChange={(e) => setFormData({ ...formData, purchaserName: e.target.value })}
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                    placeholder="Your name (shown to recipient)"
                  />
                </div>
              </div>
            </div>

            <div className="bg-void-surface border border-paper-15 p-6">
              <h2 className="font-body text-lg mb-4">Recipient details (optional)</h2>
              <p className="text-paper-50 text-sm mb-4 leading-relaxed">
                You can send the gift directly to someone, or leave blank to receive the voucher code yourself.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Recipient email</label>
                  <input
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                    placeholder="recipient@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Recipient name</label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                    placeholder="Their name"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Personal message</label>
                  <textarea
                    value={formData.recipientMessage}
                    onChange={(e) => setFormData({ ...formData, recipientMessage: e.target.value })}
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors font-body text-base leading-[1.7] resize-y"
                    rows={3}
                    placeholder="Add a personal message to your gift…"
                  />
                </div>
              </div>
            </div>

            {/* Summary & Purchase */}
            <div className="bg-void-surface border border-gold-40 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-paper-70">Gift summary</span>
                <span className="text-gold">
                  {selectedPricing?.name} — {billingCycle === 'yearly' ? '1 Year' : '3 Months'}
                </span>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-paper-50">Total</span>
                <span className="font-body text-2xl text-gold">{price?.display}</span>
              </div>

              <button
                onClick={handlePurchase}
                disabled={isLoading || !formData.purchaserEmail}
                className="btn btn-primary w-full"
              >
                {isLoading ? 'Processing…' : 'Purchase gift'}
                {!isLoading ? <span aria-hidden>→</span> : null}
              </button>

              <p className="text-center text-paper-50 text-xs mt-4">
                Secure payment powered by Stripe. Voucher valid for 1 year.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GiftPurchase;
