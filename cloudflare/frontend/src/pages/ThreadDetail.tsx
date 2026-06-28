import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TapestryEdge } from '../loom/components/Frame';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { threadsApi, type ThreadRole, type ThreadEntry } from '../services/api';
import { CosmicHeader, EntryRow, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { RoomError } from '../loom/components/RoomError';
import { DYES as DYE_PALETTE, dyeVar, type Dye } from '../loom/dye';

/**
 * The 10-stop natural-dye palette is permitted ONLY inside woven thread
 * content (the Wall). Each entry takes a dye chapter-mark; we cycle the
 * palette deterministically by entry index so the cloth reads as woven.
 */
const dyeOf = (i: number): Dye => DYE_PALETTE[i % DYE_PALETTE.length];

export function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const threadId = id ?? '';
  const queryClient = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [designateError, setDesignateError] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRelation, setInviteRelation] = useState('');
  const [inviteRole, setInviteRole] = useState<Exclude<ThreadRole, 'FOUNDER'>>('READER');
  const [inviteGen, setInviteGen] = useState<number>(0);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => threadsApi.get(threadId).then((r) => r.data),
    enabled: !!threadId,
  });

  const { data: members } = useQuery({
    queryKey: ['thread', threadId, 'members'],
    queryFn: () => threadsApi.listMembers(threadId).then((r) => r.data),
    enabled: !!threadId,
  });

  const { data: entries, isError: entriesError, refetch: refetchEntries } = useQuery({
    queryKey: ['thread', threadId, 'entries'],
    queryFn: () => threadsApi.listEntries(threadId, { limit: 100 }).then((r) => r.data),
    enabled: !!threadId,
  });

  const { data: successors } = useQuery({
    queryKey: ['thread', threadId, 'successors'],
    queryFn: () => threadsApi.listSuccessors(threadId).then((r) => r.data),
    enabled: !!threadId,
  });

  const invite = useMutation({
    mutationFn: () =>
      threadsApi
        .addMember(threadId, {
          display_name: inviteName.trim(),
          email: inviteEmail.trim() || undefined,
          relation_label: inviteRelation.trim() || undefined,
          role: inviteRole,
          generation_offset: inviteGen,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', threadId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      setInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRelation('');
      setInviteRole('READER');
      setInviteGen(0);
      setInviteError(null);
    },
    onError: (err: { response?: { data?: { error?: string } }; message?: string }) => {
      setInviteError(err?.response?.data?.error ?? err?.message ?? 'Could not add member.');
    },
  });

  const canInvite = detail?.membership.role === 'FOUNDER' || detail?.membership.role === 'SUCCESSOR';
  const canGovern = canInvite;

  const revoke = useMutation({
    mutationFn: (memberId: string) => threadsApi.revokeMember(threadId, memberId),
    onSuccess: () => {
      setConfirmRevokeId(null);
      setRevokeError(null);
      queryClient.invalidateQueries({ queryKey: ['thread', threadId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['thread', threadId, 'successors'] });
    },
    onError: (err: any) => setRevokeError(err?.response?.data?.error ?? 'could not revoke membership'),
  });

  const designate = useMutation({
    mutationFn: (memberIdAndRank: { successor_member_id: string; rank: number }) =>
      threadsApi.designateSuccessor(threadId, memberIdAndRank),
    onSuccess: () => {
      setDesignateError(null);
      queryClient.invalidateQueries({ queryKey: ['thread', threadId, 'successors'] });
    },
    onError: (err: any) => setDesignateError(err?.response?.data?.error ?? 'could not designate successor'),
  });

  const threadName = detail?.thread.name;

  if (isLoading) {
    return (
      <ClothShell
        topbarLeft={<Breadcrumbs trail={[{ label: 'threads', to: '/threads' }, { label: 'thread' }]} />}
        topbarRight={<Link to="/threads" className="hl-link warm">threads →</Link>}
      >
        <div style={{ padding: '56px clamp(20px, 5vw, 56px)' }}>
          <p
            className="hl-mono"
            style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}
          >
            gathering the Deep…
          </p>
        </div>
      </ClothShell>
    );
  }

  if (error || !detail) {
    return (
      <ClothShell
        topbarLeft={<Breadcrumbs trail={[{ label: 'threads', to: '/threads' }, { label: 'thread' }]} />}
        topbarRight={<Link to="/threads" className="hl-link warm">threads →</Link>}
      >
        <div style={{ padding: '56px clamp(20px, 5vw, 56px)', maxWidth: 560 }}>
          <CosmicHeader
            eyebrow="the wall"
            title="Thread not available."
            sub="You may not be a member of this thread, or it may have been archived."
          />
        </div>
      </ClothShell>
    );
  }

  const memberRows = members?.members ?? [];
  const entryRows = entries?.entries ?? [];

  // author_member_id → display name, for the entry byline
  const memberName = new Map<string, string>(memberRows.map((m) => [m.id, m.display_name]));
  const authorOf = (e: ThreadEntry) => memberName.get(e.author_member_id) ?? 'A member of this thread';

  // The "current" entry = most recently created — it carries the warm spine.
  const activeEntryId =
    entryRows.length > 0
      ? entryRows.reduce((a, b) => (a.created_at >= b.created_at ? a : b)).id
      : null;

  // The year an entry sits at on the ledger — its era year, else the year it
  // was woven. Drives the decade dividers and the mono date on the right.
  const yearOf = (e: ThreadEntry): number => {
    if (e.era_year != null) return e.era_year;
    const d = new Date(e.created_at);
    return Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  };

  // Right-column mono date: the era label as written, else "OCT 1947".
  const monthYearOf = (e: ThreadEntry): string => {
    if (e.era_label) return e.era_label;
    const d = new Date(e.created_at);
    if (Number.isNaN(d.getTime())) return String(yearOf(e));
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase();
  };

  // Group the ledger into decades, oldest first — each decade gets a divider.
  const sortedEntries = [...entryRows].sort((a, b) => yearOf(a) - yearOf(b));
  const decades: { decade: number; entries: typeof sortedEntries }[] = [];
  for (const e of sortedEntries) {
    const decade = Math.floor(yearOf(e) / 10) * 10;
    const last = decades[decades.length - 1];
    if (last && last.decade === decade) last.entries.push(e);
    else decades.push({ decade, entries: [e] });
  }

  // "THE VANCE THREAD · 1947–2026" — mono header derived from the thread + span.
  const yearsSpan =
    sortedEntries.length > 0
      ? (() => {
          const lo = yearOf(sortedEntries[0]);
          const hi = yearOf(sortedEntries[sortedEntries.length - 1]);
          return lo === hi ? String(lo) : `${lo}–${hi}`;
        })()
      : null;
  const ledgerHeader = `the ${threadName ?? 'thread'} thread${yearsSpan ? ` · ${yearsSpan}` : ''}`;

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'threads', to: '/threads' }, { label: threadName ?? 'thread' }]} />}
      topbarRight={<Link to="/threads" className="hl-link warm">threads →</Link>}
    >
      {/* ── Full-screen Wall ledger ── */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          bottom: 40,
          left: 0,
          right: 0,
          overflowY: 'auto',
        }}
      >
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px clamp(20px, 5vw, 56px) 0' }}>
          {/* ── Ledger header — mono, the page of the thread ── */}
          <header style={{ marginBottom: 44 }}>
            <div
              className="hl-mono"
              style={{
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
              }}
            >
              {ledgerHeader}
            </div>
          </header>

          {entriesError ? (
            /* A failed entries read must never read as "the first entry starts
               the cloth" — the woven entries are permanent; this is only a reach
               failure. Surface the in-voice retry, keeping the ledger chrome. */
            <div style={{ padding: '24px 0 64px' }}>
              <RoomError onRetry={() => refetchEntries()} />
            </div>
          ) : entryRows.length === 0 ? (
            /* Empty state — a quiet listener prompt */
            <div style={{ padding: '24px 0 64px' }}>
              <p className="hl-serif" style={{ fontStyle: 'italic', color: 'var(--bone-dim)', fontSize: 18, margin: 0 }}>
                The first entry starts the thread.
              </p>
              <Link
                to={`/threads/${threadId}/compose`}
                className="hl-btn"
                style={{ textDecoration: 'none', display: 'inline-block', marginTop: 24 }}
              >
                add the first entry
              </Link>
            </div>
          ) : (
            /* ── Entry ledger, grouped by decade ── */
            <div role="list">
              {decades.map((group) => (
                <div key={group.decade}>
                  <div
                    className="hl-mono"
                    style={{
                      fontSize: 12,
                      letterSpacing: '0.16em',
                      color: 'var(--muted-4)',
                      margin: '34px 0 6px',
                    }}
                  >
                    {group.decade}s
                  </div>
                  {group.entries.map((e) => {
                    const i = entryRows.indexOf(e);
                    const active = e.id === activeEntryId;
                    const sealed = !!e.pending_lock;
                    const body = !sealed ? (e.body_ciphertext ?? '').trim() : '';
                    const snippet = body ? body.split(/\n{2,}/)[0].trim() : '';
                    const dye = dyeOf(i < 0 ? 0 : i);
                    const year = monthYearOf(e);

                    const title = sealed ? (
                      <>
                        <span style={{ color: 'var(--warm)', marginRight: 8 }} aria-hidden>∞</span>
                        {e.title ?? 'Sealed entry'}
                      </>
                    ) : (
                      e.title ?? <em style={{ color: 'var(--bone-faint)', fontStyle: 'italic' }}>Untitled entry</em>
                    );

                    const sub = sealed
                      ? 'Sealed until its unlock condition is met.'
                      : snippet || (e.title ? 'No words yet — only the title was woven.' : undefined);

                    // Each entry carries its dye as a left-margin thread — the
                    // family identity signal. The most recent entry burns warm.
                    const spine = active ? 'var(--warm)' : dyeVar(dye);

                    return (
                      <div
                        key={e.id}
                        role="listitem"
                        title={authorOf(e)}
                        style={{
                          borderLeft: `2px solid ${spine}`,
                          paddingLeft: 18,
                          marginLeft: -18,
                        }}
                      >
                        <EntryRow
                          title={title}
                          sub={sub}
                          year={year}
                          italic={!e.title}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── Members ── */}
          <div style={{ marginTop: 24 }}>
            <SectionLabel>members</SectionLabel>

            {/* Invite — a quiet mono affordance, never an icon button */}
            {canInvite && (
              <div style={{ marginBottom: 24, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setInviteOpen((v) => !v)}
                  className="hl-mono"
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: 'pointer',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                    marginBottom: inviteOpen ? 20 : 0,
                    transition: 'color 180ms var(--ease)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--warm)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-faint)')}
                >
                  {inviteOpen ? 'close ×' : 'invite member +'}
                </button>

                {inviteOpen && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setInviteError(null);
                      if (!inviteName.trim()) {
                        setInviteError('Display name is required.');
                        return;
                      }
                      invite.mutate();
                    }}
                    style={{
                      border: '1px solid var(--rule)',
                      padding: '24px 28px',
                      display: 'grid',
                      gap: 20,
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                      <FieldInput id="m-name" label="Display name" value={inviteName} onChange={setInviteName} placeholder="Aunt Faiza" />
                      <FieldInput id="m-email" label="Email — optional" type="email" value={inviteEmail} onChange={setInviteEmail} placeholder="faiza@example.com" />
                      <FieldInput id="m-rel" label="Relation" value={inviteRelation} onChange={setInviteRelation} placeholder="aunt, son, grandchild" />
                      <div>
                        <label htmlFor="m-role" className="hl-eyebrow" style={{ display: 'block', marginBottom: 8 }}>
                          Role
                        </label>
                        <select
                          id="m-role"
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                          style={fieldSelectStyle}
                        >
                          <option value="READER">Reader — can read, can't write</option>
                          <option value="AUTHOR">Author — can read and add entries</option>
                          <option value="SUCCESSOR">Successor — inherits if you step away</option>
                          <option value="PLACEHOLDER">Placeholder — descendant not yet born</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="m-gen" className="hl-eyebrow" style={{ display: 'block', marginBottom: 8 }}>
                          Generation offset
                        </label>
                        <input
                          id="m-gen"
                          type="number"
                          min={-3}
                          max={5}
                          value={inviteGen}
                          onChange={(e) => setInviteGen(parseInt(e.target.value, 10) || 0)}
                          style={fieldInputStyle}
                        />
                        <p
                          className="hl-mono"
                          style={{ margin: '6px 0 0', fontSize: 9, letterSpacing: '0.06em', color: 'var(--bone-faint)' }}
                        >
                          0 = you · +1 = your children · -1 = your parents
                        </p>
                      </div>
                    </div>

                    {inviteError ? (
                      <p role="alert" className="hl-mono" style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', color: 'var(--warm)' }}>
                        {inviteError}
                      </p>
                    ) : null}

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        type="submit"
                        disabled={invite.isPending || !inviteName.trim()}
                        className="hl-btn"
                        style={{ opacity: invite.isPending || !inviteName.trim() ? 0.5 : 1 }}
                      >
                        {invite.isPending ? 'adding…' : 'add member'}
                      </button>
                      <button type="button" onClick={() => setInviteOpen(false)} style={ghostActionStyle}>
                        cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {memberRows.length === 0 ? (
              <p className="hl-serif" style={{ fontStyle: 'italic', color: 'var(--bone-faint)', fontSize: 15 }}>
                Just you so far.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {memberRows.map((m) => (
                  <li key={m.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--rule)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', gap: 16 }}>
                      <div>
                        <p className="hl-serif" style={{ margin: 0, fontSize: 18, fontWeight: 400, color: 'var(--bone)' }}>
                          {m.display_name}
                        </p>
                        {(m.relation_label || m.email) ? (
                          <p className="hl-mono" style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.04em' }}>
                            {m.relation_label}{m.relation_label && m.email ? ' · ' : ''}{m.email}
                          </p>
                        ) : null}
                        {canGovern && m.role !== 'FOUNDER' ? (
                          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            {confirmRevokeId === m.id ? (
                              <>
                                <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
                                  revoke access?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => revoke.mutate(m.id)}
                                  disabled={revoke.isPending}
                                  style={{ ...ghostActionStyle, color: 'var(--warm)' }}
                                >
                                  {revoke.isPending ? 'revoking…' : 'confirm'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setConfirmRevokeId(null); setRevokeError(null); }}
                                  style={ghostActionStyle}
                                >
                                  cancel
                                </button>
                                {revokeError && (
                                  <span className="hl-mono" style={{ fontSize: 9.5, color: 'var(--warm)', letterSpacing: '0.1em' }}>{revokeError}</span>
                                )}
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => { setConfirmRevokeId(m.id); setRevokeError(null); }}
                                disabled={revoke.isPending}
                                style={ghostActionStyle}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-faint)'; }}
                              >
                                revoke
                              </button>
                            )}
                            {m.role !== 'SUCCESSOR' && m.role !== 'PLACEHOLDER' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  designate.mutate({ successor_member_id: m.id, rank: (successors?.successors.length ?? 0) + 1 })
                                }
                                disabled={designate.isPending}
                                style={ghostActionStyle}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-faint)'; }}
                              >
                                make successor
                              </button>
                            ) : null}
                            {designateError && (
                              <span className="hl-mono" style={{ fontSize: 9.5, color: 'var(--warm)', letterSpacing: '0.1em' }}>{designateError}</span>
                            )}
                          </div>
                        ) : null}
                      </div>
                      <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted-3)' }}>
                        {(m.role ?? '').toLowerCase()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Succession line ── */}
          {((successors?.successors.length ?? 0) > 0 || canGovern) && (
            <div style={{ marginTop: 24 }}>
              <SectionLabel>succession line</SectionLabel>
              <p
                className="hl-prose"
                style={{ fontSize: 14, color: 'var(--bone-dim)', maxWidth: 560, margin: '8px 0 20px' }}
              >
                If the Founder steps away or dies, the highest-ranked active Successor takes over — keeping the thread going without breaking continuity.
              </p>
              {successors?.successors.length ? (
                <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {successors.successors.map((s) => (
                    <li
                      key={s.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr auto',
                        alignItems: 'baseline',
                        gap: 16,
                        padding: '14px 0',
                        borderBottom: '1px solid var(--rule)',
                      }}
                    >
                      <span className="hl-mono" style={{ fontSize: 10, color: 'var(--copper-label)', letterSpacing: '0.1em' }}>
                        #{s.rank}
                      </span>
                      <span className="hl-serif" style={{ fontSize: 18, fontWeight: 400, color: 'var(--bone)' }}>
                        {s.display_name}
                      </span>
                      <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted-3)' }}>
                        {(s.role ?? '').toLowerCase()}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="hl-serif" style={{ fontStyle: 'italic', color: 'var(--bone-faint)', fontSize: 15 }}>
                  None designated yet. Use "make successor" on a member above to begin the chain.
                </p>
              )}
            </div>
          )}

          {/* ── Add entry ── */}
          {entryRows.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <Link
                to={`/threads/${threadId}/compose`}
                className="hl-btn"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                add entry
              </Link>
            </div>
          )}

          {/* ── The wax seal rests at the foot ── */}
          <div style={{ padding: '64px 0 56px' }}>
            <WaxSeal />
          </div>
        </div>
      </div>

      <TapestryEdge />
    </ClothShell>
  );
}

/* ── Field helpers ── */

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 0,
  borderBottom: '1px solid var(--rule)',
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  fontFamily: 'var(--mono)',
  fontSize: 13,
  padding: '7px 0',
  outline: 'none',
  boxSizing: 'border-box',
};

const fieldSelectStyle: React.CSSProperties = {
  ...fieldInputStyle,
  appearance: 'none',
  cursor: 'pointer',
};

const ghostActionStyle: React.CSSProperties = {
  background: 'transparent',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--mono)',
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--bone-faint)',
  transition: 'color 180ms var(--ease)',
};

function FieldInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="hl-eyebrow" style={{ display: 'block', marginBottom: 8 }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={fieldInputStyle}
      />
    </div>
  );
}
