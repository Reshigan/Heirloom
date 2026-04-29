import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Loader2, ArrowRight, Users, Clock } from 'lucide-react';
import { threadsApi, type Thread } from '../services/api';

export function Threads() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [dedication, setDedication] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    threadsApi
      .list()
      .then((res) => setThreads(res.data.threads))
      .catch(() => setThreads([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await threadsApi.create({
        name: name.trim(),
        dedication: dedication.trim() || undefined,
      });
      navigate(`/threads/${res.data.thread.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not create thread');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-void text-paper px-6 md:px-12 py-12 md:py-20">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 md:mb-16">
          <p className="text-gold tracking-[0.3em] text-xs mb-3">YOUR THREADS</p>
          <h1 className="font-serif text-4xl md:text-5xl text-paper leading-tight">
            The threads your family writes into.
          </h1>
          <p className="text-paper/60 mt-4 max-w-xl leading-relaxed">
            A Thread belongs to your family, not to you. Members come and go across generations. Entries can be added, never deleted.
          </p>
        </header>

        {threads === null ? (
          <div className="py-16 flex items-center justify-center text-paper/40">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : threads.length === 0 && !creating ? (
          <EmptyState onStart={() => setCreating(true)} />
        ) : (
          <ul className="grid md:grid-cols-2 gap-5 mb-10">
            {threads.map((t, i) => (
              <ThreadCard key={t.id} thread={t} index={i} />
            ))}
          </ul>
        )}

        {creating ? (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onSubmit={submit}
            className="rounded-xl border border-gold/20 bg-paper/[0.02] p-7 space-y-5"
            aria-label="Open a new thread"
          >
            <h2 className="font-serif text-2xl">Open a new thread</h2>
            <div>
              <label htmlFor="thread-name" className="block text-xs uppercase tracking-[0.2em] text-paper/40 mb-2">
                Name
              </label>
              <input
                id="thread-name"
                type="text"
                required
                autoFocus
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="The Mahmood Family Thread"
                className="w-full bg-void/40 border border-paper/10 rounded-lg px-4 py-3 text-paper placeholder:text-paper/30 focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/20 transition"
              />
            </div>
            <div>
              <label htmlFor="thread-dedication" className="block text-xs uppercase tracking-[0.2em] text-paper/40 mb-2">
                Dedication — optional
              </label>
              <input
                id="thread-dedication"
                type="text"
                maxLength={300}
                value={dedication}
                onChange={(e) => setDedication(e.target.value)}
                placeholder="For those who came before, and those who come after."
                className="w-full bg-void/40 border border-paper/10 rounded-lg px-4 py-3 text-paper placeholder:text-paper/30 focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/20 transition"
              />
            </div>
            {error ? <p role="alert" className="text-sm text-blood">{error}</p> : null}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-5 py-3 text-paper/60 hover:text-paper transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-paper/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-void font-medium rounded-lg hover:bg-gold-bright transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-2 focus:ring-offset-void"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {submitting ? 'Opening…' : 'Open thread'}
              </button>
            </div>
          </motion.form>
        ) : threads && threads.length > 0 ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-5 py-3 border border-paper/15 hover:border-gold/40 rounded-lg text-paper/80 hover:text-paper transition-colors focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            <Plus size={16} /> Open another thread
          </button>
        ) : null}
      </div>
    </main>
  );
}

function ThreadCard({ thread, index }: { thread: Thread; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.4), ease: 'easeOut' }}
    >
      <Link
        to={`/threads/${thread.id}`}
        className="block rounded-xl border border-paper/10 hover:border-gold/30 bg-paper/[0.02] hover:bg-paper/[0.04] p-6 transition-colors group focus:outline-none focus:ring-2 focus:ring-gold/40"
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-serif text-xl text-paper leading-tight">{thread.name}</h2>
          <ArrowRight size={18} className="text-paper/30 group-hover:text-gold group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
        </div>
        {thread.dedication ? (
          <p className="text-paper/50 italic text-sm mb-4 leading-relaxed">{thread.dedication}</p>
        ) : null}
        <dl className="flex items-center gap-5 text-xs text-paper/40 font-mono">
          <div className="flex items-center gap-1.5">
            <Clock size={12} aria-hidden="true" />
            <dt className="sr-only">Entries</dt>
            <dd>{thread.entry_count ?? 0} entries</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={12} aria-hidden="true" />
            <dt className="sr-only">Members</dt>
            <dd>{thread.member_count ?? 0} members</dd>
          </div>
          {thread.role && thread.role !== 'READER' ? (
            <span className="text-gold/70 uppercase tracking-wider text-[10px]">{thread.role.toLowerCase()}</span>
          ) : null}
        </dl>
      </Link>
    </motion.li>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="rounded-xl border border-paper/10 bg-paper/[0.02] p-10 md:p-14 text-center"
    >
      <h2 className="font-serif text-2xl md:text-3xl text-paper mb-4">
        Your thread is waiting.
      </h2>
      <p className="text-paper/60 max-w-lg mx-auto leading-relaxed mb-8">
        Open one. Add the first entry — it can be one sentence. The thread is yours forever, your great-granddaughter's after that.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="inline-flex items-center gap-2 px-6 py-3.5 bg-gold text-void font-medium rounded-lg hover:bg-gold-bright transition-colors focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-2 focus:ring-offset-void"
      >
        <Plus size={16} /> Open your first thread
      </button>
    </motion.div>
  );
}
