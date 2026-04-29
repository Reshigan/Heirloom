import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { threadsApi, type Thread, type ThreadEntry, type ThreadMember } from '../services/api';
import { EntryCard } from '../components/thread/EntryCard';
import { EntryComposer } from '../components/thread/EntryComposer';
import { MembersPanel } from '../components/thread/MembersPanel';

export function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const isFirstThread = params.get('first') === '1';
  const composerRef = useRef<HTMLDivElement | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [membership, setMembership] = useState<ThreadMember | null>(null);
  const [members, setMembers] = useState<ThreadMember[]>([]);
  const [entries, setEntries] = useState<ThreadEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justAddedFirst, setJustAddedFirst] = useState(false);
  const [showFirstWelcome, setShowFirstWelcome] = useState(isFirstThread);

  const refresh = useCallback(
    async (markFirst = false) => {
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
        if (markFirst && e.data.entries.length === 1) {
          setJustAddedFirst(true);
          setTimeout(() => setJustAddedFirst(false), 6000);
        }
      } catch (err: any) {
        setError(err?.response?.data?.error ?? 'Could not load thread');
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  // First-thread welcome: scroll the composer into view, then strip the
  // `?first=1` query param so a refresh doesn't replay the welcome. The
  // banner itself is dismissed automatically when the user submits an
  // entry (justAddedFirst handles that path).
  useEffect(() => {
    if (!isFirstThread || loading) return;
    const t = setTimeout(() => {
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    const t2 = setTimeout(() => {
      setParams({}, { replace: true });
    }, 1000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [isFirstThread, loading, setParams]);

  if (loading) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-paper/40" />
      </main>
    );
  }

  if (error || !thread) {
    return (
      <main className="min-h-screen bg-void text-paper px-6 py-24">
        <div className="max-w-prose mx-auto text-center">
          <h1 className="font-serif text-3xl mb-6">{error ?? 'Thread not found.'}</h1>
          <Link to="/threads" className="text-gold hover:text-gold-bright">← Back to your threads</Link>
        </div>
      </main>
    );
  }

  const canWrite =
    membership?.role === 'FOUNDER' || membership?.role === 'SUCCESSOR' || membership?.role === 'AUTHOR';
  const memberByMemberId = new Map(members.map((m) => [m.id, m]));
  const isEmpty = entries.length === 0;

  return (
    <main className="min-h-screen bg-void text-paper">
      {/* Top bar */}
      <header className="px-6 md:px-12 pt-8 md:pt-10 pb-6 border-b border-rule">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/threads"
            className="inline-flex items-center gap-2 text-paper/55 hover:text-paper transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded"
          >
            <ArrowLeft size={14} /> All threads
          </Link>
          <span className="font-mono text-xs text-paper/40">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} · {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>
      </header>

      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-5">The thread</p>
          <h1
            className="font-serif font-light text-display-xl tracking-tight leading-[1.05]"
            style={{ fontVariationSettings: '"opsz" 64' }}
          >
            {thread.name}
          </h1>
          {thread.dedication ? (
            <p className="font-serif italic text-paper/65 text-body-xl mt-7 max-w-prose leading-relaxed">
              {thread.dedication}
            </p>
          ) : null}
          {membership?.role && membership.role !== 'READER' ? (
            <p className="mt-7 inline-block text-[0.65rem] tracking-[0.28em] uppercase text-gold/85">
              You are {membership.role.toLowerCase()}
            </p>
          ) : null}
        </div>
      </section>

      <hr className="border-rule mx-6 md:mx-12" />

      <section className="px-6 md:px-12 py-10 md:py-12" aria-label="Members">
        <div className="max-w-3xl mx-auto">
          <MembersPanel
            threadId={thread.id}
            members={members}
            callerRole={membership?.role ?? null}
            onChanged={refresh}
          />
        </div>
      </section>

      {canWrite ? (
        <section className="px-6 md:px-12 pt-2 pb-12 md:pb-14" aria-label="Add an entry">
          <div ref={composerRef} className="max-w-3xl mx-auto">
            <AnimatePresence>
              {showFirstWelcome ? (
                <motion.div
                  key="first-welcome"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-8 overflow-hidden text-center"
                  role="status"
                >
                  <p className="eyebrow text-gold mb-3">your first thread</p>
                  <p className="font-serif italic text-paper/85 text-xl md:text-2xl leading-snug max-w-prose mx-auto">
                    The first entry is the hardest one.<br />
                    A sentence is enough — the thread is patient.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowFirstWelcome(false)}
                    className="mt-5 text-paper/40 hover:text-paper/75 transition-colors text-xs tracking-wide focus:outline-none"
                  >
                    dismiss
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <EntryComposer
              threadId={thread.id}
              members={members}
              onCreated={() => {
                refresh(true);
                setShowFirstWelcome(false);
              }}
            />
          </div>
        </section>
      ) : (
        <section className="px-6 md:px-12 pt-2 pb-12 md:pb-14">
          <div className="max-w-3xl mx-auto text-center text-paper/55 text-sm">
            You're a reader on this thread. Authorship can be granted by a Founder or Successor.
          </div>
        </section>
      )}

      <hr className="border-rule mx-6 md:mx-12" />

      {/* Timeline */}
      <section aria-label="Thread entries" className="px-6 md:px-12 py-16 md:py-24 relative">
        <div className="max-w-3xl mx-auto relative">
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              className="text-center py-20"
            >
              <span className="seal mx-auto mb-8" aria-hidden>∞</span>
              <h2 className="font-serif font-light text-3xl text-paper/85 mb-4">
                The thread is waiting.
              </h2>
              <p className="text-paper/55 max-w-prose mx-auto leading-relaxed">
                The first entry is the hardest. Write one sentence. Lock it for whoever you want.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Ceremonial banner shown briefly when first entry is added */}
              {justAddedFirst ? (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-12 text-center"
                  role="status"
                >
                  <p className="eyebrow text-gold mb-2">First entry</p>
                  <p className="font-serif italic text-paper/85 text-xl">This is where the thread begins.</p>
                </motion.div>
              ) : null}

              {/* The literal thread — single hairline rail running the full
                  height of the timeline. Entry markers (dots / seals) are
                  placed by EntryCard at left:0 -translate-x-1/2 over this
                  rail. */}
              <div className="thread-rail" aria-hidden />

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
            </>
          )}
        </div>
      </section>
    </main>
  );
}
