import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { RoomSection } from '../loom/components/room';
import { CosmicHeader, SectionLabel, EntryRow, WaxSeal } from '../loom/cosmic/CosmicUI';
import { dyeFromMetadata, dyeForId, type Dye } from '../loom/dye';
import { memoriesApi, lettersApi, voiceApi, booksApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

type BookStep = 'select' | 'customize' | 'page' | 'preview' | 'order';

// Page-layout templates (cosmic-page-templates). Each is a thin-ruled
// selectable thumbnail; the active one carries a warm border. The chooser
// renders exactly the four tiles the reference shows, in a clean 2×2 grid —
// 'chapter-open' stays a valid layout type (LayoutGlyph still handles it) but
// is not offered as a fifth orphan tile.
type PageLayout = 'full-bleed' | 'photo-caption' | 'chapter-open' | 'two-column' | 'quote';
const pageLayouts: { id: PageLayout; label: string }[] = [
  { id: 'full-bleed', label: 'Full bleed memory' },
  { id: 'photo-caption', label: 'Text & portrait' },
  { id: 'two-column', label: 'Two columns' },
  { id: 'quote', label: 'Quiet quote' },
];

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

const stepOrder: BookStep[] = ['select', 'customize', 'page', 'preview', 'order'];
const stepLabels: Record<BookStep, string> = {
  select: 'Select',
  customize: 'Customize',
  page: 'Page',
  preview: 'Preview',
  order: 'Order',
};

// COMPOSER: each step leads with its own mono eyebrow + giant serif prompt.
const stepPrompts: Record<BookStep, { eyebrow: string; prompt: string }> = {
  select: { eyebrow: 'The Volume', prompt: 'Which threads do you bind?' },
  customize: { eyebrow: 'The Book', prompt: 'Bind your thread' },
  page: { eyebrow: 'The Page', prompt: 'Choose a page layout' },
  preview: { eyebrow: 'The Volume', prompt: 'This is your cloth, bound.' },
  order: { eyebrow: 'The Volume', prompt: 'Where shall it be sent?' },
};

// Flat serif input (COMPOSER): no box — a single hairline underline that warms
// on focus, transparent ground, warm caret. Preserves the same field behaviour.
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 0,
  borderBottom: '1px solid var(--rule)',
  borderRadius: 0,
  padding: '8px 0',
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  fontFamily: 'var(--serif)',
  fontSize: 16,
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

/** A loosely-typed selectable entry — the shape the memory/letter/voice APIs return. */
interface ChapterEntry {
  id: string;
  title?: string;
  subject?: string;
  created_at?: string;
  date?: string;
  createdAt?: string;
  author_name?: string;
  authorName?: string;
  author?: { name?: string };
  metadata?: unknown;
  dye?: unknown;
}

/** A bound entry's chapter year — from any of the date fields the APIs return. */
function chapterYear(it: { created_at?: string; date?: string; createdAt?: string }): string {
  const d = it?.created_at || it?.date || it?.createdAt;
  const y = d ? new Date(d).getFullYear() : NaN;
  return Number.isFinite(y) ? String(y) : '';
}

/** The author hand behind an entry — first name only, for the mono right cluster. */
function chapterAuthor(it: { author_name?: string; authorName?: string; author?: { name?: string } }): string {
  const raw = it?.author_name || it?.authorName || it?.author?.name || '';
  return raw.trim().split(/\s+/)[0] || '';
}

/** The dye this chapter inherits — saved metadata first, else stable id hash. */
function chapterDye(it: { id: string; metadata?: unknown; dye?: unknown }): Dye {
  return dyeFromMetadata(it?.metadata ?? it) ?? dyeForId(it.id);
}

/** placeholder marks inside a template thumbnail — serif/mono rules + a photo block */
function LayoutGlyph({ layout, active }: { layout: PageLayout; active: boolean }) {
  const ink = active ? 'var(--warm-dim, rgba(176,122,74,0.5))' : 'var(--rule)';
  const photo: React.CSSProperties = {
    background: active ? 'rgba(176,122,74,0.16)' : 'rgba(244,236,216,0.06)',
    border: `1px solid ${ink}`,
    borderRadius: 0,
  };
  const line = (w: string): React.CSSProperties => ({ height: 2, width: w, background: ink, borderRadius: 0 });
  const lines = (n: number) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, justifyContent: 'center' }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={line(i === n - 1 ? '62%' : '100%')} />
      ))}
    </div>
  );
  switch (layout) {
    case 'full-bleed':
      // a centred photo plate with a serif caption + a few body lines beneath
      return (
        <>
          <div style={{ ...photo, flex: 1.6 }} />
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 9, color: active ? 'var(--warm)' : 'var(--bone-dim)', lineHeight: 1 }}>
            Full bleed memory
          </span>
          {lines(2)}
        </>
      );
    case 'photo-caption':
      // a tall block of body text with a small inset portrait
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {lines(4)}
          <div style={{ ...photo, height: 16, width: 22, alignSelf: 'flex-end' }} />
          {lines(2)}
        </div>
      );
    case 'chapter-open':
      return (
        <>
          <div style={{ ...line('40%'), height: 3, alignSelf: 'center', marginTop: 2 }} />
          {lines(5)}
        </>
      );
    case 'two-column':
      return (
        <div style={{ display: 'flex', gap: 6, flex: 1 }}>
          {lines(6)}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, justifyContent: 'flex-end' }}>
            {lines(3)}
            <div style={{ ...photo, height: 16 }} />
          </div>
        </div>
      );
    case 'quote':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, justifyContent: 'center', alignItems: 'center', padding: '0 8px' }}>
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, color: ink, lineHeight: 0.6 }}>“</span>
          <div style={line('78%')} />
          <div style={line('92%')} />
          <div style={line('60%')} />
          <div style={{ ...photo, height: 14, width: 16, marginTop: 4 }} />
        </div>
      );
  }
}

