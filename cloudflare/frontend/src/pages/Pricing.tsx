import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { billingApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
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

  const familyMonthly = fmt(s, pricing.FAMILY?.monthly ?? 6.99);
  const familyYearly = fmt(s, pricing.FAMILY?.yearly ?? 69);

  const tiers = [
    {
      id: 'FREE',
      name: 'Free',
      // FREE always shows $0 regardless of cycle.
      price: fmt(s, 0),
      cadence: null as string | null,
      note: 'One thread · 500MB',
      lines: ['Basic access', 'Limited sharing'],
      cta: 'Start',
      to: '/signup',
      emphasized: false,
    },
    {
      id: 'FAMILY',
      name: 'Family',
      price: showAnnual ? familyYearly : familyMonthly,
      cadence: showAnnual ? '/year' : '/month',
      // Surface the complementary cycle as a quiet mono line.
      note: showAnnual ? `or ${familyMonthly}/month` : `or ${familyYearly}/year`,
      lines: ['Unlimited threads', 'Unlimited storage', 'Sealed notes'],
      cta: 'Choose Family',
      to: showAnnual ? '/signup?tier=family&cycle=annual' : '/signup?tier=family',
      emphasized: true,
    },
    {
      id: 'FOUNDER',
      name: 'Founder',
      price: fmt(s, pricing.FOUNDER?.lifetime ?? 249),
      cadence: 'once',
      note: 'Lifetime · All features',
      lines: [] as string[],
      cta: 'Become a Founder',
      to: '/founder',
      emphasized: false,
    },
  ];

  return (
    <ClothShell topbarLeft={<HLogo href="/" />} topbarCenter="pricing">
      <div
        style={{
          maxWidth: 540,
          margin: '0 auto',
          padding: 'clamp(48px,11vh,120px) clamp(24px,6vw,48px) clamp(40px,9vh,96px)',
          textAlign: 'center',
        }}
      >
        {/* Eyebrow + centred serif headline */}
        <div
          className="hl-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--warm)',
            marginBottom: 18,
          }}
        >
          keep the thread
        </div>
        <h1
          className="hl-serif hl-tight"
          style={{
            fontSize: 'clamp(30px,7vw,46px)',
            fontWeight: 380,
            lineHeight: 1.06,
            letterSpacing: '-0.012em',
            color: 'var(--bone)',
            margin: '0 0 clamp(36px,8vh,72px)',
            fontVariationSettings: '"opsz" 40',
          }}
        >
          Choose how you keep it
        </h1>

        {/* The three tiers — stacked, centred, hairline-ruled between */}
        <div>
          {tiers.map((tier) => (
            <section
              key={tier.id}
              style={{
                padding: 'clamp(28px,5vh,40px) 0',
                borderTop: '1px solid var(--rule)',
              }}
            >
              {/* Tier name */}
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 'clamp(20px,4vw,26px)',
                  fontWeight: 400,
                  lineHeight: 1.1,
                  color: 'var(--bone)',
                  marginBottom: 10,
                }}
              >
                {tier.name}
              </div>

              {/* Big serif price + mono cadence */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 'clamp(36px,9vw,56px)',
                    fontWeight: 400,
                    lineHeight: 1,
                    color: 'var(--bone)',
                  }}
                >
                  {tier.price}
                </span>
                {tier.cadence && (
                  <span
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--bone-faint)',
                    }}
                  >
                    {tier.cadence}
                  </span>
                )}
              </div>

              {/* Primary mono note line */}
              {tier.note && (
                <div
                  className="hl-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                    marginTop: 12,
                  }}
                >
                  {tier.note}
                </div>
              )}

              {/* Feature sub-lines — quiet serif, centred */}
              {tier.lines.length > 0 && (
                <ul
                  style={{
                    listStyle: 'none',
                    margin: '16px 0 0',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {tier.lines.map((line) => (
                    <li
                      key={line}
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize: 16,
                        lineHeight: 1.45,
                        color: 'var(--bone-dim)',
                      }}
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              )}

              {/* Outlined amber pill CTA */}
              <div style={{ marginTop: 'clamp(20px,4vh,28px)' }}>
                <Link
                  to={tier.to}
                  style={{
                    display: 'inline-block',
                    padding: '11px 28px',
                    background: 'transparent',
                    border: `1px solid var(--warm${tier.emphasized ? '' : '-dim'})`,
                    borderRadius: 999,
                    color: 'var(--warm)',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    transition: 'border-color 360ms var(--ease), color 360ms var(--ease)',
                  }}
                >
                  {tier.cta}
                </Link>
              </div>
            </section>
          ))}
        </div>

        {/* Billing cycle — quiet inline toggle, preserves annual/setAnnual wiring */}
        {!annualOnly && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 18,
              marginTop: 'clamp(32px,6vh,56px)',
            }}
          >
            <button
              type="button"
              onClick={() => setAnnual(false)}
              style={{
                background: 'transparent', border: 0, cursor: 'pointer', padding: '4px 0',
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase',
                color: !showAnnual ? 'var(--bone)' : 'var(--bone-faint)',
                borderBottom: !showAnnual ? '1px solid var(--bone)' : '1px solid transparent',
                transition: 'color 360ms var(--ease)',
              }}
            >
              monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              style={{
                background: 'transparent', border: 0, cursor: 'pointer', padding: '4px 0',
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase',
                color: showAnnual ? 'var(--bone)' : 'var(--bone-faint)',
                borderBottom: showAnnual ? '1px solid var(--warm)' : '1px solid transparent',
                transition: 'color 360ms var(--ease)',
              }}
            >
              annually
            </button>
          </div>
        )}

        {/* Bottom ∞ */}
        <div style={{ marginTop: 'clamp(40px,9vh,88px)' }}>
          <WaxSeal size={19} />
        </div>
      </div>
    </ClothShell>
  );
}
