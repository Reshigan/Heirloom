import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { billingApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

/**
 * Billing — Loom-native rewrite.
 *
 * Three blocks:
 *   1. Current plan card with renewal date and the card on file
 *   2. Tier strip (Reader free / Family / Founder $999) with a single
 *      "current plan" marker; links go through billingApi.checkout
 *   3. Stripe portal link for managing card / receipts
 *
 * Same billingApi calls as before. The tier names match the Loom
 * Marketing copy: free / Family / Founder.
 */

const TIERS: {
  key: string;
  name: string;
  price: string;
  sub: string;
  bullets: string[];
  cta: string;
  to?: string;
}[] = [
  {
    key: 'STARTER',
    name: 'Reader',
    price: 'free',
    sub: 'forever',
    bullets: [
      'read & contribute to threads you\'re invited to',
      'no new threads, no time-locks',
      'everything still encrypted in browser',
    ],
    cta: 'current plan',
  },
  {
    key: 'FAMILY',
    name: 'Family',
    price: '$15',
    sub: '/ month',
    bullets: [
      'start your own thread',
      'set time-locks, designate successors',
      'up to 6 keepers, one weft',
    ],
    cta: 'choose family',
  },
  {
    key: 'FOREVER',
    name: 'Founder · first 100',
    price: '$999',
    sub: 'lifetime',
    bullets: [
      'lifetime Family-tier for your bloodline',
      'name engraved in the continuity record',
      'funds the successor non-profit',
    ],
    cta: 'become a founder',
    to: '/founder',
  },
];

export function Billing() {
  const [busy, setBusy] = useState<string | null>(null);

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then((r) => r.data).catch(() => null),
  });

  const checkout = useMutation({
    mutationFn: (tier: string) =>
      billingApi.checkout({ tier, billingCycle: 'monthly' }).then((r) => r.data),
    onSuccess: (data: any) => {
      if (data?.url) window.location.href = data.url;
      setBusy(null);
    },
    onError: () => setBusy(null),
  });

  const portal = useMutation({
    mutationFn: () => billingApi.portal().then((r) => r.data),
    onSuccess: (data: any) => {
      if (data?.url) window.location.href = data.url;
    },
  });

  const currentTier = (subscription?.tier ?? 'STARTER') as string;
  const renews = subscription?.currentPeriodEnd ?? null;
  const status = subscription?.status ?? null;

  return (
    <AppFrame>
      <header style={{ marginBottom: 40 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
          Billing
        </p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          The cost of being kept.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 640, lineHeight: 1.6 }}
        >
          A thread costs almost nothing. A loom that lasts fifty years costs a little more.
        </p>
      </header>

      {/* Current plan card */}
      <section
        style={{
          marginBottom: 56,
          padding: '28px 36px',
          border: '1px solid var(--loom-rule-warm)',
          background: 'rgba(176,122,74,0.04)',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p className="loom-eyebrow" style={{ fontSize: 10, marginBottom: 8, color: 'var(--loom-warm)' }}>
            current plan
          </p>
          <p
            className="loom-serif"
            style={{ fontSize: 28, fontWeight: 300, color: 'var(--loom-bone)', margin: 0, fontStyle: 'italic' }}
          >
            {labelFor(currentTier)}
            {status && status !== 'ACTIVE' ? (
              <span
                className="loom-mono"
                style={{ marginLeft: 14, fontSize: 11, color: 'var(--loom-bone-faint)', fontStyle: 'normal' }}
              >
                · {status.toLowerCase()}
              </span>
            ) : null}
          </p>
        </div>
        <div className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-dim)', letterSpacing: '0.04em', textAlign: 'right' }}>
          {renews ? <p style={{ margin: 0 }}>renews {new Date(renews).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p> : null}
          <button
            type="button"
            onClick={() => portal.mutate()}
            disabled={portal.isPending}
            style={{
              marginTop: 8,
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--loom-warm)',
            }}
          >
            {portal.isPending ? 'opening…' : 'manage card →'}
          </button>
        </div>
      </section>

      {/* Tier strip */}
      <section style={{ marginBottom: 56 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 18 }}>
          Plans
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'var(--loom-rule)',
            border: '1px solid var(--loom-rule)',
          }}
        >
          {TIERS.map((t) => {
            const isCurrent = t.key === currentTier;
            const featured = t.key === 'FAMILY' && !isCurrent;
            return (
              <div
                key={t.key}
                style={{
                  background: featured ? 'var(--loom-ink-card)' : 'var(--loom-ink)',
                  padding: '32px 28px',
                  display: 'grid',
                  gridTemplateRows: 'auto auto auto 1fr auto',
                  gap: 14,
                  minHeight: 360,
                }}
              >
                <p className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--loom-warm)', textTransform: 'uppercase', margin: 0 }}>
                  {t.name}
                </p>
                <p className="loom-serif" style={{ fontSize: 44, fontWeight: 200, color: 'var(--loom-bone)', margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {t.price}
                  <span className="loom-mono" style={{ marginLeft: 8, fontSize: 12, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}>
                    {t.sub}
                  </span>
                </p>
                <hr className="loom-hairline" style={{ margin: '4px 0' }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                  {t.bullets.map((b) => (
                    <li
                      key={b}
                      style={{
                        position: 'relative',
                        paddingLeft: 16,
                        fontFamily: "'Newsreader', serif",
                        fontSize: 14,
                        color: 'var(--loom-bone-dim)',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ position: 'absolute', left: 4, top: -2, color: 'var(--loom-warm)', fontSize: 16 }}>·</span>
                      {b}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <p className="loom-mono" style={{ margin: 0, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--loom-warm)' }}>
                    ∞ &nbsp; current plan
                  </p>
                ) : t.to ? (
                  <Link to={t.to} className="loom-btn" style={{ textDecoration: 'none', textAlign: 'center', width: '100%' }}>
                    {t.cta}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setBusy(t.key);
                      checkout.mutate(t.key);
                    }}
                    disabled={busy === t.key}
                    className={featured ? 'loom-btn' : 'loom-btn-ghost'}
                    style={{ width: '100%' }}
                  >
                    {busy === t.key ? 'opening…' : t.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <p
        className="loom-mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--loom-bone-faint)',
          textAlign: 'center',
          margin: 0,
        }}
      >
        ∞ &nbsp; receipts and card management open in a Stripe portal · invoices live there
      </p>
    </AppFrame>
  );
}

function labelFor(tier: string): string {
  switch (tier) {
    case 'STARTER':
    case 'FREE':
      return 'Reader · free';
    case 'ESSENTIAL':
      return 'Essential';
    case 'FAMILY':
      return 'Family · $15/month';
    case 'FOREVER':
    case 'LEGACY':
      return 'Founder · lifetime';
    default:
      return tier;
  }
}
