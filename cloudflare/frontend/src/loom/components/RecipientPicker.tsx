import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { familyApi } from '../../services/api';
import { dyeColor, dyeTextColor } from '../dye';

export interface RecipientMember {
  id: string;
  name: string;
  relationship?: string | null;
  dye?: string | null;
  /** A not-yet-accepted invite — selectable by name, but carries no member id. */
  pending?: boolean;
}

interface RecipientPickerProps {
  members: RecipientMember[];
  /** current text in the field */
  name: string;
  /** id of the resolved recipient, or null while typing a free name */
  selectedId: string | null;
  /** fires on every keystroke and on selection/creation */
  onChange: (name: string, id: string | null) => void;
  placeholder?: string;
  /** uppercase mono label above the field (e.g. "to" / "for") */
  label?: string;
}

const MONO = 'var(--mono)';

/**
 * RecipientPicker — autocomplete over existing friends & family, with the
 * ability to weave in a brand-new person as either a friend or family member
 * (familyApi.create) when no match exists. Shared by ComposeLetter + Record.
 */
export function RecipientPicker({
  members,
  name,
  selectedId,
  onChange,
  placeholder = 'a name',
  label,
}: RecipientPickerProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [rel, setRel] = useState('');
  const [email, setEmail] = useState('');
  // ponytail: inline styles can't carry :focus-visible — track focused field to swap the rule to copper.
  const [focused, setFocused] = useState<'name' | 'rel' | 'email' | null>(null);
  // Active descendant for keyboard navigation of the suggestion listbox.
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = 'recipient-picker-listbox';

  const q = name.trim().toLowerCase();
  const matches = members.filter(
    (m) =>
      !q ||
      m.name.toLowerCase().includes(q) ||
      (m.relationship && m.relationship.toLowerCase().includes(q)),
  );
  const exact = members.some((m) => m.name.toLowerCase() === q);
  const canAdd = q.length > 0 && !exact && !selectedId;
  const selected = selectedId ? members.find((m) => m.id === selectedId) : null;

  // Whether the listbox is currently shown — keep keyboard + render logic in sync.
  const listOpen = open && matches.length > 0;

  // Reset the highlight whenever the option set changes or the list closes.
  useEffect(() => {
    setActiveIndex(-1);
  }, [name, selectedId, open]);

  // Dismiss on outside-click — mirror the ToField's handler.
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  const select = (m: RecipientMember) => {
    // A pending invitee has no member id yet — resolve by name (free-name path).
    onChange(m.name, m.pending ? null : m.id);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!listOpen) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => (i < matches.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      if (!listOpen) return;
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : matches.length - 1));
    } else if (e.key === 'Enter') {
      if (listOpen && activeIndex >= 0 && matches[activeIndex]) {
        e.preventDefault();
        select(matches[activeIndex]);
      } else if (!open) {
        setOpen(true);
      }
    } else if (e.key === 'Escape') {
      if (!open) return;
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    }
  };

  async function add(relationship: string, emailAddr: string) {
    const trimmed = name.trim();
    const r0 = relationship.trim();
    if (!trimmed || !r0 || creating) return;
    setCreating(true);
    try {
      const r = await familyApi.create({ name: trimmed, relationship: r0, email: emailAddr.trim() || undefined });
      const id = (r.data as { id?: string })?.id ?? null;
      qc.invalidateQueries({ queryKey: ['family'] });
      onChange(trimmed, id);
      setRel('');
      setEmail('');
      setOpen(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      {label && (
        <div
          style={{
            fontFamily: MONO,
            fontSize: 11.5,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--bone-dim)',
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      )}
      <input
        ref={inputRef}
        value={name}
        aria-label="Name"
        role="combobox"
        aria-expanded={listOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-activedescendant={
          listOpen && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
        }
        onChange={(e) => {
          onChange(e.target.value, null);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setFocused('name');
        }}
        onBlur={() => setFocused((f) => (f === 'name' ? null : f))}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'transparent',
          border: 0,
          borderBottom: `1px solid ${focused === 'name' ? 'var(--warm)' : 'var(--rule)'}`,
          color: 'var(--bone)',
          caretColor: 'var(--warm)',
          fontFamily: MONO,
          fontSize: 14,
          letterSpacing: '0.04em',
          padding: '6px 0 4px',
          outline: 'none',
        }}
      />
      {listOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Recipient suggestions"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--ink)',
            border: '1px solid var(--rule)',
            zIndex: 40,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {matches.map((m, i) => (
            <button
              key={m.id}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              tabIndex={-1}
              type="button"
              onMouseDown={(e) => {
                // Keep focus on the input; resolve selection on click.
                e.preventDefault();
                select(m);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background:
                  i === activeIndex
                    ? 'color-mix(in srgb, var(--bone) 4%, transparent)'
                    : 'transparent',
                border: 0,
                borderLeft: `3px solid ${dyeColor(m.id, m.dye)}`,
                padding: '11px 12px 11px 9px',
                cursor: 'pointer',
                fontFamily: MONO,
                fontSize: 13.5,
                color: dyeTextColor(m.id, m.dye),
                borderBottom: '1px solid var(--rule)',
              }}
            >
              {m.name}
              {(m.pending || m.relationship) && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    color: 'var(--bone-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                  }}
                >
                  {m.pending ? 'invited' : m.relationship}
                </span>
              )}
            </button>
          ))}
          {/* "add someone new" — always-present footer so the roster never
              dead-ends. Clicking focuses the field; typing a fresh name reveals
              the inline create flow below. */}
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => {
              e.preventDefault();
              onChange('', null);
              inputRef.current?.focus();
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: 'transparent',
              border: 0,
              padding: '11px 12px',
              cursor: 'pointer',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--bone-dim)',
            }}
          >
            + someone new
          </button>
        </div>
      )}
      {canAdd && (
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
            }}
          >
            add "{name.trim()}" — so a letter can reach them
          </div>
          <input
            value={rel}
            aria-label="Relationship"
            onChange={(e) => setRel(e.target.value)}
            onFocus={() => setFocused('rel')}
            onBlur={() => setFocused((f) => (f === 'rel' ? null : f))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && rel.trim()) {
                e.preventDefault();
                add(rel, email);
              }
            }}
            placeholder="relationship — grandmother · sister · son"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'transparent',
              border: 0,
              borderBottom: `1px solid ${focused === 'rel' ? 'var(--warm)' : 'var(--rule)'}`,
              color: 'var(--bone)',
              caretColor: 'var(--warm)',
              fontFamily: MONO,
              fontSize: 13,
              letterSpacing: '0.04em',
              padding: '5px 0 4px',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              value={email}
              type="email"
              aria-label="Email"
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused((f) => (f === 'email' ? null : f))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && rel.trim()) {
                  e.preventDefault();
                  add(rel, email);
                }
              }}
              placeholder="email — so they're told a letter awaits"
              style={{
                flex: 1,
                boxSizing: 'border-box',
                background: 'transparent',
                border: 0,
                borderBottom: `1px solid ${focused === 'email' ? 'var(--warm)' : 'var(--rule)'}`,
                color: 'var(--bone)',
                caretColor: 'var(--warm)',
                fontFamily: MONO,
                fontSize: 13,
                letterSpacing: '0.04em',
                padding: '5px 0 4px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              disabled={creating || !rel.trim()}
              onClick={() => add(rel, email)}
              style={{
                background: 'none',
                border: 0,
                cursor: creating || !rel.trim() ? 'default' : 'pointer',
                padding: 0,
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: rel.trim() ? 'var(--warm)' : 'var(--bone-faint)',
              }}
            >
              {creating ? 'weaving…' : 'add'}
            </button>
          </div>
        </div>
      )}
      {selected && (
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'var(--bone-faint)',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              flexShrink: 0,
              background: dyeColor(selected.id, selected.dye),
            }}
          />
          <span>
            already woven into your bloodline ·{' '}
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: dyeTextColor(selected.id, selected.dye) }}>
              {selected.name}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
