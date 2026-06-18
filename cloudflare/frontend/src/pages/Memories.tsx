import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { Link } from 'react-router-dom';
import { useListener } from '../hooks/useListener';
import { type Memory } from '../types';
import { WaxSeal, SectionLabel } from '../loom/cosmic/CosmicUI';
import { ProgressHair } from '../loom/components/ProgressHair';
import { RoomError } from '../loom/components/RoomError';

const DYE_COLORS: Record<string, string> = {
  memory:    'var(--dye-madder)',
  letter:    'var(--dye-indigo)',
  voice:     'var(--dye-saffron)',
  event:     'var(--dye-weld)',
  milestone: 'var(--dye-cochineal)',
};


/** The lived date the author assigned (entryDate) wins over the row's createdAt. */
function entryDateOf(m: Memory): string {
  return m.metadata?.entryDate || m.createdAt || m.created_at || '';
}

/** A person this entry is addressed to / about, when recorded in metadata. */
function personOf(m: Memory): string | null {
  const p = m.metadata?.to || m.metadata?.recipientName;
  return p && p.trim() ? p.trim() : null;
}

/** The displayable image for an entry, if it has one. */
function imageOf(m: Memory): string | null {
  if (m.fileUrl && m.mimeType && m.mimeType.startsWith('image/')) return m.fileUrl;
  if (m.fileUrl && (m.type === 'PHOTO' || m.type === 'photo')) return m.fileUrl;
  const first = m.metadata?.images?.[0]?.fileUrl;
  return first || null;
}

type Filters = { year: string; month: string; type: string; query: string; emotion: string; person: string };
const EMPTY_FILTERS: Filters = { year: '', month: '', type: '', query: '', emotion: '', person: '' };

/**
 * A single ledger row for one woven memory. The serif title rests on the left;
 * a mono cluster of entry-year + dye dot + author/type rests on the right. The
 * row's click-through opens the entry inline — revealing its full prose, any
 * photograph, and the quiet mono edit / delete affordances.
 */
