import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { billingApi } from '../services/api';
import { PLAN_FEATURES } from '../lib/plans';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { WaxSeal, WarmDot } from '../loom/cosmic/CosmicUI';
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
      priceAnnual: null as string | null,
      cadence: 'Forever',
      cadenceAnnual: null as string | null,
      features: PLAN_FEATURES.STARTER,
      cta: 'Get started',
      to: '/signup',
      toAnnual: '/signup',
      emphasized: false,
    },
    {
      id: 'FAMILY',
      name: 'Family',
      price: fmt(s, pricing.FAMILY?.monthly ?? 6.99),
      priceAnnual: fmt(s, pricing.FAMILY?.yearly ?? 69),
      cadence: 'Per month',
      cadenceAnnual: 'Per year',
      features: PLAN_FEATURES.FAMILY,
      cta: 'Subscribe now',
      to: '/signup?tier=FAMILY',
      toAnnual: '/signup?tier=FAMILY&cycle=annual',
      emphasized: true,
    },
    {
      id: 'FOUNDER',
      name: 'Founder',
      price: fmt(s, pricing.FOUNDER?.lifetime ?? 249),
      priceAnnual: null as string | null,
      cadence: 'Once',
      cadenceAnnual: null as string | null,
      features: PLAN_FEATURES.LEGACY,
      cta: 'Become a founder',
      to: '/founder',
      toAnnual: '/founder',
      emphasized: false,
    },
  ];

  return (
    <ClothShell topbarLeft={<HLogo />} topbarCenter="pricing">
      <style>{`
        .hl-pricing-cols {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: stretch;
        }
        @media (max-width: 720px) {
          .hl-pricing-cols { grid-template-columns: 1fr; }
        }
      `}</style>
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: 'clamp(48px,11vh,120px) clamp(24px,6vw,56px)',
        }}
      >
        {/* Top ∞ */}
        <div style={{ marginBottom: 'clamp(48px,10vh,104px)' }}>
          <WaxSeal size={19} />
        </div>

        {/* Billing cycle toggle — preserved */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 24,
            marginBottom: 'clamp(40px,9vh,88px)',
          }}
        >
          <button
            type="button"
            onClick={() => setAnnual(false)}
            disabled={annualOnly}
            style={{
              background: 'transparent', border: 0, cursor: annualOnly ? 'default' : 'pointer', padding: '6px 0',
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase',
              color: !showAnnual ? 'var(--bone)' : 'var(--bone-faint)',
              borderBottom: !showAnnual ? '1px solid var(--bone)' : '1px solid transparent',
              opacity: annualOnly ? 0.4 : 1,
              transition: 'color 360ms var(--ease)',
            }}
          >
            monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            style={{
              background: 'transparent', border: 0, cursor: 'pointer', padding: '6px 0',
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase',
              color: showAnnual ? 'var(--bone)' : 'var(--bone-faint)',
              borderBottom: showAnnual ? '1px solid var(--warm)' : '1px solid transparent',
              transition: 'color 360ms var(--ease)',
            }}
          >
            annually · 2 months free
          </button>
        </div>

        {/* Three columns — FREE | FAMILY | FOUNDER */}
        <div className="hl-pricing-cols">
          {tiers.map((tier) => {
            const price = showAnnual && tier.priceAnnual ? tier.priceAnnual : tier.price;
            const cadence = showAnnual && tier.cadenceAnnual ? tier.cadenceAnnual : tier.cadence;
            const to = showAnnual ? tier.toAnnual : tier.to;
            return (
              <div
                key={tier.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 'clamp(28px,4vw,48px) clamp(24px,3vw,40px) clamp(32px,5vh,52px)',
                  borderLeft: tier.emphasized ? '1px solid var(--rule)' : '1px solid transparent',
                  borderRight: tier.emphasized ? '1px solid var(--rule)' : '1px solid transparent',
                  borderTop: tier.emphasized ? '2px solid var(--warm)' : '2px solid transparent',
                }}
              >
                {/* Plan name */}
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-dim)',
                  }}
                >
                  {tier.name}
                </div>

                {/* Price */}
                <div
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 'clamp(32px,6vw,50px)',
                    fontWeight: 400,
                    lineHeight: 1,
                    color: 'var(--bone)',
                    margin: '18px 0 0',
                  }}
                >
                  {price}
                </div>

                {/* Cadence */}
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                    marginTop: 12,
                  }}
                >
                  {cadence}
                </div>

                {/* Hairline rule */}
                <div style={{ height: 1, background: 'var(--rule)', margin: 'clamp(24px,4vh,36px) 0 clamp(24px,4vh,36px)' }} />

                {/* Feature list */}
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                  {tier.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      <span style={{ position: 'relative', top: 1, flex: '0 0 auto' }}>
                        <WarmDot size={4} />
                      </span>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.5, color: 'var(--bone-dim)' }}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA at the column foot */}
                <div style={{ marginTop: 'clamp(28px,5vh,44px)' }}>
                  <Link
                    to={to}
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color: 'var(--warm)',
                      textDecoration: 'none',
                      transition: 'color 180ms var(--ease)',
                    }}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom ∞ */}
        <div style={{ marginTop: 'clamp(48px,10vh,104px)' }}>
          <WaxSeal size={19} />
        </div>
      </div>
    </ClothShell>
  );
}
