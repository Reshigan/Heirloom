import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Lock } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { threadsApi, type ThreadVisibility } from '../services/api';

/**
 * /threads/:id/compose — write an entry directly to a specific thread.
 *
 * Supports an optional DATE-based time lock. AGE / EVENT / GENERATION locks
 * require a target_member_id picker that's not yet built — use the legacy
 * Capsules surface for those, or wait for the next iteration here.
 *
 * The body is sent as plaintext in body_ciphertext for now (the thread
 * encryption envelope arrives in a later phase). The worker accepts this.
 */
export function ThreadCompose() {
  const { id } = useParams<{ id: string }>();
  const threadId = id ?? '';
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<ThreadVisibility>('FAMILY');
  const [enableLock, setEnableLock] = useState(false);
  const [lockDate, setLockDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: detail } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => threadsApi.get(threadId).then((r) => r.data),
    enabled: !!threadId,
  });

  const create = useMutation({
    mutationFn: () => {
      const payload: Parameters<typeof threadsApi.createEntry>[1] = {
        title: title.trim() || undefined,
        body_ciphertext: body.trim(),
        visibility,
      };
      if (enableLock && lockDate) {
        payload.unlock = {
          lock_type: 'DATE',
          unlock_date: lockDate,
          encrypted_key: '',
        };
      }
      return threadsApi.createEntry(threadId, payload).then((r) => r.data);
    },
    onSuccess: () => {
      navigate(`/threads/${threadId}`);
    },
    onError: (err: { response?: { data?: { error?: string } }; message?: string }) => {
      setError(err?.response?.data?.error ?? err?.message ?? 'Could not save entry.');
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const thread = detail?.thread;

  return (
    <div className="min-h-screen bg-void text-paper antialiased">
      <Navigation />

      <main id="main-content" className="pt-24 pb-16 px-6 md:px-12 max-w-2xl mx-auto">
        <Link
          to={`/threads/${threadId}`}
          className="inline-flex items-center gap-2 text-paper/60 hover:text-paper text-sm mb-10"
        >
          <ArrowLeft size={14} /> Back to thread
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-mono text-[0.65rem] tracking-[0.32em] uppercase text-gold mb-3">
            New entry{thread ? ` · ${thread.name}` : ''}
          </p>
          <h1
            className="font-body font-light leading-[1.1] tracking-[-0.018em] mb-10"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
          >
            What do you want the thread to remember?
          </h1>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              if (!body.trim()) {
                setError('Write something — even a sentence.');
                return;
              }
              if (enableLock && !lockDate) {
                setError('Pick the date the entry should open, or turn the lock off.');
                return;
              }
              create.mutate();
            }}
            className="space-y-6"
          >
            <div>
              <label htmlFor="t-title" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                Title — optional
              </label>
              <input
                id="t-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The summer Nan taught me to bake"
                maxLength={200}
                className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-md placeholder:text-paper/30 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="t-body" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                Body
              </label>
              <textarea
                id="t-body"
                rows={12}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write to your descendants. Tell them something. They will read this."
                className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-md placeholder:text-paper/30 transition-colors font-body text-base leading-[1.7] resize-y"
                required
              />
            </div>

            <div>
              <label htmlFor="t-vis" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                Who can read this
              </label>
              <select
                id="t-vis"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as ThreadVisibility)}
                className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-md transition-colors"
              >
                <option value="FAMILY">Family — anyone in the thread, now and later</option>
                <option value="DESCENDANTS">Descendants only — generations after yours</option>
                <option value="PRIVATE">Private — for a specific recipient (future feature)</option>
              </select>
            </div>

            <div className="border border-paper-15 rounded-md p-4 bg-void-surface/40">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableLock}
                  onChange={(e) => setEnableLock(e.target.checked)}
                  className="mt-1 accent-gold"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-gold" />
                    <span className="font-body text-base">Time-lock this entry</span>
                  </div>
                  <p className="text-paper/55 text-sm leading-relaxed mt-1">
                    The entry stays sealed until the date you choose. Write today; have it open on a wedding day, a 21st, a centenary.
                  </p>
                </div>
              </label>
              {enableLock ? (
                <div className="mt-4 pl-7">
                  <label htmlFor="t-lock" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                    Open on
                  </label>
                  <input
                    id="t-lock"
                    type="date"
                    min={today}
                    value={lockDate}
                    onChange={(e) => setLockDate(e.target.value)}
                    className="bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-2 rounded-md transition-colors"
                  />
                </div>
              ) : null}
            </div>

            {error ? (
              <p role="alert" className="text-blood text-sm">
                {error}
              </p>
            ) : null}

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={create.isPending || !body.trim()} className="btn btn-primary">
                {create.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                {create.isPending ? 'Saving…' : 'Save to the thread'}
                {!create.isPending ? <ArrowRight size={16} /> : null}
              </button>
              <Link to={`/threads/${threadId}`} className="text-paper/60 hover:text-paper text-sm">
                Cancel
              </Link>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
