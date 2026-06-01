import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { billingApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { TapestryEdge } from '../loom/components/Frame';

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
    case 'FAMILY': return '$15';
    case 'FOREVER': case 'LEGACY': return '$999';
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
  const trialEndsAt = (subscription as any)?.trial_ends_at ?? null;
  const trialDaysRemaining = (subscription as any)?.trialDaysRemaining ?? 0;
  const isTrialing = status === 'TRIALING';
  const priceLabel = tierPrice(currentTier);
  const isFounder = currentTier === 'FOREVER' || currentTier === 'LEGACY';
  const counterText = isFounder
    ? 'founder · once · lifetime'
    : isTrialing
    ? `family · trial · ${trialDaysRemaining} days remaining`
    : `${tierLabel(currentTier)} · $15 / mo · billed monthly`;

  return (
    <div className="hl-screen" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div className="hl-topbar">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
          <Link to="/loom" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <HLogo size={18} wordmark />
          </Link>
          <span style={{ color: 'var(--bone-low)' }}>·</span>
          <span>billing</span>
        </span>
        <span className="hl-counter" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
          {counterText}
        </span>
        <Link to="/settings" className="hl-link warm">back to settings →</Link>
      </div>

      <div style={{ position: 'absolute', top: 80, bottom: 36, left: 56, right: 56, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64, alignContent: 'start' }}>

        {/* left: tier card + invoices */}
        <div>
          <div className="hl-eyebrow" style={{ marginBottom: 18 }}>your tier</div>
          <div style={{ padding: '28px 32px', border: '1px solid var(--rule-strong)', position: 'relative' }}>
            {/* 3px warm top bar — signature design detail */}
            <div style={{ position: 'absolute', top: -1, left: 0, right: 0, height: 3, background: 'var(--warm)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.32em', textTransform: 'uppercase' }}>
                  {tierLabel(currentTier)} · current{isTrialing ? ' · trialing' : ''}
                </div>
                <div className="hl-serif" style={{ fontSize: 56, fontWeight: 300, letterSpacing: '-0.022em', marginTop: 12, lineHeight: 1 }}>
                  {priceLabel}
                  {currentTier === 'FAMILY' && (
                    <span className="hl-mono" style={{ fontSize: 12, color: 'var(--bone-faint)', marginLeft: 4, letterSpacing: '0.1em' }}>/mo</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  {isTrialing && trialEndsAt ? 'trial ends' : renews ? 'next charge' : 'status'}
                </div>
                <div className="hl-serif" style={{ fontSize: 17, color: 'var(--bone)', fontWeight: 400, marginTop: 6 }}>
                  {isTrialing && trialEndsAt
                    ? new Date(trialEndsAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
                    : renews
                    ? new Date(renews).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'active'}
                </div>
              </div>
            </div>

            {/* usage grid 2×3 */}
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--rule)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
              {[
                ['members',  'unlimited'],
                ['entries',  'unlimited'],
                ['voice',    'unlimited'],
                ['storage',  'unlimited'],
                ['letters',  'unlimited'],
                ['sealed',   'unlimited'],
              ].map(([n, u]) => (
                <div key={n}>
                  <div className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)', fontWeight: 400, letterSpacing: '-0.005em' }}>{n}</div>
                  <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.12em', marginTop: 2 }}>of {u}</div>
                </div>
              ))}
            </div>

            {/* action links */}
            <div style={{ marginTop: 22, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {!isFounder && (
                <Link to="/founder" style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
                  become a founder →
                </Link>
              )}
              {currentTier === 'FAMILY' && (
                <button
                  type="button"
                  onClick={() => { setBusy('FAMILY_ANNUAL'); checkout.mutate('FAMILY'); }}
                  disabled={!!busy}
                  style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--bone-dim)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', padding: 0 }}
                >
                  {busy === 'FAMILY_ANNUAL' ? 'opening…' : 'switch to annual'}
                </button>
              )}
              {currentTier !== 'STARTER' && currentTier !== 'FREE' && (
                <button
                  type="button"
                  onClick={() => portal.mutate()}
                  disabled={portal.isPending}
                  style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--bone-faint)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', padding: 0 }}
                >
                  {portal.isPending ? 'opening…' : 'downgrade'}
                </button>
              )}
              {(currentTier === 'STARTER' || currentTier === 'FREE') && (
                <button
                  type="button"
                  onClick={() => { setBusy('FAMILY'); checkout.mutate('FAMILY'); }}
                  disabled={!!busy}
                  className="hl-btn"
                  style={{ fontSize: 11, padding: '10px 20px' }}
                >
                  {busy === 'FAMILY' ? 'opening…' : 'start 30-day trial →'}
                </button>
              )}
            </div>
          </div>

          {/* invoices */}
          <div className="hl-eyebrow" style={{ marginTop: 40, marginBottom: 14 }}>invoices</div>
          <div style={{ borderTop: '1px solid var(--rule)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', padding: '14px 0', borderBottom: '1px solid var(--rule)' }}>
              <span className="hl-serif" style={{ flex: 1, fontSize: 14, color: 'var(--bone-dim)', fontWeight: 400 }}>
                Receipts and full invoice history live in the Stripe portal.
              </span>
              <button
                type="button"
                onClick={() => portal.mutate()}
                disabled={portal.isPending}
                style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', padding: 0, flexShrink: 0, marginLeft: 24 }}
              >
                {portal.isPending ? 'opening…' : 'open portal →'}
              </button>
            </div>
          </div>
        </div>

        {/* right: payment + pledge + cancel */}
        <div>
          <div className="hl-eyebrow" style={{ marginBottom: 18 }}>payment method</div>
          <div style={{ padding: '20px 22px', border: '1px solid var(--rule-strong)' }}>
            <div className="hl-mono" style={{ fontSize: 14, color: 'var(--bone)', letterSpacing: '0.18em' }}>•••• •••• •••• ••••</div>
            <div className="hl-mono" style={{ fontSize: 10.5, color: 'var(--bone-faint)', letterSpacing: '0.12em', marginTop: 8 }}>managed via stripe</div>
            <button
              type="button"
              onClick={() => portal.mutate()}
              disabled={portal.isPending}
              style={{ display: 'inline-block', marginTop: 12, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', padding: 0 }}
            >
              {portal.isPending ? 'opening…' : 'replace card →'}
            </button>
          </div>

          <div className="hl-eyebrow" style={{ marginTop: 40, marginBottom: 16 }}>continuity pledge</div>
          <div className="hl-serif" style={{ fontSize: 14.5, lineHeight: 1.7, fontStyle: 'italic', color: 'var(--bone-dim)', fontWeight: 400 }}>
            If Heirloom ends, the successor non-profit named in our bylaws inherits the archive. The family export is always free.
          </div>
          <div className="hl-mono" style={{ fontSize: 11, color: 'var(--warm)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 14 }}>
            pledge no. 0001 — jun 2026
          </div>

          <div className="hl-eyebrow" style={{ marginTop: 40, marginBottom: 14 }}>ending the subscription</div>
          <div className="hl-serif" style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--bone-dim)', fontWeight: 400 }}>
            Your thread is never deleted. It freezes in place and is downloadable for life. You can return at any time.
          </div>
          <button
            type="button"
            onClick={() => portal.mutate()}
            disabled={portal.isPending}
            style={{ display: 'inline-block', marginTop: 12, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--bone-faint)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', padding: 0 }}
          >
            {portal.isPending ? 'opening…' : 'cancel · gentle exit →'}
          </button>
        </div>
      </div>

      <TapestryEdge nowFrac={0.92} />
    </div>
  );
}
