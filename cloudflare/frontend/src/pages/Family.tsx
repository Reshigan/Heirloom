import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi, engagementApi } from '../services/api';
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
  dye?: string | null;
}

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
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

type Mode = 'add' | 'invite';

export function Family() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<Mode>('add');
  const [addForm, setAddForm] = useState({ name: '', relationship: '', email: '' });
  const [inviteForm, setInviteForm] = useState({ name: '', email: '' });
  const [error, setError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then((r) => r.data).catch(() => []),
  });
  const members: FamilyMember[] = (data ?? []) as FamilyMember[];

  const create = useMutation({
    mutationFn: () =>
      familyApi.create({
        name: addForm.name.trim(),
        relationship: addForm.relationship.trim(),
        email: addForm.email.trim() || undefined,
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      setAddForm({ name: '', relationship: '', email: '' });
      setShowForm(false);
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Could not add member.');
    },
  });

  const invite = useMutation({
    mutationFn: () =>
      engagementApi.invite({
        email: inviteForm.email.trim(),
        name: inviteForm.name.trim() || undefined,
      }),
    onSuccess: () => {
      setInviteSent(true);
      setInviteForm({ name: '', email: '' });
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Could not send invite.');
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!addForm.name.trim() || !addForm.relationship.trim()) {
      setError('Name and relation are required.');
      return;
    }
    create.mutate();
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!inviteForm.email.trim()) {
      setError('Email is required to send an invitation.');
      return;
    }
    invite.mutate();
  };

  const copyLink = () => {
    navigator.clipboard.writeText('https://heirloom.blue/signup').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openForm = (m: Mode) => {
    setMode(m);
    setShowForm(true);
    setError(null);
    setInviteSent(false);
  };

  const atLimit = members.length >= 5;

  return (
    <Frame left="family">
      <div
        style={{
          padding: 'clamp(24px, 5vw, 56px)',
          paddingBottom: 80,
          maxWidth: 760,
        }}
      >
        {/* heading row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 32,
            gap: 16,
          }}
        >
          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 'clamp(28px, 6vw, 38px)',
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
            <span
              className="hl-mono"
              style={{
                fontSize: 12,
                color: 'var(--bone-dim)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                flexShrink: 0,
                paddingTop: 6,
              }}
            >
              {members.length} / 5
            </span>
          )}
        </div>

        {/* primary CTA row — always visible on mobile */}
        {!showForm && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 36,
              flexWrap: 'wrap',
            }}
          >
            {atLimit ? (
              <span
                className="hl-mono"
                style={{
                  fontSize: 13,
                  color: 'var(--bone-dim)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  alignSelf: 'center',
                }}
              >
                thread full · 5 / 5
              </span>
            ) : (
              <>
                <button
                  type="button"
                  className="hl-btn"
                  onClick={() => openForm('add')}
                >
                  add a name →
                </button>
                <button
                  type="button"
                  className="hl-btn ghost"
                  onClick={() => openForm('invite')}
                  style={{ color: 'var(--warm)', borderColor: 'rgba(176,122,74,0.4)' }}
                >
                  invite by email →
                </button>
              </>
            )}
          </div>
        )}

        {/* form panel */}
        {showForm && (
          <div
            style={{
              borderTop: '1px solid var(--rule)',
              paddingTop: 24,
              marginBottom: 40,
            }}
          >
            {/* mode tabs */}
            <div
              style={{
                display: 'flex',
                gap: 24,
                marginBottom: 28,
                borderBottom: '1px solid var(--rule)',
                paddingBottom: 14,
              }}
            >
              {(['add', 'invite'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(null); setInviteSent(false); }}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: mode === m ? 'var(--warm)' : 'var(--bone-dim)',
                    transition: 'color 180ms var(--ease)',
                    touchAction: 'manipulation',
                  }}
                >
                  {m === 'add' ? 'add by name' : 'send invite'}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null); }}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-dim)',
                  touchAction: 'manipulation',
                }}
              >
                cancel
              </button>
            </div>

            {/* add by name form */}
            {mode === 'add' && (
              <form
                onSubmit={handleAdd}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                  gap: 24,
                }}
              >
                <InputField
                  label="name"
                  value={addForm.name}
                  onChange={(v) => setAddForm({ ...addForm, name: v })}
                  placeholder="Margaret Ashworth"
                />
                <InputField
                  label="relationship"
                  value={addForm.relationship}
                  onChange={(v) => setAddForm({ ...addForm, relationship: v })}
                  placeholder="grandmother · sister · son"
                />
                <InputField
                  label="email — optional"
                  value={addForm.email}
                  onChange={(v) => setAddForm({ ...addForm, email: v })}
                  type="email"
                  placeholder="name@example.com"
                />
                {error && (
                  <p
                    role="alert"
                    className="hl-serif"
                    style={{ gridColumn: '1 / -1', fontStyle: 'italic', color: 'var(--dye-madder)', fontSize: 14, margin: 0 }}
                  >
                    {error}
                  </p>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <button
                    type="submit"
                    className="hl-btn"
                    disabled={create.isPending}
                    style={{ opacity: create.isPending ? 0.5 : 1 }}
                  >
                    {create.isPending ? 'adding…' : 'add to thread →'}
                  </button>
                </div>
              </form>
            )}

            {/* send invite form */}
            {mode === 'invite' && !inviteSent && (
              <form
                onSubmit={handleInvite}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                  gap: 24,
                }}
              >
                <InputField
                  label="their name — optional"
                  value={inviteForm.name}
                  onChange={(v) => setInviteForm({ ...inviteForm, name: v })}
                  placeholder="Margaret"
                />
                <InputField
                  label="email"
                  value={inviteForm.email}
                  onChange={(v) => setInviteForm({ ...inviteForm, email: v })}
                  type="email"
                  placeholder="name@example.com"
                />
                {error && (
                  <p
                    role="alert"
                    className="hl-serif"
                    style={{ gridColumn: '1 / -1', fontStyle: 'italic', color: 'var(--dye-madder)', fontSize: 14, margin: 0 }}
                  >
                    {error}
                  </p>
                )}
                <div
                  style={{
                    gridColumn: '1 / -1',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <button
                    type="submit"
                    className="hl-btn"
                    disabled={invite.isPending}
                    style={{ opacity: invite.isPending ? 0.5 : 1 }}
                  >
                    {invite.isPending ? 'sending…' : 'send invite →'}
                  </button>
                  <button
                    type="button"
                    onClick={copyLink}
                    style={{
                      background: 'transparent',
                      border: 0,
                      padding: 0,
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                      fontSize: 13,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: copied ? 'var(--warm)' : 'var(--bone-dim)',
                      transition: 'color 180ms var(--ease)',
                      touchAction: 'manipulation',
                    }}
                  >
                    {copied ? 'link copied ✓' : 'or copy link'}
                  </button>
                </div>
              </form>
            )}

            {/* invite sent confirmation */}
            {mode === 'invite' && inviteSent && (
              <div>
                <p
                  className="hl-serif"
                  style={{ fontSize: 16, color: 'var(--bone)', margin: '0 0 16px', lineHeight: 1.6 }}
                >
                  Invite sent. They'll receive an email with a link to join the thread.
                </p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="hl-btn ghost"
                    onClick={() => { setInviteSent(false); setInviteForm({ name: '', email: '' }); }}
                    style={{ color: 'var(--warm)', borderColor: 'rgba(176,122,74,0.4)' }}
                  >
                    send another →
                  </button>
                  <button
                    type="button"
                    onClick={copyLink}
                    style={{
                      background: 'transparent',
                      border: 0,
                      padding: 0,
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                      fontSize: 13,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: copied ? 'var(--warm)' : 'var(--bone-dim)',
                      transition: 'color 180ms var(--ease)',
                      touchAction: 'manipulation',
                      alignSelf: 'center',
                    }}
                  >
                    {copied ? 'link copied ✓' : 'copy signup link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* member list */}
        {isLoading ? (
          <p className="hl-serif" style={{ fontStyle: 'italic', color: 'var(--bone-faint)', fontSize: 16, margin: 0 }}>
            Loading the thread…
          </p>
        ) : members.length === 0 ? (
          <div style={{ paddingTop: 8 }}>
            <p className="hl-serif" style={{ fontStyle: 'italic', color: 'var(--bone-faint)', fontSize: 16, margin: 0, lineHeight: 1.7 }}>
              No one on the thread yet.
            </p>
          </div>
        ) : (
          <div>
            {/* column headers — hidden on small screens */}
            <div
              className="family-table-header"
              style={{
                display: 'grid',
                gridTemplateColumns: '8px 1fr auto',
                gap: 16,
                paddingBottom: 12,
                borderBottom: '1px solid var(--rule)',
                alignItems: 'baseline',
              }}
            >
              <span />
              <span className="hl-mono" style={{ fontSize: 12, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>name</span>
              <span className="hl-mono" style={{ fontSize: 12, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>joined</span>
            </div>

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
                    gridTemplateColumns: '8px 1fr auto',
                    gap: 16,
                    paddingTop: 16,
                    paddingBottom: 16,
                    borderBottom: '1px solid var(--rule)',
                    alignItems: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                    minHeight: 56,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(244,236,216,0.02)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
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
                  <div>
                    <div className="hl-serif" style={{ fontSize: 17, fontWeight: 400, color: 'var(--bone)', lineHeight: 1.25 }}>
                      {m.name}
                    </div>
                    {(m.relationship || m.role) && (
                      <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--bone-dim)', marginTop: 3, lineHeight: 1.2 }}>
                        {[m.relationship, m.role].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                  <div className="hl-mono" style={{ fontSize: 12, color: 'var(--bone-dim)', textAlign: 'right' }}>
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

function InputField({
  label, value, onChange, type = 'text', placeholder,
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
          fontSize: 12,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'var(--bone-dim)',
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
          padding: '8px 0',
          fontFamily: 'var(--serif)',
          fontSize: 16,
          color: 'var(--bone)',
          borderRadius: 0,
          boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--warm)'; }}
        onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--rule)'; }}
      />
    </label>
  );
}
