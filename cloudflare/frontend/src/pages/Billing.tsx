import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { billingApi } from '../services/api';
import { Frame } from '../loom/components/Frame';

const BILLING_CSS = `
.hl-billing-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 48px;
  align-content: start;
}
@media (max-width: 639px) {
  .hl-billing-grid { grid-template-columns: 1fr; gap: 32px; }
}
.hl-usage-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
}
@media (max-width: 360px) {
  .hl-usage-grid { grid-template-columns: 1fr 1fr; }
}
`;

function tierLabel(tier: string): string {
  switch (tier) {
    case 'STARTER': case 'FREE': return 'free';
    case 'FAMILY': return 'family';
    case 'FOREVER': case 'LEGACY': return 'founder';
    default: return tier.toLowerCase();
  }
}

function tierPrice(tier: string): string {
  switch (tier) {
    case 'STARTER': case 'FREE': return 'free';
    case 'FAMILY': return '$9.99';
    case 'FOREVER': case 'LEGACY': return '$240';
    default: return '—';
  }
}

export function Billing() {
  const [busy, setBusy] = useState<string | null>(null);

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then((r) => r.data).catch(() => null),
  });

  const checkout = useMutation({
    mutationFn: (cycle: 'monthly' | 'yearly') =>
      billingApi.checkout({ tier: 'FAMILY', billingCycle: cycle }).then((r) => r.data),
    onSuccess: (data: any) => { if (data?.url) window.location.href = data.url; setBusy(null); },
    onError: () => setBusy(null),
  });

  const portal = useMutation({
    mutationFn: () => billingApi.portal().then((r) => r.data),
    onSuccess: (data: any) => { if (data?.url) window.location.href = data.url; },
  });

  const currentTier = (subscription?.tier ?? 'STARTER') as string;
  const renews = subscription?.currentPeriodEnd ?? null;
  const status = subscription?.status ?? null;
  const trialEndsAt = (subscription as any)?.trial_ends_at ?? null;
  const trialDaysRemaining = (subscription as any)?.trialDaysRemaining ?? 0;
  const isTrialing = status === 'TRIALING';
  const priceLabel = tierPrice(currentTier);
  const isFounder = currentTier === 'FOREVER' || currentTier === 'LEGACY';
  const counterText = isFounder
    ? 'founder · once · lifetime'
    : isTrialing
    ? `trial · ${trialDaysRemaining}d left`
    : `${tierLabel(currentTier)} · $9.99/mo`;

  return (
    <>
      <style>{BILLING_CSS}</style>
      <Frame left="billing" right={<Link to="/settings" className="hl-link warm" style={{ fontSize: 12 }}>settings →</Link>}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 40px) 80px' }}>

          <h1 className="hl-serif hl-tight" style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 300, margin: '0 0 6px', letterSpacing: '-0.016em' }}>
            Billing
          </h1>
          <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 28 }}>
            {counterText}
          </div>

          <div className="hl-billing-grid">

            {/* ── Tier card ─────────────────────────────── */}
            <div>
              <div className="hl-eyebrow" style={{ marginBottom: 14 }}>your tier</div>
              <div style={{ padding: 'clamp(18px, 4vw, 28px) clamp(16px, 4vw, 28px)', border: '1px solid var(--rule-strong)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -1, left: 0, right: 0, height: 3, background: 'var(--warm)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.28em', textTransform: 'uppercase' }}>
                      {tierLabel(currentTier)}{isTrialing ? ' · trialing' : ''}
                    </div>
                    <div className="hl-serif" style={{ fontSize: 'clamp(32px, 8vw, 52px)', fontWeight: 300, letterSpacing: '-0.022em', marginTop: 8, lineHeight: 1 }}>
                      {priceLabel}
                      {currentTier === 'FAMILY' && (
                        <span className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-faint)', marginLeft: 4, letterSpacing: '0.1em' }}>/mo</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                      {isTrialing && trialEndsAt ? 'trial ends' : renews ? 'next charge' : 'status'}
                    </div>
                    <div className="hl-serif" style={{ fontSize: 15, color: 'var(--bone)', fontWeight: 400, marginTop: 4 }}>
                      {isTrialing && trialEndsAt
                        ? new Date(trialEndsAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                        : renews
                        ? new Date(renews).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'active'}
                    </div>
                  </div>
                </div>

                <div className="hl-usage-grid" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
                  {[['members','unlimited'],['entries','unlimited'],['voice','unlimited'],['storage','unlimited'],['letters','unlimited'],['sealed','unlimited']].map(([n, u]) => (
                    <div key={n}>
                      <div className="hl-serif" style={{ fontSize: 14, color: 'var(--bone)', fontWeight: 400 }}>{n}</div>
                      <div className="hl-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.12em', marginTop: 1 }}>of {u}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 18, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  {!isFounder && (
                    <Link to="/founder" style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
                      become a founder →
                    </Link>
                  )}
                  {currentTier === 'FAMILY' && (
                    <button type="button" onClick={() => { setBusy('FAMILY_ANNUAL'); checkout.mutate('yearly'); }} disabled={!!busy}
                      style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--bone-dim)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', padding: 0 }}>
                      {busy === 'FAMILY_ANNUAL' ? 'opening…' : 'switch to annual'}
                    </button>
                  )}
                  {currentTier !== 'STARTER' && currentTier !== 'FREE' && (
                    <button type="button" onClick={() => portal.mutate()} disabled={portal.isPending}
                      style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--bone-faint)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', padding: 0 }}>
                      {portal.isPending ? 'opening…' : 'downgrade'}
                    </button>
                  )}
                  {(currentTier === 'STARTER' || currentTier === 'FREE') && (
                    <button type="button" onClick={() => { setBusy('FAMILY'); checkout.mutate('monthly'); }} disabled={!!busy} className="hl-btn" style={{ fontSize: 11, padding: '9px 18px' }}>
                      {busy === 'FAMILY' ? 'opening…' : 'start 30-day trial →'}
                    </button>
                  )}
                </div>
              </div>

              {/* Invoices */}
              <div className="hl-eyebrow" style={{ marginTop: 32, marginBottom: 12 }}>invoices</div>
              <div style={{ borderTop: '1px solid var(--rule)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', padding: '12px 0', borderBottom: '1px solid var(--rule)', gap: 16, flexWrap: 'wrap' }}>
                  <span className="hl-serif" style={{ flex: 1, fontSize: 13, color: 'var(--bone-dim)', fontWeight: 400, minWidth: '60%' }}>
                    Receipts and full invoice history live in the Stripe portal.
                  </span>
                  <button type="button" onClick={() => portal.mutate()} disabled={portal.isPending}
                    style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', padding: 0, flexShrink: 0 }}>
                    {portal.isPending ? 'opening…' : 'open portal →'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right: payment + pledge + cancel ────────── */}
            <div>
              <div className="hl-eyebrow" style={{ marginBottom: 14 }}>payment method</div>
              <div style={{ padding: 'clamp(14px, 3vw, 20px) clamp(14px, 3vw, 20px)', border: '1px solid var(--rule-strong)' }}>
                <div className="hl-mono" style={{ fontSize: 13, color: 'var(--bone)', letterSpacing: '0.14em' }}>•••• •••• •••• ••••</div>
                <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.12em', marginTop: 6 }}>managed via stripe</div>
                <button type="button" onClick={() => portal.mutate()} disabled={portal.isPending}
                  style={{ display: 'inline-block', marginTop: 10, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', padding: 0 }}>
                  {portal.isPending ? 'opening…' : 'replace card →'}
                </button>
              </div>

              <div className="hl-eyebrow" style={{ marginTop: 32, marginBottom: 12 }}>continuity pledge</div>
              <div className="hl-serif" style={{ fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', color: 'var(--bone-dim)', fontWeight: 400 }}>
                If Heirloom ends, the successor non-profit named in our bylaws inherits the archive. The family export is always free.
              </div>
              <div className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 10 }}>
                pledge no. 0001 — jun 2026
              </div>

              <div className="hl-eyebrow" style={{ marginTop: 32, marginBottom: 12 }}>ending the subscription</div>
              <div className="hl-serif" style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--bone-dim)', fontWeight: 400 }}>
                Your thread is never deleted. It freezes in place and is downloadable for life.
              </div>
              <button type="button" onClick={() => portal.mutate()} disabled={portal.isPending}
                style={{ display: 'inline-block', marginTop: 10, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--bone-faint)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', padding: 0 }}>
                {portal.isPending ? 'opening…' : 'cancel · gentle exit →'}
              </button>
            </div>

          </div>
        </div>
      </Frame>
    </>
  );
}
