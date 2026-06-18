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
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { RoomError } from '../loom/components/RoomError';
import { dyeForId, dyeTextVar, DYES, type Dye } from '../loom/dye';

interface PendingInvite {
  id: string;
  invitee_email: string;
  invitee_name: string | null;
  invite_code: string;
  status: string;
  sent_at: string;
}

// The member's name carries their dye hue; the 3px left thread carries the same
// dye. The thread stays on the VIVID `var(--dye-*)` token (identity signal),
// but the NAME renders through `dyeTextVar()` → the AA-tuned `var(--dye-*-text)`
// tokens, so the name clears WCAG AA (4.5:1) in both themes where the vivid
// thread hue would not. (src/loom/dye.ts is the theme-aware source of truth.)
// Returns the cream when the saved key isn't a known dye.
function dyeTextColor(key: string): string {
  return (DYES as readonly string[]).includes(key) ? dyeTextVar(key as Dye) : 'var(--bone)';
}

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

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['family'],
    // No .catch here — a failed read must surface as isError so the roster
    // shows the in-voice retry, never the first-run "add the first name" empty.
    queryFn: () => familyApi.getAll().then((r) => r.data),
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
    >
      <div style={{ padding: 'var(--page-pad-top) var(--page-pad-x)', paddingBottom: 'var(--page-clear)', maxWidth: 'var(--page-max-prose)', margin: '0 auto' }}>


        {/* heading — ledger headline; warm mono eyebrow names the bloodline */}
        <CosmicHeader
          eyebrow="THE BLOODLINE"
          title="Who holds the thread"
        />

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
              style={{ color: 'var(--warm)', borderColor: 'color-mix(in srgb, var(--warm) 40%, transparent)' }}
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
                  <p role="alert" className="hl-mono" style={{ gridColumn: '1 / -1', fontSize: 12, letterSpacing: '0.14em', color: 'var(--warm)', margin: 0, lineHeight: 1.5 }}>
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
                  <p role="alert" className="hl-mono" style={{ gridColumn: '1 / -1', fontSize: 12, letterSpacing: '0.14em', color: 'var(--warm)', margin: 0, lineHeight: 1.5 }}>
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
                    style={{ color: 'var(--warm)', borderColor: 'color-mix(in srgb, var(--warm) 40%, transparent)' }}
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
            <SectionLabel>pending removal</SectionLabel>
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
                  <div className="hl-mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--warm)', marginTop: 4 }}>
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
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'color-mix(in srgb, var(--warm) 40%, transparent)'; }}
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
            <SectionLabel>pending invites</SectionLabel>
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
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; }}
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
          <p role="alert" className="hl-mono" style={{ fontSize: 12, color: 'var(--warm)', letterSpacing: '0.14em', margin: '0 0 16px' }}>
            {deleteError}
          </p>
        )}

        {/* member list — the ledger of the bloodline */}
        {isLoading ? (
          <div style={{ height: 1, background: 'var(--warm)', width: 80, opacity: 0.4, marginTop: 8 }} />
        ) : isError ? (
          <RoomError onRetry={() => refetch()} />
        ) : members.length === 0 ? (
          <div style={{ paddingTop: 8 }}>
            <p className="hl-serif" style={{ fontStyle: 'italic', color: 'var(--bone-dim)', fontSize: 18, margin: 0, lineHeight: 1.7 }}>
              No one else is on this thread yet. Add the first name above.
            </p>
          </div>
        ) : (
          <>
          <div style={{ display: 'grid', gap: 0 }}>
            {members.map((m) => {
              // Fall back to a deterministic per-member dye so each member carries
              // a distinct, stable identity hue even when none was explicitly set
              // (no UI assigns custom dyes yet — without this every row is warm).
              const dyeKey = m.dye?.toLowerCase() || dyeForId(m.id);
              const isEditing = editTarget?.id === m.id;
              const relMeta = [m.relationship, m.role].filter(Boolean).join(' · ');
              const isKeeper = (m.role ?? '').toLowerCase().includes('keeper');
              const thread = `var(--dye-${dyeKey}, var(--warm))`;
              const nameColor = dyeTextColor(dyeKey);
              return (
                <div
                  key={m.id}
                  style={{
                    borderBottom: '1px solid var(--rule)',
                    // The dye is the member's identity signal as a 3px left-margin
                    // thread (constitution: dye is signal only — never a fill/swatch).
                    borderLeft: `3px solid ${thread}`,
                    paddingLeft: 16,
                  }}
                >
                  {/* roster ledger row — the left dye thread carries identity, the
                      name carries the dye hue, mono relation sits right. Hairlines. */}
                  <Link
                    to={`/person/${m.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 18,
                      textDecoration: 'none',
                      padding: '22px 4px',
                      minHeight: 44,
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 18,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span
                        className="hl-serif"
                        style={{
                          fontWeight: 400,
                          fontSize: 'clamp(18px, 5vw, 22px)',
                          lineHeight: 1.25,
                          color: nameColor,
                          minWidth: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {m.name}
                      </span>
                    </span>
                    {relMeta && (
                      <span
                        className="hl-mono"
                        style={{
                          flex: '0 0 auto',
                          whiteSpace: 'nowrap',
                          fontSize: 10,
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          color: 'var(--muted-3)',
                        }}
                      >
                        {m.relationship && <span>{m.relationship}</span>}
                        {m.relationship && m.role && <span> · </span>}
                        {/* The Keeper role wears the lone copper label; other
                            roles stay muted alongside the relationship. */}
                        {m.role && (
                          <span style={{ color: isKeeper ? 'var(--copper-label)' : 'var(--muted-3)' }}>
                            {m.role}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                  <div style={{ padding: isEditing ? '0 4px 8px 4px' : '0 4px 18px 4px', display: 'grid', gap: 8 }}>
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
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; }}
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
                    <div style={{ padding: '0 4px 22px 4px' }}>
                      <input
                        value={editName}
                        onChange={(e) => { setEditName(e.target.value); setEditError(null); }}
                        placeholder="name"
                        aria-label="Name"
                        style={{ border: 0, borderBottom: '1px solid var(--rule)', background: 'transparent', color: 'var(--bone)', fontFamily: 'var(--serif)', fontSize: 14, padding: '6px 0 8px', outline: 'none', marginBottom: 8, display: 'block', width: '100%', boxSizing: 'border-box' }}
                      />
                      <input
                        value={editRelationship}
                        onChange={(e) => { setEditRelationship(e.target.value); setEditError(null); }}
                        placeholder="relationship"
                        aria-label="Relationship"
                        style={{ border: 0, borderBottom: '1px solid var(--rule)', background: 'transparent', color: 'var(--bone)', fontFamily: 'var(--serif)', fontSize: 14, padding: '6px 0 8px', outline: 'none', marginBottom: 8, display: 'block', width: '100%', boxSizing: 'border-box' }}
                      />
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => { setEditEmail(e.target.value); setEditError(null); }}
                        placeholder="email — optional"
                        aria-label="Email"
                        style={{ border: 0, borderBottom: '1px solid var(--rule)', background: 'transparent', color: 'var(--bone)', fontFamily: 'var(--serif)', fontSize: 14, padding: '6px 0 8px', outline: 'none', marginBottom: 8, display: 'block', width: '100%', boxSizing: 'border-box' }}
                      />
                      <input
                        type="date"
                        value={editBirthDate}
                        onChange={(e) => { setEditBirthDate(e.target.value); setEditError(null); }}
                        placeholder="birthday — optional"
                        aria-label="Birthday"
                        style={{ border: 0, borderBottom: '1px solid var(--rule)', background: 'transparent', color: 'var(--bone)', fontFamily: 'var(--mono)', fontSize: 13, padding: '6px 0 8px', outline: 'none', marginBottom: 8, display: 'block', width: '100%', boxSizing: 'border-box' }}
                      />
                      {editError && (
                        <p className="hl-mono" style={{ fontSize: 12, color: 'var(--warm)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>{editError}</p>
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
          </>
        )}

        {/* quiet mono footer — a centered call to widen the bloodline */}
        {!showForm && (
          <div style={{ marginTop: 56, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => openForm('invite')}
              style={{
                background: 'transparent', border: 0, padding: '8px 0', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.3em',
                textTransform: 'uppercase', color: 'var(--muted-4)',
                transition: 'color 180ms var(--ease)', touchAction: 'manipulation',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--copper-label)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-4)'; }}
            >
              invite a family member
            </button>
          </div>
        )}

        {/* the ∞ wax seal rests warm at the foot of the ledger */}
        <div style={{ marginTop: 72 }}>
          <WaxSeal />
        </div>
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
