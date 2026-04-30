import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, ArrowRight, Loader2, Users, BookOpen } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { threadsApi, type ThreadSummary } from '../services/api';

export function Threads() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [dedication, setDedication] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['threads'],
    queryFn: () => threadsApi.list().then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: () =>
      threadsApi
        .create({
          name: name.trim(),
          dedication: dedication.trim() || undefined,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      setCreating(false);
      setName('');
      setDedication('');
      setError(null);
    },
    onError: (err: { response?: { data?: { error?: string } }; message?: string }) => {
      setError(err?.response?.data?.error ?? err?.message ?? 'Could not create thread.');
    },
  });

  const threads: ThreadSummary[] = data?.threads ?? [];

  return (
    <div className="min-h-screen bg-void text-paper antialiased">
      <Navigation />

      <main id="main-content" className="pt-24 pb-16 px-6 md:px-12 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-4">Family threads</p>
          <h1 className="font-body font-light leading-[1.1] tracking-[-0.018em]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            The threads you belong to.
          </h1>
          <p className="text-paper/65 mt-4 max-w-prose leading-relaxed">
            Each thread is append-only. Entries you add today can be locked for descendants who don't exist yet.
            Members across generations can read, comment, and add their own entries — but never alter what came before.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-paper/50">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
              {threads.map((t) => (
                <Link
                  key={t.id}
                  to={`/threads/${t.id}`}
                  className="group block bg-void-surface border border-paper-15 rounded-xl p-6 hover:border-gold-40 transition-colors"
                >
                  <p className="font-mono text-[0.65rem] tracking-[0.28em] uppercase text-gold/80 mb-3">
                    {t.role.toLowerCase()} · gen {t.generation_offset}
                  </p>
                  <h2 className="font-body text-2xl mb-2 leading-tight">{t.name}</h2>
                  {t.dedication ? (
                    <p className="text-paper/55 text-sm leading-relaxed mb-5 line-clamp-3">{t.dedication}</p>
                  ) : (
                    <div className="h-5" />
                  )}
                  <div className="flex items-center gap-5 text-xs text-paper/50 mt-auto">
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen size={13} /> {t.entry_count} {t.entry_count === 1 ? 'entry' : 'entries'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={13} /> {t.member_count} {t.member_count === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-gold text-sm mt-5 opacity-0 group-hover:opacity-100 transition-opacity">
                    open <ArrowRight size={14} />
                  </span>
                </Link>
              ))}

              {!creating ? (
                <button
                  onClick={() => setCreating(true)}
                  className="border border-dashed border-paper-15 hover:border-gold-40 rounded-xl p-6 text-left transition-colors"
                >
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-paper-30 mb-4 text-paper/70">
                    <Plus size={18} />
                  </span>
                  <p className="font-body text-xl mb-1">Start a new thread</p>
                  <p className="text-paper/50 text-sm">For a different bloodline, an in-laws line, or a chosen family.</p>
                </button>
              ) : (
                <div className="border border-gold-40 rounded-xl p-6 sm:col-span-2 lg:col-span-3">
                  <p className="font-mono text-[0.65rem] tracking-[0.28em] uppercase text-gold mb-4">New thread</p>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="t-name" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                        Thread name
                      </label>
                      <input
                        id="t-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="The Mahmood family"
                        className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-md placeholder:text-paper/30 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="t-ded" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                        Dedication — optional
                      </label>
                      <textarea
                        id="t-ded"
                        rows={3}
                        value={dedication}
                        onChange={(e) => setDedication(e.target.value)}
                        placeholder="A line your descendants will see when they open the thread for the first time."
                        className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-md placeholder:text-paper/30 transition-colors font-body text-base leading-[1.7]"
                      />
                    </div>
                    {error ? <p role="alert" className="text-blood text-sm">{error}</p> : null}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => create.mutate()}
                        disabled={create.isPending || !name.trim()}
                        className="btn btn-primary"
                      >
                        {create.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                        {create.isPending ? 'Creating…' : 'Begin thread'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCreating(false);
                          setError(null);
                        }}
                        className="text-paper/60 hover:text-paper text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {threads.length === 0 && !creating ? (
              <p className="text-paper/50 text-sm">
                You don't have any threads yet. Your default thread is created on first entry — or you can name one yourself above.
              </p>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