/** The bound volume itself — a glowing filament book with the ∞ wax seal on its
 *  cover. Content-integrated (it IS the volume being made), so it lives in the
 *  page, not in the global backdrop. Pure SVG line-work, one warm hue. */
function GlowingBook() {
  return (
    <div aria-hidden style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 4px' }}>
      <svg
        width="232"
        height="200"
        viewBox="0 0 232 200"
        fill="none"
        style={{ filter: 'drop-shadow(0 0 22px var(--warm-glow)) drop-shadow(0 0 6px var(--warm-glow))' }}
      >
        {/* spine + cover block, drawn as a slight isometric volume */}
        <g stroke="var(--warm)" strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round">
          {/* front cover */}
          <path d="M58 44 L150 30 L150 158 L58 172 Z" opacity="0.95" />
          {/* page block / fore-edge */}
          <path d="M150 30 L186 44 L186 168 L150 158 Z" opacity="0.6" />
          <path d="M58 172 L94 184 L186 168" opacity="0.6" />
          {/* leaf hairlines along the fore-edge */}
          <path d="M154 40 L182 52" opacity="0.32" />
          <path d="M154 60 L182 72" opacity="0.32" />
          <path d="M154 80 L182 92" opacity="0.32" />
          <path d="M154 100 L182 112" opacity="0.32" />
          <path d="M154 120 L182 132" opacity="0.32" />
          {/* cover inner frame */}
          <path d="M70 58 L138 48 L138 146 L70 156 Z" opacity="0.35" />
        </g>
        {/* the ∞ wax seal medallion centred on the cover */}
        <g transform="translate(104 92)">
          <circle r="18" fill="none" stroke="var(--warm)" strokeWidth="1.25" opacity="0.9" />
          <circle r="13" fill="none" stroke="var(--warm)" strokeWidth="0.75" opacity="0.5" />
          <text
            x="0"
            y="1"
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--warm)"
            style={{ fontSize: 18, fontFamily: 'var(--serif)' }}
          >
            ∞
          </text>
        </g>
      </svg>
    </div>
  );
}

