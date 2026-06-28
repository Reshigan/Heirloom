import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { billingApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { planLabel, isPaidTier, isFounderTier, isFreeTier, isDeepTier, PLAN_LIMITS, PLAN_PRICE } from '../lib/plans';

const ROW: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 20,
  padding: '14px 0',
  borderBottom: '1px solid var(--rule)',
  flexWrap: 'wrap',
};

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontSize: 16,
  fontWeight: 400,
  color: 'var(--bone)',
  lineHeight: 1.4,
};

const VALUE_STATIC: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 12,
  letterSpacing: '0.14em',
  color: 'var(--bone-dim)',
  whiteSpace: 'nowrap',
  textAlign: 'right',
};

const ACTION: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--gold-text)',
  background: 'transparent',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const ACTION_QUIET: React.CSSProperties = {
  ...ACTION,
  color: 'var(--bone-dim)',
};

const NOTE: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontSize: 14,
  lineHeight: 1.7,
  color: 'var(--bone-dim)',
  fontWeight: 400,
  margin: '4px 0 0',
};

export function Billing() {
  const [busy, setBusy] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  // Annual-only regions: the worker rejects monthly checkout there. Detect
  // once on mount so the upgrade CTAs pick the right cycle and never 400.
  const [annualOnly, setAnnualOnly] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    billingApi.getPricing().then((r: any) => {
      if (controller.signal.aborted) return;
      const d = r.data ?? r;
      if (d?.isAnnualOnly) setAnnualOnly(true);
    }).catch(() => {});
    return () => controller.abort();
  }, []);

  const { data: subscription, isError: subscriptionError } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then((r) => r.data),
  });

  const checkout = useMutation({
    mutationFn: (vars: { tier: 'FAMILY' | 'DEEP'; cycle: 'monthly' | 'yearly' }) =>
      billingApi.checkout({ tier: vars.tier, billingCycle: vars.cycle }).then((r) => r.data),
    onSuccess: (data: any) => {
      if (data?.url) window.location.href = data.url;
      setBusy(null);
    },
    onError: (err: any) => {
      setBusy(null);
      setBillingError(err?.response?.data?.error ?? 'could not start checkout');
    },
  });

  const portal = useMutation({
    mutationFn: () => billingApi.portal().then((r) => r.data),
    onSuccess: (data: any) => { if (data?.url) window.location.href = data.url; },
    onError: (err: any) => setBillingError(err?.response?.data?.error ?? 'could not open billing portal'),
  });

  const currentTier = (subscription?.tier ?? 'STARTER') as string;
  const renews = subscription?.currentPeriodEnd ?? null;
  const status = subscription?.status ?? null;
  const trialEndsAt = (subscription as any)?.trial_ends_at ?? null;
  const trialDaysRemaining = (subscription as any)?.trialDaysRemaining ?? 0;
  const isTrialing = status === 'TRIALING';
  const priceLabel = isFounderTier(currentTier)
    ? 'lifetime'
    : isDeepTier(currentTier)
    ? PLAN_PRICE.DEEP.monthly
    : isFreeTier(currentTier)
    ? 'free'
    : PLAN_PRICE.FAMILY.monthly;
  const isFounder = isFounderTier(currentTier);
  const counterText = isFounder
    ? 'founder · once · lifetime'
    : isDeepTier(currentTier)
    ? `deep · ${PLAN_PRICE.DEEP.monthly}/mo`
    : isTrialing
    ? `trial · ${trialDaysRemaining}d left`
    : currentTier === 'FAMILY'
    ? `family · ${PLAN_PRICE.FAMILY.monthly}/mo`
    : 'free plan';

  const dateLabel = isTrialing && trialEndsAt ? 'trial ends' : renews ? 'next charge' : 'status';
  const dateValue = isTrialing && trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : renews
    ? new Date(renews).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : 'active';

  const limits = PLAN_LIMITS[currentTier?.toUpperCase()] ?? PLAN_LIMITS['STARTER'];

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom' }, { label: 'billing' }]} />}
    >
      <style>{`
        .billing-action:focus-visible { outline: 2px solid var(--warm); outline-offset: 2px; }
      `}</style>
      <div style={{ maxWidth: '46rem', margin: '0 auto', padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)' }}>

        {subscriptionError && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--copper-label)', letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            could not load subscription — try refreshing
          </p>
        )}
        {billingError && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--copper-label)', letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            {billingError}
          </p>
        )}

        <CosmicHeader
          eyebrow={counterText}
          title="Billing"
        />

        {/* ── Your plan ─────────────────────────────── */}
        <SectionLabel>your plan</SectionLabel>
        <div>
          <div style={ROW}>
            <span style={LABEL}>
              {planLabel(currentTier)}{isTrialing ? ' · trialing' : ''}
            </span>
            <span style={VALUE_STATIC}>
              {priceLabel}{(currentTier === 'FAMILY' || currentTier === 'DEEP') && !isTrialing ? ' / mo' : ''}
            </span>
          </div>
          <div style={ROW}>
            <span style={LABEL}>{dateLabel}</span>
            <span style={VALUE_STATIC}>{dateValue}</span>
          </div>

          {/* Plan actions */}
          {currentTier === 'FAMILY' && (
            <div style={ROW}>
              <span style={LABEL}>annual billing</span>
              <button type="button" className="billing-action" onClick={() => { setBusy('FAMILY_ANNUAL'); checkout.mutate({ tier: 'FAMILY', cycle: 'yearly' }); }} disabled={!!busy} style={{ ...ACTION, ...(busy ? { opacity: 0.5, cursor: 'default' } : null) }}>
                {busy === 'FAMILY_ANNUAL' ? 'opening…' : 'switch to annual →'}
              </button>
            </div>
          )}
          {currentTier === 'FAMILY' && (
            <div style={ROW}>
              <span style={LABEL}>upgrade to deep — unlimited bloodline</span>
              <button type="button" className="billing-action" onClick={() => { setBusy('DEEP'); checkout.mutate({ tier: 'DEEP', cycle: annualOnly ? 'yearly' : 'monthly' }); }} disabled={!!busy} style={{ ...ACTION, ...(busy ? { opacity: 0.5, cursor: 'default' } : null) }}>
                {busy === 'DEEP' ? 'opening…' : (annualOnly ? 'go Deep · annual →' : 'go Deep →')}
              </button>
            </div>
          )}
          {isFreeTier(currentTier) && (
            <div style={ROW}>
              <span style={LABEL}>upgrade to family</span>
              <button type="button" className="billing-action" onClick={() => { setBusy('FAMILY'); checkout.mutate({ tier: 'FAMILY', cycle: 'monthly' }); }} disabled={!!busy} style={{ ...ACTION, ...(busy ? { opacity: 0.5, cursor: 'default' } : null) }}>
                {busy === 'FAMILY' ? 'opening…' : 'start 30-day trial →'}
              </button>
            </div>
          )}
          {isPaidTier(currentTier) && (
            <div style={ROW}>
              <span style={LABEL}>change plan</span>
              <button type="button" className="billing-action" onClick={() => portal.mutate()} disabled={portal.isPending} style={{ ...ACTION_QUIET, ...(portal.isPending ? { opacity: 0.5, cursor: 'default' } : null) }}>
                {portal.isPending ? 'opening…' : 'downgrade →'}
              </button>
            </div>
          )}
        </div>

        {/* ── What's included ───────────────────────── */}
        <SectionLabel>what's included</SectionLabel>
        <div>
          {limits.map(([n, u]) => (
            <div key={n} style={ROW}>
              <span style={LABEL}>{n}</span>
              <span style={VALUE_STATIC}>{u}</span>
            </div>
          ))}
        </div>

        {/* ── Payment method ────────────────────────── */}
        <SectionLabel>payment method</SectionLabel>
        <div>
          <div style={ROW}>
            <span style={{ ...LABEL, fontFamily: 'var(--mono)', fontSize: 14, letterSpacing: '0.14em', color: 'var(--bone-dim)' }}>
              card stored with Stripe
            </span>
            <span style={VALUE_STATIC}>managed via stripe</span>
          </div>
          <div style={ROW}>
            <span style={LABEL}>card on file</span>
            <button type="button" className="billing-action" onClick={() => portal.mutate()} disabled={portal.isPending} style={{ ...ACTION, ...(portal.isPending ? { opacity: 0.5, cursor: 'default' } : null) }}>
              {portal.isPending ? 'opening…' : 'replace card →'}
            </button>
          </div>
        </div>

        {/* ── Invoices ──────────────────────────────── */}
        <SectionLabel>invoices</SectionLabel>
        <div>
          <div style={ROW}>
            <span style={LABEL}>Receipts and full invoice history live in the Stripe portal.</span>
            <button type="button" className="billing-action" onClick={() => portal.mutate()} disabled={portal.isPending} style={{ ...ACTION, ...(portal.isPending ? { opacity: 0.5, cursor: 'default' } : null) }}>
              {portal.isPending ? 'opening…' : 'open portal →'}
            </button>
          </div>
        </div>

        {/* ── Continuity pledge ─────────────────────── */}
        <SectionLabel>continuity pledge</SectionLabel>
        <p style={{ ...NOTE, fontStyle: 'italic' }}>
          If Heirloom ends, our bylaws commit the archive to a named successor non-profit and the export tooling is open-sourced on day one. The family export is always free.
        </p>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--copper-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 12 }}>
          pledge no. 0001
        </div>

        {/* ── Ending the subscription ───────────────── */}
        <SectionLabel>ending the subscription</SectionLabel>
        <p style={NOTE}>
          Your Deep is never deleted. It freezes in place and is downloadable for life.
        </p>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--rule)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="billing-action" onClick={() => portal.mutate()} disabled={portal.isPending} style={{ ...ACTION_QUIET, ...(portal.isPending ? { opacity: 0.5, cursor: 'default' } : null) }}>
            {portal.isPending ? 'opening…' : 'cancel · gentle exit →'}
          </button>
        </div>

        <div style={{ marginTop: 64 }}>
          <WaxSeal />
        </div>
      </div>
    </ClothShell>
  );
}
