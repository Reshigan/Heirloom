import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Check, ArrowLeft, Sparkles } from '../components/Icons';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  storage: string;
  popular?: boolean;
  monthly: { amount: number; display: string };
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-paper/50 hover:text-gold mb-8 transition-colors">
            <ArrowLeft size={18} />
            Back to Heirloom
          </Link>
          
          <div className="w-20 h-20 bg-gradient-to-br from-gold/30 to-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/30">
            <Gift className="w-10 h-10 text-gold" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-light text-paper mb-4">
            Gift a <span className="text-gold">Legacy</span>
          </h1>
          <p className="text-paper/60 max-w-xl mx-auto">
            Give someone special the gift of preserving their memories forever. 
            A Heirloom subscription is a meaningful gift that lasts generations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Plan Selection */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg mb-4">Choose a Plan</h2>
              
              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mb-6 p-1 bg-white/5 rounded-lg">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-2 px-4 rounded transition-all ${
                    billingCycle === 'monthly' 
                      ? 'bg-gold/20 text-gold' 
                      : 'text-paper/50 hover:text-paper'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 py-2 px-4 rounded transition-all ${
                    billingCycle === 'yearly' 
                      ? 'bg-gold/20 text-gold' 
                      : 'text-paper/50 hover:text-paper'
                  }`}
                >
                  Yearly
                  <span className="ml-2 text-xs text-green-400">Save 2 months</span>
                </button>
              </div>

              {/* Tier Selection */}
              <div className="space-y-3">
                {pricing?.tiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                      selectedTier === tier.id
                        ? 'border-gold bg-gold/10'
                        : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-paper">{tier.name}</span>
                          {tier.popular && (
                            <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs rounded">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-paper/50 text-sm mt-1">{tier.description}</p>
                        <p className="text-paper/40 text-xs mt-1">{tier.storage} storage</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl text-gold">
                          {tier[billingCycle].display}
                        </div>
                        <div className="text-paper/40 text-xs">
                          {billingCycle === 'yearly' ? '/year' : '/month'}
                        </div>
                      </div>
                    </div>
                    {selectedTier === tier.id && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Check className="w-5 h-5 text-gold" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="card">
              <h3 className="text-sm text-paper/50 mb-3">What's included:</h3>
              <ul className="space-y-2 text-sm">
                {[
                  'Unlimited memories with stories',
                  'Voice recordings with AI transcription',
                  'Letters to loved ones',
                  'Posthumous delivery system',
                  'Family tree & sharing',
                  'Military-grade encryption',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-paper/70">
                    <Sparkles className="w-4 h-4 text-gold" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Gift Details Form */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg mb-4">Your Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-paper/50 text-sm mb-1">Your Email *</label>
                  <input
                    type="email"
                    value={formData.purchaserEmail}
                    onChange={(e) => setFormData({ ...formData, purchaserEmail: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-paper focus:border-gold/50 focus:outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-paper/50 text-sm mb-1">Your Name</label>
                  <input
                    type="text"
                    value={formData.purchaserName}
                    onChange={(e) => setFormData({ ...formData, purchaserName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-paper focus:border-gold/50 focus:outline-none"
                    placeholder="Your name (shown to recipient)"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg mb-4">Recipient Details (Optional)</h2>
              <p className="text-paper/50 text-sm mb-4">
                You can send the gift directly to someone, or leave blank to receive the voucher code yourself.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-paper/50 text-sm mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-paper focus:border-gold/50 focus:outline-none"
                    placeholder="recipient@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-paper/50 text-sm mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-paper focus:border-gold/50 focus:outline-none"
                    placeholder="Their name"
                  />
                </div>
                
                <div>
                  <label className="block text-paper/50 text-sm mb-1">Personal Message</label>
                  <textarea
                    value={formData.recipientMessage}
                    onChange={(e) => setFormData({ ...formData, recipientMessage: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-paper focus:border-gold/50 focus:outline-none"
                    rows={3}
                    placeholder="Add a personal message to your gift..."
                  />
                </div>
              </div>
            </div>

            {/* Summary & Purchase */}
            <div className="card bg-gold/5 border-gold/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-paper/70">Gift Summary</span>
                <span className="text-gold font-medium">
                  {selectedPricing?.name} - {billingCycle === 'yearly' ? '1 Year' : '1 Month'}
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-6">
                <span className="text-paper/50">Total</span>
                <span className="text-2xl text-gold">{price?.display}</span>
              </div>
              
              <button
                onClick={handlePurchase}
                disabled={isLoading || !formData.purchaserEmail}
                className="w-full btn btn-primary py-3 text-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  'Processing...'
                ) : (
                  <>
                    <Gift size={20} />
                    Purchase Gift
                  </>
                )}
              </button>
              
              <p className="text-center text-paper/40 text-xs mt-4">
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
