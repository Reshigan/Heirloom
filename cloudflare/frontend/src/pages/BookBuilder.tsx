import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { memoriesApi, lettersApi, voiceApi, exportApi } from '../services/api';

type BookStep = 'select' | 'customize' | 'preview' | 'order';

interface BookConfig {
  title: string;
  subtitle: string;
  coverType: 'hardcover' | 'softcover';
  memoryIds: string[];
  letterIds: string[];
  voiceIds: string[];
  includeTranscriptions: boolean;
  includePhotos: boolean;
  includeDates: boolean;
  dedicationText: string;
}

const stepOrder: BookStep[] = ['select', 'customize', 'preview', 'order'];
const stepLabels: Record<BookStep, string> = {
  select: 'Select',
  customize: 'Customize',
  preview: 'Preview',
  order: 'Order',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--loom-rule)',
  borderRadius: 2,
  padding: '10px 14px',
  color: 'var(--loom-bone)',
  fontFamily: "'Source Serif 4', serif",
  fontSize: 15,
  lineHeight: 1.7,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
};

export function BookBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState<BookStep>('select');
  const [config, setConfig] = useState<BookConfig>({
    title: 'Our Family Memories',
    subtitle: '',
    coverType: 'hardcover',
    memoryIds: [],
    letterIds: [],
    voiceIds: [],
    includeTranscriptions: true,
    includePhotos: true,
    includeDates: true,
    dedicationText: '',
  });

  const { data: memories } = useQuery({
    queryKey: ['memories-for-book'],
    queryFn: () => memoriesApi.getAll({ limit: 100 }).then((r) => r.data),
  });
  const { data: letters } = useQuery({
    queryKey: ['letters-for-book'],
    queryFn: () => lettersApi.getAll({ limit: 100 }).then((r) => r.data),
  });
  const { data: voices } = useQuery({
    queryKey: ['voices-for-book'],
    queryFn: () => voiceApi.getAll({ limit: 100 }).then((r) => r.data),
  });

  const orderMutation = useMutation({
    mutationFn: () => exportApi.bookOrder(config),
    onSuccess: (data) => {
      if (data.data?.checkoutUrl) window.location.href = data.data.checkoutUrl;
    },
  });

  const totalItems = config.memoryIds.length + config.letterIds.length + config.voiceIds.length;
  const estimatedPages = Math.max(20, totalItems * 2 + 10);
  const currentStepIndex = stepOrder.indexOf(step);

  const toggleItem = (type: 'memoryIds' | 'letterIds' | 'voiceIds', id: string) => {
    setConfig((prev) => ({
      ...prev,
      [type]: prev[type].includes(id) ? prev[type].filter((i) => i !== id) : [...prev[type], id],
    }));
  };

  const memoryList = Array.isArray(memories) ? memories : memories?.data || memories?.memories || [];
  const letterList = Array.isArray(letters) ? letters : letters?.data || letters?.letters || [];
  const voiceList = Array.isArray(voices) ? voices : voices?.data || voices?.recordings || [];

  return (
    <AppFrame>
      {/* Header */}
      <header style={{ marginBottom: 48 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Living Book</p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          The cloth, bound.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 560, lineHeight: 1.6 }}
        >
          Print your family thread as a hardback. A keepsake for the shelf; the thread keeps going.
        </p>
      </header>

      {/* Step progress — hairline track */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginBottom: 48,
          borderBottom: '1px solid var(--loom-rule)',
          paddingBottom: 0,
        }}
      >
        {stepOrder.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'baseline', flex: 1, position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                bottom: -1,
                left: 0,
                width: '100%',
                height: 1,
                background: i <= currentStepIndex ? 'var(--loom-warm)' : 'transparent',
                transition: 'background 360ms cubic-bezier(0.16,1,0.3,1)',
              }}
            />
            <span
              className="loom-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: i <= currentStepIndex ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
                padding: '0 0 12px',
                transition: 'color 360ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {i + 1} — {stepLabels[s]}
            </span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div style={{ maxWidth: 640 }}>
        {/* Select */}
        {step === 'select' && (
          <div style={{ display: 'grid', gap: 40 }}>
            <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: 0 }}>
              Select the memories, letters, and voice recordings to include in your book.
            </p>

            {([
              { key: 'memoryIds' as const, label: 'Memories', list: memoryList },
              { key: 'letterIds' as const, label: 'Letters', list: letterList },
              { key: 'voiceIds' as const, label: 'Voice recordings', list: voiceList },
            ]).map(({ key, label, list }) => (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
                  <span className="loom-eyebrow">{label}</span>
                  <span className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-warm)' }}>
                    {config[key].length} selected
                  </span>
                  <hr className="loom-hairline" style={{ flex: 1 }} />
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'grid', gap: 1 }}>
                  {list.map((item: { id: string; title?: string; subject?: string }) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(key, item.id)}
                      style={{
                        background: config[key].includes(item.id) ? 'rgba(176,122,74,0.06)' : 'transparent',
                        border: 0,
                        borderBottom: '1px solid var(--loom-rule)',
                        padding: '12px 0',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span
                        className="loom-serif"
                        style={{
                          fontSize: 16,
                          fontWeight: 300,
                          color: config[key].includes(item.id) ? 'var(--loom-warm)' : 'var(--loom-bone)',
                          transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                        }}
                      >
                        {item.title || (item as any).subject || 'Untitled'}
                      </span>
                      {config[key].includes(item.id) && (
                        <span
                          className="loom-mono"
                          style={{ fontSize: 9, color: 'var(--loom-warm)', letterSpacing: '0.2em', flexShrink: 0 }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                  {list.length === 0 && (
                    <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)', fontStyle: 'italic', padding: '12px 0' }}>
                      No {label.toLowerCase()} yet.
                    </p>
                  )}
                </div>
              </div>
            ))}

            <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.14em' }}>
              {totalItems} items selected · ~{estimatedPages} pages estimated
            </p>
          </div>
        )}

        {/* Customize */}
        {step === 'customize' && (
          <div style={{ display: 'grid', gap: 24 }}>
            <div>
              <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Book title</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                style={{ ...inputStyle, fontSize: 17 }}
              />
            </div>
            <div>
              <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Subtitle (optional)</label>
              <input
                type="text"
                value={config.subtitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
                placeholder="A collection of our most precious moments"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Dedication</label>
              <textarea
                value={config.dedicationText}
                onChange={(e) => setConfig((prev) => ({ ...prev, dedicationText: e.target.value }))}
                placeholder="For my children, with all my love…"
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>
            <div>
              <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 12 }}>Cover type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['hardcover', 'softcover'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, coverType: type }))}
                    style={{
                      background: config.coverType === type ? 'rgba(176,122,74,0.06)' : 'transparent',
                      border: `1px solid ${config.coverType === type ? 'var(--loom-rule-warm)' : 'var(--loom-rule)'}`,
                      padding: '16px 18px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    <p
                      className="loom-serif"
                      style={{
                        fontSize: 16,
                        fontWeight: 300,
                        textTransform: 'capitalize',
                        color: config.coverType === type ? 'var(--loom-warm)' : 'var(--loom-bone)',
                        margin: '0 0 4px',
                      }}
                    >
                      {type}
                    </p>
                    <p className="loom-body" style={{ fontSize: 12, color: 'var(--loom-bone-faint)', margin: 0 }}>
                      {type === 'hardcover' ? 'Premium quality' : 'Lightweight & flexible'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { key: 'includePhotos', label: 'Include photos' },
                { key: 'includeTranscriptions', label: 'Include voice transcriptions' },
                { key: 'includeDates', label: 'Include dates' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config[key as keyof BookConfig] as boolean}
                    onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.checked }))}
                    style={{ width: 14, height: 14, accentColor: 'var(--loom-warm)', cursor: 'pointer' }}
                  />
                  <span className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)' }}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {step === 'preview' && (
          <div style={{ textAlign: 'center' }}>
            {/* Stylized book cover */}
            <div
              style={{
                width: 200,
                height: 260,
                margin: '0 auto 32px',
                border: '1px solid var(--loom-rule-warm)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 28,
              }}
            >
              <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, color: 'var(--loom-warm)', marginBottom: 12 }}>∞</p>
              <h3 className="loom-serif" style={{ fontSize: 16, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 6px', textAlign: 'center', lineHeight: 1.3 }}>
                {config.title}
              </h3>
              {config.subtitle && (
                <p className="loom-body" style={{ fontSize: 11, color: 'var(--loom-bone-faint)', margin: 0, textAlign: 'center' }}>
                  {config.subtitle}
                </p>
              )}
              <div style={{ marginTop: 'auto' }}>
                <p className="loom-mono" style={{ fontSize: 9, color: 'var(--loom-bone-faint)', letterSpacing: '0.14em', margin: '0 0 2px' }}>
                  {totalItems} items · ~{estimatedPages} pages
                </p>
                <p className="loom-mono" style={{ fontSize: 9, color: 'var(--loom-bone-faint)', letterSpacing: '0.14em', textTransform: 'capitalize' }}>
                  {config.coverType}
                </p>
              </div>
            </div>
            <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: 0, maxWidth: 360, marginInline: 'auto' }}>
              Your book preview is ready. Review the details and place your order.
            </p>
          </div>
        )}

        {/* Order */}
        {step === 'order' && (
          <div style={{ maxWidth: 420 }}>
            <h3 className="loom-serif" style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', margin: '0 0 24px' }}>
              Order summary
            </h3>
            <div style={{ border: '1px solid var(--loom-rule)', marginBottom: 24 }}>
              {[
                { label: 'Book title', value: config.title },
                { label: 'Cover', value: config.coverType, capitalize: true },
                { label: 'Pages (est.)', value: String(estimatedPages) },
                { label: 'Items included', value: String(totalItems) },
              ].map(({ label, value, capitalize }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--loom-rule)',
                  }}
                >
                  <span className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)' }}>{label}</span>
                  <span
                    className="loom-mono"
                    style={{
                      fontSize: 12,
                      color: 'var(--loom-bone)',
                      letterSpacing: '0.06em',
                      textTransform: capitalize ? 'capitalize' : 'none',
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  padding: '14px 20px',
                }}
              >
                <span className="loom-serif" style={{ fontSize: 16, fontWeight: 300, color: 'var(--loom-bone)' }}>Total</span>
                <span
                  className="loom-mono"
                  style={{ fontSize: 13, color: 'var(--loom-warm)', letterSpacing: '0.08em' }}
                >
                  {config.coverType === 'hardcover' ? '$49.99' : '$29.99'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => orderMutation.mutate()}
              disabled={orderMutation.isPending}
              className="loom-btn"
              style={{ width: '100%', opacity: orderMutation.isPending ? 0.45 : 1, marginBottom: 12 }}
            >
              {orderMutation.isPending ? (
                <span style={{ fontStyle: 'italic' }}>Processing…</span>
              ) : (
                'Place order'
              )}
            </button>
            <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.12em', textAlign: 'center' }}>
              You'll be redirected to Stripe for secure payment.
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 56,
          paddingTop: 20,
          borderTop: '1px solid var(--loom-rule)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (currentStepIndex === 0) navigate('/dashboard');
            else setStep(stepOrder[currentStepIndex - 1]);
          }}
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-faint)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          ← {currentStepIndex === 0 ? 'Cancel' : 'Back'}
        </button>

        {step !== 'order' && (
          <button
            type="button"
            onClick={() => setStep(stepOrder[currentStepIndex + 1])}
            disabled={step === 'select' && totalItems === 0}
            className="loom-btn"
            style={{ opacity: step === 'select' && totalItems === 0 ? 0.45 : 1 }}
          >
            Continue
          </button>
        )}
      </div>
    </AppFrame>
  );
}

export default BookBuilder;
