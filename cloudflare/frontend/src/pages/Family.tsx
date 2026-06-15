import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi, engagementApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { usePageMeta } from '../lib/usePageMeta';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { copyToClipboard } from '../utils/clipboard';
import { type FamilyMember } from '../types';
import { formatDate } from '../utils/date';
import { RoomHeader } from '../loom/components/room';

interface PendingInvite {
  id: string;
  invitee_email: string;
  invitee_name: string | null;
  invite_code: string;
  status: string;
  sent_at: string;
}

// Text-safe lightened dye variants for rendering member names on the ink
// background — each brightened enough to pass contrast on #0e0e0c. The dye is
// the member's identity signal: the 3px left thread carries the dye, the name carries the hue.
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

function daysUntilExpiry(deletedAt: string): number {
  const expires = new Date(deletedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000)));
}

type Mode = 'add' | 'invite';

export function Family() {
  usePageMeta('Your thread');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<Mode>('add');
  const [addForm, setAddForm] = useState({ name: '', relationship: '', email: '', birthDate: '' });
  const [inviteForm, setInviteForm] = useState({ name: '', email: '' });
  const [error, setError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);
  const [lastInviteCode, setLastInviteCode] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<FamilyMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editRelationship, setEditRelationship] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        birthDate: addForm.birthDate || undefined,
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      setAddForm({ name: '', relationship: '', email: '', birthDate: '' });
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
      setDeleteError(null);
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      setDeleteError(err?.response?.data?.error ?? 'Could not remove member.');
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
        birthDate: editBirthDate || undefined,
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
    const origin = window.location.origin;
    const url = code ? `${origin}/join?code=${code}` : `${origin}/signup`;
    const key = code || '__signup__';
    copyToClipboard(url)
      .then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
      })
      .catch(() => {
        // Surface a failure rather than appearing to do nothing — fall back to
        // a manual-copy prompt so the link is never silently lost.
        setError(`Couldn't reach the clipboard. The link is: ${url}`);
      });
  };

  const openForm = (m: Mode) => {
    setMode(m);
    setShowForm(true);
    setError(null);
    setInviteSent(false);
  };

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom' }, { label: 'family' }]} />}
      topbarRight={!showForm ? (
        <button type="button" className="hl-btn" onClick={() => openForm('add')} style={{ fontSize: 12, padding: '6px 14px' }}>add →</button>
      ) : undefined}
    >
      <div style={{ padding: 'var(--page-pad-top) var(--page-pad-x)', paddingBottom: 'var(--page-clear)', maxWidth: 'var(--page-max-prose)', margin: '0 auto' }}>


        {/* heading */}
        <div style={{ marginBottom: 40 }}>
          <RoomHeader
            eyebrow="the bloodline"
            title="Who holds the thread"
          />
        </div>

        {/* primary CTA row */}
        {!showForm && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
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
                    minHeight: 44,
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
                  minHeight: 44,
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
                <InputField label="birthday — optional" value={addForm.birthDate} onChange={(v) => setAddForm({ ...addForm, birthDate: v })} type="date" placeholder="" />
                {error && (
                  <p role="alert" className="hl-serif" style={{ gridColumn: '1 / -1', fontStyle: 'italic', color: 'var(--danger)', fontSize: 14, margin: 0 }}>
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
                  <p role="alert" className="hl-serif" style={{ gridColumn: '1 / -1', fontStyle: 'italic', color: 'var(--danger)', fontSize: 14, margin: 0 }}>
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
                      textTransform: 'uppercase', color: copiedKey === '__signup__' ? 'var(--warm)' : 'var(--bone-dim)',
                      transition: 'color 180ms var(--ease)', touchAction: 'manipulation',
                    }}
                  >
                    {copiedKey === '__signup__' ? 'link copied' : 'or copy link'}
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
                      textTransform: 'uppercase', color: copiedKey === (lastInviteCode || '__signup__') ? 'var(--warm)' : 'var(--bone-dim)',
                      transition: 'color 180ms var(--ease)', touchAction: 'manipulation', alignSelf: 'center',
                    }}
                  >
                    {copiedKey === (lastInviteCode || '__signup__') ? 'link copied' : 'copy invite link'}
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
              <span className="hl-mono" style={{ fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--danger)' }}>
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
                  <div className="hl-mono" style={{ fontSize: 12, color: 'var(--danger)', marginTop: 3 }}>
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
                      textTransform: 'uppercase', color: copiedKey === inv.invite_code ? 'var(--warm)' : 'var(--bone-dim)',
                      transition: 'color 180ms var(--ease)', touchAction: 'manipulation',
                    }}
                  >
                    {copiedKey === inv.invite_code ? 'link copied' : 'copy link'}
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
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-faint)'; }}
                  >
                    cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {deleteError && (
          <p role="alert" className="hl-mono" style={{ fontSize: 12, color: 'var(--danger)', letterSpacing: '0.14em', margin: '0 0 16px' }}>
            {deleteError}
          </p>
        )}

        {/* member list */}
        {isLoading ? (
          <div style={{ height: 1, background: 'var(--warm)', width: 80, opacity: 0.4, marginTop: 8 }} />
        ) : members.length === 0 ? (
          <div style={{ paddingTop: 8 }}>
            <p className="hl-serif" style={{ fontStyle: 'italic', color: 'var(--bone-faint)', fontSize: 16, margin: 0, lineHeight: 1.7 }}>
              No one else is on this thread yet. Add the first name above.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 0 }}>
            {members.map((m) => {
              const dyeKey = m.dye?.toLowerCase() || undefined;
              const isEditing = editTarget?.id === m.id;
              const relMeta = [m.relationship, m.role].filter(Boolean).join(' · ');
              const thread = dyeKey ? `var(--dye-${dyeKey}, var(--warm))` : 'var(--warm)';
              const nameColor = dyeKey && DYE_TEXT[dyeKey] ? DYE_TEXT[dyeKey] : 'var(--bone)';
              return (
                <div
                  key={m.id}
                  style={{
                    borderBottom: '1px solid var(--rule)',
                  }}
                >
                  {/* roster row — dye swatch + serif name (dye) + mono relation, right-aligned */}
                  <Link
                    to={`/person/${m.id}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      alignItems: 'center',
                      columnGap: 18,
                      textDecoration: 'none',
                      padding: '22px 4px',
                      minHeight: 44,
                    }}
                  >
                    {/* dye thread — the only identity mark (square swatch, never an avatar circle) */}
                    <span
                      aria-hidden
                      style={{
                        width: 34,
                        height: 34,
                        background: thread,
                        flex: '0 0 auto',
                        boxShadow: `0 0 0 1px var(--rule)`,
                      }}
                    />
                    <span
                      className="hl-serif"
                      style={{
                        fontWeight: 400,
                        fontSize: 'clamp(18px, 5vw, 22px)',
                        lineHeight: 1.2,
                        color: nameColor,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {m.name}
                    </span>
                    {relMeta && (
                      <span
                        className="hl-mono"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          color: 'var(--bone-dim)',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {relMeta}
                      </span>
                    )}
                  </Link>
                  <div style={{ padding: isEditing ? '0 4px 8px 56px' : '0 4px 18px 56px', display: 'grid', gap: 8 }}>
                    {!relMeta && (
                      <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--bone-faint)', lineHeight: 1.2 }}>
                        relationship not set — edit to weave it in
                      </div>
                    )}
                    {m.birthDate && (
                      <div className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
                        born {formatDate(m.birthDate)}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
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
                            setEditBirthDate(m.birthDate ?? '');
                            setEditError(null);
                          }
                        }}
                        style={{
                          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                          fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--bone-faint)',
                          letterSpacing: '0.18em', textTransform: 'uppercase',
                          transition: 'color 180ms var(--ease)', touchAction: 'manipulation',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-faint)'; }}
                      >
                        {isEditing ? 'cancel' : 'edit →'}
                      </button>
                      {!isEditing && (
                        <>
                          <button
                            type="button"
                            onClick={() => navigate(`/compose?recipientId=${m.id}`)}
                            style={{
                              background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                              fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--bone-faint)',
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
                              fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--bone-faint)',
                              letterSpacing: '0.18em', textTransform: 'uppercase',
                              transition: 'color 180ms var(--ease)', touchAction: 'manipulation',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-faint)'; }}
                          >
                            record voice →
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMember.mutate(m.id)}
                            disabled={deleteMember.isPending}
                            className="family-member-delete"
                            style={{
                              background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                              fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--bone-faint)',
                              letterSpacing: '0.18em', textTransform: 'uppercase',
                              transition: 'color 180ms var(--ease)', touchAction: 'manipulation',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-faint)'; }}
                            aria-label={`remove ${m.name}`}
                          >
                            remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div style={{ padding: '0 4px 22px 56px' }}>
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
                      <input
                        type="date"
                        value={editBirthDate}
                        onChange={(e) => { setEditBirthDate(e.target.value); setEditError(null); }}
                        placeholder="birthday — optional"
                        style={{ border: 0, borderBottom: '1px solid var(--rule)', background: 'transparent', color: 'var(--bone)', fontFamily: 'var(--mono)', fontSize: 13, padding: '6px 0 8px', outline: 'none', marginBottom: 8, display: 'block', width: '100%', boxSizing: 'border-box' }}
                      />
                      {editError && (
                        <p className="hl-mono" style={{ fontSize: 12, color: 'var(--danger)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>{editError}</p>
                      )}
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 4 }}>
                        <button
                          type="button"
                          className="hl-btn"
                          onClick={() => updateMember.mutate()}
                          disabled={!editName.trim() || !editRelationship.trim() || updateMember.isPending}
                          style={{ fontSize: 13, padding: '9px 18px', opacity: (!editName.trim() || !editRelationship.trim() || updateMember.isPending) ? 0.5 : 1 }}
                        >
                          {updateMember.isPending ? 'holding…' : 'hold changes →'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditTarget(null); setEditError(null); }}
                          style={{ background: 'transparent', border: 0, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', padding: '8px 0', touchAction: 'manipulation' }}
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

        {/* invite pill — the single warm call at the foot of the roster */}
        {!showForm && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 56 }}>
            <button
              type="button"
              onClick={() => openForm('invite')}
              className="hl-mono"
              style={{
                background: 'transparent',
                border: '1px solid var(--warm)',
                borderRadius: 999,
                padding: '13px 30px',
                cursor: 'pointer',
                fontSize: 11,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                transition: 'background 180ms var(--ease), color 180ms var(--ease)',
                touchAction: 'manipulation',
                minHeight: 44,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--warm)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; }}
            >
              invite a member
            </button>
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
