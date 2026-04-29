import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { ThreadEntry } from '../../services/api';
import { TimeLockBadge } from './TimeLockBadge';
import { decryptEntryBody, hasThreadKey } from '../../utils/threadCrypto';

interface Props {
  entry: ThreadEntry;
  index?: number;
  authorName?: string;
}

const VISIBILITY_LABEL: Record<ThreadEntry['visibility'], string> = {
  PRIVATE: 'private',
  FAMILY: 'family',
  DESCENDANTS: 'descendants',
  HISTORIAN: 'open',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function parseTags(json: string | null): { type: string; label: string }[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as { type: string; label: string }[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function EntryCard({ entry, index = 0, authorName }: Props) {
  const tags = useMemo(() => parseTags(entry.tags_json), [entry.tags_json]);
  const isLocked = !!entry.pending_lock;
  const reduceMotion = useReducedMotion();
  const [decryptedBody, setDecryptedBody] = useState<string | null>(null);
  const [decryptionPending, setDecryptionPending] = useState(false);
  const keyAvailable = hasThreadKey(entry.thread_id);

  useEffect(() => {
    let cancelled = false;
    if (isLocked || !entry.body_ciphertext || !keyAvailable) return;
    setDecryptionPending(true);
    decryptEntryBody(entry.thread_id, {
      body_ciphertext: entry.body_ciphertext,
      body_iv: entry.body_iv,
      body_auth_tag: entry.body_auth_tag,
    })
      .then((plain) => {
        if (!cancelled) setDecryptedBody(plain);
      })
      .finally(() => {
        if (!cancelled) setDecryptionPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLocked, entry.body_ciphertext, entry.body_iv, entry.body_auth_tag, entry.thread_id, keyAvailable]);

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.04, 0.32), ease: [0.16, 1, 0.3, 1] }}
      className="group relative pl-10 md:pl-14 pb-12 md:pb-16"
      aria-labelledby={`entry-${entry.id}-title`}
      id={`entry-${entry.id}`}
    >
      {/* Marker on the rail. Plain hairline disc for normal entries; wax
          seal for time-locked. Sits centered on the rail at top-of-entry. */}
      <div className="absolute left-0 top-1 -translate-x-1/2" aria-hidden>
        {isLocked ? (
          <span className="seal" style={{ width: 22, height: 22, fontSize: 12 }}>∞</span>
        ) : (
          <span className="block w-2.5 h-2.5 rounded-full border border-rule-strong bg-void" />
        )}
      </div>

      <header className="flex items-baseline gap-3 mb-4 flex-wrap">
        <time dateTime={entry.created_at} className="timestamp">
          {formatDate(entry.created_at)}
        </time>
        {entry.era_label || entry.era_year ? (
          <span className="text-paper/50 text-sm">{entry.era_label ?? entry.era_year}</span>
        ) : null}
        {authorName ? (
          <span className="text-paper/50 text-sm">— {authorName}</span>
        ) : null}
        <span className="ml-auto text-[0.65rem] tracking-[0.28em] uppercase text-paper/30">
          {VISIBILITY_LABEL[entry.visibility]}
        </span>
      </header>

      {entry.title ? (
        <h3
          id={`entry-${entry.id}-title`}
          className="font-serif text-2xl md:text-3xl text-paper leading-tight mb-5 max-w-prose"
          style={{ fontVariationSettings: '"opsz" 36' }}
        >
          {entry.title}
        </h3>
      ) : (
        <h3 id={`entry-${entry.id}-title`} className="sr-only">
          Entry from {formatDate(entry.created_at)}
        </h3>
      )}

      {isLocked ? (
        <>
          <div className="mb-4">
            <TimeLockBadge lockType={entry.pending_lock!} pulse />
          </div>
          <p className="text-paper/40 text-[15px] italic max-w-prose leading-relaxed">
            The contents will appear here when the unlock condition is met.
          </p>
        </>
      ) : entry.body_ciphertext ? (
        decryptedBody !== null ? (
          <p className="font-serif text-paper/85 text-body-lg leading-[1.75] whitespace-pre-wrap max-w-prose">
            {decryptedBody}
          </p>
        ) : decryptionPending ? (
          <p className="text-paper/35 italic text-[15px]">Decrypting…</p>
        ) : !keyAvailable ? (
          <p className="text-paper/45 text-[15px] italic max-w-prose leading-relaxed">
            Encrypted on another device. Import the family key from a member who has it to read.
          </p>
        ) : (
          <p className="text-paper/45 text-[15px] italic max-w-prose leading-relaxed">
            Body could not be decrypted with the current key.
          </p>
        )
      ) : null}

      {entry.voice_recording_id ? (
        <p className="text-paper/55 text-sm mt-4">Voice attached</p>
      ) : null}

      {entry.memory_id ? (
        <p className="text-paper/55 text-sm mt-4">Photo attached</p>
      ) : null}

      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-2 mt-6" aria-label="Tagged people, places, topics">
          {tags.map((tag, i) => (
            <li
              key={`${tag.type}-${tag.label}-${i}`}
              className="text-xs text-paper/45 border-b border-rule"
            >
              {tag.label}
            </li>
          ))}
        </ul>
      ) : null}
    </motion.article>
  );
}
