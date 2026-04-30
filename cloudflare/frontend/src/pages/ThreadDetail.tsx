import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Lock, Users, Loader2, Plus, ArrowRight, UserPlus } from 'lucide-react';
import { Navigation } from '../components/Navigation';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void text-paper antialiased">
        <Navigation />
        <main className="pt-24 px-6 flex items-center justify-center text-paper/50">
          <Loader2 size={20} className="animate-spin" />
        </main>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-void text-paper antialiased">
        <Navigation />
        <main className="pt-24 px-6 md:px-12 max-w-3xl mx-auto">
          <Link to="/threads" className="inline-flex items-center gap-2 text-paper/60 hover:text-paper text-sm mb-8">
            <ArrowLeft size={14} /> All threads
          </Link>
          <h1 className="font-body text-2xl mb-3">Thread not available.</h1>
          <p className="text-paper/65 leading-relaxed">
            You may not be a member of this thread, or it may have been archived. Try the threads list.
          </p>
        </main>
      </div>
    );
  }

  const thread = detail.thread;
  const memberRows = members?.members ?? [];
  const entryRows = entries?.entries ?? [];

  return (
    <div className="min-h-screen bg-void text-paper antialiased">
      <Navigation />

      <main id="main-content" className="pt-24 pb-16 px-6 md:px-12 max-w-5xl mx-auto">
        <Link
          to="/threads"
          className="inline-flex items-center gap-2 text-paper/60 hover:text-paper text-sm mb-10"
        >
          <ArrowLeft size={14} /> All threads
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="font-mono text-[0.65rem] tracking-[0.32em] uppercase text-gold mb-3">
            {thread.role.toLowerCase()} · gen {thread.generation_offset}
          </p>
          <h1
            className="font-body font-light leading-[1.05] tracking-[-0.018em]"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            {thread.name}
          </h1>
          {thread.dedication ? (
            <p className="text-paper/70 mt-5 max-w-prose leading-relaxed text-lg">{thread.dedication}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-xs text-paper/55">
            <span className="inline-flex items-center gap-2">
              <BookOpen size={13} /> {entryRows.length} {entryRows.length === 1 ? 'entry' : 'entries'}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users size={13} /> {memberRows.length} {memberRows.length === 1 ? 'member' : 'members'}
            </span>
            <span className="inline-flex items-center gap-2">
              <Lock size={13} /> default visibility · {thread.default_visibility.toLowerCase()}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={`/threads/${threadId}/compose`}
              className="btn btn-primary"
            >
              <Plus size={16} /> Add entry <ArrowRight size={14} />
            </Link>
            {canInvite ? (
              <button
                type="button"
                onClick={() => setInviteOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-paper-15 hover:border-gold-40 text-paper/80 hover:text-paper transition-colors text-sm"
              >
                <UserPlus size={14} /> {inviteOpen ? 'Close' : 'Invite member'}
              </button>
            ) : null}
          </div>
        </motion.header>

        <section className="mb-14">
          <h2 className="font-mono text-[0.65rem] tracking-[0.28em] uppercase text-gold mb-5">Members</h2>

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
              className="border border-gold-40 rounded-xl p-5 mb-5 bg-void-surface/40"
            >
              <p className="font-mono text-[0.65rem] tracking-[0.28em] uppercase text-gold mb-4">Invite a member</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="m-name" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                    Display name
                  </label>
                  <input
                    id="m-name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Aunt Faiza"
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-3 py-2 rounded-md placeholder:text-paper/30 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="m-email" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                    Email — optional
                  </label>
                  <input
                    id="m-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="faiza@example.com"
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-3 py-2 rounded-md placeholder:text-paper/30 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="m-rel" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                    Relation
                  </label>
                  <input
                    id="m-rel"
                    value={inviteRelation}
                    onChange={(e) => setInviteRelation(e.target.value)}
                    placeholder="aunt, son, grandchild"
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-3 py-2 rounded-md placeholder:text-paper/30 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="m-role" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                    Role
                  </label>
                  <select
                    id="m-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-3 py-2 rounded-md transition-colors text-sm"
                  >
                    <option value="READER">Reader — can read, can't write</option>
                    <option value="AUTHOR">Author — can read and add entries</option>
                    <option value="SUCCESSOR">Successor — inherits if you step away</option>
                    <option value="PLACEHOLDER">Placeholder — descendant who doesn't exist yet</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="m-gen" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                    Generation offset
                  </label>
                  <input
                    id="m-gen"
                    type="number"
                    min={-3}
                    max={5}
                    value={inviteGen}
                    onChange={(e) => setInviteGen(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-3 py-2 rounded-md transition-colors text-sm"
                  />
                  <p className="text-[0.65rem] text-paper/40 mt-1.5">0 = same as you · +1 = your kids · -1 = your parents</p>
                </div>
              </div>
              {inviteError ? <p role="alert" className="text-blood text-sm mt-4">{inviteError}</p> : null}
              <div className="flex items-center gap-3 mt-5">
                <button type="submit" disabled={invite.isPending || !inviteName.trim()} className="btn btn-primary">
                  {invite.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  {invite.isPending ? 'Adding…' : 'Add member'}
                </button>
                <button type="button" onClick={() => setInviteOpen(false)} className="text-paper/60 hover:text-paper text-sm">
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {memberRows.length === 0 ? (
            <p className="text-paper/50 text-sm">Just you so far.</p>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-3">
              {memberRows.map((m) => (
                <li key={m.id} className="border border-paper-15 rounded-lg px-4 py-3 bg-void-surface/40">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-body text-base truncate">{m.display_name}</p>
                    <span className="font-mono text-[0.6rem] tracking-[0.22em] uppercase text-paper/45 shrink-0">
                      {m.role.toLowerCase()}
                    </span>
                  </div>
                  {m.relation_label || m.email ? (
                    <p className="text-xs text-paper/50 mt-1 truncate">
                      {m.relation_label}{m.relation_label && m.email ? ' · ' : ''}{m.email}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-mono text-[0.65rem] tracking-[0.28em] uppercase text-gold mb-5">Entries</h2>
          {entryRows.length === 0 ? (
            <p className="text-paper/50 text-sm">
              No entries yet. Anything you write, record, or send goes into the thread automatically.
            </p>
          ) : (
            <ul className="space-y-3">
              {entryRows.map((e) => {
                const created = new Date(e.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
                return (
                  <li key={e.id} className="border border-paper-15 rounded-lg px-5 py-4 bg-void-surface/40">
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <p className="font-body text-base">
                        {e.title ?? <span className="text-paper/50 italic">Untitled entry</span>}
                      </p>
                      <span className="font-mono text-[0.6rem] tracking-[0.22em] uppercase text-paper/45 shrink-0">
                        {created}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-paper/50">
                      <span>{e.visibility.toLowerCase()}</span>
                      {e.memory_id ? <span>· memory</span> : null}
                      {e.voice_recording_id ? <span>· voice</span> : null}
                      {e.pending_lock ? (
                        <span className="text-gold/80 inline-flex items-center gap-1">
                          <Lock size={11} /> {e.pending_lock.toLowerCase()} lock
                        </span>
                      ) : null}
                      {e.era_year ? <span>· {e.era_year}</span> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
