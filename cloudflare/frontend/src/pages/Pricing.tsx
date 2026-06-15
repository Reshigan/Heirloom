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
      sub: 'ONE THREAD · 500MB',
      subAnnual: null as string | null,
      features: PLAN_FEATURES.STARTER,
      cta: 'Start',
      to: '/signup',
      warm: false,
    },
    {
      id: 'FAMILY',
      name: 'Family',
      price: fmt(s, pricing.FAMILY?.monthly ?? 6.99),
      priceBilledAnnually: fmt(s, pricing.FAMILY?.yearly ?? 69),
      sub: '/MONTH',
      subAnnual: '/YEAR · 2 MONTHS FREE',
      features: PLAN_FEATURES.FAMILY,
      cta: 'Choose Family',
      to: '/signup?tier=FAMILY',
      warm: true,
    },
    {
      id: 'FOUNDER',
      name: 'Founder',
      price: fmt(s, pricing.FOUNDER?.lifetime ?? 249),
      priceBilledAnnually: null as string | null,
      sub: 'ONCE · LIFETIME · ALL FEATURES',
      subAnnual: null as string | null,
      features: PLAN_FEATURES.LEGACY,
      cta: 'Become a Founder',
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
        {/* Eyebrow — the mockup's "KEEP THE THREAD" */}
        <p
          className="hl-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'var(--warm)',
            margin: 0,
          }}
        >
          Keep the thread
        </p>

        {/* Serif heading */}
        <h1
          className="hl-serif"
          style={{
            fontSize: 'clamp(32px,8vw,48px)',
            fontWeight: 300,
            color: 'var(--bone)',
            margin: '20px 0 0',
            lineHeight: 1.08,
            letterSpacing: '-0.01em',
          }}
        >
          Choose how you keep it
        </h1>

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
                padding: 'clamp(28px,5vh,44px) clamp(20px,5vw,40px)',
                borderTop: '1px solid var(--rule)',
                borderLeft: tier.warm ? '3px solid var(--warm)' : '3px solid transparent',
                background: tier.warm
                  ? 'linear-gradient(90deg, rgba(176,122,74,0.06), transparent 60%)'
                  : 'transparent',
                transition: 'border-color 360ms var(--ease)',
              }}
            >
              <h2
                className="hl-serif"
                style={{
                  fontSize: 'clamp(22px,5vw,28px)',
                  fontWeight: 300,
                  color: 'var(--bone)',
                  margin: 0,
                  lineHeight: 1.05,
                }}
              >
                {tier.name}
              </h2>

              {/* Price — serif numeral + mono period label */}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
                <span
                  className="hl-serif"
                  style={{
                    fontSize: 'clamp(34px,8vw,46px)',
                    fontWeight: 300,
                    lineHeight: 1,
                    color: tier.warm ? 'var(--warm-bright)' : 'var(--bone)',
                  }}
                >
                  {showAnnual && tier.priceBilledAnnually ? tier.priceBilledAnnually : tier.price}
                </span>
                {tier.id === 'FAMILY' && (
                  <span
                    className="hl-mono"
                    style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--bone-dim)' }}
                  >
                    {showAnnual && tier.subAnnual ? tier.subAnnual : tier.sub}
                  </span>
                )}
              </div>

              {/* Period / detail label */}
              <div
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  color: 'var(--bone-faint)',
                  marginTop: 8,
                }}
              >
                {tier.id === 'FAMILY'
                  ? (showAnnual ? '' : `OR ${tier.priceBilledAnnually}/YEAR`)
                  : tier.sub}
              </div>

              <ul style={{ listStyle: 'none', margin: 'clamp(18px,4vh,26px) 0 0', padding: 0 }}>
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

              <div style={{ marginTop: 'clamp(20px,4vh,30px)' }}>
                <Link
                  to={showAnnual && tier.id === 'FAMILY' ? '/signup?tier=FAMILY&cycle=annual' : tier.to}
                  className="hl-btn ghost"
                  style={{
                    color: 'var(--warm-bright)',
                    borderColor: 'var(--warm)',
                  }}
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
