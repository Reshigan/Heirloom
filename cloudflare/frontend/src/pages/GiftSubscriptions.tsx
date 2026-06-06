import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { giftSubscriptionsApi } from '../services/api';

// ── Constants ─────────────────────────────────────────────────────────────────
const OCCASION_STYLES = [
  { id: 'classic',     name: 'classic'     },
  { id: 'elegant',     name: 'elegant'     },
  { id: 'festive',     name: 'festive'     },
  { id: 'birthday',    name: 'birthday'    },
  { id: 'anniversary', name: 'anniversary' },
];

const STEP_LABELS = ['plan', 'recipient', 'your details', 'review'];

// Bullet features per tier
const TIER_BULLETS: Record<string, string[]> = {
  STARTER: [
    'Unlimited text entries',
    'Up to 3 authors',
    'Append-only audit log',
    '1 GB media storage',
    'PDF export',
    'Email delivery',
  ],
  FAMILY: [
    'Unlimited text entries',
    'Up to 12 authors',
    'Append-only audit log',
    '25 GB media storage',
    'PDF + textile export',
    'Priority delivery',
  ],
  LEGACY: [
    'Unlimited text entries',
    'Unlimited authors',
    'Append-only audit log',
    '250 GB media storage',
    'Print-quality export',
    'Succession vault included',
  ],
};

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
  const { data: pricing } = useQuery({
    queryKey: ['giftPricing'],
    queryFn: () => giftSubscriptionsApi.getPricing().then(r => r.data),
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
        billingCycle:    billingPeriod === 'monthly' ? 'quarterly' : 'yearly',
        recipientMessage: formData.personalMessage,
      }),
    onSuccess: (response) => {
      setGiftResult(response.data);
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['purchasedGifts'] });
    },
  });

  // ── Derived ──────────────────────────────────────────────────────────────────
  const tiers = pricing?.tiers || [
    {
      id: 'STARTER', name: 'Starter', description: 'Begin the family thread', storage: '1 GB',
      quarterly: { amount: 4.74, display: '$4.74' },
      yearly:    { amount: 44.99, display: '$44.99', savings: '2 months free' },
    },
    {
      id: 'FAMILY', name: 'Family', description: 'The full thread — for up to 12 authors', storage: '25 GB', popular: true,
      quarterly: { amount: 9.49, display: '$9.49' },
      yearly:    { amount: 89.99, display: '$89.99', savings: '2 months free' },
    },
    {
      id: 'LEGACY', name: 'Legacy', description: 'Unlimited authors, textile export, succession vault', storage: '250 GB',
      quarterly: { amount: 18.99, display: '$18.99' },
      yearly:    { amount: 179.99, display: '$179.99', savings: '2 months free' },
    },
  ];

  // Get pricing info for selected period
  const tierPeriodPrice = (tier: any) =>
    billingPeriod === 'monthly' ? (tier.quarterly ?? tier.yearly) : (tier.yearly ?? tier.quarterly);

  const handleNext = () => { if (step < 4) setStep(step + 1); };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedTier;
      case 2: return !!(formData.recipientName && formData.recipientEmail);
      case 3: return !!(formData.purchaserName && formData.purchaserEmail);
      default: return true;
    }
  };

  const selectedTierData = tiers.find((t: any) => t.id === selectedTier);
  const selectedPricing  = selectedTierData ? tierPeriodPrice(selectedTierData) : null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <ClothShell
      topbarLeft={
        <Link
          to="/loom"
          style={{
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none',
          }}
        >
          ← heirloom
        </Link>
      }
      topbarCenter="gift"
    >
      <div style={{ padding: 'clamp(24px, 5vw, 48px)', paddingBottom: 80 }}>

        {/* Page header */}
        <h1
          className="hl-serif hl-tight"
          style={{
            fontSize: 52,
            fontWeight: 300,
            margin: 0,
            marginBottom: 40,
            color: 'var(--bone)',
            letterSpacing: '-0.022em',
          }}
        >
          Give the gift of a thousand years.
        </h1>

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <p
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-dim)',
                  margin: 0,
                }}
              >
                choose a plan
              </p>

              {/* Billing period toggle */}
              <div style={{ display: 'flex' }}>
                {(['monthly', 'annual'] as const).map((p, i) => (
                  <button
                    key={p}
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
                      position: 'relative',
                    }}
                  >
                    {p}
                    {p === 'annual' && (
                      <span style={{
                        position: 'absolute',
                        top: -10,
                        right: -2,
                        background: 'var(--warm)',
                        color: 'var(--ink)',
                        fontFamily: 'var(--mono)',
                        fontSize: 8,
                        letterSpacing: '0.12em',
                        padding: '1px 5px',
                        textTransform: 'uppercase',
                        borderRadius: 0,
                      }}>
                        10% off
                      </span>
                    )}
                    {p === 'monthly' && (
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
                        5% off
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Three tier cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                marginBottom: 48,
              }}
            >
              {tiers.map((tier: any, idx: number) => {
                const isFamily  = tier.id === 'FAMILY';
                const isFirst   = idx === 0;
                const selected  = selectedTier === tier.id;
                const bullets   = TIER_BULLETS[tier.id] ?? [];
                const pp        = tierPeriodPrice(tier);

                return (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    style={{
                      display:         'flex',
                      flexDirection:   'column',
                      textAlign:       'left',
                      padding:         '36px 32px',
                      background:      isFamily ? 'var(--ink)' : 'transparent',
                      color:           isFamily ? 'var(--bone)' : 'var(--bone)',
                      borderTop:       isFamily || selected
                        ? '1px solid var(--warm)'
                        : '1px solid var(--rule)',
                      borderBottom:    '1px solid var(--rule)',
                      borderRight:     '1px solid var(--rule)',
                      borderLeft:      isFirst ? '1px solid var(--rule)' : 'none',
                      cursor:          'pointer',
                      outline:         'none',
                    }}
                  >
                    {/* Tier name */}
                    <span
                      className="hl-mono"
                      style={{
                        fontSize:      10,
                        letterSpacing: '0.28em',
                        textTransform: 'uppercase',
                        color:         isFamily ? 'var(--bone-dim)' : 'var(--bone-dim)',
                        marginBottom:  12,
                      }}
                    >
                      {tier.name}
                    </span>

                    {/* "for" line */}
                    <span
                      className="hl-serif"
                      style={{
                        fontStyle:   'italic',
                        fontSize:    14,
                        color:       isFamily ? 'var(--bone-dim)' : 'var(--bone-dim)',
                        marginBottom: 16,
                      }}
                    >
                      {tier.id === 'STARTER'
                        ? 'for a single thread'
                        : tier.id === 'FAMILY'
                        ? 'for the whole bloodline'
                        : 'for every generation'}
                    </span>

                    {/* Gift price */}
                    <span
                      className="hl-serif hl-tight"
                      style={{
                        fontSize:    56,
                        fontWeight:  300,
                        lineHeight:  1,
                        color:       isFamily ? 'var(--bone)' : 'var(--warm)',
                        marginBottom: 6,
                      }}
                    >
                      {pp.display ?? `$${pp.amount}`}
                    </span>

                    {/* Sub label */}
                    <span
                      className="hl-mono"
                      style={{
                        fontSize:      10,
                        letterSpacing: '0.24em',
                        textTransform: 'uppercase',
                        color:         isFamily ? 'var(--bone-dim)' : 'var(--bone-dim)',
                        marginBottom:  28,
                      }}
                    >
                      {billingPeriod === 'monthly' ? '3 months' : '12 months'}{pp.savings ? ` · ${pp.savings}` : ''}
                    </span>

                    {/* Bullets */}
                    <ul
                      style={{
                        listStyle: 'none',
                        margin:    0,
                        padding:   0,
                        display:   'flex',
                        flexDirection: 'column',
                        gap: 10,
                        flexGrow: 1,
                      }}
                    >
                      {bullets.map((b) => (
                        <li
                          key={b}
                          style={{
                            display:    'flex',
                            alignItems: 'baseline',
                            gap:        10,
                            fontFamily: 'var(--mono)',
                            fontSize:   11,
                            color:      isFamily ? 'var(--bone-dim)' : 'var(--bone-dim)',
                          }}
                        >
                          <span
                            style={{
                              display:         'inline-block',
                              width:           6,
                              height:          1,
                              background:      isFamily ? 'var(--bone-faint)' : 'var(--rule)',
                              flexShrink:      0,
                              alignSelf:       'center',
                            }}
                          />
                          {b}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div style={{ marginTop: 32 }}>
                      <span
                        className="hl-btn"
                        style={{
                          display:       'inline-block',
                          background:    selected ? 'var(--warm)' : isFamily ? 'var(--warm)' : 'transparent',
                          color:         selected || isFamily ? 'var(--ink)' : 'var(--bone)',
                          border:        selected || isFamily ? 'none' : '1px solid var(--rule)',
                          padding:       '12px 20px',
                          fontFamily:    'var(--mono)',
                          fontSize:      10,
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          pointerEvents: 'none',
                        }}
                      >
                        {selected ? 'selected' : 'select'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Occasion */}
            <p
              className="hl-mono"
              style={{
                fontSize:      10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color:         'var(--bone-dim)',
                marginBottom:  16,
              }}
            >
              occasion
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {OCCASION_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className="hl-mono"
                  style={{
                    background:    'transparent',
                    border:
                      selectedStyle === style.id
                        ? '1px solid var(--warm)'
                        : '1px solid var(--rule)',
                    padding:       '7px 14px',
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
            <p
              className="hl-mono"
              style={{
                fontSize:      10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color:         'var(--bone-dim)',
                marginBottom:  28,
              }}
            >
              who's receiving this?
            </p>
            <div style={{ display: 'grid', gap: 28 }}>
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
            <p
              className="hl-mono"
              style={{
                fontSize:      10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color:         'var(--bone-dim)',
                marginBottom:  28,
              }}
            >
              your details
            </p>
            <div style={{ display: 'grid', gap: 28 }}>
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
            <p
              className="hl-mono"
              style={{
                fontSize:      10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color:         'var(--bone-dim)',
                marginBottom:  28,
              }}
            >
              review your gift
            </p>
            <div
              style={{
                border:       '1px solid var(--rule)',
                padding:      '24px',
                marginBottom: 24,
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
                  {selectedTierData?.name} · {billingPeriod === 'monthly' ? '1 month' : '1 year'}
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
                  <span
                    className="hl-serif"
                    style={{ fontSize: 20, color: 'var(--warm)' }}
                  >
                    {selectedPricing ? (selectedPricing.display ?? `$${selectedPricing.amount}`) : '—'}
                  </span>
                  {selectedPricing?.savings && (
                    <span className="hl-mono" style={{ fontSize: 9, color: 'var(--warm)', display: 'block', letterSpacing: '0.18em' }}>
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
                className="hl-serif"
                style={{
                  fontStyle:    'italic',
                  color:        'var(--danger)',
                  fontSize:     13,
                  marginBottom: 16,
                }}
              >
                Purchase failed. Please try again.
              </p>
            )}

            <button
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
              className="hl-btn"
              style={{ width: '100%', opacity: purchaseMutation.isPending ? 0.5 : 1 }}
            >
              {purchaseMutation.isPending ? 'processing…' : 'complete purchase'}
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
            <hr
              style={{
                height:     1,
                border:     0,
                background: 'var(--rule)',
                marginBottom: 32,
              }}
            />
            <p
              className="hl-mono"
              style={{
                fontSize:      10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color:         'var(--bone-dim)',
                marginBottom:  24,
              }}
            >
              previous gifts
            </p>
            <div style={{ display: 'grid' }}>
              {purchasedGifts.map((gift: any) => (
                <div
                  key={gift.id}
                  style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'baseline',
                    padding:        '14px 0',
                    borderBottom:   '1px solid var(--rule)',
                  }}
                >
                  <div>
                    <p
                      className="hl-serif"
                      style={{
                        fontStyle: 'italic',
                        fontSize:  15,
                        margin:    '0 0 2px',
                        color:     'var(--bone)',
                      }}
                    >
                      {gift.recipient_name}
                    </p>
                    <p
                      className="hl-mono"
                      style={{ fontSize: 9, color: 'var(--bone-faint)', margin: 0 }}
                    >
                      {gift.tier} plan
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      className="hl-mono"
                      style={{
                        fontSize:      9,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color:         'var(--bone-faint)',
                        margin:        '0 0 2px',
                      }}
                    >
                      {gift.status}
                    </p>
                    <p
                      className="hl-mono"
                      style={{ fontSize: 9, color: 'var(--bone-faint)', margin: 0 }}
                    >
                      {new Date(gift.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
            background:  'rgba(14, 14, 12, 0.88)',
            padding:     '24px',
          }}
          role="status"
        >
          <div
            style={{
              background: 'var(--ink)',
              border:     '1px solid var(--rule)',
              borderTop:  '1px solid var(--warm)',
              padding:    '48px',
              maxWidth:   440,
              width:      '100%',
              textAlign:  'center',
            }}
          >
            <p
              className="hl-mono"
              style={{
                fontSize:      9,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color:         'var(--bone-dim)',
                marginBottom:  20,
              }}
            >
              sent
            </p>
            <h3
              className="hl-serif hl-tight"
              style={{
                fontSize:   36,
                fontWeight: 300,
                margin:     '0 0 16px',
                color:      'var(--bone)',
              }}
            >
              Gift sent.
            </h3>
            <p
              style={{
                fontFamily:  'var(--serif)',
                fontStyle:   'italic',
                color:       'var(--bone-dim)',
                fontSize:    15,
                margin:      '0 0 32px',
                lineHeight:  1.7,
              }}
            >
              {formData.recipientName} will receive their gift{' '}
              {formData.scheduledDate
                ? `on ${new Date(formData.scheduledDate).toLocaleDateString()}`
                : 'shortly'}.
            </p>
            {giftResult.giftCode && (
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
                  {giftResult.giftCode}
                </p>
              </div>
            )}
            <button
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
              className="hl-btn"
            >
              done
            </button>
          </div>
        </div>
      )}
  </ClothShell>
);
}
