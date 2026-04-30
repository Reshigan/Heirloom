import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Lock, Users, Loader2 } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { threadsApi } from '../services/api';

export function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const threadId = id ?? '';

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
        </motion.header>

        <section className="mb-14">
          <h2 className="font-mono text-[0.65rem] tracking-[0.28em] uppercase text-gold mb-5">Members</h2>
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
