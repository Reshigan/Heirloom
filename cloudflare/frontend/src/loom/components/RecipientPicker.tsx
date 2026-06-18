import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { familyApi } from '../../services/api';
import { dyeColor } from '../dye';

export interface RecipientMember {
  id: string;
  name: string;
  relationship?: string | null;
  dye?: string | null;
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
    <div style={{ position: 'relative' }}>
      {label && (
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      )}
      <input
        value={name}
        onChange={(e) => {
          onChange(e.target.value, null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'transparent',
          border: 0,
          borderBottom: '1px solid var(--rule)',
          color: 'var(--bone)',
          caretColor: 'var(--warm)',
          fontFamily: MONO,
          fontSize: 14,
          letterSpacing: '0.04em',
          padding: '6px 0 4px',
          outline: 'none',
        }}
      />
      {open && matches.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--ink, #0b0907)',
            border: '1px solid var(--rule)',
            zIndex: 40,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={() => {
                onChange(m.name, m.id);
                setOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 0,
                borderLeft: `3px solid ${dyeColor(m.id, m.dye)}`,
                padding: '11px 12px 11px 9px',
                cursor: 'pointer',
                fontFamily: MONO,
                fontSize: 13.5,
                color: dyeColor(m.id, m.dye),
                borderBottom: '1px solid var(--rule)',
              }}
            >
              {m.name}
              {m.relationship && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    color: 'var(--bone-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                  }}
                >
                  {m.relationship}
                </span>
              )}
            </button>
          ))}
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
            onChange={(e) => setRel(e.target.value)}
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
              borderBottom: '1px solid var(--rule)',
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
              onChange={(e) => setEmail(e.target.value)}
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
                borderBottom: '1px solid var(--rule)',
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
            <span className="hl-signature" style={{ fontSize: '1.5em' }}>
              {selected.name}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
