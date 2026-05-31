import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { ViewToggle } from '../loom/components/ViewToggle';
import { threadsApi, type ThreadRole, type ThreadEntry } from '../services/api';

/**
 * The 10-stop natural-dye palette is permitted ONLY inside woven thread
 * content (the Wall). Each entry takes a dye chapter-mark; we cycle the
 * palette deterministically by entry index so the cloth reads as woven.
 */
const DYES = [
  'iron', 'walnut', 'cochineal', 'kermes', 'madder',
  'saffron', 'weld', 'oakgall', 'woad', 'indigo',
] as const;
const dyeVar = (i: number) => `var(--dye-${DYES[i % DYES.length]})`;

type WallView = 'wall' | 'book';

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
  const [wallView, setWallView] = useState<WallView>('wall');

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

  // author_member_id → display name, for the entry byline
  const memberName = new Map<string, string>(memberRows.map((m) => [m.id, m.display_name]));
  const authorOf = (e: ThreadEntry) => memberName.get(e.author_member_id) ?? 'A member of this thread';

  // The "current" entry = most recently created — it carries the warm spine.
  const activeEntryId =
    entryRows.length > 0
      ? entryRows.reduce((a, b) => (a.created_at >= b.created_at ? a : b)).id
      : null;

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
          {(thread.role ?? '').toLowerCase()} · gen {thread.generation_offset}
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
          · {entryRows.length} {entryRows.length === 1 ? 'entry' : 'entries'} &nbsp;·&nbsp; {memberRows.length} {memberRows.length === 1 ? 'member' : 'members'} &nbsp;·&nbsp; {(thread.default_visibility ?? '').toLowerCase()}
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
                    {(m.role ?? '').toLowerCase()}
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
                    {(s.role ?? '').toLowerCase()}
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 28 }}>
          <span className="loom-eyebrow">The Wall</span>
          <hr className="loom-hairline" style={{ flex: 1 }} />
          {entryRows.length > 0 ? (
            <ViewToggle<WallView>
              value={wallView}
              onChange={setWallView}
              options={[
                { value: 'wall', label: 'wall' },
                { value: 'book', label: 'book' },
              ]}
            />
          ) : null}
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
        ) : wallView === 'book' ? (
          <BookReader entries={entryRows} authorOf={authorOf} threadName={thread.name} />
        ) : (
          <div>
            {entryRows.map((e, i) => (
              <WallEntry
                key={e.id}
                entry={e}
                dyeIndex={i}
                author={authorOf(e)}
                visibility={thread.default_visibility}
                active={e.id === activeEntryId}
              />
            ))}
          </div>
        )}
      </section>
    </AppFrame>
  );
}

/**
 * WallEntry — one weft thread rendered in the design's Wall treatment:
 * a dye chapter-mark (swatch + label), the author italic byline, the
 * FULL serif prose body (hero prose, ~17px, ~60ch), and a meta line.
 * The active/current entry carries a warm left-border spine.
 *
 * The body is read from `body_ciphertext` (which the composer currently
 * stores as plaintext — see ThreadCompose). Sealed entries (pending_lock)
 * never render their body; we show the seal instead. Nothing is invented:
 * if no body exists, we say so quietly.
 */
