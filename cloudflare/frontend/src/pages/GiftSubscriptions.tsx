import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { giftSubscriptionsApi } from '../services/api';

const OCCASION_STYLES = [
  { id: 'classic', name: 'classic' },
  { id: 'elegant', name: 'elegant' },
  { id: 'festive', name: 'festive' },
  { id: 'birthday', name: 'birthday' },
  { id: 'anniversary', name: 'anniversary' },
];

const STEP_LABELS = ['plan', 'recipient', 'your details', 'review'];

export function GiftSubscriptions() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('classic');
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    purchaserName: '',
    purchaserEmail: '',
    personalMessage: '',
    scheduledDate: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [giftResult, setGiftResult] = useState<any>(null);

  const { data: pricing } = useQuery({
    queryKey: ['giftPricing'],
    queryFn: () => giftSubscriptionsApi.getPricing().then(r => r.data),
  });

  const { data: purchasedGifts } = useQuery({
    queryKey: ['purchasedGifts'],
    queryFn: () => giftSubscriptionsApi.getPurchased().then(r => r.data),
  });

  const purchaseMutation = useMutation({
    mutationFn: () => giftSubscriptionsApi.purchase({
      purchaserEmail: formData.purchaserEmail,
      purchaserName: formData.purchaserName,
      recipientEmail: formData.recipientEmail,
      recipientName: formData.recipientName,
      tier: selectedTier!,
      personalMessage: formData.personalMessage,
      style: selectedStyle,
      scheduledDeliveryDate: formData.scheduledDate || undefined,
    }),
    onSuccess: (response) => {
      setGiftResult(response.data);
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['purchasedGifts'] });
    },
  });

  const tiers = pricing?.tiers || [
    { id: 'STARTER', name: 'Starter', price: 12, description: '1 year of Starter plan' },
    { id: 'FAMILY', name: 'Family', price: 24, description: '1 year of Family plan' },
    { id: 'FOREVER', name: 'Forever', price: 60, description: '1 year of Forever plan' },
  ];

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

  return (
    <AppFrame>
      <header style={{ marginBottom: 40 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>give a thread</p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          Gift a subscription.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 560, lineHeight: 1.6 }}
        >
          Give someone the gift of a family thread — a place to preserve what matters.
        </p>
      </header>

      <hr className="loom-hairline" style={{ marginBottom: 40 }} />

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
        {STEP_LABELS.map((label, i) => {
          const s = i + 1;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                className="loom-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: s === step ? 'var(--loom-warm)' : s < step ? 'var(--loom-bone-dim)' : 'var(--loom-bone-faint)',
                }}
              >
                {String(s).padStart(2, '0')} {label}
              </span>
              {s < 4 && (
                <span style={{ width: 20, height: 1, background: s < step ? 'var(--loom-warm)' : 'var(--loom-rule)', display: 'inline-block', alignSelf: 'center' }} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ maxWidth: 640 }}>

        {/* Step 1: Choose Plan */}
        {step === 1 && (
          <div>
            <p className="loom-eyebrow" style={{ marginBottom: 24 }}>choose a plan</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, marginBottom: 40 }}>
              {tiers.map((tier: any) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  style={{
                    display: 'block',
                    textAlign: 'left',
                    padding: '20px',
                    background: selectedTier === tier.id ? 'rgba(176, 122, 74, 0.06)' : 'transparent',
                    border: selectedTier === tier.id ? '1px solid var(--loom-warm)' : '1px solid var(--loom-rule)',
                    cursor: 'pointer',
                    transition: 'border-color 180ms var(--loom-ease)',
                  }}
                >
                  <p className="loom-body" style={{ fontSize: 16, fontStyle: 'italic', margin: '0 0 8px', color: 'var(--loom-bone)' }}>
                    {tier.name}
                  </p>
                  <p
                    className="loom-h2"
                    style={{ fontSize: 28, fontWeight: 300, margin: '0 0 6px', color: 'var(--loom-warm)' }}
                  >
                    ${tier.price}
                  </p>
                  <p className="loom-mono" style={{ fontSize: 9, color: 'var(--loom-bone-faint)', margin: 0 }}>
                    {tier.description}
                  </p>
                </button>
              ))}
            </div>

            <p className="loom-eyebrow" style={{ marginBottom: 16 }}>occasion</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {OCCASION_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className="loom-mono"
                  style={{
                    background: 'transparent',
                    border: selectedStyle === style.id ? '1px solid var(--loom-warm)' : '1px solid var(--loom-rule)',
                    padding: '7px 14px',
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: selectedStyle === style.id ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
                    cursor: 'pointer',
                    transition: 'border-color 180ms var(--loom-ease), color 180ms var(--loom-ease)',
                  }}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Recipient Details */}
        {step === 2 && (
          <div>
            <p className="loom-eyebrow" style={{ marginBottom: 24 }}>who's receiving this?</p>
            <div style={{ display: 'grid', gap: 28 }}>
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
                  recipient's name
                </label>
                <input
                  type="text"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="Mum, Dad, Grandma…"
                />
              </div>
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
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
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
                  a note (optional)
                </label>
                <textarea
                  value={formData.personalMessage}
                  onChange={(e) => setFormData({ ...formData, personalMessage: e.target.value })}
                  placeholder="a few quiet words…"
                  style={{ resize: 'vertical', minHeight: 88 }}
                />
              </div>
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
                  schedule delivery (optional)
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', marginTop: 6 }}>
                  leave empty to send immediately
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Your Details */}
        {step === 3 && (
          <div>
            <p className="loom-eyebrow" style={{ marginBottom: 24 }}>your details</p>
            <div style={{ display: 'grid', gap: 28 }}>
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
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
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
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

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <p className="loom-eyebrow" style={{ marginBottom: 24 }}>review your gift</p>
            <div
              style={{
                border: '1px solid var(--loom-rule)',
                padding: '24px',
                marginBottom: 24,
                display: 'grid',
                gap: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingBottom: 16,
                  marginBottom: 16,
                  borderBottom: '1px solid var(--loom-rule)',
                }}
              >
                <div>
                  <p className="loom-body" style={{ fontSize: 16, fontStyle: 'italic', margin: '0 0 2px' }}>
                    {formData.recipientName}
                  </p>
                  <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', margin: 0 }}>
                    {formData.recipientEmail}
                  </p>
                </div>
                <span
                  className="loom-mono"
                  style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--loom-warm)' }}
                >
                  {OCCASION_STYLES.find(s => s.id === selectedStyle)?.name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--loom-rule)' }}>
                <span className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}>plan</span>
                <span className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)' }}>
                  {tiers.find((t: any) => t.id === selectedTier)?.name} (1 year)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0' }}>
                <span className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}>total</span>
                <span className="loom-body" style={{ fontSize: 20, color: 'var(--loom-warm)' }}>
                  ${tiers.find((t: any) => t.id === selectedTier)?.price}
                </span>
              </div>
              {formData.personalMessage && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--loom-rule)' }}>
                  <p className="loom-mono" style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', marginBottom: 8 }}>
                    your note
                  </p>
                  <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-dim)', fontSize: 14, margin: 0 }}>
                    &ldquo;{formData.personalMessage}&rdquo;
                  </p>
                </div>
              )}
              {formData.scheduledDate && (
                <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', marginTop: 12 }}>
                  scheduled for {new Date(formData.scheduledDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {purchaseMutation.isError && (
              <p
                role="alert"
                className="loom-body"
                style={{ fontStyle: 'italic', color: '#c25a5a', fontSize: 13, marginBottom: 16 }}
              >
                Purchase failed. Please try again.
              </p>
            )}

            <button
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
              className="loom-btn"
              style={{ width: '100%', opacity: purchaseMutation.isPending ? 0.5 : 1 }}
            >
              {purchaseMutation.isPending ? 'processing…' : 'complete purchase'}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 40,
            paddingTop: 28,
            borderTop: '1px solid var(--loom-rule)',
          }}
        >
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="loom-btn-ghost"
            style={{ opacity: step === 1 ? 0.4 : 1 }}
          >
            back
          </button>
          {step < 4 && (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="loom-btn"
              style={{ opacity: !canProceed() ? 0.5 : 1 }}
            >
              continue
            </button>
          )}
        </div>
      </div>

      {/* Gift History */}
      {purchasedGifts && purchasedGifts.length > 0 && (
        <div style={{ maxWidth: 640, marginTop: 64 }}>
          <hr className="loom-hairline" style={{ marginBottom: 32 }} />
          <p className="loom-eyebrow" style={{ marginBottom: 24 }}>previous gifts</p>
          <div style={{ display: 'grid', gap: 1 }}>
            {purchasedGifts.map((gift: any) => (
              <div
                key={gift.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  padding: '14px 0',
                  borderBottom: '1px solid var(--loom-rule)',
                }}
              >
                <div>
                  <p className="loom-body" style={{ fontSize: 15, fontStyle: 'italic', margin: '0 0 2px' }}>
                    {gift.recipient_name}
                  </p>
                  <p className="loom-mono" style={{ fontSize: 9, color: 'var(--loom-bone-faint)', margin: 0 }}>
                    {gift.tier} plan
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="loom-mono" style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', margin: '0 0 2px' }}>
                    {gift.status}
                  </p>
                  <p className="loom-mono" style={{ fontSize: 9, color: 'var(--loom-bone-faint)', margin: 0 }}>
                    {new Date(gift.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success overlay */}
      {showSuccess && giftResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(14, 14, 12, 0.88)',
            padding: '24px',
          }}
          role="status"
        >
          <div
            style={{
              background: 'var(--loom-ink-card)',
              border: '1px solid var(--loom-rule-warm)',
              padding: '48px',
              maxWidth: 440,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <p className="loom-eyebrow" style={{ marginBottom: 20 }}>sent</p>
            <h3
              className="loom-h2"
              style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 16px' }}
            >
              Gift sent.
            </h3>
            <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', fontSize: 15, margin: '0 0 32px', lineHeight: 1.7 }}>
              {formData.recipientName} will receive their gift{' '}
              {formData.scheduledDate
                ? `on ${new Date(formData.scheduledDate).toLocaleDateString()}`
                : 'shortly'}.
            </p>
            {giftResult.giftCode && (
              <div
                style={{
                  borderTop: '1px solid var(--loom-rule)',
                  borderBottom: '1px solid var(--loom-rule)',
                  padding: '16px 0',
                  marginBottom: 32,
                }}
              >
                <p className="loom-eyebrow" style={{ marginBottom: 8, fontSize: 9 }}>gift code</p>
                <p
                  className="loom-mono"
                  style={{ fontSize: 18, letterSpacing: '0.08em', color: 'var(--loom-warm)', margin: 0 }}
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
                  recipientName: '',
                  recipientEmail: '',
                  purchaserName: '',
                  purchaserEmail: '',
                  personalMessage: '',
                  scheduledDate: '',
                });
              }}
              className="loom-btn"
            >
              done
            </button>
          </div>
        </div>
      )}
    </AppFrame>
  );
}
