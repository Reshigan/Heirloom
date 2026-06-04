import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';
import { Link } from 'react-router-dom';
import { useListener } from '../hooks/useListener';

const DYE_COLORS: Record<string, string> = {
  memory:    'var(--dye-madder)',
  letter:    'var(--dye-indigo)',
  voice:     'var(--dye-saffron)',
  event:     'var(--dye-weld)',
  milestone: 'var(--dye-cochineal)',
};

interface Memory {
  id: string;
  title?: string | null;
  description?: string | null;
  type?: string;
  createdAt?: string;
  created_at?: string;
}

function MemoryCard({ m, index }: { m: Memory; index: number }) {
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

  const updateMut = useMutation({
    mutationFn: () => memoriesApi.update(m.id, { description: editText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] });
      setEditing(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => memoriesApi.delete(m.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] }),
  });

  const dyeColor = DYE_COLORS[(m.type as string) ?? 'memory'] ?? DYE_COLORS['memory'];
  const dateStr = new Date(m.createdAt ?? m.created_at ?? '').toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  if (deleteMut.isSuccess) return null;

  const delay = Math.min(index % 6, 5) * 55; // stagger within each "batch" of 6

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
        transition: `opacity 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
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
          transition: 'opacity 180ms ease',
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
                style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dye-madder)', opacity: 0.7 }}>
                delete
              </button>
            </>
          )}
        </div>
      </div>

      {m.title && (
        <p className="hl-serif" style={{ fontSize: 13, fontWeight: 400, color: 'var(--bone)', margin: '0 0 6px', letterSpacing: '0.01em' }}>
          {m.title}
        </p>
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
            <p className="hl-mono" style={{ fontSize: 10, color: 'var(--dye-madder)', marginTop: 8, letterSpacing: '0.08em' }}>Could not save — try again.</p>
          )}
        </div>
      ) : (
        <p className="hl-serif" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--bone-dim)', margin: 0 }}>
          {(m.description as string)?.slice(0, 240)}{((m.description as string)?.length ?? 0) > 240 ? '…' : ''}
        </p>
      )}

      {confirmDelete && (
        <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
          <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>Delete this memory?</span>
          <button type="button" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}
            style={{ background: 'transparent', border: '1px solid var(--dye-madder)', borderRadius: 0, padding: '5px 12px', cursor: deleteMut.isPending ? 'wait' : 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dye-madder)', opacity: deleteMut.isPending ? 0.6 : 1 }}>
            {deleteMut.isPending ? 'deleting…' : 'confirm'}
          </button>
          <button type="button" onClick={() => setConfirmDelete(false)}
            style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
            cancel
          </button>
        </div>
      )}

      <div className="hl-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.1em', marginTop: 10 }}>
        #{(index + 1).toString().padStart(3, '0')}
      </div>
    </div>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const EMOTION_TYPES = [
  { value: '', label: 'all' },
  { value: 'memory', label: 'memory' },
  { value: 'letter', label: 'letter' },
  { value: 'voice', label: 'voice' },
  { value: 'event', label: 'event' },
  { value: 'milestone', label: 'milestone' },
];

function FilterBar({ memories, filters, setFilters }: {
  memories: Memory[];
  filters: { year: string; month: string; type: string; query: string };
  setFilters: (f: { year: string; month: string; type: string; query: string }) => void;
}) {
  const years = Array.from(new Set(
    memories.map(m => new Date(m.createdAt ?? m.created_at ?? '').getFullYear())
  )).sort((a, b) => b - a);

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

  const active = filters.year || filters.month || filters.type || filters.query;

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
      <input
        type="text"
        placeholder="search"
        value={filters.query}
        onChange={e => setFilters({ ...filters, query: e.target.value })}
        style={{ ...selectStyle, border: '1px solid var(--rule)', minWidth: 120, paddingLeft: 8 }}
      />

      <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })} style={selectStyle}>
        {EMOTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      <select value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} style={selectStyle}>
        <option value="">all years</option>
        {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
      </select>

      <select value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} style={selectStyle}>
        <option value="">all months</option>
        {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
      </select>

      {active && (
        <button type="button"
          onClick={() => setFilters({ year: '', month: '', type: '', query: '' })}
          style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--warm)' }}>
          clear ×
        </button>
      )}
    </div>
  );
}

export function Memories() {
  const { isAuthenticated } = useAuthStore();
  const [filters, setFilters] = useState({ year: '', month: '', type: '', query: '' });
  const listenerPrompt = useListener();

  const { data, isLoading } = useQuery({
    queryKey: ['memories-mosaic'],
    queryFn: () => memoriesApi.getAll({ limit: 200 }).then((r) => (r.data as any)?.data ?? []),
    enabled: isAuthenticated,
  });

  const allMemories = (data as Memory[]) ?? [];

  const memories = allMemories.filter(m => {
    const d = new Date(m.createdAt ?? m.created_at ?? '');
    if (filters.year && String(d.getFullYear()) !== filters.year) return false;
    if (filters.month && String(d.getMonth() + 1) !== filters.month) return false;
    if (filters.type && (m.type ?? 'memory') !== filters.type) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const title = (m.title ?? '').toLowerCase();
      const desc = (m.description ?? '').toLowerCase();
      if (!title.includes(q) && !desc.includes(q)) return false;
    }
    return true;
  });

  return (
    <AppFrame
      left="memories"
      right={
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span className="hl-mono" style={{ fontSize: 12, color: 'var(--bone-dim)', letterSpacing: '0.1em' }}>
            {memories.length}/{allMemories.length} {allMemories.length === 1 ? 'entry' : 'entries'}
          </span>
          <Link to="/compose" className="hl-link warm" style={{ fontSize: 12, letterSpacing: '0.08em' }}>
            add →
          </Link>
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
            No entries match these filters.
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
            <Link to="/record" className="hl-link warm" style={{ fontSize: 14 }}>
              or record a voice →
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
          @media (max-width: 600px) { :root { --mosaic-cols: 1 } }
        `}</style>

        {memories.map((m, i) => (
          <MemoryCard key={m.id} m={m} index={i} />
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
    </AppFrame>
  );
}
