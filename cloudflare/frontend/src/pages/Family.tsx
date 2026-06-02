import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '../services/api';
import { Frame } from '../loom/components/Frame';

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
  role?: string | null;
  lastEntry?: string | null;
  /** A real dye/category value off the member, if the API carries one. Never invented. */
  dye?: string | null;
}

/**
 * Natural-dye palette (§2.7) — the only place a dye color may appear.
 * Mapped ONLY from a real `dye` value on a member; never fabricated.
 */
const DYE_VARS: Record<string, string> = {
  madder:    'var(--dye-madder)',
  cochineal: 'var(--dye-cochineal)',
  kermes:    'var(--dye-kermes)',
  saffron:   'var(--dye-saffron)',
  weld:      'var(--dye-weld)',
  walnut:    'var(--dye-walnut)',
  oakgall:   'var(--dye-oakgall)',
  woad:      'var(--dye-woad)',
  indigo:    'var(--dye-indigo)',
  iron:      'var(--dye-iron)',
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function Family() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', relationship: '', role: '', email: '' });
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
      setForm({ name: '', relationship: '', role: '', email: '' });
      setShowAdd(false);
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Could not add member.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.relationship.trim()) {
      setError('Name and relation are required.');
      return;
    }
    create.mutate();
  };

  const atLimit = members.length >= 5;
  const inviteLink = atLimit && !showAdd ? (
    <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
      5 / 5 full
    </span>
  ) : (
    <button
      type="button"
      onClick={() => setShowAdd((v) => !v)}
      style={{
        background: 'transparent',
        border: 0,
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.32em',
        textTransform: 'uppercase' as const,
        color: 'var(--warm)',
      }}
    >
      {showAdd ? 'cancel →' : 'invite →'}
    </button>
  );

  return (
    <Frame left="family" right={inviteLink}>
      <div style={{ position: 'absolute', top: 80, bottom: 36, left: 56, right: 56, overflowY: 'auto' }}>

        {/* heading */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32 }}>
          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 38,
              fontWeight: 300,
              color: 'var(--bone)',
              margin: 0,
              letterSpacing: '-0.018em',
              lineHeight: 1.15,
            }}
          >
            The people on this thread.
          </h1>
          {!isLoading && (
            <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', flexShrink: 0, marginLeft: 24 }}>
              {members.length} / 5
            </span>
          )}
        </div>

        {/* add-member form */}
        {showAdd && (
          <form
            onSubmit={handleSubmit}
            style={{
              borderTop: '1px solid var(--rule)',
              paddingTop: 24,
              marginBottom: 40,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
            }}
          >
            <div style={{ gridColumn: '1 / -1' }}>
              <span
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase' as const,
                  color: 'var(--bone-faint)',
                }}
              >
                new member
              </span>
            </div>

            <InputField
              label="name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Margaret Ashworth"
            />
            <InputField
              label="relationship"
              value={form.relationship}
              onChange={(v) => setForm({ ...form, relationship: v })}
              placeholder="grandmother · sister · son"
            />
            <InputField
              label="role — optional"
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v })}
              placeholder="member · steward · reader"
            />
            <InputField
              label="email — optional"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              type="email"
              placeholder="name@example.com"
            />

            {error && (
              <p
                role="alert"
                className="hl-serif"
                style={{
                  gridColumn: '1 / -1',
                  fontStyle: 'italic',
                  color: 'var(--dye-madder)',
                  fontSize: 14,
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 16, alignItems: 'center', paddingTop: 8 }}>
              <button
                type="submit"
                className="hl-btn"
                disabled={create.isPending}
                style={{ opacity: create.isPending ? 0.5 : 1 }}
              >
                {create.isPending ? 'adding…' : 'add member'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setError(null); }}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase' as const,
                  color: 'var(--bone-faint)',
                }}
              >
                cancel
              </button>
            </div>
          </form>
        )}

        {/* table */}
        {isLoading ? (
          <p
            className="hl-serif"
            style={{ fontStyle: 'italic', color: 'var(--bone-faint)', fontSize: 16, margin: 0 }}
          >
            Loading the thread…
          </p>
        ) : members.length === 0 ? (
          <p
            className="hl-serif"
            style={{ fontStyle: 'italic', color: 'var(--bone-faint)', fontSize: 16, margin: 0 }}
          >
            No one on the thread yet. Invite the first name.
          </p>
        ) : (
          <div>
            {/* table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '14px 2fr 1fr 1fr 0.6fr',
                gap: 16,
                paddingBottom: 12,
                borderBottom: '1px solid var(--rule)',
                alignItems: 'baseline',
              }}
            >
              <span />
              {(['name', 'role', 'last entry', 'joined'] as const).map((col) => (
                <span
                  key={col}
                  className="hl-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.32em',
                    textTransform: 'uppercase' as const,
                    color: 'var(--bone-faint)',
                  }}
                >
                  {col}
                </span>
              ))}
            </div>

            {/* data rows */}
            {members.map((m) => {
              const dyeKey = m.dye?.toLowerCase() ?? '';
              const dyeColor = dyeKey && DYE_VARS[dyeKey] ? DYE_VARS[dyeKey] : null;
              return (
                <div
                  key={m.id}
                  role="row"
                  tabIndex={0}
                  onClick={() => navigate(`/person/${m.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/person/${m.id}`); }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '14px 2fr 1fr 1fr 0.6fr',
                    gap: 16,
                    paddingTop: 14,
                    paddingBottom: 14,
                    borderBottom: '1px solid var(--rule)',
                    alignItems: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(244,236,216,0.02)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  {/* dye circle */}
                  <span
                    aria-hidden
                    style={{
                      display: 'block',
                      width: 8,
                      height: 8,
                      borderRadius: 0,
                      background: dyeColor ?? 'transparent',
                      border: dyeColor ? undefined : '1px solid var(--rule)',
                      flexShrink: 0,
                    }}
                  />

                  {/* name + relationship */}
                  <div>
                    <div
                      className="hl-serif"
                      style={{
                        fontSize: 16,
                        fontWeight: 400,
                        color: 'var(--bone)',
                        lineHeight: 1.25,
                      }}
                    >
                      {m.name}
                    </div>
                    {m.relationship && (
                      <div
                        className="hl-serif"
                        style={{
                          fontStyle: 'italic',
                          fontSize: 13,
                          color: 'var(--bone-dim)',
                          marginTop: 2,
                          lineHeight: 1.2,
                        }}
                      >
                        {m.relationship}
                      </div>
                    )}
                  </div>

                  {/* role */}
                  <div
                    className="hl-mono"
                    style={{
                      fontSize: 9.5,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase' as const,
                      color: 'var(--bone-dim)',
                    }}
                  >
                    {m.role ?? '—'}
                  </div>

                  {/* last entry */}
                  <div
                    className="hl-mono"
                    style={{ fontSize: 10, color: 'var(--bone-faint)' }}
                  >
                    {formatDate(m.lastEntry)}
                  </div>

                  {/* joined */}
                  <div
                    className="hl-mono"
                    style={{ fontSize: 10, color: 'var(--bone-faint)' }}
                  >
                    {formatDate(m.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Frame>
  );
}

// ── InputField — hairline-border input with hl-serif text ────────────────────
function InputField({
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
      <span
        className="hl-mono"
        style={{
          display: 'block',
          fontSize: 10,
          letterSpacing: '0.32em',
          textTransform: 'uppercase' as const,
          color: 'var(--bone-faint)',
          marginBottom: 8,
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 0,
          borderBottom: '1px solid var(--rule)',
          outline: 'none',
          padding: '6px 0',
          fontFamily: 'var(--serif)',
          fontSize: 15,
          color: 'var(--bone)',
          borderRadius: 0,
          boxSizing: 'border-box' as const,
        }}
        onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--warm)'; }}
        onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--rule)'; }}
      />
    </label>
  );
}
