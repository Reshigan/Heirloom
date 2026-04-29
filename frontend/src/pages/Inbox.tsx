import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { threadsApi, type LockType } from '../services/api';

interface UpcomingItem {
  unlock_id: string;
  lock_type: LockType;
  unlock_date: string | null;
  age_years: number | null;
  target_member_id: string | null;
  entry_id: string;
  entry_title: string | null;
  thread_id: string;
  thread_name: string;
  target_name: string | null;
  target_birth_date: string | null;
}

interface RecentItem {
  unlock_id: string;
  lock_type: LockType;
  resolved_at: string;
  resolution_note: string | null;
  entry_id: string;
  entry_title: string | null;
  thread_id: string;
  thread_name: string;
  entry_created_at: string;
}

const LOCK_LABEL: Record<LockType, string> = {
  DATE: 'Sealed until a date',
  AGE: 'Sealed until a milestone age',
  AUTHOR_DEATH: 'Sealed until verified passing',
  RECIPIENT_EVENT: 'Sealed for a life event',
  GENERATION: 'Sealed for a future generation',
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function Inbox() {
  const [upcoming, setUpcoming] = useState<UpcomingItem[] | null>(null);
  const [recent, setRecent] = useState<RecentItem[] | null>(null);

  useEffect(() => {
    threadsApi.inboxUpcoming(180).then((r) => setUpcoming(r.data.upcoming)).catch(() => setUpcoming([]));
    threadsApi.inboxRecent(60).then((r) => setRecent(r.data.recent)).catch(() => setRecent([]));
  }, []);

  return (
    <main className="min-h-screen bg-void text-paper">
      <header className="px-6 md:px-12 pt-12 md:pt-20 pb-12">
        <div className="max-w-4xl mx-auto">
          <p className="eyebrow mb-5">The time-locked inbox</p>
          <h1
            className="font-serif font-light text-display-xl tracking-tight leading-[1.06]"
            style={{ fontVariationSettings: '"opsz" 56' }}
          >
            What's on its way<br />— and what just opened.
          </h1>
          <p className="mt-7 max-w-prose text-paper/65 text-body-lg leading-relaxed">
            Some entries in your family's threads are written today and locked for years. This is where they appear when their time arrives.
          </p>
        </div>
      </header>

      <hr className="border-rule mx-6 md:mx-12" />

      <section className="px-6 md:px-12 py-16 md:py-20" aria-label="Upcoming unlocks">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif font-normal text-2xl mb-10">Upcoming</h2>
          {upcoming === null ? (
            <Loader />
          ) : upcoming.length === 0 ? (
            <Empty
              text="Nothing is waiting to open. When an author in one of your threads writes a time-locked entry, it'll appear here on its way."
            />
          ) : (
            <ul className="space-y-7">
              {upcoming.map((item, i) => {
                const days = daysUntil(item.unlock_date);
                return (
                  <UpcomingRow key={item.unlock_id} item={item} days={days} index={i} />
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <hr className="border-rule mx-6 md:mx-12" />

      <section className="px-6 md:px-12 py-16 md:py-20" aria-label="Recently unlocked">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif font-normal text-2xl mb-10">Recently opened</h2>
          {recent === null ? (
            <Loader />
          ) : recent.length === 0 ? (
            <Empty text="Nothing has unlocked recently." />
          ) : (
            <ul className="space-y-6">
              {recent.map((item, i) => (
                <RecentRow key={item.unlock_id} item={item} index={i} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

function UpcomingRow({ item, days, index }: { item: UpcomingItem; days: number | null; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.32), ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-[42px_1fr_auto] gap-5 md:gap-7 items-start py-5 border-t border-rule first:border-t-0"
    >
      <span className="seal mt-1" aria-hidden style={{ width: 28, height: 28, fontSize: 13 }}>∞</span>
      <div className="min-w-0">
        <p className="font-mono text-[0.7rem] tracking-[0.18em] uppercase text-paper/40 mb-1.5">
          {LOCK_LABEL[item.lock_type]}
          {item.target_name ? <> · for {item.target_name}</> : null}
        </p>
        <h3 className="font-serif text-xl md:text-2xl text-paper leading-tight">
          {item.entry_title ?? <em className="not-italic text-paper/55">Untitled entry</em>}
        </h3>
        <p className="text-paper/55 text-sm mt-1">
          In <Link to={`/threads/${item.thread_id}`} className="text-paper/75 hover:text-paper underline decoration-rule-strong underline-offset-4">{item.thread_name}</Link>
        </p>
      </div>
      <div className="text-right">
        {item.unlock_date ? (
          <>
            <p className="timestamp">{formatDate(item.unlock_date)}</p>
            {days != null && days >= 0 ? (
              <p className="text-paper/45 text-sm mt-1">
                {days === 0 ? 'today' : days === 1 ? 'tomorrow' : `${days} days`}
              </p>
            ) : null}
          </>
        ) : item.lock_type === 'AGE' && item.age_years && item.target_birth_date ? (
          <p className="text-paper/55 text-sm">at age {item.age_years}</p>
        ) : (
          <p className="text-paper/45 text-sm">when condition met</p>
        )}
      </div>
    </motion.li>
  );
}

function RecentRow({ item, index }: { item: RecentItem; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.32), ease: [0.16, 1, 0.3, 1] }}
      className="py-5 border-t border-rule first:border-t-0"
    >
      <Link
        to={`/threads/${item.thread_id}#entry-${item.entry_id}`}
        className="grid grid-cols-[1fr_auto] gap-5 items-baseline group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded"
      >
        <div className="min-w-0">
          <h3 className="font-serif text-xl text-paper leading-tight group-hover:text-paper-warm transition-colors">
            {item.entry_title ?? <em className="not-italic text-paper/55">Untitled entry</em>}
          </h3>
          <p className="text-paper/55 text-sm mt-1">
            In {item.thread_name}
            {item.resolution_note ? <> · {item.resolution_note}</> : null}
          </p>
        </div>
        <div className="text-right whitespace-nowrap">
          <p className="timestamp">opened {formatDate(item.resolved_at)}</p>
          <p className="text-gold/70 text-xs mt-1 group-hover:text-gold transition-colors inline-flex items-center gap-1">
            Read <ArrowRight size={12} />
          </p>
        </div>
      </Link>
    </motion.li>
  );
}

function Loader() {
  return (
    <div className="py-10 flex items-center justify-center text-paper/30">
      <Loader2 size={18} className="animate-spin" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="text-paper/55 italic max-w-prose leading-relaxed">{text}</p>
  );
}
