import { Link } from 'react-router-dom';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '—',
    sub: 'forever',
    features: ['1 thread', '30 entries / yr', 'Read-only inheritance link', 'Export anytime'],
    cta: 'Begin free',
    to: '/signup',
    warm: false,
  },
  {
    id: 'family',
    name: 'Family',
    price: '$15',
    sub: '/ month',
    features: ['Unlimited threads', 'Unlimited entries', 'Time-locked entries', 'Voice entries', 'Up to 12 family members', '30-day trial'],
    cta: 'Start 30-day trial',
    to: '/signup?tier=family',
    warm: true,
  },
  {
    id: 'founder',
    name: 'Founder',
    price: '$240',
    sub: 'once, lifetime',
    features: ['Everything in Family', 'Founder badge + pledge number', 'Locked price forever', 'Vote on the product roadmap'],
    cta: 'Become a founder',
    to: '/founder',
    warm: false,
  },
];

export function Pricing() {
  return (
    <div className="hl-screen parchment" style={{ overflowY: 'auto', minHeight: '100vh' }}>
      <div style={{ padding: '80px 56px 120px', maxWidth: 1080, margin: '0 auto' }}>
        <div className="hl-eyebrow dark" style={{ marginBottom: 24 }}>Pricing</div>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 48, fontWeight: 300, margin: '0 0 64px', color: 'var(--parchment-ink)' }}>
          One price for the whole family.
        </h1>

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
                <span className="hl-serif" style={{ fontSize: 40, fontWeight: 300, color: 'var(--parchment-ink)' }}>{tier.price}</span>
                <span className="hl-mono" style={{ fontSize: 11, color: 'var(--parchment-dim)', letterSpacing: '0.08em' }}>{tier.sub}</span>
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
                  to={tier.to}
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