function WallEntry({
  entry: e,
  dyeIndex,
  author,
  visibility,
  active,
}: {
  entry: ThreadEntry;
  dyeIndex: number;
  author: string;
  visibility: string;
  active: boolean;
}) {
  const sealed = !!e.pending_lock;
  const body = !sealed ? (e.body_ciphertext ?? '').trim() : '';
  const paras = body ? body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : [];

  // meta line — REAL fields only; no fabricated amendment/comment counts.
  const metaBits: string[] = [(e.visibility ?? visibility).toLowerCase()];
  if (e.era_label) metaBits.push(e.era_label);
  else if (e.era_year) metaBits.push(String(e.era_year));
  if (e.memory_id) metaBits.push('photograph');
  if (e.voice_recording_id) metaBits.push('voice');

  return (
    <article
      style={{
        maxWidth: 680,
        padding: '32px 0',
        borderBottom: '1px solid var(--loom-rule)',
        ...(active
          ? { borderLeft: '1px solid var(--loom-warm)', paddingLeft: 22, marginLeft: -22 }
          : null),
      }}
    >
      {/* dye chapter-mark */}
      <div
        className="loom-mono"
        style={{
          fontSize: 10,
          color: 'var(--loom-bone-faint)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          aria-hidden
          style={{ display: 'inline-block', width: 12, height: 2, background: dyeVar(dyeIndex) }}
        />
        <span>
          {sealed ? `∞ ${e.pending_lock?.toLowerCase()} lock` : formatDate(e.created_at)}
        </span>
      </div>

      {/* author italic byline */}
      <div
        className="loom-serif"
        style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--loom-bone-dim)', marginBottom: 4 }}
      >
        {author}
      </div>

      {/* title */}
      <h3
        className="loom-serif"
        style={{
          margin: 0,
          fontSize: active ? 28 : 26,
          fontWeight: 400,
          color: 'var(--loom-bone)',
          lineHeight: 1.2,
          letterSpacing: '-0.008em',
        }}
      >
        {sealed ? (
          <span style={{ color: 'var(--loom-warm)', marginRight: 8 }} aria-hidden>∞</span>
        ) : null}
        {e.title ?? <em style={{ color: 'var(--loom-bone-faint)', fontStyle: 'italic' }}>Untitled entry</em>}
      </h3>

      {/* FULL serif prose body */}
      {sealed ? (
        <p
          className="loom-body"
          style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--loom-bone-faint)', margin: '14px 0 0', maxWidth: '60ch', lineHeight: 1.7 }}
        >
          Sealed until its unlock condition is met. The thread holds it until then.
        </p>
      ) : paras.length > 0 ? (
        <div style={{ marginTop: 14 }}>
          {paras.map((p, k) => (
            <p
              key={k}
              className="loom-serif"
              style={{
                fontSize: 17,
                lineHeight: 1.7,
                color: active ? 'var(--loom-bone)' : 'var(--loom-bone-dim)',
                margin: k === 0 ? 0 : '14px 0 0',
                maxWidth: '60ch',
              }}
            >
              {p}
            </p>
          ))}
        </div>
      ) : (
        <p
          className="loom-body"
          style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--loom-bone-faint)', margin: '14px 0 0' }}
        >
          No words yet — only the title was woven.
        </p>
      )}

      {/* meta line */}
      <div
        className="loom-mono"
        style={{ marginTop: 14, fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.12em' }}
      >
        {metaBits.join(' · ')}
      </div>
    </article>
  );
}

/**
 * BookReader — the WallBook continuum, driven by REAL entries. One
 * entry per spread: left page carries the chapter intro (∞-free dye
 * eyebrow, title, author byline, folio); right page carries the full
 * serif prose. A loom-mono text pager + ∞ chapter-dot row turns pages.
 * Rendered on the parchment surface (deliberate physical-book shift).
 *
 * Sealed entries are shown as a sealed page (no body) — never invented.
 */
function BookReader({
  entries,
  authorOf,
  threadName,
}: {
  entries: ThreadEntry[];
  authorOf: (e: ThreadEntry) => string;
  threadName: string;
}) {
  const [idx, setIdx] = useState(0);
  const e = entries[idx];
  const sealed = !!e.pending_lock;
  const body = !sealed ? (e.body_ciphertext ?? '').trim() : '';
  const paras = body ? body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : [];
  const turn = (d: number) => setIdx((p) => Math.min(entries.length - 1, Math.max(0, p + d)));

  return (
    <div
      style={{
        background: 'var(--parchment)',
        color: 'var(--parchment-ink)',
        border: '1px solid var(--parchment-rule)',
        position: 'relative',
      }}
    >
      {/* running head */}
      <div
        className="loom-mono"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '20px 40px 0',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--parchment-faint)',
        }}
      >
        <span>book mode · {threadName}</span>
        <span style={{ color: 'var(--loom-warm)' }}>∞ &nbsp; entry {idx + 1} of {entries.length}</span>
      </div>

      {/* two-page spread */}
      <div style={{ display: 'flex', minHeight: 420 }}>
        {/* left page — chapter intro */}
        <div
          style={{
            flex: 1,
            padding: '40px 40px 40px 56px',
            borderRight: '1px solid var(--parchment-rule)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            className="loom-mono"
            style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.32em', textTransform: 'uppercase', marginBottom: 28 }}
          >
            {e.era_label ?? (e.era_year ? String(e.era_year) : formatDate(e.created_at))}
          </div>
          <h2
            className="loom-serif"
            style={{ fontSize: 38, lineHeight: 1.1, fontWeight: 300, margin: 0, color: 'var(--parchment-ink)', letterSpacing: '-0.018em', maxWidth: '16ch' }}
          >
            {sealed ? (
              <span style={{ color: 'var(--loom-warm)', marginRight: 8 }} aria-hidden>∞</span>
            ) : null}
            {e.title ?? <em style={{ color: 'var(--parchment-faint)' }}>Untitled entry</em>}
          </h2>
          <div
            className="loom-serif"
            style={{ fontStyle: 'italic', fontSize: 16, color: 'var(--parchment-dim)', marginTop: 24, fontWeight: 400 }}
          >
            Written by {authorOf(e)} · {formatDate(e.created_at)}
          </div>
          <div style={{ flex: 1 }} />
          <div className="loom-mono" style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.18em' }}>
            p. {idx * 2 + 1}
          </div>
        </div>

        {/* right page — body */}
        <div style={{ flex: 1, padding: '40px 56px 40px 40px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ maxWidth: '52ch' }}>
            {sealed ? (
              <p className="loom-serif" style={{ fontSize: 17, fontStyle: 'italic', lineHeight: 1.85, color: 'var(--parchment-dim)', margin: 0 }}>
                This entry is sealed until its unlock condition is met. When the day comes, it will open here.
              </p>
            ) : paras.length > 0 ? (
              paras.map((p, k) => (
                <p
                  key={k}
                  className="loom-serif"
                  style={{ fontSize: 18, lineHeight: 1.9, color: 'var(--parchment-ink)', margin: k === 0 ? 0 : '16px 0 0', fontWeight: 400 }}
                >
                  {p}
                </p>
              ))
            ) : (
              <p className="loom-serif" style={{ fontSize: 17, fontStyle: 'italic', lineHeight: 1.85, color: 'var(--parchment-dim)', margin: 0 }}>
                No words yet — only the title was woven.
              </p>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <div className="loom-mono" style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.18em', textAlign: 'right' }}>
            p. {idx * 2 + 2}
          </div>
        </div>
      </div>

      {/* pager — mono text + ∞ chapter-dot row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 40px 16px' }}>
        <button
          type="button"
          onClick={() => turn(-1)}
          disabled={idx === 0}
          className="loom-mono"
          style={{
            background: 'transparent', border: 0, padding: 0,
            cursor: idx === 0 ? 'default' : 'pointer',
            fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: idx === 0 ? 'var(--parchment-faint)' : 'var(--parchment-dim)',
          }}
        >
          ← earlier
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', maxWidth: '60%', justifyContent: 'center' }}>
          {entries.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`entry ${i + 1}`}
              aria-current={i === idx}
              onClick={() => setIdx(i)}
              className="loom-serif"
              style={{
                background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                fontSize: 13, lineHeight: 1,
                color: i === idx ? 'var(--loom-warm)' : 'var(--parchment-faint)',
                transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              ∞
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => turn(1)}
          disabled={idx === entries.length - 1}
          className="loom-mono"
          style={{
            background: 'transparent', border: 0, padding: 0,
            cursor: idx === entries.length - 1 ? 'default' : 'pointer',
            fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: idx === entries.length - 1 ? 'var(--parchment-faint)' : 'var(--loom-warm)',
          }}
        >
          later →
        </button>
      </div>

      {/* parchment edge — paler, ~6px */}
      <div
        aria-hidden
        style={{ height: 6, background: '#e6dcc4', borderTop: '1px solid var(--parchment-rule)', opacity: 0.6, position: 'relative', overflow: 'hidden' }}
      >
        {Array.from({ length: 120 }, (_, k) => (
          <span
            key={k}
            style={{ position: 'absolute', top: 0, bottom: 0, left: `${(k / 120) * 100}%`, width: 1, background: 'rgba(26,25,22,0.06)' }}
          />
        ))}
      </div>
    </div>
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
