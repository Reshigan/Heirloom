import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { billingApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
import { PLAN_PRICE_NUM } from '../lib/plans';

const META_TITLE = 'Plans & Pricing';
const META_DESCRIPTION = 'Choose the plan that fits your family. Start free, upgrade when you\'re ready.';
const OG_IMAGE = 'https://heirloom.blue/og-image.png?v=20260615b';
const CANONICAL = 'https://heirloom.blue/pricing';

interface PricingData {
  symbol: string;
  code: string;
  FAMILY?: { monthly: number; yearly: number };
  FOUNDER?: { lifetime?: number };
}

const FALLBACK: PricingData = {
  symbol: '$', code: 'USD',
  FAMILY: { monthly: PLAN_PRICE_NUM.FAMILY.monthly, yearly: PLAN_PRICE_NUM.FAMILY.annual },
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
      if (d?.FAMILY && d?.FOUNDER) setPricing(d);
    }).catch(() => {});
    return () => controller.abort();
  }, []);

  const s = pricing.symbol;
  // Some currencies (e.g. INR) are yearly-only — monthly is 0. Force the annual
  // view there so Family never renders a "$0 / month".
  const annualOnly = !pricing.FAMILY?.monthly;
  const showAnnual = annual || annualOnly;

  const familyMonthly = fmt(s, pricing.FAMILY?.monthly ?? PLAN_PRICE_NUM.FAMILY.monthly);
  const familyYearly = fmt(s, pricing.FAMILY?.yearly ?? PLAN_PRICE_NUM.FAMILY.annual);

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
      price: fmt(s, pricing.FOUNDER?.lifetime ?? PLAN_PRICE_NUM.FOUNDER.lifetime),
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
        .pricing-cta:focus-visible { outline: 2px solid var(--warm); outline-offset: 2px; }
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
        {/* WOVEN — decorative thread-band, bottom-left, behind cards */}
        <picture style={{ display: 'contents' }}>
          <source type="image/avif" srcSet="/woven/thread-band.avif" />
          <source type="image/webp" srcSet="/woven/thread-band.webp" />
          <img
            src="/woven/thread-band.png"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: -40,
              bottom: 24,
              width: 'clamp(220px,42vw,340px)',
              transform: 'rotate(-12deg)',
              opacity: 0.5,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        </picture>
        {/* Eyebrow + centred serif headline */}
        <div
          className="hl-mono"
          style={{
            position: 'relative',
            zIndex: 1,
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--copper-label)',
            marginBottom: 18,
          }}
        >
          keep the thread
        </div>
        <h1
          className="hl-serif hl-tight"
          style={{
            position: 'relative',
            zIndex: 1,
            fontSize: 'clamp(30px,7vw,46px)',
            fontWeight: 380,
            lineHeight: 1.06,
            letterSpacing: '-0.012em',
            color: 'var(--bone)',
            margin: '0 0 clamp(36px,8vh,72px)',
          }}
        >
          Choose how you keep it
        </h1>

        {/* The three tiers — stacked, centred, each in a card */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tiers.map((tier) => (
            <section
              key={tier.id}
              style={{
                padding: '18px',
                border: tier.emphasized
                  ? '1px solid var(--copper-border)'
                  : '1px solid var(--hairline-3)',
                borderRadius: 0,
              }}
            >
              {/* Tier name */}
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 'clamp(20px,4vw,26px)',
                  fontWeight: 400,
                  lineHeight: 1.1,
                  color: tier.emphasized ? 'var(--gold-text)' : 'var(--bone)',
                  marginBottom: 10,
                }}
              >
                {tier.name}
              </div>

              {/* Big Cormorant price numeral + smaller muted serif cadence suffix */}
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
