import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Lock } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { threadsApi, type ThreadVisibility, type ThreadLockType } from '../services/api';

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
  const [lockType, setLockType] = useState<ThreadLockType>('DATE');
  const [lockDate, setLockDate] = useState('');
  const [lockTargetMemberId, setLockTargetMemberId] = useState('');
  const [lockAgeYears, setLockAgeYears] = useState<number | ''>('');
  const [lockEventLabel, setLockEventLabel] = useState('');
  const [lockGeneration, setLockGeneration] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  const { data: detail } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => threadsApi.get(threadId).then((r) => r.data),
    enabled: !!threadId,
  });

  const { data: membersData } = useQuery({
    queryKey: ['thread', threadId, 'members'],
    queryFn: () => threadsApi.listMembers(threadId).then((r) => r.data),
    enabled: !!threadId,
  });
  const members = membersData?.members ?? [];

  const create = useMutation({
    mutationFn: () => {
      const payload: Parameters<typeof threadsApi.createEntry>[1] = {
        title: title.trim() || undefined,
        body_ciphertext: body.trim(),
        visibility,
      };
      if (enableLock) {
        const unlock: NonNullable<typeof payload.unlock> = {
          lock_type: lockType,
          encrypted_key: '',
        };
        if (lockType === 'DATE') unlock.unlock_date = lockDate;
        if (lockType === 'AGE') {
          unlock.target_member_id = lockTargetMemberId;
          unlock.age_years = typeof lockAgeYears === 'number' ? lockAgeYears : parseInt(String(lockAgeYears), 10);
        }
        if (lockType === 'RECIPIENT_EVENT') {
          unlock.target_member_id = lockTargetMemberId;
          unlock.event_label = lockEventLabel.trim();
        }
        if (lockType === 'GENERATION') {
          unlock.target_generation = typeof lockGeneration === 'number' ? lockGeneration : parseInt(String(lockGeneration), 10);
        }
        payload.unlock = unlock;
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
              if (enableLock) {
                if (lockType === 'DATE' && !lockDate) {
                  setError('Pick the date the entry should open, or turn the lock off.');
                  return;
                }
                if (lockType === 'AGE' && (!lockTargetMemberId || !lockAgeYears)) {
                  setError('Pick a member and an age for the age-gate lock.');
                  return;
                }
                if (lockType === 'RECIPIENT_EVENT' && (!lockTargetMemberId || !lockEventLabel.trim())) {
                  setError('Pick a member and describe the event the lock waits for.');
                  return;
                }
                if (lockType === 'GENERATION' && !lockGeneration) {
                  setError('Pick the generation the entry should wait for.');
                  return;
                }
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
                <div className="mt-4 pl-7 space-y-4">
                  <div>
                    <label htmlFor="t-lock-type" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                      Lock type
                    </label>
                    <select
                      id="t-lock-type"
                      value={lockType}
                      onChange={(e) => setLockType(e.target.value as ThreadLockType)}
                      className="bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-2 rounded-md transition-colors"
                    >
                      <option value="DATE">A specific date</option>
                      <option value="AGE">When someone reaches an age</option>
                      <option value="RECIPIENT_EVENT">When an event happens (wedding, first child…)</option>
                      <option value="GENERATION">When a generation exists in the thread</option>
                    </select>
                  </div>

                  {lockType === 'DATE' ? (
                    <div>
                      <label htmlFor="t-lock-date" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                        Open on
                      </label>
                      <input
                        id="t-lock-date"
                        type="date"
                        min={today}
                        value={lockDate}
                        onChange={(e) => setLockDate(e.target.value)}
                        className="bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-2 rounded-md transition-colors"
                      />
                    </div>
                  ) : null}

                  {lockType === 'AGE' ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="t-lock-member" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                          Recipient
                        </label>
                        <select
                          id="t-lock-member"
                          value={lockTargetMemberId}
                          onChange={(e) => setLockTargetMemberId(e.target.value)}
                          className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-2 rounded-md transition-colors"
                        >
                          <option value="">— Pick a thread member —</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.display_name} {m.relation_label ? `(${m.relation_label})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="t-lock-age" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                          Open at age
                        </label>
                        <input
                          id="t-lock-age"
                          type="number"
                          min={1}
                          max={120}
                          value={lockAgeYears}
                          onChange={(e) => setLockAgeYears(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-2 rounded-md transition-colors"
                        />
                      </div>
                    </div>
                  ) : null}

                  {lockType === 'RECIPIENT_EVENT' ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="t-lock-event-member" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                          Recipient
                        </label>
                        <select
                          id="t-lock-event-member"
                          value={lockTargetMemberId}
                          onChange={(e) => setLockTargetMemberId(e.target.value)}
                          className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-2 rounded-md transition-colors"
                        >
                          <option value="">— Pick a thread member —</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.display_name} {m.relation_label ? `(${m.relation_label})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="t-lock-event" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                          Event
                        </label>
                        <input
                          id="t-lock-event"
                          type="text"
                          value={lockEventLabel}
                          onChange={(e) => setLockEventLabel(e.target.value)}
                          placeholder="wedding, first_child, graduation"
                          className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-2 rounded-md placeholder:text-paper/30 transition-colors"
                        />
                      </div>
                    </div>
                  ) : null}

                  {lockType === 'GENERATION' ? (
                    <div>
                      <label htmlFor="t-lock-gen" className="block text-xs uppercase tracking-[0.22em] text-paper/50 mb-2">
                        Open once a member of generation N exists in the thread
                      </label>
                      <input
                        id="t-lock-gen"
                        type="number"
                        min={1}
                        max={6}
                        value={lockGeneration}
                        onChange={(e) => setLockGeneration(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-2 rounded-md transition-colors"
                      />
                      <p className="text-[0.65rem] text-paper/40 mt-1.5">+1 = your kids · +2 = grandkids · +3 = great-grandkids</p>
                    </div>
                  ) : null}
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
