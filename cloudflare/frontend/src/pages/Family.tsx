import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

/**
 * Family — Loom-native rewrite.
 *
 * Replaces the constellation visualisation with a typographic kin
 * list grouped by generation:
 *   - Earlier generations (parents, aunts, grandparents)
 *   - Your generation (siblings, partners)
 *   - Descendants (children, grandchildren, placeholders)
 *
 * Adding a member is a single inline form. Each row carries name,
 * relation, optional dates, and the email if known. The constellation
 * stays available at /loom/kin as the design reference.
 */

const RELATION_GROUPS: Record<string, string[]> = {
  'Earlier generations': [
    'parent', 'father', 'mother', 'grandparent', 'grandfather', 'grandmother',
    'great-grandparent', 'aunt', 'uncle',
  ],
  'Your generation': [
    'sibling', 'brother', 'sister', 'spouse', 'partner', 'cousin', 'in-law',
    'sister-in-law', 'brother-in-law',
  ],
  'Descendants': [
    'child', 'son', 'daughter', 'grandchild', 'grandson', 'granddaughter',
    'great-grandchild', 'niece', 'nephew',
  ],
};

function groupOf(rel: string | undefined): string {
  if (!rel) return 'Other';
  const r = rel.toLowerCase();
  for (const [group, kinds] of Object.entries(RELATION_GROUPS)) {
    if (kinds.some((k) => r.includes(k))) return group;
  }
  return 'Other';
}

export function Family() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', relationship: '', email: '' });
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then((r) => r.data).catch(() => []),
  });
  const members: FamilyMember[] = (data ?? []) as FamilyMember[];

  const create = useMutation({
    mutationFn: () =>
      familyApi
        .create({
          name: form.name.trim(),
          relationship: form.relationship.trim(),
          email: form.email.trim() || undefined,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      setForm({ name: '', relationship: '', email: '' });
      setShowAdd(false);
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Could not add member.');
    },
  });

  const grouped: Record<string, FamilyMember[]> = members.reduce(
    (acc, m) => {
      const g = groupOf(m.relationship);
      (acc[g] = acc[g] ?? []).push(m);
      return acc;
    },
    {} as Record<string, FamilyMember[]>,
  );
  const orderedGroups = ['Earlier generations', 'Your generation', 'Descendants', 'Other'].filter(
    (g) => grouped[g]?.length,
  );

  return (
    <AppFrame>
      <header style={{ marginBottom: 40 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
          Family · {members.length} {members.length === 1 ? 'member' : 'members'}
        </p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          The people in your thread.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 640, lineHeight: 1.6 }}
        >
          Living, deceased, and not-yet-born descendants. The thread is for everyone whose name is
          here.
        </p>
      </header>

      <div
        style={{
          display: 'flex',
          gap: 24,
          paddingBottom: 14,
          marginBottom: 28,
          borderBottom: '1px solid var(--loom-rule)',
          alignItems: 'baseline',
        }}
      >
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--loom-warm)',
          }}
        >
          {showAdd ? 'cancel' : 'add a member →'}
        </button>
      </div>

      {showAdd ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (!form.name.trim() || !form.relationship.trim()) {
              setError('Name and relation are required.');
              return;
            }
            create.mutate();
          }}
          style={{
            padding: '28px 32px',
            border: '1px solid var(--loom-rule-warm)',
            background: 'rgba(176,122,74,0.04)',
            marginBottom: 36,
            display: 'grid',
            gap: 18,
          }}
        >
          <p className="loom-eyebrow" style={{ marginBottom: 4 }}>
            New member
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <FieldRow label="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <FieldRow
              label="relation"
              value={form.relationship}
              onChange={(v) => setForm({ ...form, relationship: v })}
              placeholder="mother · sister · son · grandchild"
            />
          </div>
          <FieldRow
            label="email — optional"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            type="email"
          />
          {error ? (
            <p role="alert" className="loom-body" style={{ fontStyle: 'italic', color: '#c25a5a', fontSize: 14, margin: 0 }}>
              {error}
            </p>
          ) : null}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="loom-btn" disabled={create.isPending}>
              {create.isPending ? 'adding…' : 'add member'}
            </button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      ) : members.length === 0 ? (
        <div style={{ padding: '60px 36px', border: '1px solid var(--loom-rule)', textAlign: 'center' }}>
          <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
            Just you so far
          </p>
          <h2
            className="loom-serif"
            style={{ fontSize: 24, fontWeight: 300, fontStyle: 'italic', margin: '0 0 18px' }}
          >
            Add the first member. The thread is for them.
          </h2>
          <button
            type="button"
            className="loom-btn"
            onClick={() => setShowAdd(true)}
          >
            add a member
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 56 }}>
          {orderedGroups.map((group) => (
            <section key={group}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 18 }}>
                <span className="loom-eyebrow" style={{ fontSize: 11 }}>
                  {group}
                </span>
                <hr className="loom-hairline" style={{ flex: 1 }} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {grouped[group].map((m) => (
                  <li
                    key={m.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 220px 140px',
                      gap: 24,
                      alignItems: 'baseline',
                      padding: '16px 0',
                      borderBottom: '1px solid var(--loom-rule)',
                    }}
                  >
                    <div>
                      <p
                        className="loom-serif"
                        style={{
                          fontSize: 19,
                          fontWeight: 400,
                          color: 'var(--loom-bone)',
                          margin: 0,
                          lineHeight: 1.25,
                        }}
                      >
                        {m.name}
                      </p>
                      <p className="loom-body" style={{ fontSize: 13, color: 'var(--loom-bone-faint)', fontStyle: 'italic', margin: '2px 0 0' }}>
                        {m.relationship}
                        {m.birthDate ? ` · b. ${new Date(m.birthDate).getFullYear()}` : ''}
                      </p>
                    </div>
                    <div className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}>
                      {m.email ?? '—'}
                    </div>
                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--loom-bone-faint)',
                      }}
                    >
                      {/* placeholder for future actions */}
                      member
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </AppFrame>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span className="loom-eyebrow" style={{ display: 'block', marginBottom: 6, fontSize: 10 }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
