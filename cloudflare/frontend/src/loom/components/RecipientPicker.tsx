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

const MONO = "'JetBrains Mono', monospace";

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

  async function add(relationship: 'friend' | 'family') {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const r = await familyApi.create({ name: trimmed, relationship });
      const id = (r.data as { id?: string })?.id ?? null;
      qc.invalidateQueries({ queryKey: ['family'] });
      onChange(trimmed, id);
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
      {open && (matches.length > 0 || canAdd) && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--ink, #111)',
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
          {canAdd && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
              }}
            >
              <span>add "{name.trim()}" as</span>
              <button
                type="button"
                disabled={creating}
                onMouseDown={(e) => {
                  e.preventDefault();
                  add('friend');
                }}
                style={{
                  background: 'none',
                  border: 0,
                  cursor: creating ? 'default' : 'pointer',
                  padding: 0,
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                }}
              >
                friend
              </button>
              <span style={{ color: 'var(--rule)' }}>·</span>
              <button
                type="button"
                disabled={creating}
                onMouseDown={(e) => {
                  e.preventDefault();
                  add('family');
                }}
                style={{
                  background: 'none',
                  border: 0,
                  cursor: creating ? 'default' : 'pointer',
                  padding: 0,
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                }}
              >
                family
              </button>
            </div>
          )}
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
