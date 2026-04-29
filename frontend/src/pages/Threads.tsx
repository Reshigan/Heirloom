import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Plus, ArrowRight } from 'lucide-react';
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
    <main className="min-h-screen bg-void text-paper">
      <header className="px-6 md:px-12 pt-12 md:pt-20 pb-12">
        <div className="max-w-5xl mx-auto">
          <p className="eyebrow mb-5">Your threads</p>
          <h1
            className="font-serif font-light text-display-xl tracking-tight leading-[1.06]"
            style={{ fontVariationSettings: '"opsz" 56' }}
          >
            The threads your<br />family writes into.
          </h1>
          <p className="mt-7 max-w-prose text-paper/65 text-body-lg leading-relaxed">
            A thread belongs to your family, not to you. Members come and go across generations. Entries can be added — never deleted.
          </p>
        </div>
      </header>

      <hr className="border-rule mx-6 md:mx-12" />

      <section className="px-6 md:px-12 py-16">
        <div className="max-w-5xl mx-auto">
          {threads === null ? (
            <div className="py-16 flex items-center justify-center text-paper/40">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : threads.length === 0 && !creating ? (
            <EmptyState onStart={() => setCreating(true)} />
          ) : (
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-6 mb-12">
              {threads.map((t, i) => (
                <ThreadCard key={t.id} thread={t} index={i} />
              ))}
            </ul>
          )}

          {creating ? (
            <motion.form
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={submit}
              className="border border-gold/30 rounded-xl p-8 md:p-10"
              aria-label="Open a new thread"
            >
              <p className="eyebrow mb-3">Open a new thread</p>
              <h2 className="font-serif text-3xl mb-8">Name it for the family.</h2>

              <div className="space-y-6 max-w-prose">
                <div>
                  <label htmlFor="thread-name" className="block text-xs uppercase tracking-[0.22em] text-paper/45 mb-2">
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
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="thread-dedication" className="block text-xs uppercase tracking-[0.22em] text-paper/45 mb-2">
                    Dedication — optional
                  </label>
                  <input
                    id="thread-dedication"
                    type="text"
                    maxLength={300}
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                    placeholder="For those who came before, and those who come after."
                    className="input"
                  />
                </div>
                {error ? <p role="alert" className="text-blood-light text-sm">{error}</p> : null}
              </div>

              <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="btn btn-primary"
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
              className="btn btn-secondary"
            >
              <Plus size={16} /> Open another thread
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function ThreadCard({ thread, index }: { thread: Thread; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/threads/${thread.id}`}
        className="block group p-8 border border-rule rounded-xl hover:border-rule-strong bg-paper/[0.015] hover:bg-paper/[0.04] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        <div className="flex items-start justify-between mb-5">
          <h2 className="font-serif font-normal text-2xl text-paper leading-tight">{thread.name}</h2>
          <ArrowRight size={18} className="text-paper/30 group-hover:text-gold group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
        </div>
        {thread.dedication ? (
          <p className="font-serif italic text-paper/55 text-[15px] mb-6 leading-relaxed">
            {thread.dedication}
          </p>
        ) : null}
        <dl className="flex items-center gap-5 timestamp">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Entries</dt>
            <dd>{thread.entry_count ?? 0} entries</dd>
          </div>
          <span className="text-paper/20">·</span>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Members</dt>
            <dd>{thread.member_count ?? 0} members</dd>
          </div>
          {thread.role && thread.role !== 'READER' ? (
            <>
              <span className="text-paper/20">·</span>
              <span className="text-gold/80 uppercase tracking-[0.18em] text-[10px]">{thread.role.toLowerCase()}</span>
            </>
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
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="text-center py-20"
    >
      <span className="seal mx-auto mb-10 block" aria-hidden>∞</span>
      <h2 className="font-serif font-light text-display-md text-paper/90 mb-5">
        Your thread is waiting.
      </h2>
      <p className="text-paper/55 max-w-prose mx-auto leading-relaxed mb-10 text-body-lg">
        Open one. Add the first entry — it can be one sentence. The thread is yours forever, your great-granddaughter's after that.
      </p>
      <button type="button" onClick={onStart} className="btn btn-primary text-base px-7 py-4">
        <Plus size={16} /> Open your first thread
      </button>
    </motion.div>
  );
}
