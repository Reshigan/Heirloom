import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { memoriesApi, lettersApi, voiceApi, booksApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

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

// Natural-dye palette (STITCH_BRIEF §2.7), true-hue — mirrors the worker's
// cover renderer so the preview matches the printed cloth.
const DYE_HEX = {
  madder: '#b04538', // memory
  indigo: '#2e3d61', // letter
  saffron: '#d4992e', // voice
  weld: '#bda845',
} as const;

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
  border: '1px solid var(--rule)',
  borderRadius: 2,
  padding: '10px 14px',
  color: 'var(--bone)',
  fontFamily: 'var(--serif)',
  fontSize: 15,
  lineHeight: 1.7,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
};

interface ShipTo {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state_code: string;
  country_code: string;
  postcode: string;
  phone_number: string;
  email: string;
}

const emptyShipTo: ShipTo = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  state_code: '',
  country_code: 'US',
  postcode: '',
  phone_number: '',
  email: '',
};

export function BookBuilder() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const defaultThreadId = user?.defaultThreadId ?? undefined;
  const [step, setStep] = useState<BookStep>('select');
  const [shipTo, setShipTo] = useState<ShipTo>(emptyShipTo);
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
    mutationFn: () =>
      booksApi.booksCheckout({
        ship_to: {
          name: shipTo.name.trim(),
          line1: shipTo.line1.trim(),
          line2: shipTo.line2.trim() || undefined,
          city: shipTo.city.trim(),
          state_code: shipTo.state_code.trim() || undefined,
          country_code: shipTo.country_code.trim() || 'US',
          postcode: shipTo.postcode.trim(),
          phone_number: shipTo.phone_number.trim(),
          email: shipTo.email.trim(),
        },
        cover_type: config.coverType,
        thread_id: defaultThreadId,
      }),
    onSuccess: (data) => {
      if (data.data?.url) window.location.href = data.data.url;
    },
  });

  const orderError = orderMutation.isError
    ? (() => {
        const err = orderMutation.error as { response?: { data?: { error?: string; message?: string } }; message?: string };
        return (
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Something went wrong placing your order. Please try again.'
        );
      })()
    : null;

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

  // Cover cloth — one weft thread per selected entry, dyed by type; plus the
  // span of years the thread covers. Mirrors the worker's buildCoverPdf().
  const yearOf = (it: { created_at?: string; date?: string; createdAt?: string }) => {
    const d = it?.created_at || it?.date || it?.createdAt;
    const y = d ? new Date(d).getFullYear() : NaN;
    return Number.isFinite(y) ? y : NaN;
  };
  const selectedYears = [
    ...memoryList.filter((m: { id: string }) => config.memoryIds.includes(m.id)),
    ...letterList.filter((l: { id: string }) => config.letterIds.includes(l.id)),
    ...voiceList.filter((v: { id: string }) => config.voiceIds.includes(v.id)),
  ].map(yearOf).filter((y): y is number => Number.isFinite(y));
  const yearsLabel = selectedYears.length
    ? (Math.min(...selectedYears) === Math.max(...selectedYears)
        ? String(Math.min(...selectedYears))
        : `${Math.min(...selectedYears)} – ${Math.max(...selectedYears)}`)
    : String(new Date().getFullYear());
  const weftColors = [
    ...config.memoryIds.map(() => DYE_HEX.madder),
    ...config.letterIds.map(() => DYE_HEX.indigo),
    ...config.voiceIds.map(() => DYE_HEX.saffron),
  ];
  const clothRows = weftColors.length
    ? weftColors
    : [DYE_HEX.madder, DYE_HEX.indigo, DYE_HEX.saffron, DYE_HEX.weld];

  return (
    <ClothShell
      topbarLeft={<Link to="/loom" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--bone-faint)', textDecoration: 'none', textTransform: 'uppercase' }}>← heirloom</Link>}
      topbarCenter="book builder"
    >
      {/* scrollable inner */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* H1 */}
        <h1
          className="hl-serif"
          style={{ fontSize: 36, fontWeight: 300, marginBottom: 28, marginTop: 0, color: 'var(--bone)' }}
        >
          Your living book.
        </h1>

        {/* Step progress — hairline track */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            marginBottom: 48,
            borderBottom: '1px solid var(--rule)',
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
                  background: i <= currentStepIndex ? 'var(--warm)' : 'transparent',
                  transition: 'background 360ms cubic-bezier(0.16,1,0.3,1)',
                }}
              />
              <span
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: i <= currentStepIndex ? 'var(--warm)' : 'var(--bone-faint)',
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

          {/* ── Select ── */}
          {step === 'select' && (
            <div style={{ display: 'grid', gap: 40 }}>
              <p
                className="hl-serif"
                style={{ fontSize: 15, color: 'var(--bone-dim)', margin: 0, fontStyle: 'italic' }}
              >
                Select the memories, letters, and voice recordings to include in your book.
              </p>

              {([
                { key: 'memoryIds' as const, label: 'Memories', list: memoryList },
                { key: 'letterIds' as const, label: 'Letters', list: letterList },
                { key: 'voiceIds' as const, label: 'Voice recordings', list: voiceList },
              ]).map(({ key, label, list }) => (
                <div key={key}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
                    <span className="hl-eyebrow">{label}</span>
                    <span className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)' }}>
                      {config[key].length} selected
                    </span>
                    <hr className="hl-rule" style={{ flex: 1 }} />
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
                          borderBottom: '1px solid var(--rule)',
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
                          className="hl-serif"
                          style={{
                            fontSize: 16,
                            fontWeight: 300,
                            color: config[key].includes(item.id) ? 'var(--warm)' : 'var(--bone)',
                            transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                          }}
                        >
                          {item.title || (item as { id: string; title?: string; subject?: string }).subject || 'Untitled'}
                        </span>
                        {config[key].includes(item.id) && (
                          <span
                            className="hl-mono"
                            style={{ fontSize: 9, color: 'var(--warm)', letterSpacing: '0.2em', flexShrink: 0 }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                    {list.length === 0 && (
                      <p
                        className="hl-serif"
                        style={{ fontSize: 14, color: 'var(--bone-faint)', fontStyle: 'italic', padding: '12px 0', margin: 0 }}
                      >
                        No {label.toLowerCase()} yet.
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em' }}>
                {totalItems} items selected · ~{estimatedPages} pages estimated
              </p>
            </div>
          )}

          {/* ── Customize ── */}
          {step === 'customize' && (
            <div style={{ display: 'grid', gap: 24 }}>
              <div>
                <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Book title</label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                  style={{ ...inputStyle, fontSize: 17 }}
                />
              </div>
              <div>
                <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Subtitle (optional)</label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => setConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="A collection of our most precious moments"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Dedication</label>
                <textarea
                  value={config.dedicationText}
                  onChange={(e) => setConfig((prev) => ({ ...prev, dedicationText: e.target.value }))}
                  placeholder="For my children, with all my love…"
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>
              <div>
                <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 12 }}>Cover type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['hardcover', 'softcover'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, coverType: type }))}
                      style={{
                        background: config.coverType === type ? 'rgba(176,122,74,0.06)' : 'transparent',
                        border: `1px solid ${config.coverType === type ? 'var(--warm)' : 'var(--rule)'}`,
                        padding: '16px 18px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                        borderRadius: 0,
                      }}
                    >
                      <p
                        className="hl-serif"
                        style={{
                          fontSize: 16,
                          fontWeight: 300,
                          textTransform: 'capitalize',
                          color: config.coverType === type ? 'var(--warm)' : 'var(--bone)',
                          margin: '0 0 4px',
                        }}
                      >
                        {type}
                      </p>
                      <p className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-faint)', margin: 0 }}>
                        {type === 'hardcover' ? 'Full-colour · case-wrap' : 'Full-colour · softcover'}
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
                      style={{ width: 14, height: 14, accentColor: 'var(--warm)', cursor: 'pointer' }}
                    />
                    <span className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)' }}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Preview ── */}
          {step === 'preview' && (
            <div style={{ textAlign: 'center' }}>
              {/* The cover IS the cloth — woven weft (one thread per entry,
                  dyed by type), then title · years · name. Mirrors the
                  printed full-colour cover. */}
              <div
                style={{
                  width: 232,
                  height: 320,
                  margin: '0 auto 32px',
                  background: 'var(--ink, #0e0e0c)',
                  border: '1px solid var(--warm)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 16,
                  borderRadius: 0,
                  borderBottom: '1px solid var(--warm)',
                }}
              >
                {/* Brand eyebrow */}
                <p
                  className="hl-mono"
                  style={{ fontSize: 8, letterSpacing: '0.32em', color: 'var(--warm)', textAlign: 'center', margin: '2px 0 10px' }}
                >
                  HEIRLOOM
                </p>

                {/* Woven cloth panel */}
                <div
                  style={{
                    position: 'relative',
                    flex: 1,
                    border: '1px solid var(--warm)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {Array.from({ length: Math.min(Math.max(clothRows.length, 18), 64) }).map((_, i) => (
                    <div
                      key={i}
                      style={{ flex: 1, background: clothRows[i % clothRows.length] }}
                    />
                  ))}
                  {/* Warp hairlines */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage:
                        'repeating-linear-gradient(90deg, rgba(244,236,216,0.10) 0 0.5px, transparent 0.5px 9px)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>

                {/* Title block */}
                <h3
                  className="hl-serif"
                  style={{ fontSize: 15, fontWeight: 300, color: 'var(--bone)', margin: '12px 0 2px', textAlign: 'center', lineHeight: 1.2 }}
                >
                  {config.title}
                </h3>
                <p className="hl-mono" style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--warm)', textAlign: 'center', margin: '0 0 4px' }}>
                  {yearsLabel}
                </p>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--warm)', textAlign: 'center', margin: 0 }}>∞</p>
              </div>

              <p className="hl-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.14em', margin: '0 0 16px', textTransform: 'capitalize' }}>
                {totalItems} items · ~{estimatedPages} pages · full-colour {config.coverType}
              </p>
              <p className="hl-serif" style={{ fontSize: 15, color: 'var(--bone-dim)', margin: 0, maxWidth: 360, marginInline: 'auto', fontStyle: 'italic' }}>
                Every entry is one thread, dyed to its kind. This is your cloth as it stands today.
              </p>
            </div>
          )}

          {/* ── Order ── */}
          {step === 'order' && (
            <div style={{ maxWidth: 480 }}>
              {/* Order summary */}
              <h3 className="hl-serif" style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', margin: '0 0 20px' }}>
                Order summary
              </h3>

              <div style={{ marginBottom: 40 }}>
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
                      borderBottom: '1px solid var(--rule)',
                      padding: '14px 0',
                      gap: 16,
                    }}
                  >
                    <span className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)' }}>
                      {label}
                    </span>
                    <span
                      className="hl-serif"
                      style={{ fontSize: 14, color: 'var(--bone)', fontStyle: 'italic', textAlign: 'right' }}
                    >
                      {capitalize ? value.charAt(0).toUpperCase() + value.slice(1) : value}
                    </span>
                  </div>
                ))}

                {/* total row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    padding: '14px 0',
                    gap: 16,
                  }}
                >
                  <span className="hl-serif" style={{ fontSize: 16, fontWeight: 300, color: 'var(--bone)' }}>
                    Total
                  </span>
                  <span className="hl-mono" style={{ fontSize: 14, color: 'var(--warm)', letterSpacing: '0.08em' }}>
                    {config.coverType === 'hardcover' ? '$159.99' : '$99.99'}
                  </span>
                </div>
              </div>

              {/* Shipping address */}
              <h3 className="hl-serif" style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', margin: '0 0 20px' }}>
                Where it ships
              </h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!orderMutation.isPending) orderMutation.mutate();
                }}
                style={{ display: 'grid', gap: 18 }}
              >
                <div>
                  <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 8 }}>Full name</label>
                  <input
                    type="text"
                    value={shipTo.name}
                    onChange={(e) => setShipTo((p) => ({ ...p, name: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 8 }}>Address line 1</label>
                  <input
                    type="text"
                    value={shipTo.line1}
                    onChange={(e) => setShipTo((p) => ({ ...p, line1: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 8 }}>Address line 2 (optional)</label>
                  <input
                    type="text"
                    value={shipTo.line2}
                    onChange={(e) => setShipTo((p) => ({ ...p, line2: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 8 }}>City</label>
                    <input
                      type="text"
                      value={shipTo.city}
                      onChange={(e) => setShipTo((p) => ({ ...p, city: e.target.value }))}
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 8 }}>State / Province</label>
                    <input
                      type="text"
                      value={shipTo.state_code}
                      onChange={(e) => setShipTo((p) => ({ ...p, state_code: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 8 }}>Country code</label>
                    <input
                      type="text"
                      value={shipTo.country_code}
                      onChange={(e) => setShipTo((p) => ({ ...p, country_code: e.target.value }))}
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 8 }}>Postcode</label>
                    <input
                      type="text"
                      value={shipTo.postcode}
                      onChange={(e) => setShipTo((p) => ({ ...p, postcode: e.target.value }))}
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 8 }}>Phone number</label>
                  <input
                    type="tel"
                    value={shipTo.phone_number}
                    onChange={(e) => setShipTo((p) => ({ ...p, phone_number: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 8 }}>Email</label>
                  <input
                    type="email"
                    value={shipTo.email}
                    onChange={(e) => setShipTo((p) => ({ ...p, email: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>

                {orderError && (
                  <p
                    className="hl-serif"
                    style={{
                      fontSize: 13,
                      color: 'var(--warm)',
                      fontStyle: 'italic',
                      margin: 0,
                      borderLeft: '3px solid var(--warm)',
                      paddingLeft: 14,
                    }}
                  >
                    {orderError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={orderMutation.isPending}
                  className="hl-btn"
                  style={{ width: '100%', opacity: orderMutation.isPending ? 0.45 : 1, marginTop: 6 }}
                >
                  {orderMutation.isPending ? (
                    <span style={{ fontStyle: 'italic' }}>Processing…</span>
                  ) : (
                    'Place order →'
                  )}
                </button>
                <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.12em', textAlign: 'center', margin: 0 }}>
                  You'll be redirected to Stripe for secure payment.
                </p>
              </form>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 56,
            paddingTop: 20,
            borderTop: '1px solid var(--rule)',
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
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
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
              className="hl-btn"
              style={{ opacity: step === 'select' && totalItems === 0 ? 0.45 : 1 }}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </ClothShell>
  );
}

export default BookBuilder;
