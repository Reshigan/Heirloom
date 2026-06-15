import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { billingApi } from '../services/api';
import { PLAN_FEATURES } from '../lib/plans';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { RoomHeader } from '../loom/components/room';
import { usePageMeta } from '../lib/usePageMeta';

interface PricingData {
  symbol: string;
  code: string;
  FAMILY?: { monthly: number; yearly: number };
  FOUNDER?: { lifetime?: number };
}

const FALLBACK: PricingData = {
  symbol: '$', code: 'USD',
  FAMILY: { monthly: 6.99, yearly: 69 },
  FOUNDER: { lifetime: 249 },
};

function fmt(symbol: string, n: number): string {
  return `${symbol}${n % 1 === 0 ? n : n.toFixed(2)}`;
}

export function Pricing() {
  usePageMeta('Plans & Pricing', 'Choose the plan that fits your family. Start free, upgrade when you\'re ready.');
  const [annual, setAnnual] = useState(false);
  const [pricing, setPricing] = useState<PricingData>(FALLBACK);

  useEffect(() => {
    const controller = new AbortController();
    billingApi.getPricing().then((r: any) => {
      if (controller.signal.aborted) return;
      const d = r.data ?? r;
      if (d?.FAMILY && d?.FOUNDER) setPricing(d);
    }).catch(() => {});
    return () => controller.abort();
  }, []);

  const s = pricing.symbol;
  // Some currencies (e.g. INR) are yearly-only — monthly is 0. Force the annual
  // view there so Family never renders a "$0 / month".
  const annualOnly = !pricing.FAMILY?.monthly;
  const showAnnual = annual || annualOnly;

  const tiers = [
    {
      id: 'FREE',
      name: 'Free',
      price: fmt(s, 0),
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
      price: fmt(s, pricing.FAMILY?.monthly ?? 6.99),
      priceBilledAnnually: fmt(s, pricing.FAMILY?.yearly ?? 69),
      sub: '/ month',
      subAnnual: '/ year · 2 months free',
      features: PLAN_FEATURES.FAMILY,
      cta: 'Start free 30-day trial',
      to: '/signup?tier=FAMILY',
      warm: true,
    },
    {
      id: 'FOUNDER',
      name: 'Founder',
      price: fmt(s, pricing.FOUNDER?.lifetime ?? 249),
      priceBilledAnnually: null as string | null,
      sub: 'once · lifetime',
      subAnnual: null as string | null,
      features: PLAN_FEATURES.LEGACY,
      cta: 'Become a founder',
      to: '/founder',
      warm: false,
    },
  ];

  return (
    <ClothShell topbarLeft={<HLogo />} topbarCenter="pricing">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(24px,5vw,48px)' }}>
        <RoomHeader
          eyebrow="pricing"
          title="One price for the whole family."
          className="hl-room-header"
        />

        {/* Billing cycle toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '40px 0' }}>
          <button
            type="button"
            onClick={() => setAnnual(false)}
            style={{
              background: 'transparent', border: 0, cursor: 'pointer', padding: '6px 0',
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: !annual ? 'var(--bone)' : 'var(--bone-faint)',
              borderBottom: !annual ? '1px solid var(--bone)' : '1px solid transparent',
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
              color: annual ? 'var(--bone)' : 'var(--bone-faint)',
              borderBottom: annual ? '1px solid var(--warm)' : '1px solid transparent',
            }}
          >
            annually · 2 months free
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 0, borderTop: '1px solid var(--rule)' }}>
          {tiers.map((tier) => (
            <div
              key={tier.id}
              style={{
                padding: '40px 32px',
                borderRight: '1px solid var(--rule)',
                borderBottom: '1px solid var(--rule)',
              }}
            >
              <h2 className="hl-eyebrow dark" style={{ marginBottom: 16, margin: 0, padding: 0, font: 'inherit' }}>{tier.name}</h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span className="hl-serif" style={{ fontSize: 40, fontWeight: 300, color: 'var(--bone)' }}>
                  {showAnnual && tier.priceBilledAnnually ? tier.priceBilledAnnually : tier.price}
                </span>
                <span className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.08em' }}>
                  {showAnnual && tier.subAnnual ? tier.subAnnual : tier.sub}
                </span>
              </div>

              <hr className="hl-rule" style={{ margin: '24px 0' }} />

              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.7, color: 'var(--bone-dim)', paddingLeft: 16, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--bone-faint)' }}>·</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 40 }}>
                <Link
                  to={showAnnual && tier.id === 'FAMILY' ? '/signup?tier=FAMILY&cycle=annual' : tier.to}
                  className={tier.warm ? 'hl-btn' : 'hl-btn ghost'}
                  style={!tier.warm ? { color: 'var(--bone)', borderColor: 'var(--rule)' } : {}}
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 40, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          All plans include IPFS pinning + family export. No lock-in.
        </p>
      </div>
    </ClothShell>
  );
}
