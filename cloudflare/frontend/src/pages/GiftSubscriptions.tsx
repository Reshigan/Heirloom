import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { CosmicHeader, SectionLabel, WaxSeal, EntryRow } from '../loom/cosmic/CosmicUI';
import { giftSubscriptionsApi, settingsApi } from '../services/api';
import { PLAN_FEATURES } from '../lib/plans';

// ── Constants ─────────────────────────────────────────────────────────────────
const OCCASION_STYLES = [
  { id: 'classic',     name: 'classic'     },
  { id: 'elegant',     name: 'elegant'     },
  { id: 'festive',     name: 'festive'     },
  { id: 'birthday',    name: 'birthday'    },
  { id: 'anniversary', name: 'anniversary' },
];

const STEP_LABELS = ['plan', 'recipient', 'your details', 'review'];

// Bullet features per tier — single source of truth is lib/plans.ts so the gift
// flow can never drift from the canonical Pricing page (storage, members, tier).
const TIER_BULLETS = PLAN_FEATURES;

// ── GiftSubscriptions ─────────────────────────────────────────────────────────
export function GiftSubscriptions() {
  const queryClient = useQueryClient();
  const [step, setStep]               = useState(1);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('classic');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [formData, setFormData]       = useState({
    recipientName:  '',
    recipientEmail: '',
    purchaserName:  '',
    purchaserEmail: '',
    personalMessage: '',
    scheduledDate:  '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [giftResult, setGiftResult]   = useState<any>(null);

  // ── API queries ──────────────────────────────────────────────────────────────
  // The buyer's preferred currency drives localized gift pricing (e.g. INR has a
  // FAMILY monthly price); fall back to USD until the profile resolves.
  const { data: profileData } = useQuery({
    queryKey: ['settings', 'profile'],
    queryFn: () => settingsApi.getProfile().then(r => r.data),
  });
  const currency: string = (profileData as any)?.preferredCurrency || 'USD';

  const { data: pricing } = useQuery({
    queryKey: ['giftPricing', currency],
    queryFn: () => giftSubscriptionsApi.getPricing(currency).then(r => r.data),
  });

  const { data: purchasedGifts } = useQuery({
    queryKey: ['purchasedGifts'],
    queryFn: () => giftSubscriptionsApi.getPurchased().then(r => r.data),
  });

  const purchaseMutation = useMutation({
    mutationFn: () =>
      giftSubscriptionsApi.purchase({
        purchaserEmail:  formData.purchaserEmail,
        purchaserName:   formData.purchaserName,
        recipientEmail:  formData.recipientEmail,
        recipientName:   formData.recipientName,
        tier:            selectedTier!,
        billingCycle:    selectedTier === 'LEGACY'
          ? 'lifetime'
          : billingPeriod === 'monthly' ? 'monthly' : 'yearly',
        recipientMessage: formData.personalMessage,
        currency,
        style:           selectedStyle,
      }),
    onSuccess: (response) => {
      const data = response.data;
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setGiftResult(data);
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['purchasedGifts'] });
    },
  });

  // ── Derived ──────────────────────────────────────────────────────────────────
  // Fallback mirrors the worker /gift pricing (canonical list $6.99 / $69 / $249,
  // 10% gifter discount) so a slow API never flashes a wrong price. STARTER is
  // free and not giftable; LEGACY brands as "Founder".
  const tiers = pricing?.tiers || [
    {
      id: 'STARTER', name: 'Free', description: 'Anyone can begin a thread — no gift needed', storage: '500 MB', free: true,
      monthly: { amount: 0, display: 'Free' },
    },
    {
      id: 'FAMILY', name: 'Family', description: 'The full thread — for the whole bloodline', storage: '50 GB', popular: true,
      monthly: { amount: 6.29, display: '$6.29', listAmount: 6.99, listDisplay: '$6.99', giftDiscount: '10% off' },
      yearly:  { amount: 62.1, display: '$62.10', listAmount: 69, listDisplay: '$69.00', giftDiscount: '10% off', savings: '2 months free' },
    },
    {
      id: 'LEGACY', name: 'Founder', description: 'Lifetime, for every generation — paid once', storage: '500 GB',
      lifetime: { amount: 224.1, display: '$224.10', listAmount: 249, listDisplay: '$249.00', giftDiscount: '10% off', note: 'once · lifetime' },
    },
  ];

  // Get pricing info for selected period. LEGACY is always lifetime (ignores
  // the monthly/annual toggle); FAMILY follows the toggle; STARTER is the free
  // $0 cycle. Some currencies (e.g. INR) have no monthly — fall back gracefully.
  const tierPeriodPrice = (tier: any) => {
    if (tier.id === 'LEGACY') return tier.lifetime;
    if (tier.id === 'STARTER') return tier.monthly ?? tier.yearly;
    return billingPeriod === 'monthly'
      ? (tier.monthly ?? tier.yearly)
      : (tier.yearly ?? tier.monthly);
  };

  const handleNext = () => { if (step < 4) setStep(step + 1); };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedTier === 'FAMILY' || selectedTier === 'LEGACY';
      case 2: return !!(formData.recipientName && formData.recipientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail));
      case 3: return !!(formData.purchaserName && formData.purchaserEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.purchaserEmail));
      default: return true;
    }
  };

  const selectedTierData = tiers.find((t: any) => t.id === selectedTier);
  const selectedPricing  = selectedTierData ? tierPeriodPrice(selectedTierData) : null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom' }, { label: 'gift' }]} />}
    >
      <div style={{ padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)', maxWidth: 'var(--page-max-reading)', margin: '0 auto' }}>

        {/* Page header */}
        <CosmicHeader
          eyebrow={`step ${String(step).padStart(2, '0')} · gift a thread`}
          title={<span style={{ whiteSpace: 'pre-line' }}>{'Give the gift of\na thousand years.'}</span>}
        />
        <div style={{ height: 8 }} />

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 48 }}>
          {STEP_LABELS.map((label, i) => {
            const s = i + 1;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="hl-mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color:
                      s === step
                        ? 'var(--warm)'
                        : s < step
                        ? 'var(--bone-dim)'
                        : 'var(--bone-faint)',
                  }}
                >
                  {String(s).padStart(2, '0')} {label}
                </span>
                {s < 4 && (
                  <span
                    style={{
                      width: 20,
                      height: 1,
                      background:
                        s < step ? 'var(--warm)' : 'var(--rule)',
                      display: 'inline-block',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Choose Plan ── */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 4 }}>
              <SectionLabel>choose a plan</SectionLabel>

              {/* Billing period toggle */}
              <div style={{ display: 'flex' }}>
                {(['monthly', 'annual'] as const).map((p, i) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBillingPeriod(p)}
                    className="hl-mono"
                    style={{
                      background: billingPeriod === p ? 'var(--ink)' : 'transparent',
                      color: billingPeriod === p ? 'var(--warm)' : 'var(--bone-dim)',
                      border: '1px solid var(--rule)',
                      borderLeft: i === 0 ? '1px solid var(--rule)' : 'none',
                      padding: '6px 16px',
                      fontSize: 9,
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      minHeight: 44,
                      position: 'relative',
                    }}
                  >
                    {p}
                    {p === 'annual' && (
                      <span style={{
                        position: 'absolute',
                        top: -10,
                        right: -2,
                        background: 'var(--rule)',
                        color: 'var(--bone-dim)',
                        fontFamily: 'var(--mono)',
                        fontSize: 8,
                        letterSpacing: '0.12em',
                        padding: '1px 5px',
                        textTransform: 'uppercase',
                        borderRadius: 0,
                      }}>
                        2 months free
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan ledger — each tier is a quiet row */}
            <div style={{ marginBottom: 48 }}>
              {tiers.map((tier: any) => {
                const isFree    = tier.id === 'STARTER';
                const selected  = selectedTier === tier.id;
                const bullets   = TIER_BULLETS[tier.id] ?? [];
                const pp        = tierPeriodPrice(tier);

                const forLine =
                  tier.id === 'STARTER'
                    ? 'for a single thread'
                    : tier.id === 'FAMILY'
                    ? 'for the whole bloodline'
                    : 'for every generation';

                const subLabel = isFree
                  ? 'free, forever'
                  : tier.id === 'LEGACY'
                  ? 'once · lifetime'
                  : billingPeriod === 'monthly'
                  ? 'per month'
                  : 'per year · 2 months free';

                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => { if (!isFree) setSelectedTier(tier.id); }}
                    aria-pressed={selected}
                    style={{
                      display:        'flex',
                      alignItems:     'baseline',
                      gap:            20,
                      width:          '100%',
                      textAlign:      'left',
                      padding:        '20px 0',
                      paddingLeft:    16,
                      background:     'none',
                      borderWidth:    0,
                      borderLeft:     selected ? '3px solid var(--warm)' : '3px solid transparent',
                      borderBottom:   '1px solid var(--rule)',
                      opacity:        isFree ? 0.55 : 1,
                      cursor:         isFree ? 'default' : 'pointer',
                      transition:     'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    {/* Left: name + for-line + bullets */}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                        <span
                          className="hl-serif"
                          style={{ fontSize: 22, fontWeight: 400, lineHeight: 1.2, color: 'var(--bone)' }}
                        >
                          {tier.name}
                        </span>
                        <span
                          className="hl-mono"
                          style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: selected ? 'var(--warm)' : 'var(--bone-faint)' }}
                        >
                          {isFree ? 'free' : selected ? 'selected' : 'select'}
                        </span>
                      </span>
                      <span
                        className="hl-serif"
                        style={{ display: 'block', fontStyle: 'italic', fontSize: 14, color: 'var(--bone-dim)', marginTop: 4 }}
                      >
                        {forLine}
                      </span>
                      {/* Bullets — quiet mono line */}
                      <span
                        className="hl-mono"
                        style={{ display: 'block', fontSize: 10, letterSpacing: '0.06em', color: 'var(--bone-faint)', marginTop: 8, lineHeight: 1.7 }}
                      >
                        {bullets.join(' · ')}
                      </span>
                      {isFree && (
                        <span
                          className="hl-serif"
                          style={{ display: 'block', fontStyle: 'italic', fontSize: 12, color: 'var(--bone-faint)', marginTop: 6 }}
                        >
                          anyone can begin free — no gift needed
                        </span>
                      )}
                    </span>

                    {/* Right: price cluster */}
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: '0 0 auto', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10 }}>
                        <span
                          style={{ fontFamily: 'var(--serif-display)', fontSize: 30, fontWeight: 500, lineHeight: 1, color: isFree ? 'var(--bone-dim)' : 'var(--warm)' }}
                        >
                          {pp?.display ?? `$${pp?.amount ?? 0}`}
                        </span>
                        {!isFree && pp?.listDisplay && (
                          <span
                            className="hl-mono"
                            style={{ fontSize: 12, letterSpacing: '0.02em', color: 'var(--bone-faint)', textDecoration: 'line-through' }}
                          >
                            {pp.listDisplay}
                          </span>
                        )}
                      </span>
                      <span
                        className="hl-mono"
                        style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-dim)', marginTop: 6 }}
                      >
                        {subLabel}
                      </span>
                      {!isFree && pp?.giftDiscount && (
                        <span
                          className="hl-mono"
                          style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)', marginTop: 4 }}
                        >
                          10% gift discount
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Occasion */}
            <SectionLabel>occasion</SectionLabel>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {OCCASION_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style.id)}
                  className="hl-mono"
                  style={{
                    background:    'transparent',
                    border:
                      selectedStyle === style.id
                        ? '1px solid var(--warm)'
                        : '1px solid var(--rule)',
                    padding:       '7px 14px',
                    minHeight:     44,
                    fontSize:      10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color:
                      selectedStyle === style.id
                        ? 'var(--warm)'
                        : 'var(--bone-dim)',
                    cursor: 'pointer',
                  }}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Recipient ── */}
        {step === 2 && (
          <div style={{ maxWidth: 520 }}>
            <SectionLabel>who's receiving this?</SectionLabel>
            <div style={{ display: 'grid', gap: 28, marginTop: 28 }}>
              <div>
                <label
                  className="hl-mono"
                  style={{
                    display:       'block',
                    fontSize:      10,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color:         'var(--bone-dim)',
                    marginBottom:  8,
                  }}
                >
                  recipient's name
                </label>
                <input
                  type="text"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="recipient name"
                />
              </div>
              <div>
                <label
                  className="hl-mono"
                  style={{
                    display:       'block',
                    fontSize:      10,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color:         'var(--bone-dim)',
                    marginBottom:  8,
                  }}
                >
                  recipient's email
                </label>
                <input
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  placeholder="recipient@example.com"
                />
              </div>
              <div>
                <label
                  className="hl-mono"
                  style={{
                    display:       'block',
                    fontSize:      10,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color:         'var(--bone-dim)',
                    marginBottom:  8,
                  }}
                >
                  a note (optional)
                </label>
                <textarea
                  value={formData.personalMessage}
                  onChange={(e) => setFormData({ ...formData, personalMessage: e.target.value })}
                  placeholder="a few quiet words…"
                  style={{ resize: 'none', minHeight: 88 }}
                />
              </div>
              <div>
                <label
                  htmlFor="gift-delivery-date"
                  className="hl-mono"
                  style={{
                    display:       'block',
                    fontSize:      10,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color:         'var(--bone-dim)',
                    marginBottom:  8,
                  }}
                >
                  schedule delivery (optional)
                </label>
                <input
                  id="gift-delivery-date"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p
                  className="hl-mono"
                  style={{
                    fontSize:      10,
                    color:         'var(--bone-faint)',
                    marginTop:     6,
                  }}
                >
                  leave empty to send immediately
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Your Details ── */}
        {step === 3 && (
          <div style={{ maxWidth: 520 }}>
            <SectionLabel>your details</SectionLabel>
            <div style={{ display: 'grid', gap: 28, marginTop: 28 }}>
              <div>
                <label
                  className="hl-mono"
                  style={{
                    display:       'block',
                    fontSize:      10,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color:         'var(--bone-dim)',
                    marginBottom:  8,
                  }}
                >
                  your name
                </label>
                <input
                  type="text"
                  value={formData.purchaserName}
                  onChange={(e) => setFormData({ ...formData, purchaserName: e.target.value })}
                  placeholder="your name"
                />
              </div>
              <div>
                <label
                  className="hl-mono"
                  style={{
                    display:       'block',
                    fontSize:      10,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color:         'var(--bone-dim)',
                    marginBottom:  8,
                  }}
                >
                  your email
                </label>
                <input
                  type="email"
                  value={formData.purchaserEmail}
                  onChange={(e) => setFormData({ ...formData, purchaserEmail: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div style={{ maxWidth: 520 }}>
            <SectionLabel>review your gift</SectionLabel>
            <div
              style={{
                borderTop:    '1px solid var(--rule)',
                borderBottom: '1px solid var(--rule)',
                padding:      '24px 0',
                margin:       '28px 0 24px',
              }}
            >
              <div
                style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  alignItems:     'baseline',
                  paddingBottom:  16,
                  marginBottom:   16,
                  borderBottom:   '1px solid var(--rule)',
                }}
              >
                <div>
                  <p
                    className="hl-serif"
                    style={{
                      fontStyle:   'italic',
                      fontSize:    16,
                      margin:      '0 0 2px',
                      color:       'var(--bone)',
                    }}
                  >
                    {formData.recipientName}
                  </p>
                  <p
                    className="hl-mono"
                    style={{ fontSize: 10, color: 'var(--bone-faint)', margin: 0 }}
                  >
                    {formData.recipientEmail}
                  </p>
                </div>
                <span
                  className="hl-mono"
                  style={{
                    fontSize:      9,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color:         'var(--warm)',
                  }}
                >
                  {OCCASION_STYLES.find(s => s.id === selectedStyle)?.name}
                </span>
              </div>

              <div
                style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  padding:        '8px 0',
                  borderBottom:   '1px solid var(--rule)',
                }}
              >
                <span
                  className="hl-mono"
                  style={{
                    fontSize:      10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color:         'var(--bone-faint)',
                  }}
                >
                  plan
                </span>
                <span
                  className="hl-serif"
                  style={{ fontSize: 14, color: 'var(--bone-dim)', fontStyle: 'italic' }}
                >
                  {selectedTierData?.name} · {selectedTier === 'LEGACY'
                    ? 'lifetime'
                    : billingPeriod === 'monthly' ? '1 month' : '1 year'}
                </span>
              </div>

              <div
                style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  padding:        '12px 0 0',
                }}
              >
                <span
                  className="hl-mono"
                  style={{
                    fontSize:      10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color:         'var(--bone-faint)',
                  }}
                >
                  total
                </span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
                    <span
                      className="hl-serif"
                      style={{ fontSize: 20, color: 'var(--warm)' }}
                    >
                      {selectedPricing ? (selectedPricing.display ?? `$${selectedPricing.amount}`) : '—'}
                    </span>
                    {selectedPricing?.listDisplay && (
                      <span
                        className="hl-mono"
                        style={{ fontSize: 11, color: 'var(--bone-faint)', textDecoration: 'line-through' }}
                      >
                        {selectedPricing.listDisplay}
                      </span>
                    )}
                  </span>
                  {selectedPricing?.giftDiscount && (
                    <span className="hl-mono" style={{ fontSize: 9, color: 'var(--warm)', display: 'block', letterSpacing: '0.18em' }}>
                      10% gift discount
                    </span>
                  )}
                  {selectedPricing?.savings && (
                    <span className="hl-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', display: 'block', letterSpacing: '0.18em' }}>
                      {selectedPricing.savings}
                    </span>
                  )}
                </div>
              </div>

              {formData.personalMessage && (
                <div
                  style={{
                    marginTop:  16,
                    paddingTop: 16,
                    borderTop:  '1px solid var(--rule)',
                  }}
                >
                  <p
                    className="hl-mono"
                    style={{
                      fontSize:      9,
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color:         'var(--bone-faint)',
                      marginBottom:  8,
                    }}
                  >
                    your note
                  </p>
                  <p
                    className="hl-serif"
                    style={{
                      fontStyle: 'italic',
                      color:     'var(--bone-dim)',
                      fontSize:  14,
                      margin:    0,
                    }}
                  >
                    &ldquo;{formData.personalMessage}&rdquo;
                  </p>
                </div>
              )}

              {formData.scheduledDate && (
                <p
                  className="hl-mono"
                  style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 12 }}
                >
                  scheduled for {new Date(formData.scheduledDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {purchaseMutation.isError && (
              <p
                role="alert"
                className="hl-mono"
                style={{
                  fontSize:      11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color:         'var(--warm)',
                  marginBottom:  16,
                }}
              >
                purchase failed · please try again
              </p>
            )}

            <style>{`.gift-submit-cta:focus-visible { outline: 2px solid var(--warm); outline-offset: 2px; }`}</style>
            <button
              type="button"
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
              className="hl-mono gift-submit-cta"
              style={{
                background:    'transparent',
                color:         'var(--warm)',
                border:        '1px solid var(--warm)',
                borderRadius:  0,
                padding:       '13px 28px',
                minHeight:     44,
                fontSize:      11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                opacity:       purchaseMutation.isPending ? 0.5 : 1,
                cursor:        purchaseMutation.isPending ? 'default' : 'pointer',
                transition:    'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {purchaseMutation.isPending ? 'processing…' : 'complete the gift →'}
            </button>
          </div>
        )}

        {/* ── Navigation ── */}
        <div
          style={{
            display:        'flex',
            justifyContent: 'space-between',
            marginTop:      40,
            paddingTop:     28,
            borderTop:      '1px solid var(--rule)',
            maxWidth:       step === 1 ? 'none' : 520,
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="hl-btn ghost"
            style={{
              opacity:     step === 1 ? 0 : 1,
              pointerEvents: step === 1 ? 'none' : 'auto',
              color:       'var(--bone)',
              borderColor: 'var(--rule)',
            }}
          >
            back
          </button>
          {step < 4 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="hl-btn"
              style={{ opacity: !canProceed() ? 0.45 : 1 }}
            >
              continue
            </button>
          )}
        </div>

        {/* ── Gift History ── */}
        {purchasedGifts && purchasedGifts.length > 0 && (
          <div style={{ maxWidth: 640, marginTop: 72 }}>
            <div
              style={{
                fontFamily:    'var(--mono)',
                fontSize:      10,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color:         'var(--bone-faint)',
                paddingTop:    32,
                borderTop:     '1px solid var(--rule)',
                marginBottom:  4,
              }}
            >
              {purchasedGifts.length} {purchasedGifts.length === 1 ? 'gift' : 'gifts'} given
            </div>
            <SectionLabel>previous gifts</SectionLabel>
            <div style={{ display: 'grid', marginTop: 8 }}>
              {purchasedGifts.map((gift: any) => (
                <EntryRow
                  key={gift.id}
                  title={gift.recipient_name}
                  sub={`${gift.tier} plan`}
                  subFont="sans"
                  subColor="var(--bone-dim)"
                  year={new Date(gift.created_at).toLocaleDateString()}
                  author={gift.status}
                />
              ))}
            </div>
          </div>
        )}

        {/* The ∞ rests at the foot of the ledger */}
        <div style={{ marginTop: 80 }}>
          <WaxSeal />
        </div>
      </div>

      {/* ── Success overlay ── */}
      {showSuccess && giftResult && (
        <div
          style={{
            position:    'fixed',
            inset:       0,
            zIndex:      50,
            display:     'grid',
            placeItems:  'center',
            background:  'color-mix(in srgb, var(--ink) 88%, transparent)',
            padding:     '24px',
          }}
          role="status"
        >
          <div
            style={{
              padding:    '48px',
              maxWidth:   'var(--page-max-focus)',
              width:      '100%',
              textAlign:  'center',
            }}
          >
            {/* ∞ mark — the wax seal, glowing warm */}
            <div style={{ marginBottom: 28 }}>
              <WaxSeal size={44} />
            </div>
            <p
              className="hl-mono"
              style={{
                fontSize:      10,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color:         'var(--bone-dim)',
                marginBottom:  22,
              }}
            >
              gift sent
            </p>
            <h3
              className="hl-tight"
              style={{
                fontFamily: 'var(--serif-display)',
                fontSize:   'var(--type-display)',
                fontWeight: 500,
                margin:     '0 0 16px',
                color:      'var(--bone)',
              }}
            >
              Gift sent.
            </h3>
            <p
              className="hl-serif"
              style={{
                color:       'var(--bone-dim)',
                fontSize:    'var(--type-body)',
                margin:      '0 0 32px',
                lineHeight:  1.7,
              }}
            >
              {formData.recipientName} will receive their gift{' '}
              {formData.scheduledDate
                ? `on ${new Date(formData.scheduledDate).toLocaleDateString()}`
                : 'shortly'}.
            </p>
            {giftResult.voucherCode && (
              <div
                style={{
                  borderTop:    '1px solid var(--rule)',
                  borderBottom: '1px solid var(--rule)',
                  padding:      '16px 0',
                  marginBottom: 32,
                }}
              >
                <p
                  className="hl-mono"
                  style={{
                    fontSize:      9,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color:         'var(--bone-faint)',
                    marginBottom:  8,
                  }}
                >
                  gift code
                </p>
                <p
                  className="hl-mono"
                  style={{
                    fontSize:      18,
                    letterSpacing: '0.1em',
                    color:         'var(--warm)',
                    margin:        0,
                  }}
                >
                  {giftResult.voucherCode}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setShowSuccess(false);
                setStep(1);
                setSelectedTier(null);
                setFormData({
                  recipientName:   '',
                  recipientEmail:  '',
                  purchaserName:   '',
                  purchaserEmail:  '',
                  personalMessage: '',
                  scheduledDate:   '',
                });
              }}
              className="hl-mono"
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                cursor: 'pointer',
              }}
            >
              done →
            </button>
          </div>
        </div>
      )}
  </ClothShell>
);
}