function MemoryRow({ m, index, activeEmotion }: { m: Memory; index: number; activeEmotion?: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(m.description ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [visible, setVisible] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [mutError, setMutError] = useState<string | null>(null);

  const updateMut = useMutation({
    mutationFn: () => memoriesApi.update(m.id, { description: editText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] });
      setEditing(false);
      setMutError(null);
    },
    onError: () => setMutError('Could not save changes.'),
  });

  const deleteMut = useMutation({
    mutationFn: () => memoriesApi.delete(m.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] }),
    onError: () => setMutError('Could not remove this entry.'),
  });

  const typeKey = (m.type as string) ?? 'memory';
  const dyeColor = DYE_COLORS[typeKey] ?? DYE_COLORS['memory'];
  const entryDate = new Date(entryDateOf(m));
  const monthYear = isNaN(entryDate.getTime())
    ? ''
    : `${MONTHS[entryDate.getMonth()]} ${entryDate.getFullYear()}`.toUpperCase();
  const fullDate = isNaN(entryDate.getTime())
    ? ''
    : entryDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  if (deleteMut.isSuccess) return null;

  const delay = Math.min(index % 8, 7) * 56; // stagger within each "batch"
  const title = m.title || (m.description ? (m.description as string).slice(0, 64) : 'Untitled');
  // The quiet italic sub-line beneath the title — the entry's first prose breath.
  const snippet = m.description
    ? (m.description as string).replace(/\s+/g, ' ').trim().slice(0, 56)
    : '';

  return (
    <div
      ref={rowRef}
      style={{
        borderLeft: `3px solid ${dyeColor}`,
        paddingLeft: 14,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity 720ms var(--ease) ${delay}ms, transform 720ms var(--ease) ${delay}ms`,
      }}
    >
      {/* The ledger row — click toggles the entry open. Mirrors EntryRow's
          structure (serif title left; mono year + dye dot + author right). */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="hl-ledger-row"
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 20,
          width: '100%',
          textAlign: 'left',
          padding: '15px 0',
          background: 'none',
          borderWidth: 0,
          borderBottom: '1px solid var(--rule)',
          cursor: 'pointer',
          transition: 'opacity 180ms var(--ease)',
          minHeight: 44,
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="hl-serif" style={{ fontStyle: 'normal', fontWeight: 400, fontSize: 'clamp(20px, 4.5vw, 24px)', lineHeight: 1.22, color: 'var(--bone)', display: 'block' }}>
            {title}
          </span>
          {snippet && (
            <span className="hl-serif" style={{ fontStyle: 'italic', fontWeight: 300, fontSize: 14, lineHeight: 1.5, color: 'var(--bone-dim)', display: 'block', marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {snippet}
            </span>
          )}
        </span>
        {monthYear && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', flex: '0 0 auto', color: 'var(--bone-faint)' }}>
            {monthYear}
          </span>
        )}
      </button>

      {open && (
        <div style={{ padding: '14px 0 22px' }}>
          {/* Full date + edit / delete affordances (mono text, never icons) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
            {fullDate && (
              <span className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {fullDate}
              </span>
            )}
            {!editing && !confirmDelete && (
              <div style={{ display: 'flex', gap: 14 }}>
                <button type="button" onClick={() => { setEditText(m.description ?? ''); setEditing(true); }}
                  className="hl-mono"
                  style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
                  edit
                </button>
                <button type="button" onClick={() => setConfirmDelete(true)}
                  className="hl-mono"
                  style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--warm)' }}>
                  delete
                </button>
              </div>
            )}
          </div>

          {activeEmotion && (() => {
            const em = EMOTIONS.find(e => e.value === activeEmotion);
            return em ? (
              <span style={{
                display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 9,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: em.dye, borderLeft: `2px solid ${em.dye}`,
                paddingLeft: 6, marginBottom: 10, opacity: 0.85,
              }}>
                {em.label}
              </span>
            ) : null;
          })()}

          {imageOf(m) && (
            <img
              src={imageOf(m) as string}
              alt={m.title ?? 'Memory photo'}
              loading="lazy"
              style={{
                display: 'block',
                width: '100%',
                maxWidth: 520,
                height: 'auto',
                marginBottom: 14,
                background: 'var(--rule)',
              }}
            />
          )}

          {personOf(m) && (
            <span className="hl-mono" style={{ display: 'block', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 8 }}>
              for {personOf(m)}
            </span>
          )}

          {editing ? (
            <div>
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={6} autoFocus aria-label="Edit memory text"
                style={{ width: '100%', maxWidth: 640, background: 'transparent', border: '1px solid var(--rule)', borderRadius: 0, color: 'var(--bone)', caretColor: 'var(--warm)', fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.75, padding: '10px 12px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 18, marginTop: 12, alignItems: 'center' }}>
                <button type="button" onClick={() => updateMut.mutate()} disabled={updateMut.isPending}
                  className="hl-mono"
                  style={{ background: 'transparent', border: 0, padding: 0, cursor: updateMut.isPending ? 'wait' : 'pointer', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)', opacity: updateMut.isPending ? 0.6 : 1 }}>
                  {updateMut.isPending ? 'saving…' : 'save'}
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  className="hl-mono"
                  style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
                  cancel
                </button>
              </div>
              {updateMut.isError && (
                <p className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', marginTop: 8, letterSpacing: '0.08em' }}>Could not save — try again.</p>
              )}
            </div>
          ) : (
            (m.description as string) && (
              <p className="hl-serif" style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--bone)', margin: 0, maxWidth: '62ch', whiteSpace: 'pre-wrap' }}>
                {m.description as string}
              </p>
            )
          )}

          {confirmDelete && (
            <div style={{ marginTop: 14, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="hl-mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>Unweave this thread?</span>
              <button type="button" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}
                className="hl-mono"
                style={{ background: 'transparent', border: 0, padding: '6px 0', cursor: deleteMut.isPending ? 'wait' : 'pointer', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)', opacity: deleteMut.isPending ? 0.6 : 1, touchAction: 'manipulation', minHeight: 44 }}>
                {deleteMut.isPending ? 'removing…' : 'confirm'}
              </button>
              <button type="button" onClick={() => { setConfirmDelete(false); setMutError(null); }}
                className="hl-mono"
                style={{ background: 'transparent', border: 0, padding: '6px 0', cursor: 'pointer', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-faint)', touchAction: 'manipulation', minHeight: 44 }}>
                cancel
              </button>
            </div>
          )}
          {mutError && (
            <p className="hl-mono" role="alert" style={{ fontSize: 11, color: 'var(--warm)', letterSpacing: '0.1em', marginTop: 10 }}>{mutError}</p>
          )}

          <div className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-faint)', letterSpacing: '0.16em', marginTop: 14 }}>
            #{(index + 1).toString().padStart(3, '0')}
          </div>
        </div>
      )}
    </div>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ENTRY_TYPES = [
  { value: '', label: 'all' },
  { value: 'memory', label: 'memory' },
  { value: 'letter', label: 'letter' },
  { value: 'voice', label: 'voice' },
  { value: 'event', label: 'event' },
  { value: 'milestone', label: 'milestone' },
];

// Emotion chips — each maps to a dye color + keyword set for fallback matching
const EMOTIONS: { value: string; label: string; dye: string; keywords: string[] }[] = [
  { value: 'joy',       label: 'joy',       dye: 'var(--dye-saffron)',   keywords: ['happy','joy','laugh','smile','celebrat','wonderful','fun','delight','excit','gleeful','cheer'] },
  { value: 'love',      label: 'love',      dye: 'var(--dye-madder)',    keywords: ['love','adore','cherish','dear','beloved','heart','tender','together','miss you','closeness'] },
  { value: 'grief',     label: 'grief',     dye: 'var(--dye-indigo)',    keywords: ['grief','sad','loss','miss','cry','tear','hurt','pain','difficult','passed','died','mourn','ache'] },
  { value: 'pride',     label: 'pride',     dye: 'var(--dye-cochineal)', keywords: ['proud','pride','accompl','achiev','graduat','success','earned','grew','strong'] },
  { value: 'nostalgia', label: 'nostalgia', dye: 'var(--dye-walnut)',    keywords: ['remember','long ago','childhood','used to','when i was','back then','old days','years ago','once','still recall'] },
  { value: 'gratitude', label: 'gratitude', dye: 'var(--dye-weld)',      keywords: ['grateful','thank','blessed','appreci','fortune','lucky','gift','fortune'] },
  { value: 'wonder',    label: 'wonder',    dye: 'var(--dye-woad)',      keywords: ['amaz','wonder','incredible','beautiful','unexpect','surprised','magical','astonish','awe','breathtaking'] },
];

function emotionMatchesMemory(m: Memory, emotionValue: string): boolean {
  // First check explicit emotion field from API
  if (m.emotion) return m.emotion.toLowerCase() === emotionValue;
  // Fall back to keyword scan across title + description
  const em = EMOTIONS.find(e => e.value === emotionValue);
  if (!em) return false;
  const haystack = `${m.title ?? ''} ${m.description ?? ''}`.toLowerCase();
  return em.keywords.some(kw => haystack.includes(kw));
}

/** The quiet mono control bar above the ledger — search, type, year, month, person, emotion. */
function FilterBar({ memories, filters, setFilters }: {
  memories: Memory[];
  filters: Filters;
  setFilters: (f: Filters) => void;
}) {
  const years = Array.from(new Set(
    memories.map(m => new Date(entryDateOf(m)).getFullYear())
  )).sort((a, b) => b - a);

  const people = Array.from(new Set(
    memories.map(personOf).filter((p): p is string => !!p)
  )).sort((a, b) => a.localeCompare(b));

  const selectStyle: React.CSSProperties = {
    background: 'transparent',
    border: 0,
    borderBottom: '1px solid var(--rule)',
    borderRadius: 0,
    color: 'var(--bone-dim)',
    fontFamily: 'var(--mono)',
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    padding: '5px 2px',
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    minHeight: 32,
  };

  const active = filters.year || filters.month || filters.type || filters.query || filters.emotion || filters.person;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
      {/* Row 1: search + type + year + month + clear */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="search"
          value={filters.query}
          onChange={e => setFilters({ ...filters, query: e.target.value })}
          style={{ ...selectStyle, minWidth: 130 }}
        />

        <select aria-label="Filter by type" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })} style={selectStyle}>
          {ENTRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <select aria-label="Filter by year" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} style={selectStyle}>
          <option value="">all years</option>
          {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>

        <select aria-label="Filter by month" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} style={selectStyle}>
          <option value="">all months</option>
          {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
        </select>

        {people.length > 0 && (
          <select aria-label="Filter by person" value={filters.person} onChange={e => setFilters({ ...filters, person: e.target.value })} style={selectStyle}>
            <option value="">all people</option>
            {people.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}

        {active && (
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="hl-mono"
            style={{
              background: 'transparent', border: 0, padding: 0,
              cursor: 'pointer',
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--warm)', minHeight: 32,
            }}
          >
            clear ×
          </button>
        )}
      </div>

      {/* Row 2: emotion chips */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9,
          letterSpacing: '0.3em', textTransform: 'uppercase',
          color: 'var(--bone-faint)', marginRight: 2,
        }}>
          feel
        </span>
        {EMOTIONS.map(em => {
          const isOn = filters.emotion === em.value;
          return (
            <button
              key={em.value}
              type="button"
              onClick={() => setFilters({ ...filters, emotion: isOn ? '' : em.value })}
              style={{
                background: 'transparent',
                border: 0,
                borderBottom: `1px solid ${isOn ? em.dye : 'transparent'}`,
                borderRadius: 0,
                padding: '2px 0',
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: isOn ? em.dye : 'var(--bone-faint)',
                transition: 'color 180ms var(--ease), border-color 180ms var(--ease)',
                minHeight: 28,
                whiteSpace: 'nowrap',
              }}
            >
              {em.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Memories() {
  const { isAuthenticated, user } = useAuthStore();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const { prompt: listenerPrompt } = useListener();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['memories-mosaic'],
    queryFn: () => memoriesApi.getAll({ limit: 200 }).then((r) => (r.data as any)?.data ?? []),
    enabled: isAuthenticated,
  });

  const allMemories: Memory[] = Array.isArray(data) ? data : [];

  // The thread's name + lived year span — the mono eyebrow over the ledger.
  const threadName = `The ${user?.lastName ?? ''} Thread`.replace(/\s+/g, ' ').trim();
  const years = allMemories
    .map(m => new Date(entryDateOf(m)).getFullYear())
    .filter(y => !isNaN(y));
  const yearRange = years.length
    ? (() => {
        const lo = Math.min(...years);
        const hi = Math.max(...years);
        return lo === hi ? String(lo) : `${lo}–${hi}`;
      })()
    : '';
  const eyebrow = [threadName.toUpperCase(), yearRange].filter(Boolean).join(' · ');

  const memories = allMemories
    .filter(m => {
      const d = new Date(entryDateOf(m));
      if (filters.year && String(d.getFullYear()) !== filters.year) return false;
      if (filters.month && String(d.getMonth() + 1) !== filters.month) return false;
      if (filters.type && (m.type ?? 'memory') !== filters.type) return false;
      if (filters.query) {
        const q = filters.query.toLowerCase();
        if (!`${m.title ?? ''} ${m.description ?? ''}`.toLowerCase().includes(q)) return false;
      }
      if (filters.emotion && !emotionMatchesMemory(m, filters.emotion)) return false;
      if (filters.person && personOf(m) !== filters.person) return false;
      return true;
    })
    .sort((a, b) => {
      // When filtering (emotion or other filters active), sort newest-first
      const da = new Date(entryDateOf(a)).getTime();
      const db = new Date(entryDateOf(b)).getTime();
      return db - da;
    });

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'today', to: '/loom/today' }, { label: 'memories' }]} />}
      topbarRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span className="hl-mono" style={{ fontSize: 12, color: 'var(--bone-dim)', letterSpacing: '0.1em' }}>
            {memories.length}/{allMemories.length}
          </span>
          <Link to="/compose" className="hl-link" style={{ fontSize: 12, letterSpacing: '0.08em' }}>write</Link>
          <Link to="/photo" className="hl-link" style={{ fontSize: 12, letterSpacing: '0.08em' }}>photo</Link>
          <Link to="/record" className="hl-link warm" style={{ fontSize: 12, letterSpacing: '0.08em' }}>voice</Link>
        </div>
      }
    >
      {isLoading && (
        <div style={{ padding: 'clamp(40px, 8vw, 72px) var(--page-pad-x) 0' }}>
          <ProgressHair label="drawing the thread…" />
        </div>
      )}

      {/* A failed read must never collapse into the first-run empty state —
          surface the in-voice retry instead so a returning author isn't told
          the cloth was never woven. */}
      {!isLoading && isError && (
        <div style={{ padding: 'clamp(40px, 8vw, 80px) var(--page-pad-x)' }}>
          <RoomError onRetry={() => refetch()} />
        </div>
      )}

      {/* The ledger header — a single quiet mono line naming the thread and the
          span of years it holds, set in centred small-caps over the ledger.
          The quiet filter bar follows beneath it. */}
      {!isLoading && !isError && allMemories.length > 0 && (
        <div style={{ padding: 'clamp(40px, 8vw, 72px) var(--page-pad-x) 0' }}>
          <div
            role="heading"
            aria-level={1}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              textAlign: 'center',
              marginBottom: 'clamp(28px, 5vw, 44px)',
            }}
          >
            {eyebrow || `${memories.length} WOVEN`}
          </div>
          <FilterBar memories={allMemories} filters={filters} setFilters={setFilters} />
        </div>
      )}

      {!isLoading && !isError && memories.length === 0 && allMemories.length > 0 && (
        <div style={{ padding: '0 var(--page-pad-x) 24px' }}>
          <p className="hl-serif" style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontStyle: 'italic', color: 'var(--bone-dim)', lineHeight: 1.6, margin: 0 }}>
            {filters.query
              ? `Nothing here matches “${filters.query}.”`
              : filters.emotion
                ? 'No threads carry this feeling yet.'
                : 'No threads found for this filter.'}
          </p>
        </div>
      )}

      {!isLoading && !isError && allMemories.length === 0 && (
        <div style={{ padding: 'clamp(40px, 8vw, 80px) var(--page-pad-x)' }}>
          <p
            role="heading"
            aria-level={1}
            style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 500, color: 'var(--bone)', lineHeight: 1.2, margin: '0 0 12px' }}
          >
            The cloth has not yet been woven.
          </p>
          <p
            className="hl-serif"
            style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--bone-faint)', lineHeight: 1.75, maxWidth: '46ch', margin: '0 0 32px' }}
          >
            Every family starts with one thread.<br />
            Write what only you remember.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 56 }}>
            <Link to="/compose" className="hl-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Write a memory →
            </Link>
            <Link to="/photo" className="hl-link warm" style={{ fontSize: 14 }}>
              add a photograph →
            </Link>
            <Link to="/record" className="hl-link warm" style={{ fontSize: 14 }}>
              record a voice →
            </Link>
          </div>
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 24, maxWidth: '46ch' }}>
            <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 10, color: 'var(--bone-faint)' }}>
              the listener
            </span>
            <p className="hl-serif" style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--bone-dim)', lineHeight: 1.7, margin: 0 }}>
              {listenerPrompt}
            </p>
          </div>
        </div>
      )}

      {/* The ledger — hairline-ruled entry rows, grouped by decade. A mono
          SectionLabel (e.g. 1940s) opens each new decade as it falls. */}
      {memories.length > 0 && (
        <div style={{
          padding: '0 var(--page-pad-x)',
          paddingBottom: 'clamp(32px, 6vw, 64px)',
        }}>
          {memories.map((m, i) => {
            const d = new Date(entryDateOf(m));
            const decade = isNaN(d.getTime()) ? null : Math.floor(d.getFullYear() / 10) * 10;
            const prev = i > 0 ? new Date(entryDateOf(memories[i - 1])) : null;
            const prevDecade = prev && !isNaN(prev.getTime()) ? Math.floor(prev.getFullYear() / 10) * 10 : null;
            const showLabel = decade != null && decade !== prevDecade;
            return (
              <div key={m.id}>
                {showLabel && <SectionLabel>{`${decade}s`}</SectionLabel>}
                <MemoryRow m={m} index={i} activeEmotion={filters.emotion || undefined} />
              </div>
            );
          })}
        </div>
      )}

      {allMemories.length > 0 && (
        <div style={{
          padding: 'clamp(20px, 4vw, 40px) var(--page-pad-x)',
          paddingBottom: 'var(--page-clear)',
          borderTop: '1px solid var(--rule)',
        }}>
          <WaxSeal size={28} />
          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <span className="hl-eyebrow" style={{ display: 'inline', color: 'var(--bone-faint)', marginRight: 14 }}>
              the listener
            </span>
            <span
              className="hl-serif"
              style={{ fontStyle: 'italic', color: 'var(--bone-faint)', fontSize: 14, lineHeight: 1.6 }}
            >
              {listenerPrompt}
            </span>
          </div>
        </div>
      )}
    </ClothShell>
  );
}
