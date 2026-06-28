import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { billingApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
import { PLAN_PRICE_NUM, PLAN_FEATURES } from '../lib/plans';
import { handleRadioArrowKeys } from '../hooks/useRadioArrowKeys';

const META_TITLE = 'Plans & Pricing';
const META_DESCRIPTION = 'Choose the plan that fits your family. Start free, upgrade when you\'re ready.';
const OG_IMAGE = 'https://heirloom.blue/og-image.png?v=20260615b';
const CANONICAL = 'https://heirloom.blue/pricing';

interface PricingData {
  symbol: string;
  code: string;
  isAnnualOnly?: boolean;
  FAMILY?: { monthly: number; yearly: number };
  DEEP?: { monthly: number; yearly: number };
  FOUNDER?: { lifetime?: number };
}

const FALLBACK: PricingData = {
  symbol: '$', code: 'USD',
  isAnnualOnly: false,
  FAMILY: { monthly: PLAN_PRICE_NUM.FAMILY.monthly, yearly: PLAN_PRICE_NUM.FAMILY.annual },
  DEEP: { monthly: PLAN_PRICE_NUM.DEEP.monthly, yearly: PLAN_PRICE_NUM.DEEP.annual },
  FOUNDER: { lifetime: PLAN_PRICE_NUM.FOUNDER.lifetime },
};

function fmt(symbol: string, n: number): string {
  return `${symbol}${n % 1 === 0 ? n : n.toFixed(2)}`;
}

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [pricing, setPricing] = useState<PricingData>(FALLBACK);

  useEffect(() => {
    const controller = new AbortController();
    billingApi.getPricing().then((r: any) => {
      if (controller.signal.aborted) return;
      const d = r.data ?? r;
      if (d?.FAMILY) setPricing(d);
    }).catch(() => {});
    return () => controller.abort();
  }, []);

  const s = pricing.symbol;
  // The worker flags annual-only regions (deepest-PPP markets) via isAnnualOnly.
  // Flat USD everywhere now, so monthly is always present — rely on the server
  // flag, not on a zero monthly price, to suppress the monthly toggle.
  const annualOnly = pricing.isAnnualOnly ?? false;
  const showAnnual = annual || annualOnly;

  const familyMonthly = fmt(s, pricing.FAMILY?.monthly ?? PLAN_PRICE_NUM.FAMILY.monthly);
  const familyYearly = fmt(s, pricing.FAMILY?.yearly ?? PLAN_PRICE_NUM.FAMILY.annual);
  const deepMonthly = fmt(s, pricing.DEEP?.monthly ?? PLAN_PRICE_NUM.DEEP.monthly);
  const deepYearly = fmt(s, pricing.DEEP?.yearly ?? PLAN_PRICE_NUM.DEEP.annual);

  const tiers = [
    {
      id: 'FREE',
      name: 'Free',
      // FREE always shows $0 regardless of cycle.
      price: fmt(s, 0),
      cadence: null as string | null,
      note: 'One bloodline · 500 MB',
      lines: PLAN_FEATURES.STARTER,
      cta: 'Start',
      to: '/signup',
      emphasized: false,
    },
    {
      id: 'FAMILY',
      name: 'Family',
      price: showAnnual ? familyYearly : familyMonthly,
      cadence: showAnnual ? '/year' : '/month',
      // Surface the complementary cycle as a quiet mono line. Annual-only
      // currencies have no monthly price, so suppress the misleading
      // "$0/month" note rather than rendering it.
      note: annualOnly ? null : (showAnnual ? `or ${familyMonthly}/month` : `or ${familyYearly}/year`),
      lines: PLAN_FEATURES.FAMILY,
      cta: 'Choose Family',
      to: showAnnual ? '/signup?tier=family&cycle=annual' : '/signup?tier=family',
      emphasized: true,
    },
    {
      id: 'DEEP',
      name: 'Deep',
      price: showAnnual ? deepYearly : deepMonthly,
      cadence: showAnnual ? '/year' : '/month',
      note: annualOnly ? null : (showAnnual ? `or ${deepMonthly}/month` : `or ${deepYearly}/year`),
      lines: PLAN_FEATURES.DEEP,
      cta: 'Choose Deep',
      to: showAnnual ? '/signup?tier=deep&cycle=annual' : '/signup?tier=deep',
      emphasized: false,
    },
  ];

  return (
    <ClothShell topbarLeft={<HLogo href="/" />} topbarCenter="pricing">
      <Helmet>
        <title>{`${META_TITLE} · Heirloom`}</title>
        <meta name="description" content={META_DESCRIPTION} />
        <meta property="og:title" content={META_TITLE} />
        <meta property="og:description" content={META_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={OG_IMAGE} />
        <link rel="canonical" href={CANONICAL} />
      </Helmet>
      <style>{`
        .pricing-cta:focus-visible { outline: 1px solid var(--warm); outline-offset: 2px; }
      `}</style>
      <div
        style={{
          position: 'relative',
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
            position: 'relative',
            zIndex: 1,
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--copper-label)',
            marginBottom: 18,
          }}
        >
          let it settle
        </div>
        <h1
          className="hl-tight"
          style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(30px,7vw,46px)',
            fontWeight: 380,
            lineHeight: 1.06,
            letterSpacing: '-0.012em',
            color: 'var(--bone)',
            margin: '0 0 clamp(36px,8vh,72px)',
          }}
        >
          Choose how you keep the Deep
        </h1>

        {/* Continuity pledge — echoed from Billing, above the tiers */}
        <p
          style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: 'var(--serif)',
            fontSize: 16,
            lineHeight: 1.6,
            fontStyle: 'italic',
            color: 'var(--bone-dim)',
            maxWidth: '46ch',
            margin: '0 0 clamp(28px,6vh,48px)',
          }}
        >
          Your family's archive exports free, forever — even if Heirloom ends.
        </p>

        {/* The three tiers — stacked, centred, each in a card */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tiers.map((tier) => (
            <section
              key={tier.id}
              style={{
                padding: '18px',
                border: '1px solid var(--rule)',
                borderRadius: 0,
              }}
            >
              {/* Tier name */}
              <div
                style={{
                  fontFamily: 'var(--serif-display)',
                  fontSize: 'clamp(20px,4vw,26px)',
                  fontWeight: 400,
                  lineHeight: 1.1,
                  color: 'var(--bone)',
                  marginBottom: 10,
                }}
              >
                {tier.name}
              </div>

              {/* Big Fraunces price numeral + smaller muted serif cadence suffix */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                <span
                  style={{
                    fontFamily: 'var(--serif-display)',
                    fontSize: 34,
                    fontWeight: 500,
                    lineHeight: 1,
                    color: 'var(--bone)',
                  }}
                >
                  {tier.price}
                </span>
                {tier.cadence && (
                  <span
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: 15,
                      lineHeight: 1,
                      color: 'var(--muted-2)',
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
                    letterSpacing: '0.2em',
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
                  className="pricing-cta"
                  style={{
                    display: 'inline-block',
                    padding: '11px 28px',
                    background: 'transparent',
                    border: `1px solid var(--warm${tier.emphasized ? '' : '-dim'})`,
                    borderRadius: 0,
                    color: 'var(--warm)',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
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
            role="radiogroup"
            aria-label="Billing cycle"
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
              role="radio"
              aria-checked={!showAnnual}
              tabIndex={!showAnnual ? 0 : -1}
              onClick={() => setAnnual(false)}
              onKeyDown={(e) => handleRadioArrowKeys(e, 0, 2, (next) => setAnnual(next === 1))}
              style={{
                background: 'transparent', border: 0, cursor: 'pointer', padding: '4px 0',
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: !showAnnual ? 'var(--bone)' : 'var(--bone-faint)',
                borderBottom: !showAnnual ? '1px solid var(--bone)' : '1px solid transparent',
                transition: 'color 360ms var(--ease)',
              }}
            >
              monthly
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={showAnnual}
              tabIndex={showAnnual ? 0 : -1}
              onClick={() => setAnnual(true)}
              onKeyDown={(e) => handleRadioArrowKeys(e, 1, 2, (next) => setAnnual(next === 1))}
              style={{
                background: 'transparent', border: 0, cursor: 'pointer', padding: '4px 0',
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: showAnnual ? 'var(--bone)' : 'var(--bone-faint)',
                borderBottom: showAnnual ? '1px solid var(--bone)' : '1px solid transparent',
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
