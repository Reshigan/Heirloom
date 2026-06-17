import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { legacyContactsApi } from '../services/api';

/**
 * LegacyRecipientPicker — pick which legacy contacts inherit this entry.
 *
 * A legacy contact only ever sees an entry that is explicitly left to them
 * (the inheritance read paths are scoped through the *_legacy_recipients
 * junction tables). This is the one surface that lets an author make that
 * bequest while composing — letters, memories, and voice all reuse it.
 *
 * Selection is a controlled string[] of legacy_contact ids. On-brand: mono
 * uppercase label, copper signal on the chosen, hairline rules, no icons.
 */

export interface LegacyContact {
  id: string;
  name: string;
  email?: string;
  relationship?: string;
  verified?: boolean;
}

function normalizeContacts(data: any): LegacyContact[] {
  if (Array.isArray(data)) return data as LegacyContact[];
  if (Array.isArray(data?.contacts)) return data.contacts as LegacyContact[];
  if (Array.isArray(data?.legacyContacts)) return data.legacyContacts as LegacyContact[];
  return [];
}

export default function LegacyRecipientPicker({
  selectedIds,
  onChange,
  label = 'also leave to',
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['legacy-contacts'],
    queryFn: () => legacyContactsApi.getAll().then((r) => normalizeContacts(r.data)),
    staleTime: 5 * 60 * 1000,
  });

  const contacts = useMemo(() => data ?? [], [data]);

  // Non-critical surface: stay invisible while loading or on error so a
  // contacts fetch hiccup never blocks composing.
  if (isLoading || isError) return null;

  const labelEl = (
    <span
      aria-hidden
      style={{
        display: 'block',
        fontFamily: 'var(--mono)',
        fontSize: 12,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--bone-dim)',
        marginBottom: 12,
      }}
    >
      {label}
    </span>
  );

  // No contacts yet — a quiet pointer to where they're created, nothing more.
  if (contacts.length === 0) {
    return (
      <div style={{ marginBottom: 28 }}>
        {labelEl}
        <p
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            color: 'var(--bone-faint)',
            margin: 0,
            lineHeight: 1.7,
          }}
        >
          no legacy contacts yet —{' '}
          <Link to="/settings" style={{ color: 'var(--warm)', textDecoration: 'none' }}>
            name one in Settings
          </Link>{' '}
          to leave entries for when you're gone.
        </p>
      </div>
    );
  }

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div style={{ marginBottom: 28 }}>
      {labelEl}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {contacts.map((c) => {
          const on = selectedIds.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              aria-pressed={on}
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 8,
                padding: '7px 14px',
                background: 'transparent',
                border: `1px solid ${on ? 'var(--warm)' : 'var(--rule)'}`,
                color: on ? 'var(--bone)' : 'var(--bone-faint)',
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 13,
                letterSpacing: '0.06em',
                transition: 'color 180ms var(--ease), border-color 180ms var(--ease)',
              }}
            >
              <span>{c.name}</span>
              {c.relationship && (
                <span style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.12em' }}>
                  {c.relationship}
                </span>
              )}
              {c.verified === false && (
                <span style={{ fontSize: 10, color: 'var(--warm-dim)', letterSpacing: '0.12em' }}>
                  unverified
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