export function BookBuilder() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const defaultThreadId = user?.defaultThreadId ?? undefined;
  const [step, setStep] = useState<BookStep>('select');
  const [pageLayout, setPageLayout] = useState<PageLayout>('full-bleed');
  const [copies, setCopies] = useState<number>(1);
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
        title: config.title.trim() || undefined,
        subtitle: config.subtitle.trim() || undefined,
        dedication: config.dedicationText.trim() || undefined,
        memory_ids: config.memoryIds,
        letter_ids: config.letterIds,
        voice_ids: config.voiceIds,
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
      <div style={{ maxWidth: 'var(--page-max-wide)', margin: '0 auto', padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)' }}>

        {/* Header — mono eyebrow + giant serif prompt, contextual to the step (COMPOSER) */}
        <CosmicHeader eyebrow={stepPrompts[step].eyebrow} title={stepPrompts[step].prompt} align="center" />
        <p
          className="hl-mono"
          style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--warm)', textAlign: 'center', margin: '-20px 0 56px' }}
        >
          {currentStepIndex + 1} of {stepOrder.length} · {stepLabels[step]}
        </p>

        {/* Step progress — compact hairline rail (mockup rhythm) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, maxWidth: 640, margin: '0 auto 48px', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
          {stepOrder.map((s, i) => (
            <div key={s} style={{ flex: 1, position: 'relative', padding: '14px 0', textAlign: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  top: -1,
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
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: i <= currentStepIndex ? 'var(--warm)' : 'var(--bone-faint)',
                  transition: 'color 360ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                {stepLabels[s]}
              </span>
            </div>
          ))}
        </div>

        {/* the binding screen widens to seat the floating page preview; every
            other step keeps the quiet 640 measure. */}
        <style>{`
          @media (min-width: 900px) {
            .hl-bind-grid { grid-template-columns: minmax(0, 1fr) 150px !important; }
          }
          @media (max-width: 899px) {
            .hl-bind-preview { display: none !important; }
          }
          .hl-book-field:focus { border-bottom-color: var(--warm) !important; }
          .hl-book-field::placeholder { color: var(--bone-faint); }
        `}</style>

        {/* Step content */}
        <div style={{ maxWidth: step === 'select' ? 900 : 640, margin: '0 auto' }}>

          {/* ── Select — the chapters that become the bound volume ── */}
          {step === 'select' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr)',
                gap: 56,
                alignItems: 'start',
              }}
              className="hl-bind-grid"
            >
              {/* the chapter list — every selected entry is a chapter */}
              <div style={{ display: 'grid', gap: 40 }}>
                <p
                  className="hl-serif"
                  style={{ fontSize: 15, color: 'var(--bone-dim)', margin: 0, fontStyle: 'italic' }}
                >
                  Choose the threads to bind. Each becomes a chapter, kept in its own hand and year.
                </p>

                {([
                  { key: 'memoryIds' as const, label: 'Memories', list: memoryList },
                  { key: 'letterIds' as const, label: 'Letters', list: letterList },
                  { key: 'voiceIds' as const, label: 'Voice recordings', list: voiceList },
                ]).map(({ key, label, list }) => (
                  <div key={key}>
                    {/* chapter/section heading — mono label + mono count */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 2 }}>
                      <SectionLabel>{label}</SectionLabel>
                      <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--warm)', marginLeft: 'auto' }}>
                        {config[key].length} in book
                      </span>
                    </div>
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                      {list.map((item: ChapterEntry) => {
                        const on = config[key].includes(item.id);
                        return (
                          <EntryRow
                            key={item.id}
                            title={item.title || item.subject || 'Untitled'}
                            italic={on}
                            year={chapterYear(item)}
                            dye={chapterDye(item)}
                            author={chapterAuthor(item) || undefined}
                            onClick={() => toggleItem(key, item.id)}
                          />
                        );
                      })}
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
                  {totalItems} chapters chosen · ~{estimatedPages} pages estimated
                </p>

                {/* what goes inside — the include toggles live with the
                    chapters they govern */}
                <RoomSection label="What goes inside">
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
                </RoomSection>
              </div>

              {/* floating page preview — a narrow bound page, decorative only.
                  Hidden below 900px via the .hl-bind-preview rule. */}
              <aside
                aria-hidden
                className="hl-bind-preview"
                style={{
                  position: 'sticky',
                  top: 24,
                  width: 150,
                  height: 210,
                  justifySelf: 'end',
                  border: '1px solid var(--rule)',
                  borderRadius: 0,
                  background: 'var(--paper, rgba(244,236,216,0.04))',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '18px 16px 16px',
                  opacity: 0.7,
                }}
              >
                <span className="hl-mono" style={{ fontSize: 7, letterSpacing: '0.3em', color: 'var(--bone-faint)' }}>
                  CHAPTER {String(totalItems || 1).padStart(2, '0')}
                </span>
                <span
                  className="hl-serif"
                  style={{ fontSize: 14, lineHeight: 1.25, color: 'var(--bone-dim)', fontStyle: 'italic' }}
                >
                  {config.title}
                </span>
                <WaxSeal size={16} />
              </aside>
            </div>
          )}

          {/* ── Customize — the bound volume (cosmic-book-builder). Reads
              MINIMAL: glowing book with the ∞ seal, then the quiet 3-row
              ledger (Copies / Order / Chapters). The PREVIEW pill is the
              shared step action below. ── */}
          {step === 'customize' && (
            <div style={{ display: 'grid', gap: 28 }}>
              {/* the volume itself — glowing book with the ∞ seal (content) */}
              <GlowingBook />

              {/* the quiet ledger of the volume — serif label left, mono value
                  right (Copies / Order / Chapters, per cosmic-book-builder).
                  Copies carries a quiet +/- stepper. */}
              <div style={{ borderTop: '1px solid var(--rule)', marginTop: 4 }}>
                {/* Copies — value is a quiet mono +/- stepper */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 16,
                    borderBottom: '1px solid var(--rule)',
                    padding: '15px 0',
                  }}
                >
                  <span className="hl-serif" style={{ fontSize: 18, fontWeight: 400, color: 'var(--bone)' }}>
                    Copies
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 14 }}>
                    <button
                      type="button"
                      aria-label="Fewer copies"
                      onClick={() => setCopies((c) => Math.max(1, c - 1))}
                      disabled={copies <= 1}
                      className="hl-mono"
                      style={{
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        cursor: copies <= 1 ? 'default' : 'pointer',
                        fontSize: 14,
                        lineHeight: 1,
                        color: 'var(--warm)',
                        opacity: copies <= 1 ? 0.3 : 1,
                        transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      −
                    </button>
                    <span
                      className="hl-mono"
                      style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--bone-dim)', minWidth: 18, textAlign: 'center' }}
                    >
                      {copies}
                    </span>
                    <button
                      type="button"
                      aria-label="More copies"
                      onClick={() => setCopies((c) => Math.min(99, c + 1))}
                      disabled={copies >= 99}
                      className="hl-mono"
                      style={{
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        cursor: copies >= 99 ? 'default' : 'pointer',
                        fontSize: 14,
                        lineHeight: 1,
                        color: 'var(--warm)',
                        opacity: copies >= 99 ? 0.3 : 1,
                        transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      +
                    </button>
                  </span>
                </div>
                {[
                  { label: 'Order', value: 'Chronological' },
                  { label: 'Chapters', value: 'By decade' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 16,
                      borderBottom: '1px solid var(--rule)',
                      padding: '15px 0',
                    }}
                  >
                    <span className="hl-serif" style={{ fontSize: 18, fontWeight: 400, color: 'var(--bone)' }}>
                      {label}
                    </span>
                    <span className="hl-mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--bone-dim)' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── The page — its own step (cosmic-page-templates). A 2×2 grid of
              template thumbnails; the chosen layout carries a warm border. The
              "APPLY TO CHAPTER" pill (shared step action below) advances to
              preview. ── */}
          {step === 'page' && (
            <div style={{ display: 'grid', gap: 28 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 'clamp(16px, 4vw, 30px)',
                }}
              >
                {pageLayouts.map(({ id, label }) => {
                  const active = pageLayout === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPageLayout(id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      {/* the page-shaped thumbnail — warm border when chosen */}
                      <span
                        aria-hidden
                        style={{
                          width: '100%',
                          aspectRatio: '0.78',
                          border: `1px solid ${active ? 'var(--warm)' : 'var(--rule)'}`,
                          background: active ? 'rgba(176,122,74,0.05)' : 'var(--ink-card)',
                          padding: active ? 11 : 12,
                          outline: active ? '1px solid var(--warm-dim, rgba(176,122,74,0.5))' : 'none',
                          outlineOffset: 5,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          overflow: 'hidden',
                          transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                        }}
                      >
                        <LayoutGlyph layout={id} active={active} />
                      </span>
                      <span
                        className="hl-mono"
                        style={{
                          fontSize: 9,
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          color: active ? 'var(--warm)' : 'var(--bone-faint)',
                          transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                        }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
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
                  position: 'relative',
                  width: 232,
                  height: 320,
                  margin: '0 auto 32px',
                  background: 'var(--ink-card)',
                  border: '1px solid var(--warm)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 16,
                  borderRadius: 0,
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
                        'repeating-linear-gradient(90deg, var(--rule) 0 0.5px, transparent 0.5px 9px)',
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
                <WaxSeal size={13} />

                {/* Wax seal mark — lower right (mockup) */}
                <span
                  className="hl-mono"
                  aria-hidden
                  style={{
                    position: 'absolute',
                    right: 18,
                    bottom: 64,
                    width: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--warm)',
                    borderRadius: 0,
                    color: 'var(--warm)',
                    fontSize: 13,
                  }}
                >
                  ∞
                </span>
              </div>

              <p className="hl-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.14em', margin: '0 0 16px', textTransform: 'capitalize' }}>
                {totalItems} items · ~{estimatedPages} pages · full-colour {config.coverType} · {pageLayouts.find((l) => l.id === pageLayout)?.label} layout
              </p>
              <p className="hl-serif" style={{ fontSize: 15, color: 'var(--bone-dim)', margin: 0, maxWidth: 360, marginInline: 'auto', fontStyle: 'italic' }}>
                Every entry is one thread, dyed to its kind. This is your cloth as it stands today.
              </p>
            </div>
          )}

          {/* ── Order ── */}
          {step === 'order' && (
            <div style={{ maxWidth: 480 }}>
              {/* Inscription — title / subtitle / dedication, flat serif
                  underline fields (relocated off customize to keep that screen
                  minimal; all three stay wired to the export call). */}
              <h3 className="hl-serif" style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', margin: '0 0 20px' }}>
                The inscription
              </h3>
              <div style={{ display: 'grid', gap: 28, marginBottom: 40 }}>
                <div>
                  <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Book title</label>
                  <input
                    type="text"
                    className="hl-book-field"
                    value={config.title}
                    onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                    style={{ ...inputStyle, fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 380, lineHeight: 1.2 }}
                  />
                </div>
                <div>
                  <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Subtitle (optional)</label>
                  <input
                    type="text"
                    className="hl-book-field"
                    value={config.subtitle}
                    onChange={(e) => setConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="A collection of our most precious moments"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="hl-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Dedication</label>
                  <textarea
                    className="hl-book-field"
                    value={config.dedicationText}
                    onChange={(e) => setConfig((prev) => ({ ...prev, dedicationText: e.target.value }))}
                    placeholder="For my children, with all my love…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>

                {/* Cover type — relocated here, next to the pricing it drives.
                    Hairline-separated ledger rows; the chosen cover carries a
                    warm BOUND marker. */}
                <RoomSection label="Cover type">
                  <div style={{ borderTop: '1px solid var(--rule)' }}>
                    {(['hardcover', 'softcover'] as const).map((type) => {
                      const on = config.coverType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, coverType: type }))}
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            gap: 16,
                            width: '100%',
                            background: 'transparent',
                            border: 0,
                            borderBottom: '1px solid var(--rule)',
                            padding: '15px 0',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                          }}
                        >
                          <span style={{ minWidth: 0 }}>
                            <span
                              className="hl-serif"
                              style={{
                                display: 'block',
                                fontSize: 18,
                                fontWeight: 400,
                                fontStyle: on ? 'italic' : 'normal',
                                textTransform: 'capitalize',
                                color: on ? 'var(--warm)' : 'var(--bone)',
                              }}
                            >
                              {type}
                            </span>
                            <span className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-faint)', letterSpacing: '0.04em' }}>
                              {type === 'hardcover' ? 'Full-colour · case-wrap' : 'Full-colour · softcover'}
                            </span>
                          </span>
                          <span
                            className="hl-mono"
                            style={{
                              fontSize: 10,
                              letterSpacing: '0.2em',
                              textTransform: 'uppercase',
                              color: on ? 'var(--warm)' : 'var(--bone-faint)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {on ? 'Bound' : 'Choose'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </RoomSection>
              </div>

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
                  { label: 'Copies', value: String(copies) },
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
                    className="hl-book-field"
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
                    className="hl-book-field"
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
                    className="hl-book-field"
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
                      className="hl-book-field"
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
                      className="hl-book-field"
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
                      className="hl-book-field"
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
                      className="hl-book-field"
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
                    className="hl-book-field"
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
                    className="hl-book-field"
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
                  className="hl-mono"
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: '6px 0 0',
                    marginTop: 6,
                    cursor: orderMutation.isPending ? 'default' : 'pointer',
                    fontSize: 12,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--warm)',
                    textAlign: 'left',
                    opacity: orderMutation.isPending ? 0.45 : 1,
                  }}
                >
                  {orderMutation.isPending ? (
                    <span style={{ textTransform: 'none', letterSpacing: '0.04em' }}>Processing…</span>
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

        {/* Navigation — centred outlined action over a quiet back link (mockup) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 22,
            maxWidth: 640,
            margin: '64px auto 0',
            paddingTop: 36,
            borderTop: '1px solid var(--rule)',
          }}
        >
          {step !== 'order' && (
            <button
              type="button"
              onClick={() => setStep(stepOrder[currentStepIndex + 1])}
              disabled={step === 'select' && totalItems === 0}
              className="hl-mono"
              style={{
                background: 'transparent',
                border: '1px solid var(--warm)',
                borderRadius: 999,
                padding: '15px 56px',
                cursor: step === 'select' && totalItems === 0 ? 'default' : 'pointer',
                fontSize: 11,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                opacity: step === 'select' && totalItems === 0 ? 0.4 : 1,
                transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {step === 'select' ? 'Bind the Volume' : step === 'customize' ? 'Preview' : step === 'page' ? 'Apply to Chapter' : 'Continue'}
            </button>
          )}

          {/* the warm ∞ seal beneath the binding CTA */}
          {step === 'select' && <WaxSeal size={26} />}

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
            }}
          >
            ← {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </button>
        </div>
      </div>
    </ClothShell>
  );
}

export default BookBuilder;
