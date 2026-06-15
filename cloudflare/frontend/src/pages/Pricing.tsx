import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { billingApi } from '../services/api';
import { PLAN_FEATURES } from '../lib/plans';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
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
      <div
        style={{
          maxWidth: 540,
          margin: '0 auto',
          padding: 'clamp(48px,9vh,96px) clamp(24px,6vw,40px)',
          textAlign: 'center',
        }}
      >
        {/* Eyebrow — the mockup's "CHOOSE YOUR THREAD" */}
        <p
          className="hl-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'var(--bone-dim)',
            margin: 0,
          }}
        >
          Choose your thread
        </p>

        {/* Billing cycle toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 24,
            margin: 'clamp(48px,10vh,88px) 0 clamp(40px,8vh,72px)',
          }}
        >
          <button
            type="button"
            onClick={() => setAnnual(false)}
            style={{
              background: 'transparent', border: 0, cursor: 'pointer', padding: '6px 0',
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
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
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: annual ? 'var(--bone)' : 'var(--bone-faint)',
              borderBottom: annual ? '1px solid var(--warm)' : '1px solid transparent',
            }}
          >
            annually · 2 months free
          </button>
        </div>

        {/* Tiers — stacked vertically, Family highlighted with a warm border */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(40px,8vh,72px)' }}>
          {tiers.map((tier) => (
            <div
              key={tier.id}
              style={{
                width: '100%',
                padding: tier.warm ? 'clamp(32px,6vh,48px) clamp(24px,5vw,40px)' : 0,
                border: tier.warm ? '1px solid var(--warm)' : '0',
                boxShadow: tier.warm ? '0 0 48px var(--warm-glow)' : 'none',
                transition: 'border-color 360ms var(--ease)',
              }}
            >
              <h2
                className="hl-serif"
                style={{
                  fontSize: 'clamp(30px,7vw,40px)',
                  fontWeight: 300,
                  color: 'var(--bone)',
                  margin: 0,
                  lineHeight: 1.05,
                }}
              >
                {tier.name}
              </h2>

              <div
                className="hl-mono"
                style={{
                  fontSize: 12,
                  letterSpacing: '0.12em',
                  color: tier.warm ? 'var(--warm-bright)' : 'var(--bone-dim)',
                  marginTop: 14,
                }}
              >
                {showAnnual && tier.priceBilledAnnually ? tier.priceBilledAnnually : tier.price}
                {'  ·  '}
                {showAnnual && tier.subAnnual ? tier.subAnnual : tier.sub}
              </div>

              <hr className="hl-rule" style={{ margin: 'clamp(20px,4vh,28px) auto', width: 40 }} />

              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {tier.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: 14,
                      lineHeight: 1.9,
                      color: 'var(--bone-dim)',
                    }}
                  >
                    {f}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 'clamp(24px,5vh,36px)' }}>
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

        <p
          className="hl-mono"
          style={{
            fontSize: 10,
            color: 'var(--bone-faint)',
            marginTop: 'clamp(48px,9vh,80px)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          All plans include IPFS pinning + family export. No lock-in.
        </p>
      </div>
    </ClothShell>
  );
}
