import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { threadsApi, type ThreadRole } from '../services/api';

export function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const threadId = id ?? '';
  const queryClient = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
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

  const { data: entries } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ['thread', threadId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['thread', threadId, 'successors'] });
    },
  });

  const designate = useMutation({
    mutationFn: (memberIdAndRank: { successor_member_id: string; rank: number }) =>
      threadsApi.designateSuccessor(threadId, memberIdAndRank),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', threadId, 'successors'] });
    },
  });

  if (isLoading) {
    return (
      <AppFrame>
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      </AppFrame>
    );
  }

  if (error || !detail) {
    return (
      <AppFrame>
        <Link
          to="/threads"
          style={{
            display: 'inline-block',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-faint)',
            textDecoration: 'none',
            marginBottom: 40,
          }}
        >
          ← all threads
        </Link>
        <h1
          className="loom-serif"
          style={{ fontSize: 28, fontWeight: 300, fontStyle: 'italic', marginBottom: 12 }}
        >
          Thread not available.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 16, color: 'var(--loom-bone-dim)', lineHeight: 1.65 }}
        >
          You may not be a member of this thread, or it may have been archived.
        </p>
      </AppFrame>
    );
  }

  const thread = detail.thread;
  const memberRows = members?.members ?? [];
  const entryRows = entries?.entries ?? [];

  return (
    <AppFrame>
      {/* Back */}
      <Link
        to="/threads"
        style={{
          display: 'inline-block',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--loom-bone-faint)',
          textDecoration: 'none',
          marginBottom: 40,
          transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--loom-bone-dim)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--loom-bone-faint)'; }}
      >
        ← all threads
      </Link>

      {/* Thread header */}
      <header style={{ marginBottom: 56 }}>
        <p
          className="loom-mono"
          style={{
            margin: '0 0 14px',
            fontSize: 10,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--loom-warm)',
          }}
        >
          {thread.role.toLowerCase()} · gen {thread.generation_offset}
        </p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          {thread.name}
        </h1>
        {thread.dedication ? (
          <p
            className="loom-body"
            style={{ fontSize: 18, color: 'var(--loom-bone-dim)', margin: '18px 0 0', maxWidth: 640, lineHeight: 1.65 }}
          >
            {thread.dedication}
          </p>
        ) : null}

        <p
          className="loom-mono"
          style={{ margin: '20px 0 0', fontSize: 11, letterSpacing: '0.04em', color: 'var(--loom-bone-faint)' }}
        >
          · {entryRows.length} {entryRows.length === 1 ? 'entry' : 'entries'} &nbsp;·&nbsp; {memberRows.length} {memberRows.length === 1 ? 'member' : 'members'} &nbsp;·&nbsp; {thread.default_visibility.toLowerCase()}
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          <Link
            to={`/threads/${threadId}/compose`}
            className="loom-btn"
            style={{ textDecoration: 'none' }}
          >
            add entry
          </Link>
          {canInvite ? (
            <button
              type="button"
              onClick={() => setInviteOpen((v) => !v)}
              className="loom-btn-ghost"
            >
              {inviteOpen ? 'close' : 'invite member'}
            </button>
          ) : null}
        </div>
      </header>

      {/* Members */}
      <section style={{ marginBottom: 56 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
          <span className="loom-eyebrow">Members</span>
          <hr className="loom-hairline" style={{ flex: 1 }} />
        </div>

        {inviteOpen && canInvite ? (
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
              border: '1px solid var(--loom-rule-warm)',
              padding: '24px 28px',
              marginBottom: 24,
              display: 'grid',
              gap: 20,
            }}
          >
            <p
              className="loom-mono"
              style={{ margin: 0, fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--loom-warm)' }}
            >
              Invite a member
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
              <FieldInput id="m-name" label="Display name" value={inviteName} onChange={setInviteName} placeholder="Aunt Faiza" />
              <FieldInput id="m-email" label="Email — optional" type="email" value={inviteEmail} onChange={setInviteEmail} placeholder="faiza@example.com" />
              <FieldInput id="m-rel" label="Relation" value={inviteRelation} onChange={setInviteRelation} placeholder="aunt, son, grandchild" />
              <div>
                <label htmlFor="m-role" className="loom-eyebrow" style={{ display: 'block', marginBottom: 8 }}>
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
                <label htmlFor="m-gen" className="loom-eyebrow" style={{ display: 'block', marginBottom: 8 }}>
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
                  className="loom-mono"
                  style={{ margin: '6px 0 0', fontSize: 9, letterSpacing: '0.06em', color: 'var(--loom-bone-faint)' }}
                >
                  0 = you · +1 = your children · -1 = your parents
                </p>
              </div>
            </div>

            {inviteError ? (
              <p
                role="alert"
                className="loom-body"
                style={{ margin: 0, fontStyle: 'italic', color: '#c25a5a', fontSize: 14 }}
              >
                {inviteError}
              </p>
            ) : null}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="submit"
                disabled={invite.isPending || !inviteName.trim()}
                className="loom-btn"
                style={{ opacity: invite.isPending || !inviteName.trim() ? 0.5 : 1 }}
              >
                {invite.isPending ? 'adding…' : 'add member'}
              </button>
              <button type="button" onClick={() => setInviteOpen(false)} className="loom-btn-ghost">
                cancel
              </button>
            </div>
          </form>
        ) : null}

        {memberRows.length === 0 ? (
          <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)', fontSize: 15 }}>
            Just you so far.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {memberRows.map((m) => (
              <li
                key={m.id}
                style={{ padding: '16px 0', borderBottom: '1px solid var(--loom-rule)' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', gap: 16 }}>
                  <div>
                    <p
                      className="loom-serif"
                      style={{ margin: 0, fontSize: 18, fontWeight: 300, color: 'var(--loom-bone)' }}
                    >
                      {m.display_name}
                    </p>
                    {m.relation_label || m.email ? (
                      <p
                        className="loom-mono"
                        style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}
                      >
                        {m.relation_label}{m.relation_label && m.email ? ' · ' : ''}{m.email}
                      </p>
                    ) : null}
                    {canGovern && m.role !== 'FOUNDER' ? (
                      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Revoke ${m.display_name}'s membership? Their past entries stay attributed to them; they lose future access.`)) {
                              revoke.mutate(m.id);
                            }
                          }}
                          disabled={revoke.isPending}
                          style={ghostActionStyle}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#c25a5a'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--loom-bone-faint)'; }}
                        >
                          revoke
                        </button>
                        {m.role !== 'SUCCESSOR' && m.role !== 'PLACEHOLDER' ? (
                          <button
                            type="button"
                            onClick={() =>
                              designate.mutate({ successor_member_id: m.id, rank: (successors?.successors.length ?? 0) + 1 })
                            }
                            disabled={designate.isPending}
                            style={ghostActionStyle}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--loom-warm)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--loom-bone-faint)'; }}
                          >
                            make successor
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <span
                    className="loom-mono"
                    style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}
                  >
                    {m.role.toLowerCase()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Successors */}
      {(successors?.successors.length ?? 0) > 0 || canGovern ? (
        <section style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 14 }}>
            <span className="loom-eyebrow">Succession line</span>
            <hr className="loom-hairline" style={{ flex: 1 }} />
          </div>
          <p
            className="loom-body"
            style={{ fontSize: 14, color: 'var(--loom-bone-dim)', lineHeight: 1.65, maxWidth: 560, margin: '0 0 20px' }}
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
                    borderBottom: '1px solid var(--loom-rule)',
                  }}
                >
                  <span
                    className="loom-mono"
                    style={{ fontSize: 10, color: 'var(--loom-warm)', letterSpacing: '0.1em' }}
                  >
                    #{s.rank}
                  </span>
                  <span
                    className="loom-serif"
                    style={{ fontSize: 18, fontWeight: 300, color: 'var(--loom-bone)' }}
                  >
                    {s.display_name}
                  </span>
                  <span
                    className="loom-mono"
                    style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}
                  >
                    {s.role.toLowerCase()}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p
              className="loom-body"
              style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)', fontSize: 15 }}
            >
              None designated yet. Use "make successor" on a member above to begin the chain.
            </p>
          )}
        </section>
      ) : null}

      {/* Entries — the Wall */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
          <span className="loom-eyebrow">The Wall</span>
          <hr className="loom-hairline" style={{ flex: 1 }} />
          <span
            className="loom-mono"
            style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--loom-bone-faint)' }}
          >
            · {entryRows.length} {entryRows.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {entryRows.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', border: '1px solid var(--loom-rule)' }}>
            <p className="loom-eyebrow" style={{ marginBottom: 12 }}>Nothing woven yet</p>
            <h2
              className="loom-serif"
              style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', margin: '0 0 20px' }}
            >
              The first entry starts the cloth.
            </h2>
            <Link
              to={`/threads/${threadId}/compose`}
              className="loom-btn"
              style={{ textDecoration: 'none' }}
            >
              add the first entry
            </Link>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {entryRows.map((e) => {
              return (
                <li
                  key={e.id}
                  style={{ padding: '24px 0', borderBottom: '1px solid var(--loom-rule)' }}
                >
                  <article style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 32, alignItems: 'baseline' }}>
                    <div>
                      <p
                        className="loom-mono"
                        style={{
                          margin: 0,
                          fontSize: 11,
                          letterSpacing: '0.18em',
                          color: e.pending_lock ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {e.pending_lock ? `∞ ${e.pending_lock.toLowerCase()} lock` : formatDate(e.created_at)}
                      </p>
                      {e.pending_lock ? (
                        <p
                          className="loom-mono"
                          style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}
                        >
                          {formatDate(e.created_at)}
                        </p>
                      ) : null}
                      <p
                        className="loom-mono"
                        style={{ margin: '6px 0 0', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}
                      >
                        {e.visibility.toLowerCase()}
                        {e.memory_id ? ' · memory' : ''}
                        {e.voice_recording_id ? ' · voice' : ''}
                        {e.era_year ? ` · ${e.era_year}` : ''}
                      </p>
                    </div>
                    <div>
                      <h3
                        className="loom-serif"
                        style={{ margin: '0 0 0', fontSize: 22, fontWeight: 300, color: 'var(--loom-bone)', lineHeight: 1.25 }}
                      >
                        {e.pending_lock ? (
                          <span style={{ color: 'var(--loom-warm)', marginRight: 8 }} aria-hidden>∞</span>
                        ) : null}
                        {e.title ?? <em style={{ color: 'var(--loom-bone-faint)', fontStyle: 'italic' }}>Untitled entry</em>}
                      </h3>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppFrame>
  );
}

/* ── Small field helpers ── */

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 0,
  borderBottom: '1px solid var(--loom-rule)',
  color: 'var(--loom-bone)',
  caretColor: 'var(--loom-warm)',
  fontFamily: "'Inter', sans-serif",
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
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--loom-bone-faint)',
  transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
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
      <label htmlFor={id} className="loom-eyebrow" style={{ display: 'block', marginBottom: 8 }}>
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}
