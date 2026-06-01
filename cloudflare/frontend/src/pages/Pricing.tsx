import { useState } from 'react';
import { Link } from 'react-router-dom';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '—',
    priceBilledAnnually: null,
    sub: 'forever',
    subAnnual: null,
    features: ['1 thread', '30 entries / yr', 'Read-only inheritance link', 'Export anytime'],
    cta: 'Begin free',
    to: '/signup',
    warm: false,
  },
  {
    id: 'family',
    name: 'Family',
    price: '$9.99',
    priceBilledAnnually: '$99',
    sub: '/ month',
    subAnnual: '/ year · 2 months free',
    features: ['Unlimited threads', 'Unlimited entries', 'Time-locked entries', 'Voice entries', 'Up to 12 family members', '30-day trial'],
    cta: 'Start 30-day trial',
    to: '/signup?tier=family',
    warm: true,
  },
  {
    id: 'founder',
    name: 'Founder',
    price: '$240',
    priceBilledAnnually: null,
    sub: 'once, lifetime',
    subAnnual: null,
    features: ['Everything in Family', 'Founder badge + pledge number', 'Locked price forever', 'Vote on the product roadmap'],
    cta: 'Become a founder',
    to: '/founder',
    warm: false,
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: '1px solid var(--parchment-rule)' }}>
          {TIERS.map((tier) => (
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
                  to={annual && tier.id === 'family' ? '/signup?tier=family&cycle=annual' : tier.to}
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
