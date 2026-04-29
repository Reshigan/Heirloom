import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import { threadsApi, type Thread, type ThreadEntry, type ThreadMember } from '../services/api';
import { EntryCard } from '../components/thread/EntryCard';
import { EntryComposer } from '../components/thread/EntryComposer';

export function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [membership, setMembership] = useState<ThreadMember | null>(null);
  const [members, setMembers] = useState<ThreadMember[]>([]);
  const [entries, setEntries] = useState<ThreadEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const [t, m, e] = await Promise.all([
        threadsApi.get(id),
        threadsApi.members(id),
        threadsApi.entries(id, { limit: 100 }),
      ]);
      setThread(t.data.thread);
      setMembership(t.data.membership);
      setMembers(m.data.members);
      setEntries(e.data.entries);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not load thread');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-paper/40" />
      </main>
    );
  }

  if (error || !thread) {
    return (
      <main className="min-h-screen bg-void text-paper px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-serif text-2xl mb-4">{error ?? 'Thread not found.'}</h1>
          <Link to="/threads" className="text-gold hover:text-gold-bright">← Back to your threads</Link>
        </div>
      </main>
    );
  }

  const canWrite = membership?.role === 'FOUNDER' || membership?.role === 'SUCCESSOR' || membership?.role === 'AUTHOR';
  const memberByMemberId = new Map(members.map((m) => [m.id, m]));

  return (
    <main className="min-h-screen bg-void text-paper px-6 md:px-12 py-10 md:py-16">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/threads"
          className="inline-flex items-center gap-2 text-paper/50 hover:text-paper transition-colors mb-8 focus:outline-none focus:ring-2 focus:ring-gold/40 rounded"
        >
          <ArrowLeft size={16} /> All threads
        </Link>

        <header className="mb-12">
          <p className="text-gold tracking-[0.3em] text-xs mb-3">THE THREAD</p>
          <h1 className="font-serif text-3xl md:text-5xl text-paper leading-tight">{thread.name}</h1>
          {thread.dedication ? (
            <p className="text-paper/60 italic mt-4 max-w-xl leading-relaxed">{thread.dedication}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-5 mt-6 text-xs font-mono text-paper/40">
            <span>{entries.length} entries</span>
            <span>{members.length} members</span>
            <span>Default visibility — {thread.default_visibility.toLowerCase()}</span>
            {membership?.role ? (
              <span className="text-gold/70 uppercase tracking-wider">{membership.role.toLowerCase()}</span>
            ) : null}
          </div>
        </header>

        {canWrite ? (
          <section className="mb-12" aria-label="Add an entry">
            <EntryComposer threadId={thread.id} members={members} onCreated={refresh} />
          </section>
        ) : (
          <section className="mb-12 rounded-xl border border-paper/10 bg-paper/[0.02] p-5 text-paper/50 text-sm flex items-center gap-3">
            <Users size={16} />
            You're a reader on this thread. Authorship can be granted by a Founder or Successor.
          </section>
        )}

        <section aria-label="Thread entries" className="relative">
          {entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="rounded-xl border border-paper/10 bg-paper/[0.02] p-10 text-center"
            >
              <h2 className="font-serif text-xl text-paper mb-3">Empty thread.</h2>
              <p className="text-paper/50 max-w-md mx-auto leading-relaxed">
                The first entry is always the hardest. Write one sentence. Lock it for whoever you want.
              </p>
            </motion.div>
          ) : (
            <ol className="relative">
              {entries.map((entry, i) => {
                const author = memberByMemberId.get(entry.author_member_id);
                return (
                  <li key={entry.id}>
                    <EntryCard entry={entry} index={i} authorName={author?.display_name} />
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
