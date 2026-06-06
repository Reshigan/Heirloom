import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi, engagementApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';

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
  deletedAt?: string | null;
  pendingDeletion?: boolean;
}

interface PendingInvite {
  id: string;
  invitee_email: string;
  invitee_name: string | null;
  invite_code: string;
  status: string;
  sent_at: string;
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

// Text-safe lightened variants for rendering names on the ink background.
// Each dye is brightened enough to pass contrast on #0e0e0c.
const DYE_TEXT: Record<string, string> = {
  madder:    '#d97860',
  cochineal: '#c5607a',
  kermes:    '#b56875',
  saffron:   '#d8a84a',
  weld:      '#c0b84a',
  walnut:    '#a87a52',
  oakgall:   '#958472',
  woad:      '#7a9bab',
  indigo:    '#6a90b0',
  iron:      '#7a7a78',
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

function daysUntilExpiry(deletedAt: string): number {
  const expires = new Date(deletedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000)));
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
  const [lastInviteCode, setLastInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null);
  const [editTarget, setEditTarget] = useState<FamilyMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editRelationship, setEditRelationship] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then((r) => r.data).catch(() => []),
  });
  const allMembers: FamilyMember[] = (data ?? []) as FamilyMember[];
  const members = allMembers.filter((m) => !m.pendingDeletion);
  const pendingDeletion = allMembers.filter((m) => m.pendingDeletion);

  const { data: invitesData } = useQuery({
    queryKey: ['invites'],
    queryFn: () => engagementApi.getInvites().then((r) => r.data).catch(() => ({ invites: [] })),
  });
  const pendingInvites: PendingInvite[] = (
    (invitesData as any)?.invites ?? []
  ).filter((i: PendingInvite) => i.status === 'pending');

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
    onSuccess: (res: any) => {
      setInviteSent(true);
      setLastInviteCode((res?.data as any)?.inviteCode ?? null);
      setInviteForm({ name: '', email: '' });
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Could not send invite.');
    },
  });

  const deleteMember = useMutation({
    mutationFn: (id: string) => familyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      setDeleteTarget(null);
    },
    onError: () => {
      setDeleteTarget(null);
    },
  });

  const restoreMember = useMutation({
    mutationFn: (id: string) => familyApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });

  const updateMember = useMutation({
    mutationFn: () =>
      familyApi.update(editTarget!.id, {
        name: editName.trim(),
        relationship: editRelationship.trim(),
        email: editEmail.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      setEditTarget(null);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err?.response?.data?.error ?? 'Could not save changes.');
    },
  });

  const cancelInvite = useMutation({
    mutationFn: (id: string) => engagementApi.deleteInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
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

  const copyLink = (code?: string | null) => {
    const url = code
      ? `https://heirloom.blue/join?code=${code}`
      : 'https://heirloom.blue/signup';
    navigator.clipboard.writeText(url).then(() => {
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
    <ClothShell
      topbarLeft={
  <Link
    to="/loom"
    style={{
      fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none',
    }}
  >
    ← heirloom
  </Link>
}
      topbarCenter="family"
      topbarRight={!atLimit && !showForm ? (
        <button type="button" className="hl-btn" onClick={() => openForm('add')} style={{ fontSize: 10, padding: '5px 12px' }}>add →</button>
      ) : undefined}
    >
      <div style={{ padding: 'clamp(24px, 5vw, 56px)', paddingBottom: 80, maxWidth: 760 }}>

        {/* Delete confirmation — inline, no overlay */}
        {deleteTarget && (
          <div
            style={{
              border: '1px solid var(--dye-madder)',
              opacity: 0.92,
              padding: 'clamp(20px, 4vw, 32px)',
              marginBottom: 32,
              animation: 'hl-rise 180ms var(--ease) both',
            }}
          >
            <p className="hl-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone)', margin: '0 0 6px', lineHeight: 1.4 }}>
              Untether {deleteTarget.name} from the thread?
            </p>
            <p className="hl-mono" style={{ fontSize: 11, color: 'var(--warm)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 16px' }}>
              7 days to change your mind
            </p>
            <p className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 24px', lineHeight: 1.7, fontStyle: 'italic' }}>
              All memories, letters, and voice recordings addressed to them will be queued for removal. This becomes permanent after 7 days.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => deleteMember.mutate(deleteTarget.id)}
                disabled={deleteMember.isPending}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--dye-madder)',
                  borderRadius: 0,
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--dye-madder)',
                  opacity: deleteMember.isPending ? 0.5 : 1,
                  transition: 'opacity 180ms var(--ease)',
                  touchAction: 'manipulation',
                }}
              >
                {deleteMember.isPending ? 'untethering…' : 'untether from thread'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: '10px 0',
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-dim)',
                  transition: 'color 180ms var(--ease)',
                  touchAction: 'manipulation',
                }}
              >
                keep them
              </button>
            </div>
          </div>
        )}

        {/* heading row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16 }}>
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
            <span className="hl-mono" style={{ fontSize: 12, color: 'var(--bone-dim)', letterSpacing: '0.18em', textTransform: 'uppercase', flexShrink: 0, paddingTop: 6 }}>
              {members.length} / 5
            </span>
          )}
        </div>

        {/* primary CTA row */}
        {!showForm && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
            {atLimit ? (
              <span className="hl-mono" style={{ fontSize: 13, color: 'var(--warm)', letterSpacing: '0.18em', textTransform: 'uppercase', alignSelf: 'center' }}>
                five voices woven · the thread is sealed
              </span>
            ) : (
              <>
                <button type="button" className="hl-btn" onClick={() => openForm('add')}>
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
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 24, marginBottom: 40 }}>
            <div style={{ display: 'flex', gap: 24, marginBottom: 28, borderBottom: '1px solid var(--rule)', paddingBottom: 14 }}>
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

            {mode === 'add' && (
              <form
                onSubmit={handleAdd}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 24 }}
              >
                <InputField label="name" value={addForm.name} onChange={(v) => setAddForm({ ...addForm, name: v })} placeholder="full name" />
                <InputField label="relationship" value={addForm.relationship} onChange={(v) => setAddForm({ ...addForm, relationship: v })} placeholder="grandmother · sister · son" />
                <InputField label="email — optional" value={addForm.email} onChange={(v) => setAddForm({ ...addForm, email: v })} type="email" placeholder="name@example.com" />
                {error && (
                  <p role="alert" className="hl-serif" style={{ gridColumn: '1 / -1', fontStyle: 'italic', color: 'var(--dye-madder)', fontSize: 14, margin: 0 }}>
                    {error}
                  </p>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" className="hl-btn" disabled={create.isPending} style={{ opacity: create.isPending ? 0.5 : 1 }}>
                    {create.isPending ? 'weaving…' : 'weave into cloth →'}
                  </button>
                </div>
              </form>
            )}

            {mode === 'invite' && !inviteSent && (
              <form
                onSubmit={handleInvite}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 24 }}
              >
                <InputField label="their name — optional" value={inviteForm.name} onChange={(v) => setInviteForm({ ...inviteForm, name: v })} placeholder="first name" />
                <InputField label="email" value={inviteForm.email} onChange={(v) => setInviteForm({ ...inviteForm, email: v })} type="email" placeholder="name@example.com" />
                {error && (
                  <p role="alert" className="hl-serif" style={{ gridColumn: '1 / -1', fontStyle: 'italic', color: 'var(--dye-madder)', fontSize: 14, margin: 0 }}>
                    {error}
                  </p>
                )}
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                  <button type="submit" className="hl-btn" disabled={invite.isPending} style={{ opacity: invite.isPending ? 0.5 : 1 }}>
                    {invite.isPending ? 'calling…' : 'call to thread →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyLink()}
                    style={{
                      background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                      fontFamily: 'var(--mono)', fontSize: 13, letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: copied ? 'var(--warm)' : 'var(--bone-dim)',
                      transition: 'color 180ms var(--ease)', touchAction: 'manipulation',
                    }}
                  >
                    {copied ? 'link copied' : 'or copy link'}
                  </button>
                </div>
              </form>
            )}

            {mode === 'invite' && inviteSent && (
              <div style={{ animation: 'hl-rise 360ms var(--ease) both' }}>
                <p className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)', margin: '0 0 4px', lineHeight: 1.6 }}>
                  You've called them to the thread.
                </p>
                <p className="hl-serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--bone-dim)', margin: '0 0 20px', lineHeight: 1.6 }}>
                  A summons is on its way to their inbox.
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
                    onClick={() => copyLink(lastInviteCode)}
                    style={{
                      background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                      fontFamily: 'var(--mono)', fontSize: 13, letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: copied ? 'var(--warm)' : 'var(--bone-dim)',
                      transition: 'color 180ms var(--ease)', touchAction: 'manipulation', alignSelf: 'center',
                    }}
                  >
                    {copied ? 'link copied' : 'copy invite link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* pending deletion members — grace window */}
        {pendingDeletion.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 20, marginBottom: 16 }}>
              <span className="hl-mono" style={{ fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--dye-madder)' }}>
                pending removal
              </span>
            </div>
            {pendingDeletion.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 14,
                  paddingBottom: 14,
                  borderBottom: '1px solid var(--rule)',
                  gap: 12,
                  opacity: 0.65,
                }}
              >
                <div>
                  <div className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)', textDecoration: 'line-through', lineHeight: 1.3 }}>
                    {m.name}
                  </div>
                  <div className="hl-mono" style={{ fontSize: 12, color: 'var(--dye-madder)', marginTop: 3 }}>
                    {daysUntilExpiry(m.deletedAt!)} day{daysUntilExpiry(m.deletedAt!) !== 1 ? 's' : ''} left to undo
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => restoreMember.mutate(m.id)}
                  disabled={restoreMember.isPending}
                  style={{
                    background: 'transparent', border: '1px solid var(--rule)', padding: '7px 14px',
                    cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12,
                    letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-dim)',
                    transition: 'color 180ms var(--ease), border-color 180ms var(--ease)', touchAction: 'manipulation', flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(176,122,74,0.4)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-dim)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--rule)'; }}
                >
                  undo
                </button>
              </div>
            ))}
          </div>
        )}

        {/* pending invites */}
        {pendingInvites.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 20, marginBottom: 16 }}>
              <span className="hl-mono" style={{ fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>
                pending invites
              </span>
            </div>
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid var(--rule)', gap: 12 }}
              >
                <div>
                  <div className="hl-serif" style={{ fontSize: 15, color: 'var(--bone)', lineHeight: 1.3 }}>
                    {inv.invitee_name || inv.invitee_email}
                  </div>
                  {inv.invitee_name && (
                    <div className="hl-mono" style={{ fontSize: 12, color: 'var(--bone-faint)', marginTop: 2 }}>
                      {inv.invitee_email}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, flexShrink: 0, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => copyLink(inv.invite_code)}
                    style={{
                      background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                      fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: 'var(--bone-dim)',
                      transition: 'color 180ms var(--ease)', touchAction: 'manipulation',
                    }}
                  >
                    copy link
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelInvite.mutate(inv.id)}
                    disabled={cancelInvite.isPending}
                    style={{
                      background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                      fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: 'var(--bone-faint)',
                      transition: 'color 180ms var(--ease)', touchAction: 'manipulation',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--dye-madder)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-faint)'; }}
                  >
                    cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* member list */}
        {isLoading ? (
          <div style={{ height: 1, background: 'var(--warm)', width: 80, opacity: 0.4, marginTop: 8 }} />
        ) : members.length === 0 ? (
          <div style={{ paddingTop: 8 }}>
            <p className="hl-serif" style={{ fontStyle: 'italic', color: 'var(--bone-faint)', fontSize: 16, margin: 0, lineHeight: 1.7 }}>
              The thread holds no voices yet. Weave someone in.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '8px 1fr auto 28px', gap: 16, paddingBottom: 12, borderBottom: '1px solid var(--rule)', alignItems: 'baseline' }}>
              <span />
              <span className="hl-mono" style={{ fontSize: 12, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>name</span>
              <span className="hl-mono" style={{ fontSize: 12, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>joined</span>
              <span />
            </div>

            {members.map((m) => {
              const dyeKey = m.dye?.toLowerCase() ?? '';
              const dyeColor = dyeKey && DYE_VARS[dyeKey] ? DYE_VARS[dyeKey] : null;
              const dyeText  = dyeKey && DYE_TEXT[dyeKey]  ? DYE_TEXT[dyeKey]  : null;
              const isEditing = editTarget?.id === m.id;
              return (
                <div key={m.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '8px 1fr auto 28px',
                      gap: 16,
                      paddingTop: 16,
                      paddingBottom: isEditing ? 8 : 16,
                      alignItems: 'center',
                      minHeight: 56,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: 'block', width: 3, height: 20, borderRadius: 0,
                        background: dyeColor ?? 'var(--rule)',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/person/${m.id}`)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/person/${m.id}`); }}
                        style={{ cursor: 'pointer', outline: 'none', display: 'inline-block' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.75'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                      >
                        <div className="hl-serif" style={{ fontSize: 17, fontWeight: 400, color: dyeText ?? 'var(--bone)', lineHeight: 1.25, transition: 'opacity 180ms var(--ease)' }}>
                          {m.name}
                        </div>
                        {(m.relationship || m.role) && (
                          <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--bone-dim)', marginTop: 3, lineHeight: 1.2 }}>
                            {[m.relationship, m.role].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditTarget(null);
                            setEditError(null);
                          } else {
                            setEditTarget(m);
                            setEditName(m.name);
                            setEditRelationship(m.relationship ?? '');
                            setEditEmail(m.email ?? '');
                            setEditError(null);
                          }
                        }}
                        style={{
                          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)',
                          letterSpacing: '0.18em', textTransform: 'uppercase',
                          transition: 'color 180ms var(--ease)', touchAction: 'manipulation',
                          marginTop: 6, display: 'block',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-faint)'; }}
                      >
                        {isEditing ? 'cancel' : 'edit →'}
                      </button>
                      {!isEditing && (
                        <div style={{ display: 'flex', gap: 20, marginTop: 6, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => navigate(`/compose?recipientId=${m.id}`)}
                            style={{
                              background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)',
                              letterSpacing: '0.18em', textTransform: 'uppercase',
                              transition: 'color 180ms var(--ease)', touchAction: 'manipulation',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-faint)'; }}
                          >
                            write a letter →
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/record?recipientId=${m.id}`)}
                            style={{
                              background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)',
                              letterSpacing: '0.18em', textTransform: 'uppercase',
                              transition: 'color 180ms var(--ease)', touchAction: 'manipulation',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-faint)'; }}
                          >
                            record voice →
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="hl-mono" style={{ fontSize: 12, color: dyeText ? `${dyeText}99` : 'var(--bone-dim)', textAlign: 'right' }}>
                      {formatDate(m.createdAt)}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(m)}
                      className="family-member-delete"
                      style={{
                        background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'transparent', fontSize: 18, lineHeight: 1,
                        transition: 'color 180ms var(--ease)', touchAction: 'manipulation',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(244,236,216,0.28)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'transparent'; }}
                      aria-label={`remove ${m.name}`}
                    >
                      ×
                    </button>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div style={{ paddingBottom: 20, paddingLeft: 24 }}>
                      <input
                        value={editName}
                        onChange={(e) => { setEditName(e.target.value); setEditError(null); }}
                        placeholder="name"
                        style={{ border: 0, borderBottom: '1px solid var(--rule)', background: 'transparent', color: 'var(--bone)', fontFamily: 'var(--serif)', fontSize: 14, padding: '6px 0 8px', outline: 'none', marginBottom: 8, display: 'block', width: '100%', boxSizing: 'border-box' }}
                      />
                      <input
                        value={editRelationship}
                        onChange={(e) => { setEditRelationship(e.target.value); setEditError(null); }}
                        placeholder="relationship"
                        style={{ border: 0, borderBottom: '1px solid var(--rule)', background: 'transparent', color: 'var(--bone)', fontFamily: 'var(--serif)', fontSize: 14, padding: '6px 0 8px', outline: 'none', marginBottom: 8, display: 'block', width: '100%', boxSizing: 'border-box' }}
                      />
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => { setEditEmail(e.target.value); setEditError(null); }}
                        placeholder="email — optional"
                        style={{ border: 0, borderBottom: '1px solid var(--rule)', background: 'transparent', color: 'var(--bone)', fontFamily: 'var(--serif)', fontSize: 14, padding: '6px 0 8px', outline: 'none', marginBottom: 8, display: 'block', width: '100%', boxSizing: 'border-box' }}
                      />
                      {editError && (
                        <p className="hl-mono" style={{ fontSize: 10, color: 'var(--dye-madder)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>{editError}</p>
                      )}
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 4 }}>
                        <button
                          type="button"
                          className="hl-btn"
                          onClick={() => updateMember.mutate()}
                          disabled={!editName.trim() || !editRelationship.trim() || updateMember.isPending}
                          style={{ fontSize: 11, padding: '9px 18px', opacity: (!editName.trim() || !editRelationship.trim() || updateMember.isPending) ? 0.5 : 1 }}
                        >
                          {updateMember.isPending ? 'holding…' : 'hold changes →'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditTarget(null); setEditError(null); }}
                          style={{ background: 'transparent', border: 0, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}
                        >
                          cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ClothShell>
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
      <span className="hl-mono" style={{ display: 'block', fontSize: 12, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--bone-dim)', marginBottom: 8 }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', background: 'transparent', border: 0,
          borderBottom: '1px solid var(--rule)', outline: 'none', padding: '8px 0',
          fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--bone)',
          borderRadius: 0, boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--warm)'; }}
        onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--rule)'; }}
      />
    </label>
  );
}
