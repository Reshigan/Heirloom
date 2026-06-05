import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { billingApi } from '../services/api';
import { PLAN_FEATURES } from '../lib/plans';

interface PricingData {
  symbol: string;
  code: string;
  STARTER?: { monthly: number; yearly: number };
  FAMILY?: { monthly: number; yearly: number };
  LEGACY?: { yearly?: number };
}

const FALLBACK: PricingData = {
  symbol: '$', code: 'USD',
  STARTER: { monthly: 0, yearly: 0 },
  FAMILY: { monthly: 9.99, yearly: 99 },
  LEGACY: { yearly: 240 },
};

function fmt(symbol: string, n: number): string {
  return `${symbol}${n % 1 === 0 ? n : n.toFixed(2)}`;
}

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [pricing, setPricing] = useState<PricingData>(FALLBACK);

  useEffect(() => {
    billingApi.getPricing().then((r: any) => {
      const d = r.data ?? r;
      if (d?.FAMILY?.monthly) setPricing(d);
    }).catch(() => {});
  }, []);

  const s = pricing.symbol;

  const tiers = [
    {
      id: 'STARTER',
      name: 'Free',
      price: '—',
      priceBilledAnnually: null as string | null,
      sub: 'forever',
      subAnnual: null as string | null,
      features: PLAN_FEATURES.STARTER,
      cta: 'Begin free',
      to: '/signup',
      warm: false,
    },
    {
      id: 'FAMILY',
      name: 'Family',
      price: fmt(s, pricing.FAMILY?.monthly ?? 9.99),
      priceBilledAnnually: fmt(s, pricing.FAMILY?.yearly ?? 99),
      sub: '/ month',
      subAnnual: '/ year · 2 months free',
      features: PLAN_FEATURES.FAMILY,
      cta: 'Start 30-day trial',
      to: '/signup?tier=FAMILY',
      warm: true,
    },
    {
      id: 'LEGACY',
      name: 'Founder',
      price: fmt(s, pricing.LEGACY?.yearly ?? 240),
      priceBilledAnnually: null as string | null,
      sub: 'once, lifetime',
      subAnnual: null as string | null,
      features: PLAN_FEATURES.LEGACY,
      cta: 'Become a founder',
      to: '/founder',
      warm: false,
    },
  ];

  return (
    <div className="hl-screen parchment" style={{ overflowY: 'auto', minHeight: '100vh' }}>
      <div style={{ padding: '80px 56px 120px', maxWidth: 1080, margin: '0 auto' }}>
        <div className="hl-eyebrow dark" style={{ marginBottom: 24 }}>Pricing</div>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 48, fontWeight: 300, margin: '0 0 40px', color: 'var(--parchment-ink)' }}>
          One price for the whole family.
        </h1>

        {/* Billing cycle toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <button
            type="button"
            onClick={() => setAnnual(false)}
            style={{
              background: 'transparent', border: 0, cursor: 'pointer', padding: '6px 0',
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: !annual ? 'var(--parchment-ink)' : 'var(--parchment-faint)',
              borderBottom: !annual ? '1px solid var(--parchment-ink)' : '1px solid transparent',
            }}
          >
            monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            style={{
              background: 'transparent', border: 0, cursor: 'pointer', padding: '6px 0',
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: annual ? 'var(--parchment-ink)' : 'var(--parchment-faint)',
              borderBottom: annual ? '1px solid var(--warm)' : '1px solid transparent',
            }}
          >
            annually · 2 months free
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 0, borderTop: '1px solid var(--parchment-rule)' }}>
          {tiers.map((tier) => (
            <div
              key={tier.id}
              style={{
                padding: '40px 32px',
                borderRight: '1px solid var(--parchment-rule)',
                borderBottom: '1px solid var(--parchment-rule)',
              }}
            >
              <div className="hl-eyebrow dark" style={{ marginBottom: 16 }}>{tier.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span className="hl-serif" style={{ fontSize: 40, fontWeight: 300, color: 'var(--parchment-ink)' }}>
                  {annual && tier.priceBilledAnnually ? tier.priceBilledAnnually : tier.price}
                </span>
                <span className="hl-mono" style={{ fontSize: 11, color: 'var(--parchment-dim)', letterSpacing: '0.08em' }}>
                  {annual && tier.subAnnual ? tier.subAnnual : tier.sub}
                </span>
              </div>

              <hr className="hl-rule parchment" style={{ margin: '24px 0' }} />

              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.7, color: 'var(--parchment-dim)', paddingLeft: 16, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--parchment-faint)' }}>·</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 40 }}>
                <Link
                  to={annual && tier.id === 'FAMILY' ? '/signup?tier=FAMILY&cycle=annual' : tier.to}
                  className={tier.warm ? 'hl-btn' : 'hl-btn ghost'}
                  style={!tier.warm ? { color: 'var(--parchment-ink)', borderColor: 'var(--parchment-rule)' } : {}}
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="hl-mono" style={{ fontSize: 10, color: 'var(--parchment-faint)', marginTop: 40, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          All plans include IPFS pinning + family export. No lock-in.
        </p>
      </div>
    </div>
  );
}
