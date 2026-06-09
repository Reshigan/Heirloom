import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { Link } from 'react-router-dom';
import { useListener } from '../hooks/useListener';
import { type Memory } from '../types';

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

function MemoryCard({ m, index, activeEmotion }: { m: Memory; index: number; activeEmotion?: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(m.description ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = cardRef.current;
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

  const dyeColor = DYE_COLORS[(m.type as string) ?? 'memory'] ?? DYE_COLORS['memory'];
  const dateStr = new Date(entryDateOf(m)).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  if (deleteMut.isSuccess) return null;

  const delay = Math.min(index % 6, 5) * 72; // stagger within each "batch" of 6

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        breakInside: 'avoid', marginBottom: 24, paddingLeft: 14,
        borderLeft: `3px solid ${dyeColor}`, position: 'relative',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity 720ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 720ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {/* Date + controls row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {dateStr}
        </span>
        <div className="memory-card-actions" style={{
          display: 'flex', gap: 12,
          opacity: (hovered || editing || confirmDelete) ? 1 : 0,
          transition: 'opacity 180ms var(--ease)',
          pointerEvents: (hovered || editing || confirmDelete) ? 'auto' : 'none',
        }}>
          {!editing && !confirmDelete && (
            <>
              <button type="button" onClick={() => { setEditText(m.description ?? ''); setEditing(true); }}
                className="hl-mono"
                style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
                edit
              </button>
              <button type="button" onClick={() => setConfirmDelete(true)}
                className="hl-mono"
                style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--danger)', opacity: 0.7 }}>
                delete
              </button>
            </>
          )}
        </div>
      </div>

      {activeEmotion && (() => {
        const em = EMOTIONS.find(e => e.value === activeEmotion);
        return em ? (
          <span style={{
            display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 9,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: em.dye, borderLeft: `2px solid ${em.dye}`,
            paddingLeft: 6, marginBottom: 8, opacity: 0.85,
          }}>
            {em.label}
          </span>
        ) : null;
      })()}

      {imageOf(m) && (
        <img
          src={imageOf(m) as string}
          alt={m.title ?? ''}
          loading="lazy"
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            marginBottom: 10,
            background: 'rgba(255,255,255,0.03)',
          }}
        />
      )}

      {m.title && (
        <p className="hl-serif" style={{ fontSize: 13, fontWeight: 400, color: 'var(--bone)', margin: '0 0 6px', letterSpacing: '0.01em' }}>
          {m.title}
        </p>
      )}

      {personOf(m) && (
        <span className="hl-mono" style={{ display: 'inline-block', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 6 }}>
          for {personOf(m)}
        </span>
      )}

      {editing ? (
        <div>
          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={5} autoFocus
            style={{ width: '100%', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 0, color: 'var(--bone)', caretColor: 'var(--warm)', fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.7, padding: '8px 10px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            <button type="button" onClick={() => updateMut.mutate()} disabled={updateMut.isPending}
              style={{ background: 'var(--warm)', color: '#0e0e0c', border: 0, borderRadius: 0, padding: '7px 16px', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: updateMut.isPending ? 'wait' : 'pointer', opacity: updateMut.isPending ? 0.6 : 1 }}>
              {updateMut.isPending ? 'saving…' : 'save'}
            </button>
            <button type="button" onClick={() => setEditing(false)}
              style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
              cancel
            </button>
          </div>
          {updateMut.isError && (
            <p className="hl-mono" style={{ fontSize: 10, color: 'var(--danger)', marginTop: 8, letterSpacing: '0.08em' }}>Could not save — try again.</p>
          )}
        </div>
      ) : (
        <p className="hl-serif" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--bone-dim)', margin: 0 }}>
          {(m.description as string)?.slice(0, 240)}{((m.description as string)?.length ?? 0) > 240 ? '…' : ''}
        </p>
      )}

      {confirmDelete && (
        <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="hl-mono" style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>Delete this memory?</span>
          <button type="button" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}
            style={{ background: 'transparent', border: '1px solid var(--danger)', borderRadius: 0, padding: '6px 14px', cursor: deleteMut.isPending ? 'wait' : 'pointer', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--danger)', opacity: deleteMut.isPending ? 0.6 : 1, touchAction: 'manipulation', minHeight: 44 }}>
            {deleteMut.isPending ? 'deleting…' : 'confirm'}
          </button>
          <button type="button" onClick={() => { setConfirmDelete(false); setMutError(null); }}
            style={{ background: 'transparent', border: 0, padding: '6px 0', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)', touchAction: 'manipulation', minHeight: 44 }}>
            cancel
          </button>
        </div>
      )}
      {mutError && (
        <p className="hl-mono" role="alert" style={{ fontSize: 12, color: 'var(--danger)', letterSpacing: '0.1em', marginTop: 8 }}>{mutError}</p>
      )}

      <div className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-faint)', letterSpacing: '0.1em', marginTop: 10 }}>
        #{(index + 1).toString().padStart(3, '0')}
      </div>
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
    border: '1px solid var(--rule)',
    borderRadius: 0,
    color: 'var(--bone-dim)',
    fontFamily: 'var(--mono)',
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '5px 8px',
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
  };

  const active = filters.year || filters.month || filters.type || filters.query || filters.emotion || filters.person;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
      {/* Row 1: search + type + year + month + clear */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="search"
          value={filters.query}
          onChange={e => setFilters({ ...filters, query: e.target.value })}
          style={{ ...selectStyle, minWidth: 120, paddingLeft: 8 }}
        />

        <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })} style={selectStyle}>
          {ENTRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <select value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} style={selectStyle}>
          <option value="">all years</option>
          {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>

        <select value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} style={selectStyle}>
          <option value="">all months</option>
          {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
        </select>

        {people.length > 0 && (
          <select value={filters.person} onChange={e => setFilters({ ...filters, person: e.target.value })} style={selectStyle}>
            <option value="">all people</option>
            {people.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}

        {active && (
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            style={{
              background: 'transparent', border: 0, padding: 0,
              cursor: 'pointer', fontFamily: 'var(--mono)',
              fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--warm)',
            }}
          >
            clear ×
          </button>
        )}
      </div>

      {/* Row 2: emotion chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--bone-faint)', marginRight: 2,
        }}>
          feel
        </span>
        {EMOTIONS.map(em => {
          const active = filters.emotion === em.value;
          return (
            <button
              key={em.value}
              type="button"
              onClick={() => setFilters({ ...filters, emotion: active ? '' : em.value })}
              style={{
                background: 'transparent',
                border: `1px solid ${active ? em.dye : 'var(--rule)'}`,
                borderRadius: 0,
                padding: '4px 10px',
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: active ? em.dye : 'var(--bone-faint)',
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
  const { isAuthenticated } = useAuthStore();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const listenerPrompt = useListener();

  const { data, isLoading } = useQuery({
    queryKey: ['memories-mosaic'],
    queryFn: () => memoriesApi.getAll({ limit: 200 }).then((r) => (r.data as any)?.data ?? []),
    enabled: isAuthenticated,
  });

  const allMemories: Memory[] = Array.isArray(data) ? data : [];

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
        <progress style={{ width: '100%', height: 1, display: 'block', appearance: 'none', accentColor: 'var(--warm)' }} />
      )}

      {!isLoading && allMemories.length > 0 && (
        <div style={{ padding: 'clamp(16px, 4vw, 32px) clamp(24px, 5vw, 48px) 0' }}>
          <FilterBar memories={allMemories} filters={filters} setFilters={setFilters} />
        </div>
      )}

      {!isLoading && memories.length === 0 && allMemories.length > 0 && (
        <div style={{ padding: '0 clamp(24px, 5vw, 48px) 24px' }}>
          <p className="hl-mono" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
            {filters.query
              ? `no memories match "${filters.query}"`
              : filters.emotion
                ? 'no memories with this emotion yet'
                : 'no memories found for this filter'}
          </p>
        </div>
      )}

      {!isLoading && allMemories.length === 0 && (
        <div style={{ padding: 'clamp(40px, 8vw, 80px) clamp(24px, 6vw, 56px)' }}>
          <p
            className="hl-serif"
            style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 300, color: 'var(--bone)', lineHeight: 1.5, margin: '0 0 12px' }}
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

      <div style={{
        columns: 'var(--mosaic-cols, 3) auto',
        columnGap: 24,
        padding: 'clamp(24px, 5vw, 48px)',
        paddingBottom: allMemories.length > 0 ? 0 : 80,
      }}>
        <style>{`
          @media (max-width: 900px) { :root { --mosaic-cols: 2 } }
          @media (max-width: 540px) { :root { --mosaic-cols: 1 } }
        `}</style>

        {memories.map((m, i) => (
          <MemoryCard key={m.id} m={m} index={i} activeEmotion={filters.emotion || undefined} />
        ))}
      </div>

      {allMemories.length > 0 && (
        <div style={{
          padding: 'clamp(20px, 4vw, 40px) clamp(24px, 5vw, 48px)',
          paddingBottom: 80,
          borderTop: '1px solid var(--rule)',
        }}>
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
      )}
    </ClothShell>
  );
}
